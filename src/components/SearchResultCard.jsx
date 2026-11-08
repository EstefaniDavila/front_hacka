import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';

export default function SearchResultCard({ item, onPress, fontScale = 1.0 }) {
  if (!item) return null;
  const scale = (val) => Math.round(val * fontScale);

  // Normalizar campos independientemente de si viene de /search global o de sub-rutas
  const moduleType = item.module || (
    item.emergency_type ? 'emergencies' :
    item.post_type ? 'solidarity' :
    item.price_from !== undefined ? 'services' :
    item.price !== undefined ? 'products' : 'services'
  );

  const title = item.title || item.name || 'Publicación comunitaria';
  const subtitle = item.subtitle || item.provider_name || item.business_name || item.author_name || item.reporter_name || '';
  const description = item.description || '';
  const category = item.category || item.category_name || '';
  const image = item.image_url || item.provider_avatar || item.author_avatar || null;
  const distance = item.distance_meters != null
    ? (item.distance_meters < 1000 ? `${Math.round(item.distance_meters)} m` : `${(Number(item.distance_meters) / 1000).toFixed(1)} km`)
    : (item.distance_km != null ? `${Number(item.distance_km).toFixed(1)} km` : null);
  const rating = item.rating != null ? Number(item.rating) : (item.rating_avg != null ? Number(item.rating_avg) : null);
  const reviewsCount = item.reviews_count || 0;
  const isNew = Boolean(item.is_new);
  const isVerified = Boolean(item.is_verified);
  const price = item.price_label || (
    item.price_from != null ? `S/ ${Number(item.price_from).toFixed(2)}${item.price_unit ? ` /${item.price_unit}` : ''}` :
    item.price != null ? `S/ ${Number(item.price).toFixed(2)}` : null
  );

  // Porcentaje de coincidencia o recomendación
  const scorePercent = item.score != null
    ? Math.round(Number(item.score) * 100)
    : (item.ranking_score ? Math.round(Number(item.ranking_score) * 100) : null);
  const algorithmReason = item.score_breakdown?.algorithm_notes || null;

  // Icono y color por módulo
  const getModuleConfig = () => {
    switch (moduleType) {
      case 'services':
        return { label: 'Servicio', color: '#0f766e', bg: '#ccfbf1', icon: 'build-outline' };
      case 'products':
        return { label: 'Producto', color: '#b45309', bg: '#fef3c7', icon: 'basket-outline' };
      case 'solidarity':
        return {
          label: item.is_urgent ? 'Ayuda Urgente' : 'Muro Solidario',
          color: item.is_urgent ? '#dc2626' : '#6d28d9',
          bg: item.is_urgent ? '#fee2e2' : '#ede9fe',
          icon: 'people-outline'
        };
      case 'emergencies':
        return {
          label: `Emergencia (${(item.severity || 'activa').toUpperCase()})`,
          color: '#dc2626',
          bg: '#fee2e2',
          icon: 'alert-circle-outline'
        };
      default:
        return { label: 'Comunidad', color: '#0f766e', bg: '#f0fdfa', icon: 'navigate-outline' };
    }
  };

  const modCfg = getModuleConfig();

  return (
    <TouchableOpacity
      style={[
        styles.card,
        moduleType === 'emergencies' && styles.emergencyCard,
        item.is_urgent && styles.urgentCard
      ]}
      activeOpacity={0.85}
      onPress={() => onPress && onPress(item, moduleType)}
    >
      {/* Barra superior de etiquetas */}
      <View style={styles.topRow}>
        <View style={[styles.moduleBadge, { backgroundColor: modCfg.bg }]}>
          <Ionicons name={modCfg.icon} size={12} color={modCfg.color} style={{ marginRight: 4 }} />
          <Text style={[styles.moduleBadgeText, { color: modCfg.color, fontSize: scale(10) }]}>
            {modCfg.label}
          </Text>
        </View>

        <View style={styles.topRightRow}>
          {isNew && (
            <View style={styles.newBadge}>
              <Text style={[styles.newBadgeText, { fontSize: scale(9) }]}>NUEVO VECINO</Text>
            </View>
          )}
          {isVerified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={11} color="#16a34a" />
              <Text style={[styles.verifiedBadgeText, { fontSize: scale(9) }]}>Verificado</Text>
            </View>
          )}
          {scorePercent && (
            <View style={styles.scoreBadge}>
              <Text style={[styles.scoreBadgeText, { fontSize: scale(9) }]}>
                ⭐ {scorePercent}%
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Contenido principal */}
      <View style={styles.bodyRow}>
        {image ? (
          <Image source={{ uri: image }} style={styles.thumbnail} />
        ) : (
          <View style={[styles.thumbnailPlaceholder, { backgroundColor: modCfg.bg }]}>
            <Ionicons name={modCfg.icon} size={24} color={modCfg.color} />
          </View>
        )}

        <View style={styles.detailsCol}>
          <Text style={[styles.title, { fontSize: scale(13) }]} numberOfLines={1}>
            {title}
          </Text>

          {subtitle ? (
            <Text style={[styles.subtitle, { fontSize: scale(11) }]} numberOfLines={1}>
              {subtitle} {category ? `• ${category}` : ''}
            </Text>
          ) : null}

          {description ? (
            <Text style={[styles.description, { fontSize: scale(11) }]} numberOfLines={2}>
              {description}
            </Text>
          ) : null}

          {/* Fila de metadatos (Distancia, Rating, Precio) */}
          <View style={styles.metaRow}>
            {price && (
              <Text style={[styles.priceTag, { fontSize: scale(12) }]}>
                {price}
              </Text>
            )}

            {distance && (
              <View style={styles.metaItem}>
                <Ionicons name="location-outline" size={12} color="#0f766e" />
                <Text style={[styles.metaText, { fontSize: scale(10) }]}>{distance}</Text>
              </View>
            )}

            {rating != null && rating > 0 && moduleType !== 'emergencies' && (
              <View style={styles.metaItem}>
                <Ionicons name="star" size={12} color="#eab308" />
                <Text style={[styles.metaText, { fontSize: scale(10) }]}>
                  {rating.toFixed(1)} {reviewsCount > 0 ? `(${reviewsCount})` : ''}
                </Text>
              </View>
            )}

            {item.availability && (
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={12} color="#64748b" />
                <Text style={[styles.metaText, { fontSize: scale(10) }]} numberOfLines={1}>
                  {item.availability}
                </Text>
              </View>
            )}
          </View>

          {algorithmReason ? (
            <Text style={[styles.algorithmNote, { fontSize: scale(9) }]} numberOfLines={1}>
              💡 {algorithmReason}
            </Text>
          ) : null}
        </View>

        <Feather name="chevron-right" size={18} color="#cbd5e1" style={{ alignSelf: 'center' }} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  emergencyCard: {
    borderColor: '#fca5a5',
    backgroundColor: '#fff5f5'
  },
  urgentCard: {
    borderColor: '#fca5a5'
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  moduleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  moduleBadgeText: {
    fontWeight: '700'
  },
  topRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  newBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  newBadgeText: {
    color: '#15803d',
    fontWeight: '800'
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: '#86efac'
  },
  verifiedBadgeText: {
    color: '#15803d',
    fontWeight: '700'
  },
  scoreBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  scoreBadgeText: {
    color: '#475569',
    fontWeight: '700'
  },
  bodyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 10,
    backgroundColor: '#f1f5f9'
  },
  thumbnailPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  detailsCol: {
    flex: 1,
    marginRight: 6
  },
  title: {
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 2
  },
  subtitle: {
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 4
  },
  description: {
    color: '#475569',
    lineHeight: 16,
    marginBottom: 6
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginTop: 2
  },
  priceTag: {
    fontWeight: '800',
    color: COLORS.primaryDark
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2
  },
  metaText: {
    color: '#475569',
    fontWeight: '600'
  },
  algorithmNote: {
    color: '#0284c7',
    fontWeight: '600',
    marginTop: 4
  }
});

