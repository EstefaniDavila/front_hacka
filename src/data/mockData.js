// ==========================================================
// VECIRED IA - DATOS INICIALES LIMPIOS (SIN DATOS ESTÁTICOS)
// Conectado a PostgreSQL / FastAPI en tiempo real
// ==========================================================

export const mockProfile = {
  id: "a0000000-0000-0000-0000-000000000001",
  full_name: "Vecino",
  phone: "",
  avatar_url: null,
  account_status: "verified",
  font_scale_preference: "normal",
  solidarity_helped_count: 0,
  solidarity_received_count: 0,
  zone_name: "Zona A",
  block_code: "Manzana 2",
  street_address: "Calle Principal"
};

export const mockServices = [];

export const mockSolidarityPosts = [];
export const mockSolidarityFeed = [];

export const mockEmergency = {
  id: "emg-001",
  emergency_type: "inundacion",
  title: "Inundación en Zona A",
  description: "Se reporta ingreso de agua en varias viviendas por aniego. Se necesita apoyo con sacos de arena y traslado de muebles.",
  severity: "high",
  status: "en_atencion",
  block_code: "Zona A – Manzana 2",
  occurred_at: "Hoy, 9:10 a. m.",
  volunteers_count: 4,
  radius_m: 500
};

export const mockEmergencyNeeds = [
  {
    id: "need-001",
    emergency_id: "emg-001",
    resource_name: "Agua potable",
    icon: "💧",
    quantity_required: 20,
    quantity_committed: 8,
    unit: "botellas",
    priority: "Alta",
    status: "active"
  },
  {
    id: "need-002",
    emergency_id: "emg-001",
    resource_name: "Alimentos",
    icon: "🍴",
    quantity_required: 15,
    quantity_committed: 10,
    unit: "packs",
    priority: "Alta",
    status: "active"
  },
  {
    id: "need-003",
    emergency_id: "emg-001",
    resource_name: "Mantas y frazadas",
    icon: "🛏️",
    quantity_required: 10,
    quantity_committed: 3,
    unit: "unidades",
    priority: "Media",
    status: "active"
  }
];

export const mockVolunteers = [];

export const mockProducts = [];

export const mockCategories = [
  { id: "all", name: "Todos", icon: "▦" },
  { id: "electricidad", name: "Electricidad", icon: "⚡" },
  { id: "gasfiteria", name: "Gasfitería", icon: "🚰" },
  { id: "costura", name: "Costura", icon: "🧵" },
  { id: "cocina", name: "Cocina y Repostería", icon: "🍲" },
  { id: "jardineria", name: "Jardinería", icon: "🌿" },
  { id: "apoyo", name: "Apoyo General", icon: "🤝" }
];

export const mockNotifications = [];
