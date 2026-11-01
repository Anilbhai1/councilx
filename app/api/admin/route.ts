export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * COUNCIL X | THE SYNDICATE
 * Rebuilt Stealth Admin Route (app/api/admin/route.ts)
 * Runtime: Standard Node.js
 * 
 * Strict Architectural Compliance:
 * 1. Endpoint: /api/admin
 * 2. Authenticates via process.env.ADMIN_EMAIL and process.env.ADMIN_PASSWORD
 * 3. Returns 404 Page Not Found disguise on incorrect credentials or unauthenticated access
 * 4. Supports user listing and [ Grant God Access ] subscription override
 */

import { createClient } from '@supabase/supabase-js';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-admin-token',
  'Content-Type': 'application/json'
};

function getAuthUtils() {
  try {
    return require('../../../api/_lib/auth-utils');
  } catch (e) {
    try {
      return require('../../api/_lib/auth-utils');
    } catch (e2) {
      return null;
    }
  }
}

function getSupabaseClient() {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
}

function create404Response() {
  return new Response(JSON.stringify({
    error: 'Cannot POST /api/admin',
    message: 'Not Found',
    statusCode: 404
  }), {
    status: 404,
    headers: CORS_HEADERS
  });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: CORS_HEADERS
  });
}

export async function GET(request: Request) {
  const authUtils = getAuthUtils();
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
    request.headers.get('x-admin-token') || '';

  const secret = (process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || 'councilx_god_mode_secret_key_2026').trim();
  const payload = authUtils?.verifyJwt ? authUtils.verifyJwt(token, secret) : null;

  if (!payload || payload.role !== 'god_mode_admin') {
    return create404Response();
  }

  // Authenticated admin: fetch user table from Supabase
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return new Response(JSON.stringify({
        success: true,
        users: []
      }), {
        status: 200,
        headers: CORS_HEADERS
      });
    }

    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, is_premium, subscription_tier, created_at, base_free_limit')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[Admin Route GET Users]:', error.message);
      return new Response(JSON.stringify({ success: true, users: [] }), { status: 200, headers: CORS_HEADERS });
    }

    return new Response(JSON.stringify({
      success: true,
      users: users || []
    }), {
      status: 200,
      headers: CORS_HEADERS
    });
  } catch (err: any) {
    return create404Response();
  }
}

export async function POST(request: Request) {
  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch (e) {
      body = {};
    }

    const { searchParams } = new URL(request.url);
    const action = (body.action || searchParams.get('action') || 'login').toLowerCase().trim();

    const envAdminEmail = (process.env.ADMIN_EMAIL || '').trim();
    const envAdminPassword = (process.env.ADMIN_PASSWORD || '').trim();
    const secret = (process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || 'councilx_god_mode_secret_key_2026').trim();
    const authUtils = getAuthUtils();

    // 1. ACTION: LOGIN
    if (action === 'login' || (!body.action && body.password)) {
      const email = String(body.email || '').trim();
      const password = String(body.password || '').trim();

      if (!envAdminEmail || !envAdminPassword || !email || !password) {
        return create404Response();
      }

      if (
        email.toLowerCase() !== envAdminEmail.toLowerCase() ||
        password !== envAdminPassword
      ) {
        return create404Response();
      }

      const token = authUtils?.signJwt
        ? authUtils.signJwt(
            { role: 'god_mode_admin', email: envAdminEmail, timestamp: Date.now() },
            secret,
            86400 * 7
          )
        : `god_admin_${Date.now().toString(36)}`;

      return new Response(JSON.stringify({
        success: true,
        token,
        email: envAdminEmail,
        message: 'God Mode access granted'
      }), {
        status: 200,
        headers: {
          ...CORS_HEADERS,
          'Set-Cookie': `councilx_god_jwt=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800`
        }
      });
    }

    // Authenticated Actions: Require verified token
    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
      request.headers.get('x-admin-token') ||
      body.token ||
      '';

    const payload = authUtils?.verifyJwt ? authUtils.verifyJwt(token, secret) : null;
    if (!payload || payload.role !== 'god_mode_admin') {
      return create404Response();
    }

    // 2. ACTION: USERS LIST
    if (action === 'users') {
      const supabase = getSupabaseClient();
      if (!supabase) {
        return new Response(JSON.stringify({ success: true, users: [] }), { status: 200, headers: CORS_HEADERS });
      }

      const { data: users, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, is_premium, subscription_tier, created_at, base_free_limit')
        .order('created_at', { ascending: false });

      if (error) {
        return new Response(JSON.stringify({ success: true, users: [] }), { status: 200, headers: CORS_HEADERS });
      }

      return new Response(JSON.stringify({
        success: true,
        users: users || []
      }), {
        status: 200,
        headers: CORS_HEADERS
      });
    }

    // 3. ACTION: OVERRIDE USER SUBSCRIPTION (Grant God Access)
    if (action === 'override' || action === 'grant_god_mode') {
      const userId = body.userId || body.user_id || body.id;
      const statusOverride = body.status || 'Premium_Lifetime';

      if (!userId) {
        return new Response(JSON.stringify({ success: false, error: 'User ID is required' }), {
          status: 400,
          headers: CORS_HEADERS
        });
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

      return new Response(JSON.stringify({
        success: true,
        message: 'God Access granted successfully',
        userId,
        status: statusOverride
      }), {
        status: 200,
        headers: CORS_HEADERS
      });
    }

    return create404Response();
  } catch (err: any) {
    console.error('[Admin Route POST Exception]:', err);
    return create404Response();
  }
}
