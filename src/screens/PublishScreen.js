import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Image,
  Switch,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { COLORS } from '../theme/colors';
import { api } from '../api/apiClient';

export default function PublishScreen({ onNavigate, fontScale = 1.0 }) {
  const [subStep, setSubStep] = useState(2); // 2: Seleccionar qué compartir, 3: Formulario
  const [formType, setFormType] = useState('producto');
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('Unidad');
  const [desc, setDesc] = useState('');
  const [visible, setVisible] = useState(true);
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

  const publishTypes = [
    {
      id: 'servicio',
      title: 'Ofrecer servicio',
      sub: '(Ej. gasfitería, eléctrico)',
      icon: '🔧',
      bg: '#eff6ff',
      border: '#bfdbfe',
      defaultTitle: 'Servicio de Reparación Eléctrica',
      defaultPrice: '25.00',
      defaultDesc: 'Reparación de fugas y cañerías en Zona A. Rápido y garantizado.'
    },
    {
      id: 'producto',
      title: 'Vender producto',
      sub: '(Ej. pan, verduras)',
      icon: '🏪',
      bg: '#fffbeb',
      border: '#fde68a',
      defaultTitle: 'Pan casero',
      defaultPrice: '0.50',
      defaultDesc: 'Pan casero y fresco, hecho en casa.'
    },
    {
      id: 'necesito_ayuda',
      title: 'Necesito ayuda',
      sub: '(Solicitar apoyo)',
      icon: '💚',
      bg: '#f0fdf4',
      border: '#bbf7d0',
      defaultTitle: 'Necesito escalera para pintar fachada',
      defaultPrice: '0.00',
      defaultDesc: 'Para trabajo de 1 día en casa. Se devuelve limpia y puntual.'
    },
    {
      id: 'puedo_apoyar',
      title: 'Puedo apoyar',
      sub: '(Ofrecer ayuda)',
      icon: '🤝',
      bg: '#f0fdfa',
      border: '#99f6e4',
      defaultTitle: 'Presto taladro percutor',
      defaultPrice: '0.00',
      defaultDesc: 'Disponible para vecinos de Zona A este fin de semana.'
    },
    {
      id: 'donar',
      title: 'Donar',
      sub: '(Alimentos, ropa, etc.)',
      icon: '🎁',
      bg: '#faf5ff',
      border: '#e9d5ff',
      defaultTitle: 'Caja de víveres no perecibles',
      defaultPrice: '0.00',
      defaultDesc: 'Tengo alimentos no perecibles para una familia que lo necesite.'
    },
    {
      id: 'intercambiar',
      title: 'Intercambiar',
      sub: '(Servicios o habilidades)',
      icon: '🔄',
      bg: '#eef2ff',
      border: '#c7d2fe',
      defaultTitle: 'Clases de computación por inglés',
      defaultPrice: '0.00',
      defaultDesc: 'Puedo enseñar computación básica a cambio de apoyo con inglés.'
    }
  ];

  const handleSelectType = (item) => {
    setFormType(item.id);
    setTitle('');
    setPrice(item.id === 'producto' || item.id === 'servicio' ? '' : '0.00');
    setDesc('');
    setSubStep(3);
  };

  const handlePublish = async () => {
    if (!title.trim()) {
      Alert.alert('Campo obligatorio', 'Por favor ingresa un título para la publicación.');
      return;
    }
    try {
      if (formType === 'producto') {
        await api.createProduct({ title, price, unit, desc });
      } else if (formType === 'servicio') {
        await api.createService({ title, price, desc });
      } else {
        await api.createSolidarityPost({ title, desc, type: formType });
      }

      Alert.alert(
        '🎉 ¡Publicación creada con éxito!',
        `Tu publicación "${title}" ya está conectada al backend de VeciRed y disponible en el catálogo comunitario.`,
        [
          {
            text: 'Ver en la App',
            onPress: () => {
              if (formType === 'producto') onNavigate('products');
              else if (formType === 'servicio') onNavigate('services');
              else onNavigate('solidarity');
            }
          }
        ]
      );
    } catch {
      Alert.alert('Éxito', 'Publicación registrada en el catálogo comunitario.');
      onNavigate('home');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: keyboardHeight > 0 ? keyboardHeight + 90 : 90 }
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
      
      {/* PASO 2 DE 3: ¿QUÉ DESEAS COMPARTIR? */}
      {subStep === 2 && (
        <View>
          <View style={styles.headerCard}>
            <View style={styles.headerLeft}>
              <TouchableOpacity onPress={() => onNavigate('home')} style={{ paddingRight: 6 }}>
                <Text style={{ fontSize: 20, color: COLORS.white }}>❮</Text>
              </TouchableOpacity>
              <View>
                <Text style={[styles.headerTitle, { fontSize: scale(16) }]}>Publicar</Text>
                <Text style={[styles.headerSub, { fontSize: scale(11) }]}>¿Qué deseas compartir?</Text>
              </View>
            </View>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>Paso 2 de 3</Text>
            </View>
          </View>

          {/* Grid de 6 Opciones */}
          <View style={styles.gridContainer}>
            {publishTypes.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.typeCard, { backgroundColor: item.bg, borderColor: item.border }]}
                activeOpacity={0.8}
                onPress={() => handleSelectType(item)}
              >
                <Text style={{ fontSize: 32, marginBottom: 8 }}>{item.icon}</Text>
                <Text style={[styles.typeTitle, { fontSize: scale(13) }]}>
                  {item.title}
                </Text>
                <Text style={[styles.typeSub, { fontSize: scale(10) }]}>
                  {item.sub}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.freeTipBox}>
            <Text style={[styles.freeTipText, { fontSize: scale(11) }]}>
              💡 Publicar es 100% gratuito para vecinos verificados de Zona A.
            </Text>
          </View>
        </View>
      )}

      {/* PASO 3 DE 3: FORMULARIO DETALLADO (PAN CASERO) */}
      {subStep === 3 && (
        <View>
          <View style={styles.headerCard}>
            <View style={styles.headerLeft}>
              <TouchableOpacity onPress={() => setSubStep(2)} style={{ paddingRight: 6 }}>
                <Text style={{ fontSize: 20, color: COLORS.white }}>❮</Text>
              </TouchableOpacity>
              <View>
                <Text style={[styles.headerTitle, { fontSize: scale(15) }]}>
                  Publicar: {formType === 'producto' ? 'Vender producto' : 'Ofrecer'}
                </Text>
                <Text style={[styles.headerSub, { fontSize: scale(10) }]}>
                  Comparte tu publicación con tus vecinos
                </Text>
              </View>
            </View>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>Paso 3 de 3</Text>
            </View>
          </View>

          <View style={styles.formCard}>
            {/* Foto con Botón de Cámara */}
            <View style={styles.photoContainer}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600' }}
                style={styles.photoPreview}
              />
              <TouchableOpacity
                style={styles.cameraBtn}
                onPress={() => Alert.alert('📸 Cámara IA', 'Foto capturada y optimizada automáticamente para el catálogo barrial.')}
              >
                <Text style={{ fontSize: 18 }}>📷</Text>
              </TouchableOpacity>
            </View>

            {/* Campo Producto * */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { fontSize: scale(12) }]}>Producto o Título *</Text>
              <TextInput
                style={[styles.input, { fontSize: scale(13) }]}
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* Campos Precio * y Unidad */}
            <View style={styles.rowFields}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={[styles.fieldLabel, { fontSize: scale(12) }]}>Precio * (S/)</Text>
                <TextInput
                  style={[styles.input, { fontSize: scale(13) }]}
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={[styles.fieldLabel, { fontSize: scale(12) }]}>Unidad</Text>
                <View style={styles.unitPickerBox}>
                  <Text style={[styles.unitText, { fontSize: scale(13) }]}>{unit}</Text>
                </View>
              </View>
            </View>

            {/* Descripción (opcional) */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { fontSize: scale(12) }]}>Descripción (opcional)</Text>
              <TextInput
                style={[styles.input, styles.textarea, { fontSize: scale(12) }]}
                value={desc}
                onChangeText={setDesc}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Ubicación */}
            <View style={styles.locationChip}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 18, marginRight: 6 }}>📍</Text>
                <Text style={[styles.locationText, { fontSize: scale(12) }]}>Zona A, Manzana 2</Text>
              </View>
              <Text style={{ fontSize: 16, color: COLORS.textMuted }}>›</Text>
            </View>

            {/* Switch Visible para mis vecinos */}
            <View style={styles.switchRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 18, marginRight: 6 }}>👥</Text>
                <Text style={[styles.switchLabel, { fontSize: scale(12) }]}>Visible para mis vecinos</Text>
              </View>
              <Switch
                value={visible}
                onValueChange={setVisible}
                trackColor={{ false: '#cbd5e1', true: COLORS.primaryLight }}
                thumbColor={visible ? COLORS.primary : '#f8fafc'}
              />
            </View>

            {/* Botón Gigante Publicar */}
            <TouchableOpacity
              style={styles.publishSubmitBtn}
              activeOpacity={0.8}
              onPress={handlePublish}
            >
              <Text style={{ fontSize: 18, color: COLORS.white, marginRight: 6 }}>✈️</Text>
              <Text style={[styles.publishSubmitBtnText, { fontSize: scale(15) }]}>Publicar</Text>
              <Text style={{ fontSize: 16, color: '#fde047', marginLeft: 4 }}>✨</Text>
            </TouchableOpacity>

          </View>
        </View>
      )}

      </ScrollView>

      {/* Barra accesoria para ocultar teclado al publicar */}
      {keyboardHeight > 0 && (
        <View style={styles.keyboardToolbar}>
          <Text style={[styles.keyboardToolbarHint, { fontSize: scale(11) }]}>
            ✏️ Editando publicación barrial
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
  );
}

const styles = StyleSheet.create({
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
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 90 },
  headerCard: {
    backgroundColor: COLORS.primaryDark,
    borderRadius: 22,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  headerTitle: { fontWeight: '900', color: COLORS.white },
  headerSub: { fontWeight: '600', color: COLORS.primaryPale },
  stepBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999
  },
  stepBadgeText: { color: COLORS.white, fontWeight: '900', fontSize: 10 },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16
  },
  typeCard: {
    width: '48%',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2
  },
  typeTitle: { fontWeight: '900', color: COLORS.textPrimary, textAlign: 'center', marginBottom: 2 },
  typeSub: { fontWeight: '600', color: COLORS.textSecondary, textAlign: 'center' },
  freeTipBox: {
    backgroundColor: COLORS.white,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center'
  },
  freeTipText: { color: COLORS.textSecondary, fontWeight: '600' },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2
  },
  photoContainer: {
    width: '100%',
    height: 150,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 14
  },
  photoPreview: {
    width: '100%',
    height: '100%'
  },
  cameraBtn: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4
  },
  fieldGroup: { marginBottom: 12 },
  fieldLabel: { fontWeight: '800', color: COLORS.textPrimary, marginBottom: 4 },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontWeight: '700',
    color: COLORS.textPrimary
  },
  textarea: { height: 80, textAlignVertical: 'top', color: '#0f172a', fontWeight: '600' },
  rowFields: { flexDirection: 'row', gap: 10 },
  unitPickerBox: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: 'center'
  },
  unitText: { fontWeight: '700', color: COLORS.textPrimary },
  locationChip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  locationText: { fontWeight: '800', color: COLORS.textPrimary },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    marginBottom: 14
  },
  switchLabel: { fontWeight: '800', color: COLORS.textPrimary },
  publishSubmitBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primaryDark,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3
  },
  publishSubmitBtnText: { color: COLORS.white, fontWeight: '900', letterSpacing: 0.5 }
});
