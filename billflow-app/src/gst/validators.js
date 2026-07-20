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

module.exports = {
  isValidGSTIN: isValidGSTIN
};
