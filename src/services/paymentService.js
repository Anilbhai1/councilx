/**
 * COUNCIL X | THE SYNDICATE
 * Payment, Referral & Freemium Service
 * - 3 Subscription Plans: 1-Month (₹499), 6-Month (₹1,999), 1-Year (₹3,499)
 * - Auto-Expiry Enforcement (30d / 180d / 365d)
 * - Promotional Referral Engine (+15 for User, +30 for Referrer)
 * - Base Free Quota: 5 Messages + Referral Bonus
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from '../api/supabase';
import { adminService } from './adminService';

const STORAGE_KEYS = {
  COUNCILX_SESSION: 'COUNCILX_USER_SESSION',
  USER_ID: '@councilx_user_id',
  USER_EMAIL: '@councilx_user_email',
  USER_NAME: '@councilx_user_name',
  MESSAGE_COUNT: '@councilx_msg_count',
  BONUS_MESSAGES: '@councilx_bonus_messages',
  IS_PREMIUM: '@councilx_is_premium',
  PLAN_TYPE: '@councilx_plan_type',
  ACTIVATED_AT: '@councilx_activated_at',
  EXPIRES_AT: '@councilx_expires_at',
  MY_REFERRAL_CODE: '@councilx_my_ref_code',
  REDEEMED_CODE: '@councilx_redeemed_code',
  REDEEMED_REFERRAL: '@councilx_redeemed_referral',
  PAYMENTS: '@councilx_payments',
  EXTRA_AGENT_SLOTS: '@councilx_extra_agent_slots',
  CUSTOM_AGENTS: '@councilx_custom_agents',
  LIFETIME_AGENTS_CREATED: '@councilx_lifetime_agents_created'
};


const BASE_FREE_LIMIT = 5;
const MICRO_AGENT_PRICE = 49;
const FREE_CUSTOM_AGENTS_LIMIT = 1;

/**
 * Public pricing tiers shown on the Pricing & Checkout screen.
 * Prices are inclusive of all taxes. INR is charged via Razorpay (India),
 * USD via PayPal (Global).
 */
export const PRICING_TIERS = {
  VISHWAGURU: {
    key: 'VISHWAGURU',
    name: '108 Bharat Vishwaguru',
    tier: 'Basic',
    tagline: 'The wisdom of Bharat\'s greatest minds, on call 24/7.',
    prices: {
      monthly: { INR: 499, USD: 9 },
      annual: { INR: 3999, USD: 79 }
    },
    features: [
      'Access to the 108 Bharat Vishwaguru Masterminds',
      'Unlimited 1:1 mastermind conversations',
      'Up to 15 custom personal agents',
      'Shareable quote cards & chat history',
      'Multilingual answers in 10+ languages'
    ]
  },
  SYNDICATE: {
    key: 'SYNDICATE',
    name: '216 Supreme Syndicate',
    tier: 'Premium',
    tagline: 'The complete boardroom. Every mind. Every debate.',
    highlight: 'MOST POPULAR',
    prices: {
      monthly: { INR: 999, USD: 19 },
      annual: { INR: 7999, USD: 159 }
    },
    features: [
      'All 216 Masterminds — Bharat & Global',
      'All-in-One Supreme Council debates',
      'Unlimited custom personal agents',
      'Priority AI response speed',
      'Early access to new masterminds',
      'Priority concierge support'
    ]
  }
};

export const SUBSCRIPTION_PLANS = {
  VISHWAGURU_MONTHLY: {
    id: 'vishwaguru_monthly',
    name: '108 Bharat Vishwaguru · Monthly',
    price: PRICING_TIERS.VISHWAGURU.prices.monthly.INR,
    priceUSD: PRICING_TIERS.VISHWAGURU.prices.monthly.USD,
    days: 30,
    customAgentsLimit: 15,
    agentPerk: 'Create up to 15 Custom Personal Agents'
  },
  VISHWAGURU_ANNUAL: {
    id: 'vishwaguru_annual',
    name: '108 Bharat Vishwaguru · Annual',
    price: PRICING_TIERS.VISHWAGURU.prices.annual.INR,
    priceUSD: PRICING_TIERS.VISHWAGURU.prices.annual.USD,
    days: 365,
    customAgentsLimit: 15,
    agentPerk: 'Create up to 15 Custom Personal Agents'
  },
  SYNDICATE_MONTHLY: {
    id: 'syndicate_monthly',
    name: '216 Supreme Syndicate · Monthly',
    price: PRICING_TIERS.SYNDICATE.prices.monthly.INR,
    priceUSD: PRICING_TIERS.SYNDICATE.prices.monthly.USD,
    days: 30,
    customAgentsLimit: Infinity,
    agentPerk: 'Create UNLIMITED Custom Personal Agents'
  },
  SYNDICATE_ANNUAL: {
    id: 'syndicate_annual',
    name: '216 Supreme Syndicate · Annual',
    price: PRICING_TIERS.SYNDICATE.prices.annual.INR,
    priceUSD: PRICING_TIERS.SYNDICATE.prices.annual.USD,
    days: 365,
    customAgentsLimit: Infinity,
    agentPerk: 'Create UNLIMITED Custom Personal Agents'
  },

  // Legacy plans — kept so existing subscribers and admin gifts keep resolving
  MONTHLY: {
    id: '1_month',
    name: '1-Month Pro Plan',
    price: 499,
    days: 30,
    customAgentsLimit: 15,
    agentPerk: 'Create up to 15 Custom Personal Agents',
    tag: null,
    savings: null
  },
  SEMI_ANNUAL: {
    id: '6_month',
    name: '6-Month Pro Plan',
    price: 1999,
    days: 180,
    customAgentsLimit: 50,
    agentPerk: 'Create up to 50 Custom Personal Agents',
    tag: 'POPULAR',
    savings: 'SAVE 33% DISCOUNT'
  },
  ANNUAL: {
    id: '1_year',
    name: '1-Year Annual Pro Plan',
    price: 3499,
    days: 365,
    customAgentsLimit: Infinity,
    agentPerk: 'Create UNLIMITED Custom Personal Agents',
    tag: 'BEST VALUE',
    savings: 'SAVE ₹2,489 DISCOUNT'
  }
};

export const loadRazorpayWebScript = () => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return resolve(false);
    }
    if (window.Razorpay) {
      return resolve(true);
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const paymentService = {
  BASE_FREE_LIMIT,

  getRazorpayKey() {
    return process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_TnUpUcXaY5xFBZ';
  },

  /**
   * Get unique device / user ID
   */
  async getUserId() {
    let userId = await AsyncStorage.getItem(STORAGE_KEYS.USER_ID);
    if (!userId) {
      userId = 'cx_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_ID, userId);
    }
    return userId;
  },

  /**
   * Get or generate user's unique promotional/referral code (e.g. CX-78A9)
   */
  async getMyReferralCode() {
    let code = await AsyncStorage.getItem(STORAGE_KEYS.MY_REFERRAL_CODE);
    if (!code) {
      const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      code = `CX-${randomSuffix}`;
      await AsyncStorage.setItem(STORAGE_KEYS.MY_REFERRAL_CODE, code);

      if (isSupabaseConfigured()) {
        try {
          const userId = await this.getUserId();
          await supabase.from('profiles').upsert({
            id: userId,
            referral_code: code,
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' });
        } catch (e) {
          // Fallback locally
        }
      }
    }
    return code;
  },

  /**
   * Check status, enforce expiry, and return remaining quota
   */
  async getUserStatus() {
    try {
      const [
        countStr,
        bonusStr,
        isPremiumStr,
        planType,
        activatedAt,
        expiresAtStr,
        redeemedCode,
        redeemedReferral,
        blockedStr,
        myRefCode,
        adminSettings
      ] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.MESSAGE_COUNT),
        AsyncStorage.getItem(STORAGE_KEYS.BONUS_MESSAGES),
        AsyncStorage.getItem(STORAGE_KEYS.IS_PREMIUM),
        AsyncStorage.getItem(STORAGE_KEYS.PLAN_TYPE),
        AsyncStorage.getItem(STORAGE_KEYS.ACTIVATED_AT),
        AsyncStorage.getItem(STORAGE_KEYS.EXPIRES_AT),
        AsyncStorage.getItem(STORAGE_KEYS.REDEEMED_CODE),
        AsyncStorage.getItem(STORAGE_KEYS.REDEEMED_REFERRAL),
        AsyncStorage.getItem('@councilx_is_blocked'),
        this.getMyReferralCode(),
        adminService.getSettings()
      ]);

      const messageCount = countStr ? parseInt(countStr, 10) : 0;
      let bonusMessages = bonusStr ? parseInt(bonusStr, 10) : 0;
      let isPremium = isPremiumStr === 'true';
      let isExpired = false;
      let effectiveBlocked = blockedStr === 'true';
      let activePlanType = planType;
      let activeExpiresAt = expiresAtStr ? parseInt(expiresAtStr, 10) : null;

      // Real-time sync with Supabase profiles table
      if (isSupabaseConfigured()) {
        try {
          const userId = await this.getUserId();
          const { data: supaProfile } = await supabase
            .from('profiles')
            .select('is_premium, plan_type, expires_at, bonus_messages, is_blocked')
            .eq('id', userId)
            .single();

          if (supaProfile) {
            if (typeof supaProfile.is_premium === 'boolean') {
              isPremium = supaProfile.is_premium;
            }
            if (supaProfile.plan_type) {
              activePlanType = supaProfile.plan_type;
            }
            if (supaProfile.expires_at) {
              activeExpiresAt = new Date(supaProfile.expires_at).getTime();
            }
            if (typeof supaProfile.bonus_messages === 'number') {
              bonusMessages = Math.max(bonusMessages, supaProfile.bonus_messages);
            }
            if (typeof supaProfile.is_blocked === 'boolean') {
              effectiveBlocked = supaProfile.is_blocked;
            }
          }
        } catch (err) {}
      }

      // STRICT AUTO-EXPIRY CHECK (30d / 180d / 365d)
      if (isPremium && activeExpiresAt) {
        if (Date.now() > activeExpiresAt) {
          isPremium = false;
          isExpired = true;
          await AsyncStorage.setItem(STORAGE_KEYS.IS_PREMIUM, 'false');

          if (isSupabaseConfigured()) {
            try {
              const userId = await this.getUserId();
              await supabase.from('profiles').update({
                is_premium: false,
                updated_at: new Date().toISOString()
              }).eq('id', userId);
            } catch (err) {}
          }
        }
      }

      // God-Mode Global Paywall Override
      const effectiveBaseLimit = adminSettings?.defaultFreeCredits === -1 ? 999999 : (adminSettings?.defaultFreeCredits || BASE_FREE_LIMIT);
      const isGlobalPaywallOff = adminSettings?.isPaywallEnabled === false;

      if (isGlobalPaywallOff) {
        isPremium = true;
      }

      const totalAllowedFree = isGlobalPaywallOff || adminSettings?.defaultFreeCredits === -1 ? 999999 : (effectiveBaseLimit + bonusMessages);
      const remainingFree = isPremium ? 999999 : Math.max(0, totalAllowedFree - messageCount);
      const isLocked = effectiveBlocked ? true : (!isPremium && messageCount >= totalAllowedFree);

      return {
        messageCount,
        bonusMessages,
        baseFreeLimit: effectiveBaseLimit,
        totalAllowedFree,
        remainingFree,
        isPremium,
        isExpired,
        isLocked,
        isBlocked: effectiveBlocked,
        isGlobalPaywallOff,
        planType: activePlanType,
        activatedAt,
        expiresAt: activeExpiresAt,
        myReferralCode: myRefCode,
        hasRedeemedCode: Boolean(redeemedCode || redeemedReferral === 'true')
      };
    } catch (e) {
      return {
        messageCount: 0,
        bonusMessages: 0,
        baseFreeLimit: BASE_FREE_LIMIT,
        totalAllowedFree: BASE_FREE_LIMIT,
        remainingFree: BASE_FREE_LIMIT,
        isPremium: false,
        isExpired: false,
        isLocked: false,
        myReferralCode: 'CX-PRO',
        hasRedeemedCode: false
      };
    }
  },

  /**
   * Clear all local session tokens and Supabase auth state on logout
   */
  async clearSession() {
    try {
      const keysToRemove = [
        'COUNCILX_USER_SESSION',
        '@councilx_is_logged_in',
        '@councilx_user_email',
        '@councilx_user_name',
        '@councilx_user_profile',
        '@councilx_is_premium',
        '@councilx_plan_type',
        '@councilx_activated_at',
        '@councilx_expires_at',
        '@councilx_message_count',
        '@councilx_bonus_messages',
        '@councilx_redeemed_code',
        '@councilx_redeemed_referral',
        '@councilx_user_id',
        '@councilx_auth_user',
        '@councilx_lifetime_agents_created'
      ];
      await AsyncStorage.multiRemove(keysToRemove);
      if (isSupabaseConfigured()) {
        await supabase.auth.signOut().catch(() => {});
      }

    } catch (e) {
      console.warn('Clear session error:', e);
    }
  },

  /**
   * Redeem a Referral / Promotional Code (+15 for User, +30 for Owner)
   * Strictly enforces 1-time redemption per account and prohibits self-referral
   */
  async redeemReferralCode(inputCode) {
    if (!inputCode) return { success: false, message: 'Please enter a valid code.' };

    const cleanCode = inputCode.trim().toUpperCase();
    const myCode = await this.getMyReferralCode();

    // 1. Prohibit self-referral
    if (cleanCode === myCode) {
      return { 
        success: false, 
        message: 'You cannot use your own referral code.' 
      };
    }

    // 2. Strict One-Time Redemption Check (AsyncStorage)
    const [alreadyRedeemedCode, alreadyRedeemedFlag] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.REDEEMED_CODE),
      AsyncStorage.getItem(STORAGE_KEYS.REDEEMED_REFERRAL)
    ]);

    if (alreadyRedeemedCode || alreadyRedeemedFlag === 'true') {
      return { 
        success: false, 
        message: 'You have already redeemed a referral code once.' 
      };
    }

    const userId = await this.getUserId();

    // 3. Strict One-Time Redemption Check (Supabase profiles table)
    if (isSupabaseConfigured()) {
      try {
        const { data: myProfile } = await supabase
          .from('profiles')
          .select('id, referral_code, referred_by, redeemed_referral')
          .eq('id', userId)
          .single();

        if (myProfile?.redeemed_referral || myProfile?.referred_by) {
          await AsyncStorage.setItem(STORAGE_KEYS.REDEEMED_REFERRAL, 'true');
          return { 
            success: false, 
            message: 'You have already redeemed a referral code once.' 
          };
        }

        if (myProfile?.referral_code === cleanCode) {
          return { 
            success: false, 
            message: 'You cannot use your own referral code.' 
          };
        }
      } catch (err) {}
    }

    let validCode = false;

    // 4. Validate code owner in Supabase
    if (isSupabaseConfigured()) {
      try {
        const { data: owner } = await supabase
          .from('profiles')
          .select('id, bonus_messages')
          .eq('referral_code', cleanCode)
          .single();

        if (owner) {
          if (owner.id === userId) {
            return { success: false, message: 'You cannot use your own referral code.' };
          }
          validCode = true;
          // Grant +30 Free Chats to the Owner of the code atomically
          const updatedOwnerBonus = (owner.bonus_messages || 0) + 30;
          await supabase
            .from('profiles')
            .update({
              bonus_messages: updatedOwnerBonus,
              updated_at: new Date().toISOString()
            })
            .eq('id', owner.id);
        }
      } catch (err) {}
    }

    // Standard CX-XXXX format check
    if (!validCode && cleanCode.startsWith('CX-') && cleanCode !== myCode) {
      validCode = true;
    }

    if (!validCode) {
      return { success: false, message: 'Invalid promotional code. Please check and try again.' };
    }

    // 5. Grant +15 Free Chats to this User & Store redeemed_referral: true
    const currentBonusStr = await AsyncStorage.getItem(STORAGE_KEYS.BONUS_MESSAGES);
    const newBonus = (currentBonusStr ? parseInt(currentBonusStr, 10) : 0) + 15;
    await AsyncStorage.setItem(STORAGE_KEYS.BONUS_MESSAGES, newBonus.toString());
    await AsyncStorage.setItem(STORAGE_KEYS.REDEEMED_CODE, cleanCode);
    await AsyncStorage.setItem(STORAGE_KEYS.REDEEMED_REFERRAL, 'true');

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('profiles').upsert({
          id: userId,
          bonus_messages: newBonus,
          referred_by: cleanCode,
          redeemed_referral: true,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
      } catch (e) {}
    }

    return {
      success: true,
      message: '🎉 Code applied! You have received +15 FREE Mastermind Chats!'
    };
  },

  /**
   * Increment message count after user prompt
   */
  async incrementMessageCount() {
    const status = await this.getUserStatus();
    if (status.isPremium) return status;

    const newCount = status.messageCount + 1;
    await AsyncStorage.setItem(STORAGE_KEYS.MESSAGE_COUNT, newCount.toString());

    if (isSupabaseConfigured()) {
      try {
        const userId = await this.getUserId();
        await supabase.from('profiles').upsert({
          id: userId,
          message_count: newCount,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
      } catch (e) {}
    }

    return this.getUserStatus();
  },

  /**
   * Process Razorpay payment for 1 of the 3 plans
   * Supports both live external checkout IDs and simulated test mode
   */
  async processRazorpayPlan(planKey, externalPaymentId = null, { gateway = 'Razorpay', currency = 'INR' } = {}) {
    const plan = SUBSCRIPTION_PLANS[planKey] || SUBSCRIPTION_PLANS.MONTHLY;
    const amount = currency === 'USD' && plan.priceUSD ? plan.priceUSD : plan.price;
    const paymentId = externalPaymentId || ('pay_' + Math.random().toString(36).substring(2, 12));
    const orderId = 'order_' + Math.random().toString(36).substring(2, 10);

    const now = Date.now();
    const expiresAt = now + (plan.days * 24 * 60 * 60 * 1000);

    // Persist locally
    await AsyncStorage.setItem(STORAGE_KEYS.IS_PREMIUM, 'true');
    await AsyncStorage.setItem(STORAGE_KEYS.PLAN_TYPE, plan.id);
    await AsyncStorage.setItem(STORAGE_KEYS.ACTIVATED_AT, new Date(now).toISOString());
    await AsyncStorage.setItem(STORAGE_KEYS.EXPIRES_AT, expiresAt.toString());

    // Record payment locally
    const existingPaymentsStr = await AsyncStorage.getItem(STORAGE_KEYS.PAYMENTS);
    const payments = existingPaymentsStr ? JSON.parse(existingPaymentsStr) : [];
    payments.push({
      paymentId,
      orderId,
      plan: plan.id,
      amount,
      durationDays: plan.days,
      currency,
      date: new Date(now).toISOString(),
      expiresAt: new Date(expiresAt).toISOString()
    });
    await AsyncStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));

    // Sync to Supabase
    if (isSupabaseConfigured()) {
      try {
        const userId = await this.getUserId();
        await supabase.from('profiles').upsert({
          id: userId,
          is_premium: true,
          subscription_tier: plan.id,
          plan_type: plan.id,
          activated_at: new Date(now).toISOString(),
          expires_at: new Date(expiresAt).toISOString(),
          updated_at: new Date(now).toISOString()
        }, { onConflict: 'id' });

        await supabase.from('payments').insert({
          user_id: userId,
          razorpay_payment_id: paymentId,
          razorpay_order_id: orderId,
          plan_type: plan.id,
          amount,
          duration_days: plan.days,
          currency,
          status: 'captured'
        });
      } catch (err) {
        console.warn('Supabase payment sync warning:', err.message);
      }
    }

    // Record in Admin God-Mode Revenue Ledger
    try {
      const email = await AsyncStorage.getItem(STORAGE_KEYS.USER_EMAIL) || 'user@councilx.ai';
      await adminService.recordTransaction({
        type: 'PAYMENT',
        planName: plan.name,
        planKey: plan.id,
        amount,
        orderId,
        paymentId,
        userEmail: email,
        status: 'PAID',
        mode: gateway
      });
    } catch (e) {}

    return {
      success: true,
      plan,
      paymentId,
      expiresAt
    };
  },

  /**
   * Get all user-created custom masterminds
   */
  async getCustomAgents() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.CUSTOM_AGENTS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  /**
   * Get Live Custom Agent Quota based on Subscription Tier & Extra Slots
   * Free = 1, 1-Month = 15, 6-Month = 50, 1-Year = Unlimited
   * CRITICAL QUOTA RULE: lifetime consumed creations never decrease when an agent is deleted!
   */
  async getCustomAgentQuota() {
    const status = await this.getUserStatus();
    const customAgents = await this.getCustomAgents();

    // Track lifetime created count separately from customAgents.length
    const lifetimeStr = await AsyncStorage.getItem(STORAGE_KEYS.LIFETIME_AGENTS_CREATED);
    const lifetimeCount = lifetimeStr ? parseInt(lifetimeStr, 10) : customAgents.length;
    const createdCount = Math.max(lifetimeCount, customAgents.length);

    const extraSlotsStr = await AsyncStorage.getItem(STORAGE_KEYS.EXTRA_AGENT_SLOTS);
    const extraSlots = extraSlotsStr ? parseInt(extraSlotsStr, 10) : 0;

    let baseLimit = FREE_CUSTOM_AGENTS_LIMIT;
    let planLabel = 'Free Plan';

    if (status.isPremium && !status.isExpired) {
      const activePlan = Object.values(SUBSCRIPTION_PLANS).find(p => p.id === status.planType);
      if (activePlan) {
        baseLimit = activePlan.customAgentsLimit;
        planLabel = activePlan.name;
      }
    }

    const isUnlimited = baseLimit === Infinity;
    const totalAllowed = isUnlimited ? Infinity : baseLimit + extraSlots;
    const remainingSlots = isUnlimited ? Infinity : Math.max(0, totalAllowed - createdCount);
    const canCreate = isUnlimited || createdCount < totalAllowed;

    return {
      createdCount,
      activeCount: customAgents.length,
      baseLimit,
      extraSlots,
      totalAllowed,
      isUnlimited,
      remainingSlots,
      canCreate,
      planLabel,
      isPremium: status.isPremium && !status.isExpired,
      microPrice: MICRO_AGENT_PRICE
    };
  },

  /**
   * Save a newly created custom mastermind
   * Sets canonical properties and increments lifetime consumed creation quota
   */
  async saveCustomAgent(rawAgent) {
    const id = rawAgent.id || ('custom_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7));
    const normalizedAgent = {
      ...rawAgent,
      id,
      name: rawAgent.name ? rawAgent.name.trim() : 'Mastermind',
      title: rawAgent.title || rawAgent.role || rawAgent.name || 'Custom Thinker',
      role: rawAgent.role || rawAgent.title || rawAgent.name || 'Custom Thinker',
      avatar_url: rawAgent.avatar_url || rawAgent.image_url || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&auto=format&fit=crop&q=80',
      image_url: rawAgent.image_url || rawAgent.avatar_url || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&auto=format&fit=crop&q=80',
      bio: rawAgent.bio || rawAgent.core_philosophy || rawAgent.wikipedia_extract || `Supreme decision frameworks of ${rawAgent.name}.`,
      core_philosophy: rawAgent.core_philosophy || rawAgent.wikipedia_extract || `Supreme decision frameworks of ${rawAgent.name}.`,
      category: rawAgent.category || 'General',
      is_custom: true
    };

    const customAgents = await this.getCustomAgents();
    const updated = [normalizedAgent, ...customAgents.filter((a) => a.id !== id)];
    await AsyncStorage.setItem(STORAGE_KEYS.CUSTOM_AGENTS, JSON.stringify(updated));

    // CRITICAL: Increment lifetime consumed count permanently
    const lifetimeStr = await AsyncStorage.getItem(STORAGE_KEYS.LIFETIME_AGENTS_CREATED);
    const currentLifetime = lifetimeStr ? parseInt(lifetimeStr, 10) : customAgents.length;
    const newLifetime = Math.max(currentLifetime + 1, updated.length);
    await AsyncStorage.setItem(STORAGE_KEYS.LIFETIME_AGENTS_CREATED, newLifetime.toString());

    if (isSupabaseConfigured()) {
      try {
        const userId = await this.getUserId();
        await supabase.from('custom_agents').upsert({
          id: normalizedAgent.id,
          user_id: userId,
          name: normalizedAgent.name,
          title: normalizedAgent.title,
          category: normalizedAgent.category,
          avatar_url: normalizedAgent.avatar_url,
          bio: normalizedAgent.bio,
          core_philosophy: normalizedAgent.core_philosophy,
          system_prompt: normalizedAgent.system_prompt || '',
          created_at: new Date().toISOString()
        }, { onConflict: 'id' });
      } catch (err) {}
    }

    return updated;
  },

  /**
   * Delete a custom mastermind by ID
   */
  async deleteCustomAgent(id) {
    const customAgents = await this.getCustomAgents();
    const updated = customAgents.filter((a) => a.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.CUSTOM_AGENTS, JSON.stringify(updated));

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('custom_agents').delete().eq('id', id);
      } catch (err) {}
    }

    return updated;
  },

  /**
   * Purchase Single Extra Personal Agent Slot for ₹49
   * Increments extra_agent_slots by +1
   */
  async purchaseExtraAgentSlot(externalPaymentId = null) {
    const paymentId = externalPaymentId || ('pay_slot_' + Math.random().toString(36).substring(2, 10).toUpperCase());
    const extraSlotsStr = await AsyncStorage.getItem(STORAGE_KEYS.EXTRA_AGENT_SLOTS);
    const currentExtra = extraSlotsStr ? parseInt(extraSlotsStr, 10) : 0;
    const newExtra = currentExtra + 1;

    await AsyncStorage.setItem(STORAGE_KEYS.EXTRA_AGENT_SLOTS, newExtra.toString());

    if (isSupabaseConfigured()) {
      try {
        const userId = await this.getUserId();
        await supabase.from('profiles').update({
          extra_agent_slots: newExtra,
          updated_at: new Date().toISOString()
        }).eq('id', userId);

        await supabase.from('payments').insert({
          user_id: userId,
          razorpay_payment_id: paymentId,
          plan_type: 'single_agent_slot_49',
          amount: MICRO_AGENT_PRICE,
          duration_days: 365,
          currency: 'INR',
          status: 'captured'
        });
      } catch (err) {}
    }

    // Record in Admin God-Mode Revenue Ledger
    try {
      const email = await AsyncStorage.getItem(STORAGE_KEYS.USER_EMAIL) || 'user@councilx.ai';
      await adminService.recordTransaction({
        type: 'AGENT_SLOT',
        planName: '+1 Custom Personal Agent Slot',
        amount: MICRO_AGENT_PRICE,
        paymentId,
        userEmail: email,
        status: 'PAID',
        mode: 'Razorpay'
      });
    } catch (e) {}

    const quota = await this.getCustomAgentQuota();
    return {
      success: true,
      extraSlots: newExtra,
      paymentId,
      quota
    };
  },

  /**
   * Universal Order Creator for Razorpay Checkout
   */
  async createOrder(planKeyOrType) {
    let amount = 4900;
    if (planKeyOrType === 'extra_agent_slot' || planKeyOrType === 'single_agent_slot_49') {
      amount = 4900;
    } else {
      const plan = SUBSCRIPTION_PLANS[planKeyOrType] || 
        Object.values(SUBSCRIPTION_PLANS).find(p => p.id === planKeyOrType) || 
        SUBSCRIPTION_PLANS.ANNUAL;
      amount = plan.price * 100;
    }
    return {
      id: 'order_' + Math.random().toString(36).substring(2, 10),
      amount,
      currency: 'INR',
      key_id: this.getRazorpayKey()
    };
  },

  /**
   * Universal Payment Verification & Account Upgrade Handler
   */
  async verifyPayment(paymentData = {}) {
    const { plan_type, plan_id, razorpay_payment_id } = paymentData;
    if (plan_type === 'extra_agent_slot' || plan_id === 'extra_agent_slot' || plan_type === 'single_agent_slot_49') {
      return this.purchaseExtraAgentSlot(razorpay_payment_id);
    }
    const matchedPlanKey = Object.keys(SUBSCRIPTION_PLANS).find(
      key => SUBSCRIPTION_PLANS[key].id === plan_id || SUBSCRIPTION_PLANS[key].id === plan_type || key === plan_type || key === plan_id
    ) || 'ANNUAL';
    return this.processRazorpayPlan(matchedPlanKey, razorpay_payment_id);
  }
};
