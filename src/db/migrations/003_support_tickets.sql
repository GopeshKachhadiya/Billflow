-- ═══════════════════════════════════════════════════
-- SQL MIGRATION: CREATE SUPPORT TICKETS TABLE
-- ═══════════════════════════════════════════════════

-- Create support_tickets table
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

-- Enable RLS on this table
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist to avoid duplicate errors
DROP POLICY IF EXISTS "Allow select for authenticated users" ON public.support_tickets;
DROP POLICY IF EXISTS "Allow insert for anyone" ON public.support_tickets;

-- Allow authenticated users to view support tickets (for manager dashboards)
CREATE POLICY "Allow select for authenticated users" ON public.support_tickets
    FOR SELECT TO authenticated USING (true);

-- Allow anyone (including anonymous landing page visitors) to submit tickets
CREATE POLICY "Allow insert for anyone" ON public.support_tickets
    FOR INSERT TO anon, authenticated WITH CHECK (true);
