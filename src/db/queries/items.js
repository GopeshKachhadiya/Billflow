var conn      = require('../connection');
var sq        = require('./sync-queue');
var encryptor = require('../../crypto/data-encryptor');

function _enqueue(op, item) {
  var enc = encryptor.encryptItem(item);
  sq.addToQueue(op, 'items_catalog', item.id, {
    meta: enc.meta, encryptedData: enc.encryptedData, iv: enc.iv, authTag: enc.authTag
  });
}

function listItems(filter) {
  filter = filter || {};
  var sql  = 'SELECT id, name, gst_rate, is_active, encrypted_data, enc_iv, enc_auth_tag ' +
             'FROM items_catalog WHERE deleted_at IS NULL';
  var args = [];

  if (filter.isActive !== undefined) {
    sql += ' AND is_active = ?'; args.push(filter.isActive ? 1 : 0);
  }
  if (filter.search && filter.search.trim()) {
    sql += ' AND name LIKE ?'; args.push('%' + filter.search.trim() + '%');
  }
  sql += ' ORDER BY name COLLATE NOCASE ASC';

  var rows = conn.getDB().prepare(sql).all.apply(conn.getDB().prepare(sql), args);
  return rows.map(function(row) {
    if (!row.encrypted_data) return row;
    try { return encryptor.decryptItem(row, row.encrypted_data, row.enc_iv, row.enc_auth_tag); }
    catch(e) { return row; }
  });
}

function getItem(id) {
  var row = conn.getDB()
    .prepare('SELECT * FROM items_catalog WHERE id = ? AND deleted_at IS NULL')
    .get(id);
  if (!row) return null;
  if (!row.encrypted_data) return row;
  try { return encryptor.decryptItem(row, row.encrypted_data, row.enc_iv, row.enc_auth_tag); }
  catch(e) { return row; }
}

function createItem(data) {
  var db  = conn.getDB();
  var id  = db.prepare("SELECT lower(hex(randomblob(16))) as id").get().id;
  var item = Object.assign({ id: id, updated_at: new Date().toISOString() }, data);
  var enc = encryptor.encryptItem(item);

  db.prepare(
    'INSERT INTO items_catalog (id, name, gst_rate, is_active, encrypted_data, enc_iv, enc_auth_tag, created_at, updated_at) ' +
    "VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))"
  ).run(id, data.name || '', parseFloat(data.gst_rate) || 18,
        data.is_active !== undefined ? (data.is_active ? 1 : 0) : 1,
        enc.encryptedData, enc.iv, enc.authTag);

  _enqueue('INSERT', item);
  return { id: id };
}

function updateItem(id, data) {
  var current = getItem(id);
  if (!current) throw new Error('Item not found: ' + id);
  var merged  = Object.assign({}, current, data, { id: id, updated_at: new Date().toISOString() });
  var enc     = encryptor.encryptItem(merged);

  conn.getDB().prepare(
    'UPDATE items_catalog SET name = ?, gst_rate = ?, is_active = ?, ' +
    "encrypted_data = ?, enc_iv = ?, enc_auth_tag = ?, updated_at = datetime('now') " +
    'WHERE id = ? AND deleted_at IS NULL'
  ).run(merged.name || '', parseFloat(merged.gst_rate) || 18,
        merged.is_active ? 1 : 0,
        enc.encryptedData, enc.iv, enc.authTag, id);

  _enqueue('UPDATE', merged);
}

function deleteItem(id) {
  conn.getDB()
    .prepare("UPDATE items_catalog SET deleted_at = datetime('now') WHERE id = ?")
    .run(id);
  sq.addToQueue('DELETE', 'items_catalog', id, null);
}

module.exports = { listItems:listItems, getItem:getItem,
                   createItem:createItem, updateItem:updateItem, deleteItem:deleteItem };
