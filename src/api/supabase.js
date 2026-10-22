/**
 * COUNCIL X | THE SYNDICATE
 * Supabase Client Initialization & Fallback Helper
 */

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const getSupabaseUrl = () => process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://lqsoecrkdxynpzlqpgxa.supabase.co';
const getSupabaseKey = () => process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable__FMxH3WWAsgORolN0LnobQ_uPwjCVGC';

export const isSupabaseConfigured = () => {
  const url = getSupabaseUrl();
  const key = getSupabaseKey();
  return Boolean(
    url &&
    key &&
    !url.includes('your-project') &&
    !key.includes('your_supabase_anon_key')
  );
};

// Bulletproof storage adapter for Supabase session persistence
// Ensures session tokens survive browser tab closes, reloads, and long idle periods
const persistentStorageAdapter = {
  getItem: (key) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      try {
        const val = window.localStorage.getItem(key);
        if (val !== null) return val;
      } catch (e) {
        console.warn('localStorage getItem warning:', e);
      }
    }
    return AsyncStorage.getItem(key);
  },
  setItem: (key, value) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(key, value);
      } catch (e) {
        console.warn('localStorage setItem warning:', e);
      }
    }
    return AsyncStorage.setItem(key, value);
  },
  removeItem: (key) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem(key);
      } catch (e) {
        console.warn('localStorage removeItem warning:', e);
      }
    }
    return AsyncStorage.removeItem(key);
  }
};

let supabaseInstance = null;

if (isSupabaseConfigured()) {
  try {
    supabaseInstance = createClient(getSupabaseUrl(), getSupabaseKey(), {
      auth: {
        storage: persistentStorageAdapter,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: Platform.OS === 'web',
      },
    });
  } catch (err) {
    console.warn('⚠️ Supabase client initialization warning:', err?.message || err);
  }
}

export const supabase = supabaseInstance;

