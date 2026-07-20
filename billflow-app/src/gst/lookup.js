// src/gst/lookup.js
// ES5 — Fetches customer details based on GSTIN from SQLite Cache, Supabase Cache, or Sandbox API

var stateCodes = require('../utils/state-codes');
var sbClient   = require('../supabase/client');

var API_KEY = 'key_live_bc4e40cd20a4406fb7184100c77a1673';
var API_SECRET = 'secret_live_f92739c4ae1f415ba47e9b969ad825a7';
var API_VERSION = '1.0';

var cachedToken = null;
var tokenExpiry = 0;

function authenticate() {
  return new Promise(function(resolve, reject) {
    if (cachedToken && Date.now() < tokenExpiry) {
      return resolve(cachedToken);
    }

    fetch('https://api.sandbox.co.in/authenticate', {
      method: 'POST',
      headers: {
        'x-api-key': API_KEY,
        'x-api-secret': API_SECRET,
        'x-api-version': API_VERSION,
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

  return client
    .from('gstin_cache')
    .upsert({
      gstin:           gstin,
      name:            data.name,
      type:            data.type || 'Business',
      state:           data.state || '',
      state_code:      data.state_code || '',
      billing_address: data.billing_address || '',
      billing_city:    data.billing_city || '',
      billing_pin:     data.billing_pin || '',
      status:          data.status || 'Active',
      updated_at:      new Date().toISOString()
    })
    .then(function(res) {
      if (res.error) {
        console.error('[lookup] Failed to write to cloud Supabase cache:', res.error.message);
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
          return fetch('https://api.sandbox.co.in/gst/compliance/public/gstin/search', {
            method: 'POST',
            headers: {
              'x-api-key': API_KEY,
              'authorization': token,
              'x-api-version': API_VERSION,
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

// Bulk cache multiple GSTINs (used during imports)
function cacheBulk(records) {
  if (!records || !Array.isArray(records)) return Promise.resolve({ success: false });

  records.forEach(function(rec) {
    if (rec.gstin && rec.name) {
      saveToCloudCache(rec.gstin, rec);
    }
  });

  return Promise.resolve({ success: true, count: records.length });
}

module.exports = {
  fetchDetails: fetchDetails,
  cacheBulk:    cacheBulk
};
