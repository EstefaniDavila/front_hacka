import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
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
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ServicesScreen({ onNavigate, fontScale = 1.0, onOpenChat, onOpenDetail, userProfile, initialSearch = "" }) {
  const { user, profile } = useAuth();
  const [categories, setCategories] = useState([
    { id: 'all', name: 'Todos', icon: '▦' }
  ]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [filterType, setFilterType] = useState('near'); // near, recommended, promos
  const [searchQuery, setSearchQuery] = useState('');
  const [services, setServices] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const scale = (val) => Math.round(val * fontScale);

  useEffect(() => {
    if (initialSearch) {
      setSearchQuery(initialSearch);
      loadServices(initialSearch);
    }
  }, [initialSearch]);

  useEffect(() => {
    loadCategories();
  }, []);

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

      if (res && Array.isArray(res.items)) {
        setServices(res.items);
        setTotalCount(res.meta?.total ?? res.items.length);
      } else {
        setServices([]);
        setTotalCount(0);
      }
    } catch (err) {
      console.warn('[ServicesScreen] Error al cargar servicios:', err);
      setServices([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = () => {
    loadServices(searchQuery);
  };

  const confirmDeleteService = (service) => {
    Alert.alert(
      '¿Eliminar servicio?',
      `¿Deseas eliminar "${service.title}" del catálogo vecinal?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteService(service.id, null);
              Alert.alert('Eliminado', 'Tu servicio ha sido retirado con éxito.');
              loadServices();
            } catch (err) {
              Alert.alert('Aviso', err.message || 'No se pudo eliminar el servicio.');
            }
          }
        }
      ]
    );
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
      {/* Cabecera de Servicios */}
      <View style={styles.headerBox}>
        {/* Selector de Pestaña: Servicios vs Productos Locales */}
        <View style={styles.tabToggleRow}>
          <TouchableOpacity
            style={[styles.tabToggleBtn, styles.tabToggleBtnActive]}
            activeOpacity={0.8}
          >
            <Ionicons name="construct" size={14} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={[styles.tabToggleBtnText, styles.tabToggleBtnTextActive, { fontSize: scale(11) }]}>
              Servicios y Oficios
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tabToggleBtn}
            activeOpacity={0.8}
            onPress={() => onNavigate('products')}
          >
            <MaterialCommunityIcons name="storefront-outline" size={15} color={COLORS.textSecondary} style={{ marginRight: 6 }} />
            <Text style={[styles.tabToggleBtnText, { fontSize: scale(11) }]}>
              Productos Locales
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.headerTitleRow}>
          <View style={styles.headerLeft}>
            <MaterialCommunityIcons name="toolbox" size={24} color={COLORS.primaryDark} style={{ marginRight: 8 }} />
            <View>
              <Text style={[styles.headerTitle, { fontSize: scale(16) }]}>Servicios y Oficios</Text>
              <Text style={[styles.headerSub, { fontSize: scale(11) }]}>
                Talento de vecinos en Zona A
              </Text>
            </View>
          </View>

          {/* Botón de acceso a Mis Servicios */}
          <TouchableOpacity
            style={styles.myServicesBtn}
            activeOpacity={0.8}
            onPress={() => onNavigate('my_services')}
          >
            <Feather name="clipboard" size={13} color={COLORS.primaryDark} style={{ marginRight: 4 }} />
            <Text style={[styles.myServicesBtnText, { fontSize: scale(11) }]}>Mis Servicios</Text>
          </TouchableOpacity>
        </View>

        {/* Barra de Búsqueda */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={17} color={COLORS.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Buscar por oficio, nombre o habilidad..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
            style={[styles.searchInput, { fontSize: scale(12) }]}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                loadServices('');
              }}
            >
              <Text style={{ fontSize: 16, color: COLORS.textMuted, paddingHorizontal: 4 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Categorías (Pills Horizontales) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContent}
      >
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[styles.categoryPill, isActive && styles.categoryPillActive]}
              activeOpacity={0.8}
              onPress={() => setActiveCategory(cat.id)}
            >
              <Text style={{ marginRight: 4, fontSize: 13 }}>{cat.icon}</Text>
              <Text
                style={[
                  styles.categoryPillText,
                  isActive && styles.categoryPillTextActive,
                  { fontSize: scale(11) }
                ]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Filtros Rápidos */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, filterType === 'near' && styles.filterChipActive]}
          onPress={() => setFilterType('near')}
        >
          <Ionicons name="location" size={12} color={filterType === 'near' ? '#ffffff' : '#0d9488'} style={{ marginRight: 4 }} />
          <Text
            style={[
              styles.filterChipText,
              filterType === 'near' && styles.filterChipTextActive,
              { fontSize: scale(11) }
            ]}
          >
            Más cercanos (Mz 1-4)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filterType === 'recommended' && styles.filterChipActive]}
          onPress={() => setFilterType('recommended')}
        >
          <Ionicons name="star" size={12} color={filterType === 'recommended' ? '#ffffff' : '#f59e0b'} style={{ marginRight: 4 }} />
          <Text
            style={[
              styles.filterChipText,
              filterType === 'recommended' && styles.filterChipTextActive,
              { fontSize: scale(11) }
            ]}
          >
            Mejor valorados
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filterType === 'promos' && styles.filterChipActive]}
          onPress={() => setFilterType('promos')}
        >
          <Ionicons name="pricetag" size={12} color={filterType === 'promos' ? '#ffffff' : '#0284c7'} style={{ marginRight: 4 }} />
          <Text
            style={[
              styles.filterChipText,
              filterType === 'promos' && styles.filterChipTextActive,
              { fontSize: scale(11) }
            ]}
          >
            Económicos
          </Text>
        </TouchableOpacity>
      </View>

      {/* Radar de servicios */}
      <View style={styles.radarCard}>
        <View style={styles.radarIconWrap}>
          <MaterialCommunityIcons name="radar" size={24} color="#0d9488" />
        </View>
        <View style={styles.radarDetails}>
          <Text style={[styles.radarTitle, { fontSize: scale(12) }]}>Radar Barrial VeciRed</Text>
          <Text style={[styles.radarSub, { fontSize: scale(11) }]}>
            {totalCount} oficios y servicios disponibles en Mz 2 (Zona A)
          </Text>
          <Text style={[styles.radarNumber, { fontSize: scale(10) }]}>Red Vecinal Activa • Zona A</Text>
        </View>
        <TouchableOpacity
          style={styles.radarPublishBtn}
          activeOpacity={0.85}
          onPress={() => onNavigate('publish', { type: 'servicio' })}
        >
          <Ionicons name="add" size={14} color="#ffffff" style={{ marginRight: 2 }} />
          <Text style={styles.radarArrow}>Publicar</Text>
        </TouchableOpacity>
      </View>

      {/* Título de Sección */}
      <View style={styles.sectionTitleRow}>
        <Text style={[styles.sectionTitle, { fontSize: scale(14) }]}>
          Servicios en el Barrio ({services.length})
        </Text>
      </View>

      {/* Lista de Servicios */}
      {loading ? (
        <View style={{ paddingVertical: 40, alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={{ marginTop: 10, color: COLORS.textSecondary, fontSize: scale(12) }}>
            Consultando servicios comunitarios...
          </Text>
        </View>
      ) : services.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={{ fontSize: 36, marginBottom: 8 }}>🏪</Text>
          <Text style={[styles.emptyTitle, { fontSize: scale(14) }]}>
            No hay servicios en esta sección
          </Text>
          <Text style={[styles.emptySub, { fontSize: scale(12) }]}>
            Aún no hay publicaciones en la base de datos para esta búsqueda. ¡Sé el primero en ofrecer un servicio para tus vecinos!
          </Text>
          <TouchableOpacity
            style={styles.emptyPublishBtn}
            activeOpacity={0.85}
            onPress={() => onNavigate('publish', { type: 'servicio' })}
          >
            <Ionicons name="add" size={15} color="#ffffff" style={{ marginRight: 4 }} />
            <Text style={styles.emptyPublishBtnText}>Publicar Mi Primer Servicio</Text>
          </TouchableOpacity>
        </View>
      ) : (
        services.map((service) => (
          <TouchableOpacity
            key={service.id}
            style={styles.serviceItemCard}
            activeOpacity={0.9}
            onPress={() => handleServiceSelect(service)}
          >
            <View style={styles.serviceItemTop}>
              {service.provider_avatar && service.provider_avatar.startsWith('http') && !service.provider_avatar.includes('unsplash.com') ? (
                <Image
                  source={{ uri: service.provider_avatar }}
                  style={styles.providerAvatar}
                />
              ) : (
                <View style={styles.avatarCircleWrap}>
                  <Text style={{ fontSize: 24 }}>
                    {service.provider_avatar && !service.provider_avatar.startsWith('http') ? service.provider_avatar : '👤'}
                  </Text>
                </View>
              )}
              <View style={styles.providerInfo}>
                <View style={styles.vistoBuenoBadge}>
                  <Ionicons name="shield-checkmark" size={11} color="#0d9488" style={{ marginRight: 3 }} />
                  <Text style={styles.vistoBuenoText}>Visto Bueno Vecinal</Text>
                </View>
                <Text style={[styles.providerName, { fontSize: scale(13) }]}>
                  {service.provider_name || service.user?.full_name || 'Vecino'}
                </Text>
                <Text style={[styles.providerSkill, { fontSize: scale(11) }]}>
                  {service.category_name || service.category || 'Oficio local'}
                </Text>
              </View>
              <View style={styles.ratingBadge}>
                <Text style={styles.ratingStar}>★</Text>
                <Text style={[styles.ratingNumber, { fontSize: scale(12) }]}>
                  {service.rating ? Number(service.rating).toFixed(1) : '5.0'}
                </Text>
              </View>
            </View>

            <Text style={[styles.serviceTitle, { fontSize: scale(14) }]}>{service.title}</Text>
            {service.description ? (
              <Text style={[styles.serviceDescription, { fontSize: scale(12) }]} numberOfLines={2}>
                {service.description}
              </Text>
            ) : null}

            <View style={styles.serviceItemBottom}>
              <Text style={[styles.priceTag, { fontSize: scale(12) }]}>
                {service.price_from
                  ? `Desde S/ ${Number(service.price_from || 0).toFixed(2)} / ${service.price_unit || 'servicio'}`
                  : 'A coordinar con el vecino'}
              </Text>

              <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                <TouchableOpacity
                  style={styles.detailButton}
                  onPress={() => handleServiceSelect(service)}
                >
                  <Text style={[styles.detailButtonText, { fontSize: scale(11) }]}>Ficha</Text>
                </TouchableOpacity>

                {(() => {
                  const myId = user?.id || profile?.id;
                  const myName = (profile?.full_name || userProfile?.name || '').toLowerCase().trim();
                  const pName = (service.provider_name || service.user?.full_name || '').toLowerCase().trim();
                  const isMyService = (myId && (service.provider_id === myId || service.user_id === myId)) ||
                                      (myName && pName && (myName === pName || myName.includes(pName) || pName.includes(myName)));
                  if (isMyService) {
                    return (
                      <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                        <View style={styles.myServiceBadge}>
                          <Ionicons name="person-circle" size={13} color={COLORS.primaryDark} style={{ marginRight: 3 }} />
                          <Text style={[styles.myServiceBadgeText, { fontSize: scale(11) }]}>Tu publicación</Text>
                        </View>
                        <TouchableOpacity
                          style={styles.cardDeleteBtn}
                          activeOpacity={0.7}
                          onPress={() => confirmDeleteService(service)}
                        >
                          <Ionicons name="trash-outline" size={16} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    );
                  }
                  return (
                    <TouchableOpacity
                      style={styles.whatsappButton}
                      activeOpacity={0.8}
                      onPress={() => {
                        if (onOpenChat) {
                          onOpenChat({
                            name: service.provider_name || service.user?.full_name || 'Vecino',
                            topic: service.title,
                            avatar: service.provider_avatar && !service.provider_avatar.startsWith('http') ? service.provider_avatar : '👤',
                            zone: 'Zona A',
                            badge: 'Proveedor Verificado'
                          });
                        }
                      }}
                    >
                      <Text style={[styles.whatsappButtonText, { fontSize: scale(11) }]}>Contactar</Text>
                    </TouchableOpacity>
                  );
                })()}
              </View>
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  avatarCircleWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0'
  },
  cardDeleteBtn: {
    backgroundColor: '#fee2e2',
    padding: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fca5a5'
  },
  myServiceBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe'
  },
  myServiceBadgeText: {
    color: '#1d4ed8',
    fontWeight: '800'
  },

  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 90 },
  tabToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 14,
    padding: 3,
    marginBottom: 12
  },
  tabToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 11
  },
  tabToggleBtnActive: {
    backgroundColor: COLORS.primaryDark,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2
  },
  tabToggleBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary
  },
  tabToggleBtnTextActive: {
    color: '#ffffff'
  },
  radarPublishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryDark,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12
  },
  headerBox: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
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
    alignItems: 'center',
    flex: 1
  },
  headerTitle: { fontWeight: '900', color: COLORS.textPrimary },
  headerSub: { fontWeight: '600', color: COLORS.textSecondary },
  myServicesBtn: {
    backgroundColor: COLORS.primarySurface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.primaryPale
  },
  myServicesBtnText: {
    color: COLORS.primaryDark,
    fontWeight: '800'
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: COLORS.border
  },
  searchInput: {
    flex: 1,
    color: '#0f172a',
    fontWeight: '700',
    padding: 0
  },
  categoryScroll: { marginBottom: 12 },
  categoryContent: { gap: 6 },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  categoryPillActive: {
    backgroundColor: COLORS.primaryDark,
    borderColor: COLORS.primaryDark
  },
  categoryPillText: { fontWeight: '700', color: COLORS.textSecondary },
  categoryPillTextActive: { color: COLORS.white },
  filterRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  filterChip: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  filterChipActive: {
    backgroundColor: COLORS.primarySurface,
    borderColor: COLORS.primary
  },
  filterChipText: {
    color: COLORS.textSecondary,
    fontWeight: '600'
  },
  filterChipTextActive: {
    color: COLORS.primaryDark,
    fontWeight: '800'
  },
  radarCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1.5,
    borderColor: COLORS.primaryPale,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14
  },
  radarIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.primarySurface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  radarDetails: { flex: 1 },
  radarTitle: { fontWeight: '900', color: COLORS.textPrimary },
  radarSub: { fontWeight: '600', color: COLORS.textSecondary },
  radarNumber: { fontWeight: '900', color: COLORS.primaryDeep, marginTop: 2 },
  radarArrow: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: '800',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10
  },
  sectionTitleRow: { marginBottom: 10 },
  sectionTitle: { fontWeight: '900', color: COLORS.textPrimary },
  emptyContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    marginBottom: 14
  },
  emptyTitle: {
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 6
  },
  emptySub: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18
  },
  emptyPublishBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14
  },
  emptyPublishBtnText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 13
  },
  serviceItemCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2
  },
  serviceItemTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  providerAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 12
  },
  providerInfo: { flex: 1 },
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
    fontWeight: '800',
    color: '#92400e'
  },
  providerName: { fontWeight: '800', color: COLORS.textPrimary },
  providerSkill: { color: COLORS.textSecondary },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10
  },
  ratingStar: { color: '#f59e0b', fontSize: 12, marginRight: 2 },
  ratingNumber: { fontWeight: '800', color: '#b45309' },
  serviceTitle: { fontWeight: '800', color: COLORS.textPrimary, marginBottom: 4 },
  serviceDescription: { color: COLORS.textSecondary, lineHeight: 17, marginBottom: 10 },
  serviceItemBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: 10
  },
  priceTag: { fontWeight: '800', color: COLORS.primaryDark },
  detailButton: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1'
  },
  detailButtonText: {
    color: '#334155',
    fontWeight: '700'
  },
  whatsappButton: {
    backgroundColor: '#25D366',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8
  },
  whatsappButtonText: {
    color: COLORS.white,
    fontWeight: '800'
  }
});
