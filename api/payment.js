/**
 * COUNCIL X | THE SYNDICATE
 * Rebuilt Razorpay Payment Gateway Serverless Handler (/api/payment)
 * Runtime: Standard Node.js
 * 
 * Strict Architectural Compliance:
 * 1. Endpoint: /api/payment
 * 2. Uses process.env.RAZORPAY_KEY_ID and process.env.RAZORPAY_KEY_SECRET
 * 3. Creates official dynamic Razorpay orders via api.razorpay.com/v1/orders
 * 4. Supports cryptographic HMAC-SHA256 signature verification & Supabase sync
 */

const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const keyId = (process.env.RAZORPAY_KEY_ID || process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || 'rzp_live_Tqty6gwfEY7eqC').trim();
  const secret = (process.env.RAZORPAY_KEY_SECRET || '').trim();

  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      service: 'Council X Razorpay Gateway',
      endpoint: '/api/payment',
      key_configured: Boolean(keyId),
      secret_configured: Boolean(secret),
      timestamp: new Date().toISOString()
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed. Use POST.' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) { body = {}; }
    }
    body = body || {};

    // 1. Payment Verification
    if (body.action === 'verify' || body.razorpay_signature) {
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        planKeyOrType,
        planTier,
        userId
      } = body;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({
          success: false,
          error: 'Missing required signature verification parameters.'
        });
      }

      if (!secret) {
        return res.status(500).json({
          success: false,
          error: 'RAZORPAY_KEY_SECRET is not configured on backend.'
        });
      }

      const generatedSignature = crypto
        .createHmac('sha256', secret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (generatedSignature !== razorpay_signature) {
        return res.status(400).json({
          success: false,
          error: 'Invalid payment signature. Authentication failed.'
        });
      }

      // Sync user subscription in Supabase if configured
      try {
        const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
        if (supabaseUrl && supabaseKey && userId && userId !== 'anonymous') {
          const supabase = createClient(supabaseUrl, supabaseKey);
          const effectivePlan = planTier || planKeyOrType || 'MARKET_MASTER';
          await supabase
            .from('profiles')
            .update({
              is_premium: true,
              subscription_tier: effectivePlan,
              subscription_status: 'active',
              updated_at: new Date().toISOString()
            })
            .eq('id', userId);
        }
      } catch (dbErr) {
        console.warn('[Payment API]: Notice updating Supabase profile:', dbErr.message);
      }

      return res.status(200).json({
        success: true,
        verified: true,
        order_id: razorpay_order_id,
        payment_id: razorpay_payment_id,
        message: 'Payment verified and subscription activated successfully.'
      });
    }

    // 2. Order Creation
    if (!secret || secret === 'your_razorpay_key_secret_here') {
      console.error('[Payment API]: RAZORPAY_KEY_SECRET is not configured.');
      return res.status(400).json({
        success: false,
        error: 'RAZORPAY_KEY_SECRET is missing or not configured in backend environment.'
      });
    }

    const amount = Math.round(Number(body.amount || 99900));
    const currency = body.currency || 'INR';
    const planId = String(body.planId || 'MARKET_MASTER');
    const userId = String(body.userId || 'anonymous');

    const authHeader = 'Basic ' + Buffer.from(`${keyId}:${secret}`).toString('base64');
    const cleanPlan = planId.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);
    const receipt = `rcpt_${cleanPlan}_${Date.now().toString(36)}`;

    const fetchFn = typeof fetch !== 'undefined' ? fetch : require('node-fetch');
    const rzpRes = await fetchFn('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount,
        currency,
        receipt,
        notes: {
          planId,
          userId,
          platform: 'Council X Platform'
        }
      })
    });

    const rzpOrder = await rzpRes.json();

    if (!rzpRes.ok) {
      console.error('[Payment API Error]: Razorpay Orders API returned error:', rzpOrder);
      return res.status(rzpRes.status || 500).json({
        success: false,
        error: rzpOrder.error?.description || 'Failed to create order on Razorpay servers.',
        details: rzpOrder.error
      });
    }

    return res.status(200).json({
      success: true,
      order_id: rzpOrder.id,
      id: rzpOrder.id,
      order: { id: rzpOrder.id },
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      key_id: keyId
    });
  } catch (err) {
    console.error('[Payment API Exception]:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Internal server error in Payment API'
    });
  }
};
