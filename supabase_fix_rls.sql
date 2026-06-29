-- ═══════════════════════════════════════════════════
-- SQL MIGRATION: FIX ADMIN PANEL RLS POLICIES
-- Copy and paste this script directly into your Supabase SQL Editor
-- (https://supabase.com/dashboard/project/brpigwqhbqeqpxynhixf/sql/new)
-- and click RUN.
-- ═══════════════════════════════════════════════════

-- 1. Clean up existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.admin_users;
DROP POLICY IF EXISTS "Admin full access to admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Admin full access to admin_payments" ON public.admin_payments;
DROP POLICY IF EXISTS "Admin full access to admin_activity_log" ON public.admin_activity_log;
DROP POLICY IF EXISTS "Admin full access to admin_support_notes" ON public.admin_support_notes;
DROP POLICY IF EXISTS "Admin full access to admin_plans" ON public.admin_plans;

-- 2. Policy for public.admin_users
-- Permits full read/write access to you (the master owner),
-- and permits other authenticated users (if any) to view their own profile.
CREATE POLICY "Admin full access to admin_users" ON public.admin_users
  FOR ALL TO authenticated
  USING (
    auth.jwt() ->> 'email' = 'gopeshkachhadiya00005@gmail.com' OR
    auth.jwt() ->> 'email' = email
  )
  WITH CHECK (
    auth.jwt() ->> 'email' = 'gopeshkachhadiya00005@gmail.com'
  );

-- 3. Policy for public.admin_payments
-- Permits the owner full control to manage and view all payments.
CREATE POLICY "Admin full access to admin_payments" ON public.admin_payments
  FOR ALL TO authenticated
  USING (
    auth.jwt() ->> 'email' = 'gopeshkachhadiya00005@gmail.com'
  )
  WITH CHECK (
    auth.jwt() ->> 'email' = 'gopeshkachhadiya00005@gmail.com'
  );

-- 4. Policy for public.admin_activity_log
-- Permits the owner full control to manage and inspect SaaS audit activity logs.
CREATE POLICY "Admin full access to admin_activity_log" ON public.admin_activity_log
  FOR ALL TO authenticated
  USING (
    auth.jwt() ->> 'email' = 'gopeshkachhadiya00005@gmail.com'
  )
  WITH CHECK (
    auth.jwt() ->> 'email' = 'gopeshkachhadiya00005@gmail.com'
  );

-- 5. Policy for public.admin_support_notes
-- Permits the owner full control to read/write internal client support notes.
CREATE POLICY "Admin full access to admin_support_notes" ON public.admin_support_notes
  FOR ALL TO authenticated
  USING (
    auth.jwt() ->> 'email' = 'gopeshkachhadiya00005@gmail.com'
  )
  WITH CHECK (
    auth.jwt() ->> 'email' = 'gopeshkachhadiya00005@gmail.com'
  );

-- 6. Policy for public.admin_plans
-- Permits the owner full control to edit plans, and lets all authenticated users view plan options.
CREATE POLICY "Admin full access to admin_plans" ON public.admin_plans
  FOR ALL TO authenticated
  USING (
    auth.jwt() ->> 'email' = 'gopeshkachhadiya00005@gmail.com' OR
    TRUE
  )
  WITH CHECK (
    auth.jwt() ->> 'email' = 'gopeshkachhadiya00005@gmail.com'
  );

-- ═══════════════════════════════════════════════════
-- Verify/Update Admin Account Row Status
-- Ensures your admin login details are present in the table.
-- ═══════════════════════════════════════════════════
INSERT INTO public.admin_users (full_name, business_name, email, status)
VALUES ('Gopesh Kachhadiya', 'BillFlow Admin', 'gopeshkachhadiya00005@gmail.com', 'active')
ON CONFLICT (email) DO UPDATE SET status = 'active';
