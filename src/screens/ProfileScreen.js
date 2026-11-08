import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert
} from 'react-native';
import { COLORS } from '../theme/colors';

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
    address: 'Zona A • Manzana 2'
  },
  onOpenChat
}) {
  const scale = (val) => Math.round(val * fontScale);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      
      {/* Tarjeta de Perfil de Residente */}
      <View style={styles.profileCard}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarWrap}>
            <Text style={{ fontSize: 40 }}>👵</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
              <Text style={[styles.profileName, { fontSize: scale(16) }]}>
                {userProfile.name}
              </Text>
              <View style={styles.verifiedPill}>
                <Text style={styles.verifiedPillText}>VERIFICADA</Text>
              </View>
            </View>
            
            <Text style={[styles.profileAddress, { fontSize: scale(11) }]}>
              📍 {userProfile.address}
            </Text>
            <Text style={[styles.endorsementsText, { fontSize: scale(11) }]}>
              ⭐ 5.0 (14 avales vecinales de confianza)
            </Text>
          </View>
        </View>

        {/* Ficha de Información de Contacto y Habilidad (Requerido por el usuario) */}
        <View style={styles.infoFieldsCard}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { fontSize: scale(11) }]}>📞 Teléfono Celular:</Text>
            <Text style={[styles.infoValue, { fontSize: scale(12) }]}>{userProfile.phone}</Text>
          </View>
          
          <View style={styles.infoDivider} />

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { fontSize: scale(11) }]}>💼 Profesión / Habilidad:</Text>
            <Text style={[styles.infoValueSkill, { fontSize: scale(12) }]}>
              {userProfile.skill || 'Apoyo general'}
            </Text>
          </View>

          <View style={styles.infoDivider} />

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { fontSize: scale(11) }]}>🪪 DNI Comunitario:</Text>
            <Text style={[styles.infoValue, { fontSize: scale(12) }]}>
              ****8921 (Frente & Reverso Validados)
            </Text>
          </View>
        </View>

        {/* Balance Solidario en Perfil (has ayudado / te han ayudado) */}
        <View style={styles.balanceRow}>
          <View style={styles.balanceItem}>
            <Text style={[styles.balanceItemLabel, { fontSize: scale(10) }]}>Has ayudado</Text>
            <Text style={[styles.balanceItemNumTeal, { fontSize: scale(18) }]}>{helpedCount} veces</Text>
            <Text style={[styles.balanceSubText, { fontSize: scale(9) }]}>solidaridad activa</Text>
          </View>
          <View style={styles.balanceItem}>
            <Text style={[styles.balanceItemLabel, { fontSize: scale(10) }]}>Te han ayudado</Text>
            <Text style={[styles.balanceItemNumTeal, { fontSize: scale(18) }]}>4 veces</Text>
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
              <Text style={{ fontSize: 22 }}>💬</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.chatShortcutTitle, { fontSize: scale(13) }]}>
                Mis Conversaciones Vecinales
              </Text>
              <Text style={[styles.chatShortcutSub, { fontSize: scale(10) }]}>
                Chatea directamente con vecinos sobre ayudas y servicios
              </Text>
            </View>
            <Text style={{ fontSize: 18, color: COLORS.primaryDark }}>›</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Selector de Accesibilidad (Senior Font) */}
      <View style={styles.sectionCard}>
        <Text style={[styles.sectionTitle, { fontSize: scale(13) }]}>
          👁️ Accesibilidad: Tamaño de Letra
        </Text>
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

      {/* Contactos de Confianza y Emergencia Comunal */}
      <View style={styles.sectionCard}>
        <Text style={[styles.sectionTitle, { fontSize: scale(13) }]}>
          🚨 Contactos de Emergencia y Soporte
        </Text>
        <View style={styles.emergencyContactRow}>
          <Text style={{ fontSize: 20, marginRight: 8 }}>🚒</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.emergencyContactName, { fontSize: scale(12) }]}>Bomberos del Perú</Text>
            <Text style={[styles.emergencyContactPhone, { fontSize: scale(11) }]}>Central 116</Text>
          </View>
        </View>
        <View style={styles.emergencyContactRow}>
          <Text style={{ fontSize: 20, marginRight: 8 }}>👮</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.emergencyContactName, { fontSize: scale(12) }]}>Policía Nacional / Serenazgo</Text>
            <Text style={[styles.emergencyContactPhone, { fontSize: scale(11) }]}>Central 105</Text>
          </View>
        </View>
      </View>

      {/* Botón de Reinicio para Probar Onboarding / Login */}
      <TouchableOpacity
        style={styles.restartButton}
        onPress={() => {
          Alert.alert(
            '🔄 Reiniciar Registro / Login',
            '¿Deseas volver a simular el flujo inicial de registro con celular, fotos del DNI (anverso/reverso), biometría y GPS?',
            [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Sí, reiniciar', onPress: onRestartOnboarding }
            ]
          );
        }}
      >
        <Text style={[styles.restartButtonText, { fontSize: scale(12) }]}>
          🔄 Probar de nuevo el Login y Escaneo de DNI
        </Text>
      </TouchableOpacity>

      {/* Botón de Cerrar Sesión */}
      {onLogout ? (
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={onLogout}
          activeOpacity={0.8}
        >
          <Text style={[styles.logoutButtonText, { fontSize: scale(12) }]}>
            🚪 Cerrar Sesión de Vecino
          </Text>
        </TouchableOpacity>
      ) : null}

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
    paddingBottom: 90,
    gap: 12
  },
  profileCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14
  },
  avatarWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.primaryPale
  },
  profileName: {
    fontWeight: '900',
    color: COLORS.textPrimary
  },
  verifiedPill: {
    backgroundColor: COLORS.primarySurface,
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  verifiedPillText: {
    color: COLORS.primaryDark,
    fontSize: 9,
    fontWeight: '900'
  },
  profileAddress: {
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 2
  },
  endorsementsText: {
    color: COLORS.amber,
    fontWeight: '800',
    marginTop: 2
  },
  infoFieldsCard: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    flexWrap: 'wrap'
  },
  infoDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 4
  },
  infoLabel: {
    fontWeight: '700',
    color: COLORS.textSecondary
  },
  infoValue: {
    fontWeight: '800',
    color: COLORS.textPrimary
  },
  infoValueSkill: {
    fontWeight: '900',
    color: COLORS.primaryDeep
  },
  balanceRow: {
    flexDirection: 'row',
    gap: 10
  },
  balanceItem: {
    flex: 1,
    backgroundColor: COLORS.primarySurface,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primaryPale
  },
  balanceItemLabel: {
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 2
  },
  balanceItemNumTeal: {
    fontWeight: '900',
    color: COLORS.primaryDark
  },
  balanceSubText: {
    color: COLORS.textMuted,
    fontWeight: '600',
    marginTop: 2
  },
  chatShortcutCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
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
    fontWeight: '900',
    color: COLORS.primaryDeep
  },
  chatShortcutSub: {
    color: COLORS.textSecondary,
    fontWeight: '600'
  },
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  sectionTitle: {
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 4
  },
  sectionSub: {
    color: COLORS.textSecondary,
    marginBottom: 12
  },
  fontScaleRow: {
    flexDirection: 'row',
    gap: 8
  },
  fontScaleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    alignItems: 'center'
  },
  fontScaleBtnActive: {
    backgroundColor: COLORS.primarySurface,
    borderColor: COLORS.primary,
    borderWidth: 1.5
  },
  fontScaleBtnText: {
    fontWeight: '700',
    color: COLORS.textSecondary,
    fontSize: 12
  },
  fontScaleBtnTextActive: {
    color: COLORS.primaryDark,
    fontWeight: '900'
  },
  emergencyContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 10,
    borderRadius: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  emergencyContactName: {
    fontWeight: '800',
    color: COLORS.textPrimary
  },
  emergencyContactPhone: {
    color: COLORS.emergency,
    fontWeight: '800'
  },
  restartButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6
  },
  restartButtonText: {
    fontWeight: '800',
    color: COLORS.primaryDark
  },
  logoutButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.emergency,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8
  },
  logoutButtonText: {
    fontWeight: '800',
    color: COLORS.emergencyDark
  }
});
