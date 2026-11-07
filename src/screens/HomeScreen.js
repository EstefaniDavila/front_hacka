import React from 'react';
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
import { mockServices } from '../data/mockData';

export default function HomeScreen({ onNavigate, fontScale = 1.0, onOpenDetail }) {
  const scale = (val) => Math.round(val * fontScale);

  const gasfitero = mockServices.find(s => s.id === 'srv-004') || mockServices[0];

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
        <View style={styles.searchBar}>
          <Text style={{ fontSize: 16, marginRight: 6 }}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { fontSize: scale(12) }]}
            placeholder="Ej. Necesito un electricista..."
            placeholderTextColor="#94a3b8"
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

      {/* Tarjeta Gasfitería (Idéntica al Mockup) */}
      <TouchableOpacity
        style={styles.providerCard}
        activeOpacity={0.85}
        onPress={() => {
          if (onOpenDetail) {
            onOpenDetail(gasfitero, 'service');
          } else {
            onNavigate('services');
          }
        }}
      >
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=300' }}
          style={styles.providerImage}
        />
        <View style={styles.providerDetails}>
          <Text style={[styles.providerTitle, { fontSize: scale(13) }]}>
            {gasfitero.title}
          </Text>
          <Text style={[styles.providerLocation, { fontSize: scale(11) }]}>
            📍 A {gasfitero.distance_m} m • Zona A, Mz. 2
          </Text>
          
          <View style={styles.ratingRow}>
            <Text style={[styles.ratingText, { fontSize: scale(11) }]}>
              ⭐ {gasfitero.rating_avg} ({gasfitero.endorsements_count} recomendaciones)
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

      {/* Banner Invitación a Publicar */}
      <TouchableOpacity
        style={styles.publishBanner}
        activeOpacity={0.85}
        onPress={() => onNavigate('products')}
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
    padding: 14,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  chevron: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.textSecondary
  },
  gridCardTitle: {
    fontWeight: '900',
    color: COLORS.textPrimary,
    marginBottom: 2
  },
  gridCardSub: {
    fontWeight: '600',
    color: COLORS.textSecondary
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
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
