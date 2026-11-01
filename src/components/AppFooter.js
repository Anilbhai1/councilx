/**
 * COUNCIL X | THE SYNDICATE
 * Minimalist Global Legal Footer Component
 * 
 * Includes direct links to:
 * - Privacy Policy (/privacy-policy)
 * - Terms of Service (/terms-of-service)
 * - Contact Us (/contact)
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native';

export default function AppFooter() {
  const handleOpenLink = (path) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.location.href = path;
    } else {
      Linking.openURL(`https://councilx.ai${path}`).catch(() => { });
    }
  };

  return (
    <View style={styles.footerContainer}>
      <View style={styles.linksRow}>
        <TouchableOpacity onPress={() => handleOpenLink('/privacy-policy')} activeOpacity={0.7}>
          <Text style={styles.linkText}>Privacy Policy</Text>
        </TouchableOpacity>

        <Text style={styles.dot}>•</Text>

        <TouchableOpacity onPress={() => handleOpenLink('/terms-of-service')} activeOpacity={0.7}>
          <Text style={styles.linkText}>Terms of Service</Text>
        </TouchableOpacity>

        <Text style={styles.dot}>•</Text>

        <TouchableOpacity onPress={() => handleOpenLink('/contact')} activeOpacity={0.7}>
          <Text style={styles.linkText}>Contact Us</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.copyrightText}>
        © {new Date().getFullYear()} Council X | The 216 Supreme Syndicate. All Rights Reserved.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  footerContainer: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 175, 55, 0.15)',
    backgroundColor: '#070707',
    alignItems: 'center',
    marginTop: 20
  },
  linksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: 10
  },
  linkText: {
    color: '#D4AF37',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 6,
    paddingVertical: 4
  },
  dot: {
    color: '#444444',
    fontSize: 12,
    marginHorizontal: 4
  },
  copyrightText: {
    color: '#666666',
    fontSize: 11,
    textAlign: 'center'
  }
});

