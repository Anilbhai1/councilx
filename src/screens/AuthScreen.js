/**
 * COUNCIL X | THE SYNDICATE
 * Hypnotic Luxury Showcase Landing & Google Authentication Screen
 * Hero: "THE WORLD'S 216 GREATEST MINDS. NOW IN YOUR PRIVATE WAR ROOM."
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import {
  supabase,
  isSupabaseConfigured,
  signInWithGoogleOAuth,
  saveLocalSession,
  safeUpsertProfile,
  COUNCILX_USER_SESSION_KEY
} from '../services/supabaseClient';
import { paymentService } from '../services/paymentService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TermsModal from '../components/TermsModal';
import InstallAppModal from '../components/InstallAppModal';
import { pwaService } from '../services/pwaService';

const BREAKTHROUGH_QUOTES = [
  {
    author: 'Chanakya (Arthashastra)',
    quote: '"Before advancing outward, secure your treasury and eradicate covert internal disloyalty."',
    era: 'Bharat Vishwaguru'
  },
  {
    author: 'Bhagwan Shri Krishna (Gita)',
    quote: '"Act with relentless, detached competence. Paralysis exists only when ego clings to outcomes."',
    era: 'Bharat Vishwaguru'
  },
  {
    author: 'Elon Musk (SpaceX & Tesla)',
    quote: '"Boil every bottleneck down to fundamental physics and reason up from first principles."',
    era: 'Modern Titan'
  },
  {
    author: 'Chhatrapati Shivaji Maharaj',
    quote: '"Strike with asymmetric speed. Turn terrain and timing into your invincible vanguard."',
    era: 'Bharat Vishwaguru'
  },
  {
    author: 'Warren Buffett (Berkshire)',
    quote: '"Rule No. 1: Never lose capital. Rule No. 2: Never forget rule No. 1. Compound durability."',
    era: 'Modern Titan'
  },
  {
    author: 'Ratan Tata (Tata Sons)',
    quote: '"I do not believe in taking right decisions. I take decisions and then make them right through trust."',
    era: 'Modern Titan'
  }
];

export default function AuthScreen({ onAuthSuccess }) {
  const [loading, setLoading] = useState(false);
  const [referralInput, setReferralInput] = useState('');
  const [showReferralInput, setShowReferralInput] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [termsVisible, setTermsVisible] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    setCanInstall(pwaService.canPromptDirectly());
    setIsInstalled(pwaService.isInstalled());
    const unsub = pwaService.subscribe((state) => {
      setCanInstall(state.canInstall);
      setIsInstalled(state.isInstalled);
    });
    return unsub;
  }, []);

  // Auto-cycle live preview quotes ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % BREAKTHROUGH_QUOTES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  // Detect incoming Google OAuth return redirect session
  useEffect(() => {
    let isSubscribed = true;

    const checkIncomingOAuthSession = async () => {
      if (!isSupabaseConfigured() || !supabase?.auth) return;

      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (session?.user && isSubscribed) {
          const user = session.user;
          const userId = user.id;
          const email = user.email || 'member@councilx.ai';
          const name = user.user_metadata?.full_name || user.user_metadata?.name || 'Council Member';
          const avatarUrl = user.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces';

          // Safe Profile Upsert into Supabase 'profiles' (silent RLS catch)
          await safeUpsertProfile({
            id: userId,
            email,
            full_name: name,
            avatar_url: avatarUrl,
            is_premium: false,
            message_count: 0,
            bonus_messages: 0,
            base_free_limit: 5,
            subscription_tier: 'initiate'
          });

          // Save valid standard user session to AsyncStorage ('COUNCILX_USER_SESSION')
          await saveLocalSession({
            user_id: userId,
            email,
            name,
            avatar_url: avatarUrl,
            provider: 'google',
            free_chats_remaining: 5,
            extra_agent_slots: 0,
            isAuthenticated: true
          });

          // Guarantee free chats quota counter is ready
          const status = await paymentService.getUserStatus();
          if (!status.isPremium && (status.remainingFree === undefined || status.remainingFree === null)) {
            await AsyncStorage.setItem('@councilx_free_chats_used', '0');
          }

          if (onAuthSuccess) {
            onAuthSuccess();
          }
        }
      } catch (e) {
        console.warn('OAuth session check notice on AuthScreen:', e?.message || e);
      }
    };

    checkIncomingOAuthSession();

    return () => {
      isSubscribed = false;
    };
  }, []);

  const handleGoogleSignIn = async () => {
    setLoading(true);

    // Apply referral code if entered
    if (referralInput.trim()) {
      try {
        await paymentService.redeemReferralCode(referralInput.trim());
      } catch (e) {
        console.warn('Referral redemption notice:', e?.message || e);
      }
    }

    try {
      // Strict Supabase Google OAuth implementation
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8081',
        },
      });

      if (error) {
        console.error('Supabase Google OAuth error:', error.message);
        Alert.alert('Authentication Error', error.message || 'Google Sign-In failed.');
        setLoading(false);
        return;
      }

      // If a redirect URL was generated in browser environment, redirect
      if (Platform.OS === 'web' && typeof window !== 'undefined' && data?.url) {
        window.location.assign(data.url);
      }
    } catch (err) {
      console.error('Google Sign-In Exception:', err?.message || err);
      Alert.alert('Sign-In Error', err?.message || 'An unexpected error occurred during Google Sign-In.');
      setLoading(false);
    }
  };



  const handleInstallAppClick = async () => {
    if (pwaService.canPromptDirectly()) {
      const res = await pwaService.promptInstall();
      if (!res.success && (res.isIOS || res.reason === 'no-prompt')) {
        setShowInstallModal(true);
      }
    } else {
      setShowInstallModal(true);
    }
  };

  const handleInstantAccess = async () => {
    setLoading(true);
    try {
      if (referralInput.trim()) {
        try {
          await paymentService.redeemReferralCode(referralInput.trim());
        } catch (e) {
          console.warn('Referral redemption notice:', e?.message || e);
        }
      }

      await saveLocalSession({
        email: 'member@councilx.ai',
        name: 'Sovereign Member',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces',
        provider: 'guest',
        free_chats_remaining: 5,
        extra_agent_slots: 0,
        isAuthenticated: true
      });

      if (onAuthSuccess) {
        onAuthSuccess();
      }
    } catch (e) {
      console.warn('Instant access notice:', e?.message || e);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyReferral = async () => {
    if (!referralInput.trim()) {
      Alert.alert('Referral Code', 'Please enter a valid code (e.g. CX-PRO).');
      return;
    }
    const res = await paymentService.redeemReferralCode(referralInput.trim());
    Alert.alert('Promotional Gift', res.message);
  };

  const currentQuote = BREAKTHROUGH_QUOTES[quoteIndex];

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Action Bar with Install App Button */}
      {!isInstalled && (
        <View style={styles.authTopBar}>
          <TouchableOpacity
            style={styles.installAppBtn}
            onPress={handleInstallAppClick}
            activeOpacity={0.8}
            accessibilityLabel="Install CouncilX App on Mobile / Desktop"
          >
            <Ionicons name="arrow-down-circle" size={14} color="#000000" />
            <Text style={styles.installAppBtnText}>Install App</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Insignia Crest */}
        <View style={styles.insigniaBox}>
          <Ionicons name="eye-outline" size={40} color="#FFFFFF" />
        </View>

        <Text style={styles.brandTitle}>COUNCIL X</Text>
        <Text style={styles.brandSubtitle}>THE 216 SUPREME SYNDICATE</Text>

        {/* Hero Section */}
        <View style={styles.heroBox}>
          <Text style={styles.heroHeadline}>
            THE WORLD'S 216 GREATEST MINDS.{"\n"}
            <Text style={styles.heroHeadlineGold}>NOW IN YOUR PRIVATE WAR ROOM.</Text>
          </Text>
          <Text style={styles.heroSubheadline}>
            What if Bhagwan Shri Krishna, Chanakya, Chhatrapati Shivaji Maharaj, Elon Musk, Ratan Tata, and Warren Buffett sat together to solve your biggest life, wealth, business, and political dilemmas?
          </Text>
        </View>

        {/* 3 High-Impact Visual Feature Cards */}
        <View style={styles.cardsContainer}>
          {/* Card 1 */}
          <View style={styles.featureCard}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconBox, { borderColor: '#333333' }]}>
                <Ionicons name="flame" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.cardTitleWrap}>
                <Text style={styles.cardTitle}>108 Bharat Vishwaguru Legends</Text>
                <Text style={styles.cardTag}>ANCIENT CIVILIZATIONAL WISDOM</Text>
              </View>
            </View>
            <Text style={styles.cardBody}>
              Direct 1-on-1 guidance from Shri Krishna (Bhagavad Gita), Chanakya (Arthashastra), Maharshi Sushruta, Chhatrapati Shivaji Maharaj & Sardar Patel.
            </Text>
          </View>

          {/* Card 2 */}
          <View style={styles.featureCard}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconBox, { borderColor: '#333333' }]}>
                <Ionicons name="globe-outline" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.cardTitleWrap}>
                <Text style={styles.cardTitle}>108 Modern Global Titans</Text>
                <Text style={[styles.cardTag, { color: '#9CA3AF' }]}>UNRELENTING 21ST-CENTURY EXECUTION</Text>
              </View>
            </View>
            <Text style={styles.cardBody}>
              Ruthless execution, wealth creation, and empire-building strategies from Mukesh Ambani, Ratan Tata, Elon Musk, Warren Buffett & Steve Jobs.
            </Text>
          </View>

          {/* Card 3 */}
          <View style={[styles.featureCard, styles.featureCardSupreme]}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconBox, { borderColor: '#555555', backgroundColor: '#1A1A1A' }]}>
                <Ionicons name="sparkles" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.cardTitleWrap}>
                <Text style={[styles.cardTitle, { color: '#FFFFFF' }]}>
                  The 216 Supreme Maha-Sabha
                </Text>
                <Text style={styles.cardTag}>ALL-IN-ONE GRAND COUNCIL</Text>
              </View>
            </View>
            <Text style={styles.cardBody}>
              Ask one dilemma and watch Ancient Indian Wisdom + Modern Global Execution unite dynamically to formulate your infallible strategic blueprint.
            </Text>
          </View>
        </View>

        {/* Live Preview Ticker / Floating Breakthrough Quotes */}
        <View style={styles.quoteTickerBox}>
          <View style={styles.tickerBadgeRow}>
            <View style={styles.livePulse} />
            <Text style={styles.tickerBadgeText}>LIVE MASTERMIND COUNSEL PREVIEW</Text>
          </View>
          <Text style={styles.quoteText}>{currentQuote.quote}</Text>
          <View style={styles.quoteFooter}>
            <Text style={styles.quoteAuthor}>— {currentQuote.author}</Text>
            <Text style={styles.quoteEraTag}>[{currentQuote.era}]</Text>
          </View>
        </View>

        {/* Prominent Gold CTA Button */}
        <TouchableOpacity
          style={[styles.primaryCtaBtn, loading && styles.btnDisabled]}
          onPress={handleGoogleSignIn}
          disabled={loading}
          activeOpacity={0.88}
        >
          {loading ? (
            <ActivityIndicator color="#000" size="small" />
          ) : (
            <>
              <Ionicons name="logo-google" size={22} color="#050505" style={{ marginRight: 10 }} />
              <View style={styles.ctaTextWrap}>
                <Text style={styles.primaryCtaText}>CONTINUE WITH GOOGLE</Text>
                <Text style={styles.primaryCtaSub}>CLAIM 5 FREE SESSIONS INSTANTLY</Text>
              </View>
              <Ionicons name="arrow-forward" size={20} color="#050505" style={{ marginLeft: 8 }} />
            </>
          )}
        </TouchableOpacity>

        {/* Instant Access Sovereign War Room / VIP Guest Access Button */}
        <TouchableOpacity
          style={[styles.instantAccessBtn, loading && styles.btnDisabled]}
          onPress={handleInstantAccess}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Ionicons name="flash" size={18} color="#00F0FF" style={{ marginRight: 8 }} />
          <View style={styles.ctaTextWrap}>
            <Text style={styles.instantAccessBtnText}>ENTER SOVEREIGN WAR ROOM (INSTANT ACCESS)</Text>
            <Text style={styles.instantAccessBtnSub}>NO LOGIN REQUIRED • 5 FREE SESSIONS READY</Text>
          </View>
          <Ionicons name="arrow-forward" size={16} color="#00F0FF" style={{ marginLeft: 8 }} />
        </TouchableOpacity>

        {/* Promotional / Referral Code Box */}
        <View style={styles.referralContainer}>
          {!showReferralInput ? (
            <TouchableOpacity
              onPress={() => setShowReferralInput(true)}
              style={styles.toggleReferralBtn}
            >
              <Ionicons name="gift-outline" size={15} color="#FFFFFF" />
              <Text style={styles.toggleReferralText}>
                Have a Referral Code? (+15 Free Chats for you, +30 for friend)
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.referralInputRow}>
              <TextInput
                style={styles.referralInput}
                placeholder="Enter Code (e.g. CX-78A9)"
                placeholderTextColor={COLORS.textMuted}
                value={referralInput}
                onChangeText={setReferralInput}
                autoCapitalize="characters"
              />
              <TouchableOpacity
                style={styles.applyCodeBtn}
                onPress={handleApplyReferral}
              >
                <Text style={styles.applyCodeText}>APPLY</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <Text style={styles.disclaimer}>
          By stepping inside, you enter the Sovereign Masterminds Council under verified terms of confidentiality and statecraft wisdom.
        </Text>

        <TouchableOpacity
          onPress={() => setTermsVisible(true)}
          style={styles.termsLinkWrap}
          activeOpacity={0.75}
        >
          <Text style={styles.termsLinkText}>
            Terms of Service & Legal Notice
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Dedicated Terms & Conditions Legal Modal */}
      <TermsModal
        visible={termsVisible}
        onClose={() => setTermsVisible(false)}
      />

      {/* PWA Install Guidance Modal */}
      <InstallAppModal
        visible={showInstallModal}
        onClose={() => setShowInstallModal(false)}
        onDirectInstall={handleInstallAppClick}
        canPromptDirectly={canInstall}
        isIOS={pwaService.isIOS()}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#050505',
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 36,
    paddingBottom: 48,
    alignItems: 'center',
  },
  insigniaBox: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 1.5,
    borderColor: '#333333',
    backgroundColor: '#121212',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.8,
    shadowRadius: 14,
    elevation: 8,
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 4,
  },
  brandSubtitle: {
    color: '#777777',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.5,
    marginTop: 3,
    marginBottom: 20,
  },
  heroBox: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 22,
  },
  heroHeadline: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 28,
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  heroHeadlineGold: {
    color: '#FFFFFF',
  },
  heroSubheadline: {
    color: '#A0A0A0',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 620,
    paddingHorizontal: 8,
  },
  cardsContainer: {
    width: '100%',
    marginVertical: 10,
    gap: 12,
  },
  featureCard: {
    backgroundColor: '#111111',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#262626',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  featureCardSupreme: {
    borderColor: '#383838',
    backgroundColor: '#161616',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#161616',
    marginRight: 12,
  },
  cardTitleWrap: {
    flex: 1,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  cardTag: {
    color: '#9CA3AF',
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: 2,
  },
  cardBody: {
    color: '#A0A0A0',
    fontSize: 12.5,
    lineHeight: 18,
  },
  quoteTickerBox: {
    width: '100%',
    backgroundColor: '#111111',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#262626',
    padding: 14,
    marginVertical: 18,
  },
  tickerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  livePulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    marginRight: 6,
  },
  tickerBadgeText: {
    color: '#9CA3AF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  quoteText: {
    color: '#EAEAEA',
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 19,
    marginBottom: 8,
  },
  quoteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quoteAuthor: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },
  quoteEraTag: {
    color: '#777777',
    fontSize: 10.5,
  },
  primaryCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginTop: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  btnDisabled: {
    opacity: 0.65,
  },
  ctaTextWrap: {
    alignItems: 'center',
  },
  primaryCtaText: {
    color: '#000000',
    fontSize: 14.5,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  primaryCtaSub: {
    color: '#333333',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 1,
  },
  referralContainer: {
    width: '100%',
    marginVertical: 14,
    alignItems: 'center',
  },
  toggleReferralBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  toggleReferralText: {
    color: '#E5E7EB',
    fontSize: 11.5,
    marginLeft: 6,
    textDecorationLine: 'underline',
  },
  referralInputRow: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    gap: 8,
  },
  referralInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#161616',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    color: '#FFFFFF',
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
  },
  applyCodeBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: 10,
    height: 44,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyCodeText: {
    color: '#000000',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 1,
  },
  disclaimer: {
    color: '#666666',
    fontSize: 10.5,
    textAlign: 'center',
    lineHeight: 15,
    maxWidth: 460,
    marginTop: 8,
  },
  termsLinkWrap: {
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 12
  },
  termsLinkText: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textDecorationLine: 'underline'
  },
  authTopBar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 4,
    zIndex: 10,
  },
  installAppBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#00F0FF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#38BDF8',
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.55,
    shadowRadius: 8,
    elevation: 5,
    ...(Platform.OS === 'web' ? { cursor: 'pointer', userSelect: 'none' } : {})
  },
  installAppBtnText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  instantAccessBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
    borderWidth: 1.5,
    borderColor: '#00F0FF',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    width: '100%',
    marginTop: 12,
    marginBottom: 4,
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
    ...(Platform.OS === 'web' ? { cursor: 'pointer', userSelect: 'none' } : {})
  },
  instantAccessBtnText: {
    color: '#00F0FF',
    fontSize: 12.5,
    fontWeight: '900',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  instantAccessBtnSub: {
    color: '#94A3B8',
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 2,
    textAlign: 'center',
  }
});
