// src/gst/lookup.js
// ES5 — Fetches customer details based on GSTIN from SQLite Cache, Supabase Cache, or Sandbox API

var stateCodes = require('../utils/state-codes');
var sbClient   = require('../supabase/client');

var settings = require('../db/queries/settings');

// SEC-01 FIX: API credentials loaded from env/settings — NEVER hardcoded
function getSandboxCredentials() {
  return {
    apiKey:    process.env.SANDBOX_API_KEY    || settings.getSetting('sandbox_api_key')    || '',
    apiSecret: process.env.SANDBOX_API_SECRET || settings.getSetting('sandbox_api_secret') || '',
    apiVersion: '1.0'
  };
}

var cachedToken = null;
var tokenExpiry = 0;

function authenticate() {
  return new Promise(function(resolve, reject) {
    if (cachedToken && Date.now() < tokenExpiry) {
      return resolve(cachedToken);
    }

    var creds = getSandboxCredentials();
    if (!creds.apiKey || !creds.apiSecret) {
      return reject(new Error('Sandbox API credentials not configured. Please set SANDBOX_API_KEY and SANDBOX_API_SECRET in your environment or settings.'));
    }

    fetch('https://api.sandbox.co.in/authenticate', {
      method: 'POST',
      headers: {
        'x-api-key': creds.apiKey,
        'x-api-secret': creds.apiSecret,
        'x-api-version': creds.apiVersion,
        'Content-Type': 'application/json'
      }
    })
    .then(function(res) {
      if (!res.ok) {
        return res.json().then(function(errBody) {
          throw new Error((errBody && errBody.message) || 'Authentication failed with status ' + res.status);
        }).catch(function() {
          throw new Error('Authentication failed with status ' + res.status);
        });
      }
      return res.json();
    })
    .then(function(data) {
      if (data && data.access_token) {
        cachedToken = data.access_token;
        tokenExpiry = Date.now() + 23 * 60 * 60 * 1000;
        resolve(cachedToken);
      } else {
        throw new Error('No access token returned from Sandbox');
      }
    })
    .catch(function(err) {
      reject(err);
    });
  });
}


// Save a GSTIN details to cloud Supabase cache
function saveToCloudCache(gstin, data) {
  var client = sbClient.getSupabaseClient();
  if (!client) return Promise.resolve();
  var cleanGstin = String(gstin || '').trim().toUpperCase();
  if (cleanGstin.length !== 15) return Promise.resolve();

  return client
    .from('gstin_cache')
    .upsert({
      gstin:           cleanGstin,
      name:            data.name || 'GST Registered Business',
      type:            data.type || 'Business',
      state:           data.state || '',
      state_code:      data.state_code || cleanGstin.substring(0, 2),
      billing_address: data.billing_address || data.address || '',
      billing_city:    data.billing_city || data.city || '',
      billing_pin:     data.billing_pin || data.pin || '',
      status:          data.status || 'Active',
      updated_at:      new Date().toISOString()
    }, { onConflict: 'gstin' })
    .then(function(res) {
      if (res.error) {
        console.error('[lookup] Failed to write to cloud Supabase cache:', res.error.message);
      } else {
        console.log('[lookup] Successfully saved GSTIN to global database:', cleanGstin);
      }
    })
    .catch(function(err) {
      console.error('[lookup] Cloud cache write error:', err.message);
    });
}

function fetchDetails(gstin) {
  return new Promise(function(resolve, reject) {
    var cleanGstin = gstin.trim().toUpperCase();
    
    // Validation check
    var regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!regex.test(cleanGstin)) {
      return reject(new Error('Invalid GSTIN format. Details could not be fetched.'));
    }

    // Check Cloud Supabase Cache First
    var client = sbClient.getSupabaseClient();
    var cloudPromise = Promise.resolve(null);
    if (client) {
      cloudPromise = client
        .from('gstin_cache')
        .select('*')
        .eq('gstin', cleanGstin)
        .maybeSingle()
        .then(function(res) {
          if (res.data) {
            console.log('[lookup] Cache Hit (Supabase) for', cleanGstin);
            return {
              name:            res.data.name,
              type:            res.data.type,
              email:           '',
              phone:           '',
              state:           res.data.state,
              state_code:      res.data.state_code,
              billing_address: res.data.billing_address,
              billing_city:    res.data.billing_city,
              billing_pin:     res.data.billing_pin,
              payment_terms:   'due_on_receipt',
              notes:           'Loaded from cloud GST cache. Status: ' + res.data.status
            };
          }
          return null;
        })
        .catch(function(err) {
          console.error('[lookup] Cloud cache query error:', err.message);
          return null;
        });
    }

    cloudPromise.then(function(cloudResult) {
      if (cloudResult) {
        return resolve(cloudResult);
      }

      // 3. Fallback: Call Sandbox API
      console.log('[lookup] Cache Miss — Calling Sandbox API for', cleanGstin);
      authenticate()
        .then(function(token) {
          var creds = getSandboxCredentials();
          return fetch('https://api.sandbox.co.in/gst/compliance/public/gstin/search', {
            method: 'POST',
            headers: {
              'x-api-key': creds.apiKey,
              'authorization': token,
              'x-api-version': creds.apiVersion,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ gstin: cleanGstin })
          });
        })
        .then(function(res) {
          if (!res.ok) {
            return res.json().then(function(errBody) {
              throw new Error((errBody && errBody.message) || 'GSTIN Search failed with status ' + res.status);
            }).catch(function() {
              throw new Error('GSTIN Search failed with status ' + res.status);
            });
          }
          return res.json();
        })
        .then(function(result) {
          if (result && result.data && result.data.data) {
            var gstData = result.data.data;
            var stateCode = cleanGstin.substring(0, 2);
            var stateName = stateCodes.getStateName(stateCode) || 'Maharashtra';

            var billingAddress = '';
            var city = '';
            var pin = '';
            
            if (gstData.pradr && gstData.pradr.addr) {
              var addr = gstData.pradr.addr;
              var parts = [];
              if (addr.bno) parts.push(addr.bno);
              if (addr.bnm) parts.push(addr.bnm);
              if (addr.st) parts.push(addr.st);
              if (addr.loc) parts.push(addr.loc);
              if (addr.dst) {
                parts.push(addr.dst);
                city = addr.dst;
              }
              if (addr.pncd) {
                parts.push(addr.pncd);
                pin = addr.pncd;
              }
              billingAddress = parts.join(', ');
            }

            var mappedData = {
              name:            gstData.lgnm || gstData.tradeNam || 'Unknown Business',
              type:            (gstData.dty && gstData.dty.toLowerCase().indexOf('proprietorship') !== -1) ? 'Individual' : 'Business',
              state:           stateName,
              state_code:      stateCode,
              billing_address: billingAddress,
              billing_city:    city,
              billing_pin:     pin,
              status:          gstData.sts || 'Active'
            };

            // Save retrieved details to cloud cache
            saveToCloudCache(cleanGstin, mappedData);

            resolve({
              name:            mappedData.name,
              type:            mappedData.type,
              email:           '',
              phone:           '',
              state:           mappedData.state,
              state_code:      mappedData.state_code,
              billing_address: mappedData.billing_address,
              billing_city:    mappedData.billing_city,
              billing_pin:     mappedData.billing_pin,
              payment_terms:   'due_on_receipt',
              notes:           'Auto-fetched from live GST database. Status: ' + mappedData.status
            });
          } else {
            resolve(null);
          }
        })
        .catch(function(err) {
          console.error('[lookup] Live API Call Failed:', err);
          reject(err);
        });
    });
  });
}

// Bulk cache multiple GSTINs (used during CSV imports)
function cacheBulk(records) {
  if (!records || !Array.isArray(records)) return Promise.resolve({ success: false, count: 0 });

  var validPayloads = [];
  records.forEach(function(rec) {
    var g = String(rec.gstin || '').trim().toUpperCase();
    if (g.length === 15) {
      validPayloads.push({
        gstin:           g,
        name:            rec.name || 'GST Registered Business',
        type:            rec.type || 'Business',
        state:           rec.state || '',
        state_code:      rec.state_code || g.substring(0, 2),
        billing_address: rec.billing_address || rec.address || '',
        billing_city:    rec.billing_city || rec.city || '',
        billing_pin:     rec.billing_pin || rec.pin || '',
        status:          rec.status || 'Active',
        updated_at:      new Date().toISOString()
      });
    }
  });

  if (validPayloads.length === 0) return Promise.resolve({ success: true, count: 0 });

  var client = sbClient.getSupabaseClient();
  if (!client) return Promise.resolve({ success: false, count: 0 });

  return client
    .from('gstin_cache')
    .upsert(validPayloads, { onConflict: 'gstin' })
    .then(function(res) {
      if (res.error) {
        console.error('[lookup] Bulk GSTIN cache failed:', res.error.message);
        return { success: false, error: res.error.message };
      }
      console.log('[lookup] Successfully cached ' + validPayloads.length + ' GSTINs to global database!');
      return { success: true, count: validPayloads.length };
    })
    .catch(function(err) {
      console.error('[lookup] Bulk GSTIN cache exception:', err.message);
      return { success: false, error: err.message };
    });
}

module.exports = {
  fetchDetails: fetchDetails,
  cacheBulk:    cacheBulk
};
