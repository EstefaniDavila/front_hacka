import { initDatabase, getDatabase } from './database';
import { networkMonitor } from './networkMonitor';
import { smsAssistedService } from './smsAssistedService';
import { offlineStorageService } from './offlineStorageService';
import { syncManager } from './syncManager';
import { runOfflineSmokeTest } from './offlineSmokeTest';

/**
 * Inicializa todo el subsistema offline de VeciRed:
 * 1. Base de datos SQLite y esquema de tablas
 * 2. Monitoreo de conectividad en tiempo real y sondeo de backend
 * 3. Escucha de sincronización automática en reconexión
 */
export async function initOfflineSubsystem() {
  try {
    console.log('[VeciRed Offline] Inicializando subsistema offline en Expo Go...');
    await initDatabase();
    networkMonitor.start();
    syncManager.init();
    console.log('[VeciRed Offline] Subsistema offline inicializado correctamente.');
    return { success: true };
  } catch (err) {
    console.error('[VeciRed Offline] Error inicializando subsistema offline:', err);
    return { success: false, error: err.message };
  }
}

export {
  initDatabase,
  getDatabase,
  networkMonitor,
  smsAssistedService,
  offlineStorageService,
  syncManager,
  runOfflineSmokeTest
};

