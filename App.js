import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
  Platform
} from 'react-native';
import { COLORS } from './src/theme/colors';
import { api } from './src/services/api';
import { AuthProvider, useAuth } from './src/context/AuthContext';

// Pantallas de Autenticación
import LoginScreen from './src/screens/LoginScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';

// Componentes y Pantallas Principales
import EmergencyBanner from './src/components/EmergencyBanner';
import BottomNavBar from './src/components/BottomNavBar';
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
import MyServicesScreen from './src/screens/MyServicesScreen';
import ServiceDetailScreen from './src/screens/ServiceDetailScreen';

function MainApp() {
  const { profile, isAuthenticated, isLoading, logout } = useAuth();

  // Control de sesión adicional para permitir alternar entre pantallas
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authView, setAuthView] = useState('login'); // 'login' | 'register' | 'forgot_password'

  const [currentTab, setCurrentTab] = useState('home');
  const [previousTab, setPreviousTab] = useState('home');

  const [activeChatContact, setActiveChatContact] = useState(null);

  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedItemType, setSelectedItemType] = useState('product'); // 'product' | 'service'
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [backendOnline, setBackendOnline] = useState(false);

  useEffect(() => {
    api.checkHealth()
      .then(res => setBackendOnline(res?.connected || false))
      .catch(() => setBackendOnline(false));

    api.getActiveEmergency()
      .then(setActiveEmergency)
      .catch(() => setActiveEmergency(null));
  }, []);

  const [fontScale, setFontScale] = useState(1.0);
  const [helpedCount, setHelpedCount] = useState(0);
  const [activeEmergency, setActiveEmergency] = useState(null);

  const [userProfile, setUserProfile] = useState({
    name: 'Vecino',
    phone: '',
    skill: '',
    address: 'Zona A • Manzana 2'
  });

  // Sincronizar datos si el backend retorna un perfil real autenticado
  useEffect(() => {
    if (profile) {
      setUserProfile((prev) => ({
        ...prev,
        name: profile.full_name || prev.name,
        phone: profile.phone || prev.phone,
        skill: profile.skill || prev.skill,
        address: profile.address || prev.address
      }));
      if (profile.font_scale_preference) {
        const val = parseFloat(profile.font_scale_preference);
        if (!isNaN(val)) setFontScale(val);
      }
    }
  }, [profile]);

  const scale = (val) => Math.round(val * fontScale);

  const handleNavigate = (tab, params = null) => {
    if (params?.serviceId) {
      setSelectedServiceId(params.serviceId);
    }
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
    if (type === 'service' && item?.id) {
      setSelectedServiceId(item.id);
      setPreviousTab(currentTab);
      setCurrentTab('service_detail');
    } else {
      setPreviousTab(currentTab);
      setCurrentTab('detail');
    }
  };

  const handleLogout = async () => {
    await logout();
    setIsLoggedIn(false);
    setAuthView('login');
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  const userIsActive = isAuthenticated || isLoggedIn;

  if (!userIsActive) {
    if (authView === 'login') {
      return (
        <LoginScreen
          onNavigateToRegister={() => setAuthView('register')}
          onNavigateToForgotPassword={() => setAuthView('forgot_password')}
          fontScale={fontScale}
        />
      );
    }

    if (authView === 'forgot_password') {
      return (
        <ForgotPasswordScreen
          onBackToLogin={() => setAuthView('login')}
          fontScale={fontScale}
        />
      );
    }

    return (
      <OnboardingScreen
        onFinishLogin={() => {
          setIsLoggedIn(true);
          setAuthView('login');
        }}
        onNavigateToLogin={() => setAuthView('login')}
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
            <TouchableOpacity
              style={styles.appHeaderLeft}
              onPress={() => handleNavigate('home')}
              activeOpacity={0.8}
            >
              <View style={styles.appLogoCircle}>
                <Text style={{ fontSize: 20 }}>🏡</Text>
              </View>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={[styles.appBrandText, { fontSize: scale(16) }]}>VeciRed </Text>
                  <Text style={[styles.appBrandIa, { fontSize: scale(16) }]}>IA</Text>
                </View>
                <Text style={[styles.appLocationText, { fontSize: scale(11) }]}>
                  📍 {userProfile.address || 'Mi comunidad • Zona A'}
                </Text>
                {backendOnline ? (
                  <View style={styles.onlineBadge}>
                    <View style={styles.greenDot} />
                    <Text style={styles.badgeStatusText}>FastAPI Conectada</Text>
                  </View>
                ) : (
                  <View style={styles.offlineBadge}>
                    <View style={styles.grayDot} />
                    <Text style={styles.badgeStatusText}>Modo Local</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>

            <View style={styles.appHeaderRight}>
              {/* Botón de Emergencia SOS Rápido */}
              <TouchableOpacity
                style={[
                  styles.headerIconButton,
                  currentTab === 'emergency' && styles.headerIconActive,
                  { backgroundColor: '#fee2e2', borderColor: '#fca5a5' }
                ]}
                activeOpacity={0.8}
                onPress={() => handleNavigate('emergency')}
              >
                <Text style={{ fontSize: 16 }}>🚨</Text>
              </TouchableOpacity>

              {/* Botón de Mensajes / Chat Comunitario */}
              <TouchableOpacity
                style={[styles.headerIconButton, currentTab === 'chat' && styles.headerIconActive]}
                activeOpacity={0.8}
                onPress={() => {
                  setActiveChatContact(null);
                  handleNavigate('chat');
                }}
              >
                <Text style={{ fontSize: 18 }}>💬</Text>
                <View style={styles.chatBadge}>
                  <Text style={styles.chatBadgeText}>2</Text>
                </View>
              </TouchableOpacity>

              {/* Botón de Notificaciones */}
              <TouchableOpacity
                style={styles.headerIconButton}
                activeOpacity={0.8}
                onPress={() => handleNavigate('solidarity')}
              >
                <Text style={{ fontSize: 18 }}>🔔</Text>
                <View style={styles.bellRedDot} />
              </TouchableOpacity>

              {/* Avatar de Perfil */}
              <TouchableOpacity
                style={[styles.avatarButton, currentTab === 'profile' && styles.avatarButtonActive]}
                activeOpacity={0.8}
                onPress={() => handleNavigate('profile')}
              >
                <Text style={{ fontSize: 20 }}>👵</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Banner de Emergencia Comunitaria Activa */}
        {activeEmergency && currentTab !== 'emergency' && (
          <EmergencyBanner
            emergency={activeEmergency}
            onPressView={() => handleNavigate('emergency')}
            fontScale={fontScale}
          />
        )}

        {/* Contenedor Principal de Pantallas Dinámicas */}
        <View style={styles.screenContainer}>
          {currentTab === 'home' && (
            <HomeScreen
              onNavigate={handleNavigate}
              fontScale={fontScale}
              helpedCount={helpedCount}
              userProfile={userProfile}
              onOpenDetail={handleOpenDetail}
              onOpenChat={handleOpenChatWith}
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

          {currentTab === 'my_services' && (
            <MyServicesScreen
              onNavigate={handleNavigate}
              fontScale={fontScale}
            />
          )}

          {currentTab === 'service_detail' && (
            <ServiceDetailScreen
              serviceId={selectedServiceId || selectedItem?.id}
              onNavigate={handleNavigate}
              fontScale={fontScale}
              onOpenChat={handleOpenChatWith}
            />
          )}

          {currentTab === 'products' && (
            <ProductsScreen
              onNavigate={handleNavigate}
              fontScale={fontScale}
              onOpenChat={handleOpenChatWith}
              onOpenDetail={handleOpenDetail}
            />
          )}

          {currentTab === 'detail' && selectedItem && (
            <ItemDetailScreen
              item={selectedItem}
              itemType={selectedItemType}
              onBack={() => handleNavigate(previousTab || 'home')}
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
              onRestartOnboarding={() => {
                setIsLoggedIn(false);
                setAuthView('register');
              }}
              onLogout={handleLogout}
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

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
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
