import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert
} from 'react-native';
import { COLORS } from '../theme/colors';
import { mockEmergency, mockVolunteers } from '../data/mockData';

export default function EmergencyScreen({ onNavigate, fontScale = 1.0 }) {
  const [volunteers, setVolunteers] = useState(mockVolunteers);
  const [isVolunteering, setIsVolunteering] = useState(false);

  const scale = (val) => Math.round(val * fontScale);

  const emergencyTypes = [
    { id: 'inundacion', name: 'Inundación', sub: 'Ingreso de agua o aniegos', icon: '🌊', active: true },
    { id: 'incendio', name: 'Incendio', sub: 'Fuego o humo en la zona', icon: '🔥', active: false },
    { id: 'medica', name: 'Emergencia médica', sub: 'Persona que necesita atención', icon: '🚑', active: false },
    { id: 'vivienda', name: 'Vivienda afectada', sub: 'Daños, derrumbe o riesgo', icon: '🏚️', active: false },
    { id: 'ayuda', name: 'Necesito ayuda', sub: 'Requiere apoyo de vecinos', icon: '👥', active: false },
    { id: 'recursos', name: 'Falta de recursos', sub: 'Agua, alimentos o materiales', icon: '📦', active: false }
  ];

  const handleJoinVolunteers = () => {
    if (isVolunteering) {
      Alert.alert('✅ Ya eres voluntaria', 'Ya estás registrada en la brigada de apoyo para Manzana 2.');
      return;
    }

    setIsVolunteering(true);
    setVolunteers(prev => [
      ...prev,
      { id: 'vol-user', name: 'Tú (Doña Martha)', avatar: '👵', status: 'En camino' }
    ]);

    Alert.alert(
      '🎉 ¡Gracias Doña Martha!',
      'Te has unido a la brigada comunitaria de apoyo para la inundación en Manzana 2.'
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
            <Text style={{ fontSize: 24, marginRight: 8 }}>🚨</Text>
            <View>
              <Text style={[styles.headerTitle, { fontSize: scale(16) }]}>
                Emergencias
              </Text>
              <Text style={[styles.headerSub, { fontSize: scale(11) }]}>
                Centro de Apoyo Vecinal
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Alerta Activa Detallada (Inundación Manzana 2) */}
      <View style={styles.activeEmergencyBox}>
        <View style={styles.activeEmergencyHeader}>
          <View>
            <Text style={[styles.activeEmergencyTitle, { fontSize: scale(15) }]}>
              🌊 {mockEmergency.title}
            </Text>
            <Text style={[styles.activeEmergencySub, { fontSize: scale(11) }]}>
              {mockEmergency.block_code}
            </Text>
          </View>
          <View style={styles.activeTag}>
            <Text style={styles.activeTagText}>ACTIVA</Text>
          </View>
        </View>

        <Text style={[styles.activeDesc, { fontSize: scale(11) }]}>
          "{mockEmergency.description}"
        </Text>

        {/* Radar 500m */}
        <View style={styles.radarSimulation}>
          <Text style={{ fontSize: 26, marginBottom: 2 }}>📡</Text>
          <Text style={[styles.radarText, { fontSize: scale(11) }]}>
            Alerta para vecinos cercanos ({mockEmergency.radius_m} m)
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
              <Text style={[styles.stepLabel, { fontSize: scale(9) }]}>Reportada (9:10 am)</Text>
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
        <View style={styles.volunteersSection}>
          <Text style={[styles.volunteersTitle, { fontSize: scale(11) }]}>
            ● Vecinos que están ayudando ({volunteers.length}):
          </Text>
          <View style={styles.volunteersAvatarsRow}>
            {volunteers.map((vol) => (
              <View key={vol.id} style={styles.volunteerBadge}>
                <Text style={{ fontSize: 18 }}>{vol.avatar}</Text>
                <Text style={[styles.volunteerBadgeName, { fontSize: scale(9) }]} numberOfLines={1}>
                  {vol.name}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Botón Quiero Ayudar como Voluntario */}
        <TouchableOpacity
          style={[styles.volunteerBtn, isVolunteering && { backgroundColor: COLORS.emerald }]}
          activeOpacity={0.8}
          onPress={handleJoinVolunteers}
        >
          <Text style={[styles.volunteerBtnText, { fontSize: scale(13) }]}>
            {isVolunteering ? '✅ YA ESTÁS EN LA BRIGADA' : '🤝 QUIERO AYUDAR COMO VOLUNTARIO'}
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
            Aportar recursos en Economía Solidaria (Agua, mantas) ➔
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tipos de Emergencias Disponibles */}
      <View style={styles.typesHeader}>
        <Text style={[styles.typesTitle, { fontSize: scale(13) }]}>
          ¿Qué está ocurriendo?
        </Text>
        <Text style={[styles.typesSub, { fontSize: scale(11) }]}>
          Selecciona el tipo de emergencia para alertar a tu manzana.
        </Text>
      </View>

      <View style={styles.typesList}>
        {emergencyTypes.map((type) => (
          <TouchableOpacity
            key={type.id}
            style={[styles.typeItem, type.active && styles.typeItemActive]}
            activeOpacity={0.8}
            onPress={() => {
              if (type.id === 'inundacion') {
                Alert.alert('Alerta de Inundación', 'Esta emergencia ya se encuentra activa en Manzana 2.');
              } else {
                Alert.alert(`🚨 Alerta de ${type.name}`, `¿Deseas emitir una alerta comunitaria por ${type.name} a los vecinos de Manzana 2?`);
              }
            }}
          >
            <View style={styles.typeItemLeft}>
              <Text style={{ fontSize: 24, marginRight: 10 }}>{type.icon}</Text>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={[styles.typeItemName, { fontSize: scale(12) }]}>
                    {type.name}
                  </Text>
                  {type.active && (
                    <View style={styles.activePillSmall}>
                      <Text style={styles.activePillSmallText}>ACTIVA</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.typeItemSub, { fontSize: scale(10) }]}>
                  {type.sub}
                </Text>
              </View>
            </View>
            <Text style={styles.typeItemArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Teléfonos de Emergencias Oficiales */}
      <View style={styles.officialHotlinesBox}>
        <Text style={[styles.officialTitle, { fontSize: scale(12) }]}>
          📞 Llamar a emergencias oficiales:
        </Text>
        <View style={styles.hotlinesRow}>
          <TouchableOpacity
            style={styles.hotlinePill}
            onPress={() => Alert.alert('Llamada de Emergencia', 'Marcando al 116 (Bomberos del Perú)...')}
          >
            <Text style={styles.hotlinePillText}>🚒 Bomberos (116)</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.hotlinePill}
            onPress={() => Alert.alert('Llamada de Emergencia', 'Marcando al 105 (Policía Nacional)...')}
          >
            <Text style={styles.hotlinePillText}>👮 Policía (105)</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.hotlinePill}
            onPress={() => Alert.alert('Llamada de Emergencia', 'Marcando al 106 (SAMU Ambulancias)...')}
          >
            <Text style={styles.hotlinePillText}>🚑 SAMU (106)</Text>
          </TouchableOpacity>
        </View>
      </View>

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
    alignItems: 'center'
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  headerTitle: { fontWeight: '900', color: COLORS.white },
  headerSub: { fontWeight: '600', color: COLORS.emergencyPale },
  activeEmergencyBox: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    padding: 16,
    borderWidth: 2,
    borderColor: COLORS.emergency,
    marginBottom: 14,
    shadowColor: COLORS.emergency,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3
  },
  activeEmergencyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  activeEmergencyTitle: {
    fontWeight: '900',
    color: COLORS.textPrimary
  },
  activeEmergencySub: {
    fontWeight: '700',
    color: COLORS.textSecondary
  },
  activeTag: {
    backgroundColor: COLORS.emergency,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999
  },
  activeTagText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '900'
  },
  activeDesc: {
    backgroundColor: COLORS.emergencySurface,
    padding: 10,
    borderRadius: 12,
    color: COLORS.emergencyDark,
    lineHeight: 16,
    fontStyle: 'italic',
    marginVertical: 8
  },
  radarSimulation: {
    backgroundColor: '#eff6ff',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#bfdbfe'
  },
  radarText: {
    color: '#1d4ed8',
    fontWeight: '800'
  },
  stepperBox: {
    backgroundColor: COLORS.background,
    padding: 10,
    borderRadius: 14,
    marginBottom: 10
  },
  stepperTitle: {
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 8
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  stepItem: {
    alignItems: 'center',
    width: 75
  },
  stepCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4
  },
  stepDone: { backgroundColor: COLORS.emerald },
  stepActive: { backgroundColor: COLORS.emergency },
  stepPending: { backgroundColor: COLORS.border },
  stepCircleText: { color: COLORS.white, fontSize: 11, fontWeight: '900' },
  stepLabel: { fontWeight: '700', textAlign: 'center' },
  stepLineActive: { flex: 1, height: 2, backgroundColor: COLORS.emerald, marginBottom: 12 },
  stepLineInactive: { flex: 1, height: 2, backgroundColor: COLORS.border, marginBottom: 12 },
  volunteersSection: {
    marginBottom: 12
  },
  volunteersTitle: {
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 6
  },
  volunteersAvatarsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  volunteerBadge: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border
  },
  volunteerBadgeName: {
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginLeft: 4
  },
  volunteerBtn: {
    backgroundColor: COLORS.emergency,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 8
  },
  volunteerBtnText: {
    color: COLORS.white,
    fontWeight: '900'
  },
  ecoSolidariaBtn: {
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  ecoSolidariaBtnText: {
    color: COLORS.emergencyDark,
    fontWeight: '800'
  },
  typesHeader: {
    marginBottom: 8
  },
  typesTitle: {
    fontWeight: '900',
    color: COLORS.textPrimary
  },
  typesSub: {
    color: COLORS.textSecondary,
    fontWeight: '600'
  },
  typesList: {
    gap: 8,
    marginBottom: 16
  },
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
  typeItemActive: {
    borderColor: COLORS.emergency,
    backgroundColor: '#fff5f5'
  },
  typeItemLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  typeItemName: {
    fontWeight: '900',
    color: COLORS.textPrimary
  },
  typeItemSub: {
    color: COLORS.textSecondary,
    fontWeight: '600'
  },
  typeItemArrow: {
    fontSize: 18,
    color: COLORS.textMuted,
    fontWeight: '900'
  },
  activePillSmall: {
    backgroundColor: COLORS.emergency,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 999,
    marginLeft: 6
  },
  activePillSmallText: {
    color: COLORS.white,
    fontSize: 8,
    fontWeight: '900'
  },
  officialHotlinesBox: {
    backgroundColor: COLORS.emergencySurface,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.emergencyPale
  },
  officialTitle: {
    fontWeight: '900',
    color: COLORS.emergencyDark,
    marginBottom: 8
  },
  hotlinesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6
  },
  hotlinePill: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#fca5a5'
  },
  hotlinePillText: {
    color: COLORS.emergencyDark,
    fontWeight: '800',
    fontSize: 11
  }
});
