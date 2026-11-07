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
import { COLORS } from '../theme/colors';

export default function ItemDetailScreen({
  item,
  type = 'product', // 'product' | 'service'
  onBack,
  fontScale = 1.0,
  onOpenChat
}) {
  const [requested, setRequested] = useState(false);

  const scale = (val) => Math.round(val * fontScale);

  if (!item) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontSize: 16, color: COLORS.textSecondary }}>
          No se encontró la información del artículo.
        </Text>
        <TouchableOpacity style={styles.backButtonSimple} onPress={onBack}>
          <Text style={{ color: COLORS.primary, fontWeight: '800' }}>← Regresar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isProduct = type === 'product';
  const title = isProduct ? item.name : item.title;
  const personName = isProduct ? item.seller_name : item.provider_name;
  const personAvatar = isProduct ? item.seller_avatar : item.provider_avatar;
  const priceDisplay = isProduct
    ? `S/ ${item.price.toFixed(2)} por ${item.unit || 'unidad'}`
    : `Desde S/ ${item.price_from.toFixed(2)} por ${item.price_unit || 'servicio'}`;
  const address = item.street_address || `${item.block_code || 'Zona A, Manzana 2'}`;
  const phone = item.phone || '987-111-222';
  const category = item.category || item.category_name || (isProduct ? 'Producto local' : 'Servicio vecinal');

  const handleOrder = () => {
    setRequested(true);
    Alert.alert(
      '🎉 ¡Solicitud Enviada!',
      `Se le notificó a ${personName} sobre tu interés en "${title}".\nPuedes coordinar detalles de entrega directamente por el chat interno.`
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Barra Superior con Botón de Regreso */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} activeOpacity={0.7} onPress={onBack}>
          <Text style={{ fontSize: 20, color: COLORS.primaryDark }}>←</Text>
          <Text style={[styles.backBtnText, { fontSize: scale(12) }]}>Volver</Text>
        </TouchableOpacity>
        <Text style={[styles.screenHeaderTitle, { fontSize: scale(14) }]}>
          {isProduct ? 'Detalle de Producto' : 'Detalle de Servicio'}
        </Text>
        <View style={{ width: 60 }} />
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
          <Text style={styles.verifiedTagText}>★ Visto Bueno Vecinal</Text>
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
            🟢 {item.availability || 'Disponible hoy'}
          </Text>
        </View>

        {/* Título */}
        <Text style={[styles.itemTitle, { fontSize: scale(19) }]}>{title}</Text>

        {/* Valoración y Avales */}
        <View style={styles.ratingRow}>
          <Text style={{ fontSize: 16 }}>⭐</Text>
          <Text style={[styles.ratingNumber, { fontSize: scale(12) }]}>
            {item.rating || item.rating_avg || 4.9}
          </Text>
          <Text style={[styles.reviewsCount, { fontSize: scale(11) }]}>
            ({item.reviews_count || item.endorsements_count || 14} avales de vecinos)
          </Text>
        </View>

        <View style={styles.divider} />

        {/* Descripción */}
        <Text style={[styles.sectionSubtitle, { fontSize: scale(12) }]}>
          Descripción del {isProduct ? 'producto' : 'servicio'}:
        </Text>
        <Text style={[styles.descriptionText, { fontSize: scale(12) }]}>
          {item.description}
        </Text>

        {isProduct && item.stock && (
          <View style={styles.stockNotice}>
            <Text style={[styles.stockNoticeText, { fontSize: scale(11) }]}>
              📦 Stock disponible: <Text style={{ fontWeight: '900' }}>{item.stock} unidades</Text>
            </Text>
          </View>
        )}

        <View style={styles.divider} />

        {/* Ficha del Vecino / Emprendedor */}
        <Text style={[styles.sectionSubtitle, { fontSize: scale(12) }]}>
          {isProduct ? 'Emprendedor Vecinal:' : 'Profesional Comunitario:'}
        </Text>
        <View style={styles.sellerCard}>
          <View style={styles.sellerAvatarWrap}>
            {personAvatar && personAvatar.startsWith('http') ? (
              <Image source={{ uri: personAvatar }} style={styles.sellerAvatarImg} />
            ) : (
              <Text style={{ fontSize: 28 }}>{personAvatar || '👵'}</Text>
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
              🚶 A {item.distance_m || 200} m de tu casa en Zona A
            </Text>
          </View>
        </View>

        {/* Ubicación y Mapa Simulado */}
        <View style={styles.locationBox}>
          <Text style={{ fontSize: 24, marginRight: 8 }}>🗺️</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.locationTitle, { fontSize: scale(11) }]}>
              Ubicación en tu comunidad:
            </Text>
            <Text style={[styles.locationDesc, { fontSize: scale(10) }]}>
              {address} • Manzana verificada por GPS
            </Text>
          </View>
        </View>

        {/* Botones de Acción */}
        <View style={styles.actionsContainer}>
          {/* 1. Botón de Chat */}
          <TouchableOpacity
            style={styles.chatButton}
            activeOpacity={0.8}
            onPress={() => {
              if (onOpenChat) {
                onOpenChat({
                  name: personName,
                  topic: `${isProduct ? 'Producto' : 'Servicio'}: ${title}`,
                  avatar: personAvatar || '👤',
                  zone: item.block_code || 'Zona A',
                  badge: 'Vecino Verificado',
                  phone: phone
                });
              }
            }}
          >
            <Text style={{ fontSize: 18, marginRight: 6 }}>💬</Text>
            <Text style={[styles.chatButtonText, { fontSize: scale(13) }]}>
              Enviar mensaje por Chat
            </Text>
          </TouchableOpacity>

          {/* 2. Botón de Solicitar / Comprar */}
          <TouchableOpacity
            style={[styles.orderButton, requested && { backgroundColor: COLORS.primaryDark }]}
            activeOpacity={0.85}
            onPress={handleOrder}
          >
            <Text style={[styles.orderButtonText, { fontSize: scale(13) }]}>
              {requested
                ? '✅ ¡SOLICITUD ENVIADA!'
                : isProduct
                ? `🤝 PEDIR ${title.toUpperCase()}`
                : '🤝 SOLICITAR SERVICIO AHORA'}
            </Text>
          </TouchableOpacity>

          {/* 3. Botón de WhatsApp */}
          <TouchableOpacity
            style={styles.callButton}
            activeOpacity={0.8}
            onPress={() =>
              Alert.alert(
                '📞 Contactar Vecino',
                `Teléfono directo de ${personName}: ${phone}\n¿Deseas iniciar una llamada o WhatsApp?`
              )
            }
          >
            <Text style={[styles.callButtonText, { fontSize: scale(11) }]}>
              📞 Contactar por WhatsApp ({phone})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Garantía Comunitaria */}
        <View style={styles.guaranteeBox}>
          <Text style={{ fontSize: 16, marginRight: 6 }}>🛡️</Text>
          <Text style={[styles.guaranteeText, { fontSize: scale(10) }]}>
            Comercio barrial seguro: Las transacciones se realizan directamente entre vecinos de confianza sin comisiones ocultas.
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
    paddingBottom: 90
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
    height: 240,
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
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
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
    gap: 4,
    marginBottom: 12
  },
  ratingNumber: {
    fontWeight: '900',
    color: COLORS.amber
  },
  reviewsCount: {
    color: COLORS.textSecondary,
    fontWeight: '600'
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
    backgroundColor: COLORS.primarySurface,
    padding: 10,
    borderRadius: 8,
    marginTop: 10
  },
  stockNoticeText: {
    color: COLORS.primaryDeep
  },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
    marginTop: 6
  },
  sellerAvatarWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: COLORS.primaryPale
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
    backgroundColor: COLORS.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  verifiedMiniText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '900'
  },
  sellerAddress: {
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 2
  },
  sellerDistance: {
    color: COLORS.primaryDark,
    fontWeight: '700',
    marginTop: 2
  },
  locationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primarySurface,
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.primaryPale
  },
  locationTitle: {
    fontWeight: '800',
    color: COLORS.primaryDeep
  },
  locationDesc: {
    color: COLORS.textSecondary,
    marginTop: 2
  },
  actionsContainer: {
    marginTop: 20,
    gap: 10
  },
  chatButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14
  },
  chatButtonText: {
    color: COLORS.white,
    fontWeight: '900'
  },
  orderButton: {
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14
  },
  orderButtonText: {
    color: COLORS.white,
    fontWeight: '900'
  },
  callButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12
  },
  callButtonText: {
    color: COLORS.textSecondary,
    fontWeight: '700'
  },
  guaranteeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 10,
    padding: 10,
    marginTop: 16
  },
  guaranteeText: {
    flex: 1,
    color: COLORS.textMuted,
    lineHeight: 15
  }
});
