// scripts/delete-test-users.js
const { createClient } = require('@supabase/supabase-js');

const url = 'https://brpigwqhbqeqpxynhixf.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJycGlnd3FoYnFlcXB4eW5oaXhmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTY5NjQ4OSwiZXhwIjoyMDk3MjcyNDg5fQ.VBADWtn6SsKsgGxyVWTisYEh20HVeI07sD5FHvs5md0';

const supabase = createClient(url, key);

async function cleanup() {
  console.log('Fetching users from Supabase Auth (auth.users)...');
  const { data: { users }, error } = await supabase.auth.admin.listUsers();

  if (error) {
    console.error('❌ Error listing users:', error.message);
    process.exit(1);
  }

  const targetUsers = users.filter(u => u.email !== 'gopeshkachhadiya00005@gmail.com');
  
  if (targetUsers.length === 0) {
    console.log('No test users to delete. Only gopeshkachhadiya00005@gmail.com exists.');
    return;
  }

  console.log(`Found ${targetUsers.length} test user(s) to delete:`);
  for (const u of targetUsers) {
    console.log(`- Deleting: ${u.email} (${u.id})`);
    
    // 1. Delete from public.admin_users (just in case they have a row)
    await supabase.from('admin_users').delete().eq('id', u.id);

    // 2. Delete from Supabase Auth
    const { error: deleteError } = await supabase.auth.admin.deleteUser(u.id);
    if (deleteError) {
      console.error(`  ❌ Failed to delete auth user ${u.email}:`, deleteError.message);
    } else {
      console.log(`  ✅ Successfully deleted ${u.email}`);
    }
  }

  console.log('\nCleanup completed!');
}

cleanup().catch(console.error);
