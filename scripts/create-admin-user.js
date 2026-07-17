// scripts/create-admin-user.js
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables from billadmin/.env
const envPath = path.join(__dirname, '..', 'billadmin', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split(/\r?\n/).forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] ? match[2].trim() : '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    env[match[1]] = value;
  }
});

const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_SERVICE_KEY;

if (!url || !key) {
  console.error('❌ Error: VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_KEY not found in billadmin/.env');
  process.exit(1);
}

const supabase = createClient(url, key);

async function createAdmin() {
  const email = 'gopeshkachhadiya00005@gmail.com';
  const password = 'Gopesh@007';

  console.log(`Checking if auth user ${email} exists...`);
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.error('❌ Error listing users:', listError.message);
    process.exit(1);
  }

  const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (existingUser) {
    console.log(`✅ Auth user ${email} already exists (ID: ${existingUser.id}).`);
    return;
  }

  console.log(`Creating user ${email}...`);
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (error) {
    console.error('❌ Error creating user:', error.message);
    process.exit(1);
  }

  console.log(`✅ Successfully created and confirmed auth user: ${email} (ID: ${data.user.id})`);
}

createAdmin().catch(console.error);
