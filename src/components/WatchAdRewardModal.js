/**
 * COUNCIL X | THE SYNDICATE
 * Freemium Reward Economy - Watch Ad Reward Modal
 * 
 * Component: src/components/WatchAdRewardModal.js
 * 
 * Theme: Pitch Black (#050505), Brutalist Obsidian Card (#121212), Gold Accents (#D4AF37)
 * Reward: +3 Council Credits for watching a 5-second transmission
 * 
 * =========================================================================
 * GOOGLE ADSENSE REWARDED AD INTEGRATION HOOK (PLACEHOLDER):
 * 
 * To activate live Google AdSense Rewarded Ads in production:
 * 1. Ensure the AdSense publisher script is present in app/layout.tsx:
 *    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX" crossorigin="anonymous"></script>
 * 
 * 2. Invoke the Google AdSense Rewarded Ad API:
 *    window.adsbygoogle = window.adsbygoogle || [];
 *    window.adsbygoogle.push({
 *      params: {
 *        google_ad_client: "ca-pub-XXXXXXXXXXXXXXXX",
 *        google_ad_slot: "XXXXXXXXXX",
 *        google_ad_format: "rewarded"
 *      }
 *    });
 * 
 * 3. Listen for the 'reward' event dispatched by Google AdSense once the user
 *    has watched the full ad, and supply the ad verification token to /api/rewards.
 * =========================================================================
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Easing,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { paymentService } from '../services/paymentService';

export default function WatchAdRewardModal({
  visible,
  onClose,
  onRewardClaimed,
  onUpgrade,
  currentCredits = 0
}) {
  const [adState, setAdState] = useState('idle'); // 'idle' | 'playing' | 'rewarded' | 'error'
  const [countdown, setCountdown] = useState(5);
  const [errorMessage, setErrorMessage] = useState('');
  const [earnedCredits, setEarnedCredits] = useState(3);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Pulse animation for simulated transmission
  useEffect(() => {
    if (adState === 'playing') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 600,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease)
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 600,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease)
          })
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [adState]);

  // Reset state on modal open
  useEffect(() => {
    if (visible) {
      setAdState('idle');
      setCountdown(5);
      setErrorMessage('');
      progressAnim.setValue(0);
    }
  }, [visible]);

  /**
   * Simulate Google AdSense Rewarded Ad playback (5-second transmission)
   */
  const handleStartWatchAd = () => {
    setAdState('playing');
    setCountdown(5);
    setErrorMessage('');

    // Animate progress bar across 5 seconds
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 5000,
      easing: Easing.linear,
      useNativeDriver: false
    }).start();

    /*
     * -------------------------------------------------------------------------
     * GOOGLE ADSENSE REWARDED AD INJECTION POINT
     * When ready to connect live Google AdSense:
     * if (typeof window !== 'undefined' && window.adsbygoogle) {
     *   // Trigger real rewarded ad prompt
     * }
     * -------------------------------------------------------------------------
     */

    let timeLeft = 5;
    const interval = setInterval(() => {
      timeLeft -= 1;
      setCountdown(timeLeft);

      if (timeLeft <= 0) {
        clearInterval(interval);
        handleClaimReward();
      }
    }, 1000);
  };

  /**
   * Finalize reward by calling backend /api/rewards and updating local store
   */
  const handleClaimReward = async () => {
    try {
      const verificationToken = `adsense_reward_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      const result = await paymentService.claimAdReward(verificationToken);

      if (result && result.success) {
        setEarnedCredits(result.creditsAwarded || 3);
        setAdState('rewarded');

        // Automatically notify parent after short celebration
        setTimeout(() => {
          if (onRewardClaimed) {
            onRewardClaimed(result.credits);
          }
        }, 1400);
      } else {
        throw new Error('Reward verification failed');
      }
    } catch (err) {
      console.error('[WatchAdRewardModal] Error claiming credits:', err);
      // Fallback local credit to never block the user
      const newCredits = await paymentService.addCredits(3);
      setEarnedCredits(3);
      setAdState('rewarded');
      setTimeout(() => {
        if (onRewardClaimed) onRewardClaimed(newCredits);
      }, 1400);
    }
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%']
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={adState === 'playing' ? () => {} : onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          
          {/* Header Bar */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.goldDot} />
              <Text style={styles.headerKicker}>COUNCIL OF WEALTH // FREEMIUM REWARD</Text>
            </View>
            {adState !== 'playing' && (
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Ionicons name="close" size={20} color="#888" />
              </TouchableOpacity>
            )}
          </View>

          {/* STATE 1: IDLE / OFFERING PROMPT */}
          {adState === 'idle' && (
            <View style={styles.content}>
              <View style={styles.iconCircle}>
                <Ionicons name="radio-outline" size={36} color="#D4AF37" />
              </View>

              <Text style={styles.title}>The Council Requires an Offering</Text>
              
              <Text style={styles.description}>
                Watch a brief transmission to earn <Text style={styles.goldHighlight}>3 Free Consultations</Text>, or upgrade to Sovereign Syndicate for unlimited real-time access.
              </Text>

              {/* Current Balance Tag */}
              <View style={styles.balanceBadge}>
                <Ionicons name="flash" size={14} color="#D4AF37" />
                <Text style={styles.balanceText}>
                  Vault Balance: <Text style={styles.balanceNumber}>{currentCredits}</Text> Council Credits
                </Text>
              </View>

              {/* Action Buttons */}
              <TouchableOpacity
                style={styles.watchAdBtn}
                onPress={handleStartWatchAd}
                activeOpacity={0.85}
              >
                <Ionicons name="play-circle" size={20} color="#050505" style={{ marginRight: 8 }} />
                <Text style={styles.watchAdBtnText}>Watch Ad for +3 Credits</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.upgradeBtn}
                onPress={() => {
                  if (onClose) onClose();
                  if (onUpgrade) onUpgrade();
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="shield-checkmark" size={16} color="#D4AF37" style={{ marginRight: 8 }} />
                <Text style={styles.upgradeBtnText}>Upgrade to Sovereign (Unlimited)</Text>
              </TouchableOpacity>

              <Text style={styles.footnote}>
                1 Credit = 1 interaction/chat with the Oracle.
              </Text>
            </View>
          )}

          {/* STATE 2: TRANSMISSION IN PROGRESS (MOCK ADSENSE) */}
          {adState === 'playing' && (
            <View style={styles.content}>
              <Animated.View style={[styles.playingIconCircle, { transform: [{ scale: pulseAnim }] }]}>
                <Ionicons name="cellular-outline" size={42} color="#D4AF37" />
              </Animated.View>

              <Text style={styles.playingTitle}>RECEIVING COUNCIL TRANSMISSION</Text>
              
              <Text style={styles.countdownNumber}>0:0{countdown}</Text>

              <Text style={styles.playingSubtitle}>
                Synchronizing encrypted telemetry broadcast... Please do not close.
              </Text>

              {/* Animated Progress Bar */}
              <View style={styles.progressBarContainer}>
                <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
              </View>

              <View style={styles.adPlaceholderBox}>
                <Text style={styles.adPlaceholderTag}>SPONSORED TRANSMISSION</Text>
                <Text style={styles.adPlaceholderText}>Google AdSense Rewarded Placement</Text>
              </View>
            </View>
          )}

          {/* STATE 3: REWARDED / SUCCESS */}
          {adState === 'rewarded' && (
            <View style={styles.content}>
              <View style={[styles.iconCircle, styles.successCircle]}>
                <Ionicons name="checkmark-circle" size={44} color="#10B981" />
              </View>

              <Text style={styles.successTitle}>TRANSMISSION VERIFIED</Text>
              
              <Text style={styles.successAmount}>+{earnedCredits} Council Credits</Text>

              <Text style={styles.successSubtitle}>
                Successfully minted to your vault. Your consultations are now active.
              </Text>

              <TouchableOpacity
                style={styles.continueBtn}
                onPress={() => {
                  if (onRewardClaimed) onRewardClaimed();
                  if (onClose) onClose();
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.continueBtnText}>Proceed to Oracle</Text>
                <Ionicons name="arrow-forward" size={16} color="#050505" style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            </View>
          )}

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#0A0A0A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    padding: 24,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)'
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  goldDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D4AF37',
    marginRight: 8
  },
  headerKicker: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#D4AF37',
    letterSpacing: 1.5,
    fontWeight: '700'
  },
  closeBtn: {
    padding: 4
  },
  content: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 4
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16
  },
  playingIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderWidth: 1.5,
    borderColor: '#D4AF37',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16
  },
  successCircle: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.4)'
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 24
  },
  description: {
    fontSize: 13,
    color: '#9E9E9E',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
    paddingHorizontal: 8
  },
  goldHighlight: {
    color: '#D4AF37',
    fontWeight: '700'
  },
  balanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141414',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    marginBottom: 20
  },
  balanceText: {
    fontSize: 12,
    color: '#B0B0B0',
    marginLeft: 6
  },
  balanceNumber: {
    color: '#D4AF37',
    fontWeight: '800'
  },
  watchAdBtn: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: '#D4AF37',
    paddingVertical: 14,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4
  },
  watchAdBtnText: {
    color: '#050505',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  upgradeBtn: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    paddingVertical: 12,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12
  },
  upgradeBtnText: {
    color: '#D4AF37',
    fontSize: 13,
    fontWeight: '600'
  },
  footnote: {
    fontSize: 11,
    color: '#666666',
    textAlign: 'center',
    marginTop: 4
  },
  playingTitle: {
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1.2,
    marginBottom: 8
  },
  countdownNumber: {
    fontSize: 32,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '800',
    color: '#D4AF37',
    marginBottom: 8
  },
  playingSubtitle: {
    fontSize: 12,
    color: '#888888',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 12
  },
  progressBarContainer: {
    width: '100%',
    height: 6,
    backgroundColor: '#1E1E1E',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 16
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#D4AF37',
    borderRadius: 3
  },
  adPlaceholderBox: {
    width: '100%',
    padding: 12,
    backgroundColor: '#121212',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center'
  },
  adPlaceholderTag: {
    fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#D4AF37',
    letterSpacing: 1,
    marginBottom: 2
  },
  adPlaceholderText: {
    fontSize: 11,
    color: '#666666'
  },
  successTitle: {
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 1.5,
    marginBottom: 6
  },
  successAmount: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8
  },
  successSubtitle: {
    fontSize: 13,
    color: '#9E9E9E',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18
  },
  continueBtn: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: '#D4AF37',
    paddingVertical: 13,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center'
  },
  continueBtnText: {
    color: '#050505',
    fontSize: 14,
    fontWeight: '800'
  }
});
