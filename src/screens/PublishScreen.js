import * as ImagePicker from 'expo-image-picker';
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
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
  Alert,
  Modal,
  Keyboard,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { COLORS } from '../theme/colors';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import InteractiveCommunityMap from '../components/InteractiveCommunityMap';
import { getOrDetectUserLocation } from '../services/locationService';

export default function PublishScreen({ onNavigate, fontScale = 1.0, initialType = null }) {
  const { session } = useAuth();
  const token = session?.access_token || null;

  const [subStep, setSubStep] = useState(initialType ? 3 : 2); // 2: Seleccionar qué compartir, 3: Formulario
  const [formType, setFormType] = useState(initialType || 'servicio');

  useEffect(() => {
    if (initialType) {
      setFormType(initialType);
      const match = publishTypes.find(t => t.id === initialType);
      if (match) {
        setUnit(match.defaultUnit);
        setPrice(initialType === 'servicio' || initialType === 'producto' ? '' : '0.00');
      }
      setSubStep(3);
    }
  }, [initialType]);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('servicio');
  const [desc, setDesc] = useState('');
  const [availability, setAvailability] = useState('');
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

  // Categorías de servicio y productos desde la BD
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [productCategories, setProductCategories] = useState([]);
  const [selectedProductCategoryId, setSelectedProductCategoryId] = useState(null);
  const [isProdCategoriesExpanded, setIsProdCategoriesExpanded] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [isCategoriesExpanded, setIsCategoriesExpanded] = useState(false);

  // Selector y cambio de imagen
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);
  const [customImageUrlInput, setCustomImageUrlInput] = useState('');

  const handleOpenPhoneGallery = async () => {
    try {
      if (Platform.OS === 'web') {
        if (typeof document !== 'undefined') {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.onchange = (e) => {
            const file = e.target && e.target.files && e.target.files[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = (event) => {
                setSelectedImage(event.target.result);
                setShowImagePickerModal(false);
              };
              reader.readAsDataURL(file);
            }
          };
          input.click();
        }
        return;
      }

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permiso necesario',
          'VeciRed requiere acceso a tu galería para adjuntar la foto del servicio o producto.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
        base64: true
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const imageUri = asset.base64
          ? `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`
          : asset.uri;
        setSelectedImage(imageUri);
        setShowImagePickerModal(false);
      }
    } catch (err) {
      console.warn('[PublishScreen] Error abriendo galería:', err);
      Alert.alert('Error', 'No se pudo abrir la galería del dispositivo.');
    }
  };

  const handleTakePhotoWithCamera = async () => {
    try {
      if (Platform.OS === 'web') {
        handleOpenPhoneGallery();
        return;
      }

      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permiso necesario',
          'VeciRed requiere permiso de cámara para tomar fotos directamente.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
        base64: true
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const imageUri = asset.base64
          ? `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`
          : asset.uri;
        setSelectedImage(imageUri);
        setShowImagePickerModal(false);
      }
    } catch (err) {
      console.warn('[PublishScreen] Error abriendo cámara:', err);
      Alert.alert('Error', 'No se pudo abrir la cámara.');
    }
  };

  const sampleCommunityImages = [
    { id: '1', name: 'Oficios y Reparación', uri: 'https://images.unsplash.com/photo-1581783898377-1c85bf937427?w=600' },
    { id: '2', name: 'Gasfitería y Plomería', uri: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600' },
    { id: '3', name: 'Panadería y Masas', uri: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600' },
    { id: '4', name: 'Comida y Menú Casero', uri: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600' },
    { id: '5', name: 'Abarrotes y Frutas', uri: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600' },
    { id: '6', name: 'Apoyo y Educación', uri: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600' },
    { id: '7', name: 'Solidaridad y Donación', uri: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=600' },
  ];
  const [locationMode, setLocationMode] = useState('current'); // 'current' | 'custom'
  const [currentCoords, setCurrentCoords] = useState({ lat: -12.0463, lng: -77.0427, zone: 'Zona A • Manzana 2' });

  useEffect(() => {
    getOrDetectUserLocation().then((loc) => {
      if (loc && loc.latitude && loc.longitude) {
        setCurrentCoords({ lat: loc.latitude, lng: loc.longitude, zone: loc.zone || 'Zona A • Manzana 2' });
      }
    });
  }, []);
  const [customAddress, setCustomAddress] = useState('');

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
      console.warn('[PublishScreen] Error al cargar categorías de servicio:', err);
    }

    try {
      const prodCats = await api.getProductCategories();
      if (Array.isArray(prodCats) && prodCats.length > 0) {
        setProductCategories(prodCats);
        setSelectedProductCategoryId(prodCats[0].id);
      }
    } catch (err) {
      console.warn('[PublishScreen] Error al cargar categorías de productos:', err);
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
      defaultUnit: 'servicio'
    },
    {
      id: 'producto',
      title: 'Vender producto',
      sub: '(Ej. pan, verduras)',
      icon: '🏪',
      bg: '#fffbeb',
      border: '#fde68a',
      defaultUnit: 'unidad'
    },
    {
      id: 'necesito_ayuda',
      title: 'Necesito ayuda',
      sub: '(Solicitar apoyo)',
      icon: '💚',
      bg: '#f0fdf4',
      border: '#bbf7d0',
      defaultUnit: 'día'
    },
    {
      id: 'puedo_apoyar',
      title: 'Puedo apoyar',
      sub: '(Ofrecer ayuda)',
      icon: '🤝',
      bg: '#f0fdfa',
      border: '#99f6e4',
      defaultUnit: 'préstamo'
    },
    {
      id: 'donar',
      title: 'Donar',
      sub: '(Alimentos, ropa, etc.)',
      icon: '🎁',
      bg: '#faf5ff',
      border: '#e9d5ff',
      defaultUnit: 'caja'
    },
    {
      id: 'intercambiar',
      title: 'Intercambiar',
      sub: '(Servicios o habilidades)',
      icon: '🔄',
      bg: '#eef2ff',
      border: '#c7d2fe',
      defaultUnit: 'clase'
    }
  ];

  const handleSelectType = (item) => {
    setFormType(item.id);
    setTitle('');
    setPrice(item.id === 'servicio' || item.id === 'producto' ? '' : '0.00');
    setUnit(item.defaultUnit || 'servicio');
    setDesc('');
    setAvailability('');
    setSubStep(3);
  };

  const handlePublish = async () => {
    if (!title.trim()) {
      Alert.alert('Campo obligatorio', 'Por favor ingresa un título para la publicación.');
      return;
    }

    try {
      setPublishing(true);

      if (formType === 'servicio') {
        const defaultSrvImg = 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500';
        const payload = {
          title: title.trim(),
          description: desc.trim() || null,
          category_id: selectedCategoryId || (categories[0] ? categories[0].id : null),
          price_from: price ? parseFloat(price) : null,
          price_unit: unit || 'servicio',
          availability: availability.trim() || null,
          image_url: selectedImage || defaultSrvImg
        };

        await api.createService(payload, token);
        onNavigate('services');
      } else if (formType === 'producto') {
        const defaultProdImg = 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500';
        const payload = {
          name: title.trim(),
          title: title.trim(),
          description: desc.trim() || '',
          price: price ? parseFloat(price) : 0,
          category_id: selectedProductCategoryId || (productCategories[0] ? productCategories[0].id : null),
          unit: unit || 'unidad',
          image_url: selectedImage || defaultProdImg
        };
        await api.createProduct(payload, token);
        Alert.alert(
          '🎉 ¡Producto publicado con éxito!',
          `Tu producto "${title}" ya está registrado en la tienda comunitaria.`,
          [
            {
              text: 'Ver en Productos',
              onPress: () => onNavigate('products')
            }
          ]
        );
      } else {
        const payload = {
          title: title.trim(),
          description: desc.trim() || '',
          type: formType,
          category: formType === 'necesito_ayuda' ? 'Solicitud de apoyo' : 'Apoyo voluntario'
        };
        await api.createSolidarityPost(payload, token);
        Alert.alert(
          '🎉 ¡Publicación creada con éxito!',
          `Tu publicación "${title}" ya está disponible en la red solidaria vecinal.`,
          [
            {
              text: 'Ver en Solidaridad',
              onPress: () => onNavigate('solidarity')
            }
          ]
        );
      }
    } catch (err) {
      console.warn('[PublishScreen] Error al publicar:', err);
      Alert.alert('Aviso', err.message || 'No se pudo conectar con el servidor. Inténtalo nuevamente.');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: keyboardHeight > 0 ? keyboardHeight + 120 : 90 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Encabezado */}
        <View style={styles.headerCard}>
          <View style={styles.headerLeft}>
            <Text style={{ fontSize: 24, marginRight: 8 }}>📝</Text>
            <View>
              <Text style={[styles.headerTitle, { fontSize: scale(16) }]}>Nueva Publicación</Text>
              <Text style={[styles.headerSub, { fontSize: scale(11) }]}>
                {subStep === 2 ? 'Paso 1: ¿Qué deseas compartir hoy?' : 'Paso 2: Completa los detalles'}
              </Text>
            </View>
          </View>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>{subStep === 2 ? '1 de 2' : '2 de 2'}</Text>
          </View>
        </View>

        {subStep === 2 && (
          <View>
            <View style={styles.gridContainer}>
              {publishTypes.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.typeCard, { backgroundColor: item.bg, borderColor: item.border }]}
                  activeOpacity={0.8}
                  onPress={() => handleSelectType(item)}
                >
                  {item.id === 'servicio' && <MaterialCommunityIcons name="wrench-outline" size={32} color="#2563eb" style={{ marginBottom: 8 }} />}
                  {item.id === 'producto' && <MaterialCommunityIcons name="storefront-outline" size={32} color="#d97706" style={{ marginBottom: 8 }} />}
                  {item.id === 'necesito_ayuda' && <MaterialCommunityIcons name="hand-heart-outline" size={32} color="#059669" style={{ marginBottom: 8 }} />}
                  {item.id === 'puedo_apoyar' && <MaterialCommunityIcons name="account-group-outline" size={32} color="#0d9488" style={{ marginBottom: 8 }} />}
                  {item.id === 'donar' && <MaterialCommunityIcons name="gift-outline" size={32} color="#7c3aed" style={{ marginBottom: 8 }} />}
                  {item.id === 'intercambiar' && <MaterialCommunityIcons name="swap-horizontal-circle-outline" size={32} color="#4f46e5" style={{ marginBottom: 8 }} />}
                  <Text style={[styles.typeTitle, { fontSize: scale(13) }]}>{item.title}</Text>
                  <Text style={[styles.typeSub, { fontSize: scale(10) }]}>{item.sub}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.freeTipBox}>
              <Text style={[styles.freeTipText, { fontSize: scale(11) }]}>
                💡 En VeciRed no cobramos comisión. Los tratos son directos de vecino a vecino.
              </Text>
            </View>
          </View>
        )}

        {subStep === 3 && (
          <View style={styles.formCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <TouchableOpacity
                onPress={() => {
                  if (initialType) {
                    onNavigate(initialType === 'producto' ? 'products' : 'services');
                  } else {
                    setSubStep(2);
                  }
                }}
                style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 }}
              >
                <Feather name="arrow-left" size={14} color={COLORS.primaryDark} style={{ marginRight: 4 }} />
                <Text style={{ fontSize: 12, color: COLORS.primaryDark, fontWeight: '700' }}>
                  {initialType ? 'Volver' : 'Cambiar tipo'}
                </Text>
              </TouchableOpacity>
              <View style={{ backgroundColor: '#eff6ff', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1, borderColor: '#bfdbfe' }}>
                <Text style={{ fontSize: 11, color: '#1d4ed8', fontWeight: '800' }}>
                  {publishTypes.find((t) => t.id === formType)?.title}
                </Text>
              </View>
            </View>

            {/* Selector de categoría si es un servicio con modo Expandible */}
            {formType === 'servicio' && categories.length > 0 && (
              <View style={styles.fieldGroup}>
                <View style={styles.categoryHeaderRow}>
                  <Text style={[styles.fieldLabel, { fontSize: scale(12) }]}>Categoría del Servicio *</Text>
                  <TouchableOpacity
                    style={styles.expandToggleBtn}
                    onPress={() => setIsCategoriesExpanded(!isCategoriesExpanded)}
                  >
                    <Text style={styles.expandToggleBtnText}>
                      {isCategoriesExpanded ? '▲ Ver menos' : `▼ Ver todas (${categories.length})`}
                    </Text>
                  </TouchableOpacity>
                </View>

                {isCategoriesExpanded ? (
                  <View style={styles.categoryGrid}>
                    {categories.map((c) => {
                      const isSelected = selectedCategoryId === c.id;
                      return (
                        <TouchableOpacity
                          key={c.id}
                          style={[styles.categoryChoiceGrid, isSelected && styles.categoryChoiceSelected]}
                          onPress={() => setSelectedCategoryId(c.id)}
                        >
                          <Text style={{ marginRight: 4, fontSize: 13 }}>{c.icon || '🛠️'}</Text>
                          <Text
                            style={[
                              styles.categoryChoiceText,
                              isSelected && styles.categoryChoiceTextSelected,
                              { fontSize: scale(11) }
                            ]}
                            numberOfLines={1}
                          >
                            {c.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 4 }}>
                    {categories.map((c) => {
                      const isSelected = selectedCategoryId === c.id;
                      return (
                        <TouchableOpacity
                          key={c.id}
                          style={[styles.categoryChoice, isSelected && styles.categoryChoiceSelected]}
                          onPress={() => setSelectedCategoryId(c.id)}
                        >
                          <Text style={{ marginRight: 4 }}>{c.icon || '🛠️'}</Text>
                          <Text
                            style={[
                              styles.categoryChoiceText,
                              isSelected && styles.categoryChoiceTextSelected,
                              { fontSize: scale(11) }
                            ]}
                          >
                            {c.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}
              </View>
            )}

            {/* Foto ilustrativa con Botón de Cámara Funcional */}
            <View style={styles.photoContainer}>
              <Image
                source={{
                  uri:
                    selectedImage ||
                    (formType === 'servicio'
                      ? 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800'
                      : formType === 'producto'
                      ? 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800'
                      : 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800')
                }}
                style={styles.photoPreview}
                resizeMode="cover"
              />
              <TouchableOpacity
                style={styles.cameraBtn}
                activeOpacity={0.85}
                onPress={() => setShowImagePickerModal(true)}
              >
                <Ionicons name="camera" size={17} color="#0d9488" style={{ marginRight: 4 }} />
                <Text style={styles.cameraBtnText}>Subir foto</Text>
              </TouchableOpacity>

              {selectedImage ? (
                <TouchableOpacity
                  style={styles.removePhotoBtn}
                  activeOpacity={0.85}
                  onPress={() => setSelectedImage(null)}
                >
                  <Ionicons name="trash" size={14} color="#ffffff" />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Título */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { fontSize: scale(12) }]}>Título de la publicación *</Text>
              <TextInput
                style={[styles.input, { fontSize: scale(13) }]}
                value={title}
                onChangeText={setTitle}
                placeholder="Ej. Reparación de tuberías, Clases de matemáticas..."
                placeholderTextColor={COLORS.textMuted}
              />
            </View>

            {/* Precio y Unidad si aplica */}
            {(formType === 'servicio' || formType === 'producto') && (
              <View style={styles.rowFields}>
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={[styles.fieldLabel, { fontSize: scale(12) }]}>Precio (S/) {formType === 'servicio' ? 'desde' : ''}</Text>
                  <TextInput
                    style={[styles.input, { fontSize: scale(13) }]}
                    value={price}
                    onChangeText={setPrice}
                    placeholder="0.00"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="numeric"
                  />
                </View>

                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={[styles.fieldLabel, { fontSize: scale(12) }]}>Por unidad / medida</Text>
                  <TextInput
                    style={[styles.input, { fontSize: scale(13) }]}
                    value={unit}
                    onChangeText={setUnit}
                    placeholder="servicio, hora, kg, etc."
                    placeholderTextColor={COLORS.textMuted}
                  />
                </View>
              </View>
            )}

            {/* Disponibilidad (específico para servicios) */}
            {formType === 'servicio' && (
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { fontSize: scale(12) }]}>Horario de atención / Disponibilidad</Text>
                <TextInput
                  style={[styles.input, { fontSize: scale(13) }]}
                  value={availability}
                  onChangeText={setAvailability}
                  placeholder="Ej. Lunes a Viernes 9am - 6pm"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
            )}

            {/* Descripción */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { fontSize: scale(12) }]}>Descripción detallada</Text>
              <TextInput
                style={[styles.input, styles.textarea, { fontSize: scale(12) }]}
                value={desc}
                onChangeText={setDesc}
                multiline
                numberOfLines={3}
                placeholder="Escribe aquí los detalles para tus vecinos..."
                placeholderTextColor={COLORS.textMuted}
              />
            </View>

            {/* Ubicación en el Mapa Vecinal */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { fontSize: scale(12) }]}>📍 Ubicación de la Publicación en el Barrio</Text>
              
              {/* Selector de tipo de ubicación */}
              <View style={styles.locModeSelector}>
                <TouchableOpacity
                  style={[styles.locModeBtn, locationMode === 'current' && styles.locModeBtnActive]}
                  onPress={() => setLocationMode('current')}
                >
                  <Ionicons name="navigate" size={14} color={locationMode === 'current' ? '#0f766e' : '#64748b'} />
                  <Text style={[styles.locModeBtnText, locationMode === 'current' && styles.locModeBtnTextActive]}>
                    Mi ubicación actual (Mz 2)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.locModeBtn, locationMode === 'custom' && styles.locModeBtnActive]}
                  onPress={() => setLocationMode('custom')}
                >
                  <Ionicons name="map-outline" size={14} color={locationMode === 'custom' ? '#0f766e' : '#64748b'} />
                  <Text style={[styles.locModeBtnText, locationMode === 'custom' && styles.locModeBtnTextActive]}>
                    Otra dirección / punto
                  </Text>
                </TouchableOpacity>
              </View>

              {locationMode === 'custom' && (
                <TextInput
                  style={[styles.input, { fontSize: scale(12), marginTop: 8 }]}
                  placeholder="Escribe la dirección exacta o referencia en Zona A..."
                  placeholderTextColor={COLORS.textMuted}
                  value={customAddress}
                  onChangeText={setCustomAddress}
                />
              )}

              {/* Mapa Satelital Interactivo de Google Maps con Punto Vecinal */}
              <InteractiveCommunityMap
                latitude={currentCoords?.lat || -12.0463}
                longitude={currentCoords?.lng || -77.0427}
                title={locationMode === 'custom' && customAddress.trim() ? customAddress : 'Ubicación de la Publicación'}
                subtitle="Zona A • Manzana 2 (Visible a vecinos en 500m)"
                height={210}
                mode="picker"
                fontScale={fontScale}
              />
            </View>

            {/* Switch de visibilidad */}
            <View style={styles.switchRow}>
              <Text style={[styles.switchLabel, { fontSize: scale(12) }]}>Publicar inmediatamente</Text>
              <Switch
                value={visible}
                onValueChange={setVisible}
                trackColor={{ false: '#cbd5e1', true: COLORS.primarySurface }}
                thumbColor={visible ? COLORS.primary : '#f8fafc'}
              />
            </View>

            {/* Botón de Publicar */}
            <TouchableOpacity
              style={[styles.publishSubmitBtn, publishing && { opacity: 0.7 }]}
              onPress={handlePublish}
              disabled={publishing}
              activeOpacity={0.85}
            >
              {publishing ? (
                <ActivityIndicator color={COLORS.white} size="small" />
              ) : (
                <Text style={[styles.publishSubmitBtnText, { fontSize: scale(14) }]}>
                  🚀 Publicar en VeciRed
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Barra auxiliar de teclado */}
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
    
        {/* Modal Interactivo para Cambiar Foto de Publicación */}
        <Modal
          visible={showImagePickerModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowImagePickerModal(false)}
        >
          <View style={styles.imageModalOverlay}>
            <View style={styles.imageModalBox}>
              <View style={styles.imageModalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="images" size={20} color={COLORS.primaryDark} />
                  <Text style={[styles.imageModalTitle, { fontSize: scale(14) }]}>
                    Selecciona una Imagen para tu Publicación
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setShowImagePickerModal(false)}>
                  <Ionicons name="close-circle" size={24} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Opciones de Celular: Galería y Cámara */}
              <View style={{ gap: 8, marginBottom: 6 }}>
                <TouchableOpacity
                  style={styles.openGalleryBtn}
                  activeOpacity={0.85}
                  onPress={handleOpenPhoneGallery}
                >
                  <View style={styles.galleryIconCircle}>
                    <Ionicons name="images" size={22} color="#ffffff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.openGalleryTitle}>Elegir de la Galería del Celular</Text>
                    <Text style={styles.openGallerySub}>Selecciona una imagen guardada en tu dispositivo</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#0d9488" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.openGalleryBtn, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}
                  activeOpacity={0.85}
                  onPress={handleTakePhotoWithCamera}
                >
                  <View style={[styles.galleryIconCircle, { backgroundColor: '#16a34a' }]}>
                    <Ionicons name="camera" size={22} color="#ffffff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.openGalleryTitle, { color: '#15803d' }]}>Tomar Foto con la Cámara</Text>
                    <Text style={styles.openGallerySub}>Captura una foto en vivo para tu publicación</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#16a34a" />
                </TouchableOpacity>
              </View>

              <View style={styles.galleryDividerRow}>
                <View style={styles.galleryDividerLine} />
                <Text style={styles.galleryDividerText}>o elige de la biblioteca comunitaria</Text>
                <View style={styles.galleryDividerLine} />
              </View>

              {/* Galería de Fotos Barriales con aspecto adaptado */}
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 270, marginVertical: 6 }}>
                <View style={styles.sampleGrid}>
                  {sampleCommunityImages.map((img) => (
                    <TouchableOpacity
                      key={img.id}
                      style={[styles.sampleCard, selectedImage === img.uri && styles.sampleCardSelected]}
                      onPress={() => {
                        setSelectedImage(img.uri);
                        setShowImagePickerModal(false);
                      }}
                      activeOpacity={0.8}
                    >
                      <Image source={{ uri: img.uri }} style={styles.sampleThumb} resizeMode="cover" />
                      <Text style={styles.sampleName} numberOfLines={1}>{img.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              {/* Pegar URL personalizada */}
              <View style={styles.customUrlRow}>
                <TextInput
                  style={[styles.customUrlInput, { fontSize: scale(11) }]}
                  placeholder="O pega URL de imagen (https://...)"
                  placeholderTextColor="#94a3b8"
                  value={customImageUrlInput}
                  onChangeText={setCustomImageUrlInput}
                />
                <TouchableOpacity
                  style={styles.applyUrlBtn}
                  onPress={() => {
                    if (customImageUrlInput.trim()) {
                      setSelectedImage(customImageUrlInput.trim());
                      setCustomImageUrlInput('');
                      setShowImagePickerModal(false);
                    }
                  }}
                >
                  <Text style={styles.applyUrlBtnText}>Aplicar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

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
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end'
  },
  imageModalBox: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%'
  },
  imageModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  imageModalTitle: {
    fontWeight: '800',
    color: COLORS.primaryDark
  },
  imageModalSub: {
    color: COLORS.textSecondary,
    marginBottom: 10
  },
  openGalleryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdfa',
    borderWidth: 2,
    borderColor: '#0d9488',
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
    gap: 10
  },
  galleryIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#0d9488',
    alignItems: 'center',
    justifyContent: 'center'
  },
  openGalleryTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f766e'
  },
  openGallerySub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2
  },
  galleryDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 4
  },
  galleryDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0'
  },
  galleryDividerText: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '700'
  },
  sampleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8
  },
  sampleCard: {
    width: '48%',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    backgroundColor: '#f8fafc',
    marginBottom: 8
  },
  sampleCardSelected: {
    borderColor: COLORS.primaryDark,
    backgroundColor: '#ccfbf1'
  },
  sampleThumb: {
    width: '100%',
    height: 110,
    resizeMode: 'cover'
  },
  sampleName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    padding: 6,
    textAlign: 'center'
  },
  customUrlRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10
  },
  customUrlInput: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1'
  },
  applyUrlBtn: {
    backgroundColor: COLORS.primaryDark,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  applyUrlBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 12
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12
  },
  photoContainer: {
    height: 180,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#e2e8f0',
    borderWidth: 1.5,
    borderColor: '#cbd5e1'
  },
  photoPreview: { width: '100%', height: '100%', resizeMode: 'cover' },
  cameraBtn: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4
  },
  cameraBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0d9488'
  },
  removePhotoBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(220, 38, 38, 0.85)',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  categoryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  expandToggleBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#f1f5f9',
    borderRadius: 8
  },
  expandToggleBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primaryDark
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 6
  },
  categoryChoiceGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  locModeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
    marginBottom: 8
  },
  locModeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  locModeBtnActive: {
    backgroundColor: '#f0fdfa',
    borderColor: '#0d9488'
  },
  locModeBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b'
  },
  locModeBtnTextActive: {
    color: '#0f766e',
    fontWeight: '800'
  },
  publishMapCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    marginTop: 8
  },
  publishMapCanvas: {
    height: 120,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative'
  },
  mapRadarPulse: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: 'rgba(13, 148, 136, 0.4)',
    backgroundColor: 'rgba(13, 148, 136, 0.1)'
  },
  mapPinWrap: {
    alignItems: 'center'
  },
  mapPinBubble: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  mapPinBubbleText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textPrimary
  },
  publishMapFooter: {
    padding: 8,
    backgroundColor: '#ffffff'
  },
  publishMapCoords: {
    fontSize: 10,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '600'
  },
  publishMapHelp: {
    fontSize: 9,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 2
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
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#0f172a',
    fontWeight: '700'
  },
  textarea: { height: 80, textAlignVertical: 'top', color: '#0f172a', fontWeight: '600' },
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
