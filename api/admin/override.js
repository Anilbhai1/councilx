/**
 * COUNCIL X | THE SYNDICATE
 * Stealth Admin Subscription Override (POST /api/admin/override)
 * 
 * The Override Switch:
 * Explicitly overrides a user's subscription status in the database to 'Premium_Lifetime',
 * granting unlimited free access and bypassing the Razorpay paywall entirely.
 * 
 * Protected by JWT / HTTP-only session verification.
 * Any unauthenticated request returns 404 Not Found.
 */

const { verifyAdminRequest, send404 } = require('./auth-utils');
const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-token');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. Strict Stealth Authentication Check
  if (!verifyAdminRequest(req)) {
    return send404(res);
  }

  if (req.method !== 'POST') {
    return send404(res);
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        body = {};
      }
    }
    body = body || {};

    const {
      userId,
      email,
      overrideStatus = 'Premium_Lifetime',
      action = 'grant' // 'grant' or 'revoke'
    } = body;

    if (!userId && !email) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: userId or email.'
      });
    }

    const supabaseUrl =
      process.env.EXPO_PUBLIC_SUPABASE_URL ||
      process.env.SUPABASE_URL;

    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({
        success: false,
        error: 'Supabase database credentials not configured in backend.'
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const isGranting = action !== 'revoke';
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

    // Check if user exists by ID
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

    // If not updated yet and email is provided, try updating by email
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

    // If user does not exist in profiles yet, create/upsert a new profile
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

    // Record audit transaction in payments table
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
    } catch (auditErr) {
      console.warn('[CouncilX Admin Override Audit Notice]:', auditErr.message);
    }

    const targetIdentifier = updatedProfile?.email || email || userId;

    return res.status(200).json({
      success: true,
      message: isGranting
        ? `God Access granted to ${targetIdentifier}! Unlimited lifetime bypass active.`
        : `God Access revoked for ${targetIdentifier}. Reverted to free tier.`,
      user: updatedProfile || {
        id: userId,
        email: email,
        ...updatePayload
      }
    });
  } catch (err) {
    console.error('[CouncilX Admin Override Exception]:', err);
    return send404(res);
  }
};
