/**
 * COUNCIL X | THE SYNDICATE
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

  useEffect(() => {
    if (!visible) return;
    setStep('pricing');
    setProcessing(false);
    setReceipt(null);
    paymentService.getUserStatus().then(setUserStatus);
    if (IS_WEB) loadRazorpayWebScript();
  }, [visible]);

  useEffect(() => {
    if (!initialPlanKey) return;
    const key = String(initialPlanKey).toUpperCase();
    if (key.startsWith('VISHWAGURU')) setTierKey('VISHWAGURU');
    if (key.startsWith('SYNDICATE')) setTierKey('SYNDICATE');
    setCycle(key.includes('MONTH') && !key.includes('6_') ? 'monthly' : 'annual');
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
    }
  };

  const handleCopyReferral = async () => {
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
              </View>
            )}
          </Pressable>

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
  overlay: {
    flex: 1,
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
});
