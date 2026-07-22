function isValidGSTIN(gstin) {
  if (!gstin) return false;
  gstin = gstin.trim().toUpperCase();
  if (gstin.length !== 15) return false;

  var regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!regex.test(gstin)) return false;

  var stateCode = parseInt(gstin.substring(0, 2), 10);
  if (stateCode < 1 || stateCode > 38) return false;

  return true;
}

function isValidPAN(pan) {
  if (!pan) return false;
  pan = pan.trim().toUpperCase();
  return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan);
}

function isValidPhone(phone) {
  if (!phone) return false;
  phone = phone.trim().replace(/\D/g, '');
  if (phone.length === 12 && phone.startsWith('91')) phone = phone.substring(2);
  return /^[6-9]\d{9}$/.test(phone);
}

function isValidPIN(pin) {
  if (!pin) return false;
  pin = pin.trim();
  return /^[1-9][0-9]{5}$/.test(pin);
}

function isValidIFSC(ifsc) {
  if (!ifsc) return false;
  ifsc = ifsc.trim().toUpperCase();
  return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc);
}

module.exports = {
  isValidGSTIN: isValidGSTIN,
  isValidPAN: isValidPAN,
  isValidPhone: isValidPhone,
  isValidPIN: isValidPIN,
  isValidIFSC: isValidIFSC
};
