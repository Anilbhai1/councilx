/**
 * COUNCIL X | THE SYNDICATE
 * Stealth Admin Panel - Authentication & Cryptographic Utilities
 * 
 * Implements standard HMAC-SHA256 JWT tokens using Node's native crypto module.
 * Zero external dependencies. Stealth 404 responses for any unauthenticated requests.
 */

const crypto = require('crypto');

/**
 * Base64 URL safe encoding
 */
function base64UrlEncode(str) {
  return Buffer.from(str).toString('base64url');
}

/**
 * Base64 URL safe decoding
 */
function base64UrlDecode(str) {
  return Buffer.from(str, 'base64url').toString('utf8');
}

/**
 * Get JWT signing secret from environment
 */
function getJwtSecret() {
  return (
    process.env.ADMIN_JWT_SECRET ||
    process.env.RAZORPAY_KEY_SECRET ||
    'councilx_god_mode_stealth_secret_2026'
  );
}

/**
 * Sign a JWT token using HS256
 */
function signJwt(payload, secret = getJwtSecret(), expiresInSeconds = 86400 * 7) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const fullPayload = {
    ...payload,
    exp,
    iat: Math.floor(Date.now() / 1000)
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Verify and decode a JWT token using HS256
 */
function verifyJwt(token, secret = getJwtSecret()) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [header, payload, signature] = parts;
  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(`${header}.${payload}`)
    .digest('base64url');

  // Constant-time buffer comparison to prevent timing attacks
  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSig);
  if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const data = JSON.parse(base64UrlDecode(payload));
    if (data.exp && data.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired token
    }
    return data;
  } catch (e) {
    return null;
  }
}

/**
 * Extract admin token from request (Bearer Auth, Cookies, or custom header)
 */
function getAdminToken(req) {
  if (!req) return null;

  // 1. Authorization: Bearer <token>
  const authHeader = req.headers?.authorization || req.headers?.Authorization;
  if (authHeader && typeof authHeader === 'string' && authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.slice(7).trim();
  }

  // 2. Cookie header: councilx_admin_token=<token>
  const cookieHeader = req.headers?.cookie || req.headers?.Cookie;
  if (cookieHeader && typeof cookieHeader === 'string') {
    const match = cookieHeader.match(/councilx_admin_token=([^;]+)/);
    if (match && match[1]) {
      return decodeURIComponent(match[1]).trim();
    }
  }

  // 3. Custom Header: x-admin-token
  const customHeader = req.headers?.['x-admin-token'] || req.headers?.['X-Admin-Token'];
  if (customHeader && typeof customHeader === 'string') {
    return customHeader.trim();
  }

  return null;
}

/**
 * Validate that the request comes from an authenticated admin.
 * Matches token email against process.env.ADMIN_EMAIL.
 */
function verifyAdminRequest(req) {
  const token = getAdminToken(req);
  if (!token) return false;

  const decoded = verifyJwt(token);
  if (!decoded) return false;

  const expectedEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();

  // If ADMIN_EMAIL is set, enforce exact match
  if (expectedEmail) {
    if ((decoded.email || '').trim().toLowerCase() !== expectedEmail) {
      return false;
    }
  }

  return decoded.role === 'god_mode_admin';
}

/**
 * Stealth 404 Responder:
 * Responds with standard 404 so unauthenticated users perceive the route as non-existent.
 */
function send404(res) {
  if (res && typeof res.status === 'function') {
    return res.status(404).json({
      error: 'Cannot GET /api/admin',
      message: 'Not Found',
      statusCode: 404
    });
  }
  return { status: 404, body: JSON.stringify({ error: 'Not Found' }) };
}

module.exports = {
  signJwt,
  verifyJwt,
  getAdminToken,
  verifyAdminRequest,
  send404,
  getJwtSecret
};

