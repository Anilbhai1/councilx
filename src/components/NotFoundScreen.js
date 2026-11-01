/**
 * COUNCIL X | THE SYNDICATE
 * 404 Page Not Found Component
 * 
 * Used for stealth disguise:
 * When an unauthenticated user attempts to access /admin/dashboard,
 * or enters invalid credentials at /admin, this component is returned
 * so the route appears non-existent to outsiders.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';

export default function NotFoundScreen({ navigation, onGoHome }) {
  const handleReturnHome = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.history.replaceState(null, '', '/');
    }
    if (onGoHome) {
      onGoHome();
    } else if (navigation && navigation.navigate) {
      navigation.navigate('Home');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        <View style={styles.headerRow}>
          <Text style={styles.statusCode}>404</Text>
          <View style={styles.divider} />
          <Text style={styles.statusText}>This page could not be found.</Text>
        </View>

        <Text style={styles.subText}>
          The requested URL was not found on this server.
        </Text>

        <TouchableOpacity
          style={styles.homeBtn}
          onPress={handleReturnHome}
          activeOpacity={0.8}
        >
          <Text style={styles.homeBtnText}>[ Return to Home ]</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Council X Gateway // Server Status: 404
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    fontFamily: Platform.select({ web: 'monospace', default: 'monospace' })
  },
  inner: {
    alignItems: 'center',
    maxWidth: 540,
    width: '100%'
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  statusCode: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 2,
    fontFamily: Platform.select({ web: 'monospace', default: 'monospace' })
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: '#333333',
    marginHorizontal: 16
  },
  statusText: {
    fontSize: 14,
    color: '#888888',
    letterSpacing: 0.5,
    fontFamily: Platform.select({ web: 'monospace', default: 'monospace' })
  },
  subText: {
    fontSize: 12,
    color: '#555555',
    textAlign: 'center',
    marginBottom: 32,
    fontFamily: Platform.select({ web: 'monospace', default: 'monospace' })
  },
  homeBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#333333',
    backgroundColor: '#0A0A0A',
    borderRadius: 2
  },
  homeBtnText: {
    fontSize: 12,
    color: '#AAAAAA',
    letterSpacing: 1.5,
    fontFamily: Platform.select({ web: 'monospace', default: 'monospace' })
  },
  footer: {
    position: 'absolute',
    bottom: 24
  },
  footerText: {
    fontSize: 10,
    color: '#333333',
    letterSpacing: 1,
    fontFamily: Platform.select({ web: 'monospace', default: 'monospace' })
  }
});
