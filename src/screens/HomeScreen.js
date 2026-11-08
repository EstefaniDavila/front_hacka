import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Image
} from 'react-native';
import { COLORS } from '../theme/colors';
import { api } from '../api/apiClient';

export default function HomeScreen({ onNavigate, fontScale = 1.0, onOpenDetail }) {
  const scale = (val) => Math.round(val * fontScale);
  const [featuredService, setFeaturedService] = useState(null);

  useEffect(() => {
    api.getServices().then(services => {
      if (services && services.length > 0) {
        setFeaturedService(services[0]);
      } else {
        setFeaturedService(null);
      }
    }).catch(() => setFeaturedService(null));
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}>
      
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
        <View style={styles.searchBar}>
          <Text style={{ fontSize: 16, marginRight: 6 }}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { fontSize: scale(12) }]}
            placeholder="Ej. Necesito un electricista..."
            placeholderTextColor="#94a3b8"
            returnKeyType="search"
          />
          <TouchableOpacity style={styles.micButton} onPress={() => alert('🎙️ Dictado por voz IA activado')}>
            <Text style={{ fontSize: 16 }}>🎙️</Text>
          </TouchableOpacity>
        </View>
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
          onPress={() => onNavigate('products')}
        >
          <View style={styles.cardHeaderRow}>
            <Text style={{ fontSize: 24 }}>🏪</Text>
            <Text style={styles.chevron}>›</Text>
          </View>
          <Text style={[styles.gridCardTitle, { fontSize: scale(13) }]}>
            Productos locales
          </Text>
          <Text style={[styles.gridCardSub, { fontSize: scale(10) }]}>
            Panadería, comida y abarrotes
          </Text>
        </TouchableOpacity>

        {/* 4. Emergencias Comunitarias */}
        <TouchableOpacity
          style={[styles.gridCard, { backgroundColor: '#fef2f2', borderColor: '#fee2e2' }]}
          activeOpacity={0.8}
          onPress={() => onNavigate('emergency')}
        >
          <View style={styles.cardHeaderRow}>
            <Text style={{ fontSize: 24 }}>🚨</Text>
            <Text style={styles.chevron}>›</Text>
          </View>
          <Text style={[styles.gridCardTitle, { fontSize: scale(13) }]}>
            Emergencias
          </Text>
          <Text style={[styles.gridCardSub, { fontSize: scale(10) }]}>
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

      {/* Tarjeta de Servicio Destacado si existe, o Empty State limpio */}
      {featuredService ? (
        <TouchableOpacity
          style={styles.providerCard}
          activeOpacity={0.85}
          onPress={() => {
            if (onOpenDetail) {
              onOpenDetail(featuredService, 'service');
            } else {
              onNavigate('services');
            }
          }}
        >
          <Image
            source={{ uri: featuredService.image_url || 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=300' }}
            style={styles.providerImage}
          />
          <View style={styles.providerDetails}>
            <Text style={[styles.providerTitle, { fontSize: scale(13) }]}>
              {featuredService.title}
            </Text>
            <Text style={[styles.providerLocation, { fontSize: scale(11) }]}>
              📍 A {featuredService.distance_m || 300} m • Zona A
            </Text>
            
            <View style={styles.ratingRow}>
              <Text style={[styles.ratingText, { fontSize: scale(11) }]}>
                ⭐ {featuredService.rating_avg || 5.0} ({featuredService.reviews_count || 0} recomendaciones)
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
        <View style={styles.emptyFeaturedCard}>
          <Text style={{ fontSize: 32, marginBottom: 8 }}>🏘️</Text>
          <Text style={[styles.emptyFeaturedTitle, { fontSize: scale(13) }]}>
            Aún no hay publicaciones en tu manzana
          </Text>
          <Text style={[styles.emptyFeaturedSub, { fontSize: scale(11) }]}>
            Tu red comunitaria está lista para empezar desde cero con datos reales de la BD.
          </Text>
          <TouchableOpacity
            style={styles.emptyFeaturedBtn}
            onPress={() => onNavigate('publish')}
          >
            <Text style={styles.emptyFeaturedBtnText}>+ Publicar Producto o Servicio</Text>
          </TouchableOpacity>
        </View>
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
    paddingBottom: 24
  },
  heroCard: {
    backgroundColor: COLORS.primaryDeep,
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    shadowColor: COLORS.primaryDeep,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6
  },
  heroTitle: {
    color: COLORS.white,
    fontWeight: '900',
    marginLeft: 6
  },
  heroSubtitle: {
    color: '#ccfbf1',
    fontWeight: '500',
    marginBottom: 14,
    lineHeight: 18
  },
  searchBar: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  searchInput: {
    flex: 1,
    fontWeight: '600',
    color: '#0f172a'
  },
  micButton: {
    backgroundColor: '#f1f5f9',
    padding: 6,
    borderRadius: 8
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20
  },
  gridCard: {
    width: '48%',
    flexGrow: 1,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1.5
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  chevron: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textMuted
  },
  gridCardTitle: {
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 2
  },
  gridCardSub: {
    fontWeight: '500',
    color: COLORS.textSecondary
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  sectionTitle: {
    fontWeight: '900',
    color: COLORS.textPrimary
  },
  seeMoreText: {
    fontWeight: '800',
    color: COLORS.primaryDark
  },
  providerCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2
  },
  providerImage: {
    width: 66,
    height: 66,
    borderRadius: 14,
    marginRight: 12
  },
  providerDetails: {
    flex: 1
  },
  providerTitle: {
    fontWeight: '900',
    color: COLORS.textPrimary,
    marginBottom: 2
  },
  providerLocation: {
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 4
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4
  },
  ratingText: {
    fontWeight: '800',
    color: '#d97706'
  },
  verifiedBadge: {
    backgroundColor: COLORS.emeraldPale,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999
  },
  verifiedBadgeText: {
    fontWeight: '800',
    color: COLORS.emerald
  },
  cardArrow: {
    fontSize: 20,
    color: COLORS.textMuted,
    fontWeight: '900',
    marginLeft: 6
  },
  emptyFeaturedCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    marginBottom: 14
  },
  emptyFeaturedTitle: {
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 4
  },
  emptyFeaturedSub: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 16
  },
  emptyFeaturedBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12
  },
  emptyFeaturedBtnText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 12
  },
  publishBanner: {
    backgroundColor: COLORS.primarySurface,
    borderWidth: 1,
    borderColor: COLORS.primaryPale,
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  publishBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  publishBannerTitle: {
    fontWeight: '800',
    color: COLORS.primaryDeep
  },
  publishBannerSub: {
    fontWeight: '600',
    color: COLORS.primaryDark
  },
  publishBannerBtn: {
    backgroundColor: COLORS.primary,
    color: COLORS.white,
    fontWeight: '900',
    fontSize: 11,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10
  }
});
