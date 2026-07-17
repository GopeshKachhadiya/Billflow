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
    var session;
    try { session = require('./auth').getSession(); } catch(e) {}
    if (session && session.id) {
      pullDataFromSupabase(session.id);
    }
    settings.setSetting('last_sync_at', new Date().toISOString());
  });
}

async function pullDataFromSupabase(userId, callback) {
  var client = require('./client').getSupabaseClient();
  if (!client) {
    if (callback) callback({ success: false, error: 'Supabase client not initialized' });
    return;
  }

  try {
    console.log('[sync-pull] Starting data pull for user:', userId);

    // Try to flush pending local queue first so offline changes are pushed before merging
    if (sq.getPendingCount() > 0) {
      try { flushSyncQueue(); } catch (e) { console.warn('[sync-pull] Queue flush warning:', e.message); }
    }

    var customersRes = await client.from('customers').select('*').eq('owner_id', userId);
    var itemsCatalogRes = await client.from('items_catalog').select('*').eq('owner_id', userId);
    var billsRes = await client.from('bills').select('*').eq('owner_id', userId);
    var billItemsRes = await client.from('bill_items').select('*').eq('owner_id', userId);
    var taxRecordsRes = await client.from('tax_records').select('*').eq('owner_id', userId);
    var profilesRes = await client.from('profiles').select('*').eq('id', userId).single();

    if (customersRes.error && customersRes.error.code !== 'PGRST116') throw customersRes.error;
    if (itemsCatalogRes.error && itemsCatalogRes.error.code !== 'PGRST116') throw itemsCatalogRes.error;
    if (billsRes.error && billsRes.error.code !== 'PGRST116') throw billsRes.error;
    if (billItemsRes.error && billItemsRes.error.code !== 'PGRST116') throw billItemsRes.error;
    if (taxRecordsRes.error && taxRecordsRes.error.code !== 'PGRST116') throw taxRecordsRes.error;

    var customers = customersRes.data || [];
    var itemsCatalog = itemsCatalogRes.data || [];
    var bills = billsRes.data || [];
    var billItems = billItemsRes.data || [];
    var taxRecords = taxRecordsRes.data || [];
    var profile = profilesRes.data || null;

    var db = require('../db/connection').getDB();
    var encryptor = require('../crypto/data-encryptor');

    // Run in a transaction to safely and rapidly merge records into local SQLite
    var tx = db.transaction(function() {
      // 1. Sync Profile to settings
      if (profile) {
        var stmtSettings = db.prepare(
          "INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now')) " +
          "ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')"
        );
        var profileKeys = [
          'business_name', 'gstin', 'business_address', 'business_city', 'business_state',
          'business_state_code', 'business_pin', 'pan', 'bank_name', 'bank_account', 'bank_ifsc',
          'bill_prefix', 'default_gst_rate', 'upi_id', 'logo_data', 'signature_data',
          'business_phone', 'business_email', 'business_udyam', 'business_category', 'business_status',
          'wati_enabled', 'sms_enabled', 'notify_owner_phone', 'notify_owner_whatsapp',
          'notify_daily_summary', 'notify_weekly_report', 'notify_monthly_gst',
          'wati_api_url', 'wati_api_token', 'msg91_auth_key', 'msg91_sender_id',
          'email_from_name', 'email_from_address', 'smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass',
          'accountant_email', 'n8n_base_url', 'n8n_secret'
        ];
        profileKeys.forEach(function(k) {
          if (profile[k] !== undefined && profile[k] !== null) {
            stmtSettings.run(k, String(profile[k]));
          }
        });
      }

      // 2. Sync Customers using INSERT OR REPLACE
      var stmtCust = db.prepare(
        'INSERT OR REPLACE INTO customers (id, name, email, phone, state, state_code, is_active, ' +
        'encrypted_data, enc_iv, enc_auth_tag, created_at, updated_at) ' +
        'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      );
      customers.forEach(function(c) {
        var localCust = {
          id: c.id,
          name: c.name,
          email: c.email || '',
          phone: c.phone || '',
          state: c.state || '',
          state_code: c.state_code || '',
          is_active: c.is_active !== undefined ? c.is_active : true
        };
        var enc = encryptor.encryptCustomer(localCust);
        stmtCust.run(
          c.id, c.name, c.email || null, c.phone || null, c.state || null, c.state_code || null,
          c.is_active ? 1 : 0, enc.encryptedData, enc.iv, enc.authTag, c.created_at || new Date().toISOString(), c.updated_at || new Date().toISOString()
        );
      });

      // 3. Sync Items Catalog using INSERT OR REPLACE
      var stmtItem = db.prepare(
        'INSERT OR REPLACE INTO items_catalog (id, name, gst_rate, is_active, ' +
        'encrypted_data, enc_iv, enc_auth_tag, created_at, updated_at) ' +
        'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      );
      itemsCatalog.forEach(function(item) {
        var localItem = {
          id: item.id,
          name: item.name,
          gst_rate: item.gst_rate || 18,
          is_active: item.is_active !== undefined ? item.is_active : true
        };
        var enc = encryptor.encryptItem(localItem);
        stmtItem.run(
          item.id, item.name, item.gst_rate || 18, item.is_active ? 1 : 0,
          enc.encryptedData, enc.iv, enc.authTag, item.created_at || new Date().toISOString(), item.updated_at || new Date().toISOString()
        );
      });

      // 4. Sync Bills, Bill Items, Tax Records using INSERT OR REPLACE
      var stmtBill = db.prepare(
        'INSERT OR REPLACE INTO bills (id, bill_number, customer_id, bill_date, due_date, status, ' +
        'grand_total, amount_paid, amount_due, encrypted_data, enc_iv, enc_auth_tag, ' +
        'created_by, created_at, updated_at) ' +
        'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      );

      var stmtBillItem = db.prepare(
        'INSERT OR REPLACE INTO bill_items (id, bill_id, sort_order, catalog_item_id, description, ' +
        'hsn_sac, unit, quantity, unit_price, discount_percent, gst_rate, base_amount, ' +
        'discount_amount, taxable_amount, cgst_rate, cgst_amount, sgst_rate, sgst_amount, ' +
        'igst_rate, igst_amount, line_total, is_nil_rated, created_at) ' +
        'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      );

      var stmtTax = db.prepare(
        'INSERT OR REPLACE INTO tax_records (id, bill_id, bill_date, bill_number, total_taxable, ' +
        'total_cgst, total_sgst, total_igst, total_tax, grand_total, encrypted_data, enc_iv, enc_auth_tag, created_at, updated_at) ' +
        'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      );

      bills.forEach(function(b) {
        var thisBillItems = billItems.filter(function(bi) { return bi.bill_id === b.id; });
        var thisTaxRecord = taxRecords.find(function(tr) { return tr.bill_id === b.id; });

        var localBill = {
          id: b.id,
          bill_number: b.bill_number,
          customer_id: b.customer_id,
          bill_date: b.bill_date,
          due_date: b.due_date,
          status: b.status || 'draft',
          grand_total: b.grand_total || 0,
          amount_paid: b.amount_paid || 0,
          amount_due: b.amount_due || 0,
          created_by: b.created_by || '',
          created_at: b.created_at || new Date().toISOString(),
          updated_at: b.updated_at || new Date().toISOString()
        };

        var enc = encryptor.encryptBill(localBill, thisBillItems, thisTaxRecord || null);

        stmtBill.run(
          b.id, b.bill_number, b.customer_id, b.bill_date, b.due_date || null, b.status || 'draft',
          b.grand_total || 0, b.amount_paid || 0, b.amount_due || 0,
          enc.encryptedData, enc.iv, enc.authTag, b.created_by || '', b.created_at || new Date().toISOString(), b.updated_at || new Date().toISOString()
        );

        thisBillItems.forEach(function(bi) {
          stmtBillItem.run(
            bi.id, bi.bill_id, bi.sort_order || 0, bi.catalog_item_id || null, bi.description || '',
            bi.hsn_sac || '', bi.unit || 'Nos', bi.quantity || 1, bi.unit_price || 0,
            bi.discount_percent || 0, bi.gst_rate || 18, bi.base_amount || 0, bi.discount_amount || 0,
            bi.taxable_amount || 0, bi.cgst_rate || 0, bi.cgst_amount || 0, bi.sgst_rate || 0, bi.sgst_amount || 0,
            bi.igst_rate || 0, bi.igst_amount || 0, bi.line_total || 0, bi.is_nil_rated ? 1 : 0, bi.created_at || b.created_at || new Date().toISOString()
          );
        });

        if (thisTaxRecord) {
          var taxEnc = encryptor.encryptObject(thisTaxRecord);
          stmtTax.run(
            thisTaxRecord.id, thisTaxRecord.bill_id, thisTaxRecord.bill_date, thisTaxRecord.bill_number,
            thisTaxRecord.total_taxable || 0, thisTaxRecord.total_cgst || 0, thisTaxRecord.total_sgst || 0,
            thisTaxRecord.total_igst || 0, thisTaxRecord.total_tax || 0, thisTaxRecord.grand_total || 0,
            taxEnc.encryptedData, taxEnc.iv, taxEnc.authTag, thisTaxRecord.created_at || new Date().toISOString(), thisTaxRecord.updated_at || new Date().toISOString()
          );
        }
      });
    });

    tx();
    console.log('[sync-pull] Successfully synchronized database records from Supabase');
    if (callback) callback({ success: true, count: { customers: customers.length, bills: bills.length } });
  } catch (e) {
    console.error('[sync-pull] Pull synchronization failed:', e.message);
    if (callback) callback({ success: false, error: e.message });
  }
}

function pushSettingsToSupabase(userId, callback) {
  var client = require('./client').getSupabaseClient();
  if (!client) {
    if (callback) callback({ success: false, error: 'Supabase client not initialized' });
    return;
  }

  isOnline(function(online) {
    if (!online) {
      if (callback) callback({ success: false, error: 'Offline' });
      return;
    }

    try {
      var db = require('../db/connection').getDB();
      var rows = db.prepare('SELECT key, value FROM settings').all();
      var updatePayload = {};
      var profileKeys = [
        'business_name', 'gstin', 'business_address', 'business_city', 'business_state',
        'business_state_code', 'business_pin', 'pan', 'bank_name', 'bank_account', 'bank_ifsc',
        'bill_prefix', 'default_gst_rate', 'upi_id', 'logo_data', 'signature_data',
        'business_phone', 'business_email', 'business_udyam', 'business_category', 'business_status',
        'wati_enabled', 'sms_enabled', 'notify_owner_phone', 'notify_owner_whatsapp',
        'notify_daily_summary', 'notify_weekly_report', 'notify_monthly_gst',
        'wati_api_url', 'wati_api_token', 'msg91_auth_key', 'msg91_sender_id',
        'email_from_name', 'email_from_address', 'smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass',
        'accountant_email', 'n8n_base_url', 'n8n_secret'
      ];

      rows.forEach(function(row) {
        if (profileKeys.indexOf(row.key) !== -1) {
          updatePayload[row.key] = row.value;
        }
      });

      client.from('profiles')
        .update(updatePayload)
        .eq('id', userId)
        .then(function(res) {
          if (res.error) {
            console.error('[sync-push-settings] Error:', res.error);
            if (callback) callback({ success: false, error: res.error.message });
          } else {
            console.log('[sync-push-settings] Successfully pushed settings to Supabase.');
            if (callback) callback({ success: true });
          }
        })
        .catch(function(err) {
          console.error('[sync-push-settings] Exception:', err);
          if (callback) callback({ success: false, error: err.message });
        });
    } catch(e) {
      console.error('[sync-push-settings] Failed to build payload:', e.message);
      if (callback) callback({ success: false, error: e.message });
    }
  });
}

module.exports = {
  syncNow: syncNow,
  flushSyncQueue: flushSyncQueue,
  isOnline: isOnline,
  pullDataFromSupabase: pullDataFromSupabase,
  pushSettingsToSupabase: pushSettingsToSupabase
};
