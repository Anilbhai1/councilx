/**
 * COUNCIL X | THE SYNDICATE
 * Agent Card Component (216 Supreme Masterminds)
 * Corporate Black & White Luxury Boardroom Standard (OpenAI / Bloomberg Minimal)
 */

import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { getGuaranteedAvatarUrl, getFaceFallbackUrl } from '../services/wikipediaService';
import { useLanguage } from '../utils/i18n';

export default function AgentCard({ agent, onPress }) {
  if (!agent) return null;

  const { category, t } = useLanguage();
  const isCustom = Boolean(agent.is_custom || agent.era?.includes('Custom'));
  const isBharat = Boolean(agent.era?.includes('Bharat'));

  const rawCandidate = agent.avatar_url || agent.image_url || agent.avatar || agent.image || '';
  const isWiki = typeof rawCandidate === 'string' && rawCandidate.includes('wikimedia.org');
  const fallbackUrl = getFaceFallbackUrl(agent) || '';
  const initialUri = isWiki ? rawCandidate : (getGuaranteedAvatarUrl(agent) || fallbackUrl);

  const [imgUri, setImgUri] = useState(initialUri);

  useEffect(() => {
    if (!agent) return;
    const candidate = agent.avatar_url || agent.image_url || agent.avatar || agent.image || '';
    const wiki = typeof candidate === 'string' && candidate.includes('wikimedia.org');
    setImgUri(wiki ? candidate : (getGuaranteedAvatarUrl(agent) || getFaceFallbackUrl(agent) || ''));
  }, [agent]);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress && onPress(agent)}
      activeOpacity={0.88}
    >
      {/* Top Meta: Era Badge & Category Pill */}
      <View style={styles.topMeta}>
        <View style={styles.eraBadge}>
          <Text style={styles.eraText}>
            {isCustom ? '✨ PERSONAL MASTERMIND' : (isBharat ? '🇮🇳 BHARAT VISHWAGURU' : '🌐 MODERN GLOBAL')}
          </Text>
        </View>

        <View style={styles.categoryPill}>
          <Text style={styles.categoryText}>{category(agent.category || 'General')}</Text>
        </View>
      </View>

      {/* Main Info Row with Guaranteed Live Portrait */}
      <View style={styles.mainRow}>
        <View style={styles.avatarBorder}>
          <Image
            source={{ uri: imgUri || fallbackUrl || 'https://tse2.mm.bing.net/th?q=portrait&w=400&h=400&c=7&rs=1&p=0&pid=Api' }}
            onError={() => fallbackUrl && setImgUri(fallbackUrl)}
            style={styles.avatar}
            resizeMode="cover"
          />
        </View>

        <View style={styles.details}>
          <Text style={styles.name} numberOfLines={1}>{agent.name || ''}</Text>
          <Text style={styles.title} numberOfLines={2}>{agent.title || agent.role || ''}</Text>

          {agent.published_works && agent.published_works.length > 0 && (
            <View style={styles.worksRow}>
              <Ionicons name="book-outline" size={10} color="#9CA3AF" />
              <Text style={styles.worksText} numberOfLines={1}>
                {agent.published_works.join(', ')}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Core Philosophy Quote */}
      <View style={styles.quoteBox}>
        <Ionicons name="quote" size={11} color="#666666" style={styles.quoteIcon} />
        <Text style={styles.quoteText} numberOfLines={2}>
          "{agent.core_philosophy}"
        </Text>
      </View>

      {/* Bottom Action Footer */}
      <View style={styles.footer}>
        <Text style={styles.consultPrompt}>{t('counselBtn', '1-ON-1 COUNSEL')}</Text>
        <Ionicons name="arrow-forward" size={12} color="#FFFFFF" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#121212',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#262626',
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 3,
  },
  topMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  eraBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#1C1C1C',
    borderWidth: 1,
    borderColor: '#2E2E2E',
  },
  eraText: {
    color: '#D1D5DB',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  categoryPill: {
    backgroundColor: '#181818',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#262626',
  },
  categoryText: {
    color: '#888888',
    fontSize: 10,
    fontWeight: '700',
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarBorder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: '#333333',
    overflow: 'hidden',
    backgroundColor: '#181818',
    marginRight: 12,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  monogramAvatar: {
    width: '100%',
    height: '100%',
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monogramAvatarText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  details: {
    flex: 1,
  },
  name: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  title: {
    color: '#9CA3AF',
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 4,
  },
  worksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  worksText: {
    color: '#777777',
    fontSize: 10,
    fontStyle: 'italic',
  },
  quoteBox: {
    flexDirection: 'row',
    backgroundColor: '#171717',
    borderRadius: 8,
    padding: 9,
    marginBottom: 10,
    borderLeftWidth: 2,
    borderLeftColor: '#383838',
  },
  quoteIcon: {
    marginRight: 6,
    marginTop: 2,
  },
  quoteText: {
    color: '#D1D5DB',
    fontSize: 11.5,
    fontStyle: 'italic',
    lineHeight: 16,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: '#1C1C1C',
    paddingTop: 8,
  },
  consultPrompt: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
});
