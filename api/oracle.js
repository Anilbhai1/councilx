const { streamText } = require('ai');
const { createGoogleGenerativeAI } = require('@ai-sdk/google');
const { createClient } = require('@supabase/supabase-js');

function getSupabaseClient() {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id, x-goog-api-key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error("CRITICAL ERROR: GEMINI_API_KEY is missing from environment variables.");
      return res.status(500).json({ error: "Server Configuration Error: API Key missing." });
    }

    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) { body = {}; }
    }
    body = body || {};

    const { data } = body;
    const targetUserId = body.userId || data?.userId || req.headers['x-user-id'] || null;
    let isUserPremium = Boolean(body.isPremium || data?.isPremium);

    // Credit & Subscription verification
    const supabase = getSupabaseClient();
    let currentCredits = typeof body.credits === 'number' ? body.credits : null;

    if (supabase && targetUserId) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, credits, is_premium, subscription_tier, plan_type')
          .eq('id', targetUserId)
          .single();

        if (profile) {
          if (profile.is_premium || profile.subscription_tier === 'Premium_Lifetime' || profile.plan_type === '216_syndicate') {
            isUserPremium = true;
          }
          if (typeof profile.credits === 'number') {
            currentCredits = profile.credits;
          }
        }
      } catch (dbErr) {
        console.warn('[Oracle Route Serverless] DB check notice:', dbErr.message);
      }
    }

    // Free tier credit gate:
    if (!isUserPremium) {
      const effectiveCredits = currentCredits !== null ? currentCredits : (typeof body.credits === 'number' ? body.credits : 1);

      if (effectiveCredits <= 0) {
        return res.status(403).json({
          error: "INSUFFICIENT_CREDITS",
          code: "INSUFFICIENT_CREDITS",
          credits: 0,
          message: "The Council requires an offering. Watch a brief transmission to earn 3 Free Consultations, or upgrade to Sovereign Syndicate for unlimited access."
        });
      }

      // Deduct 1 credit
      if (supabase && targetUserId) {
        try {
          await supabase
            .from('profiles')
            .update({
              credits: Math.max(0, effectiveCredits - 1),
              updated_at: new Date().toISOString()
            })
            .eq('id', targetUserId);
        } catch (updateErr) {
          console.warn('[Oracle Route Serverless] Credit decrement notice:', updateErr.message);
        }
      }
    }

    const google = createGoogleGenerativeAI({ apiKey: apiKey });

    const messages = (Array.isArray(body.messages) && body.messages.length > 0)
      ? body.messages
      : [{ role: 'user', content: body.userMessage || body.userQuery || body.prompt || 'Provide Oracle market intelligence.' }];

    const result = await streamText({
      model: google('models/gemini-1.5-pro-latest'),
      messages,
      system: "You are Council X, an elite financial oracle featuring 216 historical masterminds. Provide brutal, deep, cinematic A-to-Z financial intelligence based strictly on real market data. Never use markdown tables.",
    });

    const streamResponse = result.toDataStreamResponse();
    res.setHeader('Content-Type', streamResponse.headers.get('content-type') || 'text/plain; charset=utf-8');

    const reader = streamResponse.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
    return res.end();
  } catch (error) {
    console.error("FATAL AI ERROR:", error.message);
    return res.status(500).json({ error: error.message });
  }
};
