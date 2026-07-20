var settings = require('../db/queries/settings');

function isOnline(callback) {
  var url = settings.getSetting('supabase_url') || 'https://www.google.com';
  if (typeof fetch === 'function') {
    var controller = new AbortController();
    var id = setTimeout(function() { controller.abort(); }, 3000);
    fetch(url, { method: 'HEAD', signal: controller.signal })
      .then(function(res) {
        clearTimeout(id);
        callback(true);
      })
      .catch(function() {
        clearTimeout(id);
        callback(false);
      });
  } else {
    callback(true);
  }
}

function flushSyncQueue() {
  // Cloud-first: no offline sync queue needed
}

async function pushAllLocalDataToSupabase(userId, callback) {
  console.log('[sync] Cloud-first architecture active: data is written directly online.');
  if (callback) callback({ success: true, mode: 'cloud-first' });
}

function syncNow() {
  console.log('[sync] Cloud-first architecture active: all queries are live.');
  var session = null;
  try { session = require('./auth').getSession(); } catch(e) {}
  if (session && session.id) {
    settings.loadCloudSettings(session.id);
  }
  settings.setSetting('last_sync_at', new Date().toISOString());
}

async function pullDataFromSupabase(userId, callback) {
  console.log('[sync-pull] Cloud-first architecture active: syncing live settings.');
  try {
    await settings.loadCloudSettings(userId);
    if (callback) callback({ success: true, mode: 'cloud-first' });
  } catch(e) {
    if (callback) callback({ success: false, error: e.message });
  }
}

function pushSettingsToSupabase(userId, callback) {
  if (callback) callback({ success: true, mode: 'cloud-first' });
}

module.exports = {
  syncNow: syncNow,
  flushSyncQueue: flushSyncQueue,
  isOnline: isOnline,
  pullDataFromSupabase: pullDataFromSupabase,
  pushAllLocalDataToSupabase: pushAllLocalDataToSupabase,
  pushSettingsToSupabase: pushSettingsToSupabase
};
