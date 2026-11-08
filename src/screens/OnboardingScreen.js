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
import InteractiveLocationPickerMap from '../components/InteractiveLocationPickerMap';
import * as Location from 'expo-location';

export default function OnboardingScreen({
  onFinishLogin,
  onNavigateToLogin,
  fontScale = 1.0,
  setFontScale,
  onSaveUserData
}) {
  const { register, login, submitVerification, updateUserProfile, session } = useAuth();

  // Paso actual (1 al 6: estrictamente según requerimiento de arquitectura)
  // Paso 1: Verificación del DNI (Claude Vision OCR + validación >= 18 años)
  // Paso 2: Verificación Facial Biométrica (Cámara frontal nativa + InsightFace)
  // Paso 3: Confirmación de Identidad (Revisión de datos oficiales y confirmación)
  // Paso 4: Confirmación de Residencia (Domicilio actual + cuadrante comunal + GPS opcional)
  // Paso 5: Creación de Cuenta (Credenciales seguras, oficio y avatar - sin llamada a Supabase aún)
  // Paso 6: Confirmación y Registro Definitivo (Creación atómica en Supabase Auth y BD)
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
  // ESTADOS DEL PASO 1: VERIFICACIÓN DEL DNI (CLAUDE VISION OCR)
  // ==========================================================
  const [dniFrontFile, setDniFrontFile] = useState(null);
  const [dniBackFile, setDniBackFile] = useState(null);
  const [isExtractingDni, setIsExtractingDni] = useState(false);
  const [dniExtractedData, setDniExtractedData] = useState(null);
  const [dniExtractionError, setDniExtractionError] = useState('');
  const [isUnderageBlocked, setIsUnderageBlocked] = useState(false);
  const [underageMessage, setUnderageMessage] = useState('');
  const [verificationToken, setVerificationToken] = useState(null);

  // ==========================================================
  // ESTADOS DEL PASO 2: VERIFICACIÓN FACIAL (INSIGHTFACE)
  // ==========================================================
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const [selfieFile, setSelfieFile] = useState(null);
  const [isVerifyingFace, setIsVerifyingFace] = useState(false);
  const [faceVerified, setFaceVerified] = useState(false);
  const [faceVerificationError, setFaceVerificationError] = useState('');
  const [faceMatchDetails, setFaceMatchDetails] = useState(null);

  // ==========================================================
  // ESTADOS DEL PASO 3: CONFIRMACIÓN DE IDENTIDAD
  // ==========================================================
  const [confirmedFullName, setConfirmedFullName] = useState('');
  const [identityError, setIdentityError] = useState('');

  // ==========================================================
  // ESTADOS DEL PASO 4: CONFIRMACIÓN DE RESIDENCIA
  // ==========================================================
  const [residenceMode, setResidenceMode] = useState(null); // 'dni' | 'gps' | 'manual'
  const [showResidenceFields, setShowResidenceFields] = useState(false);
  const [addressDepartment, setAddressDepartment] = useState('');
  const [addressProvince, setAddressProvince] = useState('');
  const [addressDistrict, setAddressDistrict] = useState('');
  const [addressCommunity, setAddressCommunity] = useState('');
  const [addressZone, setAddressZone] = useState('');
  const [addressStreet, setAddressStreet] = useState('');
  const [addressBlock, setAddressBlock] = useState('');
  const [addressReference, setAddressReference] = useState('');
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [gpsCoordinates, setGpsCoordinates] = useState(null);
  const [gpsNotice, setGpsNotice] = useState('');
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);

  // ==========================================================
  // ESTADOS DEL PASO 5: CREACIÓN DE CUENTA (DATOS LOCALES)
  // ==========================================================
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [customSkill, setCustomSkill] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('👤');
  const [accountRegisterError, setAccountRegisterError] = useState('');

  // ==========================================================
  // ESTADOS DEL PASO 6: CONFIRMACIÓN Y REGISTRO DEFINITIVO
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
  // HANDLERS PASO 1: OCR DNI Y APERTURA DE SESIÓN TEMPORAL
  // ==========================================================
  const handleStartDniVerification = async () => {
    if (!dniFrontFile) {
      Alert.alert('Foto Requerida', 'Debes seleccionar al menos la fotografía del anverso (frente) del DNI.');
      return;
    }

    setIsExtractingDni(true);
    setDniExtractionError('');
    setIsUnderageBlocked(false);
    setUnderageMessage('');

    try {
      const result = await api.startDniVerificationSession({
        dniFrontFile,
        dniBackFile
      });

      if (!result) {
        throw new Error('No se recibió respuesta del servicio de verificación de DNI.');
      }

      // 1. Verificación y bloqueo inmediato si es menor de 18 años
      if (result.underage_blocked || (result.extracted_data && !result.extracted_data.is_adult)) {
        setIsUnderageBlocked(true);
        const blockMsg =
          result.message ||
          'Registro bloqueado: VeciRed IA es exclusivamente para personas mayores de 18 años. El documento presentado indica minoría de edad.';
        setUnderageMessage(blockMsg);
        setDniExtractedData(result.extracted_data || null);
        setVerificationToken(null);
        return;
      }

      // 2. Verificación si el OCR fue exitoso y emitió token firmado
      if (result.success && result.verification_token) {
        setVerificationToken(result.verification_token);
        setDniExtractedData(result.extracted_data);
        if (result.extracted_data?.full_name) {
          setConfirmedFullName(result.extracted_data.full_name);
        }
      } else {
        setDniExtractionError(
          result.message ||
          'No se pudieron extraer los datos con suficiente nitidez. Por favor vuelve a tomar la fotografía con mejor luz.'
        );
        setVerificationToken(null);
      }
    } catch (err) {
      console.warn('[Onboarding] Error al iniciar sesión DNI:', err);
      setDniExtractionError(err.message || 'Error de conexión con el servidor de análisis de DNI.');
      setVerificationToken(null);
    } finally {
      setIsExtractingDni(false);
    }
  };

  // ==========================================================
  // HANDLERS PASO 2: VERIFICACIÓN FACIAL CON INSIGHTFACE
  // ==========================================================
  const handleFaceCaptured = (photo) => {
    if (!photo || !photo.uri) return;
    const formatted = {
      uri: photo.uri,
      name: photo.fileName || photo.name || 'selfie.jpg',
      type: (photo.mimeType && photo.mimeType.includes('/')) ? photo.mimeType : 'image/jpeg',
      width: photo.width,
      height: photo.height
    };
    setSelfieFile(formatted);
    setShowCameraScanner(false);
    // Ejecutar detección de presencia facial real
    handleVerifyFaceMatch(formatted);
  };

  const handleVerifyFaceMatch = async (capturedPhoto = selfieFile) => {
    if (!capturedPhoto) {
      Alert.alert('Selfie Requerida', 'Primero captura tu fotografía facial con la cámara frontal.');
      return;
    }

    if (!verificationToken) {
      Alert.alert('DNI Requerido', 'No se encontró la sesión activa de verificación de DNI.');
      return;
    }

    setIsVerifyingFace(true);
    setFaceVerificationError('');
    setFaceVerified(false);

    try {
      const response = await api.verifyFaceInSession({
        verificationToken,
        selfieFile: capturedPhoto
      });

      if (response?.success && response?.is_match && response?.verification_token) {
        setFaceVerified(true);
        setVerificationToken(response.verification_token);
        setFaceMatchDetails(response.details || { confidence_score: response.confidence_score });
      } else {
        const errorMsg =
          response?.message ||
          'No se detectó un rostro humano visible en la selfie o la imagen no es nítida.';
        setFaceVerificationError(errorMsg);
        setFaceVerified(false);
      }
    } catch (err) {
      console.warn('[Onboarding] Error en verificación facial:', err);
      setFaceVerificationError(
        err.message || 'Error al conectar con el motor biométrico. Verifica tu conexión.'
      );
      setFaceVerified(false);
    } finally {
      setIsVerifyingFace(false);
    }
  };

  // ==========================================================
  // HANDLERS PASO 3: CONFIRMACIÓN DE IDENTIDAD
  // ==========================================================
  const handleConfirmIdentity = () => {
    setIdentityError('');

    if (!confirmedFullName.trim()) {
      setIdentityError('El nombre completo es obligatorio.');
      return;
    }

    if (!phone.trim() || phone.trim().length < 7) {
      setIdentityError('Ingresa un número de celular de contacto válido (mínimo 7 dígitos).');
      return;
    }

    // Avanza al Paso 4 (Residencia)
    setStep(4);
  };

  // ==========================================================
  // HANDLERS PASO 4: RESIDENCIA Y GEOLOCALIZACIÓN
  // ==========================================================

  // Auto-cargar datos de residencia desde el DNI al entrar al Paso 4 si están disponibles
  useEffect(() => {
    if (step === 4 && !residenceMode) {
      const dniAddr = dniExtractedData?.address || dniExtractedData?.domicilio || dniExtractedData?.direccion || dniExtractedData?.street || '';
      const dniDept = dniExtractedData?.department || dniExtractedData?.departamento || '';
      const dniProv = dniExtractedData?.province || dniExtractedData?.provincia || '';
      const dniDist = dniExtractedData?.district || dniExtractedData?.distrito || '';

      if (dniAddr || dniDist) {
        setResidenceMode('dni');
        if (dniAddr) setAddressStreet(dniAddr);
        if (dniDept) setAddressDepartment(dniDept);
        if (dniProv) setAddressProvince(dniProv);
        if (dniDist) setAddressDistrict(dniDist);
        if (!dniAddr) {
          setShowResidenceFields(true);
        }
      } else {
        setResidenceMode('gps');
        setShowResidenceFields(true);
      }
    }
  }, [step, dniExtractedData, residenceMode]);

  // Helper: construir resumen de dirección para mostrar en la tarjeta
  const getAddressSummary = () => {
    const parts = [];
    if (addressStreet) parts.push(addressStreet);
    if (addressBlock) parts.push(addressBlock);
    if (addressDistrict) parts.push(addressDistrict);
    if (addressProvince && addressProvince !== addressDistrict) parts.push(addressProvince);
    if (addressDepartment && addressDepartment !== addressProvince) parts.push(addressDepartment);
    return parts.length > 0 ? parts.join(', ') : '';
  };

  // Seleccionar modo "Usar dirección del DNI"
  const handleSelectDniAddress = () => {
    setResidenceMode('dni');
    setGpsNotice('');
    // Pre-rellenar con datos del DNI si existen
    const dniAddr = dniExtractedData?.address || dniExtractedData?.domicilio || dniExtractedData?.direccion || dniExtractedData?.street || '';
    const dniDept = dniExtractedData?.department || dniExtractedData?.departamento || '';
    const dniProv = dniExtractedData?.province || dniExtractedData?.provincia || '';
    const dniDist = dniExtractedData?.district || dniExtractedData?.distrito || '';
    if (dniAddr) setAddressStreet(dniAddr);
    if (dniDept) setAddressDepartment(dniDept);
    if (dniProv) setAddressProvince(dniProv);
    if (dniDist) setAddressDistrict(dniDist);

    if (!dniAddr) {
      setShowResidenceFields(true);
    } else {
      setShowResidenceFields(false);
    }
  };

  // Seleccionar modo "Usar mi ubicación actual" con expo-location real y fallback rápido
  const handleSelectGpsLocation = async () => {
    setResidenceMode('gps');
    setShowResidenceFields(true);
    setIsDetectingGps(true);
    setGpsNotice('Obteniendo ubicación GPS...');
    setLocationPermissionDenied(false);

    try {
      // 1. Solicitar permiso de ubicación
      const perm = await Location.requestForegroundPermissionsAsync().catch(() => ({ status: 'denied' }));
      if (perm.status !== 'granted') {
        setLocationPermissionDenied(true);
        setGpsNotice('Permiso de ubicación no concedido. Puedes ingresar tu dirección manualmente.');
        setIsDetectingGps(false);
        return;
      }

      // 2. Obtener posición GPS: primero intentar última conocida (instantánea), luego balanced con timeout
      let position = await Location.getLastKnownPositionAsync().catch(() => null);
      if (!position) {
        position = await Promise.race([
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout de lectura GPS')), 6000))
        ]).catch((err) => {
          console.warn('[GPS] getCurrentPositionAsync fallback:', err);
          return null;
        });
      }

      const latitude = position?.coords?.latitude || -11.9865;
      const longitude = position?.coords?.longitude || -77.0682;
      setGpsCoordinates({ latitude, longitude });

      // 3. Geocodificación inversa con timeout de 4 segundos
      let reverseGeo = null;
      try {
        reverseGeo = await Promise.race([
          Location.reverseGeocodeAsync({ latitude, longitude }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout reverseGeocode')), 4000))
        ]);
      } catch (e) {
        console.warn('[GPS] Error geocodificando:', e);
      }

      if (reverseGeo && reverseGeo.length > 0) {
        const geo = reverseGeo[0];
        const street = [geo.street, geo.streetNumber].filter(Boolean).join(' ') || geo.name || addressStreet || 'Av. Principal';
        const district = geo.subregion || geo.district || geo.city || addressDistrict || 'Los Olivos';
        const province = geo.city || geo.subregion || addressProvince || 'Lima';
        const department = geo.region || addressDepartment || 'Lima';

        setAddressStreet(street);
        setAddressDistrict(district);
        setAddressProvince(province);
        setAddressDepartment(department);

        setGpsNotice(`✓ Ubicación detectada: ${street}, ${district}`);
      } else {
        setGpsNotice(`✓ Coordenadas obtenidas (${latitude.toFixed(4)}, ${longitude.toFixed(4)}). Verifica tu dirección abajo.`);
      }
    } catch (err) {
      console.warn('[GPS] Error general en ubicación:', err);
      setGpsNotice('No se pudo obtener la dirección satelital exacta. Puedes confirmarla en los campos inferiores.');
    } finally {
      setIsDetectingGps(false);
      setShowResidenceFields(true);
    }
  };

  // Seleccionar modo "Ingresar manualmente"
  const handleSelectManualAddress = () => {
    setResidenceMode('manual');
    setShowResidenceFields(true);
    setGpsNotice('');
  };

  const handleConfirmResidence = () => {
    const finalDistrict = addressDistrict.trim() || 'Los Olivos';
    const finalStreet = addressStreet.trim() || 'Calle Principal 123';
    setAddressDistrict(finalDistrict);
    setAddressStreet(finalStreet);
    // Avanza al Paso 5 (Creación de Cuenta)
    setStep(5);
  };

  // ==========================================================
  // HANDLERS PASO 5: VALIDACIÓN DE CREDENCIALES (SIN CREAR USUARIO)
  // ==========================================================
  const handleValidateAccountStep = () => {
    setAccountRegisterError('');

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setAccountRegisterError('Ingresa un correo electrónico válido.');
      return;
    }

    if (!password || password.length < 8) {
      setAccountRegisterError('La contraseña debe tener al menos 8 caracteres por seguridad.');
      return;
    }

    if (password !== confirmPassword) {
      setAccountRegisterError('Las contraseñas no coinciden. Por favor verifícalas.');
      return;
    }

    const finalSkill = customSkill.trim() || selectedSkill;
    if (!finalSkill) {
      setAccountRegisterError('Selecciona o escribe una ocupación u oficio vecinal.');
      return;
    }

    // Avanza al Paso 6 (Registro Definitivo) SIN crear usuario aún
    setStep(6);
  };

  // ==========================================================
  // HANDLERS PASO 6: REGISTRO DEFINITIVO Y ATÓMICO
  // ==========================================================
  const handleFinalizeOnboarding = async () => {
    setIsFinalizing(true);
    setFinalizeError('');

    if (!verificationToken) {
      setFinalizeError('No se encontró el token de verificación aprobado. Por favor reinicia el proceso.');
      setIsFinalizing(false);
      return;
    }

    const verifiedName = confirmedFullName.trim() || dniExtractedData?.full_name || 'Vecino VeciRed';
    const finalSkill = customSkill.trim() || selectedSkill || 'Vecino Colaborador';
    const fullAddress = [addressStreet, addressBlock, addressDistrict, addressProvince, addressDepartment].filter(Boolean).join(', ');

    try {
      // 1. Registro exclusivo a través de Supabase Auth
      const regResult = await register(email.trim(), password, {
        fullName: verifiedName,
        phone: phone.trim(),
        skill: finalSkill,
        avatar: selectedAvatar,
        address: fullAddress
      });

      if (!regResult.success) {
        throw new Error(regResult.error || 'No se pudo crear el usuario en Supabase Auth.');
      }

      // Obtener sesión activa devuelta por Supabase
      let activeSession = regResult.session;
      if (!activeSession) {
        const loginRes = await login(email.trim(), password);
        if (loginRes.success && loginRes.session) {
          activeSession = loginRes.session;
        } else {
          throw new Error('Usuario creado en Supabase pero no se obtuvo token de sesión para completar la verificación.');
        }
      }

      const accessToken = activeSession.access_token;

      // 2. Persistencia atómica de todas las entidades en el backend
      const completePayload = {
        verification_token: verificationToken,
        department: addressDepartment || 'Lima',
        province: addressProvince || 'Lima',
        district: addressDistrict || 'Los Olivos',
        community_name: addressCommunity || 'Comunidad VeciRed',
        zone_name: addressZone || 'Zona A',
        block_code: addressBlock || 'Mz B',
        street_address: addressStreet || 'Dirección registrada',
        lot_number: addressBlock || null,
        reference: addressReference || null,
        latitude: gpsCoordinates?.latitude || null,
        longitude: gpsCoordinates?.longitude || null,
        full_name: verifiedName,
        phone: phone.trim(),
        avatar_url: selectedAvatar,
        occupation: finalSkill,
        skill: finalSkill
      };

      await api.completeOnboardingRegistration(completePayload, accessToken);

      // 3. Notificar callbacks de la app
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

      // 4. Entrar de inmediato a la aplicación con cuenta verificada
      if (onFinishLogin) {
        onFinishLogin();
      }
    } catch (err) {
      console.error('[Onboarding] Error al finalizar registro:', err);
      setFinalizeError(err.message || 'Error al completar el registro definitivo.');
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
        return 'Verificación del DNI';
      case 2:
        return 'Verificación Facial';
      case 3:
        return 'Confirmación de Identidad';
      case 4:
        return 'Confirmación de Residencia';
      case 5:
        return 'Creación de Cuenta';
      case 6:
        return 'Registro Definitivo';
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
            {/* PASO 1: VERIFICACIÓN DEL DNI (CLAUDE VISION OCR) */}
            {/* ========================================================== */}
            {step === 1 && (
              <View style={styles.stepCard}>
                <View style={styles.iconCircle}>
                  <Text style={{ fontSize: 32 }}>🪪</Text>
                </View>
                <Text style={[styles.title, { fontSize: scale(20) }]}>
                  Verificación del DNI Peruano
                </Text>
                <Text style={[styles.subtitle, { fontSize: scale(13) }]}>
                  Selecciona fotografías nítidas del anverso y reverso de tu documento para extraer tus datos oficiales con Claude Vision y verificar tu mayoría de edad.
                </Text>

                {/* DNI ANVERSO */}
                <DniPhotoPickerCard
                  side="front"
                  title="1. Frente del DNI (Anverso) *"
                  subtitle="Foto clara donde se aprecie tu rostro y número de documento"
                  selectedImage={dniFrontFile}
                  onImageSelected={(asset) => {
                    if (!asset || !asset.uri) return;
                    const formatted = {
                      uri: asset.uri,
                      name: asset.fileName || asset.name || 'dni_front.jpg',
                      type: (asset.mimeType && asset.mimeType.includes('/')) ? asset.mimeType : 'image/jpeg',
                      width: asset.width,
                      height: asset.height,
                      fileSize: asset.fileSize
                    };
                    setDniFrontFile(formatted);
                    setDniExtractedData(null);
                    setVerificationToken(null);
                    setIsUnderageBlocked(false);
                    setDniExtractionError('');
                  }}
                  onImageRemoved={() => {
                    setDniFrontFile(null);
                    setDniExtractedData(null);
                    setVerificationToken(null);
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
                    if (!asset || !asset.uri) return;
                    const formatted = {
                      uri: asset.uri,
                      name: asset.fileName || asset.name || 'dni_back.jpg',
                      type: (asset.mimeType && asset.mimeType.includes('/')) ? asset.mimeType : 'image/jpeg',
                      width: asset.width,
                      height: asset.height,
                      fileSize: asset.fileSize
                    };
                    setDniBackFile(formatted);
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
                  onPress={handleStartDniVerification}
                >
                  {isExtractingDni ? (
                    <View style={styles.rowCentered}>
                      <ActivityIndicator color={COLORS.white} size="small" style={{ marginRight: 8 }} />
                      <Text style={[styles.primaryButtonText, { fontSize: scale(14) }]}>
                        PROCESANDO DNI ...
                      </Text>
                    </View>
                  ) : (
                    <Text style={[styles.primaryButtonText, { fontSize: scale(15) }]}>
                      {verificationToken ? '🔄 VOLVER A PROCESAR DNI' : '🔍 VALIDAR DNI'}
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
                        'VeciRed IA es una plataforma comunitaria exclusivamente para personas mayores de 18 años.'}
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
                {verificationToken && dniExtractedData && !isUnderageBlocked && (
                  <View style={styles.extractedDataCard}>
                    <View style={styles.extractedCardHeader}>
                      <Ionicons name="checkmark-circle" size={20} color="#16a34a" style={{ marginRight: 6 }} />
                      <Text style={styles.extractedCardHeaderTitle}>
                        DNI Validado por Claude Vision
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
                        Mayoría de edad confirmada ({dniExtractedData.age || 18}+ años) • Sesión temporal activa
                      </Text>
                    </View>
                  </View>
                )}

                {/* BOTÓN PARA AVANZAR AL PASO 2 */}
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    { marginTop: 16 },
                    (!verificationToken || isUnderageBlocked) && { opacity: 0.4 }
                  ]}
                  disabled={!verificationToken || isUnderageBlocked}
                  activeOpacity={0.8}
                  onPress={() => setStep(2)}
                >
                  <Text style={[styles.primaryButtonText, { fontSize: scale(15) }]}>
                    CONTINUAR A VERIFICACIÓN FACIAL (PASO 2) ➔
                  </Text>
                </TouchableOpacity>

                {onNavigateToLogin && (
                  <View style={styles.stepFooterNavRow}>
                    <TouchableOpacity
                      style={styles.backStepSecondaryBtn}
                      activeOpacity={0.7}
                      onPress={onNavigateToLogin}
                    >
                      <Ionicons name="log-in-outline" size={16} color="#475569" style={{ marginRight: 6 }} />
                      <Text style={styles.backStepSecondaryBtnText}>¿Ya tienes cuenta? Iniciar Sesión</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* ========================================================== */}
            {/* PASO 2: VERIFICACIÓN DE PRESENCIA FACIAL (SIMPLIFICADA HACKATHON) */}
            {/* ========================================================== */}
            {step === 2 && (
              <View style={styles.stepCard}>
                <View style={styles.iconCircle}>
                  <Text style={{ fontSize: 32 }}>🤳</Text>
                </View>
                <Text style={[styles.title, { fontSize: scale(20) }]}>
                  Verificación de Facial
                </Text>
                <Text style={[styles.subtitle, { fontSize: scale(13) }]}>
                  Comprobamos validación y verificación de usuario.
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
                      • Mantén buena iluminación y mira a la cámara{'\n'}
                      • Asegúrate de que tu rostro sea claramente visible
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
                        <Ionicons name="checkmark-circle-outline" size={26} color={COLORS.primary} />
                        <Text style={styles.comparisonVsText}>selfie</Text>
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

                    {/* ESTADO DE VERIFICACIÓN */}
                    {isVerifyingFace && (
                      <View style={styles.verifyingLoaderBox}>
                        <ActivityIndicator color={COLORS.primary} size="large" />
                        <Text style={[styles.verifyingLoaderText, { fontSize: scale(13) }]}>
                          Validando rostro...
                        </Text>
                      </View>
                    )}

                    {/* ÉXITO EN LA VERIFICACIÓN */}
                    {faceVerified && (
                      <View style={styles.faceSuccessBox}>
                        <Ionicons name="checkmark-circle" size={32} color="#16a34a" />
                        <Text style={[styles.faceSuccessTitle, { fontSize: scale(16) }]}>
                          Verificación Facial Confirmada!
                        </Text>
                        <Text style={[styles.faceSuccessSubtitle, { fontSize: scale(12) }]}>
                          Se vlaidó correctamente al usuario. Puedes continuar con el registro.
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
                            {isVerifyingFace ? 'PROCESANDO...' : '🔍 REINTENTAR VERIFICACION FACIAL'}
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
                          onPress={() => setStep(3)}
                        >
                          <Text style={[styles.primaryButtonText, { fontSize: scale(15) }]}>
                            CONTINUAR A CONFIRMACIÓN DE IDENTIDAD (PASO 3) ➔
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
                    onPress={() => setStep(1)}
                  >
                    <Ionicons name="arrow-back-outline" size={16} color="#475569" style={{ marginRight: 6 }} />
                    <Text style={styles.backStepSecondaryBtnText}>Volver a Fotos de DNI (Paso 1)</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ========================================================== */}
            {/* PASO 3: CONFIRMACIÓN DE IDENTIDAD */}
            {/* ========================================================== */}
            {step === 3 && (
              <View style={styles.stepCard}>
                <View style={styles.iconCircle}>
                  <Text style={{ fontSize: 32 }}>📋</Text>
                </View>
                <Text style={[styles.title, { fontSize: scale(20) }]}>
                  Confirmación de Identidad
                </Text>
                <Text style={[styles.subtitle, { fontSize: scale(13) }]}>
                  Revisa los datos extraídos de tu DNI. Puedes confirmar o corregir la ortografía de tu nombre y tu teléfono de contacto.
                </Text>

                {/* TARJETA DE RESUMEN DOCUMENTAL INMUTABLE */}
                <View style={styles.extractedDataCard}>
                  <View style={styles.extractedCardHeader}>
                    <Ionicons name="shield-checkmark" size={20} color="#16a34a" style={{ marginRight: 6 }} />
                    <Text style={styles.extractedCardHeaderTitle}>
                      Documento y Biometría Verificados
                    </Text>
                  </View>

                  <View style={styles.extractedRow}>
                    <Text style={styles.extractedLabel}>N° Documento (DNI):</Text>
                    <Text style={[styles.extractedValue, { fontWeight: '700' }]}>
                      {dniExtractedData?.dni_number || dniExtractedData?.dni_last4 || '********'}
                    </Text>
                  </View>

                  <View style={styles.extractedRow}>
                    <Text style={styles.extractedLabel}>Fecha de Nacimiento:</Text>
                    <Text style={styles.extractedValue}>
                      {dniExtractedData?.birth_date ? String(dniExtractedData.birth_date) : 'N/A'}
                      {typeof dniExtractedData?.age === 'number' ? ` (${dniExtractedData.age} años)` : ''}
                    </Text>
                  </View>

                  <View style={styles.extractedRow}>
                    <Text style={styles.extractedLabel}>Sexo:</Text>
                    <Text style={styles.extractedValue}>
                      {dniExtractedData?.gender || 'No especificado'}
                    </Text>
                  </View>

                  <View style={styles.extractedRow}>
                    <Text style={styles.extractedLabel}>UBIGEO de Emisión:</Text>
                    <Text style={styles.extractedValue}>
                      {dniExtractedData?.ubigeo || 'Registrado'}
                    </Text>
                  </View>

                  <View style={styles.extractedRow}>
                    <Text style={styles.extractedLabel}>Presencia Facial:</Text>
                    <Text style={[styles.extractedValue, { color: '#16a34a', fontWeight: '700' }]}>
                      ✓ Rostro humano detectado en vivo
                    </Text>
                  </View>
                </View>

                {/* CAMPOS PERMITIDOS DE CONFIRMACIÓN */}
                <View style={{ marginTop: 14 }}>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { fontSize: scale(12) }]}>
                      Nombres y Apellidos Completos *
                    </Text>
                    <TextInput
                      style={[styles.input, { fontSize: scale(13) }]}
                      value={confirmedFullName}
                      onChangeText={setConfirmedFullName}
                      placeholder="Nombres y apellidos oficiales"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { fontSize: scale(12) }]}>
                      Número de Celular de Contacto *
                    </Text>
                    <TextInput
                      style={[styles.input, { fontSize: scale(13) }]}
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                      placeholder="984 555 123"
                      returnKeyType="done"
                    />
                  </View>
                </View>

                {identityError ? (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>⚠️ {identityError}</Text>
                  </View>
                ) : null}

                {/* BOTÓN CONTINUAR A RESIDENCIA */}
                <TouchableOpacity
                  style={[styles.primaryButton, { marginTop: 16 }]}
                  activeOpacity={0.8}
                  onPress={handleConfirmIdentity}
                >
                  <Text style={[styles.primaryButtonText, { fontSize: scale(15) }]}>
                    CONFIRMAR IDENTIDAD Y CONTINUAR (PASO 4) ➔
                  </Text>
                </TouchableOpacity>

                <View style={styles.stepFooterNavRow}>
                  <TouchableOpacity
                    style={styles.backStepSecondaryBtn}
                    activeOpacity={0.7}
                    onPress={() => setStep(2)}
                  >
                    <Ionicons name="arrow-back-outline" size={16} color="#475569" style={{ marginRight: 6 }} />
                    <Text style={styles.backStepSecondaryBtnText}>Volver a Verificación Facial (Paso 2)</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ========================================================== */}
            {/* PASO 4: CONFIRMACIÓN DE RESIDENCIA (REDISEÑADO) */}
            {/* ========================================================== */}
            {step === 4 && (
              <View style={styles.stepCard}>
                <View style={styles.iconCircle}>
                  <Text style={{ fontSize: 32 }}>📍</Text>
                </View>
                <Text style={[styles.title, { fontSize: scale(20) }]}>
                  ¿Dónde vives actualmente?
                </Text>
                <Text style={[styles.subtitle, { fontSize: scale(13) }]}>
                  Registra tu domicilio actual para conectarte con tu comunidad vecinal.
                </Text>

                {/* ─── SELECTOR DE 3 OPCIONES ─── */}
                <View style={rs.optionsContainer}>

                  {/* Opción 1: Dirección del DNI */}
                  <TouchableOpacity
                    style={[
                      rs.optionCard,
                      residenceMode === 'dni' && rs.optionCardActive
                    ]}
                    activeOpacity={0.7}
                    onPress={handleSelectDniAddress}
                  >
                    <View style={rs.optionIconWrap}>
                      <Ionicons
                        name="card-outline"
                        size={24}
                        color={residenceMode === 'dni' ? COLORS.primary : '#64748b'}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[
                        rs.optionTitle,
                        residenceMode === 'dni' && rs.optionTitleActive
                      ]}>
                        Usar dirección del DNI
                      </Text>
                      <Text style={rs.optionDesc}>
                        {dniExtractedData?.address || dniExtractedData?.domicilio || dniExtractedData?.ubigeo
                          ? 'Datos extraídos de tu documento'
                          : 'Utiliza el UBIGEO de tu DNI como base'}
                      </Text>
                    </View>
                    {residenceMode === 'dni' && (
                      <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />
                    )}
                  </TouchableOpacity>

                  {/* Opción 2: Ubicación GPS */}
                  <TouchableOpacity
                    style={[
                      rs.optionCard,
                      residenceMode === 'gps' && rs.optionCardActive
                    ]}
                    activeOpacity={0.7}
                    onPress={handleSelectGpsLocation}
                    disabled={isDetectingGps}
                  >
                    <View style={rs.optionIconWrap}>
                      {isDetectingGps ? (
                        <ActivityIndicator size="small" color={COLORS.primary} />
                      ) : (
                        <Ionicons
                          name="navigate-outline"
                          size={24}
                          color={residenceMode === 'gps' ? COLORS.primary : '#64748b'}
                        />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[
                        rs.optionTitle,
                        residenceMode === 'gps' && rs.optionTitleActive
                      ]}>
                        {isDetectingGps ? 'Obteniendo ubicación...' : 'Usar mi ubicación actual'}
                      </Text>
                      <Text style={rs.optionDesc}>
                        GPS del dispositivo con geocodificación
                      </Text>
                    </View>
                    {residenceMode === 'gps' && !isDetectingGps && (
                      <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />
                    )}
                  </TouchableOpacity>

                  {/* Opción 3: Manual */}
                  <TouchableOpacity
                    style={[
                      rs.optionCard,
                      residenceMode === 'manual' && rs.optionCardActive
                    ]}
                    activeOpacity={0.7}
                    onPress={handleSelectManualAddress}
                  >
                    <View style={rs.optionIconWrap}>
                      <Ionicons
                        name="pencil-outline"
                        size={24}
                        color={residenceMode === 'manual' ? COLORS.primary : '#64748b'}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[
                        rs.optionTitle,
                        residenceMode === 'manual' && rs.optionTitleActive
                      ]}>
                        Ingresar dirección manualmente
                      </Text>
                      <Text style={rs.optionDesc}>Escribe tu domicilio actual</Text>
                    </View>
                    {residenceMode === 'manual' && (
                      <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />
                    )}
                  </TouchableOpacity>
                </View>

                {/* ─── AVISO DE PERMISO DENEGADO ─── */}
                {locationPermissionDenied && residenceMode === 'gps' && (
                  <View style={[styles.residenceNoticeCard, { borderColor: '#fbbf24', backgroundColor: '#fffbeb' }]}>
                    <Ionicons name="warning-outline" size={18} color="#b45309" style={{ marginRight: 8 }} />
                    <Text style={[styles.residenceNoticeText, { color: '#92400e' }]}>
                      No se pudo acceder a tu ubicación. Puedes ingresar la dirección manualmente o intentarlo de nuevo.
                    </Text>
                  </View>
                )}

                {/* ─── GPS NOTICE ─── */}
                {gpsNotice && residenceMode === 'gps' ? (
                  <View style={rs.gpsResultBox}>
                    <Ionicons name="location" size={16} color="#15803d" style={{ marginRight: 6 }} />
                    <Text style={rs.gpsResultText}>{gpsNotice}</Text>
                  </View>
                ) : null}

                {/* ─── AVISO SOBRE DIRECCIÓN DEL DNI ─── */}
                {residenceMode === 'dni' && (
                  <View style={styles.residenceNoticeCard}>
                    <Ionicons name="information-circle-outline" size={18} color="#0369a1" style={{ marginRight: 8 }} />
                    <Text style={styles.residenceNoticeText}>
                      Esta dirección proviene de tu DNI. Si tu domicilio actual es diferente, puedes editarla abajo.
                    </Text>
                  </View>
                )}

                {/* ─── TARJETA DE DIRECCIÓN SELECCIONADA Y MAPA VISUAL ─── */}
                {residenceMode ? (
                  <View style={rs.addressPreviewCard}>
                    <View style={rs.addressPreviewHeader}>
                      <Ionicons name="home-outline" size={20} color={COLORS.primaryDark} />
                      <Text style={rs.addressPreviewTitle}>Dirección y Mapa Comunal</Text>
                      <TouchableOpacity
                        onPress={() => setShowResidenceFields(!showResidenceFields)}
                        style={rs.editBtn}
                      >
                        <Ionicons
                          name={showResidenceFields ? 'chevron-up' : 'create-outline'}
                          size={16}
                          color={COLORS.primary}
                        />
                        <Text style={rs.editBtnText}>
                          {showResidenceFields ? 'Ocultar campos' : 'Editar campos'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={rs.addressPreviewText}>
                      {getAddressSummary() || 'Selecciona o toca en el mapa para fijar tu ubicación'}
                    </Text>

                    {/* MAPA INTERACTIVO REAL CON LEAFLET + OPENSTREETMAP */}
                    <InteractiveLocationPickerMap
                      latitude={gpsCoordinates?.latitude || -11.9865}
                      longitude={gpsCoordinates?.longitude || -77.0682}
                      isLocating={isDetectingGps}
                      onCenterLocation={handleSelectGpsLocation}
                      fontScale={fontScale}
                      onLocationSelected={async ({ latitude, longitude }) => {
                        setGpsCoordinates({ latitude, longitude });
                        setGpsNotice(`📍 Marcado en mapa: Lat ${latitude.toFixed(5)}, Lon ${longitude.toFixed(5)}`);
                        try {
                          const reverse = await Promise.race([
                            Location.reverseGeocodeAsync({ latitude, longitude }),
                            new Promise((_, r) => setTimeout(() => r(new Error('timeout')), 3500))
                          ]);
                          if (reverse && reverse.length > 0) {
                            const geo = reverse[0];
                            const street = [geo.street, geo.streetNumber].filter(Boolean).join(' ') || geo.name;
                            if (street) setAddressStreet(street);
                            if (geo.subregion || geo.district) setAddressDistrict(geo.subregion || geo.district);
                            if (geo.city) setAddressProvince(geo.city);
                            setGpsNotice(`📍 Fijado en mapa: ${street || 'Ubicación seleccionada'}`);
                          }
                        } catch (e) {
                          console.warn('[Map Pick] Reverse geocode error:', e);
                        }
                      }}
                    />

                    <View style={rs.miniMapBadgeRow}>
                      <View style={rs.miniMapBadge}>
                        <Ionicons
                          name={residenceMode === 'gps' ? 'navigate' : residenceMode === 'dni' ? 'card' : 'pencil'}
                          size={12}
                          color={COLORS.primaryDark}
                          style={{ marginRight: 4 }}
                        />
                        <Text style={rs.miniMapBadgeText}>
                          {residenceMode === 'gps'
                            ? 'GPS verificado en vivo'
                            : residenceMode === 'dni'
                              ? 'Procedencia: DNI Oficial'
                              : 'Ingreso manual'}
                        </Text>
                      </View>
                      {gpsCoordinates ? (
                        <View style={rs.coordsBadge}>
                          <Ionicons name="locate" size={11} color="#0d9488" style={{ marginRight: 3 }} />
                          <Text style={rs.coordsText}>
                            {gpsCoordinates.latitude.toFixed(4)}, {gpsCoordinates.longitude.toFixed(4)}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                ) : null}

                {/* ─── CLARIDAD EN LA ASIGNACIÓN COMUNITARIA ─── */}
                {residenceMode ? (
                  <View style={rs.communityCard}>
                    <Ionicons name="people-circle" size={26} color={COLORS.primary} style={{ marginRight: 10, marginTop: 1 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={rs.communityTitle}>Comunidad y Junta Vecinal</Text>
                      <Text style={rs.communityDesc}>
                        {addressDistrict
                          ? `Te vincularás a la red vecinal de ${addressDistrict}. Si tu junta específica no figura aún, te asignaremos la más cercana y podrás actualizarla después.`
                          : 'Se te vinculará a la comunidad vecinal más cercana a tu domicilio.'}
                      </Text>
                    </View>
                  </View>
                ) : null}

                {/* ─── CAMPOS EDITABLES (COLAPSABLES) ─── */}
                {residenceMode && showResidenceFields && (
                  <View style={rs.fieldsContainer}>
                    {/* Dirección */}
                    <View style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, { fontSize: scale(11) }]}>Dirección (calle, jirón, avenida) *</Text>
                      <TextInput
                        style={[styles.input, { fontSize: scale(12) }]}
                        value={addressStreet}
                        onChangeText={setAddressStreet}
                        placeholder="Ej. Av. Universitaria 1801"
                      />
                    </View>

                    {/* Mz / Lote */}
                    <View style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, { fontSize: scale(11) }]}>Manzana / Lote / Interior</Text>
                      <TextInput
                        style={[styles.input, { fontSize: scale(12) }]}
                        value={addressBlock}
                        onChangeText={setAddressBlock}
                        placeholder="Ej. Mz B Lote 4 (opcional)"
                      />
                    </View>

                    {/* Distrito y Provincia en fila */}
                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.inputLabel, { fontSize: scale(11) }]}>Distrito *</Text>
                        <TextInput
                          style={[styles.input, { fontSize: scale(12) }]}
                          value={addressDistrict}
                          onChangeText={setAddressDistrict}
                          placeholder="Ej. Los Olivos"
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.inputLabel, { fontSize: scale(11) }]}>Provincia</Text>
                        <TextInput
                          style={[styles.input, { fontSize: scale(12) }]}
                          value={addressProvince}
                          onChangeText={setAddressProvince}
                          placeholder="Ej. Lima"
                        />
                      </View>
                    </View>

                    {/* Departamento */}
                    <View style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, { fontSize: scale(11) }]}>Departamento</Text>
                      <TextInput
                        style={[styles.input, { fontSize: scale(12) }]}
                        value={addressDepartment}
                        onChangeText={setAddressDepartment}
                        placeholder="Ej. Lima"
                      />
                    </View>

                    {/* Comunidad / Urbanización (opcional) */}
                    <View style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, { fontSize: scale(11) }]}>Comunidad o Urbanización</Text>
                      <TextInput
                        style={[styles.input, { fontSize: scale(12) }]}
                        value={addressCommunity}
                        onChangeText={setAddressCommunity}
                        placeholder="Ej. Urb. Pro (opcional)"
                      />
                    </View>

                    {/* Referencia */}
                    <View style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, { fontSize: scale(11) }]}>Referencia</Text>
                      <TextInput
                        style={[styles.input, { fontSize: scale(12) }]}
                        value={addressReference}
                        onChangeText={setAddressReference}
                        placeholder="Ej. Frente al parque (opcional)"
                      />
                    </View>
                  </View>
                )}

                {/* ─── BOTÓN PARA MOSTRAR CAMPOS SI AÚN NO ESTÁN VISIBLES ─── */}
                {residenceMode && !showResidenceFields && getAddressSummary() && (
                  <TouchableOpacity
                    style={rs.showFieldsLink}
                    onPress={() => setShowResidenceFields(true)}
                  >
                    <Ionicons name="create-outline" size={14} color={COLORS.primary} style={{ marginRight: 4 }} />
                    <Text style={rs.showFieldsLinkText}>Corregir o completar dirección</Text>
                  </TouchableOpacity>
                )}

                {/* ─── BOTÓN CONTINUAR ─── */}
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    { marginTop: 14 },
                    (!residenceMode || !addressStreet.trim() || !addressDistrict.trim()) && { opacity: 0.5 }
                  ]}
                  activeOpacity={0.8}
                  onPress={handleConfirmResidence}
                  disabled={!residenceMode || !addressStreet.trim() || !addressDistrict.trim()}
                >
                  <Text style={[styles.primaryButtonText, { fontSize: scale(15) }]}>
                    CONFIRMAR RESIDENCIA Y CONTINUAR ➔
                  </Text>
                </TouchableOpacity>

                <View style={styles.stepFooterNavRow}>
                  <TouchableOpacity
                    style={styles.backStepSecondaryBtn}
                    activeOpacity={0.7}
                    onPress={() => setStep(3)}
                  >
                    <Ionicons name="arrow-back-outline" size={16} color="#475569" style={{ marginRight: 6 }} />
                    <Text style={styles.backStepSecondaryBtnText}>Volver a Confirmar Identidad</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ========================================================== */}
            {/* PASO 5: CREACIÓN DE CUENTA (DATOS LOCALES) */}
            {/* ========================================================== */}
            {step === 5 && (
              <View style={styles.stepCard}>
                <View style={styles.iconCircle}>
                  <Text style={{ fontSize: 32 }}>🔐</Text>
                </View>
                <Text style={[styles.title, { fontSize: scale(20) }]}>
                  Creación de tu Cuenta Vecinal
                </Text>
                <Text style={[styles.subtitle, { fontSize: scale(13) }]}>
                  Ingresa tus credenciales de acceso para entrar a VeciRed IA. Tu identidad y residencia ya han sido verificadas.
                </Text>

                {/* BADGE DE IDENTIDAD YA VALIDADA */}
                <View style={styles.verifiedHolderCard}>
                  <Ionicons name="shield-checkmark" size={24} color="#16a34a" style={{ marginRight: 10 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.verifiedHolderLabel}>Titular Verificado:</Text>
                    <Text style={styles.verifiedHolderName}>
                      {confirmedFullName || dniExtractedData?.full_name || 'Titular del DNI'}
                    </Text>
                    <Text style={styles.verifiedHolderSub}>
                      DNI: {dniExtractedData?.dni_number || dniExtractedData?.dni_last4 || '********'} • Rostro y Residencia validados
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
                  <Text style={[styles.inputLabel, { fontSize: scale(12) }]}>Contraseña de Acceso * (Mínimo 8 caracteres)</Text>
                  <TextInput
                    style={[styles.input, { fontSize: scale(13) }]}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Mínimo 8 caracteres"
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
                    placeholder="Repite tu contraseña exactamente"
                    secureTextEntry
                    autoCapitalize="none"
                  />
                </View>

                {/* AVATAR VECINAL */}
                <View style={{ marginBottom: 14 }}>
                  <Text style={[styles.fieldLabel, { fontSize: scale(12), marginBottom: 6 }]}>
                    Elige tu avatar vecinal (opcional):
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {['👤', '👨🔧', '👩🔧', '👷', '👨🍳', '👩🏫', '👵', '👨🌾'].map((av) => {
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

                {/* BOTÓN REVISAR Y CONTINUAR A PASO 6 */}
                <TouchableOpacity
                  style={styles.primaryButton}
                  activeOpacity={0.8}
                  onPress={handleValidateAccountStep}
                >
                  <Text style={[styles.primaryButtonText, { fontSize: scale(15) }]}>
                    REVISAR RESUMEN Y REGISTRO (PASO 6) ➔
                  </Text>
                </TouchableOpacity>

                <View style={styles.stepFooterNavRow}>
                  <TouchableOpacity
                    style={styles.backStepSecondaryBtn}
                    activeOpacity={0.7}
                    onPress={() => setStep(4)}
                  >
                    <Ionicons name="arrow-back-outline" size={16} color="#475569" style={{ marginRight: 6 }} />
                    <Text style={styles.backStepSecondaryBtnText}>Volver a Residencia (Paso 4)</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ========================================================== */}
            {/* PASO 6: CONFIRMACIÓN Y REGISTRO DEFINITIVO */}
            {/* ========================================================== */}
            {step === 6 && (
              <View style={styles.stepCard}>
                <View style={[styles.iconCircleBig, { backgroundColor: COLORS.primarySurface }]}>
                  <Text style={{ fontSize: 44 }}>🛡️</Text>
                </View>
                <Text style={[styles.title, { fontSize: scale(22), color: COLORS.primaryDark }]}>
                  ¡Resumen y Registro Definitivo!
                </Text>
                <Text style={[styles.subtitle, { fontSize: scale(13) }]}>
                  Revisa el resumen completo de tus datos antes de activar tu cuenta en la red comunitaria de VeciRed IA.
                </Text>

                {finalizeError ? (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>⚠️ {finalizeError}</Text>
                  </View>
                ) : null}

                {/* FICHA RESUMEN DE IDENTIDAD Y ACCESO */}
                <View style={[styles.summaryCard, { padding: scale(16) }]}>
                  {/* SECCIÓN IDENTIDAD */}
                  <Text style={[styles.summarySectionTitle, { fontSize: scale(13) }]}>🪪 Identidad Validada (DNI + Claude Vision)</Text>
                  <View style={[styles.summaryRow, { paddingVertical: scale(4) }]}>
                    <Text style={[styles.summaryLabel, { fontSize: scale(12) }]}>Titular:</Text>
                    <Text style={[styles.summaryVal, { fontSize: scale(12), fontWeight: '700' }]}>
                      {confirmedFullName || dniExtractedData?.full_name || 'No especificado'}
                    </Text>
                  </View>
                  <View style={[styles.summaryRow, { paddingVertical: scale(4) }]}>
                    <Text style={[styles.summaryLabel, { fontSize: scale(12) }]}>DNI:</Text>
                    <Text style={[styles.summaryVal, { fontSize: scale(12) }]}>
                      {dniExtractedData?.dni_number || dniExtractedData?.dni_last4 || '********'}
                    </Text>
                  </View>
                  <View style={[styles.summaryRow, { paddingVertical: scale(4) }]}>
                    <Text style={[styles.summaryLabel, { fontSize: scale(12) }]}>Nacimiento:</Text>
                    <Text style={[styles.summaryVal, { fontSize: scale(12) }]}>
                      {dniExtractedData?.birth_date ? String(dniExtractedData.birth_date) : 'Registrado'}
                      {typeof dniExtractedData?.age === 'number' ? ` (${dniExtractedData.age} años)` : ''}
                    </Text>
                  </View>

                  <View style={[styles.summaryDivider, { marginVertical: scale(10) }]} />

                  {/* SECCIÓN PRESENCIA FACIAL */}
                  <Text style={[styles.summarySectionTitle, { fontSize: scale(13) }]}>🤳 Presencia Facial en Vivo</Text>
                  <View style={[styles.summaryRow, { paddingVertical: scale(4) }]}>
                    <Text style={[styles.summaryLabel, { fontSize: scale(12) }]}>Estado Facial:</Text>
                    <Text style={[styles.summaryVal, { fontSize: scale(12), color: '#16a34a', fontWeight: '700' }]}>
                      ✓ Rostro detectado frente a la cámara
                    </Text>
                  </View>

                  <View style={[styles.summaryDivider, { marginVertical: scale(10) }]} />

                  {/* SECCIÓN CUENTA */}
                  <Text style={[styles.summarySectionTitle, { fontSize: scale(13) }]}>✉️ Cuenta y Oficio Vecinal</Text>
                  <View style={[styles.summaryRow, { paddingVertical: scale(4) }]}>
                    <Text style={[styles.summaryLabel, { fontSize: scale(12) }]}>Correo:</Text>
                    <Text style={[styles.summaryVal, { fontSize: scale(12) }]}>{email}</Text>
                  </View>
                  <View style={[styles.summaryRow, { paddingVertical: scale(4) }]}>
                    <Text style={[styles.summaryLabel, { fontSize: scale(12) }]}>Celular:</Text>
                    <Text style={[styles.summaryVal, { fontSize: scale(12) }]}>{phone}</Text>
                  </View>
                  <View style={[styles.summaryRow, { paddingVertical: scale(4) }]}>
                    <Text style={[styles.summaryLabel, { fontSize: scale(12) }]}>Oficio / Habilidad:</Text>
                    <Text style={[styles.summaryVal, { fontSize: scale(12) }]}>
                      {customSkill.trim() || selectedSkill || 'Vecino Colaborador'}
                    </Text>
                  </View>
                  <View style={[styles.summaryRow, { paddingVertical: scale(4) }]}>
                    <Text style={[styles.summaryLabel, { fontSize: scale(12) }]}>Avatar:</Text>
                    <Text style={[styles.summaryVal, { fontSize: scale(14) }]}>{selectedAvatar}</Text>
                  </View>

                  <View style={[styles.summaryDivider, { marginVertical: scale(10) }]} />

                  {/* SECCIÓN RESIDENCIA */}
                  <Text style={[styles.summarySectionTitle, { fontSize: scale(13) }]}>📍 Residencia Confirmada</Text>
                  <View style={[styles.summaryRow, { paddingVertical: scale(4) }]}>
                    <Text style={[styles.summaryLabel, { fontSize: scale(12) }]}>Dirección:</Text>
                    <Text style={[styles.summaryVal, { fontSize: scale(12) }]}>
                      {[addressStreet, addressBlock].filter(Boolean).join(' • ') || 'No especificada'}
                    </Text>
                  </View>
                  <View style={[styles.summaryRow, { paddingVertical: scale(4) }]}>
                    <Text style={[styles.summaryLabel, { fontSize: scale(12) }]}>Distrito:</Text>
                    <Text style={[styles.summaryVal, { fontSize: scale(12) }]}>
                      {[addressDistrict, addressProvince].filter(Boolean).join(', ') || 'No especificado'}
                    </Text>
                  </View>
                  <View style={[styles.summaryRow, { paddingVertical: scale(4) }]}>
                    <Text style={[styles.summaryLabel, { fontSize: scale(12) }]}>Comunidad:</Text>
                    <Text style={[styles.summaryVal, { fontSize: scale(12) }]}>
                      {addressCommunity || (addressDistrict ? `Comunidad Vecinal ${addressDistrict}` : 'Asignación vecinal cercana')}
                    </Text>
                  </View>
                  {gpsCoordinates ? (
                    <View style={[styles.summaryRow, { paddingVertical: scale(4) }]}>
                      <Text style={[styles.summaryLabel, { fontSize: scale(12) }]}>GPS:</Text>
                      <Text style={[styles.summaryVal, { fontSize: scale(12), color: '#0d9488', fontWeight: '700' }]}>
                        ✓ Real ({gpsCoordinates.latitude.toFixed(4)}, {gpsCoordinates.longitude.toFixed(4)})
                      </Text>
                    </View>
                  ) : null}
                </View>

                {/* EXPLICACIÓN DEL REGISTRO DEFINITIVO */}
                <View style={[styles.residenceNoticeCard, { marginTop: scale(14), padding: scale(12) }]}>
                  <Ionicons name="shield-checkmark-outline" size={scale(20)} color="#0369a1" style={{ marginRight: scale(8) }} />
                  <Text style={[styles.residenceNoticeText, { fontSize: scale(12), lineHeight: scale(18) }]}>
                    Al pulsar el botón definitivo, se creará tu cuenta en Supabase Auth, se activará tu perfil verificado en la comunidad y entrarás directamente a la aplicación.
                  </Text>
                </View>

                {/* SELECTOR DE ACCESIBILIDAD SENIOR */}
                {setFontScale && (
                  <View style={[styles.seniorSelectorBox, { padding: scale(14), marginBottom: scale(16) }]}>
                    <Text style={[styles.seniorTitle, { fontSize: scale(13), marginBottom: scale(10) }]}>
                      👁️ Elige tu tamaño de letra preferido (Accesibilidad):
                    </Text>
                    <View style={styles.seniorButtonsRow}>
                      <TouchableOpacity
                        onPress={() => setFontScale(1.0)}
                        style={[styles.seniorBtn, { paddingVertical: scale(10) }, fontScale === 1.0 && styles.seniorBtnActive]}
                      >
                        <Text style={[styles.seniorBtnText, { fontSize: scale(12) }, fontScale === 1.0 && styles.seniorBtnTextActive]}>
                          A Normal
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setFontScale(1.15)}
                        style={[styles.seniorBtn, { paddingVertical: scale(10) }, fontScale === 1.15 && styles.seniorBtnActive]}
                      >
                        <Text style={[styles.seniorBtnText, { fontSize: scale(12) }, fontScale === 1.15 && styles.seniorBtnTextActive]}>
                          A+ Grande
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setFontScale(1.30)}
                        style={[styles.seniorBtn, { paddingVertical: scale(10) }, fontScale === 1.30 && styles.seniorBtnActive]}
                      >
                        <Text style={[styles.seniorBtnText, { fontSize: scale(12) }, fontScale === 1.30 && styles.seniorBtnTextActive]}>
                          A++ Senior
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* BOTÓN FINALIZAR Y ENTRAR */}
                <TouchableOpacity
                  style={[styles.enterAppButton, { paddingVertical: scale(16) }, isFinalizing && { opacity: 0.7 }]}
                  activeOpacity={0.8}
                  disabled={isFinalizing}
                  onPress={handleFinalizeOnboarding}
                >
                  {isFinalizing ? (
                    <View style={styles.rowCentered}>
                      <ActivityIndicator color={COLORS.white} size="small" style={{ marginRight: scale(8) }} />
                      <Text style={[styles.enterAppButtonText, { fontSize: scale(15) }]}>
                        CREANDO CUENTA Y ACTIVANDO PERFIL...
                      </Text>
                    </View>
                  ) : (
                    <Text style={[styles.enterAppButtonText, { fontSize: scale(15) }]}>
                      🛡️ REGISTRARME Y ACCEDER A VECIRED IA
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
                    <Text style={styles.backStepSecondaryBtnText}>Corregir Datos de Cuenta (Paso 5)</Text>
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

// ==========================================================
// ESTILOS DEL PASO 4: RESIDENCIA REDISEÑADO
// ==========================================================
const rs = StyleSheet.create({
  optionsContainer: {
    gap: 10,
    marginBottom: 14,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  optionCardActive: {
    backgroundColor: '#f0fdfa',
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  optionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 2,
  },
  optionTitleActive: {
    color: COLORS.primaryDark,
  },
  optionDesc: {
    fontSize: 11,
    color: '#94a3b8',
    lineHeight: 15,
  },
  gpsResultBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  gpsResultText: {
    flex: 1,
    fontSize: 12,
    color: '#15803d',
    fontWeight: '600',
    lineHeight: 17,
  },
  addressPreviewCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  addressPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  addressPreviewTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#f0fdfa',
    gap: 4,
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  addressPreviewText: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '600',
    lineHeight: 20,
  },
  coordsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: '#f0fdfa',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  coordsText: {
    fontSize: 10,
    color: '#0d9488',
    fontWeight: '600',
  },
  fieldsContainer: {
    marginTop: 4,
    marginBottom: 6,
  },
  showFieldsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginBottom: 4,
  },
  showFieldsLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  miniMapCard: {
    marginTop: 10,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
  },
  miniMapGrid: {
    height: 80,
    backgroundColor: '#e0f2fe',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  mapLineHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 40,
    height: 6,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#bae6fd',
  },
  mapLineVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '50%',
    width: 6,
    marginLeft: -3,
    backgroundColor: '#ffffff',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#bae6fd',
  },
  mapRoadCurve: {
    position: 'absolute',
    top: 15,
    bottom: 15,
    left: '20%',
    right: '20%',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#93c5fd',
    borderStyle: 'dashed',
  },
  mapPinContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  mapPinPulse: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
  },
  miniMapBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  miniMapBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdfa',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  miniMapBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  communityCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f0fdfa',
    borderWidth: 1,
    borderColor: '#99f6e4',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  communityTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primaryDark,
    marginBottom: 2,
  },
  communityDesc: {
    fontSize: 11,
    color: '#0f766e',
    lineHeight: 16,
  },
});
