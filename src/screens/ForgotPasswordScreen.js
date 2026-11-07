// ==========================================================
// VECIRED IA — RECUPERACIÓN DE CONTRASEÑA
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
  ActivityIndicator
} from 'react-native';
import { COLORS } from '../theme/colors';
import { useAuth } from '../context/AuthContext';

export default function ForgotPasswordScreen({
  onBackToLogin,
  fontScale = 1.0
}) {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const scale = (val) => Math.round(val * fontScale);

  const handleReset = async () => {
    if (!email.trim()) {
      setErrorMessage('Por favor ingresa el correo de tu cuenta.');
      return;
    }

    setErrorMessage('');
    setLoading(true);

    try {
      const result = await resetPassword(email);
      if (result.success) {
        setSentSuccess(true);
      } else {
        setErrorMessage(result.error || 'No se pudo enviar el correo de recuperación.');
      }
    } catch {
      setErrorMessage('Error al procesar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Cabecera */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBackToLogin}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={[styles.backButtonText, { fontSize: scale(15) }]}>
            ← Volver al inicio de sesión
          </Text>
        </TouchableOpacity>

        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <Text style={styles.iconEmoji}>{sentSuccess ? '📬' : '🔑'}</Text>
          </View>

          <Text style={[styles.title, { fontSize: scale(22) }]}>
            {sentSuccess ? 'Correo Enviado' : 'Recuperar Contraseña'}
          </Text>

          <Text style={[styles.description, { fontSize: scale(14) }]}>
            {sentSuccess
              ? `Hemos enviado las instrucciones para restablecer tu contraseña al correo ${email}. Revisa tu bandeja de entrada o spam.`
              : 'Ingresa el correo electrónico asociado a tu cuenta de vecino y te enviaremos un enlace seguro para crear una nueva contraseña.'}
          </Text>

          {errorMessage ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={[styles.errorText, { fontSize: scale(13) }]}>
                {errorMessage}
              </Text>
            </View>
          ) : null}

          {!sentSuccess ? (
            <>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { fontSize: scale(14) }]}>
                  Correo electrónico registrado
                </Text>
                <TextInput
                  style={[styles.input, { fontSize: scale(15) }]}
                  placeholder="ejemplo@correo.com"
                  placeholderTextColor={COLORS.textMuted}
                  value={email}
                  onChangeText={(val) => {
                    setEmail(val);
                    if (errorMessage) setErrorMessage('');
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleReset}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <Text style={[styles.submitButtonText, { fontSize: scale(16) }]}>
                    Enviar Instrucciones
                  </Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={styles.submitButton}
              onPress={onBackToLogin}
              activeOpacity={0.8}
            >
              <Text style={[styles.submitButtonText, { fontSize: scale(16) }]}>
                Regresar a Iniciar Sesión
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center'
  },
  backButton: {
    marginBottom: 20,
    alignSelf: 'flex-start'
  },
  backButtonText: {
    color: COLORS.primaryDark,
    fontWeight: '700'
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
    borderColor: COLORS.border,
    alignItems: 'center'
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16
  },
  iconEmoji: {
    fontSize: 28
  },
  title: {
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 10
  },
  description: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 20,
    paddingHorizontal: 8
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.emergencyPale,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    width: '100%',
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
    width: '100%',
    marginBottom: 20
  },
  inputLabel: {
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 6
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
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    width: '100%',
    minHeight: 50,
    justifyContent: 'center'
  },
  submitButtonDisabled: {
    opacity: 0.6
  },
  submitButtonText: {
    color: COLORS.white,
    fontWeight: '700'
  }
});
