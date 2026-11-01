/**
 * COUNCIL X | THE SYNDICATE
 * Stealth Admin Users Endpoint (GET/POST /api/admin/users)
 * 
 * Fetches all registered users from Supabase PostgreSQL database.
 * Protected by JWT / HTTP-only session verification.
 * Any unauthenticated request returns a 404 Not Found error.
 */

const { verifyAdminRequest, send404 } = require('./auth-utils');
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

  // 1. Strict Stealth Authentication Check
  if (!verifyAdminRequest(req)) {
    return send404(res);
  }

  try {
    const supabaseUrl =
      process.env.EXPO_PUBLIC_SUPABASE_URL ||
      process.env.SUPABASE_URL;

    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn('[CouncilX Admin Users]: Supabase credentials not found in backend environment.');
      return res.status(200).json({
        success: true,
        users: []
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch registered users from profiles table using select('*')
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[CouncilX Admin Users DB Query Error]:', error.message);
      return res.status(500).json({
        success: false,
        error: error.message
      });
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
    console.error('[CouncilX Admin Users Exception]:', err);
    return send404(res);
  }
};
