// scripts/list-supabase-auth-users.js
const { createClient } = require('@supabase/supabase-js');
const env = require('./get-env');

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

async function listAuthUsers() {
  console.log('Fetching users from Supabase Auth (auth.users)...\n');
  
  // Use the admin auth API to list users
  const { data: { users }, error } = await supabase.auth.admin.listUsers();

  if (error) {
    console.error('❌ Error fetching auth users:', error.message);
    process.exit(1);
  }

  if (!users || users.length === 0) {
    console.log('No users found in Supabase Auth.');
    return;
  }

  console.log(`Found ${users.length} auth user(s):`);
  console.log('================================================================================');
  
  users.forEach((u, i) => {
    console.log(`Auth User #${i + 1}`);
    console.log(`  Email:         ${u.email}`);
    console.log(`  ID:            ${u.id}`);
    console.log(`  Role:          ${u.role || 'authenticated'}`);
    console.log(`  Created At:    ${u.created_at}`);
    console.log(`  Last Sign In:  ${u.last_sign_in_at || 'Never'}`);
    console.log(`  Confirmed:     ${u.email_confirmed_at ? 'Yes (' + u.email_confirmed_at + ')' : 'No'}`);
    console.log('--------------------------------------------------------------------------------');
  });
}

listAuthUsers().catch(console.error);
