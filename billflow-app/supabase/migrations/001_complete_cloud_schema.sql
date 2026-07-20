-- ═══════════════════════════════════════════════════════════════════════════════
-- BILLFLOW SAAS — COMPLETE CLOUD DATABASE SCHEMA & RLS POLICIES
-- Run this script in your Supabase Dashboard (SQL Editor -> New Query -> Run)
-- Safe to run multiple times (idempotent & automatically adds missing columns)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. PROFILES / ADMIN USERS TABLE
-- Stores status, plan, trial expiry, and license information for each owner
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.profiles (
  id                    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                 TEXT UNIQUE,
  full_name             TEXT DEFAULT '',
  business_name         TEXT DEFAULT 'My Business',
  phone                 TEXT DEFAULT '',
  status                TEXT DEFAULT 'trial',
  plan                  TEXT DEFAULT 'standard',
  trial_start_date      DATE DEFAULT CURRENT_DATE,
  trial_end_date        DATE DEFAULT (CURRENT_DATE + INTERVAL '14 days'),
  license_key           TEXT UNIQUE DEFAULT NULL,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all columns exist on profiles if table existed previously
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_name TEXT DEFAULT 'My Business';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'trial';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'standard';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trial_start_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trial_end_date DATE DEFAULT (CURRENT_DATE + INTERVAL '14 days');
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS license_key TEXT DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Ensure profiles is compatible with existing admin_users table if installed together
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, business_name, status, trial_end_date)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'business_name', 'My Business'),
    'trial',
    (CURRENT_DATE + INTERVAL '14 days')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile on sign up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. SETTINGS TABLE
-- Key-value store per business owner (owner_id + key unique)
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.settings (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  key           TEXT,
  value         TEXT DEFAULT '',
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS key TEXT;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS value TEXT DEFAULT '';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

DO $$ BEGIN
  ALTER TABLE public.settings ADD CONSTRAINT unique_owner_setting_key UNIQUE (owner_id, key);
EXCEPTION WHEN OTHERS THEN END $$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. CUSTOMERS TABLE
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.customers (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT,
  email         TEXT DEFAULT '',
  phone         TEXT DEFAULT '',
  state         TEXT DEFAULT '',
  state_code    TEXT DEFAULT '',
  payment_terms TEXT DEFAULT 'due_on_receipt',
  address       TEXT DEFAULT '',
  notes         TEXT DEFAULT '',
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ DEFAULT NULL
);

ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS email TEXT DEFAULT '';
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '';
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS state TEXT DEFAULT '';
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS state_code TEXT DEFAULT '';
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS payment_terms TEXT DEFAULT 'due_on_receipt';
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS address TEXT DEFAULT '';
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_customers_owner ON public.customers(owner_id);
CREATE INDEX IF NOT EXISTS idx_customers_active ON public.customers(owner_id, is_active) WHERE deleted_at IS NULL;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. ITEMS CATALOG TABLE
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.items_catalog (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT,
  description   TEXT,
  hsn_sac       TEXT,
  unit          TEXT DEFAULT 'Nos',
  unit_price    NUMERIC(12,2) DEFAULT 0.00,
  gst_rate      NUMERIC(5,2) DEFAULT 18.00,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ DEFAULT NULL
);

ALTER TABLE public.items_catalog ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.items_catalog ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.items_catalog ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.items_catalog ADD COLUMN IF NOT EXISTS hsn_sac TEXT;
ALTER TABLE public.items_catalog ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'Nos';
ALTER TABLE public.items_catalog ADD COLUMN IF NOT EXISTS unit_price NUMERIC(12,2) DEFAULT 0.00;
ALTER TABLE public.items_catalog ADD COLUMN IF NOT EXISTS gst_rate NUMERIC(5,2) DEFAULT 18.00;
ALTER TABLE public.items_catalog ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE public.items_catalog ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.items_catalog ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.items_catalog ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_items_owner ON public.items_catalog(owner_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. BILLS TABLE (INVOICE HEADERS)
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.bills (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  bill_number   TEXT,
  customer_id   UUID REFERENCES public.customers(id) ON DELETE RESTRICT,
  bill_date     DATE DEFAULT CURRENT_DATE,
  due_date      DATE DEFAULT NULL,
  status        TEXT DEFAULT 'draft',
  grand_total   NUMERIC(12,2) DEFAULT 0.00,
  amount_paid   NUMERIC(12,2) DEFAULT 0.00,
  amount_due    NUMERIC(12,2) DEFAULT 0.00,
  terms         TEXT DEFAULT '',
  notes         TEXT DEFAULT '',
  created_by    TEXT DEFAULT '',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ DEFAULT NULL
);

ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS bill_number TEXT;
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id) ON DELETE RESTRICT;
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS bill_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS due_date DATE DEFAULT NULL;
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS grand_total NUMERIC(12,2) DEFAULT 0.00;
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(12,2) DEFAULT 0.00;
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS amount_due NUMERIC(12,2) DEFAULT 0.00;
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS terms TEXT DEFAULT '';
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS created_by TEXT DEFAULT '';
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

DO $$ BEGIN
  ALTER TABLE public.bills ADD CONSTRAINT unique_owner_bill_number UNIQUE (owner_id, bill_number);
EXCEPTION WHEN OTHERS THEN END $$;

CREATE INDEX IF NOT EXISTS idx_bills_owner ON public.bills(owner_id);
CREATE INDEX IF NOT EXISTS idx_bills_customer ON public.bills(customer_id);
CREATE INDEX IF NOT EXISTS idx_bills_date ON public.bills(owner_id, bill_date DESC);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 6. BILL ITEMS TABLE (LINE ITEMS)
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.bill_items (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  bill_id          UUID REFERENCES public.bills(id) ON DELETE CASCADE,
  sort_order       INTEGER DEFAULT 0,
  catalog_item_id  UUID REFERENCES public.items_catalog(id) ON DELETE SET NULL,
  description      TEXT,
  hsn_sac          TEXT DEFAULT '',
  unit             TEXT DEFAULT 'Nos',
  quantity         NUMERIC(10,3) DEFAULT 1.000,
  unit_price       NUMERIC(12,2) DEFAULT 0.00,
  discount_percent NUMERIC(5,2) DEFAULT 0.00,
  gst_rate         NUMERIC(5,2) DEFAULT 18.00,
  base_amount      NUMERIC(12,2) DEFAULT 0.00,
  discount_amount  NUMERIC(12,2) DEFAULT 0.00,
  taxable_amount   NUMERIC(12,2) DEFAULT 0.00,
  cgst_rate        NUMERIC(5,2) DEFAULT 0.00,
  cgst_amount      NUMERIC(12,2) DEFAULT 0.00,
  sgst_rate        NUMERIC(5,2) DEFAULT 0.00,
  sgst_amount      NUMERIC(12,2) DEFAULT 0.00,
  igst_rate        NUMERIC(5,2) DEFAULT 0.00,
  igst_amount      NUMERIC(12,2) DEFAULT 0.00,
  line_total       NUMERIC(12,2) DEFAULT 0.00,
  is_nil_rated     BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.bill_items ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.bill_items ADD COLUMN IF NOT EXISTS bill_id UUID REFERENCES public.bills(id) ON DELETE CASCADE;
ALTER TABLE public.bill_items ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE public.bill_items ADD COLUMN IF NOT EXISTS catalog_item_id UUID REFERENCES public.items_catalog(id) ON DELETE SET NULL;
ALTER TABLE public.bill_items ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.bill_items ADD COLUMN IF NOT EXISTS hsn_sac TEXT DEFAULT '';
ALTER TABLE public.bill_items ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'Nos';
ALTER TABLE public.bill_items ADD COLUMN IF NOT EXISTS quantity NUMERIC(10,3) DEFAULT 1.000;
ALTER TABLE public.bill_items ADD COLUMN IF NOT EXISTS unit_price NUMERIC(12,2) DEFAULT 0.00;
ALTER TABLE public.bill_items ADD COLUMN IF NOT EXISTS discount_percent NUMERIC(5,2) DEFAULT 0.00;
ALTER TABLE public.bill_items ADD COLUMN IF NOT EXISTS gst_rate NUMERIC(5,2) DEFAULT 18.00;
ALTER TABLE public.bill_items ADD COLUMN IF NOT EXISTS base_amount NUMERIC(12,2) DEFAULT 0.00;
ALTER TABLE public.bill_items ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(12,2) DEFAULT 0.00;
ALTER TABLE public.bill_items ADD COLUMN IF NOT EXISTS taxable_amount NUMERIC(12,2) DEFAULT 0.00;
ALTER TABLE public.bill_items ADD COLUMN IF NOT EXISTS cgst_rate NUMERIC(5,2) DEFAULT 0.00;
ALTER TABLE public.bill_items ADD COLUMN IF NOT EXISTS cgst_amount NUMERIC(12,2) DEFAULT 0.00;
ALTER TABLE public.bill_items ADD COLUMN IF NOT EXISTS sgst_rate NUMERIC(5,2) DEFAULT 0.00;
ALTER TABLE public.bill_items ADD COLUMN IF NOT EXISTS sgst_amount NUMERIC(12,2) DEFAULT 0.00;
ALTER TABLE public.bill_items ADD COLUMN IF NOT EXISTS igst_rate NUMERIC(5,2) DEFAULT 0.00;
ALTER TABLE public.bill_items ADD COLUMN IF NOT EXISTS igst_amount NUMERIC(12,2) DEFAULT 0.00;
ALTER TABLE public.bill_items ADD COLUMN IF NOT EXISTS line_total NUMERIC(12,2) DEFAULT 0.00;
ALTER TABLE public.bill_items ADD COLUMN IF NOT EXISTS is_nil_rated BOOLEAN DEFAULT FALSE;
ALTER TABLE public.bill_items ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_bill_items_bill ON public.bill_items(bill_id);
CREATE INDEX IF NOT EXISTS idx_bill_items_owner ON public.bill_items(owner_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 7. TAX RECORDS TABLE (GST SUMMARIES)
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.tax_records (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  bill_id       UUID REFERENCES public.bills(id) ON DELETE CASCADE,
  bill_date     DATE,
  bill_number   TEXT,
  total_taxable NUMERIC(12,2) DEFAULT 0.00,
  total_cgst    NUMERIC(12,2) DEFAULT 0.00,
  total_sgst    NUMERIC(12,2) DEFAULT 0.00,
  total_igst    NUMERIC(12,2) DEFAULT 0.00,
  total_tax     NUMERIC(12,2) DEFAULT 0.00,
  grand_total   NUMERIC(12,2) DEFAULT 0.00,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.tax_records ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.tax_records ADD COLUMN IF NOT EXISTS bill_id UUID REFERENCES public.bills(id) ON DELETE CASCADE;
ALTER TABLE public.tax_records ADD COLUMN IF NOT EXISTS bill_date DATE;
ALTER TABLE public.tax_records ADD COLUMN IF NOT EXISTS bill_number TEXT;
ALTER TABLE public.tax_records ADD COLUMN IF NOT EXISTS total_taxable NUMERIC(12,2) DEFAULT 0.00;
ALTER TABLE public.tax_records ADD COLUMN IF NOT EXISTS total_cgst NUMERIC(12,2) DEFAULT 0.00;
ALTER TABLE public.tax_records ADD COLUMN IF NOT EXISTS total_sgst NUMERIC(12,2) DEFAULT 0.00;
ALTER TABLE public.tax_records ADD COLUMN IF NOT EXISTS total_igst NUMERIC(12,2) DEFAULT 0.00;
ALTER TABLE public.tax_records ADD COLUMN IF NOT EXISTS total_tax NUMERIC(12,2) DEFAULT 0.00;
ALTER TABLE public.tax_records ADD COLUMN IF NOT EXISTS grand_total NUMERIC(12,2) DEFAULT 0.00;
ALTER TABLE public.tax_records ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.tax_records ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

DO $$ BEGIN
  ALTER TABLE public.tax_records ADD CONSTRAINT unique_tax_record_bill UNIQUE (bill_id);
EXCEPTION WHEN OTHERS THEN END $$;

CREATE INDEX IF NOT EXISTS idx_tax_records_owner ON public.tax_records(owner_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 8. SUPPORT / COMPLAINT TICKETS TABLE
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT,
  phone         TEXT,
  topic         TEXT DEFAULT 'General Query',
  message       TEXT,
  status        TEXT DEFAULT 'open',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS topic TEXT DEFAULT 'General Query';
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open';
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_support_tickets_owner ON public.support_tickets(owner_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 9. COMMUNICATION LOG TABLE (WHATSAPP/EMAIL NOTIFICATIONS)
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.communication_log (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  bill_id       UUID REFERENCES public.bills(id) ON DELETE SET NULL,
  customer_id   UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  channel       TEXT,
  template      TEXT DEFAULT '',
  recipient     TEXT,
  status        TEXT DEFAULT 'sent',
  error_msg     TEXT DEFAULT '',
  sent_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.communication_log ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.communication_log ADD COLUMN IF NOT EXISTS bill_id UUID REFERENCES public.bills(id) ON DELETE SET NULL;
ALTER TABLE public.communication_log ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL;
ALTER TABLE public.communication_log ADD COLUMN IF NOT EXISTS channel TEXT;
ALTER TABLE public.communication_log ADD COLUMN IF NOT EXISTS template TEXT DEFAULT '';
ALTER TABLE public.communication_log ADD COLUMN IF NOT EXISTS recipient TEXT;
ALTER TABLE public.communication_log ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'sent';
ALTER TABLE public.communication_log ADD COLUMN IF NOT EXISTS error_msg TEXT DEFAULT '';
ALTER TABLE public.communication_log ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_comm_log_owner ON public.communication_log(owner_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- AUTO-UPDATE TIMESTAMPS FUNCTION
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_settings_updated_at ON public.settings;
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_customers_updated_at ON public.customers;
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_items_updated_at ON public.items_catalog;
CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON public.items_catalog FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_bills_updated_at ON public.bills;
CREATE TRIGGER update_bills_updated_at BEFORE UPDATE ON public.bills FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_tax_records_updated_at ON public.tax_records;
CREATE TRIGGER update_tax_records_updated_at BEFORE UPDATE ON public.tax_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_support_tickets_updated_at ON public.support_tickets;
CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Each user (owner_id) only sees and modifies their own data
-- Safe: Drops existing policy before creating to prevent duplicate policy errors
-- ═══════════════════════════════════════════════════════════════════════════════
ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items_catalog     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_records       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_log ENABLE ROW LEVEL SECURITY;

-- 1. Profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Settings
DROP POLICY IF EXISTS "Users manage own settings" ON public.settings;
CREATE POLICY "Users manage own settings" ON public.settings FOR ALL USING (auth.uid() = owner_id);

-- 3. Customers
DROP POLICY IF EXISTS "Users manage own customers" ON public.customers;
CREATE POLICY "Users manage own customers" ON public.customers FOR ALL USING (auth.uid() = owner_id);

-- 4. Items Catalog
DROP POLICY IF EXISTS "Users manage own items" ON public.items_catalog;
CREATE POLICY "Users manage own items" ON public.items_catalog FOR ALL USING (auth.uid() = owner_id);

-- 5. Bills
DROP POLICY IF EXISTS "Users manage own bills" ON public.bills;
CREATE POLICY "Users manage own bills" ON public.bills FOR ALL USING (auth.uid() = owner_id);

-- 6. Bill Items
DROP POLICY IF EXISTS "Users manage own bill items" ON public.bill_items;
CREATE POLICY "Users manage own bill items" ON public.bill_items FOR ALL USING (auth.uid() = owner_id);

-- 7. Tax Records
DROP POLICY IF EXISTS "Users manage own tax records" ON public.tax_records;
CREATE POLICY "Users manage own tax records" ON public.tax_records FOR ALL USING (auth.uid() = owner_id);

-- 8. Support Tickets
DROP POLICY IF EXISTS "Users manage own support tickets" ON public.support_tickets;
CREATE POLICY "Users manage own support tickets" ON public.support_tickets FOR ALL USING (auth.uid() = owner_id);

-- 9. Communication Log
DROP POLICY IF EXISTS "Users manage own communication log" ON public.communication_log;
CREATE POLICY "Users manage own communication log" ON public.communication_log FOR ALL USING (auth.uid() = owner_id);
