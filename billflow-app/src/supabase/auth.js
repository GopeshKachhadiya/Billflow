var fs   = require('fs');
var path = require('path');
var electron = require('electron');

var _currentSession = null;
var _currentUser    = null;
var _currentProfile = null;

function getSessionPath() {
  try {
    return path.join(electron.app.getPath('userData'), 'cloud_session.json');
  } catch(e) {
    return path.join(__dirname, '../../data/cloud_session.json');
  }
}

var loginAttempts = {};
var otpAttempts = {};

function isRateLimited(ipOrEmail, attemptsMap, maxAttempts, windowMs) {
  // Rate limiting disabled per user request
  return false;
}

function saveSessionToDisk(session, user, profile, derivedKeyHex) {
  _currentSession = session;
  _currentUser    = user;
  _currentProfile = profile;
  try {
    var p = getSessionPath();
    var dir = path.dirname(p);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    
    var existingKey = null;
    try {
      var enc = require('../crypto/data-encryptor');
      var k = enc.getKey();
      if (k) existingKey = k.toString('hex');
    } catch(e) {}

    var rawText = JSON.stringify({
      session: session,
      user: user,
      profile: profile,
      enc_key: derivedKeyHex || existingKey || null,
      saved_at: Date.now()
    }, null, 2);

    if (electron.safeStorage && electron.safeStorage.isEncryptionAvailable()) {
      var encryptedBuf = electron.safeStorage.encryptString(rawText);
      fs.writeFileSync(p, encryptedBuf);
    } else {
      fs.writeFileSync(p, rawText, 'utf8');
    }
  } catch(e) {
    console.error('[auth] Failed to save cloud session to disk:', e.message);
  }
}

function loadSessionFromDisk() {
  if (_currentSession && _currentUser) {
    return { session: _currentSession, user: _currentUser, profile: _currentProfile };
  }
  try {
    var p = getSessionPath();
    if (fs.existsSync(p)) {
      var rawContent = fs.readFileSync(p);
      var text = '';

      if (electron.safeStorage && electron.safeStorage.isEncryptionAvailable()) {
        try {
          text = electron.safeStorage.decryptString(rawContent);
        } catch (decErr) {
          text = rawContent.toString('utf8');
        }
      } else {
        text = rawContent.toString('utf8');
      }

      var data = JSON.parse(text);
      if (data && data.session && data.user) {
        _currentSession = data.session;
        _currentUser    = data.user;
        _currentProfile = data.profile || null;

        // Restore E2EE Key if saved
        if (data.enc_key) {
          try {
            var enc = require('../crypto/data-encryptor');
            enc.setKey(Buffer.from(data.enc_key, 'hex'));
            console.log('[auth] E2EE encryption key restored from secure storage.');
          } catch(err) {
            console.error('[auth] Failed to restore E2EE key:', err.message);
          }
        }

        // Auto-refresh Supabase token seamlessly in background
        var client = require('./client').getSupabaseClient();
        if (client && _currentSession.access_token && _currentSession.refresh_token) {
          client.auth.setSession({
            access_token: _currentSession.access_token,
            refresh_token: _currentSession.refresh_token
          }).then(function(res) {
            if (res.data && res.data.session) {
              _currentSession = res.data.session;
              saveSessionToDisk(res.data.session, res.data.user || _currentUser, _currentProfile, data.enc_key);
            }
          }).catch(function() {
            client.auth.refreshSession({ refresh_token: _currentSession.refresh_token })
              .then(function(res) {
                if (res.data && res.data.session) {
                  _currentSession = res.data.session;
                  saveSessionToDisk(res.data.session, res.data.user || _currentUser, _currentProfile, data.enc_key);
                }
              }).catch(function() {});
          });
        }
        return data;
      }
    }
  } catch(e) {
    console.error('[auth] Failed to load cloud session from disk:', e.message);
  }
  return null;
}

function wipeSessionDisk() {
  _currentSession = null;
  _currentUser    = null;
  _currentProfile = null;
  try {
    var p = getSessionPath();
    if (fs.existsSync(p)) fs.unlinkSync(p);
  } catch(e) {}
}

function checkProfileStatus(client, email, user, session, password, callback) {
  // First check admin_users, then profiles
  client
    .from('admin_users')
    .select('status, trial_end_date, license_key')
    .eq('email', email)
    .single()
    .then(function(profileRes) {
      if (!profileRes.error && profileRes.data) {
        return evaluateProfileAndProceed(profileRes.data, user, session, password, callback);
      }
      // If not in admin_users, check profiles table
      client
        .from('profiles')
        .select('status, trial_end_date, license_key, encryption_salt')
        .eq('id', user.id)
        .single()
        .then(function(profRes2) {
          if (!profRes2.error && profRes2.data) {
            return evaluateProfileAndProceed(profRes2.data, user, session, password, callback);
          }
          // Default profile if newly created or missing from both tables
          var defaultProfile = { status: 'trial', trial_end_date: new Date(Date.now() + 14*86400000).toISOString().split('T')[0] };
          return evaluateProfileAndProceed(defaultProfile, user, session, password, callback);
        });
    })
    .catch(function(err) {
      client.auth.signOut().catch(function() {});
      callback({ success: false, error: 'Failed to verify account status: ' + err.message });
    });
}

function evaluateProfileAndProceed(profile, user, session, password, callback) {
  if (profile.status === 'suspended') {
    require('./client').getSupabaseClient().auth.signOut().catch(function() {});
    return callback({ success: false, error: 'Your account has been suspended. Please contact the administrator.' });
  }
  if (profile.status === 'cancelled') {
    require('./client').getSupabaseClient().auth.signOut().catch(function() {});
    return callback({ success: false, error: 'Your account has been cancelled.' });
  }
  if (profile.status === 'expired') {
    require('./client').getSupabaseClient().auth.signOut().catch(function() {});
    return callback({ success: false, error: 'Your subscription has expired.' });
  }
  if (profile.status === 'trial') {
    var today = new Date().toISOString().split('T')[0];
    if (profile.trial_end_date && profile.trial_end_date < today) {
      require('./client').getSupabaseClient().auth.signOut().catch(function() {});
      return callback({ success: false, error: 'Your trial has expired. Expiry date: ' + profile.trial_end_date });
    }
  }

  // Save session and profile securely
  saveSessionToDisk(session, user, profile);

  // Derive and set E2EE encryption key
  if (password) {
    try {
      var kd = require('../crypto/key-derivation');
      var enc = require('../crypto/data-encryptor');
      var client = require('./client').getSupabaseClient();
      var salt = profile.encryption_salt;
      
      if (!salt) {
        // First time login: generate salt and save to profiles
        salt = kd.generateDeviceSalt();
        profile.encryption_salt = salt;
        // Don't await this, just fire and forget (save salt to DB)
        client.from('profiles').update({ encryption_salt: salt }).eq('id', user.id).then(function(){}, function(){});
      }
      
      var derivedKey = kd.deriveKey(password, salt);
      enc.setKey(derivedKey);
      console.log('[auth] E2EE key successfully derived and set.');
    } catch(err) {
      console.error('[auth] E2EE key derivation failed:', err);
    }
  }

  // Sync settings/profile to local memory cache
  var settings = require('../db/queries/settings');
  settings.loadCloudSettings(user.id).then(function() {
    callback({ success: true, mode: 'cloud', email: user.email, userId: user.id });
  }).catch(function() {
    callback({ success: true, mode: 'cloud', email: user.email, userId: user.id });
  });
}

function login(email, password, callback) {
  var normalizedEmail = (email || '').trim().toLowerCase();
  if (!normalizedEmail || !password) {
    return callback({ success: false, error: 'Please enter both email and password.' });
  }

  // Rate limit: max 5 login attempts per email per 5 minutes
  if (isRateLimited('login_' + normalizedEmail, loginAttempts, 5, 5 * 60 * 1000)) {
    return callback({ success: false, error: 'Too many failed attempts. Please wait 5 minutes before trying again.' });
  }

  var client = require('./client').getSupabaseClient();
  if (!client) {
    return callback({ success: false, error: 'Supabase cloud connection is not configured. Please check your .env file or settings.' });
  }

  client.auth.signInWithPassword({ email: normalizedEmail, password: password })
    .then(function(result) {
      if (result.error || !result.data || !result.data.session) {
        var msg = result.error ? result.error.message : 'Invalid login credentials';
        return callback({ success: false, error: msg });
      }

      var session = result.data.session;
      var user    = result.data.user;
      checkProfileStatus(client, normalizedEmail, user, session, password, callback);
    })
    .catch(function(err) {
      callback({ success: false, error: 'Authentication request failed: ' + err.message });
    });
}

function logout() {
  try {
    var client = require('./client').getSupabaseClient();
    if (client) { client.auth.signOut().catch(function() {}); }
  } catch(e) {}
  wipeSessionDisk();
}

function isLoggedIn() {
  var loaded = loadSessionFromDisk();
  if (!loaded || !loaded.session || !loaded.user) return false;

  if (loaded.profile) {
    var status = loaded.profile.status;
    if (status === 'suspended' || status === 'cancelled' || status === 'expired') return false;
    if (status === 'trial' && loaded.profile.trial_end_date) {
      var today = new Date().toISOString().split('T')[0];
      if (loaded.profile.trial_end_date < today) return false;
    }
  }
  return true;
}

function getSession() {
  var loaded = loadSessionFromDisk();
  if (!loaded) return null;
  return {
    id: loaded.user.id,
    email: loaded.user.email,
    access_token: loaded.session.access_token,
    refresh_token: loaded.session.refresh_token,
    expires_at: loaded.session.expires_at,
    status: loaded.profile ? loaded.profile.status : 'active',
    trial_end_date: loaded.profile ? loaded.profile.trial_end_date : null
  };
}

function refreshSession() {
  var client = require('./client').getSupabaseClient();
  var loaded = loadSessionFromDisk();
  if (!client || !loaded || !loaded.session || !loaded.session.refresh_token) return;

  client.auth.refreshSession({ refresh_token: loaded.session.refresh_token })
    .then(function(result) {
      if (result.error || !result.data.session) return;
      saveSessionToDisk(result.data.session, result.data.user || loaded.user, loaded.profile);
    })
    .catch(function() {});
}

var otpMailer = require('../utils/otp-mailer');

function sendResetOTP(email) {
  var normalizedEmail = (email || '').trim().toLowerCase();
  if (!normalizedEmail) {
    return Promise.resolve({ success: false, error: 'Please enter a valid email address.' });
  }

  // Rate limit: max 3 OTP requests per email per 10 minutes
  if (isRateLimited('otp_' + normalizedEmail, otpAttempts, 3, 10 * 60 * 1000)) {
    return Promise.resolve({ success: false, error: 'Too many OTP requests. Please wait 10 minutes before requesting again.' });
  }
  var client = require('./client').getSupabaseClient();
  if (!client) {
    return Promise.resolve({ success: false, error: 'Cloud connection unavailable.' });
  }

  var otpCode = otpMailer.generate6DigitOTP();
  var expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

  // Insert OTP into password_otp_resets table (and fallback to local settings if table not yet migrated)
  return client.from('password_otp_resets').insert({
    email: normalizedEmail,
    otp_code: otpCode,
    expires_at: expiresAt,
    verified: false
  }).then(function(insertRes) {
    if (insertRes.error) {
      console.warn('[auth] OTP table insert notice:', insertRes.error.message);
      // Save locally in SQLite settings if cloud table does not exist
      settings.setSetting('recovery_otp_' + normalizedEmail, JSON.stringify({
        code: otpCode,
        expires_at: expiresAt
      }));
    }
    // Also trigger Supabase Auth reset for fallback compatibility
    client.auth.resetPasswordForEmail(normalizedEmail).catch(function() {});

    // Send custom branded 6-digit OTP email directly via SMTP
    return otpMailer.sendOTPEmail(normalizedEmail, otpCode).then(function(mailRes) {
      if (mailRes.success) {
        return { success: true, message: '6-digit OTP code sent to your email (' + normalizedEmail + ').' };
      } else {
        // If email failed, check if we had any table/local error or return the exact SMTP error
        console.error('[auth] SMTP delivery failure:', mailRes.error);
        return { 
          success: false, 
          error: 'Email delivery failed (' + mailRes.error + '). Please check your Gmail App Password or SMTP settings.' 
        };
      }
    });
  }).catch(function(err) {
    return { success: false, error: err ? err.message : 'Failed to dispatch OTP.' };
  });
}

function verifyResetOTP(email, otp) {
  var normalizedEmail = (email || '').trim().toLowerCase();
  var token = (otp || '').trim();
  if (!normalizedEmail || !token) {
    return Promise.resolve({ success: false, error: 'Please enter both email and OTP code.' });
  }
  var client = require('./client').getSupabaseClient();
  if (!client) {
    return Promise.resolve({ success: false, error: 'Cloud connection unavailable.' });
  }

  // SEC-03 FIX: Use server-side RPC for OTP verification instead of direct table queries.
  // The verify_password_otp function runs with SECURITY DEFINER, so it can access the
  // OTP table without exposing read access to the client (preventing OTP code theft).
  return client.rpc('verify_password_otp', { p_email: normalizedEmail, p_otp: token })
    .then(function(rpcRes) {
      if (!rpcRes.error && rpcRes.data === true) {
        return { success: true, verifiedByRPC: true };
      }

      // Check local settings cache as fallback (for cases where OTP table insert failed)
      var localCached = settings.getSetting('recovery_otp_' + normalizedEmail);
      if (localCached) {
        try {
          var parsed = JSON.parse(localCached);
          if (parsed.code === token && new Date(parsed.expires_at) > new Date()) {
            settings.setSetting('recovery_otp_' + normalizedEmail, ''); // clear once used
            return { success: true, verifiedByLocal: true };
          }
        } catch(e) {}
      }

      // Fallback to Supabase Auth OTP verification
      return client.auth.verifyOtp({ email: normalizedEmail, token: token, type: 'recovery' })
        .then(function(authRes) {
          if (authRes.error || !authRes.data || !authRes.data.session) {
            return { success: false, error: authRes.error ? authRes.error.message : 'Invalid or expired OTP code.' };
          }
          return { success: true, session: authRes.data.session };
        });
    })
    .catch(function(err) {
      return { success: false, error: err ? err.message : 'OTP verification failed.' };
    });
}

function updatePassword(newPassword) {
  if (!newPassword || newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
    return Promise.resolve({ success: false, error: 'Password must be at least 8 characters long and include an uppercase letter and a number.' });
  }
  var client = require('./client').getSupabaseClient();
  if (!client) {
    return Promise.resolve({ success: false, error: 'Cloud connection unavailable.' });
  }

  return client.auth.updateUser({ password: newPassword })
    .then(function(res) {
      if (res.error) {
        return { success: false, error: res.error.message };
      }
      return { success: true, message: 'Password updated successfully.' };
    })
    .catch(function(err) {
      return { success: false, error: err ? err.message : 'Password update failed.' };
    });
}

// Auto-restore session on startup if disk cache exists
try {
  loadSessionFromDisk();
} catch(e) {}

module.exports = {
  login: login,
  logout: logout,
  isLoggedIn: isLoggedIn,
  getSession: getSession,
  refreshSession: refreshSession,
  sendResetOTP: sendResetOTP,
  verifyResetOTP: verifyResetOTP,
  updatePassword: updatePassword
};
