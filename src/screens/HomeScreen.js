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
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { api } from '../services/api';

export default function HomeScreen({ onNavigate, fontScale = 1.0, onOpenDetail }) {
  const scale = (val) => Math.round(val * fontScale);
  const [recommendedServices, setRecommendedServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    loadRecommended();
  }, []);

  const loadRecommended = async () => {
    try {
      setLoadingServices(true);
      const res = await api.getServices({ sort_by: 'rating', limit: 6 });
      if (res && Array.isArray(res.items) && res.items.length > 0) {
        setRecommendedServices(res.items.slice(0, 3));
      } else {
        setRecommendedServices([]);
      }
    } catch (err) {
      console.warn('[HomeScreen] Error al cargar recomendados:', err);
      setRecommendedServices([]);
    } finally {
      setLoadingServices(false);
    }
  };

  const handleSearchSubmit = () => {
    const query = searchText.trim();
    onNavigate('services', { search: query });
  };

  const startVoiceSearch = () => {
    if (typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)) {
      try {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = 'es-PE';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        setIsListening(true);

        recognition.onresult = (event) => {
          const spoken = event.results[0][0].transcript;
          setIsListening(false);
          setSearchText(spoken);
          onNavigate('services', { search: spoken });
        };

        recognition.onerror = () => {
          setIsListening(false);
          showVoicePrompt();
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.start();
      } catch {
        setIsListening(false);
        showVoicePrompt();
      }
    } else {
      showVoicePrompt();
    }
  };

  const showVoicePrompt = () => {
    Alert.alert(
      '🎙️ Búsqueda por Voz VeciRed',
      'Selecciona una búsqueda rápida o escribe en el buscador:',
      [
        { text: '⚡ Electricista', onPress: () => { setSearchText('Electricista'); onNavigate('services', { search: 'Electricista' }); } },
        { text: '🔧 Gasfitería', onPress: () => { setSearchText('Gasfitería'); onNavigate('services', { search: 'Gasfitería' }); } },
        { text: '🍞 Panadería / Tienda', onPress: () => onNavigate('products') },
        { text: 'Cancelar', style: 'cancel' }
      ]
    );
  };

  const handleServicePress = (service) => {
    if (onOpenDetail) {
      onOpenDetail(service, 'service');
    } else if (service?.id) {
      onNavigate('service_detail', { serviceId: service.id });
    } else {
      onNavigate('services');
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={false}
    >
      {/* Header Héroe Verde Azulado (Teal) */}
      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <Ionicons name="sparkles" size={20} color="#fef08a" style={{ marginRight: 6 }} />
          <Text style={[styles.heroTitle, { fontSize: scale(17) }]}>
            ¿Qué necesitas hoy?
          </Text>
        </View>
        <Text style={[styles.heroSubtitle, { fontSize: scale(12) }]}>
          Encuentra ayuda, oficios o productos cerca de ti con Inteligencia Artificial.
        </Text>

        {/* Buscador Interactivo con Micrófono Real */}
        <View style={styles.searchBar}>
          <TouchableOpacity onPress={handleSearchSubmit} style={{ padding: 4 }}>
            <Ionicons name="search" size={18} color="#0d9488" />
          </TouchableOpacity>

          <TextInput
            style={[styles.searchInput, { fontSize: scale(12) }]}
            placeholder={isListening ? "Escuchando tu voz en Zona A..." : "Ej. Necesito un electricista, gasfitero..."}
            placeholderTextColor={isListening ? COLORS.primaryDark : "#94a3b8"}
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
            editable={true}
          />

          {searchText.trim().length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')} style={{ padding: 4, marginRight: 4 }}>
              <Ionicons name="close-circle" size={16} color="#94a3b8" />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.micButton, isListening && styles.micButtonActive]}
            onPress={startVoiceSearch}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isListening ? "mic" : "mic-outline"}
              size={18}
              color={isListening ? COLORS.white : COLORS.primaryDark}
            />
          </TouchableOpacity>
        </View>
        {isListening && (
          <Text style={styles.listeningBadge}>🔴 Escuchando... Habla ahora</Text>
        )}
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
            <View style={[styles.iconCircle, { backgroundColor: '#ccfbf1' }]}>
              <Ionicons name="build" size={20} color="#0f766e" />
            </View>
            <Feather name="chevron-right" size={18} color="#0f766e" />
          </View>
          <Text style={[styles.gridCardTitle, { fontSize: scale(13) }]}>
            Servicios cercanos
          </Text>
          <Text style={[styles.gridCardSub, { fontSize: scale(10) }]}>
            Oficios y técnicos verificados
          </Text>
        </TouchableOpacity>

        {/* 2. Ayuda Solidaria */}
        <TouchableOpacity
          style={[styles.gridCard, { backgroundColor: '#f5f3ff', borderColor: '#ddd6fe' }]}
          activeOpacity={0.8}
          onPress={() => onNavigate('solidarity')}
        >
          <View style={styles.cardHeaderRow}>
            <View style={[styles.iconCircle, { backgroundColor: '#ede9fe' }]}>
              <Ionicons name="people" size={20} color="#6d28d9" />
            </View>
            <Feather name="chevron-right" size={18} color="#6d28d9" />
          </View>
          <Text style={[styles.gridCardTitle, { fontSize: scale(13) }]}>
            Ayuda solidaria
          </Text>
          <Text style={[styles.gridCardSub, { fontSize: scale(10) }]}>
            Pide u ofrece apoyo comunal
          </Text>
        </TouchableOpacity>

        {/* 3. Productos Locales */}
        <TouchableOpacity
          style={[styles.gridCard, { backgroundColor: '#fffbeb', borderColor: '#fef3c7' }]}
          activeOpacity={0.8}
          onPress={() => onNavigate('products')}
        >
          <View style={styles.cardHeaderRow}>
            <View style={[styles.iconCircle, { backgroundColor: '#fef3c7' }]}>
              <Ionicons name="basket" size={20} color="#b45309" />
            </View>
            <Feather name="chevron-right" size={18} color="#b45309" />
          </View>
          <Text style={[styles.gridCardTitle, { fontSize: scale(13) }]}>
            Productos locales
          </Text>
          <Text style={[styles.gridCardSub, { fontSize: scale(10) }]}>
            Panadería, comida y abarrotes
          </Text>
        </TouchableOpacity>

        {/* 4. Emergencias Comunitarias (DESTACADO Y BOLD) */}
        <TouchableOpacity
          style={[styles.gridCard, styles.emergencyGridCard]}
          activeOpacity={0.85}
          onPress={() => onNavigate('emergency')}
        >
          <View style={styles.cardHeaderRow}>
            <View style={[styles.iconCircle, { backgroundColor: '#fee2e2' }]}>
              <MaterialCommunityIcons name="alarm-light" size={22} color="#dc2626" />
            </View>
            <View style={styles.sosPill}>
              <Text style={styles.sosPillText}>SOS</Text>
            </View>
          </View>
          <Text style={[styles.gridCardTitle, { fontSize: scale(13), color: '#991b1b', fontWeight: '900' }]}>
            🚨 Emergencias
          </Text>
          <Text style={[styles.gridCardSub, { fontSize: scale(10), color: '#b91c1c' }]}>
            Alerta y mapa en tiempo real
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sección: Recomendados por tus Vecinos (Muestra 2 a 3) */}
      <View style={styles.sectionHeaderRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="thumbs-up" size={16} color="#0f766e" />
          <Text style={[styles.sectionTitle, { fontSize: scale(14) }]}>
            Recomendados por tus vecinos ({recommendedServices.length})
          </Text>
        </View>
        <TouchableOpacity onPress={() => onNavigate('services')}>
          <Text style={[styles.seeMoreText, { fontSize: scale(11) }]}>
            Ver catálogo ›
          </Text>
        </TouchableOpacity>
      </View>

      {/* Lista de 2 o 3 Recomendaciones */}
      {loadingServices ? (
        <View style={{ paddingVertical: 20, alignItems: 'center' }}>
          <ActivityIndicator color={COLORS.primary} size="small" />
        </View>
      ) : recommendedServices.length > 0 ? (
        <View style={styles.recommendedList}>
          {recommendedServices.map((service, index) => (
            <TouchableOpacity
              key={service.id || index}
              style={styles.providerCard}
              activeOpacity={0.85}
              onPress={() => handleServicePress(service)}
            >
              <Image
                source={{
                  uri: service.provider_avatar || service.image_url || 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=300'
                }}
                style={styles.providerImage}
              />
              <View style={styles.providerDetails}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={[styles.providerTitle, { fontSize: scale(13) }]} numberOfLines={1}>
                    {service.title}
                  </Text>
                  <Text style={[styles.providerPrice, { fontSize: scale(12) }]}>
                    S/ {service.price_from ? Number(service.price_from).toFixed(2) : 'A convenir'}
                  </Text>
                </View>

                <Text style={[styles.providerLocation, { fontSize: scale(11) }]}>
                  📍 {service.community_name || 'Zona A'} • {service.provider_name || 'Vecino'}
                </Text>

                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={13} color="#eab308" />
                  <Text style={[styles.ratingText, { fontSize: scale(11) }]}>
                    {' '}{service.rating_avg ? Number(service.rating_avg).toFixed(1) : '5.0'} ({service.reviews_count || 1} recomendaciones)
                  </Text>
                </View>

                <View style={styles.verifiedBadge}>
                  <Text style={[styles.verifiedBadgeText, { fontSize: scale(10) }]}>
                    ✓ Vecino Verificado
                  </Text>
                </View>
              </View>
              <Feather name="chevron-right" size={18} color="#94a3b8" />
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={styles.emptyFeaturedCard}>
          <Text style={{ fontSize: 32, marginBottom: 8 }}>🏘️</Text>
          <Text style={[styles.emptyFeaturedTitle, { fontSize: scale(13) }]}>
            Aún no hay publicaciones en tu manzana
          </Text>
          <Text style={[styles.emptyFeaturedSub, { fontSize: scale(11) }]}>
            Sé el primero en ofrecer tu talento o emprendimiento a tus vecinos de Zona A.
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
          <View style={[styles.iconCircle, { backgroundColor: '#fef3c7', marginRight: 10 }]}>
            <Ionicons name="megaphone" size={20} color="#b45309" />
          </View>
          <View style={{ flex: 1 }}>
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
    paddingBottom: 110
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
    fontWeight: '800',
    color: '#ffffff'
  },
  heroSubtitle: {
    color: '#ccfbf1',
    lineHeight: 18,
    marginBottom: 16
  },
  searchBar: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2
  },
  searchInput: {
    flex: 1,
    fontWeight: '600',
    color: '#0f172a',
    paddingHorizontal: 8,
    paddingVertical: 6
  },
  micButton: {
    backgroundColor: '#f1f5f9',
    padding: 8,
    borderRadius: 10
  },
  micButtonActive: {
    backgroundColor: '#dc2626'
  },
  listeningBadge: {
    color: '#fef08a',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 8,
    textAlign: 'center'
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20
  },
  gridCard: {
    width: '48%',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.5,
    minHeight: 115,
    justifyContent: 'space-between'
  },
  emergencyGridCard: {
    backgroundColor: '#fff1f2',
    borderColor: '#fca5a5',
    borderWidth: 2,
    shadowColor: '#dc2626',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center'
  },
  sosPill: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  sosPillText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900'
  },
  gridCardTitle: {
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 8
  },
  gridCardSub: {
    color: COLORS.textSecondary,
    marginTop: 2
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  sectionTitle: {
    fontWeight: '800',
    color: COLORS.text
  },
  seeMoreText: {
    fontWeight: '700',
    color: COLORS.primaryDark
  },
  recommendedList: {
    gap: 12,
    marginBottom: 16
  },
  providerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2
  },
  providerImage: {
    width: 60,
    height: 60,
    borderRadius: 14,
    marginRight: 12,
    backgroundColor: '#e2e8f0'
  },
  providerDetails: {
    flex: 1
  },
  providerTitle: {
    fontWeight: '800',
    color: COLORS.text,
    flex: 1
  },
  providerPrice: {
    fontWeight: '800',
    color: COLORS.primaryDark,
    marginLeft: 6
  },
  providerLocation: {
    color: COLORS.textSecondary,
    marginVertical: 2
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2
  },
  ratingText: {
    fontWeight: '700',
    color: COLORS.textSecondary
  },
  verifiedBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 4
  },
  verifiedBadgeText: {
    color: '#059669',
    fontWeight: '800'
  },
  emptyFeaturedCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  emptyFeaturedTitle: {
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
    textAlign: 'center'
  },
  emptyFeaturedSub: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18
  },
  emptyFeaturedBtn: {
    backgroundColor: COLORS.primarySurface,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primaryPale
  },
  emptyFeaturedBtnText: {
    color: COLORS.primaryDark,
    fontWeight: '700'
  },
  publishBanner: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16
  },
  publishBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10
  },
  publishBannerTitle: {
    fontWeight: '800',
    color: COLORS.text
  },
  publishBannerSub: {
    color: COLORS.textSecondary,
    marginTop: 2
  },
  publishBannerBtn: {
    backgroundColor: COLORS.primary,
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10
  }
});
