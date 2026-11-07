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
  ActivityIndicator,
  Alert
} from 'react-native';
import { COLORS } from '../theme/colors';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function PublishScreen({ onNavigate, fontScale = 1.0 }) {
  const { session } = useAuth();
  const token = session?.access_token || null;

  const [subStep, setSubStep] = useState(2); // 2: Seleccionar qué compartir, 3: Formulario
  const [formType, setFormType] = useState('servicio');
  const [title, setTitle] = useState('Servicio de Reparación Eléctrica');
  const [price, setPrice] = useState('25.00');
  const [unit, setUnit] = useState('servicio');
  const [desc, setDesc] = useState('Reparación de fugas, cableado e instalaciones en Zona A.');
  const [availability, setAvailability] = useState('Lunes a Sábado 8am - 6pm');
  const [visible, setVisible] = useState(true);

  // Categorías de servicio desde el backend
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [publishing, setPublishing] = useState(false);

  const scale = (val) => Math.round(val * fontScale);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await api.getServiceCategories();
      if (Array.isArray(data) && data.length > 0) {
        setCategories(data);
        setSelectedCategoryId(data[0].id);
      }
    } catch (err) {
      console.warn('[PublishScreen] Error al cargar categorías:', err);
    }
  };

  const publishTypes = [
    {
      id: 'servicio',
      title: 'Ofrecer servicio',
      sub: '(Ej. gasfitería, eléctrico, clases)',
      icon: '🔧',
      bg: '#eff6ff',
      border: '#bfdbfe',
      defaultTitle: 'Servicio de Reparación Eléctrica',
      defaultPrice: '25.00',
      defaultUnit: 'servicio',
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
      defaultUnit: 'unidad',
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
      defaultUnit: 'día',
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
      defaultUnit: 'préstamo',
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
      defaultUnit: 'caja',
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
      defaultUnit: 'clase',
      defaultDesc: 'Puedo enseñar computación básica a cambio de apoyo con inglés.'
    }
  ];

  const handleSelectType = (item) => {
    setFormType(item.id);
    setTitle(item.defaultTitle);
    setPrice(item.defaultPrice);
    setUnit(item.defaultUnit);
    setDesc(item.defaultDesc);
    setSubStep(3);
  };

  const handlePublish = async () => {
    if (!title.trim()) {
      Alert.alert('Campo obligatorio', 'Por favor ingresa un título para la publicación.');
      return;
    }

    if (formType === 'servicio') {
      if (!token) {
        Alert.alert('Inicia sesión', 'Debes estar autenticado para publicar un servicio.');
        return;
      }

      if (!selectedCategoryId && categories.length > 0) {
        setSelectedCategoryId(categories[0].id);
      }

      try {
        setPublishing(true);
        const payload = {
          title: title.trim(),
          description: desc.trim() || null,
          category_id: selectedCategoryId || (categories[0] ? categories[0].id : null),
          price_from: price ? parseFloat(price) : null,
          price_unit: unit || 'servicio',
          availability: availability.trim() || null
        };

        const created = await api.createService(payload, token);
        Alert.alert(
          '🎉 ¡Servicio publicado con éxito!',
          `Tu servicio "${created.title}" ya está visible para los vecinos de tu comunidad.`,
          [
            {
              text: 'Ver en mis servicios',
              onPress: () => onNavigate('my_services')
            },
            {
              text: 'Ir a Servicios',
              onPress: () => onNavigate('services')
            }
          ]
        );
      } catch (err) {
        console.warn('[PublishScreen] Error al publicar servicio:', err);
        Alert.alert('Error', err.message || 'No fue posible publicar el servicio. Inténtalo nuevamente.');
      } finally {
        setPublishing(false);
      }
    } else {
      // Para productos u otros tipos
      Alert.alert(
        '🎉 ¡Publicación creada con éxito!',
        `Tu publicación "${title}" (S/ ${price}) ya está registrada para tus vecinos.`,
        [
          {
            text: 'Entendido',
            onPress: () => onNavigate('home')
          }
        ]
      );
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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

      {/* PASO 3 DE 3: FORMULARIO DETALLADO */}
      {subStep === 3 && (
        <View>
          <View style={styles.headerCard}>
            <View style={styles.headerLeft}>
              <TouchableOpacity onPress={() => setSubStep(2)} style={{ paddingRight: 6 }}>
                <Text style={{ fontSize: 20, color: COLORS.white }}>❮</Text>
              </TouchableOpacity>
              <View>
                <Text style={[styles.headerTitle, { fontSize: scale(15) }]}>
                  Publicar: {formType === 'servicio' ? 'Ofrecer servicio' : 'Vender producto'}
                </Text>
                <Text style={[styles.headerSub, { fontSize: scale(10) }]}>
                  Comparte tu oferta con tus vecinos
                </Text>
              </View>
            </View>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>Paso 3 de 3</Text>
            </View>
          </View>

          <View style={styles.formCard}>
            {/* Foto Ilustrativa */}
            <View style={styles.photoContainer}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=600' }}
                style={styles.photoPreview}
              />
              <TouchableOpacity
                style={styles.cameraBtn}
                onPress={() => Alert.alert('📸 Cámara VeciRed', 'Foto optimizada para el catálogo barrial.')}
              >
                <Text style={{ fontSize: 18 }}>📷</Text>
              </TouchableOpacity>
            </View>

            {/* Selector de Categoría (si es servicio) */}
            {formType === 'servicio' && categories.length > 0 && (
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { fontSize: scale(12) }]}>Categoría del servicio *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 4 }}>
                  {categories.map((c) => {
                    const isSelected = selectedCategoryId === c.id;
                    return (
                      <TouchableOpacity
                        key={c.id}
                        style={[styles.categoryChoice, isSelected && styles.categoryChoiceSelected]}
                        onPress={() => setSelectedCategoryId(c.id)}
                      >
                        <Text style={{ fontSize: 13, marginRight: 4 }}>{c.icon || '🏷️'}</Text>
                        <Text style={[styles.categoryChoiceText, isSelected && styles.categoryChoiceTextSelected, { fontSize: scale(11) }]}>
                          {c.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Campo Título * */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { fontSize: scale(12) }]}>Título de la publicación *</Text>
              <TextInput
                style={[styles.input, { fontSize: scale(13) }]}
                value={title}
                onChangeText={setTitle}
                placeholder="Ej. Gasfitería Integral para el barrio"
              />
            </View>

            {/* Campos Precio * y Unidad */}
            <View style={styles.rowFields}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={[styles.fieldLabel, { fontSize: scale(12) }]}>Precio referencia * (S/)</Text>
                <TextInput
                  style={[styles.input, { fontSize: scale(13) }]}
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                />
              </View>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={[styles.fieldLabel, { fontSize: scale(12) }]}>Unidad de cobro</Text>
                <TextInput
                  style={[styles.input, { fontSize: scale(13) }]}
                  value={unit}
                  onChangeText={setUnit}
                  placeholder="servicio, hora, visita"
                />
              </View>
            </View>

            {/* Disponibilidad Horaria */}
            {formType === 'servicio' && (
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { fontSize: scale(12) }]}>Disponibilidad horaria</Text>
                <TextInput
                  style={[styles.input, { fontSize: scale(12) }]}
                  value={availability}
                  onChangeText={setAvailability}
                  placeholder="Ej: Lunes a Viernes 8am - 6pm, o 24/7 urgencias"
                />
              </View>
            )}

            {/* Descripción */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { fontSize: scale(12) }]}>Descripción y detalles</Text>
              <TextInput
                style={[styles.input, styles.textarea, { fontSize: scale(12) }]}
                value={desc}
                onChangeText={setDesc}
                multiline
                numberOfLines={3}
                placeholder="Explica qué incluye tu servicio, garantía o herramientas que utilizas..."
              />
            </View>

            {/* Ubicación */}
            <View style={styles.locationChip}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 18, marginRight: 6 }}>📍</Text>
                <Text style={[styles.locationText, { fontSize: scale(12) }]}>Comunidad Barrial • Zona A</Text>
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

            {/* Botón Publicar */}
            <TouchableOpacity
              style={styles.publishSubmitBtn}
              activeOpacity={0.8}
              onPress={handlePublish}
              disabled={publishing}
            >
              {publishing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Text style={{ fontSize: 18, color: COLORS.white, marginRight: 6 }}>✈️</Text>
                  <Text style={[styles.publishSubmitBtnText, { fontSize: scale(15) }]}>Publicar Servicio</Text>
                  <Text style={{ fontSize: 16, color: '#fde047', marginLeft: 4 }}>✨</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16
  },
  typeCard: {
    width: '48%',
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120
  },
  typeTitle: { fontWeight: '900', color: COLORS.text, textAlign: 'center', marginBottom: 2 },
  typeSub: { fontWeight: '600', color: COLORS.textSecondary, textAlign: 'center' },
  freeTipBox: {
    backgroundColor: '#fffbeb',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#fde68a'
  },
  freeTipText: { color: '#92400e', fontWeight: '700', textAlign: 'center' },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12
  },
  photoContainer: {
    height: 150,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#e2e8f0'
  },
  photoPreview: { width: '100%', height: '100%' },
  cameraBtn: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: COLORS.white,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4
  },
  categoryChoice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  categoryChoiceSelected: {
    backgroundColor: COLORS.primarySurface,
    borderColor: COLORS.primary
  },
  categoryChoiceText: {
    color: '#475569',
    fontWeight: '600'
  },
  categoryChoiceTextSelected: {
    color: COLORS.primaryDark,
    fontWeight: '700'
  },
  fieldGroup: { gap: 4 },
  fieldLabel: { fontWeight: '800', color: COLORS.text },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: COLORS.text,
    fontWeight: '600'
  },
  textarea: { height: 75, textAlignVertical: 'top' },
  rowFields: { flexDirection: 'row', gap: 10 },
  locationChip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  locationText: { fontWeight: '700', color: COLORS.text },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4
  },
  switchLabel: { fontWeight: '700', color: COLORS.text },
  publishSubmitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6
  },
  publishSubmitBtnText: { fontWeight: '900', color: COLORS.white }
});
