import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
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
import { customStorage } from './src/services/supabase';

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
import NotificationsModal from './src/components/NotificationsModal';

class ScreenErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ScreenErrorBoundary atrapó un error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Ionicons name="alert-circle-outline" size={48} color={COLORS.primaryDark} style={{ marginBottom: 12 }} />
          <Text style={{ fontSize: 16, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 8, textAlign: 'center' }}>
            Hubo un detalle al cargar esta sección
          </Text>
          <Text style={{ fontSize: 11, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 20 }}>
            {this.state.error?.message || 'Ocurrió un error inesperado al procesar la pantalla.'}
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: COLORS.primaryDark, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 }}
            onPress={() => this.setState({ hasError: false, error: null })}
          >
            <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 13 }}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

function MainApp() {
  const { session, user, profile, isAuthenticated, isLoading, logout, updateUserProfile } = useAuth();

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

  const [fontScale, setFontScale] = useState(1.0);
  const [helpedCount, setHelpedCount] = useState(0);
  const [activeEmergency, setActiveEmergency] = useState(null);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  // Verificación de estado de backend y sondeo en tiempo real de alertas comunitarias
  useEffect(() => {
    let mounted = true;

    api.checkHealth()
      .then((res) => {
        if (mounted) setBackendOnline(res?.connected || false);
      })
      .catch(() => {
        if (mounted) setBackendOnline(false);
      });

    async function pollEmergenciesAndNotifications() {
      try {
        const emg = await api.getActiveEmergency();
        if (mounted) {
          setActiveEmergency(emg || null);
        }
      } catch {}

      if (session?.access_token) {
        try {
          const countData = await api.getUnreadNotificationsCount(session.access_token);
          if (mounted && countData && typeof countData.unread_count === 'number') {
            setUnreadNotificationsCount(countData.unread_count);
          }
        } catch {}
      }
    }

    pollEmergenciesAndNotifications();
    const interval = setInterval(pollEmergenciesAndNotifications, 4500);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [session?.access_token]);

  const EMPTY_PROFILE = {
    name: '',
    phone: '',
    skill: '',
    address: 'Zona A • Manzana 2',
    avatar: '👤'
  };

  const [userProfile, setUserProfile] = useState(EMPTY_PROFILE);

  const handleSaveUserProfile = async (updated) => {
    setUserProfile((prev) => ({ ...prev, ...updated }));

    if (user?.id) {
      customStorage.setItem('vecired_user_profile_' + user.id, JSON.stringify(updated)).catch(() => {});
    }
    if (user?.email) {
      customStorage.setItem('vecired_user_profile_' + user.email, JSON.stringify(updated)).catch(() => {});
    }
    // Eliminar clave global para evitar contaminación entre diferentes cuentas
    customStorage.removeItem('vecired_user_profile').catch(() => {});

    if (updateUserProfile) {
      try {
        await updateUserProfile(updated);
      } catch (err) {
        console.warn('Error en updateUserProfile:', err);
      }
    }
  };

  // Sincronizar datos si el backend retorna un perfil real o si el usuario inicia/cierra sesión
  useEffect(() => {
    async function restoreProfileOnAuth() {
      if (!user) {
        setUserProfile(EMPTY_PROFILE);
        return;
      }

      let localData = null;
      try {
        if (user?.id) {
          const raw = await customStorage.getItem('vecired_user_profile_' + user.id);
          if (raw) localData = JSON.parse(raw);
        }
        if (!localData && user?.email) {
          const raw = await customStorage.getItem('vecired_user_profile_' + user.email);
          if (raw) localData = JSON.parse(raw);
        }
      } catch {}

      const emailStr = (user?.email || '').toLowerCase();
      const isAndy = emailStr.includes('andy');
      const isImanol = emailStr.includes('imanol');

      const name =
        localData?.name ||
        profile?.full_name ||
        user?.user_metadata?.full_name ||
        (isAndy ? 'Andy Manchego' : isImanol ? 'Imanol Montes' : user?.email?.split('@')[0] || 'Vecino');
      const phone =
        localData?.phone ||
        profile?.phone ||
        user?.user_metadata?.phone ||
        (isAndy ? '937263104' : isImanol ? '912345678' : '');
      const skill =
        localData?.skill ||
        profile?.skill ||
        user?.user_metadata?.skill ||
        (isAndy ? 'Apoyo general' : isImanol ? 'Tecnología y Soporte' : 'Vecino Colaborador');
      const address =
        localData?.address ||
        profile?.address ||
        user?.user_metadata?.address ||
        'Zona A • Manzana 2';
      const avatar =
        localData?.avatar ||
        profile?.avatar_url ||
        user?.user_metadata?.avatar ||
        (isAndy ? '👨‍🔧' : isImanol ? '🧑‍💼' : '👤');

      setUserProfile({
        name,
        phone,
        skill,
        address,
        avatar
      });

      if (profile?.font_scale_preference) {
        const val = parseFloat(profile.font_scale_preference);
        if (!isNaN(val)) setFontScale(val);
      }
    }
    restoreProfileOnAuth();
  }, [user, profile]);

  const scale = (val) => Math.round(val * fontScale);

  const [servicesSearchQuery, setServicesSearchQuery] = useState('');
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [publishInitialType, setPublishInitialType] = useState(null);

  const handleNavigate = (tab, params = null) => {
    if (params?.serviceId) {
      setSelectedServiceId(params.serviceId);
    }
    if (params?.search !== undefined) {
      setServicesSearchQuery(params.search);
    }
    if (tab === 'publish') {
      setPublishInitialType(params?.type || null);
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
    setUserProfile(EMPTY_PROFILE);
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
        onSaveUserData={handleSaveUserProfile}
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
                <MaterialCommunityIcons name="home-group" size={22} color={COLORS.primaryDark} />
              </View>
              <View style={styles.headerTextContainer}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={[styles.appBrandText, { fontSize: scale(16) }]}>VeciRed </Text>
                  <Text style={[styles.appBrandIa, { fontSize: scale(16) }]}>IA</Text>
                </View>
                <Text
                  style={[styles.appLocationText, { fontSize: scale(11) }]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  📍 {userProfile.address || 'Mi comunidad • Zona A'}
                </Text>
                <View style={styles.verifiedCommunityBadge}>
                  <Ionicons name="shield-checkmark" size={11} color="#0d9488" />
                  <Text style={styles.verifiedCommunityText}>Barrio Seguro • Zona A</Text>
                </View>
              </View>
            </TouchableOpacity>

            <View style={styles.appHeaderRight}>
              {/* Botón de Emergencia SOS Rápido Destacado */}
              <TouchableOpacity
                style={[
                  styles.headerEmergencyBtn,
                  currentTab === 'emergency' && styles.headerEmergencyBtnActive
                ]}
                activeOpacity={0.85}
                onPress={() => handleNavigate('emergency')}
              >
                <MaterialCommunityIcons name="alarm-light" size={16} color="#ffffff" style={{ marginRight: 3 }} />
                <Text style={styles.headerEmergencyBtnText}>SOS</Text>
              </TouchableOpacity>

              {/* Botón de Mensajes / Chat Comunitario */}
              <TouchableOpacity
                style={[styles.headerIconButton, currentTab === 'chat' && styles.headerIconActive]}
                activeOpacity={0.8}
                onPress={() => {
                  setUnreadMessagesCount(0);
                  setActiveChatContact(null);
                  handleNavigate('chat');
                }}
              >
                <Ionicons name="chatbubbles" size={19} color={COLORS.primaryDark} />
                {unreadMessagesCount > 0 && (
                  <View style={styles.chatBadge}>
                    <Text style={styles.chatBadgeText}>{unreadMessagesCount}</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Botón de Notificaciones y Alertas Barriales */}
              <TouchableOpacity
                style={styles.headerIconButton}
                activeOpacity={0.8}
                onPress={() => setShowNotificationsModal(true)}
              >
                <Ionicons name="notifications" size={19} color={COLORS.primaryDark} />
                {(unreadNotificationsCount > 0 || activeEmergency) && (
                  <View style={styles.bellRedDot} />
                )}
              </TouchableOpacity>

              {/* Avatar de Perfil */}
              <TouchableOpacity
                style={[styles.avatarButton, currentTab === 'profile' && styles.avatarButtonActive]}
                activeOpacity={0.8}
                onPress={() => handleNavigate('profile')}
              >
                {userProfile.avatar && userProfile.avatar !== '👤' ? (
                  <Text style={{ fontSize: 20 }}>{userProfile.avatar}</Text>
                ) : (
                  <Ionicons name="person-circle" size={26} color={COLORS.primaryDark} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Banner de Emergencia Comunitaria Activa */}
        {activeEmergency && currentTab !== 'emergency' && (
          <EmergencyBanner
            emergencyTitle={activeEmergency.title || activeEmergency.name}
            emergency={activeEmergency}
            onOpenEmergency={() => handleNavigate('emergency')}
            onPressView={() => handleNavigate('emergency')}
            fontScale={fontScale}
          />
        )}

        {/* Contenedor Principal de Pantallas Dinámicas con ErrorBoundary Anticaídas */}
        <View style={styles.screenContainer}>
          <ScreenErrorBoundary key={currentTab}>
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
              userProfile={userProfile}
              initialSearch={servicesSearchQuery}
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
              userProfile={userProfile}
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
              type={selectedItemType}
              itemType={selectedItemType}
              onBack={() => handleNavigate(previousTab || 'home')}
              fontScale={fontScale}
              onOpenChat={handleOpenChatWith}
              userProfile={userProfile}
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
              onAlertTriggered={(alert) => setActiveEmergency(alert)}
            />
          )}

          {currentTab === 'publish' && (
            <PublishScreen
              onNavigate={handleNavigate}
              fontScale={fontScale}
              initialType={publishInitialType}
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
              onSaveProfile={handleSaveUserProfile}
              onOpenChat={() => {
                setActiveChatContact(null);
                handleNavigate('chat');
              }}
            />
          )}

          {currentTab === 'chat' && (
            <ChatScreen
              fontScale={fontScale}
              userProfile={userProfile}
              onBack={() => {
                setActiveChatContact(null);
                setCurrentTab(previousTab || 'home');
              }}
              initialContact={activeChatContact}
              onClearInitialContact={() => setActiveChatContact(null)}
            />
          )}
          </ScreenErrorBoundary>
        </View>

        {/* Barra de Navegación Inferior (Oculta en chat y detalle para mayor comodidad) */}
        {currentTab !== 'chat' && currentTab !== 'detail' && (
          <BottomNavBar
            currentTab={currentTab}
            onSelectTab={handleNavigate}
            fontScale={fontScale}
          />
        )}

        {/* Modal de Alertas y Notificaciones Comunitarias */}
        <NotificationsModal
          visible={showNotificationsModal}
          onClose={() => setShowNotificationsModal(false)}
          token={session?.access_token}
          fontScale={fontScale}
          activeEmergency={activeEmergency}
          onViewEmergency={(notif) => {
            setShowNotificationsModal(false);
            handleNavigate('emergency');
          }}
        />

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

const STATUSBAR_HEIGHT = Platform.OS === 'android'
  ? (StatusBar.currentHeight || 28)
  : (Platform.OS === 'web' ? 8 : 0);

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
    paddingTop: Platform.OS === 'android' ? 12 : 14,
    paddingBottom: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  appHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10
  },
  headerTextContainer: {
    flex: 1,
    justifyContent: 'center'
  },
  appLogoCircle: {
    width: 38,
    height: 38,
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
    color: COLORS.textSecondary,
    maxWidth: '100%'
  },
  appHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0
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
  verifiedCommunityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0fdfa',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#ccfbf1'
  },
  verifiedCommunityText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0f766e'
  },
  headerEmergencyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dc2626',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#b91c1c',
    shadowColor: '#dc2626',
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4
  },
  headerEmergencyBtnActive: {
    backgroundColor: '#991b1b',
    borderColor: '#7f1d1d'
  },
  headerEmergencyBtnText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.5
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
