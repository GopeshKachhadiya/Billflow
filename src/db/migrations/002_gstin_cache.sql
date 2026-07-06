-- ═══════════════════════════════════════════════════
-- SQL MIGRATION: CREATE SHARED GSTIN CACHE
-- ═══════════════════════════════════════════════════

-- Create shared gstin_cache table
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

-- Enable RLS on this table
ALTER TABLE public.gstin_cache ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist to avoid duplicate errors
DROP POLICY IF EXISTS "Allow select for authenticated users" ON public.gstin_cache;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.gstin_cache;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON public.gstin_cache;

-- Allow select to all authenticated users
CREATE POLICY "Allow select for authenticated users" ON public.gstin_cache
    FOR SELECT TO authenticated USING (true);

-- Allow insert to all authenticated users
CREATE POLICY "Allow insert for authenticated users" ON public.gstin_cache
    FOR INSERT TO authenticated WITH CHECK (true);

-- Allow update to all authenticated users (to refresh details)
CREATE POLICY "Allow update for authenticated users" ON public.gstin_cache
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
