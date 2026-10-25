/**
 * COUNCIL X | THE SYNDICATE
 * Root Application Entrypoint & Principal Auth Controller
 * 
 * Architecture Features:
 * 1. Supabase Persistence Listener (autoRefreshToken & persistSession enabled)
 * 2. Permanent Session Persistence: Once user logs in via Google, they remain logged in
 *    permanently until they explicitly click 'Log Out'
 * 3. Bulletproof Offline-First Fallback: Local 'COUNCILX_USER_SESSION' takes absolute priority
 * 4. Silent RLS Bypass: Profile creation in 'profiles' table handled cleanly
 */

import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { COLORS } from './src/theme/colors';
import {
  supabase,
  isSupabaseConfigured,
  getLocalSession,
  saveLocalSession,
  safeUpsertProfile,
  getInitialAuthSync,
  COUNCILX_USER_SESSION_KEY
} from './src/services/supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { pwaService } from './src/services/pwaService';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(getInitialAuthSync());

  useEffect(() => {
    // Initialize PWA manifest & service worker lifecycle on web
    pwaService.init();

    let authListenerSubscription = null;

    const initializeAuthEngine = async () => {
      try {
        // 1. First, check offline-first local session storage ('COUNCILX_USER_SESSION')
        const localSession = await getLocalSession();
        if (localSession) {
          setIsAuthenticated(true);
        }

        // 2. If Supabase is configured, setup auth state listener IMMEDIATELY
        if (isSupabaseConfigured() && supabase?.auth) {
          try {
            const { data: { subscription } } = supabase.auth.onAuthStateChange(
              async (event, session) => {
                if (
                  (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') &&
                  session?.user
                ) {
                  const user = session.user;
                  const userId = user.id;
                  const email = user.email || 'member@councilx.ai';
                  const name = user.user_metadata?.full_name || user.user_metadata?.name || 'Council Member';
                  const avatar = user.user_metadata?.avatar_url;

                  // Save local session immediately for permanent persistence
                  await saveLocalSession({
                    user_id: userId,
                    email,
                    name,
                    avatar_url: avatar,
                    provider: 'google',
                    isAuthenticated: true
                  });

                  setIsAuthenticated(true);

                  // Non-blocking silent profile upsert
                  safeUpsertProfile({
                    id: userId,
                    email,
                    full_name: name,
                    avatar_url: avatar,
                    base_free_limit: 5,
                    subscription_tier: 'initiate'
                  }).catch(() => {});
                } else if (event === 'SIGNED_OUT') {
                  // Only mark unauthenticated if local session was explicitly cleared by user clicking logout
                  const checkLocal = await getLocalSession();
                  if (!checkLocal) {
                    setIsAuthenticated(false);
                  }
                }
              }
            );
            authListenerSubscription = subscription;
          } catch (listenerErr) {
            console.warn('ℹ️ Auth state change subscription notice:', listenerErr?.message || listenerErr);
          }

          // 3. Inspect active Supabase session
          try {
            const { data: { session: supaSession }, error: sessionError } = await supabase.auth.getSession();

            if (supaSession?.user) {
              const user = supaSession.user;
              const userId = user.id;
              const email = user.email || 'member@councilx.ai';
              const name = user.user_metadata?.full_name || user.user_metadata?.name || 'Council Member';
              const avatar = user.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces';

              await saveLocalSession({
                user_id: userId,
                email,
                name,
                avatar_url: avatar,
                provider: 'google',
                isAuthenticated: true
              });

              setIsAuthenticated(true);
            }
          } catch (supaErr) {
            console.warn('ℹ️ Supabase session verification notice:', supaErr?.message || supaErr);
          }
        }

        // Final local session check: if session exists, ALWAYS keep user authenticated
        const finalSession = await getLocalSession();
        if (finalSession) {
          setIsAuthenticated(true);
        } else if (!getInitialAuthSync()) {
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.warn('ℹ️ Root auth initialization notice:', err?.message || err);
        const fallbackCheck = await getLocalSession();
        if (fallbackCheck) {
          setIsAuthenticated(true);
        }
      }
    };

    initializeAuthEngine();

    return () => {
      if (authListenerSubscription && typeof authListenerSubscription.unsubscribe === 'function') {
        authListenerSubscription.unsubscribe();
      }
    };
  }, []);

  return (
    <SafeAreaProvider style={styles.container}>
      <StatusBar style="light" backgroundColor={COLORS.pitchBlack} translucent={false} />
      <AppNavigator
        initialAuth={isAuthenticated}
        onAuthChange={(auth) => setIsAuthenticated(auth)}
      />
    </SafeAreaProvider>
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
});
