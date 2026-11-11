// ==========================================================
// VECIRED IA — TEST DE HUMO Y VERIFICACIÓN OFFLINE EN EXPO GO
// ==========================================================
import * as SQLite from 'expo-sqlite';
import NetInfo from '@react-native-community/netinfo';
import * as SMS from 'expo-sms';

export async function runOfflineSmokeTest() {
  const results = {
    sqlite: { success: false, details: null },
    persistence: { success: false, details: null },
    netinfo: { success: false, details: null },
    sms: { success: false, details: null },
    allPassed: false
  };

  console.log('[SmokeTest] Iniciando pruebas de humo Offline en Expo Go...');

  // -------------------------------------------------------------
  // PRUEBA 1 & 2: Apertura de SQLite y Persistencia
  // -------------------------------------------------------------
  try {
    const db = await SQLite.openDatabaseAsync('vecired_smoke_test.db');
    results.sqlite = {
      success: true,
      details: 'Base de datos vecired_smoke_test.db abierta correctamente con openDatabaseAsync.'
    };

    // Crear tabla de prueba de persistencia
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS smoke_test_persistence (
        id TEXT PRIMARY KEY NOT NULL,
        test_key TEXT NOT NULL,
        test_value TEXT NOT NULL,
        timestamp INTEGER NOT NULL
      );
    `);

    const now = Date.now();
    const testRecordId = 'persist-check-1';
    const testValue = `test-run-at-${now}`;

    // Insertar registro
    await db.runAsync(
      `INSERT OR REPLACE INTO smoke_test_persistence (id, test_key, test_value, timestamp) 
       VALUES (?, ?, ?, ?);`,
      [testRecordId, 'last_smoke_test', testValue, now]
    );

    // Leer el registro de vuelta para certificar persistencia
    const row = await db.getFirstAsync(
      `SELECT id, test_key, test_value, timestamp FROM smoke_test_persistence WHERE id = ?;`,
      [testRecordId]
    );

    if (row && row.test_value === testValue) {
      results.persistence = {
        success: true,
        details: `Persistencia certificada. Registro leído con éxito: id=${row.id}, value=${row.test_value}, timestamp=${row.timestamp}`
      };
    } else {
      results.persistence = {
        success: false,
        details: 'El registro leído no coincidió con el valor guardado en SQLite.'
      };
    }
  } catch (err) {
    console.error('[SmokeTest] Error en SQLite/Persistencia:', err);
    results.sqlite = { success: false, details: err.message };
    results.persistence = { success: false, details: err.message };
  }

  // -------------------------------------------------------------
  // PRUEBA 3: Detección de Conexión con NetInfo
  // -------------------------------------------------------------
  try {
    const state = await NetInfo.fetch();
    results.netinfo = {
      success: true,
      details: {
        isConnected: Boolean(state.isConnected),
        isInternetReachable: state.isInternetReachable,
        type: state.type,
        isWifi: state.type === 'wifi',
        isCellular: state.type === 'cellular'
      }
    };
    console.log('[SmokeTest] NetInfo respondió:', state.type, 'Conectado:', state.isConnected);
  } catch (err) {
    console.error('[SmokeTest] Error en NetInfo:', err);
    results.netinfo = { success: false, details: err.message };
  }

  // -------------------------------------------------------------
  // PRUEBA 4: Disponibilidad de expo-sms en Expo Go
  // -------------------------------------------------------------
  try {
    const isSmsAvailable = await SMS.isAvailableAsync();
    results.sms = {
      success: true,
      details: {
        isAvailable: isSmsAvailable,
        mode: 'SMS Asistido Oficial (expo-sms)',
        message: isSmsAvailable
          ? 'El dispositivo cuenta con aplicación y capacidades para enviar SMS asistido.'
          : 'Capacidades de SMS no detectadas en este entorno (ej: simulador web o emulador sin app SMS).'
      }
    };
    console.log('[SmokeTest] expo-sms isAvailableAsync:', isSmsAvailable);
  } catch (err) {
    console.error('[SmokeTest] Error en expo-sms:', err);
    results.sms = { success: false, details: err.message };
  }

  results.allPassed =
    results.sqlite.success &&
    results.persistence.success &&
    results.netinfo.success &&
    results.sms.success;

  console.log('[SmokeTest] Resultado final de pruebas:', results);
  return results;
}

