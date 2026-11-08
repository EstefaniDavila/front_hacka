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


function getEmgIcon(type) {
  const t = (type || '').toLowerCase();
  if (t.includes('inund') || t.includes('agua') || t.includes('aniego')) return '🌊';
  if (t.includes('incend') || t.includes('fuego') || t.includes('humo')) return '🔥';
  if (t.includes('med') || t.includes('salud') || t.includes('ambulan')) return '🚑';
  if (t.includes('sismo') || t.includes('vivien') || t.includes('estruct')) return '🏚️';
  if (t.includes('luz') || t.includes('recurs') || t.includes('corte') || t.includes('suministr')) return '📦';
  return '🚨';
}

function getEmgBgColor(type) {
  const t = (type || '').toLowerCase();
  if (t.includes('inund') || t.includes('agua') || t.includes('aniego')) return '#e0f2fe';
  if (t.includes('incend') || t.includes('fuego')) return '#ffedd5';
  if (t.includes('med') || t.includes('salud')) return '#fee2e2';
  if (t.includes('sismo') || t.includes('vivien')) return '#fef3c7';
  if (t.includes('luz') || t.includes('corte')) return '#f1f5f9';
  return '#fee2e2';
}

export default function EmergencyScreen({ onNavigate, fontScale = 1.0, onOpenChat, onAlertTriggered, userProfile, onDismissBanner }) {
  const { session, profile, user } = useAuth();
  const token = session?.access_token;

  useEffect(() => {
    if (onDismissBanner) onDismissBanner();
  }, []);

  const calculateDistanceMeters = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 45;
    const R = 6371e3;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = Math.round(R * c);
    return d < 15 ? 15 : d;
  };
  const [activeTab, setActiveTab] = useState('alert'); // 'alert' | 'map'
  const [activeEmergency, setActiveEmergency] = useState(null);
  const [activeEmergenciesList, setActiveEmergenciesList] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
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
    const interval = setInterval(loadEmergencyData, 4500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeTab === 'map') {
      loadEmergencyData();
    }
  }, [activeTab]);

  const loadVolunteersForEmergency = async (emgId) => {
    if (!emgId) return;
    try {
      const vols = await api.getEmergencyVolunteers(emgId);
      setVolunteers(Array.isArray(vols) ? vols : []);
    } catch {
      setVolunteers([]);
    }
  };

  const loadEmergencyData = async () => {
    try {
      const list = await api.getActiveEmergencies();
      if (Array.isArray(list) && list.length > 0) {
        setActiveEmergenciesList(list);
        setActiveEmergency((prev) => {
          if (!prev) {
            loadVolunteersForEmergency(list[0].id);
            return list[0];
          }
          const matched = list.find((e) => String(e.id) === String(prev.id));
          const chosen = matched || list[0];
          loadVolunteersForEmergency(chosen.id);
          return chosen;
        });
      } else {
        const emg = await api.getActiveEmergency();
        if (emg) {
          setActiveEmergency(emg);
          setActiveEmergenciesList([emg]);
          loadVolunteersForEmergency(emg.id);
        }
      }
    } catch {
      // mantener estado inicial limpio
    }
  };


  const isEmergencyOwner = (emg) => {
    if (!emg) return false;
    const currentUserId = user?.id || session?.user?.id || profile?.id;
    if (emg.reported_by && currentUserId && String(emg.reported_by) === String(currentUserId)) {
      return true;
    }
    const myClean = (myName || '').toLowerCase().trim();
    const repClean = (emg.reporter_name || '').toLowerCase().trim();
    if (myClean && repClean && (myClean === repClean || repClean.includes(myClean))) {
      return true;
    }
    return emg.is_mine === true;
  };

  const handleDeleteEmergency = (emg) => {
    if (!emg || !emg.id) return;
    Alert.alert(
      '🗑️ Eliminar Alerta Comunitaria',
      `¿Estás seguro de que deseas eliminar la alerta "${emg.title}"? Esta acción la removerá para toda la comunidad.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              if (token) {
                await api.deleteEmergency(emg.id, token);
              }
              const updatedList = activeEmergenciesList.filter((e) => String(e.id) !== String(emg.id));
              setActiveEmergenciesList(updatedList);
              if (activeEmergency && String(activeEmergency.id) === String(emg.id)) {
                const nextEmg = updatedList[0] || null;
                setActiveEmergency(nextEmg);
                if (nextEmg) {
                  loadVolunteersForEmergency(nextEmg.id);
                } else {
                  setVolunteers([]);
                }
              }
              Alert.alert('✅ Alerta Eliminada', 'Tu alerta fue retirada de la comunidad exitosamente.');
            } catch (err) {
              console.warn('[EmergencyScreen] Error eliminando alerta:', err);
              Alert.alert('Aviso', 'No se pudo eliminar la alerta o no tienes permisos suficientes.');
            }
          }
        }
      ]
    );
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

  const myName = userProfile?.name || profile?.full_name || (user?.email ? user.email.split('@')[0] : 'Vecino Solidario');
  const mySkill = userProfile?.skill || profile?.skill || 'Apoyo Comunitario Inmediato';
  const myAvatar = userProfile?.avatar || profile?.avatar_url || '👤';

  const emgLat = activeEmergency?.latitude || userCoords.lat;
  const emgLng = activeEmergency?.longitude || userCoords.lng;
  const calculatedMeters = calculateDistanceMeters(userCoords.lat, userCoords.lng, emgLat, emgLng);
  const isAlreadyInBrigade = isVolunteering || volunteers.some(v => v.name === myName);

  const handleJoinVolunteers = async () => {
    if (isAlreadyInBrigade) {
      Alert.alert('✅ Ya estás en la brigada', `Tu apoyo está registrado como brigadista activo a ${calculatedMeters} metros.`);
      return;
    }

    setIsVolunteering(true);
    let freshMeters = calculatedMeters;
    try {
      const freshLoc = await getOrDetectUserLocation(true);
      if (freshLoc) {
        freshMeters = calculateDistanceMeters(freshLoc.latitude, freshLoc.longitude, emgLat, emgLng);
        setUserCoords({ lat: freshLoc.latitude, lng: freshLoc.longitude, zone: freshLoc.zone });
      }
    } catch {}

    try {
      const updatedVols = await api.joinEmergencyBrigade({
        emergency_id: activeEmergency?.id,
        name: myName,
        skill: mySkill,
        avatar: myAvatar,
        distance_m: freshMeters,
        status: 'En camino'
      }, token);

      if (updatedVols && Array.isArray(updatedVols) && updatedVols.length > 0) {
        setVolunteers(updatedVols);
      } else {
        const newVol = {
          id: Date.now().toString(),
          name: myName,
          skill: mySkill,
          avatar: myAvatar,
          distance: `${calculatedMeters}m`,
          distance_m: calculatedMeters,
          status: 'En camino'
        };
        setVolunteers(prev => [newVol, ...prev.filter(v => v.name !== myName)]);
      }
    } catch (err) {
      console.warn('Error uniéndose a brigada:', err);
      const newVol = {
        id: Date.now().toString(),
        name: myName,
        skill: mySkill,
        avatar: myAvatar,
        distance: `${calculatedMeters}m`,
        distance_m: calculatedMeters,
        status: 'En camino'
      };
      setVolunteers(prev => [newVol, ...prev.filter(v => v.name !== myName)]);
    }

    Alert.alert(
      '🎉 ¡Gracias Vecino!',
      `Te has sumado a la brigada de respuesta comunitaria de Zona A. Distancia calculada: ${calculatedMeters} metros.`
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

    // Persistir de inmediato en el Backend PostgreSQL y notificar a la comunidad
    if (token) {
      try {
        const created = await api.reportEmergency(
          {
            type: mappedType,
            title: newAlert.title,
            desc: newAlert.description,
            severity: 'critical'
          },
          token
        );
        if (created && created.id) {
          newAlert.id = created.id;
        }
      } catch (err) {
        console.warn('[EmergencyScreen] Error reportando emergencia al backend:', err);
      }
    }

    setActiveEmergency(newAlert);
    setActiveEmergenciesList((prev) => [newAlert, ...prev.filter((e) => String(e.id) !== String(newAlert.id))]);
    setVolunteers([]); // La nueva alerta empieza con su propia brigada independiente

    if (onAlertTriggered) {
      onAlertTriggered(newAlert);
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
          {/* Listado Completo de Alertas Comunitarias Activas */}
          {activeEmergenciesList && activeEmergenciesList.length > 0 && (
            <View style={styles.alertListCard}>
              <View style={styles.alertListHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 16 }}>🚨</Text>
                  <Text style={[styles.alertListTitle, { fontSize: scale(13) }]}>
                    Alertas Comunitarias Activas ({activeEmergenciesList.length})
                  </Text>
                </View>
                <View style={styles.liveIndicator}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>EN VIVO</Text>
                </View>
              </View>

              <Text style={[styles.alertListSub, { fontSize: scale(11) }]}>
                Toca cualquier alerta para ver su brigada, mapa satelital y detalles:
              </Text>

              <View style={styles.alertRowsContainer}>
                {activeEmergenciesList.map((emg, idx) => {
                  const isSelected = String(emg.id) === String(activeEmergency?.id);
                  const icon = getEmgIcon(emg.emergency_type || emg.type || emg.title);
                  const bgColor = getEmgBgColor(emg.emergency_type || emg.type || emg.title);

                  return (
                    <TouchableOpacity
                      key={emg.id || idx}
                      style={[styles.alertRowItem, isSelected && styles.alertRowItemSelected]}
                      onPress={() => {
                        setActiveEmergency(emg);
                        loadVolunteersForEmergency(emg.id);
                      }}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.alertIconBadge, { backgroundColor: bgColor }]}>
                        <Text style={{ fontSize: 18 }}>{icon}</Text>
                      </View>

                      <View style={{ flex: 1, marginHorizontal: 10 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                          <Text
                            style={[styles.alertItemTitle, isSelected && styles.alertItemTitleSelected, { fontSize: scale(12) }]}
                            numberOfLines={1}
                          >
                            {emg.title}
                          </Text>
                          <View style={[styles.itemStatusBadge, isSelected ? styles.itemStatusBadgeActive : null]}>
                            <Text style={[styles.itemStatusText, isSelected ? styles.itemStatusTextActive : null]}>
                              {isSelected ? 'SELECCIONADA' : 'EN CURSO'}
                            </Text>
                          </View>
                        </View>
                        <Text style={[styles.alertItemSub, { fontSize: scale(10.5) }]} numberOfLines={1}>
                          📍 {emg.community_name || emg.location || 'Zona A – Manzana 2'} • {emg.description || 'Alerta vecinal'}
                        </Text>
                      </View>

                      <Ionicons
                        name={isSelected ? "radio-button-on" : "chevron-forward"}
                        size={18}
                        color={isSelected ? "#dc2626" : "#cbd5e1"}
                      />

                      {isEmergencyOwner(emg) && (
                        <TouchableOpacity
                          style={styles.deleteAlertBtnSmall}
                          onPress={() => handleDeleteEmergency(emg)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="trash-outline" size={15} color="#dc2626" />
                        </TouchableOpacity>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

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

              {isEmergencyOwner(activeEmergency) && (
                <TouchableOpacity
                  style={styles.deleteEmergencyBtn}
                  onPress={() => handleDeleteEmergency(activeEmergency)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="trash-outline" size={16} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={[styles.deleteEmergencyBtnText, { fontSize: scale(12) }]}>
                    Eliminar mi Alerta Comunitaria (Creador)
                  </Text>
                </TouchableOpacity>
              )}
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
                      <Text style={styles.volDistance}>📍 {vol.distance_m ? `${vol.distance_m}m` : (vol.distance || '50m')}</Text>
                    </View>
                    <Text style={[styles.volSkill, { fontSize: scale(11) }]}>{vol.skill}</Text>
                  </View>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.joinBrigadeBtn, isAlreadyInBrigade && { backgroundColor: '#059669' }]}
              activeOpacity={0.85}
              onPress={handleJoinVolunteers}
            >
              <Ionicons name="hand-right" size={18} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.joinBrigadeBtnText}>
                {isAlreadyInBrigade ? '✋ ✓ YA ESTÁS EN LA BRIGADA' : '✋ 💛 UNIRME A LA BRIGADA DE GUARDIA'}
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
  alertListCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#fecdd3',
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2
  },
  alertListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  alertListTitle: {
    fontWeight: '900',
    color: '#9f1239'
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#dc2626'
  },
  liveText: {
    color: '#dc2626',
    fontWeight: '900',
    fontSize: 9.5
  },
  alertListSub: {
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 10
  },
  alertRowsContainer: {
    gap: 8
  },
  alertRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  alertRowItemSelected: {
    backgroundColor: '#fff5f5',
    borderColor: '#f87171',
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2
  },
  alertIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center'
  },
  alertItemTitle: {
    fontWeight: '800',
    color: '#1e293b'
  },
  alertItemTitleSelected: {
    color: '#9f1239'
  },
  itemStatusBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  itemStatusBadgeActive: {
    backgroundColor: '#dc2626'
  },
  itemStatusText: {
    color: '#64748b',
    fontWeight: '800',
    fontSize: 9
  },
  itemStatusTextActive: {
    color: '#ffffff'
  },
  alertItemSub: {
    color: '#64748b',
    fontWeight: '500'
  },
  mapAlertSelector: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#fecdd3',
    borderRadius: 14,
    padding: 10,
    marginBottom: 10
  },
  mapAlertSelectorTitle: {
    fontWeight: '800',
    color: '#9f1239'
  },
  mapAlertPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 6
  },
  mapAlertPillActive: {
    backgroundColor: '#dc2626',
    borderColor: '#b91c1c'
  },
  mapAlertPillText: {
    fontWeight: '700',
    fontSize: 11,
    color: '#475569'
  },
  mapAlertPillTextActive: {
    color: '#ffffff'
  },
  deleteEmergencyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dc2626',
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 14,
    marginTop: 10
  },
  deleteEmergencyBtnText: {
    color: '#ffffff',
    fontWeight: '800'
  },
  deleteAlertBtnSmall: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
    marginLeft: 6
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
