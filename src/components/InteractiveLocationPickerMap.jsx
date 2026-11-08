import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';

/**
 * Componente de Mapa Interactivo con Leaflet + OpenStreetMap
 * Permite ver las calles, manzanas y casas alrededor,
 * y tocar o arrastrar el pin para ubicar la residencia exactamente (ej. en la esquina).
 */
export default function InteractiveLocationPickerMap({
  latitude = -11.9865,
  longitude = -77.0682,
  onLocationSelected,
  onCenterLocation,
  isLocating = false,
  fontScale = 1.0
}) {
  const webViewRef = useRef(null);

  // Generar HTML con Leaflet.js y OpenStreetMap
  const leafletHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          html, body {
            margin: 0;
            padding: 0;
            height: 100%;
            width: 100%;
            background-color: #f1f5f9;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            overflow: hidden;
          }
          #map {
            width: 100%;
            height: 100%;
          }
          .custom-pin {
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .pin-icon {
            font-size: 30px;
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));
            transform: translate(-50%, -100%);
          }
          .leaflet-control-attribution {
            font-size: 8px !important;
            opacity: 0.6;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var initialLat = ${latitude || -11.9865};
          var initialLng = ${longitude || -77.0682};

          var map = L.map('map', {
            zoomControl: true,
            attributionControl: true
          }).setView([initialLat, initialLng], 17);

          // Capa de OpenStreetMap con nombres de calles, casas y manzanas
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap'
          }).addTo(map);

          // Icono del marcador de residencia
          var pinIcon = L.divIcon({
            className: 'custom-pin',
            html: '<div class="pin-icon">📍</div>',
            iconSize: [30, 30],
            iconAnchor: [15, 30]
          });

          var marker = L.marker([initialLat, initialLng], {
            draggable: true,
            icon: pinIcon
          }).addTo(map);

          marker.bindPopup("<b>Tu Residencia</b><br/>Toca o arrastra para reubicar").openPopup();

          function notifyApp(lat, lng) {
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'location_selected',
                latitude: lat,
                longitude: lng
              }));
            }
          }

          // Al hacer clic en cualquier parte del mapa (ej. esquina, casa del frente)
          map.on('click', function(e) {
            var lat = e.latlng.lat;
            var lng = e.latlng.lng;
            marker.setLatLng([lat, lng]);
            marker.openPopup();
            notifyApp(lat, lng);
          });

          // Al arrastrar el marcador directamente
          marker.on('dragend', function(e) {
            var position = marker.getLatLng();
            marker.openPopup();
            notifyApp(position.lat, position.lng);
          });

          // Escuchar comandos desde React Native para actualizar vista
          window.updatePosition = function(newLat, newLng) {
            marker.setLatLng([newLat, newLng]);
            map.panTo([newLat, newLng]);
          };
        </script>
      </body>
    </html>
  `;

  // Actualizar la vista del mapa cuando cambian las coordenadas en las props
  useEffect(() => {
    if (webViewRef.current && latitude && longitude) {
      const jsCode = `if (window.updatePosition) { window.updatePosition(${latitude}, ${longitude}); } true;`;
      webViewRef.current.injectJavaScript(jsCode);
    }
  }, [latitude, longitude]);

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data && data.type === 'location_selected') {
        if (onLocationSelected) {
          onLocationSelected({
            latitude: data.latitude,
            longitude: data.longitude
          });
        }
      }
    } catch (e) {
      console.warn('[Map WebView] Error parseando mensaje:', e);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <Ionicons name="map" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
          <Text style={[styles.headerTitle, { fontSize: Math.round(12 * fontScale) }]}>
            Mapa Comunal VeciRed (Calles y Manzanas)
          </Text>
        </View>
        {onCenterLocation && (
          <TouchableOpacity
            style={styles.recenterBtn}
            onPress={onCenterLocation}
            disabled={isLocating}
            activeOpacity={0.7}
          >
            {isLocating ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <>
                <Ionicons name="locate" size={14} color={COLORS.primary} style={{ marginRight: 4 }} />
                <Text style={styles.recenterBtnText}>Mi GPS</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.mapWrap}>
        <WebView
          ref={webViewRef}
          originWhitelist={['*']}
          source={{ html: leafletHtml }}
          style={styles.webview}
          onMessage={handleMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Cargando mapa vecinal...</Text>
            </View>
          )}
        />
      </View>

      <View style={styles.hintFooter}>
        <Ionicons name="hand-left-outline" size={14} color="#0369a1" style={{ marginRight: 5 }} />
        <Text style={[styles.hintText, { fontSize: Math.round(11 * fontScale) }]}>
          Toca en la esquina o casa exacta para ubicar tu residencia.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0'
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  headerTitle: {
    fontWeight: '700',
    color: '#1e293b'
  },
  recenterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6
  },
  recenterBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065f46'
  },
  mapWrap: {
    width: '100%',
    height: 250,
    backgroundColor: '#f1f5f9'
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent'
  },
  loadingBox: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center'
  },
  loadingText: {
    marginTop: 6,
    fontSize: 12,
    color: '#64748b'
  },
  hintFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#e0f2fe'
  },
  hintText: {
    color: '#0284c7',
    fontWeight: '600',
    flex: 1
  }
});

