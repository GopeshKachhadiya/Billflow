-- ═══════════════════════════════════════════════════════════════════════════════
-- SECURITY FIX MIGRATION — RUN THIS ON YOUR LIVE SUPABASE DATABASE
-- Date: 23 July 2026
-- Fixes: SEC-03, SEC-04, SEC-05 from the BillFlow Security Audit
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── SEC-05 FIX: GSTIN Cache — Remove UPDATE policy ─────────────────────────
-- BEFORE: Any user could overwrite ANY GSTIN record (data poisoning)
-- AFTER:  Users can only READ and INSERT (updates require service_role/admin)
DROP POLICY IF EXISTS "Allow update for authenticated users" ON public.gstin_cache;

-- ─── SEC-04 FIX: Support Tickets — Add owner tracking ──────────────────────
-- BEFORE: Any authenticated user could read ALL support tickets
-- AFTER:  Users can only read their OWN tickets

-- Step 1: Add owner_id column if it doesn't exist
ALTER TABLE public.support_tickets
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Step 2: Drop old over-permissive SELECT policy
DROP POLICY IF EXISTS "Allow select for authenticated users" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can view their own tickets" ON public.support_tickets;

-- Step 3: Create new restrictive SELECT policy
CREATE POLICY "Users can view their own tickets" ON public.support_tickets
    FOR SELECT TO authenticated USING (auth.uid() = owner_id);

-- ─── SEC-03 FIX: Password OTP Resets — CRITICAL AUTH BYPASS FIX ─────────────
-- BEFORE: `FOR ALL USING (true)` let ANY anonymous user READ all OTP codes
--         and take over ANY account by reading the verification code
-- AFTER:  Only INSERT is allowed. Verification happens server-side via RPC.

-- Step 1: Drop the dangerous old policy
DROP POLICY IF EXISTS "Allow anon and auth to insert/select password_otp_resets"
ON public.password_otp_resets;

-- Step 2: Create restrictive INSERT-only policy
DROP POLICY IF EXISTS "Allow authenticated insert for OTP creation" ON public.password_otp_resets;
CREATE POLICY "Allow authenticated insert for OTP creation" ON public.password_otp_resets
    FOR INSERT TO authenticated WITH CHECK (true);

-- Step 3: Create server-side OTP verification function
-- This runs with SECURITY DEFINER so it can read/update the OTP table
-- without exposing any read access to the client
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

-- Step 4: Secure the function — only authenticated users can call it
REVOKE EXECUTE ON FUNCTION public.verify_password_otp(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_password_otp(TEXT, TEXT) TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════════
-- VERIFICATION: Run these queries to confirm the fixes are applied
-- ═══════════════════════════════════════════════════════════════════════════════
-- 
-- Check that the dangerous policies no longer exist:
--   SELECT * FROM pg_policies WHERE tablename = 'password_otp_resets';
--   SELECT * FROM pg_policies WHERE tablename = 'gstin_cache';
--   SELECT * FROM pg_policies WHERE tablename = 'support_tickets';
--
-- Verify the new RPC function exists:
--   SELECT proname, prosecdef FROM pg_proc WHERE proname = 'verify_password_otp';
-- ═══════════════════════════════════════════════════════════════════════════════


-- ═══════════════════════════════════════════════════════════════════════════════
-- E2EE (End-to-End Encryption) SCHEMA UPDATES
-- Run these to prepare your database for encrypted customer and financial data
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Add encryption salt to user profiles for secure key derivation
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS encryption_salt TEXT;

-- 2. Add encryption columns to core data tables
ALTER TABLE public.customers 
  ADD COLUMN IF NOT EXISTS encrypted_data TEXT,
  ADD COLUMN IF NOT EXISTS enc_iv TEXT,
  ADD COLUMN IF NOT EXISTS enc_auth_tag TEXT;

ALTER TABLE public.items_catalog 
  ADD COLUMN IF NOT EXISTS encrypted_data TEXT,
  ADD COLUMN IF NOT EXISTS enc_iv TEXT,
  ADD COLUMN IF NOT EXISTS enc_auth_tag TEXT;

ALTER TABLE public.bills 
  ADD COLUMN IF NOT EXISTS encrypted_data TEXT,
  ADD COLUMN IF NOT EXISTS enc_iv TEXT,
  ADD COLUMN IF NOT EXISTS enc_auth_tag TEXT;

-- ═══════════════════════════════════════════════════════════════════════════════
-- SUPPORT TICKETS, INBOX, EXPENSES & CREDIT NOTES SCHEMA & RLS POLICIES
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    topic TEXT NOT NULL,
    message TEXT,
    status TEXT DEFAULT 'open',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS public.inbox_bills (
    id TEXT PRIMARY KEY,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    sender_name TEXT,
    sender_email TEXT,
    sender_phone TEXT,
    sender_gstin TEXT,
    bill_number TEXT,
    bill_date DATE,
    due_date DATE,
    amount DOUBLE PRECISION DEFAULT 0.0,
    tax_amount DOUBLE PRECISION DEFAULT 0.0,
    pdf_url TEXT,
    pdf_base64 TEXT,
    status TEXT DEFAULT 'unread',
    source TEXT DEFAULT 'manual',
    notes TEXT,
    converted_expense_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS public.expenses (
    id TEXT PRIMARY KEY,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    category TEXT,
    vendor_name TEXT,
    amount DOUBLE PRECISION DEFAULT 0.0,
    gst_amount DOUBLE PRECISION DEFAULT 0.0,
    bill_date DATE,
    receipt_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS public.credit_notes (
    id TEXT PRIMARY KEY,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    credit_note_number TEXT,
    customer_id TEXT,
    bill_id TEXT,
    amount DOUBLE PRECISION DEFAULT 0.0,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inbox_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can manage their own support tickets" ON public.support_tickets;
CREATE POLICY "Users can manage their own support tickets" ON public.support_tickets
    FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can manage their own inbox bills" ON public.inbox_bills;
CREATE POLICY "Users can manage their own inbox bills" ON public.inbox_bills
    FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can manage their own expenses" ON public.expenses;
CREATE POLICY "Users can manage their own expenses" ON public.expenses
    FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can manage their own credit notes" ON public.credit_notes;
CREATE POLICY "Users can manage their own credit notes" ON public.credit_notes
    FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

