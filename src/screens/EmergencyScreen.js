import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert
} from 'react-native';
import { COLORS } from '../theme/colors';
import { api } from '../api/apiClient';

export default function EmergencyScreen({ onNavigate, fontScale = 1.0 }) {
  const [activeEmergency, setActiveEmergency] = useState(null);
  const [volunteers, setVolunteers] = useState([]);
  const [isVolunteering, setIsVolunteering] = useState(false);
  const [selectedType, setSelectedType] = useState('inundacion');

  useEffect(() => {
    loadEmergencyData();
  }, []);

  const loadEmergencyData = async () => {
    try {
      const emg = await api.getActiveEmergency();
      setActiveEmergency(emg);
      const vols = await api.getEmergencyVolunteers();
      setVolunteers(vols || []);
    } catch {
      setActiveEmergency(null);
      setVolunteers([]);
    }
  };

  const scale = (val) => Math.round(val * fontScale);

  const emergencyTypes = [
    { id: 'inundacion', name: 'Inundación / Aniego', sub: 'Ingreso de agua en viviendas', icon: '🌊' },
    { id: 'incendio', name: 'Incendio o Humo', sub: 'Fuego o riesgo eléctrico', icon: '🔥' },
    { id: 'medica', name: 'Emergencia médica', sub: 'Persona que necesita primeros auxilios', icon: '🚑' },
    { id: 'vivienda', name: 'Vivienda afectada', sub: 'Daños estructurales o derrumbe', icon: '🏚️' },
    { id: 'ayuda', name: 'Apoyo urgente', sub: 'Requiere brigada de vecinos', icon: '👥' },
    { id: 'recursos', name: 'Falta de recursos', sub: 'Agua potable, alimentos o medicinas', icon: '📦' }
  ];

  const handleJoinVolunteers = async () => {
    if (isVolunteering) {
      Alert.alert('✅ Ya eres voluntario', 'Ya estás registrado en la brigada de apoyo.');
      return;
    }

    setIsVolunteering(true);
    const newVol = await api.registerEmergencyVolunteer(activeEmergency?.id || 'emg-local', 'Vecino');
    setVolunteers(prev => [...prev, newVol]);

    Alert.alert(
      '🎉 ¡Muchas gracias!',
      'Te has unido a la brigada comunitaria de apoyo para tu manzana.'
    );
  };

  const handleTriggerAlert = async () => {
    const chosen = emergencyTypes.find(t => t.id === selectedType) || emergencyTypes[0];
    const newAlert = await api.reportEmergency({
      title: `${chosen.name} en Manzana 2`,
      desc: chosen.sub,
      type: chosen.name
    });
    setActiveEmergency(newAlert);
    Alert.alert(
      '🚨 ¡Alerta Vecinal Activada!',
      `Se ha enviado la alerta de "${chosen.name}" a los vecinos de tu manzana en Zona A.`
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      
      {/* Cabecera Roja de Emergencia */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => onNavigate('home')} style={{ paddingRight: 6 }}>
            <Text style={{ fontSize: 20, color: COLORS.white }}>❮</Text>
          </TouchableOpacity>
          <View style={styles.headerLeft}>
            <Text style={{ fontSize: 26, marginRight: 8 }}>🚨</Text>
            <View>
              <Text style={[styles.headerTitle, { fontSize: scale(17) }]}>
                Emergencias Comunitarias
              </Text>
              <Text style={[styles.headerSub, { fontSize: scale(11) }]}>
                Centro de Coordinación Vecinal • Zona A
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Alerta Activa si existe */}
      {activeEmergency ? (
        <View style={styles.activeEmergencyBox}>
          <View style={styles.activeEmergencyHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.activeEmergencyTitle, { fontSize: scale(15) }]}>
                🚨 {activeEmergency.title}
              </Text>
              <Text style={[styles.activeEmergencySub, { fontSize: scale(11) }]}>
                {activeEmergency.location || activeEmergency.block_code || 'Zona A – Manzana 2'}
              </Text>
            </View>
            <View style={styles.activeTag}>
              <Text style={styles.activeTagText}>ACTIVA</Text>
            </View>
          </View>

          <Text style={[styles.activeDesc, { fontSize: scale(11) }]}>
            "{activeEmergency.description || 'Alerta vecinal comunitaria en atención.'}"
          </Text>

          {/* Radar */}
          <View style={styles.radarSimulation}>
            <Text style={{ fontSize: 26, marginBottom: 2 }}>📡</Text>
            <Text style={[styles.radarText, { fontSize: scale(11) }]}>
              Alerta transmitida a vecinos de Manzana 2 (Radio 500 m)
            </Text>
          </View>

          {/* Stepper de Coordinación */}
          <View style={styles.stepperBox}>
            <Text style={[styles.stepperTitle, { fontSize: scale(11) }]}>
              ● Estado de la coordinación:
            </Text>
            <View style={styles.stepperRow}>
              <View style={styles.stepItem}>
                <View style={[styles.stepCircle, styles.stepDone]}>
                  <Text style={styles.stepCircleText}>✓</Text>
                </View>
                <Text style={[styles.stepLabel, { fontSize: scale(9) }]}>Reportada</Text>
              </View>
              <View style={styles.stepLineActive} />
              <View style={styles.stepItem}>
                <View style={[styles.stepCircle, styles.stepActive]}>
                  <Text style={styles.stepCircleText}>👥</Text>
                </View>
                <Text style={[styles.stepLabel, { fontSize: scale(9), color: COLORS.emergency }]}>En atención</Text>
              </View>
              <View style={styles.stepLineInactive} />
              <View style={styles.stepItem}>
                <View style={[styles.stepCircle, styles.stepPending]}>
                  <Text style={[styles.stepCircleText, { color: COLORS.textMuted }]}>✓</Text>
                </View>
                <Text style={[styles.stepLabel, { fontSize: scale(9), color: COLORS.textMuted }]}>Atendida</Text>
              </View>
            </View>
          </View>

          {/* Vecinos que están ayudando */}
          {volunteers.length > 0 && (
            <View style={styles.volunteersSection}>
              <Text style={[styles.volunteersTitle, { fontSize: scale(11) }]}>
                ● Vecinos en brigada ({volunteers.length}):
              </Text>
              <View style={styles.volunteersAvatarsRow}>
                {volunteers.map((vol) => (
                  <View key={vol.id} style={styles.volunteerBadge}>
                    <Text style={{ fontSize: 18 }}>{vol.avatar || '👤'}</Text>
                    <Text style={[styles.volunteerBadgeName, { fontSize: scale(9) }]} numberOfLines={1}>
                      {vol.name}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Botón Quiero Ayudar como Voluntario */}
          <TouchableOpacity
            style={[styles.volunteerBtn, isVolunteering && { backgroundColor: COLORS.emerald }]}
            activeOpacity={0.8}
            onPress={handleJoinVolunteers}
          >
            <Text style={[styles.volunteerBtnText, { fontSize: scale(13) }]}>
              {isVolunteering ? '✅ YA ESTÁS EN LA BRIGADA' : '🤝 UNIRME A LA BRIGADA DE APOYO'}
            </Text>
          </TouchableOpacity>

          {/* Botón directo a Economía Solidaria */}
          <TouchableOpacity
            style={styles.ecoSolidariaBtn}
            activeOpacity={0.8}
            onPress={() => onNavigate('eco_solidaria')}
          >
            <Text style={{ fontSize: 18, marginRight: 6 }}>📦</Text>
            <Text style={[styles.ecoSolidariaBtnText, { fontSize: scale(11) }]}>
              Coordinar aportes de recursos (Agua, mantas, etc.) ➔
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.calmBox}>
          <Text style={{ fontSize: 44, marginBottom: 8 }}>🛡️</Text>
          <Text style={[styles.calmTitle, { fontSize: scale(15) }]}>
            Zona Segura: Sin emergencias activas
          </Text>
          <Text style={[styles.calmSub, { fontSize: scale(11) }]}>
            Tu manzana se encuentra en calma. Si observas aniegos, conatos de incendio o emergencias médicas, activa la alarma con los botones abajo.
          </Text>
        </View>
      )}

      {/* Tipos de Emergencias Disponibles */}
      <View style={styles.typesHeader}>
        <Text style={[styles.typesTitle, { fontSize: scale(13) }]}>
          ¿Qué está ocurriendo?
        </Text>
        <Text style={[styles.typesSub, { fontSize: scale(11) }]}>
          Selecciona el tipo de emergencia para alertar a tu manzana en tiempo real.
        </Text>
      </View>

      <View style={styles.typesList}>
        {emergencyTypes.map((item) => {
          const isSelected = selectedType === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.typeItem, isSelected && styles.typeItemActive]}
              activeOpacity={0.8}
              onPress={() => setSelectedType(item.id)}
            >
              <View style={styles.typeItemLeft}>
                <Text style={{ fontSize: 24, marginRight: 10 }}>{item.icon}</Text>
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={[styles.typeItemName, { fontSize: scale(13) }]}>
                      {item.name}
                    </Text>
                    {isSelected && (
                      <View style={styles.activePillSmall}>
                        <Text style={styles.activePillSmallText}>ELEGIDO</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.typeItemSub, { fontSize: scale(10) }]}>
                    {item.sub}
                  </Text>
                </View>
              </View>
              <Text style={styles.typeItemArrow}>›</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Botón para Disparar Alerta */}
      <TouchableOpacity
        style={styles.triggerAlertBtn}
        activeOpacity={0.85}
        onPress={handleTriggerAlert}
      >
        <Text style={[styles.triggerAlertBtnText, { fontSize: scale(14) }]}>
          🚨 ACTIVAR ALERTA EN MI MANZANA
        </Text>
      </TouchableOpacity>

      {/* Números de Emergencia Oficiales (Perú) */}
      <View style={styles.officialHotlinesBox}>
        <Text style={[styles.officialTitle, { fontSize: scale(12) }]}>
          📞 Centrales de Emergencia Oficiales (Perú):
        </Text>
        <View style={styles.hotlinesRow}>
          <View style={styles.hotlinePill}>
            <Text style={styles.hotlinePillText}>🚒 Bomberos: 116</Text>
          </View>
          <View style={styles.hotlinePill}>
            <Text style={styles.hotlinePillText}>👮 Policía: 105</Text>
          </View>
          <View style={styles.hotlinePill}>
            <Text style={styles.hotlinePillText}>🚑 SAMU Médica: 106</Text>
          </View>
          <View style={styles.hotlinePill}>
            <Text style={styles.hotlinePillText}>🛡️ Serenazgo: Central</Text>
          </View>
        </View>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 32 },
  headerCard: {
    backgroundColor: COLORS.emergency,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12
  },
  headerTop: { flexDirection: 'row', alignItems: 'center' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  headerTitle: { color: COLORS.white, fontWeight: '900' },
  headerSub: { color: '#fee2e2', fontWeight: '600' },
  calmBox: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#bbf7d0',
    backgroundColor: '#f0fdf4',
    marginBottom: 16
  },
  calmTitle: { fontWeight: '900', color: '#166534', textAlign: 'center', marginBottom: 6 },
  calmSub: { color: '#15803d', textAlign: 'center', lineHeight: 18 },
  activeEmergencyBox: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 16,
    borderWidth: 2,
    borderColor: COLORS.emergency,
    marginBottom: 16,
    shadowColor: COLORS.emergency,
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3
  },
  activeEmergencyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  activeEmergencyTitle: { fontWeight: '900', color: COLORS.emergencyDark },
  activeEmergencySub: { fontWeight: '700', color: COLORS.textMuted, marginTop: 2 },
  activeTag: {
    backgroundColor: COLORS.emergency,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8
  },
  activeTagText: { color: COLORS.white, fontSize: 10, fontWeight: '900' },
  activeDesc: { color: COLORS.textSecondary, marginBottom: 12, lineHeight: 16 },
  radarSimulation: {
    backgroundColor: '#fef2f2',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#fee2e2'
  },
  radarText: { fontWeight: '700', color: COLORS.emergencyDark },
  stepperBox: { marginBottom: 14 },
  stepperTitle: { fontWeight: '800', color: COLORS.textPrimary, marginBottom: 8 },
  stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepItem: { alignItems: 'center', flex: 1 },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4
  },
  stepDone: { backgroundColor: COLORS.emerald },
  stepActive: { backgroundColor: COLORS.emergency },
  stepPending: { backgroundColor: '#e2e8f0' },
  stepCircleText: { color: COLORS.white, fontWeight: '900', fontSize: 12 },
  stepLabel: { fontWeight: '700', color: COLORS.textSecondary, textAlign: 'center' },
  stepLineActive: { flex: 1, height: 2, backgroundColor: COLORS.emerald, marginBottom: 16 },
  stepLineInactive: { flex: 1, height: 2, backgroundColor: '#cbd5e1', marginBottom: 16 },
  volunteersSection: { marginBottom: 14 },
  volunteersTitle: { fontWeight: '800', color: COLORS.textPrimary, marginBottom: 6 },
  volunteersAvatarsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  volunteerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    gap: 4
  },
  volunteerBadgeName: { fontWeight: '700', color: COLORS.textPrimary },
  volunteerBtn: {
    backgroundColor: COLORS.emergency,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 10
  },
  volunteerBtnText: { color: COLORS.white, fontWeight: '900' },
  ecoSolidariaBtn: {
    backgroundColor: COLORS.primarySurface,
    borderWidth: 1,
    borderColor: COLORS.primaryPale,
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  ecoSolidariaBtnText: { color: COLORS.primaryDeep, fontWeight: '800' },
  typesHeader: { marginBottom: 10 },
  typesTitle: { fontWeight: '900', color: COLORS.textPrimary },
  typesSub: { color: COLORS.textSecondary, marginTop: 2 },
  typesList: { gap: 8, marginBottom: 16 },
  typeItem: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  typeItemActive: { borderColor: COLORS.emergency, backgroundColor: '#fff5f5' },
  typeItemLeft: { flexDirection: 'row', alignItems: 'center' },
  typeItemName: { fontWeight: '900', color: COLORS.textPrimary },
  typeItemSub: { color: COLORS.textSecondary, fontWeight: '600' },
  typeItemArrow: { fontSize: 18, color: COLORS.textMuted, fontWeight: '900' },
  activePillSmall: {
    backgroundColor: COLORS.emergency,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 999,
    marginLeft: 6
  },
  activePillSmallText: { color: COLORS.white, fontSize: 8, fontWeight: '900' },
  triggerAlertBtn: {
    backgroundColor: COLORS.emergencyDark,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: COLORS.emergencyDark,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4
  },
  triggerAlertBtnText: { color: COLORS.white, fontWeight: '900' },
  officialHotlinesBox: {
    backgroundColor: COLORS.emergencySurface,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.emergencyPale
  },
  officialTitle: { fontWeight: '900', color: COLORS.emergencyDark, marginBottom: 8 },
  hotlinesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  hotlinePill: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#fca5a5'
  },
  hotlinePillText: { color: COLORS.emergencyDark, fontWeight: '800', fontSize: 11 }
});
