const fs = require('fs');
const path = require('path');

function getEnv() {
  let envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    envPath = path.join(__dirname, '..', 'billadmin', '.env');
  }
  if (!fs.existsSync(envPath)) {
    console.error('❌ Error: .env file not found in root or billadmin/');
    process.exit(1);
  }
  
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
  
  return {
    SUPABASE_URL: env.SUPABASE_URL || env.VITE_SUPABASE_URL,
    SUPABASE_ANON_KEY: env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_KEY: env.SUPABASE_SERVICE_KEY || env.VITE_SUPABASE_SERVICE_KEY,
    ...env
  };
}

module.exports = getEnv();
