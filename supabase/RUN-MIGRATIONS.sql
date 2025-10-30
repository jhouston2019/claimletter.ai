-- ========================================
-- Claim Letter Help - Complete Database Setup
-- Run this ENTIRE file in Supabase SQL Editor
-- ========================================

-- 1. Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 2. Create tlh_letters table (used by analyze-letter, webhook, admin, export-pdf)
CREATE TABLE IF NOT EXISTS public.tlh_letters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  user_email text,
  stripe_session_id text,
  stripe_payment_status text CHECK (stripe_payment_status IN ('unpaid','paid','refunded')) DEFAULT 'unpaid',
  price_id text,
  letter_text text,
  analysis jsonb,           -- structured analysis from AI
  summary text,             -- plain text summary
  ai_response text,         -- final response letter
  status text CHECK (status IN ('uploaded','analyzed','responded','error')) DEFAULT 'uploaded'
);

-- 3. Create cla_letters table (used by send-email, generate-response)
CREATE TABLE IF NOT EXISTS public.cla_letters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  user_email text,
  stripe_session_id text,
  stripe_payment_status text CHECK (stripe_payment_status IN ('unpaid','paid','refunded')) DEFAULT 'unpaid',
  price_id text,
  letter_text text,
  analysis jsonb,
  summary text,
  ai_response text,
  status text CHECK (status IN ('uploaded','analyzed','responded','error')) DEFAULT 'uploaded'
);

-- 4. Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan_type text NOT NULL, -- 'STANDARD', 'COMPLEX', 'STARTER', 'PRO', 'PROPLUS', 'FREE'
  status text NOT NULL, -- 'active', 'canceled', 'past_due', 'incomplete'
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 5. Create usage_tracking table
CREATE TABLE IF NOT EXISTS public.usage_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES subscriptions(id) ON DELETE CASCADE,
  action_type text NOT NULL, -- 'letter_analysis', 'response_generation', 'download'
  document_id uuid, -- reference to letters table
  created_at timestamptz DEFAULT now()
);

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tlh_letters_created_at ON public.tlh_letters (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tlh_letters_session ON public.tlh_letters (stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_cla_letters_created_at ON public.cla_letters (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cla_letters_session ON public.cla_letters (stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON public.subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_id ON public.usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_created_at ON public.usage_tracking(created_at);

-- 7. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tlh_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cla_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies for tlh_letters
-- Deny all by default - only service role (server) can access
CREATE POLICY IF NOT EXISTS "deny_all_tlh_letters" ON public.tlh_letters
  AS PERMISSIVE FOR ALL
  TO public
  USING (false)
  WITH CHECK (false);

-- 9. RLS Policies for cla_letters  
-- Deny all by default - only service role (server) can access
CREATE POLICY IF NOT EXISTS "deny_all_cla_letters" ON public.cla_letters
  AS PERMISSIVE FOR ALL
  TO public
  USING (false)
  WITH CHECK (false);

-- 10. RLS Policies for users (optional - if you want users to access their own records)
CREATE POLICY IF NOT EXISTS "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 11. RLS Policies for subscriptions
CREATE POLICY IF NOT EXISTS "Users can view own subscriptions" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- 12. RLS Policies for usage_tracking
CREATE POLICY IF NOT EXISTS "Users can view own usage" ON public.usage_tracking
  FOR SELECT USING (auth.uid() = user_id);

-- 13. Function to update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 14. Trigger for subscriptions updated_at
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========================================
-- Migration Complete!
-- ========================================
-- Verify tables were created:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- ORDER BY table_name;

