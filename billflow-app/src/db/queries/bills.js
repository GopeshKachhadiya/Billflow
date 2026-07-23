var crypto = require('crypto');
var encryptor = require('../../crypto/data-encryptor');

async function getClientAndUser() {
  return await require('../../supabase/client').ensureAuthenticatedClient();
}

async function listBills(filter) {
  filter = filter || {};
  var ctx = await getClientAndUser();
  var query = ctx.client
    .from('bills')
    .select('*, customers(name, email, phone)')
    .eq('owner_id', ctx.userId)
    .is('deleted_at', null);

  if (filter.status && filter.status !== 'all') {
    query = query.eq('status', filter.status);
  }
  if (filter.customerId) {
    query = query.eq('customer_id', filter.customerId);
  }
  if (filter.dateFrom) {
    query = query.gte('bill_date', filter.dateFrom);
  }
  if (filter.dateTo) {
    query = query.lte('bill_date', filter.dateTo);
  }
  if (filter.search && filter.search.trim()) {
    var sanitizeSearch = require('../../utils/sanitize').sanitizeSearch;
    var s = sanitizeSearch(filter.search);
    if (s) {
      query = query.ilike('bill_number', '%' + s + '%');
    }
  }

  query = query.order('bill_date', { ascending: false }).order('created_at', { ascending: false });

  if (filter.limit) {
    var limit = parseInt(filter.limit, 10) || 100;
    var offset = filter.offset ? parseInt(filter.offset, 10) : 0;
    query = query.range(offset, offset + limit - 1);
  }

  var res = await query;
  if (res.error) throw new Error('Cloud bills list error: ' + res.error.message);

  return (res.data || []).map(function(b) {
    var cust = b.customers || {};
    var decrypted = b;
    try {
      if (b.encrypted_data && b.enc_iv && b.enc_auth_tag) {
        decrypted = encryptor.decryptBill(b, b.encrypted_data, b.enc_iv, b.enc_auth_tag);
      }
    } catch(e) { console.error('Failed to decrypt bill:', b.id); }

    return {
      id: decrypted.id,
      bill_number: decrypted.bill_number || '',
      customer_id: decrypted.customer_id,
      bill_date: decrypted.bill_date,
      due_date: decrypted.due_date,
      status: decrypted.status || 'draft',
      grand_total: parseFloat(decrypted.grand_total) || 0,
      amount_paid: parseFloat(decrypted.amount_paid) || 0,
      amount_due: parseFloat(decrypted.amount_due) || 0,
      payment_method: decrypted.payment_method || '',
      payment_reference: decrypted.payment_reference || '',
      terms: decrypted.terms || '',
      notes: decrypted.notes || '',
      created_by: decrypted.created_by || '',
      created_at: decrypted.created_at,
      updated_at: decrypted.updated_at,
      customer_name: cust.name || '',
      customer_email: cust.email || '',
      customer_phone: cust.phone || ''
    };
  });
}

async function getBill(id) {
  var ctx = await getClientAndUser();
  var res = await ctx.client
    .from('bills')
    .select('*')
    .eq('owner_id', ctx.userId)
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (res.error || !res.data) return null;
  var b = res.data;
  
  try {
    if (b.encrypted_data && b.enc_iv && b.enc_auth_tag) {
      b = encryptor.decryptBill(b, b.encrypted_data, b.enc_iv, b.enc_auth_tag);
    }
  } catch(e) { console.error('Failed to decrypt bill:', b.id); }

  return {
    id: b.id,
    bill_number: b.bill_number || '',
    customer_id: b.customer_id,
    bill_date: b.bill_date,
    due_date: b.due_date,
    status: b.status || 'draft',
    grand_total: parseFloat(b.grand_total) || 0,
    amount_paid: parseFloat(b.amount_paid) || 0,
    amount_due: parseFloat(b.amount_due) || 0,
    payment_method: b.payment_method || '',
    payment_reference: b.payment_reference || '',
    terms: b.terms || '',
    notes: b.notes || '',
    created_by: b.created_by || '',
    created_at: b.created_at,
    updated_at: b.updated_at
  };
}

async function getBillWithItems(id) {
  var bill = await getBill(id);
  if (!bill) return null;

  var items = await require('./bill-items').getItemsForBill(id);
  var customer = await require('./customers').getCustomer(bill.customer_id);

  return { bill: bill, items: items, customer: customer };
}

async function createBill(data) {
  var ctx = await getClientAndUser();
  var newId = crypto.randomUUID();
  var now = new Date().toISOString();

  var payload = {
    id: newId,
    bill_number: data.bill_number || '',
    customer_id: data.customer_id || null,
    bill_date: data.bill_date || now.split('T')[0],
    due_date: data.due_date || null,
    status: data.status || 'draft',
    grand_total: parseFloat(data.grand_total) || 0,
    amount_paid: parseFloat(data.amount_paid) || 0,
    amount_due: (data.amount_due !== undefined && data.amount_due !== null && !isNaN(parseFloat(data.amount_due))) ? parseFloat(data.amount_due) : (parseFloat(data.grand_total) || 0),
    payment_method: data.payment_method || null,
    payment_reference: data.payment_reference || null,
    terms: data.terms || '',
    notes: data.notes || '',
    created_by: data.created_by || ''
  };

  var encResult;
  try {
    encResult = encryptor.encryptBill(payload, data.items || [], data.taxRecord || null);
  } catch(e) {
    encResult = { meta: payload, encryptedData: null, iv: null, authTag: null };
  }

  var dbPayload = Object.assign({}, encResult.meta, {
    owner_id: ctx.userId,
    encrypted_data: encResult.encryptedData,
    enc_iv: encResult.iv,
    enc_auth_tag: encResult.authTag,
    created_at: now,
    updated_at: now
  });

  var res = await ctx.client.from('bills').insert(dbPayload).select().single();
  if (res.error) throw new Error('Cloud bill create error: ' + res.error.message);

  if (parseFloat(data.amount_paid) > 0) {
    try {
      await ctx.client.from('payment_log').insert({
        owner_id: ctx.userId,
        bill_id: newId,
        amount_paid: parseFloat(data.amount_paid) || 0,
        payment_date: data.bill_date || now.split('T')[0],
        payment_method: data.payment_method || 'Manual',
        payment_reference: data.payment_reference || ''
      });
    } catch (e) {
      console.warn('payment_log entry warning:', e.message);
    }
  }

  if (data.items && data.items.length > 0) {
    await require('./bill-items').replaceItemsForBill(newId, data.items);
  }
  if (data.taxRecord) {
    await require('./tax-records').upsertTaxRecord(newId, data.taxRecord);
  }

  return { id: newId };
}

async function updateBill(id, data) {
  var ctx = await getClientAndUser();
  var now = new Date().toISOString();

  var currentBill = await getBill(id);
  if (!currentBill) throw new Error('Bill not found');

  var payload = {
    id: id,
    bill_number: currentBill.bill_number,
    customer_id: currentBill.customer_id,
    bill_date: data.bill_date !== undefined ? data.bill_date : currentBill.bill_date,
    due_date: data.due_date !== undefined ? (data.due_date || null) : currentBill.due_date,
    status: data.status !== undefined ? data.status : currentBill.status,
    grand_total: data.grand_total !== undefined ? (parseFloat(data.grand_total) || 0) : currentBill.grand_total,
    amount_paid: data.amount_paid !== undefined ? (parseFloat(data.amount_paid) || 0) : currentBill.amount_paid,
    amount_due: data.amount_due !== undefined ? (parseFloat(data.amount_due) || 0) : currentBill.amount_due,
    payment_method: data.payment_method !== undefined ? data.payment_method : currentBill.payment_method,
    payment_reference: data.payment_reference !== undefined ? data.payment_reference : currentBill.payment_reference,
    terms: data.terms !== undefined ? data.terms : currentBill.terms,
    notes: data.notes !== undefined ? data.notes : currentBill.notes,
    created_by: currentBill.created_by
  };

  var encResult;
  try {
    // If updateBill was called with items or taxRecord, pass them; otherwise pass empty to encryptor
    // (In reality, updateBill mostly updates just the bill itself in this app's architecture)
    encResult = encryptor.encryptBill(payload, data.items || [], data.taxRecord || null);
  } catch(e) {
    encResult = { meta: payload, encryptedData: null, iv: null, authTag: null };
  }

  var dbPayload = Object.assign({}, encResult.meta, {
    updated_at: now,
    encrypted_data: encResult.encryptedData,
    enc_iv: encResult.iv,
    enc_auth_tag: encResult.authTag
  });

  var res = await ctx.client
    .from('bills')
    .update(dbPayload)
    .eq('owner_id', ctx.userId)
    .eq('id', id);

  if (res.error) throw new Error('Cloud bill update error: ' + res.error.message);

  if (data.amount_paid !== undefined && parseFloat(data.amount_paid) > 0) {
    try {
      await ctx.client.from('payment_log').insert({
        owner_id: ctx.userId,
        bill_id: id,
        amount_paid: parseFloat(data.amount_paid) || 0,
        payment_date: data.bill_date || now.split('T')[0],
        payment_method: data.payment_method || 'Manual',
        payment_reference: data.payment_reference || ''
      });
    } catch (e) {
      console.warn('payment_log update warning:', e.message);
    }
  }

  if (data.items) {
    await require('./bill-items').replaceItemsForBill(id, data.items);
  }
  if (data.taxRecord) {
    await require('./tax-records').upsertTaxRecord(id, data.taxRecord);
  }

  return { ok: true };
}

async function updateBillStatus(id, status, paymentData) {
  paymentData = paymentData || {};
  var ctx = await getClientAndUser();
  var now = new Date().toISOString();

  var payload = {
    status: status,
    updated_at: now
  };
  if (paymentData.amount_paid !== undefined) payload.amount_paid = parseFloat(paymentData.amount_paid) || 0;
  if (paymentData.amount_due !== undefined) payload.amount_due = parseFloat(paymentData.amount_due) || 0;

  var res = await ctx.client
    .from('bills')
    .update(payload)
    .eq('owner_id', ctx.userId)
    .eq('id', id);

  if (res.error) throw new Error('Cloud status update error: ' + res.error.message);
  return { ok: true };
}

async function deleteBill(id) {
  var ctx = await getClientAndUser();
  var res = await ctx.client
    .from('bills')
    .update({ deleted_at: new Date().toISOString() })
    .eq('owner_id', ctx.userId)
    .eq('id', id);

  if (res.error) throw new Error('Cloud delete bill error: ' + res.error.message);
  return { ok: true };
}

async function getBillCountByStatus() {
  var ctx = await getClientAndUser();
  var statuses = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];
  var result = { draft: 0, sent: 0, paid: 0, overdue: 0, cancelled: 0, total: 0 };
  
  // CQ-09 Fix: Use Supabase exact count (head: true) to avoid downloading entire table data
  var promises = statuses.map(async function(st) {
    var res = await ctx.client
      .from('bills')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', ctx.userId)
      .eq('status', st)
      .is('deleted_at', null);
    
    if (!res.error && res.count !== null) {
      result[st] = res.count;
      result.total += res.count;
    }
  });

  await Promise.all(promises);
  return result;
}

async function getMonthlyRevenue(months) {
  months = parseInt(months, 10) || 6;
  var ctx = await getClientAndUser();
  var d = new Date();
  d.setMonth(d.getMonth() - months);
  var minDate = d.toISOString().split('T')[0];

  var res = await ctx.client
    .from('bills')
    .select('bill_date, grand_total')
    .eq('owner_id', ctx.userId)
    .eq('status', 'paid')
    .gte('bill_date', minDate)
    .is('deleted_at', null);

  if (res.error || !res.data) return [];

  var map = {};
  res.data.forEach(function(r) {
    var m = r.bill_date ? r.bill_date.substring(0, 7) : 'Unknown';
    if (!map[m]) map[m] = { month: m, total: 0, count: 0 };
    map[m].total += parseFloat(r.grand_total) || 0;
    map[m].count += 1;
  });

  return Object.keys(map).sort().map(function(k) { return map[k]; });
}

async function getDashboardSummary() {
  var firstOfMonth = new Date();
  firstOfMonth.setDate(1);
  var monthStart = firstOfMonth.toISOString().substring(0, 10);

  var ctx = await getClientAndUser();

  // Month revenue
  var resRev = await ctx.client
    .from('bills')
    .select('grand_total')
    .eq('owner_id', ctx.userId)
    .eq('status', 'paid')
    .gte('bill_date', monthStart)
    .is('deleted_at', null);

  var monthRev = 0;
  if (!resRev.error && resRev.data) {
    resRev.data.forEach(function(r) { monthRev += parseFloat(r.grand_total) || 0; });
  }

  // Unpaid total
  var resUnpaid = await ctx.client
    .from('bills')
    .select('grand_total')
    .eq('owner_id', ctx.userId)
    .in('status', ['sent', 'overdue'])
    .is('deleted_at', null);

  var unpaidTotal = 0;
  if (!resUnpaid.error && resUnpaid.data) {
    resUnpaid.data.forEach(function(r) { unpaidTotal += parseFloat(r.grand_total) || 0; });
  }

  var counts = await getBillCountByStatus();
  var recent = await listBills({ limit: 10 });

  return {
    month_revenue: Math.round(monthRev * 100) / 100,
    unpaid_total: Math.round(unpaidTotal * 100) / 100,
    counts: counts,
    recent_bills: recent
  };
}

module.exports = {
  listBills: listBills,
  getBill: getBill,
  getBillWithItems: getBillWithItems,
  createBill: createBill,
  updateBill: updateBill,
  updateBillStatus: updateBillStatus,
  deleteBill: deleteBill,
  getBillCountByStatus: getBillCountByStatus,
  getMonthlyRevenue: getMonthlyRevenue,
  getDashboardSummary: getDashboardSummary
};
