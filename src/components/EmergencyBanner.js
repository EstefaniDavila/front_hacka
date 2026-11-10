import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';

export default function EmergencyBanner({
  onOpenEmergency,
  onPressView,
  onDismiss,
  emergencyTitle,
  emergency,
  fontScale = 1.0
}) {
  const scale = (val) => Math.round(val * fontScale);
  const titleText = emergencyTitle || emergency?.title || emergency?.name || 'Emergencia Comunitaria';

  // Verificación de distancia y asignación de onda de radar concéntrico
  const dist = emergency?.distance_m;
  if (typeof dist === 'number' && dist > 5000) {
    // Si la emergencia está más allá de 5 km, se silencia el banner intrusivo
    return null;
  }

  let waveBadge = null;
  if (typeof dist === 'number') {
    if (dist <= 500) {
      waveBadge = { label: `🔴 Onda 1 (${dist}m)`, bg: '#991b1b' };
    } else if (dist <= 1500) {
      const km = (dist / 1000).toFixed(1);
      waveBadge = { label: `🟠 Onda 2 (${km}km)`, bg: '#c2410c' };
    } else if (dist <= 3000) {
      const km = (dist / 1000).toFixed(1);
      waveBadge = { label: `🟡 Onda 3 (${km}km)`, bg: '#854d0e' };
    } else if (dist <= 5000) {
      const km = (dist / 1000).toFixed(1);
      waveBadge = { label: `🔵 Onda 4 (${km}km)`, bg: '#0369a1' };
    }
  }

  const handlePress = () => {
    if (onOpenEmergency) onOpenEmergency();
    else if (onPressView) onPressView();
  };

  return (
    <View style={styles.bannerContainer}>
      <TouchableOpacity
        style={styles.leftContent}
        activeOpacity={0.85}
        onPress={handlePress}
      >
        <View style={styles.pulseDot} />
        {waveBadge && (
          <View style={[styles.wavePill, { backgroundColor: waveBadge.bg }]}>
            <Text style={styles.wavePillText}>{waveBadge.label}</Text>
          </View>
        )}
        <Text style={[styles.bannerText, { fontSize: scale(11) }]} numberOfLines={1}>
          🚨 {titleText}
        </Text>
      </TouchableOpacity>

      <View style={styles.rightActionsRow}>
        <TouchableOpacity
          style={styles.actionButton}
          activeOpacity={0.8}
          onPress={handlePress}
        >
          <Text style={[styles.actionButtonText, { fontSize: scale(11) }]}>
            Ver auxilio ›
          </Text>
        </TouchableOpacity>

        {onDismiss && (
          <TouchableOpacity
            style={styles.dismissBtn}
            activeOpacity={0.7}
            onPress={onDismiss}
            accessibilityLabel="Descartar alerta"
          >
            <Text style={styles.dismissBtnText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bannerContainer: {
    backgroundColor: COLORS.emergency,
    paddingHorizontal: 12,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: COLORS.emergencyDark,
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.white,
    marginRight: 6
  },
  wavePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 6
  },
  wavePillText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800'
  },
  bannerText: {
    color: COLORS.white,
    fontWeight: '800',
    flex: 1
  },
  rightActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  actionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999
  },
  actionButtonText: {
    color: COLORS.white,
    fontWeight: '900'
  },
  dismissBtn: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4
  },
  dismissBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 14
  }
});
