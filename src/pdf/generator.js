var PDFDocument = require('pdfkit');
var fs          = require('fs');
var QRCode      = require('qrcode');

function DateUtils_toDisplay(dateStr) {
  if (!dateStr) return '';
  var parts = dateStr.split('-');
  if (parts.length === 3) {
    return parts[2] + '/' + parts[1] + '/' + parts[0];
  }
  return dateStr;
}

function generateBoxyPDF(doc, bill, items, customer, s, W) {
  // Outer Border Box (covers 40 to 802)
  doc.rect(40, 40, W, 762).stroke('#000000');
  
  // 1. Top centering red text (40 to 57)
  doc.fillColor('red');
  doc.font('Helvetica-Bold').fontSize(8.5);
  doc.text('!! SHREE GANESHAI NAMAH !!', 40, 46, { align: 'center', width: W });
  doc.moveTo(40, 57).lineTo(40 + W, 57).stroke('#000000');

  // 2. Header Business Name & Details (57 to 112)
  doc.fillColor('#0f3080');
  doc.font('Helvetica-Bold').fontSize(22);
  doc.text(s.business_name || 'SUTARIYA YARN', 40, 62, { align: 'center', width: W });
  
  doc.fillColor('#000000');
  doc.font('Helvetica-Bold').fontSize(8.5);
  var bizAddr = [s.business_address, s.business_city, s.business_pin].filter(Boolean).join(', ');
  doc.text((bizAddr || 'Address not configured').toUpperCase(), 40, 88, { align: 'center', width: W });
  
  var contactStr = [];
  if (s.business_phone) contactStr.push('MO : ' + s.business_phone);
  if (s.business_email) contactStr.push(s.business_email);
  doc.text(contactStr.join(' | '), 40, 99, { align: 'center', width: W });
  doc.moveTo(40, 112).lineTo(40 + W, 112).stroke('#000000');

  // 3. GST / State / PAN row (112 to 131)
  doc.fillColor('#000000');
  doc.font('Helvetica-Bold').fontSize(9);
  doc.text('GST No.: ' + (s.gstin || '—'), 48, 118);
  doc.text('State : ' + (s.business_state || '24 GUJARAT'), 40, 118, { align: 'center', width: W });
  doc.text('PAN : ' + (s.pan || '—'), 40, 118, { align: 'right', width: W - 8 });
  doc.moveTo(40, 131).lineTo(40 + W, 131).stroke('#000000');

  // 4. TAX INVOICE Bar (131 to 149)
  doc.rect(40, 131, W, 18).fillAndStroke('#f2f2f2', '#000000');
  doc.fillColor('#000000').font('Helvetica-Bold').fontSize(10.5);
  doc.text('TAX INVOICE', 40, 136, { align: 'center', width: W });

  // 5. Invoice Detail & Order Details split section (149 to 219)
  var detailsY = 149;
  var detailsHeight = 70;
  var splitX = 270;
  
  doc.rect(40, detailsY, W, detailsHeight).stroke('#000000');
  doc.moveTo(splitX, detailsY).lineTo(splitX, detailsY + detailsHeight).stroke('#000000');
  
  // Left: Invoice Info
  doc.fillColor('#555555').font('Helvetica-Bold').fontSize(8.5).text('Invoice Detail:', 48, detailsY + 8);
  doc.fillColor('#000000').font('Helvetica-Bold').fontSize(10).text('Invoice No.', 48, detailsY + 24);
  doc.fillColor('#0f3080').font('Helvetica-Bold').fontSize(13).text(': ' + bill.bill_number, 120, detailsY + 22);
  doc.fillColor('#000000').font('Helvetica-Bold').fontSize(10).text('Date', 48, detailsY + 44);
  doc.fillColor('#0f3080').font('Helvetica-Bold').fontSize(11).text(': ' + DateUtils_toDisplay(bill.bill_date), 120, detailsY + 43);

  // Right: Order & Party Info
  doc.fillColor('#000000').font('Helvetica-Bold').fontSize(8.5);
  doc.text('Order No:', splitX + 8, detailsY + 6);
  doc.font('Helvetica').text(bill.order_number || '—', splitX + 75, detailsY + 6);
  doc.font('Helvetica-Bold').text('Order Date:', splitX + 150, detailsY + 6);
  doc.font('Helvetica').text(bill.order_date ? DateUtils_toDisplay(bill.order_date) : '—', splitX + 210, detailsY + 6);
  doc.moveTo(splitX, detailsY + 22).lineTo(40 + W, detailsY + 22).stroke('#000000');

  doc.font('Helvetica-Bold').text('Due Days:', splitX + 8, detailsY + 28);
  doc.font('Helvetica').text(String(bill.due_days || '—'), splitX + 75, detailsY + 28);
  doc.font('Helvetica-Bold').text('Due Date:', splitX + 150, detailsY + 28);
  doc.font('Helvetica').text(bill.due_date ? DateUtils_toDisplay(bill.due_date) : '—', splitX + 210, detailsY + 28);
  doc.moveTo(splitX, detailsY + 44).lineTo(40 + W, detailsY + 44).stroke('#000000');

  doc.font('Helvetica-Bold').text('Party Name:', splitX + 8, detailsY + 50);
  doc.font('Helvetica').text(bill.party_name || '—', splitX + 75, detailsY + 50, { width: 70, height: 12, ellipsis: true });
  doc.font('Helvetica-Bold').text('MO:', splitX + 150, detailsY + 50);
  doc.font('Helvetica').text(bill.party_phone || '—', splitX + 180, detailsY + 50);

  // 6. Receiver vs Consignee Details split section (219 to 319)
  var custY = 219;
  var custHeight = 100;
  var custSplitX = 297.5;
  
  doc.rect(40, custY, W, custHeight).stroke('#000000');
  doc.moveTo(custSplitX, custY).lineTo(custSplitX, custY + custHeight).stroke('#000000');
  
  // Left: Receiver (Billed To)
  doc.fillColor('red').font('Helvetica-Bold').fontSize(8.5).text('Detail Of Receivers/Billed To.', 48, custY + 6);
  doc.fillColor('#0f3080').font('Helvetica-Bold').fontSize(11).text(customer ? customer.name : 'Walk-in Customer', 48, custY + 18, { width: 235 });
  doc.fillColor('#000000').font('Helvetica').fontSize(8).text(customer ? (customer.address || '') : '', 48, custY + 32, { width: 235, lineGap: 1.5 });
  doc.moveTo(48, custY + 79).lineTo(custSplitX - 10, custY + 79).stroke('#dddddd');
  doc.fillColor('#000000').font('Helvetica-Bold').fontSize(8.5).text('GSTIN : ' + ((customer && customer.gstin) ? customer.gstin : '—'), 48, custY + 84);
  doc.text('State : ' + ((customer && customer.state) ? customer.state + (customer.state_code ? ' (' + customer.state_code + ')' : '') : '—'), 165, custY + 84);

  // Right: Consignee (Ship To)
  doc.fillColor('red').font('Helvetica-Bold').fontSize(8.5).text('Delivery Detail Of Consignee', custSplitX + 8, custY + 6);
  var consName = bill.consignee_name || (customer ? customer.name : 'Walk-in Customer');
  var consAddr = bill.consignee_address || (customer ? (customer.address || '') : '');
  var consGst = bill.consignee_gstin || (customer ? (customer.gstin || '—') : '—');
  var consState = bill.consignee_state || (customer ? ((customer.state || '') + (customer.state_code ? ' (' + customer.state_code + ')' : '')) : '—');
  doc.fillColor('#0f3080').font('Helvetica-Bold').fontSize(11).text(consName, custSplitX + 8, custY + 18, { width: 235 });
  doc.fillColor('#000000').font('Helvetica').fontSize(8).text(consAddr, custSplitX + 8, custY + 32, { width: 235, lineGap: 1.5 });
  doc.moveTo(custSplitX + 8, custY + 79).lineTo(40 + W - 10, custY + 79).stroke('#dddddd');
  doc.fillColor('#000000').font('Helvetica-Bold').fontSize(8.5).text('GST No : ' + consGst, custSplitX + 8, custY + 84);
  doc.text('State : ' + consState, custSplitX + 125, custY + 84);

  // 7. Transporter Info Section (319 to 354)
  var transY = 319;
  var transHeight = 35;
  doc.rect(40, transY, W, transHeight).stroke('#000000');
  
  doc.fillColor('#000000').font('Helvetica-Bold').fontSize(8.5);
  doc.text('Transporter:', 48, transY + 5); 
  doc.font('Helvetica').text(bill.transporter || '—', 115, transY + 5);
  
  doc.font('Helvetica-Bold').text('Transporter Gst No:', 48, transY + 19); 
  doc.font('Helvetica').text(bill.transporter_gst || '—', 145, transY + 19);
  
  doc.font('Helvetica-Bold').text('L.R No:', 270, transY + 5); 
  doc.font('Helvetica').text(bill.lr_number || '—', 315, transY + 5);
  
  doc.font('Helvetica-Bold').text('L.R Date:', 270, transY + 19); 
  doc.font('Helvetica').text(bill.lr_date ? DateUtils_toDisplay(bill.lr_date) : '—', 315, transY + 19);
  
  doc.font('Helvetica-Bold').text('Veh.No.:', 440, transY + 5); 
  doc.font('Helvetica').text(bill.vehicle_number || '—', 485, transY + 5);

  // 8. Items Table (354 to 564)
  var tableTop = 354;
  var tableHeight = 210;
  var cols = [40, 60, 200, 250, 320, 360, 390, 440, 470, 510, 555];
  var headers = ['Sr.', 'Description of Goods', 'HSN', 'Lot No', 'Gread', 'Crtn', 'Weight', 'UQC', 'RATE', 'AMOUNT'];
  
  // Table Header Row
  doc.rect(40, tableTop, W, 18).fillAndStroke('#f2f2f2', '#000000');
  doc.fillColor('#000000').font('Helvetica-Bold').fontSize(8.5);
  for (var h = 0; h < headers.length; h++) {
    var align = (h === 1) ? 'left' : (h === 8 || h === 9) ? 'right' : 'center';
    var xOffset = (h === 1) ? 4 : (h === 8) ? -2 : (h === 9) ? -4 : 0;
    doc.text(headers[h], cols[h] + xOffset, tableTop + 5, { width: cols[h+1] - cols[h] - (xOffset * 2), align: align });
  }

  var rowY = tableTop + 18;
  var totalQty = 0;
  var totalCartons = 0;
  var lastUnit = 'KGS';
  
  // Render rows
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    totalQty += item.quantity || 0;
    totalCartons += item.cartons || 0;
    if (item.unit) lastUnit = item.unit;
    
    doc.fillColor('#000000');
    doc.font('Helvetica').fontSize(8);
    doc.text(String(i + 1), cols[0], rowY + 5, { width: cols[1]-cols[0], align: 'center' });
    doc.font('Helvetica-Bold').text(item.description || '', cols[1] + 4, rowY + 5, { width: cols[2]-cols[1]-6, align: 'left' });
    doc.font('Helvetica').text(item.hsn_sac || '', cols[2], rowY + 5, { width: cols[3]-cols[2], align: 'center' });
    doc.text(item.lot_no || '', cols[3], rowY + 5, { width: cols[4]-cols[3], align: 'center' });
    doc.text(item.grade || '', cols[4], rowY + 5, { width: cols[5]-cols[4], align: 'center' });
    doc.text(String(item.cartons || 0), cols[5], rowY + 5, { width: cols[6]-cols[5], align: 'center' });
    doc.text((item.quantity || 0).toFixed(3), cols[6], rowY + 5, { width: cols[7]-cols[6], align: 'center' });
    doc.text(item.unit || 'KGS', cols[7], rowY + 5, { width: cols[8]-cols[7], align: 'center' });
    doc.text((item.unit_price || 0).toFixed(2), cols[8] - 2, rowY + 5, { width: cols[9]-cols[8], align: 'right' });
    doc.font('Helvetica-Bold').text((item.taxable_amount || 0).toFixed(2), cols[9] - 4, rowY + 5, { width: cols[10]-cols[9], align: 'right' });
    
    doc.moveTo(40, rowY + 18).lineTo(40 + W, rowY + 18).stroke('#000000');
    rowY += 18;
  }
  
  // Draw vertical grid lines
  var tableBottomY = tableTop + tableHeight - 18; // 546
  doc.rect(40, tableTop, W, tableHeight).stroke('#000000');
  for (var c = 1; c < cols.length; c++) {
    doc.moveTo(cols[c], tableTop).lineTo(cols[c], tableBottomY).stroke('#000000');
  }

  // Table Footer
  doc.rect(40, tableBottomY, W, 18).fillAndStroke('#f9f9f9', '#000000');
  doc.fillColor('#000000').font('Helvetica-Bold').fontSize(8.5);
  doc.text('Total ....', 48, tableBottomY + 5);
  doc.text(String(totalCartons), cols[5], tableBottomY + 5, { width: cols[6]-cols[5], align: 'center' });
  doc.text(totalQty.toFixed(3), cols[6], tableBottomY + 5, { width: cols[7]-cols[6], align: 'center' });
  doc.text(lastUnit, cols[7], tableBottomY + 5, { width: cols[8]-cols[7], align: 'center' });
  doc.text(Number(bill.subtotal || 0).toFixed(2), cols[9] - 4, tableBottomY + 5, { width: cols[10]-cols[9], align: 'right' });

  // 9. Below Table Message & Net Rate bar (564 to 579)
  var messageY = 564;
  doc.rect(40, messageY, W, 15).fillAndStroke('#ffffff', '#000000');
  doc.fillColor('red').font('Helvetica-Bold').fontSize(7.5).text('NO RESPONSIBILITY FOR ANY DEFECT IN YARN AFTER DYEING & WEAVING &PROCESSING.', 46, messageY + 4);
  
  var netRate = totalQty > 0 ? (bill.grand_total / totalQty) : 0;
  doc.fillColor('#0f3080').font('Helvetica-Bold').fontSize(8.5).text('Net Rate : ' + netRate.toFixed(2), 40, messageY + 3, { align: 'right', width: W - 8 });

  // 10. Bottom Section (579 to 802)
  var bottomY = 579;
  var bottomHeight = 223;
  var bottomSplitX = 365;
  doc.moveTo(bottomSplitX, bottomY).lineTo(bottomSplitX, bottomY + bottomHeight).stroke('#000000');

  // Left Column
  // E-Invoice box
  doc.rect(46, bottomY + 6, 310, 60).stroke('#000000');
  doc.fillColor('red').font('Helvetica-Bold').fontSize(8).text("A/C PAYEE'S RTGS-NEFT-IMPS ONLY.", 52, bottomY + 10);
  doc.fillColor('#000000').font('Helvetica-Bold').fontSize(7.5);
  doc.text('Company Name: ', 52, bottomY + 22); doc.font('Helvetica').text(bill.company_name || '—', 120, bottomY + 22);
  doc.font('Helvetica-Bold').text('Company Bill No: ', 200, bottomY + 22); doc.font('Helvetica').text(bill.company_bill_no || '—', 275, bottomY + 22);
  doc.font('Helvetica-Bold').text('Ack No: ', 52, bottomY + 34); doc.font('Helvetica').text(bill.ack_no || '—', 90, bottomY + 34);
  doc.font('Helvetica-Bold').text('Ack Dt: ', 200, bottomY + 34); doc.font('Helvetica').text(bill.ack_dt ? DateUtils_toDisplay(bill.ack_dt) : '—', 238, bottomY + 34);
  doc.font('Helvetica-Bold').text('IRN No: ', 52, bottomY + 46); doc.font('Helvetica').fontSize(6.5).text(bill.irn_no || '—', 90, bottomY + 46, { width: 255 });

  // Net payable words
  var AmountToWords = require('../gst/amount-to-words');
  doc.fillColor('#000000').font('Helvetica-Bold').fontSize(8.5).text('IN WORDS : ' + AmountToWords.toWords(bill.grand_total).toUpperCase(), 46, bottomY + 72, { width: 310 });
  doc.moveTo(46, bottomY + 86).lineTo(bottomSplitX - 8, bottomY + 86).stroke('#000000');

  // Bank details
  doc.font('Helvetica-Bold').fontSize(8.5).text('Bank Details', 48, bottomY + 92);
  doc.font('Helvetica').fontSize(8);
  doc.text('Bank : ' + (s.bank_name || '—'), 48, bottomY + 102);
  doc.text('A/c No : ' + (s.bank_account || '—'), 48, bottomY + 112);
  doc.text('IFSC : ' + (s.bank_ifsc || '—'), 48, bottomY + 122);
  doc.text('Branch : ' + (s.bank_branch || '—'), 48, bottomY + 132);

  // UPI QR Code
  if (s.upi_id) {
    try {
      var upiStr = 'upi://pay?pa=' + encodeURIComponent(s.upi_id) +
                   '&pn=' + encodeURIComponent(s.business_name || 'Business') +
                   '&am=' + bill.grand_total.toFixed(2) +
                   '&cu=INR';
      var qr = QRCode.create(upiStr, { errorCorrectionLevel: 'M' });
      var modules = qr.modules.data;
      var size = qr.modules.size;
      var qrBoxSize = 55;
      var qrX = 285;
      var qrY = bottomY + 90;
      var cellSize = qrBoxSize / size;
      doc.save();
      doc.fillColor('#000000');
      for (var y = 0; y < size; y++) {
        for (var x = 0; x < size; x++) {
          if (modules[y * size + x]) {
            doc.rect(qrX + x * cellSize, qrY + y * cellSize, cellSize + 0.1, cellSize + 0.1).fill();
          }
        }
      }
      doc.restore();
      doc.fontSize(6).font('Helvetica-Bold').text('UPI ID: ' + s.upi_id, 260, bottomY + 148, { align: 'center', width: 95 });
    } catch (e) {
      console.error("UPI QR Code render failed in PDF:", e);
    }
  }

  // Terms and conditions
  doc.moveTo(46, bottomY + 158).lineTo(bottomSplitX - 8, bottomY + 158).stroke('#000000');
  doc.fillColor('#000000').font('Helvetica-Bold').fontSize(7.5).text('Terms and Conditions :', 46, bottomY + 162);
  var termsText = bill.terms || "1) The goods are dispatched on your account and at your risk & responsibility\n2) Any complaint regarding goods should be reported in writing within- 24 hours of the receipt of the goods.\n3) Goods sold will not be taken back.\n4) Late payment 2.0% per month charges on account not paid within due course.\n5) No working guarantee after 30 days from the date of delivery.";
  doc.font('Helvetica').fontSize(6.5).text(termsText, 46, bottomY + 171, { width: 310, lineGap: 1 });

  // Receiver sign
  doc.moveTo(48, bottomY + 210).lineTo(150, bottomY + 210).stroke('#999999');
  doc.font('Helvetica').fontSize(8).text("Receiver's Sign", 48, bottomY + 213, { width: 102, align: 'center' });

  // Right Column
  // Totals list
  var rightRows = [];
  rightRows.push({ label: 'Sub Total ....', value: bill.subtotal || 0 });
  if ((bill.total_discount || 0) > 0) {
    rightRows.push({ label: 'Discount (-)', value: -bill.total_discount });
  }
  var mainGstRate = (items.length > 0) ? (items[0].gst_rate || 0) : 0;
  if (bill.supply_type === 'intrastate') {
    rightRows.push({ label: 'CGST (+)  ' + (mainGstRate/2).toFixed(2) + '%', value: bill.total_cgst || 0 });
    rightRows.push({ label: 'SGST (+)  ' + (mainGstRate/2).toFixed(2) + '%', value: bill.total_sgst || 0 });
  } else {
    rightRows.push({ label: 'IGST (+)  ' + mainGstRate.toFixed(2) + '%', value: bill.total_igst || 0 });
  }
  rightRows.push({ label: 'Round off', value: bill.round_off || 0 });
  
  var startTotalsY = bottomY + 6;
  var stepY = 12;
  for (var j = 0; j < rightRows.length; j++) {
    var rItem = rightRows[j];
    doc.font('Helvetica').fontSize(8).fillColor('#000000');
    doc.text(rItem.label, bottomSplitX + 8, startTotalsY + j * stepY);
    var valStr = Number(rItem.value).toFixed(2);
    if (rItem.label.indexOf('Discount') !== -1) valStr = '-' + Math.abs(rItem.value).toFixed(2);
    doc.text(valStr, bottomSplitX + 8, startTotalsY + j * stepY, { align: 'right', width: W - (bottomSplitX - 40) - 16 });
  }
  
  var grandY = startTotalsY + rightRows.length * stepY + 3;
  doc.moveTo(bottomSplitX, grandY).lineTo(40 + W, grandY).stroke('#000000');
  
  doc.fillColor('#0f3080').font('Helvetica-Bold').fontSize(11);
  doc.text('Net Amount :', bottomSplitX + 8, grandY + 4);
  doc.text(Number(bill.grand_total || 0).toFixed(2), bottomSplitX + 8, grandY + 4, { align: 'right', width: W - (bottomSplitX - 40) - 16 });

  // Payment Grid Box
  var gridY = grandY + 20;
  doc.rect(bottomSplitX + 8, gridY, W - (bottomSplitX - 40) - 16, 60).stroke('#000000');
  for (var r = 1; r < 5; r++) { 
    doc.moveTo(bottomSplitX + 8, gridY + r * 12).lineTo(40 + W - 8, gridY + r * 12).stroke('#000000'); 
  }
  doc.moveTo(bottomSplitX + 63, gridY).lineTo(bottomSplitX + 63, gridY + 60).stroke('#000000');
  
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#000000');
  doc.text('Date', bottomSplitX + 12, gridY + 2.5);
  doc.text('NEFT-RTGS', bottomSplitX + 12, gridY + 14.5);
  doc.text('Amt', bottomSplitX + 12, gridY + 26.5);
  doc.text('Bank', bottomSplitX + 12, gridY + 38.5);
  doc.text('Bill No.', bottomSplitX + 12, gridY + 50.5);

  // Seller signature
  doc.fillColor('red').font('Helvetica-Bold').fontSize(9);
  doc.text('For, ' + (s.business_name || 'SUTARIYA YARN').toUpperCase(), bottomSplitX, gridY + 66, { align: 'center', width: W - (bottomSplitX - 40) });
  
  if (s.signature_data) {
    try {
      var sigBuffer = Buffer.from(s.signature_data.replace(/^data:image\/\w+;base64,/, ""), 'base64');
      doc.image(sigBuffer, bottomSplitX + (W - (bottomSplitX - 40) - 60)/2, gridY + 77, { height: 28 });
    } catch (e) {
      console.error("Failed to render signature in PDF:", e);
    }
  }
  
  var sigLineY = bottomY + bottomHeight - 16;
  doc.moveTo(bottomSplitX + 10, sigLineY).lineTo(40 + W - 10, sigLineY).stroke('#000000');
  doc.fillColor('#000000').font('Helvetica-Bold').fontSize(8.5);
  doc.text('Authorised Signatory', bottomSplitX, sigLineY + 4, { align: 'center', width: W - (bottomSplitX - 40) });
}

function generateBillPDF(data) {
  return new Promise(function(resolve, reject) {
    var bill     = data.bill;
    var items    = data.items    || [];
    var customer = data.customer || {};
    var s        = data.settings || {};

    var doc      = new PDFDocument({ size: 'A4', margin: 40 });
    var buffers  = [];

    doc.on('data',  function(chunk) { buffers.push(chunk); });
    doc.on('end',   function()      { resolve(Buffer.concat(buffers)); });
    doc.on('error', function(e)     { reject(e); });

    var W = 515;

    try {
      generateBoxyPDF(doc, bill, items, customer, s, W);
    } catch (err) {
      reject(err);
      return;
    }

    doc.end();
  });
}

module.exports = { generateBillPDF: generateBillPDF };
