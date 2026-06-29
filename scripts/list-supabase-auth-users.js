// scripts/list-supabase-auth-users.js
const { createClient } = require('@supabase/supabase-js');

const url = 'https://brpigwqhbqeqpxynhixf.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJycGlnd3FoYnFlcXB4eW5oaXhmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTY5NjQ4OSwiZXhwIjoyMDk3MjcyNDg5fQ.VBADWtn6SsKsgGxyVWTisYEh20HVeI07sD5FHvs5md0';

const supabase = createClient(url, key);

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
