-- ═══════════════════════════════════════════════════
-- ADMIN USERS TABLE
-- One row per BillFlow customer (your paying customers)
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.admin_users (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  full_name             TEXT NOT NULL,
  business_name         TEXT NOT NULL,
  email                 TEXT NOT NULL UNIQUE,
  phone                 TEXT DEFAULT '',
  gstin                 TEXT DEFAULT '',
  city                  TEXT DEFAULT '',
  state                 TEXT DEFAULT '',

  -- Account status
  status                TEXT NOT NULL DEFAULT 'trial'
                          CHECK(status IN ('trial','active','suspended','cancelled','expired')),
  plan                  TEXT NOT NULL DEFAULT 'starter'
                          CHECK(plan IN ('starter','professional','enterprise')),

  -- Trial info
  trial_start_date      DATE,
  trial_end_date        DATE,
  trial_days            INTEGER DEFAULT 14,
  converted_from_trial  BOOLEAN DEFAULT FALSE,

  -- Billing
  billing_cycle         TEXT DEFAULT 'monthly'
                          CHECK(billing_cycle IN ('monthly','quarterly','yearly')),
  plan_price            NUMERIC(10,2) DEFAULT 0,
  next_billing_date     DATE,
  last_payment_date     DATE,
  last_payment_amount   NUMERIC(10,2) DEFAULT 0,
  total_paid            NUMERIC(12,2) DEFAULT 0,
  payment_method        TEXT DEFAULT 'bank_transfer'
                          CHECK(payment_method IN ('bank_transfer','upi','cheque','cash','razorpay','other')),

  -- Their BillFlow config (what you set up for them)
  their_supabase_url    TEXT DEFAULT '',
  their_supabase_key    TEXT DEFAULT '',
  their_n8n_url         TEXT DEFAULT '',
  their_n8n_secret      TEXT DEFAULT '',
  license_key           TEXT UNIQUE DEFAULT NULL,
  app_version           TEXT DEFAULT '1.0.0',

  -- Internal admin notes
  notes                 TEXT DEFAULT '',
  referral_source       TEXT DEFAULT '',
  assigned_to           TEXT DEFAULT '',    -- admin staff name if team

  -- Timestamps
  onboarded_at          TIMESTAMPTZ DEFAULT NOW(),
  activated_at          TIMESTAMPTZ,
  suspended_at          TIMESTAMPTZ,
  cancelled_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_users_status ON public.admin_users(status);
CREATE INDEX IF NOT EXISTS idx_admin_users_email  ON public.admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_plan   ON public.admin_users(plan);
CREATE INDEX IF NOT EXISTS idx_admin_users_next_billing ON public.admin_users(next_billing_date);
CREATE INDEX IF NOT EXISTS idx_admin_users_trial_end    ON public.admin_users(trial_end_date);

-- ═══════════════════════════════════════════════════
-- PAYMENT HISTORY
-- Every payment ever received from every customer
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.admin_payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.admin_users(id) ON DELETE CASCADE,

  amount          NUMERIC(10,2) NOT NULL,
  currency        TEXT DEFAULT 'INR',
  payment_date    DATE NOT NULL,
  payment_method  TEXT DEFAULT 'bank_transfer',
  reference       TEXT DEFAULT '',       -- UTR number / cheque number / UPI ref
  period_from     DATE,
  period_to       DATE,
  plan            TEXT,
  status          TEXT DEFAULT 'received'
                    CHECK(status IN ('received','pending','failed','refunded')),
  invoice_number  TEXT DEFAULT '',
  notes           TEXT DEFAULT '',

  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_user    ON public.admin_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_date    ON public.admin_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_status  ON public.admin_payments(status);

-- ═══════════════════════════════════════════════════
-- ACTIVITY LOG
-- Everything that happens to a user account
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.admin_activity_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES public.admin_users(id) ON DELETE CASCADE,
  action      TEXT NOT NULL,
  description TEXT DEFAULT '',
  metadata    JSONB DEFAULT '{}',
  performed_by TEXT DEFAULT 'system',   -- 'system', 'admin', or admin staff name
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_actlog_user    ON public.admin_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_actlog_created ON public.admin_activity_log(created_at DESC);

-- ═══════════════════════════════════════════════════
-- SUPPORT NOTES
-- Internal notes about a customer
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.admin_support_notes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.admin_users(id) ON DELETE CASCADE,
  note        TEXT NOT NULL,
  category    TEXT DEFAULT 'general'
                CHECK(category IN ('general','billing','technical','sales','complaint')),
  created_by  TEXT DEFAULT 'admin',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notes_user ON public.admin_support_notes(user_id);

-- ═══════════════════════════════════════════════════
-- PLAN CONFIGURATIONS
-- Defines what each plan includes
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.admin_plans (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL UNIQUE,
  display_name        TEXT NOT NULL,
  monthly_price       NUMERIC(10,2) NOT NULL DEFAULT 0,
  quarterly_price     NUMERIC(10,2) DEFAULT 0,
  yearly_price        NUMERIC(10,2) DEFAULT 0,
  max_bills_per_month INTEGER DEFAULT 100,
  max_customers       INTEGER DEFAULT 500,
  whatsapp_enabled    BOOLEAN DEFAULT FALSE,
  sms_enabled         BOOLEAN DEFAULT FALSE,
  multi_user          BOOLEAN DEFAULT FALSE,
  priority_support    BOOLEAN DEFAULT FALSE,
  is_active           BOOLEAN DEFAULT TRUE,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default plans
INSERT INTO public.admin_plans
  (name, display_name, monthly_price, quarterly_price, yearly_price,
   max_bills_per_month, max_customers, whatsapp_enabled, sms_enabled, multi_user)
VALUES
  ('starter',      'Starter',      499,   1299,  4799,   50,   100, FALSE, FALSE, FALSE),
  ('professional', 'Professional', 999,   2599,  9599,  500,  1000, TRUE,  FALSE, FALSE),
  ('enterprise',   'Enterprise',  1999,  5199, 19199, 99999, 99999, TRUE,  TRUE,  TRUE)
ON CONFLICT(name) DO NOTHING;

-- ═══════════════════════════════════════════════════
-- AUTO-UPDATE TIMESTAMPS
-- ═══════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION update_admin_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_admin_users_upd
  BEFORE UPDATE ON public.admin_users
  FOR EACH ROW EXECUTE FUNCTION update_admin_updated_at();

-- ═══════════════════════════════════════════════════
-- RLS — only the admin Supabase account can access
-- ═══════════════════════════════════════════════════
ALTER TABLE public.admin_users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_payments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_log  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_support_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_plans         ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view their own profile details
CREATE POLICY "Users can view their own profile"
  ON public.admin_users
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'email' = email);

-- ═══════════════════════════════════════════════════
-- SEED DEFAULT ADMIN USER
-- ═══════════════════════════════════════════════════
INSERT INTO public.admin_users (full_name, business_name, email, status)
VALUES ('Gopesh Kachhadiya', 'BillFlow Admin', 'gopeshkachhadiya00005@gmail.com', 'active')
ON CONFLICT (email) DO NOTHING;

-- Note: To sign in, you must also create this account in Supabase Auth (auth.users).
-- This can be done via: Supabase Dashboard -> Authentication -> Users -> Add User (Email: gopeshkachhadiya00005@gmail.com, Password: Gopesh@007)

