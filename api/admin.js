/**
 * COUNCIL X | THE SYNDICATE
 * Rebuilt Stealth Admin Serverless Handler (/api/admin)
 * Runtime: Standard Node.js
 * 
 * Strict Architectural Compliance:
 * 1. Endpoint: /api/admin
 * 2. Authenticates via process.env.ADMIN_EMAIL and process.env.ADMIN_PASSWORD
 * 3. Returns 404 Page Not Found disguise on incorrect credentials or unauthenticated access
 * 4. Supports user listing and [ Grant God Access ] subscription override
 */

const {
  signJwt,
  verifyJwt,
  send404,
  getJwtSecret
} = require('./_lib/auth-utils');
const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-token');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const getSupabaseClient = () => {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) return null;
    return createClient(supabaseUrl, supabaseKey);
  };

  const secret = getJwtSecret();

  // GET: User Table for authenticated God Admin
  if (req.method === 'GET') {
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.replace(/^Bearer\s+/i, '') || req.headers['x-admin-token'] || '';

    const payload = verifyJwt(token, secret);
    if (!payload || payload.role !== 'god_mode_admin') {
      return send404(res);
    }

    try {
      const supabase = getSupabaseClient();
      if (!supabase) return res.status(200).json({ success: true, users: [] });

      const { data: users } = await supabase
        .from('profiles')
        .select('id, email, full_name, is_premium, subscription_tier, created_at, base_free_limit')
        .order('created_at', { ascending: false });

      return res.status(200).json({
        success: true,
        users: users || []
      });
    } catch (e) {
      return send404(res);
    }
  }

  if (req.method !== 'POST') {
    return send404(res);
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) { body = {}; }
    }
    body = body || {};

    const action = String(body.action || req.query?.action || 'login').toLowerCase().trim();

    // 1. ACTION: LOGIN
    if (action === 'login' || (!body.action && body.password)) {
      const email = String(body.email || '').trim();
      const password = String(body.password || '').trim();
      const envAdminEmail = (process.env.ADMIN_EMAIL || '').trim();
      const envAdminPassword = (process.env.ADMIN_PASSWORD || '').trim();

      if (!envAdminEmail || !envAdminPassword || !email || !password) {
        return send404(res);
      }

      if (
        email.toLowerCase() !== envAdminEmail.toLowerCase() ||
        password !== envAdminPassword
      ) {
        return send404(res);
      }

      const token = signJwt(
        { role: 'god_mode_admin', email: envAdminEmail, timestamp: Date.now() },
        secret,
        86400 * 7
      );

      res.setHeader('Set-Cookie', `councilx_god_jwt=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800`);
      return res.status(200).json({
        success: true,
        token,
        email: envAdminEmail,
        message: 'God Mode access granted'
      });
    }

    // Authenticated Actions: Require verified token
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.replace(/^Bearer\s+/i, '') || req.headers['x-admin-token'] || body.token || '';

    const payload = verifyJwt(token, secret);
    if (!payload || payload.role !== 'god_mode_admin') {
      return send404(res);
    }

    // 2. ACTION: USERS
    if (action === 'users') {
      const supabase = getSupabaseClient();
      if (!supabase) return res.status(200).json({ success: true, users: [] });

      const { data: users } = await supabase
        .from('profiles')
        .select('id, email, full_name, is_premium, subscription_tier, created_at, base_free_limit')
        .order('created_at', { ascending: false });

      return res.status(200).json({
        success: true,
        users: users || []
      });
    }

    // 3. ACTION: OVERRIDE
    if (action === 'override' || action === 'grant_god_mode') {
      const userId = body.userId || body.user_id || body.id;
      const statusOverride = body.status || 'Premium_Lifetime';

      if (!userId) {
        return res.status(400).json({ success: false, error: 'User ID is required' });
      }

      const supabase = getSupabaseClient();
      if (supabase) {
        await supabase
          .from('profiles')
          .update({
            is_premium: true,
            subscription_tier: statusOverride,
            subscription_status: 'god_mode_override',
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);
      }

      return res.status(200).json({
        success: true,
        message: 'God Access granted successfully',
        userId,
        status: statusOverride
      });
    }

    return send404(res);
  } catch (err) {
    console.error('[Admin API Exception]:', err);
    return send404(res);
  }
};
