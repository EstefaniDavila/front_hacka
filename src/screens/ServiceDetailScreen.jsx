import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import InteractiveCommunityMap from '../components/InteractiveCommunityMap';

export default function ServiceDetailScreen({
  serviceId,
  onNavigate,
  fontScale = 1.0,
  onOpenChat,
  userProfile
}) {
  const { session } = useAuth();
  const token = session?.access_token || null;

  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Formulario de calificación con medias estrellas
  const [rating, setRating] = useState(5.0);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const scale = (val) => Math.round(val * fontScale);

  useEffect(() => {
    if (serviceId) {
      loadServiceDetail();
    }
  }, [serviceId]);

  const loadServiceDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getServiceDetail(serviceId);
      setService(data);
    } catch (err) {
      console.warn('[ServiceDetailScreen] Error al cargar detalle:', err);
      setError('No fue posible cargar el detalle del servicio.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendReview = async () => {
    if (!token) {
      Alert.alert('Inicia sesión', 'Debes estar autenticado para calificar a un vecino.');
      return;
    }
    if (!comment.trim()) {
      Alert.alert('Comentario necesario', 'Por favor describe brevemente tu experiencia con el servicio.');
      return;
    }

    try {
      setSubmittingReview(true);
      const intRating = Math.max(1, Math.min(5, Math.round(rating)));
      await api.addServiceReview(serviceId, { rating: intRating, comment: comment.trim() }, token);
      Alert.alert('⭐ ¡Gracias!', `Tu valoración de ${rating.toFixed(1)} estrellas apoya la reputación vecinal.`);
      setComment('');
      setShowReviewForm(false);
      await loadServiceDetail();
    } catch (err) {
      Alert.alert('Atención', err.message || 'No fue posible registrar tu valoración.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteService = () => {
    Alert.alert(
      '¿Eliminar publicación?',
      '¿Estás seguro de que deseas eliminar este servicio del catálogo barrial? Esta acción retirará tu publicación.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              await api.deleteService(serviceId, token);
              Alert.alert('Publicación eliminada', 'Tu servicio ha sido retirado con éxito.');
              onNavigate('services');
            } catch (err) {
              Alert.alert('Error', err.message || 'No se pudo eliminar el servicio.');
            } finally {
              setDeleting(false);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={[styles.loadingText, { fontSize: scale(13) }]}>Cargando información del servicio...</Text>
      </View>
    );
  }

  if (error || !service) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={COLORS.amber} />
        <Text style={[styles.errorTitle, { fontSize: scale(15), marginTop: 12 }]}>Servicio no disponible</Text>
        <Text style={[styles.errorSub, { fontSize: scale(12) }]}>{error || 'El servicio no existe o fue retirado.'}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => onNavigate('services')}>
          <Text style={styles.backBtnText}>Volver a Servicios</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const provider = service.provider || {};
  const myName = (userProfile?.name || 'Andy Manchego').toLowerCase().trim();
  const provName = (provider.full_name || service.provider_name || '').toLowerCase().trim();
  const isOwner = (token && session?.user?.id === service.provider_id) ||
                  (myName && provName && (myName === provName || myName.includes(provName) || provName.includes(myName)));
  const ratingSteps = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Botón Superior de Retroceso */}
      <View style={styles.navHeader}>
        <TouchableOpacity style={styles.backPill} onPress={() => onNavigate('services')}>
          <Feather name="arrow-left" size={16} color={COLORS.primaryDark} />
          <Text style={[styles.backPillText, { fontSize: scale(12) }]}>Volver a servicios</Text>
        </TouchableOpacity>
        <View style={styles.categoryBadge}>
          <Text style={{ fontSize: 14, marginRight: 4 }}>{service.category_icon || '🛠️'}</Text>
          <Text style={[styles.categoryBadgeText, { fontSize: scale(11) }]}>{service.category_name}</Text>
        </View>
      </View>

      {/* Tarjeta Principal del Servicio */}
      <View style={styles.mainCard}>
        <Text style={[styles.serviceTitle, { fontSize: scale(17) }]}>{service.title}</Text>

        <View style={styles.priceRow}>
          <Text style={[styles.priceTag, { fontSize: scale(18) }]}>
            S/ {service.price_from != null ? Number(service.price_from).toFixed(2) : 'A convenir'}
          </Text>
          <Text style={[styles.priceUnit, { fontSize: scale(12) }]}>por {service.price_unit || 'servicio'}</Text>
          <View style={styles.statusChip}>
            <Text style={styles.statusChipText}>{service.status === 'active' ? '● Disponible' : '○ Pausado'}</Text>
          </View>
        </View>

        {service.availability && (
          <View style={styles.infoPillRow}>
            <Ionicons name="time-outline" size={14} color="#0f766e" style={{ marginRight: 4 }} />
            <Text style={[styles.infoPillText, { fontSize: scale(11) }]}>{service.availability}</Text>
          </View>
        )}

        <View style={styles.separator} />

        <Text style={[styles.sectionSubtitle, { fontSize: scale(13) }]}>Descripción del servicio</Text>
        <Text style={[styles.descriptionText, { fontSize: scale(12) }]}>
          {service.description || 'El prestador no incluyó una descripción adicional.'}
        </Text>
      </View>

      {/* Tarjeta del Vecino Prestador */}
      <View style={styles.providerCard}>
        <Text style={[styles.sectionSubtitle, { fontSize: scale(13), marginBottom: 10 }]}>
          Vecino que ofrece el servicio
        </Text>
        <View style={styles.providerRow}>
          <Image
            source={{
              uri: provider.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200'
            }}
            style={styles.providerAvatar}
          />
          <View style={styles.providerInfo}>
            <View style={styles.vistoBuenoBadge}>
              <Text style={styles.vistoBuenoText}>★ Vecino Verificado</Text>
            </View>
            <Text style={[styles.providerName, { fontSize: scale(14) }]}>{provider.full_name || service.provider_name}</Text>
            <Text style={[styles.providerPhone, { fontSize: scale(11) }]}>
              📞 {provider.phone || service.provider_phone || 'Teléfono coordinable por chat'}
            </Text>
            <Text style={[styles.providerRating, { fontSize: scale(11) }]}>
              ⭐ {service.rating_avg > 0 ? Number(service.rating_avg).toFixed(1) : 'Nuevo'} ({service.reviews_count} valoraciones)
            </Text>
          </View>
        </View>

        {/* Acciones de Contacto si no es el dueño */}
        {!isOwner ? (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.chatButton}
              activeOpacity={0.8}
              onPress={() => {
                if (onOpenChat) {
                  onOpenChat({
                    name: provider.full_name || service.provider_name,
                    topic: service.title,
                    avatar: '👨‍🔧',
                    zone: 'Zona A',
                    badge: 'Vecino Verificado',
                    phone: provider.phone || service.provider_phone
                  });
                }
              }}
            >
              <Ionicons name="chatbubbles" size={18} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={[styles.chatButtonText, { fontSize: scale(12) }]}>Contactar por Chat Vecinal</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.ownerBox}>
            <View style={styles.ownerBadgeRow}>
              <Ionicons name="person-circle" size={18} color="#0d9488" />
              <Text style={styles.ownerBadgeText}>Esta publicación fue creada desde tu cuenta</Text>
            </View>
            <TouchableOpacity
              style={styles.deleteButton}
              activeOpacity={0.8}
              onPress={handleDeleteService}
              disabled={deleting}
            >
              <Ionicons name="trash-outline" size={16} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.deleteButtonText}>
                {deleting ? 'Eliminando servicio...' : 'Eliminar publicación de servicio'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Mapa Satelital Interactivo de Google Maps del Servicio */}
      <InteractiveCommunityMap
        latitude={service?.latitude || -12.0463}
        longitude={service?.longitude || -77.0427}
        title={service?.title || 'Ubicación del Servicio en el Barrio'}
        subtitle={(service.community_name || 'Zona A') + ' • Manzana 2'}
        height={210}
        mode="service"
        fontScale={fontScale}
      />

      {/* Sección de Reputación y Reseñas con Medias Estrellas */}
      <View style={styles.reviewsCard}>
        <View style={styles.reviewsHeader}>
          <View>
            <Text style={[styles.sectionSubtitle, { fontSize: scale(13) }]}>Opiniones de Vecinos</Text>
            <Text style={[styles.ratingHighlight, { fontSize: scale(12) }]}>
              ⭐ {service.rating_avg > 0 ? Number(service.rating_avg).toFixed(1) : 'Sin opiniones'} • {service.reviews_count} en total
            </Text>
          </View>
          {!isOwner && !showReviewForm && (
            <TouchableOpacity style={styles.addReviewBtn} onPress={() => setShowReviewForm(true)}>
              <Text style={[styles.addReviewBtnText, { fontSize: scale(11) }]}>+ Opinar</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Formulario para Calificar con Medias Estrellas */}
        {showReviewForm && (
          <View style={styles.reviewFormBox}>
            <Text style={[styles.formLabel, { fontSize: scale(12) }]}>¿Cómo calificarías este servicio?</Text>
            
            {/* Selector de Estrellas Interactivas (1 a 5 con medias estrellas táctiles) */}
            <View style={styles.starsInteractiveContainer}>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((starIdx) => {
                  const isFull = rating >= starIdx;
                  const isHalf = !isFull && rating >= starIdx - 0.5;
                  return (
                    <View key={starIdx} style={styles.starTouchContainer}>
                      {/* Toque izquierdo: media estrella */}
                      <TouchableOpacity
                        style={styles.starHalfLeft}
                        activeOpacity={0.7}
                        onPress={() => setRating(starIdx - 0.5)}
                      />
                      {/* Toque derecho: estrella completa */}
                      <TouchableOpacity
                        style={styles.starHalfRight}
                        activeOpacity={0.7}
                        onPress={() => setRating(starIdx)}
                      />
                      {/* Icono de Estrella Real */}
                      <Ionicons
                        name={isFull ? "star" : isHalf ? "star-half" : "star-outline"}
                        size={36}
                        color={isFull || isHalf ? "#f59e0b" : "#cbd5e1"}
                      />
                    </View>
                  );
                })}
              </View>

              {/* Puntaje descriptivo */}
              <View style={styles.ratingDescriptorRow}>
                <Text style={styles.ratingDescriptorText}>
                  {rating === 5.0 && '⭐⭐⭐⭐⭐ ¡Excelente servicio!'}
                  {rating >= 4.0 && rating < 5.0 && '⭐⭐⭐⭐ Muy buen servicio'}
                  {rating >= 3.0 && rating < 4.0 && '⭐⭐⭐ Buen trabajo'}
                  {rating >= 2.0 && rating < 3.0 && '⭐⭐ Regular / Aceptable'}
                  {rating < 2.0 && '⭐ Necesita mejorar'}
                  {' '}({rating.toFixed(1)} / 5.0)
                </Text>
                <Text style={styles.ratingHintText}>
                  Toca una estrella para calificar (toca el lado izquierdo para media estrella)
                </Text>
              </View>
            </View>

            <TextInput
              style={[styles.commentInput, { fontSize: scale(12) }]}
              placeholder="Escribe tu recomendación para la comunidad (ej. Llegó puntual, trabajo de calidad)..."
              placeholderTextColor="#94a3b8"
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={3}
            />

            <View style={styles.formBtnRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowReviewForm(false)}
                disabled={submittingReview}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitReviewBtn}
                onPress={handleSendReview}
                disabled={submittingReview}
              >
                {submittingReview ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitReviewBtnText}>Publicar Calificación ({rating.toFixed(1)} ★)</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Lista de Opiniones Recientes */}
        {service.recent_reviews && service.recent_reviews.length > 0 ? (
          service.recent_reviews.map((rev) => (
            <View key={rev.id} style={styles.reviewItem}>
              <View style={styles.reviewItemHeader}>
                <Text style={[styles.reviewerName, { fontSize: scale(12) }]}>
                  {rev.reviewer_name || 'Vecino de la comunidad'}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                  <Ionicons name="star" size={13} color="#eab308" />
                  <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.text }}>{Number(rev.rating).toFixed(1)}</Text>
                </View>
              </View>
              {rev.comment && (
                <Text style={[styles.reviewComment, { fontSize: scale(11) }]}>"{rev.comment}"</Text>
              )}
            </View>
          ))
        ) : (
          <Text style={[styles.emptyReviewsText, { fontSize: scale(11) }]}>
            Aún no hay opiniones registradas para este servicio. ¡Sé el primero en calificarlo tras coordinar!
          </Text>
        )}
      </View>

      {/* Espaciador inferior para evitar que la barra inferior tape el contenido */}
      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  content: {
    padding: 16,
    paddingBottom: 120
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f8fafc'
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.textSecondary,
    fontWeight: '500'
  },
  errorTitle: {
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6
  },
  errorSub: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 16
  },
  backBtn: {
    backgroundColor: COLORS.primarySurface,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12
  },
  backBtnText: {
    color: COLORS.primaryDark,
    fontWeight: '700'
  },
  navHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14
  },
  backPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  backPillText: {
    color: COLORS.primaryDark,
    fontWeight: '800'
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primarySurface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primaryPale
  },
  categoryBadgeText: {
    color: COLORS.primaryDark,
    fontWeight: '700'
  },
  mainCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2
  },
  serviceTitle: {
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 8
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  priceTag: {
    fontWeight: '900',
    color: COLORS.primaryDark,
    marginRight: 6
  },
  priceUnit: {
    color: COLORS.textSecondary,
    marginRight: 12
  },
  statusChip: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8
  },
  statusChipText: {
    color: '#059669',
    fontWeight: '700',
    fontSize: 11
  },
  infoPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 10
  },
  infoPillText: {
    color: COLORS.textSecondary,
    fontWeight: '600'
  },
  separator: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 10
  },
  sectionSubtitle: {
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4
  },
  descriptionText: {
    color: COLORS.textSecondary,
    lineHeight: 18
  },
  providerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  providerAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    marginRight: 14,
    backgroundColor: '#e2e8f0'
  },
  providerInfo: {
    flex: 1
  },
  vistoBuenoBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 4
  },
  vistoBuenoText: {
    color: '#b45309',
    fontWeight: '800',
    fontSize: 10
  },
  providerName: {
    fontWeight: '800',
    color: COLORS.text
  },
  providerPhone: {
    color: COLORS.textSecondary,
    marginVertical: 2
  },
  providerRating: {
    color: COLORS.textSecondary,
    fontWeight: '600'
  },
  actionRow: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12
  },
  chatButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3
  },
  chatButtonText: {
    color: '#ffffff',
    fontWeight: '800'
  },
  ownerBox: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12
  },
  ownerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f0fdfa',
    padding: 8,
    borderRadius: 10,
    marginBottom: 10
  },
  ownerBadgeText: {
    color: '#0f766e',
    fontWeight: '700',
    fontSize: 11
  },
  deleteButton: {
    backgroundColor: '#ef4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#ef4444',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3
  },
  deleteButtonText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13
  },
  mapCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  mapHeaderTitle: {
    fontWeight: '800',
    color: COLORS.text
  },
  mapCanvas: {
    height: 120,
    backgroundColor: '#e2e8f0',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden'
  },
  radarRing: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
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
    paddingVertical: 4,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  mapPinBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.text
  },
  mapCoordinatesText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: 'center'
  },
  reviewsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  ratingHighlight: {
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 2
  },
  addReviewBtn: {
    backgroundColor: COLORS.primarySurface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.primaryPale
  },
  addReviewBtnText: {
    color: COLORS.primaryDark,
    fontWeight: '800'
  },
  reviewFormBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  formLabel: {
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6
  },
  starsInteractiveContainer: {
    alignItems: 'center',
    marginVertical: 10,
    backgroundColor: '#fffbeb',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#fef3c7'
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  starTouchContainer: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },
  starHalfLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 19,
    zIndex: 2
  },
  starHalfRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 19,
    zIndex: 2
  },
  ratingDescriptorRow: {
    alignItems: 'center',
    marginTop: 6
  },
  ratingDescriptorText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#b45309'
  },
  ratingHintText: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2
  },
  ratingScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8
  },
  ratingScoreNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.text
  },
  ratingScoreMax: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600'
  },
  halfStarScroll: {
    marginVertical: 6
  },
  halfStarChip: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#cbd5e1'
  },
  halfStarChipActive: {
    backgroundColor: '#0d9488',
    borderColor: '#0f766e'
  },
  halfStarChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textSecondary
  },
  halfStarChipTextActive: {
    color: '#ffffff'
  },
  commentInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    padding: 10,
    color: COLORS.text,
    textAlignVertical: 'top',
    minHeight: 60,
    marginTop: 8,
    marginBottom: 10
  },
  formBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8
  },
  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8
  },
  cancelBtnText: {
    color: COLORS.textSecondary,
    fontWeight: '700',
    fontSize: 12
  },
  submitReviewBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8
  },
  submitReviewBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 12
  },
  reviewItem: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingVertical: 10
  },
  reviewItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  reviewerName: {
    fontWeight: '700',
    color: COLORS.text
  },
  reviewComment: {
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    lineHeight: 18
  },
  emptyReviewsText: {
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 8
  }
});
