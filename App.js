import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Platform
} from 'react-native';
import { COLORS } from './src/theme/colors';
import { api } from './src/api/apiClient';

// Componentes y Pantallas Principales (100% Frontend React Native)
import EmergencyBanner from './src/components/EmergencyBanner';
import BottomNavBar from './src/components/BottomNavBar';
import OnboardingScreen from './src/screens/OnboardingScreen';
import HomeScreen from './src/screens/HomeScreen';
import ServicesScreen from './src/screens/ServicesScreen';
import ProductsScreen from './src/screens/ProductsScreen';
import ItemDetailScreen from './src/screens/ItemDetailScreen';
import SolidarityScreen from './src/screens/SolidarityScreen';
import EcoSolidariaScreen from './src/screens/EcoSolidariaScreen';
import EmergencyScreen from './src/screens/EmergencyScreen';
import PublishScreen from './src/screens/PublishScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ChatScreen from './src/screens/ChatScreen';

export default function App() {
  // Simulación de instalación y primer inicio (Registro inicial con DNI anverso/reverso y biometría)
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Pestaña activa: home, services, products, detail, solidarity, eco_solidaria, emergency, publish, profile, chat
  const [currentTab, setCurrentTab] = useState('home');
  const [previousTab, setPreviousTab] = useState('home');
  
  // Contacto seleccionado para chat directo
  const [activeChatContact, setActiveChatContact] = useState(null);

  // Artículo seleccionado para vista de detalle (Producto o Servicio)
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedItemType, setSelectedItemType] = useState('product'); // 'product' | 'service'
  const [backendOnline, setBackendOnline] = useState(false);

  useEffect(() => {
    api.checkHealth()
      .then(res => setBackendOnline(res?.connected || false))
      .catch(() => setBackendOnline(false));

    api.getActiveEmergency()
      .then(setActiveEmergency)
      .catch(() => setActiveEmergency(null));
  }, []);

  // Accesibilidad Senior (Escala de fuente: 1.0 Normal, 1.15 Grande, 1.30 Senior)
  const [fontScale, setFontScale] = useState(1.0);
  
  // Contador de Solidaridad Activa
  const [helpedCount, setHelpedCount] = useState(0);
  const [activeEmergency, setActiveEmergency] = useState(null);

  // Datos del perfil registrados en el Login/Onboarding inicial
  const [userProfile, setUserProfile] = useState({
    name: 'Vecino',
    phone: '',
    skill: '',
    address: 'Zona A • Manzana 2'
  });

  const scale = (val) => Math.round(val * fontScale);

  const handleNavigate = (tab) => {
    setPreviousTab(currentTab);
    setCurrentTab(tab);
  };

  const handleOpenChatWith = (contact) => {
    setActiveChatContact(contact);
    setPreviousTab(currentTab);
    setCurrentTab('chat');
  };

  const handleOpenDetail = (item, type = 'product') => {
    setSelectedItem(item);
    setSelectedItemType(type);
    setPreviousTab(currentTab);
    setCurrentTab('detail');
  };

  // Si es la primera vez que se abre la app, muestra el registro vecinal completo
  if (!isLoggedIn) {
    return (
      <OnboardingScreen
        onFinishLogin={() => setIsLoggedIn(true)}
        fontScale={fontScale}
        setFontScale={setFontScale}
        onSaveUserData={(data) => setUserProfile((prev) => ({ ...prev, ...data }))}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      <View style={styles.container}>
        
        {/* Cabecera Principal de la App (VeciRed IA) - Se oculta en Chat y Detalle para evitar doble barra */}
        {currentTab !== 'chat' && currentTab !== 'detail' && (
          <View style={styles.appHeader}>
            <View style={styles.appHeaderLeft}>
              <View style={styles.appLogoCircle}>
                <Text style={{ fontSize: 18 }}>🏘️</Text>
              </View>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={[styles.appBrandText, { fontSize: scale(15) }]}>
                    VeciRed
                  </Text>
                  <Text style={[styles.appBrandIa, { fontSize: scale(15) }]}>
                    {' '}IA
                  </Text>
                </View>
                <Text style={[styles.appLocationText, { fontSize: scale(10) }]}>
                  📍 Mi comunidad • Zona A
                </Text>
                <View style={backendOnline ? styles.onlineBadge : styles.offlineBadge}>
                  <View style={backendOnline ? styles.greenDot : styles.grayDot} />
                  <Text style={styles.badgeStatusText}>
                    {backendOnline ? 'FastAPI Conectada' : 'Modo Conectado'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.appHeaderRight}>
              {/* Botón de Chat Comunitario con Indicador de mensajes */}
              <TouchableOpacity
                style={[styles.headerIconButton, currentTab === 'chat' && styles.headerIconActive]}
                onPress={() => {
                  setActiveChatContact(null);
                  handleNavigate(currentTab === 'chat' ? previousTab : 'chat');
                }}
              >
                <Text style={{ fontSize: 18 }}>💬</Text>
                <View style={styles.chatBadge}>
                  <Text style={styles.chatBadgeText}>2</Text>
                </View>
              </TouchableOpacity>

              {/* Campana de Notificaciones con Punto Rojo (Emergencias) */}
              <TouchableOpacity
                style={styles.headerIconButton}
                onPress={() => handleNavigate('emergency')}
              >
                <Text style={{ fontSize: 18 }}>🔔</Text>
                <View style={styles.bellRedDot} />
              </TouchableOpacity>

              {/* Avatar del Usuario -> Perfil */}
              <TouchableOpacity
                style={[styles.avatarButton, currentTab === 'profile' && styles.avatarButtonActive]}
                onPress={() => handleNavigate('profile')}
              >
                <Text style={{ fontSize: 18 }}>👤</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Barra de Alerta (se muestra únicamente si existe una emergencia activa) */}
        {currentTab !== 'chat' && currentTab !== 'detail' && activeEmergency && (
          <EmergencyBanner
            emergencyTitle={activeEmergency.title}
            onOpenEmergency={() => handleNavigate('emergency')}
            fontScale={fontScale}
          />
        )}

        {/* Contenedor de Pantallas Activas */}
        <View style={styles.screenContainer}>
          {currentTab === 'home' && (
            <HomeScreen
              onNavigate={handleNavigate}
              fontScale={fontScale}
              onOpenDetail={handleOpenDetail}
            />
          )}

          {currentTab === 'services' && (
            <ServicesScreen
              onNavigate={handleNavigate}
              fontScale={fontScale}
              onOpenChat={handleOpenChatWith}
              onOpenDetail={handleOpenDetail}
            />
          )}

          {currentTab === 'products' && (
            <ProductsScreen
              onNavigate={handleNavigate}
              fontScale={fontScale}
              onOpenDetail={handleOpenDetail}
              onOpenChat={handleOpenChatWith}
            />
          )}

          {currentTab === 'detail' && (
            <ItemDetailScreen
              item={selectedItem}
              type={selectedItemType}
              onBack={() => setCurrentTab(previousTab || 'home')}
              fontScale={fontScale}
              onOpenChat={handleOpenChatWith}
            />
          )}

          {currentTab === 'solidarity' && (
            <SolidarityScreen
              onNavigate={handleNavigate}
              fontScale={fontScale}
              helpedCount={helpedCount}
              onIncrementHelped={() => setHelpedCount((prev) => prev + 1)}
              onOpenChat={handleOpenChatWith}
            />
          )}

          {currentTab === 'eco_solidaria' && (
            <EcoSolidariaScreen
              onNavigate={handleNavigate}
              fontScale={fontScale}
              onIncrementHelped={() => setHelpedCount((prev) => prev + 1)}
              onOpenChat={handleOpenChatWith}
            />
          )}

          {currentTab === 'emergency' && (
            <EmergencyScreen
              onNavigate={handleNavigate}
              fontScale={fontScale}
              onOpenChat={handleOpenChatWith}
            />
          )}

          {currentTab === 'publish' && (
            <PublishScreen
              onNavigate={handleNavigate}
              fontScale={fontScale}
            />
          )}

          {currentTab === 'profile' && (
            <ProfileScreen
              fontScale={fontScale}
              setFontScale={setFontScale}
              onRestartOnboarding={() => setIsLoggedIn(false)}
              helpedCount={helpedCount}
              userProfile={userProfile}
              onOpenChat={() => {
                setActiveChatContact(null);
                handleNavigate('chat');
              }}
            />
          )}

          {currentTab === 'chat' && (
            <ChatScreen
              fontScale={fontScale}
              onBack={() => setCurrentTab(previousTab || 'home')}
              initialContact={activeChatContact}
            />
          )}
        </View>

        {/* Barra de Navegación Inferior (Oculta en chat y detalle para mayor comodidad) */}
        {currentTab !== 'chat' && currentTab !== 'detail' && (
          <BottomNavBar
            currentTab={currentTab}
            onSelectTab={handleNavigate}
            fontScale={fontScale}
          />
        )}

      </View>
    </SafeAreaView>
  );
}

const STATUSBAR_HEIGHT = Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingTop: STATUSBAR_HEIGHT
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    width: '100%',
    maxWidth: 600, // Adaptación a tablets y pantallas anchas: centrado limpio estilo app móvil
    alignSelf: 'center'
  },
  appHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  appHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  appLogoCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.primarySurface,
    borderWidth: 1,
    borderColor: COLORS.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  appBrandText: {
    fontWeight: '900',
    color: COLORS.primaryDeep
  },
  appBrandIa: {
    fontWeight: '900',
    color: COLORS.primary
  },
  appLocationText: {
    fontWeight: '700',
    color: COLORS.textSecondary
  },
  appHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: COLORS.border
  },
  headerIconActive: {
    backgroundColor: COLORS.primarySurface,
    borderColor: COLORS.primary
  },
  bellRedDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.emergency
  },
  chatBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: COLORS.primary,
    borderRadius: 7,
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  chatBadgeText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '900'
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
    alignSelf: 'flex-start'
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
    alignSelf: 'flex-start'
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981'
  },
  grayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#64748b'
  },
  badgeStatusText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#334155'
  },
  avatarButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.primary
  },
  avatarButtonActive: {
    borderColor: COLORS.primaryDark,
    transform: [{ scale: 1.05 }]
  },
  screenContainer: {
    flex: 1
  }
});
