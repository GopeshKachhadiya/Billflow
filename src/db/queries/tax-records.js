var conn      = require('../connection');
var sq        = require('./sync-queue');
var encryptor = require('../../crypto/data-encryptor');

function upsertTaxRecord(billId, data) {
  var db  = conn.getDB();
  var id  = db.prepare("SELECT lower(hex(randomblob(16))) as id").get().id;

  var sensitive = {
    customer_name:       data.customer_name       || '',
    customer_gstin:      data.customer_gstin       || '',
    customer_state:      data.customer_state       || '',
    customer_state_code: data.customer_state_code  || '',
    rate_wise_breakdown: data.rate_wise_breakdown  || [],
    hsn_wise_breakdown:  data.hsn_wise_breakdown   || []
  };
  var enc = encryptor.encryptObject(sensitive);

  db.prepare(
    'INSERT INTO tax_records ' +
    '(id, bill_id, bill_date, bill_number, ' +
    'total_taxable, total_cgst, total_sgst, total_igst, total_tax, grand_total, ' +
    'encrypted_data, enc_iv, enc_auth_tag, created_at, updated_at) ' +
    "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'),datetime('now')) " +
    'ON CONFLICT(bill_id) DO UPDATE SET ' +
    'total_taxable=excluded.total_taxable, total_cgst=excluded.total_cgst, ' +
    'total_sgst=excluded.total_sgst, total_igst=excluded.total_igst, ' +
    'total_tax=excluded.total_tax, grand_total=excluded.grand_total, ' +
    'encrypted_data=excluded.encrypted_data, enc_iv=excluded.enc_iv, ' +
    "enc_auth_tag=excluded.enc_auth_tag, updated_at=datetime('now')"
  ).run(
    id, billId, data.bill_date, data.bill_number,
    parseFloat(data.total_taxable) || 0,
    parseFloat(data.total_cgst)    || 0,
    parseFloat(data.total_sgst)    || 0,
    parseFloat(data.total_igst)    || 0,
    parseFloat(data.total_tax)     || 0,
    parseFloat(data.grand_total)   || 0,
    enc.encryptedData, enc.iv, enc.authTag
  );

  sq.addToQueue('INSERT', 'tax_records', billId, {
    bill_id:        billId,
    bill_date:      data.bill_date,
    bill_number:    data.bill_number,
    total_taxable:  data.total_taxable,
    total_cgst:     data.total_cgst,
    total_sgst:     data.total_sgst,
    total_igst:     data.total_igst,
    total_tax:      data.total_tax,
    grand_total:    data.grand_total,
    encryptedData:  enc.encryptedData,
    iv:             enc.iv,
    authTag:        enc.authTag
  });
}

function getTaxRecord(billId) {
  var row = conn.getDB()
    .prepare('SELECT * FROM tax_records WHERE bill_id = ?')
    .get(billId);
  if (!row) return null;
  if (row.encrypted_data) {
    try {
      var dec = encryptor.decryptObject(row.encrypted_data, row.enc_iv, row.enc_auth_tag);
      return Object.assign({}, row, dec);
    } catch(e) { return row; }
  }
  return row;
}

function getTaxSummary(filter) {
  filter = filter || {};
  var sql  = 'SELECT SUM(total_taxable) as total_taxable, SUM(total_cgst) as total_cgst, ' +
             'SUM(total_sgst) as total_sgst, SUM(total_igst) as total_igst, ' +
             'SUM(total_tax) as total_tax, SUM(grand_total) as grand_total, ' +
             'COUNT(*) as invoice_count FROM tax_records WHERE 1=1';
  var args = [];
  if (filter.dateFrom) { sql += ' AND bill_date >= ?'; args.push(filter.dateFrom); }
  if (filter.dateTo)   { sql += ' AND bill_date <= ?'; args.push(filter.dateTo);   }

  var stmt = conn.getDB().prepare(sql);
  return stmt.get.apply(stmt, args) || {};
}

function getMonthlyGSTSummary(year) {
  return conn.getDB().prepare(
    "SELECT strftime('%Y-%m', bill_date) as month, " +
    'SUM(total_taxable) as taxable, SUM(total_cgst) as cgst, ' +
    'SUM(total_sgst) as sgst, SUM(total_igst) as igst, ' +
    'SUM(total_tax) as tax, COUNT(*) as count ' +
    "FROM tax_records WHERE strftime('%Y', bill_date) = ? " +
    'GROUP BY month ORDER BY month ASC'
  ).all(String(year));
}

module.exports = {
  upsertTaxRecord:      upsertTaxRecord,
  getTaxRecord:         getTaxRecord,
  getTaxSummary:        getTaxSummary,
  getMonthlyGSTSummary: getMonthlyGSTSummary
};
