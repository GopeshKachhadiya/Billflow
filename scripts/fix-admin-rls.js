// scripts/fix-admin-rls.js
const { Client } = require('pg');

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
  USING (true)
  WITH CHECK (true);

-- 2. Create a policy for admin_payments
CREATE POLICY "Admin full access to admin_payments" ON public.admin_payments
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- 3. Create a policy for admin_activity_log
CREATE POLICY "Admin full access to admin_activity_log" ON public.admin_activity_log
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- 4. Create a policy for admin_support_notes
CREATE POLICY "Admin full access to admin_support_notes" ON public.admin_support_notes
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- 5. Create a policy for admin_plans
CREATE POLICY "Admin full access to admin_plans" ON public.admin_plans
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- 6. Verify/Update Admin User row in database
INSERT INTO public.admin_users (full_name, business_name, email, status)
VALUES ('Gopesh Kachhadiya', 'BillFlow Admin', 'gopeshkachhadiya00005@gmail.com', 'active')
ON CONFLICT (email) DO UPDATE SET status = 'active';
`;

const regions = [
  'aws-0-ap-south-1',      // Mumbai
  'aws-0-ap-southeast-1',  // Singapore
  'aws-0-us-east-1',       // US East
  'aws-0-us-west-1',       // US West  
  'aws-0-eu-west-1',       // EU
  'aws-0-eu-central-1',    // Frankfurt
];

async function run() {
  console.log('Connecting to PostgreSQL database to apply RLS policy updates...');
  
  let connected = false;
  let client;

  for (const region of regions) {
    const host = `${region}.pooler.supabase.com`;
    console.log(`Trying ${host}...`);
    
    client = new Client({
      host: host,
      port: 6543,
      database: 'postgres',
      user: `postgres.${projectRef}`,
      password: dbPassword,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000
    });
    
    try {
      await client.connect();
      console.log(`✅ Connected successfully via ${host}!`);
      connected = true;
      break;
    } catch (e) {
      console.log(`  ❌ Connection failed: ${e.message}`);
      try { await client.end(); } catch(_) {}
    }
  }

  if (!connected) {
    console.log('Trying direct connection to db.<ref>.supabase.co:5432...');
    client = new Client({
      host: `db.${projectRef}.supabase.co`,
      port: 5432,
      database: 'postgres',
      user: 'postgres',
      password: dbPassword,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 8000
    });
    
    try {
      await client.connect();
      console.log('✅ Connected successfully via direct connection!');
      connected = true;
    } catch (e) {
      console.log(`  ❌ Direct connection failed: ${e.message}`);
    }
  }

  if (!connected) {
    console.error('\n❌ Could not connect to the database via pooler or direct connection.');
    console.log('Please copy and execute the SQL manually inside the Supabase SQL Editor.');
    process.exit(1);
  }

  try {
    console.log('Applying RLS updates...');
    await client.query(sql);
    console.log('✅ RLS policies updated successfully!');
  } catch (e) {
    console.error('❌ Error executing SQL query:', e.message);
  } finally {
    try { await client.end(); } catch(_) {}
  }
}

run().catch(console.error);
