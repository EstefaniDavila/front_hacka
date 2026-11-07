import React, { useState } from 'react';
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
import { mockServices } from '../data/mockData';

export default function ServicesScreen({ onNavigate, fontScale = 1.0, onOpenChat, onOpenDetail }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [filterType, setFilterType] = useState('near'); // near, recommended, promos

  const scale = (val) => Math.round(val * fontScale);

  const categories = [
    { id: 'all', name: 'Todos', icon: '▦' },
    { id: 'oficios', name: 'Oficios y rep.', icon: '🔧' },
    { id: 'clases', name: 'Clases', icon: '🎓' },
    { id: 'hogar', name: 'Limpieza', icon: '🧹' },
    { id: 'mascotas', name: 'Mascotas', icon: '🐾' },
    { id: 'cargas', name: 'Movilidad', icon: '🚚' }
  ];

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
          <View style={styles.zoneChip}>
            <Text style={[styles.zoneChipText, { fontSize: scale(10) }]}>📍 Zona A</Text>
          </View>
        </View>

        {/* Buscador IA */}
        <View style={styles.searchBar}>
          <Text style={{ fontSize: 16, marginRight: 6 }}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { fontSize: scale(12) }]}
            placeholder="Ej. Necesito un electricista hoy..."
            placeholderTextColor="#94a3b8"
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={() => Alert.alert('🤖 VeciRed IA', 'Buscando profesionales verificados a menos de 500 metros...')}
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
            🏷️ Promociones
          </Text>
        </TouchableOpacity>
      </View>

      {/* Radar de Servicios Disponibles (24 servicios a < 1 km) */}
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
            24 servicios disponibles
          </Text>
        </View>
        <Text style={styles.radarArrow}>➔</Text>
      </View>

      {/* Lista de Prestadores Recomendados */}
      <View style={styles.sectionTitleRow}>
        <Text style={[styles.sectionTitle, { fontSize: scale(14) }]}>
          ⭐ Recomendados por tus vecinos
        </Text>
      </View>

      {mockServices.map((service) => (
        <TouchableOpacity
          key={service.id}
          style={styles.serviceItemCard}
          activeOpacity={0.88}
          onPress={() => {
            if (onOpenDetail) onOpenDetail(service, 'service');
          }}
        >
          <View style={styles.serviceItemTop}>
            <Image source={{ uri: service.provider_avatar }} style={styles.providerAvatar} />
            <View style={styles.providerInfo}>
              <View style={styles.vistoBuenoBadge}>
                <Text style={styles.vistoBuenoText}>★ Visto Bueno Vecinal</Text>
              </View>
              <Text style={[styles.providerName, { fontSize: scale(13) }]}>
                {service.provider_name}
              </Text>
              <Text style={[styles.serviceTitle, { fontSize: scale(11) }]}>
                {service.title}
              </Text>
              <Text style={[styles.ratingRow, { fontSize: scale(11) }]}>
                ⭐ {service.rating_avg} ({service.endorsements_count}) • 📍 {service.distance_m} m
              </Text>
            </View>
          </View>

          <Text style={[styles.serviceDesc, { fontSize: scale(11) }]} numberOfLines={2}>
            {service.description}
          </Text>

          <View style={styles.serviceFooterRow}>
            <Text style={[styles.servicePrice, { fontSize: scale(12) }]}>
              Desde S/ {service.price_from.toFixed(2)}
            </Text>
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
                    phone: service.phone
                  });
                } else {
                  Alert.alert('💬 Chat Vecinal', `Iniciando chat con ${service.provider_name} (${service.phone})...`);
                }
              }}
            >
              <Text style={[styles.whatsappButtonText, { fontSize: scale(11) }]}>
                💬 Contactar
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      ))}

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
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 90 },
  headerBox: {
    backgroundColor: COLORS.primaryDark,
    borderRadius: 22,
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
    fontWeight: '900',
    color: COLORS.white
  },
  headerSub: {
    fontWeight: '600',
    color: COLORS.primaryPale
  },
  zoneChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999
  },
  zoneChipText: {
    color: COLORS.white,
    fontWeight: '800'
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 7
  },
  searchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontWeight: '600'
  },
  sendButton: {
    backgroundColor: COLORS.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  categoriesScroll: {
    marginBottom: 12
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8
  },
  categoryPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primaryDark
  },
  categoryPillText: {
    fontWeight: '700',
    color: COLORS.textSecondary
  },
  categoryPillTextActive: {
    color: COLORS.white
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14
  },
  filterChip: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  filterChipActive: {
    backgroundColor: COLORS.primarySurface,
    borderColor: COLORS.primary
  },
  filterChipText: {
    fontWeight: '700',
    color: COLORS.textSecondary
  },
  filterChipTextActive: {
    color: COLORS.primaryDark
  },
  radarCard: {
    backgroundColor: COLORS.primarySurface,
    borderWidth: 1.5,
    borderColor: COLORS.primaryLight,
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  radarIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  radarDetails: { flex: 1 },
  radarTitle: { fontWeight: '800', color: COLORS.textPrimary },
  radarSub: { fontWeight: '600', color: COLORS.textSecondary },
  radarNumber: { fontWeight: '900', color: COLORS.primaryDeep, marginTop: 2 },
  radarArrow: { fontSize: 18, color: COLORS.primary, fontWeight: '900' },
  sectionTitleRow: { marginBottom: 10 },
  sectionTitle: { fontWeight: '900', color: COLORS.textPrimary },
  serviceItemCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2
  },
  serviceItemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  providerAvatar: {
    width: 58,
    height: 58,
    borderRadius: 16,
    marginRight: 12
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
