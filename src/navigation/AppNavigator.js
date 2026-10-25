/**
 * COUNCIL X | THE SYNDICATE
 * Application Navigation Controller
 * Manages Google Auth, Home, 1-on-1 Chat, 216 Supreme Council, History & Compliance
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
import PricingScreen from '../screens/PricingScreen';
import PremiumSuccessScreen from '../screens/PremiumSuccessScreen';
import { COLORS } from '../theme/colors';
import { getLocalSession, clearLocalSession, getInitialAuthSync } from '../services/supabaseClient';

export default function AppNavigator({ initialAuth, onAuthChange }) {
  const [currentScreen, setCurrentScreen] = useState('Home');
  const [screenParams, setScreenParams] = useState({});
  const [isAuthenticated, setIsAuthenticated] = useState(
    typeof initialAuth === 'boolean' ? initialAuth : getInitialAuthSync()
  );

  // Dedicated Clean /admin, /pricing & /success Route & Deep-Link Listener
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const checkRoute = () => {
        const path = (window.location.pathname || '').toLowerCase();
        const search = (window.location.search || '').toLowerCase();
        const hash = (window.location.hash || '').toLowerCase();
        if (
          path === '/admin' ||
          path.startsWith('/admin') ||
          search.includes('admin') ||
          hash.includes('admin')
        ) {
          setCurrentScreen('Admin');
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

      // Backdoor console helpers for web developers
      window.__councilx_open_admin = () => {
        setCurrentScreen('Admin');
        window.history.pushState(null, '', '/admin');
      };
      window.__councilx_open_pricing = () => {
        setCurrentScreen('Pricing');
        window.history.pushState(null, '', '/pricing');
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
    navigate: (screenName, params = {}) => {
      setScreenParams(params);
      setCurrentScreen(screenName);
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        if (screenName === 'Admin') {
          window.history.pushState(null, '', '/admin');
        } else if (screenName === 'Pricing') {
          window.history.pushState(null, '', '/pricing');
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
      } catch (e) {}
      setIsAuthenticated(false);
      setCurrentScreen('Auth');
      setScreenParams({});
      if (onAuthChange) onAuthChange(false);
    }
  };

  // Dedicated Admin Screen: Accessible via /admin route independently of standard user auth
  if (currentScreen === 'Admin') {
    return (
      <View style={styles.container}>
        <AdminDashboardScreen navigation={navigation} />
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
      case 'Admin':
        return <AdminDashboardScreen navigation={navigation} />;
      case 'Auth':
        return <AuthScreen onAuthSuccess={() => setCurrentScreen('Home')} />;
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
    backgroundColor: COLORS.pitchBlack,
  },
  loadingBox: {
    flex: 1,
    backgroundColor: COLORS.pitchBlack,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
