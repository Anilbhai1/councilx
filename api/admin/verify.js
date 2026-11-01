/**
 * COUNCIL X | THE SYNDICATE
 * Stealth Admin Session Verification (GET/POST /api/admin/verify)
 * 
 * Validates JWT session token or cookie.
 * Returns 404 Not Found if unauthenticated.
 */

const { verifyAdminRequest, send404 } = require('./auth-utils');

module.exports = async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-token');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!verifyAdminRequest(req)) {
    return send404(res);
  }

  return res.status(200).json({
    success: true,
    valid: true,
    email: process.env.ADMIN_EMAIL || 'admin@councilx.ai'
  });
};
