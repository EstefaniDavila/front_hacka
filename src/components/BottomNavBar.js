import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';

export default function BottomNavBar({ currentTab, onSelectTab, fontScale = 1.0 }) {
  const scale = (val) => Math.round(val * fontScale);

  const tabs = [
    { id: 'home', label: 'Inicio', iconActive: 'home', iconInactive: 'home-outline' },
    { id: 'services', label: 'Servicios', iconActive: 'grid', iconInactive: 'grid-outline' },
    { id: 'publish', label: 'Publicar', isCenter: true },
    { id: 'solidarity', label: 'Ayuda', iconActive: 'people', iconInactive: 'people-outline' },
    { id: 'profile', label: 'Perfil', iconActive: 'person', iconInactive: 'person-outline' }
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
                <Ionicons name="add" size={26} color="#ffffff" />
              </View>
              <Text style={[styles.centerLabel, { fontSize: scale(10) }]}>
                Publicar
              </Text>
            </TouchableOpacity>
          );
        }

        const isActive = currentTab === tab.id ||
          (tab.id === 'services' && (currentTab === 'products' || currentTab === 'service_detail' || currentTab === 'my_services' || currentTab === 'detail')) ||
          (tab.id === 'solidarity' && currentTab === 'eco_solidaria') ||
          (tab.id === 'home' && currentTab === 'emergency');

        return (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tabItem, isActive && styles.tabItemActive]}
            activeOpacity={0.7}
            onPress={() => onSelectTab(tab.id)}
          >
            <Ionicons
              name={isActive ? tab.iconActive : tab.iconInactive}
              size={22}
              color={isActive ? COLORS.primaryDark : '#64748b'}
            />
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
    color: '#64748b',
    marginTop: 2
  },
  tabLabelActive: {
    color: COLORS.primaryDark
  },
  centerButtonWrap: {
    alignItems: 'center',
    marginTop: -22
  },
  centerCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primaryDark,
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4
  },
  centerLabel: {
    fontWeight: '800',
    color: COLORS.primaryDark,
    marginTop: 4
  }
});
