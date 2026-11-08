// ==========================================================
// VECIRED IA — CONTEXTO GLOBAL DE AUTENTICACIÓN Y SESIÓN REAL
// ==========================================================
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, customStorage } from '../services/supabase';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // -------------------------------------------------------------
  // Inicialización y escucha reactiva de sesión Supabase
  // -------------------------------------------------------------
  useEffect(() => {
    let mounted = true;

    async function initSession() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.warn('[VeciRed Auth] Error al verificar sesión inicial:', error.message);
        }

        if (mounted && data?.session) {
          setSession(data.session);
          setUser(data.session.user);
          await loadUserProfile(data.session.access_token);
        }
      } catch (err) {
        console.warn('[VeciRed Auth] Fallo inesperado al restaurar sesión:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    initSession();

    // Listener para eventos de login, logout y refresco de token
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return;

        setSession(currentSession);
        setUser(currentSession?.user || null);

        if (currentSession?.access_token) {
          await loadUserProfile(currentSession.access_token);
        } else {
          setProfile(null);
          setVerificationStatus(null);
        }
      }
    );

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // -------------------------------------------------------------
  // Carga del perfil desde el Backend FastAPI usando el JWT y Storage persistente
  // -------------------------------------------------------------
  const loadUserProfile = async (token) => {
    if (!token) return null;
    try {
      const profileData = await api.getMyProfile(token).catch(() => null);

      // Restaurar datos guardados localmente para este usuario si el backend aún no los tiene
      let localSaved = null;
      try {
        const key = user?.id ? 'vecired_user_profile_' + user.id : (user?.email ? 'vecired_user_profile_' + user.email : 'vecired_user_profile');
        const raw = await customStorage.getItem(key) || await customStorage.getItem('vecired_user_profile');
        if (raw) localSaved = JSON.parse(raw);
      } catch {}

      const merged = {
        ...(profileData || {}),
        full_name: localSaved?.name || profileData?.full_name || user?.user_metadata?.full_name || 'Andy Manchego',
        phone: localSaved?.phone || profileData?.phone || user?.user_metadata?.phone || '937263104',
        skill: localSaved?.skill || profileData?.skill || user?.user_metadata?.skill || 'Apoyo general',
        address: localSaved?.address || profileData?.address || user?.user_metadata?.address || 'Zona A • Manzana 2',
        avatar_url: localSaved?.avatar || profileData?.avatar_url || user?.user_metadata?.avatar || '👨‍🔧'
      };

      setProfile(merged);

      // Consulta del estado de verificación de identidad si aplica
      const statusData = await api.getVerificationStatus(token).catch(() => null);
      if (statusData) {
        setVerificationStatus(statusData);
      }
      return merged;
    } catch (err) {
      console.warn('[VeciRed Auth] No se pudo obtener perfil del backend:', err.message);
      return null;
    }
  };

  // -------------------------------------------------------------
  // Actualización persistente del perfil del usuario (DB + Storage + Supabase)
  // -------------------------------------------------------------
  const updateUserProfile = async (updateData) => {
    const token = session?.access_token;
    const userId = user?.id || 'default';
    const userEmail = user?.email || 'default';

    // 1. Guardar de inmediato en almacenamiento local persistente (general y por cuenta)
    try {
      await customStorage.setItem('vecired_user_profile', JSON.stringify(updateData));
      await customStorage.setItem('vecired_user_profile_' + userId, JSON.stringify(updateData));
      await customStorage.setItem('vecired_user_profile_' + userEmail, JSON.stringify(updateData));
    } catch (e) {
      console.warn('Error guardando perfil en storage local:', e);
    }

    // 2. Actualizar metadata de Supabase Auth
    try {
      await supabase.auth.updateUser({
        data: {
          full_name: updateData.name,
          phone: updateData.phone,
          skill: updateData.skill,
          address: updateData.address,
          avatar: updateData.avatar
        }
      });
    } catch (e) {
      console.warn('Error actualizando Supabase Auth metadata:', e);
    }

    // 3. Actualizar perfil en Backend FastAPI / PostgreSQL
    if (token) {
      try {
        const backendPayload = {
          full_name: updateData.name,
          phone: updateData.phone,
          skill: updateData.skill,
          avatar_url: updateData.avatar
        };
        const updatedApi = await api.updateMyProfile(backendPayload, token);
        if (updatedApi) {
          setProfile(updatedApi);
        }
      } catch (err) {
        console.warn('Error actualizando perfil en backend:', err?.message);
      }
    }

    // Actualizar estado reactivo de profile local
    setProfile((prev) => ({
      ...(prev || {}),
      full_name: updateData.name,
      phone: updateData.phone,
      skill: updateData.skill,
      address: updateData.address,
      avatar_url: updateData.avatar
    }));

    return true;
  };

  // -------------------------------------------------------------
  // Inicio de Sesión Real (Email + Password)
  // -------------------------------------------------------------
  const login = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });

      if (error) {
        return {
          success: false,
          error: error.message || 'Credenciales inválidas'
        };
      }

      if (!data.session) {
        return {
          success: false,
          error: 'Supabase no retornó una sesión activa. Verifica tu cuenta.'
        };
      }

      // Actualizar estados reactivos
      setSession(data.session);
      setUser(data.user);

      // Cargar perfil restaurando cualquier edición previa guardada de este usuario
      try {
        const raw = await customStorage.getItem('vecired_user_profile_' + data.user.id) ||
                    await customStorage.getItem('vecired_user_profile_' + data.user.email) ||
                    await customStorage.getItem('vecired_user_profile');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.name) {
            setProfile((prev) => ({
              ...(prev || {}),
              full_name: parsed.name,
              phone: parsed.phone,
              skill: parsed.skill,
              address: parsed.address,
              avatar_url: parsed.avatar
            }));
          }
        }
      } catch {}

      // Cargar perfil desde el backend con el JWT real
      await loadUserProfile(data.session.access_token);

      return {
        success: true,
        user: data.user,
        session: data.session
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Error de conexión al iniciar sesión'
      };
    }
  };

  // -------------------------------------------------------------
  // Registro de Nuevo Vecino (Sin Confirmación de Correo Requerida)
  // -------------------------------------------------------------
  const register = async (email, password, { fullName, phone, skill, address }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            full_name: fullName,
            phone: phone,
            skill: skill,
            address: address
          }
        }
      });

      if (error) {
        return {
          success: false,
          error: error.message || 'Error al registrar usuario en Supabase'
        };
      }

      // Manejar correctamente la sesión devuelta por Supabase
      // Si la confirmación de correo está desactivada en Supabase, data.session contiene la sesión inmediata
      if (data.session) {
        setSession(data.session);
        setUser(data.user);
        await loadUserProfile(data.session.access_token);

        return {
          success: true,
          hasSession: true,
          user: data.user,
          session: data.session
        };
      }

      // Si Supabase no devuelve sesión (por ejemplo, si en el dashboard aún estuviese activa la confirmación):
      // NO suponer que existe sesión ni crear datos simulados.
      setUser(null);
      setSession(null);
      setProfile(null);

      return {
        success: true,
        hasSession: false,
        user: data.user,
        message: 'Usuario registrado exitosamente en Supabase. Ahora puedes iniciar sesión con tus credenciales.'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Error inesperado durante el registro'
      };
    }
  };

  // -------------------------------------------------------------
  // Cerrar Sesión Real
  // -------------------------------------------------------------
  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('[VeciRed Auth] Error al cerrar sesión:', err);
    } finally {
      setUser(null);
      setSession(null);
      setProfile(null);
      setVerificationStatus(null);
    }
  };

  // -------------------------------------------------------------
  // Recuperación de Contraseña
  // NOTA: Esta funcionalidad requiere un servidor SMTP configurado en Supabase
  // (Project Settings > Auth > SMTP Settings). En modo de desarrollo gratuito de Supabase
  // hay un límite estricto de envío de correos antes de bloquear peticiones.
  // -------------------------------------------------------------
  const resetPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (error) {
        return {
          success: false,
          error: error.message || 'No fue posible enviar el correo de recuperación'
        };
      }
      return {
        success: true,
        message: 'Se ha enviado un enlace de recuperación a tu correo electrónico (requiere servidor SMTP activo).'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Error al solicitar recuperación de contraseña'
      };
    }
  };

  // -------------------------------------------------------------
  // Verificación de Identidad (DNI + Selfie) contra Backend FastAPI
  // -------------------------------------------------------------
  const submitVerification = async ({ dniFrontFile, dniBackFile, selfieFile, fullName }) => {
    const token = session?.access_token;
    if (!token) {
      return {
        success: false,
        error: 'Debes tener una sesión activa para enviar tu verificación de identidad.'
      };
    }

    try {
      const result = await api.verifyIdentity(
        { dniFrontFile, dniBackFile, selfieFile, fullName },
        token
      );

      if (result.success) {
        await loadUserProfile(token);
      }

      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Fallo en la verificación de identidad'
      };
    }
  };

  const value = {
    user,
    session,
    profile,
    verificationStatus,
    isAuthenticated: Boolean(session && user),
    isLoading,
    login,
    register,
    logout,
    resetPassword,
    submitVerification,
    updateUserProfile,
    refreshProfile: () => session?.access_token && loadUserProfile(session.access_token)
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
}
