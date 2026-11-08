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
import { COLORS } from '../theme/colors';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ServiceDetailScreen({
  serviceId,
  onNavigate,
  fontScale = 1.0,
  onOpenChat
}) {
  const { session } = useAuth();
  const token = session?.access_token || null;

  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Formulario de calificación
  const [rating, setRating] = useState(5);
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
      await api.addServiceReview(serviceId, { rating, comment }, token);
      Alert.alert('⭐ ¡Gracias!', 'Tu valoración ha sido registrada y apoya la reputación vecinal.');
      setComment('');
      setShowReviewForm(false);
      // Recargar datos
      await loadServiceDetail();
    } catch (err) {
      Alert.alert('Atención', err.message || 'No fue posible registrar tu valoración.');
    } finally {
      setSubmittingReview(false);
    }
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
        <Text style={{ fontSize: 36, marginBottom: 12 }}>⚠️</Text>
        <Text style={[styles.errorTitle, { fontSize: scale(15) }]}>Servicio no disponible</Text>
        <Text style={[styles.errorSub, { fontSize: scale(12) }]}>{error || 'El servicio no existe o fue retirado.'}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => onNavigate('services')}>
          <Text style={styles.backBtnText}>Volver a Servicios</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const provider = service.provider || {};
  const isOwner = token && session?.user?.id === service.provider_id;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Botón Superior de Retroceso */}
      <View style={styles.navHeader}>
        <TouchableOpacity style={styles.backPill} onPress={() => onNavigate('services')}>
          <Text style={{ fontSize: 16, color: COLORS.primaryDark }}>❮</Text>
          <Text style={[styles.backPillText, { fontSize: scale(12) }]}>Volver a servicios</Text>
        </TouchableOpacity>
        <View style={styles.categoryBadge}>
          <Text style={{ fontSize: 14, marginRight: 4 }}>{service.category_icon || '🏪'}</Text>
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
            <Text style={{ fontSize: 13, marginRight: 4 }}>🕒</Text>
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
              ⭐ {service.rating_avg > 0 ? service.rating_avg.toFixed(1) : 'Nuevo'} ({service.reviews_count} valoraciones)
            </Text>
          </View>
        </View>

        {/* Acciones de Contacto */}
        {!isOwner && (
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
                } else {
                  Alert.alert('💬 Chat Vecinal', `Iniciando chat con ${provider.full_name || service.provider_name}...`);
                }
              }}
            >
              <Text style={{ fontSize: 16, marginRight: 6 }}>💬</Text>
              <Text style={[styles.chatButtonText, { fontSize: scale(12) }]}>Contactar por Chat Vecinal</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Sección de Reputación y Reseñas */}
      <View style={styles.reviewsCard}>
        <View style={styles.reviewsHeader}>
          <View>
            <Text style={[styles.sectionSubtitle, { fontSize: scale(13) }]}>Opiniones de Vecinos</Text>
            <Text style={[styles.ratingHighlight, { fontSize: scale(12) }]}>
              ⭐ {service.rating_avg > 0 ? service.rating_avg.toFixed(1) : 'Sin opiniones'} • {service.reviews_count} en total
            </Text>
          </View>
          {!isOwner && !showReviewForm && (
            <TouchableOpacity style={styles.addReviewBtn} onPress={() => setShowReviewForm(true)}>
              <Text style={[styles.addReviewBtnText, { fontSize: scale(11) }]}>+ Opinar</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Formulario para Calificar */}
        {showReviewForm && (
          <View style={styles.reviewFormBox}>
            <Text style={[styles.formLabel, { fontSize: scale(12) }]}>¿Cómo calificarías este servicio?</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)} style={{ padding: 4 }}>
                  <Text style={{ fontSize: 26 }}>{star <= rating ? '⭐' : '☆'}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={[styles.commentInput, { fontSize: scale(12) }]}
              placeholder="Escribe tu recomendación para la comunidad..."
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
                  <Text style={styles.submitReviewBtnText}>Publicar Calificación</Text>
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
                <Text style={{ fontSize: 12 }}>{'⭐'.repeat(rev.rating)}</Text>
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
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8
  },
  backBtnText: {
    color: COLORS.white,
    fontWeight: '600'
  },
  navHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  backPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6
  },
  backPillText: {
    fontWeight: '600',
    color: COLORS.primaryDark
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primarySurface,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ccfbf1'
  },
  categoryBadgeText: {
    fontWeight: '600',
    color: COLORS.primaryDark
  },
  mainCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14
  },
  serviceTitle: {
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 8
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 10
  },
  priceTag: {
    fontWeight: '800',
    color: COLORS.primaryDark,
    marginRight: 6
  },
  priceUnit: {
    color: COLORS.textSecondary,
    marginRight: 10
  },
  statusChip: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#a7f3d0'
  },
  statusChipText: {
    fontSize: 10,
    color: '#065f46',
    fontWeight: '700'
  },
  infoPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 12
  },
  infoPillText: {
    color: '#475569',
    fontWeight: '500'
  },
  separator: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 12
  },
  sectionSubtitle: {
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6
  },
  descriptionText: {
    color: '#334155',
    lineHeight: 20
  },
  providerCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  providerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
    borderWidth: 2,
    borderColor: COLORS.primaryLight
  },
  providerInfo: {
    flex: 1
  },
  vistoBuenoBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 4
  },
  vistoBuenoText: {
    fontSize: 9,
    color: '#92400e',
    fontWeight: '700'
  },
  providerName: {
    fontWeight: '700',
    color: COLORS.text
  },
  providerPhone: {
    color: COLORS.textSecondary,
    marginTop: 2
  },
  providerRating: {
    color: '#854d0e',
    fontWeight: '600',
    marginTop: 2
  },
  actionRow: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9'
  },
  chatButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 11,
    borderRadius: 10
  },
  chatButtonText: {
    color: COLORS.white,
    fontWeight: '700'
  },
  reviewsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  ratingHighlight: {
    color: '#854d0e',
    fontWeight: '600',
    marginTop: 2
  },
  addReviewBtn: {
    backgroundColor: COLORS.primarySurface,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#99f6e4'
  },
  addReviewBtnText: {
    color: COLORS.primaryDark,
    fontWeight: '700'
  },
  reviewFormBox: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    marginBottom: 14
  },
  formLabel: {
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6
  },
  starsRow: {
    flexDirection: 'row',
    marginBottom: 10
  },
  commentInput: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 8,
    textAlignVertical: 'top',
    marginBottom: 10
  },
  formBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6
  },
  cancelBtnText: {
    color: '#64748b',
    fontWeight: '600'
  },
  submitReviewBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6
  },
  submitReviewBtnText: {
    color: COLORS.white,
    fontWeight: '700'
  },
  reviewItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingVertical: 10
  },
  reviewItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  reviewerName: {
    fontWeight: '600',
    color: COLORS.text
  },
  reviewComment: {
    color: '#475569',
    fontStyle: 'italic',
    lineHeight: 18
  },
  emptyReviewsText: {
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 10
  }
});

