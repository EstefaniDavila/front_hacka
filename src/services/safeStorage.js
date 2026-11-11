// ==========================================================
// VECIRED IA - SAFE STORAGE SERVICE (ZERO-CRASH FALLBACK)
// ==========================================================
import { Platform, NativeModules } from 'react-native';

// In-memory fallback map para Expo Go cuando el módulo nativo turbo no está linkeado
const memoryStorage = new Map();

let rawAsyncStorage = null;
try {
  rawAsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch (e) {
  console.warn('[SafeStorage] No se pudo cargar @react-native-async-storage/async-storage:', e?.message);
}

export const safeStorage = {
  async getItem(key) {
    if (!key) return null;
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
      if (rawAsyncStorage?.getItem) {
        const val = await rawAsyncStorage.getItem(key);
        if (val !== undefined && val !== null) return val;
      }
    } catch (err) {
      // Fallback silencioso a memoria para evitar romper HomeScreen y LocationService
      // console.warn('[SafeStorage.getItem fallback]', key, err?.message);
    }
    return memoryStorage.has(key) ? memoryStorage.get(key) : null;
  },

  async setItem(key, value) {
    if (!key) return;
    const stringVal = String(value);
    memoryStorage.set(key, stringVal);
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, stringVal);
        return;
      }
      if (rawAsyncStorage?.setItem) {
        await rawAsyncStorage.setItem(key, stringVal);
      }
    } catch (err) {
      // console.warn('[SafeStorage.setItem fallback]', key, err?.message);
    }
  },

  async removeItem(key) {
    if (!key) return;
    memoryStorage.delete(key);
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
        return;
      }
      if (rawAsyncStorage?.removeItem) {
        await rawAsyncStorage.removeItem(key);
      }
    } catch (err) {
      // console.warn('[SafeStorage.removeItem fallback]', key, err?.message);
    }
  },

  async clear() {
    memoryStorage.clear();
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.clear();
        return;
      }
      if (rawAsyncStorage?.clear) {
        await rawAsyncStorage.clear();
      }
    } catch (err) {}
  },

  async getAllKeys() {
    const keys = new Set(memoryStorage.keys());
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        for (let i = 0; i < window.localStorage.length; i++) {
          keys.add(window.localStorage.key(i));
        }
      } else if (rawAsyncStorage?.getAllKeys) {
        const rawKeys = await rawAsyncStorage.getAllKeys();
        if (Array.isArray(rawKeys)) {
          rawKeys.forEach(k => keys.add(k));
        }
      }
    } catch (_) {}
    return Array.from(keys);
  }
};

export default safeStorage;

