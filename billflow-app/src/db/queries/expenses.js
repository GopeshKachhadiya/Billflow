var crypto = require('crypto');

async function getClientAndUser() {
  return await require('../../supabase/client').ensureAuthenticatedClient();
}

async function listExpenses(filter) {
  filter = filter || {};
  var ctx = await getClientAndUser();
  var query = ctx.client
    .from('expenses')
    .select('*')
    .eq('owner_id', ctx.userId)
    .is('deleted_at', null);

  if (filter.category && filter.category !== 'all') {
    query = query.eq('category', filter.category);
  }
  if (filter.dateFrom) {
    query = query.gte('bill_date', filter.dateFrom);
  }
  if (filter.dateTo) {
    query = query.lte('bill_date', filter.dateTo);
  }
  if (filter.search && filter.search.trim()) {
    var s = filter.search.trim().replace(/[,%'"\\]/g, '').substring(0, 100);
    if (s) {
      query = query.or('vendor_name.ilike.%' + s + '%,notes.ilike.%' + s + '%');
    }
  }

  query = query.order('bill_date', { ascending: false }).order('created_at', { ascending: false });

  if (filter.limit) {
    var limit = parseInt(filter.limit, 10) || 100;
    var offset = filter.offset ? parseInt(filter.offset, 10) : 0;
    query = query.range(offset, offset + limit - 1);
  }

  var res = await query;
  if (res.error) throw new Error('Cloud expenses list error: ' + res.error.message);

  return (res.data || []).map(function(e) {
    return {
      id: e.id,
      category: e.category || 'General',
      vendor_name: e.vendor_name || '',
      amount: parseFloat(e.amount) || 0,
      gst_amount: parseFloat(e.gst_amount) || 0,
      bill_date: e.bill_date || '',
      receipt_url: e.receipt_url || '',
      notes: e.notes || '',
      created_at: e.created_at,
      updated_at: e.updated_at
    };
  });
}

async function getExpense(id) {
  var ctx = await getClientAndUser();
  var res = await ctx.client
    .from('expenses')
    .select('*')
    .eq('owner_id', ctx.userId)
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (res.error || !res.data) return null;
  var e = res.data;
  return {
    id: e.id,
    category: e.category || 'General',
    vendor_name: e.vendor_name || '',
    amount: parseFloat(e.amount) || 0,
    gst_amount: parseFloat(e.gst_amount) || 0,
    bill_date: e.bill_date || '',
    receipt_url: e.receipt_url || '',
    notes: e.notes || '',
    created_at: e.created_at,
    updated_at: e.updated_at
  };
}

async function createExpense(data) {
  var ctx = await getClientAndUser();
  var newId = crypto.randomUUID();
  var now = new Date().toISOString();

  var payload = {
    id: newId,
    owner_id: ctx.userId,
    category: data.category || 'General',
    vendor_name: data.vendor_name || '',
    amount: parseFloat(data.amount) || 0,
    gst_amount: parseFloat(data.gst_amount) || 0,
    bill_date: data.bill_date || now.split('T')[0],
    receipt_url: data.receipt_url || '',
    notes: data.notes || '',
    created_at: now,
    updated_at: now
  };

  var res = await ctx.client.from('expenses').insert(payload).select().single();
  if (res.error) throw new Error('Cloud expense create error: ' + res.error.message);

  return { id: newId };
}

async function updateExpense(id, data) {
  var ctx = await getClientAndUser();
  var now = new Date().toISOString();

  var payload = {
    updated_at: now
  };
  if (data.category !== undefined) payload.category = data.category;
  if (data.vendor_name !== undefined) payload.vendor_name = data.vendor_name;
  if (data.amount !== undefined) payload.amount = parseFloat(data.amount) || 0;
  if (data.gst_amount !== undefined) payload.gst_amount = parseFloat(data.gst_amount) || 0;
  if (data.bill_date !== undefined) payload.bill_date = data.bill_date;
  if (data.receipt_url !== undefined) payload.receipt_url = data.receipt_url;
  if (data.notes !== undefined) payload.notes = data.notes;

  var res = await ctx.client
    .from('expenses')
    .update(payload)
    .eq('owner_id', ctx.userId)
    .eq('id', id);

  if (res.error) throw new Error('Cloud expense update error: ' + res.error.message);

  return { ok: true };
}

async function deleteExpense(id) {
  var ctx = await getClientAndUser();
  var res = await ctx.client
    .from('expenses')
    .update({ deleted_at: new Date().toISOString() })
    .eq('owner_id', ctx.userId)
    .eq('id', id);

  if (res.error) throw new Error('Cloud delete expense error: ' + res.error.message);
  return { ok: true };
}

async function getExpenseSummary(dateFrom, dateTo) {
  var ctx = await getClientAndUser();
  var query = ctx.client
    .from('expenses')
    .select('category, amount, gst_amount')
    .eq('owner_id', ctx.userId)
    .is('deleted_at', null);

  if (dateFrom) query = query.gte('bill_date', dateFrom);
  if (dateTo) query = query.lte('bill_date', dateTo);

  var res = await query;
  if (res.error || !res.data) return { total_amount: 0, total_gst: 0, by_category: {} };

  var totalAmount = 0;
  var totalGst = 0;
  var byCat = {};

  res.data.forEach(function(r) {
    var amt = parseFloat(r.amount) || 0;
    var gst = parseFloat(r.gst_amount) || 0;
    var cat = r.category || 'General';

    totalAmount += amt;
    totalGst += gst;
    if (!byCat[cat]) byCat[cat] = { category: cat, amount: 0, count: 0 };
    byCat[cat].amount += amt;
    byCat[cat].count += 1;
  });

  return {
    total_amount: Math.round(totalAmount * 100) / 100,
    total_gst: Math.round(totalGst * 100) / 100,
    by_category: Object.keys(byCat).sort().map(function(k) { return byCat[k]; })
  };
}

module.exports = {
  listExpenses: listExpenses,
  getExpense: getExpense,
  createExpense: createExpense,
  updateExpense: updateExpense,
  deleteExpense: deleteExpense,
  getExpenseSummary: getExpenseSummary
};
