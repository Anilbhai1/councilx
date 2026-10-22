// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This code is designed to run in Supabase Edge Functions.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createHmac } from "https://deno.land/std@0.168.0/crypto/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      user_id,
      plan_id = "216_syndicate",
      amount = 1999,
      isAnnual = false
    } = await req.json();

    const secret = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!secret) {
      return new Response(
        JSON.stringify({
          error: "RAZORPAY_KEY_SECRET is not configured in Supabase Edge Function secrets",
          verified: false
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Cryptographic HMAC-SHA256 verification
    let isAuthentic = false;
    if (razorpay_order_id && razorpay_signature) {
      const hmac = createHmac("sha256", secret);
      hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
      const digest = hmac.toString("hex");
      isAuthentic = digest === razorpay_signature;

      if (!isAuthentic) {
        return new Response(
          JSON.stringify({ error: "Invalid payment signature", verified: false }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
    } else {
      isAuthentic = Boolean(razorpay_payment_id && razorpay_payment_id.startsWith("pay_"));
    }

    // Update Supabase Database
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (supabaseUrl && supabaseServiceKey && user_id) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const durationDays = isAnnual ? 365 : 30;
      const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

      await supabase.from("profiles").upsert({
        id: user_id,
        is_premium: true,
        plan_type: plan_id,
        subscription_tier: plan_id,
        activated_at: new Date().toISOString(),
        expires_at: expiresAt,
        updated_at: new Date().toISOString()
      }, { onConflict: "id" });

      await supabase.from("payments").insert({
        user_id,
        razorpay_payment_id,
        razorpay_order_id: razorpay_order_id ?? null,
        razorpay_signature: razorpay_signature ?? null,
        plan_type: plan_id,
        amount,
        duration_days: durationDays,
        currency: "INR",
        status: "captured"
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        verified: true,
        paymentId: razorpay_payment_id
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message, verified: false }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
