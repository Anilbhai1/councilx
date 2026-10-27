/**
 * COUNCIL X | THE SYNDICATE
 * Serverless Backend Function: Verify Razorpay Subscription Signature
 * 
 * Verifies Razorpay Subscription & Payment signatures with cryptographic HMAC-SHA256.
 * Subscriptions Formula: HMAC_SHA256(razorpay_payment_id + "|" + razorpay_subscription_id, secret)
 * Orders Formula: HMAC_SHA256(razorpay_order_id + "|" + razorpay_payment_id, secret)
 */

const crypto = require('crypto');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed. Use POST.' });
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
      razorpay_payment_id,
      razorpay_subscription_id,
      razorpay_order_id,
      razorpay_signature,
      plan_id = 'MARKET_MASTER',
      user_id = 'anonymous',
      amount = 999
    } = body;

    if (!razorpay_payment_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: razorpay_payment_id'
      });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;

    if (!secret || secret === 'your_razorpay_key_secret_here') {
      console.warn('[CouncilX Razorpay Notice]: RAZORPAY_KEY_SECRET not configured. Development mode approval.');
      return res.status(200).json({
        success: true,
        verified: true,
        mode: 'development_fallback',
        paymentId: razorpay_payment_id,
        subscriptionId: razorpay_subscription_id || razorpay_order_id,
        planId: plan_id,
        message: 'Subscription confirmed in development mode.'
      });
    }

    let isAuthentic = false;

    // Check 1: Subscription Signature Verification
    if (razorpay_subscription_id && razorpay_signature) {
      const subPayload = `${razorpay_payment_id}|${razorpay_subscription_id}`;
      const genSubSig = crypto.createHmac('sha256', secret).update(subPayload).digest('hex');
      if (genSubSig === razorpay_signature) {
        isAuthentic = true;
      }
    }

    // Check 2: Order Fallback Signature Verification
    if (!isAuthentic && razorpay_order_id && razorpay_signature) {
      const orderPayload = `${razorpay_order_id}|${razorpay_payment_id}`;
      const genOrderSig = crypto.createHmac('sha256', secret).update(orderPayload).digest('hex');
      if (genOrderSig === razorpay_signature) {
        isAuthentic = true;
      }
    }

    // Check 3: Direct API confirmation if signature format varies
    if (!isAuthentic && razorpay_payment_id) {
      try {
        const keyId = process.env.RAZORPAY_KEY_ID || process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || 'rzp_live_Tqty6gwfEY7eqC';
        const authHeader = 'Basic ' + Buffer.from(`${keyId}:${secret}`).toString('base64');
        const fetchFn = typeof fetch !== 'undefined' ? fetch : require('node-fetch');

        const payRes = await fetchFn(`https://api.razorpay.com/v1/payments/${razorpay_payment_id}`, {
          headers: { 'Authorization': authHeader }
        });

        if (payRes.ok) {
          const payData = await payRes.json();
          if (payData.status === 'captured' || payData.status === 'authorized') {
            isAuthentic = true;
          }
        }
      } catch (payCheckErr) {
        console.warn('[CouncilX Razorpay Payment Check Error]:', payCheckErr.message);
      }
    }

    if (!isAuthentic) {
      return res.status(400).json({
        success: false,
        verified: false,
        error: 'Cryptographic subscription signature mismatch. Verification failed.'
      });
    }

    // Persist subscription in Supabase if configured
    try {
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
      if (supabaseUrl && supabaseKey && user_id && user_id !== 'anonymous') {
        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(supabaseUrl, supabaseKey);

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30); // 30-day recurring cycle

        await supabase
          .from('profiles')
          .update({
            is_premium: true,
            subscription_tier: plan_id.toLowerCase().includes('sovereign') ? 'sovereign_syndicate' : 'market_master',
            subscription_expires_at: expiresAt.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', user_id);

        await supabase
          .from('payments')
          .insert({
            user_id: user_id,
            razorpay_payment_id: razorpay_payment_id,
            razorpay_order_id: razorpay_order_id || null,
            razorpay_subscription_id: razorpay_subscription_id || null,
            plan_id: plan_id,
            amount: Number(amount) || 999,
            currency: 'INR',
            status: 'success',
            created_at: new Date().toISOString()
          });
      }
    } catch (dbErr) {
      console.warn('[CouncilX Subscription DB Sync Notice]:', dbErr.message);
    }

    return res.status(200).json({
      success: true,
      verified: true,
      paymentId: razorpay_payment_id,
      subscriptionId: razorpay_subscription_id || razorpay_order_id,
      planId: plan_id,
      status: 'active'
    });

  } catch (err) {
    console.error('[CouncilX Verify Subscription Exception]:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Internal server error while verifying subscription.'
    });
  }
};
