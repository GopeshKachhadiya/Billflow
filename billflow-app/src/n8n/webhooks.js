var settings = require('../db/queries/settings');

function resolveWebhookUrl(eventSettingKey, defaultPath) {
  var envKey = eventSettingKey.toUpperCase();
  var specificUrl = process.env[envKey] || settings.getSetting(eventSettingKey);
  if (specificUrl && typeof specificUrl === 'string' && specificUrl.trim().length > 0) {
    var trimmed = specificUrl.trim();
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      trimmed = 'http://' + trimmed;
    }
    return trimmed;
  }

  var baseUrl = process.env.N8N_BASE_URL || process.env.WEBHOOK_BASE_URL || settings.getSetting('n8n_base_url') || '';
  if (typeof baseUrl === 'string' && baseUrl.trim().length > 0) {
    baseUrl = baseUrl.trim().replace(/\/$/, '');
    if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      baseUrl = 'http://' + baseUrl;
    }
    var path = defaultPath.startsWith('/') ? defaultPath : '/' + defaultPath;
    return baseUrl + path;
  }

  return null;
}

function callWebhook(eventSettingKey, defaultPath, payload) {
  try {
    var url = resolveWebhookUrl(eventSettingKey, defaultPath);
    if (!url) {
      return;
    }
    var secret = process.env.N8N_SECRET || process.env.WEBHOOK_SECRET || settings.getSetting('n8n_secret') || '';

    console.log('[Backend Webhook] Triggering ' + eventSettingKey + ' -> ' + url);

    if (typeof process !== 'undefined' && process.versions && process.versions.electron) {
      try {
        var net = require('electron').net;
        var request = net.request({
          method: 'POST',
          url: url
        });
        request.setHeader('Content-Type', 'application/json');
        if (secret) request.setHeader('X-BillFlow-Secret', secret);

        request.on('response', function(response) {
          console.log('[Backend Webhook] ' + eventSettingKey + ' HTTP Status:', response.statusCode);
        });

        request.on('error', function(e) {
          console.error('[Backend Webhook] Failed (net):', eventSettingKey, e.message);
        });

        request.write(JSON.stringify(payload));
        request.end();
        return;
      } catch (e) {
        console.error('[Backend Webhook] Net exception:', eventSettingKey, e.message);
      }
    }

    if (typeof fetch === 'function') {
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-BillFlow-Secret': secret
        },
        body: JSON.stringify(payload)
      }).then(function(res) {
        console.log('[Backend Webhook] ' + eventSettingKey + ' fetch HTTP Status:', res.status);
      }).catch(function(e) {
        console.error('[Backend Webhook] Fetch failed:', eventSettingKey, e.message);
      });
    }
  } catch (err) {
    console.error('[Backend Webhook] Error:', err.message);
  }
}

function testWebhook(targetUrl) {
  return new Promise(function(resolve) {
    try {
      var url = targetUrl || settings.getSetting('n8n_base_url') || 'http://localhost:5678';
      if (typeof url === 'string') {
        url = url.trim();
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          url = 'http://' + url;
        }
      } else {
        url = 'http://localhost:5678';
      }
      var secret = settings.getSetting('n8n_secret') || '';

      var payload = { event: 'test_connection', timestamp: new Date().toISOString(), message: 'Satya BillFlow n8n Webhook Diagnostic Test' };

      if (typeof process !== 'undefined' && process.versions && process.versions.electron) {
        var net = require('electron').net;
        var request = net.request({
          method: 'POST',
          url: url
        });
        request.setHeader('Content-Type', 'application/json');
        if (secret) request.setHeader('X-BillFlow-Secret', secret);

        request.on('response', function(response) {
          var body = '';
          response.on('data', function(chunk) { body += chunk; });
          response.on('end', function() {
            resolve({ ok: response.statusCode >= 200 && response.statusCode < 300, status: response.statusCode, body: body.slice(0, 200) });
          });
        });

        request.on('error', function(e) {
          resolve({ ok: false, error: e.message || 'Connection failed' });
        });

        request.write(JSON.stringify(payload));
        request.end();
        return;
      }

      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-BillFlow-Secret': secret },
        body: JSON.stringify(payload)
      }).then(function(res) {
        resolve({ ok: res.ok, status: res.status });
      }).catch(function(err) {
        resolve({ ok: false, error: err.message });
      });
    } catch (e) {
      resolve({ ok: false, error: e.message });
    }
  });
}

function buildBillPayload(bill, customer, items, business) {
  var s = settings.getAllSettings();
  return {
    bill: bill,
    customer: customer,
    items: items || [],
    business: {
      name:           s.business_name || '',
      gstin:          s.gstin || '',
      address:        s.business_address || '',
      state:          s.business_state || '',
      bank_name:      s.bank_name || '',
      bank_account:   s.bank_account || '',
      bank_ifsc:      s.bank_ifsc || '',
      owner_email:    s.owner_email || '',
      owner_phone:    s.owner_phone || '',
      wati_api_url:   s.wati_api_url || '',
      wati_api_token: s.wati_api_token || '',
      msg91_auth_key: s.msg91_auth_key || '',
      msg91_sender_id: s.msg91_sender_id || ''
    }
  };
}

module.exports = {

  testWebhook: testWebhook,

  billCreated: function(bill, customer, items, business) {
    var payload = buildBillPayload(bill, customer, items, business);
    payload.event = 'bill_created';
    callWebhook('n8n_wh_bill_created', '/webhook/bill-created', payload);
  },

  billSent: function(bill, customer, items, business, pdfBase64, channels) {
    var payload = buildBillPayload(bill, customer, items, business);
    payload.event = 'bill_send';
    payload.pdf_base64 = pdfBase64 || '';
    payload.send_channels = channels || ['email'];
    callWebhook('n8n_wh_bill_sent', '/webhook/bill-send', payload);
  },

  paymentReminder: function(bill, customer, items, business, pdfBase64, channels) {
    var payload = buildBillPayload(bill, customer, items, business);
    payload.event = 'payment_reminder';
    payload.pdf_base64 = pdfBase64 || '';
    payload.send_channels = channels || ['whatsapp'];
    callWebhook('n8n_wh_payment_reminder', '/webhook/payment-reminder', payload);
  },

  billPaid: function(bill, customer, business, payment) {
    var payload = buildBillPayload(bill, customer, [], business);
    payload.event = 'bill_paid';
    payload.payment = payment;
    callWebhook('n8n_wh_bill_paid', '/webhook/bill-paid', payload);
  },

  billCancelled: function(bill, customer, business) {
    var payload = buildBillPayload(bill, customer, [], business);
    payload.event = 'bill_cancelled';
    payload.was_sent = (bill.status === 'sent');
    callWebhook('n8n_wh_bill_cancelled', '/webhook/bill-cancelled', payload);
  },

  customerSaved: function(operation, customer, business) {
    var s = settings.getAllSettings();
    callWebhook('n8n_wh_customer_saved', '/webhook/customer-saved', {
      event: 'customer_saved',
      operation: operation,
      customer: customer,
      business: {
        name:           s.business_name || '',
        owner_email:    s.owner_email || '',
        wati_api_url:   s.wati_api_url || '',
        wati_api_token: s.wati_api_token || '',
        msg91_auth_key: s.msg91_auth_key || '',
        msg91_sender_id: s.msg91_sender_id || ''
      }
    });
  },

  itemSaved: function(operation, item, ownerId) {
    callWebhook('n8n_wh_item_saved', '/webhook/item-saved', {
      event: 'item_saved',
      operation: operation,
      item: item,
      owner_id: ownerId
    });
  },

  syncPush: function(syncItems) {
    callWebhook('n8n_wh_sync_push', '/webhook/sync-push', { sync_items: syncItems });
  },

  reportRequest: function(reportType, period, emailTo, ccTo) {
    callWebhook('n8n_wh_report_request', '/webhook/report-request', {
      report_type: reportType,
      period: period,
      email_to: emailTo,
      cc_to: ccTo || ''
    });
  },

  settingsUpdated: function(changedSettings) {
    callWebhook('n8n_wh_settings', '/webhook/settings-updated', changedSettings);
  }
};
