var crypto = require('crypto');

async function getClientAndUser() {
  return await require('../../supabase/client').ensureAuthenticatedClient();
}

async function listInboxBills(filter) {
  filter = filter || {};
  var ctx = await getClientAndUser();
  var query = ctx.client
    .from('inbox_bills')
    .select('*')
    .eq('owner_id', ctx.userId)
    .is('deleted_at', null);

  if (filter.status && filter.status !== 'all') {
    query = query.eq('status', filter.status);
  }
  if (filter.source && filter.source !== 'all') {
    query = query.eq('source', filter.source);
  }
  if (filter.search && filter.search.trim()) {
    var s = filter.search.trim().replace(/[,%'"\\]/g, '').substring(0, 100);
    if (s) {
      query = query.or('sender_name.ilike.%' + s + '%,bill_number.ilike.%' + s + '%,sender_email.ilike.%' + s + '%');
    }
  }

  query = query.order('created_at', { ascending: false });

  if (filter.limit) {
    var limit = parseInt(filter.limit, 10) || 100;
    var offset = filter.offset ? parseInt(filter.offset, 10) : 0;
    query = query.range(offset, offset + limit - 1);
  }

  var res = await query;
  if (res.error) throw new Error('Cloud inbox list error: ' + res.error.message);

  return (res.data || []).map(function(b) {
    return {
      id: b.id,
      sender_name: b.sender_name || '',
      sender_email: b.sender_email || '',
      sender_phone: b.sender_phone || '',
      sender_gstin: b.sender_gstin || '',
      bill_number: b.bill_number || '',
      bill_date: b.bill_date || '',
      due_date: b.due_date || '',
      amount: parseFloat(b.amount) || 0,
      tax_amount: parseFloat(b.tax_amount) || 0,
      pdf_url: b.pdf_url || '',
      pdf_base64: b.pdf_base64 || '',
      status: b.status || 'unread',
      source: b.source || 'manual',
      notes: b.notes || '',
      converted_expense_id: b.converted_expense_id || null,
      created_at: b.created_at,
      updated_at: b.updated_at
    };
  });
}

async function getInboxBill(id) {
  var ctx = await getClientAndUser();
  var res = await ctx.client
    .from('inbox_bills')
    .select('*')
    .eq('owner_id', ctx.userId)
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (res.error || !res.data) return null;
  var b = res.data;
  return {
    id: b.id,
    sender_name: b.sender_name || '',
    sender_email: b.sender_email || '',
    sender_phone: b.sender_phone || '',
    sender_gstin: b.sender_gstin || '',
    bill_number: b.bill_number || '',
    bill_date: b.bill_date || '',
    due_date: b.due_date || '',
    amount: parseFloat(b.amount) || 0,
    tax_amount: parseFloat(b.tax_amount) || 0,
    pdf_url: b.pdf_url || '',
    pdf_base64: b.pdf_base64 || '',
    status: b.status || 'unread',
    source: b.source || 'manual',
    notes: b.notes || '',
    converted_expense_id: b.converted_expense_id || null,
    created_at: b.created_at,
    updated_at: b.updated_at
  };
}

async function createInboxBill(data) {
  var ctx = await getClientAndUser();
  var newId = crypto.randomUUID();
  var now = new Date().toISOString();

  var payload = {
    id: newId,
    owner_id: ctx.userId,
    sender_name: data.sender_name || 'Unknown Vendor',
    sender_email: data.sender_email || '',
    sender_phone: data.sender_phone || '',
    sender_gstin: data.sender_gstin || '',
    bill_number: data.bill_number || ('INV-' + Date.now().toString().slice(-6)),
    bill_date: data.bill_date || now.split('T')[0],
    due_date: data.due_date || null,
    amount: parseFloat(data.amount) || 0,
    tax_amount: parseFloat(data.tax_amount) || 0,
    pdf_url: data.pdf_url || '',
    pdf_base64: data.pdf_base64 || '',
    status: data.status || 'unread',
    source: data.source || 'manual',
    notes: data.notes || '',
    created_at: now,
    updated_at: now
  };

  var res = await ctx.client.from('inbox_bills').insert(payload).select().single();
  if (res.error) throw new Error('Cloud inbox create error: ' + res.error.message);

  return { id: res.data.id };
}

async function updateInboxStatus(id, status) {
  var ctx = await getClientAndUser();
  var now = new Date().toISOString();

  var res = await ctx.client
    .from('inbox_bills')
    .update({ status: status, updated_at: now })
    .eq('owner_id', ctx.userId)
    .eq('id', id);

  if (res.error) throw new Error('Cloud inbox update status error: ' + res.error.message);
  return { ok: true };
}

async function convertToExpense(id) {
  var bill = await getInboxBill(id);
  if (!bill) throw new Error('Incoming bill not found');

  var expensesModule = require('./expenses');
  var expenseRes = await expensesModule.createExpense({
    category: 'Vendor Bills',
    vendor_name: bill.sender_name,
    amount: bill.amount,
    gst_amount: bill.tax_amount,
    bill_date: bill.bill_date,
    receipt_url: bill.pdf_url,
    notes: 'Converted from Inbox Bill #' + bill.bill_number + (bill.notes ? (' — ' + bill.notes) : '')
  });

  var ctx = await getClientAndUser();
  await ctx.client
    .from('inbox_bills')
    .update({
      status: 'converted_expense',
      converted_expense_id: expenseRes.id,
      updated_at: new Date().toISOString()
    })
    .eq('owner_id', ctx.userId)
    .eq('id', id);

  return { ok: true, expense_id: expenseRes.id };
}

async function getUnreadCount() {
  var ctx = await getClientAndUser();
  var res = await ctx.client
    .from('inbox_bills')
    .select('id')
    .eq('owner_id', ctx.userId)
    .eq('status', 'unread')
    .is('deleted_at', null);

  if (res.error || !res.data) return 0;
  return res.data.length;
}

module.exports = {
  listInboxBills: listInboxBills,
  getInboxBill: getInboxBill,
  createInboxBill: createInboxBill,
  updateInboxStatus: updateInboxStatus,
  convertToExpense: convertToExpense,
  getUnreadCount: getUnreadCount
};
