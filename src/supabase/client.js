var SupabaseJS = require('@supabase/supabase-js');
var settings   = require('../db/queries/settings');

var _client = null;

function getSupabaseClient() {
  var url = settings.getSetting('supabase_url');
  var key = settings.getSetting('supabase_anon_key');
  if (!url || !key) { return null; }

  if (!_client) {
    var ws = require('ws');
    _client = SupabaseJS.createClient(url, key, {
      auth: { persistSession: false },
      realtime: {
        transport: ws
      }
    });
  }
  return _client;
}

function resetClient() { _client = null; }

module.exports = { getSupabaseClient: getSupabaseClient, resetClient: resetClient };

