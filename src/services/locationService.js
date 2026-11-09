// ==========================================================
// VECIRED IA - SERVICIO DE UBICACIÓN GPS Y GEOCODIFICACIÓN REAL
// ==========================================================
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

const LOCATION_STORAGE_KEY = '@vecired_detected_location';

/**
 * Obtiene la posición GPS real y calibrada del dispositivo móvil o navegador.
 * Retorna { latitude, longitude, accuracy }
 */
export async function getRawGpsPosition(timeoutMs = 9000, forceFresh = false) {
  // 1. Probar primero con expo-location en dispositivos móviles nativos
  try {
    const { status } = await Location.getForegroundPermissionsAsync().catch(() => ({ status: 'undetermined' }));
    let hasPermission = status === 'granted';
    if (!hasPermission) {
      const req = await Location.requestForegroundPermissionsAsync().catch(() => ({ status: 'denied' }));
      hasPermission = req.status === 'granted';
    }

    if (hasPermission) {
      // 1.1 Habilitar proveedor de red de alta precisión en Android si es necesario
      try {
        await Location.enableNetworkProviderAsync().catch(() => {});
      } catch (_) {}

      // 1.2 Intentar lectura GPS en tiempo real con máxima precisión disponible (BestForNavigation)
      try {
        const cur = await Promise.race([
          Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.BestForNavigation,
            mayShowUserSettingsDialog: true
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout expo-location BestForNavigation')), timeoutMs))
        ]);

        if (cur && cur.coords && cur.coords.latitude && cur.coords.longitude) {
          return {
            latitude: cur.coords.latitude,
            longitude: cur.coords.longitude,
            accuracy: cur.coords.accuracy || 5
          };
        }
      } catch (errHigh) {
        console.warn('[LocationService] getCurrentPositionAsync High falló o timeout:', errHigh?.message);
      }

      // 1.2 Si falló o timeout y no se fuerza fresca estricta, usar última conocida
      if (!forceFresh) {
        const lastKnown = await Location.getLastKnownPositionAsync().catch(() => null);
        if (lastKnown && lastKnown.coords) {
          return {
            latitude: lastKnown.coords.latitude,
            longitude: lastKnown.coords.longitude,
            accuracy: lastKnown.coords.accuracy || 15
          };
        }
      }
    }
  } catch (err) {
    console.warn('[LocationService] expo-location fallback to navigator:', err?.message);
  }

  // 2. Fallback a navigator.geolocation (Web o emulador)
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
          console.warn('[LocationService] No se pudo obtener GPS directo:', err?.message);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: timeoutMs,
          maximumAge: forceFresh ? 0 : 15000
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

  // 1. Intentar primero con Location nativo de Expo (alta precisión en iOS y Android)
  try {
    const nativeRev = await Promise.race([
      Location.reverseGeocodeAsync({ latitude, longitude }),
      new Promise((_, r) => setTimeout(() => r(null), 3500))
    ]);

    if (Array.isArray(nativeRev) && nativeRev.length > 0) {
      const item = nativeRev[0];
      const street = [item.street, item.streetNumber].filter(Boolean).join(' ') || item.name || '';
      const district = item.district || item.subregion || '';
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
  } catch (errNative) {
    console.warn('[LocationService] Expo native reverseGeocode falló, probando Nominatim:', errNative?.message);
  }

  // 2. Intentar con Nominatim (OpenStreetMap) con User-Agent válido
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
  } catch (err) {
    console.warn('[LocationService] Nominatim reverse error:', err?.message);
  }

  // 3. Fallback a BigDataCloud Reverse Geocode
  try {
    const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=es`;
    const bdcRes = await fetch(bdcUrl);
    if (bdcRes.ok) {
      const bdcData = await bdcRes.json();
      const city = bdcData.city || bdcData.locality || 'Perú';
      const district = bdcData.locality || bdcData.principalSubdivision || city;
      const department = bdcData.principalSubdivision || 'Perú';
      const fullStreet = `Ubicación GPS (${Number(latitude).toFixed(5)}, ${Number(longitude).toFixed(5)})`;

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
  } catch (err) {
    console.warn('[LocationService] BigDataCloud fallback error:', err?.message);
  }

  // Fallback con coordenadas exactas
  return {
    latitude,
    longitude,
    street: `Coordenadas: ${Number(latitude).toFixed(5)}, ${Number(longitude).toFixed(5)}`,
    district: 'Mi comunidad',
    city: 'Perú',
    department: 'Perú',
    fullAddress: `GPS: ${Number(latitude).toFixed(5)}, ${Number(longitude).toFixed(5)}`,
    zone: `Comunidad vecinal • GPS Detectado`
  };
}

/**
 * Función principal que detecta y retorna la ubicación real en vivo del usuario,
 * guardándola en memoria/caché local.
 */
export async function getOrDetectUserLocation(forceRefresh = false) {
  // 1. Revisar caché si no es forzado
  if (!forceRefresh) {
    try {
      const cached = await AsyncStorage.getItem(LOCATION_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        // Si tiene menos de 10 minutos de antigüedad, retornarlo
        if (Date.now() - (parsed.detectedAt || 0) < 600000) {
          return parsed;
        }
      }
    } catch (_) { }
  } else {
    try {
      await AsyncStorage.removeItem(LOCATION_STORAGE_KEY);
    } catch (_) { }
  }

  // 2. Detectar GPS real con alta precisión
  const gps = await getRawGpsPosition(9000, forceRefresh);
  if (!gps) {
    try {
      const cached = await AsyncStorage.getItem(LOCATION_STORAGE_KEY);
      if (cached) return JSON.parse(cached);
    } catch (_) { }
    return null;
  }

  // 3. Geocodificar la dirección física real
  const geocoded = await reverseGeocodeCoords(gps.latitude, gps.longitude);
  const result = {
    ...geocoded,
    accuracy: gps.accuracy,
    detectedAt: Date.now()
  };

  // 4. Guardar en caché persistente
  try {
    await AsyncStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(result));
  } catch (_) { }

  return result;
}

export default {
  getRawGpsPosition,
  reverseGeocodeCoords,
  getOrDetectUserLocation
};
