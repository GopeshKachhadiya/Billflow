var crypto = require('crypto');

async function getClientAndUser() {
  return await require('../../supabase/client').ensureAuthenticatedClient();
}

async function getItemsForBill(billId) {
  var ctx = await getClientAndUser();
  var res = await ctx.client
    .from('bill_items')
    .select('*')
    .eq('owner_id', ctx.userId)
    .eq('bill_id', billId)
    .order('sort_order', { ascending: true });

  if (res.error) throw new Error('Cloud bill items fetch error: ' + res.error.message);

  return (res.data || []).map(function(item) {
    return {
      id: item.id,
      bill_id: item.bill_id,
      sort_order: item.sort_order || 0,
      catalog_item_id: item.catalog_item_id || null,
      description: item.description || '',
      hsn_sac: item.hsn_sac || '',
      unit: item.unit || 'Nos',
      quantity: parseFloat(item.quantity) || 0,
      unit_price: parseFloat(item.unit_price) || 0,
      discount_percent: parseFloat(item.discount_percent) || 0,
      gst_rate: parseFloat(item.gst_rate) || 0,
      base_amount: parseFloat(item.base_amount) || 0,
      discount_amount: parseFloat(item.discount_amount) || 0,
      taxable_amount: parseFloat(item.taxable_amount) || 0,
      cgst_rate: parseFloat(item.cgst_rate) || 0,
      cgst_amount: parseFloat(item.cgst_amount) || 0,
      sgst_rate: parseFloat(item.sgst_rate) || 0,
      sgst_amount: parseFloat(item.sgst_amount) || 0,
      igst_rate: parseFloat(item.igst_rate) || 0,
      igst_amount: parseFloat(item.igst_amount) || 0,
      line_total: parseFloat(item.line_total) || 0,
      is_nil_rated: item.is_nil_rated ? 1 : 0,
      created_at: item.created_at
    };
  });
}

async function replaceItemsForBill(billId, items) {
  var ctx = await getClientAndUser();

  // 1. Delete existing items for this bill
  var delRes = await ctx.client
    .from('bill_items')
    .delete()
    .eq('owner_id', ctx.userId)
    .eq('bill_id', billId);

  if (delRes.error) throw new Error('Cloud delete old bill items error: ' + delRes.error.message);

  if (!items || items.length === 0) {
    return [];
  }

  // 2. Insert new items
  var now = new Date().toISOString();
  var payload = items.map(function(item, idx) {
    return {
      id: crypto.randomUUID(),
      owner_id: ctx.userId,
      bill_id: billId,
      sort_order: idx,
      catalog_item_id: item.catalog_item_id || null,
      description: item.description || '',
      hsn_sac: item.hsn_sac || '',
      unit: item.unit || 'Nos',
      quantity: parseFloat(item.quantity) || 0,
      unit_price: parseFloat(item.unit_price) || 0,
      discount_percent: parseFloat(item.discount_percent) || 0,
      gst_rate: parseFloat(item.gst_rate) || 0,
      base_amount: parseFloat(item.base_amount) || 0,
      discount_amount: parseFloat(item.discount_amount) || 0,
      taxable_amount: parseFloat(item.taxable_amount) || 0,
      cgst_rate: parseFloat(item.cgst_rate) || 0,
      cgst_amount: parseFloat(item.cgst_amount) || 0,
      sgst_rate: parseFloat(item.sgst_rate) || 0,
      sgst_amount: parseFloat(item.sgst_amount) || 0,
      igst_rate: parseFloat(item.igst_rate) || 0,
      igst_amount: parseFloat(item.igst_amount) || 0,
      line_total: parseFloat(item.line_total) || 0,
      is_nil_rated: item.is_nil_rated ? true : false,
      created_at: now
    };
  });

  var insRes = await ctx.client.from('bill_items').insert(payload);
  if (insRes.error) throw new Error('Cloud insert new bill items error: ' + insRes.error.message);

  return getItemsForBill(billId);
}

module.exports = {
  getItemsForBill: getItemsForBill,
  replaceItemsForBill: replaceItemsForBill
};
