var conn    = require('../connection');
var sq      = require('./sync-queue');
var encryptor = require('../../crypto/data-encryptor');

function _enqueue(op, customer) {
  var enc = encryptor.encryptCustomer(customer);
  sq.addToQueue(op, 'customers', customer.id, {
    meta:          enc.meta,
    encryptedData: enc.encryptedData,
    iv:            enc.iv,
    authTag:       enc.authTag
  });
}

function listCustomers(filter) {
  filter = filter || {};
  var db   = conn.getDB();
  var sql  = 'SELECT id, name, email, phone, state, state_code, is_active, ' +
             'encrypted_data, enc_iv, enc_auth_tag, created_at, updated_at ' +
             'FROM customers WHERE deleted_at IS NULL';
  var args = [];

  if (filter.isActive !== undefined) {
    sql += ' AND is_active = ?';
    args.push(filter.isActive ? 1 : 0);
  }

  if (filter.search && filter.search.trim()) {
    sql  += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)';
    var s = '%' + filter.search.trim() + '%';
    args.push(s, s, s);
  }

  sql += ' ORDER BY name COLLATE NOCASE ASC';

  if (filter.limit) {
    sql += ' LIMIT ?';
    args.push(parseInt(filter.limit, 10));
    if (filter.offset) {
      sql += ' OFFSET ?';
      args.push(parseInt(filter.offset, 10));
    }
  }

  var rows = db.prepare(sql).all.apply(db.prepare(sql), args);

  return rows.map(function(row) {
    if (row.encrypted_data) {
      try {
        var dec = encryptor.decryptCustomer(row, row.encrypted_data, row.enc_iv, row.enc_auth_tag);
        return dec;
      } catch(e) {
        console.error('[customers] decrypt failed for', row.id);
        return row;
      }
    }
    return row;
  });
}

function getCustomer(id) {
  var row = conn.getDB()
    .prepare('SELECT * FROM customers WHERE id = ? AND deleted_at IS NULL')
    .get(id);
  if (!row) return null;
  if (row.encrypted_data) {
    try {
      return encryptor.decryptCustomer(row, row.encrypted_data, row.enc_iv, row.enc_auth_tag);
    } catch(e) { return row; }
  }
  return row;
}

function createCustomer(data) {
  var db  = conn.getDB();
  var id  = db.prepare("SELECT lower(hex(randomblob(16))) as id").get().id;
  var customerData = Object.assign({ id: id, updated_at: new Date().toISOString() }, data);
  var enc = encryptor.encryptCustomer(customerData);

  db.prepare(
    'INSERT INTO customers ' +
    '(id, name, email, phone, state, state_code, is_active, ' +
    'encrypted_data, enc_iv, enc_auth_tag, created_at, updated_at) ' +
    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))"
  ).run(
    id,
    data.name        || '',
    data.email       || '',
    data.phone       || '',
    data.state       || '',
    data.state_code  || '',
    data.is_active !== undefined ? (data.is_active ? 1 : 0) : 1,
    enc.encryptedData, enc.iv, enc.authTag
  );

  var created = getCustomer(id);
  _enqueue('INSERT', created);
  return { id: id };
}

function updateCustomer(id, data) {
  var current = getCustomer(id);
  if (!current) { throw new Error('Customer not found: ' + id); }

  var merged  = Object.assign({}, current, data, { id: id, updated_at: new Date().toISOString() });
  var enc     = encryptor.encryptCustomer(merged);

  conn.getDB().prepare(
    'UPDATE customers SET ' +
    'name = ?, email = ?, phone = ?, state = ?, state_code = ?, is_active = ?, ' +
    "encrypted_data = ?, enc_iv = ?, enc_auth_tag = ?, updated_at = datetime('now') " +
    'WHERE id = ? AND deleted_at IS NULL'
  ).run(
    merged.name       || '',
    merged.email      || '',
    merged.phone      || '',
    merged.state      || '',
    merged.state_code || '',
    merged.is_active  !== undefined ? (merged.is_active ? 1 : 0) : 1,
    enc.encryptedData, enc.iv, enc.authTag,
    id
  );

  _enqueue('UPDATE', merged);
}

function deleteCustomer(id) {
  conn.getDB()
    .prepare("UPDATE customers SET deleted_at = datetime('now') WHERE id = ?")
    .run(id);
  sq.addToQueue('DELETE', 'customers', id, null);
}

function getCustomerBillSummary(customerId) {
  var row = conn.getDB().prepare(
    'SELECT ' +
    '  COUNT(*) as total_bills, ' +
    '  SUM(grand_total) as total_billed, ' +
    '  SUM(amount_paid) as total_paid, ' +
    '  SUM(amount_due)  as outstanding ' +
    'FROM bills ' +
    'WHERE customer_id = ? AND deleted_at IS NULL'
  ).get(customerId);
  return {
    total_bills:  row.total_bills  || 0,
    total_billed: row.total_billed || 0,
    total_paid:   row.total_paid   || 0,
    outstanding:  row.outstanding  || 0
  };
}

module.exports = {
  listCustomers:          listCustomers,
  getCustomer:            getCustomer,
  createCustomer:         createCustomer,
  updateCustomer:         updateCustomer,
  deleteCustomer:         deleteCustomer,
  getCustomerBillSummary: getCustomerBillSummary
};
