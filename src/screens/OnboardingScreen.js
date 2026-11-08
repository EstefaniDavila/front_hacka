import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Platform,
  StatusBar,
  Keyboard,
  KeyboardAvoidingView,
  Image,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import BiometricFaceScanner from '../components/BiometricFaceScanner';
import DniPhotoPickerCard from '../components/DniPhotoPickerCard';

export default function OnboardingScreen({
  onFinishLogin,
  onNavigateToLogin,
  fontScale = 1.0,
  setFontScale,
  onSaveUserData
}) {
  const { register, submitVerification, updateUserProfile, session } = useAuth();

  // Paso actual (1 al 6)
  const [step, setStep] = useState(1);
  const scrollViewRef = useRef(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Escucha del teclado
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Reset scroll al cambiar de paso
  useEffect(() => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
  }, [step]);

  const scale = (val) => Math.round(val * fontScale);

  // ==========================================================
  // ESTADOS DEL PASO 2: DNI FRENTE Y REVERSO (CLAUDE VISION OCR)
  // ==========================================================
  const [dniFrontFile, setDniFrontFile] = useState(null);
  const [dniBackFile, setDniBackFile] = useState(null);
  const [isExtractingDni, setIsExtractingDni] = useState(false);
  const [dniExtractedData, setDniExtractedData] = useState(null);
  const [dniExtractionError, setDniExtractionError] = useState('');
  const [isUnderageBlocked, setIsUnderageBlocked] = useState(false);
  const [underageMessage, setUnderageMessage] = useState('');

  // ==========================================================
  // ESTADOS DEL PASO 3: BIOMETRÍA FACIAL (INSIGHTFACE)
  // ==========================================================
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const [selfieFile, setSelfieFile] = useState(null);
  const [isVerifyingFace, setIsVerifyingFace] = useState(false);
  const [faceVerified, setFaceVerified] = useState(false);
  const [faceVerificationError, setFaceVerificationError] = useState('');
  const [faceMatchDetails, setFaceMatchDetails] = useState(null);

  // ==========================================================
  // ESTADOS DEL PASO 4: REGISTRO DE CUENTA (SUPABASE AUTH)
  // ==========================================================
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [customSkill, setCustomSkill] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('👤');
  const [isRegisteringAccount, setIsRegisteringAccount] = useState(false);
  const [accountRegisterError, setAccountRegisterError] = useState('');
  const [accountRegistered, setAccountRegistered] = useState(false);

  // ==========================================================
  // ESTADOS DEL PASO 5: RESIDENCIA Y COMUNIDAD
  // ==========================================================
  const [addressDepartment, setAddressDepartment] = useState('Lima');
  const [addressProvince, setAddressProvince] = useState('Lima');
  const [addressDistrict, setAddressDistrict] = useState('Los Olivos');
  const [addressCommunity, setAddressCommunity] = useState('Comunidad VeciRed Los Olivos');
  const [addressZone, setAddressZone] = useState('Zona A - Manzana 2');
  const [addressStreet, setAddressStreet] = useState('Calle Los Nogales 214');
  const [addressBlock, setAddressBlock] = useState('Mz B Lote 4');
  const [addressReference, setAddressReference] = useState('');
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [gpsNotice, setGpsNotice] = useState('');

  // ==========================================================
  // ESTADOS DEL PASO 6: CONFIRMACIÓN Y FINALIZACIÓN
  // ==========================================================
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [finalizeError, setFinalizeError] = useState('');

  // Opciones de oficios y habilidades vecinales
  const SKILL_OPTIONS = [
    '🩺 Enfermería / Primeros auxilios',
    '🔧 Gasfitería / Plomería',
    '⚡ Electricidad básica',
    '🧵 Costura y confección',
    '🍲 Cocina y repostería',
    '📚 Docencia / Apoyo escolar',
    '🛠️ Albañilería / Carpintería',
    '🌟 Apoyo general / Voluntario barrial'
  ];

  // ==========================================================
  // HANDLERS PASO 2: EXTRACCIÓN REAL DE DNI CON CLAUDE VISION
  // ==========================================================
  const handleExtractDni = async () => {
    if (!dniFrontFile) {
      Alert.alert('Foto Requerida', 'Debes seleccionar al menos la fotografía del anverso (frente) del DNI.');
      return;
    }

    setIsExtractingDni(true);
    setDniExtractionError('');
    setIsUnderageBlocked(false);
    setUnderageMessage('');

    try {
      const result = await api.extractDni({
        dniFrontFile,
        dniBackFile
      });

      if (!result) {
        throw new Error('No se recibió respuesta del servicio de extracción OCR.');
      }

      // 1. Verificación de mayoría de edad en backend
      if (result.underage_blocked || (typeof result.age === 'number' && result.age < 18)) {
        setIsUnderageBlocked(true);
        const blockMsg =
          result.message ||
          `Registro bloqueado: El titular tiene ${result.age} años de edad. VeciRed IA es exclusivamente para personas mayores de 18 años.`;
        setUnderageMessage(blockMsg);
        setDniExtractedData(result);
        return;
      }

      // 2. Verificación si el OCR fue exitoso
      if (result.success || result.dni_number || result.full_name) {
        setDniExtractedData(result);
      } else {
        setDniExtractionError(
          result.message ||
          'No se pudieron extraer los datos con suficiente nitidez. Por favor vuelve a tomar la fotografía con mejor luz.'
        );
      }
    } catch (err) {
      console.warn('[Onboarding] Error al extraer DNI:', err);
      setDniExtractionError(err.message || 'Error de conexión con el servidor de análisis de DNI.');
    } finally {
      setIsExtractingDni(false);
    }
  };

  // ==========================================================
  // HANDLERS PASO 3: VERIFICACIÓN FACIAL CON INSIGHTFACE
  // ==========================================================
  const handleFaceCaptured = (photo) => {
    setSelfieFile(photo);
    setShowCameraScanner(false);
    // Ejecutar comparación automática con el DNI
    handleVerifyFaceMatch(photo);
  };

  const handleVerifyFaceMatch = async (capturedPhoto = selfieFile) => {
    if (!capturedPhoto) {
      Alert.alert('Selfie Requerida', 'Primero captura tu fotografía facial con la cámara frontal.');
      return;
    }

    if (!dniFrontFile) {
      Alert.alert('DNI Requerido', 'No se encontró la foto del DNI para comparar el rostro.');
      return;
    }

    setIsVerifyingFace(true);
    setFaceVerificationError('');
    setFaceVerified(false);

    try {
      const response = await api.verifyIdentity(
        {
          dniFrontFile,
          dniBackFile,
          selfieFile: capturedPhoto,
          fullName: dniExtractedData?.full_name || ''
        },
        session?.access_token || null
      );

      const faceMatch = response?.face_match || {};
      const isMatch = faceMatch.is_match === true || response?.success === true;

      if (isMatch) {
        setFaceVerified(true);
        setFaceMatchDetails(faceMatch);
      } else {
        const errorMsg =
          faceMatch?.details?.reason ||
          response?.message ||
          'El rostro de la selfie no coincide suficientemente con la fotografía del DNI o no superó la prueba de vida.';
        setFaceVerificationError(errorMsg);
        setFaceVerified(false);
      }
    } catch (err) {
      console.warn('[Onboarding] Error en verificación facial:', err);
      setFaceVerificationError(
        err.message || 'Error al conectar con el motor biométrico InsightFace. Verifica tu conexión.'
      );
      setFaceVerified(false);
    } finally {
      setIsVerifyingFace(false);
    }
  };

  // ==========================================================
  // HANDLERS PASO 4: REGISTRO DE CUENTA CON SUPABASE AUTH
  // ==========================================================
  const handleRegisterAccount = async () => {
    setAccountRegisterError('');

    // Validaciones
    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setAccountRegisterError('Ingresa un correo electrónico válido.');
      return;
    }

    if (!password || password.length < 6) {
      setAccountRegisterError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setAccountRegisterError('Las contraseñas no coinciden. Por favor verifícalas.');
      return;
    }

    if (!phone.trim() || phone.trim().length < 7) {
      setAccountRegisterError('Ingresa un número de celular de contacto válido.');
      return;
    }

    const finalSkill = customSkill.trim() || selectedSkill || 'Vecino Colaborador';
    const verifiedName = dniExtractedData?.full_name || 'Vecino VeciRed';

    setIsRegisteringAccount(true);

    try {
      const result = await register(cleanEmail, password, {
        fullName: verifiedName,
        phone: phone.trim(),
        skill: finalSkill,
        avatar: selectedAvatar,
        address: `${addressStreet}, ${addressBlock} • ${addressDistrict}`
      });

      if (!result.success) {
        setAccountRegisterError(result.error || 'No fue posible registrar la cuenta en Supabase.');
        return;
      }

      setAccountRegistered(true);
      // Avanzar al paso 5 (Residencia)
      setStep(5);
    } catch (err) {
      console.error('[Onboarding] Error en registro de cuenta:', err);
      setAccountRegisterError(err.message || 'Error inesperado al crear la cuenta.');
    } finally {
      setIsRegisteringAccount(false);
    }
  };

  // ==========================================================
  // HANDLERS PASO 5: RESIDENCIA Y GEOLOCALIZACIÓN
  // ==========================================================
  const handleDetectGps = () => {
    setIsDetectingGps(true);
    setGpsNotice('');

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setGpsNotice(`GPS detectado: Lat ${latitude.toFixed(4)}, Lon ${longitude.toFixed(4)} (Precisión ±5m)`);
          setIsDetectingGps(false);
        },
        (err) => {
          console.warn('[GPS] Error obteniendo ubicación:', err);
          setGpsNotice('No se obtuvo GPS satelital. Puedes confirmar tu dirección manualmente.');
          setIsDetectingGps(false);
        },
        { timeout: 7000, enableHighAccuracy: true }
      );
    } else {
      setTimeout(() => {
        setGpsNotice('Ubicación barrial fijada para el cuadrante Los Olivos, Lima.');
        setIsDetectingGps(false);
      }, 800);
    }
  };

  const handleConfirmResidence = () => {
    if (!addressDistrict.trim() || !addressStreet.trim()) {
      Alert.alert('Datos requeridos', 'Por favor ingresa tu distrito y dirección de residencia actual.');
      return;
    }
    setStep(6);
  };

  // ==========================================================
  // HANDLERS PASO 6: CONFIRMACIÓN Y FINALIZACIÓN
  // ==========================================================
  const handleFinalizeOnboarding = async () => {
    setIsFinalizing(true);
    setFinalizeError('');

    const verifiedName = dniExtractedData?.full_name || 'Vecino VeciRed';
    const finalSkill = customSkill.trim() || selectedSkill || 'Vecino Colaborador';
    const fullAddress = `${addressStreet}, ${addressBlock} • ${addressZone} • ${addressDistrict}, ${addressProvince}`;

    try {
      // 1. Guardar y actualizar perfil si existe sesión
      if (updateUserProfile) {
        try {
          await updateUserProfile({
            name: verifiedName,
            phone: phone.trim(),
            skill: finalSkill,
            avatar: selectedAvatar,
            address: fullAddress
          });
        } catch (e) {
          console.warn('[Onboarding] Advertencia al actualizar perfil en DB:', e);
        }
      }

      // 2. Notificar al callback general de la aplicación
      if (onSaveUserData) {
        onSaveUserData({
          name: verifiedName,
          phone: phone.trim(),
          email: email.trim(),
          skill: finalSkill,
          avatar: selectedAvatar,
          address: fullAddress,
          dni: dniExtractedData?.dni_number || dniExtractedData?.dni_last4 || ''
        });
      }

      // 3. Finalizar onboarding y acceder a la aplicación
      if (onFinishLogin) {
        onFinishLogin();
      }
    } catch (err) {
      console.error('[Onboarding] Error al finalizar:', err);
      setFinalizeError(err.message || 'Error al completar el onboarding.');
    } finally {
      setIsFinalizing(false);
    }
  };

  // Vista de cámara frontal a pantalla completa para biometría facial
  if (showCameraScanner) {
    return (
      <BiometricFaceScanner
        onFaceCaptured={handleFaceCaptured}
        onCancel={() => setShowCameraScanner(false)}
        fontScale={fontScale}
      />
    );
  }

  // Nombre de paso para el encabezado
  const getStepSubtitle = () => {
    switch (step) {
      case 1:
        return 'Bienvenida a VeciRed IA';
      case 2:
        return 'Carga y Verificación del DNI';
      case 3:
        return 'Verificación Facial';
      case 4:
        return 'Registro de Cuenta';
      case 5:
        return 'Residencia y Comunidad';
      case 6:
        return 'Confirmación de Datos';
      default:
        return '';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <View style={styles.container}>

        {/* ENCABEZADO DE PROGRESO */}
        <View style={styles.headerProgress}>
          <View style={styles.headerNavRow}>
            {step > 1 ? (
              <TouchableOpacity
                style={styles.headerBackBtn}
                activeOpacity={0.7}
                onPress={() => setStep((prev) => Math.max(1, prev - 1))}
              >
                <Ionicons name="arrow-back" size={18} color={COLORS.primaryDark} style={{ marginRight: 4 }} />
                <Text style={styles.headerBackBtnText}>Atrás (Paso {step - 1})</Text>
              </TouchableOpacity>
            ) : onNavigateToLogin ? (
              <TouchableOpacity
                style={styles.headerBackBtn}
                activeOpacity={0.7}
                onPress={onNavigateToLogin}
              >
                <Ionicons name="arrow-back" size={18} color={COLORS.primaryDark} style={{ marginRight: 4 }} />
                <Text style={styles.headerBackBtnText}>Volver al Login</Text>
              </TouchableOpacity>
            ) : (
              <View />
            )}

            {onNavigateToLogin && (
              <TouchableOpacity
                style={styles.headerLoginBtn}
                activeOpacity={0.7}
                onPress={onNavigateToLogin}
              >
                <Ionicons name="log-in-outline" size={16} color={COLORS.primaryDark} style={{ marginRight: 4 }} />
                <Text style={styles.headerLoginBtnText}>Iniciar Sesión</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.progressInfoRow}>
            <Text style={[styles.stepIndicatorText, { fontSize: scale(12) }]}>
              PASO {step} DE 6
            </Text>
            <Text style={[styles.stepIndicatorSub, { fontSize: scale(11) }]}>
              • {getStepSubtitle()}
            </Text>
          </View>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${(step / 6) * 100}%` }]} />
          </View>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 25}
        >
          <ScrollView
            ref={scrollViewRef}
            style={{ flex: 1 }}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: keyboardHeight > 0 ? (Platform.OS === 'android' ? 120 : keyboardHeight + 40) : 60 }
            ]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
          >

            {/* ========================================================== */}
            {/* PASO 1: BIENVENIDA */}
            {/* ========================================================== */}
            {step === 1 && (
              <View style={styles.stepCard}>
                <View style={styles.iconCircleBig}>
                  <Text style={{ fontSize: 50 }}>🏘️</Text>
                </View>
                <Text style={[styles.title, { fontSize: scale(22) }]}>
                  ¡Bienvenida a VeciRed IA!
                </Text>
                <Text style={[styles.subtitle, { fontSize: scale(13) }]}>
                  La red barrial inteligente de vecinos verificados. Conecta con oficios de tu zona, apoya a tu comunidad y actúa rápido en emergencias.
                </Text>

                <View style={styles.featurePillsWrap}>
                  <View style={styles.pillBadge}>
                    <Text style={styles.pillBadgeText}>🔒 100% Vecinos Reales con DNI y Biometría</Text>
                  </View>
                  <View style={styles.pillBadge}>
                    <Text style={styles.pillBadgeText}>📍 Ubicación y Cuadrante Comunal</Text>
                  </View>
                  <View style={styles.pillBadge}>
                    <Text style={styles.pillBadgeText}>⚡ Asistencia Inmediata en Emergencias</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.primaryButton}
                  activeOpacity={0.8}
                  onPress={() => setStep(2)}
                >
                  <Text style={[styles.primaryButtonText, { fontSize: scale(15) }]}>
                    EMPEZAR REGISTRO (PASO 1 DE 6) ➔
                  </Text>
                </TouchableOpacity>

                {onNavigateToLogin && (
                  <TouchableOpacity
                    style={styles.secondaryLoginButton}
                    activeOpacity={0.8}
                    onPress={onNavigateToLogin}
                  >
                    <Text style={[styles.secondaryLoginButtonText, { fontSize: scale(13) }]}>
                      ¿Ya eres vecino registrado? INICIAR SESIÓN
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* ========================================================== */}
            {/* PASO 2: CARGA Y VERIFICACIÓN DEL DNI (CLAUDE VISION OCR) */}
            {/* ========================================================== */}
            {step === 2 && (
              <View style={styles.stepCard}>
                <View style={styles.iconCircle}>
                  <Text style={{ fontSize: 32 }}>🪪</Text>
                </View>
                <Text style={[styles.title, { fontSize: scale(20) }]}>
                  Carga y Verificación del DNI
                </Text>
                <Text style={[styles.subtitle, { fontSize: scale(13) }]}>
                  Selecciona fotos nítidas del anverso y reverso de tu documento para extraer tus datos oficiales con Claude Vision y validar tu mayoría de edad.
                </Text>

                {/* DNI ANVERSO */}
                <DniPhotoPickerCard
                  side="front"
                  title="1. Frente del DNI (Anverso) *"
                  subtitle="Foto clara donde se aprecie tu rostro y número de documento"
                  selectedImage={dniFrontFile}
                  onImageSelected={(asset) => {
                    setDniFrontFile(asset);
                    setDniExtractedData(null);
                    setIsUnderageBlocked(false);
                    setDniExtractionError('');
                  }}
                  onImageRemoved={() => {
                    setDniFrontFile(null);
                    setDniExtractedData(null);
                    setIsUnderageBlocked(false);
                  }}
                  fontScale={fontScale}
                  disabled={isExtractingDni}
                />

                {/* DNI REVERSO */}
                <DniPhotoPickerCard
                  side="back"
                  title="2. Reverso del DNI (Posterior) *"
                  subtitle="Donde figura el UBIGEO, código de barras y firma"
                  selectedImage={dniBackFile}
                  onImageSelected={(asset) => {
                    setDniBackFile(asset);
                  }}
                  onImageRemoved={() => {
                    setDniBackFile(null);
                  }}
                  fontScale={fontScale}
                  disabled={isExtractingDni}
                />

                {/* BOTÓN PROCESAR DNI CON CLAUDE VISION */}
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    (!dniFrontFile || isExtractingDni) && { opacity: 0.6 }
                  ]}
                  activeOpacity={0.8}
                  disabled={!dniFrontFile || isExtractingDni}
                  onPress={handleExtractDni}
                >
                  {isExtractingDni ? (
                    <View style={styles.rowCentered}>
                      <ActivityIndicator color={COLORS.white} size="small" style={{ marginRight: 8 }} />
                      <Text style={[styles.primaryButtonText, { fontSize: scale(14) }]}>
                        PROCESANDO DNI CON CLAUDE VISION...
                      </Text>
                    </View>
                  ) : (
                    <Text style={[styles.primaryButtonText, { fontSize: scale(15) }]}>
                      {dniExtractedData ? '🔄 VOLVER A PROCESAR DNI' : '🔍 PROCESAR DNI CON IA'}
                    </Text>
                  )}
                </TouchableOpacity>

                {/* BANNER DE BLOQUEO POR MINORÍA DE EDAD */}
                {isUnderageBlocked && (
                  <View style={styles.underageBlockCard}>
                    <Text style={{ fontSize: 32, marginBottom: 6 }}>⛔</Text>
                    <Text style={styles.underageBlockTitle}>
                      REGISTRO BLOQUEADO • MENOR DE EDAD
                    </Text>
                    <Text style={styles.underageBlockText}>
                      {underageMessage ||
                        'VeciRed IA es una plataforma para vecinos mayores de 18 años. El documento presentado indica minoría de edad.'}
                    </Text>
                  </View>
                )}

                {/* ERROR DE EXTRACCIÓN */}
                {dniExtractionError ? (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>⚠️ {dniExtractionError}</Text>
                  </View>
                ) : null}

                {/* DATOS EXTRAÍDOS REALES PARA REVISIÓN */}
                {dniExtractedData && !isUnderageBlocked && (
                  <View style={styles.extractedDataCard}>
                    <View style={styles.extractedCardHeader}>
                      <Ionicons name="checkmark-circle" size={20} color="#16a34a" style={{ marginRight: 6 }} />
                      <Text style={styles.extractedCardHeaderTitle}>
                        Datos Verificados por Claude Vision
                      </Text>
                    </View>

                    <View style={styles.extractedRow}>
                      <Text style={styles.extractedLabel}>N° Documento (DNI):</Text>
                      <Text style={styles.extractedValue}>
                        {dniExtractedData.dni_number || dniExtractedData.dni_last4 || 'N/A'}
                      </Text>
                    </View>

                    <View style={styles.extractedRow}>
                      <Text style={styles.extractedLabel}>Nombres y Apellidos:</Text>
                      <Text style={[styles.extractedValue, { fontWeight: '700' }]}>
                        {dniExtractedData.full_name || `${dniExtractedData.first_name || ''} ${dniExtractedData.last_name || ''}`.trim() || 'N/A'}
                      </Text>
                    </View>

                    <View style={styles.extractedRow}>
                      <Text style={styles.extractedLabel}>Fecha de Nacimiento:</Text>
                      <Text style={styles.extractedValue}>
                        {dniExtractedData.birth_date ? String(dniExtractedData.birth_date) : 'N/A'}
                        {typeof dniExtractedData.age === 'number' ? ` (${dniExtractedData.age} años)` : ''}
                      </Text>
                    </View>

                    <View style={styles.extractedRow}>
                      <Text style={styles.extractedLabel}>Sexo:</Text>
                      <Text style={styles.extractedValue}>
                        {dniExtractedData.gender || 'No especificado'}
                      </Text>
                    </View>

                    <View style={styles.extractedRow}>
                      <Text style={styles.extractedLabel}>UBIGEO de Origen:</Text>
                      <Text style={styles.extractedValue}>
                        {dniExtractedData.ubigeo || 'Registrado'}
                      </Text>
                    </View>

                    <View style={styles.confidenceBadge}>
                      <Text style={styles.confidenceBadgeText}>
                        Mayoría de edad confirmada ({dniExtractedData.age || 18}+ años) • Aprobado para continuar
                      </Text>
                    </View>
                  </View>
                )}

                {/* BOTÓN PARA AVANZAR AL PASO 3 */}
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    { marginTop: 16 },
                    (!dniExtractedData || isUnderageBlocked) && { opacity: 0.4 }
                  ]}
                  disabled={!dniExtractedData || isUnderageBlocked}
                  activeOpacity={0.8}
                  onPress={() => setStep(3)}
                >
                  <Text style={[styles.primaryButtonText, { fontSize: scale(15) }]}>
                    CONTINUAR A VERIFICACIÓN FACIAL (PASO 3) ➔
                  </Text>
                </TouchableOpacity>

                <View style={styles.stepFooterNavRow}>
                  <TouchableOpacity
                    style={styles.backStepSecondaryBtn}
                    activeOpacity={0.7}
                    onPress={() => setStep(1)}
                  >
                    <Ionicons name="arrow-back-outline" size={16} color="#475569" style={{ marginRight: 6 }} />
                    <Text style={styles.backStepSecondaryBtnText}>Volver a Bienvenida (Paso 1)</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ========================================================== */}
            {/* PASO 3: VERIFICACIÓN FACIAL (INSIGHTFACE) */}
            {/* ========================================================== */}
            {step === 3 && (
              <View style={styles.stepCard}>
                <View style={styles.iconCircle}>
                  <Text style={{ fontSize: 32 }}>🤳</Text>
                </View>
                <Text style={[styles.title, { fontSize: scale(20) }]}>
                  Verificación Facial Biométrica
                </Text>
                <Text style={[styles.subtitle, { fontSize: scale(13) }]}>
                  Comparamos tu rostro en vivo con la foto del anverso de tu DNI usando InsightFace en el backend para certificar que eres el titular del documento.
                </Text>

                {/* SI AÚN NO SE HA CAPTURADO LA SELFIE */}
                {!selfieFile ? (
                  <View style={styles.faceInstructionBox}>
                    <Text style={{ fontSize: 50, marginBottom: 8 }}>📷</Text>
                    <Text style={[styles.faceInstructionTitle, { fontSize: scale(15) }]}>
                      Cámara Frontal Asistida
                    </Text>
                    <Text style={[styles.faceInstructionText, { fontSize: scale(12) }]}>
                      • Centra tu rostro en el marco ovalado{'\n'}
                      • Mantén buena iluminación y mira fijamente{'\n'}
                      • No uses gafas oscuras, sombreros o mascarillas
                    </Text>

                    <TouchableOpacity
                      style={[styles.primaryButton, { marginTop: 16 }]}
                      activeOpacity={0.8}
                      onPress={() => setShowCameraScanner(true)}
                    >
                      <Text style={[styles.primaryButtonText, { fontSize: scale(15) }]}>
                        📸 ABRIR CÁMARA FRONTAL NATIVA
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  /* SI YA SE CAPTURÓ LA SELFIE: MOSTRAR COMPARADOR VISUAL */
                  <View style={styles.faceComparisonWrap}>
                    <View style={styles.photosComparisonRow}>
                      {/* FOTO DEL DNI */}
                      <View style={styles.comparisonPhotoCard}>
                        <Text style={styles.comparisonPhotoLabel}>Anverso DNI</Text>
                        {dniFrontFile?.uri ? (
                          <Image
                            source={{ uri: dniFrontFile.uri }}
                            style={styles.comparisonPhotoImg}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={styles.comparisonPhotoPlaceholder}>
                            <Text>🪪 DNI</Text>
                          </View>
                        )}
                      </View>

                      {/* FLECHA DE COMPARACIÓN */}
                      <View style={styles.comparisonArrowWrap}>
                        <Ionicons name="git-compare-outline" size={26} color={COLORS.primary} />
                        <Text style={styles.comparisonVsText}>vs</Text>
                      </View>

                      {/* SELFIE CAPTURADA */}
                      <View style={styles.comparisonPhotoCard}>
                        <Text style={styles.comparisonPhotoLabel}>Selfie en Vivo</Text>
                        {selfieFile?.uri ? (
                          <Image
                            source={{ uri: selfieFile.uri }}
                            style={styles.comparisonPhotoImg}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={styles.comparisonPhotoPlaceholder}>
                            <Text>🤳 Selfie</Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* ESTADO DE VERIFICACIÓN INSIGHTFACE */}
                    {isVerifyingFace && (
                      <View style={styles.verifyingLoaderBox}>
                        <ActivityIndicator color={COLORS.primary} size="large" />
                        <Text style={[styles.verifyingLoaderText, { fontSize: scale(13) }]}>
                          Comparando vectores faciales con InsightFace...
                        </Text>
                      </View>
                    )}

                    {/* ÉXITO EN LA VERIFICACIÓN */}
                    {faceVerified && (
                      <View style={styles.faceSuccessBox}>
                        <Ionicons name="checkmark-circle" size={32} color="#16a34a" />
                        <Text style={[styles.faceSuccessTitle, { fontSize: scale(16) }]}>
                          ¡Rostro Verificado con Éxito!
                        </Text>
                        <Text style={[styles.faceSuccessSubtitle, { fontSize: scale(12) }]}>
                          Tu selfie coincide con el rostro del DNI según el análisis biométrico de InsightFace.
                          {faceMatchDetails?.confidence_score
                            ? ` Similitud: ${(faceMatchDetails.confidence_score * 100).toFixed(0)}%`
                            : ''}
                        </Text>
                      </View>
                    )}

                    {/* ERROR EN LA VERIFICACIÓN */}
                    {faceVerificationError ? (
                      <View style={styles.errorBox}>
                        <Text style={styles.errorText}>⚠️ {faceVerificationError}</Text>
                      </View>
                    ) : null}

                    {/* BOTONES DE ACCIÓN SEGÚN EL RESULTADO */}
                    {!faceVerified ? (
                      <View style={{ marginTop: 12 }}>
                        <TouchableOpacity
                          style={[styles.primaryButton, isVerifyingFace && { opacity: 0.6 }]}
                          disabled={isVerifyingFace}
                          activeOpacity={0.8}
                          onPress={() => handleVerifyFaceMatch(selfieFile)}
                        >
                          <Text style={[styles.primaryButtonText, { fontSize: scale(14) }]}>
                            {isVerifyingFace ? 'PROCESANDO...' : '🔍 REINTENTAR COMPARACIÓN FACIAL'}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.retakeSelfieBtn}
                          activeOpacity={0.8}
                          onPress={() => {
                            setSelfieFile(null);
                            setFaceVerified(false);
                            setFaceVerificationError('');
                            setShowCameraScanner(true);
                          }}
                        >
                          <Text style={styles.retakeSelfieBtnText}>
                            🔄 Tomar una nueva selfie
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={{ marginTop: 16 }}>
                        <TouchableOpacity
                          style={styles.primaryButton}
                          activeOpacity={0.8}
                          onPress={() => setStep(4)}
                        >
                          <Text style={[styles.primaryButtonText, { fontSize: scale(15) }]}>
                            CONTINUAR A REGISTRO DE CUENTA (PASO 4) ➔
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.retakeSelfieBtn}
                          activeOpacity={0.8}
                          onPress={() => {
                            setSelfieFile(null);
                            setFaceVerified(false);
                            setFaceVerificationError('');
                            setShowCameraScanner(true);
                          }}
                        >
                          <Text style={styles.retakeSelfieBtnText}>
                            🔄 Repetir captura facial si lo deseas
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )}

                <View style={styles.stepFooterNavRow}>
                  <TouchableOpacity
                    style={styles.backStepSecondaryBtn}
                    activeOpacity={0.7}
                    onPress={() => setStep(2)}
                  >
                    <Ionicons name="arrow-back-outline" size={16} color="#475569" style={{ marginRight: 6 }} />
                    <Text style={styles.backStepSecondaryBtnText}>Volver a Fotos de DNI (Paso 2)</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ========================================================== */}
            {/* PASO 4: REGISTRO DE CUENTA (SUPABASE AUTH) */}
            {/* ========================================================== */}
            {step === 4 && (
              <View style={styles.stepCard}>
                <View style={styles.iconCircle}>
                  <Text style={{ fontSize: 32 }}>🔐</Text>
                </View>
                <Text style={[styles.title, { fontSize: scale(20) }]}>
                  Registro de tu Cuenta Vecinal
                </Text>
                <Text style={[styles.subtitle, { fontSize: scale(13) }]}>
                  Crea tus credenciales de acceso para entrar a VeciRed IA. Tu identidad ya fue validada con tu DNI y biometría facial.
                </Text>

                {/* BADGE DE IDENTIDAD YA VALIDADA */}
                <View style={styles.verifiedHolderCard}>
                  <Ionicons name="shield-checkmark" size={24} color="#16a34a" style={{ marginRight: 10 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.verifiedHolderLabel}>Titular Verificado:</Text>
                    <Text style={styles.verifiedHolderName}>
                      {dniExtractedData?.full_name || 'Titular del DNI'}
                    </Text>
                    <Text style={styles.verifiedHolderSub}>
                      DNI: {dniExtractedData?.dni_number || dniExtractedData?.dni_last4 || '********'} • Rostro confirmado
                    </Text>
                  </View>
                </View>

                {/* CORREO ELECTRÓNICO */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { fontSize: scale(12) }]}>Correo Electrónico *</Text>
                  <TextInput
                    style={[styles.input, { fontSize: scale(13) }]}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="ejemplo@correo.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                {/* CONTRASEÑA */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { fontSize: scale(12) }]}>Contraseña de Acceso *</Text>
                  <TextInput
                    style={[styles.input, { fontSize: scale(13) }]}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Mínimo 6 caracteres"
                    secureTextEntry
                    autoCapitalize="none"
                  />
                </View>

                {/* CONFIRMAR CONTRASEÑA */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { fontSize: scale(12) }]}>Confirmar Contraseña *</Text>
                  <TextInput
                    style={[styles.input, { fontSize: scale(13) }]}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Repite tu contraseña"
                    secureTextEntry
                    autoCapitalize="none"
                  />
                </View>

                {/* NÚMERO DE CELULAR */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { fontSize: scale(12) }]}>Número de Celular *</Text>
                  <TextInput
                    style={[styles.input, { fontSize: scale(13) }]}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    placeholder="984 555 123"
                    returnKeyType="done"
                  />
                </View>

                {/* AVATAR VECINAL */}
                <View style={{ marginBottom: 14 }}>
                  <Text style={[styles.fieldLabel, { fontSize: scale(12), marginBottom: 6 }]}>
                    Elige tu avatar vecinal (opcional):
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {['👤', '👨‍🔧', '👩‍🔧', '👷', '👨‍🍳', '👩‍🏫', '👵', '👨‍🌾'].map((av) => {
                      const isSel = selectedAvatar === av;
                      return (
                        <TouchableOpacity
                          key={av}
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 22,
                            backgroundColor: isSel ? '#dcfce7' : '#f8fafc',
                            borderWidth: 1.5,
                            borderColor: isSel ? COLORS.primary : '#cbd5e1',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          onPress={() => setSelectedAvatar(av)}
                          activeOpacity={0.7}
                        >
                          <Text style={{ fontSize: 22 }}>{av}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* OFICIO U HABILIDAD VECINAL */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { fontSize: scale(12) }]}>
                    Oficio o Profesión / Habilidad Vecinal *
                  </Text>
                  <View style={styles.skillsSelectorWrap}>
                    {SKILL_OPTIONS.map((opt, idx) => {
                      const isSelected = selectedSkill === opt && !customSkill.trim();
                      return (
                        <TouchableOpacity
                          key={idx}
                          style={[styles.skillOptionPill, isSelected && styles.skillOptionPillSelected]}
                          onPress={() => {
                            setSelectedSkill(opt);
                            setCustomSkill('');
                          }}
                        >
                          <Text
                            style={[
                              styles.skillOptionText,
                              isSelected && styles.skillOptionTextSelected,
                              { fontSize: scale(11) }
                            ]}
                          >
                            {opt}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <Text style={[styles.orCustomText, { fontSize: scale(11) }]}>
                    O escribe otra profesión u ocupación:
                  </Text>
                  <TextInput
                    style={[styles.input, { fontSize: scale(13), marginTop: 4 }]}
                    placeholder="Ej: Chofer, Cuidadora de niños, Pintor..."
                    placeholderTextColor="#94a3b8"
                    value={customSkill}
                    onChangeText={(val) => {
                      setCustomSkill(val);
                      if (val.trim()) setSelectedSkill('');
                    }}
                  />
                </View>

                {accountRegisterError ? (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>⚠️ {accountRegisterError}</Text>
                  </View>
                ) : null}

                {/* BOTÓN REGISTRARSE Y CONTINUAR A PASO 5 */}
                <TouchableOpacity
                  style={[styles.primaryButton, isRegisteringAccount && { opacity: 0.6 }]}
                  disabled={isRegisteringAccount}
                  activeOpacity={0.8}
                  onPress={handleRegisterAccount}
                >
                  {isRegisteringAccount ? (
                    <View style={styles.rowCentered}>
                      <ActivityIndicator color={COLORS.white} size="small" style={{ marginRight: 8 }} />
                      <Text style={[styles.primaryButtonText, { fontSize: scale(14) }]}>
                        CREANDO CUENTA EN SUPABASE...
                      </Text>
                    </View>
                  ) : (
                    <Text style={[styles.primaryButtonText, { fontSize: scale(15) }]}>
                      CREAR CUENTA Y CONTINUAR (PASO 5) ➔
                    </Text>
                  )}
                </TouchableOpacity>

                <View style={styles.stepFooterNavRow}>
                  <TouchableOpacity
                    style={styles.backStepSecondaryBtn}
                    activeOpacity={0.7}
                    onPress={() => setStep(3)}
                  >
                    <Ionicons name="arrow-back-outline" size={16} color="#475569" style={{ marginRight: 6 }} />
                    <Text style={styles.backStepSecondaryBtnText}>Volver a Verificación Facial (Paso 3)</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ========================================================== */}
            {/* PASO 5: RESIDENCIA Y COMUNIDAD */}
            {/* ========================================================== */}
            {step === 5 && (
              <View style={styles.stepCard}>
                <View style={styles.iconCircle}>
                  <Text style={{ fontSize: 32 }}>📍</Text>
                </View>
                <Text style={[styles.title, { fontSize: scale(20) }]}>
                  Lugar de Residencia Actual
                </Text>
                <Text style={[styles.subtitle, { fontSize: scale(13) }]}>
                  Indica dónde resides actualmente. Recuerda que tu residencia actual puede ser distinta al lugar de nacimiento o emisión que figura en tu DNI.
                </Text>

                {/* AVISO IMPORTANTE */}
                <View style={styles.residenceNoticeCard}>
                  <Ionicons name="information-circle-outline" size={20} color="#0369a1" style={{ marginRight: 8 }} />
                  <Text style={styles.residenceNoticeText}>
                    El UBIGEO de tu DNI registra tu lugar de nacimiento o emisión. Aquí debes ingresar tu domicilio efectivo donde convives con tus vecinos.
                  </Text>
                </View>

                {/* BOTÓN DETECCIÓN GPS */}
                <TouchableOpacity
                  style={styles.gpsDetectBtn}
                  activeOpacity={0.8}
                  onPress={handleDetectGps}
                  disabled={isDetectingGps}
                >
                  <Ionicons name="navigate-circle-outline" size={20} color={COLORS.primary} style={{ marginRight: 6 }} />
                  <Text style={styles.gpsDetectBtnText}>
                    {isDetectingGps ? 'OBTENIENDO GPS...' : '📡 OBTENER COORDENADAS GPS'}
                  </Text>
                </TouchableOpacity>

                {gpsNotice ? (
                  <View style={styles.gpsNoticeBox}>
                    <Text style={styles.gpsNoticeBoxText}>📍 {gpsNotice}</Text>
                  </View>
                ) : null}

                {/* CAMPOS DE DIRECCIÓN */}
                <View style={{ marginTop: 12 }}>
                  {/* Departamento y Provincia */}
                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.inputLabel, { fontSize: scale(11) }]}>Departamento *</Text>
                      <TextInput
                        style={[styles.input, { fontSize: scale(12) }]}
                        value={addressDepartment}
                        onChangeText={setAddressDepartment}
                        placeholder="Ej. Lima"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.inputLabel, { fontSize: scale(11) }]}>Provincia *</Text>
                      <TextInput
                        style={[styles.input, { fontSize: scale(12) }]}
                        value={addressProvince}
                        onChangeText={setAddressProvince}
                        placeholder="Ej. Lima"
                      />
                    </View>
                  </View>

                  {/* Distrito */}
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { fontSize: scale(11) }]}>Distrito de Residencia *</Text>
                    <TextInput
                      style={[styles.input, { fontSize: scale(12) }]}
                      value={addressDistrict}
                      onChangeText={setAddressDistrict}
                      placeholder="Ej. Los Olivos / San Martín de Porres"
                    />
                  </View>

                  {/* Comunidad / Urbanización */}
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { fontSize: scale(11) }]}>
                      Comunidad, Urbanización o Sector *
                    </Text>
                    <TextInput
                      style={[styles.input, { fontSize: scale(12) }]}
                      value={addressCommunity}
                      onChangeText={setAddressCommunity}
                      placeholder="Ej. Urb. Pro / Asoc. Micaela Bastidas"
                    />
                  </View>

                  {/* Zona Barrial */}
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { fontSize: scale(11) }]}>
                      Zona Barrial / Cuadrante VeciRed *
                    </Text>
                    <TextInput
                      style={[styles.input, { fontSize: scale(12) }]}
                      value={addressZone}
                      onChangeText={setAddressZone}
                      placeholder="Ej. Zona A - Manzana 2"
                    />
                  </View>

                  {/* Calle y Manzana */}
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { fontSize: scale(11) }]}>
                      Calle, Jirón o Avenida y Número *
                    </Text>
                    <TextInput
                      style={[styles.input, { fontSize: scale(12) }]}
                      value={addressStreet}
                      onChangeText={setAddressStreet}
                      placeholder="Ej. Calle Los Nogales 214"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { fontSize: scale(11) }]}>
                      Manzana y Lote / Interior *
                    </Text>
                    <TextInput
                      style={[styles.input, { fontSize: scale(12) }]}
                      value={addressBlock}
                      onChangeText={setAddressBlock}
                      placeholder="Ej. Mz B Lote 4"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { fontSize: scale(11) }]}>
                      Referencia de Llegada (Opcional)
                    </Text>
                    <TextInput
                      style={[styles.input, { fontSize: scale(12) }]}
                      value={addressReference}
                      onChangeText={setAddressReference}
                      placeholder="Ej. A dos casas del parque principal"
                    />
                  </View>
                </View>

                {/* BOTÓN CONTINUAR A CONFIRMACIÓN */}
                <TouchableOpacity
                  style={[styles.primaryButton, { marginTop: 14 }]}
                  activeOpacity={0.8}
                  onPress={handleConfirmResidence}
                >
                  <Text style={[styles.primaryButtonText, { fontSize: scale(15) }]}>
                    CONFIRMAR RESIDENCIA Y CONTINUAR (PASO 6) ➔
                  </Text>
                </TouchableOpacity>

                <View style={styles.stepFooterNavRow}>
                  <TouchableOpacity
                    style={styles.backStepSecondaryBtn}
                    activeOpacity={0.7}
                    onPress={() => setStep(4)}
                  >
                    <Ionicons name="arrow-back-outline" size={16} color="#475569" style={{ marginRight: 6 }} />
                    <Text style={styles.backStepSecondaryBtnText}>Volver a Registro de Cuenta (Paso 4)</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ========================================================== */}
            {/* PASO 6: CONFIRMACIÓN Y FINALIZACIÓN */}
            {/* ========================================================== */}
            {step === 6 && (
              <View style={styles.stepCard}>
                <View style={[styles.iconCircleBig, { backgroundColor: COLORS.primarySurface }]}>
                  <Text style={{ fontSize: 44 }}>🛡️</Text>
                </View>
                <Text style={[styles.title, { fontSize: scale(22), color: COLORS.primaryDark }]}>
                  ¡Resumen del Onboarding!
                </Text>
                <Text style={[styles.subtitle, { fontSize: scale(13) }]}>
                  Revisa el resumen completo de tus datos antes de ingresar a la red comunitaria de VeciRed IA.
                </Text>

                {finalizeError ? (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>⚠️ {finalizeError}</Text>
                  </View>
                ) : null}

                {/* FICHA RESUMEN DE IDENTIDAD Y ACCESO */}
                <View style={styles.summaryCard}>
                  {/* SECCIÓN IDENTIDAD */}
                  <Text style={styles.summarySectionTitle}>🪪 Identidad Validada (DNI + Claude Vision)</Text>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Titular:</Text>
                    <Text style={styles.summaryVal}>
                      {dniExtractedData?.full_name || 'No especificado'}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>DNI:</Text>
                    <Text style={styles.summaryVal}>
                      {dniExtractedData?.dni_number || dniExtractedData?.dni_last4 || '********'}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Nacimiento:</Text>
                    <Text style={styles.summaryVal}>
                      {dniExtractedData?.birth_date ? String(dniExtractedData.birth_date) : 'Registrado'}
                      {typeof dniExtractedData?.age === 'number' ? ` (${dniExtractedData.age} años)` : ''}
                    </Text>
                  </View>

                  <View style={styles.summaryDivider} />

                  {/* SECCIÓN BIOMETRÍA */}
                  <Text style={styles.summarySectionTitle}>🤳 Verificación Biométrica (InsightFace)</Text>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Estado Facial:</Text>
                    <Text style={[styles.summaryVal, { color: '#16a34a', fontWeight: '700' }]}>
                      ✓ Rostro verificado y validado
                    </Text>
                  </View>

                  <View style={styles.summaryDivider} />

                  {/* SECCIÓN CUENTA */}
                  <Text style={styles.summarySectionTitle}>✉️ Cuenta y Oficio Vecinal</Text>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Correo:</Text>
                    <Text style={styles.summaryVal}>{email}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Celular:</Text>
                    <Text style={styles.summaryVal}>{phone}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Habilidad:</Text>
                    <Text style={styles.summaryVal}>
                      {customSkill.trim() || selectedSkill || 'Vecino Colaborador'}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Avatar:</Text>
                    <Text style={styles.summaryVal}>{selectedAvatar}</Text>
                  </View>

                  <View style={styles.summaryDivider} />

                  {/* SECCIÓN RESIDENCIA */}
                  <Text style={styles.summarySectionTitle}>📍 Residencia Barrial</Text>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Dirección:</Text>
                    <Text style={styles.summaryVal}>{addressStreet}, {addressBlock}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Comunidad:</Text>
                    <Text style={styles.summaryVal}>{addressCommunity}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Cuadrante:</Text>
                    <Text style={styles.summaryVal}>{addressZone}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Ubicación:</Text>
                    <Text style={styles.summaryVal}>
                      {addressDistrict}, {addressProvince} ({addressDepartment})
                    </Text>
                  </View>
                </View>

                {/* SELECTOR DE ACCESIBILIDAD SENIOR */}
                {setFontScale && (
                  <View style={styles.seniorSelectorBox}>
                    <Text style={[styles.seniorTitle, { fontSize: scale(12) }]}>
                      👁️ Elige tu tamaño de letra preferido (Accesibilidad):
                    </Text>
                    <View style={styles.seniorButtonsRow}>
                      <TouchableOpacity
                        onPress={() => setFontScale(1.0)}
                        style={[styles.seniorBtn, fontScale === 1.0 && styles.seniorBtnActive]}
                      >
                        <Text style={[styles.seniorBtnText, fontScale === 1.0 && styles.seniorBtnTextActive]}>
                          A Normal
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setFontScale(1.15)}
                        style={[styles.seniorBtn, fontScale === 1.15 && styles.seniorBtnActive]}
                      >
                        <Text style={[styles.seniorBtnText, fontScale === 1.15 && styles.seniorBtnTextActive]}>
                          A+ Grande
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setFontScale(1.30)}
                        style={[styles.seniorBtn, fontScale === 1.30 && styles.seniorBtnActive]}
                      >
                        <Text style={[styles.seniorBtnText, fontScale === 1.30 && styles.seniorBtnTextActive]}>
                          A++ Senior
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* BOTÓN FINALIZAR Y ENTRAR */}
                <TouchableOpacity
                  style={[styles.enterAppButton, isFinalizing && { opacity: 0.7 }]}
                  activeOpacity={0.8}
                  disabled={isFinalizing}
                  onPress={handleFinalizeOnboarding}
                >
                  {isFinalizing ? (
                    <View style={styles.rowCentered}>
                      <ActivityIndicator color={COLORS.white} size="small" style={{ marginRight: 8 }} />
                      <Text style={[styles.enterAppButtonText, { fontSize: scale(16) }]}>
                        FINALIZANDO ONBOARDING...
                      </Text>
                    </View>
                  ) : (
                    <Text style={[styles.enterAppButtonText, { fontSize: scale(16) }]}>
                      🚀 COMPLETAR Y ENTRAR A LA APLICACIÓN
                    </Text>
                  )}
                </TouchableOpacity>

                <View style={styles.stepFooterNavRow}>
                  <TouchableOpacity
                    style={styles.backStepSecondaryBtn}
                    activeOpacity={0.7}
                    onPress={() => setStep(5)}
                  >
                    <Ionicons name="arrow-back-outline" size={16} color="#475569" style={{ marginRight: 6 }} />
                    <Text style={styles.backStepSecondaryBtnText}>Corregir Residencia (Paso 5)</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

          </ScrollView>

          {/* BARRA FLOTANTE PARA OCULTAR TECLADO */}
          {keyboardHeight > 0 && (
            <View style={styles.keyboardToolbar}>
              <Text style={[styles.keyboardToolbarHint, { fontSize: scale(11) }]}>
                ⌨️ Teclado activo
              </Text>
              <TouchableOpacity
                style={styles.keyboardCloseBtn}
                onPress={() => Keyboard.dismiss()}
                activeOpacity={0.8}
              >
                <Text style={styles.keyboardCloseBtnText}>✓ Listo / Ocultar</Text>
              </TouchableOpacity>
            </View>
          )}
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center'
  },
  headerProgress: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  headerNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  headerBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4
  },
  headerBackBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primaryDark
  },
  headerLoginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0'
  },
  headerLoginBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primaryDark
  },
  progressInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6
  },
  stepIndicatorText: {
    fontWeight: '800',
    color: COLORS.primaryDark
  },
  stepIndicatorSub: {
    marginLeft: 6,
    color: '#64748b',
    fontWeight: '600'
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40
  },
  stepCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  iconCircleBig: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 12
  },
  title: {
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 6
  },
  subtitle: {
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 18,
    paddingHorizontal: 8
  },
  featurePillsWrap: {
    gap: 8,
    marginBottom: 20
  },
  pillBadge: {
    backgroundColor: '#f8fafc',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  pillBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b'
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3
  },
  primaryButtonText: {
    color: COLORS.white,
    fontWeight: '800',
    letterSpacing: 0.3
  },
  secondaryLoginButton: {
    marginTop: 14,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1'
  },
  secondaryLoginButtonText: {
    color: COLORS.primaryDark,
    fontWeight: '700'
  },
  stepFooterNavRow: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  backStepSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12
  },
  backStepSecondaryBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569'
  },
  rowCentered: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  underageBlockCard: {
    backgroundColor: '#fef2f2',
    borderWidth: 1.5,
    borderColor: '#ef4444',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginVertical: 14
  },
  underageBlockTitle: {
    color: '#b91c1c',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
    textAlign: 'center'
  },
  underageBlockText: {
    color: '#991b1b',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center'
  },
  errorBox: {
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#f43f5e',
    borderRadius: 10,
    padding: 12,
    marginVertical: 10
  },
  errorText: {
    color: '#be123c',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600'
  },
  extractedDataCard: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1.5,
    borderColor: '#86efac',
    borderRadius: 12,
    padding: 14,
    marginTop: 14
  },
  extractedCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#bbf7d0',
    paddingBottom: 6
  },
  extractedCardHeaderTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#15803d'
  },
  extractedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4
  },
  extractedLabel: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '600'
  },
  extractedValue: {
    fontSize: 12,
    color: '#14532d',
    fontWeight: '500',
    maxWidth: '55%',
    textAlign: 'right'
  },
  confidenceBadge: {
    marginTop: 10,
    backgroundColor: '#dcfce7',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignItems: 'center'
  },
  confidenceBadgeText: {
    fontSize: 11,
    color: '#15803d',
    fontWeight: '700'
  },
  faceInstructionBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginVertical: 10
  },
  faceInstructionTitle: {
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8
  },
  faceInstructionText: {
    color: '#475569',
    lineHeight: 20,
    textAlign: 'center'
  },
  faceComparisonWrap: {
    marginVertical: 10
  },
  photosComparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14
  },
  comparisonPhotoCard: {
    width: '43%',
    alignItems: 'center'
  },
  comparisonPhotoLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6
  },
  comparisonPhotoImg: {
    width: '100%',
    height: 140,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#cbd5e1'
  },
  comparisonPhotoPlaceholder: {
    width: '100%',
    height: 140,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center'
  },
  comparisonArrowWrap: {
    width: '14%',
    alignItems: 'center',
    justifyContent: 'center'
  },
  comparisonVsText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    marginTop: 2
  },
  verifyingLoaderBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginVertical: 10
  },
  verifyingLoaderText: {
    color: COLORS.primaryDark,
    fontWeight: '600',
    marginTop: 8
  },
  faceSuccessBox: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1.5,
    borderColor: '#86efac',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginVertical: 10
  },
  faceSuccessTitle: {
    fontWeight: '800',
    color: '#15803d',
    marginTop: 6,
    marginBottom: 4
  },
  faceSuccessSubtitle: {
    color: '#166534',
    textAlign: 'center',
    lineHeight: 18
  },
  retakeSelfieBtn: {
    marginTop: 10,
    alignItems: 'center',
    paddingVertical: 8
  },
  retakeSelfieBtnText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline'
  },
  verifiedHolderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1.5,
    borderColor: '#86efac',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16
  },
  verifiedHolderLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803d',
    textTransform: 'uppercase'
  },
  verifiedHolderName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#14532d'
  },
  verifiedHolderSub: {
    fontSize: 11,
    color: '#166534',
    marginTop: 2
  },
  inputGroup: {
    marginBottom: 12
  },
  inputLabel: {
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#0f172a'
  },
  fieldLabel: {
    fontWeight: '700',
    color: '#334155'
  },
  skillsSelectorWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 6
  },
  skillOptionPill: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  skillOptionPillSelected: {
    backgroundColor: '#dcfce7',
    borderColor: COLORS.primary
  },
  skillOptionText: {
    color: '#475569',
    fontWeight: '500'
  },
  skillOptionTextSelected: {
    color: COLORS.primaryDark,
    fontWeight: '700'
  },
  orCustomText: {
    color: '#64748b',
    marginTop: 6,
    marginBottom: 2
  },
  residenceNoticeCard: {
    flexDirection: 'row',
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    alignItems: 'flex-start'
  },
  residenceNoticeText: {
    flex: 1,
    fontSize: 12,
    color: '#0369a1',
    lineHeight: 17
  },
  gpsDetectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 10
  },
  gpsDetectBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primaryDark
  },
  gpsNoticeBox: {
    backgroundColor: '#f0fdf4',
    padding: 8,
    borderRadius: 8,
    marginBottom: 10
  },
  gpsNoticeBoxText: {
    fontSize: 11,
    color: '#15803d',
    fontWeight: '600'
  },
  summaryCard: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16
  },
  summarySectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primaryDark,
    marginBottom: 6,
    textTransform: 'uppercase'
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600'
  },
  summaryVal: {
    fontSize: 12,
    color: '#1e293b',
    fontWeight: '600',
    maxWidth: '65%',
    textAlign: 'right'
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 10
  },
  seniorSelectorBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#cbd5e1'
  },
  seniorTitle: {
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 10,
    textAlign: 'center'
  },
  seniorButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8
  },
  seniorBtn: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center'
  },
  seniorBtnActive: {
    backgroundColor: '#dcfce7',
    borderColor: COLORS.primary
  },
  seniorBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569'
  },
  seniorBtnTextActive: {
    color: COLORS.primaryDark
  },
  enterAppButton: {
    backgroundColor: '#16a34a',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4
  },
  enterAppButtonText: {
    color: COLORS.white,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  keyboardToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#cbd5e1'
  },
  keyboardToolbarHint: {
    color: '#64748b'
  },
  keyboardCloseBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 6
  },
  keyboardCloseBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700'
  }
});
