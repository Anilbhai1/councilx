/**
 * COUNCIL X | THE SYNDICATE
 * Stealth Brutalist Admin Login Screen (/admin)
 * 
 * Security First:
 * - Simple, brutalist, pitch-black terminal login interface.
 * - Zero hardcoded emails or passwords.
 * - Verifies via POST /api/admin/login against environment variables.
 * - If user enters wrong credentials, the component instantly renders
 *   a 404 Page Not Found component so the route appears non-existent to outsiders.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  SafeAreaView,
  KeyboardAvoidingView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotFoundScreen from '../components/NotFoundScreen';

export default function AdminLoginScreen({ navigation, onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [is404, setIs404] = useState(false);

  // If wrong credentials or stealth 404 triggered, render true 404 Page Not Found
  if (is404) {
    return (
      <NotFoundScreen
        navigation={navigation}
        onGoHome={() => {
          setIs404(false);
          if (navigation && navigation.navigate) {
            navigation.navigate('Home');
          }
        }}
      />
    );
  }

  const handleAuthenticate = async () => {
    if (!email.trim() || !password.trim()) {
      // Any empty/incomplete submission immediately triggers 404 disguise
      setIs404(true);
      return;
    }

    setLoading(true);

    try {
      // Determine backend origin (relative for web, localhost:3001 for dev)
      const baseUrl =
        Platform.OS === 'web' && typeof window !== 'undefined'
          ? ''
          : 'http://localhost:3001';

      const response = await fetch(`${baseUrl}/api/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim()
        })
      });

      if (!response.ok) {
        // Any failure (404, 401, 500) renders 404 component immediately
        setIs404(true);
        setLoading(false);
        return;
      }

      const data = await response.json();

      if (data && data.success && data.token) {
        // Store JWT token locally
        await AsyncStorage.setItem('@councilx_admin_jwt', data.token);
        if (data.email) {
          await AsyncStorage.setItem('@councilx_admin_email', data.email);
        }

        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          try {
            window.sessionStorage.setItem('@councilx_admin_jwt', data.token);
            window.history.pushState(null, '', '/admin/dashboard');
          } catch (e) { }
        }

        if (onLoginSuccess) {
          onLoginSuccess(data.token);
        } else if (navigation && navigation.navigate) {
          navigation.navigate('AdminDashboard');
        }
      } else {
        setIs404(true);
      }
    } catch (err) {
      // Network error or failure triggers 404 disguise
      setIs404(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.card}>
          {/* Brutalist Terminal Header */}
          <View style={styles.header}>
            <Text style={styles.tagline}>// COUNCIL_X :: SYSTEM_SECURITY</Text>
            <Text style={styles.title}>RESTRICTED GATEWAY</Text>
            <Text style={styles.subtext}>
              PROTOCOL: SHA-256 HMAC // ENCLAVE: SOVEREIGN
            </Text>
          </View>

          <View style={styles.divider} />

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>&gt; IDENTIFIER (ADMIN_EMAIL)</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="root@councilx.ai"
                placeholderTextColor="#333333"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>&gt; ACCESS_KEY (SECRET)</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••••••••••"
                placeholderTextColor="#333333"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
                onSubmitEditing={handleAuthenticate}
              />
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleAuthenticate}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color="#D4AF37" />
                  <Text style={styles.submitBtnText}> VERIFYING CIPHER...</Text>
                </View>
              ) : (
                <Text style={styles.submitBtnText}>[ EXECUTE // AUTHENTICATE ]</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.terminalFooter}>
            <Text style={styles.footerNote}>
              Unauthorized ingress attempts are logged and terminated.
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  keyboardView: {
    width: '100%',
    maxWidth: 440,
    alignItems: 'center'
  },
  card: {
    width: '100%',
    backgroundColor: '#050505',
    borderWidth: 1,
    borderColor: '#1F1F1F',
    borderRadius: 2,
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.8,
    shadowRadius: 20
  },
  header: {
    marginBottom: 16
  },
  tagline: {
    fontSize: 10,
    color: '#D4AF37',
    letterSpacing: 2,
    fontFamily: Platform.select({ web: 'Courier, monospace', default: 'monospace' }),
    marginBottom: 6
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 3,
    fontFamily: Platform.select({ web: 'Courier, monospace', default: 'monospace' }),
    marginBottom: 4
  },
  subtext: {
    fontSize: 9,
    color: '#666666',
    letterSpacing: 1,
    fontFamily: Platform.select({ web: 'Courier, monospace', default: 'monospace' })
  },
  divider: {
    height: 1,
    backgroundColor: '#1A1A1A',
    marginBottom: 20
  },
  form: {
    width: '100%'
  },
  inputGroup: {
    marginBottom: 18
  },
  label: {
    fontSize: 11,
    color: '#D4AF37',
    letterSpacing: 1.5,
    fontFamily: Platform.select({ web: 'Courier, monospace', default: 'monospace' }),
    marginBottom: 6
  },
  input: {
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#262626',
    color: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontFamily: Platform.select({ web: 'Courier, monospace', default: 'monospace' }),
    borderRadius: 2
  },
  submitBtn: {
    marginTop: 8,
    backgroundColor: '#0A0A0A',
    borderWidth: 1,
    borderColor: '#D4AF37',
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 2
  },
  submitBtnDisabled: {
    borderColor: '#444444',
    opacity: 0.6
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  submitBtnText: {
    color: '#D4AF37',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    fontFamily: Platform.select({ web: 'Courier, monospace', default: 'monospace' })
  },
  terminalFooter: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#141414',
    paddingTop: 12
  },
  footerNote: {
    fontSize: 9,
    color: '#444444',
    textAlign: 'center',
    letterSpacing: 0.5,
    fontFamily: Platform.select({ web: 'Courier, monospace', default: 'monospace' })
  }
});

