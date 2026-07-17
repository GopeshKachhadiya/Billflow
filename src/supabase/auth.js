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

function wipeLocalDatabase() {
  try {
    conn.closeDB();
    var userDataPath;
    try {
      userDataPath = require('electron').app.getPath('userData');
    } catch(e) {
      userDataPath = path.join(__dirname, '../../data');
    }
    var dbPath = path.join(userDataPath, 'data.db');
    var files = [
      dbPath,
      dbPath + '-wal',
      dbPath + '-shm',
      path.join(userDataPath, 'bootstrap.json')
    ];
    files.forEach(function(f) {
      if (fs.existsSync(f)) {
        try { fs.unlinkSync(f); } catch(_) {}
      }
    });
    console.log('[auth] Local database and bootstrap wiped due to user switch');
  } catch(e) {
    console.error('[auth] Failed to wipe local database:', e.message);
  }
}

function login(email, password, callback) {
  var boot = readBootstrap();
  var normalizedEmail = (email || '').trim().toLowerCase();
  var isNewSwitch = false;
  if (boot.last_logged_in_email && boot.last_logged_in_email.trim().toLowerCase() !== normalizedEmail) {
    wipeLocalDatabase();
    boot = {};
    isNewSwitch = true;
  }

  if (!boot.device_key_salt) {
    boot.device_key_salt = kd.generateDeviceSalt();
    writeBootstrap(boot);
    isNewSwitch = true;
  }

  var derivedKey;
  try {
    derivedKey = kd.deriveKey(password, boot.device_key_salt);
  } catch(e) {
    return callback({ success: false, error: 'Key derivation failed: ' + e.message });
  }

  conn.setDBKey(derivedKey);
  var localKeyValid = true;
  try {
    conn.getDB();
  } catch(e) {
    if (e.message === 'WRONG_PASSWORD') {
      localKeyValid = false;
    } else {
      throw e;
    }
  }

  if (localKeyValid && boot.key_verification) {
    if (!kd.verifyKey(derivedKey, boot.key_verification)) {
      localKeyValid = false;
    }
  }

  var client = require('./client').getSupabaseClient();

  // If local key verification or SQLite opening failed due to wrong password:
  // Check with Supabase cloud FIRST. If online cloud password is valid, auto-heal local DB.
  if (!localKeyValid) {
    conn.closeDB();
    if (!client) {
      return callback({ success: false, error: 'Incorrect password' });
    }

    return client.auth.signInWithPassword({ email: email, password: password })
      .then(function(result) {
        if (result.error || !result.data || !result.data.session) {
          return callback({ success: false, error: 'Incorrect password' });
        }
        console.log('[auth] Cloud password verified after local mismatch — self-healing local database.');
        wipeLocalDatabase();
        boot = { device_key_salt: kd.generateDeviceSalt() };
        derivedKey = kd.deriveKey(password, boot.device_key_salt);
        conn.setDBKey(derivedKey);
        conn.getDB();
        boot.key_verification = kd.generateVerificationBlob(derivedKey);
        boot.last_logged_in_email = normalizedEmail;
        writeBootstrap(boot);
        migrate.runMigrations();
        enc.setKey(derivedKey);
        return proceedWithCloudSession(client, result.data.session, result.data.user, callback);
      })
      .catch(function(err) {
        return callback({ success: false, error: 'Incorrect password' });
      });
  }

  if (!boot.key_verification) {
    boot.key_verification = kd.generateVerificationBlob(derivedKey);
  }

  boot.last_logged_in_email = normalizedEmail;
  writeBootstrap(boot);

  migrate.runMigrations();
  enc.setKey(derivedKey);

  var settings = require('../db/queries/settings');
  var sbUrl = settings.getSetting('supabase_url');
  if (!sbUrl || !client) {
    return callback({ success: true, mode: 'local-only', email: email });
  }

  client.auth.signInWithPassword({ email: email, password: password })
    .then(function(result) {
      if (result.error) {
        var status = result.error.status;
        var msg = (result.error.message || '').toLowerCase();
        var isAuthError = status === 400 || status === 401 || status === 403 || status === 422 ||
                          msg.includes('invalid') || msg.includes('credential') || 
                          msg.includes('password') || msg.includes('email');
        if (isAuthError) {
          conn.closeDB();
          if (isNewSwitch) {
            wipeLocalDatabase();
          }
          return callback({
            success: false,
            error: result.error.message || 'Invalid login credentials'
          });
        }

        return callback({
          success: true,
          mode:    'local-only',
          email:   email,
          warning: 'Cloud login failed: ' + result.error.message
        });
      }

      return proceedWithCloudSession(client, result.data.session, result.data.user, callback);
    });
}

function proceedWithCloudSession(client, session, user, callback) {
  var email = user.email;
  client
    .from('admin_users')
    .select('status, trial_end_date, license_key')
    .eq('email', email)
    .single()
    .then(function(profileRes) {
      if (profileRes.error || !profileRes.data) {
        client.auth.signOut();
        conn.closeDB();
        return callback({
          success: false,
          error: 'Your account is not registered. Registration is only permitted through the admin panel.'
        });
      }

      var profile = profileRes.data;

      if (profile.status === 'suspended') {
        client.auth.signOut();
        conn.closeDB();
        return callback({ success: false, error: 'Your account has been suspended. Please contact the administrator.' });
      }
      if (profile.status === 'cancelled') {
        client.auth.signOut();
        conn.closeDB();
        return callback({ success: false, error: 'Your account has been cancelled.' });
      }
      if (profile.status === 'expired') {
        client.auth.signOut();
        conn.closeDB();
        return callback({ success: false, error: 'Your subscription has expired.' });
      }
      if (profile.status === 'trial') {
        var today = new Date().toISOString().split('T')[0];
        if (profile.trial_end_date && profile.trial_end_date < today) {
          client.auth.signOut();
          conn.closeDB();
          return callback({ success: false, error: 'Your trial has expired. Expiry: ' + profile.trial_end_date });
        }
      }

      var db = conn.getDB();
      db.prepare('DELETE FROM users_local').run();
      db.prepare(
        'INSERT INTO users_local (id, email, role, access_token, refresh_token, expires_at, status, trial_end_date) ' +
        'VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(
        user.id, user.email, 'owner',
        session.access_token, session.refresh_token,
        session.expires_at || Math.floor(Date.now() / 1000) + 3600,
        profile.status,
        profile.trial_end_date
      );
      var sync = require('./sync');
      sync.pullDataFromSupabase(user.id, function(pullRes) {
        if (!pullRes.success) {
          console.warn('[auth] Pull sync warning on login:', pullRes.error);
        }
        callback({ success: true, mode: 'full', email: user.email, userId: user.id });
      });
    })
    .catch(function(err) {
      client.auth.signOut();
      conn.closeDB();
      callback({ success: false, error: 'Authorization verification failed: ' + err.message });
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
  var enc = require('../crypto/data-encryptor');
  if (!enc.getKey()) return false;
  if (!conn.isOpen()) return false;
  try {
    var row = conn.getDB()
      .prepare('SELECT * FROM users_local LIMIT 1')
      .get();
    if (!row) return false;

    // Check status and trial expiry on app launch
    if (row.status === 'suspended' || row.status === 'cancelled' || row.status === 'expired') {
      return false;
    }
    if (row.status === 'trial') {
      var today = new Date().toISOString().split('T')[0];
      if (row.trial_end_date && row.trial_end_date < today) {
        return false;
      }
    }

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
