var settings = require('../db/queries/settings');

function isOnline(callback) {
  var url = settings.getSetting('supabase_url') || 'https://www.google.com';
  if (typeof process !== 'undefined' && process.versions && process.versions.electron) {
    try {
      var net = require('electron').net;
      var request = net.request({ method: 'HEAD', url: url });
      var timer = setTimeout(function() { request.abort(); callback(false); }, 3000);
      request.on('response', function(res) {
        clearTimeout(timer);
        callback(res.statusCode >= 200 && res.statusCode < 500);
      });
      request.on('error', function() {
        clearTimeout(timer);
        callback(false);
      });
      request.end();
      return;
    } catch (e) {}
  }

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
  // Cloud-first: direct online writes. If offline queue items exist, they can be retried here.
}

async function pushAllLocalDataToSupabase(userId, callback) {
  console.log('[sync] Cloud-first architecture active: data is written directly online.');
  if (callback) callback({ success: true, mode: 'cloud-first', syncedAt: new Date().toISOString() });
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
