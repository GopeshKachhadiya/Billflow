var fs   = require('fs');
var path = require('path');
var kd   = require('../crypto/key-derivation');
var enc  = require('../crypto/data-encryptor');
var conn = require('../db/connection');
var migrate = require('../db/migrate');

function getBootstrapPath() {
  try {
    return path.join(require('electron').app.getPath('userData'), 'bootstrap.json');
  } catch(e) {
    return path.join(__dirname, '../../data/bootstrap.json');
  }
}

function readBootstrap() {
  var p = getBootstrapPath();
  if (!fs.existsSync(p)) return {};
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch(e) { return {}; }
}

function writeBootstrap(data) {
  var p = getBootstrapPath();
  var dir = path.dirname(p);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8');
}

function login(email, password, callback) {
  var boot = readBootstrap();
  if (!boot.device_key_salt) {
    boot.device_key_salt = kd.generateDeviceSalt();
    writeBootstrap(boot);
  }

  var derivedKey;
  try {
    derivedKey = kd.deriveKey(password, boot.device_key_salt);
  } catch(e) {
    return callback({ success: false, error: 'Key derivation failed: ' + e.message });
  }

  conn.setDBKey(derivedKey);
  try {
    conn.getDB();
  } catch(e) {
    if (e.message === 'WRONG_PASSWORD') {
      conn.closeDB();
      return callback({ success: false, error: 'Incorrect password' });
    }
  }

  if (boot.key_verification) {
    if (!kd.verifyKey(derivedKey, boot.key_verification)) {
      conn.closeDB();
      return callback({ success: false, error: 'Incorrect password' });
    }
  } else {
    boot.key_verification = kd.generateVerificationBlob(derivedKey);
    writeBootstrap(boot);
  }

  migrate.runMigrations();
  enc.setKey(derivedKey);

  var settings = require('../db/queries/settings');
  var sbUrl = settings.getSetting('supabase_url');
  if (!sbUrl) {
    return callback({ success: true, mode: 'local-only', email: email });
  }

  var client = require('./client').getSupabaseClient();
  if (!client) {
    return callback({ success: true, mode: 'local-only', email: email });
  }

  client.auth.signInWithPassword({ email: email, password: password })
    .then(function(result) {
      if (result.error) {
        return callback({
          success: true,
          mode:    'local-only',
          email:   email,
          warning: 'Cloud login failed: ' + result.error.message
        });
      }

      var session = result.data.session;
      var user    = result.data.user;

      var db = conn.getDB();
      db.prepare('DELETE FROM users_local').run();
      db.prepare(
        'INSERT INTO users_local (id, email, role, access_token, refresh_token, expires_at) ' +
        'VALUES (?, ?, ?, ?, ?, ?)'
      ).run(
        user.id, user.email, 'owner',
        session.access_token, session.refresh_token,
        session.expires_at || Math.floor(Date.now() / 1000) + 3600
      );

      callback({ success: true, mode: 'full', email: user.email, userId: user.id });
    })
    .catch(function(err) {
      callback({ success: true, mode: 'local-only', email: email,
                 warning: 'Cloud error: ' + err.message });
    });
}

function logout() {
  try {
    var client = require('./client').getSupabaseClient();
    if (client) { client.auth.signOut(); }
  } catch(e) {}
  enc.clearKey();
  conn.closeDB();
  require('./client').resetClient();
}

function isLoggedIn() {
  if (!conn.isOpen()) return false;
  try {
    var row = conn.getDB()
      .prepare('SELECT * FROM users_local LIMIT 1')
      .get();
    if (!row) return true;
    return row.expires_at > Math.floor(Date.now() / 1000);
  } catch(e) { return false; }
}

function getSession() {
  if (!conn.isOpen()) return null;
  try {
    return conn.getDB().prepare('SELECT * FROM users_local LIMIT 1').get() || null;
  } catch(e) { return null; }
}

function refreshSession() {
  var client  = require('./client').getSupabaseClient();
  var session = getSession();
  if (!client || !session || !session.refresh_token) return;

  client.auth.refreshSession({ refresh_token: session.refresh_token })
    .then(function(result) {
      if (result.error || !result.data.session) return;
      var s = result.data.session;
      conn.getDB().prepare(
        'UPDATE users_local SET access_token = ?, expires_at = ?'
      ).run(s.access_token, s.expires_at);
    })
    .catch(function() {});
}

module.exports = { login: login, logout: logout, isLoggedIn: isLoggedIn,
                   getSession: getSession, refreshSession: refreshSession };
