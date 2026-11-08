import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Alert } from 'react-native';
import { COLORS } from '../theme/colors';

let alertListener = null;

// Replace react-native-web Alert.alert with in-app dialog to prevent iframe sandboxing errors
Alert.alert = (title, message, buttons) => {
  if (alertListener) {
    alertListener({
      title: title || 'Aviso',
      message: message || '',
      buttons: buttons && buttons.length > 0 ? buttons : [{ text: 'Entendido' }]
    });
  } else {
    console.log(`[Alert] ${title}: ${message}`);
  }
};

// Also protect window.alert if called directly
if (typeof window !== 'undefined') {
  window.alert = (msg) => {
    Alert.alert('Aviso VeciRed', String(msg));
  };
}

export default function InAppAlert() {
  const [currentAlert, setCurrentAlert] = useState(null);

  useEffect(() => {
    alertListener = (alertData) => {
      setCurrentAlert(alertData);
    };
    return () => {
      alertListener = null;
    };
  }, []);

  if (!currentAlert) return null;

  const handleButtonPress = (btn) => {
    setCurrentAlert(null);
    if (btn && typeof btn.onPress === 'function') {
      btn.onPress();
    }
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.dialog}>
        <View style={styles.iconCircle}>
          <Text style={{ fontSize: 26 }}>🏘️</Text>
        </View>
        <Text style={styles.title}>{currentAlert.title}</Text>
        {!!currentAlert.message && (
          <Text style={styles.message}>{currentAlert.message}</Text>
        )}

        <View style={styles.buttonsContainer}>
          {currentAlert.buttons.map((btn, index) => {
            const isCancel = btn.style === 'cancel';
            const isDestructive = btn.style === 'destructive';
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.button,
                  isCancel ? styles.buttonCancel : isDestructive ? styles.buttonDestructive : styles.buttonPrimary
                ]}
                activeOpacity={0.8}
                onPress={() => handleButtonPress(btn)}
              >
                <Text
                  style={[
                    styles.buttonText,
                    isCancel ? styles.buttonTextCancel : styles.buttonTextWhite
                  ]}
                >
                  {btn.text || 'Aceptar'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 99999
  },
  dialog: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 8
  },
  message: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 18
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    justifyContent: 'center'
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  buttonPrimary: {
    backgroundColor: COLORS.primary
  },
  buttonDestructive: {
    backgroundColor: COLORS.emergency
  },
  buttonCancel: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '800'
  },
  buttonTextWhite: {
    color: COLORS.white
  },
  buttonTextCancel: {
    color: COLORS.textSecondary
  }
});
