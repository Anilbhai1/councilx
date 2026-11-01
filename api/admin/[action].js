/**
 * COUNCIL X | THE SYNDICATE
 * Consolidated Stealth Admin Route (POST / GET /api/admin/[action])
 * Runtime: Node.js (Consolidates 5 admin functions into 1 single Serverless Function)
 * 
 * Actions supported via switch statement:
 * - 'login': Stealth brutalist authentication against process.env.ADMIN_EMAIL & ADMIN_PASSWORD.
 * - 'users': Fetches all registered users from Supabase profiles table.
 * - 'override': Explicitly overrides user subscription to 'Premium_Lifetime' (God Access).
 * - 'verify': Validates JWT session token.
 * - default: Returns 404 Not Found (Stealth disguise).
 */

const {
  signJwt,
  verifyAdminRequest,
  send404,
  getJwtSecret
} = require('../_lib/auth-utils');
const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-token');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Parse Body if JSON string
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      body = {};
    }
  }
  body = body || {};

  // Extract action from query, URL path, or body
  const actionFromUrl = (req.url || '').split('?')[0].split('/').pop();
  const action = String(
    req.query?.action ||
    body.action ||
    actionFromUrl ||
    ''
  ).toLowerCase().trim();

  // Helper for Supabase client
  const getSupabaseClient = () => {
    const supabaseUrl =
      process.env.EXPO_PUBLIC_SUPABASE_URL ||
      process.env.SUPABASE_URL;

    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) return null;
    return createClient(supabaseUrl, supabaseKey);
  };

  switch (action) {
    // --------------------------------------------------------------------------
    // ACTION: LOGIN
    // --------------------------------------------------------------------------
    case 'login': {
      if (req.method !== 'POST') return send404(res);

      const { email, password } = body;
      const envAdminEmail = (process.env.ADMIN_EMAIL || '').trim();
      const envAdminPassword = (process.env.ADMIN_PASSWORD || '').trim();

      if (!envAdminEmail || !envAdminPassword || !email || !password) {
        return send404(res);
      }

      if (
        String(email).trim().toLowerCase() !== envAdminEmail.toLowerCase() ||
        String(password).trim() !== envAdminPassword
      ) {
        return send404(res);
      }

      const secret = getJwtSecret();
      const token = signJwt(
        {
          role: 'god_mode_admin',
          email: envAdminEmail,
          timestamp: Date.now()
        },
        secret,
        86400 * 7 // 7 days
      );

      const isProd =
        process.env.NODE_ENV === 'production' ||
        process.env.EXPO_PUBLIC_APP_ENV === 'production';

      const cookieHeader = [
        `councilx_admin_token=${token}`,
        'Path=/',
        'HttpOnly',
        'SameSite=Lax',
        'Max-Age=604800',
        isProd ? 'Secure' : ''
      ]
        .filter(Boolean)
        .join('; ');

      res.setHeader('Set-Cookie', cookieHeader);

      return res.status(200).json({
        success: true,
        token,
        email: envAdminEmail,
        expiresIn: 604800
      });
    }

    // --------------------------------------------------------------------------
    // ACTION: USERS (Fetch Supabase Profiles)
    // --------------------------------------------------------------------------
    case 'users': {
      if (!verifyAdminRequest(req)) return send404(res);

      try {
        const supabase = getSupabaseClient();
        if (!supabase) {
          return res.status(200).json({ success: true, users: [] });
        }

        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          return res.status(500).json({ success: false, error: error.message });
        }

        const users = (profiles || []).map((p) => {
          const isPrem = Boolean(p.is_premium);
          const isGodMode =
            p.subscription_tier === 'Premium_Lifetime' ||
            p.plan_type === 'Premium_Lifetime' ||
            (isPrem && (!p.expires_at || new Date(p.expires_at).getFullYear() > 2050));

          return {
            id: String(p.id),
            email: p.email || (p.id ? `user_${String(p.id).slice(0, 8)}@councilx.ai` : 'unnamed_member@councilx.ai'),
            originalEmail: p.email,
            full_name: p.full_name || 'Council Syndicate Member',
            avatar_url: p.avatar_url || null,
            is_premium: isPrem,
            is_god_mode: isGodMode,
            subscription_tier: p.subscription_tier || (isPrem ? 'Premium' : 'free'),
            plan_type: p.plan_type || p.subscription_tier || (isPrem ? 'Premium' : 'free'),
            expires_at: p.expires_at,
            created_at: p.created_at || new Date().toISOString(),
            updated_at: p.updated_at,
            message_count: Number(p.message_count) || 0,
            bonus_messages: Number(p.bonus_messages) || 0
          };
        });

        return res.status(200).json({
          success: true,
          users,
          count: users.length
        });
      } catch (err) {
        return send404(res);
      }
    }

    // --------------------------------------------------------------------------
    // ACTION: OVERRIDE (Grant / Revoke God Access)
    // --------------------------------------------------------------------------
    case 'override': {
      if (!verifyAdminRequest(req)) return send404(res);
      if (req.method !== 'POST') return send404(res);

      try {
        const {
          userId,
          email,
          overrideStatus = 'Premium_Lifetime',
          action: overrideAction = 'grant'
        } = body;

        if (!userId && !email) {
          return res.status(400).json({
            success: false,
            error: 'Missing required parameter: userId or email.'
          });
        }

        const supabase = getSupabaseClient();
        if (!supabase) {
          return res.status(500).json({
            success: false,
            error: 'Supabase database credentials not configured in backend.'
          });
        }

        const isGranting = overrideAction !== 'revoke';
        const targetStatus = isGranting ? overrideStatus : 'free';
        const farFutureDate = new Date('2099-12-31T23:59:59.999Z').toISOString();

        const updatePayload = isGranting
          ? {
              is_premium: true,
              subscription_tier: targetStatus,
              plan_type: targetStatus,
              expires_at: farFutureDate,
              bonus_messages: 999999,
              updated_at: new Date().toISOString()
            }
          : {
              is_premium: false,
              subscription_tier: 'free',
              plan_type: 'free',
              expires_at: null,
              updated_at: new Date().toISOString()
            };

        let updatedProfile = null;

        if (userId) {
          const { data, error } = await supabase
            .from('profiles')
            .update(updatePayload)
            .eq('id', userId)
            .select('*');

          if (!error && data && data.length > 0) {
            updatedProfile = data[0];
          }
        }

        if (!updatedProfile && email) {
          const { data, error } = await supabase
            .from('profiles')
            .update(updatePayload)
            .eq('email', email.trim().toLowerCase())
            .select('*');

          if (!error && data && data.length > 0) {
            updatedProfile = data[0];
          }
        }

        if (!updatedProfile && email) {
          const newUserId = userId || `cx_god_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
          const { data, error } = await supabase
            .from('profiles')
            .upsert({
              id: newUserId,
              email: email.trim().toLowerCase(),
              full_name: email.split('@')[0],
              ...updatePayload,
              created_at: new Date().toISOString()
            })
            .select('*');

          if (!error && data && data.length > 0) {
            updatedProfile = data[0];
          }
        }

        // Record audit entry in payments
        try {
          await supabase.from('payments').insert({
            user_id: updatedProfile?.id || userId || 'unknown_user',
            plan_type: targetStatus,
            amount: 0,
            currency: 'INR',
            status: isGranting ? 'GIFTED_BY_ADMIN' : 'REVOKED_BY_ADMIN',
            duration_days: isGranting ? 36500 : 0,
            razorpay_payment_id: `god_override_${Date.now()}`,
            created_at: new Date().toISOString()
          });
        } catch (auditErr) {}

        const targetIdentifier = updatedProfile?.email || email || userId;

        return res.status(200).json({
          success: true,
          message: isGranting
            ? `God Access granted to ${targetIdentifier}! Unlimited lifetime bypass active.`
            : `God Access revoked for ${targetIdentifier}. Reverted to free tier.`,
          user: updatedProfile || {
            id: userId,
            email,
            ...updatePayload
          }
        });
      } catch (err) {
        return send404(res);
      }
    }

    // --------------------------------------------------------------------------
    // ACTION: VERIFY (Session Check)
    // --------------------------------------------------------------------------
    case 'verify': {
      if (!verifyAdminRequest(req)) return send404(res);
      return res.status(200).json({
        success: true,
        valid: true,
        email: process.env.ADMIN_EMAIL || 'admin@councilx.ai'
      });
    }

    default:
      return send404(res);
  }
};
