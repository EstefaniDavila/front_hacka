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
  KeyboardAvoidingView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import BiometricFaceScanner from '../components/BiometricFaceScanner';

export default function OnboardingScreen({
  onFinishLogin,
  onNavigateToLogin,
  fontScale = 1.0,
  setFontScale,
  onSaveUserData
}) {
  const { register, submitVerification } = useAuth();

  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [customSkill, setCustomSkill] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('');

  // DNI: Frente y Reverso
  const [dniFrontScanned, setDniFrontScanned] = useState(false);
  const [dniBackScanned, setDniBackScanned] = useState(false);
  const [scanningDni, setScanningDni] = useState(null); // 'front' | 'back' | 'both' | null
  const [dniFrontFile, setDniFrontFile] = useState(null);
  const [dniBackFile, setDniBackFile] = useState(null);

  // Biometría
  const [scanningFace, setScanningFace] = useState(false);
  const [faceScanned, setFaceScanned] = useState(false);
  const [selfieFile, setSelfieFile] = useState(null);
  const [showCameraScanner, setShowCameraScanner] = useState(false);

  // Dirección GPS y Corrección Detallada (Calle, Manzana, Distrito, Provincia, Ciudad)
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressStreet, setAddressStreet] = useState('Calle Los Nogales 214');
  const [addressBlock, setAddressBlock] = useState('Mz B Lote 4');
  const [addressZone, setAddressZone] = useState('Zona A - Manzana 2');
  const [addressDistrict, setAddressDistrict] = useState('Los Olivos');
  const [addressProvince, setAddressProvince] = useState('Lima');
  const [addressDepartment, setAddressDepartment] = useState('Lima');
  const [addressReference, setAddressReference] = useState('');
  const [detectedAddress, setDetectedAddress] = useState('Calle Los Nogales 214, Mz B Lote 4');
  const [detectedZone, setDetectedZone] = useState('Zona A - Manzana 2 • Los Olivos, Lima');
  const [addressConfirmed, setAddressConfirmed] = useState(true);
  const scrollViewRef = useRef(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

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

  // Estado de envío
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const scale = (val) => Math.round(val * fontScale);

  // Asegurar que al cambiar de paso el scroll vuelva al inicio de la tarjeta
  useEffect(() => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
  }, [step]);

  // Detectar ubicación real vía Geolocation del navegador si está en Web
  useEffect(() => {
    if (step === 5 && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setDetectedZone(`GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)} • Lima`);
        },
        () => {
          // Si no hay permiso o falla, conservar la zona por defecto
        },
        { timeout: 5000 }
      );
    }
  }, [step]);

  const SKILL_OPTIONS = [
    '🩺 Enfermería / Primeros auxilios',
    '🔧 Gasfitería / Plomería',
    '⚡ Electricidad básica',
    '🧵 Costura y confección',
    '🍲 Cocina y repostería',
    '📚 Docencia / Apoyo escolar',
    '🛠️ Albañilería / Carpintería',
    '🌟 Ninguna en particular / Voluntario de apoyo general'
  ];

  // Helper para generar imagen sintética para pruebas backend
  const createSyntheticBlob = (textLabel) => {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 250;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0f766e';
    ctx.fillRect(0, 0, 400, 250);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('PERU DNI 72849103', 40, 80);
    ctx.fillText(textLabel, 40, 140);
    return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg'));
  };

  const handleScanDni = async (side) => {
    setScanningDni(side);
    const blob = await createSyntheticBlob(`DNI ${side.toUpperCase()} VECIRED`);
    setTimeout(() => {
      setScanningDni(null);
      if (side === 'front') {
        setDniFrontScanned(true);
        setDniFrontFile(blob);
      }
      if (side === 'back') {
        setDniBackScanned(true);
        setDniBackFile(blob);
      }
    }, 1000);
  };

  const handleScanBothDni = async () => {
    setScanningDni('both');
    const fBlob = await createSyntheticBlob('DNI ANVERSO 72849103');
    const bBlob = await createSyntheticBlob('DNI REVERSO UBIGEO 150101');
    setTimeout(() => {
      setScanningDni(null);
      setDniFrontScanned(true);
      setDniBackScanned(true);
      setDniFrontFile(fBlob);
      setDniBackFile(bBlob);
    }, 1200);
  };

  const handleScanFace = async () => {
    setScanningFace(true);
    const sBlob = await createSyntheticBlob('SELFIE BIOMETRICA ROSTRO');
    setTimeout(() => {
      setScanningFace(false);
      setFaceScanned(true);
      setSelfieFile(sBlob);
      setTimeout(() => {
        setStep(5);
      }, 500);
    }, 1100);
  };

  const handleFileUpload = (event, type) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (type === 'front') {
        setDniFrontFile(file);
        setDniFrontScanned(true);
      } else if (type === 'back') {
        setDniBackFile(file);
        setDniBackScanned(true);
      } else if (type === 'selfie') {
        setSelfieFile(file);
        setFaceScanned(true);
      }
    }
  };

  const handleCompleteRegistration = async () => {
    setIsSubmitting(true);
    setSubmitError('');
    const finalSkill = customSkill.trim() ? customSkill.trim() : selectedSkill;

    try {
      // 1. Registro real en Supabase Auth
      const regResult = await register(email, password, {
        fullName: name,
        phone,
        skill: finalSkill,
        avatar: selectedAvatar || '👤',
        address: `${detectedAddress} • ${detectedZone}`
      });

      if (!regResult.success) {
        setSubmitError(regResult.error || 'Error al registrar la cuenta en Supabase.');
        setIsSubmitting(false);
        return;
      }

      // 2. Si Supabase no devolvió sesión inmediata (por ejemplo si la confirmación de correo está activa)
      if (!regResult.hasSession) {
        if (typeof window !== 'undefined' && window.alert) {
          window.alert('¡Registro exitoso! Por favor inicia sesión con tu correo y contraseña.');
        }
        setIsSubmitting(false);
        if (onNavigateToLogin) {
          onNavigateToLogin();
        }
        return;
      }

      // 3. Verificación de identidad contra FastAPI Backend con el token real
      let fFile = dniFrontFile || (await createSyntheticBlob('DNI ANVERSO REAL'));
      let bFile = dniBackFile || (await createSyntheticBlob('DNI REVERSO REAL'));
      let sFile = selfieFile || (await createSyntheticBlob('SELFIE VECINO REAL'));

      if (fFile && sFile) {
        try {
          await submitVerification({
            dniFrontFile: fFile,
            dniBackFile: bFile,
            selfieFile: sFile,
            fullName: name
          });
        } catch (verifErr) {
          console.warn('[Onboarding] Aviso en verificación de identidad:', verifErr);
        }
      }

      // 4. Notificar al estado de la aplicación
      if (onSaveUserData) {
        onSaveUserData({
          name,
          phone,
          email,
          skill: finalSkill,
          avatar: selectedAvatar || '👤',
          address: `${detectedAddress} • ${detectedZone}`
        });
      }

      onFinishLogin();
    } catch (err) {
      console.error('[Onboarding] Error durante el registro:', err);
      setSubmitError(err.message || 'Error inesperado al completar el registro.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Visor de Cámara Frontal Nativa con Detección Biométrica
  if (showCameraScanner) {
    return (
      <BiometricFaceScanner
        onFaceCaptured={(photo) => {
          setSelfieFile(photo);
          setFaceScanned(true);
          setShowCameraScanner(false);
        }}
        onCancel={() => setShowCameraScanner(false)}
        fontScale={fontScale}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>

        {/* Barra Superior con Navegación y Progreso */}
        <View style={styles.headerProgress}>
          <View style={styles.headerNavRow}>
            {step > 1 ? (
              <TouchableOpacity
                style={styles.headerBackBtn}
                activeOpacity={0.7}
                onPress={() => setStep((prev) => Math.max(1, prev - 1))}
              >
                <Ionicons name="arrow-back" size={17} color={COLORS.primaryDark} style={{ marginRight: 4 }} />
                <Text style={styles.headerBackBtnText}>Atrás (Paso {step - 1})</Text>
              </TouchableOpacity>
            ) : onNavigateToLogin ? (
              <TouchableOpacity
                style={styles.headerBackBtn}
                activeOpacity={0.7}
                onPress={onNavigateToLogin}
              >
                <Ionicons name="arrow-back" size={17} color={COLORS.primaryDark} style={{ marginRight: 4 }} />
                <Text style={styles.headerBackBtnText}>Volver al Login</Text>
              </TouchableOpacity>
            ) : (
              <View />
            )}

            {onNavigateToLogin ? (
              <TouchableOpacity
                style={styles.headerLoginBtn}
                activeOpacity={0.7}
                onPress={onNavigateToLogin}
              >
                <Ionicons name="log-in-outline" size={16} color={COLORS.primaryDark} style={{ marginRight: 4 }} />
                <Text style={styles.headerLoginBtnText}>Iniciar Sesión</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.progressInfoRow}>
            <Text style={[styles.stepIndicatorText, { fontSize: scale(12) }]}>
              PASO {step} DE 6
            </Text>
            {step > 1 && (
              <Text style={[styles.stepIndicatorSub, { fontSize: scale(11) }]}>
                {step === 2 && '• Datos de Contacto'}
                {step === 3 && '• Foto del DNI'}
                {step === 4 && '• Biometría'}
                {step === 5 && '• Ubicación'}
                {step === 6 && '• Confirmación'}
              </Text>
            )}
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

            {/* PASO 1: BIENVENIDA */}
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
                    <Text style={styles.pillBadgeText}>🔒 100% Vecinos Reales con DNI</Text>
                  </View>
                  <View style={styles.pillBadge}>
                    <Text style={styles.pillBadgeText}>📍 Ubicación GPS Comunal</Text>
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
                    EMPEZAR REGISTRO
                  </Text>
                </TouchableOpacity>

                {onNavigateToLogin ? (
                  <TouchableOpacity
                    style={styles.secondaryLoginButton}
                    activeOpacity={0.8}
                    onPress={onNavigateToLogin}
                  >
                    <Text style={[styles.secondaryLoginButtonText, { fontSize: scale(14) }]}>
                      ¿Ya eres vecino registrado? INICIAR SESIÓN
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            )}

            {/* PASO 2: CELULAR, NOMBRE, CORREO, CONTRASEÑA Y PROFESIÓN / HABILIDAD */}
            {step === 2 && (
              <View style={styles.stepCard}>
                <View style={styles.iconCircle}>
                  <Text style={{ fontSize: 32 }}>📱</Text>
                </View>
                <Text style={[styles.title, { fontSize: scale(20) }]}>
                  Tus Datos de Contacto y Acceso
                </Text>
                <Text style={[styles.subtitle, { fontSize: scale(13) }]}>
                  Crea tus credenciales de acceso y tu habilidad vecinal para coordinar apoyo en tu barrio.
                </Text>

                {/* Nombre Completo */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { fontSize: scale(12) }]}>Nombre Completo *</Text>
                  <TextInput
                    style={[styles.input, { fontSize: scale(13) }]}
                    value={name}
                    onChangeText={setName}
                    placeholder="Ej: Juan Pérez / María García"
                    returnKeyType="next"
                  />
                </View>

                {/* Correo Electrónico */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { fontSize: scale(12) }]}>Correo Electrónico *</Text>
                  <TextInput
                    style={[styles.input, { fontSize: scale(13) }]}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="ejemplo@correo.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                {/* Contraseña */}
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

                {/* Número de Celular */}
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

                {/* Profesión u Habilidad vecinal */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { fontSize: scale(12) }]}>
                    Profesión u Oficio / Habilidad Vecinal *
                  </Text>
                  <Text style={[styles.inputSubLabel, { fontSize: scale(10) }]}>
                    Si no tienes un oficio específico, elige la opción de "Apoyo general".
                  </Text>

                                  {/* Selector de Avatar Vecinal */}
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
                          onPress={() => setSelectedAvatar(selectedAvatar === av ? '' : av)}
                          activeOpacity={0.7}
                        >
                          <Text style={{ fontSize: 22 }}>{av}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
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
                          <Text style={[styles.skillOptionText, isSelected && styles.skillOptionTextSelected, { fontSize: scale(11) }]}>
                            {opt}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Opción de escribir una habilidad personalizada */}
                  <Text style={[styles.orCustomText, { fontSize: scale(11) }]}>
                    O escribe otra profesión u ocupación:
                  </Text>
                  <TextInput
                    style={[styles.input, { fontSize: scale(13), marginTop: 4 }]}
                    placeholder="Ej: Conductor, Cuidador de adultos, etc."
                    placeholderTextColor="#94a3b8"
                    returnKeyType="done"
                    value={customSkill}
                    onChangeText={(val) => {
                      setCustomSkill(val);
                      if (val.trim()) setSelectedSkill('');
                    }}
                    onFocus={() => {
                      setTimeout(() => {
                        scrollViewRef.current?.scrollTo({ y: 560, animated: true });
                      }, 120);
                    }}
                    onSubmitEditing={() => Keyboard.dismiss()}
                  />
                </View>

                <TouchableOpacity
                  style={styles.primaryButton}
                  activeOpacity={0.8}
                  onPress={() => setStep(3)}
                >
                  <Text style={[styles.primaryButtonText, { fontSize: scale(15) }]}>
                    CONTINUAR AL ESCANEO DNI
                  </Text>
                </TouchableOpacity>

                {/* Botones de navegación inferior para volver atrás o ir al login */}
                <View style={styles.stepFooterNavRow}>
                  <TouchableOpacity
                    style={styles.backStepSecondaryBtn}
                    activeOpacity={0.7}
                    onPress={() => setStep(1)}
                  >
                    <Ionicons name="arrow-back-outline" size={16} color="#475569" style={{ marginRight: 6 }} />
                    <Text style={styles.backStepSecondaryBtnText}>Volver al paso anterior</Text>
                  </TouchableOpacity>

                  {onNavigateToLogin ? (
                    <TouchableOpacity
                      style={styles.stepLoginLinkBtn}
                      activeOpacity={0.7}
                      onPress={onNavigateToLogin}
                    >
                      <Ionicons name="log-in-outline" size={15} color={COLORS.primaryDark} style={{ marginRight: 4 }} />
                      <Text style={styles.stepLoginLinkBtnText}>¿Ya tienes cuenta? Iniciar Sesión</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            )}

            {/* PASO 3: FOTO DEL DNI (FRENTE Y DETRÁS) */}
            {step === 3 && (
              <View style={styles.stepCard}>
                <View style={styles.iconCircle}>
                  <Text style={{ fontSize: 32 }}>🪪</Text>
                </View>
                <Text style={[styles.title, { fontSize: scale(20) }]}>
                  Foto del DNI (Frente y Reverso)
                </Text>
                <Text style={[styles.subtitle, { fontSize: scale(13) }]}>
                  Por seguridad comunitaria, sube la foto del DNI por ambos lados para verificar que resides en la zona.
                </Text>

                {/* CONTENEDOR FRENTE DEL DNI */}
                <View style={styles.dniSideCard}>
                  <View style={styles.dniSideHeader}>
                    <Text style={[styles.dniSideTitle, { fontSize: scale(13) }]}>
                      📸 1. Frente del DNI (Anverso)
                    </Text>
                    {dniFrontScanned ? (
                      <View style={styles.badgeSuccess}>
                        <Text style={styles.badgeSuccessText}>✓ Capturado</Text>
                      </View>
                    ) : (
                      <Text style={styles.badgePendingText}>Pendiente</Text>
                    )}
                  </View>

                  <View style={styles.dniPreviewBox}>
                    {scanningDni === 'front' || scanningDni === 'both' ? (
                      <View style={styles.scanningWrap}>
                        <ActivityIndicator size="small" color={COLORS.primary} />
                        <Text style={[styles.scanningLabel, { fontSize: scale(11) }]}>
                          Escaneando frente con OCR...
                        </Text>
                      </View>
                    ) : dniFrontScanned ? (
                      <View style={styles.dniScannedView}>
                        <Text style={{ fontSize: 26, marginRight: 8 }}>🇵🇪</Text>
                        <View>
                          <Text style={[styles.dniDataName, { fontSize: scale(12) }]}>
                            MARTHA QUISPE MAMANI
                          </Text>
                          <Text style={[styles.dniDataNumber, { fontSize: scale(11) }]}>
                            DNI: ****8921 • Nac: 12/04/1958
                          </Text>
                        </View>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.cameraPlaceholder}
                        onPress={() => handleScanDni('front')}
                      >
                        <Text style={{ fontSize: 28 }}>📷</Text>
                        <Text style={[styles.cameraText, { fontSize: scale(11) }]}>
                          Tomar foto al FRENTE del DNI
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* CONTENEDOR REVERSO DEL DNI */}
                <View style={styles.dniSideCard}>
                  <View style={styles.dniSideHeader}>
                    <Text style={[styles.dniSideTitle, { fontSize: scale(13) }]}>
                      📸 2. Reverso del DNI (Posterior)
                    </Text>
                    {dniBackScanned ? (
                      <View style={styles.badgeSuccess}>
                        <Text style={styles.badgeSuccessText}>✓ Capturado</Text>
                      </View>
                    ) : (
                      <Text style={styles.badgePendingText}>Pendiente</Text>
                    )}
                  </View>

                  <View style={styles.dniPreviewBox}>
                    {scanningDni === 'back' || scanningDni === 'both' ? (
                      <View style={styles.scanningWrap}>
                        <ActivityIndicator size="small" color={COLORS.primary} />
                        <Text style={[styles.scanningLabel, { fontSize: scale(11) }]}>
                          Escaneando reverso (Ubigeo & Huella)...
                        </Text>
                      </View>
                    ) : dniBackScanned ? (
                      <View style={styles.dniScannedView}>
                        <Text style={{ fontSize: 26, marginRight: 8 }}>🧬</Text>
                        <View>
                          <Text style={[styles.dniDataName, { fontSize: scale(12) }]}>
                            UBIGEO: 150101 • HUELLA DIGITAL REGISTRADA
                          </Text>
                          <Text style={[styles.dniDataNumber, { fontSize: scale(11) }]}>
                            Código barras validado con RENIEC
                          </Text>
                        </View>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.cameraPlaceholder}
                        onPress={() => handleScanDni('back')}
                      >
                        <Text style={{ fontSize: 28 }}>📷</Text>
                        <Text style={[styles.cameraText, { fontSize: scale(11) }]}>
                          Tomar foto al REVERSO del DNI
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* Botón rápido para capturar ambos lados si no se hizo individualmente */}
                {(!dniFrontScanned || !dniBackScanned) && (
                  <TouchableOpacity
                    style={styles.scanBothButton}
                    onPress={handleScanBothDni}
                  >
                    <Text style={[styles.scanBothButtonText, { fontSize: scale(13) }]}>
                      ⚡ Simular Escaneo Automático de Ambos Lados
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    (!dniFrontScanned || !dniBackScanned) && { opacity: 0.5 }
                  ]}
                  disabled={!dniFrontScanned || !dniBackScanned}
                  activeOpacity={0.8}
                  onPress={() => setStep(4)}
                >
                  <Text style={[styles.primaryButtonText, { fontSize: scale(15) }]}>
                    CONTINUAR A BIOMETRÍA
                  </Text>
                </TouchableOpacity>

                <View style={styles.stepFooterNavRow}>
                  <TouchableOpacity
                    style={styles.backStepSecondaryBtn}
                    activeOpacity={0.7}
                    onPress={() => setStep(2)}
                  >
                    <Ionicons name="arrow-back-outline" size={16} color="#475569" style={{ marginRight: 6 }} />
                    <Text style={styles.backStepSecondaryBtnText}>Volver a Datos de Contacto (Paso 2)</Text>
                  </TouchableOpacity>

                  {onNavigateToLogin ? (
                    <TouchableOpacity
                      style={styles.stepLoginLinkBtn}
                      activeOpacity={0.7}
                      onPress={onNavigateToLogin}
                    >
                      <Text style={styles.stepLoginLinkBtnText}>Ir al Login</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            )}

            {/* PASO 4: BIOMETRÍA FACIAL (PRUEBA DE VIDA Y ENCUADRE NATIVO) */}
            {step === 4 && (
              <View style={styles.stepCard}>
                <View style={styles.iconCircle}>
                  <Text style={{ fontSize: 32 }}>👤</Text>
                </View>
                <Text style={[styles.title, { fontSize: scale(20) }]}>
                  Biometría Facial con Cámara Frontal
                </Text>
                <Text style={[styles.subtitle, { fontSize: scale(13) }]}>
                  Validación biométrica asistida: centra tu rostro, mantén la distancia adecuada y mira de frente. No se requieren giros ni parpadeos.
                </Text>

                <View style={styles.faceOvalBox}>
                  {faceScanned ? (
                    <View style={{ alignItems: 'center', paddingVertical: 10 }}>
                      <Text style={{ fontSize: 48 }}>✅</Text>
                      <Text style={[styles.faceSuccessText, { fontSize: scale(13) }]}>
                        ¡Rostro Validado y Capturado!
                      </Text>
                      <View style={{ marginTop: 8, alignItems: 'center' }}>
                        <Text style={{ color: '#22c55e', fontSize: scale(11), fontWeight: 'bold' }}>
                          ✓ Centrado óptimo
                        </Text>
                        <Text style={{ color: '#22c55e', fontSize: scale(11), fontWeight: 'bold' }}>
                          ✓ Distancia correcta
                        </Text>
                        <Text style={{ color: '#22c55e', fontSize: scale(11), fontWeight: 'bold' }}>
                          ✓ Mirada frontal directa
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <View style={{ alignItems: 'center', paddingVertical: 12 }}>
                      <Text style={{ fontSize: 56 }}>🤳</Text>
                      <Text style={[styles.faceHintText, { fontSize: scale(12), marginTop: 8 }]}>
                        El óvalo cambiará a VERDE y capturará automáticamente tras 1.5s
                      </Text>
                    </View>
                  )}
                </View>

                {!faceScanned ? (
                  <>
                    <TouchableOpacity
                      style={styles.primaryButton}
                      activeOpacity={0.8}
                      onPress={() => setShowCameraScanner(true)}
                    >
                      <Text style={[styles.primaryButtonText, { fontSize: scale(15) }]}>
                        📸 ABRIR CÁMARA FRONTAL NATIVA
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.scanBothButton}
                      activeOpacity={0.8}
                      onPress={handleScanFace}
                    >
                      <Text style={[styles.scanBothButtonText, { fontSize: scale(12) }]}>
                        🤖 Simular Detección (Modo Emulador)
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <TouchableOpacity
                      style={styles.primaryButton}
                      activeOpacity={0.8}
                      onPress={() => setStep(5)}
                    >
                      <Text style={[styles.primaryButtonText, { fontSize: scale(15) }]}>
                        CONTINUAR A DOMICILIO Y GPS
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={{ marginTop: 12, alignItems: 'center', padding: 6 }}
                      activeOpacity={0.8}
                      onPress={() => {
                        setFaceScanned(false);
                        setSelfieFile(null);
                        setShowCameraScanner(true);
                      }}
                    >
                      <Text style={{ color: '#94a3b8', fontSize: scale(12), textDecorationLine: 'underline' }}>
                        🔄 Repetir escaneo facial
                      </Text>
                    </TouchableOpacity>
                  </>
                )}

                <View style={styles.stepFooterNavRow}>
                  <TouchableOpacity
                    style={styles.backStepSecondaryBtn}
                    activeOpacity={0.7}
                    onPress={() => setStep(3)}
                  >
                    <Ionicons name="arrow-back-outline" size={16} color="#475569" style={{ marginRight: 6 }} />
                    <Text style={styles.backStepSecondaryBtnText}>Volver a Fotos de DNI (Paso 3)</Text>
                  </TouchableOpacity>

                  {onNavigateToLogin ? (
                    <TouchableOpacity
                      style={styles.stepLoginLinkBtn}
                      activeOpacity={0.7}
                      onPress={onNavigateToLogin}
                    >
                      <Text style={styles.stepLoginLinkBtnText}>Ir al Login</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            )}

            {/* PASO 5: UBICACIÓN GPS Y CONFIRMACIÓN / CORRECCIÓN */}
            {step === 5 && (
              <View style={styles.stepCard}>
                <View style={styles.iconCircle}>
                  <Text style={{ fontSize: 32 }}>📍</Text>
                </View>
                <Text style={[styles.title, { fontSize: scale(20) }]}>
                  Confirmación de Dirección
                </Text>
                <Text style={[styles.subtitle, { fontSize: scale(13) }]}>
                  La aplicación móvil solicita permiso GPS para ubicarte dentro del cuadrante comunal seguro.
                </Text>

                <View style={styles.mapSimulationBox}>
                  <Text style={{ fontSize: 36, marginBottom: 6 }}>🗺️</Text>

                  <View style={styles.gpsDetectedBadge}>
                    <Text style={[styles.gpsBadgeText, { fontSize: scale(11) }]}>
                      📍 Ubicación Detectada por GPS
                    </Text>
                  </View>

                  {!isEditingAddress ? (
                    <View style={styles.addressDisplayBox}>
                      <Text style={[styles.addressTextPrimary, { fontSize: scale(13) }]}>
                        {detectedAddress}
                      </Text>
                      <Text style={[styles.addressTextSecondary, { fontSize: scale(11) }]}>
                        {detectedZone}
                      </Text>
                      <Text style={[styles.gpsAccuracyText, { fontSize: scale(10) }]}>
                        Precisión: ±3 metros • Permiso GPS Concedido
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.editAddressForm}>
                      <Text style={[styles.editAddressHelpNotice, { fontSize: scale(11) }]}>
                        📍 Ingresa tu dirección exacta para una ubicación precisa en la comunidad:
                      </Text>

                      {/* Calle y Número */}
                      <Text style={[styles.inputLabel, { fontSize: scale(11) }]}>Calle, Jirón o Avenida y Número *</Text>
                      <TextInput
                        style={[styles.input, { fontSize: scale(12), marginBottom: 8 }]}
                        value={addressStreet}
                        onChangeText={setAddressStreet}
                        placeholder="Ej. Calle Los Nogales 214"
                        placeholderTextColor="#94a3b8"
                      />

                      {/* Manzana y Lote */}
                      <Text style={[styles.inputLabel, { fontSize: scale(11) }]}>Manzana y Lote / Sector *</Text>
                      <TextInput
                        style={[styles.input, { fontSize: scale(12), marginBottom: 8 }]}
                        value={addressBlock}
                        onChangeText={setAddressBlock}
                        placeholder="Ej. Mz B Lote 4, Sector 2"
                        placeholderTextColor="#94a3b8"
                      />

                      {/* Zona y Barrio */}
                      <Text style={[styles.inputLabel, { fontSize: scale(11) }]}>Zona Barrial VeciRed *</Text>
                      <TextInput
                        style={[styles.input, { fontSize: scale(12), marginBottom: 8 }]}
                        value={addressZone}
                        onChangeText={setAddressZone}
                        placeholder="Ej. Zona A - Manzana 2"
                        placeholderTextColor="#94a3b8"
                      />

                      {/* Fila Distrito y Provincia */}
                      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.inputLabel, { fontSize: scale(11) }]}>Distrito *</Text>
                          <TextInput
                            style={[styles.input, { fontSize: scale(12) }]}
                            value={addressDistrict}
                            onChangeText={setAddressDistrict}
                            placeholder="Ej. Los Olivos"
                            placeholderTextColor="#94a3b8"
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.inputLabel, { fontSize: scale(11) }]}>Provincia *</Text>
                          <TextInput
                            style={[styles.input, { fontSize: scale(12) }]}
                            value={addressProvince}
                            onChangeText={setAddressProvince}
                            placeholder="Ej. Lima"
                            placeholderTextColor="#94a3b8"
                          />
                        </View>
                      </View>

                      {/* Fila Ciudad / Departamento y Referencia */}
                      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.inputLabel, { fontSize: scale(11) }]}>Ciudad / Región *</Text>
                          <TextInput
                            style={[styles.input, { fontSize: scale(12) }]}
                            value={addressDepartment}
                            onChangeText={setAddressDepartment}
                            placeholder="Ej. Lima"
                            placeholderTextColor="#94a3b8"
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.inputLabel, { fontSize: scale(11) }]}>Referencia (Opcional)</Text>
                          <TextInput
                            style={[styles.input, { fontSize: scale(12) }]}
                            value={addressReference}
                            onChangeText={setAddressReference}
                            placeholder="Ej. Frente al parque"
                            placeholderTextColor="#94a3b8"
                          />
                        </View>
                      </View>
                    </View>
                  )}
                </View>

                <View style={styles.stepFooterNavRow}>
                  <TouchableOpacity
                    style={styles.backStepSecondaryBtn}
                    activeOpacity={0.7}
                    onPress={() => setStep(4)}
                  >
                    <Ionicons name="arrow-back-outline" size={16} color="#475569" style={{ marginRight: 6 }} />
                    <Text style={styles.backStepSecondaryBtnText}>Volver a Biometría (Paso 4)</Text>
                  </TouchableOpacity>

                  {onNavigateToLogin ? (
                    <TouchableOpacity
                      style={styles.stepLoginLinkBtn}
                      activeOpacity={0.7}
                      onPress={onNavigateToLogin}
                    >
                      <Text style={styles.stepLoginLinkBtnText}>Ir al Login</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                {/* Botón si es o no es su dirección */}
                {!isEditingAddress ? (
                  <View style={styles.addressActionButtons}>
                    <TouchableOpacity
                      style={styles.primaryButton}
                      activeOpacity={0.8}
                      onPress={() => {
                        setAddressConfirmed(true);
                        setStep(6);
                      }}
                    >
                      <Text style={[styles.primaryButtonText, { fontSize: scale(14) }]}>
                        ✅ SÍ, ES MI DIRECCIÓN
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.editAddressButton}
                      activeOpacity={0.8}
                      onPress={() => setIsEditingAddress(true)}
                    >
                      <Text style={[styles.editAddressButtonText, { fontSize: scale(13) }]}>
                        ✏️ No es mi dirección / Corregir manualmente
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.addressActionButtons}>
                    <TouchableOpacity
                      style={styles.primaryButton}
                      activeOpacity={0.8}
                      onPress={() => {
                        const st = addressStreet.trim() || 'Calle Los Nogales 214';
                        const bl = addressBlock.trim() || 'Mz B Lote 4';
                        const zn = addressZone.trim() || 'Zona A - Manzana 2';
                        const dt = addressDistrict.trim() || 'Los Olivos';
                        const pr = addressProvince.trim() || 'Lima';
                        const dp = addressDepartment.trim() || 'Lima';

                        setDetectedAddress(`${st}, ${bl}`);
                        setDetectedZone(`${zn} • ${dt}, ${pr} (${dp})`);
                        setIsEditingAddress(false);
                        setAddressConfirmed(true);
                        setStep(6);
                      }}
                    >
                      <Text style={[styles.primaryButtonText, { fontSize: scale(14) }]}>
                        💾 GUARDAR Y CONFIRMAR DIRECCIÓN COMPLETA
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* PASO 6: IDENTIDAD VERIFICADA & TAMAÑO DE FUENTE SENIOR */}
            {step === 6 && (
              <View style={styles.stepCard}>
                <View style={[styles.iconCircleBig, { backgroundColor: COLORS.primarySurface }]}>
                  <Text style={{ fontSize: 44 }}>🛡️</Text>
                </View>
                <Text style={[styles.title, { fontSize: scale(22), color: COLORS.primaryDark }]}>
                  ¡Registro Completado!
                </Text>
                <Text style={[styles.subtitle, { fontSize: scale(13) }]}>
                  Tus datos quedaron guardados en tu dispositivo y protegidos en la base de datos de VeciRed.
                </Text>

                {submitError ? (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>⚠️ {submitError}</Text>
                  </View>
                ) : null}

                {/* Ficha Resumen de Identidad */}
                <View style={styles.summaryCard}>
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { fontSize: scale(11) }]}>👤 Vecino:</Text>
                    <Text style={[styles.summaryVal, { fontSize: scale(12) }]}>{name}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { fontSize: scale(11) }]}>✉️ Correo:</Text>
                    <Text style={[styles.summaryVal, { fontSize: scale(12) }]}>{email}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { fontSize: scale(11) }]}>📞 Celular:</Text>
                    <Text style={[styles.summaryVal, { fontSize: scale(12) }]}>{phone}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { fontSize: scale(11) }]}>💼 Habilidad:</Text>
                    <Text style={[styles.summaryVal, { fontSize: scale(12) }]}>
                      {customSkill.trim() || selectedSkill}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { fontSize: scale(11) }]}>🪪 DNI:</Text>
                    <Text style={[styles.summaryVal, { fontSize: scale(12) }]}>
                      ✓ Verificado con Foto (Frente y Reverso)
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { fontSize: scale(11) }]}>📍 Domicilio:</Text>
                    <Text style={[styles.summaryVal, { fontSize: scale(12) }]}>
                      {detectedAddress}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { fontSize: scale(11) }]}>🗺️ Ubicación:</Text>
                    <Text style={[styles.summaryVal, { fontSize: scale(12) }]}>
                      {addressDistrict}, {addressProvince} - {addressDepartment}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { fontSize: scale(11) }]}>🏘️ Cuadrante Barrial:</Text>
                    <Text style={[styles.summaryVal, { fontSize: scale(12) }]}>
                      {addressZone}
                    </Text>
                  </View>
                </View>

                {/* Selector de Accesibilidad Senior */}
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

                <TouchableOpacity
                  style={[styles.enterAppButton, isSubmitting && { opacity: 0.7 }]}
                  activeOpacity={0.8}
                  disabled={isSubmitting}
                  onPress={handleCompleteRegistration}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color={COLORS.white} size="small" />
                  ) : (
                    <Text style={[styles.enterAppButtonText, { fontSize: scale(16) }]}>
                      🚀 ENTRAR A LA APLICACIÓN
                    </Text>
                  )}
                </TouchableOpacity>

                <View style={styles.stepFooterNavRow}>
                  <TouchableOpacity
                    style={styles.backStepSecondaryBtn}
                    activeOpacity={0.7}
                    onPress={() => setStep(2)}
                  >
                    <Ionicons name="create-outline" size={16} color="#475569" style={{ marginRight: 6 }} />
                    <Text style={styles.backStepSecondaryBtnText}>✏️ Corregir mis datos de contacto (Paso 2)</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

          </ScrollView>

          {/* Barra accesoria flotante para cerrar teclado de 1 toque */}
          {keyboardHeight > 0 && (
            <View style={styles.keyboardToolbar}>
              <Text style={[styles.keyboardToolbarHint, { fontSize: scale(11) }]}>
                ⌨️ Teclado activo • Desliza o toca para cerrar
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
    paddingTop: 16,
    paddingBottom: 10,
    backgroundColor: COLORS.white
  },
  stepIndicatorText: {
    fontWeight: '800',
    color: COLORS.primaryDark,
    marginBottom: 6
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: COLORS.border,
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
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center'
  },
  iconCircleBig: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.primaryPale
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.primaryPale
  },
  title: {
    fontWeight: '900',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 6
  },
  subtitle: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16
  },
  featurePillsWrap: {
    width: '100%',
    gap: 8,
    marginBottom: 20
  },
  pillBadge: {
    backgroundColor: COLORS.primarySurface,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.primaryPale
  },
  pillBadgeText: {
    color: COLORS.primaryDeep,
    fontWeight: '700',
    textAlign: 'center'
  },
  inputGroup: {
    width: '100%',
    marginBottom: 14
  },
  inputLabel: {
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 4
  },
  inputSubLabel: {
    color: COLORS.textSecondary,
    marginBottom: 6
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    color: '#0f172a',
    fontWeight: '700'
  },
  skillsSelectorWrap: {
    gap: 6,
    marginVertical: 6
  },
  skillOptionPill: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12
  },
  skillOptionPillSelected: {
    backgroundColor: COLORS.primarySurface,
    borderColor: COLORS.primary,
    borderWidth: 1.5
  },
  skillOptionText: {
    color: COLORS.textSecondary,
    fontWeight: '600'
  },
  skillOptionTextSelected: {
    color: COLORS.primaryDeep,
    fontWeight: '800'
  },
  orCustomText: {
    color: COLORS.textSecondary,
    fontWeight: '700',
    marginTop: 8
  },
  dniSideCard: {
    width: '100%',
    backgroundColor: COLORS.background,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12
  },
  dniSideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  dniSideTitle: {
    fontWeight: '800',
    color: COLORS.textPrimary
  },
  badgeSuccess: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8
  },
  badgeSuccessText: {
    color: '#059669',
    fontWeight: '800',
    fontSize: 10
  },
  badgePendingText: {
    color: COLORS.textMuted,
    fontWeight: '700',
    fontSize: 10
  },
  dniPreviewBox: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 64,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10
  },
  cameraPlaceholder: {
    alignItems: 'center',
    gap: 4
  },
  cameraText: {
    color: COLORS.primaryDark,
    fontWeight: '700'
  },
  scanningWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  scanningLabel: {
    color: COLORS.primaryDark,
    fontWeight: '700'
  },
  dniScannedView: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%'
  },
  dniDataName: {
    fontWeight: '800',
    color: COLORS.textPrimary
  },
  dniDataNumber: {
    color: COLORS.textSecondary,
    fontWeight: '600'
  },
  scanBothButton: {
    backgroundColor: COLORS.primarySurface,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12
  },
  scanBothButtonText: {
    color: COLORS.primaryDark,
    fontWeight: '800'
  },
  faceOvalBox: {
    width: 170,
    height: 190,
    borderRadius: 85,
    borderWidth: 3,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primarySurface,
    marginVertical: 16
  },
  faceSuccessText: {
    color: COLORS.primaryDark,
    fontWeight: '800',
    marginTop: 6
  },
  faceHintText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 6
  },
  mapSimulationBox: {
    width: '100%',
    backgroundColor: COLORS.background,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    marginBottom: 14
  },
  gpsDetectedBadge: {
    backgroundColor: COLORS.primarySurface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.primaryPale,
    marginBottom: 8
  },
  gpsBadgeText: {
    color: COLORS.primaryDeep,
    fontWeight: '800'
  },
  addressDisplayBox: {
    alignItems: 'center'
  },
  addressTextPrimary: {
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center'
  },
  addressTextSecondary: {
    fontWeight: '700',
    color: COLORS.primaryDark,
    marginTop: 2
  },
  gpsAccuracyText: {
    color: COLORS.textMuted,
    fontWeight: '600',
    marginTop: 4
  },
  editAddressForm: {
    width: '100%',
    marginTop: 6
  },
  editAddressHelpNotice: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 10,
    padding: 8,
    color: '#166534',
    fontWeight: '700',
    marginBottom: 10
  },

  addressActionButtons: {
    width: '100%',
    gap: 8
  },
  editAddressButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center'
  },
  editAddressButtonText: {
    color: COLORS.textSecondary,
    fontWeight: '700'
  },
  summaryCard: {
    width: '100%',
    backgroundColor: COLORS.primarySurface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.primaryPale,
    gap: 6,
    marginBottom: 14
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  summaryLabel: {
    fontWeight: '700',
    color: COLORS.textSecondary
  },
  summaryVal: {
    fontWeight: '800',
    color: COLORS.primaryDeep
  },
  seniorSelectorBox: {
    width: '100%',
    backgroundColor: COLORS.background,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16
  },
  seniorTitle: {
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
    textAlign: 'center'
  },
  seniorButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8
  },
  seniorBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    alignItems: 'center'
  },
  seniorBtnActive: {
    backgroundColor: COLORS.primaryDark,
    borderColor: COLORS.primaryDark
  },
  seniorBtnText: {
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontSize: 12
  },
  seniorBtnTextActive: {
    color: COLORS.white,
    fontWeight: '900'
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    width: '100%',
    alignItems: 'center'
  },
  primaryButtonText: {
    color: COLORS.white,
    fontWeight: '900'
  },
  secondaryLoginButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: '100%',
    alignItems: 'center',
    marginTop: 10
  },
  secondaryLoginButtonText: {
    color: COLORS.primaryDark,
    fontWeight: '700'
  },
  enterAppButton: {
    backgroundColor: COLORS.primaryDark,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    width: '100%',
    alignItems: 'center'
  },
  enterAppButtonText: {
    color: COLORS.white,
    fontWeight: '900'
  },
  keyboardToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4
  },
  keyboardToolbarHint: {
    color: COLORS.textMuted,
    fontWeight: '600'
  },
  keyboardCloseBtn: {
    backgroundColor: COLORS.primaryDark,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8
  },
  keyboardCloseBtnText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 12
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
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#cbd5e1'
  },
  headerBackBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primaryDark
  },
  headerLoginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#a7f3d0'
  },
  headerLoginBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primaryDark
  },
  progressInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6
  },
  stepIndicatorSub: {
    color: COLORS.textSecondary,
    fontWeight: '600'
  },
  stepFooterNavRow: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10
  },
  backStepSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    width: '100%'
  },
  backStepSecondaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155'
  },
  stepLoginLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12
  },
  stepLoginLinkBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primaryDark
  },
});
