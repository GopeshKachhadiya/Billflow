var settings = require('../db/queries/settings');

function callWebhook(webhookKey, payload) {
  var baseUrl = settings.getSetting('n8n_base_url') || 'http://localhost:5678';
  var path = webhookKey;
  var url = baseUrl + path;
  var secret = settings.getSetting('n8n_secret') || '';

  if (typeof fetch === 'function') {
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-BillFlow-Secret': secret
      },
      body: JSON.stringify(payload)
    }).catch(function(e) {
      console.error('Webhook failed:', path, e.message);
    });
  } else {
    try {
      var net = require('electron').net;
      var request = net.request({
        method: 'POST',
        url: url
      });
      request.setHeader('Content-Type', 'application/json');
      request.setHeader('X-BillFlow-Secret', secret);
      request.on('error', function(e) {
        console.error('Webhook failed (net):', path, e.message);
      });
      request.write(JSON.stringify(payload));
      request.end();
    } catch (e) {
      console.error('Webhook request failed entirely:', path, e.message);
    }
  }
}

function buildBillPayload(bill, customer, items, business) {
  return {
    bill: bill,
    customer: customer,
    items: items || [],
    business: {
      name:         business.business_name || '',
      gstin:        business.gstin || '',
      address:      business.business_address || '',
      state:        business.business_state || '',
      bank_name:    business.bank_name || '',
      bank_account: business.bank_account || '',
      bank_ifsc:    business.bank_ifsc || '',
      owner_email:  business.owner_email || '',
      owner_phone:  business.owner_phone || ''
    }
  };
}

module.exports = {

  billCreated: function(bill, customer, items, business) {
    var payload = buildBillPayload(bill, customer, items, business);
    payload.event = 'bill_created';
    callWebhook('/webhook/bill-created', payload);
  },

  billSent: function(bill, customer, items, business, pdfBase64, channels) {
    var payload = buildBillPayload(bill, customer, items, business);
    payload.event = 'bill_send';
    payload.pdf_base64 = pdfBase64 || '';
    payload.send_channels = channels || ['email'];
    callWebhook('/webhook/bill-send', payload);
  },

  billPaid: function(bill, customer, business, payment) {
    var payload = buildBillPayload(bill, customer, [], business);
    payload.event = 'bill_paid';
    payload.payment = payment;
    callWebhook('/webhook/bill-paid', payload);
  },

  billCancelled: function(bill, customer, business) {
    var payload = buildBillPayload(bill, customer, [], business);
    payload.event = 'bill_cancelled';
    payload.was_sent = (bill.status === 'sent');
    callWebhook('/webhook/bill-cancelled', payload);
  },

  customerSaved: function(operation, customer, business) {
    callWebhook('/webhook/customer-saved', {
      event: 'customer_saved',
      operation: operation,
      customer: customer,
      business: { name: business.business_name, owner_email: business.owner_email }
    });
  },

  itemSaved: function(operation, item, ownerId) {
    callWebhook('/webhook/item-saved', {
      event: 'item_saved',
      operation: operation,
      item: item,
      owner_id: ownerId
    });
  },

  syncPush: function(syncItems) {
    callWebhook('/webhook/sync-push', { sync_items: syncItems });
  },

  reportRequest: function(reportType, period, emailTo, ccTo) {
    callWebhook('/webhook/report-request', {
      report_type: reportType,
      period: period,
      email_to: emailTo,
      cc_to: ccTo || ''
    });
  },

  settingsUpdated: function(changedSettings) {
    callWebhook('/webhook/settings-updated', changedSettings);
  }
};
