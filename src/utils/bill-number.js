var settings = require('../db/queries/settings');

function getNextBillNumber() {
  var prefix = settings.getSetting('bill_prefix')      || 'INV';
  var next   = parseInt(settings.getSetting('bill_next_number') || '1', 10);
  var year   = new Date().getFullYear();
  var padded = String(next);
  while (padded.length < 3) { padded = '0' + padded; }
  return prefix + '-' + year + '-' + padded;
}

function incrementBillNumber() {
  var current = parseInt(settings.getSetting('bill_next_number') || '1', 10);
  settings.setSetting('bill_next_number', String(current + 1));
}

module.exports = { getNextBillNumber: getNextBillNumber, incrementBillNumber: incrementBillNumber };
