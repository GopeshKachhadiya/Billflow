var calc = require('./calculator');

var passed = 0;
var failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log('  [PASS] ' + message);
  } else {
    failed++;
    console.error('  [FAIL] ' + message);
  }
}

console.log('Starting GST Calculator Test Suite...');

// Test 1: Intrastate calculations (CGST + SGST)
console.log('\nRunning Test 1: Intrastate (CGST + SGST)...');
var res1 = calc.calcLineItem({
  quantity: 2,
  unitPrice: 500,
  discountPercent: 10,
  gstRate: 18,
  supplyType: 'intrastate'
});
assert(res1.baseAmount === 1000, 'Base amount should be 1000');
assert(res1.discountAmount === 100, 'Discount should be 100');
assert(res1.taxableAmount === 900, 'Taxable amount should be 900');
assert(res1.cgstAmount === 81, 'CGST should be 81');
assert(res1.sgstAmount === 81, 'SGST should be 81');
assert(res1.igstAmount === 0, 'IGST should be 0');
assert(res1.lineTotal === 1062, 'Line total should be 1062');

// Test 2: Interstate calculations (IGST)
console.log('\nRunning Test 2: Interstate (IGST)...');
var res2 = calc.calcLineItem({
  quantity: 1,
  unitPrice: 1000,
  discountPercent: 0,
  gstRate: 12,
  supplyType: 'interstate'
});
assert(res2.taxableAmount === 1000, 'Taxable should be 1000');
assert(res2.cgstAmount === 0, 'CGST should be 0');
assert(res2.sgstAmount === 0, 'SGST should be 0');
assert(res2.igstAmount === 120, 'IGST should be 120');
assert(res2.lineTotal === 1120, 'Line total should be 1120');

// Test 3: Rounding rules for line items
console.log('\nRunning Test 3: Line Item Rounding...');
var res3 = calc.calcLineItem({
  quantity: 1,
  unitPrice: 333.33,
  discountPercent: 0,
  gstRate: 18,
  supplyType: 'intrastate'
});
assert(res3.cgstAmount === 30, 'CGST should be rounded to 30.00');
assert(res3.sgstAmount === 30, 'SGST should be rounded to 30.00');
assert(res3.lineTotal === 393.33, 'Line total should be 393.33');

// Test 4: Bill totals aggregation & round off
console.log('\nRunning Test 4: Bill Totals and Round-Off...');
var items = [
  calc.calcLineItem({ quantity: 1, unitPrice: 100.50, discountPercent: 0, gstRate: 18, supplyType: 'intrastate' }),
  calc.calcLineItem({ quantity: 1, unitPrice: 200.25, discountPercent: 0, gstRate: 12, supplyType: 'intrastate' })
];
var totals = calc.calcBillTotals(items);
assert(totals.grandTotal === 343, 'Grand total should be rounded to 343');
assert(totals.roundOff === 0.13, 'Round-off should be 0.13');

// Test 5: Rate-wise breakdown
console.log('\nRunning Test 5: Rate-wise Breakdown...');
var breakdown = calc.buildRateWiseBreakdown(items);
assert(breakdown.length === 2, 'Breakdown should have 2 slabs');
var slab18 = breakdown.filter(function(x) { return x.rate === 18; })[0];
var slab12 = breakdown.filter(function(x) { return x.rate === 12; })[0];
assert(slab18.taxable === 100.50, '18% taxable should be 100.50');
assert(slab12.taxable === 200.25, '12% taxable should be 200.25');

console.log('\nTest Results: ' + passed + ' passed, ' + failed + ' failed.');
process.exit(failed > 0 ? 1 : 0);
