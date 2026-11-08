import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert
} from 'react-native';
import { COLORS } from '../theme/colors';
import { customStorage } from '../services/supabase';

export default function ProfileScreen({
  fontScale = 1.0,
  setFontScale,
  onRestartOnboarding,
  onLogout,
  helpedCount = 12,
  userProfile = {
    name: 'Vecino',
    phone: '',
    skill: 'Vecino Colaborador',
    address: 'Zona A • Manzana 2',
    avatar: '👤'
  },
  onSaveProfile,
  onOpenChat
}) {
  const [isEmergencyExpanded, setIsEmergencyExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Estados locales para edición
  const [editName, setEditName] = useState(userProfile.name || '');
  const [editPhone, setEditPhone] = useState(userProfile.phone || '');
  const [editSkill, setEditSkill] = useState(userProfile.skill || '');
  const [editAddress, setEditAddress] = useState(userProfile.address || '');
  const [editAvatar, setEditAvatar] = useState(userProfile.avatar || '👤');

  useEffect(() => {
    setEditName(userProfile.name || '');
    setEditPhone(userProfile.phone || '');
    setEditSkill(userProfile.skill || '');
    setEditAddress(userProfile.address || '');
    setEditAvatar(userProfile.avatar || '👤');
  }, [userProfile]);

  const scale = (val) => Math.round(val * fontScale);

  const avatarOptions = ['👤', '👵', '👨‍🔧', '👩‍⚕️', '👨‍🏫', '👩‍🍳', '👷', '🧑‍💻'];

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Campo obligatorio', 'Por favor ingresa tu nombre completo.');
      return;
    }
    const updated = {
      name: editName.trim(),
      phone: editPhone.trim(),
      skill: editSkill.trim(),
      address: editAddress.trim(),
      avatar: editAvatar
    };
    try {
      await customStorage.setItem('vecired_user_profile', JSON.stringify(updated));
    } catch {}
    if (onSaveProfile) {
      onSaveProfile(updated);
    }
    setIsEditing(false);
    Alert.alert('Éxito', '¡Tu perfil comunitario ha sido actualizado correctamente!');
  };

  const handleCancelEdit = () => {
    setEditName(userProfile.name || '');
    setEditPhone(userProfile.phone || '');
    setEditSkill(userProfile.skill || '');
    setEditAddress(userProfile.address || '');
    setEditAvatar(userProfile.avatar || '👤');
    setIsEditing(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      
      {/* Tarjeta de Perfil de Residente */}
      <View style={styles.profileCard}>
        {!isEditing ? (
          <>
            <View style={styles.profileHeader}>
              <View style={styles.avatarWrap}>
                <Text style={{ fontSize: 36 }}>{userProfile?.avatar || '👤'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, flex: 1 }}>
                    <Text style={[styles.profileName, { fontSize: scale(16) }]}>
                      {userProfile.name}
                    </Text>
                    <View style={styles.verifiedPill}>
                      <Ionicons name="shield-checkmark" size={11} color="#0d9488" style={{ marginRight: 3 }} />
                      <Text style={styles.verifiedPillText}>VERIFICADO</Text>
                    </View>
                  </View>

                  {/* Botón Editar Perfil */}
                  <TouchableOpacity
                    style={styles.editBtn}
                    activeOpacity={0.8}
                    onPress={() => setIsEditing(true)}
                  >
                    <Feather name="edit-2" size={12} color="#ffffff" style={{ marginRight: 4 }} />
                    <Text style={styles.editBtnText}>Editar</Text>
                  </TouchableOpacity>
                </View>
                
                <Text style={[styles.profileAddress, { fontSize: scale(11) }]}>
                  📍 {userProfile.address}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
                  {(userProfile.endorsementsCount && Number(userProfile.endorsementsCount) > 0) ? (
                    <>
                      <Ionicons name="star" size={13} color="#f59e0b" style={{ marginRight: 3 }} />
                      <Text style={[styles.endorsementsText, { fontSize: scale(11) }]}>
                        {userProfile.rating ? Number(userProfile.rating).toFixed(1) : '5.0'} ({userProfile.endorsementsCount} {userProfile.endorsementsCount === 1 ? 'aval vecinal' : 'avales vecinales de confianza'})
                      </Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="sparkles" size={12} color="#0d9488" style={{ marginRight: 3 }} />
                      <Text style={[styles.endorsementsText, { fontSize: scale(11), color: '#0d9488', fontWeight: '700' }]}>
                        Nuevo vecino en la comunidad (0 avales)
                      </Text>
                    </>
                  )}
                </View>
              </View>
            </View>

            {/* Ficha de Información de Contacto y Habilidad */}
            <View style={styles.infoFieldsCard}>
              <View style={styles.infoRow}>
                <View style={styles.infoLabelGroup}>
                  <Feather name="phone" size={13} color={COLORS.primaryDark} style={{ marginRight: 6 }} />
                  <Text style={[styles.infoLabel, { fontSize: scale(11) }]}>Teléfono Celular:</Text>
                </View>
                <Text style={[styles.infoValue, { fontSize: scale(12) }]}>{userProfile.phone || 'No registrado'}</Text>
              </View>
              
              <View style={styles.infoDivider} />

              <View style={styles.infoRow}>
                <View style={styles.infoLabelGroup}>
                  <Feather name="briefcase" size={13} color={COLORS.primaryDark} style={{ marginRight: 6 }} />
                  <Text style={[styles.infoLabel, { fontSize: scale(11) }]}>Profesión / Habilidad:</Text>
                </View>
                <Text style={[styles.infoValueSkill, { fontSize: scale(12) }]}>
                  {userProfile.skill || 'Apoyo general'}
                </Text>
              </View>

              <View style={styles.infoDivider} />

              <View style={styles.infoRow}>
                <View style={styles.infoLabelGroup}>
                  <Ionicons name="card-outline" size={13} color={COLORS.primaryDark} style={{ marginRight: 6 }} />
                  <Text style={[styles.infoLabel, { fontSize: scale(11) }]}>DNI Comunitario:</Text>
                </View>
                <Text style={[styles.infoValue, { fontSize: scale(12) }]}>
                  ****8921 (Validado)
                </Text>
              </View>
            </View>
          </>
        ) : (
          /* MODO EDICIÓN DE PERFIL */
          <View style={styles.editSection}>
            <View style={styles.editHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Feather name="edit-3" size={16} color={COLORS.primaryDark} style={{ marginRight: 6 }} />
                <Text style={[styles.editSectionTitle, { fontSize: scale(15) }]}>
                  Editar Información de Perfil
                </Text>
              </View>
              <TouchableOpacity onPress={handleCancelEdit}>
                <Ionicons name="close-circle-outline" size={22} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Selector de Avatar Vecinal Básico */}
            <Text style={[styles.editInputLabel, { fontSize: scale(11) }]}>Selecciona tu Avatar Vecinal:</Text>
            <View style={styles.avatarPickerRow}>
              {avatarOptions.map((av) => (
                <TouchableOpacity
                  key={av}
                  style={[styles.avatarOptionCircle, editAvatar === av && styles.avatarOptionSelected]}
                  onPress={() => setEditAvatar(av)}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 22 }}>{av}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Inputs de Edición */}
            <Text style={[styles.editInputLabel, { fontSize: scale(11) }]}>Nombre Completo *</Text>
            <TextInput
              style={[styles.editInput, { fontSize: scale(13) }]}
              value={editName}
              onChangeText={setEditName}
              placeholder="Ej. Martha Quispe"
              placeholderTextColor="#94a3b8"
            />

            <Text style={[styles.editInputLabel, { fontSize: scale(11) }]}>Número de Celular *</Text>
            <TextInput
              style={[styles.editInput, { fontSize: scale(13) }]}
              value={editPhone}
              onChangeText={setEditPhone}
              placeholder="Ej. 984 555 123"
              placeholderTextColor="#94a3b8"
              keyboardType="phone-pad"
            />

            <Text style={[styles.editInputLabel, { fontSize: scale(11) }]}>Profesión u Oficio / Habilidad Vecinal *</Text>
            <TextInput
              style={[styles.editInput, { fontSize: scale(13) }]}
              value={editSkill}
              onChangeText={setEditSkill}
              placeholder="Ej. Gasfitería, Docencia, Enfermería..."
              placeholderTextColor="#94a3b8"
            />

            <Text style={[styles.editInputLabel, { fontSize: scale(11) }]}>Dirección / Manzana Comunitaria *</Text>
            <TextInput
              style={[styles.editInput, { fontSize: scale(13) }]}
              value={editAddress}
              onChangeText={setEditAddress}
              placeholder="Ej. Zona A • Manzana 2 Lote 4"
              placeholderTextColor="#94a3b8"
            />

            {/* Botones Guardar / Cancelar */}
            <View style={styles.editButtonsRow}>
              <TouchableOpacity
                style={styles.cancelEditBtn}
                activeOpacity={0.8}
                onPress={handleCancelEdit}
              >
                <Text style={styles.cancelEditBtnText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveEditBtn}
                activeOpacity={0.85}
                onPress={handleSaveProfile}
              >
                <Feather name="check" size={15} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.saveEditBtnText}>Guardar Cambios</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Balance Solidario en Perfil */}
        <View style={styles.balanceRow}>
          <View style={styles.balanceItem}>
            <Text style={[styles.balanceItemLabel, { fontSize: scale(10) }]}>Has ayudado</Text>
            <Text style={[styles.balanceItemNumTeal, { fontSize: scale(18) }]}>{helpedCount} veces</Text>
            <Text style={[styles.balanceSubText, { fontSize: scale(9) }]}>solidaridad activa</Text>
          </View>
          <View style={styles.balanceItem}>
            <Text style={[styles.balanceItemLabel, { fontSize: scale(10) }]}>Te han ayudado</Text>
            <Text style={[styles.balanceItemNumTeal, { fontSize: scale(18) }]}>{userProfile?.receivedHelpCount !== undefined ? userProfile.receivedHelpCount : 0} veces</Text>
            <Text style={[styles.balanceSubText, { fontSize: scale(9) }]}>apoyo de vecinos</Text>
          </View>
        </View>
      </View>

      {/* Botón directo para abrir los mensajes / chats */}
      {onOpenChat && (
        <TouchableOpacity
          style={styles.chatShortcutCard}
          activeOpacity={0.8}
          onPress={onOpenChat}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={styles.chatIconWrap}>
              <Ionicons name="chatbubbles" size={20} color={COLORS.primaryDark} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.chatShortcutTitle, { fontSize: scale(13) }]}>
                Mis Conversaciones Vecinales
              </Text>
              <Text style={[styles.chatShortcutSub, { fontSize: scale(10) }]}>
                Chatea directamente con vecinos sobre ayudas y servicios
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color={COLORS.primaryDark} />
          </View>
        </TouchableOpacity>
      )}

      {/* Selector de Accesibilidad (Senior Font) */}
      <View style={styles.sectionCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <Ionicons name="eye-outline" size={17} color={COLORS.primaryDark} />
          <Text style={[styles.sectionTitle, { fontSize: scale(13) }]}>
            Accesibilidad: Tamaño de Letra
          </Text>
        </View>
        <Text style={[styles.sectionSub, { fontSize: scale(11) }]}>
          Ajusta el tamaño del texto en toda la aplicación para facilitar la lectura.
        </Text>
        <View style={styles.fontScaleRow}>
          <TouchableOpacity
            style={[styles.fontScaleBtn, fontScale === 1.0 && styles.fontScaleBtnActive]}
            onPress={() => setFontScale(1.0)}
          >
            <Text style={[styles.fontScaleBtnText, fontScale === 1.0 && styles.fontScaleBtnTextActive]}>
              A Normal
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.fontScaleBtn, fontScale === 1.15 && styles.fontScaleBtnActive]}
            onPress={() => setFontScale(1.15)}
          >
            <Text style={[styles.fontScaleBtnText, fontScale === 1.15 && styles.fontScaleBtnTextActive]}>
              A+ Grande
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.fontScaleBtn, fontScale === 1.30 && styles.fontScaleBtnActive]}
            onPress={() => setFontScale(1.30)}
          >
            <Text style={[styles.fontScaleBtnText, fontScale === 1.30 && styles.fontScaleBtnTextActive]}>
              A++ Senior
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Contactos de Emergencia con Desplegable */}
      <View style={styles.sectionCard}>
        <View style={styles.emergencyHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <MaterialCommunityIcons name="phone-alert" size={18} color="#dc2626" />
            <Text style={[styles.sectionTitle, { fontSize: scale(13) }]}>
              Contactos de Emergencia Comunal
            </Text>
          </View>
          <TouchableOpacity
            style={styles.expandEmgBtn}
            onPress={() => setIsEmergencyExpanded(!isEmergencyExpanded)}
          >
            <Text style={styles.expandEmgBtnText}>
              {isEmergencyExpanded ? '▲ Menos' : '▼ Ver más (5)'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 1. Policía Nacional (Siempre visible) */}
        <View style={styles.emergencyContactRow}>
          <View style={[styles.emgIconCircle, { backgroundColor: '#eff6ff' }]}>
            <Ionicons name="shield" size={18} color="#1d4ed8" />
          </View>
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={[styles.emergencyContactName, { fontSize: scale(12) }]}>Policía Nacional del Perú</Text>
            <Text style={[styles.emergencyContactPhone, { fontSize: scale(11) }]}>Central 105 • Emergencias policiales</Text>
          </View>
          <TouchableOpacity
            style={styles.callBadgeBtn}
            onPress={() => Alert.alert('Llamada de Emergencia', 'Marcando Policía 105...')}
          >
            <Feather name="phone-call" size={11} color="#ffffff" style={{ marginRight: 3 }} />
            <Text style={styles.callBadgeText}>105</Text>
          </TouchableOpacity>
        </View>

        {/* 2. Bomberos del Perú (Siempre visible) */}
        <View style={styles.emergencyContactRow}>
          <View style={[styles.emgIconCircle, { backgroundColor: '#fee2e2' }]}>
            <MaterialCommunityIcons name="fire-truck" size={18} color="#dc2626" />
          </View>
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={[styles.emergencyContactName, { fontSize: scale(12) }]}>Bomberos del Perú</Text>
            <Text style={[styles.emergencyContactPhone, { fontSize: scale(11) }]}>Central 116 • Incendios y rescates</Text>
          </View>
          <TouchableOpacity
            style={styles.callBadgeBtn}
            onPress={() => Alert.alert('Llamada de Emergencia', 'Marcando Bomberos 116...')}
          >
            <Feather name="phone-call" size={11} color="#ffffff" style={{ marginRight: 3 }} />
            <Text style={styles.callBadgeText}>116</Text>
          </TouchableOpacity>
        </View>

        {/* 3. SAMU Ambulancias (Siempre visible) */}
        <View style={styles.emergencyContactRow}>
          <View style={[styles.emgIconCircle, { backgroundColor: '#ecfdf5' }]}>
            <MaterialCommunityIcons name="ambulance" size={18} color="#059669" />
          </View>
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={[styles.emergencyContactName, { fontSize: scale(12) }]}>SAMU - Ambulancia Médica</Text>
            <Text style={[styles.emergencyContactPhone, { fontSize: scale(11) }]}>Línea 106 • Primeros auxilios</Text>
          </View>
          <TouchableOpacity
            style={styles.callBadgeBtn}
            onPress={() => Alert.alert('Llamada de Emergencia', 'Marcando SAMU 106...')}
          >
            <Feather name="phone-call" size={11} color="#ffffff" style={{ marginRight: 3 }} />
            <Text style={styles.callBadgeText}>106</Text>
          </TouchableOpacity>
        </View>

        {/* Contactos Desplegables Adicionales */}
        {isEmergencyExpanded && (
          <View style={styles.extraContactsContainer}>
            {/* Serenazgo */}
            <View style={styles.emergencyContactRow}>
              <View style={[styles.emgIconCircle, { backgroundColor: '#f1f5f9' }]}>
                <Ionicons name="car" size={18} color="#334155" />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={[styles.emergencyContactName, { fontSize: scale(12) }]}>Serenazgo Distrital</Text>
                <Text style={[styles.emergencyContactPhone, { fontSize: scale(11) }]}>Base (01) 318-5050 • Patrullaje Zona A</Text>
              </View>
              <TouchableOpacity
                style={[styles.callBadgeBtn, { backgroundColor: '#475569' }]}
                onPress={() => Alert.alert('Llamada de Emergencia', 'Marcando Serenazgo Distrital...')}
              >
                <Feather name="phone-call" size={11} color="#ffffff" style={{ marginRight: 3 }} />
                <Text style={styles.callBadgeText}>Llamar</Text>
              </TouchableOpacity>
            </View>

            {/* Posta Médica / Centro de Salud Vecinal */}
            <View style={styles.emergencyContactRow}>
              <View style={[styles.emgIconCircle, { backgroundColor: '#f0fdf4' }]}>
                <Ionicons name="medkit" size={18} color="#15803d" />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={[styles.emergencyContactName, { fontSize: scale(12) }]}>Posta Médica Santa Rosa</Text>
                <Text style={[styles.emergencyContactPhone, { fontSize: scale(11) }]}>Mz 3 Lote 12 • Atención 24h</Text>
              </View>
              <TouchableOpacity
                style={[styles.callBadgeBtn, { backgroundColor: '#15803d' }]}
                onPress={() => Alert.alert('Llamada', 'Marcando Centro de Salud Comunal...')}
              >
                <Feather name="phone-call" size={11} color="#ffffff" style={{ marginRight: 3 }} />
                <Text style={styles.callBadgeText}>Llamar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Acciones de Cuenta */}
      <View style={styles.accountCard}>
        <TouchableOpacity
          style={styles.accountBtn}
          onPress={onRestartOnboarding}
          activeOpacity={0.8}
        >
          <Feather name="refresh-cw" size={15} color={COLORS.primaryDark} style={{ marginRight: 8 }} />
          <Text style={[styles.accountBtnText, { fontSize: scale(12) }]}>
            Completar nuevo registro vecinal
          </Text>
        </TouchableOpacity>

        {onLogout && (
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={onLogout}
            activeOpacity={0.8}
          >
            <Feather name="log-out" size={15} color="#ef4444" style={{ marginRight: 8 }} />
            <Text style={[styles.logoutBtnText, { fontSize: scale(12) }]}>
              Cerrar Sesión Segura
            </Text>
          </TouchableOpacity>
        )}
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  content: {
    padding: 16,
    paddingBottom: 100
  },
  profileCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14
  },
  avatarWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#ccfbf1'
  },
  profileName: {
    fontWeight: '800',
    color: COLORS.textPrimary
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ccfbf1',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10
  },
  verifiedPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0d9488'
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryDark,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12
  },
  editBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700'
  },
  profileAddress: {
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginTop: 2
  },
  endorsementsText: {
    color: '#0d9488',
    fontWeight: '700'
  },
  infoFieldsCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4
  },
  infoLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  infoLabel: {
    fontWeight: '700',
    color: '#475569'
  },
  infoValue: {
    color: COLORS.textPrimary,
    fontWeight: '600'
  },
  infoValueSkill: {
    color: COLORS.primaryDark,
    fontWeight: '800'
  },
  infoDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 4
  },
  balanceRow: {
    flexDirection: 'row',
    gap: 12
  },
  balanceItem: {
    flex: 1,
    backgroundColor: COLORS.primarySurface,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccfbf1'
  },
  balanceItemLabel: {
    fontWeight: '700',
    color: '#0f766e',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  balanceItemNumTeal: {
    fontWeight: '900',
    color: '#0f766e',
    marginVertical: 2
  },
  balanceSubText: {
    color: '#14b8a6',
    fontWeight: '600'
  },
  chatShortcutCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#99f6e4',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2
  },
  chatIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primarySurface,
    alignItems: 'center',
    justifyContent: 'center'
  },
  chatShortcutTitle: {
    fontWeight: '800',
    color: COLORS.primaryDeep
  },
  chatShortcutSub: {
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginTop: 2
  },
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16
  },
  sectionTitle: {
    fontWeight: '800',
    color: COLORS.textPrimary
  },
  sectionSub: {
    color: COLORS.textSecondary,
    marginTop: 4,
    marginBottom: 12,
    lineHeight: 16
  },
  fontScaleRow: {
    flexDirection: 'row',
    gap: 8
  },
  fontScaleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    backgroundColor: '#f8fafc'
  },
  fontScaleBtnActive: {
    backgroundColor: COLORS.primaryDark,
    borderColor: COLORS.primaryDark
  },
  fontScaleBtnText: {
    fontWeight: '700',
    fontSize: 12,
    color: COLORS.textPrimary
  },
  fontScaleBtnTextActive: {
    color: COLORS.white
  },
  emergencyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  expandEmgBtn: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  expandEmgBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#dc2626'
  },
  emergencyContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  emgIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center'
  },
  emergencyContactName: {
    fontWeight: '800',
    color: COLORS.textPrimary
  },
  emergencyContactPhone: {
    color: COLORS.textSecondary,
    marginTop: 2
  },
  callBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dc2626',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10
  },
  callBadgeText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 11
  },
  extraContactsContainer: {
    marginTop: 4
  },
  accountCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10
  },
  accountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.primarySurface,
    borderWidth: 1,
    borderColor: '#99f6e4'
  },
  accountBtnText: {
    color: COLORS.primaryDark,
    fontWeight: '800'
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca'
  },
  logoutBtnText: {
    color: '#ef4444',
    fontWeight: '800'
  },
  /* MODO EDICIÓN */
  editSection: {
    marginBottom: 14
  },
  editHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0'
  },
  editSectionTitle: {
    fontWeight: '800',
    color: COLORS.primaryDark
  },
  avatarPickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
    marginTop: 4
  },
  avatarOptionCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent'
  },
  avatarOptionSelected: {
    borderColor: COLORS.primaryDark,
    backgroundColor: '#ccfbf1'
  },
  editInputLabel: {
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
    marginTop: 6
  },
  editInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: COLORS.textPrimary,
    fontWeight: '600'
  },
  editButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16
  },
  cancelEditBtn: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1'
  },
  cancelEditBtnText: {
    color: '#64748b',
    fontWeight: '700',
    fontSize: 12
  },
  saveEditBtn: {
    flex: 1.5,
    flexDirection: 'row',
    backgroundColor: COLORS.primaryDark,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  saveEditBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 12
  }
});
