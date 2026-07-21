// scripts/run-otp-migration.js
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const sqlPath = path.join(__dirname, '..', 'supabase', 'migrations', '002_otp_resets_table.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

async function run() {
  const regions = [
    'aws-0-ap-south-1',      // Mumbai
    'aws-0-us-east-1',       // US East
    'aws-0-us-west-1',       // US West  
    'aws-0-eu-west-1',       // EU
    'aws-0-ap-southeast-1',  // Singapore
    'aws-0-eu-central-1',    // Frankfurt
  ];

  const projectRef = 'tdjwytrtmgsxbfvlqjtl';
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
      password: 'Aquamafia@007',
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 6000
    });
    
    try {
      await client.connect();
      await client.query('SELECT 1 as test');
      console.log(`✅ Connected via ${host}!`);
      connected = true;
      break;
    } catch (e) {
      console.log(`  ❌ ${e.message}`);
      try { client.end(); } catch(_) {}
    }
  }

  if (!connected) {
    console.log('Trying direct connection to db.tdjwytrtmgsxbfvlqjtl.supabase.co:5432...');
    client = new Client({
      host: `db.${projectRef}.supabase.co`,
      port: 5432,
      database: 'postgres',
      user: 'postgres',
      password: 'Aquamafia@007',
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
    console.error('❌ Could not connect to Supabase PostgreSQL database.');
    process.exit(1);
  }

  console.log('Executing 002_otp_resets_table.sql...');
  await client.query(sql);
  console.log('✅ Migration executed successfully!');

  console.log('Reloading PostgREST API schema cache...');
  await client.query("NOTIFY pgrst, 'reload schema';");
  console.log('✅ PostgREST schema cache reloaded!');

  await client.end();
}

run().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
