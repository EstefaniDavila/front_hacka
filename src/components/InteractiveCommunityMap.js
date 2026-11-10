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
import { getOrDetectUserLocation, saveCalibratedUserLocation, getCalibratedUserLocation, clearCalibratedLocation, requestLocationPermissions } from '../services/locationService';
import { Alert } from 'react-native';
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
  latitude = -16.4360,
  longitude = -71.5612,
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
  const [zoom, setZoom] = useState(mode === 'emergency' ? 14 : 18);
  const [isLocating, setIsLocating] = useState(false);
  const [justCalibrated, setJustCalibrated] = useState(false);

  const handlePinMoved = async (newLat, newLng) => {
    setCurrentLat(newLat);
    setCurrentLng(newLng);
    setJustCalibrated(true);
    setTimeout(() => setJustCalibrated(false), 3500);
    try {
      await saveCalibratedUserLocation(newLat, newLng);
      if (onLocationChange) {
        onLocationChange(newLat, newLng);
      }
    } catch (_) {}
  };

  const handleCalibrateLocation = async () => {
    setIsLocating(true);
    try {
      await clearCalibratedLocation();
      const loc = await getOrDetectUserLocation(true);
      if (loc && loc.latitude && loc.longitude) {
        setCurrentLat(loc.latitude);
        setCurrentLng(loc.longitude);
        setZoom(18);
        setMapRevision((r) => r + 1);
        setJustCalibrated(true);
        setTimeout(() => setJustCalibrated(false), 4000);
        await saveCalibratedUserLocation(loc.latitude, loc.longitude, loc.fullAddress);
        if (onLocationChange) {
          onLocationChange(loc.latitude, loc.longitude, loc.fullAddress);
        }
        Alert.alert(
          '📍 GPS Actualizado y Calibrado',
          `Se ha obtenido tu señal satelital en vivo:\nGPS: ${Number(loc.latitude).toFixed(4)}, ${Number(loc.longitude).toFixed(4)}\n\n💡 Si la señal quedó unos metros desfasada, toca el mapa o arrastra el punto rojo para fijar tu ubicación milimétrica.`
        );
      } else {
        Alert.alert(
          'Permiso de Ubicación',
          'No se pudo obtener la señal GPS en vivo. Asegúrate de otorgar permisos de ubicación en tu celular.'
        );
      }
    } catch (err) {
      console.warn('[InteractiveMap] Error calibrando:', err);
    } finally {
      setIsLocating(false);
    }
  };
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);
  const [mapRevision, setMapRevision] = useState(0);

  useEffect(() => {
    let isMounted = true;
    if (typeof latitude === 'number' && !isNaN(latitude)) {
      setCurrentLat(latitude);
      setCurrentLng(longitude);
    } else {
      getOrDetectUserLocation(false).then((loc) => {
        if (isMounted && loc && loc.latitude && loc.longitude) {
          setCurrentLat(loc.latitude);
          setCurrentLng(loc.longitude);
        }
      });
    }
    return () => { isMounted = false; };
  }, [latitude, longitude]);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleWebMsg = (e) => {
        try {
          const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
          if (data && data.type === 'PIN_MOVED') {
            const newLat = Number(data.latitude);
            const newLng = Number(data.longitude);
            setCurrentLat(newLat);
            setCurrentLng(newLng);
            handlePinMoved(newLat, newLng);
          }
        } catch (_) {}
      };
      window.addEventListener('message', handleWebMsg);
      return () => window.removeEventListener('message', handleWebMsg);
    }
  }, [onLocationChange]);

  const scale = (val) => Math.round(val * fontScale);

  // Obtener ubicación GPS real del usuario
  const handleGetCurrentLocation = async () => {
    setIsLocating(true);
    try {
      const loc = await getOrDetectUserLocation(true);
      if (loc && loc.latitude && loc.longitude) {
        setCurrentLat(loc.latitude);
        setCurrentLng(loc.longitude);
        setMapRevision((r) => r + 1);
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

  // Generación de mapa interactivo con soporte Satélite HD (Esri) y Calles (OSM)
  const isSatellite = mapType === 'k';
  const tileLayerUrl = isSatellite
    ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  const mapHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body, #map { width: 100%; height: 100%; background: #0f172a; overflow: hidden; }
          .pulse-marker {
            width: 24px; height: 24px; border-radius: 50%;
            background: ${mode === 'emergency' ? '#dc2626' : '#0d9488'};
            border: 3px solid #ffffff;
            box-shadow: 0 0 10px rgba(0,0,0,0.6);
            animation: radarPulse 1.8s infinite;
          }
          @keyframes radarPulse {
            0% { transform: scale(0.9); box-shadow: 0 0 0 0 ${mode === 'emergency' ? 'rgba(220, 38, 38, 0.7)' : 'rgba(13, 148, 136, 0.7)'}; }
            70% { transform: scale(1.15); box-shadow: 0 0 0 16px rgba(0,0,0,0); }
            100% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(0,0,0,0); }
          }
          .leaflet-control-attribution { display: none !important; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const centerPos = [${currentLat}, ${currentLng}];
          const map = L.map('map', { 
            zoomControl: false, 
            attributionControl: false,
            touchZoom: true,
            scrollWheelZoom: true,
            doubleClickZoom: false
          }).setView(centerPos, ${zoom});
          
          L.tileLayer('${tileLayerUrl}', { maxZoom: 19 }).addTo(map);
          const icon = L.divIcon({ className: 'pulse-marker', iconSize: [24, 24], iconAnchor: [12, 12] });
          const marker = L.marker(centerPos, {
            icon: icon,
            draggable: ${mode === 'picker'}
          }).addTo(map);

          const circles = [];
          ${mode === 'emergency' ? `
          // ONDA 1: Inmediata (0 a 500m) - Pulso Rojo Crítico
          circles.push(L.circle(centerPos, {
            color: '#dc2626',
            fillColor: '#ef4444',
            fillOpacity: 0.28,
            weight: 2.5,
            radius: 500
          }).addTo(map));

          // ONDA 2: Sectorial (500m a 1.5km) - Naranja Fuego
          circles.push(L.circle(centerPos, {
            color: '#ea580c',
            fillColor: '#f97316',
            fillOpacity: 0.14,
            weight: 2,
            dashArray: '6, 6',
            radius: 1500
          }).addTo(map));

          // ONDA 3: Comunal (1.5km a 3km) - Amarillo Alerta
          circles.push(L.circle(centerPos, {
            color: '#ca8a04',
            fillColor: '#facc15',
            fillOpacity: 0.08,
            weight: 1.5,
            dashArray: '4, 8',
            radius: 3000
          }).addTo(map));

          // ONDA 4: Perímetro Límite (3km a 5km) - Azul Perímetro (Límite Máximo)
          circles.push(L.circle(centerPos, {
            color: '#0284c7',
            fillColor: '#38bdf8',
            fillOpacity: 0.05,
            weight: 1.5,
            dashArray: '3, 10',
            radius: 5000
          }).addTo(map));
          ` : ''}

          function notifyPinMoved(lat, lng) {
            const payload = JSON.stringify({ type: 'PIN_MOVED', latitude: lat, longitude: lng });
            if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
              window.ReactNativeWebView.postMessage(payload);
            }
            if (window.parent && window.parent.postMessage) {
              window.parent.postMessage(payload, '*');
            }
          }

          function moveAll(lat, lng) {
            const pos = [lat, lng];
            marker.setLatLng(pos);
            circles.forEach(function(c) { c.setLatLng(pos); });
          }

          ${mode === 'picker' ? `
          marker.on('dragend', function(e) {
            const p = e.target.getLatLng();
            moveAll(p.lat, p.lng);
            notifyPinMoved(p.lat, p.lng);
          });

          map.on('click', function(e) {
            moveAll(e.latlng.lat, e.latlng.lng);
            notifyPinMoved(e.latlng.lat, e.latlng.lng);
          });
          ` : ''}

          setTimeout(function() {
            try {
              map.invalidateSize();
              map.setView(centerPos, ${zoom});
            } catch(e) {}
          }, 300);
        </script>
      </body>
    </html>
  `;

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
          <Text style={[styles.title, { fontSize: scale(13) }]} numberOfLines={2}>
            {title}
          </Text>
          <Text style={[styles.subtitle, { fontSize: scale(10) }]} numberOfLines={2}>
            {subtitle ? (subtitle.includes('GPS:') ? subtitle : `${subtitle} • GPS: ${Number(currentLat).toFixed(4)}, ${Number(currentLng).toFixed(4)}`) : `GPS: ${Number(currentLat).toFixed(4)}, ${Number(currentLng).toFixed(4)}`}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {/* Botón para Calibrar GPS */}
          <TouchableOpacity
            style={styles.calibrateMapBtn}
            activeOpacity={0.8}
            onPress={handleCalibrateLocation}
            accessibilityLabel="Calibrar ubicación GPS precisa"
            disabled={isLocating}
          >
            {isLocating ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Ionicons name="locate" size={13} color="#ffffff" style={{ marginRight: 3 }} />
                <Text style={[styles.calibrateMapBtnText, { fontSize: scale(10) }]}>
                  Calibrar GPS
                </Text>
              </>
            )}
          </TouchableOpacity>

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

      {justCalibrated && (
        <View style={styles.calibrationSuccessBar}>
          <Ionicons name="checkmark-circle" size={14} color="#15803d" style={{ marginRight: 4 }} />
          <Text style={styles.calibrationSuccessText}>
            ✓ Calibrado a tu puerta: {Number(currentLat).toFixed(4)}, {Number(currentLng).toFixed(4)}
          </Text>
        </View>
      )}

      {/* Contenedor del Mapa Embebido */}
      <View style={[styles.mapCanvasWrapper, { height }]}>
        {Platform.OS === 'web' ? (
          <iframe
            key={`map-web-${currentLat}-${currentLng}-${mapType}-${zoom}-${mapRevision}`}
            title="Mapa Comunitario VeciRed"
            srcDoc={mapHtml}
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
          />
        ) : (
          <WebView
            key={`map-mobile-${currentLat}-${currentLng}-${mapType}-${zoom}-${mapRevision}`}
            source={{ html: mapHtml }}
            style={{ flex: 1, borderRadius: 14 }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            scalesPageToFit={true}
            startInLoadingState={true}
            onMessage={(event) => {
              try {
                const data = JSON.parse(event.nativeEvent.data);
                if (data.type === 'PIN_MOVED') {
                  const newLat = Number(data.latitude);
                  const newLng = Number(data.longitude);
                  handlePinMoved(newLat, newLng);
                }
              } catch (_) {}
            }}
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

        {/* Franja de micro-calibración táctil solo en modo selector de puerta */}
        {mode === 'picker' && (
          <View style={styles.fineTunePill} pointerEvents="none">
            <Ionicons name="hand-right" size={11} color="#0f766e" style={{ marginRight: 4 }} />
            <Text style={styles.fineTunePillText}>
              Toca el mapa o arrastra el punto para calibrar exactamente a tu puerta
            </Text>
          </View>
        )}

        {/* Overlay Especial para Modo Emergencia (Epicentro y Cobertura 500m) */}
        {mode === 'emergency' && (
          <View style={styles.emergencyOverlayBadge} pointerEvents="none">
            <View style={styles.radarPulseDot} />
            <Text style={styles.emergencyOverlayText}>
              🔴 Radar Vecinal: 🔴 500m | 🟠 1.5km | 🟡 3km | 🔵 5km
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
  calibrateMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d9488',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    shadowColor: '#0d9488',
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2
  },
  calibrateMapBtnText: {
    color: '#ffffff',
    fontWeight: '800'
  },
  calibrationSuccessBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#86efac',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8
  },
  calibrationSuccessText: {
    color: '#15803d',
    fontSize: 11,
    fontWeight: '700'
  },
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
  fineTunePill: {
    position: 'absolute',
    top: 10,
    left: 12,
    right: 56,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccfbf1',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2
  },
  fineTunePillText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#0f766e',
    flex: 1
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
