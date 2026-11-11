import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  useWindowDimensions,
  ScrollView,
  Platform
} from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';

export const TOUR_STEPS = [
  {
    id: 'sos',
    tag: 'SEGURIDAD VECINAL',
    tagColor: '#dc2626',
    tagBg: '#fee2e2',
    title: '🚨 Botón SOS de Auxilio Inmediato',
    headline: 'Tu línea directa de auxilio barrial',
    desc: 'Ubicado en la esquina superior de la aplicación. Al presionarlo, emites una alerta satelital instantánea que notifica a todos los vecinos y brigadistas en un radio concéntrico de hasta 5 km.',
    bullets: [
      'Alerta inmediata con GPS satelital exacto',
      'Prioridad concéntrica: 500m, 1.5km, 3km y 5km',
      'Activa la brigada comunitaria al instante'
    ],
    previewType: 'sos'
  },
  {
    id: 'voice',
    tag: 'INTELIGENCIA ARTIFICIAL',
    tagColor: '#0d9488',
    tagBg: '#ccfbf1',
    title: '🎙️ Búsqueda Inteligente por Voz',
    headline: 'Habla o escribe con lenguaje natural',
    desc: 'Toca el micrófono en el buscador y habla como a un vecino: "necesito un electricista", "se rompió un tubo" o "comprar panadería". La IA de VeciRed busca por cercanía a tu puerta y reputación.',
    bullets: [
      'Reconocimiento de voz con permisos en vivo',
      'Ranking por proximidad milimétrica en tu manzana',
      'Respuestas instantáneas adaptadas a tu barrio'
    ],
    previewType: 'voice'
  },
  {
    id: 'emergencies',
    tag: 'RADAR EN VIVO',
    tagColor: '#b91c1c',
    tagBg: '#fee2e2',
    title: '🗺️ Radar 5km y Evidencias en Vivo',
    headline: 'Monitoreo satelital concéntrico en tiempo real',
    desc: 'Sigue cualquier alerta activa en el mapa satelital. Toca el desplegable para cambiar de alerta, ver su distancia exacta, sumarte como voluntario o subir fotos del suceso como en una red social.',
    bullets: [
      'Mapa satelital con 4 ondas de cobertura (500m a 5km)',
      'Sube fotos, comentarios y evidencias en tiempo real',
      'Únete a la brigada vecinal con un solo toque'
    ],
    previewType: 'radar'
  },
  {
    id: 'services',
    tag: 'ECONOMÍA & SOLIDARIDAD',
    tagColor: '#0284c7',
    tagBg: '#e0f2fe',
    title: '🛍️ Servicios Cercanos y Ayuda Solidaria',
    headline: 'Oficios de confianza y apoyo mutuo',
    desc: 'Encuentra gasfiteros, carpinteros y electricistas verificados por tus propios vecinos. Además, accede a la sección de Ayuda Solidaria para donar o solicitar apoyo en medicinas, alimentos o contingencias.',
    bullets: [
      'Técnicos recomendados por vecinos de tu zona',
      'Donaciones y favores comunitarios sin dinero',
      'Chat directo para coordinar sin comisiones'
    ],
    previewType: 'services'
  },
  {
    id: 'publish',
    tag: 'PARTICIPACIÓN VECINAL',
    tagColor: '#059669',
    tagBg: '#d1fae5',
    title: '➕ Botón Central Publicar',
    headline: 'Ofrece tus talentos o solicita apoyo',
    desc: 'El botón verde central en la barra inferior te permite publicar en segundos: ofrece tus servicios profesionales, vende productos de tu emprendimiento o solicita auxilio comunitario.',
    bullets: [
      'Publica tus oficios o productos locales',
      'Llega directamente a los vecinos de tu distrito',
      'Genera ingresos y fortalece tu comunidad'
    ],
    previewType: 'publish'
  }
];

export default function SpotlightTourModal({
  visible,
  onClose,
  fontScale = 1.0,
  initialStep = 0
}) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const scale = (val) => Math.round(val * fontScale);
  const previewScale = (val) => Math.round(val * Math.min(fontScale, 1.15));
  const [currentStepIndex, setCurrentStepIndex] = useState(initialStep);

  // Animaciones de pulso y transición suave
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setCurrentStepIndex(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true
      }).start();

      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 800,
            useNativeDriver: true
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true
          })
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible]);

  if (!visible) return null;

  const currentStep = TOUR_STEPS[currentStepIndex] || TOUR_STEPS[0];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === TOUR_STEPS.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onClose();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  // Renderizador de la demostración visual interactiva según el paso
  const renderVisualPreview = () => {
    switch (currentStep.previewType) {
      case 'sos':
        return (
          <View style={styles.previewContainer}>
            <View style={styles.previewHeaderMock}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, minWidth: 0, flexShrink: 1 }}>
                <View style={styles.previewLogoCircle}>
                  <Text style={{ fontSize: 13 }}>🏘️</Text>
                </View>
                <Text style={[styles.previewBrandText, { fontSize: previewScale(12.5) }]} numberOfLines={1}>
                  VeciRed <Text style={{ color: '#0d9488' }}>IA</Text>
                </Text>
              </View>

              {/* Botón SOS Destacado con aro pulsante */}
              <Animated.View
                style={[
                  styles.previewSosBtnHighlight,
                  { flexShrink: 0, transform: [{ scale: pulseAnim }] }
                ]}
              >
                <MaterialCommunityIcons name="alarm-light" size={14} color="#ffffff" style={{ marginRight: 3 }} />
                <Text style={[styles.previewSosBtnText, { fontSize: previewScale(11.5) }]}>SOS</Text>
              </Animated.View>
            </View>

            {/* Simulación de Ondas de Radar Concéntricas */}
            <View style={styles.radarWavesRow}>
              <View style={[styles.radarWavePill, { backgroundColor: '#fee2e2' }]}>
                <Text style={[styles.radarWavePillText, { color: '#dc2626', fontSize: previewScale(9.5) }]}>🔴 Onda 1 (≤500m)</Text>
              </View>
              <View style={[styles.radarWavePill, { backgroundColor: '#ffedd5' }]}>
                <Text style={[styles.radarWavePillText, { color: '#ea580c', fontSize: previewScale(9.5) }]}>🟠 Onda 2 (1.5km)</Text>
              </View>
              <View style={[styles.radarWavePill, { backgroundColor: '#fef3c7' }]}>
                <Text style={[styles.radarWavePillText, { color: '#d97706', fontSize: previewScale(9.5) }]}>🟡 Onda 3 (3km)</Text>
              </View>
              <View style={[styles.radarWavePill, { backgroundColor: '#e0f2fe' }]}>
                <Text style={[styles.radarWavePillText, { color: '#0284c7', fontSize: previewScale(9.5) }]}>🔵 Onda 4 (5km)</Text>
              </View>
            </View>
          </View>
        );

      case 'voice':
        return (
          <View style={styles.previewContainer}>
            <View style={styles.previewSearchBar}>
              <Ionicons name="search" size={16} color="#0d9488" style={{ marginRight: 6 }} />
              <Text style={[styles.previewSearchInputText, { fontSize: previewScale(10.5) }]} numberOfLines={1}>
                "Necesito un electricista urgente..."
              </Text>

              {/* Micrófono animado con pulso */}
              <Animated.View
                style={[
                  styles.previewMicBtn,
                  { flexShrink: 0, transform: [{ scale: pulseAnim }] }
                ]}
              >
                <Ionicons name="mic" size={14} color="#ffffff" />
              </Animated.View>
            </View>

            <View style={styles.previewAiBadgeRow}>
              <View style={styles.previewAiBadge}>
                <Ionicons name="sparkles" size={11} color="#0f766e" style={{ marginRight: 4 }} />
                <Text style={[styles.previewAiBadgeText, { fontSize: previewScale(9) }]} numberOfLines={1}>
                  IA VeciRed: Filtra por cercanía exacta y estrellas
                </Text>
              </View>
            </View>
          </View>
        );

      case 'radar':
        return (
          <View style={styles.previewContainer}>
            <View style={styles.previewAlertMockCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5, gap: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1, minWidth: 0, flexShrink: 1 }}>
                  <Text style={{ fontSize: 13 }}>🚨</Text>
                  <Text style={[styles.previewAlertTitle, { fontSize: previewScale(11) }]} numberOfLines={1}>
                    Accidente en Av. Principal
                  </Text>
                </View>
                <View style={[styles.previewRadarTierBadge, { flexShrink: 0 }]}>
                  <Text style={[styles.previewRadarTierText, { fontSize: previewScale(9) }]}>🔴 Onda 1 (45m)</Text>
                </View>
              </View>

              <View style={styles.previewMapPlaceholder}>
                <Text style={[styles.previewMapPlaceholderText, { fontSize: previewScale(9.5) }]} numberOfLines={1}>
                  🛰️ Radar Satelital Concéntrico en Vivo (500m - 5km)
                </Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 5, marginTop: 5, flexWrap: 'wrap' }}>
                <View style={styles.previewActionPill}>
                  <Text style={[styles.previewActionPillText, { fontSize: previewScale(9) }]}>🗺️ Ver Mapa</Text>
                </View>
                <View style={[styles.previewActionPill, { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' }]}>
                  <Text style={[styles.previewActionPillText, { color: '#059669', fontSize: previewScale(9) }]}>✋ Sumarme</Text>
                </View>
                <View style={[styles.previewActionPill, { backgroundColor: '#fef2f2', borderColor: '#fecaca' }]}>
                  <Text style={[styles.previewActionPillText, { color: '#dc2626', fontSize: previewScale(9) }]}>📸 Subir Foto</Text>
                </View>
              </View>
            </View>
          </View>
        );

      case 'services':
        return (
          <View style={styles.previewContainer}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {/* Tarjeta 1: Servicios */}
              <View style={[styles.previewGridCard, { backgroundColor: '#f0fdfa', borderColor: '#99f6e4', flex: 1, minWidth: 0 }]}>
                <View style={[styles.previewGridIconCircle, { backgroundColor: '#ccfbf1' }]}>
                  <Ionicons name="build" size={15} color="#0f766e" />
                </View>
                <Text style={[styles.previewGridTitle, { fontSize: previewScale(10.5) }]} numberOfLines={1}>Servicios Cercanos</Text>
                <Text style={[styles.previewGridSub, { fontSize: previewScale(9) }]} numberOfLines={1}>Técnicos verificados</Text>
                <View style={styles.previewStarsBadge}>
                  <Text style={[styles.previewStarsText, { fontSize: previewScale(8.5) }]}>⭐ 4.9 • Vecinos</Text>
                </View>
              </View>

              {/* Tarjeta 2: Solidaridad */}
              <View style={[styles.previewGridCard, { backgroundColor: '#f5f3ff', borderColor: '#ddd6fe', flex: 1, minWidth: 0 }]}>
                <View style={[styles.previewGridIconCircle, { backgroundColor: '#ede9fe' }]}>
                  <Ionicons name="people" size={15} color="#6d28d9" />
                </View>
                <Text style={[styles.previewGridTitle, { fontSize: previewScale(10.5) }]} numberOfLines={1}>Ayuda Solidaria</Text>
                <Text style={[styles.previewGridSub, { fontSize: previewScale(9) }]} numberOfLines={1}>Apoyo sin dinero</Text>
                <View style={[styles.previewStarsBadge, { backgroundColor: '#ede9fe' }]}>
                  <Text style={[styles.previewStarsText, { color: '#6d28d9', fontSize: previewScale(8.5) }]}>🤝 Donaciones</Text>
                </View>
              </View>
            </View>
          </View>
        );

      case 'publish':
        return (
          <View style={styles.previewContainer}>
            <View style={styles.previewBottomBarMock}>
              <View style={styles.previewNavTab}>
                <Ionicons name="home-outline" size={15} color="#94a3b8" />
                <Text style={[styles.previewNavLabel, { fontSize: previewScale(8) }]}>Inicio</Text>
              </View>

              {/* Botón Central Publicar Pulsante */}
              <Animated.View
                style={[
                  styles.previewPublishBtnHighlight,
                  { flexShrink: 0, transform: [{ scale: pulseAnim }] }
                ]}
              >
                <Ionicons name="add" size={22} color="#ffffff" />
              </Animated.View>

              <View style={styles.previewNavTab}>
                <Ionicons name="person-outline" size={15} color="#94a3b8" />
                <Text style={[styles.previewNavLabel, { fontSize: previewScale(8) }]}>Perfil</Text>
              </View>
            </View>

            <View style={[styles.previewPublishPillsRow, { flexWrap: 'wrap', gap: 4 }]}>
              <View style={styles.previewPublishPill}>
                <Text style={[styles.previewPublishPillText, { fontSize: previewScale(9) }]}>💼 Ofrecer Oficio</Text>
              </View>
              <View style={styles.previewPublishPill}>
                <Text style={[styles.previewPublishPillText, { fontSize: previewScale(9) }]}>🍞 Vender Producto</Text>
              </View>
              <View style={styles.previewPublishPill}>
                <Text style={[styles.previewPublishPillText, { fontSize: previewScale(9) }]}>🆘 Pedir Ayuda</Text>
              </View>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  const cardMaxWidth = Math.min(windowWidth - 28, 420);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Animated.View
          style={[
            styles.cardContainer,
            {
              width: cardMaxWidth,
              maxHeight: windowHeight * 0.88,
              opacity: fadeAnim
            }
          ]}
        >
          {/* Header de la tarjeta fijo arriba */}
          <View style={styles.topHeaderRow}>
            <View style={[styles.tagBadge, { backgroundColor: currentStep.tagBg }]}>
              <Text style={[styles.tagBadgeText, { color: currentStep.tagColor, fontSize: scale(9.5) }]}>
                {currentStep.tag}
              </Text>
            </View>

            <View style={styles.stepBadge}>
              <Text style={[styles.stepBadgeText, { fontSize: scale(10.5) }]}>
                Paso {currentStepIndex + 1} de {TOUR_STEPS.length}
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={[styles.closeBtnText, { fontSize: scale(11) }]}>Omitir</Text>
              <Ionicons name="close" size={15} color="#64748b" style={{ marginLeft: 2 }} />
            </TouchableOpacity>
          </View>

          {/* Contenido Desplazable que contiene el simulador y la explicación (SE ADAPTA A CUALQUIER TAMAÑO DE LETRA) */}
          <ScrollView
            bounces={false}
            showsVerticalScrollIndicator={false}
            style={{ flexShrink: 1 }}
            contentContainerStyle={{ paddingVertical: 4, paddingBottom: 6 }}
          >
            {/* Demostración Visual HD Interactiva (Simulador del Botón/Sección) */}
            <View style={{ marginBottom: 10 }}>
              {renderVisualPreview()}
            </View>

            <Text style={[styles.mainTitle, { fontSize: scale(14.5) }]}>
              {currentStep.title}
            </Text>

            <Text style={[styles.mainHeadline, { fontSize: scale(11.5) }]}>
              {currentStep.headline}
            </Text>

            <Text style={[styles.mainDesc, { fontSize: scale(11) }]}>
              {currentStep.desc}
            </Text>

            {/* Puntos Clave de la Función */}
            <View style={styles.bulletsBox}>
              {currentStep.bullets.map((b, i) => (
                <View key={i} style={styles.bulletRow}>
                  <Ionicons name="checkmark-circle" size={14} color={currentStep.tagColor} style={{ marginTop: 2, marginRight: 6 }} />
                  <Text style={[styles.bulletText, { fontSize: scale(10.5) }]}>{b}</Text>
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Barra de Navegación Inferior */}
          <View style={styles.footerRow}>
            {/* Indicadores de Puntos de Progreso */}
            <View style={styles.dotsContainer}>
              {TOUR_STEPS.map((_, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.dot,
                    idx === currentStepIndex
                      ? [styles.dotActive, { backgroundColor: currentStep.tagColor }]
                      : styles.dotInactive
                  ]}
                />
              ))}
            </View>

            {/* Botones Anterior / Siguiente */}
            <View style={styles.actionsContainer}>
              {!isFirstStep && (
                <TouchableOpacity
                  style={styles.btnSecondary}
                  onPress={handlePrev}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.btnSecondaryText, { fontSize: scale(11.5) }]}>‹ Anterior</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.btnPrimary, { backgroundColor: currentStep.tagColor }]}
                onPress={handleNext}
                activeOpacity={0.85}
              >
                <Text style={[styles.btnPrimaryText, { fontSize: scale(12) }]}>
                  {isLastStep ? '¡Comenzar a usar VeciRed!' : 'Siguiente ›'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.84)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  cardContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 14
  },
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8
  },
  tagBadgeText: {
    fontWeight: '800',
    letterSpacing: 0.5
  },
  stepBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8
  },
  stepBadgeText: {
    fontWeight: '700',
    color: '#475569'
  },
  closeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 4
  },
  closeBtnText: {
    color: '#64748b',
    fontWeight: '600'
  },

  /* SIMULADOR VISUAL INTERACTIVO */
  previewContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    padding: 10
  },
  previewHeaderMock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  previewLogoCircle: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#ccfbf1',
    alignItems: 'center',
    justifyContent: 'center'
  },
  previewBrandText: {
    fontWeight: '900',
    fontSize: 13,
    color: '#0f766e'
  },
  previewSosBtnHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dc2626',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4
  },
  previewSosBtnText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 12
  },
  radarWavesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 8
  },
  radarWavePill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6
  },
  radarWavePillText: {
    fontSize: 10,
    fontWeight: '800'
  },

  /* SIMULADOR VOZ & BUSCADOR */
  previewSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#0d9488',
    paddingHorizontal: 8,
    paddingVertical: 6
  },
  previewSearchInputText: {
    flex: 1,
    fontSize: 11,
    color: '#334155',
    fontWeight: '600'
  },
  previewMicBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#0d9488',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6
  },
  previewAiBadgeRow: {
    marginTop: 6,
    alignItems: 'center'
  },
  previewAiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ccfbf1',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6
  },
  previewAiBadgeText: {
    fontSize: 9.5,
    color: '#0f766e',
    fontWeight: '700'
  },

  /* SIMULADOR RADAR */
  previewAlertMockCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: '#fecaca'
  },
  previewAlertTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#991b1b',
    flex: 1
  },
  previewRadarTierBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5
  },
  previewRadarTierText: {
    fontSize: 9.5,
    color: '#dc2626',
    fontWeight: '800'
  },
  previewMapPlaceholder: {
    height: 38,
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  previewMapPlaceholderText: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '700'
  },
  previewActionPill: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  previewActionPillText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#475569'
  },

  /* SIMULADOR SERVICIOS */
  previewGridCard: {
    flex: 1,
    borderRadius: 10,
    padding: 8,
    borderWidth: 1.5
  },
  previewGridIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4
  },
  previewGridTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1e293b'
  },
  previewGridSub: {
    fontSize: 9.5,
    color: '#64748b'
  },
  previewStarsBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#ccfbf1',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 4
  },
  previewStarsText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#0f766e'
  },

  /* SIMULADOR PUBLICAR */
  previewBottomBarMock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  previewNavTab: {
    alignItems: 'center'
  },
  previewNavLabel: {
    fontSize: 8.5,
    color: '#94a3b8',
    fontWeight: '600'
  },
  previewPublishBtnHighlight: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 3
  },
  previewPublishPillsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 6
  },
  previewPublishPill: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#a7f3d0'
  },
  previewPublishPillText: {
    fontSize: 9.5,
    color: '#059669',
    fontWeight: '700'
  },

  /* TEXTOS EXPLICATIVOS */
  mainTitle: {
    fontWeight: '900',
    color: '#0f172a',
    marginTop: 6
  },
  mainHeadline: {
    fontWeight: '700',
    color: '#0d9488',
    marginTop: 2,
    marginBottom: 4
  },
  mainDesc: {
    color: '#334155',
    lineHeight: 16,
    marginBottom: 8
  },
  bulletsBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 8,
    gap: 4
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  bulletText: {
    color: '#1e293b',
    fontWeight: '600',
    flex: 1,
    lineHeight: 15
  },

  /* FOOTER */
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9'
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5
  },
  dot: {
    height: 5,
    borderRadius: 3
  },
  dotActive: {
    width: 16
  },
  dotInactive: {
    width: 5,
    backgroundColor: '#cbd5e1'
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  btnSecondary: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9'
  },
  btnSecondaryText: {
    color: '#475569',
    fontWeight: '700'
  },
  btnPrimary: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3
  },
  btnPrimaryText: {
    color: '#ffffff',
    fontWeight: '800'
  }
});
