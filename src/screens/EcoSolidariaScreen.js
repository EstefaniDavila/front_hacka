import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  TextInput
} from 'react-native';
import { COLORS } from '../theme/colors';
import { mockEmergencyNeeds } from '../data/mockData';

const DEFAULT_EMERGENCY_NEEDS = [
  {
    id: "need-001",
    emergency_id: "emg-001",
    resource_name: "Agua potable",
    icon: "💧",
    quantity_required: 20,
    quantity_committed: 8,
    unit: "botellas",
    priority: "Alta",
    status: "active"
  },
  {
    id: "need-002",
    emergency_id: "emg-001",
    resource_name: "Alimentos",
    icon: "🍴",
    quantity_required: 15,
    quantity_committed: 10,
    unit: "packs",
    priority: "Alta",
    status: "active"
  },
  {
    id: "need-003",
    emergency_id: "emg-001",
    resource_name: "Mantas y frazadas",
    icon: "🛏️",
    quantity_required: 10,
    quantity_committed: 3,
    unit: "unidades",
    priority: "Media",
    status: "active"
  }
];

export default function EcoSolidariaScreen({ onNavigate, fontScale = 1.0, onIncrementHelped, onOpenChat }) {
  const [needs, setNeeds] = useState(
    Array.isArray(mockEmergencyNeeds) && mockEmergencyNeeds.length > 0
      ? mockEmergencyNeeds
      : DEFAULT_EMERGENCY_NEEDS
  );
  const [selectedNeed, setSelectedNeed] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [contributedMap, setContributedMap] = useState({});
  const [contributionQty, setContributionQty] = useState(1);

  // Pantalla especial "Se necesita" (Solicitud de Recursos Urgentes)
  const [needModalVisible, setNeedModalVisible] = useState(false);
  const [needCategory, setNeedCategory] = useState('Agua Potable');
  const [needUrgency, setNeedUrgency] = useState('Alta (Hoy)');
  const [needDescription, setNeedDescription] = useState('');
  const [needLocation, setNeedLocation] = useState('Manzana 2, Lote ');
  const [needContact, setNeedContact] = useState('');

  // Pantalla especial "Puedo aportar" (Ofrecer Recursos o Ayuda)
  const [offerModalVisible, setOfferModalVisible] = useState(false);
  const [offerCategory, setOfferCategory] = useState('Agua Potable');
  const [offerType, setOfferType] = useState('Donación');
  const [offerDelivery, setOfferDelivery] = useState('Centro de Acopio');
  const [offerDescription, setOfferDescription] = useState('');
  const [offerContact, setOfferContact] = useState('');

  const handleCreateNeed = () => {
    if (!needDescription.trim()) {
      Alert.alert('Falta descripción', 'Describe brevemente qué insumos o ayuda requiere tu familia.');
      return;
    }
    const categoryIcons = {
      'Agua Potable': '💧',
      'Alimentos / Víveres': '🍴',
      'Medicinas / Primeros Aux.': '💊',
      'Frazadas / Ropa Seca': '🛏️',
      'Linternas / Baterías': '🔦',
      'Herramientas / Palas': '🛠️',
      'Evacuación / Rescate': '🦺'
    };
    const newNeedItem = {
      id: Date.now().toString(),
      resource_name: needCategory,
      category: needCategory,
      icon: categoryIcons[needCategory] || '📦',
      quantity_required: 10,
      quantity_committed: 0,
      unit: 'unidades',
      urgency: needUrgency.includes('Inmediata') ? 'crítica' : 'alta',
      status: 'active',
      description: needDescription.trim(),
      location: needLocation.trim() || 'Manzana 2',
      contact: needContact.trim()
    };
    setNeeds(prev => [newNeedItem, ...prev]);
    setNeedModalVisible(false);
    setNeedDescription('');
    Alert.alert('🚨 Solicitud Publicada', 'Tu requerimiento fue enviado al Muro de Emergencia y notificado a la brigada vecinal.');
  };

  const handleCreateOffer = () => {
    if (!offerDescription.trim()) {
      Alert.alert('Falta descripción', 'Describe qué recurso o apoyo estás ofreciendo a los vecinos.');
      return;
    }
    setOfferModalVisible(false);
    setOfferDescription('');
    onIncrementHelped();
    Alert.alert('🤝 ¡Aporte Registrado!', `Tu ofrecimiento de ${offerCategory} (${offerType}) ha sido publicado. ¡Muchas gracias por solidarizarte con Zona A!`);
  };

  const scale = (val) => Math.round(val * fontScale);

  const openNeedDetail = (need) => {
    setSelectedNeed(need);
    setContributionQty(1);
    setModalVisible(true);
  };

  const handlePledgeContribution = () => {
    if (!selectedNeed) return;
    const qty = Math.max(1, contributionQty);

    setNeeds(prev => prev.map(n => {
      if (n.id === selectedNeed.id) {
        return {
          ...n,
          quantity_committed: Math.min(n.quantity_required, n.quantity_committed + qty)
        };
      }
      return n;
    }));

    setSelectedNeed(prev => ({
      ...prev,
      quantity_committed: Math.min(prev.quantity_required, prev.quantity_committed + qty)
    }));

    setContributedMap(prev => ({
      ...prev,
      [selectedNeed.id]: (prev[selectedNeed.id] || 0) + qty
    }));

    if (onIncrementHelped) onIncrementHelped();

    Alert.alert(
      '🎉 ¡Aporte Registrado!',
      `Has comprometido ${qty} ${selectedNeed.unit} de ${selectedNeed.resource_name} para las familias de Manzana 2.\nPunto de acopio: Casa Comunal Manzana 2.`
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
          activeOpacity={0.85}
          onPress={() => setNeedModalVisible(true)}
        >
          <View style={styles.btnPlusCircle}>
            <Ionicons name="add" size={20} color="#ffffff" />
          </View>
          <Text style={[styles.actionBtnTitle, { fontSize: scale(12) }]}>Se necesita</Text>
          <Text style={[styles.actionBtnSub, { fontSize: scale(9) }]}>Solicita recursos urgentes</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtnOffer}
          activeOpacity={0.85}
          onPress={() => setOfferModalVisible(true)}
        >
          <View style={styles.btnHandsCircle}>
            <MaterialCommunityIcons name="hand-heart" size={18} color="#ffffff" />
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

                {/* Selector Interactivo de Cantidad para Aportar */}
                <View style={styles.quantityPickerRow}>
                  <Text style={[styles.quantityLabel, { fontSize: scale(12) }]}>
                    ¿Cuántas unidades deseas aportar?
                  </Text>
                  <View style={styles.quantityControls}>
                    <TouchableOpacity
                      style={styles.quantityBtn}
                      onPress={() => setContributionQty(prev => Math.max(1, prev - 1))}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.quantityBtnText}>−</Text>
                    </TouchableOpacity>
                    <View style={styles.quantityValueBox}>
                      <Text style={[styles.quantityValueText, { fontSize: scale(16) }]}>
                        {contributionQty}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.quantityBtn}
                      onPress={() => {
                        const remaining = Math.max(1, selectedNeed.quantity_required - selectedNeed.quantity_committed);
                        setContributionQty(prev => Math.min(remaining, prev + 1));
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.quantityBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {contributedMap[selectedNeed.id] > 0 && (
                  <View style={{ backgroundColor: '#dcfce7', padding: 8, borderRadius: 10, marginVertical: 6, alignItems: 'center' }}>
                    <Text style={{ color: '#15803d', fontWeight: '800', fontSize: scale(11) }}>
                      ✅ Ya te comprometiste con {contributedMap[selectedNeed.id]} {selectedNeed.unit}
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.modalPledgeBtn, (contributedMap[selectedNeed.id] > 0) && { backgroundColor: COLORS.primaryDark }]}
                  activeOpacity={0.8}
                  onPress={handlePledgeContribution}
                >
                  <Text style={[styles.modalPledgeBtnText, { fontSize: scale(14) }]}>
                    {(contributedMap[selectedNeed.id] > 0)
                      ? `🤝 APORTAR OTROS ${contributionQty} ${selectedNeed.unit.toUpperCase()}`
                      : `🤝 APORTAR ${contributionQty} ${selectedNeed.unit.toUpperCase()}`}
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


      {/* ========================================================================= */}
      {/* PANTALLA ESPECIAL 1: "SE NECESITA" (SOLICITUD DE RECURSOS URGENTES)      */}
      {/* ========================================================================= */}
      <Modal
        visible={needModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setNeedModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.specialModalContainer}>
            {/* Cabecera Roja de Emergencia */}
            <View style={styles.emergencyModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={styles.specialHeaderIconCircle}>
                  <Ionicons name="alert-circle" size={22} color="#ffffff" />
                </View>
                <View>
                  <Text style={styles.specialHeaderTitle}>Solicitar Recursos Urgentes</Text>
                  <Text style={styles.specialHeaderSub}>Emergencia Activa: Inundación en Zona A</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setNeedModalVisible(false)} style={styles.closeSpecialModalBtn}>
                <Ionicons name="close" size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.specialModalBody} showsVerticalScrollIndicator={false}>
              {/* Categoría del Recurso */}
              <Text style={styles.formInputLabel}>¿Qué recurso necesitas con urgencia? *</Text>
              <View style={styles.optionsWrapRow}>
                {[
                  { label: '💧 Agua Potable', val: 'Agua Potable' },
                  { label: '🍞 Alimentos / Víveres', val: 'Alimentos / Víveres' },
                  { label: '💊 Medicinas / Primeros Aux.', val: 'Medicinas / Primeros Aux.' },
                  { label: '🛏️ Frazadas / Ropa Seca', val: 'Frazadas / Ropa Seca' },
                  { label: '🔦 Linternas / Baterías', val: 'Linternas / Baterías' },
                  { label: '🛠️ Herramientas / Palas', val: 'Herramientas / Palas' },
                  { label: '🦺 Evacuación / Rescate', val: 'Evacuación / Rescate' }
                ].map((item) => (
                  <TouchableOpacity
                    key={item.val}
                    style={[styles.specialOptionChip, needCategory === item.val && styles.specialOptionChipActive]}
                    onPress={() => setNeedCategory(item.val)}
                  >
                    <Text style={[styles.specialOptionChipText, needCategory === item.val && styles.specialOptionChipTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Nivel de Urgencia */}
              <Text style={styles.formInputLabel}>Nivel de Urgencia *</Text>
              <View style={styles.optionsWrapRow}>
                {[
                  { label: '🔴 Inmediata (< 2 horas)', val: 'Inmediata (< 2 horas)', color: '#dc2626' },
                  { label: '🟠 Alta (Hoy mismo)', val: 'Alta (Hoy)', color: '#ea580c' },
                  { label: '🟡 Prioritaria (24 horas)', val: 'Prioritaria (24 horas)', color: '#d97706' }
                ].map((item) => (
                  <TouchableOpacity
                    key={item.val}
                    style={[
                      styles.urgencyChip,
                      needUrgency === item.val && { borderColor: item.color, backgroundColor: item.color + '15' }
                    ]}
                    onPress={() => setNeedUrgency(item.val)}
                  >
                    <Text style={[styles.urgencyChipText, needUrgency === item.val && { color: item.color, fontWeight: '800' }]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Detalle */}
              <Text style={styles.formInputLabel}>Descripción de la necesidad *</Text>
              <TextInput
                style={styles.specialTextInput}
                placeholder="Ej: Familia de 4 personas (2 niños). Necesitamos 2 bidones de agua de 7L y pañales en Manzana 2..."
                placeholderTextColor="#94a3b8"
                value={needDescription}
                onChangeText={setNeedDescription}
                multiline
                numberOfLines={3}
              />

              {/* Ubicación */}
              <Text style={styles.formInputLabel}>Ubicación exacta en el barrio</Text>
              <TextInput
                style={styles.specialTextInputSingle}
                placeholder="Ej: Manzana 2 Lote 14 (frente al parque)"
                placeholderTextColor="#94a3b8"
                value={needLocation}
                onChangeText={setNeedLocation}
              />

              {/* Teléfono de Contacto */}
              <Text style={styles.formInputLabel}>Teléfono / WhatsApp de coordinación</Text>
              <TextInput
                style={styles.specialTextInputSingle}
                placeholder="Ej: 987 654 321"
                placeholderTextColor="#94a3b8"
                keyboardType="phone-pad"
                value={needContact}
                onChangeText={setNeedContact}
              />

              {/* Botón de Enviar Solicitud */}
              <TouchableOpacity
                style={styles.specialSubmitNeedBtn}
                activeOpacity={0.85}
                onPress={handleCreateNeed}
              >
                <Ionicons name="megaphone" size={18} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.specialSubmitBtnText}>Publicar Solicitud de Emergencia</Text>
              </TouchableOpacity>
              <View style={{ height: 30 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* PANTALLA ESPECIAL 2: "PUEDO APORTAR" (OFRECER AYUDA O RECURSOS)            */}
      {/* ========================================================================= */}
      <Modal
        visible={offerModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setOfferModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.specialModalContainer}>
            {/* Cabecera Verde de Solidaridad */}
            <View style={styles.solidarityModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={styles.specialHeaderIconCircleTeal}>
                  <MaterialCommunityIcons name="hand-heart" size={22} color="#ffffff" />
                </View>
                <View>
                  <Text style={styles.specialHeaderTitle}>Puedo Aportar / Ayudar</Text>
                  <Text style={styles.specialHeaderSub}>Solidaridad Vecinal en Zona A</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setOfferModalVisible(false)} style={styles.closeSpecialModalBtn}>
                <Ionicons name="close" size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.specialModalBody} showsVerticalScrollIndicator={false}>
              {/* Categoría del Aporte */}
              <Text style={styles.formInputLabel}>¿Qué recurso o apoyo puedes aportar? *</Text>
              <View style={styles.optionsWrapRow}>
                {[
                  { label: '💧 Bidones de Agua', val: 'Agua Potable' },
                  { label: '🥫 Víveres y Alimentos', val: 'Víveres y Alimentos' },
                  { label: '🛏️ Frazadas / Colchones', val: 'Frazadas / Colchones' },
                  { label: '🦺 Voluntariado / Rescate', val: 'Voluntariado / Rescate' },
                  { label: '🚗 Transporte / Camioneta', val: 'Transporte / Camioneta' },
                  { label: '🏠 Espacio Seco / Albergue', val: 'Espacio Seco / Albergue' },
                  { label: '⚡ Generador / Baterías', val: 'Generador / Baterías' }
                ].map((item) => (
                  <TouchableOpacity
                    key={item.val}
                    style={[styles.specialOptionChipTeal, offerCategory === item.val && styles.specialOptionChipTealActive]}
                    onPress={() => setOfferCategory(item.val)}
                  >
                    <Text style={[styles.specialOptionChipTealText, offerCategory === item.val && styles.specialOptionChipTealTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Modalidad */}
              <Text style={styles.formInputLabel}>Modalidad del aporte *</Text>
              <View style={styles.optionsWrapRow}>
                {[
                  { label: '🎁 Donación Definitiva', val: 'Donación' },
                  { label: '🔄 Préstamo Solidario (con devolución)', val: 'Préstamo' }
                ].map((item) => (
                  <TouchableOpacity
                    key={item.val}
                    style={[styles.specialOptionChipTeal, offerType === item.val && styles.specialOptionChipTealActive]}
                    onPress={() => setOfferType(item.val)}
                  >
                    <Text style={[styles.specialOptionChipTealText, offerType === item.val && styles.specialOptionChipTealTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Punto de Entrega */}
              <Text style={styles.formInputLabel}>¿Cómo coordinamos la entrega? *</Text>
              <View style={styles.optionsWrapRow}>
                {[
                  { label: '🏫 En Centro de Acopio (Comunal)', val: 'Centro de Acopio' },
                  { label: '🏠 En mi domicilio (Mz 2)', val: 'Mi domicilio' },
                  { label: '🚚 Puedo llevarlo al punto afectado', val: 'Entrega a domicilio' }
                ].map((item) => (
                  <TouchableOpacity
                    key={item.val}
                    style={[styles.specialOptionChipTeal, offerDelivery === item.val && styles.specialOptionChipTealActive]}
                    onPress={() => setOfferDelivery(item.val)}
                  >
                    <Text style={[styles.specialOptionChipTealText, offerDelivery === item.val && styles.specialOptionChipTealTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Descripción */}
              <Text style={styles.formInputLabel}>Detalle y cantidad del aporte *</Text>
              <TextInput
                style={styles.specialTextInput}
                placeholder="Ej: Tengo 3 bidones de 7L sin abrir y 2 mantas limpias. Disponibles de inmediato..."
                placeholderTextColor="#94a3b8"
                value={offerDescription}
                onChangeText={setOfferDescription}
                multiline
                numberOfLines={3}
              />

              {/* Teléfono */}
              <Text style={styles.formInputLabel}>Teléfono / WhatsApp para coordinar</Text>
              <TextInput
                style={styles.specialTextInputSingle}
                placeholder="Ej: 991 223 344"
                placeholderTextColor="#94a3b8"
                keyboardType="phone-pad"
                value={offerContact}
                onChangeText={setOfferContact}
              />

              {/* Botón de Registrar Aporte */}
              <TouchableOpacity
                style={styles.specialSubmitOfferBtn}
                activeOpacity={0.85}
                onPress={handleCreateOffer}
              >
                <MaterialCommunityIcons name="hand-heart" size={18} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.specialSubmitBtnText}>Registrar Mi Aporte Vecinal</Text>
              </TouchableOpacity>
              <View style={{ height: 30 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Espaciador inferior */}
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 130 },
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
  quantityPickerRow: {
    backgroundColor: COLORS.primarySurface,
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.primaryPale
  },
  quantityLabel: {
    fontWeight: '800',
    color: COLORS.primaryDeep
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  quantityBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  quantityBtnText: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.primaryDark,
    lineHeight: 22
  },
  quantityValueBox: {
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center'
  },
  quantityValueText: {
    fontWeight: '900',
    color: COLORS.textPrimary
  },
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
  },
  specialModalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    maxHeight: '85%',
    width: '100%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8
  },
  emergencyModalHeader: {
    backgroundColor: '#dc2626',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16
  },
  solidarityModalHeader: {
    backgroundColor: '#0d9488',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16
  },
  specialHeaderIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  specialHeaderIconCircleTeal: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  specialHeaderTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff'
  },
  specialHeaderSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600'
  },
  closeSpecialModalBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  specialModalBody: {
    padding: 16
  },
  formInputLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1e293b',
    marginTop: 10,
    marginBottom: 6
  },
  optionsWrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8
  },
  specialOptionChip: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  specialOptionChipActive: {
    backgroundColor: '#dc2626',
    borderColor: '#dc2626'
  },
  specialOptionChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155'
  },
  specialOptionChipTextActive: {
    color: '#ffffff'
  },
  specialOptionChipTeal: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  specialOptionChipTealActive: {
    backgroundColor: '#0d9488',
    borderColor: '#0d9488'
  },
  specialOptionChipTealText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155'
  },
  specialOptionChipTealTextActive: {
    color: '#ffffff'
  },
  urgencyChip: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  urgencyChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b'
  },
  specialTextInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    padding: 10,
    fontSize: 12,
    color: '#0f172a',
    textAlignVertical: 'top',
    minHeight: 70
  },
  specialTextInputSingle: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: '#0f172a'
  },
  specialSubmitNeedBtn: {
    backgroundColor: '#dc2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 18,
    shadowColor: '#dc2626',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4
  },
  specialSubmitOfferBtn: {
    backgroundColor: '#0d9488',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 18,
    shadowColor: '#0d9488',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4
  },
  specialSubmitBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.3
  },
});
