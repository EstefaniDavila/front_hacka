// ==========================================================
// VECIRED IA — CLIENTE SUPABASE AUTH Y STORAGE
// ==========================================================
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const getEnvVar = (name) => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[name]) {
    return import.meta.env[name];
  }
  if (typeof process !== 'undefined' && process.env && process.env[name]) {
    return process.env[name];
  }
  return '';
};

const SUPABASE_URL =
  getEnvVar('EXPO_PUBLIC_SUPABASE_URL') ||
  getEnvVar('VITE_SUPABASE_URL') ||
  'https://gipoemmdfoxbcrsjtkrj.supabase.co';

const SUPABASE_ANON_KEY =
  getEnvVar('EXPO_PUBLIC_SUPABASE_ANON_KEY') ||
  getEnvVar('VITE_SUPABASE_ANON_KEY') ||
  '';

if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.includes('placeholder')) {
  console.warn(
    '[VeciRed Supabase] ATENCIÓN: EXPO_PUBLIC_SUPABASE_ANON_KEY no está configurada o tiene un valor placeholder. ' +
    'Configura tu clave anon en .env para conectar con Supabase Auth.'
  );
}

// Storage personalizado con persistencia tanto para Web (localStorage) como para React Native (AsyncStorage)
const customStorage = {
  getItem: async (key) => {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: async (key, value) => {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
      await AsyncStorage.setItem(key, value);
    } catch (e) {
      console.warn('Error guardando en storage:', e);
    }
  },
  removeItem: async (key) => {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
        return;
      }
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.warn('Error eliminando de storage:', e);
    }
  }
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: customStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});

export { customStorage };
