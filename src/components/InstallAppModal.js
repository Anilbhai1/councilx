/**
 * COUNCIL X | THE SYNDICATE
 * Install App Modal Component (PWA Home Screen Install)
 * Visual step-by-step guidance for iOS Safari, Android Chrome, and Desktop PWA
 */

import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { useLanguage } from '../utils/i18n';

export default function InstallAppModal({ visible, onClose, onDirectInstall, canPromptDirectly, isIOS }) {
  const { lang, t } = useLanguage();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.brandRow}>
              <View style={styles.appIconWrap}>
                <Ionicons name="download-outline" size={20} color="#00F0FF" />
              </View>
              <View>
                <Text style={styles.modalTitle}>
                  {t('installAppTitle', 'Install CouncilX App')}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {t('installAppSubtitle', 'Fast 1-Tap Access on Mobile & Desktop')}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Quick Perks */}
          <View style={styles.perksRow}>
            <View style={styles.perkItem}>
              <Ionicons name="flash-outline" size={14} color="#00F0FF" />
              <Text style={styles.perkText}>Instant Launch</Text>
            </View>
            <View style={styles.perkItem}>
              <Ionicons name="phone-portrait-outline" size={14} color="#00F0FF" />
              <Text style={styles.perkText}>Full Screen App</Text>
            </View>
            <View style={styles.perkItem}>
              <Ionicons name="shield-checkmark-outline" size={14} color="#00F0FF" />
              <Text style={styles.perkText}>Offline Mode</Text>
            </View>
          </View>

          {/* Direct Install Button (if browser supports native prompt) */}
          {canPromptDirectly ? (
            <TouchableOpacity
              style={styles.directInstallBtn}
              onPress={() => {
                onClose();
                onDirectInstall();
              }}
              activeOpacity={0.88}
            >
              <Ionicons name="cloud-download" size={18} color="#000000" />
              <Text style={styles.directInstallBtnText}>
                {t('installNowBtn', 'INSTALL APP NOW')}
              </Text>
            </TouchableOpacity>
          ) : isIOS ? (
            /* iOS Safari Step-by-Step Instructions */
            <View style={styles.stepsContainer}>
              <Text style={styles.stepsHeading}>
                {lang === 'gu'
                  ? 'iPhone / iPad પર ઇન્સ્ટોલ કરવાનાં સરળ પગલાં:'
                  : lang === 'hi'
                  ? 'iPhone / iPad पर इंस्टॉल करने के आसान चरण:'
                  : 'How to Install on iPhone & iPad (Safari):'}
              </Text>

              <View style={styles.stepRow}>
                <View style={styles.stepNumberBadge}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepText}>
                    Safari બ્રાઉઝરમાં નીચે આપેલ <Text style={styles.stepHighlight}>Share</Text> બટન પર ટેપ કરો.
                  </Text>
                  <Text style={styles.stepSubtext}>
                    (Tap the Share icon at the bottom of your Safari screen)
                  </Text>
                </View>
                <Ionicons name="share-outline" size={22} color="#00F0FF" />
              </View>

              <View style={styles.stepRow}>
                <View style={styles.stepNumberBadge}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepText}>
                    નીચે સ્ક્રોલ કરીને <Text style={styles.stepHighlight}>"Add to Home Screen"</Text> પસંદ કરો.
                  </Text>
                  <Text style={styles.stepSubtext}>
                    (Scroll down and tap "Add to Home Screen")
                  </Text>
                </View>
                <Ionicons name="add-circle-outline" size={22} color="#00F0FF" />
              </View>

              <View style={styles.stepRow}>
                <View style={styles.stepNumberBadge}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepText}>
                    ઉપર જમણી બાજુએ આપેલ <Text style={styles.stepHighlight}>"Add"</Text> બટન પર ટેપ કરો.
                  </Text>
                  <Text style={styles.stepSubtext}>
                    (Tap "Add" in the top-right corner to complete)
                  </Text>
                </View>
                <Ionicons name="checkmark-circle" size={22} color="#00F0FF" />
              </View>
            </View>
          ) : (
            /* Android / Desktop Browser Instructions */
            <View style={styles.stepsContainer}>
              <Text style={styles.stepsHeading}>
                {lang === 'gu'
                  ? 'મોબાઈલ અથવા ડેસ્કટોપ પર ઇન્સ્ટોલ કરવા:'
                  : 'How to Add to Your Home Screen / Desktop:'}
              </Text>

              <View style={styles.stepRow}>
                <View style={styles.stepNumberBadge}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepText}>
                    બ્રાઉઝર મેનૂ (ત્રણ બિંદુઓ ⋮ અથવા એડ્રેસ બાર) માં <Text style={styles.stepHighlight}>"Install App"</Text> અથવા <Text style={styles.stepHighlight}>"Add to Home screen"</Text> પર ક્લિક કરો.
                  </Text>
                  <Text style={styles.stepSubtext}>
                    (In Chrome/Edge menu, click "Install CouncilX" or "Add to Home screen")
                  </Text>
                </View>
                <Ionicons name="ellipsis-vertical" size={20} color="#00F0FF" />
              </View>
            </View>
          )}

          {/* Done / Close Button */}
          <TouchableOpacity style={styles.gotItBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.gotItBtnText}>{t('gotIt', 'Got It')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalCard: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: '#0A0F1A',
    borderColor: 'rgba(0, 240, 255, 0.35)',
    borderWidth: 1,
    borderRadius: 18,
    padding: 22,
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  appIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    borderColor: 'rgba(0, 240, 255, 0.4)',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2
  },
  closeBtn: {
    padding: 6
  },
  perksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#111827',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 18
  },
  perkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  perkText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '600'
  },
  directInstallBtn: {
    backgroundColor: '#00F0FF',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8
  },
  directInstallBtnText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.8
  },
  stepsContainer: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderColor: 'rgba(0, 240, 255, 0.15)',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16
  },
  stepsHeading: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 12
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12
  },
  stepNumberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 240, 255, 0.2)',
    borderColor: '#00F0FF',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  stepNumberText: {
    color: '#00F0FF',
    fontSize: 12,
    fontWeight: '800'
  },
  stepContent: {
    flex: 1
  },
  stepText: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17
  },
  stepSubtext: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 2
  },
  stepHighlight: {
    color: '#00F0FF',
    fontWeight: '700'
  },
  gotItBtn: {
    backgroundColor: '#1E293B',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center'
  },
  gotItBtnText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700'
  }
});
