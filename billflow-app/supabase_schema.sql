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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- items_catalog table
CREATE TABLE IF NOT EXISTS public.items_catalog (
    id TEXT PRIMARY KEY,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    gst_rate DOUBLE PRECISION DEFAULT 18.0,
    is_active BOOLEAN DEFAULT TRUE,
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

DROP POLICY IF EXISTS "Allow update for authenticated users" ON public.gstin_cache;
CREATE POLICY "Allow update for authenticated users" ON public.gstin_cache
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════
-- 7. Support Tickets Table
-- ═══════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

DROP POLICY IF EXISTS "Allow select for authenticated users" ON public.support_tickets;
CREATE POLICY "Allow select for authenticated users" ON public.support_tickets
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow insert for anyone" ON public.support_tickets;
CREATE POLICY "Allow insert for anyone" ON public.support_tickets
    FOR INSERT TO anon, authenticated WITH CHECK (true);


