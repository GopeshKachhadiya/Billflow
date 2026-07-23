var crypto = require('crypto');
var encryptor = require('../../crypto/data-encryptor');

async function getClientAndUser() {
  return await require('../../supabase/client').ensureAuthenticatedClient();
}

async function listItems(filter) {
  filter = filter || {};
  var ctx = await getClientAndUser();
  var query = ctx.client
    .from('items_catalog')
    .select('*')
    .eq('owner_id', ctx.userId)
    .is('deleted_at', null);

  if (filter.isActive !== undefined) {
    query = query.eq('is_active', filter.isActive ? true : false);
  }

  if (filter.search && filter.search.trim()) {
    var sanitizeSearch = require('../../utils/sanitize').sanitizeSearch;
    var s = sanitizeSearch(filter.search);
    query = query.or('name.ilike.%' + s + '%,hsn_sac.ilike.%' + s + '%,description.ilike.%' + s + '%');
  }

  query = query.order('name', { ascending: true });

  var res = await query;
  if (res.error) throw new Error('Cloud items list error: ' + res.error.message);

  return (res.data || []).map(function(item) {
    var decrypted = item;
    try {
      if (item.encrypted_data && item.enc_iv && item.enc_auth_tag) {
        decrypted = encryptor.decryptItem(item, item.encrypted_data, item.enc_iv, item.enc_auth_tag);
      }
    } catch(e) { console.error('Failed to decrypt item:', item.id); }

    return {
      id: decrypted.id,
      name: decrypted.name || '',
      description: decrypted.description || '',
      hsn_sac: decrypted.hsn_sac || '',
      unit: decrypted.unit || 'Nos',
      unit_price: parseFloat(decrypted.unit_price) || 0.00,
      gst_rate: parseFloat(decrypted.gst_rate) || 18.0,
      is_active: decrypted.is_active ? 1 : 0,
      created_at: decrypted.created_at,
      updated_at: decrypted.updated_at
    };
  });
}

async function getItem(id) {
  var ctx = await getClientAndUser();
  var res = await ctx.client
    .from('items_catalog')
    .select('*')
    .eq('owner_id', ctx.userId)
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (res.error || !res.data) return null;
  var item = res.data;
  
  try {
    if (item.encrypted_data && item.enc_iv && item.enc_auth_tag) {
      item = encryptor.decryptItem(item, item.encrypted_data, item.enc_iv, item.enc_auth_tag);
    }
  } catch(e) { console.error('Failed to decrypt item:', item.id); }

  return {
    id: item.id,
    name: item.name || '',
    description: item.description || '',
    hsn_sac: item.hsn_sac || '',
    unit: item.unit || 'Nos',
    unit_price: parseFloat(item.unit_price) || 0.00,
    gst_rate: parseFloat(item.gst_rate) || 18.0,
    is_active: item.is_active ? 1 : 0,
    created_at: item.created_at,
    updated_at: item.updated_at
  };
}

async function createItem(data) {
  var ctx = await getClientAndUser();
  var newId = crypto.randomUUID();
  var now = new Date().toISOString();

  var payload = {
    id: newId,
    name: data.name || '',
    description: data.description || '',
    hsn_sac: data.hsn_sac || '',
    unit: data.unit || 'Nos',
    unit_price: parseFloat(data.unit_price) || 0.00,
    gst_rate: parseFloat(data.gst_rate) || 18.0,
    is_active: data.is_active !== undefined ? (data.is_active ? true : false) : true
  };

  var encResult;
  try {
    encResult = encryptor.encryptItem(payload);
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

  var res = await ctx.client.from('items_catalog').insert(dbPayload).select().single();
  if (res.error) throw new Error('Cloud item create error: ' + res.error.message);

  return { id: res.data.id };
}

async function updateItem(id, data) {
  var ctx = await getClientAndUser();
  var now = new Date().toISOString();

  var currentItem = await getItem(id);
  if (!currentItem) throw new Error('Item not found');

  var payload = {
    id: id,
    name: data.name !== undefined ? data.name : currentItem.name,
    description: data.description !== undefined ? data.description : currentItem.description,
    hsn_sac: data.hsn_sac !== undefined ? data.hsn_sac : currentItem.hsn_sac,
    unit: data.unit !== undefined ? data.unit : currentItem.unit,
    unit_price: data.unit_price !== undefined ? (parseFloat(data.unit_price) || 0) : currentItem.unit_price,
    gst_rate: data.gst_rate !== undefined ? (parseFloat(data.gst_rate) || 18.0) : currentItem.gst_rate,
    is_active: data.is_active !== undefined ? (data.is_active ? true : false) : (currentItem.is_active ? true : false)
  };

  var encResult;
  try {
    encResult = encryptor.encryptItem(payload);
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
    .from('items_catalog')
    .update(dbPayload)
    .eq('owner_id', ctx.userId)
    .eq('id', id);

  if (res.error) throw new Error('Cloud item update error: ' + res.error.message);
  return { ok: true };
}

async function deleteItem(id) {
  var ctx = await getClientAndUser();
  var res = await ctx.client
    .from('items_catalog')
    .update({ deleted_at: new Date().toISOString() })
    .eq('owner_id', ctx.userId)
    .eq('id', id);

  if (res.error) throw new Error('Cloud item delete error: ' + res.error.message);
  return { ok: true };
}

module.exports = {
  listItems: listItems,
  getItem: getItem,
  createItem: createItem,
  updateItem: updateItem,
  deleteItem: deleteItem
};
