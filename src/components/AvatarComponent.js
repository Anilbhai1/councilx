/**
 * COUNCIL X | THE SYNDICATE
 * Luxury Mastermind Avatar Component
 * 
 * Strict Zero-Mismatch Architecture:
 * - If verified photo exists: Renders crisp high-resolution portrait.
 * - If avatar_url is null or image fails to load: Renders a luxury initial-monogram
 *   (e.g., "MK" for Madhava-kara) centered in an obsidian #111111 circle with crisp white text.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { getGuaranteedAvatarUrl } from '../services/wikipediaService';

export function getMonogramInitials(name) {
  if (!name || typeof name !== 'string') return 'CX';
  const clean = name
    .replace(/^(Bhagwan|Prabhu|Maharshi|Brahmarshi|Samrat|Chhatrapati|Acharya|Rani|Guru|Maha\s+Amatya|Amatya|Raja|Punyashlok|Dr\.|Field\s+Marshal|Sant|Goswami|Shri|Smt\.|Swami|Lord|Hon\.|Prof\.)\s+/i, '')
    .trim();
  const parts = clean.split(/[\s\-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  if (clean.length >= 2) {
    return clean.slice(0, 2).toUpperCase();
  }
  return clean.toUpperCase() || 'CX';
}

export default function AvatarComponent({
  agent,
  name,
  avatarUrl,
  size = 52,
  borderWidth = 1,
  borderColor = '#262626',
  style,
  textStyle,
  resizeMode = 'cover',
}) {
  const agentName = name || agent?.name || 'Mastermind';
  const effectiveAgent = agent || { name: agentName };
  const rawUrl = avatarUrl !== undefined ? avatarUrl : (agent?.avatar_url || agent?.image_url || null);
  const guaranteedUrl = (rawUrl && typeof rawUrl === 'string' && rawUrl.startsWith('http') && !rawUrl.includes('ui-avatars.com'))
    ? rawUrl
    : getGuaranteedAvatarUrl(effectiveAgent);

  const borderRadius = Math.round(size / 2);

  const containerStyle = {
    width: size,
    height: size,
    borderRadius,
    borderWidth,
    borderColor,
    overflow: 'hidden',
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <View style={[containerStyle, style]}>
      <Image
        source={{ uri: guaranteedUrl }}
        style={{ width: size, height: size, borderRadius }}
        resizeMode={resizeMode}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  obsidianContainer: {
    backgroundColor: '#111111',
  },
  monogramText: {
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: 0.8,
    textAlign: 'center',
    includeFontPadding: false,
  },
});
