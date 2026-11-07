import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';

export default function BottomNavBar({ currentTab, onSelectTab, fontScale = 1.0 }) {
  const scale = (val) => Math.round(val * fontScale);

  const tabs = [
    { id: 'home', label: 'Inicio', icon: '🏠' },
    { id: 'services', label: 'Servicios', icon: '🏪' },
    { id: 'publish', label: 'Publicar', isCenter: true },
    { id: 'solidarity', label: 'Ayuda', icon: '🤝' },
    { id: 'profile', label: 'Perfil', icon: '👤' }
  ];

  return (
    <View style={styles.navBarContainer}>
      {tabs.map((tab) => {
        if (tab.isCenter) {
          return (
            <TouchableOpacity
              key="center-publish"
              style={styles.centerButtonWrap}
              activeOpacity={0.85}
              onPress={() => onSelectTab('publish')}
            >
              <View style={styles.centerCircle}>
                <Text style={styles.centerPlusText}>+</Text>
              </View>
              <Text style={[styles.centerLabel, { fontSize: scale(10) }]}>
                Publicar
              </Text>
            </TouchableOpacity>
          );
        }

        const isActive = currentTab === tab.id ||
          (tab.id === 'solidarity' && currentTab === 'eco_solidaria') ||
          (tab.id === 'home' && currentTab === 'emergency') ||
          (tab.id === 'services' && (currentTab === 'service_detail' || currentTab === 'my_services'));

        return (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tabItem, isActive && styles.tabItemActive]}
            activeOpacity={0.7}
            onPress={() => onSelectTab(tab.id)}
          >
            <Text style={{ fontSize: 20 }}>{tab.icon}</Text>
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive, { fontSize: scale(10) }]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  navBarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 20,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 8
  },
  tabItem: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14
  },
  tabItemActive: {
    backgroundColor: COLORS.primarySurface
  },
  tabLabel: {
    fontWeight: '700',
    color: COLORS.textMuted,
    marginTop: 2
  },
  tabLabelActive: {
    color: COLORS.primaryDark,
    fontWeight: '900'
  },
  centerButtonWrap: {
    alignItems: 'center',
    marginTop: -28
  },
  centerCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.primary,
    borderWidth: 3,
    borderColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6
  },
  centerPlusText: {
    color: COLORS.white,
    fontSize: 32,
    fontWeight: '300',
    marginTop: -4
  },
  centerLabel: {
    color: COLORS.primaryDeep,
    fontWeight: '900',
    marginTop: 2
  }
});
