// ==========================================================
// VECIRED IA — CLIENTE HTTP PARA API FASTAPI V1
// ==========================================================
import { Platform } from 'react-native';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

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
  }
};
