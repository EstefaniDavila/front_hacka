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
  const titleText = emergencyTitle || emergency?.title || emergency?.name || 'Emergencia en Mz 2 (Zona A)';
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
        <Text style={[styles.bannerText, { fontSize: scale(11) }]} numberOfLines={1}>
          🚨 Alerta: {titleText}
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
  bannerText: {
    color: COLORS.white,
    fontWeight: '800'
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
