import * as ImagePicker from 'expo-image-picker';
import React, { useState, useEffect } from 'react';
import {
  View,
  Linking,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  TextInput,
  Platform,
  ActivityIndicator
} from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { api } from '../services/api';
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

export function getRadarTier(distanceMeters) {
  if (typeof distanceMeters !== 'number' || isNaN(distanceMeters)) {
    return { tier: 1, label: 'Onda 1 (<500m)', color: '#dc2626', bg: '#fee2e2', text: 'Prioridad Inmediata' };
  }
  if (distanceMeters <= 500) {
    return { tier: 1, label: `🔴 Onda 1 (${distanceMeters}m)`, color: '#dc2626', bg: '#fee2e2', text: 'Inmediata (<500m)' };
  } else if (distanceMeters <= 1500) {
    const km = (distanceMeters / 1000).toFixed(1);
    return { tier: 2, label: `🟠 Onda 2 (${km}km)`, color: '#ea580c', bg: '#ffedd5', text: 'Sectorial (500m-1.5km)' };
  } else if (distanceMeters <= 3000) {
    const km = (distanceMeters / 1000).toFixed(1);
    return { tier: 3, label: `🟡 Onda 3 (${km}km)`, color: '#ca8a04', bg: '#fef9c3', text: 'Comunal (1.5km-3km)' };
  } else if (distanceMeters <= 5000) {
    const km = (distanceMeters / 1000).toFixed(1);
    return { tier: 4, label: `🔵 Onda 4 (${km}km)`, color: '#0284c7', bg: '#e0f2fe', text: 'Perímetro (3km-5km)' };
  } else {
    const km = (distanceMeters / 1000).toFixed(1);
    return { tier: 5, label: `⚪ Fuera (${km}km)`, color: '#64748b', bg: '#f1f5f9', text: 'Fuera de Radar (>5km)' };
  }
}

export default function EmergencyScreen({
  onNavigate,
  fontScale = 1.0,
  onOpenChat,
  onAlertTriggered,
  userProfile,
  onDismissBanner,
  targetEmergency
}) {
  const { session, profile, user } = useAuth();
  const token = session?.access_token;
  const scale = (val) => Math.round(val * fontScale);

  const myName = userProfile?.name || profile?.full_name || (user?.email ? user.email.split('@')[0] : 'Vecino Solidario');
  const myAvatar = userProfile?.avatar || profile?.avatar || '🧑';

  // Estados principales de pantalla y alerta
  const [activeTab, setActiveTab] = useState(targetEmergency ? 'map' : 'alert');
  const [activeEmergency, setActiveEmergency] = useState(targetEmergency || null);
  const [activeEmergenciesList, setActiveEmergenciesList] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [isVolunteering, setIsVolunteering] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const initialLat = userProfile?.latitude || profile?.latitude || -16.4360;
  const initialLng = userProfile?.longitude || profile?.longitude || -71.5612;
  const initialZone = userProfile?.zone || profile?.address || 'Zona A • Manzana 2';
  const [userCoords, setUserCoords] = useState({ lat: initialLat, lng: initialLng, zone: initialZone });
  const [alertPhoto, setAlertPhoto] = useState(null);
  const [alertNotes, setAlertNotes] = useState('');
  const [radarFilter, setRadarFilter] = useState('all'); // 'all' | 'in_radar' (<=5km) | 'wave1' (<=500m)

  // Estados de Evidencias / Reportes Comunitarios en Vivo
  const [communityReports, setCommunityReports] = useState([]);
  const [reportMessage, setReportMessage] = useState('');
  const [reportPhoto, setReportPhoto] = useState(null);
  const [isPostingReport, setIsPostingReport] = useState(false);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [editingReportId, setEditingReportId] = useState(null);
  const [editingReportText, setEditingReportText] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isCalibratingGps, setIsCalibratingGps] = useState(false);

  const handleCalibrateEmergencyGps = async () => {
    setIsCalibratingGps(true);
    try {
      const loc = await getOrDetectUserLocation(true);
      if (loc && loc.latitude && loc.longitude) {
        setUserCoords({
          lat: loc.latitude,
          lng: loc.longitude,
          zone: loc.zone || loc.fullAddress || `${Number(loc.latitude).toFixed(4)}, ${Number(loc.longitude).toFixed(4)}`
        });
        Alert.alert(
          '📍 Ubicación GPS Calibrada',
          `Tu posición satelital exacta ha sido actualizada:\n${loc.zone || loc.fullAddress}\n(GPS: ${Number(loc.latitude).toFixed(4)}, ${Number(loc.longitude).toFixed(4)})`
        );
      } else {
        Alert.alert('Permiso de GPS', 'Activa el permiso de ubicación precisa en tu dispositivo para ubicar la emergencia.');
      }
    } catch (err) {
      console.warn('Error calibrando GPS en emergencia:', err);
    } finally {
      setIsCalibratingGps(false);
    }
  };

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

  useEffect(() => {
    if (onDismissBanner) onDismissBanner();
  }, []);

  useEffect(() => {
    getOrDetectUserLocation().then((loc) => {
      if (loc) {
        setUserCoords({ lat: loc.latitude, lng: loc.longitude, zone: loc.zone });
      }
    });
  }, []);

  useEffect(() => {
    if (targetEmergency) {
      setActiveTab('map');
      setActiveEmergency(targetEmergency);
      loadVolunteersForEmergency(targetEmergency.id);
      loadCommunityReports(targetEmergency.id);
    }
  }, [targetEmergency]);

  useEffect(() => {
    loadEmergencyData();
    const interval = setInterval(loadEmergencyData, 4500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeTab === 'map' && activeEmergency?.id) {
      loadVolunteersForEmergency(activeEmergency.id);
      loadCommunityReports(activeEmergency.id);
    }
  }, [activeTab, activeEmergency?.id]);

  const loadVolunteersForEmergency = async (emgId) => {
    if (!emgId) return;
    try {
      const vols = await api.getEmergencyVolunteers(emgId);
      setVolunteers(Array.isArray(vols) ? vols : []);
    } catch {
      setVolunteers([]);
    }
  };

  const loadCommunityReports = async (emgId) => {
    if (!emgId) return;
    setIsLoadingReports(true);
    try {
      const reports = await api.getEmergencyCommunityReports(emgId);
      setCommunityReports(Array.isArray(reports) ? reports : []);
    } catch {
      setCommunityReports([]);
    } finally {
      setIsLoadingReports(false);
    }
  };

  const loadEmergencyData = async () => {
    try {
      const loc = await getOrDetectUserLocation().catch(() => null);
      const res = await api.searchEmergencies({
        latitude: loc?.latitude || null,
        longitude: loc?.longitude || null,
        sort: 'recommended',
        page: 1,
        page_size: 20
      }).catch(() => null);

      if (res && Array.isArray(res.items) && res.items.length > 0) {
        setActiveEmergenciesList(res.items);
        setActiveEmergency((prev) => {
          if (!prev) {
            loadVolunteersForEmergency(res.items[0].id);
            loadCommunityReports(res.items[0].id);
            return res.items[0];
          }
          const matched = res.items.find((e) => String(e.id) === String(prev.id));
          const chosen = matched || res.items[0];
          loadVolunteersForEmergency(chosen.id);
          return chosen;
        });
        return;
      }

      const list = await api.getActiveEmergencies().catch(() => []);
      if (Array.isArray(list) && list.length > 0) {
        setActiveEmergenciesList(list);
        setActiveEmergency((prev) => {
          if (!prev) {
            loadVolunteersForEmergency(list[0].id);
            loadCommunityReports(list[0].id);
            return list[0];
          }
          const matched = list.find((e) => String(e.id) === String(prev.id));
          const chosen = matched || list[0];
          loadVolunteersForEmergency(chosen.id);
          return chosen;
        });
      } else {
        const emg = await api.getActiveEmergency().catch(() => null);
        if (emg) {
          setActiveEmergency(emg);
          setActiveEmergenciesList([emg]);
          loadVolunteersForEmergency(emg.id);
          loadCommunityReports(emg.id);
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
                  loadCommunityReports(nextEmg.id);
                } else {
                  setVolunteers([]);
                  setCommunityReports([]);
                  setActiveTab('alert');
                }
              }
              Alert.alert('Alerta Eliminada', 'La alerta comunitaria ha sido retirada exitosamente.');
            } catch (err) {
              Alert.alert('Error', 'No se pudo eliminar la alerta comunitaria.');
            }
          }
        }
      ]
    );
  };

  const isAlreadyInBrigade = isVolunteering || volunteers.some((v) => v.name === myName);

  const handleJoinVolunteers = async () => {
    if (isAlreadyInBrigade) {
      Alert.alert('Ya estás registrado', 'Ya eres parte activa de esta brigada vecinal de guardia.');
      return;
    }
    const distanceM = calculateDistanceMeters(
      userCoords.lat,
      userCoords.lng,
      activeEmergency?.latitude || userCoords.lat,
      activeEmergency?.longitude || userCoords.lng
    );

    setIsVolunteering(true);
    try {
      if (token && activeEmergency?.id) {
        await api.joinEmergencyBrigade(
          {
            emergency_id: activeEmergency.id,
            name: myName,
            avatar: myAvatar,
            skill: userProfile?.profession || 'Apoyo logístico y vecinal',
            distance: `${distanceM}m`,
            distance_m: distanceM,
            latitude: userCoords.lat,
            longitude: userCoords.lng
          },
          token
        );
        loadVolunteersForEmergency(activeEmergency.id);
      } else {
        const newVol = {
          id: Date.now().toString(),
          name: myName,
          skill: userProfile?.profession || 'Apoyo logístico y vecinal',
          distance: `${distanceM}m`,
          distance_m: distanceM,
          avatar: myAvatar
        };
        setVolunteers((prev) => [newVol, ...prev.filter((v) => v.name !== myName)]);
      }
      Alert.alert(
        '¡Gracias por tu apoyo, Vecino!',
        'Te has sumado a la brigada comunitaria. Ahora puedes subir reportes y fotos en vivo del suceso para coordinar auxilio.'
      );
    } catch (err) {
      const fallbackVol = {
        id: Date.now().toString(),
        name: myName,
        skill: userProfile?.profession || 'Apoyo vecinal voluntario',
        distance: `${distanceM}m`,
        distance_m: distanceM,
        avatar: myAvatar
      };
      setVolunteers((prev) => [fallbackVol, ...prev.filter((v) => v.name !== myName)]);
      Alert.alert('¡Registrado!', 'Te uniste a la brigada vecinal con éxito.');
    } finally {
      setIsVolunteering(false);
    }
  };

  // --- SELECCIÓN DE FOTO PARA NUEVA ALERTA ---
  const handlePickAlertPhoto = async () => {
    try {
      if (Platform.OS === 'web') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
          const file = e.target.files && e.target.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              setAlertPhoto(event.target.result);
            };
            reader.readAsDataURL(file);
          }
        };
        input.click();
        return;
      }
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso requerido', 'Necesitamos acceso a tus fotos para adjuntar la imagen de la alerta.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
        base64: true
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const uri = asset.base64
          ? `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`
          : asset.uri;
        setAlertPhoto(uri);
      }
    } catch (err) {
      console.warn('Error al seleccionar foto:', err);
    }
  };

  const handleTakeAlertPhoto = async () => {
    try {
      if (Platform.OS === 'web') {
        handlePickAlertPhoto();
        return;
      }
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso requerido', 'Necesitamos permiso de cámara para tomar fotos de la emergencia.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.7,
        base64: true
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const uri = asset.base64
          ? `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`
          : asset.uri;
        setAlertPhoto(uri);
      }
    } catch (err) {
      console.warn('Error al tomar foto:', err);
    }
  };

  // --- SELECCIÓN DE FOTO PARA REPORTE COMUNITARIO EN VIVO ---
  const handlePickReportPhoto = async () => {
    try {
      if (Platform.OS === 'web') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
          const file = e.target.files && e.target.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              setReportPhoto(event.target.result);
            };
            reader.readAsDataURL(file);
          }
        };
        input.click();
        return;
      }
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso requerido', 'Necesitamos acceso a la galería para adjuntar la evidencia.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
        base64: true
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const uri = asset.base64
          ? `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`
          : asset.uri;
        setReportPhoto(uri);
      }
    } catch (err) {
      console.warn('Error al seleccionar foto de reporte:', err);
    }
  };

  const handleTakeReportPhoto = async () => {
    try {
      if (Platform.OS === 'web') {
        handlePickReportPhoto();
        return;
      }
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso requerido', 'Necesitamos acceso a la cámara para tomar fotos de la evidencia.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.7,
        base64: true
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const uri = asset.base64
          ? `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`
          : asset.uri;
        setReportPhoto(uri);
      }
    } catch (err) {
      console.warn('Error al tomar foto de reporte:', err);
    }
  };

  // --- GESTIÓN (EDITAR / ELIMINAR) DE REPORTES SITUACIONALES ---
  const handleStartEditReport = (rep) => {
    setEditingReportId(rep.id);
    setEditingReportText(rep.message || '');
  };

  const handleCancelEditReport = () => {
    setEditingReportId(null);
    setEditingReportText('');
  };

  const handleSaveEditReport = async (rep) => {
    if (!editingReportText.trim()) {
      Alert.alert('Mensaje requerido', 'El texto no puede quedar vacío.');
      return;
    }
    setIsSavingEdit(true);
    try {
      if (activeEmergency?.id && !String(rep.id).startsWith('rep_')) {
        await api.updateEmergencyCommunityReport(
          activeEmergency.id,
          rep.id,
          { message: editingReportText.trim() },
          token
        );
      }
      setCommunityReports((prev) =>
        prev.map((r) => (String(r.id) === String(rep.id) ? { ...r, message: editingReportText.trim() } : r))
      );
      setEditingReportId(null);
      setEditingReportText('');
      Alert.alert('✓ Actualizado', 'Tu reporte ha sido modificado.');
    } catch (err) {
      console.warn('Error editando reporte:', err);
      setCommunityReports((prev) =>
        prev.map((r) => (String(r.id) === String(rep.id) ? { ...r, message: editingReportText.trim() } : r))
      );
      setEditingReportId(null);
      setEditingReportText('');
      Alert.alert('✓ Actualizado', 'Cambios guardados localmente.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteReport = (rep) => {
    Alert.alert(
      '🗑️ Eliminar Reporte',
      '¿Estás seguro de que deseas eliminar esta evidencia o actualización?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              if (activeEmergency?.id && !String(rep.id).startsWith('rep_')) {
                await api.deleteEmergencyCommunityReport(activeEmergency.id, rep.id, token);
              }
              setCommunityReports((prev) => prev.filter((r) => String(r.id) !== String(rep.id)));
              Alert.alert('✓ Eliminado', 'El reporte ha sido retirado del muro.');
            } catch (err) {
              console.warn('Error eliminando reporte:', err);
              setCommunityReports((prev) => prev.filter((r) => String(r.id) !== String(rep.id)));
              Alert.alert('✓ Eliminado', 'Reporte retirado.');
            }
          }
        }
      ]
    );
  };

  // --- PUBLICAR REPORTE O EVIDENCIA SITUACIONAL EN LA ALERTA ---
  const handlePostCommunityReport = async () => {
    if (!reportMessage.trim() && !reportPhoto) {
      Alert.alert('Reporte incompleto', 'Por favor escribe un mensaje o adjunta una fotografía del suceso.');
      return;
    }
    if (!activeEmergency?.id) {
      Alert.alert('Error', 'No hay una alerta activa seleccionada para comentar.');
      return;
    }

    const distM = calculateDistanceMeters(
      userCoords.lat,
      userCoords.lng,
      activeEmergency.latitude || userCoords.lat,
      activeEmergency.longitude || userCoords.lng
    );

    const roleBadge = isAlreadyInBrigade
      ? '🛡️ Brigadista de Guardia'
      : (distM <= 500 ? '📍 Vecino en Zona' : '🤝 Vecino Solidario');

    setIsPostingReport(true);
    const newReportPayload = {
      message: reportMessage.trim() || 'Evidencia fotográfica en el lugar del suceso.',
      image_url: reportPhoto || null,
      author_name: myName,
      author_avatar: myAvatar,
      distance_m: distM,
      role_badge: roleBadge
    };

    try {
      const savedReport = await api.postEmergencyCommunityReport(activeEmergency.id, newReportPayload, token);
      if (savedReport && savedReport.id) {
        setCommunityReports((prev) => [savedReport, ...prev.filter((r) => String(r.id) !== String(savedReport.id))]);
      } else {
        await loadCommunityReports(activeEmergency.id);
      }
      setReportMessage('');
      setReportPhoto(null);
      Alert.alert('📸 Reporte Guardado en BD', 'Tu evidencia y fotografía han sido registradas en la base de datos de VeciRed.');
    } catch (err) {
      // Guardado local resiliente si el backend no estuviera temporalmente accesible
      const localReport = {
        id: `rep_${Date.now()}`,
        emergency_id: activeEmergency.id,
        user_id: user?.id || 'local_user',
        author_name: myName,
        author_avatar: myAvatar,
        message: newReportPayload.message,
        image_url: newReportPayload.image_url,
        distance_m: distM,
        role_badge: roleBadge,
        created_at: new Date().toISOString()
      };
      setCommunityReports((prev) => [localReport, ...prev]);
      setReportMessage('');
      setReportPhoto(null);
      Alert.alert('📸 Reporte Guardado', 'Tu evidencia ha sido publicada exitosamente en el muro vecinal.');
    } finally {
      setIsPostingReport(false);
    }
  };

  const handleTriggerAlert = async () => {
    if (!selectedType) {
      Alert.alert('Selecciona un tipo', 'Por favor elige el tipo de contingencia vecinal.');
      return;
    }

    const typeMap = {
      medica: 'Ambulancia / Urgencia Médica',
      incendio: 'Incendio / Fuego Activo',
      seguridad: 'Alerta Vecinal / Sospechoso',
      inundacion: 'Inundación / Rotura de Tubería',
      sismo: 'Sismo / Daño Estructural',
      corte_luz: 'Corte General de Suministro'
    };

    const typeKey = selectedType.key;
    const mappedType = typeKey === 'inundacion' ? 'agua'
      : typeKey === 'corte_luz' ? 'recursos'
      : typeKey === 'sismo' ? 'vivienda'
      : typeKey;

    const newAlert = {
      id: Date.now().toString(),
      title: typeMap[selectedType.key] || 'Alerta Comunitaria',
      location: `${userCoords.zone} (Lat: ${Number(userCoords.lat).toFixed(4)}, Lng: ${Number(userCoords.lng).toFixed(4)})`,
      latitude: userCoords.lat,
      longitude: userCoords.lng,
      distance_m: 25,
      time: 'Hace un momento',
      description: alertNotes.trim() ? alertNotes.trim() : `Reporte inmediato emitido por ${myName}. Coordinación prioritaria en cuadrante barrial.`,
      reported_by: user?.id || 'user_actual',
      reporter_name: myName,
      is_mine: true,
      type: mappedType,
      severity: 'critical',
      image_url: alertPhoto || null
    };

    let finalAlert = newAlert;
    try {
      if (token) {
        const res = await api.reportEmergency(
          {
            title: newAlert.title,
            type: newAlert.type,
            latitude: newAlert.latitude,
            longitude: newAlert.longitude,
            location: newAlert.location,
            desc: newAlert.description,
            severity: 'critical',
            image_url: alertPhoto || null
          },
          token
        );
        if (res && res.id) {
          finalAlert = {
            ...newAlert,
            id: res.id,
            image_url: res.image_url || alertPhoto || null,
            latitude: res.latitude ? Number(res.latitude) : newAlert.latitude,
            longitude: res.longitude ? Number(res.longitude) : newAlert.longitude,
          };
        }
      }
    } catch (err) {
      console.warn('Error emitiendo emergencia en backend:', err);
    }

    setActiveEmergency(finalAlert);
    setActiveEmergenciesList((prev) => [finalAlert, ...prev.filter((e) => String(e.id) !== String(finalAlert.id))]);
    setVolunteers([]);
    setCommunityReports([]);
    setAlertPhoto(null);
    setAlertNotes('');

    if (onAlertTriggered) {
      onAlertTriggered(newAlert);
    }

    setActiveTab('map');
    Alert.alert(
      '🚨 ALERTA COMUNITARIA EMITIDA',
      `Se ha notificado a los vecinos del radar de 500m, 1.5km, 3km y 5km con prioridad concéntrica.`
    );
  };

  const handleEmergencyCall = (number, name) => {
    Linking.openURL(`tel:${number}`).catch(() => {
      Alert.alert('No se pudo abrir el marcador', `Puedes marcar directamente al ${number} (${name}).`);
    });
  };

  const emergencyTypes = [
    { key: 'medica', icon: 'medical', label: 'Médica', name: 'Urgencia Médica', sub: 'Ambulancia / Primeros auxilios' },
    { key: 'incendio', icon: 'flame', label: 'Incendio', name: 'Incendio o Humo', sub: 'Bomberos / Fuego activo' },
    { key: 'seguridad', icon: 'shield-alert', label: 'Seguridad', name: 'Alerta Vecinal', sub: 'Serenazgo / Actividad sospechosa' },
    { key: 'inundacion', icon: 'water', label: 'Inundación', name: 'Fuga o Inundación', sub: 'Rotura de tubería / Aniego' },
    { key: 'sismo', icon: 'warning', label: 'Sismo', name: 'Sismo / Estructura', sub: 'Defensa civil / Daños en vivienda' },
    { key: 'corte_luz', icon: 'flash-off', label: 'Corte Luz', name: 'Corte de Servicio', sub: 'Luz / Agua / Telecomunicaciones' }
  ];

  // Filtrado de emergencias por distancia de radar
  const filteredEmergencies = activeEmergenciesList.filter((emg) => {
    const dist = typeof emg.distance_m === 'number'
      ? emg.distance_m
      : calculateDistanceMeters(userCoords.lat, userCoords.lng, emg.latitude, emg.longitude);

    if (radarFilter === 'wave1') return dist <= 500;
    if (radarFilter === 'in_radar') return dist <= 5000;
    return true; // 'all'
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} bounces={false}>
      {/* Selector de pestañas: 'alert' (Emitir Alerta) o 'map' (Mapa & Brigada) */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'alert' && styles.tabButtonActive]}
          activeOpacity={0.8}
          onPress={() => setActiveTab('alert')}
        >
          <Ionicons
            name="warning"
            size={16}
            color={activeTab === 'alert' ? '#dc2626' : '#64748b'}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.tabButtonText, activeTab === 'alert' && styles.tabButtonTextActive]}>
            Emitir Alerta
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'map' && styles.tabButtonActive]}
          activeOpacity={0.8}
          onPress={() => setActiveTab('map')}
        >
          <Ionicons
            name="navigate-circle"
            size={16}
            color={activeTab === 'map' ? '#dc2626' : '#64748b'}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.tabButtonText, activeTab === 'map' && styles.tabButtonTextActive]}>
            Radar 5km & Brigada {activeEmergenciesList.length > 0 ? `(${activeEmergenciesList.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {/* PESTAÑA 1: EMITIR ALERTA DE EMERGENCIA */}
      {activeTab === 'alert' && (
        <View style={styles.sectionBody}>
          <View style={styles.headerBox}>
            <View style={styles.headerIconWrapper}>
              <Ionicons name="megaphone" size={28} color="#dc2626" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.headerTitle, { fontSize: scale(17) }]}>
                Centro de Respuesta Rápida
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2, flexWrap: 'wrap', gap: 6 }}>
                <Text style={[styles.headerSub, { fontSize: scale(10.5), flex: 1 }]} numberOfLines={1}>
                  📍 GPS: {userCoords.zone}
                </Text>
                <TouchableOpacity
                  style={styles.headerCalibrateBtn}
                  onPress={handleCalibrateEmergencyGps}
                  activeOpacity={0.8}
                  disabled={isCalibratingGps}
                >
                  {isCalibratingGps ? (
                    <ActivityIndicator size="small" color="#0f766e" />
                  ) : (
                    <>
                      <Ionicons name="locate" size={12} color="#0f766e" style={{ marginRight: 3 }} />
                      <Text style={styles.headerCalibrateBtnText}>Calibrar GPS</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Carrusel de Emergencias Vecinales Activas */}
          {activeEmergenciesList.length > 0 && (
            <View style={styles.activeAlertsWrapper}>
              <View style={styles.alertListHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={styles.blinkingRedDot} />
                  <Text style={[styles.alertListTitle, { fontSize: scale(13) }]}>
                    Emergencias Reportadas ({activeEmergenciesList.length})
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setActiveTab('map')} style={styles.seeMapQuickBtn}>
                  <Text style={styles.seeMapQuickBtnText}>Ver Radar 5km ›</Text>
                </TouchableOpacity>
              </View>
              <Text style={[styles.alertListSub, { fontSize: scale(11) }]}>
                Toca cualquier alerta para ver su perímetro satelital, sumarte a su auxilio o subir fotos:
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.alertsCarousel}
              >
                {activeEmergenciesList.map((emg) => {
                  const isSelected = activeEmergency && String(activeEmergency.id) === String(emg.id);
                  const icon = getEmgIcon(emg.type);
                  const bgColor = getEmgBgColor(emg.type);
                  const dist = typeof emg.distance_m === 'number'
                    ? emg.distance_m
                    : calculateDistanceMeters(userCoords.lat, userCoords.lng, emg.latitude, emg.longitude);
                  const radarInfo = getRadarTier(dist);

                  return (
                    <TouchableOpacity
                      key={emg.id}
                      style={[
                        styles.alertCarouselCard,
                        isSelected && styles.alertCarouselCardSelected
                      ]}
                      activeOpacity={0.85}
                      onPress={() => {
                        setActiveEmergency(emg);
                        loadVolunteersForEmergency(emg.id);
                        loadCommunityReports(emg.id);
                        setActiveTab('map');
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                        <View style={[styles.emgIconCircle, { backgroundColor: bgColor }]}>
                          <Text style={{ fontSize: 18 }}>{icon}</Text>
                        </View>
                        <View style={{ flex: 1, marginLeft: 8 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Text
                              style={[styles.alertItemTitle, isSelected && styles.alertItemTitleSelected, { fontSize: scale(12) }]}
                              numberOfLines={1}
                            >
                              {emg.title}
                            </Text>
                            {isEmergencyOwner(emg) && (
                              <View style={styles.myBadge}>
                                <Text style={styles.myBadgeText}>MÍA</Text>
                              </View>
                            )}
                          </View>
                          <Text style={[styles.alertItemSub, { fontSize: scale(10.5) }]} numberOfLines={1}>
                            📍 {emg.location || 'Zona A'}
                          </Text>
                        </View>
                      </View>

                      {/* Pill de Onda de Radar Concéntrico */}
                      <View style={[styles.radarPill, { backgroundColor: radarInfo.bg }]}>
                        <Text style={[styles.radarPillText, { color: radarInfo.color }]}>
                          {radarInfo.label} • {radarInfo.text}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Información de Alerta Comunitaria Activa */}
          {activeEmergency ? (
            <View style={styles.activeAlertCard}>
              <View style={styles.activeAlertHeader}>
                <View style={styles.pulseIndicator} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.activeEmergencyTitle, { fontSize: scale(15) }]}>
                    {activeEmergency.title}
                  </Text>
                  <Text style={[styles.activeEmergencySub, { fontSize: scale(11) }]}>
                    📍 {activeEmergency.location || userCoords.zone} • {activeEmergency.time || 'En curso'}
                  </Text>
                </View>
                {isEmergencyOwner(activeEmergency) && (
                  <View style={styles.myBadgeLarge}>
                    <Text style={styles.myBadgeLargeText}>TÚ LA REPORTASTE</Text>
                  </View>
                )}
              </View>

              <Text style={[styles.activeDesc, { fontSize: scale(11) }]}>
                {activeEmergency.description || 'Se requiere presencia de vecinos para validar la situación y coordinar apoyo.'}
              </Text>

              {/* Si la alerta tiene foto inicial */}
              {activeEmergency.image_url && (
                <View style={styles.alertMainPhotoContainer}>
                  <Image
                    source={{ uri: activeEmergency.image_url }}
                    style={styles.alertMainPhoto}
                    resizeMode="cover"
                  />
                  <View style={styles.alertPhotoTag}>
                    <Ionicons name="camera" size={13} color="#ffffff" style={{ marginRight: 4 }} />
                    <Text style={styles.alertPhotoTagText}>Evidencia fotográfica inicial</Text>
                  </View>
                </View>
              )}

              {/* Radar de Distancia */}
              <View style={styles.radarInfoBox}>
                <Ionicons name="radio" size={16} color="#dc2626" style={{ marginRight: 6 }} />
                <Text style={[styles.radarText, { fontSize: scale(11) }]}>
                  Radar Concéntrico VeciRed: Ondas a 500m, 1.5km, 3km y 5km (Fuera de 5km silenciado).
                </Text>
              </View>

              {/* Botón para Eliminar la Alerta si es del creador */}
              {isEmergencyOwner(activeEmergency) && (
                <TouchableOpacity
                  style={styles.deleteEmergencyBtn}
                  activeOpacity={0.8}
                  onPress={() => handleDeleteEmergency(activeEmergency)}
                >
                  <Ionicons name="trash-bin" size={16} color="#b91c1c" style={{ marginRight: 6 }} />
                  <Text style={[styles.deleteEmergencyBtnText, { fontSize: scale(12) }]}>
                    Eliminar / Cancelar Esta Alerta
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.calmCard}>
              <Ionicons name="shield-checkmark" size={32} color="#059669" />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={[styles.calmTitle, { fontSize: scale(15) }]}>
                  Barrio en Normalidad
                </Text>
                <Text style={[styles.calmSub, { fontSize: scale(11) }]}>
                  No se reportan emergencias activas en tu manzana en este momento.
                </Text>
              </View>
            </View>
          )}

          {/* Selector de Tipo de Emergencia */}
          <View style={styles.typeSelectorWrapper}>
            <Text style={[styles.typesTitle, { fontSize: scale(13) }]}>
              Selecciona el tipo de contingencia:
            </Text>
            <Text style={[styles.typesSub, { fontSize: scale(11) }]}>
              Al activar la alerta, llegará de inmediato al radar vecinal concéntrico de 500m a 5km.
            </Text>

            <View style={styles.typeGrid}>
              {emergencyTypes.map((item) => {
                const isSelected = selectedType?.key === item.key;
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[styles.typeItem, isSelected && styles.typeItemSelected]}
                    activeOpacity={0.8}
                    onPress={() => setSelectedType(item)}
                  >
                    <View style={styles.typeItemRow}>
                      <View style={[styles.typeIconBox, isSelected && styles.typeIconBoxSelected]}>
                        <Ionicons
                          name={item.icon}
                          size={22}
                          color={isSelected ? '#ffffff' : '#dc2626'}
                        />
                      </View>
                      <View style={{ flex: 1, marginLeft: 10 }}>
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

            {/* Adjuntar Foto del Accidente / Suceso para la nueva alerta */}
            <View style={styles.photoUploadCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="camera" size={18} color="#dc2626" />
                  <Text style={[styles.photoUploadTitle, { fontSize: scale(12.5) }]}>
                    Foto del Accidente o Suceso (Opcional)
                  </Text>
                </View>
                {alertPhoto && (
                  <TouchableOpacity onPress={() => setAlertPhoto(null)} style={styles.removeAlertPhotoBtn}>
                    <Ionicons name="close" size={14} color="#dc2626" />
                    <Text style={styles.removeAlertPhotoText}>Quitar</Text>
                  </TouchableOpacity>
                )}
              </View>

              {alertPhoto ? (
                <View style={styles.alertPhotoPreviewWrapper}>
                  <Image source={{ uri: alertPhoto }} style={styles.alertPhotoPreview} resizeMode="cover" />
                  <View style={styles.alertPhotoBadge}>
                    <Ionicons name="checkmark-circle" size={14} color="#16a34a" />
                    <Text style={styles.alertPhotoBadgeText}>Foto lista para enviar con la alerta</Text>
                  </View>
                </View>
              ) : (
                <View>
                  <Text style={[styles.photoUploadSub, { fontSize: scale(10.5) }]}>
                    Adjunta una fotografía de la situación para que la brigada vecinal actúe de inmediato:
                  </Text>
                  <View style={styles.photoActionButtonsRow}>
                    <TouchableOpacity
                      style={styles.photoActionBtn}
                      onPress={handleTakeAlertPhoto}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="camera-outline" size={18} color="#0f766e" />
                      <Text style={[styles.photoActionBtnText, { fontSize: scale(11) }]}>Tomar Foto</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.photoActionBtn}
                      onPress={handlePickAlertPhoto}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="image-outline" size={18} color="#0f766e" />
                      <Text style={[styles.photoActionBtnText, { fontSize: scale(11) }]}>Galería</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Campo para notas adicionales */}
              <TextInput
                style={[styles.alertNotesInput, { fontSize: scale(11) }]}
                placeholder="Detalle adicional (ej: piso 3, humo denso, personas mayores dentro)..."
                placeholderTextColor="#94a3b8"
                value={alertNotes}
                onChangeText={setAlertNotes}
                multiline
                numberOfLines={2}
              />
            </View>

            {/* Botón Principal para Activar Alerta */}
            <TouchableOpacity
              style={[
                styles.triggerAlertBtn,
                !selectedType && styles.triggerAlertBtnDisabled
              ]}
              activeOpacity={0.85}
              onPress={handleTriggerAlert}
            >
              <Ionicons name="alert-circle" size={24} color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={[styles.triggerAlertBtnText, { fontSize: scale(14) }]}>
                {selectedType ? `🚨 ACTIVAR ALERTA: ${selectedType.name.toUpperCase()}` : 'SELECCIONA UNA CONTINGENCIA ARRIBA'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* PESTAÑA 2: RADAR SATELITAL 5KM & BRIGADA & MURO EN VIVO */}
      {activeTab === 'map' && (
        <View style={styles.sectionBody}>
          {/* Filtros de Radar Concéntrico */}
          <View style={styles.radarFilterBar}>
            <TouchableOpacity
              style={[styles.radarFilterBtn, radarFilter === 'all' && styles.radarFilterBtnActive]}
              onPress={() => setRadarFilter('all')}
            >
              <Text style={[styles.radarFilterText, radarFilter === 'all' && styles.radarFilterTextActive]}>
                Todas ({activeEmergenciesList.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.radarFilterBtn, radarFilter === 'in_radar' && styles.radarFilterBtnActive]}
              onPress={() => setRadarFilter('in_radar')}
            >
              <Text style={[styles.radarFilterText, radarFilter === 'in_radar' && styles.radarFilterTextActive]}>
                🚨 En Radar (≤5km)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.radarFilterBtn, radarFilter === 'wave1' && styles.radarFilterBtnActive]}
              onPress={() => setRadarFilter('wave1')}
            >
              <Text style={[styles.radarFilterText, radarFilter === 'wave1' && styles.radarFilterTextActive]}>
                🔴 Onda 1 (≤500m)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Carrusel horizontal para cambiar entre emergencias */}
          {filteredEmergencies.length > 0 && (
            <View style={{ marginBottom: 12 }}>
              <View style={styles.alertListHeader}>
                <Text style={[styles.alertListTitle, { fontSize: scale(13) }]}>
                  🚨 Alertas en Seguimiento ({filteredEmergencies.length})
                </Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 4, gap: 8, paddingVertical: 4 }}
              >
                {filteredEmergencies.map((emg) => {
                  const isSelected = activeEmergency && String(activeEmergency.id) === String(emg.id);
                  const dist = typeof emg.distance_m === 'number'
                    ? emg.distance_m
                    : calculateDistanceMeters(userCoords.lat, userCoords.lng, emg.latitude, emg.longitude);
                  const tier = getRadarTier(dist);

                  return (
                    <TouchableOpacity
                      key={emg.id}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 7,
                        borderRadius: 10,
                        backgroundColor: isSelected ? '#fee2e2' : '#f8fafc',
                        borderWidth: 1.5,
                        borderColor: isSelected ? '#dc2626' : '#cbd5e1',
                        minWidth: 130
                      }}
                      onPress={() => {
                        setActiveEmergency(emg);
                        loadVolunteersForEmergency(emg.id);
                        loadCommunityReports(emg.id);
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text style={{ fontSize: 13 }}>{getEmgIcon(emg.type)}</Text>
                        <Text
                          style={{
                            fontWeight: isSelected ? '800' : '600',
                            fontSize: scale(11),
                            color: isSelected ? '#991b1b' : '#334155'
                          }}
                          numberOfLines={1}
                        >
                          {emg.title}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 9.5, color: tier.color, fontWeight: '700', marginTop: 2 }}>
                        {tier.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Mapa Satelital Interactivo con 4 Ondas de Radar (500m, 1.5km, 3km, 5km) */}
          <InteractiveCommunityMap
            key={`emg-map-${activeEmergency?.id || 'main'}-${activeEmergency?.latitude || userCoords.lat}-${activeEmergency?.longitude || userCoords.lng}`}
            latitude={activeEmergency?.latitude ? Number(activeEmergency.latitude) : userCoords.lat}
            longitude={activeEmergency?.longitude ? Number(activeEmergency.longitude) : userCoords.lng}
            title={activeEmergency?.title || 'Epicentro de Emergencia Comunitaria'}
            subtitle={`${activeEmergency?.location || userCoords.zone} (Radar: 🔴 500m | 🟠 1.5km | 🟡 3km | 🔵 5km)`}
            height={270}
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
              {volunteers.length === 0 ? (
                <View style={styles.emptyBrigadeWrapper}>
                  <Text style={{ fontSize: 24, marginBottom: 4 }}>🤝</Text>
                  <Text style={[styles.emptyBrigadeTitle, { fontSize: scale(12) }]}>
                    Aún no hay brigadistas registrados para esta alerta
                  </Text>
                  <Text style={[styles.emptyBrigadeSub, { fontSize: scale(11) }]}>
                    ¡Sé el primero en sumarte a la brigada para coordinar auxilio vecinal inmediato!
                  </Text>
                </View>
              ) : (
                volunteers.map((vol) => (
                  <View key={vol.id} style={styles.volunteerItem}>
                    <View style={styles.volunteerAvatarCircle}>
                      <Text style={{ fontSize: 22 }}>{vol.avatar || '🧑'}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={[styles.volName, { fontSize: scale(12) }]}>{vol.name}</Text>
                        <Text style={styles.volDistance}>📍 {vol.distance_m ? `${vol.distance_m}m` : (vol.distance || '50m')}</Text>
                      </View>
                      <Text style={[styles.volSkill, { fontSize: scale(11) }]}>{vol.skill}</Text>
                    </View>
                  </View>
                ))
              )}
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

          {/* MURO COMUNITARIO DE REPORTES Y FOTOS EN VIVO (RED SOCIAL DE LA ALERTA) */}
          <View style={styles.communityFeedCard}>
            <View style={styles.communityFeedHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="images" size={19} color="#dc2626" />
                <Text style={[styles.communityFeedTitle, { fontSize: scale(13) }]}>
                  📸 Evidencias y Reportes en Vivo ({communityReports.length})
                </Text>
              </View>
              {isLoadingReports && <ActivityIndicator size="small" color="#dc2626" />}
            </View>
            <Text style={[styles.communityFeedSub, { fontSize: scale(11) }]}>
              Cualquier vecino o voluntario en el lugar puede subir fotos y novedades del suceso en tiempo real:
            </Text>

            {/* Compositor para subir nuevo reporte y foto */}
            <View style={styles.reportComposerBox}>
              <TextInput
                style={[styles.reportInput, { fontSize: scale(11) }]}
                placeholder="Escribe una actualización (ej: 'Llegaron bomberos', 'calle despejada')..."
                placeholderTextColor="#94a3b8"
                value={reportMessage}
                onChangeText={setReportMessage}
                multiline
                numberOfLines={2}
              />

              {reportPhoto && (
                <View style={styles.reportPhotoPreviewBox}>
                  <Image source={{ uri: reportPhoto }} style={styles.reportPhotoPreviewThumb} resizeMode="cover" />
                  <TouchableOpacity
                    style={styles.reportPhotoRemoveBtn}
                    onPress={() => setReportPhoto(null)}
                  >
                    <Ionicons name="close-circle" size={18} color="#ef4444" />
                    <Text style={styles.reportPhotoRemoveText}>Quitar</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.composerActionsRow}>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <TouchableOpacity
                    style={styles.composerToolBtn}
                    onPress={handleTakeReportPhoto}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="camera" size={16} color="#0f766e" />
                    <Text style={styles.composerToolText}>Cámara</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.composerToolBtn}
                    onPress={handlePickReportPhoto}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="image" size={16} color="#0f766e" />
                    <Text style={styles.composerToolText}>Galería</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.postReportBtn, isPostingReport && { opacity: 0.6 }]}
                  onPress={handlePostCommunityReport}
                  disabled={isPostingReport}
                  activeOpacity={0.85}
                >
                  {isPostingReport ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <Ionicons name="send" size={14} color="#ffffff" style={{ marginRight: 4 }} />
                      <Text style={styles.postReportBtnText}>Publicar</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Lista de Reportes y Evidencias subidas por la comunidad */}
            <View style={styles.reportsFeedList}>
              {communityReports.length === 0 ? (
                <View style={styles.emptyReportsBox}>
                  <Text style={{ fontSize: 22, marginBottom: 2 }}>📸</Text>
                  <Text style={[styles.emptyReportsTitle, { fontSize: scale(11.5) }]}>
                    Aún no hay evidencias fotográficas registradas
                  </Text>
                  <Text style={[styles.emptyReportsSub, { fontSize: scale(10.5) }]}>
                    Si estás cerca del suceso, comparte una foto para alertar a toda la comunidad.
                  </Text>
                </View>
              ) : (
                communityReports.map((rep) => {
                  const isAuthor =
                    (user?.id && rep.user_id && String(rep.user_id) === String(user.id)) ||
                    rep.author_name === myName ||
                    String(rep.id).startsWith('rep_');
                  const isEditingThis = editingReportId === rep.id;

                  return (
                    <View key={rep.id} style={styles.reportItemCard}>
                      <View style={styles.reportItemHeader}>
                        <View style={styles.reportAvatar}>
                          <Text style={{ fontSize: 18 }}>{rep.author_avatar || '🧑'}</Text>
                        </View>
                        <View style={{ flex: 1, marginLeft: 8 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Text style={[styles.reportAuthorName, { fontSize: scale(12) }]}>
                              {rep.author_name || 'Vecino'} {isAuthor && <Text style={{ fontSize: scale(10), color: '#0d9488', fontWeight: '800' }}>• Tú</Text>}
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Text style={styles.reportTimeText}>
                                📍 {rep.distance_m ? `${rep.distance_m}m` : 'Cerca'}
                              </Text>
                              {isAuthor && (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 4 }}>
                                  <TouchableOpacity
                                    onPress={() => handleStartEditReport(rep)}
                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                    accessibilityLabel="Editar reporte"
                                  >
                                    <Feather name="edit-2" size={13} color="#0d9488" />
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                    onPress={() => handleDeleteReport(rep)}
                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                    accessibilityLabel="Eliminar reporte"
                                  >
                                    <Feather name="trash-2" size={13} color="#dc2626" />
                                  </TouchableOpacity>
                                </View>
                              )}
                            </View>
                          </View>
                          {rep.role_badge && (
                            <View style={styles.roleBadgePill}>
                              <Text style={styles.roleBadgeText}>{rep.role_badge}</Text>
                            </View>
                          )}
                        </View>
                      </View>

                      {isEditingThis ? (
                        <View style={{ marginTop: 6, backgroundColor: '#ffffff', borderRadius: 8, padding: 8, borderWidth: 1, borderColor: '#0d9488' }}>
                          <TextInput
                            style={{ fontSize: scale(11.5), color: '#0f172a', minHeight: 45 }}
                            value={editingReportText}
                            onChangeText={setEditingReportText}
                            multiline
                            placeholder="Escribe la actualización corregida..."
                          />
                          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 6 }}>
                            <TouchableOpacity
                              onPress={handleCancelEditReport}
                              style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: '#f1f5f9' }}
                            >
                              <Text style={{ fontSize: scale(10.5), color: '#64748b', fontWeight: '700' }}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => handleSaveEditReport(rep)}
                              disabled={isSavingEdit}
                              style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6, backgroundColor: '#0d9488' }}
                            >
                              {isSavingEdit ? (
                                <ActivityIndicator size="small" color="#ffffff" />
                              ) : (
                                <Text style={{ fontSize: scale(10.5), color: '#ffffff', fontWeight: '800' }}>Guardar</Text>
                              )}
                            </TouchableOpacity>
                          </View>
                        </View>
                      ) : (
                        rep.message && (
                          <Text style={[styles.reportItemMessage, { fontSize: scale(11.5) }]}>
                            {rep.message}
                          </Text>
                        )
                      )}

                      {rep.image_url && (
                        <View style={styles.reportImageContainer}>
                          <Image
                            source={{ uri: rep.image_url }}
                            style={styles.reportImage}
                            resizeMode="cover"
                          />
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </View>
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
            onPress={() => handleEmergencyCall('116', 'Bomberos')}
          >
            <Ionicons name="flame" size={14} color="#dc2626" style={{ marginRight: 4 }} />
            <Text style={styles.hotlineText}>116 Bomberos</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.hotlinePill}
            onPress={() => handleEmergencyCall('105', 'Policía')}
          >
            <Ionicons name="shield" size={14} color="#1d4ed8" style={{ marginRight: 4 }} />
            <Text style={styles.hotlineText}>105 Policía</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.hotlinePill}
            onPress={() => handleEmergencyCall('106', 'SAMU')}
          >
            <Ionicons name="medkit" size={14} color="#059669" style={{ marginRight: 4 }} />
            <Text style={styles.hotlineText}>106 SAMU</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  headerCalibrateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ccfbf1',
    borderWidth: 1,
    borderColor: '#99f6e4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  headerCalibrateBtnText: {
    color: '#0f766e',
    fontSize: 10.5,
    fontWeight: '800'
  },
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  contentContainer: {
    padding: 14,
    paddingBottom: 130
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 4,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8
  },
  tabButtonActive: {
    backgroundColor: '#fef2f2'
  },
  tabButtonText: {
    fontWeight: '700',
    color: '#64748b',
    fontSize: 13
  },
  tabButtonTextActive: {
    color: '#dc2626'
  },
  sectionBody: {
    gap: 12
  },
  headerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#fecaca',
    shadowColor: '#dc2626',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2
  },
  headerIconWrapper: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerTitle: {
    fontWeight: '800',
    color: '#991b1b'
  },
  headerSub: {
    color: '#64748b',
    marginTop: 2
  },
  activeAlertsWrapper: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  alertListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  blinkingRedDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#dc2626'
  },
  alertListTitle: {
    fontWeight: '800',
    color: '#1e293b'
  },
  seeMapQuickBtn: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  seeMapQuickBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#dc2626'
  },
  alertListSub: {
    color: '#64748b',
    marginBottom: 8
  },
  alertsCarousel: {
    gap: 8,
    paddingVertical: 2
  },
  alertCarouselCard: {
    width: 220,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1.5,
    borderColor: '#e2e8f0'
  },
  alertCarouselCardSelected: {
    backgroundColor: '#fef2f2',
    borderColor: '#dc2626'
  },
  emgIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center'
  },
  alertItemTitle: {
    fontWeight: '700',
    color: '#334155'
  },
  alertItemTitleSelected: {
    color: '#991b1b'
  },
  alertItemSub: {
    color: '#64748b'
  },
  myBadge: {
    backgroundColor: '#059669',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4
  },
  myBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800'
  },
  radarPill: {
    marginTop: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    alignItems: 'center'
  },
  radarPillText: {
    fontSize: 10,
    fontWeight: '800'
  },
  activeAlertCard: {
    backgroundColor: '#fef2f2',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#dc2626'
  },
  activeAlertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  pulseIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#dc2626',
    marginRight: 10
  },
  activeEmergencyTitle: {
    fontWeight: '800',
    color: '#991b1b'
  },
  activeEmergencySub: {
    color: '#7f1d1d',
    marginTop: 2
  },
  myBadgeLarge: {
    backgroundColor: '#059669',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  myBadgeLargeText: {
    color: '#ffffff',
    fontSize: 9.5,
    fontWeight: '800'
  },
  activeDesc: {
    color: '#334155',
    lineHeight: 17,
    marginBottom: 8
  },
  alertMainPhotoContainer: {
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 8,
    position: 'relative'
  },
  alertMainPhoto: {
    width: '100%',
    height: 160
  },
  alertPhotoTag: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  alertPhotoTagText: {
    color: '#ffffff',
    fontSize: 10.5,
    fontWeight: '700'
  },
  radarInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 8,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#fecaca'
  },
  radarText: {
    color: '#7f1d1d',
    fontWeight: '600',
    flex: 1
  },
  deleteEmergencyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#f87171',
    borderRadius: 8,
    paddingVertical: 7,
    marginTop: 8
  },
  deleteEmergencyBtnText: {
    color: '#b91c1c',
    fontWeight: '800'
  },
  calmCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#bbf7d0'
  },
  calmTitle: {
    fontWeight: '800',
    color: '#166534'
  },
  calmSub: {
    color: '#15803d',
    marginTop: 2
  },
  typeSelectorWrapper: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  typesTitle: {
    fontWeight: '800',
    color: '#1e293b'
  },
  typesSub: {
    color: '#64748b',
    marginBottom: 12
  },
  typeGrid: {
    gap: 8,
    marginBottom: 12
  },
  typeItem: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1.5,
    borderColor: '#e2e8f0'
  },
  typeItemSelected: {
    backgroundColor: '#fef2f2',
    borderColor: '#dc2626'
  },
  typeItemRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  typeIconBox: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center'
  },
  typeIconBoxSelected: {
    backgroundColor: '#dc2626'
  },
  typeItemName: {
    fontWeight: '700',
    color: '#1e293b'
  },
  activePillSmall: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4
  },
  activePillSmallText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800'
  },
  typeItemSub: {
    color: '#64748b',
    marginTop: 2
  },
  photoUploadCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12
  },
  photoUploadTitle: {
    fontWeight: '700',
    color: '#1e293b'
  },
  removeAlertPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#fee2e2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  removeAlertPhotoText: {
    color: '#dc2626',
    fontSize: 10.5,
    fontWeight: '700'
  },
  alertPhotoPreviewWrapper: {
    borderRadius: 8,
    overflow: 'hidden',
    marginVertical: 6,
    position: 'relative'
  },
  alertPhotoPreview: {
    width: '100%',
    height: 140
  },
  alertPhotoBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  alertPhotoBadgeText: {
    color: '#16a34a',
    fontSize: 10,
    fontWeight: '800'
  },
  photoUploadSub: {
    color: '#64748b',
    marginBottom: 6
  },
  photoActionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8
  },
  photoActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#ccfbf1',
    borderWidth: 1,
    borderColor: '#99f6e4',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6
  },
  photoActionBtnText: {
    color: '#0f766e',
    fontWeight: '700'
  },
  alertNotesInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 8,
    color: '#1e293b'
  },
  triggerAlertBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dc2626',
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#dc2626',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  triggerAlertBtnDisabled: {
    backgroundColor: '#94a3b8',
    shadowOpacity: 0
  },
  triggerAlertBtnText: {
    color: '#ffffff',
    fontWeight: '900'
  },
  radarFilterBar: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4
  },
  radarFilterBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1'
  },
  radarFilterBtnActive: {
    backgroundColor: '#fee2e2',
    borderColor: '#dc2626'
  },
  radarFilterText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b'
  },
  radarFilterTextActive: {
    color: '#dc2626'
  },
  brigadeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 8
  },
  brigadeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4
  },
  brigadeTitle: {
    fontWeight: '800',
    color: '#0f766e'
  },
  brigadeSub: {
    color: '#64748b',
    marginBottom: 10
  },
  volunteerList: {
    gap: 8,
    marginBottom: 10
  },
  emptyBrigadeWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  emptyBrigadeTitle: {
    fontWeight: '800',
    color: '#334155',
    textAlign: 'center'
  },
  emptyBrigadeSub: {
    color: '#64748b',
    textAlign: 'center',
    marginTop: 2,
    paddingHorizontal: 10
  },
  volunteerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#bbf7d0'
  },
  volunteerAvatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center'
  },
  volName: {
    fontWeight: '800',
    color: '#166534'
  },
  volDistance: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803d'
  },
  volSkill: {
    color: '#166534',
    marginTop: 1
  },
  joinBrigadeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0d9488',
    paddingVertical: 11,
    borderRadius: 10
  },
  joinBrigadeBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 12
  },
  communityFeedCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 8
  },
  communityFeedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  communityFeedTitle: {
    fontWeight: '800',
    color: '#991b1b'
  },
  communityFeedSub: {
    color: '#64748b',
    marginBottom: 10
  },
  reportComposerBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    marginBottom: 12
  },
  reportInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 8,
    color: '#1e293b',
    marginBottom: 8
  },
  reportPhotoPreviewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8
  },
  reportPhotoPreviewThumb: {
    width: 60,
    height: 60,
    borderRadius: 6
  },
  reportPhotoRemoveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  reportPhotoRemoveText: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '700'
  },
  composerActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  composerToolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ccfbf1',
    borderWidth: 1,
    borderColor: '#99f6e4',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6
  },
  composerToolText: {
    color: '#0f766e',
    fontSize: 11,
    fontWeight: '700'
  },
  postReportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dc2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6
  },
  postReportBtnText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '800'
  },
  reportsFeedList: {
    gap: 10
  },
  emptyReportsBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  emptyReportsTitle: {
    fontWeight: '700',
    color: '#334155',
    textAlign: 'center'
  },
  emptyReportsSub: {
    color: '#64748b',
    textAlign: 'center',
    marginTop: 2,
    paddingHorizontal: 12
  },
  reportItemCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  reportItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6
  },
  reportAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1'
  },
  reportAuthorName: {
    fontWeight: '800',
    color: '#1e293b'
  },
  reportTimeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#dc2626'
  },
  roleBadgePill: {
    alignSelf: 'flex-start',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 1
  },
  roleBadgeText: {
    color: '#1e40af',
    fontSize: 9.5,
    fontWeight: '700'
  },
  reportItemMessage: {
    color: '#334155',
    lineHeight: 16,
    marginBottom: 6
  },
  reportImageContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 4
  },
  reportImage: {
    width: '100%',
    height: 180
  },
  officialHotlinesBox: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 6
  },
  officialTitle: {
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 8
  },
  hotlinesRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between'
  },
  hotlinePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  hotlineText: {
    fontWeight: '800',
    fontSize: 11,
    color: '#334155'
  }
});
