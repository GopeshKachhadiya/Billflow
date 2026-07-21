-- 002_otp_resets_table.sql
-- Table for storing custom 6-digit numeric OTP password reset tokens

CREATE TABLE IF NOT EXISTS public.password_otp_resets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    otp_code TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup by email and OTP code
CREATE INDEX IF NOT EXISTS idx_otp_email_code ON public.password_otp_resets (email, otp_code);

-- Enable RLS
ALTER TABLE public.password_otp_resets ENABLE ROW LEVEL SECURITY;

-- Allow public access for insertion and verification
DROP POLICY IF EXISTS "Allow anon insert otp" ON public.password_otp_resets;
CREATE POLICY "Allow anon insert otp" ON public.password_otp_resets
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon select otp" ON public.password_otp_resets;
CREATE POLICY "Allow anon select otp" ON public.password_otp_resets
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow anon update otp" ON public.password_otp_resets;
CREATE POLICY "Allow anon update otp" ON public.password_otp_resets
    FOR UPDATE USING (true);
