/**
 * COUNCIL X | THE SYNDICATE
 * Root Application Entrypoint & Principal Auth Controller
 * 
 * Architecture Features:
 * 1. Supabase Persistence Listener (autoRefreshToken & persistSession enabled)
 * 2. Bulletproof Offline-First Fallback: Local 'COUNCILX_USER_SESSION' takes priority
 * 3. Graceful Silent Catch: Unauthorized / Not Authorized errors never crash or block
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
        const legacyLoggedIn = await AsyncStorage.getItem('@councilx_is_logged_in');

        if (localSession || legacyLoggedIn === 'true') {
          // Immediately authorize user offline-first
          setIsAuthenticated(true);
        }

        // 2. If Supabase is configured, check Supabase session & setup auth state listener
        if (isSupabaseConfigured() && supabase?.auth) {
          try {
            const { data: { session: supaSession }, error: sessionError } = await supabase.auth.getSession();

            if (sessionError) {
              console.warn('ℹ️ Supabase getSession notice (handling gracefully):', sessionError.message);
              // If Supabase session token is rejected, maintain local session if present
              if (localSession) {
                setIsAuthenticated(true);
              }
            } else if (supaSession?.user) {
              // Successfully found valid Supabase session
              const user = supaSession.user;
              const userId = user.id;
              const email = user.email || 'member@councilx.ai';
              const name = user.user_metadata?.full_name || user.user_metadata?.name || 'Council Member';
              const avatar = user.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces';

              // Safely upsert profile into Supabase 'profiles' table (silent RLS catch)
              await safeUpsertProfile({
                id: userId,
                email,
                full_name: name,
                avatar_url: avatar,
                is_premium: false,
                base_free_limit: 5,
                subscription_tier: 'initiate'
              });

              // Synchronize local session with standard quota
              await saveLocalSession({
                user_id: userId,
                email,
                name,
                avatar_url: avatar,
                free_chats_remaining: 5,
                extra_agent_slots: 0,
                provider: 'google',
                isAuthenticated: true
              });

              setIsAuthenticated(true);
            }
          } catch (supaErr) {
            console.warn('ℹ️ Supabase session verification notice:', supaErr?.message || supaErr);
          }

          // 3. Listen to Supabase Auth State Changes with bulletproof error shielding
          try {
            const { data: { subscription } } = supabase.auth.onAuthStateChange(
              async (event, session) => {
                if (event === 'SIGNED_IN' && session?.user) {
                  const user = session.user;
                  const userId = user.id;
                  const email = user.email || 'member@councilx.ai';
                  const name = user.user_metadata?.full_name || user.user_metadata?.name || 'Council Member';
                  const avatar = user.user_metadata?.avatar_url;

                  // Silent safe upsert into profiles table
                  await safeUpsertProfile({
                    id: userId,
                    email,
                    full_name: name,
                    avatar_url: avatar,
                    base_free_limit: 5,
                    subscription_tier: 'initiate'
                  });

                  await saveLocalSession({
                    user_id: userId,
                    email,
                    name,
                    avatar_url: avatar,
                    free_chats_remaining: 5,
                    extra_agent_slots: 0,
                    provider: 'google',
                    isAuthenticated: true
                  });

                  setIsAuthenticated(true);
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
        }

        // If after checks neither Supabase nor local session is found, default to false
        const finalSession = await getLocalSession();
        if (finalSession) {
          setIsAuthenticated(true);
        } else if (legacyLoggedIn !== 'true') {
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.warn('ℹ️ Root auth initialization notice:', err?.message || err);
        // Guarantee user can still proceed if local session exists
        const fallbackCheck = await AsyncStorage.getItem(COUNCILX_USER_SESSION_KEY);
        setIsAuthenticated(Boolean(fallbackCheck));
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
    backgroundColor: COLORS.pitchBlack,
  },
});
