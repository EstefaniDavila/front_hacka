import * as SQLite from 'expo-sqlite';

let dbInstance = null;

export const DB_NAME = 'vecired_offline.db';

/**
 * Obtiene la instancia singleton de la base de datos SQLite local
 */
export async function getDatabase() {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync(DB_NAME);
  }
  return dbInstance;
}

/**
 * Inicializa el esquema completo de tablas SQLite para VeciRed Offline
 */
export async function initDatabase() {
  const db = await getDatabase();

  // Habilitar Write-Ahead Logging (WAL) para concurrencia óptima y atomicidad
  await db.execAsync(`PRAGMA journal_mode = WAL;`);

  // 1. Cola de operaciones pendientes de sincronización (sync_queue)
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY NOT NULL,
      module TEXT NOT NULL,
      endpoint TEXT NOT NULL,
      http_method TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      retry_count INTEGER NOT NULL DEFAULT 0,
      is_critical INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending',
      last_error TEXT
    );
  `);

  // 2. Emergencias locales (creadas offline o precacheadas del servidor)
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS local_emergencies (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      emergency_type TEXT NOT NULL,
      description TEXT,
      severity TEXT NOT NULL DEFAULT 'alta',
      status TEXT NOT NULL DEFAULT 'activa',
      latitude REAL,
      longitude REAL,
      accuracy_m REAL,
      coords_origin TEXT DEFAULT 'gps',
      location_text TEXT,
      occurred_at INTEGER NOT NULL,
      is_synced INTEGER NOT NULL DEFAULT 0,
      server_id TEXT,
      server_conversation_id TEXT,
      sms_status TEXT DEFAULT 'none',
      sms_dispatched_at INTEGER,
      created_at INTEGER NOT NULL
    );
  `);

  // 3. Catálogo descargado de Servicios
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS offline_services (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      category TEXT,
      description TEXT,
      price REAL DEFAULT 0,
      tags TEXT,
      owner_id TEXT,
      owner_name TEXT,
      owner_phone TEXT,
      latitude REAL,
      longitude REAL,
      address TEXT,
      image_url TEXT,
      created_at TEXT,
      updated_at INTEGER NOT NULL
    );
  `);

  // 4. Catálogo descargado de Productos
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS offline_products (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      category TEXT,
      description TEXT,
      price REAL DEFAULT 0,
      stock INTEGER DEFAULT 1,
      owner_id TEXT,
      owner_name TEXT,
      owner_phone TEXT,
      latitude REAL,
      longitude REAL,
      address TEXT,
      image_url TEXT,
      created_at TEXT,
      updated_at INTEGER NOT NULL
    );
  `);

  // 5. Publicaciones de Ayuda Solidaria y Donaciones
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS offline_solidarity (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      category TEXT,
      description TEXT,
      urgency TEXT DEFAULT 'media',
      status TEXT DEFAULT 'activa',
      owner_id TEXT,
      owner_name TEXT,
      owner_phone TEXT,
      latitude REAL,
      longitude REAL,
      address TEXT,
      created_at TEXT,
      updated_at INTEGER NOT NULL
    );
  `);

  // 6. Contactos de emergencia locales autorizados y precacheados
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS emergency_contacts (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'brigadista',
      latitude REAL,
      longitude REAL,
      distance_tier INTEGER DEFAULT 1,
      has_sms_consent INTEGER DEFAULT 1,
      last_synced_at INTEGER NOT NULL
    );
  `);

  // 7. Mensajes de chat descargados y pendientes de envío
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS offline_messages (
      id TEXT PRIMARY KEY NOT NULL,
      conversation_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      message_text TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      is_synced INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'delivered_local'
    );
  `);

  return db;
}

