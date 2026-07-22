var crypto = require('crypto');

async function getClientAndUser() {
  return await require('../../supabase/client').ensureAuthenticatedClient();
}

async function listCreditNotes(filter) {
  filter = filter || {};
  var ctx = await getClientAndUser();
  var query = ctx.client
    .from('credit_notes')
    .select('*, customers(name, email)')
    .eq('owner_id', ctx.userId)
    .is('deleted_at', null);

  if (filter.billId) {
    query = query.eq('bill_id', filter.billId);
  }
  if (filter.search && filter.search.trim()) {
    var s = filter.search.trim().replace(/[,%'"\\]/g, '').substring(0, 100);
    if (s) {
      query = query.ilike('note_number', '%' + s + '%');
    }
  }

  query = query.order('note_date', { ascending: false });

  var res = await query;
  if (res.error) return [];

  return (res.data || []).map(function(cn) {
    return {
      id: cn.id,
      note_number: cn.note_number,
      note_type: cn.note_type || 'credit', // 'credit' or 'debit'
      bill_id: cn.bill_id,
      customer_id: cn.customer_id,
      note_date: cn.note_date,
      amount: parseFloat(cn.amount) || 0,
      gst_amount: parseFloat(cn.gst_amount) || 0,
      reason: cn.reason || '',
      created_at: cn.created_at
    };
  });
}

async function createCreditNote(data) {
  var ctx = await getClientAndUser();
  var newId = crypto.randomUUID();
  var now = new Date().toISOString();

  var payload = {
    id: newId,
    owner_id: ctx.userId,
    note_number: data.note_number || ('CN-' + Date.now().toString().slice(-6)),
    note_type: data.note_type || 'credit',
    bill_id: data.bill_id || null,
    customer_id: data.customer_id || null,
    note_date: data.note_date || now.split('T')[0],
    amount: parseFloat(data.amount) || 0,
    gst_amount: parseFloat(data.gst_amount) || 0,
    reason: data.reason || '',
    created_at: now,
    updated_at: now
  };

  var res = await ctx.client.from('credit_notes').insert(payload).select().single();
  if (res.error) throw new Error('Cloud credit note create error: ' + res.error.message);

  return { id: res.data.id };
}

module.exports = {
  listCreditNotes: listCreditNotes,
  createCreditNote: createCreditNote
};
