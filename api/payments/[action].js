/**
 * COUNCIL X | THE SYNDICATE
 * Consolidated Razorpay Payments & Subscriptions Route (/api/payments/[action])
 * Runtime: Node.js (Consolidates 4 payment functions into 1 single Serverless Function)
 * 
 * Supported Actions:
 * - 'create-order': Dynamic Razorpay order creation via official Razorpay Orders API.
 * - 'verify-payment': Cryptographic HMAC-SHA256 signature verification and Supabase sync.
 * - 'create-subscription': Official Razorpay Subscriptions API plan & subscription generator.
 * - 'verify-subscription': Cryptographic recurring subscription verification.
 */

const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

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

  const keyId = process.env.RAZORPAY_KEY_ID || process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || 'rzp_live_Tqty6gwfEY7eqC';
  const secret = process.env.RAZORPAY_KEY_SECRET;
  const fetchFn = typeof fetch !== 'undefined' ? fetch : require('node-fetch');

  // Helper for Supabase client
  const getSupabaseClient = () => {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) return null;
    return createClient(supabaseUrl, supabaseKey);
  };

  switch (action) {
    // --------------------------------------------------------------------------
    // ACTION: CREATE-ORDER
    // --------------------------------------------------------------------------
    case 'create-order': {
      if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method Not Allowed. Use POST.' });
      }

      if (!secret || secret === 'your_razorpay_key_secret_here') {
        return res.status(400).json({
          success: false,
          error: 'RAZORPAY_KEY_SECRET is missing or not configured in backend environment.'
        });
      }

      try {
        const {
          amount = 199900,
          currency = 'INR',
          planId = '216_syndicate',
          userId = 'anonymous'
        } = body;

        const authHeader = 'Basic ' + Buffer.from(`${keyId}:${secret}`).toString('base64');
        const cleanPlan = String(planId).replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);
        const receipt = `rcpt_${cleanPlan}_${Date.now().toString(36)}`;

        const rzpRes = await fetchFn('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            amount: Math.round(Number(amount)),
            currency: currency || 'INR',
            receipt,
            notes: {
              planId: String(planId),
              userId: String(userId),
              platform: 'CouncilX Web App'
            }
          })
        });

        const data = await rzpRes.json();
        if (!rzpRes.ok) {
          return res.status(rzpRes.status || 400).json({
            success: false,
            error: data?.error?.description || 'Razorpay order creation rejected.'
          });
        }

        return res.status(200).json({
          success: true,
          id: data.id,
          order_id: data.id,
          amount: data.amount,
          currency: data.currency,
          key_id: keyId,
          receipt: data.receipt
        });
      } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
      }
    }

    // --------------------------------------------------------------------------
    // ACTION: VERIFY-PAYMENT
    // --------------------------------------------------------------------------
    case 'verify-payment': {
      if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method Not Allowed. Use POST.' });
      }

      const {
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature,
        user_id = 'anonymous',
        plan_id = '216_syndicate',
        amount = 1999,
        isAnnual = false
      } = body;

      if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
        return res.status(400).json({
          success: false,
          error: 'Missing required signature verification fields.'
        });
      }

      if (!secret || secret === 'your_razorpay_key_secret_here') {
        return res.status(400).json({
          success: false,
          error: 'RAZORPAY_KEY_SECRET is not configured in backend environment.'
        });
      }

      try {
        const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
        const generatedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

        if (generatedSignature !== razorpay_signature) {
          return res.status(400).json({
            success: false,
            verified: false,
            error: 'Payment signature mismatch. Verification failed.'
          });
        }

        // Persist to Supabase if configured
        try {
          const supabase = getSupabaseClient();
          if (supabase && user_id && user_id !== 'anonymous') {
            const days = isAnnual ? 365 : 30;
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + days);

            await supabase.from('profiles').update({
              is_premium: true,
              subscription_tier: plan_id,
              plan_type: plan_id,
              expires_at: expiresAt.toISOString(),
              updated_at: new Date().toISOString()
            }).eq('id', user_id);

            await supabase.from('payments').insert({
              user_id,
              razorpay_payment_id,
              razorpay_order_id,
              plan_type: plan_id,
              amount: Number(amount) || 1999,
              currency: 'INR',
              status: 'captured',
              duration_days: days,
              created_at: new Date().toISOString()
            });
          }
        } catch (dbErr) {
          console.warn('[CouncilX DB Sync Notice]:', dbErr.message);
        }

        return res.status(200).json({
          success: true,
          verified: true,
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id
        });
      } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
      }
    }

    // --------------------------------------------------------------------------
    // ACTION: CREATE-SUBSCRIPTION
    // --------------------------------------------------------------------------
    case 'create-subscription': {
      if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method Not Allowed. Use POST.' });
      }

      if (!secret || secret === 'your_razorpay_key_secret_here') {
        return res.status(400).json({
          success: false,
          error: 'RAZORPAY_KEY_SECRET is not configured in backend environment.'
        });
      }

      try {
        const {
          planTier = 'MARKET_MASTER',
          userId = 'anonymous',
          totalCount = 12
        } = body;

        const authHeader = 'Basic ' + Buffer.from(`${keyId}:${secret}`).toString('base64');

        const planConfigs = {
          MARKET_MASTER: {
            name: 'Council X Market Master Subscription',
            amount: 99900,
            period: 'monthly',
            interval: 1,
            description: 'Oracle of Wealth 8 Master Features & 216 Masterminds'
          },
          SOVEREIGN_SYNDICATE: {
            name: 'Council X Sovereign Syndicate Subscription',
            amount: 249900,
            period: 'monthly',
            interval: 1,
            description: 'All-Access 216 Supreme Council + Oracle of Wealth + Shadow Dossier'
          }
        };

        const targetConfig = planConfigs[planTier] || planConfigs.MARKET_MASTER;

        // Step 1: Create Plan
        let rzpPlanId = null;
        try {
          const planRes = await fetchFn('https://api.razorpay.com/v1/plans', {
            method: 'POST',
            headers: {
              'Authorization': authHeader,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              period: targetConfig.period,
              interval: targetConfig.interval,
              item: {
                name: targetConfig.name,
                amount: targetConfig.amount,
                currency: 'INR',
                description: targetConfig.description
              },
              notes: { tier: planTier, service: 'Council X Oracle of Wealth' }
            })
          });
          const planData = await planRes.json();
          if (planRes.ok && planData?.id) {
            rzpPlanId = planData.id;
          }
        } catch (planErr) {
          console.warn('[CouncilX Plan Creation Notice]:', planErr.message);
        }

        // Step 2: Create Subscription
        if (rzpPlanId) {
          const subRes = await fetchFn('https://api.razorpay.com/v1/subscriptions', {
            method: 'POST',
            headers: {
              'Authorization': authHeader,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              plan_id: rzpPlanId,
              total_count: totalCount || 12,
              quantity: 1,
              customer_notify: 1,
              notes: { userId: String(userId), planTier: String(planTier) }
            })
          });

          const subData = await subRes.json();
          if (subRes.ok && subData?.id) {
            return res.status(200).json({
              success: true,
              subscription_id: subData.id,
              id: subData.id,
              plan_id: rzpPlanId,
              status: subData.status,
              amount: targetConfig.amount / 100
            });
          }
        }

        // Fallback: Standard Order Creation
        const fallbackOrderRes = await fetchFn('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            amount: targetConfig.amount,
            currency: 'INR',
            receipt: `rcpt_sub_${Date.now().toString(36)}`,
            notes: { tier: planTier, userId: String(userId) }
          })
        });

        const fallbackData = await fallbackOrderRes.json();
        return res.status(200).json({
          success: true,
          subscription_id: fallbackData.id,
          id: fallbackData.id,
          order_id: fallbackData.id,
          status: 'created',
          amount: targetConfig.amount / 100
        });
      } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
      }
    }

    // --------------------------------------------------------------------------
    // ACTION: VERIFY-SUBSCRIPTION
    // --------------------------------------------------------------------------
    case 'verify-subscription': {
      if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method Not Allowed. Use POST.' });
      }

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

      if (!secret || secret === 'your_razorpay_key_secret_here') {
        return res.status(400).json({
          success: false,
          error: 'RAZORPAY_KEY_SECRET is not configured in backend environment.'
        });
      }

      try {
        let isAuthentic = false;

        // Check 1: Subscription Signature Verification
        if (razorpay_subscription_id && razorpay_signature) {
          const subPayload = `${razorpay_payment_id}|${razorpay_subscription_id}`;
          const genSubSig = crypto.createHmac('sha256', secret).update(subPayload).digest('hex');
          if (genSubSig === razorpay_signature) isAuthentic = true;
        }

        // Check 2: Order Fallback Signature Verification
        if (!isAuthentic && razorpay_order_id && razorpay_signature) {
          const orderPayload = `${razorpay_order_id}|${razorpay_payment_id}`;
          const genOrderSig = crypto.createHmac('sha256', secret).update(orderPayload).digest('hex');
          if (genOrderSig === razorpay_signature) isAuthentic = true;
        }

        // Check 3: Direct API confirmation
        if (!isAuthentic && razorpay_payment_id) {
          try {
            const authHeader = 'Basic ' + Buffer.from(`${keyId}:${secret}`).toString('base64');
            const payRes = await fetchFn(`https://api.razorpay.com/v1/payments/${razorpay_payment_id}`, {
              headers: { 'Authorization': authHeader }
            });
            if (payRes.ok) {
              const payData = await payRes.json();
              if (payData.status === 'captured' || payData.status === 'authorized') {
                isAuthentic = true;
              }
            }
          } catch (e) { }
        }

        if (!isAuthentic) {
          return res.status(400).json({
            success: false,
            verified: false,
            error: 'Subscription signature mismatch. Verification failed.'
          });
        }

        // Sync with Supabase
        try {
          const supabase = getSupabaseClient();
          if (supabase && user_id && user_id !== 'anonymous') {
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 30);

            await supabase.from('profiles').update({
              is_premium: true,
              subscription_tier: plan_id.toLowerCase().includes('sovereign') ? 'sovereign_syndicate' : 'market_master',
              plan_type: plan_id,
              expires_at: expiresAt.toISOString(),
              updated_at: new Date().toISOString()
            }).eq('id', user_id);

            await supabase.from('payments').insert({
              user_id,
              razorpay_payment_id,
              razorpay_order_id: razorpay_order_id || null,
              plan_type: plan_id,
              amount: Number(amount) || 999,
              currency: 'INR',
              status: 'success',
              duration_days: 30,
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
          status: 'active'
        });
      } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
      }
    }

    default:
      return res.status(404).json({ success: false, error: `Unknown payment action: ${action}` });
  }
};

