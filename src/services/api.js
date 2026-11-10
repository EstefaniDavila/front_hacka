// ==========================================================
// VECIRED IA - CLIENTE HTTP PARA API FASTAPI V1 UNIFICADO
// ==========================================================
import { Platform } from 'react-native';

// export const LOCAL_PC_IP = '192.168.1.33';
export const LOCAL_PC_IP = '192.168.0.175';

export const API_BASE_URL = Platform.OS === 'web'
  ? ((typeof import.meta !== 'undefined' && import.meta.env?.EXPO_PUBLIC_API_URL) ||
    (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL) ||
    (typeof window !== 'undefined' && window.location?.hostname && window.location.hostname !== 'localhost'
      ? `http://${window.location.hostname}:8000/api/v1`
      : 'http://' + LOCAL_PC_IP + ':8000/api/v1'))
  : 'http://' + LOCAL_PC_IP + ':8000/api/v1';

let isBackendConnected = false;

// Generador y validador de UUID v4 conforme a RFC 4122
let currentTestUserId = null;

export function isValidUUID(uuidStr) {
  if (typeof uuidStr !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuidStr.trim()) ||
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuidStr.trim());
}

export function getOrCreateTestUserId() {
  if (currentTestUserId && isValidUUID(currentTestUserId)) {
    return currentTestUserId;
  }
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    currentTestUserId = crypto.randomUUID();
  } else {
    currentTestUserId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
  return currentTestUserId;
}

export function setTestUserId(id) {
  if (id && isValidUUID(String(id))) {
    currentTestUserId = String(id).trim();
  }
}

function createReactNativeFilePart(file, defaultName) {
  if (!file) return null;
  const uri = typeof file === 'string' ? file : file.uri;
  if (!uri) return null;

  let name = file.fileName || file.name;
  if (!name && typeof uri === 'string') {
    const lastSlash = uri.lastIndexOf('/');
    if (lastSlash !== -1) {
      const part = uri.substring(lastSlash + 1);
      if (part && part.includes('.')) {
        name = part;
      }
    }
  }
  if (!name) name = defaultName;

  let type = file.mimeType;
  if (!type || typeof type !== 'string' || !type.includes('/')) {
    type = file.type;
  }
  if (!type || typeof type !== 'string' || !type.includes('/')) {
    const lower = name.toLowerCase();
    type = lower.endsWith('.png') ? 'image/png' : 'image/jpeg';
  }

  return {
    uri,
    name,
    type
  };
}

function sendFormDataWithXHR(url, formData, headers = {}, token = null, timeoutMs = 45000) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.timeout = timeoutMs;

    // Consolidar cabeceras en un solo objeto para prevenir duplicación accidental de setRequestHeader
    const finalHeaders = {
      Accept: 'application/json'
    };

    if (token) {
      finalHeaders['Authorization'] = `Bearer ${token}`;
    } else {
      const testUid = getOrCreateTestUserId();
      finalHeaders['X-Test-User-Id'] = testUid;
      finalHeaders['X-User-Id'] = testUid;
    }

    // Incorporar cualquier cabecera adicional provista en el argumento headers (omitiendo Content-Type)
    for (const [key, val] of Object.entries(headers)) {
      const lower = key.toLowerCase();
      if (lower === 'content-type') continue; // Dejar que el runtime configure el multipart boundary
      if (lower === 'x-test-user-id' || lower === 'x-user-id') {
        if (val && isValidUUID(String(val))) {
          finalHeaders['X-Test-User-Id'] = String(val).trim();
          finalHeaders['X-User-Id'] = String(val).trim();
        }
      } else if (val) {
        finalHeaders[key] = val;
      }
    }

    // Asignar cada cabecera exactamente UNA sola vez para evitar concatenación por comas
    for (const [key, val] of Object.entries(finalHeaders)) {
      if (val) {
        xhr.setRequestHeader(key, String(val).trim());
      }
    }

    xhr.onload = () => {
      isBackendConnected = true;
      try {
        const contentType = xhr.getResponseHeader('content-type') || '';
        const isJson = contentType.includes('application/json');
        const data = isJson ? JSON.parse(xhr.responseText) : xhr.responseText;
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(data);
        } else {
          const errMsg = data?.message || data?.detail || `Error del servidor (${xhr.status})`;
          const err = new Error(errMsg);
          err.status = xhr.status;
          err.data = data;
          reject(err);
        }
      } catch (parseErr) {
        reject(new Error(`Respuesta inválida (${xhr.status}): ${xhr.responseText || parseErr.message}`));
      }
    };

    xhr.onerror = () => {
      isBackendConnected = false;
      reject(new Error('No fue posible contactar al servidor de VeciRed. Verifica tu conexión.'));
    };

    xhr.ontimeout = () => {
      reject(new Error('Tiempo de espera agotado al procesar las fotografías del DNI.'));
    };

    // Envío directo a través del canal nativo de React Native (OkHttp en Android)
    xhr.send(formData);
  });
}

async function request(endpoint, options = {}, token = null) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    Accept: 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    delete headers['X-Test-User-Id'];
    delete headers['X-User-Id'];
  } else {
    const testUid = getOrCreateTestUserId();
    if (!headers['X-Test-User-Id'] || !isValidUUID(headers['X-Test-User-Id'])) {
      headers['X-Test-User-Id'] = testUid;
    }
    headers['X-User-Id'] = headers['X-Test-User-Id'];
  }

  // Detección robusta de FormData en React Native Android / iOS / Web
  const isFormData =
    Boolean(options.body) &&
    (options.body instanceof FormData ||
      typeof options.body?.getParts === 'function' ||
      Array.isArray(options.body?._parts) ||
      (typeof options.body === 'object' && Object.prototype.toString.call(options.body) === '[object FormData]') ||
      (typeof options.body?.append === 'function' && typeof options.body?.delete === 'function'));

  // Para envíos multipart de FormData en React Native, utilizar directamente XMLHttpRequest.
  // Esto evita que expo/fetch (WinterCG) intente serializar erróneamente los objetos { uri, name, type }
  // y previene el error "Unsupported FormDataPart implementation".
  if (isFormData) {
    const timeoutMs = 45000;
    return sendFormDataWithXHR(url, options.body, headers, token, timeoutMs);
  }

  if (!headers['Content-Type'] && !headers['content-type']) {
    headers['Content-Type'] = 'application/json';
  }

  const timeoutMs = 12000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    isBackendConnected = true;

    const isJson = response.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const errorMessage = data?.message || data?.detail || `Error del servidor (${response.status})`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError' || (error.name === 'TypeError' && error.message.includes('fetch'))) {
      isBackendConnected = false;
      console.warn(`[VeciRed API] No se pudo conectar con el backend en ${url}.`);
      throw new Error('No fue posible contactar al servidor de VeciRed. Verifica tu conexión.');
    }
    throw error;
  }
}

export const api = {
  async checkHealth() {
    try {
      const data = await request('/health');
      isBackendConnected = true;
      return { connected: true, data };
    } catch (err) {
      isBackendConnected = false;
      return { connected: false, error: err.message };
    }
  },

  isBackendOnline() {
    return isBackendConnected;
  },

  async getMyProfile(token) {
    return request('/users/me', { method: 'GET' }, token);
  },

  async updateMyProfile(updateData, token) {
    return request(
      '/users/me',
      {
        method: 'PUT',
        body: JSON.stringify(updateData)
      },
      token
    );
  },

  // Subir DNI y Selfie para verificación biométrica con IA (compatible con React Native Android y Web)
  async verifyIdentity({ dniFrontFile, dniBackFile, selfieFile, fullName, userId }, token = null) {
    const formData = new FormData();

    const frontPart = createReactNativeFilePart(dniFrontFile, 'dni_front.jpg');
    if (frontPart) {
      formData.append('dni_front', frontPart);
    }

    if (dniBackFile) {
      const backPart = createReactNativeFilePart(dniBackFile, 'dni_back.jpg');
      if (backPart) {
        formData.append('dni_back', backPart);
      }
    }

    const selfiePart = createReactNativeFilePart(selfieFile, 'selfie.jpg');
    if (selfiePart) {
      formData.append('selfie', selfiePart);
    }

    if (fullName) {
      formData.append('full_name', String(fullName));
    }

    const targetUserId = userId && isValidUUID(String(userId)) ? String(userId).trim() : getOrCreateTestUserId();
    if (targetUserId) {
      formData.append('user_id', targetUserId);
    }

    const extraHeaders = {};
    if (!token && targetUserId) {
      extraHeaders['X-Test-User-Id'] = targetUserId;
      extraHeaders['X-User-Id'] = targetUserId;
    }

    return request(
      '/users/verify-identity',
      {
        method: 'POST',
        headers: extraHeaders,
        body: formData
      },
      token
    );
  },

  async extractDni({ dniFrontFile, dniBackFile, userId }, token = null) {
    const formData = new FormData();

    const frontPart = createReactNativeFilePart(dniFrontFile, 'dni_front.jpg');
    if (!frontPart) {
      throw new Error('La fotografía del anverso del DNI es obligatoria.');
    }
    formData.append('dni_front', frontPart);

    if (dniBackFile) {
      const backPart = createReactNativeFilePart(dniBackFile, 'dni_back.jpg');
      if (backPart) {
        formData.append('dni_back', backPart);
      }
    }

    const targetUserId = userId && isValidUUID(String(userId)) ? String(userId).trim() : getOrCreateTestUserId();
    const extraHeaders = {};
    if (!token && targetUserId) {
      extraHeaders['X-Test-User-Id'] = targetUserId;
      extraHeaders['X-User-Id'] = targetUserId;
    }

    return request(
      '/users/extract-dni',
      {
        method: 'POST',
        headers: extraHeaders,
        body: formData
      },
      token
    );
  },

  async startDniVerificationSession({ dniFrontFile, dniBackFile }) {
    const formData = new FormData();

    const frontPart = createReactNativeFilePart(dniFrontFile, 'dni_front.jpg');
    if (!frontPart) {
      throw new Error('La fotografía del anverso del DNI es obligatoria.');
    }
    formData.append('dni_front', frontPart);

    if (dniBackFile) {
      const backPart = createReactNativeFilePart(dniBackFile, 'dni_back.jpg');
      if (backPart) {
        formData.append('dni_back', backPart);
      }
    }

    return request(
      '/users/verification-session/start-dni',
      {
        method: 'POST',
        body: formData
      }
    );
  },

  // Paso 2: Verificación Facial contra el DNI con InsightFace en backend
  async verifyFaceInSession({ verificationToken, selfieFile }) {
    if (!verificationToken) {
      throw new Error('Token de verificación requerido.');
    }
    if (!selfieFile) {
      throw new Error('Fotografía selfie requerida.');
    }

    const formData = new FormData();
    formData.append('verification_token', String(verificationToken));

    const selfiePart = createReactNativeFilePart(selfieFile, 'selfie.jpg');
    if (!selfiePart) {
      throw new Error('Archivo de imagen selfie inválido.');
    }
    formData.append('selfie', selfiePart);

    return request(
      '/users/verification-session/verify-face',
      {
        method: 'POST',
        body: formData
      }
    );
  },

  // Paso 6: Registro Definitivo y persistencia atómica en base de datos
  async completeOnboardingRegistration(registrationData, token) {
    if (!token) {
      throw new Error('Token de autenticación de Supabase requerido para el registro definitivo.');
    }

    return request(
      '/users/complete-onboarding-registration',
      {
        method: 'POST',
        body: JSON.stringify(registrationData)
      },
      token
    );
  },

  async getVerificationStatus(token) {
    return request('/users/verification-status', { method: 'GET' }, token);
  },

  async getServiceCategories() {
    try {
      return await request('/services/categories', { method: 'GET' });
    } catch {
      return [];
    }
  },

  async getServices({ q = '', category_id = null, community_id = null, sort_by = 'newest', page = 1, limit = 30 } = {}) {
    const params = new URLSearchParams();
    if (q) params.append('q', q);
    if (category_id && category_id !== 'all') params.append('category_id', category_id);
    if (community_id) params.append('community_id', community_id);
    if (sort_by) params.append('sort_by', sort_by);
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);

    const queryString = params.toString();
    const endpoint = `/services${queryString ? `?${queryString}` : ''}`;
    try {
      return await request(endpoint, { method: 'GET' });
    } catch {
      return { items: [], meta: { total: 0 } };
    }
  },

  async getServiceDetail(serviceId) {
    return request(`/services/${serviceId}`, { method: 'GET' });
  },

  async getMyServices({ page = 1, limit = 20 } = {}, token) {
    return request(`/services/my?page=${page}&limit=${limit}`, { method: 'GET' }, token);
  },

  async getUserServices(userId, { page = 1, limit = 20 } = {}) {
    return request(`/services/user/${userId}?page=${page}&limit=${limit}`, { method: 'GET' });
  },

  async createService(serviceData, token) {
    return request(
      '/services',
      {
        method: 'POST',
        body: JSON.stringify(serviceData)
      },
      token
    );
  },

  async updateService(serviceId, serviceData, token) {
    return request(
      `/services/${serviceId}`,
      {
        method: 'PUT',
        body: JSON.stringify(serviceData)
      },
      token
    );
  },

  async updateServiceStatus(serviceId, status, token) {
    return request(
      `/services/${serviceId}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status })
      },
      token
    );
  },

  async deleteService(serviceId, token) {
    return request(`/services/${serviceId}`, { method: 'DELETE' }, token);
  },

  async addServiceReview(serviceId, { rating, comment }, token) {
    return request(
      `/services/${serviceId}/reviews`,
      {
        method: 'POST',
        body: JSON.stringify({ rating, comment })
      },
      token
    );
  },

  async getServiceReviews(serviceId, { page = 1, limit = 20 } = {}) {
    return request(`/services/${serviceId}/reviews?page=${page}&limit=${limit}`, { method: 'GET' });
  },

  // ==========================================================
  // MÓDULO DE PRODUCTOS
  // ==========================================================
  async getProducts(params = {}) {
    try {
      const qp = new URLSearchParams();
      if (params.q) qp.append('q', params.q);
      if (params.category_id) qp.append('category_id', params.category_id);
      const str = qp.toString() ? `?${qp.toString()}` : '';
      const data = await request(`/products${str}`);
      if (data && Array.isArray(data.items)) return data.items;
      if (Array.isArray(data)) return data;
      return [];
    } catch {
      return [];
    }
  },

  async getProductCategories() {
    try {
      const data = await request('/products/categories');
      if (Array.isArray(data) && data.length > 0) return data;
      return [];
    } catch {
      return [];
    }
  },

  async createProduct(productData, token) {
    return request(
      '/products',
      {
        method: 'POST',
        body: JSON.stringify({
          name: productData.name || productData.title,
          description: productData.desc || productData.description || '',
          price: parseFloat(productData.price) || 0,
          unit: productData.unit || 'unidad'
        })
      },
      token
    );
  },

  async deleteProduct(productId, token) {
    return request(`/products/${productId}`, { method: 'DELETE' }, token);
  },

  // ==========================================================
  // MÓDULO DE SOLIDARIDAD
  // ==========================================================
  async getSolidarityPosts(params = {}) {
    try {
      const qp = new URLSearchParams();
      if (params.category) qp.append('category', params.category);
      if (params.post_type) qp.append('post_type', params.post_type);
      const str = qp.toString() ? `?${qp.toString()}` : '';
      const data = await request(`/solidarity/posts${str}`);
      if (data && Array.isArray(data.items)) return data.items;
      if (Array.isArray(data)) return data;
      return [];
    } catch {
      return [];
    }
  },

  async createSolidarityPost(postData, token) {
    return request(
      '/solidarity/posts',
      {
        method: 'POST',
        body: JSON.stringify({
          title: postData.title,
          description: postData.desc || postData.description || '',
          category: postData.category || 'Apoyo temporal',
          post_type: postData.type === 'necesito' ? 'request' : 'offer'
        })
      },
      token
    );
  },

  async respondToSolidarityPost(postId, message = 'Cuento con el apoyo vecinal', token) {
    try {
      return await request(`/solidarity/posts/${postId}/respond`, {
        method: 'POST',
        body: JSON.stringify({ message })
      }, token);
    } catch {
      return null;
    }
  },

  // ==========================================================
  // MÓDULO DE EMERGENCIAS
  // ==========================================================
  async getActiveEmergency() {
    try {
      const data = await request('/emergencies');
      if (data && Array.isArray(data.items) && data.items.length > 0) {
        return data.items[0];
      }
      return null;
    } catch {
      return null;
    }
  },

  async getEmergencies() {
    try {
      const data = await request('/emergencies');
      if (data && Array.isArray(data.items)) return data.items;
      return [];
    } catch {
      return [];
    }
  },

  async getActiveEmergencies(communityId = null, token = null) {
    try {
      const endpoint = communityId ? `/emergencies/active-all?community_id=${communityId}` : '/emergencies/active-all';
      const data = await request(endpoint, { method: 'GET' }, token);
      if (Array.isArray(data)) return data;
      return [];
    } catch {
      return [];
    }
  },

  async deleteEmergency(emergencyId, token) {
    return request(
      `/emergencies/${emergencyId}`,
      { method: 'DELETE' },
      token
    );
  },

  async reportEmergency(emergencyData, token) {
    return request(
      '/emergencies',
      {
        method: 'POST',
        body: JSON.stringify({
          emergency_type: emergencyData.type || emergencyData.emergency_type || 'seguridad',
          title: emergencyData.title,
          description: emergencyData.desc || emergencyData.description || '',
          severity: emergencyData.severity || 'critical',
          image_url: emergencyData.image_url || emergencyData.image || null,
          latitude: emergencyData.latitude || null,
          longitude: emergencyData.longitude || null,
          location: emergencyData.location || null,
          alert_radius_m: emergencyData.alert_radius_m || 500
        })
      },
      token
    );
  },

  async registerEmergencyVolunteer(emergencyId, notes = 'Voy en camino a apoyar', token) {
    return request(
      `/emergencies/${emergencyId}/volunteer`,
      {
        method: 'POST',
        body: JSON.stringify({ notes })
      },
      token
    );
  },

  async getEmergencyVolunteers(emergencyId = null, token = null) {
    try {
      const endpoint = emergencyId ? `/emergencies/volunteers?emergency_id=${emergencyId}` : '/emergencies/volunteers';
      const data = await request(endpoint, { method: 'GET' }, token);
      if (Array.isArray(data)) return data;
      return [];
    } catch {
      return [];
    }
  },

  async getEmergencyCommunityReports(emergencyId) {
    if (!emergencyId) return [];
    try {
      const data = await request(`/emergencies/${emergencyId}/community-reports`);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  async postEmergencyCommunityReport(emergencyId, reportData, token = null) {
    if (!emergencyId) throw new Error('ID de emergencia requerido');
    return request(
      `/emergencies/${emergencyId}/community-reports`,
      {
        method: 'POST',
        body: JSON.stringify(reportData)
      },
      token
    );
  },

  async joinEmergencyBrigade(volunteerData, token = null) {
    return request(
      '/emergencies/volunteers',
      {
        method: 'POST',
        body: JSON.stringify(volunteerData)
      },
      token
    );
  },

  // ==========================================================
  // MÓDULO DE NOTIFICACIONES Y ALERTAS
  // ==========================================================
  async getNotifications(token) {
    try {
      return await request('/notifications', { method: 'GET' }, token);
    } catch {
      return [];
    }
  },

  async getUnreadNotificationsCount(token) {
    try {
      return await request('/notifications/unread-count', { method: 'GET' }, token);
    } catch {
      return { unread_count: 0 };
    }
  },

  async markNotificationAsRead(notificationId, token) {
    try {
      return await request(`/notifications/${notificationId}/read`, { method: 'PATCH' }, token);
    } catch {
      return null;
    }
  },

  // ==========================================================
  // MÓDULO DE CHAT COMUNITARIO
  // ==========================================================
  async getChats(token) {
    try {
      return await request('/chats', { method: 'GET' }, token);
    } catch {
      return [];
    }
  },

  async getChatDetail(conversationId, token) {
    try {
      return await request(`/chats/${conversationId}`, { method: 'GET' }, token);
    } catch {
      return null;
    }
  },

  async getChatMessages(conversationId, token) {
    try {
      return await request(`/chats/${conversationId}/messages`, { method: 'GET' }, token);
    } catch {
      return [];
    }
  },

  async sendChatMessage(conversationId, text, token) {
    try {
      return await request(
        `/chats/${conversationId}/messages`,
        {
          method: 'POST',
          body: JSON.stringify({ text })
        },
        token
      );
    } catch {
      return null;
    }
  },

  async createChat(chatData, token) {
    try {
      return await request(
        '/chats',
        {
          method: 'POST',
          body: JSON.stringify(chatData)
        },
        token
      );
    } catch {
      return null;
    }
  },

  // ==========================================================
  // MOTOR DE BÚSQUEDA INTELIGENTE GEOLOCALIZADA V1
  // ==========================================================
  async searchGlobal({
    q = null,
    latitude = null,
    longitude = null,
    radius_km = null,
    community_id = null,
    sort = 'recommended',
    page = 1,
    page_size = 20
  } = {}) {
    const params = new URLSearchParams();
    if (q && q.trim()) params.append('q', q.trim());
    if (latitude != null) params.append('latitude', String(latitude));
    if (longitude != null) params.append('longitude', String(longitude));
    if (radius_km != null) params.append('radius_km', String(radius_km));
    if (community_id) params.append('community_id', String(community_id));
    if (sort) params.append('sort', sort);
    if (page) params.append('page', String(page));
    if (page_size) params.append('page_size', String(page_size));

    const qs = params.toString();
    return request(`/search${qs ? `?${qs}` : ''}`, { method: 'GET' });
  },

  async searchServices({
    q = null,
    latitude = null,
    longitude = null,
    radius_km = null,
    category_id = null,
    community_id = null,
    sort = 'recommended',
    page = 1,
    page_size = 20
  } = {}) {
    const params = new URLSearchParams();
    if (q && q.trim()) params.append('q', q.trim());
    if (latitude != null) params.append('latitude', String(latitude));
    if (longitude != null) params.append('longitude', String(longitude));
    if (radius_km != null) params.append('radius_km', String(radius_km));
    if (category_id && category_id !== 'all') params.append('category_id', String(category_id));
    if (community_id) params.append('community_id', String(community_id));
    if (sort) params.append('sort', sort);
    if (page) params.append('page', String(page));
    if (page_size) params.append('page_size', String(page_size));

    const qs = params.toString();
    return request(`/search/services${qs ? `?${qs}` : ''}`, { method: 'GET' });
  },

  async searchProducts({
    q = null,
    latitude = null,
    longitude = null,
    radius_km = null,
    category_id = null,
    community_id = null,
    sort = 'recommended',
    page = 1,
    page_size = 20
  } = {}) {
    const params = new URLSearchParams();
    if (q && q.trim()) params.append('q', q.trim());
    if (latitude != null) params.append('latitude', String(latitude));
    if (longitude != null) params.append('longitude', String(longitude));
    if (radius_km != null) params.append('radius_km', String(radius_km));
    if (category_id && category_id !== 'all') params.append('category_id', String(category_id));
    if (community_id) params.append('community_id', String(community_id));
    if (sort) params.append('sort', sort);
    if (page) params.append('page', String(page));
    if (page_size) params.append('page_size', String(page_size));

    const qs = params.toString();
    return request(`/search/products${qs ? `?${qs}` : ''}`, { method: 'GET' });
  },

  async searchSolidarity({
    q = null,
    latitude = null,
    longitude = null,
    radius_km = null,
    post_type = null,
    community_id = null,
    sort = 'recommended',
    page = 1,
    page_size = 20
  } = {}) {
    const params = new URLSearchParams();
    if (q && q.trim()) params.append('q', q.trim());
    if (latitude != null) params.append('latitude', String(latitude));
    if (longitude != null) params.append('longitude', String(longitude));
    if (radius_km != null) params.append('radius_km', String(radius_km));
    if (post_type && post_type !== 'all') params.append('post_type', post_type);
    if (community_id) params.append('community_id', String(community_id));
    if (sort) params.append('sort', sort);
    if (page) params.append('page', String(page));
    if (page_size) params.append('page_size', String(page_size));

    const qs = params.toString();
    return request(`/search/solidarity${qs ? `?${qs}` : ''}`, { method: 'GET' });
  },

  async searchEmergencies({
    q = null,
    latitude = null,
    longitude = null,
    radius_km = null,
    severity = null,
    community_id = null,
    sort = 'recommended',
    page = 1,
    page_size = 20
  } = {}) {
    const params = new URLSearchParams();
    if (q && q.trim()) params.append('q', q.trim());
    if (latitude != null) params.append('latitude', String(latitude));
    if (longitude != null) params.append('longitude', String(longitude));
    if (radius_km != null) params.append('radius_km', String(radius_km));
    if (severity && severity !== 'all') params.append('severity', severity);
    if (community_id) params.append('community_id', String(community_id));
    if (sort) params.append('sort', sort);
    if (page) params.append('page', String(page));
    if (page_size) params.append('page_size', String(page_size));

    const qs = params.toString();
    return request(`/search/emergencies${qs ? `?${qs}` : ''}`, { method: 'GET' });
  }
};

export default api;
