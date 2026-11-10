// ==========================================================
// VECIRED IA - SERVICIO DE UBICACIÓN GPS Y CALIBRACIÓN PRECISA
// ==========================================================
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { Alert, Linking, Platform } from 'react-native';

const LOCATION_STORAGE_KEY = '@vecired_detected_location';
const CALIBRATED_STORAGE_KEY = '@vecired_manual_calibrated_location';

/**
 * Solicita explícitamente los permisos de ubicación con explicación al usuario si fueron denegados.
 */
export async function requestLocationPermissions() {
  try {
    const { status: existingStatus } = await Location.getForegroundPermissionsAsync().catch(() => ({ status: 'undetermined' }));
    if (existingStatus === 'granted') {
      return true;
    }

    const { status: requestedStatus } = await Location.requestForegroundPermissionsAsync().catch(() => ({ status: 'denied' }));
    if (requestedStatus === 'granted') {
      return true;
    }

    // Si el permiso fue rechazado, informar al usuario con opción a configuración
    if (Platform.OS !== 'web') {
      Alert.alert(
        'Permiso de Ubicación Requerido',
        'VeciRed necesita acceso a tu ubicación precisa para calibrar el mapa comunitario y ubicar las alertas de auxilio en tu vecindario.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Abrir Ajustes', onPress: () => Linking.openSettings().catch(() => {}) }
        ]
      );
    }
    return false;
  } catch (err) {
    console.warn('[LocationService] Error solicitando permisos:', err?.message);
    return false;
  }
}

/**
 * Guarda manualmente una ubicación calibrada por el usuario (ej: arrastrando el pin en el mapa).
 * Esta ubicación tiene prioridad absoluta sobre la detección IP o celdas de telefonía lejanas.
 */
export async function saveCalibratedUserLocation(latitude, longitude, customAddress = null) {
  try {
    const geocoded = await reverseGeocodeCoords(latitude, longitude);
    const finalData = {
      ...(geocoded || {}),
      latitude,
      longitude,
      fullAddress: customAddress || geocoded?.fullAddress || `GPS: ${Number(latitude).toFixed(4)}, ${Number(longitude).toFixed(4)}`,
      zone: geocoded?.zone || 'Ubicación Calibrada',
      isCalibrated: true,
      calibratedAt: Date.now()
    };
    await AsyncStorage.setItem(CALIBRATED_STORAGE_KEY, JSON.stringify(finalData));
    await AsyncStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(finalData));
    return finalData;
  } catch (err) {
    console.warn('[LocationService] Error guardando calibración manual:', err);
    return null;
  }
}

/**
 * Obtiene la ubicación calibrada manualmente por el usuario si existe.
 */
export async function getCalibratedUserLocation() {
  try {
    const raw = await AsyncStorage.getItem(CALIBRATED_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return null;
}

/**
 * Limpia la calibración guardada para forzar una nueva lectura satelital.
 */
export async function clearCalibratedLocation() {
  try {
    await AsyncStorage.removeItem(CALIBRATED_STORAGE_KEY);
    await AsyncStorage.removeItem(LOCATION_STORAGE_KEY);
  } catch (_) {}
}

/**
 * Obtiene la posición GPS real y fresca del dispositivo móvil o navegador.
 * Ejecuta cascada de precisión: Highest -> Balanced.
 */
export async function getRawGpsPosition(timeoutMs = 8000, forceFresh = false) {
  // 1. Probar primero con expo-location nativo
  try {
    const hasPermission = await requestLocationPermissions();
    if (hasPermission) {
      try {
        await Location.enableNetworkProviderAsync().catch(() => {});
      } catch (_) {}

      // Intentar primero con la máxima precisión satelital (Highest)
      try {
        const cur = await Promise.race([
          Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Highest,
            mayShowUserSettingsDialog: true
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout Highest')), timeoutMs))
        ]);

        if (cur?.coords?.latitude && cur?.coords?.longitude) {
          return {
            latitude: cur.coords.latitude,
            longitude: cur.coords.longitude,
            accuracy: cur.coords.accuracy || 5
          };
        }
      } catch (errHigh) {
        // Fallback rápido a Balanced (red / wifi / GPS mixto) si Highest tardó mucho
        try {
          const balanced = await Promise.race([
            Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
              mayShowUserSettingsDialog: true
            }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout Balanced')), 4000))
          ]);
          if (balanced?.coords?.latitude && balanced?.coords?.longitude) {
            return {
              latitude: balanced.coords.latitude,
              longitude: balanced.coords.longitude,
              accuracy: balanced.coords.accuracy || 15
            };
          }
        } catch (_) {}
      }

      // Solo si NO se pide fuerza fresca estricta, usar última posición conocida
      if (!forceFresh) {
        const lastKnown = await Location.getLastKnownPositionAsync().catch(() => null);
        if (lastKnown?.coords?.latitude && lastKnown?.coords?.longitude) {
          return {
            latitude: lastKnown.coords.latitude,
            longitude: lastKnown.coords.longitude,
            accuracy: lastKnown.coords.accuracy || 30
          };
        }
      }
    }
  } catch (err) {
    console.warn('[LocationService] expo-location error:', err?.message);
  }

  // 2. Fallback a navigator.geolocation (Web o WebView)
  if (typeof navigator !== 'undefined' && navigator.geolocation) {
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy || 10
          });
        },
        (err) => {
          console.warn('[LocationService] Geolocation error:', err?.message);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: timeoutMs,
          maximumAge: forceFresh ? 0 : 10000
        }
      );
    });
  }

  return null;
}

/**
 * Geocodificación inversa real: convierte lat/lng en dirección física
 * con calle, distrito, ciudad y región.
 */
export async function reverseGeocodeCoords(latitude, longitude) {
  if (!latitude || !longitude) return null;

  // 1. Intentar con Location nativo de Expo
  try {
    const nativeRev = await Promise.race([
      Location.reverseGeocodeAsync({ latitude, longitude }),
      new Promise((_, r) => setTimeout(() => r(null), 3000))
    ]);

    if (Array.isArray(nativeRev) && nativeRev.length > 0) {
      const item = nativeRev[0];
      const street = [item.street, item.streetNumber].filter(Boolean).join(' ') || item.name || '';
      const district = item.district || item.subregion || item.city || '';
      const city = item.city || item.region || 'Perú';
      const department = item.region || 'Perú';
      const fullAddr = [street, district, city].filter(Boolean).join(', ') || `${district}, ${city}`;
      const zoneStr = district ? `${district} • Manzana comunal` : `${city} • Zona Comunitaria`;

      if (fullAddr.length > 3) {
        return {
          latitude,
          longitude,
          street: street || fullAddr,
          district: district || city,
          city,
          department,
          fullAddress: fullAddr,
          zone: zoneStr,
          rawAddress: item
        };
      }
    }
  } catch (_) {}

  // 2. Intentar con Nominatim (OpenStreetMap)
  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
    const res = await fetch(nominatimUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'VeciRedApp/1.0 (Hackathon Peru Community App)'
      }
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.address) {
        const addr = data.address;
        const street = addr.road || addr.pedestrian || addr.footway || addr.cycleway || addr.neighbourhood || '';
        const houseNumber = addr.house_number ? ` ${addr.house_number}` : '';
        const district = addr.suburb || addr.city_district || addr.district || addr.neighbourhood || addr.quarter || addr.town || '';
        const city = addr.city || addr.town || addr.municipality || addr.county || 'Perú';
        const department = addr.state || addr.region || 'Perú';

        const fullStreet = street ? `${street}${houseNumber}`.trim() : (data.name || 'Mi ubicación comunitaria');
        const zoneStr = district ? `${district} • Manzana comunitaria` : `${city} • Zona Comunitaria`;
        const fullAddr = [fullStreet, district, city].filter(Boolean).join(', ');

        return {
          latitude,
          longitude,
          street: fullStreet,
          district: district || city,
          city,
          department,
          fullAddress: fullAddr,
          zone: zoneStr,
          rawAddress: addr
        };
      }
    }
  } catch (_) {}

  // 3. Fallback a BigDataCloud
  try {
    const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=es`;
    const bdcRes = await fetch(bdcUrl);
    if (bdcRes.ok) {
      const bdcData = await bdcRes.json();
      const city = bdcData.city || bdcData.locality || 'Perú';
      const district = bdcData.locality || bdcData.principalSubdivision || city;
      const department = bdcData.principalSubdivision || 'Perú';
      const fullStreet = `Ubicación GPS (${Number(latitude).toFixed(4)}, ${Number(longitude).toFixed(4)})`;

      return {
        latitude,
        longitude,
        street: fullStreet,
        district,
        city,
        department,
        fullAddress: `${district}, ${city}, ${department}`,
        zone: `${district} • Manzana comunal`
      };
    }
  } catch (_) {}

  return {
    latitude,
    longitude,
    street: `Coordenadas: ${Number(latitude).toFixed(4)}, ${Number(longitude).toFixed(4)}`,
    district: 'Mi comunidad',
    city: 'Perú',
    department: 'Perú',
    fullAddress: `GPS: ${Number(latitude).toFixed(4)}, ${Number(longitude).toFixed(4)}`,
    zone: `Comunidad vecinal • GPS Detectado`
  };
}

/**
 * Función principal que detecta y retorna la ubicación real en vivo del usuario.
 * Prioriza calibración manual guardada a menos que se fuerce refresco.
 */
export async function getOrDetectUserLocation(forceRefresh = false) {
  // 1. Si no es refresco forzado, revisar primero si el usuario ya calibró manualmente su posición
  if (!forceRefresh) {
    const calibrated = await getCalibratedUserLocation();
    if (calibrated && calibrated.latitude && calibrated.longitude) {
      return calibrated;
    }

    try {
      const cached = await AsyncStorage.getItem(LOCATION_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - (parsed.detectedAt || 0) < 300000) { // 5 minutos máx
          return parsed;
        }
      }
    } catch (_) {}
  } else {
    try {
      await AsyncStorage.removeItem(LOCATION_STORAGE_KEY);
    } catch (_) {}
  }

  // 2. Detectar GPS real con alta precisión y solicitud de permisos
  const gps = await getRawGpsPosition(8000, forceRefresh);
  if (!gps) {
    const calibrated = await getCalibratedUserLocation();
    if (calibrated) return calibrated;

    try {
      const cached = await AsyncStorage.getItem(LOCATION_STORAGE_KEY);
      if (cached) return JSON.parse(cached);
    } catch (_) {}
    return null;
  }

  // 3. Geocodificar la dirección física
  const geocoded = await reverseGeocodeCoords(gps.latitude, gps.longitude);
  const result = {
    ...geocoded,
    accuracy: gps.accuracy,
    detectedAt: Date.now()
  };

  // 4. Guardar en caché persistente
  try {
    await AsyncStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(result));
  } catch (_) {}

  return result;
}

export default {
  requestLocationPermissions,
  saveCalibratedUserLocation,
  getCalibratedUserLocation,
  clearCalibratedLocation,
  getRawGpsPosition,
  reverseGeocodeCoords,
  getOrDetectUserLocation
};
