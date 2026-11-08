// ==========================================================
// VECIRED IA — CLIENTE HTTP PARA API FASTAPI V1
// ==========================================================
import { Platform } from 'react-native';

const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.EXPO_PUBLIC_API_URL) ||
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL) ||
  'http://localhost:8000/api/v1';

/**
 * Realiza peticiones autenticadas a la API backend de VeciRed IA.
 */
async function request(endpoint, options = {}, token = null) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    Accept: 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Si no es FormData, fijar Content-Type json
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

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
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.warn(`[VeciRed API] No se pudo conectar con el backend en ${url}.`);
      throw new Error('No fue posible contactar al servidor de VeciRed. Verifica tu conexión.');
    }
    throw error;
  }
}

export const api = {
  // Verificación de conectividad
  async checkHealth() {
    return request('/health');
  },

  // Perfil del vecino autenticado
  async getMyProfile(token) {
    return request('/users/me', { method: 'GET' }, token);
  },

  // Actualizar datos del perfil
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

    // En Web o React Native, adjuntar los archivos correspondientes
    if (dniFrontFile) {
      formData.append('dni_front', dniFrontFile, 'dni_front.jpg');
    }
    if (dniBackFile) {
      formData.append('dni_back', dniBackFile, 'dni_back.jpg');
    }
    if (selfieFile) {
      formData.append('selfie', selfieFile, 'selfie.jpg');
    }
    if (fullName) {
      formData.append('full_name', fullName);
    }

    return request(
      '/users/verify-identity',
      {
        method: 'POST',
        body: formData
      },
      token
    );
  },

  // Consultar estado de verificación
  async getVerificationStatus(token) {
    return request('/users/verification-status', { method: 'GET' }, token);
  },

  // ==========================================================
  // MÓDULO DE SERVICIOS DE PROXIMIDAD
  // ==========================================================
  // Categorías de servicios
  async getServiceCategories() {
    return request('/services/categories', { method: 'GET' });
  },

  // Listar servicios con filtros y búsqueda
  async getServices({ q = '', category_id = null, community_id = null, sort_by = 'newest', page = 1, limit = 20 } = {}) {
    const params = new URLSearchParams();
    if (q) params.append('q', q);
    if (category_id && category_id !== 'all') params.append('category_id', category_id);
    if (community_id) params.append('community_id', community_id);
    if (sort_by) params.append('sort_by', sort_by);
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);

    const queryString = params.toString();
    const endpoint = `/services${queryString ? `?${queryString}` : ''}`;
    return request(endpoint, { method: 'GET' });
  },

  // Detalle de un servicio específico
  async getServiceDetail(serviceId) {
    return request(`/services/${serviceId}`, { method: 'GET' });
  },

  // Servicios publicados por el usuario actual
  async getMyServices({ page = 1, limit = 20 } = {}, token) {
    return request(`/services/my?page=${page}&limit=${limit}`, { method: 'GET' }, token);
  },

  // Servicios públicos de un vecino específico
  async getUserServices(userId, { page = 1, limit = 20 } = {}) {
    return request(`/services/user/${userId}?page=${page}&limit=${limit}`, { method: 'GET' });
  },

  // Crear y publicar un nuevo servicio
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

  // Editar un servicio existente
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

  // Cambiar estado de un servicio (active, paused)
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

  // Desactivar / eliminar servicio propio
  async deleteService(serviceId, token) {
    return request(`/services/${serviceId}`, { method: 'DELETE' }, token);
  },

  // Calificar y reseñar un servicio
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

  // Consultar reseñas de un servicio
  async getServiceReviews(serviceId, { page = 1, limit = 20 } = {}) {
    return request(`/services/${serviceId}/reviews?page=${page}&limit=${limit}`, { method: 'GET' });
  }
};

