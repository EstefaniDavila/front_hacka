// ==========================================================
// VECIRED IA — PANTALLA DE INICIO DE SESIÓN (LOGIN)
// ==========================================================
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { COLORS } from '../theme/colors';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen({
  onNavigateToRegister,
  onNavigateToForgotPassword,
  fontScale = 1.0
}) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const scale = (val) => Math.round(val * fontScale);

  const handleLogin = async () => {
    if (!email.trim()) {
      setErrorMessage('Por favor ingresa tu correo electrónico.');
      return;
    }
    if (!password) {
      setErrorMessage('Por favor ingresa tu contraseña.');
      return;
    }

    setErrorMessage('');
    setLoading(true);

    try {
      const result = await login(email, password);
      if (!result.success) {
        setErrorMessage(result.error || 'Credenciales no válidas. Intenta nuevamente.');
      }
    } catch (err) {
      setErrorMessage('Ocurrió un error al intentar iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = () => {
    setEmail('martha.quispe@vecired.pe');
    setPassword('VecinaMartha2026!');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Encabezado e Identidad */}
          <View style={styles.header}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoEmoji}>🛡️</Text>
            </View>
            <Text style={[styles.title, { fontSize: scale(26) }]}>
              VeciRed IA
            </Text>
            <Text style={[styles.subtitle, { fontSize: scale(15) }]}>
              Economía local, solidaridad vecinal y seguridad comunitaria
            </Text>
          </View>

          {/* Tarjeta del Formulario */}
          <View style={styles.card}>
            <Text style={[styles.cardTitle, { fontSize: scale(20) }]}>
              Iniciar Sesión
            </Text>
            <Text style={[styles.cardInstruction, { fontSize: scale(14) }]}>
              Ingresa tus credenciales para acceder a los servicios de tu barrio
            </Text>

            {/* Banner de Error */}
            {errorMessage ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={[styles.errorText, { fontSize: scale(13) }]}>
                  {errorMessage}
                </Text>
              </View>
            ) : null}

            {/* Input Correo */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { fontSize: scale(14) }]}>
                Correo electrónico
              </Text>
              <TextInput
                style={[styles.input, { fontSize: scale(15) }]}
                placeholder="ejemplo@correo.com"
                placeholderTextColor={COLORS.textMuted}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errorMessage) setErrorMessage('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Input Contraseña */}
            <View style={styles.inputGroup}>
              <View style={styles.passwordHeaderRow}>
                <Text style={[styles.inputLabel, { fontSize: scale(14) }]}>
                  Contraseña
                </Text>
                <TouchableOpacity
                  onPress={onNavigateToForgotPassword}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={[styles.forgotLink, { fontSize: scale(13) }]}>
                    ¿Olvidaste tu contraseña?
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={[styles.passwordInput, { fontSize: scale(15) }]}
                  placeholder="Tu contraseña secreta"
                  placeholderTextColor={COLORS.textMuted}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errorMessage) setErrorMessage('');
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '🙈'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Botón Principal Iniciar Sesión */}
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} size="small" />
              ) : (
                <Text style={[styles.submitButtonText, { fontSize: scale(16) }]}>
                  Entrar a mi Barrio
                </Text>
              )}
            </TouchableOpacity>

            {/* Botón Acceso Rápido Demo */}
            <TouchableOpacity
              style={styles.demoButton}
              onPress={handleQuickDemo}
              activeOpacity={0.7}
            >
              <Text style={[styles.demoButtonText, { fontSize: scale(13) }]}>
                ⚡ Cargar datos de prueba (Doña Martha)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Pie: Registro */}
          <View style={styles.footerContainer}>
            <Text style={[styles.footerText, { fontSize: scale(14) }]}>
              ¿Aún no formas parte de la red vecinal?
            </Text>
            <TouchableOpacity
              style={styles.registerButton}
              onPress={onNavigateToRegister}
              activeOpacity={0.8}
            >
              <Text style={[styles.registerButtonText, { fontSize: scale(15) }]}>
                Crear cuenta y verificarme como vecino
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  keyboardContainer: {
    flex: 1
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center'
  },
  header: {
    alignItems: 'center',
    marginBottom: 24
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
  },
  logoEmoji: {
    fontSize: 32
  },
  title: {
    fontWeight: '800',
    color: COLORS.primaryDark,
    textAlign: 'center',
    marginBottom: 6
  },
  subtitle: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 24,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  cardTitle: {
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4
  },
  cardInstruction: {
    color: COLORS.textSecondary,
    marginBottom: 20
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.emergencyPale,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.emergencyLight
  },
  errorIcon: {
    fontSize: 16,
    marginRight: 8
  },
  errorText: {
    color: COLORS.emergencyDark,
    flex: 1,
    fontWeight: '500'
  },
  inputGroup: {
    marginBottom: 16
  },
  inputLabel: {
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 6
  },
  passwordHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  forgotLink: {
    color: COLORS.primary,
    fontWeight: '600'
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.textPrimary,
    minHeight: 48
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    minHeight: 48
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.textPrimary
  },
  eyeButton: {
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  eyeIcon: {
    fontSize: 18
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    minHeight: 50,
    justifyContent: 'center'
  },
  submitButtonDisabled: {
    opacity: 0.6
  },
  submitButtonText: {
    color: COLORS.white,
    fontWeight: '700'
  },
  demoButton: {
    marginTop: 14,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: COLORS.primarySurface
  },
  demoButtonText: {
    color: COLORS.primaryDark,
    fontWeight: '600'
  },
  footerContainer: {
    alignItems: 'center',
    marginTop: 28,
    paddingBottom: 20
  },
  footerText: {
    color: COLORS.textSecondary,
    marginBottom: 10
  },
  registerButton: {
    backgroundColor: COLORS.card,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: '100%',
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center'
  },
  registerButtonText: {
    color: COLORS.primary,
    fontWeight: '700'
  }
});
