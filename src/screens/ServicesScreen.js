import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Image,
  Alert
} from 'react-native';
import { COLORS } from '../theme/colors';
import { api } from '../api/apiClient';

export default function ServicesScreen({ onNavigate, fontScale = 1.0, onOpenChat, onOpenDetail }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [filterType, setFilterType] = useState('near'); // near, recommended, promos
  const [servicesList, setServicesList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadServices();
  }, [searchQuery, activeCategory]);

  const loadServices = async () => {
    try {
      const data = await api.getServices({ q: searchQuery });
      const filtered = (data || []).filter((srv) => {
        const cat = (srv.category_name || '').toLowerCase();
        if (activeCategory === 'all') return true;
        if (activeCategory === 'oficios') return cat.includes('electr') || cat.includes('gasfit') || cat.includes('plom') || cat.includes('repar') || cat.includes('alba');
        if (activeCategory === 'clases') return cat.includes('docen') || cat.includes('clase') || cat.includes('apoyo');
        if (activeCategory === 'hogar') return cat.includes('limp') || cat.includes('costura');
        if (activeCategory === 'cocina') return cat.includes('cocin') || cat.includes('repost');
        return true;
      });
      setServicesList(filtered);
    } catch {
      setServicesList([]);
    }
  };

  const scale = (val) => Math.round(val * fontScale);

  const categories = [
    { id: 'all', name: 'Todos', icon: '▦' },
    { id: 'oficios', name: 'Oficios y rep.', icon: '🔧' },
    { id: 'hogar', name: 'Costura / Hogar', icon: '🧵' },
    { id: 'cocina', name: 'Cocina / Menú', icon: '🍲' },
    { id: 'clases', name: 'Clases', icon: '🎓' }
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      
      {/* Cabecera Violeta Suave */}
      <View style={styles.headerBox}>
        <View style={styles.headerTitleRow}>
          <View style={styles.headerLeft}>
            <Text style={{ fontSize: 24, marginRight: 8 }}>🔧</Text>
            <View>
              <Text style={[styles.headerTitle, { fontSize: scale(17) }]}>
                Servicios Cercanos
              </Text>
              <Text style={[styles.headerSub, { fontSize: scale(11) }]}>
                Oficios y habilidades de tus vecinos • Zona A
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.publishShortcutBtn}
            activeOpacity={0.8}
            onPress={() => onNavigate('publish')}
          >
            <Text style={[styles.publishShortcutText, { fontSize: scale(11) }]}>
              + Ofrecer
            </Text>
          </TouchableOpacity>
        </View>

        {/* Buscador */}
        <View style={styles.searchBar}>
          <Text style={{ fontSize: 16, marginRight: 6 }}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { fontSize: scale(12) }]}
            placeholder="Buscar electricista, gasfitero, costura..."
            placeholderTextColor="#94a3b8"
            returnKeyType="search"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={{ fontSize: 14, color: COLORS.textMuted }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Categorías Principales */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll} contentContainerStyle={{ gap: 6, paddingVertical: 4 }}>
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[styles.categoryPill, isActive && styles.categoryPillActive]}
              onPress={() => setActiveCategory(cat.id)}
            >
              <Text style={{ fontSize: 13, marginRight: 4 }}>{cat.icon}</Text>
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
            🏷️ Promociones
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
            Servicios en tu zona
          </Text>
          <Text style={[styles.radarSub, { fontSize: scale(10) }]}>
            Zona A, a menos de 1 km
          </Text>
          <Text style={[styles.radarNumber, { fontSize: scale(18) }]}>
            {servicesList.length} {servicesList.length === 1 ? 'servicio disponible' : 'servicios disponibles'}
          </Text>
        </View>
        <Text style={styles.radarArrow}>➔</Text>
      </View>

      {/* Lista de Prestadores Recomendados o Empty State */}
      <View style={styles.sectionTitleRow}>
        <Text style={[styles.sectionTitle, { fontSize: scale(14) }]}>
          ⭐ Recomendados por tus vecinos
        </Text>
      </View>

      {servicesList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={{ fontSize: 44, marginBottom: 10 }}>🔧</Text>
          <Text style={[styles.emptyTitle, { fontSize: scale(15) }]}>
            Aún no hay oficios registrados en tu manzana
          </Text>
          <Text style={[styles.emptySub, { fontSize: scale(11) }]}>
            ¿Tienes habilidades en gasfitería, electricidad, costura o cuidado? ¡Regístralas para tus vecinos!
          </Text>
          <TouchableOpacity
            style={styles.emptyPublishBtn}
            onPress={() => onNavigate('publish')}
          >
            <Text style={styles.emptyPublishBtnText}>+ Ofrecer Mi Servicio</Text>
          </TouchableOpacity>
        </View>
      ) : (
        servicesList.map((service) => (
          <TouchableOpacity
            key={service.id}
            style={styles.serviceItemCard}
            activeOpacity={0.88}
            onPress={() => {
              if (onOpenDetail) onOpenDetail(service, 'service');
            }}
          >
            <View style={styles.serviceItemTop}>
              {service.provider_avatar ? (
                <Image source={{ uri: service.provider_avatar }} style={styles.providerAvatar} />
              ) : (
                <View style={[styles.providerAvatar, styles.noAvatar]}>
                  <Text style={{ fontSize: 28 }}>👨‍🔧</Text>
                </View>
              )}
              <View style={styles.providerInfo}>
                <View style={styles.vistoBuenoBadge}>
                  <Text style={styles.vistoBuenoText}>★ Visto Bueno Vecinal</Text>
                </View>
                <Text style={[styles.providerName, { fontSize: scale(13) }]}>
                  {service.provider_name || 'Vecino'}
                </Text>
                <Text style={[styles.serviceTitle, { fontSize: scale(11) }]}>
                  {service.title}
                </Text>
                <Text style={[styles.ratingRow, { fontSize: scale(11) }]}>
                  ⭐ {service.rating_avg || 5.0} ({service.endorsements_count || 0}) • 📍 {service.distance_m || 250} m
                </Text>
              </View>
            </View>

            <Text style={[styles.serviceDesc, { fontSize: scale(11) }]} numberOfLines={2}>
              {service.description}
            </Text>

            <View style={styles.serviceFooterRow}>
              <Text style={[styles.servicePrice, { fontSize: scale(12) }]}>
                Desde S/ {Number(service.price_from || 0).toFixed(2)}
              </Text>
              <TouchableOpacity
                style={styles.whatsappButton}
                activeOpacity={0.8}
                onPress={() => {
                  if (onOpenChat) {
                    onOpenChat({
                      name: service.provider_name || 'Vecino',
                      topic: service.title,
                      avatar: service.provider_avatar || '👨‍🔧',
                      zone: 'Zona A',
                      badge: 'Proveedor Verificado',
                      phone: service.phone || service.provider_phone || '987-654-321'
                    });
                  } else {
                    Alert.alert('💬 Chat Vecinal', `Iniciando chat con ${service.provider_name || 'Vecino'}...`);
                  }
                }}
              >
                <Text style={[styles.whatsappButtonText, { fontSize: scale(11) }]}>
                  💬 Contactar
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))
      )}

      {/* Banner de Emergencia Inferior (Rojo) */}
      <TouchableOpacity
        style={styles.emergencySupportCard}
        activeOpacity={0.85}
        onPress={() => onNavigate('emergency')}
      >
        <Text style={{ fontSize: 26, marginRight: 10 }}>🚨</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.emergencySupportTitle, { fontSize: scale(13) }]}>
            ¿Tienes una emergencia domiciliaria urgente?
          </Text>
          <Text style={[styles.emergencySupportSub, { fontSize: scale(10) }]}>
            Fugas de gas, aniegos o corte eléctrico: pide brigada vecinal.
          </Text>
        </View>
        <View style={styles.emergencyBtn}>
          <Text style={styles.emergencyBtnText}>Ver ›</Text>
        </View>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 28 },
  headerBox: {
    backgroundColor: '#f5f3ff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ede9fe',
    marginBottom: 12
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  headerTitle: { fontWeight: '900', color: COLORS.purpleDark },
  headerSub: { fontWeight: '600', color: COLORS.textSecondary },
  publishShortcutBtn: {
    backgroundColor: COLORS.purple,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12
  },
  publishShortcutText: { color: COLORS.white, fontWeight: '800' },
  searchBar: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  searchInput: { flex: 1, fontWeight: '600', color: '#0f172a' },
  categoriesScroll: { marginBottom: 10 },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  categoryPillActive: { backgroundColor: COLORS.purple, borderColor: COLORS.purple },
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
  filterChipActive: { backgroundColor: '#f3e8ff', borderColor: COLORS.purple },
  filterChipText: { fontWeight: '700', color: COLORS.textMuted },
  filterChipTextActive: { color: COLORS.purpleDark },
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
  radarArrow: { fontSize: 18, color: COLORS.primary, fontWeight: '900' },
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
    backgroundColor: COLORS.purple,
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
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2
  },
  serviceItemTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  providerAvatar: {
    width: 58,
    height: 58,
    borderRadius: 16,
    marginRight: 12
  },
  noAvatar: {
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center'
  },
  providerInfo: { flex: 1 },
  vistoBuenoBadge: {
    backgroundColor: '#ede9fe',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    marginBottom: 3
  },
  vistoBuenoText: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.purple
  },
  providerName: { fontWeight: '900', color: COLORS.textPrimary },
  serviceTitle: { fontWeight: '700', color: COLORS.primaryDark },
  ratingRow: { fontWeight: '700', color: COLORS.textSecondary, marginTop: 2 },
  serviceDesc: { color: COLORS.textSecondary, marginBottom: 10, lineHeight: 16 },
  serviceFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 8
  },
  servicePrice: { fontWeight: '900', color: COLORS.primaryDeep },
  whatsappButton: {
    backgroundColor: COLORS.emerald,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12
  },
  whatsappButtonText: { color: COLORS.white, fontWeight: '900' },
  emergencySupportCard: {
    backgroundColor: COLORS.emergencySurface,
    borderWidth: 1.5,
    borderColor: COLORS.emergencyPale,
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6
  },
  emergencySupportTitle: { fontWeight: '900', color: COLORS.emergencyDark },
  emergencySupportSub: { fontWeight: '600', color: '#991b1b', marginTop: 2 },
  emergencyBtn: {
    backgroundColor: COLORS.emergency,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10
  },
  emergencyBtnText: { color: COLORS.white, fontWeight: '900', fontSize: 10 }
});
