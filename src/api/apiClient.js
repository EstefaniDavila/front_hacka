import { Platform } from 'react-native';

// Configuración de URL del Backend de FastAPI (VeciRed IA)
export const LOCAL_PC_IP = '192.168.0.175';
export const API_BASE_URL = Platform.OS === 'web'
  ? 'http://localhost:8000/api/v1'
  : `http://${LOCAL_PC_IP}:8000/api/v1`;

// Estado de memoria reactivo limpio (Página Nueva - Datos reales de PostgreSQL)
let localMemory = {
  profile: {
    id: "a0000000-0000-0000-0000-000000000001",
    full_name: "Vecino",
    phone: "",
    account_status: "verified",
    solidarity_helped_count: 0,
    solidarity_received_count: 0,
    zone_name: "Zona A",
    block_code: "Manzana 2"
  },
  services: [],
  products: [],
  solidarity: [],
  emergency: null,
  volunteers: [],
  isBackendConnected: false
};

// Helper genérico para peticiones fetch
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Test-User-Id': 'a0000000-0000-0000-0000-000000000001',
        ...(options.headers || {})
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    localMemory.isBackendConnected = true;

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}: ${errText || res.statusText}`);
    }

    if (res.status === 204) return null;
    return await res.json();
  } catch (error) {
    clearTimeout(timeoutId);
    localMemory.isBackendConnected = false;
    throw error;
  }
}

export const api = {
  // -------------------------------------------------------------
  // 0. HEALTH CHECK Y CONECTIVIDAD
  // -------------------------------------------------------------
  async checkHealth() {
    try {
      const data = await request('/health');
      localMemory.isBackendConnected = true;
      return { connected: true, data };
    } catch (err) {
      localMemory.isBackendConnected = false;
      return { connected: false, error: err.message };
    }
  },

  isBackendOnline() {
    return localMemory.isBackendConnected;
  },

  // -------------------------------------------------------------
  // 1. PRODUCTOS LOCALES (/products)
  // -------------------------------------------------------------
  async getProducts(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (params.q) queryParams.append('q', params.q);
      if (params.category_id) queryParams.append('category_id', params.category_id);
      const queryStr = queryParams.toString() ? `?${queryParams.toString()}` : '';

      const data = await request(`/products${queryStr}`);
      if (data && Array.isArray(data.items)) {
        localMemory.products = data.items;
        return data.items;
      }
      return localMemory.products;
    } catch {
      let filtered = [...localMemory.products];
      if (params.q) {
        const query = params.q.toLowerCase();
        filtered = filtered.filter(p =>
          (p.name || '').toLowerCase().includes(query) ||
          (p.description || '').toLowerCase().includes(query)
        );
      }
      return filtered;
    }
  },

  async getProductCategories() {
    try {
      const data = await request('/products/categories');
      if (Array.isArray(data) && data.length > 0) return data;
      return [
        { id: '11111111-0000-0000-0000-000000000001', name: 'Panadería y Masas' },
        { id: '11111111-0000-0000-0000-000000000002', name: 'Comida Casera y Menú' },
        { id: '11111111-0000-0000-0000-000000000003', name: 'Verduras, Frutas y Abarrotes' },
        { id: '11111111-0000-0000-0000-000000000004', name: 'Repostería y Postres' }
      ];
    } catch {
      return [
        { id: '11111111-0000-0000-0000-000000000001', name: 'Panadería y Masas' },
        { id: '11111111-0000-0000-0000-000000000002', name: 'Comida Casera y Menú' },
        { id: '11111111-0000-0000-0000-000000000003', name: 'Verduras, Frutas y Abarrotes' },
        { id: '11111111-0000-0000-0000-000000000004', name: 'Repostería y Postres' }
      ];
    }
  },

  async createProduct(newProductData) {
    const localItem = {
      id: 'prod-' + Date.now(),
      seller_id: localMemory.profile.id,
      seller_name: localMemory.profile.full_name || 'Vecino',
      seller_avatar: null,
      name: newProductData.title,
      description: newProductData.desc,
      price: parseFloat(newProductData.price) || 1.0,
      unit: newProductData.unit || 'unidad',
      category_name: newProductData.category || 'Venta Barrial',
      image_url: newProductData.image_url || null,
      stock: 20,
      rating: 5.0,
      reviews_count: 0,
      distance_m: 50,
      status: 'active',
      block_code: 'Zona A, Manzana 2',
      street_address: 'Calle Principal',
      phone: localMemory.profile.phone || '987-654-321'
    };

    try {
      const serverResult = await request('/products', {
        method: 'POST',
        body: JSON.stringify({
          name: newProductData.title,
          description: newProductData.desc,
          price: parseFloat(newProductData.price) || 1.0,
          stock: 20
        })
      });
      const finalItem = { ...localItem, ...(serverResult || {}) };
      localMemory.products.unshift(finalItem);
      return finalItem;
    } catch {
      localMemory.products.unshift(localItem);
      return localItem;
    }
  },

  // -------------------------------------------------------------
  // 2. SERVICIOS DE PROXIMIDAD (/services)
  // -------------------------------------------------------------
  async getServices(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (params.q) queryParams.append('q', params.q);
      const queryStr = queryParams.toString() ? `?${queryParams.toString()}` : '';

      const data = await request(`/services${queryStr}`);
      if (data && Array.isArray(data.items)) {
        localMemory.services = data.items;
        return data.items;
      }
      return localMemory.services;
    } catch {
      let filtered = [...localMemory.services];
      if (params.q) {
        const query = params.q.toLowerCase();
        filtered = filtered.filter(s =>
          (s.title || '').toLowerCase().includes(query) ||
          (s.description || '').toLowerCase().includes(query)
        );
      }
      return filtered;
    }
  },

  async getServiceCategories() {
    try {
      const data = await request('/services/categories');
      if (Array.isArray(data) && data.length > 0) return data;
      return [];
    } catch {
      return [];
    }
  },

  async createService(newServiceData) {
    const localItem = {
      id: 'srv-' + Date.now(),
      provider_id: localMemory.profile.id,
      provider_name: localMemory.profile.full_name || 'Vecino',
      provider_avatar: null,
      title: newServiceData.title,
      description: newServiceData.desc,
      price_from: parseFloat(newServiceData.price) || 20.0,
      price_unit: 'servicio',
      category_name: newServiceData.category || 'Oficios',
      image_url: newServiceData.image_url || null,
      availability: 'Disponible hoy',
      rating_avg: 5.0,
      endorsements_count: 0,
      distance_m: 60,
      is_verified: true,
      block_code: 'Zona A, Manzana 2',
      street_address: 'Calle Principal',
      phone: localMemory.profile.phone || '987-654-321'
    };

    try {
      const serverResult = await request('/services', {
        method: 'POST',
        body: JSON.stringify({
          title: newServiceData.title,
          description: newServiceData.desc,
          price_from: parseFloat(newServiceData.price) || 20.0
        })
      });
      const finalItem = { ...localItem, ...(serverResult || {}) };
      localMemory.services.unshift(finalItem);
      return finalItem;
    } catch {
      localMemory.services.unshift(localItem);
      return localItem;
    }
  },

  // -------------------------------------------------------------
  // 3. MURO DE AYUDA SOLIDARIA (/solidarity/posts)
  // -------------------------------------------------------------
  async getSolidarityPosts(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (params.category && params.category !== 'Todo' && params.category !== 'all') {
        queryParams.append('category', params.category);
      }
      if (params.post_type) queryParams.append('post_type', params.post_type);
      const queryStr = queryParams.toString() ? `?${queryParams.toString()}` : '';

      const data = await request(`/solidarity/posts${queryStr}`);
      if (data && Array.isArray(data.items)) {
        localMemory.solidarity = data.items;
        return data.items;
      }
      return localMemory.solidarity;
    } catch {
      let filtered = [...localMemory.solidarity];
      if (params.category && params.category !== 'Todo' && params.category !== 'all') {
        filtered = filtered.filter(p => p.category === params.category);
      }
      return filtered;
    }
  },

  async createSolidarityPost(newPostData) {
    const postTypeMap = {
      'Necesito ayuda': 'request',
      'necesito': 'request',
      'request': 'request',
      'Puedo apoyar': 'offer',
      'apoyo': 'offer',
      'offer': 'offer',
      'Donación': 'donation',
      'donation': 'donation',
      'Intercambio': 'exchange',
      'exchange': 'exchange'
    };
    const mappedType = postTypeMap[newPostData.type] || 'offer';

    const localPost = {
      id: 'sol-' + Date.now(),
      author_id: localMemory.profile.id,
      author_name: localMemory.profile.full_name || 'Vecino',
      author_avatar: null,
      author_badge: 'Vecino Verificado',
      zone_name: 'Zona A - Mz 2',
      category: newPostData.category || 'Apoyo temporal',
      type: newPostData.type || 'Puedo apoyar',
      post_type: mappedType,
      title: newPostData.title,
      description: newPostData.desc,
      image_url: newPostData.image_url || null,
      created_at_human: 'Hace un momento',
      endorsements: 0,
      responses_count: 0,
      status: 'active'
    };

    try {
      const serverResult = await request('/solidarity/posts', {
        method: 'POST',
        body: JSON.stringify({
          title: newPostData.title,
          description: newPostData.desc,
          category: newPostData.category || 'Apoyo temporal',
          post_type: mappedType
        })
      });
      const finalPost = { ...localPost, ...(serverResult || {}) };
      localMemory.solidarity.unshift(finalPost);
      return finalPost;
    } catch {
      localMemory.solidarity.unshift(localPost);
      return localPost;
    }
  },

  async respondToSolidarityPost(postId, message = 'Cuento con el apoyo vecinal') {
    try {
      await request(`/solidarity/posts/${postId}/respond`, {
        method: 'POST',
        body: JSON.stringify({ message })
      });
    } catch {
      const post = localMemory.solidarity.find(p => p.id === postId);
      if (post) post.responses_count = (post.responses_count || 0) + 1;
    }
  },

  // -------------------------------------------------------------
  // 4. EMERGENCIAS BARRIALES (/emergencies)
  // -------------------------------------------------------------
  async getActiveEmergency() {
    try {
      const data = await request('/emergencies');
      if (data && Array.isArray(data.items) && data.items.length > 0) {
        return data.items[0];
      }
      return localMemory.emergency;
    } catch {
      return localMemory.emergency;
    }
  },

  async getEmergencies() {
    try {
      const data = await request('/emergencies');
      if (data && Array.isArray(data.items)) {
        return data.items;
      }
      return localMemory.emergency ? [localMemory.emergency] : [];
    } catch {
      return localMemory.emergency ? [localMemory.emergency] : [];
    }
  },

  async reportEmergency(emergencyData) {
    const localEmerg = {
      id: 'emg-' + Date.now(),
      title: emergencyData.title || 'Alerta Vecinal Comunitaria',
      description: emergencyData.desc || 'Reporte de emergencia en Manzana 2',
      type: emergencyData.type || 'Emergencia',
      status: 'reportada',
      severity: 'high',
      location: 'Mz 2 (Zona A)',
      volunteers_count: 1
    };

    try {
      const serverResult = await request('/emergencies', {
        method: 'POST',
        body: JSON.stringify({
          title: emergencyData.title,
          description: emergencyData.desc,
          severity: 'high'
        })
      });
      localMemory.emergency = { ...localEmerg, ...(serverResult || {}) };
      return localMemory.emergency;
    } catch {
      localMemory.emergency = localEmerg;
      return localEmerg;
    }
  },

  async registerEmergencyVolunteer(emergencyId, volunteerName = 'Vecino') {
    const newVol = {
      id: 'vol-' + Date.now(),
      name: `Tú (${volunteerName})`,
      avatar: '👤',
      status: 'En camino'
    };

    try {
      await request(`/emergencies/${emergencyId}/volunteer`, {
        method: 'POST',
        body: JSON.stringify({ notes: 'Voy en camino a apoyar' })
      });
      localMemory.volunteers.push(newVol);
      return newVol;
    } catch {
      localMemory.volunteers.push(newVol);
      return newVol;
    }
  },

  async getEmergencyVolunteers() {
    return localMemory.volunteers;
  },

  // -------------------------------------------------------------
  // 5. PERFIL DE USUARIO (/users)
  // -------------------------------------------------------------
  async getUserProfile() {
    try {
      const data = await request('/users/me');
      if (data && data.full_name) {
        localMemory.profile = { ...localMemory.profile, ...data };
      }
      return localMemory.profile;
    } catch {
      return localMemory.profile;
    }
  },

  async updateUserProfile(profileData) {
    localMemory.profile = {
      ...localMemory.profile,
      ...profileData
    };

    try {
      await request('/users/me', {
        method: 'PUT',
        body: JSON.stringify({
          full_name: profileData.name || profileData.full_name,
          phone: profileData.phone,
          font_scale_preference: profileData.font_scale_preference || 'normal'
        })
      });
      return localMemory.profile;
    } catch {
      return localMemory.profile;
    }
  }
};

export default api;
