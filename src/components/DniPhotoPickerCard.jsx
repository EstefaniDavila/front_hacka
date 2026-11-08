import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const VALID_EXTENSIONS = ['jpg', 'jpeg', 'png'];

/**
 * Componente modular para la selección y previsualización de fotografías del DNI (Anverso y Reverso).
 * - Utiliza expo-image-picker para acceso a galería y cámara en Android.
 * - Soporta previsualización real, reemplazo y eliminación.
 * - Valida formatos (JPG, JPEG, PNG), resolución mínima y tamaño máximo (10MB).
 */
export default function DniPhotoPickerCard({
  side = 'front', // 'front' | 'back'
  title = 'Frente del DNI (Anverso)',
  subtitle = 'Foto clara donde se aprecie tu rostro y número de documento',
  selectedImage = null,
  onImageSelected,
  onImageRemoved,
  fontScale = 1.0,
  disabled = false
}) {
  const [isLoading, setIsLoading] = useState(false);
  const scale = (size) => Math.round(size * fontScale);

  // Validador de formato y tamaño
  const validateAsset = (asset) => {
    if (!asset || !asset.uri) {
      return { valid: false, message: 'No se seleccionó ninguna imagen válida.' };
    }

    // 1. Validar extensión y tipo mime
    const uri = asset.uri.toLowerCase();
    const mime = (asset.mimeType || '').toLowerCase();
    const hasValidExt = VALID_EXTENSIONS.some((ext) => uri.endsWith(`.${ext}`));
    const hasValidMime =
      mime.includes('jpeg') || mime.includes('jpg') || mime.includes('png') || !mime;

    if (!hasValidExt && !hasValidMime) {
      return {
        valid: false,
        message: 'Formato no permitido. Solo se aceptan imágenes JPG, JPEG o PNG.'
      };
    }

    // 2. Validar tamaño máximo (10 MB)
    if (asset.fileSize && asset.fileSize > MAX_FILE_SIZE_BYTES) {
      const sizeMb = (asset.fileSize / (1024 * 1024)).toFixed(1);
      return {
        valid: false,
        message: `La imagen pesa ${sizeMb} MB y supera el límite máximo de 10 MB.`
      };
    }

    // 3. Validar resolución mínima para lectura OCR
    if (asset.width && asset.height && (asset.width < 200 || asset.height < 150)) {
      return {
        valid: false,
        message: `La resolución (${asset.width}x${asset.height}) es insuficiente para procesar el DNI. Selecciona una imagen más nítida.`
      };
    }

    return { valid: true };
  };

  // Abrir galería del teléfono
  const handlePickFromGallery = async () => {
    if (disabled || isLoading) return;
    setIsLoading(true);

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permiso de Galería Requerido',
          'VeciRed IA necesita acceso a tu galería para cargar las fotografías de tu DNI.'
        );
        setIsLoading(false);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.9,
        base64: false
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const validation = validateAsset(asset);

        if (!validation.valid) {
          Alert.alert('Imagen no válida', validation.message);
        } else {
          const defaultName = side === 'front' ? 'dni_front.jpg' : 'dni_back.jpg';
          const normalized = {
            uri: asset.uri,
            name: asset.fileName || asset.name || defaultName,
            type: (asset.mimeType && asset.mimeType.includes('/'))
              ? asset.mimeType
              : (asset.uri?.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg'),
            fileName: asset.fileName || defaultName,
            mimeType: (asset.mimeType && asset.mimeType.includes('/')) ? asset.mimeType : 'image/jpeg',
            width: asset.width,
            height: asset.height,
            fileSize: asset.fileSize
          };
          onImageSelected(normalized);
        }
      }
    } catch (err) {
      console.warn('[DniPicker] Error al abrir galería:', err);
      Alert.alert('Error', 'No fue posible abrir la galería de imágenes.');
    } finally {
      setIsLoading(false);
    }
  };

  // Abrir cámara fotográfica como alternativa directa
  const handleTakePhoto = async () => {
    if (disabled || isLoading) return;
    setIsLoading(true);

    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permiso de Cámara Requerido',
          'VeciRed IA necesita acceso a la cámara para fotografiar tu documento.'
        );
        setIsLoading(false);
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.9,
        base64: false
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const validation = validateAsset(asset);

        if (!validation.valid) {
          Alert.alert('Imagen no válida', validation.message);
        } else {
          const defaultName = side === 'front' ? 'dni_front.jpg' : 'dni_back.jpg';
          const normalized = {
            uri: asset.uri,
            name: asset.fileName || asset.name || defaultName,
            type: (asset.mimeType && asset.mimeType.includes('/'))
              ? asset.mimeType
              : (asset.uri?.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg'),
            fileName: asset.fileName || defaultName,
            mimeType: (asset.mimeType && asset.mimeType.includes('/')) ? asset.mimeType : 'image/jpeg',
            width: asset.width,
            height: asset.height,
            fileSize: asset.fileSize
          };
          onImageSelected(normalized);
        }
      }
    } catch (err) {
      console.warn('[DniPicker] Error al tomar foto:', err);
      Alert.alert('Error', 'No fue posible abrir la cámara fotográfica.');
    } finally {
      setIsLoading(false);
    }
  };

  // Formato legible de tamaño
  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(0)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isFront = side === 'front';

  return (
    <View style={styles.cardContainer}>
      {/* Cabecera del espacio de carga */}
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <Text style={[styles.cardTitle, { fontSize: scale(13) }]}>
            {isFront ? '📸 1. Frente del DNI (Anverso)' : '📸 2. Reverso del DNI (Posterior)'}
          </Text>
          <Text style={[styles.cardSubtitle, { fontSize: scale(11) }]}>
            {subtitle}
          </Text>
        </View>

        {selectedImage ? (
          <View style={styles.badgeSuccess}>
            <Ionicons name="checkmark-circle" size={14} color="#15803d" style={{ marginRight: 4 }} />
            <Text style={styles.badgeSuccessText}>Cargado</Text>
          </View>
        ) : (
          <View style={styles.badgePending}>
            <Text style={styles.badgePendingText}>Pendiente</Text>
          </View>
        )}
      </View>

      {/* Contenido: Si no hay imagen cargada */}
      {!selectedImage ? (
        <View style={styles.emptyContainer}>
          {isLoading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={COLORS.primary || '#0d9488'} />
              <Text style={[styles.loadingText, { fontSize: scale(12) }]}>
                Cargando fotografía...
              </Text>
            </View>
          ) : (
            <View style={styles.actionsContainer}>
              <View style={styles.iconPlaceholder}>
                <Ionicons
                  name={isFront ? 'id-card-outline' : 'barcode-outline'}
                  size={36}
                  color={COLORS.primary || '#0d9488'}
                />
              </View>

              <Text style={[styles.guideText, { fontSize: scale(11) }]}>
                Formatos: JPG o PNG • Máx. 10 MB
              </Text>

              {/* Botón principal: Seleccionar desde galería */}
              <TouchableOpacity
                style={styles.pickGalleryBtn}
                activeOpacity={0.8}
                onPress={handlePickFromGallery}
              >
                <Ionicons name="images-outline" size={18} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={[styles.pickGalleryBtnText, { fontSize: scale(13) }]}>
                  {isFront ? 'SELECCIONAR ANVERSO DE GALERÍA' : 'SELECCIONAR REVERSO DE GALERÍA'}
                </Text>
              </TouchableOpacity>

              {/* Botón secundario: Tomar foto con cámara */}
              <TouchableOpacity
                style={styles.takePhotoBtn}
                activeOpacity={0.7}
                onPress={handleTakePhoto}
              >
                <Ionicons name="camera-outline" size={16} color={COLORS.primaryDark || '#0f766e'} style={{ marginRight: 6 }} />
                <Text style={[styles.takePhotoBtnText, { fontSize: scale(12) }]}>
                  O tomar foto con la cámara
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : (
        /* Contenido: Imagen cargada con vista previa real */
        <View style={styles.previewContainer}>
          <View style={styles.imageWrapper}>
            <Image
              source={{ uri: selectedImage.uri }}
              style={styles.previewImage}
              resizeMode="cover"
            />
            <View style={styles.previewOverlayBadge}>
              <Text style={styles.previewOverlayBadgeText}>
                {isFront ? '🇵🇪 DNI ANVERSO' : '🇵🇪 DNI REVERSO'}
              </Text>
            </View>
          </View>

          {/* Información técnica de la imagen */}
          <View style={styles.metaRow}>
            <View style={styles.metaInfo}>
              <Text style={[styles.metaFilename, { fontSize: scale(11) }]} numberOfLines={1}>
                {selectedImage.fileName || (isFront ? 'dni_anverso.jpg' : 'dni_reverso.jpg')}
              </Text>
              <Text style={[styles.metaSpecs, { fontSize: scale(10) }]}>
                {selectedImage.width && selectedImage.height ? `${selectedImage.width}×${selectedImage.height} px` : 'Imagen válida'}
                {selectedImage.fileSize ? ` • ${formatFileSize(selectedImage.fileSize)}` : ''}
              </Text>
            </View>
          </View>

          {/* Botones de acción: Reemplazar y Eliminar */}
          <View style={styles.manageButtonsRow}>
            <TouchableOpacity
              style={styles.replaceBtn}
              activeOpacity={0.8}
              onPress={handlePickFromGallery}
            >
              <Ionicons name="sync-outline" size={15} color={COLORS.primaryDark || '#0f766e'} style={{ marginRight: 6 }} />
              <Text style={[styles.replaceBtnText, { fontSize: scale(12) }]}>
                Reemplazar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteBtn}
              activeOpacity={0.8}
              onPress={onImageRemoved}
            >
              <Ionicons name="trash-outline" size={15} color="#dc2626" style={{ marginRight: 6 }} />
              <Text style={[styles.deleteBtnText, { fontSize: scale(12) }]}>
                Eliminar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    padding: 14,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  titleWrap: {
    flex: 1,
    paddingRight: 8
  },
  cardTitle: {
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 2
  },
  cardSubtitle: {
    color: '#64748b',
    lineHeight: 16
  },
  badgeSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0'
  },
  badgeSuccessText: {
    color: '#15803d',
    fontWeight: 'bold',
    fontSize: 11
  },
  badgePending: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8
  },
  badgePendingText: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600'
  },
  emptyContainer: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#cbd5e1',
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  loadingWrap: {
    paddingVertical: 20,
    alignItems: 'center'
  },
  loadingText: {
    color: '#64748b',
    marginTop: 8,
    fontWeight: '500'
  },
  actionsContainer: {
    width: '100%',
    alignItems: 'center'
  },
  iconPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ccfbf1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8
  },
  guideText: {
    color: '#94a3b8',
    marginBottom: 12,
    fontWeight: '500'
  },
  pickGalleryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary || '#0d9488',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    width: '100%',
    shadowColor: COLORS.primary || '#0d9488',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3
  },
  pickGalleryBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    letterSpacing: 0.3
  },
  takePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginTop: 8
  },
  takePhotoBtnText: {
    color: COLORS.primaryDark || '#0f766e',
    fontWeight: '600'
  },
  previewContainer: {
    width: '100%',
    alignItems: 'center'
  },
  imageWrapper: {
    width: '100%',
    height: 170,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#0f172a',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  previewImage: {
    width: '100%',
    height: '100%'
  },
  previewOverlayBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6
  },
  previewOverlayBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold'
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 8,
    paddingHorizontal: 4
  },
  metaInfo: {
    flex: 1
  },
  metaFilename: {
    color: '#334155',
    fontWeight: '600'
  },
  metaSpecs: {
    color: '#64748b',
    marginTop: 2
  },
  manageButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 10,
    marginTop: 4
  },
  replaceBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0fdfa',
    borderWidth: 1.5,
    borderColor: '#99f6e4',
    paddingVertical: 9,
    borderRadius: 10
  },
  replaceBtnText: {
    color: COLORS.primaryDark || '#0f766e',
    fontWeight: 'bold'
  },
  deleteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1.5,
    borderColor: '#fecaca',
    paddingVertical: 9,
    borderRadius: 10
  },
  deleteBtnText: {
    color: '#dc2626',
    fontWeight: 'bold'
  }
});

