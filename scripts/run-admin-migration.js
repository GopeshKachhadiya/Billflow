// Run admin SQL migration via Supabase Management API
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://brpigwqhbqeqpxynhixf.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJycGlnd3FoYnFlcXB4eW5oaXhmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTY5NjQ4OSwiZXhwIjoyMDk3MjcyNDg5fQ.VBADWtn6SsKsgGxyVWTisYEh20HVeI07sD5FHvs5md0';

const sqlFile = path.join(__dirname, '..', 'billadmin', 'supabase', 'admin-migrations', '001_admin_tables.sql');
const fullSql = fs.readFileSync(sqlFile, 'utf8');

// Split into individual statements
const statements = fullSql
  .replace(/--[^\n]*/g, '')  // Remove single-line comments
  .split(/;\s*\n/)
  .map(s => s.trim())
  .filter(s => s.length > 0)
  .map(s => s + ';');

async function executeSql(sql) {
  // Use the pg_net/pg extension or exec_sql if available
  // Try multiple approaches
  
  // Approach: Use supabase.rpc with a custom function
  // First, create a helper function, then use it
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
    },
    body: JSON.stringify({ sql_query: sql })
  });
  return response;
}

async function run() {
  console.log('Step 1: Create a helper exec_sql function via the Supabase SQL API...');
  
  // The Supabase platform doesn't expose raw SQL execution via REST.
  // We need to use the pg module with the connection pooler.
  // Supabase projects on the free tier use: 
  //   Session mode: db.<project-ref>.supabase.co:5432
  //   Transaction mode: <project-ref>.pooler.supabase.com:6543
  
  // Let's try connecting via the pooler with different region prefixes
  const { Client } = require('pg');
  
  const regions = [
    'aws-0-ap-south-1',      // Mumbai
    'aws-0-us-east-1',       // US East
    'aws-0-us-west-1',       // US West  
    'aws-0-eu-west-1',       // EU
    'aws-0-ap-southeast-1',  // Singapore
    'aws-0-eu-central-1',    // Frankfurt
  ];
  
  let connected = false;
  let client;
  
  for (const region of regions) {
    const host = `${region}.pooler.supabase.com`;
    console.log(`Trying ${host}...`);
    
    client = new Client({
      host: host,
      port: 6543,
      database: 'postgres',
      user: 'postgres.brpigwqhbqeqpxynhixf',
      password: 'Gopesh@007',
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 8000
    });
    
    try {
      await client.connect();
      const r = await client.query('SELECT 1 as test');
      console.log(`✅ Connected via ${host}!`);
      connected = true;
      break;
    } catch (e) {
      console.log(`  ❌ ${e.message}`);
      try { client.end(); } catch(_) {}
    }
  }
  
  if (!connected) {
    // Try direct connection
    console.log('Trying direct connection to db.<ref>.supabase.co:5432...');
    client = new Client({
      host: `db.brpigwqhbqeqpxynhixf.supabase.co`,
      port: 5432,
      database: 'postgres',
      user: 'postgres',
      password: 'Gopesh@007',
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000
    });
    
    try {
      await client.connect();
      console.log('✅ Connected via direct connection!');
      connected = true;
    } catch (e) {
      console.log(`  ❌ ${e.message}`);
    }
  }
  
  if (!connected) {
    console.log('');
    console.log('❌ Could not connect to the PostgreSQL database.');
    console.log('');
    console.log('Please run the SQL migration manually:');
    console.log('1. Open: https://supabase.com/dashboard/project/brpigwqhbqeqpxynhixf/sql/new');
    console.log('2. Copy-paste the contents of: billadmin/supabase/admin-migrations/001_admin_tables.sql');
    console.log('3. Click "Run"');
    process.exit(1);
  }
  
  // Execute the full SQL as one statement
  console.log('');
  console.log('Executing migration SQL...');
  try {
    await client.query(fullSql);
    console.log('✅ Migration executed successfully!');
  } catch (e) {
    console.log('Error executing full SQL:', e.message);
    console.log('Trying statement by statement...');
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      const preview = stmt.substring(0, 80).replace(/\n/g, ' ');
      try {
        await client.query(stmt);
        console.log(`  ✅ [${i+1}/${statements.length}] ${preview}...`);
      } catch (e2) {
        console.log(`  ⚠️ [${i+1}/${statements.length}] ${preview}... — ${e2.message}`);
      }
    }
  }
  
  // Verify
  console.log('');
  console.log('Verifying tables...');
  const tables = ['admin_users', 'admin_payments', 'admin_activity_log', 'admin_support_notes', 'admin_plans'];
  for (const table of tables) {
    try {
      const r = await client.query(`SELECT COUNT(*) as cnt FROM public.${table}`);
      console.log(`✅ ${table}: exists (${r.rows[0].cnt} rows)`);
    } catch (e) {
      console.log(`❌ ${table}: ${e.message}`);
    }
  }
  
  await client.end();
}

run().catch(console.error);
