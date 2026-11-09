import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { api } from '../services/api';

export default function NotificationsModal({
  visible,
  onClose,
  token,
  fontScale = 1.0,
  onViewEmergency,
  activeEmergency = null
}) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const scale = (val) => Math.round(val * fontScale);

  useEffect(() => {
    if (!visible) return;

    let active = true;
    async function loadNotifs() {
      setLoading(true);
      try {
        let items = [];
        if (token) {
          const res = await api.getNotifications(token);
          if (Array.isArray(res)) items = res;
        }

        // Si hay una emergencia activa y no está en la lista, anteponerla
        if (activeEmergency) {
          const exists = items.some(
            (n) => (n.title && n.title.includes(activeEmergency.title)) || n.id === activeEmergency.id
          );
          if (!exists) {
            items.unshift({
              id: 'notif-emg-' + (activeEmergency.id || Date.now()),
              emergency_id: activeEmergency.id,
              rawEmergency: activeEmergency,
              title: `🚨 ALERTA COMUNITARIA: ${activeEmergency.title || 'Emergencia en Manzana 2'}`,
              body: activeEmergency.description || 'Alerta activa en tu manzana. Se requiere apoyo vecinal.',
              notification_type: 'emergency_alert',
              is_read: false,
              time: 'Ahora'
            });
          }
        }

        if (active) {
          setNotifications(items);
        }
      } catch (e) {
        console.warn('[NotificationsModal] Error cargando notificaciones:', e);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadNotifs();

    return () => {
      active = false;
    };
  }, [visible, token, activeEmergency]);

  const handleItemPress = (notif) => {
    if (token && notif.id && !String(notif.id).startsWith('notif-emg-')) {
      api.markNotificationAsRead(notif.id, token).catch(() => {});
    }
    onClose();
    if (onViewEmergency) {
      onViewEmergency(notif);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Cabecera del Modal */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={styles.iconCircle}>
                <Ionicons name="notifications" size={18} color="#059669" />
              </View>
              <View>
                <Text style={[styles.headerTitle, { fontSize: scale(15) }]}>
                  Alertas y Notificaciones
                </Text>
                <Text style={[styles.headerSub, { fontSize: scale(10) }]}>
                  Avisos vecinales y emergencias en tu comunidad
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Contenido */}
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color="#059669" />
              <Text style={[styles.loadingText, { fontSize: scale(11) }]}>
                Cargando avisos de la comunidad...
              </Text>
            </View>
          ) : notifications.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={{ fontSize: 36, marginBottom: 8 }}>✅</Text>
              <Text style={[styles.emptyTitle, { fontSize: scale(13) }]}>
                Tu manzana se encuentra en calma
              </Text>
              <Text style={[styles.emptySub, { fontSize: scale(11) }]}>
                No hay emergencias ni avisos urgentes en este momento. Si ocurre algo en tu calle, recibirás la alerta aquí.
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
              {notifications.map((notif) => {
                const isEmergency = notif.notification_type === 'emergency_alert';
                return (
                  <TouchableOpacity
                    key={notif.id}
                    style={[
                      styles.notifCard,
                      isEmergency && styles.notifCardEmergency,
                      !notif.is_read && styles.notifCardUnread
                    ]}
                    activeOpacity={0.85}
                    onPress={() => handleItemPress(notif)}
                  >
                    <View style={styles.notifIconCircle}>
                      <Text style={{ fontSize: 20 }}>{isEmergency ? '🚨' : '📢'}</Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Text style={[styles.notifTitle, { fontSize: scale(12) }]} numberOfLines={2}>
                          {notif.title}
                        </Text>
                        <Text style={[styles.notifTime, { fontSize: scale(9) }]}>
                          {notif.time || 'Ahora'}
                        </Text>
                      </View>

                      {notif.body ? (
                        <Text style={[styles.notifBody, { fontSize: scale(11) }]} numberOfLines={3}>
                          {notif.body}
                        </Text>
                      ) : null}

                      {isEmergency && (
                        <View style={styles.emergencyActionRow}>
                          <Text style={[styles.emergencyActionText, { fontSize: scale(10) }]}>
                            Toca para acudir al auxilio ›
                          </Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {/* Pie de modal */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.footerBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={[styles.footerBtnText, { fontSize: scale(12) }]}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    width: '100%',
    maxWidth: 480,
    maxHeight: '80%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#ffffff'
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerTitle: {
    fontWeight: '900',
    color: COLORS.primaryDark
  },
  headerSub: {
    color: COLORS.textMuted,
    fontWeight: '500'
  },
  closeBtn: {
    padding: 6,
    borderRadius: 14,
    backgroundColor: '#f8fafc'
  },
  loadingBox: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10
  },
  loadingText: {
    color: COLORS.textMuted,
    fontWeight: '600'
  },
  emptyBox: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyTitle: {
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 6,
    textAlign: 'center'
  },
  emptySub: {
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18
  },
  list: {
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  notifCard: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 10
  },
  notifCardEmergency: {
    backgroundColor: '#fff1f2',
    borderColor: '#fecdd3'
  },
  notifCardUnread: {
    borderLeftWidth: 4,
    borderLeftColor: '#dc2626'
  },
  notifIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center'
  },
  notifTitle: {
    fontWeight: '800',
    color: '#0f172a',
    flex: 1,
    marginRight: 6
  },
  notifTime: {
    color: COLORS.textMuted,
    fontWeight: '600'
  },
  notifBody: {
    color: '#334155',
    marginTop: 4,
    lineHeight: 17
  },
  emergencyActionRow: {
    marginTop: 6
  },
  emergencyActionText: {
    color: '#dc2626',
    fontWeight: '800'
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#ffffff',
    alignItems: 'flex-end'
  },
  footerBtn: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10
  },
  footerBtnText: {
    fontWeight: '700',
    color: COLORS.primaryDark
  }
});
