import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ItemDetailScreen({
  item,
  type = 'product',
  itemType,
  onBack,
  fontScale = 1.0,
  onOpenChat,
  userProfile
}) {
  const { session, profile } = useAuth();
  const token = session?.access_token || null;
  const currentUserId = session?.user?.id || profile?.id;

  const [requested, setRequested] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const scale = (val) => Math.round(val * fontScale);

  if (!item) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <Ionicons name="alert-circle-outline" size={48} color={COLORS.textSecondary} />
        <Text style={{ fontSize: 16, color: COLORS.textSecondary, marginTop: 12, textAlign: 'center' }}>
          No se encontró la información del artículo o servicio.
        </Text>
        <TouchableOpacity style={styles.backButtonSimple} onPress={onBack}>
          <Text style={{ color: COLORS.primaryDark, fontWeight: '800' }}>← Regresar a la lista</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const effectiveType = itemType || type || (item.price_from ? 'service' : 'product');
  const isProduct = effectiveType === 'product';

  const title = item.name || item.title || 'Publicación comunitaria';
  const personName = item.seller_name || item.provider_name || item.user?.full_name || 'Vecino de confianza';
  const personAvatar = item.seller_avatar || item.provider_avatar || '👤';

  const rawPrice = item.price ?? item.price_from;
  const numPrice = Number(rawPrice);
  const priceDisplay = !isNaN(numPrice) && rawPrice !== null
    ? (isProduct
        ? `S/ ${numPrice.toFixed(2)} por ${item.unit || 'unidad'}`
        : `Desde S/ ${numPrice.toFixed(2)} por ${item.price_unit || item.unit || 'servicio'}`)
    : 'Precio a convenir con el vecino';

  const address = item.street_address || item.address || `${item.block_code || 'Zona A, Manzana 2'}`;
  const phone = item.phone || item.provider_phone || '987-111-222';
  const category = item.category || item.category_name || (isProduct ? 'Tienda comunitaria' : 'Servicio vecinal');

  const myName = (profile?.full_name || userProfile?.name || 'Andy Manchego').toLowerCase().trim();
  const pName = personName.toLowerCase().trim();
  const isOwner = (currentUserId && (
    item.seller_id === currentUserId ||
    item.provider_id === currentUserId ||
    item.user_id === currentUserId
  )) || (myName && pName && (myName === pName || myName.includes(pName) || pName.includes(myName)));

  const handleOrder = () => {
    setRequested(true);
    Alert.alert(
      '🎉 ¡Solicitud Vecinal Enviada!',
      `Se le notificó a ${personName} sobre tu interés en "${title}".\nPuedes coordinar entrega o pago directo por chat.`
    );
  };

  const handleDeleteItem = () => {
    Alert.alert(
      '¿Eliminar publicación?',
      `¿Deseas eliminar definitivamente "${title}" del catálogo comunitario?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              if (isProduct) {
                await api.deleteProduct(item.id, token);
              } else {
                await api.deleteService(item.id, token);
              }
              Alert.alert('Eliminado', 'Tu publicación ha sido retirada.');
              onBack?.();
            } catch (err) {
              Alert.alert('Aviso', err.message || 'No se pudo eliminar la publicación.');
            } finally {
              setDeleting(false);
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Barra Superior */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} activeOpacity={0.7} onPress={onBack}>
          <Feather name="arrow-left" size={20} color={COLORS.primaryDark} />
          <Text style={[styles.backBtnText, { fontSize: scale(12) }]}>Volver</Text>
        </TouchableOpacity>
        <Text style={[styles.screenHeaderTitle, { fontSize: scale(14) }]}>
          {isProduct ? 'Ficha de Producto' : 'Ficha de Servicio'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Imagen Principal */}
      <View style={styles.mainImageWrap}>
        {item.image_url ? (
          <Image
            source={{ uri: item.image_url }}
            style={styles.mainImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={{ fontSize: 54 }}>{isProduct ? '🍞' : '🔧'}</Text>
          </View>
        )}

        <View style={styles.verifiedTagOverlay}>
          <Text style={styles.verifiedTagText}>★ Vecino Verificado</Text>
        </View>

        <View style={styles.priceOverlayTag}>
          <Text style={[styles.priceOverlayText, { fontSize: scale(14) }]}>
            {priceDisplay}
          </Text>
        </View>
      </View>

      {/* Cuerpo Principal del Detalle */}
      <View style={styles.detailCard}>
        {/* Categoría y Disponibilidad */}
        <View style={styles.metaRow}>
          <View style={styles.categoryPill}>
            <Text style={styles.categoryPillText}>{category}</Text>
          </View>
          <Text style={[styles.availabilityText, { fontSize: scale(10) }]}>
            🟢 {item.availability || 'Disponible'}
          </Text>
        </View>

        {/* Título */}
        <Text style={[styles.itemTitle, { fontSize: scale(19) }]}>{title}</Text>

        {/* Valoración y Avales */}
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={16} color="#eab308" />
          <Text style={[styles.ratingNumber, { fontSize: scale(12) }]}>
            {' '}{item.rating || item.rating_avg ? Number(item.rating || item.rating_avg).toFixed(1) : '5.0'}
          </Text>
          <Text style={[styles.reviewsCount, { fontSize: scale(11) }]}>
            ({item.reviews_count || item.endorsements_count || 1} recomendaciones vecinales)
          </Text>
        </View>

        <View style={styles.divider} />

        {/* Descripción */}
        <Text style={[styles.sectionSubtitle, { fontSize: scale(12) }]}>
          Descripción del {isProduct ? 'producto' : 'servicio'}:
        </Text>
        <Text style={[styles.descriptionText, { fontSize: scale(12) }]}>
          {item.description || 'Sin descripción detallada. Comunícate directamente con el vecino para consultar.'}
        </Text>

        {isProduct && item.stock && (
          <View style={styles.stockNotice}>
            <Text style={[styles.stockNoticeText, { fontSize: scale(11) }]}>
              📦 Stock disponible: <Text style={{ fontWeight: '900' }}>{item.stock} unidades</Text>
            </Text>
          </View>
        )}

        <View style={styles.divider} />

        {/* Ficha del Vecino */}
        <Text style={[styles.sectionSubtitle, { fontSize: scale(12) }]}>
          {isProduct ? 'Emprendedor Vecinal:' : 'Profesional Comunitario:'}
        </Text>
        <View style={styles.sellerCard}>
          <View style={styles.sellerAvatarWrap}>
            {personAvatar && personAvatar.startsWith('http') ? (
              <Image source={{ uri: personAvatar }} style={styles.sellerAvatarImg} />
            ) : (
              <Text style={{ fontSize: 28 }}>{personAvatar || '👤'}</Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[styles.sellerName, { fontSize: scale(14) }]}>
                {personName}
              </Text>
              <View style={styles.verifiedMini}>
                <Text style={styles.verifiedMiniText}>✓ DNI</Text>
              </View>
            </View>
            <Text style={[styles.sellerAddress, { fontSize: scale(10) }]}>
              📍 {address}
            </Text>
            <Text style={[styles.sellerDistance, { fontSize: scale(10) }]}>
              🚶 A {item.distance_m || 150} m de tu casa en Zona A
            </Text>
          </View>
        </View>

        {/* Mapa y Ubicación Comunitaria */}
        <View style={styles.mapCard}>
          <View style={styles.mapHeader}>
            <Ionicons name="map" size={18} color="#0d9488" style={{ marginRight: 6 }} />
            <Text style={[styles.mapHeaderTitle, { fontSize: scale(12) }]}>
              Ubicación en Zona A
            </Text>
          </View>
          <View style={styles.mapCanvas}>
            <View style={styles.radarRing} />
            <View style={styles.mapPinContainer}>
              <Ionicons name="location" size={28} color="#ef4444" />
              <View style={styles.mapPinBadge}>
                <Text style={styles.mapPinBadgeText}>{address}</Text>
              </View>
            </View>
          </View>
          <Text style={styles.mapCoordinatesText}>
            📡 Coordenadas de entrega: -12.0463, -77.0427 • Mz 2
          </Text>
        </View>

        {/* Opciones del Dueño o Acciones de Compra */}
        {isOwner ? (
          <View style={styles.ownerBox}>
            <View style={styles.ownerBadgeRow}>
              <Ionicons name="checkmark-circle" size={18} color="#0d9488" />
              <Text style={styles.ownerBadgeText}>Esta publicación fue creada desde tu cuenta</Text>
            </View>
            <TouchableOpacity
              style={styles.deleteBtn}
              activeOpacity={0.8}
              onPress={handleDeleteItem}
              disabled={deleting}
            >
              <Ionicons name="trash-outline" size={16} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.deleteBtnText}>
                {deleting ? 'Eliminando...' : `Eliminar ${isProduct ? 'producto' : 'servicio'}`}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.actionsContainer}>
            {/* Botón de Chat */}
            <TouchableOpacity
              style={styles.chatButton}
              activeOpacity={0.8}
              onPress={() => {
                if (onOpenChat) {
                  onOpenChat({
                    name: personName,
                    topic: `${isProduct ? 'Producto' : 'Servicio'}: ${title}`,
                    avatar: personAvatar && !personAvatar.startsWith('http') ? personAvatar : '👤',
                    zone: item.block_code || 'Zona A',
                    badge: 'Vecino Verificado',
                    phone: phone
                  });
                }
              }}
            >
              <Ionicons name="chatbubbles" size={18} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={[styles.chatButtonText, { fontSize: scale(13) }]}>
                Contactar por Chat Vecinal
              </Text>
            </TouchableOpacity>

            {/* Botón de Solicitar / Comprar */}
            <TouchableOpacity
              style={[styles.orderButton, requested && { backgroundColor: COLORS.primaryDark }]}
              activeOpacity={0.85}
              onPress={handleOrder}
            >
              <Text style={[styles.orderButtonText, { fontSize: scale(13) }]}>
                {requested
                  ? '✅ ¡SOLICITUD ENVIADA!'
                  : isProduct
                  ? `🛍️ PEDIR ${title.toUpperCase()}`
                  : '🤝 SOLICITAR SERVICIO'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Garantía Comunitaria */}
        <View style={styles.guaranteeBox}>
          <Ionicons name="shield-checkmark" size={18} color="#0d9488" style={{ marginRight: 6 }} />
          <Text style={[styles.guaranteeText, { fontSize: scale(10) }]}>
            Comercio barrial seguro: Las transacciones se realizan directamente entre vecinos de confianza sin intermediarios ni comisiones.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  content: {
    paddingBottom: 120
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  backBtnText: {
    color: COLORS.primaryDark,
    fontWeight: '800'
  },
  screenHeaderTitle: {
    fontWeight: '900',
    color: COLORS.textPrimary
  },
  backButtonSimple: {
    marginTop: 16,
    padding: 10
  },
  mainImageWrap: {
    width: '100%',
    height: 220,
    backgroundColor: '#0f172a',
    position: 'relative'
  },
  mainImage: {
    width: '100%',
    height: '100%'
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primarySurface
  },
  verifiedTagOverlay: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: 'rgba(13, 148, 136, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8
  },
  verifiedTagText: {
    color: COLORS.white,
    fontWeight: '900',
    fontSize: 11
  },
  priceOverlayTag: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)'
  },
  priceOverlayText: {
    color: '#fef08a',
    fontWeight: '900'
  },
  detailCard: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -16,
    padding: 18,
    borderTopWidth: 1,
    borderTopColor: COLORS.border
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  categoryPill: {
    backgroundColor: COLORS.primarySurface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primaryPale
  },
  categoryPillText: {
    color: COLORS.primaryDeep,
    fontWeight: '800',
    fontSize: 11
  },
  availabilityText: {
    color: COLORS.emerald,
    fontWeight: '800'
  },
  itemTitle: {
    fontWeight: '900',
    color: COLORS.textPrimary,
    marginBottom: 8
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  ratingNumber: {
    fontWeight: '900',
    color: COLORS.amber
  },
  reviewsCount: {
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginLeft: 4
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 14
  },
  sectionSubtitle: {
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 6
  },
  descriptionText: {
    color: COLORS.textSecondary,
    lineHeight: 20
  },
  stockNotice: {
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 8,
    marginTop: 8
  },
  stockNoticeText: {
    color: COLORS.textSecondary
  },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14
  },
  sellerAvatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primarySurface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden'
  },
  sellerAvatarImg: {
    width: '100%',
    height: '100%'
  },
  sellerName: {
    fontWeight: '800',
    color: COLORS.textPrimary
  },
  verifiedMini: {
    backgroundColor: COLORS.primarySurface,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4
  },
  verifiedMiniText: {
    fontSize: 9,
    color: COLORS.primaryDark,
    fontWeight: '800'
  },
  sellerAddress: {
    color: COLORS.textSecondary,
    marginTop: 2
  },
  sellerDistance: {
    color: COLORS.primaryDark,
    fontWeight: '700',
    marginTop: 2
  },
  mapCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  mapHeaderTitle: {
    fontWeight: '800',
    color: COLORS.textPrimary
  },
  mapCanvas: {
    height: 110,
    backgroundColor: '#e2e8f0',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden'
  },
  radarRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: 'rgba(13, 148, 136, 0.4)',
    backgroundColor: 'rgba(13, 148, 136, 0.1)'
  },
  mapPinContainer: {
    alignItems: 'center'
  },
  mapPinBadge: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  mapPinBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textPrimary
  },
  mapCoordinatesText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 6,
    textAlign: 'center'
  },
  ownerBox: {
    backgroundColor: '#f0fdfa',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ccfbf1',
    marginBottom: 14
  },
  ownerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10
  },
  ownerBadgeText: {
    fontWeight: '700',
    color: '#0f766e',
    fontSize: 12
  },
  deleteBtn: {
    backgroundColor: '#ef4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#ef4444',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3
  },
  deleteBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13
  },
  actionsContainer: {
    gap: 10,
    marginBottom: 14
  },
  chatButton: {
    backgroundColor: COLORS.primaryDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: COLORS.primaryDark,
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2
  },
  chatButtonText: {
    color: COLORS.white,
    fontWeight: '800'
  },
  orderButton: {
    backgroundColor: COLORS.emerald,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: COLORS.emerald,
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2
  },
  orderButtonText: {
    color: COLORS.white,
    fontWeight: '800'
  },
  guaranteeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primarySurface,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primaryPale
  },
  guaranteeText: {
    color: COLORS.primaryDeep,
    flex: 1,
    lineHeight: 15
  }
});
