var conn = require('../connection');

function getItemsForBill(billId) {
  return conn.getDB()
    .prepare('SELECT * FROM bill_items WHERE bill_id = ? ORDER BY sort_order ASC')
    .all(billId);
}

function replaceItemsForBill(billId, items) {
  var db = conn.getDB();
  var tx = db.transaction(function() {
    db.prepare('DELETE FROM bill_items WHERE bill_id = ?').run(billId);

    var stmt = db.prepare(
      'INSERT INTO bill_items ' +
      '(id, bill_id, sort_order, catalog_item_id, description, hsn_sac, unit, ' +
      'quantity, unit_price, discount_percent, gst_rate, ' +
      'base_amount, discount_amount, taxable_amount, ' +
      'cgst_rate, cgst_amount, sgst_rate, sgst_amount, igst_rate, igst_amount, ' +
      'line_total, is_nil_rated, lot_no, grade, cartons, created_at) ' +
      "VALUES (lower(hex(randomblob(16))),?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'))"
    );

    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      stmt.run(
        billId,
        i, // sort_order
        item.catalog_item_id   || null,
        item.description       || '',
        item.hsn_sac           || '',
        item.unit              || 'Nos',
        parseFloat(item.quantity)        || 0,
        parseFloat(item.unit_price)      || 0,
        parseFloat(item.discount_percent)|| 0,
        parseFloat(item.gst_rate)        || 0,
        parseFloat(item.base_amount)     || 0,
        parseFloat(item.discount_amount) || 0,
        parseFloat(item.taxable_amount)  || 0,
        parseFloat(item.cgst_rate)       || 0,
        parseFloat(item.cgst_amount)     || 0,
        parseFloat(item.sgst_rate)       || 0,
        parseFloat(item.sgst_amount)     || 0,
        parseFloat(item.igst_rate)       || 0,
        parseFloat(item.igst_amount)     || 0,
        parseFloat(item.line_total)      || 0,
        item.is_nil_rated ? 1 : 0,
        item.lot_no            || '',
        item.grade             || '',
        parseFloat(item.cartons) || 0
      );
    }
  });
  tx();
  return getItemsForBill(billId);
}

module.exports = {
  getItemsForBill:      getItemsForBill,
  replaceItemsForBill:  replaceItemsForBill
};
