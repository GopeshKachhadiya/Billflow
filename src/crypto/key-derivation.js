var crypto = require('crypto');

function generateDeviceSalt() {
  return crypto.randomBytes(16).toString('hex');
}

function deriveKey(password, salt) {
  // 100,000 iterations of PBKDF2-SHA256, deriving 32 bytes (256 bits)
  return crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
}

function generateVerificationBlob(derivedKey) {
  return crypto.createHash('sha256').update(derivedKey).digest('hex');
}

function verifyKey(derivedKey, verificationBlob) {
  var hash = crypto.createHash('sha256').update(derivedKey).digest('hex');
  return hash === verificationBlob;
}

module.exports = {
  generateDeviceSalt: generateDeviceSalt,
  deriveKey: deriveKey,
  generateVerificationBlob: generateVerificationBlob,
  verifyKey: verifyKey
};
