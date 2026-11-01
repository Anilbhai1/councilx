export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * COUNCIL X | THE SYNDICATE
 * Rebuilt Razorpay Payment Gateway Route (app/api/payment/route.ts)
 * Runtime: Standard Node.js
 * 
 * Strict Architectural Compliance:
 * 1. Rebuild Payment Gateway at EXACT path: /api/payment
 * 2. Uses process.env.RAZORPAY_KEY_ID and process.env.RAZORPAY_KEY_SECRET
 * 3. Creates official dynamic Razorpay orders via api.razorpay.com/v1/orders
 * 4. Supports cryptographic HMAC-SHA256 signature verification & Supabase sync
 */

import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};

function getSupabaseClient() {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: CORS_HEADERS
  });
}

export async function GET() {
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || 'rzp_live_Tqty6gwfEY7eqC';
  return new Response(JSON.stringify({
    success: true,
    service: 'Council X Razorpay Gateway',
    endpoint: '/api/payment',
    key_configured: Boolean(keyId),
    secret_configured: Boolean(process.env.RAZORPAY_KEY_SECRET),
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: CORS_HEADERS
  });
}

export async function POST(request: Request) {
  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch (e) {
      body = {};
    }

    const keyId = (process.env.RAZORPAY_KEY_ID || process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || 'rzp_live_Tqty6gwfEY7eqC').trim();
    const secret = (process.env.RAZORPAY_KEY_SECRET || '').trim();

    // Check if this is a Payment Verification request
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
        return new Response(JSON.stringify({
          success: false,
          error: 'Missing required signature verification parameters.'
        }), {
          status: 400,
          headers: CORS_HEADERS
        });
      }

      if (!secret) {
        return new Response(JSON.stringify({
          success: false,
          error: 'RAZORPAY_KEY_SECRET is not configured on backend.'
        }), {
          status: 500,
          headers: CORS_HEADERS
        });
      }

      const generatedSignature = crypto
        .createHmac('sha256', secret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (generatedSignature !== razorpay_signature) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid payment signature. Authentication failed.'
        }), {
          status: 400,
          headers: CORS_HEADERS
        });
      }

      // Sync user subscription in Supabase if configured
      try {
        const supabase = getSupabaseClient();
        if (supabase && userId && userId !== 'anonymous') {
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
      } catch (dbErr: any) {
        console.warn('[Payment Route]: Notice updating Supabase profile:', dbErr?.message);
      }

      return new Response(JSON.stringify({
        success: true,
        verified: true,
        order_id: razorpay_order_id,
        payment_id: razorpay_payment_id,
        message: 'Payment verified and subscription activated successfully.'
      }), {
        status: 200,
        headers: CORS_HEADERS
      });
    }

    // Default Action: Create Dynamic Razorpay Order
    if (!secret || secret === 'your_razorpay_key_secret_here') {
      console.error('[Payment Route]: RAZORPAY_KEY_SECRET is not configured.');
      return new Response(JSON.stringify({
        success: false,
        error: 'RAZORPAY_KEY_SECRET is missing or not configured in backend environment.'
      }), {
        status: 400,
        headers: CORS_HEADERS
      });
    }

    const amount = Math.round(Number(body.amount || 99900));
    const currency = body.currency || 'INR';
    const planId = String(body.planId || 'MARKET_MASTER');
    const userId = String(body.userId || 'anonymous');

    const authHeader = 'Basic ' + Buffer.from(`${keyId}:${secret}`).toString('base64');
    const cleanPlan = planId.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);
    const receipt = `rcpt_${cleanPlan}_${Date.now().toString(36)}`;

    const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
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
      console.error('[Payment Route Error]: Razorpay Orders API returned error:', rzpOrder);
      return new Response(JSON.stringify({
        success: false,
        error: rzpOrder.error?.description || 'Failed to create order on Razorpay servers.',
        details: rzpOrder.error
      }), {
        status: rzpRes.status || 500,
        headers: CORS_HEADERS
      });
    }

    return new Response(JSON.stringify({
      success: true,
      order_id: rzpOrder.id,
      id: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      key_id: keyId
    }), {
      status: 200,
      headers: CORS_HEADERS
    });
  } catch (err: any) {
    console.error('[Payment Route Exception]:', err);
    return new Response(JSON.stringify({
      success: false,
      error: err?.message || 'Internal server error in Payment Route'
    }), {
      status: 500,
      headers: CORS_HEADERS
    });
  }
}
