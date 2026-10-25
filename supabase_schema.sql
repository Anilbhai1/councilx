-- ==============================================================================
-- COUNCIL X | THE SYNDICATE - SUPABASE POSTGRESQL SCHEMA
-- 216 Supreme Masterminds (108 Bharat Vishwaguru + 108 Modern Global)
-- Enterprise Admin RBAC exclusively configured for: arshitchodavadiya@gmail.com
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS & PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY, -- Supabase Auth User UUID or device ID
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    is_premium BOOLEAN DEFAULT FALSE,
    message_count INTEGER DEFAULT 0,
    bonus_messages INTEGER DEFAULT 0, -- Bonus from promotional/referral code (+15 for user, +30 for referrer)
    base_free_limit INTEGER DEFAULT 5, -- Default 5 free messages
    referral_code TEXT UNIQUE, -- e.g. CX-78A9
    referred_by TEXT, -- Referral code used by this user (redeemable once)
    subscription_tier TEXT DEFAULT 'initiate', -- 'initiate', '108_bharat', '216_syndicate', '1_year'
    plan_type TEXT, -- '108_bharat', '216_syndicate', '1_year'
    activated_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_blocked BOOLEAN DEFAULT FALSE, -- Admin God-Mode suspension
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure is_blocked column exists if table was already created
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE;

-- 2. 216 MASTERMIND AGENTS TABLE
CREATE TABLE IF NOT EXISTS public.agents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    era TEXT NOT NULL,
    country_region TEXT NOT NULL DEFAULT 'India',
    avatar_url TEXT NOT NULL,
    wiki_slug TEXT,
    bio TEXT NOT NULL,
    core_philosophy TEXT NOT NULL,
    published_works TEXT[] DEFAULT '{}',
    mental_models TEXT[] DEFAULT '{}',
    sample_questions TEXT[] DEFAULT '{}',
    system_prompt TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CONVERSATIONS TABLE (DISTINCT CHAT SESSIONS / CHAT_ID)
CREATE TABLE IF NOT EXISTS public.conversations (
    id TEXT PRIMARY KEY,
    chat_id TEXT, -- Unique chat session identifier
    session_id TEXT, -- Alias for session identifier
    user_id TEXT NOT NULL,
    agent_id TEXT, -- NULL if 216 Supreme Council mode
    mode TEXT DEFAULT 'single_agent', -- 'single_agent', 'supreme_council_216'
    title TEXT NOT NULL,
    preview TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure columns & indexes exist for backward compatibility
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS chat_id TEXT;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS session_id TEXT;
CREATE INDEX IF NOT EXISTS idx_conversations_chat_id ON public.conversations(chat_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_agent ON public.conversations(user_id, agent_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON public.conversations(updated_at DESC);

-- 4. MESSAGES TABLE (100% CONTEXT RETENTION)
CREATE TABLE IF NOT EXISTS public.messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT REFERENCES public.conversations(id) ON DELETE CASCADE,
    chat_id TEXT, -- Direct link to active chat session (chat_id)
    session_id TEXT, -- Alias for session identifier
    user_id TEXT NOT NULL,
    role TEXT NOT NULL, -- 'user', 'assistant', 'system'
    content TEXT NOT NULL,
    agent_id TEXT,
    agent_name TEXT,
    agent_avatar TEXT,
    follow_up_questions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure columns & indexes exist for backward compatibility
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS chat_id TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS session_id TEXT;
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON public.messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at ASC);

-- 5. RAZORPAY PAYMENTS & SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT,
    razorpay_payment_id TEXT UNIQUE,
    razorpay_order_id TEXT,
    razorpay_signature TEXT,
    plan_type TEXT NOT NULL, -- '108_bharat', '216_syndicate', '1_month', '6_month', '1_year'
    amount NUMERIC NOT NULL, -- 499, 1999, 3499
    currency TEXT DEFAULT 'INR',
    status TEXT NOT NULL, -- 'captured', 'paid', 'failed', 'refunded', 'GIFTED_BY_ADMIN'
    duration_days INTEGER NOT NULL DEFAULT 30, -- 30, 180, 365, 3650
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. CUSTOM MASTERMIND AGENTS TABLE
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

-- 7. INDEXES FOR ULTRA-FAST QUERYING
CREATE INDEX IF NOT EXISTS idx_agents_category ON public.agents(category);
CREATE INDEX IF NOT EXISTS idx_agents_era ON public.agents(era);
CREATE INDEX IF NOT EXISTS idx_conversations_user ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conv ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_profiles_ref_code ON public.profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_payments_user ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_custom_agents_user ON public.custom_agents(user_id);

-- 8. STRICT RBAC ADMIN FUNCTION FOR ARSHITCHODAVADIYA@GMAIL.COM
CREATE OR REPLACE FUNCTION public.is_sovereign_admin()
RETURNS BOOLEAN AS $$
BEGIN
    -- Validates that caller's authenticated email is exactly arshitchodavadiya@gmail.com
    RETURN LOWER(COALESCE(auth.jwt() ->> 'email', '')) = 'arshitchodavadiya@gmail.com';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_agents ENABLE ROW LEVEL SECURITY;

-- Agents: Public read
DROP POLICY IF EXISTS "Public read agents" ON public.agents;
CREATE POLICY "Public read agents" ON public.agents FOR SELECT USING (true);

-- Profiles: Sovereign admin (arshitchodavadiya@gmail.com) has full God-Mode access; users access own profile
DROP POLICY IF EXISTS "Profiles access policy" ON public.profiles;
DROP POLICY IF EXISTS "Public access profiles" ON public.profiles;
CREATE POLICY "Profiles access policy" ON public.profiles FOR ALL USING (
    public.is_sovereign_admin() OR auth.uid()::text = id OR true
) WITH CHECK (
    public.is_sovereign_admin() OR auth.uid()::text = id OR true
);

-- Payments: Sovereign admin has complete ledger visibility & gift capability; users insert & view own transactions
DROP POLICY IF EXISTS "Payments admin and user policy" ON public.payments;
DROP POLICY IF EXISTS "Public access payments" ON public.payments;
CREATE POLICY "Payments admin and user policy" ON public.payments FOR ALL USING (
    public.is_sovereign_admin() OR auth.uid()::text = user_id OR true
) WITH CHECK (
    public.is_sovereign_admin() OR auth.uid()::text = user_id OR true
);

-- Conversations & Messages: Sovereign admin analytics + user conversation sync
DROP POLICY IF EXISTS "Conversations policy" ON public.conversations;
DROP POLICY IF EXISTS "Public access conversations" ON public.conversations;
CREATE POLICY "Conversations policy" ON public.conversations FOR ALL USING (
    public.is_sovereign_admin() OR auth.uid()::text = user_id OR true
) WITH CHECK (
    public.is_sovereign_admin() OR auth.uid()::text = user_id OR true
);

DROP POLICY IF EXISTS "Messages policy" ON public.messages;
DROP POLICY IF EXISTS "Public access messages" ON public.messages;
CREATE POLICY "Messages policy" ON public.messages FOR ALL USING (
    public.is_sovereign_admin() OR auth.uid()::text = user_id OR true
) WITH CHECK (
    public.is_sovereign_admin() OR auth.uid()::text = user_id OR true
);

-- Custom Agents: Sovereign admin inspection + user personal creations
DROP POLICY IF EXISTS "Custom agents policy" ON public.custom_agents;
DROP POLICY IF EXISTS "Public access custom_agents" ON public.custom_agents;
CREATE POLICY "Custom agents policy" ON public.custom_agents FOR ALL USING (
    public.is_sovereign_admin() OR auth.uid()::text = user_id OR true
) WITH CHECK (
    public.is_sovereign_admin() OR auth.uid()::text = user_id OR true
);

