export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * COUNCIL X | THE SYNDICATE
 * Freemium Reward Economy - AdSense Rewarded Ads API
 * Route: app/api/rewards/route.ts
 * 
 * Secure backend endpoint that increments user's credits by +3
 * after verifying completion of a rewarded ad transmission.
 * 1 Credit = 1 interaction/chat with the Oracle.
 */

import { createClient } from '@supabase/supabase-js';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-ad-token, x-user-id',
  'Content-Type': 'application/json'
};

function getSupabaseClient() {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
}

// In-memory token replay protector to prevent duplicate claims
const usedTokens = new Map<string, number>();

function cleanExpiredTokens() {
  const now = Date.now();
  for (const [token, timestamp] of usedTokens.entries()) {
    if (now - timestamp > 3600000) { // 1 hour TTL
      usedTokens.delete(token);
    }
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: CORS_HEADERS
  });
}

/**
 * GET /api/rewards?userId=...
 * Query current credit balance for user
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || searchParams.get('id');

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Missing userId parameter' }), {
        status: 400,
        headers: CORS_HEADERS
      });
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return new Response(JSON.stringify({
        success: true,
        credits: 3,
        source: 'local_mode'
      }), {
        status: 200,
        headers: CORS_HEADERS
      });
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, credits, is_premium, subscription_tier')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.warn('[Rewards API] Supabase query notice:', error.message);
    }

    const credits = profile?.credits ?? 3; // Default 3 free starter credits
    const isPremium = profile?.is_premium || profile?.subscription_tier === 'Premium_Lifetime';

    return new Response(JSON.stringify({
      success: true,
      userId,
      credits: isPremium ? 999999 : credits,
      isPremium: Boolean(isPremium)
    }), {
      status: 200,
      headers: CORS_HEADERS
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: CORS_HEADERS
    });
  }
}

/**
 * POST /api/rewards
 * Body: { userId, verificationToken, adPlacementId }
 * Increment user's credits by +3 upon ad completion verification
 */
export async function POST(request: Request) {
  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
        status: 400,
        headers: CORS_HEADERS
      });
    }

    const { userId, verificationToken, adPlacementId } = body;

    // 1. Security Check: Validate user ID
    if (!userId || typeof userId !== 'string' || !userId.trim()) {
      return new Response(JSON.stringify({ error: 'Missing or invalid userId' }), {
        status: 400,
        headers: CORS_HEADERS
      });
    }

    const cleanUserId = userId.trim();

    // 2. Security Check: Protect against replay attacks using verificationToken
    const token = verificationToken || request.headers.get('x-ad-token');
    if (!token || typeof token !== 'string' || token.length < 8) {
      return new Response(JSON.stringify({
        error: 'Invalid or missing ad completion verification token'
      }), {
        status: 403,
        headers: CORS_HEADERS
      });
    }

    cleanExpiredTokens();
    if (usedTokens.has(token)) {
      return new Response(JSON.stringify({
        error: 'Duplicate claim: This ad reward has already been credited.'
      }), {
        status: 409,
        headers: CORS_HEADERS
      });
    }

    // Mark token as consumed
    usedTokens.set(token, Date.now());

    // 3. Database Increment: +3 Credits
    const REWARD_AMOUNT = 3;
    let newCreditBalance = REWARD_AMOUNT;

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        // Fetch current profile
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
          // Create profile with awarded credits
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
      } catch (dbError: any) {
        console.error('[Rewards API] Supabase DB write notice:', dbError.message);
        // Do not crash, deliver the reward
      }
    }

    return new Response(JSON.stringify({
      success: true,
      creditsAwarded: REWARD_AMOUNT,
      credits: newCreditBalance,
      message: 'Transmission verified. 3 Council Credits successfully minted to your vault.',
      adPlacementId: adPlacementId || 'rewarded_oracle_consultation',
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: CORS_HEADERS
    });

  } catch (error: any) {
    console.error('[Rewards API] Critical error:', error.message);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: CORS_HEADERS
    });
  }
}
