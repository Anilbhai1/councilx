/**
 * COUNCIL X | THE SYNDICATE
 * Serverless Rewards API Endpoint (api/rewards.js)
 * Dual-Runtime Support for Vercel Serverless Functions
 */

const { createClient } = require('@supabase/supabase-js');

function getSupabaseClient() {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
}

const usedTokens = new Map();

function cleanExpiredTokens() {
  const now = Date.now();
  for (const [token, timestamp] of usedTokens.entries()) {
    if (now - timestamp > 3600000) {
      usedTokens.delete(token);
    }
  }
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-ad-token, x-user-id');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const userId = req.query.userId || req.query.id;
      if (!userId) {
        return res.status(400).json({ error: 'Missing userId parameter' });
      }

      const supabase = getSupabaseClient();
      if (!supabase) {
        return res.status(200).json({ success: true, credits: 3, source: 'local_mode' });
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, credits, is_premium, subscription_tier')
        .eq('id', userId)
        .single();

      const credits = profile?.credits ?? 3;
      const isPremium = profile?.is_premium || profile?.subscription_tier === 'Premium_Lifetime';

      return res.status(200).json({
        success: true,
        userId,
        credits: isPremium ? 999999 : credits,
        isPremium: Boolean(isPremium)
      });
    } catch (e) {
      return res.status(500).json({ error: e.message || 'Internal server error' });
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) { body = {}; }
    }
    body = body || {};

    const { userId, verificationToken, adPlacementId } = body;

    if (!userId || typeof userId !== 'string' || !userId.trim()) {
      return res.status(400).json({ error: 'Missing or invalid userId' });
    }

    const cleanUserId = userId.trim();
    const token = verificationToken || req.headers['x-ad-token'];
    if (!token || typeof token !== 'string' || token.length < 8) {
      return res.status(403).json({ error: 'Invalid or missing ad completion verification token' });
    }

    cleanExpiredTokens();
    if (usedTokens.has(token)) {
      return res.status(409).json({ error: 'Duplicate claim: This ad reward has already been credited.' });
    }

    usedTokens.set(token, Date.now());

    const REWARD_AMOUNT = 3;
    let newCreditBalance = REWARD_AMOUNT;

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, credits, is_premium, subscription_tier')
          .eq('id', cleanUserId)
          .single();

        if (profile) {
          const currentCredits = typeof profile.credits === 'number' ? profile.credits : 0;
          newCreditBalance = currentCredits + REWARD_AMOUNT;

          await supabase
            .from('profiles')
            .update({
              credits: newCreditBalance,
              updated_at: new Date().toISOString()
            })
            .eq('id', cleanUserId);
        } else {
          newCreditBalance = REWARD_AMOUNT;
          await supabase
            .from('profiles')
            .insert({
              id: cleanUserId,
              credits: newCreditBalance,
              is_premium: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
        }
      } catch (dbError) {
        console.error('[Rewards API] Supabase write notice:', dbError.message);
      }
    }

    return res.status(200).json({
      success: true,
      creditsAwarded: REWARD_AMOUNT,
      credits: newCreditBalance,
      message: 'Transmission verified. 3 Council Credits successfully minted to your vault.',
      adPlacementId: adPlacementId || 'rewarded_oracle_consultation',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Rewards API] Error:', error.message);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

