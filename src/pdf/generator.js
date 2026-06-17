var PDFDocument = require('pdfkit');
var fs          = require('fs');

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

    if (s.logo_path && fs.existsSync(s.logo_path)) {
      doc.image(s.logo_path, 40, 40, { height: 50 });
      doc.moveDown();
    }
    doc.fontSize(18).font('Helvetica-Bold').text(s.business_name || 'My Business', 40, 40);
    doc.fontSize(9).font('Helvetica')
       .text('GSTIN: ' + (s.gstin || ''))
       .text((s.business_address || '') + ', ' + (s.business_city || '') + ' - ' + (s.business_pin || ''));

    doc.moveDown(0.5);
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#1A56DB')
       .text('TAX INVOICE', { align: 'center' });
    doc.fillColor('#000000');

    var infoY = doc.y + 10;
    doc.fontSize(9).font('Helvetica-Bold').text('Bill No: ', 40, infoY, { continued: true });
    doc.font('Helvetica').text(bill.bill_number || '');
    doc.font('Helvetica-Bold').text('Bill Date: ', 40, { continued: true });
    doc.font('Helvetica').text(bill.bill_date || '');
    if (bill.due_date) {
      doc.font('Helvetica-Bold').text('Due Date: ', 40, { continued: true });
      doc.font('Helvetica').text(bill.due_date);
    }

    doc.fontSize(9).font('Helvetica-Bold').text('Bill To:', 300, infoY);
    doc.font('Helvetica').text(customer.name || '')
       .text(customer.billing_address || '')
       .text((customer.billing_city || '') + ' ' + (customer.billing_pin || ''));
    if (customer.gstin) {
      doc.font('Helvetica-Bold').text('GSTIN: ', { continued: true });
      doc.font('Helvetica').text(customer.gstin);
    }

    doc.moveDown();
    var tableTop = doc.y;
    var cols     = [40, 170, 215, 255, 295, 345, 395, 445, 515];
    var headers  = ['#','Description','HSN','Qty','Rate','Disc%','Taxable','Tax','Total'];

    doc.rect(40, tableTop, W, 18).fill('#1A56DB');
    doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
    for (var h = 0; h < headers.length; h++) {
      doc.text(headers[h], cols[h] + 2, tableTop + 4, { width: cols[h+1] - cols[h] - 4 });
    }
    doc.fillColor('#000000').font('Helvetica');

    var rowY = tableTop + 20;
    for (var i = 0; i < items.length; i++) {
      var item    = items[i];
      var taxAmt  = (item.cgst_amount||0) + (item.sgst_amount||0) + (item.igst_amount||0);
      var rowData = [
        String(i + 1),
        item.description || '',
        item.hsn_sac     || '',
        String(item.quantity || 0),
        String(item.unit_price || 0),
        String(item.discount_percent || 0) + '%',
        String(item.taxable_amount || 0),
        String(taxAmt.toFixed(2)),
        String(item.line_total || 0)
      ];

      if (i % 2 === 0) {
        doc.rect(40, rowY - 2, W, 16).fill('#F9FAFB').stroke('#E5E7EB');
      }
      doc.fillColor('#000000').fontSize(8);
      for (var c = 0; c < rowData.length; c++) {
        doc.text(rowData[c], cols[c] + 2, rowY, { width: cols[c+1] - cols[c] - 4 });
      }
      rowY += 18;
    }

    doc.moveDown();
    var totalsX = 350;
    function totalLine(label, value) {
      doc.fontSize(9).font('Helvetica-Bold')
         .text(label + ':', totalsX, doc.y, { continued: true, width: 100 });
      doc.font('Helvetica').text('\u20B9' + Number(value).toFixed(2),
                                 { align: 'right', width: 100 });
    }
    totalLine('Subtotal',     bill.subtotal      || 0);
    if ((bill.total_discount||0) > 0) totalLine('Discount', bill.total_discount);
    totalLine('Taxable',      bill.total_taxable  || 0);
    if ((bill.total_cgst||0) > 0)   totalLine('CGST',    bill.total_cgst);
    if ((bill.total_sgst||0) > 0)   totalLine('SGST',    bill.total_sgst);
    if ((bill.total_igst||0) > 0)   totalLine('IGST',    bill.total_igst);
    if ((bill.round_off||0) !== 0)  totalLine('Round Off', bill.round_off);

    doc.fontSize(11).font('Helvetica-Bold')
       .text('Grand Total: \u20B9' + Number(bill.grand_total).toFixed(2),
             totalsX, doc.y, { align: 'right', width: 165 });

    var AmountToWords = require('../gst/amount-to-words');
    doc.moveDown(0.3).fontSize(8).font('Helvetica-Oblique')
       .text(AmountToWords.toWords(bill.grand_total), 40);

    if (s.bank_name) {
      doc.moveDown().fontSize(9).font('Helvetica-Bold').text('Bank Details:');
      doc.font('Helvetica')
         .text('Bank: ' + s.bank_name)
         .text('Account: ' + (s.bank_account || ''))
         .text('IFSC: ' + (s.bank_ifsc || ''));
    }

    if (bill.notes) {
      doc.moveDown().fontSize(9).font('Helvetica-Bold').text('Notes:');
      doc.font('Helvetica').text(bill.notes);
    }
    if (bill.terms) {
      doc.moveDown(0.5).fontSize(8).font('Helvetica-Oblique').text(bill.terms);
    }

    doc.fontSize(8).font('Helvetica').fillColor('#6B7280')
       .text(s.footer_text || 'Thank you for your business.',
             40, doc.page.height - 50, { align: 'center', width: W });

    doc.end();
  });
}

module.exports = { generateBillPDF: generateBillPDF };
