import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  useWindowDimensions,
  Platform,
  StatusBar
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';

export const TOUR_STEPS = [
  {
    id: 'sos',
    tag: 'SEGURIDAD VECINAL',
    title: '🚨 Botón de Auxilio SOS Inmediato',
    desc: 'Tu línea directa ante una emergencia. Al presionarlo, emites una alerta satelital con ondas concéntricas de hasta 5 km para movilizar a vecinos y brigadistas cercanos.',
    icon: 'alarm-light',
    iconType: 'material',
    accentColor: '#dc2626',
    pillText: 'Onda 500m - 5km'
  },
  {
    id: 'voice',
    tag: 'INTELIGENCIA ARTIFICIAL',
    title: '🎙️ Búsqueda Inteligente por Voz',
    desc: 'Habla o escribe lo que necesitas: "gasfitero", "auxilio médico" o "comida". La IA de VeciRed prioriza por cercanía exacta a tu manzana y reputación vecinal.',
    icon: 'mic',
    iconType: 'ionicons',
    accentColor: '#0d9488',
    pillText: 'Reconocimiento de voz'
  },
  {
    id: 'emergencies',
    tag: 'RADAR EN VIVO',
    title: '🗺️ Centro de Emergencias y Radar',
    desc: 'Sigue en tiempo real las alertas activas, visualiza el mapa satelital interactivo, sube fotos y evidencias del suceso o únete a la brigada de guardia vecinal.',
    icon: 'shield-alert',
    iconType: 'material',
    accentColor: '#b91c1c',
    pillText: 'Mapa y Brigadas'
  },
  {
    id: 'services',
    tag: 'ECONOMÍA LOCAL',
    title: '🛍️ Servicios y Red Solidaria',
    desc: 'Contrata técnicos y oficios recomendados por tus propios vecinos, compra productos locales o solicita y ofrece apoyo en la red solidaria barrial.',
    icon: 'grid',
    iconType: 'ionicons',
    accentColor: '#0284c7',
    pillText: 'Comercio y Solidaridad'
  },
  {
    id: 'publish',
    tag: 'PARTICIPACIÓN VECINAL',
    title: '➕ Botón Central Publicar',
    desc: 'Ofrece tus habilidades profesionales, publica productos de tu negocio o pide ayuda para contingencias familiares. ¡Tu comunidad está para respaldarte!',
    icon: 'add-circle',
    iconType: 'ionicons',
    accentColor: '#059669',
    pillText: 'Crea tu publicación'
  }
];

export default function SpotlightTourModal({
  visible,
  onClose,
  fontScale = 1.0,
  targetLayouts = {},
  initialStep = 0
}) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const scale = (val) => Math.round(val * fontScale);
  const [currentStepIndex, setCurrentStepIndex] = useState(initialStep);

  // Animación de pulso para el aro del foco
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      setCurrentStepIndex(0);
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
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
    }
  }, [visible]);

  if (!visible) return null;

  const currentStep = TOUR_STEPS[currentStepIndex] || TOUR_STEPS[0];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === TOUR_STEPS.length - 1;

  // Cálculo del contenedor adaptable a tablets y móviles (ancho máx 600)
  const containerWidth = Math.min(windowWidth, 600);
  const containerLeft = windowWidth > 600 ? (windowWidth - 600) / 2 : 0;
  const statusbarOffset = Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : (Platform.OS === 'web' ? 8 : 44);

  // Obtener o calcular posición del elemento a resaltar (spotlight)
  const getSpotlightBox = () => {
    const layout = targetLayouts[currentStep.id];
    if (layout && typeof layout.x === 'number' && typeof layout.y === 'number' && layout.width > 0 && layout.height > 0) {
      return {
        x: Math.max(0, layout.x - 6),
        y: Math.max(0, layout.y - 6),
        width: layout.width + 12,
        height: layout.height + 12,
        radius: (layout.radius || 14) + 4
      };
    }

    // Coordenadas calculadas según el elemento objetivo
    switch (currentStep.id) {
      case 'sos':
        return {
          x: containerLeft + containerWidth - 180,
          y: statusbarOffset + 10,
          width: 60,
          height: 38,
          radius: 19
        };
      case 'voice':
        return {
          x: containerLeft + 16,
          y: statusbarOffset + 124,
          width: containerWidth - 32,
          height: 50,
          radius: 14
        };
      case 'emergencies': {
        const cardW = (containerWidth - 32 - 12) / 2;
        return {
          x: containerLeft + 16 + cardW + 12,
          y: statusbarOffset + 310,
          width: cardW,
          height: 98,
          radius: 16
        };
      }
      case 'services': {
        const cardW = (containerWidth - 32 - 12) / 2;
        return {
          x: containerLeft + 16,
          y: statusbarOffset + 200,
          width: cardW,
          height: 98,
          radius: 16
        };
      }
      case 'publish':
        return {
          x: containerLeft + (containerWidth / 2) - 30,
          y: windowHeight - 74,
          width: 60,
          height: 60,
          radius: 30
        };
      default:
        return {
          x: containerLeft + 20,
          y: windowHeight / 2 - 50,
          width: containerWidth - 40,
          height: 100,
          radius: 16
        };
    }
  };

  const box = getSpotlightBox();

  // Posicionar la tarjeta de explicación encima o debajo del foco
  const cardWidth = Math.min(windowWidth - 32, 420);
  const cardLeft = (windowWidth - cardWidth) / 2;

  // Si el elemento está en la mitad superior de la pantalla, la tarjeta va abajo
  // Si está en la mitad inferior, la tarjeta va arriba
  const placeBelow = (box.y + box.height + 230) < windowHeight;
  const cardTop = placeBelow
    ? Math.min(box.y + box.height + 14, windowHeight - 240)
    : Math.max(16, box.y - 230);

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

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot} pointerEvents="box-none">
        {/* Máscara de 4 cajas que oscurece el fondo dejando el foco despejado */}
        {/* 1. Caja Superior */}
        <View
          style={[
            styles.backdropBox,
            { top: 0, left: 0, right: 0, height: Math.max(0, box.y) }
          ]}
        />

        {/* 2. Caja Inferior */}
        <View
          style={[
            styles.backdropBox,
            {
              top: box.y + box.height,
              left: 0,
              right: 0,
              bottom: 0
            }
          ]}
        />

        {/* 3. Caja Izquierda */}
        <View
          style={[
            styles.backdropBox,
            {
              top: box.y,
              left: 0,
              width: Math.max(0, box.x),
              height: box.height
            }
          ]}
        />

        {/* 4. Caja Derecha */}
        <View
          style={[
            styles.backdropBox,
            {
              top: box.y,
              left: box.x + box.width,
              right: 0,
              height: box.height
            }
          ]}
        />

        {/* Anillo de enfoque con pulso sutil sobre el elemento objetivo */}
        <Animated.View
          style={[
            styles.spotlightRing,
            {
              top: box.y,
              left: box.x,
              width: box.width,
              height: box.height,
              borderRadius: box.radius,
              borderColor: currentStep.accentColor || '#0d9488',
              transform: [{ scale: pulseAnim }]
            }
          ]}
        />

        {/* Tarjeta flotante interactiva de explicación */}
        <View
          style={[
            styles.tooltipCard,
            {
              top: cardTop,
              left: cardLeft,
              width: cardWidth
            }
          ]}
        >
          {/* Fila superior: Tag temático + Paso X de N + Botón Omitir */}
          <View style={styles.cardHeaderRow}>
            <View style={[styles.stepTagPill, { backgroundColor: `${currentStep.accentColor}18` }]}>
              <Text style={[styles.stepTagText, { color: currentStep.accentColor, fontSize: scale(10) }]}>
                {currentStep.tag}
              </Text>
            </View>

            <View style={styles.stepCounterBadge}>
              <Text style={[styles.stepCounterText, { fontSize: scale(11) }]}>
                {currentStepIndex + 1} de {TOUR_STEPS.length}
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={styles.skipBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={[styles.skipBtnText, { fontSize: scale(11) }]}>Omitir</Text>
              <Ionicons name="close" size={14} color="#64748b" style={{ marginLeft: 2 }} />
            </TouchableOpacity>
          </View>

          {/* Título de la función */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 8 }}>
            <View style={[styles.iconCircle, { backgroundColor: `${currentStep.accentColor}20` }]}>
              {currentStep.iconType === 'material' ? (
                <MaterialCommunityIcons name={currentStep.icon} size={20} color={currentStep.accentColor} />
              ) : (
                <Ionicons name={currentStep.icon} size={20} color={currentStep.accentColor} />
              )}
            </View>
            <Text style={[styles.cardTitle, { fontSize: scale(14.5) }]} numberOfLines={2}>
              {currentStep.title}
            </Text>
          </View>

          {/* Descripción clara y concisa */}
          <Text style={[styles.cardDesc, { fontSize: scale(11.5) }]}>
            {currentStep.desc}
          </Text>

          {/* Barra inferior: Indicadores de puntos + Botones Anterior / Siguiente */}
          <View style={styles.cardFooterRow}>
            {/* Puntos de progreso */}
            <View style={styles.dotsRow}>
              {TOUR_STEPS.map((_, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.dot,
                    idx === currentStepIndex
                      ? [styles.dotActive, { backgroundColor: currentStep.accentColor }]
                      : styles.dotInactive
                  ]}
                />
              ))}
            </View>

            <View style={styles.buttonsGroup}>
              {!isFirstStep && (
                <TouchableOpacity
                  style={styles.prevBtn}
                  onPress={handlePrev}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.prevBtnText, { fontSize: scale(11.5) }]}>‹ Anterior</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.nextBtn, { backgroundColor: currentStep.accentColor }]}
                onPress={handleNext}
                activeOpacity={0.85}
              >
                <Text style={[styles.nextBtnText, { fontSize: scale(12) }]}>
                  {isLastStep ? '¡Comenzar!' : 'Siguiente ›'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    position: 'relative'
  },
  backdropBox: {
    position: 'absolute',
    backgroundColor: 'rgba(15, 23, 42, 0.78)'
  },
  spotlightRing: {
    position: 'absolute',
    borderWidth: 3,
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8
  },
  tooltipCard: {
    position: 'absolute',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 12
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  stepTagPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8
  },
  stepTagText: {
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  stepCounterBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10
  },
  stepCounterText: {
    fontWeight: '700',
    color: '#475569'
  },
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 4
  },
  skipBtnText: {
    color: '#64748b',
    fontWeight: '600'
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cardTitle: {
    fontWeight: '900',
    color: '#0f172a',
    flex: 1
  },
  cardDesc: {
    color: '#334155',
    lineHeight: 18,
    marginTop: 8,
    marginBottom: 14
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9'
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5
  },
  dot: {
    height: 6,
    borderRadius: 3
  },
  dotActive: {
    width: 18
  },
  dotInactive: {
    width: 6,
    backgroundColor: '#cbd5e1'
  },
  buttonsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  prevBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#f1f5f9'
  },
  prevBtnText: {
    color: '#475569',
    fontWeight: '700'
  },
  nextBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3
  },
  nextBtnText: {
    color: '#ffffff',
    fontWeight: '800'
  }
});
