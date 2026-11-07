import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator
} from 'react-native';
import { COLORS } from '../theme/colors';
import { api } from '../services/api';

export default function HomeScreen({ onNavigate, fontScale = 1.0 }) {
  const [recommendedServices, setRecommendedServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);

  const scale = (val) => Math.round(val * fontScale);

  useEffect(() => {
    loadRecommended();
  }, []);

  const loadRecommended = async () => {
    try {
      setLoadingServices(true);
      const res = await api.getServices({ sort_by: 'rating', limit: 3 });
      if (res && Array.isArray(res.items) && res.items.length > 0) {
        setRecommendedServices(res.items);
      }
    } catch (err) {
      console.warn('[HomeScreen] Error al cargar recomendados:', err);
    } finally {
      setLoadingServices(false);
    }
  };

  const topService = recommendedServices.length > 0 ? recommendedServices[0] : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Header Héroe Verde Azulado (Teal) */}
      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <Text style={{ fontSize: 20 }}>✨</Text>
          <Text style={[styles.heroTitle, { fontSize: scale(17) }]}>
            ¿Qué necesitas hoy?
          </Text>
        </View>
        <Text style={[styles.heroSubtitle, { fontSize: scale(12) }]}>
          Encuentra ayuda, servicios o productos cerca de ti con Inteligencia Artificial.
        </Text>

        {/* Buscador IA con Micrófono */}
        <TouchableOpacity
          style={styles.searchBar}
          activeOpacity={0.9}
          onPress={() => onNavigate('services')}
        >
          <Text style={{ fontSize: 16, marginRight: 6 }}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { fontSize: scale(12) }]}
            placeholder="Ej. Necesito un electricista..."
            placeholderTextColor="#94a3b8"
            editable={false}
          />
          <TouchableOpacity style={styles.micButton} onPress={() => onNavigate('services')}>
            <Text style={{ fontSize: 16 }}>🎙️</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </View>

      {/* Grid 2x2 de los 4 Cuadrantes Principales */}
      <View style={styles.gridContainer}>
        {/* 1. Servicios Cercanos */}
        <TouchableOpacity
          style={[styles.gridCard, { backgroundColor: '#f0fdfa', borderColor: '#ccfbf1' }]}
          activeOpacity={0.8}
          onPress={() => onNavigate('services')}
        >
          <View style={styles.cardHeaderRow}>
            <Text style={{ fontSize: 24 }}>🔧</Text>
            <Text style={styles.chevron}>›</Text>
          </View>
          <Text style={[styles.gridCardTitle, { fontSize: scale(13) }]}>
            Servicios cercanos
          </Text>
          <Text style={[styles.gridCardSub, { fontSize: scale(10) }]}>
            Oficios y profesionales de tu zona
          </Text>
        </TouchableOpacity>

        {/* 2. Ayuda Solidaria */}
        <TouchableOpacity
          style={[styles.gridCard, { backgroundColor: '#f5f3ff', borderColor: '#ddd6fe' }]}
          activeOpacity={0.8}
          onPress={() => onNavigate('solidarity')}
        >
          <View style={styles.cardHeaderRow}>
            <Text style={{ fontSize: 24 }}>🤝</Text>
            <Text style={styles.chevron}>›</Text>
          </View>
          <Text style={[styles.gridCardTitle, { fontSize: scale(13) }]}>
            Ayuda solidaria
          </Text>
          <Text style={[styles.gridCardSub, { fontSize: scale(10) }]}>
            Pide u ofrece apoyo entre vecinos
          </Text>
        </TouchableOpacity>

        {/* 3. Productos Locales */}
        <TouchableOpacity
          style={[styles.gridCard, { backgroundColor: '#fffbeb', borderColor: '#fef3c7' }]}
          activeOpacity={0.8}
          onPress={() => onNavigate('publish')}
        >
          <View style={styles.cardHeaderRow}>
            <Text style={{ fontSize: 24 }}>🏪</Text>
            <Text style={styles.chevron}>›</Text>
          </View>
          <Text style={[styles.gridCardTitle, { fontSize: scale(13) }]}>
            Productos locales
          </Text>
          <Text style={[styles.gridCardSub, { fontSize: scale(10) }]}>
            Compra a emprendedores barriales
          </Text>
        </TouchableOpacity>

        {/* 4. Emergencias (Color Rojo) */}
        <TouchableOpacity
          style={[styles.gridCard, { backgroundColor: COLORS.emergencySurface, borderColor: COLORS.emergencyPale }]}
          activeOpacity={0.8}
          onPress={() => onNavigate('emergency')}
        >
          <View style={styles.cardHeaderRow}>
            <Text style={{ fontSize: 24 }}>🚨</Text>
            <Text style={[styles.chevron, { color: COLORS.emergency }]}>›</Text>
          </View>
          <Text style={[styles.gridCardTitle, { fontSize: scale(13), color: COLORS.emergencyDark }]}>
            Emergencias
          </Text>
          <Text style={[styles.gridCardSub, { fontSize: scale(10), color: '#991b1b' }]}>
            Reporta y coordina apoyo vecinal
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sección: Recomendados por tus Vecinos */}
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionTitle, { fontSize: scale(14) }]}>
          Recomendados por tus vecinos
        </Text>
        <TouchableOpacity onPress={() => onNavigate('services')}>
          <Text style={[styles.seeMoreText, { fontSize: scale(11) }]}>
            Ver más ›
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tarjeta de Servicio Destacado */}
      {topService ? (
        <TouchableOpacity
          style={styles.providerCard}
          activeOpacity={0.85}
          onPress={() => onNavigate('service_detail', { serviceId: topService.id })}
        >
          <Image
            source={{
              uri: topService.provider_avatar || 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=300'
            }}
            style={styles.providerImage}
          />
          <View style={styles.providerDetails}>
            <Text style={[styles.providerTitle, { fontSize: scale(13) }]}>
              {topService.title}
            </Text>
            <Text style={[styles.providerLocation, { fontSize: scale(11) }]}>
              📍 A {topService.distance_m || 350} m • {topService.community_name || 'Comunidad Barrial'}
            </Text>

            <View style={styles.ratingRow}>
              <Text style={[styles.ratingText, { fontSize: scale(11) }]}>
                ⭐ {topService.rating_avg > 0 ? topService.rating_avg.toFixed(1) : 'Nuevo'} ({topService.reviews_count} recomendaciones)
              </Text>
            </View>

            <View style={styles.verifiedBadge}>
              <Text style={[styles.verifiedBadgeText, { fontSize: scale(10) }]}>
                ✓ Vecino verificado
              </Text>
            </View>
          </View>
          <Text style={styles.cardArrow}>›</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.providerCard}
          activeOpacity={0.85}
          onPress={() => onNavigate('services')}
        >
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=300' }}
            style={styles.providerImage}
          />
          <View style={styles.providerDetails}>
            <Text style={[styles.providerTitle, { fontSize: scale(13) }]}>
              Servicios de Proximidad en tu Zona
            </Text>
            <Text style={[styles.providerLocation, { fontSize: scale(11) }]}>
              📍 Profesionales cerca de ti • Zona A
            </Text>
            <View style={styles.ratingRow}>
              <Text style={[styles.ratingText, { fontSize: scale(11) }]}>
                ⭐ Red de economía local
              </Text>
            </View>
            <View style={styles.verifiedBadge}>
              <Text style={[styles.verifiedBadgeText, { fontSize: scale(10) }]}>
                ✓ Explora servicios
              </Text>
            </View>
          </View>
          <Text style={styles.cardArrow}>›</Text>
        </TouchableOpacity>
      )}

      {/* Banner Invitación a Publicar */}
      <TouchableOpacity
        style={styles.publishBanner}
        activeOpacity={0.85}
        onPress={() => onNavigate('publish')}
      >
        <View style={styles.publishBannerLeft}>
          <Text style={{ fontSize: 24, marginRight: 8 }}>📢</Text>
          <View>
            <Text style={[styles.publishBannerTitle, { fontSize: scale(12) }]}>
              ¿Ofreces algún oficio o vendes algo?
            </Text>
            <Text style={[styles.publishBannerSub, { fontSize: scale(10) }]}>
              Publica en 1 minuto y llega a tus vecinos cercanos.
            </Text>
          </View>
        </View>
        <Text style={styles.publishBannerBtn}>+ Publicar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  content: {
    padding: 16,
    paddingBottom: 90
  },
  heroCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 22,
    padding: 16,
    marginBottom: 16,
    shadowColor: COLORS.primaryDark,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4
  },
  heroTitle: {
    fontWeight: '900',
    color: COLORS.white
  },
  heroSubtitle: {
    fontWeight: '500',
    color: COLORS.primaryPale,
    lineHeight: 18,
    marginBottom: 14
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
  micButton: {
    padding: 4
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 18
  },
  gridCard: {
    width: '48%',
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 14,
    minHeight: 110,
    justifyContent: 'space-between'
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  chevron: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.primary
  },
  gridCardTitle: {
    fontWeight: '900',
    color: COLORS.text,
    marginTop: 6
  },
  gridCardSub: {
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginTop: 2
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  sectionTitle: {
    fontWeight: '900',
    color: COLORS.text
  },
  seeMoreText: {
    color: COLORS.primary,
    fontWeight: '700'
  },
  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1
  },
  providerImage: {
    width: 60,
    height: 60,
    borderRadius: 14,
    marginRight: 12
  },
  providerDetails: {
    flex: 1
  },
  providerTitle: {
    fontWeight: '800',
    color: COLORS.text
  },
  providerLocation: {
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginTop: 2
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4
  },
  ratingText: {
    color: '#854d0e',
    fontWeight: '700'
  },
  verifiedBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 4
  },
  verifiedBadgeText: {
    color: '#065f46',
    fontWeight: '800'
  },
  cardArrow: {
    fontSize: 22,
    color: COLORS.textMuted,
    fontWeight: '800',
    paddingLeft: 6
  },
  publishBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 16,
    padding: 12,
    marginBottom: 14
  },
  publishBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  publishBannerTitle: {
    fontWeight: '800',
    color: '#92400e'
  },
  publishBannerSub: {
    color: '#b45309',
    fontWeight: '500',
    marginTop: 1
  },
  publishBannerBtn: {
    backgroundColor: '#f59e0b',
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 11,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8
  }
});
