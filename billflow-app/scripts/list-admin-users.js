// scripts/list-admin-users.js
const { createClient } = require('@supabase/supabase-js');
const env = require('./get-env');

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

async function listUsers() {
  console.log('Fetching users from Supabase public.admin_users table...\n');
  const { data: users, error } = await supabase
    .from('admin_users')
    .select('id, full_name, business_name, email, phone, status, plan, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching users:', error.message);
    process.exit(1);
  }

  if (!users || users.length === 0) {
    console.log('No users found in the admin_users table.');
    return;
  }

  console.log(`Found ${users.length} user(s):`);
  console.log('================================================================================');
  
  users.forEach((u, i) => {
    console.log(`User #${i + 1}`);
    console.log(`  Name:          ${u.full_name}`);
    console.log(`  Email:         ${u.email}`);
    console.log(`  Business:      ${u.business_name}`);
    console.log(`  Phone:         ${u.phone || 'N/A'}`);
    console.log(`  Status:        ${u.status}`);
    console.log(`  Plan:          ${u.plan}`);
    console.log(`  ID:            ${u.id}`);
    console.log(`  Created At:    ${u.created_at}`);
    console.log('--------------------------------------------------------------------------------');
  });
}

listUsers().catch(console.error);
