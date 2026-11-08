import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert
} from 'react-native';
import { COLORS } from '../theme/colors';
import { mockServices } from '../data/mockData';
import { api } from '../services/api';

export default function ServicesScreen({ onNavigate, fontScale = 1.0, onOpenChat, onOpenDetail }) {
  const [categories, setCategories] = useState([
    { id: 'all', name: 'Todos', icon: '▦' }
  ]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [filterType, setFilterType] = useState('near'); // near, recommended, promos
  const [searchQuery, setSearchQuery] = useState('');
  const [services, setServices] = useState(mockServices);
  const [totalCount, setTotalCount] = useState(mockServices.length);
  const [loading, setLoading] = useState(false);

  const scale = (val) => Math.round(val * fontScale);

  // Cargar categorías iniciales
  useEffect(() => {
    loadCategories();
  }, []);

  // Recargar servicios cuando cambie la categoría, filtro o búsqueda
  useEffect(() => {
    loadServices();
  }, [activeCategory, filterType]);

  const loadCategories = async () => {
    try {
      const data = await api.getServiceCategories();
      if (Array.isArray(data) && data.length > 0) {
        setCategories([
          { id: 'all', name: 'Todos', icon: '▦' },
          ...data.map((c) => ({
            id: c.id,
            name: c.name,
            icon: c.icon || '🛠️'
          }))
        ]);
      }
    } catch (err) {
      console.warn('[ServicesScreen] Error al cargar categorías:', err);
    }
  };

  const loadServices = async (searchTerm = searchQuery) => {
    try {
      setLoading(true);

      let sortBy = 'newest';
      if (filterType === 'recommended') sortBy = 'rating';
      else if (filterType === 'promos') sortBy = 'price_asc';

      const res = await api.getServices({
        q: searchTerm,
        category_id: activeCategory !== 'all' ? activeCategory : null,
        sort_by: sortBy,
        page: 1,
        limit: 30
      });

      if (res && Array.isArray(res.items) && res.items.length > 0) {
        setServices(res.items);
        setTotalCount(res.meta?.total || res.items.length);
      } else if (searchTerm || activeCategory !== 'all') {
        // Búsqueda específica sin resultados
        setServices([]);
        setTotalCount(0);
      } else {
        // Fallback a mock data si la base de datos no tiene servicios precargados
        setServices(mockServices);
        setTotalCount(mockServices.length);
      }
    } catch (err) {
      console.warn('[ServicesScreen] Error al cargar servicios:', err);
      setServices(mockServices);
      setTotalCount(mockServices.length);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = () => {
    loadServices(searchQuery);
  };

  const handleServiceSelect = (service) => {
    if (onOpenDetail) {
      onOpenDetail(service, 'service');
    } else if (service?.id) {
      onNavigate('service_detail', { serviceId: service.id });
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      
      {/* Cabecera de Servicios (Verde Azulado) */}
      <View style={styles.headerBox}>
        <View style={styles.headerTitleRow}>
          <View style={styles.headerLeft}>
            <Text style={{ fontSize: 24, marginRight: 8 }}>🏪</Text>
            <View>
              <Text style={[styles.headerTitle, { fontSize: scale(16) }]}>
                Servicios de Proximidad
              </Text>
              <Text style={[styles.headerSub, { fontSize: scale(11) }]}>
                Economía Local • Zona A
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <TouchableOpacity
              style={styles.myServicesPill}
              onPress={() => onNavigate('my_services')}
            >
              <Text style={[styles.myServicesPillText, { fontSize: scale(10) }]}>🛠️ Mis servicios</Text>
            </TouchableOpacity>
            <View style={styles.zoneChip}>
              <Text style={[styles.zoneChipText, { fontSize: scale(10) }]}>📍 Zona A</Text>
            </View>
          </View>
        </View>

        {/* Buscador IA */}
        <View style={styles.searchBar}>
          <Text style={{ fontSize: 16, marginRight: 6 }}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { fontSize: scale(12) }]}
            placeholder="Ej. Necesito un electricista hoy..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSearchSubmit}
          >
            <Text style={{ fontSize: 14, color: COLORS.white }}>➤</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Selector Horizontal de Categorías */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[styles.categoryPill, isActive && styles.categoryPillActive]}
              onPress={() => setActiveCategory(cat.id)}
            >
              <Text style={{ fontSize: 14, marginRight: 4 }}>{cat.icon}</Text>
              <Text style={[styles.categoryPillText, isActive && styles.categoryPillTextActive, { fontSize: scale(11) }]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Sub-chips de Filtro */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, filterType === 'near' && styles.filterChipActive]}
          onPress={() => setFilterType('near')}
        >
          <Text style={[styles.filterChipText, filterType === 'near' && styles.filterChipTextActive, { fontSize: scale(11) }]}>
            ✨ Cerca de mí
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filterType === 'recommended' && styles.filterChipActive]}
          onPress={() => setFilterType('recommended')}
        >
          <Text style={[styles.filterChipText, filterType === 'recommended' && styles.filterChipTextActive, { fontSize: scale(11) }]}>
            🔥 Más recomendados
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filterType === 'promos' && styles.filterChipActive]}
          onPress={() => setFilterType('promos')}
        >
          <Text style={[styles.filterChipText, filterType === 'promos' && styles.filterChipTextActive, { fontSize: scale(11) }]}>
            🏷️ Más económicos
          </Text>
        </TouchableOpacity>
      </View>

      {/* Radar de Servicios Disponibles */}
      <View style={styles.radarCard}>
        <View style={styles.radarIconWrap}>
          <Text style={{ fontSize: 26 }}>📡</Text>
        </View>
        <View style={styles.radarDetails}>
          <Text style={[styles.radarTitle, { fontSize: scale(12) }]}>
            Servicios en tu comunidad
          </Text>
          <Text style={[styles.radarSub, { fontSize: scale(10) }]}>
            Comunidad verificada de vecinos
          </Text>
          <Text style={[styles.radarNumber, { fontSize: scale(18) }]}>
            {totalCount} {totalCount === 1 ? 'servicio disponible' : 'servicios disponibles'}
          </Text>
        </View>
        <TouchableOpacity onPress={() => onNavigate('publish')}>
          <Text style={styles.radarArrow}>+ Publicar</Text>
        </TouchableOpacity>
      </View>

      {/* Lista de Prestadores Recomendados */}
      <View style={styles.sectionTitleRow}>
        <Text style={[styles.sectionTitle, { fontSize: scale(14) }]}>
          ⭐ Servicios de tus vecinos
        </Text>
      </View>

      {loading ? (
        <View style={{ padding: 30, alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={{ marginTop: 10, color: COLORS.textSecondary }}>Buscando profesionales...</Text>
        </View>
      ) : services.length > 0 ? (
        services.map((service) => (
          <TouchableOpacity
            key={service.id}
            style={styles.serviceItemCard}
            activeOpacity={0.9}
            onPress={() => handleServiceSelect(service)}
          >
            <View style={styles.serviceItemTop}>
              <Image
                source={{
                  uri: service.provider_avatar || service.image_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200'
                }}
                style={styles.providerAvatar}
              />
              <View style={styles.providerInfo}>
                <View style={styles.vistoBuenoBadge}>
                  <Text style={styles.vistoBuenoText}>★ Visto Bueno Vecinal</Text>
                </View>
                <Text style={[styles.providerName, { fontSize: scale(13) }]}>
                  {service.provider_name}
                </Text>
                <Text style={[styles.serviceTitle, { fontSize: scale(12) }]}>
                  {service.title}
                </Text>
                <Text style={[styles.ratingRow, { fontSize: scale(11) }]}>
                  ⭐ {service.rating_avg ? Number(service.rating_avg).toFixed(1) : '4.8'} ({service.reviews_count || service.endorsements_count || 12}) • 📍 {service.distance_m || 350} m
                </Text>
              </View>
            </View>

            {service.description ? (
              <Text style={[styles.serviceDesc, { fontSize: scale(11) }]} numberOfLines={2}>
                {service.description}
              </Text>
            ) : null}

            <View style={styles.serviceFooterRow}>
              <Text style={[styles.servicePrice, { fontSize: scale(12) }]}>
                {service.price_from != null ? `Desde S/ ${Number(service.price_from).toFixed(2)}` : 'Tarifa a convenir'}
              </Text>

              <View style={{ flexDirection: 'row', gap: 6 }}>
                <TouchableOpacity
                  style={styles.detailButton}
                  onPress={() => handleServiceSelect(service)}
                >
                  <Text style={[styles.detailButtonText, { fontSize: scale(11) }]}>Ficha</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.whatsappButton}
                  activeOpacity={0.8}
                  onPress={() => {
                    if (onOpenChat) {
                      onOpenChat({
                        name: service.provider_name,
                        topic: service.title,
                        avatar: '👨‍🔧',
                        zone: 'Zona A',
                        badge: 'Proveedor Verificado',
                        phone: service.provider_phone || service.phone
                      });
                    } else {
                      Alert.alert('💬 Chat Vecinal', `Iniciando chat con ${service.provider_name}...`);
                    }
                  }}
                >
                  <Text style={[styles.whatsappButtonText, { fontSize: scale(11) }]}>
                    💬 Contactar
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        ))
      ) : (
        <View style={styles.emptyCard}>
          <Text style={{ fontSize: 36, marginBottom: 8 }}>🔍</Text>
          <Text style={[styles.emptyTitle, { fontSize: scale(14) }]}>No encontramos servicios con esos filtros</Text>
          <Text style={[styles.emptySub, { fontSize: scale(11) }]}>
            Sé el primero en ofrecer un servicio en tu barrio o prueba buscando con otra palabra.
          </Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => onNavigate('publish')}>
            <Text style={styles.emptyBtnText}>+ Publicar un servicio</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Banner de Emergencia Inferior (Rojo) */}
      <TouchableOpacity
        style={styles.emergencySupportCard}
        activeOpacity={0.85}
        onPress={() => onNavigate('emergency')}
      >
        <Text style={{ fontSize: 24, marginRight: 8 }}>🚨</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.emergencySupportTitle, { fontSize: scale(12) }]}>
            ¿Necesitas apoyo en una emergencia?
          </Text>
          <Text style={[styles.emergencySupportSub, { fontSize: scale(10) }]}>
            Encuentra servicios y brigadistas disponibles ahora.
          </Text>
        </View>
        <View style={styles.emergencyBtn}>
          <Text style={styles.emergencyBtnText}>Activar soporte ➔</Text>
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  content: {
    padding: 16,
    paddingBottom: 30
  },
  headerBox: {
    backgroundColor: COLORS.primaryDark,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  headerTitle: {
    fontWeight: '800',
    color: COLORS.white
  },
  headerSub: {
    color: '#ccfbf1',
    fontWeight: '500'
  },
  zoneChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  zoneChipText: {
    color: COLORS.white,
    fontWeight: '700'
  },
  myServicesPill: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  myServicesPillText: {
    color: COLORS.primaryDark,
    fontWeight: '700'
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    padding: 0
  },
  sendButton: {
    backgroundColor: COLORS.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6
  },
  categoriesScroll: {
    marginBottom: 12
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  categoryPillActive: {
    backgroundColor: COLORS.primarySurface,
    borderColor: COLORS.primary
  },
  categoryPillText: {
    color: COLORS.textSecondary,
    fontWeight: '600'
  },
  categoryPillTextActive: {
    color: COLORS.primaryDark,
    fontWeight: '700'
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14
  },
  filterChip: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  filterChipActive: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1'
  },
  filterChipText: {
    color: COLORS.textSecondary,
    fontWeight: '500'
  },
  filterChipTextActive: {
    color: COLORS.text,
    fontWeight: '700'
  },
  radarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primarySurface,
    borderWidth: 1,
    borderColor: '#ccfbf1',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16
  },
  radarIconWrap: {
    marginRight: 12
  },
  radarDetails: {
    flex: 1
  },
  radarTitle: {
    fontWeight: '700',
    color: COLORS.primaryDark
  },
  radarSub: {
    color: '#0f766e'
  },
  radarNumber: {
    fontWeight: '800',
    color: COLORS.primaryDark,
    marginTop: 2
  },
  radarArrow: {
    color: COLORS.primaryDark,
    fontWeight: '700',
    backgroundColor: COLORS.white,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#99f6e4',
    fontSize: 11
  },
  sectionTitleRow: {
    marginBottom: 10
  },
  sectionTitle: {
    fontWeight: '800',
    color: COLORS.text
  },
  serviceItemCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12
  },
  serviceItemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  providerAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 12
  },
  providerInfo: {
    flex: 1
  },
  vistoBuenoBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 2
  },
  vistoBuenoText: {
    fontSize: 9,
    color: '#92400e',
    fontWeight: '700'
  },
  providerName: {
    fontWeight: '700',
    color: COLORS.text
  },
  serviceTitle: {
    fontWeight: '600',
    color: '#334155',
    marginTop: 1
  },
  ratingRow: {
    color: '#854d0e',
    fontWeight: '600',
    marginTop: 2
  },
  serviceDesc: {
    color: COLORS.textSecondary,
    marginBottom: 10,
    lineHeight: 16
  },
  serviceFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10
  },
  servicePrice: {
    fontWeight: '700',
    color: COLORS.primaryDark
  },
  detailButton: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8
  },
  detailButtonText: {
    color: '#334155',
    fontWeight: '600'
  },
  whatsappButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8
  },
  whatsappButtonText: {
    color: COLORS.white,
    fontWeight: '700'
  },
  emptyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16
  },
  emptyTitle: {
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4
  },
  emptySub: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 14
  },
  emptyBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 8
  },
  emptyBtnText: {
    color: COLORS.white,
    fontWeight: '700'
  },
  emergencySupportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.emergencySurface,
    borderWidth: 1,
    borderColor: COLORS.emergencyPale,
    borderRadius: 12,
    padding: 12,
    marginTop: 8
  },
  emergencySupportTitle: {
    fontWeight: '700',
    color: COLORS.emergencyDark
  },
  emergencySupportSub: {
    color: '#991b1b'
  },
  emergencyBtn: {
    backgroundColor: COLORS.emergency,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 6
  },
  emergencyBtnText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700'
  }
});
