import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Linking,
  ActivityIndicator
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { getOrDetectUserLocation } from '../services/locationService';
import { WebView } from 'react-native-webview';

/**
 * InteractiveCommunityMap
 * 
 * Componente inmersivo de Google Maps Satelital y Callejero VeciRed.
 * Funciona de manera optimizada en Web (vía iframe embebido oficial de Google Maps)
 * y en móvil (con enlace directo a la app oficial de Google Maps).
 * 
 * Soporta:
 * - Vista Satelital HD ('k'), Calles ('m') e Híbrida ('h').
 * - Detección y centrado con GPS real del dispositivo / navegador.
 * - Capas temáticas: Alertas de Emergencia con radar de cobertura,
 *   Punto de servicio/comercio vecinal, y Confirmación GPS de domicilio.
 * - Botón "Abrir en Google Maps" para navegación y rutas en tiempo real.
 */
export default function InteractiveCommunityMap({
  latitude = -12.0463,
  longitude = -77.0427,
  title = 'Zona Comunitaria',
  subtitle = 'Zona A • Manzana 2',
  height = 240,
  mode = 'simple', // 'emergency' | 'service' | 'product' | 'picker' | 'simple'
  radiusMeters = 500,
  volunteers = [],
  fontScale = 1.0,
  showControls = true,
  onOpenChat,
  onLocationChange
}) {
  const [currentLat, setCurrentLat] = useState(latitude);
  const [currentLng, setCurrentLng] = useState(longitude);
  const [mapType, setMapType] = useState('k'); // 'k': Satélite, 'm': Calles, 'h': Híbrido
  const [zoom, setZoom] = useState(17);
  const [isLocating, setIsLocating] = useState(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);
  const [mapRevision, setMapRevision] = useState(0);

  useEffect(() => {
    let isMounted = true;
    if (!latitude || latitude === -12.0463) {
      getOrDetectUserLocation().then((loc) => {
        if (isMounted && loc) {
          setCurrentLat(loc.latitude);
          setCurrentLng(loc.longitude);
        }
      });
    } else {
      setCurrentLat(latitude);
      setCurrentLng(longitude);
    }
    return () => { isMounted = false; };
  }, [latitude, longitude]);

  const scale = (val) => Math.round(val * fontScale);

  // Obtener ubicación GPS real del usuario
  const handleGetCurrentLocation = async () => {
    setIsLocating(true);
    try {
      const loc = await getOrDetectUserLocation(true);
      if (loc) {
        setCurrentLat(loc.latitude);
        setCurrentLng(loc.longitude);
        if (onLocationChange) {
          onLocationChange(loc.latitude, loc.longitude, loc.fullAddress);
        }
      }
    } catch (err) {
      console.warn('[InteractiveMap] Error obteniendo GPS:', err);
    } finally {
      setIsLocating(false);
    }
  };

  // Abrir en la app o web oficial de Google Maps
  const handleOpenExternalGoogleMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${currentLat},${currentLng}`;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url).catch((err) =>
        console.error('No se pudo abrir Google Maps:', err)
      );
    }
  };

  // URL de Google Maps oficial embebido
  const embedUrl = `https://maps.google.com/maps?q=${currentLat},${currentLng}&t=${mapType}&z=${zoom}&ie=UTF8&iwloc=&output=embed`;

  return (
    <View style={[styles.cardContainer, { minHeight: height }]}>
      {/* Barra de cabecera con información del cuadrante */}
      <View style={styles.headerRow}>
        <View style={styles.headerInfo}>
          <View style={styles.badgeRow}>
            <View style={[styles.statusDot, mode === 'emergency' && styles.statusDotEmergency]} />
            <Text style={[styles.badgeText, mode === 'emergency' && styles.badgeTextEmergency]}>
              {mode === 'emergency' ? 'ALERTA SATELITAL ACTIVA' : 'MAPA COMUNITARIO'}
            </Text>
          </View>
          <Text style={[styles.title, { fontSize: scale(13) }]} numberOfLines={1}>
            {title}
          </Text>
          <Text style={[styles.subtitle, { fontSize: scale(10) }]}>
            {subtitle} • GPS: {Number(currentLat).toFixed(4)}, {Number(currentLng).toFixed(4)}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {/* Botón para restablecer / recentrar mapa */}
          <TouchableOpacity
            style={styles.refreshMapBtn}
            activeOpacity={0.8}
            onPress={() => {
              setZoom(17);
              setMapRevision((r) => r + 1);
            }}
            accessibilityLabel="Centrar y restablecer mapa"
          >
            <Ionicons name="refresh" size={14} color="#0f766e" />
          </TouchableOpacity>

          {/* Botón para abrir en Google Maps oficial */}
          <TouchableOpacity
            style={styles.openExternalBtn}
            activeOpacity={0.8}
            onPress={handleOpenExternalGoogleMaps}
          >
            <MaterialCommunityIcons name="google-maps" size={16} color="#ffffff" style={{ marginRight: 4 }} />
            <Text style={[styles.openExternalBtnText, { fontSize: scale(10) }]}>
              Abrir Maps
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Contenedor del Mapa Embebido */}
      <View style={[styles.mapCanvasWrapper, { height }]}>
        {Platform.OS === 'web' ? (
          <iframe
            key={`gmap-${currentLat}-${currentLng}-${mapType}-${zoom}-${mapRevision}`}
            title="Google Maps VeciRed"
            src={embedUrl}
            tabIndex={-1}
            width="100%"
            height="100%"
            style={{
              border: 0,
              borderRadius: 14,
              display: 'block',
              width: '100%',
              height: '100%'
            }}
            loading="lazy"
            allowFullScreen
          />
        ) : (
          <WebView
            source={{ uri: embedUrl }}
            style={{ flex: 1, borderRadius: 14 }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            scalesPageToFit={true}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9' }]}>
                <ActivityIndicator size="small" color={COLORS.primaryDark} />
                <Text style={{ marginTop: 6, fontSize: 11, color: '#64748b', fontWeight: '700' }}>Cargando Mapa Satelital...</Text>
              </View>
            )}
          />
        )}

        {/* Botonera Flotante de Controles sobre el Mapa */}
        {showControls && (
          <View style={styles.floatingControls} pointerEvents="box-none">
            {/* Toggle Tipo de Mapa: Satélite vs Callejero */}
            <View style={styles.mapTypeToggleGroup}>
              <TouchableOpacity
                style={[styles.toggleBtn, mapType === 'k' && styles.toggleBtnActive]}
                onPress={() => setMapType('k')}
                activeOpacity={0.8}
              >
                <Text style={[styles.toggleBtnText, mapType === 'k' && styles.toggleBtnTextActive]}>
                  🛰️ Satélite
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, mapType === 'm' && styles.toggleBtnActive]}
                onPress={() => setMapType('m')}
                activeOpacity={0.8}
              >
                <Text style={[styles.toggleBtnText, mapType === 'm' && styles.toggleBtnTextActive]}>
                  🗺️ Calles
                </Text>
              </TouchableOpacity>
            </View>

            {/* Botón de Zoom y GPS */}
            <View style={styles.controlButtonsCol} pointerEvents="box-none">
              <TouchableOpacity
                style={styles.circleControlBtn}
                onPress={() => setZoom((z) => Math.min(20, z + 1))}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={18} color="#0f172a" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.circleControlBtn}
                onPress={() => setZoom((z) => Math.max(12, z - 1))}
                activeOpacity={0.8}
              >
                <Ionicons name="remove" size={18} color="#0f172a" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.circleControlBtn, isLocating && styles.circleControlBtnLoading]}
                onPress={handleGetCurrentLocation}
                activeOpacity={0.8}
                disabled={isLocating}
              >
                {isLocating ? (
                  <ActivityIndicator size="small" color={COLORS.primaryDark} />
                ) : (
                  <Ionicons name="locate" size={18} color={COLORS.primaryDark} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Overlay Especial para Modo Emergencia (Epicentro y Cobertura 500m) */}
        {mode === 'emergency' && (
          <View style={styles.emergencyOverlayBadge} pointerEvents="none">
            <View style={styles.radarPulseDot} />
            <Text style={styles.emergencyOverlayText}>
              🔴 Radio de Cobertura Activo: {radiusMeters} metros
            </Text>
          </View>
        )}
      </View>

      {/* Franja Inferior Informativa de Brigadistas o Ubicación */}
      {mode === 'emergency' && volunteers.length > 0 && (
        <View style={styles.volunteersMapFooter}>
          <Text style={[styles.volunteersFooterTitle, { fontSize: scale(11) }]}>
            🚨 Brigada vecinal en el cuadrante ({volunteers.length}):
          </Text>
          <View style={styles.volunteersPillsRow}>
            {volunteers.map((vol) => (
              <TouchableOpacity
                key={vol.id}
                style={[
                  styles.volPill,
                  selectedVolunteer?.id === vol.id && styles.volPillActive
                ]}
                activeOpacity={0.8}
                onPress={() => {
                  setSelectedVolunteer(vol);
                  if (onOpenChat && vol.name !== 'Tú (Vecino)') {
                    onOpenChat({
                      id: `vol-${vol.id}`,
                      name: vol.name,
                      skill: vol.skill,
                      avatar: vol.avatar || '👤'
                    });
                  }
                }}
              >
                <Text style={{ fontSize: 13, marginRight: 4 }}>{vol.avatar || '👤'}</Text>
                <Text style={styles.volPillName}>{vol.name.split(' ')[0]}</Text>
                <Text style={styles.volPillDist}>• {vol.distance || '50m'}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Franja Inferior para Servicios o Productos */}
      {(mode === 'service' || mode === 'product') && (
        <View style={styles.serviceMapFooter}>
          <Ionicons name="shield-checkmark" size={15} color="#0f766e" />
          <Text style={[styles.serviceFooterText, { fontSize: scale(10.5) }]}>
            Ubicación barrial verificada • Entregas y visitas directas en Manzanas 1 a 4
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    marginVertical: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  headerInfo: {
    flex: 1,
    marginRight: 8
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#0d9488',
    marginRight: 5
  },
  statusDotEmergency: {
    backgroundColor: '#dc2626'
  },
  badgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#0d9488',
    letterSpacing: 0.5
  },
  badgeTextEmergency: {
    color: '#dc2626'
  },
  title: {
    fontWeight: '800',
    color: COLORS.textPrimary,
    lineHeight: 18
  },
  subtitle: {
    color: '#64748b',
    fontWeight: '500',
    marginTop: 1
  },
  openExternalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f766e',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    shadowColor: '#0f766e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2
  },
  openExternalBtnText: {
    color: '#ffffff',
    fontWeight: '800'
  },
  mapCanvasWrapper: {
    width: '100%',
    position: 'relative',
    backgroundColor: '#0f172a'
  },
  mobileFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    padding: 20
  },
  mobileFallbackTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primaryDark,
    marginTop: 8
  },
  mobileFallbackSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4
  },
  refreshMapBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#e6fffa',
    borderWidth: 1,
    borderColor: '#99f6e4',
    alignItems: 'center',
    justifyContent: 'center'
  },
  floatingControls: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
    alignItems: 'flex-end',
    gap: 6,
    pointerEvents: 'box-none'
  },
  mapTypeToggleGroup: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 10,
    padding: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3
  },
  toggleBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  toggleBtnActive: {
    backgroundColor: '#0f766e'
  },
  toggleBtnText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#475569'
  },
  toggleBtnTextActive: {
    color: '#ffffff'
  },
  controlButtonsCol: {
    gap: 4
  },
  circleControlBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3
  },
  circleControlBtnLoading: {
    backgroundColor: '#ccfbf1'
  },
  emergencyOverlayBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.5)',
    zIndex: 10
  },
  radarPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    marginRight: 6
  },
  emergencyOverlayText: {
    color: '#ffffff',
    fontSize: 10.5,
    fontWeight: '800'
  },
  volunteersMapFooter: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fef2f2',
    borderTopWidth: 1,
    borderTopColor: '#fee2e2'
  },
  volunteersFooterTitle: {
    fontWeight: '800',
    color: '#991b1b',
    marginBottom: 6
  },
  volunteersPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6
  },
  volPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fca5a5'
  },
  volPillActive: {
    backgroundColor: '#fee2e2',
    borderColor: '#dc2626'
  },
  volPillName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1f2937'
  },
  volPillDist: {
    fontSize: 10,
    color: '#dc2626',
    fontWeight: '600',
    marginLeft: 3
  },
  serviceMapFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f0fdfa',
    borderTopWidth: 1,
    borderTopColor: '#ccfbf1',
    gap: 6
  },
  serviceFooterText: {
    fontWeight: '700',
    color: '#0f766e',
    flex: 1
  }
});
