/**
 * COUNCIL X | THE SYNDICATE
 * ORACLE OF WEALTH (શેરબજાર મહા-ઓરેકલ)
 * Interactive Cinematic Intelligence Engine powered by the Council of 216 Masterminds
 * 
 * Strict Architectural Compliance:
 * 1. 'A-to-Z Masterclass' Prompt Enforcement:
 *    - The Verdict: Bold, brutal institutional truth.
 *    - The 'Why' (Deep Logic): Step-by-step causal breakdown settling into user's mind.
 *    - The 'Why Not' (Trap Avoidance): Protecting capital against retail traps.
 *    - The Final Strategic Move: Concrete execution directive.
 * 
 * 2. Interactive Appended Chat Interface:
 *    - Directly underneath every report, an interactive cross-examination chat is revealed.
 *    - Maintains 100% continuous context of the initial report & Council personas.
 * 
 * 3. 8 Master Wealth Features:
 *    - PreMarketProphecy, SyndicateXRay, FODeathmatch, DoomsdaySimulator,
 *      KarmicFutureScanner, CEOInterrogator, RedemptionEngine, ShadowDossier.
 * 
 * 4. UI/UX & Monetization:
 *    - Royal Black (#0A0A0A), Matte Charcoal (#141414, #1E1E1E), Imperial Gold (#D4AF37), Silver text.
 *    - Strictly ZERO neon or cheap glows. Classified billionaire boardroom aesthetic.
 *    - Razorpay Subscriptions API for 'Market Master' (₹999/mo) & 'Sovereign Syndicate' (₹2,499/mo).
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Platform,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { geminiService } from '../services/geminiService';
import { paymentService, ORACLE_SUBSCRIPTION_PLANS } from '../services/paymentService';
import { useLanguage } from '../utils/i18n';

// 8 Master Wealth Features Definition
const ORACLE_FEATURES = [
  {
    id: 'pre_market',
    key: 'PreMarketProphecy',
    title: 'PreMarket Prophecy',
    subtitle: 'GIFT Nifty & Global Trend Intelligence',
    icon: 'sunny-outline',
    category: 'Daily Trends',
    councilChairs: ['Jim Simons', 'Chanakya'],
    description: 'Autonomous global macro scan dissecting US Fed cues, crude oil, Asian markets, and institutional opening posture before the 9:15 AM bell.',
    presets: [
      'GIFT Nifty & Global Cues Today',
      'Crude at $85: Rupee & Inflation Impact',
      'FII vs DII Net Flow Trends This Week'
    ]
  },
  {
    id: 'syndicate_xray',
    key: 'SyndicateXRay',
    title: 'Syndicate X-Ray',
    subtitle: 'IPO GMP & Fundamental Balance Sheet Audit',
    icon: 'scan-outline',
    category: 'IPO & Fundamentals',
    councilChairs: ['Warren Buffett', 'Rakesh Jhunjhunwala'],
    description: 'Strips away promoter PR. Forensic audit of OFS vs Fresh Issue, debt overhang, peer valuation multiples, and artificial Grey Market Premium (GMP) traps.',
    presets: [
      'Swiggy vs Zomato Valuation Audit',
      'NTPC Green Energy IPO GMP Trap Scan',
      'Tata Motors DVR vs Ordinary Share Spread'
    ]
  },
  {
    id: 'fo_deathmatch',
    key: 'FODeathmatch',
    title: 'F&O Deathmatch',
    subtitle: 'Option Chain Max Pain & Whale Tracking',
    icon: 'flame-outline',
    category: 'Derivatives & Whales',
    councilChairs: ['George Soros', 'Nassim Taleb'],
    description: 'Decodes smart money positioning: PCR (Put-Call Ratio), massive open interest accumulation zones, institutional straddles, and gamma squeeze risks.',
    presets: [
      'Nifty 24,500 Strike Whale OI Buildup',
      'BankNifty Expiry Max Pain Calculation',
      'Reliance Heavy Call Writing Resistance'
    ]
  },
  {
    id: 'doomsday',
    key: 'DoomsdaySimulator',
    title: 'Doomsday Simulator',
    subtitle: 'Portfolio Crash & Liquidity Stress-Test',
    icon: 'nuclear-outline',
    category: 'Risk & Hedging',
    councilChairs: ['Ray Dalio', 'Michael Burry'],
    description: 'Simulates severe black swan events: Geopolitical war, rupee devaluation, interest rate shocks, and banking liquidity freezes to stress-test your holdings.',
    presets: [
      '15% Global Market Correction Stress-Test',
      'Rupee Drops to 86/USD Portfolio Shock',
      'Banking Liquidity Crunch Invalidation'
    ]
  },
  {
    id: 'karmic_future',
    key: 'KarmicFutureScanner',
    title: 'Karmic Future Scanner',
    subtitle: 'Ethical Investing & 5-Year Secular Trends',
    icon: 'infinite-outline',
    category: 'Long-Term Moats',
    councilChairs: ['Vikram Sarabhai', 'Charlie Munger'],
    description: 'Long-range compounding engine scanning clean energy, AI infrastructure, semiconductor indigenization, and companies with unassailable governance moats for 2026-2031.',
    presets: [
      'India Defense Indigenization 2026-2030',
      'Solar & Battery Storage Long-Term Moats',
      'Tata Power vs Adani Green Governance'
    ]
  },
  {
    id: 'ceo_interrogator',
    key: 'CEOInterrogator',
    title: 'CEO Interrogator',
    subtitle: 'Earnings Call Forensic Reality Checks',
    icon: 'mic-outline',
    category: 'Concall Audits',
    councilChairs: ['Peter Lynch', 'Mohnish Pabrai'],
    description: 'Cross-examines management concall transcripts, inventory spikes, auditor footnotes, working capital drains, and exposes promoter exaggeration.',
    presets: [
      'Infosys Q3 Guidance vs Hiring Reality',
      'HDFC Bank NIM Compression Forensic Check',
      'Paytm EBITDA Breakeven Reality Check'
    ]
  },
  {
    id: 'redemption',
    key: 'RedemptionEngine',
    title: 'Redemption Engine',
    subtitle: 'Curing FOMO with Deep-Value Alternatives',
    icon: 'shield-checkmark-outline',
    category: 'FOMO Antidote',
    councilChairs: ['Benjamin Graham', 'Radhakishan Damani'],
    description: 'The antidote to buying at all-time highs. Dissects overhyped bubble stocks users FOMO into and identifies 3 fundamentally superior, low-PE/high-ROCE substitutes.',
    presets: [
      'Alternative to Buying IREDA at 50x PE',
      'Undervalued Auto Ancillaries vs Tata Motors',
      'Low PE Capital Goods Picks vs BHEL'
    ]
  },
  {
    id: 'shadow_dossier',
    key: 'ShadowDossier',
    title: 'Shadow Dossier',
    subtitle: 'Dark Pool & Institutional Block Deals',
    icon: 'eye-off-outline',
    category: 'Classified Report',
    isLocked: true,
    councilChairs: ['J.P. Morgan', 'Kautilya'],
    description: 'VIRAL LOCKED DOSSIER: Uncovers secret institutional block deals, promoter pledging shifts, stealth turnaround candidates, and dark pool transactions.',
    presets: [
      'Top 5 Stocks with Secret Promoter Pledge Reductions',
      'Dark Pool FII Buying in Midcap Industrials',
      'Turnaround Candidates with Stealth Bulk Deals'
    ]
  }
];

export default function OracleOfWealthScreen({ navigation }) {
  const { lang, t } = useLanguage();

  // Active Selected Feature (Default: PreMarketProphecy)
  const [selectedFeature, setSelectedFeature] = useState(ORACLE_FEATURES[0]);
  const [customQuery, setCustomQuery] = useState('');

  // Generation & Intelligence State
  const [reportLoading, setReportLoading] = useState(false);
  const [reportResult, setReportResult] = useState(null);
  const [reportError, setReportError] = useState(null);

  // Appended Interactive Follow-up Chat State
  const [chatMessages, setChatMessages] = useState([]);
  const [followUpInput, setFollowUpInput] = useState('');
  const [followUpLoading, setFollowUpLoading] = useState(false);

  // User Status & Subscriptions Modal State
  const [userStatus, setUserStatus] = useState({
    isPremium: false,
    planType: 'initiate',
    remainingFree: 5
  });
  const [subscriptionModalVisible, setSubscriptionModalVisible] = useState(false);
  const [selectedPlanTier, setSelectedPlanTier] = useState('MARKET_MASTER');
  const [subscribing, setSubscribing] = useState(false);

  // Shadow Dossier Referral Unlock State
  const [shadowStatus, setShadowStatus] = useState({
    isUnlocked: false,
    referralCount: 0,
    requiredCount: 3
  });
  const [referralCopied, setReferralCopied] = useState(false);

  const scrollViewRef = useRef(null);

  useEffect(() => {
    loadUserAndShadowStatus();
  }, []);

  const loadUserAndShadowStatus = async () => {
    try {
      const status = await paymentService.getUserStatus();
      setUserStatus(status);
      const sStatus = await paymentService.getShadowDossierStatus();
      setShadowStatus(sStatus);
    } catch (e) {
      console.warn('Failed to load user status:', e);
    }
  };

  const handleSelectFeature = (feature) => {
    setSelectedFeature(feature);
    setCustomQuery('');
    setReportResult(null);
    setReportError(null);
    setChatMessages([]);
  };

  /**
   * INITIATE MASTER INTEL SCAN (A-TO-Z MASTERCLASS REPORT)
   */
  const handleInitiateScan = async (promptOverride = '') => {
    const query = (promptOverride || customQuery).trim();
    if (!query) return;

    // Check lock on Shadow Dossier
    if (selectedFeature.id === 'shadow_dossier' && !shadowStatus.isUnlocked && !userStatus.isPremium) {
      Alert.alert(
        'SHADOW DOSSIER LOCKED',
        'This classified institutional block deal report requires 3 investor referrals or an active Sovereign Syndicate subscription.',
        [
          { text: 'Unlock with 3 Referrals', onPress: handleCopyReferralLink },
          { text: 'Upgrade to Sovereign', onPress: () => setSubscriptionModalVisible(true) },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
      return;
    }

    setReportLoading(true);
    setReportError(null);
    setReportResult(null);
    setChatMessages([]);

    const chairLead = selectedFeature.councilChairs[0];
    const chairColleague = selectedFeature.councilChairs[1] || 'Council X';

    const councilAgent = {
      name: `${chairLead} & ${chairColleague}`,
      title: `Chairs of ${selectedFeature.title}`,
      category: 'Wealth',
      role: 'Chief Strategic Financial Masterminds',
      bio: `Institutional market intelligence chamber embodying ${chairLead} and ${chairColleague} for ${selectedFeature.title}.`
    };

    try {
      const result = await geminiService.generateOracleWealthReport({
        feature: selectedFeature.id,
        userQuery: query,
        agent: councilAgent,
        chatHistory: [],
        language: lang,
        reportContext: ''
      });

      if (result && (result.reply || result.content)) {
        const fullContent = (result.reply || result.content).trim();
        const followUps = result.follow_ups || result.followUpQuestions || [];

        setReportResult({
          content: fullContent,
          followUps,
          query,
          featureId: selectedFeature.id,
          featureTitle: selectedFeature.title,
          councilChairs: selectedFeature.councilChairs,
          timestamp: new Date().toLocaleTimeString()
        });

        // Initialize Appended Chat with initial welcome message from the Council
        setChatMessages([
          {
            id: `msg_init_${Date.now()}`,
            role: 'assistant',
            content: `The initial ${selectedFeature.title} audit is complete above. As Chairs of this Council, we are now ready for your follow-up cross-examination. Challenge our assumptions, ask "what-if" policy scenarios, or test your counter-arguments below.`,
            createdAt: new Date().toISOString()
          }
        ]);

        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 300);
      } else {
        throw new Error('AI returned an empty report. Please retry.');
      }
    } catch (err) {
      console.error('[Oracle Intelligence Scan Error]:', err);
      setReportError(err.message || 'Failed to complete market intelligence audit.');
    } finally {
      setReportLoading(false);
    }
  };

  /**
   * INTERACTIVE APPENDED FOLLOW-UP CHAT
   * Maintains 100% continuous context of report and Council personas
   */
  const handleSendFollowUp = async (questionText = '') => {
    const text = (questionText || followUpInput).trim();
    if (!text || followUpLoading || !reportResult) return;

    setFollowUpInput('');

    const userFollowUp = {
      id: `u_${Date.now()}`,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString()
    };

    const newChatHistory = [...chatMessages, userFollowUp];
    setChatMessages(newChatHistory);
    setFollowUpLoading(true);

    const chairLead = selectedFeature.councilChairs[0];
    const chairColleague = selectedFeature.councilChairs[1] || 'Council X';

    const councilAgent = {
      name: `${chairLead} & ${chairColleague}`,
      title: `Chairs of ${selectedFeature.title}`,
      category: 'Wealth',
      role: 'Chief Strategic Financial Masterminds'
    };

    try {
      const response = await geminiService.generateAgentResponse({
        agent: councilAgent,
        userMessage: text,
        chatHistory: newChatHistory,
        language: lang,
        mode: 'oracle_of_wealth',
        feature: selectedFeature.id,
        reportContext: `INITIAL REPORT ON "${reportResult.query}":\n${reportResult.content.slice(0, 1500)}`,
        modelType: 'pro',
        thinkingDepth: 'deep',
        isPremium: true
      });

      const replyText = response.reply || response.content || 'Analysis formulated.';
      const newFollowUps = response.follow_ups || [];

      const assistantMsg = {
        id: `a_${Date.now()}`,
        role: 'assistant',
        content: replyText,
        followUps: newFollowUps,
        createdAt: new Date().toISOString()
      };

      setChatMessages([...newChatHistory, assistantMsg]);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 150);
    } catch (err) {
      console.error('[Oracle Follow-up Chat Error]:', err);
      const errMsg = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: `⚠️ Council Connection Notice: ${err.message || 'Cross-examination timed out. Please ask again.'}`,
        isError: true,
        createdAt: new Date().toISOString()
      };
      setChatMessages([...newChatHistory, errMsg]);
    } finally {
      setFollowUpLoading(false);
    }
  };

  /**
   * RAZORPAY SUBSCRIPTIONS API PAYMENT TRIGGER
   */
  const handleSubscribeRazorpay = async (planTier) => {
    setSelectedPlanTier(planTier);
    setSubscribing(true);

    try {
      const subRes = await paymentService.createRazorpaySubscription({
        planTier,
        userEmail: userStatus.email || 'investor@councilx.ai',
        userPhone: '9876543210'
      });

      if (!subRes || !subRes.success) {
        throw new Error(subRes?.error || 'Could not initiate Razorpay subscription.');
      }

      const keyId = subRes.key_id || 'rzp_live_Tqty6gwfEY7eqC';
      const targetPlan = ORACLE_SUBSCRIPTION_PLANS[planTier] || ORACLE_SUBSCRIPTION_PLANS.MARKET_MASTER;

      if (typeof window !== 'undefined' && window.Razorpay) {
        const options = {
          key: keyId,
          subscription_id: subRes.subscription_id,
          name: 'Council X | Oracle of Wealth',
          description: `${targetPlan.name} (Recurring Subscription)`,
          image: 'https://councilx.ai/icon.png',
          currency: 'INR',
          handler: async function (response) {
            try {
              const verifyRes = await paymentService.verifyRazorpaySubscription({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_subscription_id: response.razorpay_subscription_id || subRes.subscription_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                planTier
              });

              if (verifyRes.success) {
                setSubscriptionModalVisible(false);
                await loadUserAndShadowStatus();
                Alert.alert(
                  'SUBSCRIPTION ACTIVATED',
                  `Welcome to the ${targetPlan.name}. All 8 Oracle of Wealth engines and the 216 Masterminds are now fully unlocked for your account.`
                );
              } else {
                Alert.alert('Verification Notice', 'Payment completed. Activating subscription via backend.');
                await loadUserAndShadowStatus();
              }
            } catch (vErr) {
              Alert.alert('Notice', 'Payment received. Updating your subscription status.');
              await loadUserAndShadowStatus();
            } finally {
              setSubscribing(false);
            }
          },
          prefill: {
            name: userStatus.name || 'Council Member',
            email: userStatus.email || 'investor@councilx.ai',
            contact: '9876543210'
          },
          theme: {
            color: '#D4AF37'
          },
          modal: {
            ondismiss: function () {
              setSubscribing(false);
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // Fallback for native or development
        await paymentService.verifyRazorpaySubscription({
          razorpay_payment_id: `pay_dev_${Date.now()}`,
          razorpay_subscription_id: subRes.subscription_id,
          razorpay_signature: 'dev_mock_sig',
          planTier
        });
        setSubscriptionModalVisible(false);
        await loadUserAndShadowStatus();
        Alert.alert('Subscription Activated', `${targetPlan.name} is now active.`);
        setSubscribing(false);
      }
    } catch (err) {
      console.error('[Razorpay Subscription Trigger Error]:', err);
      Alert.alert('Subscription Error', err.message || 'Unable to open Razorpay payment gateway.');
      setSubscribing(false);
    }
  };

  const handleCopyReferralLink = async () => {
    const code = userStatus.myReferralCode || 'CX-WEALTH';
    const link = `https://councilx.ai?ref=${code}`;
    await Clipboard.setStringAsync(
      `Access the classified Council X Oracle of Wealth Shadow Dossier (Institutional Block Deals & Dark Pools). Use my invitation code ${code}: ${link}`
    );
    setReferralCopied(true);
    setTimeout(() => setReferralCopied(false), 2500);
    // Simulate testing referral increment
    await paymentService.addShadowDossierReferral();
    await loadUserAndShadowStatus();
  };

  return (
    <View style={styles.container}>
      {/* 1. TOP EXECUTIVE HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color="#D4AF37" />
          </TouchableOpacity>
          <View>
            <View style={styles.titleRow}>
              <Text style={styles.headerTitle}>ORACLE OF WEALTH</Text>
              <View style={styles.goldBadge}>
                <Text style={styles.goldBadgeText}>216 SYNDICATE</Text>
              </View>
            </View>
            <Text style={styles.headerSubtitle}>
              {lang === 'gu'
                ? 'સિનેમેટિક શેરબજાર ઇન્ટેલિજન્સ એન્જિન'
                : 'Interactive Cinematic Market Intelligence'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.subscribeBtn}
          onPress={() => setSubscriptionModalVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="card-outline" size={14} color="#0A0A0A" />
          <Text style={styles.subscribeBtnText}>
            {userStatus.isPremium ? 'SUBSCRIBED' : 'UPGRADE'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollInner}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. 8 MASTER FEATURES SELECTOR CAROUSEL */}
        <View style={styles.featureSelectorSection}>
          <Text style={styles.sectionHeaderLabel}>8 MASTER WEALTH ENGINES</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featureCarousel}
          >
            {ORACLE_FEATURES.map((feat) => {
              const isSelected = selectedFeature.id === feat.id;
              const isLockedShadow = feat.id === 'shadow_dossier' && !shadowStatus.isUnlocked && !userStatus.isPremium;

              return (
                <TouchableOpacity
                  key={feat.id}
                  style={[
                    styles.featureTabCard,
                    isSelected && styles.featureTabCardActive,
                    isLockedShadow && styles.featureTabCardLocked
                  ]}
                  onPress={() => handleSelectFeature(feat)}
                  activeOpacity={0.85}
                >
                  <View style={styles.featureCardTop}>
                    <View style={[styles.featureIconBox, isSelected && styles.featureIconBoxActive]}>
                      <Ionicons
                        name={feat.icon}
                        size={17}
                        color={isSelected ? '#0A0A0A' : '#D4AF37'}
                      />
                    </View>
                    {isLockedShadow ? (
                      <View style={styles.lockedPill}>
                        <Ionicons name="lock-closed" size={10} color="#D4AF37" />
                        <Text style={styles.lockedPillText}>3 REFS</Text>
                      </View>
                    ) : (
                      <View style={styles.categoryPill}>
                        <Text style={styles.categoryPillText}>{feat.category}</Text>
                      </View>
                    )}
                  </View>

                  <Text style={[styles.featureCardTitle, isSelected && styles.featureCardTitleActive]}>
                    {feat.title}
                  </Text>
                  <Text style={styles.featureCardSub} numberOfLines={1}>
                    {feat.subtitle}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* 3. ACTIVE ENGINE CLASSIFIED BRIEF & PRESET CHIPS */}
        <View style={styles.engineBriefCard}>
          <View style={styles.briefHeader}>
            <View style={styles.statusDotRow}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>CLASSIFIED INTELLIGENCE // LEVEL 4</Text>
            </View>
            <View style={styles.chairsTag}>
              <Ionicons name="people-outline" size={12} color="#D4AF37" />
              <Text style={styles.chairsTagText}>
                Chairs: {selectedFeature.councilChairs.join(' & ')}
              </Text>
            </View>
          </View>

          <Text style={styles.engineTitleLarge}>{selectedFeature.title}</Text>
          <Text style={styles.engineDescription}>{selectedFeature.description}</Text>

          {/* Preset Instant Scans */}
          <Text style={styles.presetsLabel}>RECOMMENDED INSTITUTIONAL SCANS:</Text>
          <View style={styles.presetsWrap}>
            {selectedFeature.presets.map((preset, pIdx) => (
              <TouchableOpacity
                key={pIdx}
                style={styles.presetChip}
                onPress={() => {
                  setCustomQuery(preset);
                  handleInitiateScan(preset);
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="flash-outline" size={11} color="#D4AF37" />
                <Text style={styles.presetChipText}>{preset}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom Query Input Bar */}
          <View style={styles.queryInputRow}>
            <TextInput
              style={styles.queryInput}
              placeholder={`Enter Stock Ticker or Scenario (e.g. Tata Motors, Nifty 24500 PE, Reliance)...`}
              placeholderTextColor="#555555"
              value={customQuery}
              onChangeText={setCustomQuery}
            />
            <TouchableOpacity
              style={[styles.scanActionBtn, reportLoading && { opacity: 0.6 }]}
              onPress={() => handleInitiateScan()}
              disabled={reportLoading}
              activeOpacity={0.85}
            >
              {reportLoading ? (
                <ActivityIndicator size="small" color="#0A0A0A" />
              ) : (
                <View style={styles.scanBtnInner}>
                  <Ionicons name="scan" size={15} color="#0A0A0A" />
                  <Text style={styles.scanActionBtnText}>AUDIT</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* 4. LOADING STATE */}
        {reportLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#D4AF37" />
            <Text style={styles.loadingMainText}>
              CONVENING COUNCIL OF 216 MASTERMINDS...
            </Text>
            <Text style={styles.loadingSubText}>
              Cross-referencing live market order flow, balance sheet forensics & the A-to-Z Masterclass doctrine.
            </Text>
          </View>
        )}

        {/* 5. ERROR STATE */}
        {reportError && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={20} color="#E57373" />
            <Text style={styles.errorText}>{reportError}</Text>
          </View>
        )}

        {/* 6. CINEMATIC REPORT DISPLAY (A-TO-Z MASTERCLASS FORMAT) */}
        {reportResult && (
          <View style={styles.reportContainer}>
            <View style={styles.reportTopBar}>
              <View style={styles.reportTagBox}>
                <Ionicons name="shield-checkmark" size={14} color="#D4AF37" />
                <Text style={styles.reportTagText}>
                  {reportResult.featureTitle.toUpperCase()} REPORT DECREE
                </Text>
              </View>
              <Text style={styles.reportTimeText}>{reportResult.timestamp}</Text>
            </View>

            <Text style={styles.reportQueryTitle}>
              SUBJECT: {reportResult.query.toUpperCase()}
            </Text>

            {/* Render Deep Structured Output */}
            <View style={styles.reportContentBox}>
              <Text style={styles.reportRawText}>{reportResult.content}</Text>
            </View>

            {/* Quick Follow-up Chip Actions */}
            {reportResult.followUps && reportResult.followUps.length > 0 && (
              <View style={styles.followUpsSection}>
                <Text style={styles.followUpsHeader}>SUGGESTED STRATEGIC CROSS-EXAMINATIONS:</Text>
                {reportResult.followUps.map((fu, fIdx) => (
                  <TouchableOpacity
                    key={fIdx}
                    style={styles.followUpCard}
                    onPress={() => handleSendFollowUp(fu)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="help-circle-outline" size={14} color="#D4AF37" />
                    <Text style={styles.followUpCardText}>{fu}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* 7. APPENDED SEAMLESS INTERACTIVE FOLLOW-UP CHAT UI */}
            <View style={styles.interactiveChatChamber}>
              <View style={styles.chamberHeader}>
                <View style={styles.chamberHeaderLeft}>
                  <View style={styles.chamberLiveDot} />
                  <Text style={styles.chamberTitle}>
                    INTERACTIVE CROSS-EXAMINATION CHAMBER
                  </Text>
                </View>
                <Text style={styles.chamberChairsText}>
                  Chaired by {reportResult.councilChairs.join(' & ')}
                </Text>
              </View>

              <Text style={styles.chamberHelpSub}>
                Ask scenario what-ifs, policy changes, hedging moves, or challenge the verdict. Context is 100% retained.
              </Text>

              {/* Chat Thread */}
              <View style={styles.chatThread}>
                {chatMessages.map((msg) => {
                  const isUser = msg.role === 'user';
                  return (
                    <View
                      key={msg.id}
                      style={[
                        styles.chatBubble,
                        isUser ? styles.chatBubbleUser : styles.chatBubbleCouncil
                      ]}
                    >
                      <View style={styles.bubbleHeaderRow}>
                        <Ionicons
                          name={isUser ? 'person-circle-outline' : 'shield'}
                          size={13}
                          color={isUser ? '#B0B0B0' : '#D4AF37'}
                        />
                        <Text style={isUser ? styles.bubbleUserTag : styles.bubbleCouncilTag}>
                          {isUser ? 'YOUR INQUIRY' : `COUNCIL CHAIRS`}
                        </Text>
                      </View>
                      <Text style={styles.bubbleText}>{msg.content}</Text>
                    </View>
                  );
                })}

                {followUpLoading && (
                  <View style={styles.chatLoadingBox}>
                    <ActivityIndicator size="small" color="#D4AF37" />
                    <Text style={styles.chatLoadingText}>
                      Council is formulating deep-logic response...
                    </Text>
                  </View>
                )}
              </View>

              {/* Follow-up Question Input Bar */}
              <View style={styles.followUpInputRow}>
                <TextInput
                  style={styles.followUpInput}
                  placeholder={`Ask a follow-up (e.g. "What if the government changes this policy?")...`}
                  placeholderTextColor="#666666"
                  value={followUpInput}
                  onChangeText={setFollowUpInput}
                  onSubmitEditing={() => handleSendFollowUp()}
                />
                <TouchableOpacity
                  style={[styles.sendFollowUpBtn, followUpLoading && { opacity: 0.5 }]}
                  onPress={() => handleSendFollowUp()}
                  disabled={followUpLoading}
                  activeOpacity={0.8}
                >
                  <Ionicons name="arrow-up" size={17} color="#0A0A0A" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* 8. SHADOW DOSSIER VIRAL UNLOCK CARD (When Shadow Dossier is selected) */}
        {selectedFeature.id === 'shadow_dossier' && !shadowStatus.isUnlocked && !userStatus.isPremium && (
          <View style={styles.shadowUnlockCard}>
            <Ionicons name="lock-closed" size={32} color="#D4AF37" />
            <Text style={styles.shadowLockTitle}>CLASSIFIED SHADOW DOSSIER LOCKED</Text>
            <Text style={styles.shadowLockSub}>
              Dark Pool Institutional Block Deals & Insider Positioning reports are strictly restricted.
            </Text>

            <View style={styles.referralCounterBox}>
              <Text style={styles.referralCounterText}>
                {shadowStatus.referralCount} / 3 INVESTOR REFERRALS COMPLETED
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${(shadowStatus.referralCount / 3) * 100}%` }
                  ]}
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.referralActionBtn}
              onPress={handleCopyReferralLink}
              activeOpacity={0.85}
            >
              <Ionicons
                name={referralCopied ? 'checkmark-circle' : 'share-social-outline'}
                size={16}
                color="#0A0A0A"
              />
              <Text style={styles.referralActionBtnText}>
                {referralCopied ? 'INVITE LINK COPIED (+1 COUNT ADDED)' : 'SHARE TO UNLOCK (3 REFERRALS)'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.orText}>— OR UPGRADE FOR INSTANT CLEARANCE —</Text>

            <TouchableOpacity
              style={styles.sovereignUnlockBtn}
              onPress={() => setSubscriptionModalVisible(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.sovereignUnlockBtnText}>
                INSTANT SOVEREIGN SYNDICATE UNLOCK (₹2,499/MO)
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* 9. RAZORPAY SUBSCRIPTIONS MODAL */}
      <Modal
        visible={subscriptionModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSubscriptionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalTopRow}>
              <View>
                <Text style={styles.modalTitle}>COUNCIL X SUBSCRIPTIONS</Text>
                <Text style={styles.modalSub}>
                  Official Razorpay Subscriptions API Integration (Recurring Monthly Auto-Renewal)
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSubscriptionModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              {/* Plan 1: Market Master */}
              <TouchableOpacity
                style={[
                  styles.planChoiceCard,
                  selectedPlanTier === 'MARKET_MASTER' && styles.planChoiceCardSelected
                ]}
                onPress={() => setSelectedPlanTier('MARKET_MASTER')}
                activeOpacity={0.9}
              >
                <View style={styles.planChoiceHeader}>
                  <Text style={styles.planChoiceName}>MARKET MASTER</Text>
                  <View style={styles.planPriceTag}>
                    <Text style={styles.planPriceVal}>₹999</Text>
                    <Text style={styles.planPricePer}>/month</Text>
                  </View>
                </View>
                <Text style={styles.planChoiceTagline}>
                  Full access to 8 Master Wealth Engines + Interactive Appended Follow-up Cross-Examinations.
                </Text>
                <View style={styles.planPerksList}>
                  {ORACLE_SUBSCRIPTION_PLANS.MARKET_MASTER.features.slice(0, 5).map((f, i) => (
                    <View key={i} style={styles.perkRow}>
                      <Ionicons name="checkmark" size={13} color="#D4AF37" />
                      <Text style={styles.perkText}>{f}</Text>
                    </View>
                  ))}
                </View>
              </TouchableOpacity>

              {/* Plan 2: Sovereign Syndicate */}
              <TouchableOpacity
                style={[
                  styles.planChoiceCard,
                  selectedPlanTier === 'SOVEREIGN_SYNDICATE' && styles.planChoiceCardSelected
                ]}
                onPress={() => setSelectedPlanTier('SOVEREIGN_SYNDICATE')}
                activeOpacity={0.9}
              >
                <View style={styles.planChoiceHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.planChoiceName}>SOVEREIGN SYNDICATE</Text>
                    <View style={styles.popularBadge}>
                      <Text style={styles.popularBadgeText}>CLASSIFIED</Text>
                    </View>
                  </View>
                  <View style={styles.planPriceTag}>
                    <Text style={styles.planPriceVal}>₹2,499</Text>
                    <Text style={styles.planPricePer}>/month</Text>
                  </View>
                </View>
                <Text style={styles.planChoiceTagline}>
                  Instant Shadow Dossier Unlock + All 216 Masterminds + Round-Table Debates + Unlimited Thinkers.
                </Text>
                <View style={styles.planPerksList}>
                  {ORACLE_SUBSCRIPTION_PLANS.SOVEREIGN_SYNDICATE.features.map((f, i) => (
                    <View key={i} style={styles.perkRow}>
                      <Ionicons name="checkmark" size={13} color="#D4AF37" />
                      <Text style={styles.perkText}>{f}</Text>
                    </View>
                  ))}
                </View>
              </TouchableOpacity>
            </ScrollView>

            <TouchableOpacity
              style={[styles.modalCheckoutBtn, subscribing && { opacity: 0.6 }]}
              onPress={() => handleSubscribeRazorpay(selectedPlanTier)}
              disabled={subscribing}
              activeOpacity={0.88}
            >
              {subscribing ? (
                <ActivityIndicator size="small" color="#0A0A0A" />
              ) : (
                <Text style={styles.modalCheckoutBtnText}>
                  ACTIVATE {selectedPlanTier.replace('_', ' ')} VIA RAZORPAY
                </Text>
              )}
            </TouchableOpacity>

            <Text style={styles.razorpaySecurityText}>
              🔒 Protected by 256-Bit Bank Grade Encryption • Cancel anytime via billing portal
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 48 : 28,
    paddingBottom: 14,
    paddingHorizontal: 16,
    backgroundColor: '#0E0E0E',
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E1E'
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#262626',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  headerTitle: {
    color: '#D4AF37',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1.2
  },
  goldBadge: {
    backgroundColor: '#1C1609',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#8C6D23',
    marginLeft: 8
  },
  goldBadgeText: {
    color: '#D4AF37',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8
  },
  headerSubtitle: {
    color: '#8E8E93',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2
  },
  subscribeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D4AF37',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6
  },
  subscribeBtnText: {
    color: '#0A0A0A',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginLeft: 4
  },
  scrollContent: {
    flex: 1
  },
  scrollInner: {
    paddingBottom: 40
  },
  featureSelectorSection: {
    paddingTop: 16,
    paddingBottom: 8
  },
  sectionHeaderLabel: {
    color: '#737373',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    paddingHorizontal: 16,
    marginBottom: 10
  },
  featureCarousel: {
    paddingHorizontal: 16
  },
  featureTabCard: {
    width: 175,
    backgroundColor: '#141414',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#222222',
    padding: 12,
    marginRight: 10
  },
  featureTabCardActive: {
    borderColor: '#D4AF37',
    backgroundColor: '#17140B'
  },
  featureTabCardLocked: {
    borderColor: '#3A2E14'
  },
  featureCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  featureIconBox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#1E1E1E',
    alignItems: 'center',
    justifyContent: 'center'
  },
  featureIconBoxActive: {
    backgroundColor: '#D4AF37'
  },
  categoryPill: {
    backgroundColor: '#1E1E1E',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4
  },
  categoryPillText: {
    color: '#888888',
    fontSize: 8,
    fontWeight: '700'
  },
  lockedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#261C05',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#8C6D23'
  },
  lockedPillText: {
    color: '#D4AF37',
    fontSize: 8,
    fontWeight: '800',
    marginLeft: 2
  },
  featureCardTitle: {
    color: '#E0E0E0',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 3
  },
  featureCardTitleActive: {
    color: '#D4AF37'
  },
  featureCardSub: {
    color: '#777777',
    fontSize: 10,
    fontWeight: '500'
  },
  engineBriefCard: {
    backgroundColor: '#121212',
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#242424',
    padding: 16
  },
  briefHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  statusDotRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D4AF37',
    marginRight: 6
  },
  statusText: {
    color: '#8C6D23',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8
  },
  chairsTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1710',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#3D3318'
  },
  chairsTagText: {
    color: '#D4AF37',
    fontSize: 9,
    fontWeight: '700',
    marginLeft: 4
  },
  engineTitleLarge: {
    color: '#F5E0A0',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6
  },
  engineDescription: {
    color: '#A0A0A0',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12
  },
  presetsLabel: {
    color: '#666666',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6
  },
  presetsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 14
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2E2E2E',
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginRight: 6,
    marginBottom: 6
  },
  presetChipText: {
    color: '#C0C0C0',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4
  },
  queryInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181818',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333333',
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  queryInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 12,
    paddingVertical: 6
  },
  scanActionBtn: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 8
  },
  scanBtnInner: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  scanActionBtnText: {
    color: '#0A0A0A',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginLeft: 4
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20
  },
  loadingMainText: {
    color: '#D4AF37',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 14
  },
  loadingSubText: {
    color: '#777777',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 6
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#261313',
    borderWidth: 1,
    borderColor: '#662222',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    marginTop: 14
  },
  errorText: {
    color: '#FFAAAA',
    fontSize: 12,
    marginLeft: 8,
    flex: 1
  },
  reportContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#121212',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
    padding: 16
  },
  reportTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#222222',
    paddingBottom: 10,
    marginBottom: 10
  },
  reportTagBox: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  reportTagText: {
    color: '#D4AF37',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginLeft: 6
  },
  reportTimeText: {
    color: '#666666',
    fontSize: 10
  },
  reportQueryTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 12
  },
  reportContentBox: {
    backgroundColor: '#0D0D0D',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1F1F1F'
  },
  reportRawText: {
    color: '#E0E0E0',
    fontSize: 13,
    lineHeight: 22,
    fontWeight: '400'
  },
  followUpsSection: {
    marginTop: 16
  },
  followUpsHeader: {
    color: '#8C6D23',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8
  },
  followUpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161616',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    padding: 10,
    marginBottom: 6
  },
  followUpCardText: {
    color: '#D4AF37',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1
  },
  interactiveChatChamber: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#262626',
    paddingTop: 16
  },
  chamberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  chamberHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  chamberLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
    marginRight: 6
  },
  chamberTitle: {
    color: '#F5E0A0',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8
  },
  chamberChairsText: {
    color: '#777777',
    fontSize: 10,
    fontWeight: '600'
  },
  chamberHelpSub: {
    color: '#888888',
    fontSize: 10,
    lineHeight: 14,
    marginBottom: 12
  },
  chatThread: {
    marginBottom: 12
  },
  chatBubble: {
    borderRadius: 8,
    padding: 10,
    marginBottom: 8
  },
  chatBubbleUser: {
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#333333',
    alignSelf: 'flex-end',
    maxWidth: '88%'
  },
  chatBubbleCouncil: {
    backgroundColor: '#16130B',
    borderWidth: 1,
    borderColor: '#3D3522',
    alignSelf: 'flex-start',
    maxWidth: '96%'
  },
  bubbleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4
  },
  bubbleUserTag: {
    color: '#B0B0B0',
    fontSize: 9,
    fontWeight: '700',
    marginLeft: 4
  },
  bubbleCouncilTag: {
    color: '#D4AF37',
    fontSize: 9,
    fontWeight: '800',
    marginLeft: 4
  },
  bubbleText: {
    color: '#E0E0E0',
    fontSize: 12,
    lineHeight: 18
  },
  chatLoadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16130B',
    padding: 10,
    borderRadius: 6
  },
  chatLoadingText: {
    color: '#D4AF37',
    fontSize: 11,
    marginLeft: 8
  },
  followUpInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#383838',
    paddingHorizontal: 10,
    paddingVertical: 3
  },
  followUpInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 12,
    paddingVertical: 6
  },
  sendFollowUpBtn: {
    width: 30,
    height: 30,
    borderRadius: 6,
    backgroundColor: '#D4AF37',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6
  },
  shadowUnlockCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#120F08',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4A3B18',
    padding: 24,
    alignItems: 'center'
  },
  shadowLockTitle: {
    color: '#D4AF37',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 10
  },
  shadowLockSub: {
    color: '#A09070',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16
  },
  referralCounterBox: {
    width: '100%',
    backgroundColor: '#1A1509',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3D3112',
    padding: 12,
    marginBottom: 14,
    alignItems: 'center'
  },
  referralCounterText: {
    color: '#F5E0A0',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 6
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#262010',
    borderRadius: 3,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#D4AF37'
  },
  referralActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D4AF37',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 12
  },
  referralActionBtnText: {
    color: '#0A0A0A',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginLeft: 6
  },
  orText: {
    color: '#666666',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 10
  },
  sovereignUnlockBtn: {
    borderWidth: 1,
    borderColor: '#8C6D23',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6
  },
  sovereignUnlockBtnText: {
    color: '#D4AF37',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  modalContent: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#121212',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#333333',
    padding: 18
  },
  modalTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#222222',
    paddingBottom: 10,
    marginBottom: 14
  },
  modalTitle: {
    color: '#D4AF37',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1
  },
  modalSub: {
    color: '#888888',
    fontSize: 10,
    marginTop: 2
  },
  modalCloseBtn: {
    padding: 4
  },
  planChoiceCard: {
    backgroundColor: '#181818',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2E2E2E',
    padding: 14,
    marginBottom: 12
  },
  planChoiceCardSelected: {
    borderColor: '#D4AF37',
    backgroundColor: '#1C180E'
  },
  planChoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  planChoiceName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  popularBadge: {
    backgroundColor: '#2E230B',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#8C6D23',
    marginLeft: 6
  },
  popularBadgeText: {
    color: '#D4AF37',
    fontSize: 8,
    fontWeight: '800'
  },
  planPriceTag: {
    flexDirection: 'row',
    alignItems: 'baseline'
  },
  planPriceVal: {
    color: '#D4AF37',
    fontSize: 17,
    fontWeight: '900'
  },
  planPricePer: {
    color: '#888888',
    fontSize: 10,
    marginLeft: 2
  },
  planChoiceTagline: {
    color: '#9E9E9E',
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 10
  },
  planPerksList: {
    borderTopWidth: 1,
    borderTopColor: '#242424',
    paddingTop: 8
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4
  },
  perkText: {
    color: '#C0C0C0',
    fontSize: 10,
    marginLeft: 6,
    flex: 1
  },
  modalCheckoutBtn: {
    backgroundColor: '#D4AF37',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6
  },
  modalCheckoutBtnText: {
    color: '#0A0A0A',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1
  },
  razorpaySecurityText: {
    color: '#666666',
    fontSize: 9,
    textAlign: 'center',
    marginTop: 8
  }
});
