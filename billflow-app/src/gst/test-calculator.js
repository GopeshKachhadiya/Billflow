var calc = require('./calculator');

function runTest(name, assertion) {
  try {
    assertion();
    console.log('✅ PASS:', name);
  } catch (err) {
    console.error('❌ FAIL:', name, err.message);
    process.exitCode = 1;
  }
}

function assertEqual(actual, expected, msg) {
  if (actual !== expected) {
    throw new Error((msg || 'Assertion failed') + ' | Expected: ' + expected + ', Got: ' + actual);
  }
}

console.log('--- Running GST Calculator Unit Tests ---');

runTest('Intrastate 18% Supply Type & Tax Calculation', function() {
  var supply = calc.getSupplyType('24', '24');
  assertEqual(supply, 'intrastate', 'Supply type should be intrastate');

  var res = calc.calcLineItem({ quantity: 10, unitPrice: 1000, discountPercent: 5, gstRate: 18, supplyType: supply });
  assertEqual(res.baseAmount, 10000, 'Base amount');
  assertEqual(res.discountAmount, 500, 'Discount amount');
  assertEqual(res.taxableAmount, 9500, 'Taxable amount');
  assertEqual(res.cgstRate, 9, 'CGST rate');
  assertEqual(res.cgstAmount, 855, 'CGST amount');
  assertEqual(res.sgstRate, 9, 'SGST rate');
  assertEqual(res.sgstAmount, 855, 'SGST amount');
  assertEqual(res.igstAmount, 0, 'IGST amount');
  assertEqual(res.lineTotal, 11210, 'Line total');
});

runTest('Interstate 18% Supply Type & Tax Calculation', function() {
  var supply = calc.getSupplyType('24', '27');
  assertEqual(supply, 'interstate', 'Supply type should be interstate');

  var res = calc.calcLineItem({ quantity: 10, unitPrice: 1000, discountPercent: 5, gstRate: 18, supplyType: supply });
  assertEqual(res.taxableAmount, 9500, 'Taxable amount');
  assertEqual(res.cgstAmount, 0, 'CGST amount');
  assertEqual(res.sgstAmount, 0, 'SGST amount');
  assertEqual(res.igstRate, 18, 'IGST rate');
  assertEqual(res.igstAmount, 1710, 'IGST amount');
  assertEqual(res.lineTotal, 11210, 'Line total');
});

runTest('Bill Totals & Round Off Aggregation', function() {
  var item1 = calc.calcLineItem({ quantity: 1, unitPrice: 100.33, discountPercent: 0, gstRate: 18, supplyType: 'intrastate' });
  var totals = calc.calcBillTotals([item1]);

  assertEqual(typeof totals.grandTotal, 'number', 'Grand total is number');
  assertEqual(totals.grandTotal, Math.round(totals.totalTaxable + totals.totalTax), 'Grand total rounded');
});

console.log('--- GST Calculator Unit Tests Completed ---');
