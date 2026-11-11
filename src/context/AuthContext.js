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
  // Carga del perfil desde el Backend FastAPI usando el JWT y Storage persistente por usuario
  // -------------------------------------------------------------
  const loadUserProfile = async (token, activeUser = null) => {
    if (!token) return null;
    const currentUser = activeUser || user;
    try {
      const profileData = await api.getMyProfile(token).catch(() => null);

      // Restaurar datos guardados localmente EXCLUSIVAMENTE para este usuario
      let localSaved = null;
      try {
        if (currentUser?.id) {
          const raw = await customStorage.getItem('vecired_user_profile_' + currentUser.id);
          if (raw) localSaved = JSON.parse(raw);
        }
        if (!localSaved && currentUser?.email) {
          const raw = await customStorage.getItem('vecired_user_profile_' + currentUser.email);
          if (raw) localSaved = JSON.parse(raw);
        }
      } catch {}

      const emailStr = (currentUser?.email || '').toLowerCase();
      const isAndy = emailStr.includes('andy');
      const isImanol = emailStr.includes('imanol');

      const defaultName = isAndy
        ? 'Andy Manchego'
        : isImanol
        ? 'Imanol Montes'
        : currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || 'Vecino';
      const defaultPhone = isAndy ? '937263104' : isImanol ? '912345678' : '';
      const defaultSkill = isAndy ? 'Apoyo general' : isImanol ? 'Tecnología y Soporte' : 'Vecino Colaborador';
      const defaultAvatar = isAndy ? '👨‍🔧' : isImanol ? '🧑‍💼' : '👤';

      const validBackendName = (profileData?.full_name && profileData.full_name.trim() !== '' && profileData.full_name !== 'EMPTY') ? profileData.full_name.trim() : null;
      const validBackendPhone = (profileData?.phone && profileData.phone.trim() !== '' && profileData.phone !== 'EMPTY') ? profileData.phone.trim() : null;

      const merged = {
        ...(profileData || {}),
        full_name: localSaved?.name || validBackendName || currentUser?.user_metadata?.full_name || defaultName,
        phone: localSaved?.phone || validBackendPhone || currentUser?.user_metadata?.phone || defaultPhone,
        skill: localSaved?.skill || profileData?.skill || currentUser?.user_metadata?.skill || defaultSkill,
        address: profileData?.street_address || profileData?.address || localSaved?.address || currentUser?.user_metadata?.address || 'Calle San Francisco 214, Cercado',
        street_address: profileData?.street_address || profileData?.address || localSaved?.street_address || null,
        latitude: profileData?.latitude != null ? Number(profileData.latitude) : (localSaved?.latitude != null ? Number(localSaved.latitude) : -16.397650),
        longitude: profileData?.longitude != null ? Number(profileData.longitude) : (localSaved?.longitude != null ? Number(localSaved.longitude) : -71.536120),
        district_name: profileData?.district_name || localSaved?.district_name || 'Arequipa',
        residence_status: profileData?.residence_status || localSaved?.residence_status || 'declared',
        avatar_url: localSaved?.avatar || profileData?.avatar_url || currentUser?.user_metadata?.avatar || defaultAvatar
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
    const userId = user?.id;
    const userEmail = user?.email;

    // 1. Guardar de inmediato en almacenamiento local persistente AISLADO por cuenta
    try {
      if (userId) {
        await customStorage.setItem('vecired_user_profile_' + userId, JSON.stringify(updateData));
      }
      if (userEmail) {
        await customStorage.setItem('vecired_user_profile_' + userEmail, JSON.stringify(updateData));
      }
      // Limpiar cualquier clave global residual para evitar contaminación entre cuentas
      await customStorage.removeItem('vecired_user_profile');
    } catch (e) {
      console.warn('Error guardando perfil en storage local:', e);
    }

    // Candado de seguridad: Nunca enviar nombres ni teléfonos vacíos que borren el perfil existente
    const safeName = (updateData.name && updateData.name.trim() && updateData.name.trim() !== 'Vecino')
      ? updateData.name.trim()
      : ((profile?.full_name && profile.full_name !== 'EMPTY' && profile.full_name !== 'Vecino')
          ? profile.full_name
          : (user?.user_metadata?.full_name || 'Vecino'));
    const safePhone = (updateData.phone !== undefined && updateData.phone !== '' && updateData.phone !== 'EMPTY')
      ? updateData.phone
      : (profile?.phone || user?.user_metadata?.phone || '');
    const safeSkill = (updateData.skill && updateData.skill.trim()) ? updateData.skill.trim() : (profile?.skill || 'Vecino Colaborador');
    const safeAvatar = updateData.avatar || profile?.avatar_url || '👤';
    const safeAddress = updateData.address || profile?.address || 'Zona A • Manzana 2';

    // 2. Actualizar metadata de Supabase Auth
    try {
      await supabase.auth.updateUser({
        data: {
          full_name: safeName,
          phone: safePhone,
          skill: safeSkill,
          address: safeAddress,
          avatar: safeAvatar
        }
      });
    } catch (e) {
      console.warn('Error actualizando Supabase Auth metadata:', e);
    }

    // 3. Actualizar perfil en Backend FastAPI / PostgreSQL
    if (token) {
      try {
        const backendPayload = {
          full_name: safeName,
          phone: safePhone,
          skill: safeSkill,
          avatar_url: safeAvatar
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
      full_name: safeName,
      phone: safePhone,
      skill: safeSkill,
      address: safeAddress,
      avatar_url: safeAvatar
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

      // Cargar perfil restaurando cualquier edición previa guardada EXCLUSIVAMENTE de este usuario
      try {
        let userSpecificSaved = null;
        if (data.user?.id) {
          const raw = await customStorage.getItem('vecired_user_profile_' + data.user.id);
          if (raw) userSpecificSaved = JSON.parse(raw);
        }
        if (!userSpecificSaved && data.user?.email) {
          const raw = await customStorage.getItem('vecired_user_profile_' + data.user.email);
          if (raw) userSpecificSaved = JSON.parse(raw);
        }

        if (userSpecificSaved) {
          setProfile({
            full_name: userSpecificSaved.name,
            phone: userSpecificSaved.phone,
            skill: userSpecificSaved.skill,
            address: userSpecificSaved.address,
            avatar_url: userSpecificSaved.avatar
          });
        } else {
          setProfile(null);
        }
      } catch {}

      // Cargar perfil desde el backend con el JWT real
      await loadUserProfile(data.session.access_token, data.user);

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
      try {
        await customStorage.removeItem('vecired_user_profile');
      } catch {}
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
