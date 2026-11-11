import { getDatabase } from './database';
import { networkMonitor } from './networkMonitor';
import { api } from '../api';
import { offlineStorageService } from './offlineStorageService';

class SyncManager {
  constructor() {
    this.isSyncing = false;
    this.unsubscribeNetwork = null;
  }

  /**
   * Inicializa la escucha de cambios de red para disparar sincronización automática
   */
  init() {
    if (this.unsubscribeNetwork) return;

    this.unsubscribeNetwork = networkMonitor.subscribe((state) => {
      if (state.isOnline) {
        console.log('[SyncManager] Conexión recuperada. Procesando cola de sincronización...');
        this.processQueue().catch((err) => {
          console.warn('[SyncManager] Error procesando cola en reconexión:', err);
        });
      }
    });
  }

  /**
   * Encola una operación en SQLite para sincronización posterior
   */
  async enqueueOperation({
    module,
    endpoint,
    httpMethod = 'POST',
    payload = {},
    isCritical = false
  }) {
    const db = await getDatabase();
    const id = `op_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const now = Date.now();

    await db.runAsync(`
      INSERT INTO sync_queue 
      (id, module, endpoint, http_method, payload, created_at, retry_count, is_critical, status, last_error)
      VALUES (?, ?, ?, ?, ?, ?, 0, ?, 'pending', NULL);
    `, [
      id,
      module,
      endpoint,
      httpMethod.toUpperCase(),
      JSON.stringify(payload),
      now,
      isCritical ? 1 : 0
    ]);

    console.log(`[SyncManager] Operación encolada (${module}):`, id);

    // Si ya estamos online, intentar procesar inmediatamente
    if (networkMonitor.isOnline()) {
      this.processQueue().catch(() => {});
    }

    return id;
  }

  /**
   * Procesa todas las operaciones pendientes de la cola de manera secuencial e idempotente
   */
  async processQueue() {
    if (this.isSyncing) return { status: 'already_syncing' };
    if (!networkMonitor.isOnline()) return { status: 'offline' };

    this.isSyncing = true;
    const db = await getDatabase();

    try {
      const pendingOps = await db.getAllAsync(`
        SELECT id, module, endpoint, http_method, payload, retry_count, is_critical 
        FROM sync_queue 
        WHERE status IN ('pending', 'pending_retry')
        ORDER BY is_critical DESC, created_at ASC;
      `);

      if (!pendingOps || pendingOps.length === 0) {
        this.isSyncing = false;
        return { status: 'empty' };
      }

      console.log(`[SyncManager] Procesando ${pendingOps.length} operaciones pendientes...`);

      for (const op of pendingOps) {
        // Verificar si la red sigue arriba antes de cada llamada
        if (!networkMonitor.isOnline()) {
          console.log('[SyncManager] Conexión interrumpida durante el vaciado de cola.');
          break;
        }

        let parsedPayload = {};
        try {
          parsedPayload = JSON.parse(op.payload);
        } catch {
          parsedPayload = {};
        }

        try {
          let serverResponse = null;
          const userToken = parsedPayload.token || null;

          // Despacho según el módulo de la operación
          switch (op.module) {
            case 'emergency': {
              // CANDADO DE IDEMPOTENCIA: Verificar si la emergencia ya fue sincronizada en un intento anterior
              if (parsedPayload.local_id) {
                const existing = await db.getFirstAsync(
                  `SELECT is_synced, server_id FROM local_emergencies WHERE id = ?;`,
                  [parsedPayload.local_id]
                );
                if (existing && existing.is_synced === 1 && existing.server_id) {
                  console.log(`[SyncManager] Emergencia ${parsedPayload.local_id} ya fue sincronizada previamente (server_id: ${existing.server_id}). Omitiendo duplicado.`);
                  await db.runAsync(`DELETE FROM sync_queue WHERE id = ?;`, [op.id]);
                  continue;
                }
              }

              serverResponse = await api.reportEmergency(parsedPayload, userToken);
              if (parsedPayload.local_id && serverResponse) {
                await offlineStorageService.markEmergencySynced(parsedPayload.local_id, {
                  server_id: serverResponse?.id || serverResponse?.emergency_id,
                  conversation_id: serverResponse?.conversation_id
                });
              }
              break;
            }

            case 'service': {
              serverResponse = await api.createService(parsedPayload, userToken);
              break;
            }

            case 'product': {
              serverResponse = await api.createProduct(parsedPayload, userToken);
              break;
            }

            case 'solidarity': {
              serverResponse = await api.createSolidarityPost(parsedPayload, userToken);
              break;
            }

            case 'chat_message': {
              const textMsg = parsedPayload.message || parsedPayload.text || '';
              if (parsedPayload.conversation_id && textMsg) {
                serverResponse = await api.sendChatMessage(
                  parsedPayload.conversation_id,
                  textMsg,
                  userToken
                );
              }
              break;
            }

            default: {
              // Llamada genérica REST
              const base = api.API_BASE_URL || 'http://192.168.0.17:8000/api/v1';
              const url = `${base}${op.endpoint.startsWith('/') ? '' : '/'}${op.endpoint}`;
              const headers = { 'Content-Type': 'application/json' };
              if (userToken) headers['Authorization'] = `Bearer ${userToken}`;
              const res = await fetch(url, {
                method: op.http_method,
                headers,
                body: op.http_method !== 'GET' ? op.payload : undefined
              });
              if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
              serverResponse = await res.json().catch(() => ({}));
            }
          }

          // Operación completada exitosamente: eliminar de la cola
          await db.runAsync(`DELETE FROM sync_queue WHERE id = ?;`, [op.id]);
          console.log(`[SyncManager] Operación ${op.id} (${op.module}) sincronizada con éxito.`);

        } catch (opErr) {
          console.warn(`[SyncManager] Fallo al procesar operación ${op.id}:`, opErr.message);

          const newRetryCount = op.retry_count + 1;
          // REGLA CRÍTICA: Las operaciones críticas (ej. Emergencias SOS) NUNCA se descartan
          const shouldKeep = op.is_critical === 1 || newRetryCount < 10;
          const newStatus = shouldKeep ? 'pending_retry' : 'failed';

          await db.runAsync(`
            UPDATE sync_queue 
            SET retry_count = ?, last_error = ?, status = ?
            WHERE id = ?;
          `, [newRetryCount, opErr.message || 'Error de sincronización', newStatus, op.id]);

          // Si es un error de conectividad global, pausar el ciclo
          if (opErr.message && (opErr.message.includes('Network') || opErr.message.includes('Failed to fetch'))) {
            break;
          }
        }
      }

      return { status: 'completed' };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Retorna estadísticas del estado de la cola
   */
  async getQueueStatus() {
    const db = await getDatabase();
    const rows = await db.getAllAsync(`
      SELECT status, count(*) as count, sum(is_critical) as critical_count
      FROM sync_queue
      GROUP BY status;
    `);
    return rows;
  }
}

export const syncManager = new SyncManager();

