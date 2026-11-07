// ==========================================================
// MOCK DATA - ALINEADO AL ESQUEMA SQL DE SUPABASE (VECIRED IA)
// ==========================================================

export const mockProfile = {
  id: "u-marhta-001",
  full_name: "Doña Martha Quispe",
  phone: "984-555-123",
  avatar_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200",
  birth_date: "1958-04-12",
  account_status: "verified",
  font_scale_preference: "normal", // normal, large, senior
  solidarity_helped_count: 12,
  solidarity_received_count: 4,
  zone_name: "Zona A",
  block_code: "Manzana 2",
  street_address: "Calle Los Nogales 214, Mz B"
};

export const mockServices = [
  {
    id: "srv-001",
    provider_id: "u-juan-002",
    provider_name: "Juan Torres",
    provider_avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
    category_name: "Electricidad",
    title: "Electricista Domiciliario",
    description: "Instalaciones, fugas de corriente, tableros y cableado.",
    price_from: 35.00,
    price_unit: "servicio",
    availability: "Disponible hoy",
    rating_avg: 4.9,
    endorsements_count: 32,
    distance_m: 350,
    is_verified: true,
    phone: "987-111-222"
  },
  {
    id: "srv-002",
    provider_id: "u-rosa-003",
    provider_name: "Doña Rosa",
    provider_avatar: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=200",
    category_name: "Repostería",
    title: "Repostería y Panadería Casera",
    description: "Pasteles, queques de naranja y empanadas recién horneadas.",
    price_from: 15.00,
    price_unit: "pedido",
    availability: "De 8 am a 7 pm",
    rating_avg: 4.8,
    endorsements_count: 27,
    distance_m: 420,
    is_verified: true,
    phone: "987-333-444"
  },
  {
    id: "srv-003",
    provider_id: "u-carlos-004",
    provider_name: "Carlos Mendoza",
    provider_avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200",
    category_name: "Jardinería",
    title: "Jardinería y Poda",
    description: "Mantenimiento de jardines, corte de césped y abono orgánico.",
    price_from: 25.00,
    price_unit: "hora",
    availability: "Fines de semana",
    rating_avg: 4.7,
    endorsements_count: 18,
    distance_m: 600,
    is_verified: true,
    phone: "987-555-666"
  },
  {
    id: "srv-004",
    provider_id: "u-marcos-005",
    provider_name: "Marcos Soto",
    provider_avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200",
    category_name: "Gasfitería",
    title: "Servicio de Gasfitería Integral",
    description: "Desatoros urgentes, reparación de cañerías y griferías.",
    price_from: 30.00,
    price_unit: "visita",
    availability: "Urgencias 24/7",
    rating_avg: 4.8,
    endorsements_count: 12,
    distance_m: 350,
    is_verified: true,
    phone: "987-777-888"
  }
];

export const mockSolidarityPosts = [
  {
    id: "post-001",
    author_id: "u-maria-006",
    author_name: "María Quispe",
    author_avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200",
    category: "Herramientas",
    post_type: "request", // request, offer, donation, exchange
    title: "Necesito una escalera",
    description: "Para un trabajo en casa, por 1 día. Prometo devolverla limpia y en el horario acordado.",
    block_code: "Zona A – Mz. 2",
    time_ago: "Hace 2 h",
    available_until: "Hoy, 8:00 p. m.",
    icon: "🪜"
  },
  {
    id: "post-002",
    author_id: "u-roberto-007",
    author_name: "Roberto Gómez",
    author_avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200",
    category: "Herramientas",
    post_type: "offer",
    title: "Presto taladro percutor",
    description: "Taladro disponible este fin de semana con juego de brocas. Préstamo con QR de entrega.",
    block_code: "Zona A – Mz. 1",
    time_ago: "Hace 4 h",
    available_until: "Domingo 6:00 p. m.",
    icon: "🧰"
  },
  {
    id: "post-003",
    author_id: "u-carlos-008",
    author_name: "Carlos Medina",
    author_avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200",
    category: "Donaciones",
    post_type: "donation",
    title: "Donación de víveres",
    description: "Alimentos no perecibles (arroz, avena, fideos) para una familia que lo necesite.",
    block_code: "Zona A – Mz. 3",
    time_ago: "Hace 5 h",
    available_until: "Permanente",
    icon: "📦"
  },
  {
    id: "post-004",
    author_id: "u-rosa-009",
    author_name: "Rosa Lozano",
    author_avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200",
    category: "Apoyo temporal",
    post_type: "request",
    title: "Apoyo para mudanza",
    description: "Busco 1 o 2 vecinos que me apoyen a trasladar unos muebles pesados este sábado.",
    block_code: "Zona A – Mz. 2",
    time_ago: "Hace 1 h",
    available_until: "Sábado 10:00 a. m.",
    icon: "🛋️"
  },
  {
    id: "post-005",
    author_id: "u-elena-010",
    author_name: "Elena Paredes",
    author_avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200",
    category: "Intercambio",
    post_type: "exchange",
    title: "Clases de computación",
    description: "Puedo enseñar computación básica para adultos mayores a cambio de clases de inglés.",
    block_code: "Zona A – Mz. 1",
    time_ago: "Hace 5 h",
    available_until: "Por coordinar",
    icon: "💻"
  }
];

export const mockEmergency = {
  id: "emg-001",
  emergency_type: "inundacion",
  title: "Inundación en Zona A",
  description: "Se reporta ingreso de agua en varias viviendas por aniego. Se necesita apoyo con sacos de arena y traslado de muebles.",
  severity: "high",
  status: "en_atencion", // reportada, en_atencion, atendida
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

export const mockVolunteers = [
  { id: "vol-1", name: "Luis G.", avatar: "👨‍🔧", status: "En camino" },
  { id: "vol-2", name: "María C.", avatar: "👵", status: "En camino" },
  { id: "vol-3", name: "Jorge T.", avatar: "👨‍🌾", status: "En camino" },
  { id: "vol-4", name: "Andrés V.", avatar: "🧔", status: "En camino" }
];

export const mockProducts = [
  {
    id: "prod-001",
    seller_id: "u-marhta-001",
    seller_name: "Doña Rosa",
    name: "Pan casero",
    description: "Pan casero y fresco, hecho en casa.",
    price: 0.50,
    unit: "Unidad",
    stock: 30,
    image_url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400",
    visible_to_neighbors: true,
    block_code: "Zona A, Manzana 2"
  }
];
