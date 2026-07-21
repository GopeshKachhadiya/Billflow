var fs = require('fs');
var path = require('path');

var _cache = {
  business_name: '',
  gstin: '',
  business_address: '',
  business_city: '',
  business_state: '',
  business_state_code: '',
  business_pin: '',
  pan: '',
  bank_name: '',
  bank_account: '',
  bank_ifsc: '',
  bill_prefix: 'INV-',
  default_gst_rate: '18',
  upi_id: '',
  logo_data: '',
  signature_data: '',
  business_phone: '',
  business_email: '',
  business_udyam: '',
  business_category: '',
  business_status: '',
  wati_enabled: '0',
  sms_enabled: '0',
  notify_owner_phone: '',
  notify_owner_whatsapp: '0',
  notify_daily_summary: '0',
  notify_weekly_report: '0',
  notify_monthly_gst: '0',
  wati_api_url: '',
  wati_api_token: '',
  msg91_auth_key: '',
  msg91_sender_id: '',
  email_from_name: '',
  email_from_address: '',
  smtp_host: '',
  smtp_port: '587',
  smtp_user: '',
  smtp_pass: '',
  accountant_email: '',
  n8n_base_url: '',
  n8n_secret: '',
  supabase_url: '',
  supabase_anon_key: ''
};

function readEnvBootstrap() {
  try {
    var envPaths = [
      path.join(__dirname, '../../..', '.env'),
      path.join(__dirname, '../../../..', '.env'),
      path.join(__dirname, '../../..', 'billadmin', '.env'),
      path.join(__dirname, '../../../..', 'billadmin', '.env'),
      path.join(process.cwd(), '.env')
    ];
    for (var i = 0; i < envPaths.length; i++) {
      if (fs.existsSync(envPaths[i])) {
        var content = fs.readFileSync(envPaths[i], 'utf8');
        content.split(/\r?\n/).forEach(function(line) {
          var match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
          if (match) {
            var k = match[1];
            var v = match[2] ? match[2].trim() : '';
            if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
            if (v.startsWith("'") && v.endsWith("'")) v = v.slice(1, -1);
            if (k === 'SUPABASE_URL' || k === 'VITE_SUPABASE_URL') _cache.supabase_url = v;
            if (k === 'SUPABASE_ANON_KEY' || k === 'VITE_SUPABASE_ANON_KEY') _cache.supabase_anon_key = v;
            if (k === 'SMTP_HOST') _cache.smtp_host = v;
            if (k === 'SMTP_PORT') _cache.smtp_port = v;
            if (k === 'SMTP_USER') _cache.smtp_user = v;
            if (k === 'SMTP_PASS') _cache.smtp_pass = v;
          }
        });
      }
    }
  } catch(e) {}
}

readEnvBootstrap();

async function loadCloudSettings(userId) {
  var ctx = null;
  try { ctx = await require('../../supabase/client').ensureAuthenticatedClient(); } catch(e) {}
  if (!ctx || !ctx.client || !userId) return;
  var client = ctx.client;

  try {
    // 1. Fetch settings rows
    var res = await client.from('settings').select('key, value').eq('owner_id', userId);
    if (!res.error && res.data) {
      res.data.forEach(function(r) {
        _cache[r.key] = r.value;
      });
    }

    // 2. Also fetch profile to get business_name or phone if not overridden
    var pRes = await client.from('profiles').select('*').eq('id', userId).single();
    if (!pRes.error && pRes.data) {
      if (!_cache.business_name && pRes.data.business_name) _cache.business_name = pRes.data.business_name;
      if (!_cache.business_phone && pRes.data.phone) _cache.business_phone = pRes.data.phone;
      if (!_cache.business_email && pRes.data.email) _cache.business_email = pRes.data.email;
    }
  } catch(e) {
    console.error('[settings] Error loading cloud settings:', e.message);
  }
}

function getSetting(key) {
  if (key === 'supabase_url' && !_cache.supabase_url) readEnvBootstrap();
  if (key === 'supabase_anon_key' && !_cache.supabase_anon_key) readEnvBootstrap();
  return _cache[key] !== undefined ? _cache[key] : null;
}

function getAllSettings() {
  readEnvBootstrap();
  return Object.assign({}, _cache);
}

async function setSetting(key, value) {
  var valStr = value === null || value === undefined ? '' : String(value);
  _cache[key] = valStr;

  try {
    var ctx = await require('../../supabase/client').ensureAuthenticatedClient();
    if (ctx && ctx.client && ctx.userId) {
      var res = await ctx.client.from('settings').upsert({
        owner_id: ctx.userId,
        key: key,
        value: valStr,
        updated_at: new Date().toISOString()
      }, { onConflict: 'owner_id,key' });
      if (res.error) console.error('[settings] Cloud upsert failed for key:', key, res.error.message);
    }
  } catch(e) {
    console.error('[settings] Cloud upsert error:', e.message);
  }
}

async function setMultiple(obj) {
  if (!obj || typeof obj !== 'object') return;

  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      var valStr = obj[key] === null || obj[key] === undefined ? '' : String(obj[key]);
      _cache[key] = valStr;
    }
  }

  try {
    var ctx = await require('../../supabase/client').ensureAuthenticatedClient();
    if (ctx && ctx.client && ctx.userId) {
      var payload = [];
      for (var k in obj) {
        if (obj.hasOwnProperty(k)) {
          payload.push({
            owner_id: ctx.userId,
            key: k,
            value: obj[k] === null || obj[k] === undefined ? '' : String(obj[k]),
            updated_at: new Date().toISOString()
          });
        }
      }
      if (payload.length > 0) {
        var res = await ctx.client.from('settings').upsert(payload, { onConflict: 'owner_id,key' });
        if (res.error) console.error('[settings] Cloud bulk upsert failed:', res.error.message);
      }
    }
  } catch(e) {
    console.error('[settings] Cloud bulk upsert error:', e.message);
  }
}

module.exports = {
  getSetting: getSetting,
  getAllSettings: getAllSettings,
  setSetting: setSetting,
  setMultiple: setMultiple,
  loadCloudSettings: loadCloudSettings
};
