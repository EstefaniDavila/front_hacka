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

export const mockEmergency = null;

export const mockEmergencyNeeds = [];

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
