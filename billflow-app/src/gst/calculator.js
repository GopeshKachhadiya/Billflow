function getSupplyType(businessStateCode, customerStateCode, isUnionTerritory) {
  if (!businessStateCode || !customerStateCode) {
    return 'intrastate';
  }
  return (businessStateCode === customerStateCode) ? 'intrastate' : 'interstate';
}

function calcLineItem(data) {
  var qty   = parseFloat(data.quantity) || 0;
  var price = parseFloat(data.unitPrice) || 0;
  var disc  = parseFloat(data.discountPercent) || 0;
  var rate  = parseFloat(data.gstRate) || 0;
  var supply = data.supplyType || 'intrastate';

  var baseAmount = qty * price;
  var discountAmount = baseAmount * (disc / 100);
  var taxableAmount = baseAmount - discountAmount;

  var cgstRate = 0;
  var cgstAmount = 0;
  var sgstRate = 0;
  var sgstAmount = 0;
  var igstRate = 0;
  var igstAmount = 0;

  if (supply === 'intrastate') {
    cgstRate = rate / 2;
    cgstAmount = taxableAmount * (cgstRate / 100);
    sgstRate = rate / 2;
    sgstAmount = taxableAmount * (sgstRate / 100);
  } else {
    igstRate = rate;
    igstAmount = taxableAmount * (igstRate / 100);
  }

  var lineTotal = taxableAmount + cgstAmount + sgstAmount + igstAmount;

  return {
    quantity: qty,
    unitPrice: price,
    discountPercent: disc,
    gstRate: rate,
    baseAmount: Math.round(baseAmount * 100) / 100,
    discountAmount: Math.round(discountAmount * 100) / 100,
    taxableAmount: Math.round(taxableAmount * 100) / 100,
    cgstRate: cgstRate,
    cgstAmount: Math.round(cgstAmount * 100) / 100,
    sgstRate: sgstRate,
    sgstAmount: Math.round(sgstAmount * 100) / 100,
    igstRate: igstRate,
    igstAmount: Math.round(igstAmount * 100) / 100,
    lineTotal: Math.round(lineTotal * 100) / 100
  };
}

function calcBillTotals(lineItemResults) {
  var subtotal = 0;
  var totalDiscount = 0;
  var totalTaxable = 0;
  var totalCGST = 0;
  var totalSGST = 0;
  var totalIGST = 0;

  for (var i = 0; i < lineItemResults.length; i++) {
    var it = lineItemResults[i];
    subtotal += it.baseAmount || 0;
    totalDiscount += it.discountAmount || 0;
    totalTaxable += it.taxableAmount || 0;
    totalCGST += it.cgstAmount || 0;
    totalSGST += it.sgstAmount || 0;
    totalIGST += it.igstAmount || 0;
  }

  var totalTax = totalCGST + totalSGST + totalIGST;
  var rawGrandTotal = totalTaxable + totalTax;
  var grandTotal = Math.round(rawGrandTotal);
  var roundOff = grandTotal - rawGrandTotal;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    totalDiscount: Math.round(totalDiscount * 100) / 100,
    totalTaxable: Math.round(totalTaxable * 100) / 100,
    totalCGST: Math.round(totalCGST * 100) / 100,
    totalSGST: Math.round(totalSGST * 100) / 100,
    totalIGST: Math.round(totalIGST * 100) / 100,
    totalTax: Math.round(totalTax * 100) / 100,
    roundOff: Math.round(roundOff * 100) / 100,
    grandTotal: grandTotal
  };
}

function buildRateWiseBreakdown(items) {
  var breakdown = {};
  for (var i = 0; i < items.length; i++) {
    var it = items[i];
    var rate = it.gstRate || 0;
    if (!breakdown[rate]) {
      breakdown[rate] = { rate: rate, taxable: 0, cgst: 0, sgst: 0, igst: 0 };
    }
    breakdown[rate].taxable += it.taxableAmount || 0;
    breakdown[rate].cgst += it.cgstAmount || 0;
    breakdown[rate].sgst += it.sgstAmount || 0;
    breakdown[rate].igst += it.igstAmount || 0;
  }
  var result = [];
  for (var k in breakdown) {
    if (breakdown.hasOwnProperty(k)) {
      var r = breakdown[k];
      result.push({
        rate: r.rate,
        taxable: Math.round(r.taxable * 100) / 100,
        cgst: Math.round(r.cgst * 100) / 100,
        sgst: Math.round(r.sgst * 100) / 100,
        igst: Math.round(r.igst * 100) / 100
      });
    }
  }
  return result;
}

function buildHSNBreakdown(items) {
  var breakdown = {};
  for (var i = 0; i < items.length; i++) {
    var it = items[i];
    var hsn = it.hsnSac || 'OTHER';
    if (!breakdown[hsn]) {
      breakdown[hsn] = { hsn_sac: hsn, description: it.description || '', unit: it.unit || 'Nos', quantity: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0 };
    }
    breakdown[hsn].quantity += it.quantity || 0;
    breakdown[hsn].taxable += it.taxableAmount || 0;
    breakdown[hsn].cgst += it.cgstAmount || 0;
    breakdown[hsn].sgst += it.sgstAmount || 0;
    breakdown[hsn].igst += it.igstAmount || 0;
  }
  var result = [];
  for (var k in breakdown) {
    if (breakdown.hasOwnProperty(k)) {
      var r = breakdown[k];
      result.push({
        hsn_sac: r.hsn_sac,
        description: r.description,
        unit: r.unit,
        quantity: r.quantity,
        taxable: Math.round(r.taxable * 100) / 100,
        cgst: Math.round(r.cgst * 100) / 100,
        sgst: Math.round(r.sgst * 100) / 100,
        igst: Math.round(r.igst * 100) / 100
      });
    }
  }
  return result;
}

module.exports = {
  getSupplyType: getSupplyType,
  calcLineItem: calcLineItem,
  calcBillTotals: calcBillTotals,
  buildRateWiseBreakdown: buildRateWiseBreakdown,
  buildHSNBreakdown: buildHSNBreakdown
};
