var crypto = require('crypto');
var encryptor = require('../../crypto/data-encryptor');

async function getClientAndUser() {
  return await require('../../supabase/client').ensureAuthenticatedClient();
}

async function listCustomers(filter) {
  filter = filter || {};
  var ctx = await getClientAndUser();
  var query = ctx.client
    .from('customers')
    .select('*')
    .eq('owner_id', ctx.userId)
    .is('deleted_at', null);

  if (filter.isActive !== undefined) {
    query = query.eq('is_active', filter.isActive ? true : false);
  }

  if (filter.search && filter.search.trim()) {
    var sanitizeSearch = require('../../utils/sanitize').sanitizeSearch;
    var s = sanitizeSearch(filter.search);
    if (s) {
      query = query.or('name.ilike.%' + s + '%,email.ilike.%' + s + '%,phone.ilike.%' + s + '%');
    }
  }

  query = query.order('name', { ascending: true });

  if (filter.limit) {
    var limit = parseInt(filter.limit, 10);
    var offset = filter.offset ? parseInt(filter.offset, 10) : 0;
    query = query.range(offset, offset + limit - 1);
  }

  var res = await query;
  if (res.error) throw new Error('Cloud customers list error: ' + res.error.message);

  return (res.data || []).map(function(c) {
    var decrypted = c;
    try {
      if (c.encrypted_data && c.enc_iv && c.enc_auth_tag) {
        decrypted = encryptor.decryptCustomer(c, c.encrypted_data, c.enc_iv, c.enc_auth_tag);
      }
    } catch(e) { console.error('Failed to decrypt customer:', c.id); }

    return {
      id: decrypted.id,
      name: decrypted.name || '',
      email: decrypted.email || '',
      phone: decrypted.phone || '',
      state: decrypted.state || '',
      state_code: decrypted.state_code || '',
      payment_terms: decrypted.payment_terms || 'due_on_receipt',
      address: decrypted.address || '',
      notes: decrypted.notes || '',
      is_active: decrypted.is_active ? 1 : 0,
      created_at: decrypted.created_at,
      updated_at: decrypted.updated_at
    };
  });
}

async function getCustomer(id) {
  var ctx = await getClientAndUser();
  var res = await ctx.client
    .from('customers')
    .select('*')
    .eq('owner_id', ctx.userId)
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (res.error || !res.data) return null;
  var c = res.data;
  
  try {
    if (c.encrypted_data && c.enc_iv && c.enc_auth_tag) {
      c = encryptor.decryptCustomer(c, c.encrypted_data, c.enc_iv, c.enc_auth_tag);
    }
  } catch(e) { console.error('Failed to decrypt customer:', c.id); }

  return {
    id: c.id,
    name: c.name || '',
    email: c.email || '',
    phone: c.phone || '',
    state: c.state || '',
    state_code: c.state_code || '',
    payment_terms: c.payment_terms || 'due_on_receipt',
    address: c.address || '',
    notes: c.notes || '',
    is_active: c.is_active ? 1 : 0,
    created_at: c.created_at,
    updated_at: c.updated_at
  };
}

async function createCustomer(data) {
  var ctx = await getClientAndUser();
  var newId = crypto.randomUUID();
  var now = new Date().toISOString();

  var payload = {
    id: newId,
    name: data.name || '',
    email: data.email || '',
    phone: data.phone || '',
    state: data.state || '',
    state_code: data.state_code || '',
    payment_terms: data.payment_terms || 'due_on_receipt',
    address: data.address || '',
    notes: data.notes || '',
    is_active: data.is_active !== undefined ? (data.is_active ? true : false) : true
  };

  var encResult;
  try {
    encResult = encryptor.encryptCustomer(payload);
  } catch(e) {
    // Fallback if encryption key isn't set (shouldn't happen in E2EE mode)
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

  var res = await ctx.client.from('customers').insert(dbPayload).select().single();
  if (res.error) throw new Error('Cloud customer create error: ' + res.error.message);

  return { id: res.data.id };
}

async function updateCustomer(id, data) {
  var ctx = await getClientAndUser();
  var now = new Date().toISOString();

  var currentCustomer = await getCustomer(id);
  if (!currentCustomer) throw new Error('Customer not found');

  var payload = {
    id: id,
    name: data.name !== undefined ? data.name : currentCustomer.name,
    email: data.email !== undefined ? data.email : currentCustomer.email,
    phone: data.phone !== undefined ? data.phone : currentCustomer.phone,
    state: data.state !== undefined ? data.state : currentCustomer.state,
    state_code: data.state_code !== undefined ? data.state_code : currentCustomer.state_code,
    payment_terms: data.payment_terms !== undefined ? data.payment_terms : currentCustomer.payment_terms,
    address: data.address !== undefined ? data.address : currentCustomer.address,
    notes: data.notes !== undefined ? data.notes : currentCustomer.notes,
    is_active: data.is_active !== undefined ? (data.is_active ? true : false) : (currentCustomer.is_active ? true : false)
  };

  var encResult;
  try {
    encResult = encryptor.encryptCustomer(payload);
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
    .from('customers')
    .update(dbPayload)
    .eq('owner_id', ctx.userId)
    .eq('id', id);

  if (res.error) throw new Error('Cloud customer update error: ' + res.error.message);
  return { ok: true };
}

async function deleteCustomer(id) {
  var ctx = await getClientAndUser();
  var res = await ctx.client
    .from('customers')
    .update({ deleted_at: new Date().toISOString() })
    .eq('owner_id', ctx.userId)
    .eq('id', id);

  if (res.error) throw new Error('Cloud customer delete error: ' + res.error.message);
  return { ok: true };
}

async function getCustomerBillSummary(customerId) {
  var ctx = await getClientAndUser();
  var res = await ctx.client
    .from('bills')
    .select('grand_total, amount_paid, amount_due')
    .eq('owner_id', ctx.userId)
    .eq('customer_id', customerId)
    .is('deleted_at', null);

  if (res.error) {
    return { total_bills: 0, total_billed: 0, total_paid: 0, outstanding: 0 };
  }

  var rows = res.data || [];
  var totalBilled = 0, totalPaid = 0, totalDue = 0;
  rows.forEach(function(r) {
    totalBilled += parseFloat(r.grand_total) || 0;
    totalPaid   += parseFloat(r.amount_paid) || 0;
    totalDue    += parseFloat(r.amount_due)  || 0;
  });

  return {
    total_bills: rows.length,
    total_billed: Math.round(totalBilled * 100) / 100,
    total_paid: Math.round(totalPaid * 100) / 100,
    outstanding: Math.round(totalDue * 100) / 100
  };
}

module.exports = {
  listCustomers: listCustomers,
  getCustomer: getCustomer,
  createCustomer: createCustomer,
  updateCustomer: updateCustomer,
  deleteCustomer: deleteCustomer,
  getCustomerBillSummary: getCustomerBillSummary
};
