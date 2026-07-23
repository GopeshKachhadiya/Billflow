var settings = require('../db/queries/settings');

function getNextBillNumber() {
  var rawPrefix = (settings.getSetting('bill_prefix') || 'INV').trim();
  var prefix = rawPrefix.replace(/[\/\-]+$/, ''); // Clean trailing hyphens or slashes
  var next   = parseInt(settings.getSetting('bill_next_number') || '1', 10);
  var year   = new Date().getFullYear();
  var padded = String(next);
  while (padded.length < 3) { padded = '0' + padded; }
  return (prefix || 'INV') + '-' + year + '-' + padded;
}

async function incrementBillNumber() {
  var current = parseInt(settings.getSetting('bill_next_number') || '1', 10);
  await settings.setSetting('bill_next_number', String(current + 1));
}

module.exports = { getNextBillNumber: getNextBillNumber, incrementBillNumber: incrementBillNumber };
