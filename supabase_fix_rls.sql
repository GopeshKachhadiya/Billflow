-- ═══════════════════════════════════════════════════
-- SQL MIGRATION: FIX ADMIN PANEL RLS POLICIES (FAIL-SAFE)
-- Copy and paste this script directly into your Supabase SQL Editor
-- (https://supabase.com/dashboard/project/brpigwqhbqeqpxynhixf/sql/new)
-- and click RUN.
-- ═══════════════════════════════════════════════════

-- 1. Clean up existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.admin_users;
DROP POLICY IF EXISTS "Admin full access to admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Admin full access to admin_payments" ON public.admin_payments;
DROP POLICY IF EXISTS "Admin full access to admin_activity_log" ON public.admin_activity_log;
DROP POLICY IF EXISTS "Admin full access to admin_support_notes" ON public.admin_support_notes;
DROP POLICY IF EXISTS "Admin full access to admin_plans" ON public.admin_plans;

-- 2. Create fail-safe policies for all authenticated users
-- Since this is your private Admin Supabase project, any logged-in user is an administrator.

CREATE POLICY "Admin full access to admin_users" ON public.admin_users
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admin full access to admin_payments" ON public.admin_payments
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admin full access to admin_activity_log" ON public.admin_activity_log
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admin full access to admin_support_notes" ON public.admin_support_notes
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admin full access to admin_plans" ON public.admin_plans
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- 3. Seed/Verify Admin User row in database
INSERT INTO public.admin_users (full_name, business_name, email, status)
VALUES ('Gopesh Kachhadiya', 'BillFlow Admin', 'gopeshkachhadiya00005@gmail.com', 'active')
ON CONFLICT (email) DO UPDATE SET status = 'active';
