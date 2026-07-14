const { Client } = require('pg');

const sql = `
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

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select for authenticated users" ON public.support_tickets;
CREATE POLICY "Allow select for authenticated users" ON public.support_tickets
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow insert for anyone" ON public.support_tickets;
CREATE POLICY "Allow insert for anyone" ON public.support_tickets
    FOR INSERT TO anon, authenticated WITH CHECK (true);
`;

const regions = [
  'aws-0-ap-south-1',      // Mumbai
  'aws-0-us-east-1',       // US East
  'aws-0-us-west-1',       // US West  
  'aws-0-eu-west-1',       // EU
  'aws-0-ap-southeast-1',  // Singapore
  'aws-0-eu-central-1',    // Frankfurt
];

async function run() {
  let connected = false;
  let client;

  for (const region of regions) {
    const host = `${region}.pooler.supabase.com`;
    console.log(`Connecting to ${host}...`);

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
      console.log(`✅ Connected via ${host}!`);
      connected = true;
      break;
    } catch (e) {
      console.log(`  ❌ Connection failed: ${e.message}`);
      try { client.end(); } catch(_) {}
    }
  }

  if (!connected) {
    console.log('Trying direct connection...');
    client = new Client({
      host: 'db.brpigwqhbqeqpxynhixf.supabase.co',
      port: 5432,
      database: 'postgres',
      user: 'postgres.brpigwqhbqeqpxynhixf',
      password: 'Gopesh@007',
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000
    });

    try {
      await client.connect();
      console.log('✅ Connected directly!');
      connected = true;
    } catch (e) {
      console.error(`❌ All connections failed: ${e.message}`);
      return;
    }
  }

  try {
    console.log('Running migration SQL...');
    await client.query(sql);
    console.log('✅ Migration succeeded!');
  } catch (e) {
    console.error(`❌ Migration failed: ${e.message}`);
  } finally {
    await client.end();
  }
}

run();
