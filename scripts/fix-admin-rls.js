// scripts/fix-admin-rls.js
const { Client } = require('pg');

const databaseUrl = 'aws-0-ap-south-1.pooler.supabase.com';
const projectRef = 'brpigwqhbqeqpxynhixf';
const dbPassword = 'Gopesh@007';

const sql = `
-- Drop existing policies if they exist to prevent duplication
DROP POLICY IF EXISTS "Users can view their own profile" ON public.admin_users;
DROP POLICY IF EXISTS "Admin full access to admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Admin full access to admin_payments" ON public.admin_payments;
DROP POLICY IF EXISTS "Admin full access to admin_activity_log" ON public.admin_activity_log;
DROP POLICY IF EXISTS "Admin full access to admin_support_notes" ON public.admin_support_notes;
DROP POLICY IF EXISTS "Admin full access to admin_plans" ON public.admin_plans;

-- 1. Create a policy for admin_users
CREATE POLICY "Admin full access to admin_users" ON public.admin_users
  FOR ALL TO authenticated
  USING (
    auth.jwt() ->> 'email' = 'gopeshkachhadiya00005@gmail.com' OR
    auth.jwt() ->> 'email' = email
  )
  WITH CHECK (
    auth.jwt() ->> 'email' = 'gopeshkachhadiya00005@gmail.com'
  );

-- 2. Create a policy for admin_payments
CREATE POLICY "Admin full access to admin_payments" ON public.admin_payments
  FOR ALL TO authenticated
  USING (
    auth.jwt() ->> 'email' = 'gopeshkachhadiya00005@gmail.com'
  )
  WITH CHECK (
    auth.jwt() ->> 'email' = 'gopeshkachhadiya00005@gmail.com'
  );

-- 3. Create a policy for admin_activity_log
CREATE POLICY "Admin full access to admin_activity_log" ON public.admin_activity_log
  FOR ALL TO authenticated
  USING (
    auth.jwt() ->> 'email' = 'gopeshkachhadiya00005@gmail.com'
  )
  WITH CHECK (
    auth.jwt() ->> 'email' = 'gopeshkachhadiya00005@gmail.com'
  );

-- 4. Create a policy for admin_support_notes
CREATE POLICY "Admin full access to admin_support_notes" ON public.admin_support_notes
  FOR ALL TO authenticated
  USING (
    auth.jwt() ->> 'email' = 'gopeshkachhadiya00005@gmail.com'
  )
  WITH CHECK (
    auth.jwt() ->> 'email' = 'gopeshkachhadiya00005@gmail.com'
  );

-- 5. Create a policy for admin_plans
CREATE POLICY "Admin full access to admin_plans" ON public.admin_plans
  FOR ALL TO authenticated
  USING (
    auth.jwt() ->> 'email' = 'gopeshkachhadiya00005@gmail.com' OR
    TRUE
  )
  WITH CHECK (
    auth.jwt() ->> 'email' = 'gopeshkachhadiya00005@gmail.com'
  );
`;

async function run() {
  console.log('Connecting to PostgreSQL database to apply RLS policy updates...');
  
  // Try direct connection first
  let client = new Client({
    host: 'db.brpigwqhbqeqpxynhixf.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: dbPassword,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 12000
  });

  try {
    await client.connect();
    console.log('Connected to Supabase PostgreSQL via direct connection!');
    
    console.log('Applying RLS updates...');
    await client.query(sql);
    console.log('✅ RLS policies updated successfully!');
  } catch (e) {
    console.log('Direct connection failed:', e.message);
    console.log('Trying pooler connection...');
    
    client = new Client({
      host: `aws-0-ap-south-1.pooler.supabase.com`,
      port: 6543,
      database: 'postgres',
      user: `postgres.${projectRef}`,
      password: dbPassword,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000
    });
    
    try {
      await client.connect();
      console.log('Connected to Supabase PostgreSQL via pooler!');
      console.log('Applying RLS updates...');
      await client.query(sql);
      console.log('✅ RLS policies updated successfully!');
    } catch(e2) {
      console.error('❌ Both direct and pooler connections failed.');
      console.error('Error:', e2.message);
      console.log('\nAlternative: You can copy and run the SQL statements manually in your Supabase SQL Editor.');
    }
  } finally {
    try { await client.end(); } catch(_) {}
  }
}

run().catch(console.error);
