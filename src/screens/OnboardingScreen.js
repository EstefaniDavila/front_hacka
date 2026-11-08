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
import { COLORS } from '../theme/colors';

export default function OnboardingScreen({
  onFinishLogin,
  fontScale = 1.0,
  setFontScale,
  onSaveUserData
}) {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('984 555 123');
  const [name, setName] = useState('Doña Martha Quispe');
  const [selectedSkill, setSelectedSkill] = useState('🩺 Enfermería / Primeros auxilios');
  const [customSkill, setCustomSkill] = useState('');
  
  // DNI: Frente y Reverso
  const [dniFrontScanned, setDniFrontScanned] = useState(false);
  const [dniBackScanned, setDniBackScanned] = useState(false);
  const [scanningDni, setScanningDni] = useState(null); // 'front' | 'back' | 'both' | null

  // Biometría
  const [scanningFace, setScanningFace] = useState(false);
  const [faceScanned, setFaceScanned] = useState(false);

  // Dirección GPS y Corrección
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [detectedAddress, setDetectedAddress] = useState('Calle Los Nogales 214, Mz B Lote 4');
  const [detectedZone, setDetectedZone] = useState('Zona A - Manzana 2');
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

  const scale = (val) => Math.round(val * fontScale);

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

  const handleScanDni = (side) => {
    setScanningDni(side);
    setTimeout(() => {
      setScanningDni(null);
      if (side === 'front') setDniFrontScanned(true);
      if (side === 'back') setDniBackScanned(true);
    }, 1100);
  };

  const handleScanBothDni = () => {
    setScanningDni('both');
    setTimeout(() => {
      setScanningDni(null);
      setDniFrontScanned(true);
      setDniBackScanned(true);
    }, 1300);
  };

  const handleScanFace = () => {
    setScanningFace(true);
    setTimeout(() => {
      setScanningFace(false);
      setFaceScanned(true);
      setTimeout(() => {
        setStep(5);
      }, 500);
    }, 1200);
  };

  const handleCompleteRegistration = () => {
    const finalSkill = customSkill.trim() ? customSkill.trim() : selectedSkill;
    if (onSaveUserData) {
      onSaveUserData({
        name,
        phone,
        skill: finalSkill,
        address: `${detectedAddress} • ${detectedZone}`
      });
    }
    onFinishLogin();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        {/* Barra Superior con Progreso */}
        <View style={styles.headerProgress}>
          <Text style={[styles.stepIndicatorText, { fontSize: scale(12) }]}>
            PASO {step} DE 6
          </Text>
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
              { paddingBottom: keyboardHeight > 0 ? keyboardHeight + 140 : 60 }
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
            </View>
          )}

          {/* PASO 2: CELULAR, NOMBRE Y PROFESIÓN / HABILIDAD */}
          {step === 2 && (
            <View style={styles.stepCard}>
              <View style={styles.iconCircle}>
                <Text style={{ fontSize: 32 }}>📱</Text>
              </View>
              <Text style={[styles.title, { fontSize: scale(20) }]}>
                Tus Datos de Contacto
              </Text>
              <Text style={[styles.subtitle, { fontSize: scale(13) }]}>
                Ingresa tu celular y tu habilidad u oficio para recibir solicitudes vecinales y coordinar ayuda.
              </Text>

              {/* Nombre Completo */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { fontSize: scale(12) }]}>Nombre Completo *</Text>
                <TextInput
                  style={[styles.input, { fontSize: scale(13) }]}
                  value={name}
                  onChangeText={setName}
                  placeholder="Ej: Doña Martha Quispe"
                  returnKeyType="next"
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
                      scrollViewRef.current?.scrollToEnd({ animated: true });
                    }, 200);
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
            </View>
          )}

          {/* PASO 4: BIOMETRÍA FACIAL (PRUEBA DE VIDA) */}
          {step === 4 && (
            <View style={styles.stepCard}>
              <View style={styles.iconCircle}>
                <Text style={{ fontSize: 32 }}>👤</Text>
              </View>
              <Text style={[styles.title, { fontSize: scale(20) }]}>
                Biometría Facial
              </Text>
              <Text style={[styles.subtitle, { fontSize: scale(13) }]}>
                Prueba de vida (Liveness check) para asegurar que la persona del DNI eres tú.
              </Text>

              <View style={styles.faceOvalBox}>
                {scanningFace ? (
                  <View style={styles.scanningWrap}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={[styles.scanningLabel, { fontSize: scale(12) }]}>
                      Validando rostro con RENIEC...
                    </Text>
                  </View>
                ) : faceScanned ? (
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 52 }}>✅</Text>
                    <Text style={[styles.faceSuccessText, { fontSize: scale(12) }]}>
                      ¡Coincidencia Biométrica 99.4%!
                    </Text>
                  </View>
                ) : (
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 62 }}>👵</Text>
                    <Text style={[styles.faceHintText, { fontSize: scale(11) }]}>
                      Mira a la cámara y parpadea
                    </Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={[styles.primaryButton, scanningFace && { opacity: 0.6 }]}
                disabled={scanningFace}
                activeOpacity={0.8}
                onPress={handleScanFace}
              >
                <Text style={[styles.primaryButtonText, { fontSize: scale(15) }]}>
                  {scanningFace ? 'ESCANEANDO...' : '🤳 ESCANEAR ROSTRO'}
                </Text>
              </TouchableOpacity>
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
                    <Text style={[styles.inputLabel, { fontSize: scale(11) }]}>Dirección de tu casa:</Text>
                    <TextInput
                      style={[styles.input, { fontSize: scale(12), marginBottom: 8 }]}
                      value={detectedAddress}
                      onChangeText={setDetectedAddress}
                      placeholder="Calle / Jirón y Número"
                    />

                    <Text style={[styles.inputLabel, { fontSize: scale(11) }]}>Zona y Manzana:</Text>
                    <TextInput
                      style={[styles.input, { fontSize: scale(12) }]}
                      value={detectedZone}
                      onChangeText={setDetectedZone}
                      placeholder="Ej: Zona A - Manzana 2"
                    />
                  </View>
                )}
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
                      setIsEditingAddress(false);
                      setAddressConfirmed(true);
                      setStep(6);
                    }}
                  >
                    <Text style={[styles.primaryButtonText, { fontSize: scale(14) }]}>
                      💾 GUARDAR Y CONFIRMAR DIRECCIÓN
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
                Tus datos quedaron guardados en tu dispositivo para siempre. Ya no tendrás que volver a loguearte.
              </Text>

              {/* Ficha Resumen de Identidad */}
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { fontSize: scale(11) }]}>👤 Vecino:</Text>
                  <Text style={[styles.summaryVal, { fontSize: scale(12) }]}>{name}</Text>
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
                    {detectedAddress} ({detectedZone})
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
                style={styles.enterAppButton}
                activeOpacity={0.8}
                onPress={handleCompleteRegistration}
              >
                <Text style={[styles.enterAppButtonText, { fontSize: scale(16) }]}>
                  🚀 ENTRAR A LA APLICACIÓN
                </Text>
              </TouchableOpacity>
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
  }
});
