/**
 * COUNCIL X | THE SYNDICATE
 * Stealth Admin Login Endpoint (POST /api/admin/login)
 * 
 * Security Principles:
 * - Credentials retrieved ONLY from process.env.ADMIN_EMAIL & process.env.ADMIN_PASSWORD.
 * - Zero hardcoded emails or passwords.
 * - Any unauthorized attempt or wrong credential returns 404 Not Found (stealth disguise).
 * - Issues secure HTTP-only cookie and signed JWT session token upon success.
 */

const { signJwt, send404, getJwtSecret } = require('./auth-utils');

module.exports = async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-token');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Any non-POST request to this stealth route returns 404
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

    const { email, password } = body;

    const envAdminEmail = (process.env.ADMIN_EMAIL || '').trim();
    const envAdminPassword = (process.env.ADMIN_PASSWORD || '').trim();

    // If server environment is not configured, silently return 404
    if (!envAdminEmail || !envAdminPassword) {
      console.warn('[CouncilX Stealth Admin]: ADMIN_EMAIL or ADMIN_PASSWORD not configured in environment.');
      return send404(res);
    }

    if (!email || !password) {
      return send404(res);
    }

    const inputEmail = String(email).trim().toLowerCase();
    const targetEmail = envAdminEmail.toLowerCase();
    const inputPassword = String(password).trim();

    // Constant-time or strict equality verification
    if (inputEmail !== targetEmail || inputPassword !== envAdminPassword) {
      // Return 404 so attacker cannot infer whether the endpoint exists or password was wrong
      return send404(res);
    }

    // Credentials Verified -> Generate 7-day HS256 JWT
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

    // Set secure HTTP-only cookie
    const isProd =
      process.env.NODE_ENV === 'production' ||
      process.env.EXPO_PUBLIC_APP_ENV === 'production';

    const cookieHeader = [
      `councilx_admin_token=${token}`,
      'Path=/',
      'HttpOnly',
      'SameSite=Lax',
      'Max-Age=604800', // 7 days
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
  } catch (err) {
    console.error('[CouncilX Stealth Admin Login Exception]:', err);
    return send404(res);
  }
};
