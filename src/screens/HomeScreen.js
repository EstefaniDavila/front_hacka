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
  Alert,
  Modal,
  Platform
} from 'react-native';
import { Camera } from 'expo-camera';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { api } from '../services/api';
import { getOrDetectUserLocation } from '../services/locationService';
import { useAuth } from '../context/AuthContext';
import GlobalSearchModal from '../components/GlobalSearchModal';
import SearchResultCard from '../components/SearchResultCard';

export default function HomeScreen({ onNavigate, fontScale = 1.0, onOpenDetail }) {
  const { profile } = useAuth();
  const scale = (val) => Math.round(val * fontScale);
  const [recommendedServices, setRecommendedServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [voiceQuery, setVoiceQuery] = useState('');
  const [isCheckingMic, setIsCheckingMic] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    loadRecommended();
  }, [profile?.latitude, profile?.longitude]);

  const loadRecommended = async () => {
    try {
      setLoadingServices(true);
      const loc = await getOrDetectUserLocation(false, profile).catch(() => null);
      if (loc) setUserLocation(loc);

      const effectiveLat = loc?.latitude || profile?.latitude || -16.397650;
      const effectiveLon = loc?.longitude || profile?.longitude || -71.536120;

      // Consumir el motor de búsqueda inteligente con ranking multidimensional y proximidad
      // Excluye estrictamente emergencias activas (las cuales tienen su módulo SOS propio en Home)
      const res = await api.searchGlobal({
        sort: 'recommended',
        page_size: 8,
        latitude: effectiveLat,
        longitude: effectiveLon,
        include_emergencies: false,
        modules: 'services,products,solidarity',
      });

      const cleanItems = (res?.items || []).filter(item => item && item.module !== 'emergencies');

      if (cleanItems.length > 0) {
        setRecommendedServices(cleanItems.slice(0, 4));
      } else {
        // Fallback secundario de alta proximidad por si la búsqueda global no arrojó resultados
        const fallback = await api.searchServices({
          sort: 'recommended',
          latitude: effectiveLat,
          longitude: effectiveLon,
          page_size: 4,
        }).catch(() => null);

        if (fallback && Array.isArray(fallback.items) && fallback.items.length > 0) {
          const mappedFallback = fallback.items.map(s => ({
            id: s.id,
            module: 'services',
            title: s.title,
            subtitle: s.provider_name,
            description: s.description,
            category: s.category_name,
            icon: s.category_icon || '🛠️',
            badge: s.is_verified ? 'Verificado' : (s.is_new ? 'Nuevo' : null),
            price_label: s.price_from ? `S/ ${s.price_from}${s.price_unit ? ` /${s.price_unit}` : ''}` : 'A cotizar',
            distance_km: s.distance_km,
            distance_meters: s.distance_meters,
            proximity_tier: s.proximity_tier,
            proximity_label: s.proximity_label,
            location_label: s.district_name || s.community_name,
            rating: s.rating_avg && s.reviews_count > 0 ? s.rating_avg : null,
            reviews_count: s.reviews_count,
            score: s.score,
            ranking_score: s.ranking_score,
          }));
          setRecommendedServices(mappedFallback.slice(0, 4));
        } else {
          setRecommendedServices([]);
        }
      }
    } catch (err) {
      console.warn('[HomeScreen] Error al cargar recomendados:', err);
      setRecommendedServices([]);
    } finally {
      setLoadingServices(false);
    }
  };

  const handleSearchSubmit = () => {
    setShowSearchModal(true);
  };

  const startVoiceSearch = async () => {
    setIsCheckingMic(true);
    let hasMicPermission = false;

    try {
      if (Platform.OS === 'web') {
        if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            hasMicPermission = true;
          } catch (e) {
            console.warn('[Voice] Permiso de micrófono web denegado:', e);
          }
        } else {
          hasMicPermission = true;
        }
      } else {
        // En dispositivo móvil nativo (Android / iOS) solicitar permiso mediante expo-camera
        if (Camera?.requestMicrophonePermissionsAsync) {
          const perm = await Camera.requestMicrophonePermissionsAsync().catch(() => null);
          hasMicPermission = perm?.status === 'granted';
        } else {
          hasMicPermission = true;
        }
      }
    } catch (err) {
      console.warn('[Voice] Error al solicitar permiso:', err);
    } finally {
      setIsCheckingMic(false);
    }

    if (!hasMicPermission) {
      Alert.alert(
        '🎤 Permiso de Micrófono Requerido',
        'VeciRed IA necesita acceso al micrófono de tu dispositivo para escuchar tus consultas por voz. Por favor autoriza el permiso en los ajustes de tu teléfono o navegador.',
        [{ text: 'Entendido', style: 'cancel' }]
      );
      return;
    }

    // Permiso otorgado -> abrir interfaz de voz activa
    setVoiceQuery('');
    setIsListening(true);
    setShowVoiceModal(true);

    // Intentar Web Speech recognition si está disponible
    if (typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)) {
      try {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = 'es-PE';
        recognition.interimResults = true;
        recognition.continuous = false;

        recognition.onresult = (event) => {
          let currentSpoken = '';
          for (let k = 0; k < event.results.length; k++) {
            currentSpoken += event.results[k][0].transcript;
          }
          if (currentSpoken) {
            setVoiceQuery(currentSpoken);
          }
        };

        recognition.onerror = (e) => {
          console.warn('[Voice] Error de reconocimiento:', e);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.start();
      } catch (err) {
        console.warn('[Voice] Web Speech no iniciado:', err);
      }
    }
  };

  const handleExecuteVoiceSearch = (queryToSearch) => {
    const finalQ = (queryToSearch || voiceQuery || '').trim();
    setShowVoiceModal(false);
    setIsListening(false);
    if (!finalQ) return;

    setSearchText(finalQ);
    if (finalQ.toLowerCase().includes('emergenc') || finalQ.toLowerCase().includes('sos') || finalQ.toLowerCase().includes('alerta')) {
      onNavigate('emergency');
    } else if (finalQ.toLowerCase().includes('panader') || finalQ.toLowerCase().includes('tienda') || finalQ.toLowerCase().includes('comprar')) {
      onNavigate('products');
    } else {
      onNavigate('services', { search: finalQ });
    }
  };
  const handleItemPress = (item, mod) => {
    const targetMod = mod || item?.module || 'services';
    if (onOpenDetail) {
      onOpenDetail(item, targetMod === 'products' ? 'product' : 'service');
    } else if (targetMod === 'services' && item.id) {
      onNavigate('service_detail', { serviceId: item.id });
    } else if (targetMod === 'products') {
      onNavigate('products');
    } else if (targetMod === 'solidarity') {
      onNavigate('solidarity');
    } else if (targetMod === 'emergencies') {
      onNavigate('emergency');
    } else {
      onNavigate('services');
    }
  };

  const handleServicePress = (service) => {
    handleItemPress(service, 'services');
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

      {/* Lista de Recomendaciones de VeciRed con Ranking Inteligente */}
      {loadingServices ? (
        <View style={{ paddingVertical: 20, alignItems: 'center' }}>
          <ActivityIndicator color={COLORS.primary} size="small" />
        </View>
      ) : recommendedServices.length > 0 ? (
        <View style={styles.recommendedList}>
          {recommendedServices.map((item, index) => (
            <SearchResultCard
              key={item.id || index}
              item={item}
              fontScale={fontScale}
              onPress={(selected, mod) => handleItemPress(selected, mod)}
            />
          ))}
        </View>
      ) : (
        <View style={styles.emptyFeaturedCard}>
          <Text style={{ fontSize: 32, marginBottom: 8 }}>🏘️</Text>
          <Text style={[styles.emptyFeaturedTitle, { fontSize: scale(13) }]}>
            Aún no hay publicaciones en tu radio cercano (hasta 10 km)
          </Text>
          <Text style={[styles.emptyFeaturedSub, { fontSize: scale(11) }]}>
            Sé el primero en ofrecer tu talento o emprendimiento a tus vecinos de la comunidad.
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

      {/* Modal del Buscador Inteligente Global */}
      <GlobalSearchModal
        visible={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        initialQuery={searchText}
        fontScale={fontScale}
        onSelectResult={handleItemPress}
      />

      {/* Modal Interactivo de Búsqueda por Voz VeciRed con Permisos Validados */}
      <Modal
        visible={showVoiceModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowVoiceModal(false);
          setIsListening(false);
        }}
      >
        <View style={styles.voiceModalBackdrop}>
          <View style={styles.voiceModalCard}>
            {/* Header del Modal de Voz */}
            <View style={styles.voiceHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="mic" size={20} color="#0d9488" />
                <Text style={[styles.voiceModalTitle, { fontSize: scale(15) }]}>
                  Búsqueda por Voz VeciRed IA
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setShowVoiceModal(false);
                  setIsListening(false);
                }}
                style={{ padding: 4 }}
              >
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Badge de Permiso Verificado */}
            <View style={styles.micVerifiedBadge}>
              <Ionicons name="shield-checkmark" size={14} color="#16a34a" />
              <Text style={styles.micVerifiedText}>
                Micrófono del dispositivo activado y verificado
              </Text>
            </View>

            {/* Icono Pulsante de Escucha */}
            <View style={styles.voicePulseWrapper}>
              <View style={styles.voicePulseRing}>
                <View style={styles.voicePulseCore}>
                  <Ionicons name={isListening ? "mic" : "mic-circle"} size={36} color="#ffffff" />
                </View>
              </View>
              <Text style={styles.voiceListeningStatus}>
                {isListening ? "🎙️ Escuchando tu voz en tiempo real..." : "Voz capturada. Confirma o busca abajo:"}
              </Text>
            </View>

            {/* Campo con lo transcrito o para afinar la consulta */}
            <View style={styles.voiceInputBox}>
              <TextInput
                style={[styles.voiceTextInput, { fontSize: scale(13) }]}
                value={voiceQuery}
                onChangeText={setVoiceQuery}
                placeholder="Di lo que necesitas... Ej. Gasfitero urgente"
                placeholderTextColor="#94a3b8"
                autoFocus={true}
              />
              {voiceQuery.length > 0 && (
                <TouchableOpacity onPress={() => setVoiceQuery('')} style={{ padding: 4 }}>
                  <Ionicons name="close-circle" size={18} color="#94a3b8" />
                </TouchableOpacity>
              )}
            </View>

            {/* Sugerencias Rápidas de Voz para la Comunidad */}
            <Text style={styles.voiceSuggestionsLabel}>O toca una necesidad frecuente:</Text>
            <View style={styles.voiceChipsContainer}>
              {[
                { label: '🔧 Gasfitero urgente', q: 'Gasfitero urgente' },
                { label: '⚡ Electricista a domicilio', q: 'Electricista' },
                { label: '🥖 Panadería o víveres', q: 'Panadería' },
                { label: '🚨 Reportar emergencia', q: 'Emergencia SOS' },
                { label: '👵 Apoyo adulto mayor', q: 'Cuidado de adulto mayor' },
                { label: '📦 Flete o mudanza', q: 'Flete mudanza' }
              ].map((chip) => (
                <TouchableOpacity
                  key={chip.label}
                  style={styles.voiceChipBtn}
                  onPress={() => {
                    setVoiceQuery(chip.q);
                    handleExecuteVoiceSearch(chip.q);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.voiceChipText}>{chip.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Botón de Acción Principal */}
            <TouchableOpacity
              style={[styles.voiceSearchActionBtn, !voiceQuery.trim() && styles.voiceSearchActionBtnDisabled]}
              onPress={() => handleExecuteVoiceSearch(voiceQuery)}
              disabled={!voiceQuery.trim()}
              activeOpacity={0.8}
            >
              <Ionicons name="search" size={17} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.voiceSearchActionBtnText}>
                Buscar en la Comunidad
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  voiceModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end'
  },
  voiceModalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8
  },
  voiceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  voiceModalTitle: {
    fontWeight: '800',
    color: '#0f172a'
  },
  micVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f0fdf4',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    marginBottom: 14
  },
  micVerifiedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16a34a'
  },
  voicePulseWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10
  },
  voicePulseRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(13, 148, 136, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8
  },
  voicePulseCore: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0d9488',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0d9488',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4
  },
  voiceListeningStatus: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f766e'
  },
  voiceInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginVertical: 10
  },
  voiceTextInput: {
    flex: 1,
    color: '#0f172a',
    fontWeight: '600',
    paddingVertical: 6
  },
  voiceSuggestionsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 6,
    marginBottom: 6
  },
  voiceChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16
  },
  voiceChipBtn: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  voiceChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155'
  },
  voiceSearchActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0d9488',
    paddingVertical: 13,
    borderRadius: 12,
    shadowColor: '#0d9488',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2
  },
  voiceSearchActionBtnDisabled: {
    backgroundColor: '#94a3b8'
  },
  voiceSearchActionBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800'
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
