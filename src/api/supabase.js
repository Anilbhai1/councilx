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

let supabaseInstance = null;

if (isSupabaseConfigured()) {
  try {
    supabaseInstance = createClient(getSupabaseUrl(), getSupabaseKey(), {
      auth: {
        storage: AsyncStorage,
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

