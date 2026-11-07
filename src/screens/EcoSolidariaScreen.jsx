import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal
} from 'react-native';
import { COLORS } from '../theme/colors';
import { mockEmergencyNeeds } from '../data/mockData';

export default function EcoSolidariaScreen({ onNavigate, fontScale = 1.0, onIncrementHelped, onOpenChat }) {
  const [needs, setNeeds] = useState(mockEmergencyNeeds);
  const [selectedNeed, setSelectedNeed] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [hasContributed, setHasContributed] = useState(false);

  const scale = (val) => Math.round(val * fontScale);

  const openNeedDetail = (need) => {
    setSelectedNeed(need);
    setModalVisible(true);
  };

  const handlePledgeContribution = () => {
    if (hasContributed) {
      Alert.alert('✅ Ya aportaste', 'Ya has registrado tu compromiso de aporte para esta emergencia.');
      return;
    }

    setHasContributed(true);
    setNeeds(prev => prev.map(n => {
      if (n.id === selectedNeed.id) {
        return {
          ...n,
          quantity_committed: n.quantity_committed + 2
        };
      }
      return n;
    }));

    if (selectedNeed) {
      setSelectedNeed(prev => ({
        ...prev,
        quantity_committed: prev.quantity_committed + 2
      }));
    }

    onIncrementHelped();

    Alert.alert(
      '🎉 ¡Aporte Registrado!',
      `Has comprometido 2 ${selectedNeed.unit} de ${selectedNeed.resource_name} para las familias de Manzana 2.\nPunto de acopio: Casa Comunal Manzana 2.`
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      
      {/* Cabecera Roja de Economía Solidaria en Emergencia */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => onNavigate('solidarity')} style={{ paddingRight: 6 }}>
              <Text style={{ fontSize: 20, color: COLORS.white }}>❮</Text>
            </TouchableOpacity>
            <View style={styles.sirenCircle}>
              <Text style={{ fontSize: 18 }}>🚨</Text>
            </View>
            <View>
              <Text style={[styles.headerTitle, { fontSize: scale(15) }]}>
                Economía Solidaria
              </Text>
              <Text style={[styles.headerSub, { fontSize: scale(10) }]}>
                Apoyo en Emergencia
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.homeBtn}
            onPress={() => onNavigate('home')}
          >
            <Text style={{ fontSize: 13, marginRight: 2 }}>🏠</Text>
            <Text style={[styles.homeBtnText, { fontSize: scale(10) }]}>Inicio</Text>
          </TouchableOpacity>
        </View>

        {/* SUB-TABS INTERACTIVOS */}
        <View style={styles.subtabsContainer}>
          <TouchableOpacity
            style={[styles.subtabButton, styles.subtabInactive]}
            onPress={() => onNavigate('solidarity')}
          >
            <Text style={[styles.subtabText, styles.subtabTextInactive, { fontSize: scale(11) }]}>
              📋 Muro de Ayuda
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.subtabButton, styles.subtabActive]}
          >
            <Text style={[styles.subtabText, styles.subtabTextActive, { fontSize: scale(11) }]}>
              🚨 Economía Solidaria
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tarjeta de Emergencia Activa */}
      <View style={styles.alertCard}>
        <View style={{ flex: 1 }}>
          <View style={styles.alertTagRow}>
            <Text style={{ fontSize: 12, marginRight: 4 }}>⚠️</Text>
            <Text style={[styles.alertTagText, { fontSize: scale(10) }]}>
              EMERGENCIA ACTIVA
            </Text>
          </View>
          <Text style={[styles.alertTitle, { fontSize: scale(14) }]}>
            Inundación en Zona A
          </Text>
          <Text style={[styles.alertSub, { fontSize: scale(10) }]}>
            Manzana 2 • Coordinación urgente de recursos
          </Text>
        </View>
        <Text style={{ fontSize: 36 }}>🏠🌊</Text>
      </View>

      {/* Dos Grandes Botones de Acción */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.actionBtnNeed}
          onPress={() => Alert.alert('Solicitud de Emergencia', 'Describe el recurso urgente que le falta a tu familia en Manzana 2.')}
        >
          <View style={styles.btnPlusCircle}>
            <Text style={styles.btnPlusText}>+</Text>
          </View>
          <Text style={[styles.actionBtnTitle, { fontSize: scale(12) }]}>Se necesita</Text>
          <Text style={[styles.actionBtnSub, { fontSize: scale(9) }]}>Solicita recursos urgentes</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtnOffer}
          onPress={() => Alert.alert('Ofrecer Recursos', 'Registra los víveres, agua o mantas que puedes donar o prestar para la emergencia.')}
        >
          <View style={styles.btnHandsCircle}>
            <Text style={styles.btnHandsText}>🤝</Text>
          </View>
          <Text style={[styles.actionBtnTitle, { fontSize: scale(12) }]}>Puedo aportar</Text>
          <Text style={[styles.actionBtnSub, { fontSize: scale(9) }]}>Ofrece ayuda o recursos</Text>
        </TouchableOpacity>
      </View>

      {/* Sección: Necesidades de la zona (3) */}
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionTitle, { fontSize: scale(13) }]}>
          NECESIDADES DE LA ZONA ({needs.length})
        </Text>
        <View style={styles.priorityBadge}>
          <Text style={styles.priorityBadgeText}>Prioridad Alta</Text>
        </View>
      </View>

      {/* Lista de Recursos con Barras de Progreso Vivas */}
      {needs.map((item) => {
        const missing = Math.max(0, item.quantity_required - item.quantity_committed);
        const percent = Math.min(100, Math.round((item.quantity_committed / item.quantity_required) * 100));

        return (
          <TouchableOpacity
            key={item.id}
            style={styles.needCard}
            activeOpacity={0.85}
            onPress={() => openNeedDetail(item)}
          >
            <View style={styles.needCardHeader}>
              <View style={styles.needLeft}>
                <View style={styles.needIconCircle}>
                  <Text style={{ fontSize: 22 }}>{item.icon}</Text>
                </View>
                <View>
                  <Text style={[styles.needTitle, { fontSize: scale(13) }]}>
                    {item.resource_name}
                  </Text>
                  <Text style={[styles.needSub, { fontSize: scale(10) }]}>
                    Se necesitan {item.quantity_required} {item.unit}
                  </Text>
                </View>
              </View>

              <View style={styles.missingBadge}>
                <Text style={[styles.missingBadgeText, { fontSize: scale(10) }]}>
                  Faltan {missing}
                </Text>
                <Text style={styles.needArrow}>›</Text>
              </View>
            </View>

            {/* Barra de Progreso */}
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${percent}%` }]} />
            </View>
            <View style={styles.progressInfoRow}>
              <Text style={[styles.progressInfoText, { fontSize: scale(10) }]}>
                {item.quantity_committed} de {item.quantity_required} comprometidas ({percent}%)
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}

      {/* Botón Inferior: 3 vecinos ya están ayudando */}
      <TouchableOpacity
        style={styles.volunteersBanner}
        onPress={() => onNavigate('emergency')}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 20, marginRight: 8 }}>👥</Text>
          <Text style={[styles.volunteersBannerText, { fontSize: scale(12) }]}>
            4 vecinos ya están coordinando en terreno
          </Text>
        </View>
        <Text style={styles.volunteersBannerArrow}>›</Text>
      </TouchableOpacity>

      {/* Modal de Detalle de Necesidad */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { fontSize: scale(16) }]}>
                Detalle de Necesidad
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={{ fontSize: 20, color: COLORS.textMuted }}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedNeed && (
              <View style={styles.modalBody}>
                <View style={styles.modalItemHeader}>
                  <Text style={{ fontSize: 36, marginRight: 10 }}>{selectedNeed.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.modalItemTitle, { fontSize: scale(16) }]}>
                      {selectedNeed.resource_name}
                    </Text>
                    <Text style={[styles.modalItemSub, { fontSize: scale(11) }]}>
                      Se requieren {selectedNeed.quantity_required} {selectedNeed.unit} para damnificados.
                    </Text>
                  </View>
                  <View style={styles.missingBadgeLarge}>
                    <Text style={styles.missingBadgeLargeText}>
                      Faltan {Math.max(0, selectedNeed.quantity_required - selectedNeed.quantity_committed)}
                    </Text>
                  </View>
                </View>

                {/* Barra de Progreso Grande */}
                <View style={styles.progressBarTrackLarge}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${Math.min(100, Math.round((selectedNeed.quantity_committed / selectedNeed.quantity_required) * 100))}%` }
                    ]}
                  />
                </View>
                <Text style={[styles.modalProgressLabel, { fontSize: scale(11) }]}>
                  {selectedNeed.quantity_committed} de {selectedNeed.quantity_required} {selectedNeed.unit} comprometidas
                </Text>

                <View style={styles.volunteersList}>
                  <Text style={[styles.volunteersListTitle, { fontSize: scale(11) }]}>
                    👥 Vecinos que ya aportaron (2):
                  </Text>
                  <View style={styles.volunteerRow}>
                    <Text style={{ fontSize: 18, marginRight: 6 }}>👨‍🔧</Text>
                    <Text style={[styles.volunteerName, { fontSize: scale(11) }]}>Luis G. • Disponible</Text>
                  </View>
                  <View style={styles.volunteerRow}>
                    <Text style={{ fontSize: 18, marginRight: 6 }}>👵</Text>
                    <Text style={[styles.volunteerName, { fontSize: scale(11) }]}>María C. • Disponible</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.modalPledgeBtn, hasContributed && { backgroundColor: COLORS.primaryDark }]}
                  activeOpacity={0.8}
                  onPress={handlePledgeContribution}
                >
                  <Text style={[styles.modalPledgeBtnText, { fontSize: scale(14) }]}>
                    {hasContributed ? '✅ APORTE CONFIRMADO (+2)' : `🤝 QUIERO APORTAR 2 ${selectedNeed.unit.toUpperCase()}`}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalSendMsgBtn}
                  activeOpacity={0.8}
                  onPress={() => {
                    setModalVisible(false);
                    if (onOpenChat) {
                      onOpenChat({
                        name: 'Luis G.',
                        topic: `Aporte: ${selectedNeed.resource_name}`,
                        avatar: '👨',
                        zone: 'Zona A - Manzana 2',
                        badge: 'Voluntario Brigada'
                      });
                    } else {
                      onNavigate('chat');
                    }
                  }}
                >
                  <Text style={[styles.modalSendMsgBtnText, { fontSize: scale(13) }]}>
                    💬 Enviar mensaje
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 90 },
  headerCard: {
    backgroundColor: COLORS.emergency,
    borderRadius: 22,
    padding: 16,
    marginBottom: 12,
    shadowColor: COLORS.emergencyDark,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  sirenCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8
  },
  headerTitle: { fontWeight: '900', color: COLORS.white },
  headerSub: { fontWeight: '600', color: COLORS.emergencyPale },
  homeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10
  },
  homeBtnText: { color: COLORS.white, fontWeight: '900' },
  subtabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 14,
    padding: 4
  },
  subtabButton: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  subtabActive: { backgroundColor: COLORS.white },
  subtabInactive: { backgroundColor: 'transparent' },
  subtabText: { fontWeight: '800' },
  subtabTextActive: { color: COLORS.emergency },
  subtabTextInactive: { color: COLORS.white },
  alertCard: {
    backgroundColor: '#fff1f2',
    borderWidth: 1.5,
    borderColor: '#fecdd3',
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  alertTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2
  },
  alertTagText: {
    color: COLORS.emergency,
    fontWeight: '900'
  },
  alertTitle: {
    fontWeight: '900',
    color: COLORS.textPrimary
  },
  alertSub: {
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 2
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16
  },
  actionBtnNeed: {
    flex: 1,
    backgroundColor: '#fff1f2',
    borderWidth: 1.5,
    borderColor: '#fecdd3',
    borderRadius: 18,
    padding: 14,
    alignItems: 'center'
  },
  btnPlusCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.emergency,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6
  },
  btnPlusText: { color: COLORS.white, fontSize: 20, fontWeight: '900' },
  actionBtnOffer: {
    flex: 1,
    backgroundColor: '#ecfdf5',
    borderWidth: 1.5,
    borderColor: '#a7f3d0',
    borderRadius: 18,
    padding: 14,
    alignItems: 'center'
  },
  btnHandsCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.emerald,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6
  },
  btnHandsText: { fontSize: 18 },
  actionBtnTitle: { fontWeight: '900', color: COLORS.textPrimary },
  actionBtnSub: { fontWeight: '600', color: COLORS.textSecondary, marginTop: 2 },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  sectionTitle: {
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: 0.5
  },
  priorityBadge: {
    backgroundColor: COLORS.emergencyPale,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999
  },
  priorityBadgeText: {
    color: COLORS.emergency,
    fontSize: 10,
    fontWeight: '900'
  },
  needCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2
  },
  needCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  needLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  needIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  needTitle: { fontWeight: '900', color: COLORS.textPrimary },
  needSub: { fontWeight: '600', color: COLORS.textSecondary, marginTop: 2 },
  missingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.amberPale,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999
  },
  missingBadgeText: { color: '#b45309', fontWeight: '900' },
  needArrow: { fontSize: 16, color: COLORS.textMuted, marginLeft: 4, fontWeight: '900' },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 999,
    overflow: 'hidden',
    marginVertical: 4
  },
  progressBarFill: {
    height: 6,
    backgroundColor: COLORS.emerald,
    borderRadius: 999
  },
  progressInfoRow: {
    marginTop: 2
  },
  progressInfoText: {
    color: COLORS.textSecondary,
    fontWeight: '700'
  },
  volunteersBanner: {
    backgroundColor: COLORS.purplePale,
    borderWidth: 1,
    borderColor: '#e9d5ff',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6
  },
  volunteersBannerText: {
    color: COLORS.purple,
    fontWeight: '800'
  },
  volunteersBannerArrow: {
    fontSize: 18,
    color: COLORS.purple,
    fontWeight: '900'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 20,
    maxHeight: '85%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14
  },
  modalTitle: { fontWeight: '900', color: COLORS.textPrimary },
  modalBody: { gap: 10 },
  modalItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  modalItemTitle: { fontWeight: '900', color: COLORS.textPrimary },
  modalItemSub: { fontWeight: '600', color: COLORS.textSecondary, marginTop: 2 },
  missingBadgeLarge: {
    backgroundColor: COLORS.amberPale,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999
  },
  missingBadgeLargeText: { color: '#b45309', fontWeight: '900', fontSize: 11 },
  progressBarTrackLarge: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 999,
    overflow: 'hidden'
  },
  modalProgressLabel: { fontWeight: '700', color: COLORS.textSecondary },
  volunteersList: {
    backgroundColor: COLORS.background,
    padding: 10,
    borderRadius: 14,
    gap: 6
  },
  volunteersListTitle: { fontWeight: '800', color: COLORS.textPrimary },
  volunteerRow: { flexDirection: 'row', alignItems: 'center' },
  volunteerName: { fontWeight: '700', color: COLORS.textSecondary },
  modalPledgeBtn: {
    backgroundColor: COLORS.emerald,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 6
  },
  modalPledgeBtnText: { color: COLORS.white, fontWeight: '900' },
  modalSendMsgBtn: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6
  },
  modalSendMsgBtnText: {
    color: COLORS.primaryDark,
    fontWeight: '800'
  }
});
