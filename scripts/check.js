const { createClient } = require('@supabase/supabase-js');
const url = 'https://brpigwqhbqeqpxynhixf.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJycGlnd3FoYnFlcXB4eW5oaXhmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTY5NjQ4OSwiZXhwIjoyMDk3MjcyNDg5fQ.VBADWtn6SsKsgGxyVWTisYEh20HVeI07sD5FHvs5md0';
const supabase = createClient(url, key);

async function check() {
  const tables = ['profiles', 'customers', 'items_catalog', 'bills', 'bill_items', 'tax_records', 'payment_log', 'communication_log', 'report_log', 'sync_events'];
  let allGood = true;
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.error('Error for ' + table + ':', error.message);
      allGood = false;
    } else {
      console.log('Table ' + table + ' exists.');
    }
  }
  if (allGood) console.log('ALL TABLES EXIST');
}
check();
