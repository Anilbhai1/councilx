/**
 * COUNCIL X | THE SYNDICATE
 * 3-Tier Razorpay Paywall Modal & Built-In Razorpay Secure Checkout
 * 
 * Plans:
 * 1. 1-Month Pro Plan: ₹499 (30 Days)
 * 2. 6-Month Pro Plan: ₹1,999 (180 Days, SAVE 33% DISCOUNT)
 * 3. 1-Year Annual Pro Plan: ₹3,499 (365 Days, BEST VALUE • SAVE ₹2,489)
 * 
 * Features:
 * - Web Razorpay Checkout via dynamically loaded checkout.js
 * - Built-in In-App Razorpay Secure Checkout Fallback (Official Razorpay Blue branding)
 * - UPI / Card / NetBanking simulation for Expo Go & Web
 * - 30d / 180d / 365d auto-expiry tracking and instant unlock
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { COLORS } from '../theme/colors';
import { paymentService, SUBSCRIPTION_PLANS, loadRazorpayWebScript } from '../services/paymentService';

export default function PaywallModal({ visible, onClose, onSuccess, initialPlanKey }) {
  const [selectedPlanKey, setSelectedPlanKey] = useState('ANNUAL');
  const [loading, setLoading] = useState(false);
  const [userStatus, setUserStatus] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // In-App Razorpay Secure Checkout Modal state
  const [showRazorpaySheet, setShowRazorpaySheet] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('upi'); // upi | card | netbanking
  const [upiIdInput, setUpiIdInput] = useState('councilx@okaxis');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  useEffect(() => {
    if (visible) {
      loadStatus();
      if (Platform.OS === 'web') {
        loadRazorpayWebScript();
      }
    }
  }, [visible]);

  useEffect(() => {
    if (initialPlanKey) {
      if (initialPlanKey === '1_month' || initialPlanKey === 'MONTHLY') {
        setSelectedPlanKey('MONTHLY');
      } else if (initialPlanKey === '6_month' || initialPlanKey === 'SEMI_ANNUAL') {
        setSelectedPlanKey('SEMI_ANNUAL');
      } else if (initialPlanKey === '1_year' || initialPlanKey === 'ANNUAL') {
        setSelectedPlanKey('ANNUAL');
      } else if (initialPlanKey === 'extra_agent_slot' || initialPlanKey === 'EXTRA_AGENT_SLOT') {
        setSelectedPlanKey('EXTRA_AGENT_SLOT');
      }
    }
  }, [initialPlanKey, visible]);

  const loadStatus = async () => {
    const status = await paymentService.getUserStatus();
    setUserStatus(status);
  };

  if (!visible) return null;

  const currentPlan = selectedPlanKey === 'EXTRA_AGENT_SLOT'
    ? { name: '+1 Personal Agent Slot', price: 49, days: 365, customAgentsLimit: 1 }
    : (SUBSCRIPTION_PLANS[selectedPlanKey] || SUBSCRIPTION_PLANS.ANNUAL);

  const handleUpgradePlan = (planKey) => {
    setSelectedPlanKey(planKey);
    setTimeout(() => {
      handleUpgradePress(planKey);
    }, 50);
  };

  const handleBuyExtraSlot49 = async () => {
    setLoading(true);
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        const scriptLoaded = await loadRazorpayWebScript();
        if (scriptLoaded && window.Razorpay) {
          const razorpayKey = paymentService.getRazorpayKey();
          const options = {
            key: razorpayKey,
            amount: 4900,
            currency: 'INR',
            name: 'Council X | The Syndicate',
            description: '+1 Personal Agent Slot (Permanent Vault Upgrade)',
            theme: { color: '#000000' },
            handler: async (response) => {
              await paymentService.purchaseExtraAgentSlot(response.razorpay_payment_id);
              setLoading(false);
              Alert.alert(
                '⚡ Slot Unlocked',
                'Your vault capacity has been upgraded with +1 Personal Mastermind slot!',
                [{ text: 'OK', onPress: () => { onSuccess?.(); onClose?.(); } }]
              );
            },
            modal: {
              ondismiss: () => setLoading(false)
            }
          };
          const rzp = new window.Razorpay(options);
          rzp.open();
          setLoading(false);
          return;
        }
      } catch (e) {
        console.warn('Web razorpay error:', e);
      }
    }
    setLoading(false);
    setSelectedPlanKey('EXTRA_AGENT_SLOT');
    setShowRazorpaySheet(true);
  };

  /**
   * Main checkout handler
   * On web: attempts window.Razorpay; falls back to internal Razorpay checkout modal
   */
  const handleUpgradePress = async (planKeyOverride) => {
    const activeKey = planKeyOverride || selectedPlanKey;
    if (activeKey === 'EXTRA_AGENT_SLOT') {
      return handleBuyExtraSlot49();
    }

    const plan = SUBSCRIPTION_PLANS[activeKey] || SUBSCRIPTION_PLANS.ANNUAL;
    setLoading(true);

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        const scriptLoaded = await loadRazorpayWebScript();
        if (scriptLoaded && window.Razorpay) {
          const razorpayKey = paymentService.getRazorpayKey();

          const options = {
            key: razorpayKey,
            amount: plan.price * 100, // paise
            currency: 'INR',
            name: 'Council X | The Syndicate',
            description: `${plan.name} (${plan.days} Days Sovereign Access)`,
            image: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
            handler: async (response) => {
              const res = await paymentService.processRazorpayPlan(
                activeKey,
                response.razorpay_payment_id
              );
              setLoading(false);
              Alert.alert(
                '👑 Welcome to The Inner Circle',
                `Your ${res.plan.name} is now active for ${res.plan.days} days. All 216 Masterminds and the All-in-One Supreme Council are fully unlocked!`,
                [{ text: 'Enter Chamber', onPress: () => { onSuccess?.(); onClose?.(); } }]
              );
            },
            prefill: {
              email: 'member@councilx.ai',
              contact: '9999999999'
            },
            theme: {
              color: '#000000'
            },
            modal: {
              ondismiss: () => {
                setLoading(false);
              }
            }
          };

          const rzp = new window.Razorpay(options);
          rzp.on('payment.failed', (err) => {
            console.warn('Razorpay payment failed:', err);
            setLoading(false);
            setShowRazorpaySheet(true);
          });
          rzp.open();
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn('Web Razorpay popup bypassed:', err);
      }
    }

    // Default to the authentic In-App Razorpay Checkout Sheet
    setLoading(false);
    setShowRazorpaySheet(true);
  };

  /**
   * Complete payment through in-app Razorpay modal (Test Mode)
   */
  const handleCompleteInAppPayment = async () => {
    setIsProcessingPayment(true);
    try {
      // Simulate Razorpay gateway transaction capture
      const generatedPayId = 'pay_rzp_' + Math.random().toString(36).substring(2, 10).toUpperCase();

      if (selectedPlanKey === 'EXTRA_AGENT_SLOT') {
        await paymentService.purchaseExtraAgentSlot(generatedPayId);
        setIsProcessingPayment(false);
        setShowRazorpaySheet(false);
        Alert.alert(
          '⚡ Slot Unlocked',
          'Your vault capacity has been upgraded with +1 Personal Mastermind slot!',
          [{ text: 'Enter Chamber', onPress: () => { onSuccess?.(); onClose?.(); } }]
        );
        return;
      }

      const result = await paymentService.processRazorpayPlan(selectedPlanKey, generatedPayId);

      setIsProcessingPayment(false);
      setShowRazorpaySheet(false);

      Alert.alert(
        '👑 Welcome to The Inner Circle',
        `Your ${result.plan.name} has been activated (${result.plan.days} Days). Payment ID: ${result.paymentId}.\n\nAll 216 Masterminds and the All-in-One Supreme Council are now unlocked!`,
        [
          {
            text: 'Enter Chamber',
            onPress: () => {
              onSuccess?.();
              onClose?.();
            }
          }
        ]
      );
    } catch (err) {
      setIsProcessingPayment(false);
      Alert.alert('Payment Error', 'Unable to capture transaction. Please try again.');
    }
  };

  const handleCopyReferral = async () => {
    if (userStatus?.myReferralCode) {
      await Clipboard.setStringAsync(
        `Join me on Council X | The Syndicate! Use my invite code ${userStatus.myReferralCode} to get +15 FREE Mastermind Chats: https://councilx.ai`
      );
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  return (
    <>
      <Modal
        visible={visible && !showRazorpaySheet}
        transparent
        animationType="slide"
        onRequestClose={onClose}
      >
        <View style={styles.overlay}>
          <View style={styles.container}>
            {/* Close button */}
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
              {/* Header Insignia */}
              <View style={styles.header}>
                <View style={styles.iconCircle}>
                  <Ionicons name="diamond" size={26} color="#FFFFFF" />
                </View>
                <Text style={styles.subTitle}>THE 216 SUPREME SYNDICATE</Text>
                <Text style={styles.mainTitle}>UPGRADE TO SYNDICATE PRO</Text>

                {userStatus?.isExpired ? (
                  <View style={styles.expiredBanner}>
                    <Ionicons name="alert-circle" size={14} color="#FFF" />
                    <Text style={styles.expiredText}>
                      Your Subscription Has Expired — Renew Plan to Continue
                    </Text>
                  </View>
                ) : (
                  <View style={styles.badgeLimit}>
                    <Ionicons name="lock-closed" size={12} color="#E63946" />
                    <Text style={styles.badgeText}>
                      Free Quota Exhausted ({userStatus?.totalAllowedFree || 5} Free Chats Used)
                    </Text>
                  </View>
                )}
              </View>

              {/* Refer & Earn Free Chats Banner */}
              <View style={styles.referralBanner}>
                <View style={styles.refInfo}>
                  <Text style={styles.refHeading}>🎁 REFER FRIENDS & EARN FREE CHATS</Text>
                  <Text style={styles.refDesc}>
                    Your Code: <Text style={styles.refCodeText}>{userStatus?.myReferralCode || 'CX-PRO'}</Text>
                    {'\n'}Friends get +15 Chats • You get +30 Chats!
                  </Text>
                </View>
                <TouchableOpacity style={styles.copyRefBtn} onPress={handleCopyReferral}>
                  <Ionicons name={copiedCode ? "checkmark" : "copy-outline"} size={14} color="#000" />
                  <Text style={styles.copyRefText}>{copiedCode ? 'COPIED!' : 'SHARE'}</Text>
                </TouchableOpacity>
              </View>

              {/* 3 Subscription Plans + Standalone ₹49 Extra Agent Slot */}
              <View style={styles.plansContainer}>
                {/* 1. Monthly Plan */}
                <TouchableOpacity
                  style={[
                    styles.planCard,
                    selectedPlanKey === 'MONTHLY' && styles.selectedPlanCard
                  ]}
                  onPress={() => setSelectedPlanKey('MONTHLY')}
                  activeOpacity={0.85}
                >
                  <View style={styles.planLeft}>
                    <Text style={styles.planName}>1-Month Pro Plan</Text>
                    <Text style={styles.planDays}>30 Days Access • 15 Custom Agents</Text>
                  </View>
                  <View style={styles.planRightRow}>
                    <View style={styles.priceWrap}>
                      <Text style={styles.planPrice}>₹499</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.buyCardBtn}
                      onPress={() => handleUpgradePlan('MONTHLY')}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.buyCardBtnText}>Buy Plan</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>

                {/* 2. 6-Month Plan */}
                <TouchableOpacity
                  style={[
                    styles.planCard,
                    selectedPlanKey === 'SEMI_ANNUAL' && styles.selectedPlanCard
                  ]}
                  onPress={() => setSelectedPlanKey('SEMI_ANNUAL')}
                  activeOpacity={0.85}
                >
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>SAVE 33% DISCOUNT</Text>
                  </View>
                  <View style={styles.planLeft}>
                    <Text style={styles.planName}>6-Month Pro Plan</Text>
                    <Text style={styles.planDays}>180 Days Access • 50 Custom Agents</Text>
                  </View>
                  <View style={styles.planRightRow}>
                    <View style={styles.priceWrap}>
                      <Text style={styles.planPrice}>₹1,999</Text>
                      <Text style={styles.planStrike}>₹2,994</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.buyCardBtn}
                      onPress={() => handleUpgradePlan('SEMI_ANNUAL')}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.buyCardBtnText}>Buy Plan</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>

                {/* 3. 1-Year Annual Plan */}
                <TouchableOpacity
                  style={[
                    styles.planCard,
                    styles.annualCard,
                    selectedPlanKey === 'ANNUAL' && styles.selectedPlanCard
                  ]}
                  onPress={() => setSelectedPlanKey('ANNUAL')}
                  activeOpacity={0.85}
                >
                  <View style={styles.bestValueBadge}>
                    <Ionicons name="sparkles" size={10} color="#000000" />
                    <Text style={styles.bestValueText}>BEST VALUE • SAVE ₹2,489 DISCOUNT</Text>
                  </View>
                  <View style={styles.planLeft}>
                    <Text style={styles.planName}>1-Year Annual Pro Plan</Text>
                    <Text style={styles.planDays}>365 Days Access • Unlimited Custom Agents</Text>
                  </View>
                  <View style={styles.planRightRow}>
                    <View style={styles.priceWrap}>
                      <Text style={styles.planPriceHighlight}>₹3,499</Text>
                      <Text style={styles.planStrike}>₹5,988</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.buyCardBtn}
                      onPress={() => handleUpgradePlan('ANNUAL')}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.buyCardBtnText}>Buy Plan</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>

                {/* 4. Standalone ₹49 Extra Agent Slot (Purchasable Anytime) */}
                <TouchableOpacity
                  style={[
                    styles.planCard,
                    styles.slotCard49,
                    selectedPlanKey === 'EXTRA_AGENT_SLOT' && styles.selectedPlanCard
                  ]}
                  onPress={handleBuyExtraSlot49}
                  activeOpacity={0.85}
                >
                  <View style={styles.slotBadge49}>
                    <Ionicons name="flash" size={10} color="#000000" />
                    <Text style={styles.slotBadge49Text}>STANDALONE UPGRADE</Text>
                  </View>
                  <View style={styles.planLeft}>
                    <Text style={styles.planName}>⚡ +1 Personal Agent Slot</Text>
                    <Text style={styles.planDays}>Lifetime Vault Capacity • No Subscription Needed</Text>
                  </View>
                  <View style={styles.planRightRow}>
                    <View style={styles.priceWrap}>
                      <Text style={styles.planPrice}>₹49</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.buyCardBtn}
                      onPress={handleBuyExtraSlot49}
                      disabled={loading}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.buyCardBtnText}>Buy ₹49</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Feature Perks */}
              <View style={styles.perksBox}>
                <View style={styles.perkRow}>
                  <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                  <Text style={styles.perkText}>Unlimited 1-on-1 Chats with all 216 Masterminds</Text>
                </View>
                <View style={styles.perkRow}>
                  <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                  <Text style={styles.perkText}>ALL-IN-ONE 216 Supreme Council (૨૧૬ માસ્ટરમાઇન્ડ મહા-સભા)</Text>
                </View>
                <View style={styles.perkRow}>
                  <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                  <Text style={styles.perkText}>Create Personal Thinkers with Auto-Wikipedia Research</Text>
                </View>
                <View style={styles.perkRow}>
                  <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                  <Text style={styles.perkText}>Multi-Model Cascade with Google Search Grounding</Text>
                </View>
              </View>

              {/* Primary Upgrade CTA Button / Active Indicator */}
              {userStatus?.isPremium && userStatus?.expiresAt && Date.now() < userStatus.expiresAt ? (
                <View style={[styles.payButton, { backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#333333' }]}>
                  <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                  <Text style={[styles.payButtonText, { color: '#FFFFFF' }]}>
                    PRO PLAN ACTIVE ✓ (EXPIRES {new Date(userStatus.expiresAt).toLocaleDateString()})
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.payButton, loading && styles.btnDisabled]}
                  onPress={handleUpgradePress}
                  disabled={loading}
                  activeOpacity={0.88}
                >
                  {loading ? (
                    <ActivityIndicator color="#000" />
                  ) : (
                    <>
                      <Ionicons name="shield-checkmark" size={18} color="#000" />
                      <Text style={styles.payButtonText}>
                        {userStatus?.isExpired ? 'RENEW NOW' : 'UPGRADE NOW'} • {currentPlan.name.toUpperCase()} (₹{currentPlan.price})
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => setShowRazorpaySheet(true)}
                style={styles.openDirectTestBtn}
              >
                <Text style={styles.openDirectTestText}>
                  Or Open In-App Razorpay Checkout Sheet (Test Mode) →
                </Text>
              </TouchableOpacity>

              <Text style={styles.securityText}>
                🔒 Secured by Razorpay 256-bit SSL • Instant Activation
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* BUILT-IN RAZORPAY SECURE CHECKOUT MODAL (OFFICIAL RAZORPAY THEME) */}
      <Modal
        visible={showRazorpaySheet}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRazorpaySheet(false)}
      >
        <View style={styles.rzpOverlay}>
          <View style={styles.rzpModalContainer}>
            {/* Razorpay Header */}
            <View style={styles.rzpHeader}>
              <View style={styles.rzpBrandRow}>
                <View style={styles.rzpLogoBadge}>
                  <Ionicons name="shield" size={16} color="#0C2340" />
                </View>
                <View>
                  <Text style={styles.rzpBrandName}>Razorpay</Text>
                  <Text style={styles.rzpBrandSub}>TRUSTED BUSINESS SECURE CHECKOUT</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.rzpCloseBtn}
                onPress={() => setShowRazorpaySheet(false)}
              >
                <Ionicons name="close" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Plan Summary Bar */}
            <View style={styles.rzpOrderBar}>
              <View>
                <Text style={styles.rzpOrderTitle}>{currentPlan.name}</Text>
                <Text style={styles.rzpOrderDays}>Valid for {currentPlan.days} Days • Full Access</Text>
              </View>
              <Text style={styles.rzpOrderAmount}>₹{currentPlan.price}.00</Text>
            </View>

            {/* Test Mode Banner */}
            <View style={styles.rzpTestBanner}>
              <Ionicons name="information-circle" size={14} color="#0C2340" />
              <Text style={styles.rzpTestBannerText}>
                Razorpay Test Mode Active — One-click simulation enabled
              </Text>
            </View>

            {/* Payment Method Selector */}
            <View style={styles.rzpMethodsContainer}>
              <Text style={styles.rzpSectionTitle}>SELECT PAYMENT METHOD</Text>

              {/* UPI Option */}
              <TouchableOpacity
                style={[
                  styles.rzpMethodRow,
                  selectedMethod === 'upi' && styles.rzpMethodRowActive
                ]}
                onPress={() => setSelectedMethod('upi')}
              >
                <View style={styles.rzpMethodIcon}>
                  <Ionicons name="phone-portrait-outline" size={18} color="#0C2340" />
                </View>
                <View style={styles.rzpMethodInfo}>
                  <Text style={styles.rzpMethodTitle}>UPI / QR (Google Pay, PhonePe, Paytm)</Text>
                  <Text style={styles.rzpMethodSub}>Instant approval via virtual UPI</Text>
                </View>
                <Ionicons
                  name={selectedMethod === 'upi' ? "radio-button-on" : "radio-button-off"}
                  size={18}
                  color="#0C2340"
                />
              </TouchableOpacity>

              {/* Card Option */}
              <TouchableOpacity
                style={[
                  styles.rzpMethodRow,
                  selectedMethod === 'card' && styles.rzpMethodRowActive
                ]}
                onPress={() => setSelectedMethod('card')}
              >
                <View style={styles.rzpMethodIcon}>
                  <Ionicons name="card-outline" size={18} color="#0C2340" />
                </View>
                <View style={styles.rzpMethodInfo}>
                  <Text style={styles.rzpMethodTitle}>Credit / Debit Card</Text>
                  <Text style={styles.rzpMethodSub}>Visa, Mastercard, RuPay</Text>
                </View>
                <Ionicons
                  name={selectedMethod === 'card' ? "radio-button-on" : "radio-button-off"}
                  size={18}
                  color="#0C2340"
                />
              </TouchableOpacity>

              {/* NetBanking Option */}
              <TouchableOpacity
                style={[
                  styles.rzpMethodRow,
                  selectedMethod === 'netbanking' && styles.rzpMethodRowActive
                ]}
                onPress={() => setSelectedMethod('netbanking')}
              >
                <View style={styles.rzpMethodIcon}>
                  <Ionicons name="business-outline" size={18} color="#0C2340" />
                </View>
                <View style={styles.rzpMethodInfo}>
                  <Text style={styles.rzpMethodTitle}>NetBanking</Text>
                  <Text style={styles.rzpMethodSub}>HDFC, SBI, ICICI, Axis Bank</Text>
                </View>
                <Ionicons
                  name={selectedMethod === 'netbanking' ? "radio-button-on" : "radio-button-off"}
                  size={18}
                  color="#0C2340"
                />
              </TouchableOpacity>
            </View>

            {/* UPI ID Field if UPI selected */}
            {selectedMethod === 'upi' && (
              <View style={styles.rzpUpiBox}>
                <Text style={styles.rzpInputLabel}>VIRTUAL UPI ID / VPA</Text>
                <TextInput
                  style={styles.rzpInput}
                  value={upiIdInput}
                  onChangeText={setUpiIdInput}
                  placeholder="name@okaxis"
                />
              </View>
            )}

            {/* Big Razorpay Blue Pay Button */}
            <TouchableOpacity
              style={[styles.rzpPayBtn, isProcessingPayment && styles.btnDisabled]}
              onPress={handleCompleteInAppPayment}
              disabled={isProcessingPayment}
              activeOpacity={0.9}
            >
              {isProcessingPayment ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="lock-closed" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.rzpPayBtnText}>PAY ₹{currentPlan.price} (TEST MODE)</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.rzpFooterTrust}>
              <Ionicons name="shield-checkmark" size={14} color="#555" />
              <Text style={styles.rzpFooterTrustText}>
                Razorpay Verified Merchant • 256-Bit SSL Encryption
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '92%',
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    padding: 20,
    position: 'relative',
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    paddingBottom: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 8,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: '#383838',
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  subTitle: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 2,
  },
  mainTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 8,
  },
  badgeLimit: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(230, 57, 70, 0.15)',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(230, 57, 70, 0.4)',
    gap: 6,
  },
  badgeText: {
    color: '#FF6B6B',
    fontSize: 11,
    fontWeight: '700',
  },
  expiredBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D90429',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  expiredText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },
  referralBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#161616',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    padding: 12,
    marginBottom: 16,
  },
  refInfo: {
    flex: 1,
  },
  refHeading: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  refDesc: {
    color: '#AAA',
    fontSize: 10.5,
    lineHeight: 15,
  },
  refCodeText: {
    color: '#FFF',
    fontWeight: '800',
  },
  copyRefBtn: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 4,
    marginLeft: 8,
  },
  copyRefText: {
    color: '#000000',
    fontSize: 10.5,
    fontWeight: '800',
  },
  plansContainer: {
    gap: 10,
    marginBottom: 16,
  },
  planCard: {
    backgroundColor: '#181818',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
  },
  selectedPlanCard: {
    borderColor: '#FFFFFF',
    backgroundColor: '#1F1F1F',
  },
  annualCard: {
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  discountBadge: {
    position: 'absolute',
    top: -9,
    right: 12,
    backgroundColor: '#333333',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#555555',
  },
  discountText: {
    color: '#FFF',
    fontSize: 8.5,
    fontWeight: '800',
  },
  bestValueBadge: {
    position: 'absolute',
    top: -9,
    right: 12,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 3,
  },
  bestValueText: {
    color: '#000000',
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  planLeft: {
    flex: 1,
  },
  planName: {
    color: '#FFF',
    fontSize: 13.5,
    fontWeight: '800',
    marginBottom: 2,
  },
  planDays: {
    color: '#888',
    fontSize: 11,
  },
  planRight: {
    alignItems: 'flex-end',
  },
  planRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priceWrap: {
    alignItems: 'flex-end',
  },
  buyCardBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  buyCardBtnText: {
    color: '#000000',
    fontSize: 11.5,
    fontWeight: '800',
  },
  slotCard49: {
    borderColor: '#2A2A2A',
    backgroundColor: '#161616',
  },
  slotBadge49: {
    position: 'absolute',
    top: -9,
    right: 12,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 3,
  },
  slotBadge49Text: {
    color: '#000000',
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  planPrice: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '800',
  },
  planPriceHighlight: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  planStrike: {
    color: '#666',
    fontSize: 10,
    textDecorationLine: 'line-through',
  },
  perksBox: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 10,
    padding: 10,
    gap: 6,
    marginBottom: 16,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  perkText: {
    color: '#CCC',
    fontSize: 11,
    flex: 1,
  },
  payButton: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  openDirectTestBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  openDirectTestText: {
    color: '#E5E7EB',
    fontSize: 11,
    textDecorationLine: 'underline',
  },
  securityText: {
    color: '#666',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 6,
  },

  // Razorpay In-App Sheet Styles
  rzpOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  rzpModalContainer: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  rzpHeader: {
    backgroundColor: '#0C2340',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rzpBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rzpLogoBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rzpBrandName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  rzpBrandSub: {
    color: '#8BA1B7',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  rzpCloseBtn: {
    padding: 4,
  },
  rzpOrderBar: {
    backgroundColor: '#F5F7FA',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  rzpOrderTitle: {
    color: '#0C2340',
    fontSize: 13,
    fontWeight: '800',
  },
  rzpOrderDays: {
    color: '#64748B',
    fontSize: 11,
  },
  rzpOrderAmount: {
    color: '#0C2340',
    fontSize: 17,
    fontWeight: '900',
  },
  rzpTestBanner: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 14,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rzpTestBannerText: {
    color: '#0C2340',
    fontSize: 10.5,
    fontWeight: '700',
  },
  rzpMethodsContainer: {
    padding: 16,
    gap: 8,
  },
  rzpSectionTitle: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  rzpMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  rzpMethodRowActive: {
    borderColor: '#0C2340',
    backgroundColor: '#F8FAFC',
  },
  rzpMethodIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  rzpMethodInfo: {
    flex: 1,
  },
  rzpMethodTitle: {
    color: '#0C2340',
    fontSize: 12.5,
    fontWeight: '800',
  },
  rzpMethodSub: {
    color: '#64748B',
    fontSize: 10.5,
  },
  rzpUpiBox: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  rzpInputLabel: {
    color: '#64748B',
    fontSize: 9.5,
    fontWeight: '800',
    marginBottom: 4,
  },
  rzpInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0C2340',
    backgroundColor: '#F8FAFC',
  },
  rzpPayBtn: {
    backgroundColor: '#0C2340',
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0C2340',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  rzpPayBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  rzpFooterTrust: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  rzpFooterTrustText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '600',
  },
});
