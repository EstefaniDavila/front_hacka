// ==========================================================
// VECIRED IA - CLIENTE HTTP PARA API FASTAPI V1 UNIFICADO
// ==========================================================
import { Platform } from 'react-native';

export const LOCAL_PC_IP = '192.168.1.33';

export const API_BASE_URL = Platform.OS === 'web'
  ? ((typeof import.meta !== 'undefined' && import.meta.env?.EXPO_PUBLIC_API_URL) ||
     (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL) ||
     'http://localhost:8000/api/v1')
  : 'http://' + LOCAL_PC_IP + ':8000/api/v1';

let isBackendConnected = false;


async function request(endpoint, options = {}, token = null) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    Accept: 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    headers['X-Test-User-Id'] = 'a0000000-0000-0000-0000-000000000001';
  }

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

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

  // Subir DNI y Selfie para verificación biométrica con IA
  async verifyIdentity({ dniFrontFile, dniBackFile, selfieFile, fullName }, token) {
    const formData = new FormData();
    if (dniFrontFile) formData.append('dni_front', dniFrontFile, 'dni_front.jpg');
    if (dniBackFile) formData.append('dni_back', dniBackFile, 'dni_back.jpg');
    if (selfieFile) formData.append('selfie', selfieFile, 'selfie.jpg');
    if (fullName) formData.append('full_name', fullName);

    return request(
      '/users/verify-identity',
      {
        method: 'POST',
        body: formData
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
    return request(/products/, { method: 'DELETE' }, token);
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

  async reportEmergency(emergencyData, token) {
    return request(
      '/emergencies',
      {
        method: 'POST',
        body: JSON.stringify({
          title: emergencyData.title,
          description: emergencyData.desc || emergencyData.description || '',
          severity: emergencyData.severity || 'high'
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
  }
};

export default api;
