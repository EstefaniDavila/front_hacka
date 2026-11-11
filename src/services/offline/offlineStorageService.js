import { getDatabase } from './database';

export const offlineStorageService = {
  // ==========================================
  // SERVICIOS
  // ==========================================
  async saveServices(services = []) {
    if (!services || services.length === 0) return;
    const db = await getDatabase();
    const now = Date.now();

    for (const s of services) {
      if (!s || !s.id) continue;
      await db.runAsync(`
        INSERT OR REPLACE INTO offline_services 
        (id, title, category, description, price, tags, owner_id, owner_name, owner_phone, latitude, longitude, address, image_url, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `, [
        String(s.id),
        s.title || s.name || 'Servicio comunitario',
        s.category || 'General',
        s.description || '',
        Number(s.price || 0),
        Array.isArray(s.tags) ? s.tags.join(',') : (s.tags || ''),
        s.owner_id || s.user_id || '',
        s.owner_name || s.user_name || 'Vecino',
        s.owner_phone || s.phone || '',
        s.latitude ? Number(s.latitude) : null,
        s.longitude ? Number(s.longitude) : null,
        s.address || '',
        s.image_url || '',
        s.created_at || new Date().toISOString(),
        now
      ]);
    }
  },

  async getCachedServices() {
    const db = await getDatabase();
    const rows = await db.getAllAsync(`
      SELECT * FROM offline_services ORDER BY updated_at DESC;
    `);
    return rows.map(r => ({
      ...r,
      tags: r.tags ? r.tags.split(',') : []
    }));
  },

  // ==========================================
  // PRODUCTOS
  // ==========================================
  async saveProducts(products = []) {
    if (!products || products.length === 0) return;
    const db = await getDatabase();
    const now = Date.now();

    for (const p of products) {
      if (!p || !p.id) continue;
      await db.runAsync(`
        INSERT OR REPLACE INTO offline_products 
        (id, title, category, description, price, stock, owner_id, owner_name, owner_phone, latitude, longitude, address, image_url, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `, [
        String(p.id),
        p.title || p.name || 'Producto vecinal',
        p.category || 'General',
        p.description || '',
        Number(p.price || 0),
        Number(p.stock || 1),
        p.owner_id || p.user_id || '',
        p.owner_name || p.user_name || 'Vecino',
        p.owner_phone || p.phone || '',
        p.latitude ? Number(p.latitude) : null,
        p.longitude ? Number(p.longitude) : null,
        p.address || '',
        p.image_url || '',
        p.created_at || new Date().toISOString(),
        now
      ]);
    }
  },

  async getCachedProducts() {
    const db = await getDatabase();
    return await db.getAllAsync(`SELECT * FROM offline_products ORDER BY updated_at DESC;`);
  },

  // ==========================================
  // AYUDA SOLIDARIA
  // ==========================================
  async saveSolidarityPosts(posts = []) {
    if (!posts || posts.length === 0) return;
    const db = await getDatabase();
    const now = Date.now();

    for (const post of posts) {
      if (!post || !post.id) continue;
      await db.runAsync(`
        INSERT OR REPLACE INTO offline_solidarity 
        (id, title, category, description, urgency, status, owner_id, owner_name, owner_phone, latitude, longitude, address, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `, [
        String(post.id),
        post.title || 'Solicitud de apoyo',
        post.category || 'Solidaridad',
        post.description || '',
        post.urgency || 'media',
        post.status || 'activa',
        post.owner_id || post.user_id || '',
        post.owner_name || post.user_name || 'Vecino',
        post.owner_phone || post.phone || '',
        post.latitude ? Number(post.latitude) : null,
        post.longitude ? Number(post.longitude) : null,
        post.address || '',
        post.created_at || new Date().toISOString(),
        now
      ]);
    }
  },

  async getCachedSolidarityPosts() {
    const db = await getDatabase();
    return await db.getAllAsync(`SELECT * FROM offline_solidarity ORDER BY updated_at DESC;`);
  },

  // ==========================================
  // EMERGENCIAS
  // ==========================================
  async saveLocalEmergency(emergency) {
    const db = await getDatabase();
    const now = Date.now();
    const id = emergency.id || `local_emg_${now}_${Math.random().toString(36).substr(2, 6)}`;

    await db.runAsync(`
      INSERT OR REPLACE INTO local_emergencies 
      (id, title, emergency_type, description, severity, status, latitude, longitude, accuracy_m, coords_origin, location_text, occurred_at, is_synced, server_id, server_conversation_id, sms_status, sms_dispatched_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `, [
      id,
      emergency.title || 'Alerta Comunitaria',
      emergency.emergency_type || emergency.type || 'medica',
      emergency.description || '',
      emergency.severity || 'alta',
      emergency.status || 'activa',
      emergency.latitude ? Number(emergency.latitude) : null,
      emergency.longitude ? Number(emergency.longitude) : null,
      emergency.accuracy_m ? Number(emergency.accuracy_m) : null,
      emergency.coords_origin || 'gps',
      emergency.location_text || 'Arequipa, Perú',
      emergency.occurred_at || now,
      emergency.is_synced ? 1 : 0,
      emergency.server_id || null,
      emergency.server_conversation_id || null,
      emergency.sms_status || 'none',
      emergency.sms_dispatched_at || null,
      emergency.created_at || now
    ]);

    return { ...emergency, id };
  },

  async getLocalEmergencies() {
    const db = await getDatabase();
    return await db.getAllAsync(`SELECT * FROM local_emergencies ORDER BY created_at DESC;`);
  },

  async markEmergencySynced(localId, serverData = {}) {
    const db = await getDatabase();
    await db.runAsync(`
      UPDATE local_emergencies 
      SET is_synced = 1, server_id = ?, server_conversation_id = ?
      WHERE id = ?;
    `, [
      serverData.server_id || serverData.id || null,
      serverData.conversation_id || null,
      localId
    ]);
  },

  // ==========================================
  // CONTACTOS DE EMERGENCIA LOCALES
  // ==========================================
  async saveEmergencyContacts(contacts = []) {
    if (!contacts || contacts.length === 0) return;
    const db = await getDatabase();
    const now = Date.now();

    for (const c of contacts) {
      if (!c || !c.phone) continue;
      const contactId = c.id || `contact_${c.phone.replace(/\D/g, '')}`;
      await db.runAsync(`
        INSERT OR REPLACE INTO emergency_contacts 
        (id, name, phone, role, latitude, longitude, distance_tier, has_sms_consent, last_synced_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
      `, [
        contactId,
        c.name || 'Contacto de Emergencia',
        c.phone.trim(),
        c.role || 'brigadista',
        c.latitude ? Number(c.latitude) : null,
        c.longitude ? Number(c.longitude) : null,
        Number(c.distance_tier || 1),
        c.has_sms_consent !== false ? 1 : 0,
        now
      ]);
    }
  },

  async getEmergencyContacts() {
    const db = await getDatabase();
    return await db.getAllAsync(`
      SELECT * FROM emergency_contacts WHERE has_sms_consent = 1 ORDER BY distance_tier ASC, name ASC;
    `);
  }
};

