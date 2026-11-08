import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

const LOCATION_STORAGE_KEY = '@vecired_detected_location';

/**
 * Obtiene la posición GPS real del navegador o dispositivo móvil.
 * Retorna { latitude, longitude, accuracy }
 */
export async function getRawGpsPosition(timeoutMs = 8000) {
  // 1. Probar primero con expo-location en dispositivos móviles nativos
  try {
    const { status } = await Location.getForegroundPermissionsAsync().catch(() => ({ status: 'undetermined' }));
    let hasPermission = status === 'granted';
    if (!hasPermission) {
      const req = await Location.requestForegroundPermissionsAsync().catch(() => ({ status: 'denied' }));
      hasPermission = req.status === 'granted';
    }

    if (hasPermission) {
      // Intentar primero última posición conocida (0ms)
      const lastKnown = await Location.getLastKnownPositionAsync().catch(() => null);
      if (lastKnown && lastKnown.coords) {
        return {
          latitude: lastKnown.coords.latitude,
          longitude: lastKnown.coords.longitude,
          accuracy: lastKnown.coords.accuracy || 10
        };
      }

      // Si no hay última posición, pedir lectura balanceada con timeout
      const cur = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout expo-location')), timeoutMs))
      ]).catch(() => null);

      if (cur && cur.coords) {
        return {
          latitude: cur.coords.latitude,
          longitude: cur.coords.longitude,
          accuracy: cur.coords.accuracy || 10
        };
      }
    }
  } catch (err) {
    console.warn('[LocationService] expo-location fallback to navigator:', err?.message);
  }

  // 2. Fallback a navigator.geolocation (Web o emulador)
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return null;
  }

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
        maximumAge: 30000 // 30 segundos
      }
    );
  });
}

/**
 * Geocodificación inversa real: convierte lat/lng en dirección física
 * con calle, distrito, ciudad y región.
 */
export async function reverseGeocodeCoords(latitude, longitude) {
  if (!latitude || !longitude) return null;

  try {
    // 1. Intentar con Nominatim (OpenStreetMap) para nombres exactos de calles
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
    const res = await fetch(nominatimUrl, {
      headers: { 'Accept': 'application/json' }
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.address) {
        const addr = data.address;
        const street = addr.road || addr.pedestrian || addr.footway || addr.cycleway || addr.neighbourhood || '';
        const houseNumber = addr.house_number ? ` ${addr.house_number}` : '';
        const district = addr.suburb || addr.city_district || addr.district || addr.neighbourhood || addr.quarter || addr.town || '';
        const city = addr.city || addr.town || addr.municipality || addr.county || 'Lima';
        const department = addr.state || addr.region || 'Lima';

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

  try {
    // 2. Fallback a BigDataCloud Reverse Geocode
    const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=es`;
    const bdcRes = await fetch(bdcUrl);
    if (bdcRes.ok) {
      const bdcData = await bdcRes.json();
      const city = bdcData.city || bdcData.locality || 'Lima';
      const district = bdcData.locality || bdcData.principalSubdivision || city;
      const department = bdcData.principalSubdivision || 'Lima';
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
  } catch (err) {
    console.warn('[LocationService] BigDataCloud fallback error:', err?.message);
  }

  // Fallback con coordenadas exactas
  return {
    latitude,
    longitude,
    street: `Coordenadas: ${Number(latitude).toFixed(4)}, ${Number(longitude).toFixed(4)}`,
    district: 'Mi comunidad',
    city: 'Lima',
    department: 'Lima',
    fullAddress: `GPS: ${Number(latitude).toFixed(4)}, ${Number(longitude).toFixed(4)}`,
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
        // Si tiene menos de 30 minutos de antigüedad, retornarlo
        if (Date.now() - (parsed.detectedAt || 0) < 1800000) {
          return parsed;
        }
      }
    } catch (_) {}
  }

  // 2. Detectar GPS real
  const gps = await getRawGpsPosition();
  if (!gps) {
    try {
      const cached = await AsyncStorage.getItem(LOCATION_STORAGE_KEY);
      if (cached) return JSON.parse(cached);
    } catch (_) {}
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
  } catch (_) {}

  return result;
}

export default {
  getRawGpsPosition,
  reverseGeocodeCoords,
  getOrDetectUserLocation
};
