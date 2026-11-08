import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert
} from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { api } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import InteractiveCommunityMap from '../components/InteractiveCommunityMap';
import { getOrDetectUserLocation } from '../services/locationService';

export default function EmergencyScreen({ onNavigate, fontScale = 1.0, onOpenChat, onAlertTriggered }) {
  const { session } = useAuth();
  const token = session?.access_token;
  const [activeTab, setActiveTab] = useState('alert'); // 'alert' | 'map'
  const [activeEmergency, setActiveEmergency] = useState(null);
  const [volunteers, setVolunteers] = useState([
    { id: '1', name: 'Martha Quispe', skill: 'Primeros Auxilios / Enfermería', avatar: '👵', distance: '50m', status: 'En guardia' },
    { id: '2', name: 'Carlos Ramos', skill: 'Electricidad y Gasfitería', avatar: '👨‍🔧', distance: '120m', status: 'Disponible' },
    { id: '3', name: 'Lucía Mendoza', skill: 'Apoyo Logístico / Agua', avatar: '👩', distance: '180m', status: 'En guardia' }
  ]);
  const [isVolunteering, setIsVolunteering] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [userCoords, setUserCoords] = useState({ lat: -12.0463, lng: -77.0427, zone: 'Zona A • Manzana 2' });

  useEffect(() => {
    getOrDetectUserLocation().then((loc) => {
      if (loc) {
        setUserCoords({ lat: loc.latitude, lng: loc.longitude, zone: loc.zone });
      }
    });
  }, []);

  useEffect(() => {
    loadEmergencyData();
  }, []);

  const loadEmergencyData = async () => {
    try {
      const emg = await api.getActiveEmergency();
      if (emg) setActiveEmergency(emg);
      const vols = await api.getEmergencyVolunteers();
      if (vols && vols.length > 0) setVolunteers(vols);
    } catch {
      // mantener estado inicial limpio
    }
  };

  const scale = (val) => Math.round(val * fontScale);

  const emergencyTypes = [
    { id: 'inundacion', name: 'Inundación / Aniego', sub: 'Ingreso de agua o rotura de matriz', icon: '🌊', color: '#0284c7' },
    { id: 'incendio', name: 'Incendio o Cortocircuito', sub: 'Fuego activo o humo tóxico', icon: '🔥', color: '#ea580c' },
    { id: 'medica', name: 'Emergencia médica', sub: 'Persona herida o descompensada', icon: '🚑', color: '#dc2626' },
    { id: 'vivienda', name: 'Daño Estructural / Sismo', sub: 'Riesgo de colapso o grietas', icon: '🏚️', color: '#7c2d12' },
    { id: 'seguridad', name: 'Seguridad / Actividad sospechosa', sub: 'Alarma comunal vecinal', icon: '🚨', color: '#b91c1c' },
    { id: 'recursos', name: 'Corte masivo de agua / luz', sub: 'Falta de suministros vitales', icon: '📦', color: '#475569' }
  ];

  const handleJoinVolunteers = async () => {
    if (isVolunteering) {
      Alert.alert('✅ Ya estás en la brigada', 'Tu apoyo está registrado para la Manzana 2.');
      return;
    }

    setIsVolunteering(true);
    const newVol = { id: Date.now().toString(), name: 'Tú (Vecino)', skill: 'Apoyo Comunitario Inmediato', avatar: '👤', distance: 'Tu casa', status: 'Activo' };
    setVolunteers(prev => [newVol, ...prev]);

    Alert.alert(
      '🎉 ¡Gracias Vecino!',
      'Te has sumado a la brigada de respuesta comunitaria de Zona A.'
    );
  };

  const handleTriggerAlert = async () => {
    if (!selectedType) {
      Alert.alert('Selecciona una opción', 'Por favor selecciona el tipo de evento que está ocurriendo para alertar a tu manzana.');
      return;
    }
    const chosen = emergencyTypes.find(t => t.id === selectedType) || emergencyTypes[0];

    // Mapeo seguro al backend de emergencias
    const typeMap = {
      inundacion: 'inundacion',
      incendio: 'incendio',
      medica: 'medica',
      vivienda: 'sismo',
      seguridad: 'seguridad',
      recursos: 'otro'
    };
    const mappedType = typeMap[selectedType] || 'seguridad';

    const newAlert = {
      id: 'emg-' + Date.now(),
      title: `${chosen.name} en Manzana 2`,
      description: `${chosen.sub}. Alerta comunitaria activada por vecino para auxilio inmediato en Zona A.`,
      location: 'Zona A – Manzana 2 (Alerta Activa)',
      type: mappedType,
      severity: 'critical'
    };

    setActiveEmergency(newAlert);
    if (onAlertTriggered) {
      onAlertTriggered(newAlert);
    }

    // Persistir de inmediato en el Backend PostgreSQL y notificar a la comunidad
    if (token) {
      try {
        await api.reportEmergency(
          {
            type: mappedType,
            title: newAlert.title,
            desc: newAlert.description,
            severity: 'critical'
          },
          token
        );
      } catch (err) {
        console.warn('[EmergencyScreen] Error reportando emergencia al backend:', err);
      }
    }

    // Disparar Web Notification si está habilitada en el navegador
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          new Notification('🚨 ¡Alerta Vecinal Activada!', {
            body: `${chosen.name} en Manzana 2. Se solicita apoyo vecinal inmediato.`
          });
        } catch {}
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().catch(() => {});
      }
    }

    Alert.alert(
      '🚨 ¡Alerta Vecinal Activada!',
      `Se ha emitido la alerta de "${chosen.name}" a todos los vecinos de tu manzana en Zona A.`
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      
      {/* Cabecera Roja de Emergencia */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => onNavigate('home')} style={{ paddingRight: 8 }}>
            <Feather name="arrow-left" size={22} color={COLORS.white} />
          </TouchableOpacity>
          <View style={styles.headerLeft}>
            <MaterialCommunityIcons name="alarm-light" size={28} color="#ffffff" style={{ marginRight: 8 }} />
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

        {/* Pestañas Segmentadas: Activar Alerta vs Mapa de Emergencia */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'alert' && styles.tabBtnActive]}
            onPress={() => setActiveTab('alert')}
          >
            <MaterialCommunityIcons
              name="bell-ring"
              size={16}
              color={activeTab === 'alert' ? '#dc2626' : 'rgba(255,255,255,0.7)'}
            />
            <Text style={[styles.tabBtnText, activeTab === 'alert' && styles.tabBtnTextActive]}>
              Activar Alerta
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'map' && styles.tabBtnActive]}
            onPress={() => setActiveTab('map')}
          >
            <Ionicons
              name="map"
              size={16}
              color={activeTab === 'map' ? '#dc2626' : 'rgba(255,255,255,0.7)'}
            />
            <Text style={[styles.tabBtnText, activeTab === 'map' && styles.tabBtnTextActive]}>
              Mapa y Brigada
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* VISTA 1: ACTIVAR ALERTA */}
      {activeTab === 'alert' && (
        <View>
          {/* Alerta Activa si existe */}
          {activeEmergency ? (
            <View style={styles.activeEmergencyBox}>
              <View style={styles.activeEmergencyHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.activeEmergencyTitle, { fontSize: scale(15) }]}>
                    🚨 {activeEmergency.title}
                  </Text>
                  <Text style={[styles.activeEmergencySub, { fontSize: scale(11) }]}>
                    {activeEmergency.location || 'Zona A – Manzana 2'}
                  </Text>
                </View>
                <View style={styles.activeTag}>
                  <Text style={styles.activeTagText}>EN CURSO</Text>
                </View>
              </View>

              <Text style={[styles.activeDesc, { fontSize: scale(11) }]}>
                "{activeEmergency.description || 'Alerta vecinal prioritaria en atención por vecinos.'}"
              </Text>

              {/* Radar */}
              <View style={styles.radarSimulation}>
                <Ionicons name="radio" size={22} color="#dc2626" style={{ marginBottom: 4 }} />
                <Text style={[styles.radarText, { fontSize: scale(11) }]}>
                  Alerta retransmitida a vecinos de Manzana 1 a 4 (Radio 500 m)
                </Text>
              </View>

              <TouchableOpacity
                style={styles.viewMapShortcut}
                onPress={() => setActiveTab('map')}
              >
                <Ionicons name="map-outline" size={16} color="#0f766e" />
                <Text style={styles.viewMapShortcutText}>Ver ubicación en el Mapa de Emergencia ➔</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.calmBox}>
              <Ionicons name="shield-checkmark" size={44} color="#059669" style={{ marginBottom: 6 }} />
              <Text style={[styles.calmTitle, { fontSize: scale(15) }]}>
                Zona Segura: Sin emergencias activas
              </Text>
              <Text style={[styles.calmSub, { fontSize: scale(11) }]}>
                Tu manzana se encuentra en calma. Si observas conatos de incendio, rotura de tuberías o emergencias médicas, activa la alerta de inmediato abajo.
              </Text>
            </View>
          )}

          {/* Tipos de Emergencias Disponibles */}
          <View style={styles.typesHeader}>
            <Text style={[styles.typesTitle, { fontSize: scale(13) }]}>
              ¿Qué está ocurriendo en tu calle?
            </Text>
            <Text style={[styles.typesSub, { fontSize: scale(11) }]}>
              Selecciona el tipo de evento para coordinar auxilio vecinal:
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
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={[styles.typeItemName, { fontSize: scale(13) }]}>
                          {item.name}
                        </Text>
                        {isSelected && (
                          <View style={styles.activePillSmall}>
                            <Text style={styles.activePillSmallText}>SELECCIONADO</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.typeItemSub, { fontSize: scale(10) }]}>
                        {item.sub}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Botón para Disparar Alerta (RESALTADO Y BOLD) */}
          <TouchableOpacity
            style={styles.triggerAlertBtn}
            activeOpacity={0.85}
            onPress={handleTriggerAlert}
          >
            <MaterialCommunityIcons name="alarm-light" size={24} color="#ffffff" style={{ marginRight: 8 }} />
            <Text style={[styles.triggerAlertBtnText, { fontSize: scale(14) }]}>
              🚨 ACTIVAR ALERTA EN MI MANZANA
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* VISTA 2: MAPA DE EMERGENCIA Y BRIGADA VECINAL */}
      {activeTab === 'map' && (
        <View>
          {/* Mapa Satelital Interactivo de Google Maps con Epicentro y Brigada */}
          <InteractiveCommunityMap
            latitude={activeEmergency?.latitude || userCoords.lat}
            longitude={activeEmergency?.longitude || userCoords.lng}
            title={activeEmergency?.title || 'Epicentro de Emergencia Comunitaria'}
            subtitle="Zona A • Manzana 2 (Cuadrante Barrial)"
            height={260}
            mode="emergency"
            radiusMeters={500}
            volunteers={volunteers}
            fontScale={fontScale}
            onOpenChat={onOpenChat}
          />

          {/* Vecinos en Guardia / Brigada Vecinal */}
          <View style={styles.brigadeCard}>
            <View style={styles.brigadeHeader}>
              <Ionicons name="people" size={18} color="#0f766e" style={{ marginRight: 6 }} />
              <Text style={[styles.brigadeTitle, { fontSize: scale(13) }]}>
                Brigada Vecinal de Guardia ({volunteers.length})
              </Text>
            </View>
            <Text style={[styles.brigadeSub, { fontSize: scale(11) }]}>
              Vecinos capacitados y listos para coordinar apoyo en caso de contingencia.
            </Text>

            <View style={styles.volunteerList}>
              {volunteers.map((vol) => (
                <View key={vol.id} style={styles.volunteerItem}>
                  <View style={styles.volunteerAvatarCircle}>
                    <Text style={{ fontSize: 22 }}>{vol.avatar}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={[styles.volName, { fontSize: scale(12) }]}>{vol.name}</Text>
                      <Text style={styles.volDistance}>📍 {vol.distance}</Text>
                    </View>
                    <Text style={[styles.volSkill, { fontSize: scale(11) }]}>{vol.skill}</Text>
                  </View>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.joinBrigadeBtn, isVolunteering && { backgroundColor: '#059669' }]}
              activeOpacity={0.85}
              onPress={handleJoinVolunteers}
            >
              <Ionicons name="hand-right" size={18} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.joinBrigadeBtnText}>
                {isVolunteering ? '✓ YA ESTÁS EN LA BRIGADA' : '🤝 UNIRME A LA BRIGADA DE GUARDIA'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Centrales de Emergencia Oficiales (Perú) */}
      <View style={styles.officialHotlinesBox}>
        <Text style={[styles.officialTitle, { fontSize: scale(12) }]}>
          📞 Centrales de Emergencia Oficiales (Perú):
        </Text>
        <View style={styles.hotlinesRow}>
          <TouchableOpacity
            style={styles.hotlinePill}
            onPress={() => Alert.alert('Llamada de Emergencia', 'Marcando Bomberos 116')}
          >
            <Text style={styles.hotlinePillText}>🚒 Bomberos: 116</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.hotlinePill}
            onPress={() => Alert.alert('Llamada de Emergencia', 'Marcando Policía 105')}
          >
            <Text style={styles.hotlinePillText}>👮 Policía: 105</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.hotlinePill}
            onPress={() => Alert.alert('Llamada de Emergencia', 'Marcando SAMU 106')}
          >
            <Text style={styles.hotlinePillText}>🚑 SAMU: 106</Text>
          </TouchableOpacity>
        </View>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 120 },
  headerCard: {
    backgroundColor: '#dc2626',
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#dc2626',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4
  },
  headerTop: { flexDirection: 'row', alignItems: 'center' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  headerTitle: { color: COLORS.white, fontWeight: '900' },
  headerSub: { color: '#fee2e2', fontWeight: '600' },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderRadius: 14,
    padding: 4,
    marginTop: 14,
    gap: 4
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6
  },
  tabBtnActive: {
    backgroundColor: '#ffffff'
  },
  tabBtnText: {
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '700',
    fontSize: 12
  },
  tabBtnTextActive: {
    color: '#dc2626',
    fontWeight: '900'
  },
  activeEmergencyBox: {
    backgroundColor: '#fff1f2',
    borderWidth: 2,
    borderColor: '#fca5a5',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#dc2626',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3
  },
  activeEmergencyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  activeEmergencyTitle: {
    fontWeight: '900',
    color: '#991b1b'
  },
  activeEmergencySub: {
    color: '#b91c1c',
    fontWeight: '700',
    marginTop: 2
  },
  activeTag: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  activeTagText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900'
  },
  activeDesc: {
    color: '#7f1d1d',
    fontStyle: 'italic',
    lineHeight: 18,
    marginBottom: 10
  },
  radarSimulation: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#fecdd3'
  },
  radarText: {
    color: '#991b1b',
    fontWeight: '700',
    textAlign: 'center'
  },
  viewMapShortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8
  },
  viewMapShortcutText: {
    color: '#0f766e',
    fontWeight: '800',
    fontSize: 12
  },
  calmBox: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  calmTitle: {
    fontWeight: '800',
    color: '#059669',
    marginBottom: 4,
    textAlign: 'center'
  },
  calmSub: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18
  },
  typesHeader: {
    marginBottom: 10
  },
  typesTitle: {
    fontWeight: '800',
    color: COLORS.text
  },
  typesSub: {
    color: COLORS.textSecondary,
    marginTop: 2
  },
  typesList: {
    gap: 10,
    marginBottom: 16
  },
  typeItem: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  typeItemActive: {
    backgroundColor: '#fff1f2',
    borderColor: '#dc2626'
  },
  typeItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  typeItemName: {
    fontWeight: '800',
    color: COLORS.text
  },
  typeItemSub: {
    color: COLORS.textSecondary,
    marginTop: 2
  },
  activePillSmall: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  activePillSmallText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900'
  },
  triggerAlertBtn: {
    backgroundColor: '#dc2626',
    borderRadius: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#dc2626',
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 16
  },
  triggerAlertBtnText: {
    color: '#ffffff',
    fontWeight: '900',
    letterSpacing: 0.5
  },
  mapContainerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  mapContainerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  mapContainerTitle: {
    fontWeight: '900',
    color: COLORS.text
  },
  satelliteMapCanvas: {
    height: 180,
    backgroundColor: '#0f172a',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden'
  },
  satelliteRadarWave: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    backgroundColor: 'rgba(239, 68, 68, 0.1)'
  },
  satelliteRadarWaveInner: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 1.5,
    borderColor: 'rgba(239, 68, 68, 0.6)'
  },
  mapCenterPin: {
    alignItems: 'center'
  },
  pinLabel: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 4
  },
  pinLabelText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800'
  },
  backendReadyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdfa',
    padding: 10,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#ccfbf1'
  },
  backendReadyTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0f766e'
  },
  backendReadySub: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 1
  },
  brigadeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  brigadeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4
  },
  brigadeTitle: {
    fontWeight: '900',
    color: COLORS.text
  },
  brigadeSub: {
    color: COLORS.textSecondary,
    marginBottom: 12
  },
  volunteerList: {
    gap: 8,
    marginBottom: 14
  },
  volunteerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  volunteerAvatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  volName: {
    fontWeight: '800',
    color: COLORS.text
  },
  volDistance: {
    fontSize: 10,
    color: '#0d9488',
    fontWeight: '700'
  },
  volSkill: {
    color: COLORS.textSecondary,
    marginTop: 2
  },
  joinBrigadeBtn: {
    backgroundColor: '#0d9488',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    shadowColor: '#0d9488',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 2
  },
  joinBrigadeBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 12
  },
  officialHotlinesBox: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  officialTitle: {
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 8
  },
  hotlinesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  hotlinePill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1'
  },
  hotlinePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.text
  }
});
