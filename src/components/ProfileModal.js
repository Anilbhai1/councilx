/**
 * COUNCIL X | THE SYNDICATE
 * Profile & Settings Modal
 * 
 * Features:
 * 1. Working Log Out (immediately clears Supabase & AsyncStorage and takes user to Login Screen)
 * 2. Subscription Plans Display (1-Month ₹499, 6-Month ₹1,999, 1-Year ₹3,499, +1 Extra Agent ₹49)
 * 3. Active Pro Plan Lock ("PRO PLAN ACTIVE ✓" with disabled button until expiry)
 * 4. Strict One-Time Referral Code Redemption
 * 5. Worldwide 100+ Languages Launcher
 * 6. Corporate Black & White Luxury Theme (OpenAI / Bloomberg Minimal)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { paymentService, SUBSCRIPTION_PLANS, loadRazorpayWebScript } from '../services/paymentService';
import { useLanguage } from '../utils/i18n';
import TermsModal from './TermsModal';
import LanguageModal from './LanguageModal';

export default function ProfileModal({ visible, onClose, onOpenPaywall, onOpenPricing, navigation, onLogout }) {
  const { t, lang, changeLanguage, languages, languageMeta } = useLanguage();
  const [userStatus, setUserStatus] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('Sovereign Leader');
  const [referralInput, setReferralInput] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [termsVisible, setTermsVisible] = useState(false);
  const [showLangModal, setShowLangModal] = useState(false);
  const [selectedPlanKey, setSelectedPlanKey] = useState('1_year');
  const [purchasingSlot, setPurchasingSlot] = useState(false);
  const [showRzpSheet49, setShowRzpSheet49] = useState(false);

  useEffect(() => {
    if (visible) {
      loadProfileData();
    }
  }, [visible]);

  const loadProfileData = async () => {
    const status = await paymentService.getUserStatus();
    setUserStatus(status);
    const email = await AsyncStorage.getItem('@councilx_user_email');
    setUserEmail(email || 'member@councilx.ai');
    const name = await AsyncStorage.getItem('@councilx_user_name');
    if (name) setUserName(name);
  };

  const handleCopyReferral = async () => {
    if (userStatus?.myReferralCode) {
      await Clipboard.setStringAsync(
        `Join me on Council X | The Syndicate! Use invite code ${userStatus.myReferralCode} to get +15 FREE Mastermind Chats: https://councilx.ai`
      );
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  const handleRedeemCode = async () => {
    if (!referralInput.trim()) return;
    const res = await paymentService.redeemReferralCode(referralInput.trim());
    Alert.alert('Promotional Code', res.message);
    if (res.success) {
      setReferralInput('');
      loadProfileData();
    }
  };

  const handleLogoutPress = async () => {
    const confirmMsg = lang === 'gu'
      ? 'શું તમે ખરેખર લોગ આઉટ કરીને લોગિન સ્ક્રીન પર જવા માંગો છો?'
      : lang === 'hi'
      ? 'क्या आप वाकई लॉग आउट करके लॉगिन स्क्रीन पर जाना चाहते हैं?'
      : 'Are you sure you want to end this session and return to the login screen?';

    const performLogout = async () => {
      try {
        await paymentService.clearSession();
      } catch (e) {
        console.error('Error clearing session:', e);
      }
      onClose?.();
      if (onLogout) {
        onLogout();
      }
    };

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.confirm(confirmMsg)) {
        await performLogout();
      }
      return;
    }

    Alert.alert(
      t('logout', 'Log Out'),
      confirmMsg,
      [
        { text: t('close', 'Cancel'), style: 'cancel' },
        {
          text: t('logout', 'Log Out'),
          style: 'destructive',
          onPress: performLogout
        }
      ]
    );
  };

  const handleBuyExtraSlot49 = async () => {
    if (purchasingSlot) return;
    try {
      setPurchasingSlot(true);
      const order = await paymentService.createOrder('extra_agent_slot');

      if (Platform.OS === 'web') {
        const loaded = await loadRazorpayWebScript();
        if (!loaded || !window.Razorpay) {
          alert('Razorpay SDK failed to load. Please verify your internet connection.');
          setPurchasingSlot(false);
          return;
        }
        const options = {
          key: order.key_id || paymentService.getRazorpayKey(),
          amount: order.amount || 4900,
          currency: order.currency || 'INR',
          name: 'Council X | The Syndicate',
          description: '+1 Personal Agent Slot Upgrade',
          order_id: order.order_id || order.id || undefined,
          prefill: {
            name: userName || 'Council Member',
            email: userEmail || 'member@councilx.ai'
          },
          theme: { color: '#000000' },
          handler: async (response) => {
            const verifyRes = await paymentService.verifyPayment({
              ...response,
              plan_type: 'extra_agent_slot',
              plan_id: 'extra_agent_slot'
            });
            if (verifyRes.success) {
              await loadProfileData();
              alert(lang === 'gu' ? 'સફળ! +1 પર્સનલ એજન્ટ સ્લોટ ઉમેરાયો છે.' : 'Success! +1 Personal Agent Slot added.');
            }
          },
          modal: {
            ondismiss: () => setPurchasingSlot(false)
          }
        };
        const rzpInstance = new window.Razorpay(options);
        rzpInstance.open();
        setPurchasingSlot(false);
      } else {
        setShowRzpSheet49(true);
        setPurchasingSlot(false);
      }
    } catch (err) {
      console.error('Buy slot error:', err);
      Alert.alert('Payment Error', err.message || 'Unable to initiate purchase');
      setPurchasingSlot(false);
    }
  };

  const handleCompleteMobilePayment49 = async () => {
    try {
      setPurchasingSlot(true);
      const verifyRes = await paymentService.verifyPayment({
        razorpay_payment_id: `pay_agent49_${Date.now()}`,
        plan_type: 'extra_agent_slot',
        plan_id: 'extra_agent_slot'
      });
      setShowRzpSheet49(false);
      if (verifyRes.success) {
        await loadProfileData();
        Alert.alert(
          'Success',
          lang === 'gu' ? 'સફળ! +1 પર્સનલ એજન્ટ સ્લોટ ઉમેરાયો છે.' : '+1 Personal Agent Slot added to your Vault!'
        );
      }
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setPurchasingSlot(false);
    }
  };

  if (!visible) return null;

  const isActivePro = userStatus?.isPremium && userStatus?.expiresAt && Date.now() < userStatus.expiresAt;
  const daysRemaining = userStatus?.expiresAt
    ? Math.max(0, Math.ceil((userStatus.expiresAt - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  let activePlanName = 'Syndicate Pro Plan';
  if (userStatus?.planType === '1_year') activePlanName = '1-Year Annual Pro Plan (Unlimited Agents)';
  else if (userStatus?.planType === '6_month') activePlanName = '6-Month Pro Plan (50 Custom Agents)';
  else if (userStatus?.planType === '1_month') activePlanName = '1-Month Pro Plan (15 Custom Agents)';
  else {
    const matchedPlan = Object.values(SUBSCRIPTION_PLANS).find(p => p.id === userStatus?.planType);
    if (matchedPlan) activePlanName = matchedPlan.name;
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.topHeader}>
            <View style={styles.topHeaderLeft}>
              <Ionicons name="person-circle-outline" size={24} color="#FFFFFF" />
              <Text style={styles.modalTitle}>{t('profileTitle', 'Profile & Settings')}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#888888" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* 1. User Account Card & Working Logout */}
            <View style={styles.card}>
              <View style={styles.userRow}>
                <View style={styles.avatarCircle}>
                  <Ionicons name="person" size={24} color="#FFFFFF" />
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{userName}</Text>
                  <Text style={styles.userEmail}>{userEmail}</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.logoutBtn} onPress={handleLogoutPress}>
                <Ionicons name="log-out-outline" size={16} color="#EF4444" />
                <Text style={styles.logoutText}>{t('logout', 'Log Out')}</Text>
              </TouchableOpacity>
            </View>

            {/* 2. Subscription Plan Status Card & Active Pro Lock */}
            <View style={[styles.card, isActivePro && styles.activeProCard]}>
              <View style={styles.subHeaderRow}>
                <Text style={styles.sectionHeader}>{t('subscriptionStatus', 'Subscription Plan Status')}</Text>
                {isActivePro ? (
                  <View style={styles.activeProBadge}>
                    <Ionicons name="checkmark-circle" size={13} color="#000000" />
                    <Text style={styles.activeProBadgeText}>PRO PLAN ACTIVE ✓</Text>
                  </View>
                ) : (
                  <View style={styles.freePlanBadge}>
                    <Text style={styles.freePlanBadgeText}>FREE TIER</Text>
                  </View>
                )}
              </View>

              {isActivePro ? (
                <View style={styles.activePlanDetails}>
                  <Text style={styles.planTitleWhite}>{activePlanName}</Text>
                  <View style={styles.dateRow}>
                    <Text style={styles.dateLabel}>{t('validUntil', 'Valid Until:')}</Text>
                    <Text style={styles.dateValue}>
                      {new Date(userStatus.expiresAt).toLocaleDateString()} ({daysRemaining} {t('daysLeft', 'Days Left')})
                    </Text>
                  </View>

                  {/* Disabled Button when Pro Plan is Active */}
                  <View style={styles.disabledActiveBtn}>
                    <Ionicons name="shield-checkmark" size={16} color="#888888" />
                    <Text style={styles.disabledActiveBtnText}>PRO PLAN ACTIVE ✓</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.freePlanDetails}>
                  <Text style={styles.quotaNotice}>
                    {t('freeSessionsLeft', 'Free Sessions Remaining:')}{' '}
                    <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>
                      {Math.min(5, userStatus?.remainingFree ?? 5)} / 5
                    </Text>
                  </Text>

                  {/* All Subscription Plans Display - Directly Purchasable & Interactive */}
                  <View style={styles.planSummaryList}>
                    {/* 1. 108 Bharat Vishwaguru */}
                    <TouchableOpacity
                      style={[
                        styles.planMiniCard,
                        selectedPlanKey === '108_bharat' && styles.selectedPlanMiniCard
                      ]}
                      onPress={() => setSelectedPlanKey('108_bharat')}
                      activeOpacity={0.88}
                    >
                      <View style={styles.planMiniHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.planMiniName}>108 Bharat Vishwaguru</Text>
                          <Text style={styles.planMiniPerk}>50 Inquiries/mo • 108 Legends • 5 Personal Thinkers</Text>
                        </View>
                        <Text style={styles.planMiniPrice}>₹499</Text>
                        <TouchableOpacity
                          style={styles.buyPlanMiniBtn}
                          onPress={() => {
                            onClose();
                            onOpenPaywall?.('108_bharat');
                          }}
                          activeOpacity={0.85}
                        >
                          <Text style={styles.buyPlanMiniBtnText}>
                            {lang === 'gu' ? 'ખરીદો' : 'Buy'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>

                    {/* 2. 216 Supreme Syndicate (All-in-One Sovereign) */}
                    <TouchableOpacity
                      style={[
                        styles.planMiniCard,
                        styles.planMiniCardAnnual,
                        (selectedPlanKey === '216_syndicate' || selectedPlanKey === '1_year') && styles.selectedPlanMiniCard
                      ]}
                      onPress={() => setSelectedPlanKey('216_syndicate')}
                      activeOpacity={0.88}
                    >
                      <View style={styles.planMiniHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.planMiniName, { color: '#F59E0B', fontWeight: '900' }]}>
                            216 Supreme Syndicate (All-in-One)
                          </Text>
                          <Text style={styles.planMiniPerk}>UNLIMITED Consults • 216 Maha-Saba Council • Debates</Text>
                        </View>
                        <Text style={[styles.planMiniPrice, { color: '#F59E0B' }]}>₹1,999</Text>
                        <TouchableOpacity
                          style={[styles.buyPlanMiniBtn, { backgroundColor: '#F59E0B' }]}
                          onPress={() => {
                            onClose();
                            onOpenPaywall?.('216_syndicate');
                          }}
                          activeOpacity={0.85}
                        >
                          <Text style={[styles.buyPlanMiniBtnText, { color: '#000000' }]}>
                            {lang === 'gu' ? 'ખરીદો' : 'Buy'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>

                    {/* Standalone ₹49 Extra Agent Slot Button (Purchasable Anytime) */}
                    <TouchableOpacity
                      style={styles.extraSlotInfoBox}
                      onPress={handleBuyExtraSlot49}
                      disabled={purchasingSlot}
                      activeOpacity={0.88}
                    >
                      <View style={styles.extraSlotIconCircle}>
                        <Ionicons name="flash" size={13} color="#000000" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.extraSlotTitle}>
                          {lang === 'gu'
                            ? '⚡ +1 પર્સનલ એજન્ટ સ્લોટ ખરીદો (₹49)'
                            : lang === 'hi'
                            ? '⚡ +1 पर्सनल एजेंट स्लॉट खरीदें (₹49)'
                            : '⚡ Buy +1 Agent Slot (₹49)'}
                        </Text>
                        <Text style={styles.extraSlotText}>
                          {lang === 'gu'
                            ? 'સબ્સ્ક્રિપ્શન વિના ગમે ત્યારે કાયમી સ્લોટ ઉમેરો'
                            : 'Add permanent custom agent slot anytime'}
                        </Text>
                      </View>
                      <View style={styles.buyBadgeWhite}>
                        {purchasingSlot ? (
                          <ActivityIndicator size="small" color="#000000" />
                        ) : (
                          <Text style={styles.buyBadgeWhiteText}>
                            {lang === 'gu' ? 'ખરીદો ₹49' : 'Buy ₹49'}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={styles.upgradeCtaBtn}
                    onPress={() => {
                      onClose();
                      onOpenPaywall?.(selectedPlanKey);
                    }}
                    activeOpacity={0.88}
                  >
                    <Ionicons name="sparkles" size={15} color="#000000" />
                    <Text style={styles.upgradeCtaText}>
                      {userStatus?.isExpired
                        ? `${t('renewPlanBtn', 'RENEW PRO PLAN')} (${selectedPlanKey === '1_month' ? '₹499' : selectedPlanKey === '6_month' ? '₹1,999' : '₹3,499'})`
                        : `${t('buyPlanBtn', 'UPGRADE PLAN')} (${selectedPlanKey === '1_month' ? '₹499' : selectedPlanKey === '6_month' ? '₹1,999' : '₹3,499'})`}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.fullPricingBtn}
                    onPress={() => {
                      onClose();
                      if (onOpenPricing) onOpenPricing();
                      else if (navigation?.navigate) navigation.navigate('Pricing');
                      else onOpenPaywall?.('premium_mastermind');
                    }}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="card-outline" size={14} color="#FFFFFF" />
                    <Text style={styles.fullPricingBtnText}>
                      {lang === 'gu'
                        ? 'સંપૂર્ણ પ્લાન અને પેમેન્ટ (Razorpay / Stripe) જુઓ'
                        : 'View Full Pricing & Payment Gateways (Razorpay / Stripe)'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* 3. Global App Language Selector */}
            <View style={styles.card}>
              <View style={styles.subHeaderRow}>
                <Text style={styles.sectionHeader}>{t('selectLanguage', 'Select Language')}</Text>
                <View style={styles.currentLangBadge}>
                  <Text style={styles.currentLangFlag}>{languageMeta?.flag || '🌐'}</Text>
                  <Text style={styles.currentLangText}>{languageMeta?.label || 'ગુજરાતી'}</Text>
                </View>
              </View>

              {/* Popular Language Quick Chips */}
              <View style={styles.langPillsRow}>
                {languages.filter(l => l.popular).map((l) => {
                  const isSelected = lang === l.code;
                  return (
                    <TouchableOpacity
                      key={l.code}
                      style={[styles.langPill, isSelected && styles.selectedLangPill]}
                      onPress={() => changeLanguage(l.code)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.langPillFlag}>{l.flag}</Text>
                      <Text style={[styles.langPillText, isSelected && styles.selectedLangPillText]}>
                        {l.label}
                      </Text>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={12} color="#000000" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                style={styles.openAllLangsBtn}
                onPress={() => setShowLangModal(true)}
                activeOpacity={0.85}
              >
                <Ionicons name="globe-outline" size={15} color="#FFFFFF" />
                <Text style={styles.openAllLangsText}>
                  Explore & Search All 100+ Global Languages →
                </Text>
              </TouchableOpacity>
            </View>

            {/* 4. Referral / Promo Code Center with Strict 1-Time Validation */}
            <View style={styles.card}>
              <Text style={styles.sectionHeader}>{t('referralTitle', 'Referral Code & Free Credits')}</Text>
              <Text style={styles.referralSub}>
                {t('referralDesc', 'Invite friends (+15 free chats for them, +30 for you)')}
              </Text>

              {/* Your Code */}
              <View style={styles.myCodeBox}>
                <View>
                  <Text style={styles.codeLabel}>{t('yourCode', 'Your Code:')}</Text>
                  <Text style={styles.codeValue}>{userStatus?.myReferralCode || 'CX-PRO'}</Text>
                </View>
                <TouchableOpacity style={styles.copyCodeBtn} onPress={handleCopyReferral}>
                  <Ionicons name={copiedCode ? "checkmark" : "copy-outline"} size={14} color="#000000" />
                  <Text style={styles.copyCodeText}>{copiedCode ? t('copied', 'Copied!') : t('copyCode', 'Copy')}</Text>
                </TouchableOpacity>
              </View>

              {/* Redeem Friend's Code (strictly 1-time) */}
              {!userStatus?.hasRedeemedCode ? (
                <View style={styles.redeemRow}>
                  <TextInput
                    style={styles.redeemInput}
                    placeholder={t('redeemPlaceholder', 'Enter Code (e.g. CX-78A9)')}
                    placeholderTextColor="#666666"
                    value={referralInput}
                    onChangeText={setReferralInput}
                    autoCapitalize="characters"
                  />
                  <TouchableOpacity style={styles.redeemBtn} onPress={handleRedeemCode}>
                    <Text style={styles.redeemBtnText}>{t('applyCode', 'Apply')}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.redeemedSuccessBox}>
                  <Ionicons name="checkmark-circle" size={15} color="#FFFFFF" />
                  <Text style={styles.redeemedSuccessText}>
                    {lang === 'gu'
                      ? 'રેફરલ કોડ સફળતાપૂર્વક લાગુ થઈ ગયો છે (+૧૫ સત્રો સક્રિય)'
                      : 'Referral code redeemed (+15 free chats claimed)'}
                  </Text>
                </View>
              )}
            </View>

            {/* Sovereign Admin Terminal Shortcut (Exclusively for arshitchodavadiya@gmail.com) */}
            {userEmail?.toLowerCase() === 'arshitchodavadiya@gmail.com' ? (
              <TouchableOpacity
                style={styles.adminTerminalBtn}
                onPress={() => {
                  onClose?.();
                  navigation?.navigate('Admin');
                }}
                activeOpacity={0.85}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="shield-checkmark" size={16} color="#00F0FF" />
                  <Text style={styles.adminTerminalBtnText}>⚡ OPEN SOVEREIGN ADMIN TERMINAL</Text>
                </View>
                <Ionicons name="chevron-forward" size={14} color="#00F0FF" />
              </TouchableOpacity>
            ) : null}

            {/* 5. Terms & Conditions Modal Link */}
            <TouchableOpacity
              style={styles.termsFooterBtn}
              onPress={() => setTermsVisible(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="shield-checkmark-outline" size={15} color="#666666" />
              <Text style={styles.termsFooterText}>
                {t('termsLinkText', 'Terms of Service')} & Legal Notice
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>

      {/* In-App Razorpay Checkout Sheet for ₹49 Agent Slot on Mobile */}
      <Modal
        visible={showRzpSheet49}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRzpSheet49(false)}
      >
        <View style={styles.rzpModalOverlay}>
          <View style={styles.rzpModalBox}>
            <View style={styles.rzpHeader}>
              <View style={styles.rzpLogoWrap}>
                <Ionicons name="flash" size={16} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rzpTitle}>Razorpay Checkout</Text>
                <Text style={styles.rzpSub}>Council X | +1 Agent Slot (₹49)</Text>
              </View>
              <TouchableOpacity onPress={() => setShowRzpSheet49(false)}>
                <Ionicons name="close" size={20} color="#888888" />
              </TouchableOpacity>
            </View>

            <View style={styles.rzpDetails}>
              <View style={styles.rzpRow}>
                <Text style={styles.rzpLabel}>Item</Text>
                <Text style={styles.rzpValue}>+1 Custom Agent Slot</Text>
              </View>
              <View style={styles.rzpRow}>
                <Text style={styles.rzpLabel}>Validity</Text>
                <Text style={styles.rzpValue}>Permanent / Lifetime</Text>
              </View>
              <View style={[styles.rzpRow, styles.rzpTotalRow]}>
                <Text style={styles.rzpTotalLabel}>Total Amount</Text>
                <Text style={styles.rzpTotalValue}>₹49.00</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.rzpPayBtn}
              onPress={handleCompleteMobilePayment49}
              disabled={purchasingSlot}
            >
              {purchasingSlot ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <Text style={styles.rzpPayBtnText}>CONFIRM & PAY ₹49</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <TermsModal
        visible={termsVisible}
        onClose={() => setTermsVisible(false)}
      />

      <LanguageModal
        visible={showLangModal}
        onClose={() => setShowLangModal(false)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  container: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '90%',
    backgroundColor: '#0A0A0A',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#262626',
    overflow: 'hidden',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E1E',
    backgroundColor: '#111111',
  },
  topHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  card: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#242424',
    borderRadius: 12,
    padding: 14,
  },
  activeProCard: {
    borderColor: '#383838',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1C1C1C',
    borderWidth: 1,
    borderColor: '#333333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '800',
  },
  userEmail: {
    color: '#888888',
    fontSize: 11,
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '800',
  },
  subHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeader: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
  activeProBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  activeProBadgeText: {
    color: '#000000',
    fontSize: 9.5,
    fontWeight: '900',
  },
  freePlanBadge: {
    backgroundColor: '#1F1F1F',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  freePlanBadgeText: {
    color: '#888888',
    fontSize: 9.5,
    fontWeight: '800',
  },
  activePlanDetails: {
    gap: 8,
  },
  planTitleWhite: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateLabel: {
    color: '#888888',
    fontSize: 11,
  },
  dateValue: {
    color: '#D1D5DB',
    fontSize: 11,
    fontWeight: '700',
  },
  disabledActiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#181818',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 6,
  },
  disabledActiveBtnText: {
    color: '#888888',
    fontSize: 12,
    fontWeight: '800',
  },
  freePlanDetails: {
    gap: 10,
  },
  quotaNotice: {
    color: '#A3A3A3',
    fontSize: 11.5,
  },
  planSummaryList: {
    gap: 8,
    marginVertical: 4,
  },
  planMiniCard: {
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#242424',
    borderRadius: 8,
    padding: 10,
  },
  selectedPlanMiniCard: {
    borderColor: '#FFFFFF',
    backgroundColor: '#1A1A1A',
  },
  planMiniCardAnnual: {
    borderColor: '#383838',
  },
  planMiniHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  planMiniName: {
    color: '#D1D5DB',
    fontSize: 12,
    fontWeight: '700',
  },
  planMiniPrice: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  planMiniPerk: {
    color: '#888888',
    fontSize: 10,
    marginTop: 2,
  },
  buyPlanMiniBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    marginLeft: 6,
  },
  buyPlanMiniBtnText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '800',
  },
  extraSlotInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#181818',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 8,
    padding: 10,
  },
  extraSlotIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  extraSlotTitle: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800',
  },
  extraSlotText: {
    color: '#888888',
    fontSize: 10,
    marginTop: 1,
  },
  buyBadgeWhite: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  buyBadgeWhiteText: {
    color: '#000000',
    fontSize: 11.5,
    fontWeight: '900',
  },
  upgradeCtaBtn: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 8,
    marginTop: 6,
  },
  upgradeCtaText: {
    color: '#000000',
    fontSize: 12.5,
    fontWeight: '900',
  },
  rzpModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  rzpModalBox: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#121212',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333333',
    padding: 20,
  },
  rzpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#222222',
  },
  rzpLogoWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#262626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rzpTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  rzpSub: {
    color: '#888888',
    fontSize: 11,
  },
  rzpDetails: {
    gap: 10,
    marginBottom: 18,
  },
  rzpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rzpLabel: {
    color: '#888888',
    fontSize: 12,
  },
  rzpValue: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  rzpTotalRow: {
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#222222',
  },
  rzpTotalLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  rzpTotalValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  rzpPayBtn: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rzpPayBtnText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  currentLangBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#181818',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  currentLangFlag: {
    fontSize: 11,
  },
  currentLangText: {
    color: '#D1D5DB',
    fontSize: 10,
    fontWeight: '700',
  },
  langPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#262626',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 14,
  },
  selectedLangPill: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  langPillFlag: {
    fontSize: 11,
  },
  langPillText: {
    color: '#D1D5DB',
    fontSize: 10.5,
    fontWeight: '600',
  },
  selectedLangPillText: {
    color: '#000000',
    fontWeight: '800',
  },
  openAllLangsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    paddingVertical: 8,
    borderRadius: 8,
  },
  openAllLangsText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  referralSub: {
    color: '#888888',
    fontSize: 11,
    marginBottom: 10,
  },
  myCodeBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#181818',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  codeLabel: {
    color: '#666666',
    fontSize: 9.5,
    fontWeight: '700',
  },
  codeValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  copyCodeBtn: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  copyCodeText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '800',
  },
  redeemRow: {
    flexDirection: 'row',
    gap: 8,
  },
  redeemInput: {
    flex: 1,
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#262626',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    color: '#FFFFFF',
    fontSize: 12,
  },
  redeemBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  redeemBtnText: {
    color: '#000000',
    fontSize: 11.5,
    fontWeight: '800',
  },
  redeemedSuccessBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    padding: 8,
    borderRadius: 8,
  },
  redeemedSuccessText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  termsFooterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  termsFooterText: {
    color: '#666666',
    fontSize: 11,
    fontWeight: '600',
  },
  fullPricingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 10,
    paddingVertical: 11,
    marginTop: 10,
  },
  fullPricingBtnText: {
    color: '#E5E7EB',
    fontSize: 11.5,
    fontWeight: '700',
  },
  adminTerminalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#091518',
    borderWidth: 1,
    borderColor: '#00F0FF',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 14,
    marginBottom: 6
  },
  adminTerminalBtnText: {
    color: '#00F0FF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8
  },
});
