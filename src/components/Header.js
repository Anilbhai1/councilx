/**
 * COUNCIL X | THE SYNDICATE
 * Header Component with Language Selector, Profile Icon, and Supreme Council controls
 * Corporate Black & White Luxury Theme (OpenAI / Bloomberg Standard)
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../utils/i18n';
import LanguageModal from './LanguageModal';

export default function Header({
  isPremium = false,
  remainingFree = 5,
  onOpenSupremeCouncil,
  onOpenHistory,
  onOpenReferral,
  onOpenSettings,
  onOpenPaywall,
  onOpenProfile,
  title = 'COUNCIL X'
}) {
  const { lang, languages, t } = useLanguage();
  const [showLangMenu, setShowLangMenu] = useState(false);

  const currentLangObj = languages.find(l => l.code === lang) || languages[0];

  return (
    <View style={styles.container}>
      {/* Top Brand Bar */}
      <View style={styles.topRow}>
        <View style={styles.brandContainer}>
          <TouchableOpacity
            style={styles.insigniaBox}
            onPress={onOpenSupremeCouncil}
            activeOpacity={0.7}
            accessibilityLabel="Supreme Council Insignia"
          >
            <Ionicons name="eye-outline" size={18} color="#FFFFFF" />
          </TouchableOpacity>
          <View>
            <Text style={styles.brandTitle}>{title}</Text>
            <Text style={styles.brandSubtitle}>{t('brandSubtitle', '216 SUPREME SYNDICATE')}</Text>
          </View>
        </View>

        {/* Right Action Icons */}
        <View style={styles.actionRow}>
          {/* Language Selector Pill */}
          <TouchableOpacity
            style={styles.langPill}
            onPress={() => setShowLangMenu(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="globe-outline" size={13} color="#FFFFFF" />
            <Text style={styles.langPillText}>{currentLangObj.label}</Text>
            <Ionicons name="chevron-down" size={10} color="#888888" />
          </TouchableOpacity>

          {/* Quota / Pro Pill */}
          <TouchableOpacity
            style={[styles.statusBadge, isPremium ? styles.proBadge : styles.freeBadge]}
            onPress={isPremium ? null : onOpenPaywall}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isPremium ? "shield-checkmark" : "flash-outline"}
              size={11}
              color={isPremium ? '#000000' : '#FFFFFF'}
            />
            <Text style={[styles.statusText, isPremium && styles.proText]}>
              {isPremium ? t('proBadge', 'PRO') : `${remainingFree} ${t('freeBadge', 'FREE')}`}
            </Text>
          </TouchableOpacity>

          {/* Profile & Settings Icon */}
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={onOpenProfile || onOpenSettings}
            activeOpacity={0.8}
          >
            <Ionicons name="person-circle-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Refer & Earn Free Chats */}
          {onOpenReferral && (
            <TouchableOpacity style={styles.iconBtn} onPress={onOpenReferral}>
              <Ionicons name="gift-outline" size={18} color="#D1D5DB" />
            </TouchableOpacity>
          )}

          {/* History */}
          {onOpenHistory && (
            <TouchableOpacity style={styles.iconBtn} onPress={onOpenHistory}>
              <Ionicons name="time-outline" size={18} color="#D1D5DB" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Prominent Supreme Council Quick-Banner */}
      {onOpenSupremeCouncil && (
        <TouchableOpacity
          style={styles.supremeBanner}
          onPress={onOpenSupremeCouncil}
          activeOpacity={0.88}
        >
          <View style={styles.supremeInfo}>
            <View style={styles.supremeTitleRow}>
              <Ionicons name="diamond" size={14} color="#FFFFFF" />
              <Text style={styles.supremeText}>{t('supremeCouncilTitle', 'ALL-IN-ONE 216 SUPREME COUNCIL')}</Text>
              <View style={styles.mahaSabaBadge}>
                <Text style={styles.mahaSabaText}>{t('supremeCouncilBadge', '૨૧૬ મહા-સભા')}</Text>
              </View>
            </View>
            <Text style={styles.supremeDesc}>
              {t('supremeCouncilDesc', 'Consult all 108 Bharat Legends + 108 Modern Global Visionaries simultaneously')}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* Searchable Worldwide 100+ Language Modal */}
      <LanguageModal
        visible={showLangMenu}
        onClose={() => setShowLangMenu(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#050505',
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
    paddingBottom: 10,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  insigniaBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  brandSubtitle: {
    color: '#888888',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 14,
  },
  langPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  freeBadge: {
    backgroundColor: '#161616',
    borderColor: '#2E2E2E',
  },
  proBadge: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  proText: {
    color: '#000000',
  },
  iconBtn: {
    padding: 4,
  },
  supremeBanner: {
    marginHorizontal: 16,
    marginTop: 6,
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#2E2E2E',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  supremeInfo: {
    flex: 1,
    marginRight: 8,
  },
  supremeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  supremeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  mahaSabaBadge: {
    backgroundColor: '#202020',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  mahaSabaText: {
    color: '#D1D5DB',
    fontSize: 9,
    fontWeight: '800',
  },
  supremeDesc: {
    color: '#888888',
    fontSize: 10,
    lineHeight: 14,
  },
});
