/**
 * COUNCIL X | THE SYNDICATE
 * Serverless Backend Function: Dynamic Razorpay Order Creation
 * 
 * SECURITY COMPLIANCE:
 * - Uses server-side RAZORPAY_KEY_SECRET to authenticate directly with Razorpay API (POST /v1/orders).
 * - Never returns dummy/mock order IDs that cause "Beneficiary UPI ID incorrect" / "random@razorpay" QR errors.
 * - Secret key is strictly kept server-side and never exposed to the frontend.
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
      amount = 199900,
      currency = 'INR',
      planId = '216_syndicate',
      userId = 'anonymous'
    } = body;

    const keyId = process.env.RAZORPAY_KEY_ID || process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || 'rzp_live_Tqty6gwfEY7eqC';
    const secret = process.env.RAZORPAY_KEY_SECRET;

    if (!secret || secret === 'your_razorpay_key_secret_here') {
      console.error('[CouncilX Backend Error] RAZORPAY_KEY_SECRET is not configured in backend environment (.env).');
      return res.status(400).json({
        success: false,
        error: 'RAZORPAY_KEY_SECRET is missing or not set in backend environment (.env). Please provide your live Razorpay Key Secret.'
      });
    }

    const authHeader = 'Basic ' + Buffer.from(`${keyId}:${secret}`).toString('base64');
    const fetchFn = typeof fetch !== 'undefined' ? fetch : require('node-fetch');

    // Clean receipt string (alphanumeric, max 40 chars)
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
      console.error('[CouncilX Razorpay API Order Error]', data);
      return res.status(rzpRes.status || 400).json({
        success: false,
        error: data?.error?.description || 'Razorpay rejected order creation. Please verify your Live Key ID & Secret.'
      });
    }

    // Return the dynamic official Razorpay order object
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
    console.error('[CouncilX Create Order Exception]', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Internal server error while creating Razorpay order.'
    });
  }
};
