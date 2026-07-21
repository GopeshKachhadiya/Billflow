// scripts/test-gst.js
// Automated verification script for BillFlow GST calculation engine

var path = require('path');
var gstCalc = require(path.join(__dirname, '../src/gst/calculator.js'));
var amountToWords = require(path.join(__dirname, '../src/gst/amount-to-words.js'));

var totalTests = 0;
var passedTests = 0;
var failedTests = 0;

function assert(condition, testName, details) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log('  [PASS] ' + testName);
  } else {
    failedTests++;
    console.error('  [FAIL] ' + testName);
    if (details) console.error('         Details: ' + details);
  }
}

function assertClose(actual, expected, testName, tolerance) {
  tolerance = tolerance || 0.01;
  var diff = Math.abs(actual - expected);
  assert(diff <= tolerance, testName, 'Expected ' + expected + ', got ' + actual + ' (diff: ' + diff + ')');
}

console.log('====================================================================');
console.log('  BillFlow Automated GST Verification Engine & Unit Tests');
console.log('====================================================================\n');

// ── 1. Supply Type Tests ──────────────────────────────────────────────────────
console.log('--- 1. Testing Supply Type Determination ---');
assert(gstCalc.getSupplyType('24', '24', false) === 'intrastate', 'Same state code (24 Gujarat -> 24 Gujarat) should be intrastate');
assert(gstCalc.getSupplyType('24', '27', false) === 'interstate', 'Different state codes (24 Gujarat -> 27 Maharashtra) should be interstate');
assert(gstCalc.getSupplyType('', '24', false) === 'intrastate', 'Missing state codes should fallback safely to intrastate');

// ── 2. Line Item Calculation (Intrastate) ──────────────────────────────────────
console.log('\n--- 2. Testing Intrastate Line Item Calculation ---');
var lineIntra = gstCalc.calcLineItem({
  quantity: 10,
  unitPrice: 100,
  discountPercent: 10, // 10% discount -> Taxable 900
  gstRate: 18,         // 18% GST -> 9% CGST (81) + 9% SGST (81) = 162
  supplyType: 'intrastate'
});

assertClose(lineIntra.baseAmount, 1000.00, 'Base amount (10 * 100 = 1000)');
assertClose(lineIntra.discountAmount, 100.00, 'Discount amount (10% of 1000 = 100)');
assertClose(lineIntra.taxableAmount, 900.00, 'Taxable amount (1000 - 100 = 900)');
assertClose(lineIntra.cgstRate, 9.00, 'CGST Rate (18 / 2 = 9%)');
assertClose(lineIntra.cgstAmount, 81.00, 'CGST Amount (9% of 900 = 81)');
assertClose(lineIntra.sgstRate, 9.00, 'SGST Rate (18 / 2 = 9%)');
assertClose(lineIntra.sgstAmount, 81.00, 'SGST Amount (9% of 900 = 81)');
assertClose(lineIntra.igstAmount, 0.00, 'IGST Amount should be 0 for intrastate');
assertClose(lineIntra.lineTotal, 1062.00, 'Line Total (900 + 81 + 81 = 1062)');

// ── 3. Line Item Calculation (Interstate) ──────────────────────────────────────
console.log('\n--- 3. Testing Interstate Line Item Calculation ---');
var lineInter = gstCalc.calcLineItem({
  quantity: 5,
  unitPrice: 250,
  discountPercent: 0,
  gstRate: 12,
  supplyType: 'interstate'
});

assertClose(lineInter.taxableAmount, 1250.00, 'Taxable amount (5 * 250 = 1250)');
assertClose(lineInter.cgstAmount, 0.00, 'CGST Amount should be 0 for interstate');
assertClose(lineInter.sgstAmount, 0.00, 'SGST Amount should be 0 for interstate');
assertClose(lineInter.igstRate, 12.00, 'IGST Rate (12%)');
assertClose(lineInter.igstAmount, 150.00, 'IGST Amount (12% of 1250 = 150)');
assertClose(lineInter.lineTotal, 1400.00, 'Line Total (1250 + 150 = 1400)');

// ── 4. Bill Totals & Round Off Tests ──────────────────────────────────────────
console.log('\n--- 4. Testing Bill Totals & Exact Rupee Round Off ---');
// Let's test items whose raw grand total has fractional paisa requiring round off
var fractionalLine = gstCalc.calcLineItem({
  quantity: 3,
  unitPrice: 33.33,
  discountPercent: 0,
  gstRate: 5,
  supplyType: 'intrastate'
}); // Taxable: 99.99, CGST: 2.50, SGST: 2.50 -> Raw total: 104.99 -> Grand Total: 105, RoundOff: +0.01

var totals = gstCalc.calcBillTotals([fractionalLine]);
assertClose(totals.totalTaxable, 99.99, 'Total Taxable Amount');
assertClose(totals.totalTax, 5.00, 'Total Tax Amount');
assert(totals.grandTotal === 105, 'Grand Total rounded to exact rupee (105)', 'Got ' + totals.grandTotal);
assertClose(totals.roundOff, 0.01, 'Round off adjustment (+0.01)');

// ── 5. Rate-Wise & HSN Breakdown Tests ─────────────────────────────────────────
console.log('\n--- 5. Testing Rate-Wise & HSN Breakdowns ---');
var itemsList = [lineIntra, lineInter];
var rateBreakdown = gstCalc.buildRateWiseBreakdown(itemsList);
assert(rateBreakdown.length === 2, 'Should create breakdown for two distinct rates (18% and 12%)');

var hsnBreakdown = gstCalc.buildHSNBreakdown([
  Object.assign({}, lineIntra, { hsnSac: '8471' }),
  Object.assign({}, lineIntra, { hsnSac: '8471' })
]);
assert(hsnBreakdown.length === 1 && hsnBreakdown[0].quantity === 20, 'Should aggregate quantities for identical HSN codes (10 + 10 = 20)');

// ── 6. Amount to Words Indian Numbering System Tests ───────────────────────────
console.log('\n--- 6. Testing Indian Amount to Words Conversion ---');
var wordsZero = amountToWords.toWords(0);
assert(wordsZero === 'Zero Rupees Only', 'Zero amount conversion correctly returns Zero Rupees Only');

var words105 = amountToWords.toWords(105);
assert(words105 === 'One Hundred Five Rupees Only', '105 conversion: ' + words105);

var wordsLakh = amountToWords.toWords(125000);
assert(wordsLakh.indexOf('Lakh') !== -1, 'Large amount (1,25,000) uses Indian Lakh numbering: ' + wordsLakh);

// ── Summary & Exit Code ───────────────────────────────────────────────────────
console.log('\n====================================================================');
console.log('  Verification Summary: ' + passedTests + ' / ' + totalTests + ' tests passed.');
console.log('====================================================================\n');

if (failedTests > 0) {
  console.error('  ERROR: ' + failedTests + ' test(s) failed. Please check calculation algorithms.');
  process.exit(1);
} else {
  console.log('  SUCCESS: All GST verification rules and rounding tests passed cleanly!');
  process.exit(0);
}
