import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Rebuilt Oracle Engine with Freemium Reward Economy
// Premium (Razorpay): Unlimited Access
// Free: 1 Credit per interaction, 403 on 0 credits

function getSupabaseClient() {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-id',
    }
  });
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    // 1. FORCEFUL CHECK
    if (!apiKey) {
      console.error("CRITICAL ERROR: GEMINI_API_KEY is missing from environment variables.");
      return NextResponse.json({ error: "Server Configuration Error: API Key missing." }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const { data } = body;
    const targetUserId = body.userId || data?.userId || req.headers.get('x-user-id') || null;
    let isUserPremium = Boolean(body.isPremium || data?.isPremium);

    // 2. CREDIT & SUBSCRIPTION VERIFICATION
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
      } catch (dbErr: any) {
        console.warn('[Oracle Route] Supabase verification notice:', dbErr.message);
      }
    }

    // Free tier credit gate:
    if (!isUserPremium) {
      const effectiveCredits = currentCredits !== null ? currentCredits : (typeof body.credits === 'number' ? body.credits : 1);
      
      if (effectiveCredits <= 0) {
        return NextResponse.json({
          error: "INSUFFICIENT_CREDITS",
          code: "INSUFFICIENT_CREDITS",
          credits: 0,
          message: "The Council requires an offering. Watch a brief transmission to earn 3 Free Consultations, or upgrade to Sovereign Syndicate for unlimited access."
        }, { status: 403 });
      }

      // Deduct 1 credit for free tier interaction
      if (supabase && targetUserId) {
        try {
          await supabase
            .from('profiles')
            .update({
              credits: Math.max(0, effectiveCredits - 1),
              updated_at: new Date().toISOString()
            })
            .eq('id', targetUserId);
        } catch (updateErr: any) {
          console.warn('[Oracle Route] Credit decrement notice:', updateErr.message);
        }
      }
    }

    // 3. EXPLICIT INITIALIZATION
    const google = createGoogleGenerativeAI({ apiKey: apiKey });
    
    const messages = (Array.isArray(body.messages) && body.messages.length > 0)
      ? body.messages
      : [{ role: 'user', content: body.userMessage || body.userQuery || body.prompt || 'Provide Oracle market intelligence.' }];

    // 4. AI GENERATION
    const result = await streamText({
      model: google('models/gemini-1.5-pro-latest'),
      messages,
      system: "You are Council X, an elite financial oracle featuring 216 historical masterminds. Provide brutal, deep, cinematic A-to-Z financial intelligence based strictly on real market data. Never use markdown tables.",
    });

    return result.toDataStreamResponse();

  } catch (error: any) {
    console.error("FATAL AI ERROR:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
