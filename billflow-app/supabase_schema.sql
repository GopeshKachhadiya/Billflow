-- Supabase Database Schema for BillFlow
-- Copy and paste this into the Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create tables in public schema

-- profiles (User profiles, mapping to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    business_name TEXT,
    gstin TEXT,
    business_address TEXT,
    business_city TEXT,
    business_state TEXT,
    business_state_code TEXT,
    business_pin TEXT,
    pan TEXT,
    bank_name TEXT,
    bank_account TEXT,
    bank_ifsc TEXT,
    encryption_salt TEXT, -- Used for PBKDF2 key derivation for E2EE
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- customers table
CREATE TABLE IF NOT EXISTS public.customers (
    id TEXT PRIMARY KEY,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    state TEXT,
    state_code TEXT,
    address TEXT,
    city TEXT,
    pin TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    encrypted_data TEXT,
    enc_iv TEXT,
    enc_auth_tag TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- items_catalog table
CREATE TABLE IF NOT EXISTS public.items_catalog (
    id TEXT PRIMARY KEY,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    hsn_sac TEXT,
    gst_rate DOUBLE PRECISION DEFAULT 18.0,
    is_active BOOLEAN DEFAULT TRUE,
    encrypted_data TEXT,
    enc_iv TEXT,
    enc_auth_tag TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- bills table
CREATE TABLE IF NOT EXISTS public.bills (
    id TEXT PRIMARY KEY,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    bill_number TEXT UNIQUE NOT NULL,
    customer_id TEXT REFERENCES public.customers(id) ON DELETE RESTRICT,
    bill_date DATE NOT NULL,
    due_date DATE,
    status TEXT DEFAULT 'draft',
    grand_total DOUBLE PRECISION DEFAULT 0.00,
    amount_paid DOUBLE PRECISION DEFAULT 0.00,
    amount_due DOUBLE PRECISION DEFAULT 0.00,
    total_cgst DOUBLE PRECISION DEFAULT 0.00,
    total_sgst DOUBLE PRECISION DEFAULT 0.00,
    total_igst DOUBLE PRECISION DEFAULT 0.00,
    supply_type TEXT,
    place_of_supply TEXT,
    overdue_since DATE DEFAULT NULL,
    escalated BOOLEAN DEFAULT FALSE,
    escalation_date DATE DEFAULT NULL,
    encrypted_data TEXT,
    enc_iv TEXT,
    enc_auth_tag TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- bill_items table
CREATE TABLE IF NOT EXISTS public.bill_items (
    id TEXT PRIMARY KEY,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    bill_id TEXT REFERENCES public.bills(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    catalog_item_id TEXT REFERENCES public.items_catalog(id) ON DELETE SET NULL,
    description TEXT,
    hsn_sac TEXT,
    unit TEXT DEFAULT 'Nos',
    quantity DOUBLE PRECISION DEFAULT 1.0,
    unit_price DOUBLE PRECISION DEFAULT 0.00,
    discount_percent DOUBLE PRECISION DEFAULT 0.0,
    gst_rate DOUBLE PRECISION DEFAULT 18.0,
    base_amount DOUBLE PRECISION DEFAULT 0.00,
    discount_amount DOUBLE PRECISION DEFAULT 0.00,
    taxable_amount DOUBLE PRECISION DEFAULT 0.00,
    cgst_rate DOUBLE PRECISION DEFAULT 9.0,
    cgst_amount DOUBLE PRECISION DEFAULT 0.00,
    sgst_rate DOUBLE PRECISION DEFAULT 9.0,
    sgst_amount DOUBLE PRECISION DEFAULT 0.00,
    igst_rate DOUBLE PRECISION DEFAULT 0.0,
    igst_amount DOUBLE PRECISION DEFAULT 0.00,
    line_total DOUBLE PRECISION DEFAULT 0.00,
    is_nil_rated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- tax_records table
CREATE TABLE IF NOT EXISTS public.tax_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    bill_id TEXT REFERENCES public.bills(id) ON DELETE CASCADE,
    bill_date DATE,
    supply_type TEXT,
    total_cgst DOUBLE PRECISION DEFAULT 0.00,
    total_sgst DOUBLE PRECISION DEFAULT 0.00,
    total_igst DOUBLE PRECISION DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- payment_log table
CREATE TABLE IF NOT EXISTS public.payment_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    bill_id TEXT REFERENCES public.bills(id) ON DELETE CASCADE,
    amount_paid DOUBLE PRECISION NOT NULL,
    payment_date DATE NOT NULL,
    payment_method TEXT,
    payment_reference TEXT,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- communication_log table
CREATE TABLE IF NOT EXISTS public.communication_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    bill_id TEXT REFERENCES public.bills(id) ON DELETE SET NULL,
    customer_id TEXT REFERENCES public.customers(id) ON DELETE SET NULL,
    channel TEXT NOT NULL CHECK(channel IN ('email','whatsapp','sms')),
    template TEXT,
    recipient TEXT,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'sent',
    error_msg TEXT
);

-- report_log table
CREATE TABLE IF NOT EXISTS public.report_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    report_type TEXT NOT NULL,
    period TEXT NOT NULL,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    total_tax DOUBLE PRECISION DEFAULT 0.00,
    record_count INTEGER DEFAULT 0
);

-- sync_events table
CREATE TABLE IF NOT EXISTS public.sync_events (
    id SERIAL PRIMARY KEY,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    payload JSONB,
    operation TEXT,
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable Row Level Security (RLS) on all public tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_events ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies to isolate tenant data

-- Profiles Policies
DROP POLICY IF EXISTS "Users can view and edit their own profile" ON public.profiles;
CREATE POLICY "Users can view and edit their own profile" ON public.profiles
    FOR ALL USING (auth.uid() = id);

-- Customers Policies
DROP POLICY IF EXISTS "Users can manage their own customers" ON public.customers;
CREATE POLICY "Users can manage their own customers" ON public.customers
    FOR ALL USING (auth.uid() = owner_id);

-- Items Catalog Policies
DROP POLICY IF EXISTS "Users can manage their own items" ON public.items_catalog;
CREATE POLICY "Users can manage their own items" ON public.items_catalog
    FOR ALL USING (auth.uid() = owner_id);

-- Bills Policies
DROP POLICY IF EXISTS "Users can manage their own bills" ON public.bills;
CREATE POLICY "Users can manage their own bills" ON public.bills
    FOR ALL USING (auth.uid() = owner_id);

-- Bill Items Policies
DROP POLICY IF EXISTS "Users can manage their own bill items" ON public.bill_items;
CREATE POLICY "Users can manage their own bill items" ON public.bill_items
    FOR ALL USING (auth.uid() = owner_id);

-- Tax Records Policies
DROP POLICY IF EXISTS "Users can manage their own tax records" ON public.tax_records;
CREATE POLICY "Users can manage their own tax records" ON public.tax_records
    FOR ALL USING (auth.uid() = owner_id);

-- Payment Log Policies
DROP POLICY IF EXISTS "Users can manage their own payment log" ON public.payment_log;
CREATE POLICY "Users can manage their own payment log" ON public.payment_log
    FOR ALL USING (auth.uid() = owner_id);

-- Communication Log Policies
DROP POLICY IF EXISTS "Users can manage their own communication logs" ON public.communication_log;
CREATE POLICY "Users can manage their own communication logs" ON public.communication_log
    FOR ALL USING (auth.uid() = owner_id);

-- Report Log Policies
DROP POLICY IF EXISTS "Users can manage their own report logs" ON public.report_log;
CREATE POLICY "Users can manage their own report logs" ON public.report_log
    FOR ALL USING (auth.uid() = owner_id);

-- Sync Events Policies
DROP POLICY IF EXISTS "Users can manage their own sync events" ON public.sync_events;
CREATE POLICY "Users can manage their own sync events" ON public.sync_events
    FOR ALL USING (auth.uid() = owner_id);

-- 5. Trigger to automatically create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id)
    VALUES (new.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Revoke execute from public/authenticated/anon to secure security definer function
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ═══════════════════════════════════════════════════
-- 6. Shared GSTIN Cache
-- ═══════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.gstin_cache (
    gstin TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'Business',
    state TEXT,
    state_code TEXT,
    billing_address TEXT,
    billing_city TEXT,
    billing_pin TEXT,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.gstin_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select for authenticated users" ON public.gstin_cache;
CREATE POLICY "Allow select for authenticated users" ON public.gstin_cache
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.gstin_cache;
CREATE POLICY "Allow insert for authenticated users" ON public.gstin_cache
    FOR INSERT TO authenticated WITH CHECK (true);

-- SEC-05 FIX: Remove UPDATE policy for regular users to prevent cache poisoning.
-- Only the service_role key (used by Edge Functions / admin) should update GSTIN cache records.
-- If a record needs updating, it should be done server-side or via admin tools.

-- ═══════════════════════════════════════════════════
-- 7. Support Tickets Table
-- ═══════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,  -- SEC-04 FIX: Track ticket creator
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    topic TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'Open',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- SEC-04 FIX: Users can only read their OWN tickets (not all users' tickets).
-- Admin reads via service_role key which bypasses RLS.
DROP POLICY IF EXISTS "Allow select for authenticated users" ON public.support_tickets;
CREATE POLICY "Users can view their own tickets" ON public.support_tickets
    FOR SELECT TO authenticated USING (auth.uid() = owner_id);

-- Allow anyone (including unauthenticated support chatbot) to create tickets
DROP POLICY IF EXISTS "Allow insert for anyone" ON public.support_tickets;
CREATE POLICY "Allow insert for anyone" ON public.support_tickets
    FOR INSERT TO anon, authenticated WITH CHECK (true);

-- ═══════════════════════════════════════════════════
-- 8. Missing Schema Fixes & Extra Tables
-- ═══════════════════════════════════════════════════

-- Add missing columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'trial';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trial_end_date DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS license_key TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Add missing columns to customers
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS payment_terms TEXT DEFAULT 'due_on_receipt';
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add missing columns to bills
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS terms TEXT;
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS order_number TEXT;
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS order_date DATE;
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS created_by TEXT;

-- Expenses table
CREATE TABLE IF NOT EXISTS public.expenses (
    id TEXT PRIMARY KEY,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    category TEXT DEFAULT 'General',
    vendor_name TEXT,
    amount DOUBLE PRECISION DEFAULT 0.00,
    gst_amount DOUBLE PRECISION DEFAULT 0.00,
    bill_date DATE,
    receipt_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ DEFAULT NULL
);
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own expenses" ON public.expenses;
CREATE POLICY "Users can manage their own expenses" ON public.expenses
    FOR ALL USING (auth.uid() = owner_id);

-- Settings table
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    value TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(owner_id, key)
);
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own settings" ON public.settings;
CREATE POLICY "Users can manage their own settings" ON public.settings
    FOR ALL USING (auth.uid() = owner_id);

-- Password OTP resets table
CREATE TABLE IF NOT EXISTS public.password_otp_resets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    otp_code TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.password_otp_resets ENABLE ROW LEVEL SECURITY;

-- SEC-03 FIX: CRITICAL — The old policy was `FOR ALL USING (true)` which allowed
-- ANY anonymous user to READ all OTP codes and take over ANY account.
-- New policy: Only INSERT is allowed from the authenticated client.
-- OTP verification MUST happen server-side (via Supabase Edge Function or service_role).
-- No SELECT, UPDATE, or DELETE is exposed to client-side at all.
DROP POLICY IF EXISTS "Allow anon and auth to insert/select password_otp_resets" ON public.password_otp_resets;
DROP POLICY IF EXISTS "Allow authenticated insert for OTP creation" ON public.password_otp_resets;
CREATE POLICY "Allow authenticated insert for OTP creation" ON public.password_otp_resets
    FOR INSERT TO authenticated WITH CHECK (true);

-- Server-side verification function (called via RPC, runs with SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.verify_password_otp(p_email TEXT, p_otp TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_found BOOLEAN := FALSE;
BEGIN
  -- Check for valid, non-expired, non-verified OTP
  UPDATE public.password_otp_resets
  SET verified = TRUE
  WHERE email = LOWER(TRIM(p_email))
    AND otp_code = p_otp
    AND verified = FALSE
    AND expires_at > NOW()
  RETURNING TRUE INTO v_found;

  RETURN COALESCE(v_found, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Secure the function: only authenticated users can call it
REVOKE EXECUTE ON FUNCTION public.verify_password_otp(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_password_otp(TEXT, TEXT) TO authenticated;

-- Credit / Debit Notes Table (GST Compliance)
CREATE TABLE IF NOT EXISTS public.credit_notes (
    id TEXT PRIMARY KEY,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    note_number TEXT NOT NULL,
    note_type TEXT DEFAULT 'credit',
    bill_id TEXT REFERENCES public.bills(id) ON DELETE SET NULL,
    customer_id TEXT REFERENCES public.customers(id) ON DELETE SET NULL,
    note_date DATE NOT NULL,
    amount DOUBLE PRECISION DEFAULT 0.00,
    gst_amount DOUBLE PRECISION DEFAULT 0.00,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ DEFAULT NULL
);
ALTER TABLE public.credit_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own credit notes" ON public.credit_notes;
CREATE POLICY "Users can manage their own credit notes" ON public.credit_notes
    FOR ALL USING (auth.uid() = owner_id);

-- ═══════════════════════════════════════════════════
-- 9. Universal Incoming Bills Inbox Table
-- ═══════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.inbox_bills (
    id TEXT PRIMARY KEY,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    sender_name TEXT NOT NULL,
    sender_email TEXT,
    sender_phone TEXT,
    sender_gstin TEXT,
    bill_number TEXT NOT NULL,
    bill_date DATE,
    due_date DATE,
    amount DOUBLE PRECISION DEFAULT 0.00,
    tax_amount DOUBLE PRECISION DEFAULT 0.00,
    pdf_url TEXT,
    pdf_base64 TEXT,
    status TEXT DEFAULT 'unread', -- 'unread', 'read', 'accepted', 'rejected', 'converted_expense'
    source TEXT DEFAULT 'manual', -- 'email', 'whatsapp', 'webhook', 'manual'
    notes TEXT,
    converted_expense_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ DEFAULT NULL
);
ALTER TABLE public.inbox_bills ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own inbox bills" ON public.inbox_bills;
CREATE POLICY "Users can manage their own inbox bills" ON public.inbox_bills
    FOR ALL USING (auth.uid() = owner_id);



