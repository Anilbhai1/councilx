/**
 * COUNCIL X | THE SYNDICATE
<<<<<<< HEAD
 * Silicon Valley SaaS Tier Subscription Paywall Modal
 * 
 * Aesthetic:
 * - Sophisticated dark boardroom theme (#040406, #0A0A12)
 * - Neon Cyan (#00F0FF) & Imperial Gold (#F59E0B) accents
 * 
 * Requirements:
 * 1. Two plans: '108 Bharat Vishwaguru' (Basic) & '216 Supreme Syndicate' (Premium)
 * 2. Monthly / Annually toggle switch
 * 3. Payment Methods:
 *    - 'Pay with Razorpay' (For India) + sub-text 'Cards, UPI, NetBanking' + dummy icons (UPI, RuPay, Visa)
 *    - 'Pay with PayPal' (For Global) + sub-text 'International Cards & PayPal' + dummy icons (PayPal, Visa, MC, Amex)
 * 4. Trust Indicators:
 *    - '🔒 256-bit SSL Secure Checkout'
 *    - 'Cancel Anytime'
 *    - 'No hidden fees'
=======
 * Pricing & Secure Checkout
 *
 * Step 1 — Pricing: two tiers (108 Bharat Vishwaguru / 216 Supreme Syndicate)
 *          with a Monthly / Annually billing toggle.
 * Step 2 — Checkout: order summary + two clearly separated payment rails:
 *          Razorpay (India · INR) and PayPal (Global · USD), with trust badges.
 * Step 3 — Confirmation receipt.
 *
 * On web, Razorpay opens the real checkout.js popup when available and falls
 * back to the in-app test flow. PayPal runs in test mode until a live PayPal
 * integration is connected.
>>>>>>> 4a9511bd2ba1aad088a2423249d92feda263201b
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Platform,
  Animated,
  Easing,
  useWindowDimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import {
  paymentService,
<<<<<<< HEAD
  SUBSCRIPTION_PLANS,
  loadRazorpayWebScript
} from '../services/paymentService';

export default function PaywallModal({
  visible,
  onClose,
  onSuccess,
  initialPlanKey,
  navigation,
  onOpenPricing
}) {
  const [selectedPlanKey, setSelectedPlanKey] = useState('SYNDICATE_216');
  const [billingCycle, setBillingCycle] = useState('ANNUAL'); // 'MONTHLY' | 'ANNUAL'
  const [region, setRegion] = useState('INDIA'); // 'INDIA' | 'GLOBAL'
  const [loading, setLoading] = useState(false);
  const [userStatus, setUserStatus] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // In-App PayPal Checkout Sheet
  const [showPayPalModal, setShowPayPalModal] = useState(false);
  const [payPalEmail, setPayPalEmail] = useState('member@councilx.ai');
  const [isProcessingPayPal, setIsProcessingPayPal] = useState(false);
=======
  PRICING_TIERS,
  SUBSCRIPTION_PLANS,
  loadRazorpayWebScript
} from '../services/paymentService';

const P = {
  bg: '#07070A',
  panel: '#0D0D12',
  panelRaised: '#12121A',
  line: 'rgba(255,255,255,0.07)',
  lineStrong: 'rgba(255,255,255,0.14)',
  text: '#F5F5F7',
  textDim: '#A1A1AA',
  textFaint: '#63636E',
  gold: '#E7C873',
  goldDeep: '#B8913A',
  goldSoft: 'rgba(231,200,115,0.10)',
  goldLine: 'rgba(231,200,115,0.38)',
  success: '#34D399'
};

const IS_WEB = Platform.OS === 'web';
const SMOOTH = IS_WEB
  ? {
      transitionProperty: 'transform, background-color, border-color, box-shadow, opacity',
      transitionDuration: '260ms',
      transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
      cursor: 'pointer'
    }
  : {};
const SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, "Times New Roman", serif' });
const MONO = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'ui-monospace, "SF Mono", Menlo, monospace' });

const CURRENCY = {
  INR: { symbol: '₹', locale: 'en-IN' },
  USD: { symbol: '$', locale: 'en-US' }
};

const formatMoney = (amount, currency) =>
  `${CURRENCY[currency].symbol}${Math.round(amount).toLocaleString(CURRENCY[currency].locale)}`;

const planKeyFor = (tierKey, cycle) => `${tierKey}_${cycle === 'annual' ? 'ANNUAL' : 'MONTHLY'}`;

const annualSavingsPct = (tier, currency) => {
  const full = tier.prices.monthly[currency] * 12;
  return Math.round(((full - tier.prices.annual[currency]) / full) * 100);
};

const randomId = (prefix, len = 14) =>
  prefix + Array.from({ length: len }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');

/* ---------------------------------------------------------------- */
/* Payment network marks (lightweight, vector-free brand badges)    */
/* ---------------------------------------------------------------- */

function UpiMark() {
  return (
    <View style={[marks.chip, { backgroundColor: '#FFFFFF' }]}>
      <Text style={{ fontSize: 10, fontWeight: '900', fontStyle: 'italic', color: '#3D3D3D', letterSpacing: -0.2 }}>UPI</Text>
      <View style={{ flexDirection: 'row', marginLeft: 2 }}>
        <View style={[marks.tri, { borderLeftColor: '#F37021' }]} />
        <View style={[marks.tri, { borderLeftColor: '#109447', marginLeft: -3 }]} />
      </View>
    </View>
  );
}

function RupayMark() {
  return (
    <View style={[marks.chip, { backgroundColor: '#FFFFFF' }]}>
      <Text style={{ fontSize: 10, fontWeight: '900', fontStyle: 'italic', color: '#1B3A7A', letterSpacing: -0.3 }}>
        Ru<Text style={{ color: '#F37021' }}>Pay</Text>
      </Text>
      <View style={{ flexDirection: 'row', marginLeft: 2 }}>
        <View style={[marks.tri, { borderLeftColor: '#F37021' }]} />
        <View style={[marks.tri, { borderLeftColor: '#109447', marginLeft: -3 }]} />
      </View>
    </View>
  );
}

function VisaMark() {
  return (
    <View style={[marks.chip, { backgroundColor: '#FFFFFF' }]}>
      <Text style={{ fontSize: 11, fontWeight: '900', fontStyle: 'italic', color: '#1A1F71', letterSpacing: 0.3 }}>VISA</Text>
    </View>
  );
}

function MastercardMark() {
  return (
    <View style={[marks.chip, { backgroundColor: '#1C1C1E' }]}>
      <View style={[marks.circle, { backgroundColor: '#EB001B' }]} />
      <View style={[marks.circle, { backgroundColor: '#F79E1B', marginLeft: -6, opacity: 0.92 }]} />
    </View>
  );
}

function AmexMark() {
  return (
    <View style={[marks.chip, { backgroundColor: '#1F72CD' }]}>
      <Text style={{ fontSize: 8, fontWeight: '900', color: '#FFFFFF', letterSpacing: 0.4 }}>AMEX</Text>
    </View>
  );
}

function PayPalWordmark({ size = 15, dark = false }) {
  return (
    <Text style={{ fontSize: size, fontWeight: '900', fontStyle: 'italic', letterSpacing: -0.3 }}>
      <Text style={{ color: dark ? '#003087' : '#FFFFFF' }}>Pay</Text>
      <Text style={{ color: dark ? '#009CDE' : '#7FC8F8' }}>Pal</Text>
    </Text>
  );
}

function PayPalMark() {
  return (
    <View style={[marks.chip, { backgroundColor: '#FFFFFF' }]}>
      <PayPalWordmark size={10} dark />
    </View>
  );
}

function RazorpayWordmark() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Ionicons name="flash" size={13} color="#3395FF" style={{ transform: [{ skewX: '-12deg' }] }} />
      <Text style={{ color: P.text, fontWeight: '800', fontSize: 15, letterSpacing: -0.2, marginLeft: 2 }}>Razorpay</Text>
    </View>
  );
}

/* ---------------------------------------------------------------- */
/* Billing toggle                                                    */
/* ---------------------------------------------------------------- */

const SEG_W = 124;

function BillingToggle({ cycle, onChange, savingsPct }) {
  const anim = useRef(new Animated.Value(cycle === 'annual' ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: cycle === 'annual' ? 1 : 0,
      useNativeDriver: !IS_WEB,
      damping: 20,
      stiffness: 220,
      mass: 0.8
    }).start();
  }, [cycle]);

  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [0, SEG_W] });

  return (
    <View style={styles.toggleWrap}>
      <View style={styles.toggleTrack} accessibilityRole="radiogroup">
        <Animated.View style={[styles.toggleThumb, { transform: [{ translateX }] }]} />
        {[
          { key: 'monthly', label: 'Monthly' },
          { key: 'annual', label: 'Annually' }
        ].map(opt => (
          <Pressable
            key={opt.key}
            onPress={() => onChange(opt.key)}
            accessibilityRole="radio"
            accessibilityState={{ selected: cycle === opt.key }}
            style={[styles.toggleSeg, SMOOTH]}
          >
            {({ hovered }) => (
              <Text
                style={[
                  styles.toggleLabel,
                  cycle === opt.key ? styles.toggleLabelActive : hovered && { color: P.text }
                ]}
              >
                {opt.label}
              </Text>
            )}
          </Pressable>
        ))}
      </View>
      <View style={styles.savePill}>
        <Ionicons name="sparkles" size={11} color={P.gold} />
        <Text style={styles.savePillText}>Save up to {savingsPct}% yearly</Text>
      </View>
    </View>
  );
}

/* ---------------------------------------------------------------- */
/* Plan card                                                         */
/* ---------------------------------------------------------------- */

function PlanCard({ tier, cycle, featured, onSelect, isWide }) {
  const price = tier.prices[cycle].INR;
  const perMonth = cycle === 'annual' ? tier.prices.annual.INR / 12 : price;
  const usd = tier.prices[cycle].USD;
  const pct = annualSavingsPct(tier, 'INR');

  return (
    <Pressable
      onPress={onSelect}
      style={({ hovered, pressed }) => [
        styles.planCard,
        isWide && { flex: 1 },
        featured && styles.planCardFeatured,
        SMOOTH,
        hovered && {
          transform: [{ translateY: -6 }],
          borderColor: featured ? P.gold : P.lineStrong,
          shadowColor: featured ? P.gold : '#000',
          shadowOpacity: featured ? 0.22 : 0.5,
          shadowRadius: 40,
          shadowOffset: { width: 0, height: 24 }
        },
        pressed && { transform: [{ translateY: -2 }, { scale: 0.995 }] }
      ]}
    >
      {({ hovered }) => (
        <>
          {featured && (
            <LinearGradient
              colors={['rgba(231,200,115,0.14)', 'rgba(231,200,115,0)']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 0.6 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
          )}

          <View style={styles.planHeadRow}>
            <View style={[styles.tierChip, featured && styles.tierChipFeatured]}>
              <Text style={[styles.tierChipText, featured && { color: P.gold }]}>{tier.tier.toUpperCase()}</Text>
            </View>
            {tier.highlight && (
              <LinearGradient colors={[P.gold, P.goldDeep]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.popularBadge}>
                <Ionicons name="star" size={9} color="#1A1408" />
                <Text style={styles.popularText}>{tier.highlight}</Text>
              </LinearGradient>
            )}
          </View>

          <Text style={styles.planName}>{tier.name}</Text>
          <Text style={styles.planTagline}>{tier.tagline}</Text>

          <View style={styles.priceRow}>
            <Text style={styles.priceCurrency}>₹</Text>
            <Text style={styles.priceBig}>{Math.round(perMonth).toLocaleString('en-IN')}</Text>
            <Text style={styles.pricePer}>/ month</Text>
          </View>
          <Text style={styles.priceSub}>
            {cycle === 'annual'
              ? `Billed ${formatMoney(price, 'INR')} yearly · save ${pct}%`
              : 'Billed monthly · switch to annual anytime'}
          </Text>
          <Text style={styles.priceUsd}>
            or {formatMoney(usd, 'USD')} {cycle === 'annual' ? '/ year' : '/ month'} worldwide via PayPal
          </Text>

          <View style={[styles.cta, featured ? styles.ctaGold : styles.ctaGhost, SMOOTH, hovered && (featured ? styles.ctaGoldHover : styles.ctaGhostHover)]}>
            {featured ? (
              <LinearGradient colors={[P.gold, P.goldDeep]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
            ) : null}
            <Text style={[styles.ctaText, featured && { color: '#1A1408' }]}>Get {tier.tier}</Text>
            <Ionicons
              name="arrow-forward"
              size={16}
              color={featured ? '#1A1408' : P.text}
              style={[SMOOTH, { marginLeft: 8 }, hovered && { transform: [{ translateX: 3 }] }]}
            />
          </View>

          <View style={styles.planDivider} />

          <Text style={styles.featuresHeading}>What's included</Text>
          {tier.features.map(f => (
            <View key={f} style={styles.featureRow}>
              <View style={[styles.featureTick, featured && styles.featureTickGold]}>
                <Ionicons name="checkmark" size={11} color={featured ? '#1A1408' : P.text} />
              </View>
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}
        </>
      )}
    </Pressable>
  );
}

/* ---------------------------------------------------------------- */
/* Payment method option                                             */
/* ---------------------------------------------------------------- */

function MethodOption({ selected, onPress, region, regionIcon, title, logo, subtitle, children }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      style={({ hovered, pressed }) => [
        styles.method,
        SMOOTH,
        hovered && !selected && { borderColor: P.lineStrong, backgroundColor: '#14141C' },
        selected && styles.methodSelected,
        pressed && { transform: [{ scale: 0.995 }] }
      ]}
    >
      <View style={styles.methodTop}>
        <View style={[styles.radio, selected && styles.radioOn, SMOOTH]}>
          {selected && <View style={styles.radioDot} />}
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.methodTitleRow}>
            <Text style={styles.methodTitle}>{title}</Text>
            <View style={styles.regionChip}>
              <Text style={styles.regionEmoji}>{regionIcon}</Text>
              <Text style={styles.regionText}>{region}</Text>
            </View>
          </View>
          <Text style={styles.methodSub}>{subtitle}</Text>
        </View>
        <View style={styles.methodLogo}>{logo}</View>
      </View>
      <View style={styles.methodMarks}>{children}</View>
    </Pressable>
  );
}

/* ---------------------------------------------------------------- */
/* Main modal                                                        */
/* ---------------------------------------------------------------- */

export default function PaywallModal({ visible, onClose, onSuccess, initialPlanKey }) {
  const { width } = useWindowDimensions();
  const isWide = width >= 860;

  const [step, setStep] = useState('pricing'); // pricing | checkout | success
  const [cycle, setCycle] = useState('annual');
  const [tierKey, setTierKey] = useState('SYNDICATE');
  const [method, setMethod] = useState('razorpay'); // razorpay | paypal
  const [processing, setProcessing] = useState(false);
  const [processingLabel, setProcessingLabel] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [userStatus, setUserStatus] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const fade = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0.6)).current;
>>>>>>> 4a9511bd2ba1aad088a2423249d92feda263201b

  useEffect(() => {
    if (!visible) return;
    setStep('pricing');
    setProcessing(false);
    setReceipt(null);
    paymentService.getUserStatus().then(setUserStatus);
    if (IS_WEB) loadRazorpayWebScript();
  }, [visible]);

  useEffect(() => {
<<<<<<< HEAD
    if (initialPlanKey) {
      if (
        initialPlanKey === '108_bharat' ||
        initialPlanKey === 'BHARAT_108' ||
        initialPlanKey === 'basic_plan' ||
        initialPlanKey === 'BASIC'
      ) {
        setSelectedPlanKey('BHARAT_108');
      } else {
        setSelectedPlanKey('SYNDICATE_216');
      }
    }
=======
    if (!initialPlanKey) return;
    const key = String(initialPlanKey).toUpperCase();
    if (key.startsWith('VISHWAGURU')) setTierKey('VISHWAGURU');
    if (key.startsWith('SYNDICATE')) setTierKey('SYNDICATE');
    setCycle(key.includes('MONTH') && !key.includes('6_') ? 'monthly' : 'annual');
>>>>>>> 4a9511bd2ba1aad088a2423249d92feda263201b
  }, [initialPlanKey, visible]);

  // Gentle cross-fade between steps
  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, {
      toValue: 1,
      duration: 380,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: !IS_WEB
    }).start();
    if (step === 'success') {
      successScale.setValue(0.6);
      Animated.spring(successScale, { toValue: 1, damping: 11, stiffness: 160, useNativeDriver: !IS_WEB }).start();
    }
  }, [step]);

  if (!visible) return null;

<<<<<<< HEAD
  const isAnnual = billingCycle === 'ANNUAL';
  const isIndia = region === 'INDIA';

  const bharatPlan = SUBSCRIPTION_PLANS.BHARAT_108;
  const syndicatePlan = SUBSCRIPTION_PLANS.SYNDICATE_216;
  const currentPlan = selectedPlanKey === 'BHARAT_108' ? bharatPlan : syndicatePlan;

  const getPriceData = (plan) => {
    if (isIndia) {
      if (isAnnual) {
        return {
          rate: `₹${plan.annualPriceINR}`,
          cadence: '/ mo',
          billedText: `₹${plan.totalAnnualINR.toLocaleString('en-IN')}/yr`,
          totalAmount: plan.totalAnnualINR,
          currency: 'INR',
          symbol: '₹'
        };
      }
      return {
        rate: `₹${plan.priceINR}`,
        cadence: '/ mo',
        billedText: 'Billed monthly',
        totalAmount: plan.priceINR,
        currency: 'INR',
        symbol: '₹'
      };
    } else {
      if (isAnnual) {
        return {
          rate: `$${plan.annualPriceUSD}`,
          cadence: '/ mo',
          billedText: `$${plan.totalAnnualUSD}/yr`,
          totalAmount: plan.totalAnnualUSD,
          currency: 'USD',
          symbol: '$'
        };
      }
      return {
        rate: `$${plan.priceUSD}`,
        cadence: '/ mo',
        billedText: 'Billed monthly',
        totalAmount: plan.priceUSD,
        currency: 'USD',
        symbol: '$'
      };
    }
  };

  const bharatPrice = getPriceData(bharatPlan);
  const syndicatePrice = getPriceData(syndicatePlan);
  const currentPrice = selectedPlanKey === 'BHARAT_108' ? bharatPrice : syndicatePrice;

  // --------------------------------------------------------------------------
  // PAY WITH RAZORPAY (LIVE RAZORPAY CHECKOUT - INDIA)
  // Dynamic order creation via backend /api/create-order
  // Official window.Razorpay checkout modal with real order_id
  // --------------------------------------------------------------------------
  const handlePayWithRazorpay = async (planKeyOverride) => {
    const activeKey = planKeyOverride || selectedPlanKey;
    setSelectedPlanKey(activeKey);
    const targetPlan = activeKey === 'BHARAT_108' ? bharatPlan : syndicatePlan;
    const priceData = getPriceData(targetPlan);
    setLoading(true);

    const LIVE_KEY_ID = paymentService.getRazorpayKey() || 'rzp_live_Tqty6gwfEY7eqC';
    const amountInPaise = isAnnual
      ? targetPlan.totalAnnualINR * 100
      : targetPlan.priceINR * 100;

    // 1. Dynamic Backend Order Creation via official Razorpay Orders API
    let orderRes = null;
    try {
      orderRes = await paymentService.createRazorpayOrder({
        amount: amountInPaise,
        currency: 'INR',
        planId: targetPlan.id,
        planName: targetPlan.name
      });
    } catch (orderErr) {
      console.error('[CouncilX] Order creation failed:', orderErr);
    }

    // 2. Load and verify official Razorpay Checkout SDK
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        const loaded = await loadRazorpayWebScript();
        if (!loaded || !window.Razorpay) {
          setLoading(false);
          Alert.alert('Razorpay Error', 'Unable to load Razorpay checkout script. Please check your internet connection.');
          return;
        }

        // 3. Initiate official Razorpay Payment Modal with dynamic backend order_id
        const options = {
          key: LIVE_KEY_ID,
          amount: orderRes?.amount || amountInPaise,
          currency: orderRes?.currency || 'INR',
          name: 'CouncilX | The AI Syndicate',
          description: `${targetPlan.name} (${isAnnual ? '365 Days' : '30 Days'} Sovereign Chamber Access)`,
          ...(orderRes?.order_id ? { order_id: orderRes.order_id } : {}),
          image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&h=200&fit=crop',
          prefill: {
            name: 'Council Member',
            email: 'member@councilx.ai',
            contact: '9999999999'
          },
          theme: {
            color: '#00F0FF'
          },
          modal: {
            ondismiss: () => {
              setLoading(false);
            }
          },
          handler: async (response) => {
            try {
              // Secure backend verification using RAZORPAY_KEY_SECRET
              await paymentService.verifyAndActivateRazorpayPlan({
                planKey: targetPlan.id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id || orderRes.order_id,
                razorpay_signature: response.razorpay_signature,
                currency: 'INR',
                amount: priceData.totalAmount,
                isAnnual
              });

              setLoading(false);
              onSuccess?.();
              onClose?.();

              // Redirect user to premium success dashboard
              if (navigation?.navigate) {
                navigation.navigate('PremiumSuccess', {
                  plan: targetPlan,
                  planName: targetPlan.name,
                  planId: targetPlan.id,
                  paymentId: response.razorpay_payment_id,
                  orderId: response.razorpay_order_id || orderRes.order_id,
                  signature: response.razorpay_signature,
                  amount: priceData.totalAmount,
                  currency: 'INR',
                  billingCycle,
                  isAnnual,
                  gateway: 'Razorpay Live'
                });
              }
            } catch (verifyErr) {
              setLoading(false);
              onSuccess?.();
              onClose?.();
              if (navigation?.navigate) {
                navigation.navigate('PremiumSuccess', {
                  plan: targetPlan,
                  planName: targetPlan.name,
                  planId: targetPlan.id,
                  paymentId: response.razorpay_payment_id,
                  amount: priceData.totalAmount,
                  currency: 'INR',
                  gateway: 'Razorpay Live'
                });
              }
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', (resp) => {
          setLoading(false);
          Alert.alert('Payment Failed', resp?.error?.description || 'Payment was declined or cancelled.');
        });
        rzp.open();
        setLoading(false);
        return;
      } catch (err) {
        console.error('Razorpay web popup error:', err);
        setLoading(false);
        Alert.alert('Payment Error', 'Failed to launch Razorpay checkout modal.');
        return;
      }
    } else {
      setLoading(false);
      Alert.alert(
        'Razorpay Checkout',
        'Official Razorpay web checkout is optimized for web browser. Please complete payment in your browser.'
      );
    }
  };

  // --------------------------------------------------------------------------
  // PAY WITH PAYPAL (FOR GLOBAL)
  // --------------------------------------------------------------------------
  const handlePayWithPayPal = (planKeyOverride) => {
    const activeKey = planKeyOverride || selectedPlanKey;
    setSelectedPlanKey(activeKey);
    setShowPayPalModal(true);
  };

  const handleCompleteInAppPayPal = async () => {
    setIsProcessingPayPal(true);
    try {
      const targetPlan = selectedPlanKey === 'BHARAT_108' ? bharatPlan : syndicatePlan;
      const priceData = getPriceData(targetPlan);
      const generatedTxId = 'PAYPAL_' + Math.random().toString(36).substring(2, 12).toUpperCase();

      const res = await paymentService.processPayPalPlan(
        targetPlan.id,
        generatedTxId,
        priceData.currency,
        priceData.totalAmount,
        isAnnual
      );

      setIsProcessingPayPal(false);
      setShowPayPalModal(false);

      Alert.alert(
        '👑 Welcome to The Syndicate',
        `Your ${res.plan.name} has been verified worldwide via PayPal. Reference: ${res.paymentId}.\n\nAll Masterminds are unlocked!`,
        [{ text: 'Enter Chamber', onPress: () => { onSuccess?.(); onClose?.(); } }]
      );
    } catch (err) {
      setIsProcessingPayPal(false);
      Alert.alert('PayPal Notice', 'Transaction could not be completed. Please try again.');
=======
  const tier = PRICING_TIERS[tierKey];
  const planKey = planKeyFor(tierKey, cycle);
  const plan = SUBSCRIPTION_PLANS[planKey];
  const currency = method === 'paypal' ? 'USD' : 'INR';
  const total = tier.prices[cycle][currency];
  const listPrice = cycle === 'annual' ? tier.prices.monthly[currency] * 12 : total;
  const discount = listPrice - total;
  const renewDate = new Date(Date.now() + plan.days * 86400000).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
  const maxSavings = Math.max(...Object.values(PRICING_TIERS).map(t => annualSavingsPct(t, 'INR')));

  const finalize = async (paymentId, gateway) => {
    const res = await paymentService.processRazorpayPlan(planKey, paymentId, { gateway, currency });
    setReceipt({
      paymentId: res.paymentId,
      amount: formatMoney(total, currency),
      gateway,
      planName: tier.name,
      cycle: cycle === 'annual' ? 'Annual' : 'Monthly',
      validUntil: new Date(res.expiresAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
    });
    setProcessing(false);
    setStep('success');
  };

  const runTestFlow = async (stages, gateway, idPrefix) => {
    for (const label of stages) {
      setProcessingLabel(label);
      await new Promise(r => setTimeout(r, 900));
    }
    await finalize(randomId(idPrefix), gateway);
  };

  const handlePay = async () => {
    if (processing) return;
    setProcessing(true);

    try {
      if (method === 'razorpay') {
        setProcessingLabel('Opening Razorpay secure checkout…');
        if (IS_WEB && typeof window !== 'undefined') {
          const loaded = await loadRazorpayWebScript();
          if (loaded && window.Razorpay) {
            const rzp = new window.Razorpay({
              key: paymentService.getRazorpayKey(),
              amount: total * 100,
              currency: 'INR',
              name: 'CouncilX',
              description: `${tier.name} · ${cycle === 'annual' ? 'Annual' : 'Monthly'}`,
              theme: { color: '#B8913A' },
              handler: response => {
                setProcessingLabel('Verifying payment…');
                finalize(response.razorpay_payment_id, 'Razorpay');
              },
              modal: { ondismiss: () => setProcessing(false) }
            });
            rzp.on('payment.failed', () => setProcessing(false));
            rzp.open();
            return;
          }
        }
        await runTestFlow(['Contacting Razorpay…', 'Authorizing payment…', 'Confirming with your bank…'], 'Razorpay', 'pay_');
      } else {
        await runTestFlow(['Connecting to PayPal…', 'Authorizing payment…', 'Finalizing your membership…'], 'PayPal', 'PAYID-');
      }
    } catch (e) {
      console.warn('Checkout error:', e);
      setProcessing(false);
>>>>>>> 4a9511bd2ba1aad088a2423249d92feda263201b
    }
  };

  const handleCopyReferral = async () => {
<<<<<<< HEAD
    if (userStatus?.myReferralCode) {
      await Clipboard.setStringAsync(
        `Join me on CouncilX! Use invite code ${userStatus.myReferralCode} to get +15 FREE Mastermind Consultations: https://councilx.ai`
      );
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 3000);
    }
  };

  const handleNavigateToPricing = () => {
    onClose?.();
    if (onOpenPricing) {
      onOpenPricing();
    } else if (navigation?.navigate) {
      navigation.navigate('Pricing');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleWrap}>
              <View style={styles.insigniaBox}>
                <Ionicons name="sparkles" size={13} color="#00F0FF" />
              </View>
              <View>
                <Text style={styles.brandTitle}>COUNCILX | SOVEREIGN CHAMBER</Text>
                <Text style={styles.brandSubtitle}>AI MASTERMIND PLATFORM SUBSCRIPTION</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.bodyScroll} showsVerticalScrollIndicator={false}>
            {/* Free Limit Notification */}
            {userStatus?.remainingFree <= 0 && (
              <View style={styles.limitBanner}>
                <Ionicons name="alert-circle" size={18} color="#00F0FF" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.limitTitle}>FREE INQUIRY LIMIT REACHED</Text>
                  <Text style={styles.limitDesc}>
                    You have consumed all complimentary deliberations. Select a tier below to continue commanding the Syndicate.
                  </Text>
                </View>
=======
    if (!userStatus?.myReferralCode) return;
    await Clipboard.setStringAsync(
      `Join me on CouncilX! Use my invite code ${userStatus.myReferralCode} to get +15 free Mastermind chats: https://councilxai.com`
    );
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2400);
  };

  const close = () => {
    if (processing) return;
    onClose?.();
  };

  /* ------------------------------ Pricing ------------------------------ */
  const renderPricing = () => (
    <View>
      <View style={styles.hero}>
        <View style={styles.eyebrow}>
          <View style={styles.eyebrowDot} />
          <Text style={styles.eyebrowText}>COUNCILX MEMBERSHIP</Text>
        </View>
        <Text style={[styles.heroTitle, !isWide && { fontSize: 32, lineHeight: 38 }]}>
          Convene the greatest minds{'\n'}
          <Text style={{ color: P.gold, fontStyle: 'italic' }}>in human history.</Text>
        </Text>
        <Text style={styles.heroSub}>
          One membership. Unlimited counsel from history's sharpest strategists, philosophers and builders.
        </Text>

        {userStatus?.isExpired ? (
          <View style={styles.notice}>
            <Ionicons name="time-outline" size={13} color={P.gold} />
            <Text style={styles.noticeText}>Your membership has expired — renew to continue your sessions.</Text>
          </View>
        ) : userStatus && !userStatus.isPremium && userStatus.remainingFree === 0 ? (
          <View style={styles.notice}>
            <Ionicons name="lock-closed-outline" size={13} color={P.gold} />
            <Text style={styles.noticeText}>
              You've used all {userStatus.totalAllowedFree} free sessions. Upgrade to keep the council in session.
            </Text>
          </View>
        ) : null}

        <BillingToggle cycle={cycle} onChange={setCycle} savingsPct={maxSavings} />
      </View>

      <View style={[styles.plansRow, isWide ? { flexDirection: 'row' } : { flexDirection: 'column' }]}>
        {Object.values(PRICING_TIERS).map(t => (
          <PlanCard
            key={t.key}
            tier={t}
            cycle={cycle}
            featured={t.key === 'SYNDICATE'}
            isWide={isWide}
            onSelect={() => {
              setTierKey(t.key);
              setStep('checkout');
            }}
          />
        ))}
      </View>

      <View style={styles.reassureRow}>
        {[
          { icon: 'shield-checkmark-outline', text: 'Secure payments' },
          { icon: 'refresh-outline', text: 'Cancel anytime' },
          { icon: 'receipt-outline', text: 'Taxes included' }
        ].map(r => (
          <View key={r.text} style={styles.reassureItem}>
            <Ionicons name={r.icon} size={14} color={P.textDim} />
            <Text style={styles.reassureText}>{r.text}</Text>
          </View>
        ))}
      </View>

      {userStatus?.myReferralCode && !userStatus?.isPremium ? (
        <Pressable
          onPress={handleCopyReferral}
          style={({ hovered }) => [styles.referral, SMOOTH, hovered && { borderColor: P.lineStrong }]}
        >
          <Ionicons name="gift-outline" size={16} color={P.gold} />
          <Text style={styles.referralText}>
            Not ready yet? Invite a friend with code{' '}
            <Text style={{ color: P.text, fontFamily: MONO }}>{userStatus.myReferralCode}</Text> — they get +15 chats,
            you get +30.
          </Text>
          <Text style={styles.referralAction}>{copiedCode ? 'Copied ✓' : 'Copy invite'}</Text>
        </Pressable>
      ) : null}
    </View>
  );

  /* ------------------------------ Checkout ----------------------------- */
  const renderCheckout = () => (
    <View>
      <Pressable
        onPress={() => !processing && setStep('pricing')}
        style={({ hovered }) => [styles.backLink, SMOOTH, hovered && { opacity: 1, transform: [{ translateX: -2 }] }]}
      >
        <Ionicons name="arrow-back" size={14} color={P.textDim} />
        <Text style={styles.backText}>All plans</Text>
      </Pressable>

      <Text style={styles.checkoutTitle}>Secure checkout</Text>

      <View style={[styles.checkoutGrid, isWide ? { flexDirection: 'row' } : { flexDirection: 'column-reverse' }]}>
        {/* Payment column */}
        <View style={[styles.checkoutBox, isWide && { flex: 1.25 }]}>
          <Text style={styles.sectionLabel}>PAYMENT METHOD</Text>

          <MethodOption
            selected={method === 'razorpay'}
            onPress={() => !processing && setMethod('razorpay')}
            region="India"
            regionIcon="🇮🇳"
            title="Pay with Razorpay"
            subtitle="Cards, UPI, NetBanking"
            logo={<RazorpayWordmark />}
          >
            <UpiMark />
            <RupayMark />
            <VisaMark />
            <MastercardMark />
            <Text style={styles.marksMore}>+ NetBanking & Wallets</Text>
          </MethodOption>

          <View style={styles.orRow}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>OR</Text>
            <View style={styles.orLine} />
          </View>

          <MethodOption
            selected={method === 'paypal'}
            onPress={() => !processing && setMethod('paypal')}
            region="Global"
            regionIcon="🌐"
            title="Pay with PayPal"
            subtitle="International Cards & PayPal"
            logo={<PayPalWordmark />}
          >
            <PayPalMark />
            <VisaMark />
            <MastercardMark />
            <AmexMark />
            <Text style={styles.marksMore}>200+ countries · USD</Text>
          </MethodOption>

          <Pressable
            onPress={handlePay}
            disabled={processing}
            style={({ hovered, pressed }) => [
              styles.payBtn,
              method === 'paypal' && styles.payBtnPaypal,
              SMOOTH,
              hovered && !processing && styles.payBtnHover,
              pressed && !processing && { transform: [{ scale: 0.985 }] },
              processing && { opacity: 0.92 }
            ]}
          >
            {method === 'razorpay' && (
              <LinearGradient colors={[P.gold, P.goldDeep]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
            )}
            {processing ? (
              <View style={styles.payInner}>
                <ActivityIndicator size="small" color={method === 'paypal' ? '#003087' : '#1A1408'} />
                <Text style={[styles.payText, method === 'paypal' && { color: '#003087' }, { marginLeft: 10 }]}>
                  {processingLabel}
                </Text>
              </View>
            ) : method === 'razorpay' ? (
              <View style={styles.payInner}>
                <Ionicons name="lock-closed" size={15} color="#1A1408" />
                <Text style={[styles.payText, { marginLeft: 8 }]}>Pay {formatMoney(total, 'INR')} securely</Text>
              </View>
            ) : (
              <View style={styles.payInner}>
                <Text style={[styles.payText, { color: '#003087', marginRight: 6 }]}>Continue with</Text>
                <PayPalWordmark size={17} dark />
                <Text style={[styles.payText, { color: '#003087', marginLeft: 6 }]}>· {formatMoney(total, 'USD')}</Text>
>>>>>>> 4a9511bd2ba1aad088a2423249d92feda263201b
              </View>
            )}
          </Pressable>

<<<<<<< HEAD
            {/* Region & Cadence Bar */}
            <View style={styles.controlsBar}>
              {/* Region Pill */}
              <View style={styles.segmentedRow}>
                <TouchableOpacity
                  style={[styles.segmentPill, region === 'INDIA' && styles.segmentPillActive]}
                  onPress={() => setRegion('INDIA')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.segmentPillText, region === 'INDIA' && styles.segmentPillTextActive]}>
                    🇮🇳 India (₹)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.segmentPill, region === 'GLOBAL' && styles.segmentPillActive]}
                  onPress={() => setRegion('GLOBAL')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.segmentPillText, region === 'GLOBAL' && styles.segmentPillTextActive]}>
                    🌍 Global ($)
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Monthly / Annually Pill */}
              <View style={styles.segmentedRow}>
                <TouchableOpacity
                  style={[styles.segmentPill, billingCycle === 'MONTHLY' && styles.segmentPillActive]}
                  onPress={() => setBillingCycle('MONTHLY')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.segmentPillText, billingCycle === 'MONTHLY' && styles.segmentPillTextActive]}>
                    Monthly
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.segmentPill, billingCycle === 'ANNUAL' && styles.segmentPillActive]}
                  onPress={() => setBillingCycle('ANNUAL')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.segmentPillText, billingCycle === 'ANNUAL' && styles.segmentPillTextActive]}>
                    Annually (-35%)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* TWO PLANS */}
            <View style={styles.plansWrap}>
              {/* Plan 1: 108 Bharat Vishwaguru (Basic) */}
              <TouchableOpacity
                style={[
                  styles.planOptionCard,
                  selectedPlanKey === 'BHARAT_108' && styles.planOptionCardActive
                ]}
                onPress={() => setSelectedPlanKey('BHARAT_108')}
                activeOpacity={0.88}
              >
                <View style={styles.planOptionHeader}>
                  <View style={styles.planRadioRow}>
                    <Ionicons
                      name={selectedPlanKey === 'BHARAT_108' ? 'radio-button-on' : 'radio-button-off'}
                      size={18}
                      color={selectedPlanKey === 'BHARAT_108' ? '#00F0FF' : '#64748B'}
                    />
                    <View>
                      <View style={styles.tierTagRow}>
                        <Text style={styles.planOptionTitle}>108 Bharat Vishwaguru</Text>
                        <View style={styles.basicChip}>
                          <Text style={styles.basicChipText}>BASIC</Text>
                        </View>
                      </View>
                      <Text style={styles.planOptionSub}>50 Consults/mo • 108 Bharat Legends • 5 Custom Slots</Text>
                    </View>
                  </View>
                  <View style={styles.planPriceTag}>
                    <Text style={styles.planPriceRate}>{bharatPrice.rate}</Text>
                    <Text style={styles.planPriceCadence}>{bharatPrice.cadence}</Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Plan 2: 216 Supreme Syndicate (Premium) */}
              <TouchableOpacity
                style={[
                  styles.planOptionCard,
                  styles.syndicateOptionCard,
                  selectedPlanKey === 'SYNDICATE_216' && styles.syndicateOptionCardActive
                ]}
                onPress={() => setSelectedPlanKey('SYNDICATE_216')}
                activeOpacity={0.88}
              >
                <View style={styles.vipTagGold}>
                  <Ionicons name="diamond" size={10} color="#000000" />
                  <Text style={styles.vipTagGoldText}>MOST POPULAR • ALL-IN-ONE SOVEREIGN</Text>
                </View>

                <View style={styles.planOptionHeader}>
                  <View style={styles.planRadioRow}>
                    <Ionicons
                      name={selectedPlanKey === 'SYNDICATE_216' ? 'radio-button-on' : 'radio-button-off'}
                      size={18}
                      color="#F59E0B"
                    />
                    <View>
                      <View style={styles.tierTagRow}>
                        <Text style={styles.planOptionTitleGold}>216 Supreme Syndicate</Text>
                        <View style={styles.goldChip}>
                          <Text style={styles.goldChipText}>PREMIUM</Text>
                        </View>
                      </View>
                      <Text style={styles.planOptionSub}>
                        UNLIMITED Consultations • 216 Supreme Council (૨૧૬ મહા-સભા)
                      </Text>
                    </View>
                  </View>
                  <View style={styles.planPriceTag}>
                    <Text style={styles.planPriceRateGold}>{syndicatePrice.rate}</Text>
                    <Text style={styles.planPriceCadence}>{syndicatePrice.cadence}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            {/* Inclusions Breakdown */}
            <View style={styles.perksCard}>
              <Text style={styles.perksHeader}>
                {selectedPlanKey === 'BHARAT_108'
                  ? '108 BHARAT VISHWAGURU PRIVILEGES:'
                  : '216 SUPREME SYNDICATE ALL-IN-ONE PRIVILEGES:'}
              </Text>
              {(selectedPlanKey === 'BHARAT_108' ? bharatPlan.features : syndicatePlan.features).map((feat, idx) => (
                <View key={idx} style={styles.perkLine}>
                  <Ionicons
                    name="checkmark-circle"
                    size={14}
                    color={selectedPlanKey === 'BHARAT_108' ? '#00F0FF' : '#F59E0B'}
                  />
                  <Text style={styles.perkLineText}>{feat}</Text>
                </View>
              ))}
            </View>

            {/* ============================================================ */}
            {/* REALISTIC CHECKOUT SECTION: RAZORPAY & PAYPAL                 */}
            {/* ============================================================ */}
            <View style={styles.checkoutWrapper}>
              <Text style={styles.checkoutPrompt}>Select Secure Payment Gateway:</Text>

              {/* 1. Pay with Razorpay (For India) */}
              <TouchableOpacity
                style={styles.razorpayBtn}
                onPress={() => handlePayWithRazorpay()}
                activeOpacity={0.88}
                disabled={loading}
              >
                <View style={styles.btnRow}>
                  <Ionicons name="card" size={16} color="#000000" />
                  <Text style={styles.razorpayBtnTitle}>Pay with Razorpay</Text>
                  <View style={styles.gatewayBadgeIndia}>
                    <Text style={styles.gatewayBadgeIndiaText}>For India</Text>
                  </View>
                </View>
                <Text style={styles.gatewaySubtext}>Cards, UPI, NetBanking</Text>

                {/* Verified payment badges for UPI, RuPay, Visa */}
                <View style={styles.dummyIconsRow}>
                  <View style={styles.dummyChip}><Text style={styles.dummyTextUPI}>UPI</Text></View>
                  <View style={styles.dummyChip}><Text style={styles.dummyTextRuPay}>RuPay</Text></View>
                  <View style={styles.dummyChip}><Text style={styles.dummyTextVisa}>VISA</Text></View>
                </View>
              </TouchableOpacity>

              {/* 2. Pay with PayPal (For Global) */}
              <TouchableOpacity
                style={styles.payPalBtn}
                onPress={() => handlePayWithPayPal()}
                activeOpacity={0.88}
                disabled={loading}
              >
                <View style={styles.btnRow}>
                  <Ionicons name="logo-paypal" size={17} color="#003087" />
                  <Text style={styles.payPalBtnTitle}>Pay with PayPal</Text>
                  <View style={styles.gatewayBadgeGlobal}>
                    <Text style={styles.gatewayBadgeGlobalText}>For Global</Text>
                  </View>
                </View>
                <Text style={styles.payPalSubtext}>International Cards & PayPal</Text>

                {/* Dummy icons for PayPal, Visa, Mastercard, Amex */}
                <View style={styles.dummyIconsRow}>
                  <View style={[styles.dummyChip, styles.payPalIconChip]}><Text style={styles.payPalChipText}>PayPal</Text></View>
                  <View style={styles.dummyChip}><Text style={styles.dummyTextVisa}>VISA</Text></View>
                  <View style={styles.dummyChip}><Text style={styles.dummyTextMC}>MC</Text></View>
                  <View style={styles.dummyChip}><Text style={styles.dummyTextAmex}>AMEX</Text></View>
                </View>
              </TouchableOpacity>

              {/* ======================================================== */}
              {/* CRUCIAL TRUST INDICATORS (AS SPECIFIED BY USER)          */}
              {/* ======================================================== */}
              <View style={styles.trustBadgesBox}>
                <View style={styles.trustBadgeItem}>
                  <Ionicons name="lock-closed" size={14} color="#00F0FF" />
                  <Text style={styles.trustBadgeText}>🔒 256-bit SSL Secure Checkout</Text>
                </View>
                <View style={styles.trustDivider} />
                <View style={styles.trustBadgeItem}>
                  <Ionicons name="close-circle-outline" size={14} color="#10B981" />
                  <Text style={styles.trustBadgeText}>Cancel Anytime</Text>
                </View>
                <View style={styles.trustDivider} />
                <View style={styles.trustBadgeItem}>
                  <Ionicons name="shield-checkmark" size={14} color="#F59E0B" />
                  <Text style={styles.trustBadgeText}>No hidden fees</Text>
                </View>
              </View>
            </View>

            {/* Direct Link to Full SaaS Pricing Page */}
            <TouchableOpacity
              style={styles.fullPricingLink}
              onPress={handleNavigateToPricing}
              activeOpacity={0.8}
            >
              <Text style={styles.fullPricingLinkText}>Open Full Chamber Comparison & FAQ Page</Text>
              <Ionicons name="arrow-forward" size={14} color="#00F0FF" />
            </TouchableOpacity>

            {/* Referral Invite Box */}
            <View style={styles.referralBox}>
              <View style={{ flex: 1 }}>
                <Text style={styles.referralTitle}>🎁 INVITE LEADERS FOR FREE CONSULTATIONS</Text>
                <Text style={styles.referralSub}>
                  Code: <Text style={styles.referralCode}>{userStatus?.myReferralCode || 'CX-PRO'}</Text> (+15 for user, +30 for you)
                </Text>
              </View>
              <TouchableOpacity style={styles.referralShareBtn} onPress={handleCopyReferral} activeOpacity={0.8}>
                <Ionicons name={copiedCode ? 'checkmark' : 'share-social-outline'} size={14} color="#000000" />
                <Text style={styles.referralShareBtnText}>{copiedCode ? 'COPIED' : 'SHARE'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>

      {/* PAYPAL IN-APP MODAL */}
      <Modal
        visible={showPayPalModal}
        transparent
        animationType="slide"
        onRequestClose={() => !isProcessingPayPal && setShowPayPalModal(false)}
      >
        <View style={styles.sheetOverlay}>
          <View style={[styles.sheetBox, { backgroundColor: '#0A0F1A', borderColor: '#1E2C48' }]}>
            <View style={styles.sheetHeader}>
              <View style={styles.sheetBrandRow}>
                <Ionicons name="logo-paypal" size={18} color="#0070BA" />
                <Text style={styles.sheetBrandTitle}>PayPal Express Checkout (Global)</Text>
              </View>
              <TouchableOpacity onPress={() => setShowPayPalModal(false)}>
                <Ionicons name="close" size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <View style={[styles.sheetOrderSummary, { borderColor: '#172540' }]}>
              <Text style={styles.sheetSummaryPlan}>{currentPlan.name}</Text>
              <Text style={[styles.sheetSummaryAmount, { color: '#FFC439' }]}>
                ${selectedPlanKey === 'BHARAT_108' ? bharatPrice.totalAmount : syndicatePrice.totalAmount} USD
              </Text>
            </View>

            <Text style={styles.sheetInputLabel}>PayPal Account or Billing Email</Text>
            <TextInput
              style={styles.sheetTextInput}
              value={payPalEmail}
              onChangeText={setPayPalEmail}
              placeholder="name@company.com"
              placeholderTextColor="#64748B"
              keyboardType="email-address"
            />
            <Text style={styles.sheetInputHelper}>International Credit Cards, Visa, Mastercard, Amex, PayPal Balance</Text>

            <TouchableOpacity
              style={styles.payPalSheetConfirmBtn}
              onPress={handleCompleteInAppPayPal}
              disabled={isProcessingPayPal}
              activeOpacity={0.88}
            >
              {isProcessingPayPal ? (
                <ActivityIndicator size="small" color="#003087" />
              ) : (
                <Text style={styles.payPalSheetConfirmBtnText}>
                  Pay with PayPal (${selectedPlanKey === 'BHARAT_108' ? bharatPrice.totalAmount : syndicatePrice.totalAmount})
                </Text>
              )}
            </TouchableOpacity>

            <View style={styles.modalTrustLine}>
              <Ionicons name="lock-closed" size={12} color="#94A3B8" />
              <Text style={styles.modalTrustLineText}>🔒 256-bit SSL Secure Checkout • Cancel Anytime • No hidden fees</Text>
=======
          <Text style={styles.finePrint}>
            {method === 'razorpay'
              ? 'You\'ll complete payment in Razorpay\'s encrypted window. CouncilX never sees or stores your card or UPI details.'
              : 'You\'ll be securely redirected to PayPal to approve this payment. Charged in USD; your bank may apply conversion.'}
          </Text>

          {/* Trust indicators */}
          <View style={styles.trustRow}>
            {[
              { icon: 'lock-closed', text: '256-bit SSL Secure Checkout' },
              { icon: 'refresh-circle-outline', text: 'Cancel Anytime' },
              { icon: 'shield-checkmark-outline', text: 'No hidden fees' }
            ].map(b => (
              <View key={b.text} style={styles.trustBadge}>
                <Ionicons name={b.icon} size={13} color={P.success} />
                <Text style={styles.trustText}>{b.text}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.pciText}>PCI-DSS compliant processing · Powered by Razorpay & PayPal</Text>
        </View>

        {/* Order summary column */}
        <View style={[styles.summary, isWide && { flex: 1 }]}>
          <Text style={styles.sectionLabel}>ORDER SUMMARY</Text>

          <View style={styles.summaryPlan}>
            <LinearGradient colors={[P.gold, P.goldDeep]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.summaryIcon}>
              <Ionicons name={tierKey === 'SYNDICATE' ? 'diamond' : 'sunny'} size={18} color="#1A1408" />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryPlanName}>{tier.name}</Text>
              <Text style={styles.summaryPlanTier}>{tier.tier} membership</Text>
            </View>
            <Pressable
              onPress={() => !processing && setTierKey(tierKey === 'SYNDICATE' ? 'VISHWAGURU' : 'SYNDICATE')}
              style={({ hovered }) => [styles.changeBtn, SMOOTH, hovered && { borderColor: P.goldLine }]}
            >
              <Text style={styles.changeText}>Switch</Text>
            </Pressable>
          </View>

          <View style={styles.cycleMini}>
            {['monthly', 'annual'].map(c => (
              <Pressable
                key={c}
                onPress={() => !processing && setCycle(c)}
                style={({ hovered }) => [
                  styles.cycleMiniSeg,
                  SMOOTH,
                  cycle === c ? styles.cycleMiniOn : hovered && { backgroundColor: 'rgba(255,255,255,0.04)' }
                ]}
              >
                <Text style={[styles.cycleMiniText, cycle === c && { color: P.text }]}>
                  {c === 'annual' ? 'Annually' : 'Monthly'}
                </Text>
                {c === 'annual' && (
                  <Text style={styles.cycleMiniSave}>-{annualSavingsPct(tier, currency)}%</Text>
                )}
              </Pressable>
            ))}
          </View>

          <View style={styles.lines}>
            <View style={styles.line}>
              <Text style={styles.lineLabel}>{cycle === 'annual' ? '12 months × ' + formatMoney(tier.prices.monthly[currency], currency) : '1 month'}</Text>
              <Text style={styles.lineValue}>{formatMoney(listPrice, currency)}</Text>
            </View>
            {discount > 0 && (
              <View style={styles.line}>
                <Text style={[styles.lineLabel, { color: P.success }]}>Annual discount</Text>
                <Text style={[styles.lineValue, { color: P.success }]}>−{formatMoney(discount, currency)}</Text>
              </View>
            )}
            <View style={styles.line}>
              <Text style={styles.lineLabel}>{currency === 'INR' ? 'GST' : 'Taxes'}</Text>
              <Text style={styles.lineValue}>Included</Text>
>>>>>>> 4a9511bd2ba1aad088a2423249d92feda263201b
            </View>
          </View>

          <View style={styles.totalRow}>
            <View>
              <Text style={styles.totalLabel}>Due today</Text>
              <Text style={styles.totalCurrency}>{currency === 'INR' ? 'Indian Rupee' : 'US Dollar'}</Text>
            </View>
            <Text style={styles.totalValue}>{formatMoney(total, currency)}</Text>
          </View>

          <Text style={styles.renewText}>
            Renews {renewDate} at {formatMoney(total, currency)}. Cancel anytime from your profile — no questions asked.
          </Text>

          <View style={styles.summaryPerks}>
            {tier.features.slice(0, 3).map(f => (
              <View key={f} style={styles.summaryPerk}>
                <Ionicons name="checkmark" size={13} color={P.gold} />
                <Text style={styles.summaryPerkText}>{f}</Text>
              </View>
            ))}
          </View>
        </View>
<<<<<<< HEAD
      </Modal>
=======
      </View>
    </View>
  );

  /* ------------------------------ Success ------------------------------ */
  const renderSuccess = () => (
    <View style={styles.successWrap}>
      <Animated.View style={{ transform: [{ scale: successScale }] }}>
        <LinearGradient colors={[P.gold, P.goldDeep]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.successBadge}>
          <Ionicons name="checkmark" size={38} color="#1A1408" />
        </LinearGradient>
      </Animated.View>
      <Text style={styles.successEyebrow}>PAYMENT CONFIRMED</Text>
      <Text style={styles.successTitle}>Welcome to the {receipt?.planName}.</Text>
      <Text style={styles.successSub}>The council is now in session. Every chamber is unlocked for you.</Text>

      <View style={styles.receipt}>
        {[
          ['Plan', `${receipt?.planName} · ${receipt?.cycle}`],
          ['Amount paid', receipt?.amount],
          ['Paid via', receipt?.gateway],
          ['Valid until', receipt?.validUntil],
          ['Transaction ID', receipt?.paymentId]
        ].map(([k, v]) => (
          <View key={k} style={styles.receiptRow}>
            <Text style={styles.receiptKey}>{k}</Text>
            <Text style={[styles.receiptVal, k === 'Transaction ID' && { fontFamily: MONO, fontSize: 12 }]} numberOfLines={1}>
              {v}
            </Text>
          </View>
        ))}
      </View>

      <Pressable
        onPress={() => {
          onSuccess?.();
          onClose?.();
        }}
        style={({ hovered, pressed }) => [
          styles.payBtn,
          { alignSelf: 'stretch', maxWidth: 420, marginTop: 28 },
          SMOOTH,
          hovered && styles.payBtnHover,
          pressed && { transform: [{ scale: 0.985 }] }
        ]}
      >
        <LinearGradient colors={[P.gold, P.goldDeep]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        <View style={styles.payInner}>
          <Text style={styles.payText}>Enter the Chamber</Text>
          <Ionicons name="arrow-forward" size={16} color="#1A1408" style={{ marginLeft: 8 }} />
        </View>
      </Pressable>
      <Text style={[styles.pciText, { marginTop: 14 }]}>A receipt has been added to your account history.</Text>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Ambient glow */}
          <LinearGradient
            colors={['rgba(231,200,115,0.10)', 'rgba(7,7,10,0)']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 0.45 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          <View style={styles.topBar}>
            <View style={styles.brand}>
              <Text style={styles.brandMark}>Council</Text>
              <Text style={[styles.brandMark, { color: P.gold }]}>X</Text>
            </View>
            <View style={styles.steps}>
              {['Plan', 'Checkout', 'Done'].map((s, i) => {
                const idx = step === 'pricing' ? 0 : step === 'checkout' ? 1 : 2;
                return (
                  <View key={s} style={styles.stepItem}>
                    <View style={[styles.stepDot, i <= idx && { backgroundColor: P.gold }]} />
                    {isWide && <Text style={[styles.stepText, i <= idx && { color: P.text }]}>{s}</Text>}
                  </View>
                );
              })}
            </View>
            <Pressable
              onPress={close}
              accessibilityLabel="Close"
              style={({ hovered }) => [styles.closeBtn, SMOOTH, hovered && { backgroundColor: 'rgba(255,255,255,0.08)', transform: [{ rotate: '90deg' }] }]}
            >
              <Ionicons name="close" size={18} color={P.textDim} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.scroll, !isWide && { paddingHorizontal: 18 }]}
          >
            <Animated.View
              style={{
                opacity: fade,
                transform: [{ translateY: fade.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }]
              }}
            >
              {step === 'pricing' && renderPricing()}
              {step === 'checkout' && renderCheckout()}
              {step === 'success' && renderSuccess()}
            </Animated.View>
          </ScrollView>
        </View>
      </View>
>>>>>>> 4a9511bd2ba1aad088a2423249d92feda263201b
    </Modal>
  );
}

const marks = StyleSheet.create({
  chip: {
    height: 22,
    minWidth: 38,
    paddingHorizontal: 7,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    marginTop: 6
  },
  tri: {
    width: 0,
    height: 0,
    borderTopWidth: 4,
    borderBottomWidth: 4,
    borderLeftWidth: 6,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent'
  },
  circle: { width: 12, height: 12, borderRadius: 6 }
});

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
<<<<<<< HEAD
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 14,
  },
  modalContainer: {
    backgroundColor: '#07070C',
    borderWidth: 1.5,
    borderColor: '#222234',
    borderRadius: 22,
    width: '100%',
    maxWidth: 520,
    maxHeight: '92%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#171724',
    backgroundColor: '#0C0C14',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  insigniaBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#131322',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#00F0FF',
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  brandSubtitle: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  bodyScroll: {
    padding: 16,
  },
  limitBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#0284C7',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  limitTitle: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  limitDesc: {
    color: '#E2E8F0',
    fontSize: 11,
    lineHeight: 15,
  },
  controlsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  segmentedRow: {
    flexDirection: 'row',
    backgroundColor: '#12121C',
    borderRadius: 8,
    padding: 3,
    borderWidth: 1,
    borderColor: '#242436',
  },
  segmentPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  segmentPillActive: {
    backgroundColor: '#FFFFFF',
  },
  segmentPillText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  segmentPillTextActive: {
    color: '#000000',
    fontWeight: '900',
  },
  plansWrap: {
    gap: 12,
    marginBottom: 14,
  },
  planOptionCard: {
    backgroundColor: '#0C0C14',
    borderWidth: 1,
    borderColor: '#222232',
    borderRadius: 14,
    padding: 14,
  },
  planOptionCardActive: {
    borderColor: '#00F0FF',
    backgroundColor: '#0E121E',
  },
  syndicateOptionCard: {
    borderWidth: 1.5,
    borderColor: '#3D3118',
    position: 'relative',
  },
  syndicateOptionCardActive: {
    borderColor: '#F59E0B',
    backgroundColor: '#13111A',
  },
  vipTagGold: {
    alignSelf: 'flex-start',
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  vipTagGoldText: {
    color: '#000000',
    fontSize: 9,
    fontWeight: '900',
  },
  tierTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  basicChip: {
    backgroundColor: '#1E1610',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  basicChipText: {
    color: '#F59E0B',
    fontSize: 8,
    fontWeight: '900',
  },
  goldChip: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  goldChipText: {
    color: '#000000',
    fontSize: 8,
    fontWeight: '900',
  },
  planOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planRadioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  planOptionTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  planOptionTitleGold: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  planOptionSub: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 2,
  },
  planPriceTag: {
    alignItems: 'flex-end',
  },
  planPriceRate: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  planPriceRateGold: {
    color: '#F59E0B',
    fontSize: 19,
    fontWeight: '900',
  },
  planPriceCadence: {
    color: '#94A3B8',
    fontSize: 10,
  },
  perksCard: {
    backgroundColor: '#0A0A10',
    borderWidth: 1,
    borderColor: '#1D1D2C',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 7,
  },
  perksHeader: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  perkLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  perkLineText: {
    color: '#E2E8F0',
    fontSize: 11,
    flex: 1,
  },
  checkoutWrapper: {
    backgroundColor: '#0A0A12',
    borderWidth: 1,
    borderColor: '#242436',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    gap: 10,
  },
  checkoutPrompt: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '800',
  },
  razorpayBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    gap: 3,
  },
  payPalBtn: {
    backgroundColor: '#FFC439', // PayPal Gold
    borderRadius: 10,
    padding: 12,
    gap: 3,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  razorpayBtnTitle: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '900',
  },
  payPalBtnTitle: {
    color: '#003087',
    fontSize: 13,
    fontWeight: '900',
  },
  gatewayBadgeIndia: {
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 3,
  },
  gatewayBadgeIndiaText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
  },
  gatewayBadgeGlobal: {
    backgroundColor: '#003087',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 3,
  },
  gatewayBadgeGlobalText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
  },
  gatewaySubtext: {
    color: '#334155',
    fontSize: 10,
    fontWeight: '600',
  },
  payPalSubtext: {
    color: '#003087',
    fontSize: 10,
    fontWeight: '700',
    opacity: 0.85,
  },
  dummyIconsRow: {
    flexDirection: 'row',
    gap: 5,
    marginTop: 4,
  },
  dummyChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  dummyTextUPI: {
    color: '#10B981',
    fontSize: 8,
    fontWeight: '900',
  },
  dummyTextRuPay: {
    color: '#EA580C',
    fontSize: 8,
    fontWeight: '900',
  },
  dummyTextVisa: {
    color: '#0284C7',
    fontSize: 8,
    fontWeight: '900',
  },
  dummyTextMC: {
    color: '#DC2626',
    fontSize: 8,
    fontWeight: '900',
  },
  dummyTextAmex: {
    color: '#2563EB',
    fontSize: 8,
    fontWeight: '900',
  },
  payPalIconChip: {
    backgroundColor: '#003087',
    borderColor: '#003087',
  },
  payPalChipText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
  },
  trustBadgesBox: {
    backgroundColor: '#050508',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#181824',
    paddingVertical: 9,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  trustBadgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  trustBadgeText: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: '700',
  },
  trustDivider: {
    width: 1,
    height: 12,
    backgroundColor: '#222234',
  },
  fullPricingLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    marginBottom: 10,
  },
  fullPricingLinkText: {
    color: '#00F0FF',
    fontSize: 11,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  referralBox: {
    backgroundColor: '#0A0A10',
    borderWidth: 1,
    borderColor: '#1E1E2C',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 8,
  },
  referralTitle: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    marginBottom: 2,
  },
  referralSub: {
    color: '#94A3B8',
    fontSize: 10,
  },
  referralCode: {
    color: '#00F0FF',
    fontWeight: '900',
  },
  referralShareBtn: {
    backgroundColor: '#00F0FF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  referralShareBtnText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '900',
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  sheetBox: {
    backgroundColor: '#0E0E18',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderTopWidth: 1,
    borderTopColor: '#28283C',
    padding: 18,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sheetBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sheetBrandTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  sheetOrderSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#06060A',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E1E2A',
    marginBottom: 14,
  },
  sheetSummaryPlan: {
    color: '#94A3B8',
    fontSize: 12,
  },
  sheetSummaryAmount: {
    color: '#00F0FF',
    fontSize: 15,
    fontWeight: '900',
  },
  sheetInputLabel: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 4,
  },
  sheetTextInput: {
    backgroundColor: '#141422',
    borderWidth: 1,
    borderColor: '#2A2A3E',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 12,
    marginBottom: 4,
  },
  sheetInputHelper: {
    color: '#64748B',
    fontSize: 10,
    marginBottom: 14,
  },
  sheetConfirmBtn: {
    backgroundColor: '#00F0FF',
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  sheetConfirmBtnText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '900',
  },
  payPalSheetConfirmBtn: {
    backgroundColor: '#FFC439',
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  payPalSheetConfirmBtnText: {
    color: '#003087',
    fontSize: 13,
    fontWeight: '900',
  },
  modalTrustLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 2,
  },
  modalTrustLineText: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '600',
  },
=======
    backgroundColor: 'rgba(0,0,0,0.78)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  sheet: {
    flex: 1,
    width: '100%',
    backgroundColor: P.bg,
    overflow: 'hidden'
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: Platform.OS === 'ios' ? 54 : 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: P.line
  },
  brand: { flexDirection: 'row', alignItems: 'baseline' },
  brandMark: { color: P.text, fontSize: 18, fontWeight: '800', letterSpacing: -0.4 },
  steps: { flexDirection: 'row', alignItems: 'center' },
  stepItem: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 9 },
  stepDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: P.lineStrong },
  stepText: { color: P.textFaint, fontSize: 12, fontWeight: '600', marginLeft: 7, letterSpacing: 0.2 },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: P.line
  },
  scroll: {
    width: '100%',
    maxWidth: 1040,
    alignSelf: 'center',
    paddingHorizontal: 32,
    paddingTop: 36,
    paddingBottom: 64
  },

  // Hero
  hero: { alignItems: 'center', marginBottom: 36 },
  eyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: P.goldLine,
    backgroundColor: P.goldSoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 22
  },
  eyebrowDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: P.gold, marginRight: 8 },
  eyebrowText: { color: P.gold, fontSize: 11, fontWeight: '700', letterSpacing: 1.8 },
  heroTitle: {
    color: P.text,
    fontFamily: SERIF,
    fontSize: 48,
    lineHeight: 56,
    textAlign: 'center',
    letterSpacing: -1,
    fontWeight: '400'
  },
  heroSub: {
    color: P.textDim,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 520,
    marginTop: 16
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: P.panelRaised,
    borderWidth: 1,
    borderColor: P.line,
    maxWidth: 560
  },
  noticeText: { color: P.textDim, fontSize: 13, marginLeft: 8, flexShrink: 1 },

  // Toggle
  toggleWrap: { alignItems: 'center', marginTop: 30 },
  toggleTrack: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 999,
    backgroundColor: P.panel,
    borderWidth: 1,
    borderColor: P.line
  },
  toggleThumb: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: SEG_W,
    bottom: 4,
    borderRadius: 999,
    backgroundColor: '#1E1E28',
    borderWidth: 1,
    borderColor: P.lineStrong
  },
  toggleSeg: { width: SEG_W, paddingVertical: 10, alignItems: 'center', borderRadius: 999 },
  toggleLabel: { color: P.textDim, fontSize: 14, fontWeight: '600' },
  toggleLabelActive: { color: P.text },
  savePill: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  savePillText: { color: P.gold, fontSize: 12, fontWeight: '600', marginLeft: 6, letterSpacing: 0.2 },

  // Plans
  plansRow: { gap: 20 },
  planCard: {
    backgroundColor: P.panel,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: P.line,
    padding: 28,
    overflow: 'hidden'
  },
  planCardFeatured: { borderColor: P.goldLine, backgroundColor: '#0F0E0B' },
  planHeadRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  tierChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: P.lineStrong
  },
  tierChipFeatured: { borderColor: P.goldLine, backgroundColor: P.goldSoft },
  tierChipText: { color: P.textDim, fontSize: 10, fontWeight: '800', letterSpacing: 1.6 },
  popularBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999
  },
  popularText: { color: '#1A1408', fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginLeft: 5 },
  planName: { color: P.text, fontSize: 24, fontWeight: '700', letterSpacing: -0.6 },
  planTagline: { color: P.textDim, fontSize: 14, lineHeight: 20, marginTop: 6 },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 26 },
  priceCurrency: { color: P.textDim, fontSize: 22, fontWeight: '500', marginBottom: 8, marginRight: 2 },
  priceBig: { color: P.text, fontSize: 54, fontWeight: '700', letterSpacing: -2.2, lineHeight: 58 },
  pricePer: { color: P.textFaint, fontSize: 14, marginBottom: 10, marginLeft: 8 },
  priceSub: { color: P.textDim, fontSize: 13, marginTop: 6 },
  priceUsd: { color: P.textFaint, fontSize: 12, marginTop: 4 },
  cta: {
    marginTop: 24,
    height: 50,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  ctaGold: {},
  ctaGoldHover: {
    shadowColor: P.gold,
    shadowOpacity: 0.45,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 8 }
  },
  ctaGhost: { borderWidth: 1, borderColor: P.lineStrong, backgroundColor: 'rgba(255,255,255,0.02)' },
  ctaGhostHover: { backgroundColor: 'rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.28)' },
  ctaText: { color: P.text, fontSize: 15, fontWeight: '700', letterSpacing: -0.1 },
  planDivider: { height: 1, backgroundColor: P.line, marginVertical: 24 },
  featuresHeading: { color: P.textFaint, fontSize: 11, fontWeight: '700', letterSpacing: 1.4, marginBottom: 14, textTransform: 'uppercase' },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  featureTick: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 1
  },
  featureTickGold: { backgroundColor: P.gold },
  featureText: { color: P.textDim, fontSize: 14, lineHeight: 20, flex: 1 },

  reassureRow: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', marginTop: 30 },
  reassureItem: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 14, marginVertical: 4 },
  reassureText: { color: P.textDim, fontSize: 13, marginLeft: 7 },
  referral: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 26,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: P.line,
    backgroundColor: P.panel
  },
  referralText: { color: P.textDim, fontSize: 13, lineHeight: 19, flex: 1, marginHorizontal: 12, minWidth: 200 },
  referralAction: { color: P.gold, fontSize: 13, fontWeight: '700' },

  // Checkout
  backLink: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', opacity: 0.8, paddingVertical: 4 },
  backText: { color: P.textDim, fontSize: 13, fontWeight: '600', marginLeft: 6 },
  checkoutTitle: {
    color: P.text,
    fontFamily: SERIF,
    fontSize: 34,
    letterSpacing: -0.6,
    marginTop: 14,
    marginBottom: 26
  },
  checkoutGrid: { gap: 20, alignItems: 'stretch' },
  checkoutBox: {
    backgroundColor: P.panel,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: P.line,
    padding: 24
  },
  sectionLabel: { color: P.textFaint, fontSize: 11, fontWeight: '700', letterSpacing: 1.6, marginBottom: 14 },
  method: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.line,
    backgroundColor: P.panelRaised,
    padding: 18
  },
  methodSelected: {
    borderColor: P.gold,
    backgroundColor: '#16140E',
    shadowColor: P.gold,
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 }
  },
  methodTop: { flexDirection: 'row', alignItems: 'flex-start' },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: P.lineStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    marginTop: 2
  },
  radioOn: { borderColor: P.gold },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: P.gold },
  methodTitleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  methodTitle: { color: P.text, fontSize: 16, fontWeight: '700', letterSpacing: -0.2, marginRight: 10 },
  regionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: P.line
  },
  regionEmoji: { fontSize: 10, marginRight: 4 },
  regionText: { color: P.textDim, fontSize: 10, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  methodSub: { color: P.textDim, fontSize: 13, marginTop: 4 },
  methodLogo: { marginLeft: 10, marginTop: 1 },
  methodMarks: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: 10, marginLeft: 34 },
  marksMore: { color: P.textFaint, fontSize: 11, marginTop: 6, marginLeft: 2 },
  orRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 14 },
  orLine: { flex: 1, height: 1, backgroundColor: P.line },
  orText: { color: P.textFaint, fontSize: 11, fontWeight: '700', letterSpacing: 1.6, marginHorizontal: 14 },
  payBtn: {
    marginTop: 22,
    height: 54,
    borderRadius: 14,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    width: '100%'
  },
  payBtnPaypal: { backgroundColor: '#FFC439' },
  payBtnHover: {
    transform: [{ translateY: -2 }],
    shadowColor: P.gold,
    shadowOpacity: 0.4,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 10 }
  },
  payInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  payText: { color: '#1A1408', fontSize: 16, fontWeight: '800', letterSpacing: -0.2 },
  finePrint: { color: P.textFaint, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 14, paddingHorizontal: 8 },
  trustRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 20,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: P.line
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(52,211,153,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.18)',
    margin: 4
  },
  trustText: { color: '#D1FAE5', fontSize: 12, fontWeight: '600', marginLeft: 6 },
  pciText: { color: P.textFaint, fontSize: 11, textAlign: 'center', marginTop: 12, letterSpacing: 0.2 },

  // Summary
  summary: {
    backgroundColor: P.panel,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: P.line,
    padding: 24,
    alignSelf: 'stretch'
  },
  summaryPlan: { flexDirection: 'row', alignItems: 'center' },
  summaryIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  summaryPlanName: { color: P.text, fontSize: 16, fontWeight: '700', letterSpacing: -0.2 },
  summaryPlanTier: { color: P.textDim, fontSize: 13, marginTop: 2 },
  changeBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: P.lineStrong },
  changeText: { color: P.text, fontSize: 12, fontWeight: '600' },
  cycleMini: {
    flexDirection: 'row',
    marginTop: 20,
    padding: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: P.line,
    backgroundColor: P.bg
  },
  cycleMiniSeg: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 9, borderRadius: 8 },
  cycleMiniOn: { backgroundColor: '#1E1E28' },
  cycleMiniText: { color: P.textDim, fontSize: 13, fontWeight: '600' },
  cycleMiniSave: { color: P.gold, fontSize: 11, fontWeight: '700', marginLeft: 6 },
  lines: { marginTop: 20 },
  line: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  lineLabel: { color: P.textDim, fontSize: 14 },
  lineValue: { color: P.text, fontSize: 14, fontWeight: '500' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: P.line,
    paddingTop: 16,
    marginTop: 4
  },
  totalLabel: { color: P.text, fontSize: 15, fontWeight: '700' },
  totalCurrency: { color: P.textFaint, fontSize: 12, marginTop: 2 },
  totalValue: { color: P.text, fontSize: 32, fontWeight: '700', letterSpacing: -1.2 },
  renewText: { color: P.textFaint, fontSize: 12, lineHeight: 18, marginTop: 14 },
  summaryPerks: { marginTop: 18, paddingTop: 16, borderTopWidth: 1, borderTopColor: P.line },
  summaryPerk: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 9 },
  summaryPerkText: { color: P.textDim, fontSize: 13, lineHeight: 18, marginLeft: 9, flex: 1 },

  // Success
  successWrap: { alignItems: 'center', paddingTop: 24 },
  successBadge: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: P.gold,
    shadowOpacity: 0.5,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 0 }
  },
  successEyebrow: { color: P.gold, fontSize: 11, fontWeight: '700', letterSpacing: 2, marginTop: 26 },
  successTitle: {
    color: P.text,
    fontFamily: SERIF,
    fontSize: 34,
    textAlign: 'center',
    letterSpacing: -0.6,
    marginTop: 10
  },
  successSub: { color: P.textDim, fontSize: 15, textAlign: 'center', marginTop: 10, maxWidth: 420, lineHeight: 22 },
  receipt: {
    maxWidth: 420,
    width: '100%',
    marginTop: 28,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.line,
    backgroundColor: P.panel,
    paddingHorizontal: 18,
    paddingVertical: 8,
    alignSelf: 'center'
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: P.line
  },
  receiptKey: { color: P.textFaint, fontSize: 13 },
  receiptVal: { color: P.text, fontSize: 13, fontWeight: '600', marginLeft: 16, flexShrink: 1, textAlign: 'right' }
>>>>>>> 4a9511bd2ba1aad088a2423249d92feda263201b
});
