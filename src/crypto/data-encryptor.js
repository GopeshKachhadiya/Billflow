var crypto = require('crypto');

var encryptionKey = null;

function setKey(key) {
  encryptionKey = key; // 32-byte Buffer
}

function clearKey() {
  encryptionKey = null;
}

function encrypt(text) {
  if (!encryptionKey) {
    throw new Error('Encryption key not set');
  }
  var iv = crypto.randomBytes(12);
  var cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey, iv);
  var encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  var authTag = cipher.getAuthTag().toString('hex');
  return {
    encryptedData: encrypted,
    iv: iv.toString('hex'),
    authTag: authTag
  };
}

function decrypt(encryptedData, ivHex, authTagHex) {
  if (!encryptionKey) {
    throw new Error('Encryption key not set');
  }
  var iv = Buffer.from(ivHex, 'hex');
  var authTag = Buffer.from(authTagHex, 'hex');
  var decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey, iv);
  decipher.setAuthTag(authTag);
  var decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

function encryptObject(obj) {
  var text = JSON.stringify(obj);
  return encrypt(text);
}

function decryptObject(encryptedData, ivHex, authTagHex) {
  var text = decrypt(encryptedData, ivHex, authTagHex);
  return JSON.parse(text);
}

function encryptCustomer(customer) {
  var meta = {
    id: customer.id,
    name: customer.name || '',
    email: customer.email || '',
    phone: customer.phone || '',
    state: customer.state || '',
    state_code: customer.state_code || '',
    is_active: customer.is_active !== undefined ? (customer.is_active ? 1 : 0) : 1
  };
  var enc = encryptObject(customer);
  return {
    meta: meta,
    encryptedData: enc.encryptedData,
    iv: enc.iv,
    authTag: enc.authTag
  };
}

function decryptCustomer(row, encryptedData, ivHex, authTagHex) {
  var decrypted = decryptObject(encryptedData, ivHex, authTagHex);
  return Object.assign({}, row, decrypted);
}

function encryptItem(item) {
  var meta = {
    id: item.id,
    name: item.name || '',
    gst_rate: parseFloat(item.gst_rate) || 18,
    is_active: item.is_active !== undefined ? (item.is_active ? 1 : 0) : 1
  };
  var enc = encryptObject(item);
  return {
    meta: meta,
    encryptedData: enc.encryptedData,
    iv: enc.iv,
    authTag: enc.authTag
  };
}

function decryptItem(row, encryptedData, ivHex, authTagHex) {
  var decrypted = decryptObject(encryptedData, ivHex, authTagHex);
  return Object.assign({}, row, decrypted);
}

function encryptBill(bill, items, taxRecord) {
  var meta = {
    id: bill.id,
    bill_number: bill.bill_number || '',
    customer_id: bill.customer_id || '',
    bill_date: bill.bill_date || '',
    due_date: bill.due_date || '',
    status: bill.status || 'draft',
    grand_total: parseFloat(bill.grand_total) || 0,
    amount_paid: parseFloat(bill.amount_paid) || 0,
    amount_due: parseFloat(bill.amount_due) || 0,
    created_by: bill.created_by || ''
  };
  var payload = {
    bill: bill,
    items: items || [],
    taxRecord: taxRecord || null
  };
  var enc = encryptObject(payload);
  return {
    meta: meta,
    encryptedData: enc.encryptedData,
    iv: enc.iv,
    authTag: enc.authTag
  };
}

function decryptBill(row, encryptedData, ivHex, authTagHex) {
  var decrypted = decryptObject(encryptedData, ivHex, authTagHex);
  return Object.assign({}, row, decrypted.bill);
}

module.exports = {
  setKey: setKey,
  clearKey: clearKey,
  encryptObject: encryptObject,
  decryptObject: decryptObject,
  encryptCustomer: encryptCustomer,
  decryptCustomer: decryptCustomer,
  encryptItem: encryptItem,
  decryptItem: decryptItem,
  encryptBill: encryptBill,
  decryptBill: decryptBill
};
