var SupabaseJS = require('@supabase/supabase-js');
var settings   = require('../db/queries/settings');

var _client = null;

function getSupabaseClient() {
  var url, key;
  try {
    url = settings.getSetting('supabase_url');
    key = settings.getSetting('supabase_anon_key');
  } catch (e) {
    // Table might not exist yet before migrations run
  }

  if (!url || !key) {
    url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://tdjwytrtmgsxbfvlqjtl.supabase.co';
    key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_sg13WITxOmD5EMcPccuBXA_bu41qGJ3';
  }

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

async function ensureAuthenticatedClient() {
  var client = getSupabaseClient();
  var auth = require('./auth');
  var session = null;
  try { session = auth.getSession(); } catch(e) {}
  if (!client || !session || !session.id) {
    throw new Error('Not connected to cloud database or not logged in.');
  }
  if (session.access_token && session.refresh_token) {
    await client.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token
    }).catch(function() {});
  }
  return { client: client, userId: session.id };
}

module.exports = { 
  getSupabaseClient: getSupabaseClient, 
  resetClient: resetClient,
  ensureAuthenticatedClient: ensureAuthenticatedClient
};

