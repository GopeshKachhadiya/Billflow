var conn      = require('../connection');
var sq        = require('./sync-queue');
var encryptor = require('../../crypto/data-encryptor');

function _enqueue(op, bill, items, taxRecord) {
  var enc = encryptor.encryptBill(bill, items || [], taxRecord || null);
  sq.addToQueue(op, 'bills', bill.id, {
    bill_meta:    enc.meta,
    bill_encrypted: { data: enc.encryptedData, iv: enc.iv, auth_tag: enc.authTag }
  });
}

function listBills(filter) {
  filter = filter || {};
  var sql  =
    'SELECT b.id, b.bill_number, b.customer_id, b.bill_date, b.due_date, ' +
    '  b.status, b.grand_total, b.amount_paid, b.amount_due, ' +
    '  b.created_at, b.updated_at, ' +
    '  c.name as customer_name, c.email as customer_email, c.phone as customer_phone ' +
    'FROM bills b ' +
    'LEFT JOIN customers c ON b.customer_id = c.id ' +
    'WHERE b.deleted_at IS NULL';
  var args = [];

  if (filter.status && filter.status !== 'all') {
    sql += ' AND b.status = ?'; args.push(filter.status);
  }
  if (filter.customerId) {
    sql += ' AND b.customer_id = ?'; args.push(filter.customerId);
  }
  if (filter.dateFrom) {
    sql += ' AND b.bill_date >= ?'; args.push(filter.dateFrom);
  }
  if (filter.dateTo) {
    sql += ' AND b.bill_date <= ?'; args.push(filter.dateTo);
  }
  if (filter.search && filter.search.trim()) {
    var s = '%' + filter.search.trim() + '%';
    sql  += ' AND (b.bill_number LIKE ? OR c.name LIKE ?)';
    args.push(s, s);
  }

  sql += ' ORDER BY b.bill_date DESC, b.created_at DESC';

  var limit = parseInt(filter.limit, 10) || 100;
  sql += ' LIMIT ?'; args.push(limit);
  if (filter.offset) { sql += ' OFFSET ?'; args.push(parseInt(filter.offset, 10)); }

  var stmt = conn.getDB().prepare(sql);
  return stmt.all.apply(stmt, args);
}

function getBill(id) {
  var row = conn.getDB()
    .prepare('SELECT * FROM bills WHERE id = ? AND deleted_at IS NULL')
    .get(id);
  if (!row) return null;
  if (!row.encrypted_data) return row;
  try {
    return encryptor.decryptBill(row, row.encrypted_data, row.enc_iv, row.enc_auth_tag);
  } catch(e) { return row; }
}

function getBillWithItems(id) {
  var bill     = getBill(id);
  if (!bill) return null;
  var items    = require('./bill-items').getItemsForBill(id);
  var customer = require('./customers').getCustomer(bill.customer_id);
  return { bill: bill, items: items, customer: customer };
}

function createBill(data) {
  var db  = conn.getDB();
  var id  = db.prepare("SELECT lower(hex(randomblob(16))) as id").get().id;
  var now = new Date().toISOString();

  var bill = Object.assign({ id: id, updated_at: now, created_at: now }, data);
  var enc = encryptor.encryptBill(bill, data.items || [], data.taxRecord || null);

  db.prepare(
    'INSERT INTO bills (id, bill_number, customer_id, bill_date, due_date, status, ' +
    'grand_total, amount_paid, amount_due, encrypted_data, enc_iv, enc_auth_tag, ' +
    'created_by, created_at, updated_at) ' +
    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))"
  ).run(
    id, data.bill_number, data.customer_id,
    data.bill_date, data.due_date || null, data.status || 'draft',
    parseFloat(data.grand_total)  || 0,
    parseFloat(data.amount_paid)  || 0,
    parseFloat(data.amount_due)   || parseFloat(data.grand_total) || 0,
    enc.encryptedData, enc.iv, enc.authTag,
    data.created_by || ''
  );

  _enqueue('INSERT', bill, data.items || [], data.taxRecord || null);
  return { id: id };
}

function updateBill(id, data) {
  var current = getBill(id);
  if (!current) throw new Error('Bill not found: ' + id);
  var merged  = Object.assign({}, current, data, { id: id });
  var enc     = encryptor.encryptBill(merged, data.items || [], data.taxRecord || null);

  conn.getDB().prepare(
    'UPDATE bills SET bill_date = ?, due_date = ?, status = ?, ' +
    'grand_total = ?, amount_paid = ?, amount_due = ?, ' +
    "encrypted_data = ?, enc_iv = ?, enc_auth_tag = ?, updated_at = datetime('now') " +
    'WHERE id = ? AND deleted_at IS NULL'
  ).run(
    merged.bill_date, merged.due_date || null, merged.status,
    parseFloat(merged.grand_total) || 0,
    parseFloat(merged.amount_paid) || 0,
    parseFloat(merged.amount_due)  || 0,
    enc.encryptedData, enc.iv, enc.authTag, id
  );

  _enqueue('UPDATE', merged, data.items || [], data.taxRecord || null);
}

function updateBillStatus(id, status, paymentData) {
  paymentData = paymentData || {};
  var db  = conn.getDB();
  var now = new Date().toISOString();

  var current = getBill(id);
  if (!current) throw new Error('Bill not found: ' + id);

  var merged = Object.assign({}, current, { status: status }, paymentData, { updated_at: now });
  var enc    = encryptor.encryptBill(merged, [], null);

  db.prepare(
    'UPDATE bills SET status = ?, amount_paid = ?, amount_due = ?, ' +
    "encrypted_data = ?, enc_iv = ?, enc_auth_tag = ?, updated_at = datetime('now') " +
    'WHERE id = ? AND deleted_at IS NULL'
  ).run(
    status,
    parseFloat(paymentData.amount_paid) || current.amount_paid || 0,
    parseFloat(paymentData.amount_due)  || 0,
    enc.encryptedData, enc.iv, enc.authTag, id
  );

  sq.addToQueue('UPDATE', 'bills', id, { status: status, payment: paymentData });
}

function deleteBill(id) {
  conn.getDB()
    .prepare("UPDATE bills SET deleted_at = datetime('now') WHERE id = ?")
    .run(id);
  sq.addToQueue('DELETE', 'bills', id, null);
}

function getBillCountByStatus() {
  var rows = conn.getDB().prepare(
    "SELECT status, COUNT(*) as cnt FROM bills WHERE deleted_at IS NULL GROUP BY status"
  ).all();
  var result = { draft:0, sent:0, paid:0, overdue:0, cancelled:0, total:0 };
  for (var i = 0; i < rows.length; i++) {
    result[rows[i].status] = rows[i].cnt;
    result.total += rows[i].cnt;
  }
  return result;
}

function getMonthlyRevenue(months) {
  months = parseInt(months, 10) || 6;
  return conn.getDB().prepare(
    "SELECT strftime('%Y-%m', bill_date) as month, SUM(grand_total) as total, COUNT(*) as count " +
    "FROM bills WHERE status = 'paid' AND deleted_at IS NULL " +
    "AND bill_date >= date('now', '-' || ? || ' months') " +
    "GROUP BY month ORDER BY month ASC"
  ).all(String(months));
}

function getDashboardSummary() {
  var db   = conn.getDB();
  var firstOfMonth = new Date();
  firstOfMonth.setDate(1);
  var monthStart = firstOfMonth.toISOString().substring(0, 10);

  var monthRevenue = db.prepare(
    "SELECT COALESCE(SUM(grand_total),0) as total FROM bills " +
    "WHERE status='paid' AND bill_date >= ? AND deleted_at IS NULL"
  ).get(monthStart);

  var unpaid = db.prepare(
    "SELECT COALESCE(SUM(grand_total),0) as total FROM bills " +
    "WHERE status IN ('sent','overdue') AND deleted_at IS NULL"
  ).get();

  var counts  = getBillCountByStatus();
  var recent  = listBills({ limit: 10 });

  return {
    month_revenue:  monthRevenue.total,
    unpaid_total:   unpaid.total,
    counts:         counts,
    recent_bills:   recent
  };
}

module.exports = {
  listBills:           listBills,
  getBill:             getBill,
  getBillWithItems:    getBillWithItems,
  createBill:          createBill,
  updateBill:          updateBill,
  updateBillStatus:    updateBillStatus,
  deleteBill:          deleteBill,
  getBillCountByStatus: getBillCountByStatus,
  getMonthlyRevenue:   getMonthlyRevenue,
  getDashboardSummary: getDashboardSummary
};
