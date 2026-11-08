import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { COLORS } from '../theme/colors';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function MyServicesScreen({ onNavigate, fontScale = 1.0 }) {
  const { session } = useAuth();
  const token = session?.access_token || null;

  const [myServices, setMyServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const scale = (val) => Math.round(val * fontScale);

  useEffect(() => {
    loadMyServices();
  }, [token]);

  const loadMyServices = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await api.getMyServices({ page: 1, limit: 50 }, token);
      setMyServices(res.items || []);
    } catch (err) {
      console.warn('[MyServicesScreen] Error al cargar mis servicios:', err);
      Alert.alert('Error', 'No fue posible cargar tus servicios publicados.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (service) => {
    const nextStatus = service.status === 'active' ? 'paused' : 'active';
    const actionLabel = nextStatus === 'paused' ? 'pausar' : 'reactivar';

    Alert.alert(
      `¿Deseas ${actionLabel} este servicio?`,
      nextStatus === 'paused'
        ? 'El servicio no aparecerá en las búsquedas públicas mientras esté pausado.'
        : 'El servicio volverá a estar visible inmediatamente para tus vecinos.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              setUpdatingId(service.id);
              await api.updateServiceStatus(service.id, nextStatus, token);
              await loadMyServices();
            } catch (err) {
              Alert.alert('Error', err.message || 'No fue posible cambiar el estado.');
            } finally {
              setUpdatingId(null);
            }
          }
        }
      ]
    );
  };

  const handleDelete = (service) => {
    Alert.alert(
      '¿Eliminar publicación?',
      `Esta acción dará de baja "${service.title}".`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setUpdatingId(service.id);
              await api.deleteService(service.id, token);
              await loadMyServices();
            } catch (err) {
              Alert.alert('Error', err.message || 'No fue posible eliminar el servicio.');
            } finally {
              setUpdatingId(null);
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
        <Text style={[styles.loadingText, { fontSize: scale(13) }]}>Cargando tus publicaciones...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Cabecera */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backPill} onPress={() => onNavigate('services')}>
          <Text style={{ fontSize: 16, color: COLORS.primaryDark }}>❮</Text>
          <Text style={[styles.backPillText, { fontSize: scale(12) }]}>Volver a servicios</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.newServiceBtn} onPress={() => onNavigate('publish')}>
          <Text style={[styles.newServiceBtnText, { fontSize: scale(11) }]}>+ Publicar nuevo</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.pageTitle, { fontSize: scale(17) }]}>Mis Servicios Publicados</Text>
      <Text style={[styles.pageSubtitle, { fontSize: scale(12) }]}>
        Administra tus oficios, cambia su disponibilidad o actualiza tus tarifas.
      </Text>

      {/* Lista de Servicios */}
      {myServices.length > 0 ? (
        myServices.map((svc) => {
          const isPaused = svc.status === 'paused';
          const isProcessing = updatingId === svc.id;

          return (
            <View key={svc.id} style={[styles.serviceCard, isPaused && styles.serviceCardPaused]}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.serviceTitle, { fontSize: scale(14) }]}>{svc.title}</Text>
                  <Text style={[styles.categoryText, { fontSize: scale(11) }]}>
                    {svc.category_icon || '🏷️'} {svc.category_name}
                  </Text>
                </View>
                <View style={[styles.statusBadge, isPaused ? styles.statusBadgePaused : styles.statusBadgeActive]}>
                  <Text style={[styles.statusBadgeText, isPaused ? styles.statusTextPaused : styles.statusTextActive]}>
                    {isPaused ? 'Pausado' : 'Activo'}
                  </Text>
                </View>
              </View>

              <Text style={[styles.priceText, { fontSize: scale(13) }]}>
                S/ {svc.price_from != null ? Number(svc.price_from).toFixed(2) : 'A convenir'} ({svc.price_unit || 'servicio'})
              </Text>

              {svc.availability && (
                <Text style={[styles.availabilityText, { fontSize: scale(11) }]}>
                  🕒 {svc.availability}
                </Text>
              )}

              <Text style={[styles.ratingRow, { fontSize: scale(11) }]}>
                ⭐ {svc.rating_avg > 0 ? svc.rating_avg.toFixed(1) : 'Nuevo'} ({svc.reviews_count} opiniones)
              </Text>

              {/* Botones de Acción */}
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.detailBtn}
                  onPress={() => onNavigate('service_detail', { serviceId: svc.id })}
                >
                  <Text style={[styles.detailBtnText, { fontSize: scale(11) }]}>Ver ficha</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.toggleBtn, isPaused ? styles.toggleBtnResume : styles.toggleBtnPause]}
                  onPress={() => handleToggleStatus(svc)}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={[styles.toggleBtnText, { fontSize: scale(11) }]}>
                      {isPaused ? '▶ Reactivar' : '⏸ Pausar'}
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(svc)}
                  disabled={isProcessing}
                >
                  <Text style={[styles.deleteBtnText, { fontSize: scale(11) }]}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      ) : (
        <View style={styles.emptyCard}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>🛠️</Text>
          <Text style={[styles.emptyTitle, { fontSize: scale(15) }]}>Aún no has publicado servicios</Text>
          <Text style={[styles.emptySubtitle, { fontSize: scale(12) }]}>
            Comparte tus habilidades con los vecinos de tu barrio (gasfitería, electricidad, clases, etc.) y genera ingresos locales.
          </Text>
          <TouchableOpacity style={styles.publishFirstBtn} onPress={() => onNavigate('publish')}>
            <Text style={styles.publishFirstBtnText}>Publicar mi primer servicio</Text>
          </TouchableOpacity>
        </View>
      )}
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
    padding: 24
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.textSecondary,
    fontWeight: '500'
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14
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
  newServiceBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14
  },
  newServiceBtnText: {
    color: COLORS.white,
    fontWeight: '700'
  },
  pageTitle: {
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4
  },
  pageSubtitle: {
    color: COLORS.textSecondary,
    marginBottom: 16
  },
  serviceCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12
  },
  serviceCardPaused: {
    backgroundColor: '#f8fafc',
    borderColor: '#cbd5e1'
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6
  },
  serviceTitle: {
    fontWeight: '700',
    color: COLORS.text
  },
  categoryText: {
    color: COLORS.textSecondary,
    marginTop: 2
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  statusBadgeActive: {
    backgroundColor: '#ecfdf5'
  },
  statusBadgePaused: {
    backgroundColor: '#f1f5f9'
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700'
  },
  statusTextActive: {
    color: '#065f46'
  },
  statusTextPaused: {
    color: '#64748b'
  },
  priceText: {
    fontWeight: '700',
    color: COLORS.primaryDark,
    marginBottom: 4
  },
  availabilityText: {
    color: '#475569',
    marginBottom: 4
  },
  ratingRow: {
    color: '#854d0e',
    fontWeight: '600',
    marginBottom: 10
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10
  },
  detailBtn: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8
  },
  detailBtnText: {
    color: '#334155',
    fontWeight: '600'
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8
  },
  toggleBtnPause: {
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa'
  },
  toggleBtnResume: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0'
  },
  toggleBtnText: {
    fontWeight: '600',
    color: '#334155'
  },
  deleteBtn: {
    backgroundColor: '#fef2f2',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca'
  },
  deleteBtnText: {
    fontSize: 14
  },
  emptyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 20
  },
  emptyTitle: {
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8
  },
  emptySubtitle: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 18,
    lineHeight: 18
  },
  publishFirstBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 11,
    paddingHorizontal: 20,
    borderRadius: 10
  },
  publishFirstBtnText: {
    color: COLORS.white,
    fontWeight: '700'
  }
});

