var sq       = require('../db/queries/sync-queue');
var settings = require('../db/queries/settings');
var webhooks = require('../n8n/webhooks');

function isOnline(callback) {
  var url = settings.getSetting('supabase_url');
  if (!url) { return callback(false); }

  if (typeof fetch === 'function') {
    var controller = new AbortController();
    var id = setTimeout(function() { controller.abort(); }, 3000);
    fetch(url, { method: 'HEAD', signal: controller.signal })
      .then(function(res) {
        clearTimeout(id);
        callback(res.status > 0);
      })
      .catch(function() {
        clearTimeout(id);
        callback(false);
      });
  } else {
    try {
      var parsedUrl = require('url').parse(url);
      var httpModule = parsedUrl.protocol === 'https:' ? require('https') : require('http');
      var req = httpModule.request({
        method: 'HEAD',
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.path,
        timeout: 3000
      }, function(res) {
        callback(res.statusCode > 0);
      });
      req.on('error', function() { callback(false); });
      req.on('timeout', function() { req.destroy(); callback(false); });
      req.end();
    } catch (e) {
      callback(false);
    }
  }
}

function flushSyncQueue() {
  var pending = sq.getPendingQueue();
  if (pending.length === 0) return;
  webhooks.syncPush(pending);
  for (var i = 0; i < pending.length; i++) {
    sq.markSuccess(pending[i].id);
  }
}

function syncNow() {
  isOnline(function(online) {
    if (!online) {
      console.log('[sync] Offline — sync deferred');
      return;
    }
    flushSyncQueue();
    settings.setSetting('last_sync_at', new Date().toISOString());
  });
}

module.exports = { syncNow: syncNow, flushSyncQueue: flushSyncQueue, isOnline: isOnline };
