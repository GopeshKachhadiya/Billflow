-- ═══════════════════════════════════════════════════
-- ADMIN STAFF & TEAM MEMBERS TABLE (RBAC)
-- Roles: 'super_admin', 'manager', 'worker'
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.admin_staff (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name   TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  phone       TEXT DEFAULT '',
  role        TEXT NOT NULL DEFAULT 'worker' CHECK (role IN ('super_admin', 'manager', 'worker')),
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  last_login  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_staff_email ON public.admin_staff(email);
CREATE INDEX IF NOT EXISTS idx_admin_staff_role ON public.admin_staff(role);

-- Enable RLS
ALTER TABLE public.admin_staff ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view staff profiles
DROP POLICY IF EXISTS "Allow select for authenticated staff" ON public.admin_staff;
CREATE POLICY "Allow select for authenticated staff"
  ON public.admin_staff FOR SELECT
  TO authenticated USING (true);

-- Allow authenticated staff to update staff profiles
DROP POLICY IF EXISTS "Allow update for authenticated staff" ON public.admin_staff;
CREATE POLICY "Allow update for authenticated staff"
  ON public.admin_staff FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- Allow authenticated staff to insert staff profiles
DROP POLICY IF EXISTS "Allow insert for authenticated staff" ON public.admin_staff;
CREATE POLICY "Allow insert for authenticated staff"
  ON public.admin_staff FOR INSERT
  TO authenticated WITH CHECK (true);

-- Seed Initial Super Admin
INSERT INTO public.admin_staff (full_name, email, role, status)
VALUES ('Gopesh Kachhadiya', 'gopeshkachhadiya00005@gmail.com', 'super_admin', 'active')
ON CONFLICT (email) DO UPDATE SET role = 'super_admin';

-- ═══════════════════════════════════════════════════
-- SYSTEM SETTINGS & ORGANIZATIONAL CONFIGURATION
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.admin_system_settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  description TEXT DEFAULT '',
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.admin_system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select for system settings" ON public.admin_system_settings;
CREATE POLICY "Allow select for system settings"
  ON public.admin_system_settings FOR SELECT
  TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Allow all for authenticated system settings" ON public.admin_system_settings;
CREATE POLICY "Allow all for authenticated system settings"
  ON public.admin_system_settings FOR ALL
  TO authenticated USING (true);

-- Seed Default Settings
INSERT INTO public.admin_system_settings (key, value, description)
VALUES 
  ('org_name', 'Satya Technologies', 'Organization / Company Name'),
  ('support_email', 'support@billflow.in', 'Customer Support Email Address'),
  ('support_phone', '+91 80000 00000', 'Customer Support Helpline Phone'),
  ('company_address', 'Surat, Gujarat, India', 'Company Registered Office Address'),
  ('default_trial_days', '14', 'Default Free Trial Period Duration in Days'),
  ('standard_monthly_price', '700', 'Standard Plan Monthly Price in INR'),
  ('standard_yearly_price', '6000', 'Standard Plan Yearly Price in INR'),
  ('webhook_base_url', '', 'Default Webhook / Automation Base URL'),
  ('webhook_secret', '', 'Default Security Token for Webhooks')
ON CONFLICT (key) DO NOTHING;

-- Add assigned_to column to support_tickets if not present
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS assigned_to TEXT DEFAULT '';
