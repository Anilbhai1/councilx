/**
 * COUNCIL X | THE SYNDICATE
 * Aesthetic Quote Card Share Modal
 * Viral Watermarked Card ('Advised by Council X | The Syndicate')
 */

import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import { COLORS } from '../theme/colors';

export default function QuoteCardModal({ visible, quote, agent, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!visible || !quote) return null;

  const agentName = agent?.name || 'Grand Council';
  const agentTitle = agent?.title || 'Sovereign Mastermind';
  const agentAvatar = agent?.avatar_url || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80';
  const agentCategory = agent?.category || 'Strategic Intelligence';

  // Extract a clean quote snippet (up to 280 characters)
  const cleanSnippet = quote.replace(/```json[\s\S]*?```/g, '').trim();
  const displaySnippet = cleanSnippet.length > 320 
    ? cleanSnippet.substring(0, 317) + '...' 
    : cleanSnippet;

  const handleCopyText = async () => {
    const formattedShareText = `"${displaySnippet}"\n\n— ${agentName} (${agentTitle})\n\nAdvised by Council X | The Syndicate ⚡`;
    await Clipboard.setStringAsync(formattedShareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareStory = async () => {
    const shareText = `"${displaySnippet}"\n\n— ${agentName} | Advised by Council X | The Syndicate`;
    try {
      if (await Sharing.isAvailableAsync()) {
        // Fallback or sharing mechanism
        await Clipboard.setStringAsync(shareText);
        Alert.alert(
          'Copied to Clipboard!',
          'The formatted Syndicate Quote Card text is copied. You can now paste it directly into your Instagram Story or WhatsApp status.',
          [{ text: 'OK' }]
        );
      } else {
        await Clipboard.setStringAsync(shareText);
        Alert.alert('Copied!', 'Text copied to clipboard.');
      }
    } catch (e) {
      handleCopyText();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Close Button */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={22} color={COLORS.textSecondary} />
          </TouchableOpacity>

          <Text style={styles.modalHeading}>VIRAL WISDOM CARD</Text>
          <Text style={styles.modalSubheading}>Ready for Instagram Stories & WhatsApp</Text>

          {/* Luxury Watermarked Card */}
          <View style={styles.cardWrapper}>
            {/* Top Ornate Watermark */}
            <View style={styles.watermarkHeader}>
              <Ionicons name="eye-outline" size={14} color={COLORS.gold} />
              <Text style={styles.watermarkText}>ADVISED BY COUNCIL X | THE SYNDICATE</Text>
              <Ionicons name="eye-outline" size={14} color={COLORS.gold} />
            </View>

            {/* Agent Header Inside Card */}
            <View style={styles.agentMetaRow}>
              <Image source={{ uri: agentAvatar }} style={styles.cardAvatar} />
              <View style={styles.cardAgentInfo}>
                <Text style={styles.cardAgentName}>{agentName}</Text>
                <Text style={styles.cardAgentTitle} numberOfLines={1}>{agentTitle}</Text>
                <Text style={styles.cardCategory}>{agentCategory.toUpperCase()}</Text>
              </View>
            </View>

            {/* Quote Body */}
            <View style={styles.quoteBody}>
              <Ionicons name="quote" size={24} color={COLORS.goldBorder} style={styles.quoteMark} />
              <Text style={styles.quoteText}>{displaySnippet}</Text>
            </View>

            {/* Bottom Seal */}
            <View style={styles.cardFooter}>
              <View style={styles.sealBox}>
                <Ionicons name="shield-checkmark" size={12} color={COLORS.gold} />
                <Text style={styles.sealText}>AUTHENTIC MASTERMIND DOCTRINE</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity 
              style={[styles.btn, styles.copyBtn]} 
              onPress={handleCopyText}
              activeOpacity={0.8}
            >
              <Ionicons 
                name={copied ? "checkmark-circle" : "copy-outline"} 
                size={16} 
                color={copied ? COLORS.goldLight : COLORS.gold} 
              />
              <Text style={[styles.btnText, copied && styles.copiedText]}>
                {copied ? 'COPIED!' : 'COPY WISDOM'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.btn, styles.shareBtn]} 
              onPress={handleShareStory}
              activeOpacity={0.8}
            >
              <Ionicons name="share-social-outline" size={16} color="#000" />
              <Text style={styles.shareBtnText}>SHARE TO STORY</Text>
            </TouchableOpacity>
          </View>
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
    padding: 16,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 390,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    padding: 18,
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    padding: 6,
    zIndex: 10,
  },
  modalHeading: {
    color: COLORS.gold,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2,
    marginTop: 4,
  },
  modalSubheading: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginBottom: 16,
  },
  cardWrapper: {
    width: '100%',
    backgroundColor: COLORS.pitchBlack,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.gold,
    padding: 16,
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  watermarkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.goldBorderSubtle,
    paddingBottom: 10,
    marginBottom: 12,
  },
  watermarkText: {
    color: COLORS.gold,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.6,
  },
  agentMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.gold,
    marginRight: 10,
  },
  cardAgentInfo: {
    flex: 1,
  },
  cardAgentName: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  cardAgentTitle: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  cardCategory: {
    color: COLORS.goldMuted,
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
  },
  quoteBody: {
    position: 'relative',
    marginVertical: 8,
    paddingHorizontal: 6,
  },
  quoteMark: {
    position: 'absolute',
    top: -10,
    left: -6,
    opacity: 0.4,
  },
  quoteText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    lineHeight: 20,
    fontStyle: 'italic',
    fontWeight: '500',
    textAlign: 'left',
  },
  cardFooter: {
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.goldBorderSubtle,
    alignItems: 'center',
  },
  sealBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sealText: {
    color: COLORS.goldMuted,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
    width: '100%',
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
  },
  copyBtn: {
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
  },
  shareBtn: {
    backgroundColor: COLORS.gold,
  },
  btnText: {
    color: COLORS.gold,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  copiedText: {
    color: COLORS.goldLight,
  },
  shareBtnText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
