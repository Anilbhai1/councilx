/**
 * COUNCIL X | THE SYNDICATE
 * Application Navigation Controller
 * Manages Auth, Home, 1-on-1 Chat, 216 Supreme Council, History, Compliance & Stealth Admin
 * 
 * STEALTH GOD MODE SECURITY:
 * - /admin serves a simple, brutalist login screen.
 * - If wrong credentials are submitted, or if an unauthenticated user accesses /admin/dashboard,
 *   a 404 Page Not Found component is rendered so the route appears non-existent to outsiders.
 * - Zero hardcoded emails or credentials in frontend code.
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthScreen from '../screens/AuthScreen';
import HomeScreen from '../screens/HomeScreen';
import ChatScreen from '../screens/ChatScreen';
import SyndicateScreen from '../screens/SyndicateScreen';
import DebateScreen from '../screens/DebateScreen';
import HistoryScreen from '../screens/HistoryScreen';
import LegalComplianceScreen from '../screens/LegalComplianceScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import AdminLoginScreen from '../screens/AdminLoginScreen';
import NotFoundScreen from '../components/NotFoundScreen';
import PricingScreen from '../screens/PricingScreen';
import PremiumSuccessScreen from '../screens/PremiumSuccessScreen';
import OracleOfWealthScreen from '../screens/OracleOfWealthScreen';
import { COLORS } from '../theme/colors';
import { getLocalSession, clearLocalSession, getInitialAuthSync } from '../services/supabaseClient';

export default function AppNavigator({ initialAuth, onAuthChange }) {
  const [currentScreen, setCurrentScreen] = useState(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const path = (window.location.pathname || '').toLowerCase();
      const search = (window.location.search || '').toLowerCase();
      const hash = (window.location.hash || '').toLowerCase();

      // Check inner dashboard: requires token, else stealth 404
      if (
        path === '/admin/dashboard' ||
        path.startsWith('/admin/dashboard') ||
        search.includes('admin/dashboard') ||
        hash.includes('admin/dashboard')
      ) {
        let token = null;
        try {
          token =
            window.sessionStorage?.getItem('@councilx_admin_jwt') ||
            window.localStorage?.getItem('@councilx_admin_jwt');
        } catch (e) {}
        return token ? 'AdminDashboard' : 'NotFound';
      }

      // /admin route MUST render the brutalist Login Screen normally (or dashboard if already logged in)
      if (
        path === '/admin' ||
        path === '/admin/' ||
        path.startsWith('/admin/login') ||
        search.includes('admin') ||
        hash.includes('admin')
      ) {
        let token = null;
        try {
          token =
            window.sessionStorage?.getItem('@councilx_admin_jwt') ||
            window.localStorage?.getItem('@councilx_admin_jwt');
        } catch (e) {}
        return token ? 'AdminDashboard' : 'AdminLogin';
      }

      if (path.startsWith('/pricing') || search.includes('pricing') || hash.includes('pricing')) return 'Pricing';
      if (path.startsWith('/oracle') || search.includes('oracle') || hash.includes('oracle') || path.startsWith('/wealth')) return 'Oracle';
      if (path.startsWith('/success') || search.includes('success') || hash.includes('success')) return 'PremiumSuccess';
    }
    return 'Home';
  });
  const [screenParams, setScreenParams] = useState({});
  const [isAuthenticated, setIsAuthenticated] = useState(
    typeof initialAuth === 'boolean' ? initialAuth : getInitialAuthSync()
  );

  // Dedicated Route & Deep-Link Listener with Stealth 404 Enclave
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const checkRoute = async () => {
        const path = (window.location.pathname || '').toLowerCase();
        const search = (window.location.search || '').toLowerCase();
        const hash = (window.location.hash || '').toLowerCase();

        // Check if admin token is present in storage or session
        const getAdminToken = async () => {
          try {
            let token = await AsyncStorage.getItem('@councilx_admin_jwt');
            if (!token && typeof window !== 'undefined' && window.sessionStorage) {
              token = window.sessionStorage.getItem('@councilx_admin_jwt');
            }
            if (!token && typeof window !== 'undefined' && window.localStorage) {
              token = window.localStorage.getItem('@councilx_admin_jwt');
            }
            return token;
          } catch (e) {
            return null;
          }
        };

        if (path === '/admin/dashboard' || path.startsWith('/admin/dashboard')) {
          // If accessing dashboard directly: must have verified token or render 404
          const token = await getAdminToken();
          if (token) {
            setCurrentScreen('AdminDashboard');
          } else {
            // Stealth disguise: render 404 Page Not Found component
            setCurrentScreen('NotFound');
          }
        } else if (
          path === '/admin' ||
          path === '/admin/' ||
          path.startsWith('/admin/login') ||
          search.includes('admin') ||
          hash.includes('admin')
        ) {
          // Accessing /admin root: if already authenticated, go to dashboard; else show brutalist login
          const token = await getAdminToken();
          if (token) {
            setCurrentScreen('AdminDashboard');
          } else {
            setCurrentScreen('AdminLogin');
          }
        } else if (path.startsWith('/admin/')) {
          // Unknown admin subpath: render 404
          setCurrentScreen('NotFound');
        } else if (
          path === '/pricing' ||
          path.startsWith('/pricing') ||
          path === '/subscription' ||
          path.startsWith('/subscription') ||
          search.includes('pricing') ||
          hash.includes('pricing')
        ) {
          setCurrentScreen('Pricing');
        } else if (
          path === '/oracle' ||
          path.startsWith('/oracle') ||
          path === '/wealth' ||
          path.startsWith('/wealth') ||
          path === '/stock-market' ||
          path.startsWith('/stock-market') ||
          search.includes('oracle') ||
          hash.includes('oracle')
        ) {
          setCurrentScreen('Oracle');
        } else if (
          path === '/success' ||
          path.startsWith('/success') ||
          path === '/premium-success' ||
          path.startsWith('/premium-success') ||
          search.includes('success') ||
          hash.includes('success')
        ) {
          setCurrentScreen('PremiumSuccess');
        }
      };

      checkRoute();

      window.addEventListener('popstate', checkRoute);

      window.__councilx_open_pricing = () => {
        setCurrentScreen('Pricing');
        window.history.pushState(null, '', '/pricing');
      };

      window.__councilx_open_oracle = (params = {}) => {
        setScreenParams(params);
        setCurrentScreen('Oracle');
        window.history.pushState(null, '', '/oracle');
      };

      window.__councilx_open_success = (params = {}) => {
        setScreenParams(params);
        setCurrentScreen('PremiumSuccess');
        window.history.pushState(null, '', '/success');
      };

      return () => {
        window.removeEventListener('popstate', checkRoute);
      };
    }
  }, []);

  useEffect(() => {
    if (typeof initialAuth === 'boolean') {
      setIsAuthenticated(initialAuth);
    } else {
      checkAuthState();
    }
  }, [initialAuth]);

  const checkAuthState = async () => {
    try {
      const [localSession, loggedIn] = await Promise.all([
        getLocalSession(),
        AsyncStorage.getItem('@councilx_is_logged_in')
      ]);
      const isAuth = Boolean(localSession) || loggedIn === 'true';
      setIsAuthenticated(isAuth);
      if (onAuthChange) onAuthChange(isAuth);
    } catch (e) {
      setIsAuthenticated(false);
      if (onAuthChange) onAuthChange(false);
    }
  };

  const navigation = {
    navigate: async (screenName, params = {}) => {
      // Stealth verification for admin screens
      if (screenName === 'Admin' || screenName === 'AdminDashboard') {
        let token = null;
        try {
          token = await AsyncStorage.getItem('@councilx_admin_jwt');
          if (!token && Platform.OS === 'web' && typeof window !== 'undefined') {
            token = window.sessionStorage.getItem('@councilx_admin_jwt');
          }
        } catch (e) { }

        if (screenName === 'AdminDashboard') {
          if (!token) {
            setCurrentScreen('NotFound');
            if (Platform.OS === 'web' && typeof window !== 'undefined') {
              window.history.pushState(null, '', '/admin/dashboard');
            }
            return;
          }
          setCurrentScreen('AdminDashboard');
          if (Platform.OS === 'web' && typeof window !== 'undefined') {
            window.history.pushState(null, '', '/admin/dashboard');
          }
          return;
        }

        if (screenName === 'Admin') {
          if (token) {
            setCurrentScreen('AdminDashboard');
            if (Platform.OS === 'web' && typeof window !== 'undefined') {
              window.history.pushState(null, '', '/admin/dashboard');
            }
          } else {
            setCurrentScreen('AdminLogin');
            if (Platform.OS === 'web' && typeof window !== 'undefined') {
              window.history.pushState(null, '', '/admin');
            }
          }
          return;
        }
      }

      setScreenParams(params);
      setCurrentScreen(screenName);

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        if (screenName === 'Pricing') {
          window.history.pushState(null, '', '/pricing');
        } else if (screenName === 'Oracle') {
          window.history.pushState(null, '', '/oracle');
        } else if (screenName === 'PremiumSuccess') {
          window.history.pushState(null, '', '/success');
        } else if (screenName === 'Home') {
          window.history.pushState(null, '', '/');
        }
      }
    },
    goBack: () => {
      setCurrentScreen('Home');
      setScreenParams({});
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.history.pushState(null, '', '/');
      }
    },
    reset: ({ index, routes }) => {
      if (routes && routes[0]) {
        if (routes[0].name === 'Auth') {
          setIsAuthenticated(false);
          if (onAuthChange) onAuthChange(false);
        }
        setCurrentScreen(routes[0].name);
        setScreenParams({});
      }
    },
    logout: async () => {
      try {
        await clearLocalSession();
      } catch (e) { }
      setIsAuthenticated(false);
      setCurrentScreen('Auth');
      setScreenParams({});
      if (onAuthChange) onAuthChange(false);
    }
  };

  // Dedicated Stealth Admin Dashboard: Accessible when authenticated via JWT
  if (currentScreen === 'AdminDashboard') {
    return (
      <View style={styles.container}>
        <AdminDashboardScreen
          navigation={navigation}
          onLogout={() => {
            setCurrentScreen('Home');
            if (Platform.OS === 'web' && typeof window !== 'undefined') {
              window.history.replaceState(null, '', '/');
            }
          }}
        />
      </View>
    );
  }

  // Dedicated Stealth Brutalist Admin Login Screen: Accessible at /admin
  if (currentScreen === 'AdminLogin') {
    return (
      <View style={styles.container}>
        <AdminLoginScreen
          navigation={navigation}
          onLoginSuccess={() => setCurrentScreen('AdminDashboard')}
        />
      </View>
    );
  }

  // Stealth 404 Disguise: Returned on unauthenticated dashboard access or wrong credentials
  if (currentScreen === 'NotFound') {
    return (
      <View style={styles.container}>
        <NotFoundScreen
          navigation={navigation}
          onGoHome={() => setCurrentScreen('Home')}
        />
      </View>
    );
  }

  // Dedicated Pricing Screen: Accessible directly or via /pricing route
  if (currentScreen === 'Pricing') {
    return (
      <View style={styles.container}>
        <PricingScreen route={{ params: screenParams }} navigation={navigation} />
      </View>
    );
  }

  // Dedicated Oracle of Wealth Screen: Accessible directly or via /oracle route
  if (currentScreen === 'Oracle') {
    return (
      <View style={styles.container}>
        <OracleOfWealthScreen route={{ params: screenParams }} navigation={navigation} />
      </View>
    );
  }

  // Dedicated Premium Success Screen: Accessible after payment or via /success route
  if (currentScreen === 'PremiumSuccess') {
    return (
      <View style={styles.container}>
        <PremiumSuccessScreen route={{ params: screenParams }} navigation={navigation} />
      </View>
    );
  }

  if (isAuthenticated === null) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="large" color={COLORS.gold} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <AuthScreen
        onAuthSuccess={() => {
          setIsAuthenticated(true);
          setCurrentScreen('Home');
          if (onAuthChange) onAuthChange(true);
        }}
      />
    );
  }

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'PremiumSuccess':
        return <PremiumSuccessScreen route={{ params: screenParams }} navigation={navigation} />;
      case 'Pricing':
        return <PricingScreen route={{ params: screenParams }} navigation={navigation} />;
      case 'Oracle':
        return <OracleOfWealthScreen route={{ params: screenParams }} navigation={navigation} />;
      case 'AdminDashboard':
      case 'Admin':
        return (
          <AdminDashboardScreen
            navigation={navigation}
            onLogout={() => {
              setCurrentScreen('Home');
              if (Platform.OS === 'web' && typeof window !== 'undefined') {
                window.history.replaceState(null, '', '/');
              }
            }}
          />
        );
      case 'AdminLogin':
        return (
          <AdminLoginScreen
            navigation={navigation}
            onLoginSuccess={() => setCurrentScreen('AdminDashboard')}
          />
        );
      case 'NotFound':
        return (
          <NotFoundScreen
            navigation={navigation}
            onGoHome={() => setCurrentScreen('Home')}
          />
        );
      case 'Auth':
        return (
          <AuthScreen
            onAuthSuccess={() => {
              setIsAuthenticated(true);
              setCurrentScreen('Home');
              if (onAuthChange) onAuthChange(true);
            }}
          />
        );
      case 'Chat':
        return <ChatScreen route={{ params: screenParams }} navigation={navigation} />;
      case 'Syndicate':
        return <SyndicateScreen route={{ params: screenParams }} navigation={navigation} />;
      case 'Debate':
        return <DebateScreen route={{ params: screenParams }} navigation={navigation} />;
      case 'History':
        return <HistoryScreen route={{ params: screenParams }} navigation={navigation} />;
      case 'Legal':
        return <LegalComplianceScreen route={{ params: screenParams }} navigation={navigation} />;
      case 'Home':
      default:
        return <HomeScreen navigation={navigation} />;
    }
  };

  return (
    <View style={styles.container}>
      {renderCurrentScreen()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    maxWidth: '100%',
    backgroundColor: COLORS.pitchBlack,
    overflow: 'hidden',
  },
  loadingBox: {
    flex: 1,
    width: '100%',
    backgroundColor: COLORS.pitchBlack,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
