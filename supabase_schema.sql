-- ==============================================================================
-- COUNCIL X | THE SYNDICATE - SUPABASE POSTGRESQL SCHEMA
-- 216 Supreme Masterminds (108 Bharat Vishwaguru + 108 Modern Global)
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS & PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY, -- Can be device UUID or Supabase Auth User UUID
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    is_premium BOOLEAN DEFAULT FALSE,
    message_count INTEGER DEFAULT 0,
    bonus_messages INTEGER DEFAULT 0, -- Bonus from promotional/referral code (+15 for user, +30 for referrer)
    base_free_limit INTEGER DEFAULT 5, -- Default 5 free messages
    referral_code TEXT UNIQUE, -- e.g. CX-78A9
    referred_by TEXT, -- Referral code used by this user (redeemable once)
    subscription_tier TEXT DEFAULT 'initiate', -- 'initiate', '1_month_pro', '6_month_pro', '1_year_pro'
    plan_type TEXT, -- '1_month' (30d), '6_month' (180d), '1_year' (365d)
    activated_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 216 MASTERMIND AGENTS TABLE
CREATE TABLE IF NOT EXISTS public.agents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL, -- 'Rajniti & Statecraft (રાજનીતિ)', 'Wealth & Finance', 'Business & Startup', 'War & Strategy', 'Medicine & Ayurveda (આયુર્વેદ અને મેડિકલ)', 'Tech & Science', 'Marketing & Psychology', 'Philosophy & Dharma'
    era TEXT NOT NULL, -- 'Bharat Vishwaguru (108 Legends)' or 'Modern Visionaries (108 Global)'
    country_region TEXT NOT NULL DEFAULT 'India',
    avatar_url TEXT NOT NULL,
    wiki_slug TEXT, -- Official Wikipedia slug for 100% real Wikipedia photo resolution
    bio TEXT NOT NULL,
    core_philosophy TEXT NOT NULL,
    published_works TEXT[] DEFAULT '{}',
    mental_models TEXT[] DEFAULT '{}',
    sample_questions TEXT[] DEFAULT '{}',
    system_prompt TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CONVERSATIONS TABLE
CREATE TABLE IF NOT EXISTS public.conversations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    agent_id TEXT, -- NULL if 216 Supreme Council mode
    mode TEXT DEFAULT 'single_agent', -- 'single_agent', 'supreme_council_216'
    title TEXT NOT NULL,
    preview TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL, -- 'user', 'assistant', 'system'
    content TEXT NOT NULL,
    agent_id TEXT,
    agent_name TEXT,
    agent_avatar TEXT,
    follow_up_questions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. RAZORPAY PAYMENTS & SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    razorpay_payment_id TEXT UNIQUE,
    razorpay_order_id TEXT,
    razorpay_signature TEXT,
    plan_type TEXT NOT NULL, -- '1_month', '6_month', '1_year'
    amount NUMERIC NOT NULL, -- 499, 1999, 3499
    currency TEXT DEFAULT 'INR',
    status TEXT NOT NULL, -- 'captured', 'failed', 'refunded'
    duration_days INTEGER NOT NULL, -- 30, 180, 365
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. INDEXES FOR ULTRA-FAST QUERYING
CREATE INDEX IF NOT EXISTS idx_agents_category ON public.agents(category);
CREATE INDEX IF NOT EXISTS idx_agents_era ON public.agents(era);
CREATE INDEX IF NOT EXISTS idx_conversations_user ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conv ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_profiles_ref_code ON public.profiles(referral_code);

-- 7. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read agents" ON public.agents FOR SELECT USING (true);
CREATE POLICY "Public access profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access conversations" ON public.conversations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access messages" ON public.messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access payments" ON public.payments FOR ALL USING (true) WITH CHECK (true);

-- 8. CUSTOM MASTERMIND AGENTS TABLE
CREATE TABLE IF NOT EXISTS public.custom_agents (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT,
    category TEXT,
    era TEXT DEFAULT 'Custom Mastermind',
    image_url TEXT,
    core_philosophy TEXT,
    wikipedia_extract TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_custom_agents_user ON public.custom_agents(user_id);
ALTER TABLE public.custom_agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access custom_agents" ON public.custom_agents FOR ALL USING (true) WITH CHECK (true);

