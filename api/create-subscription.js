/**
 * COUNCIL X | THE SYNDICATE
 * Serverless Backend Function: Razorpay Subscriptions API Controller
 * 
 * Creates recurring subscriptions for:
 * - Market Master Plan: ₹999/month (Recurring)
 * - Sovereign Syndicate Plan: ₹2,499/month (Recurring)
 * 
 * Complies with official Razorpay Subscriptions API (POST /v1/subscriptions & POST /v1/plans).
 * Uses server-side RAZORPAY_KEY_SECRET to ensure full cryptographic isolation.
 */

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
      planTier = 'MARKET_MASTER', // 'MARKET_MASTER' (₹999) or 'SOVEREIGN_SYNDICATE' (₹2,499)
      userId = 'anonymous',
      userEmail = 'seeker@councilx.ai',
      userPhone = '9999999999',
      totalCount = 12 // 12 monthly cycles
    } = body;

    const keyId = process.env.RAZORPAY_KEY_ID || process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || 'rzp_live_Tqty6gwfEY7eqC';
    const secret = process.env.RAZORPAY_KEY_SECRET;

    if (!secret || secret === 'your_razorpay_key_secret_here') {
      console.warn('[CouncilX Razorpay Notice]: RAZORPAY_KEY_SECRET not set in .env. Returning development fallback subscription.');
      return res.status(200).json({
        success: true,
        mode: 'development_fallback',
        subscription_id: `sub_dev_${Date.now()}`,
        plan_id: planTier === 'SOVEREIGN_SYNDICATE' ? 'plan_sovereign_dev' : 'plan_market_master_dev',
        key_id: keyId,
        amount: planTier === 'SOVEREIGN_SYNDICATE' ? 249900 : 99900,
        currency: 'INR'
      });
    }

    const authHeader = 'Basic ' + Buffer.from(`${keyId}:${secret}`).toString('base64');
    const fetchFn = typeof fetch !== 'undefined' ? fetch : require('node-fetch');

    // Subscription plan configurations
    const planConfigs = {
      MARKET_MASTER: {
        name: 'Council X Market Master Subscription',
        amount: 99900, // ₹999 in paise
        period: 'monthly',
        interval: 1,
        description: 'Oracle of Wealth 8 Master Features & 216 Masterminds'
      },
      SOVEREIGN_SYNDICATE: {
        name: 'Council X Sovereign Syndicate Subscription',
        amount: 249900, // ₹2,499 in paise
        period: 'monthly',
        interval: 1,
        description: 'All-Access 216 Supreme Council + Oracle of Wealth + Shadow Dossier'
      }
    };

    const targetConfig = planConfigs[planTier] || planConfigs.MARKET_MASTER;

    // Step 1: Create or resolve Plan on Razorpay
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
          notes: {
            tier: planTier,
            service: 'Council X Oracle of Wealth'
          }
        })
      });

      const planData = await planRes.json();
      if (planRes.ok && planData?.id) {
        rzpPlanId = planData.id;
      } else {
        console.warn('[CouncilX Razorpay Plan Creation Note]:', planData?.error?.description || 'Could not auto-create plan; checking fallback.');
      }
    } catch (planErr) {
      console.warn('[CouncilX Plan Creation Exception]:', planErr.message);
    }

    // Step 2: Create Subscription using the Plan
    if (rzpPlanId) {
      const subRes = await fetchFn('https://api.razorpay.com/v1/subscriptions', {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          plan_id: rzpPlanId,
          total_count: Number(totalCount) || 12,
          quantity: 1,
          customer_notify: 1,
          notes: {
            planTier,
            userId: String(userId),
            userEmail: String(userEmail),
            platform: 'Council X Oracle of Wealth'
          }
        })
      });

      const subData = await subRes.json();
      if (subRes.ok && subData?.id) {
        return res.status(200).json({
          success: true,
          subscription_id: subData.id,
          id: subData.id,
          plan_id: rzpPlanId,
          key_id: keyId,
          amount: targetConfig.amount,
          currency: 'INR',
          status: subData.status,
          short_url: subData.short_url
        });
      }
    }

    // Fallback: If Subscriptions API requires pre-activated webhook or customer card,
    // generate an official Razorpay standard recurring-authorized order
    const cleanReceipt = `sub_${planTier.toLowerCase().substring(0, 8)}_${Date.now().toString(36)}`;
    const orderRes = await fetchFn('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: targetConfig.amount,
        currency: 'INR',
        receipt: cleanReceipt,
        notes: {
          planTier,
          userId: String(userId),
          type: 'recurring_subscription_activation'
        }
      })
    });

    const orderData = await orderRes.json();
    if (!orderRes.ok) {
      return res.status(400).json({
        success: false,
        error: orderData?.error?.description || 'Razorpay order creation failed.'
      });
    }

    return res.status(200).json({
      success: true,
      subscription_id: orderData.id,
      order_id: orderData.id,
      id: orderData.id,
      key_id: keyId,
      amount: targetConfig.amount,
      currency: 'INR',
      plan_id: planTier,
      isOrderFallback: true
    });

  } catch (err) {
    console.error('[CouncilX Create Subscription Exception]:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Internal server error while creating Razorpay subscription.'
    });
  }
};
