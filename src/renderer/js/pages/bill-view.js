window.PageControllers = window.PageControllers || {};
window.PageControllers['bill-view'] = {
  _billId: null,
  _data: null,
  _settings: null,
  
  init: function(params) {
    var self = this;
    self._billId = params && params.billId;
    
    if (!self._billId) {
      Toast.show('No Bill ID provided', 'error');
      window.loadPage('bills-list');
      return;
    }
    
    // Bind buttons
    var backBtn = document.getElementById('btn-back');
    if (backBtn) {
      backBtn.addEventListener('click', function() {
        window.loadPage('bills-list');
      });
    }
    
    var printBtn = document.getElementById('btn-print');
    if (printBtn) {
      printBtn.addEventListener('click', function() {
        window.print();
      });
    }
    
    var downloadBtn = document.getElementById('btn-download-pdf');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', function() {
        self.downloadPDF();
      });
    }

    var sendWhatsAppBtn = document.getElementById('btn-send-whatsapp');
    if (sendWhatsAppBtn) {
      sendWhatsAppBtn.addEventListener('click', function() {
        self.sendBill(['whatsapp']);
      });
    }

    var printSendBtn = document.getElementById('btn-print-send');
    if (printSendBtn) {
      printSendBtn.addEventListener('click', function() {
        self.sendBill(['email', 'whatsapp'], true);
      });
    }

    var reminderBtn = document.getElementById('btn-send-reminder');
    if (reminderBtn) {
      reminderBtn.addEventListener('click', function() {
        self.triggerPaymentReminder();
      });
    }
    
    // Load data
    Promise.all([
      window.api.getBillWithItems(self._billId),
      window.api.getAllSettings()
    ]).then(function(results) {
      self._data = results[0];
      self._settings = results[1];
      
      self.renderInvoice();

      if (params && params.print) {
        setTimeout(function() {
          window.print();
        }, 500);
      }
    }).catch(function(err) {
      Toast.show('Failed to load invoice details: ' + err.message, 'error');
      window.loadPage('bills-list');
    });
  },
  
  renderInvoice: function() {
    var self = this;
    var b = self._data.bill;
    var items = self._data.items || [];
    var cust = self._data.customer;
    var s = self._settings || {};
    
    // Show/hide Send Reminder button based on status
    var reminderBtn = document.getElementById('btn-send-reminder');
    if (reminderBtn) {
      if (b.status === 'sent' || b.status === 'overdue') {
        reminderBtn.style.display = 'inline-block';
      } else {
        reminderBtn.style.display = 'none';
      }
    }
    
    // Business details
    document.getElementById('biz-name').textContent = s.business_name || 'My Business';
    
    var bizAddr = [s.business_address, s.business_city, s.business_pin].filter(Boolean).join(', ');
    document.getElementById('biz-address').textContent = bizAddr || 'Address not configured';
    document.getElementById('biz-gstin').textContent = s.gstin || '—';
    
    // Bill details
    document.getElementById('inv-number').textContent = b.bill_number;
    document.getElementById('inv-date').textContent = DateUtils.toDisplay(b.bill_date);
    document.getElementById('inv-due-date').textContent = b.due_date ? DateUtils.toDisplay(b.due_date) : '—';
    
    // Customer details
    document.getElementById('cust-name').textContent = cust ? cust.name : 'Walk-in Customer';
    
    var custAddr = cust ? cust.address : '';
    document.getElementById('cust-address').textContent = custAddr || '';
    
    var custContact = [];
    if (cust && cust.phone) custContact.push('Phone: ' + cust.phone);
    if (cust && cust.email) custContact.push('Email: ' + cust.email);
    document.getElementById('cust-contact').textContent = custContact.join(' | ') || '—';
    document.getElementById('cust-gstin').textContent = (cust && cust.gstin) ? cust.gstin : '—';
    
    // Place of Supply & Supply Type
    var stateDisplay = '—';
    if (cust && cust.state) {
      stateDisplay = cust.state + (cust.state_code ? ' (' + cust.state_code + ')' : '');
    }
    document.getElementById('place-of-supply').textContent = stateDisplay;
    document.getElementById('supply-type').textContent = b.supply_type === 'intrastate' ? 'Intrastate (CGST + SGST)' : 'Interstate (IGST)';
    
    // Items Table
    var tbody = document.getElementById('items-tbody');
    tbody.innerHTML = '';
    
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var tr = document.createElement('tr');
      
      var taxesLabel = '—';
      if (b.supply_type === 'intrastate') {
        var cgst = item.cgst_amount || 0;
        var sgst = item.sgst_amount || 0;
        taxesLabel = 'C: ' + cgst.toFixed(2) + '<br>S: ' + sgst.toFixed(2);
      } else {
        var igst = item.igst_amount || 0;
        taxesLabel = 'I: ' + igst.toFixed(2);
      }
      
      tr.innerHTML = 
        '<td style="text-align: center;">' + (i + 1) + '</td>' +
        '<td style="font-weight: 500;">' + item.description + '</td>' +
        '<td style="text-align: center;">' + (item.hsn_sac || '—') + '</td>' +
        '<td style="text-align: center;">' + item.quantity + ' ' + (item.unit || 'Nos') + '</td>' +
        '<td style="text-align: right;">' + item.unit_price.toFixed(2) + '</td>' +
        '<td style="text-align: right;">' + (item.discount_percent || 0) + '%</td>' +
        '<td style="text-align: right;">' + item.taxable_amount.toFixed(2) + '</td>' +
        '<td style="text-align: center;">' + (item.gst_rate || 0) + '%</td>' +
        '<td style="text-align: right; font-size: 11px; line-height: 1.2;">' + taxesLabel + '</td>' +
        '<td style="text-align: right; font-weight: 600;">' + item.line_total.toFixed(2) + '</td>';
      tbody.appendChild(tr);
    }
    
    // Summary
    document.getElementById('total-subtotal').textContent = FormatCurrency.toRupees(b.subtotal || 0);
    
    if (b.total_discount > 0) {
      document.getElementById('row-discount').style.display = '';
      document.getElementById('total-discount').textContent = '-' + FormatCurrency.toRupees(b.total_discount);
    } else {
      document.getElementById('row-discount').style.display = 'none';
    }
    
    document.getElementById('total-taxable').textContent = FormatCurrency.toRupees(b.total_taxable || 0);
    
    if (b.supply_type === 'intrastate') {
      document.getElementById('row-cgst').style.display = '';
      document.getElementById('row-sgst').style.display = '';
      document.getElementById('row-igst').style.display = 'none';
      document.getElementById('total-cgst').textContent = FormatCurrency.toRupees(b.total_cgst || 0);
      document.getElementById('total-sgst').textContent = FormatCurrency.toRupees(b.total_sgst || 0);
    } else {
      document.getElementById('row-cgst').style.display = 'none';
      document.getElementById('row-sgst').style.display = 'none';
      document.getElementById('row-igst').style.display = '';
      document.getElementById('total-igst').textContent = FormatCurrency.toRupees(b.total_igst || 0);
    }
    
    document.getElementById('total-roundoff').textContent = FormatCurrency.toRupees(b.round_off || 0);
    document.getElementById('total-grand').textContent = FormatCurrency.toRupees(b.grand_total || 0);
    document.getElementById('amount-words').textContent = AmountToWords.toWords(b.grand_total || 0);
    
    // Notes & Terms
    if (b.notes) {
      document.getElementById('notes-container').style.display = 'block';
      document.getElementById('inv-notes').textContent = b.notes;
    } else {
      document.getElementById('notes-container').style.display = 'none';
    }
    
    if (b.terms) {
      document.getElementById('terms-container').style.display = 'block';
      document.getElementById('inv-terms').textContent = b.terms;
    } else {
      document.getElementById('terms-container').style.display = 'none';
    }
    
    // Bank details
    if (s.bank_name || s.bank_account || s.bank_ifsc) {
      var bankStr = [
        s.bank_name ? 'Bank: ' + s.bank_name : '',
        s.bank_account ? 'A/C: ' + s.bank_account : '',
        s.bank_ifsc ? 'IFSC: ' + s.bank_ifsc : ''
      ].filter(Boolean).join(' | ');
      document.getElementById('bank-container').style.display = 'block';
      document.getElementById('bank-details').textContent = bankStr;
    } else {
      document.getElementById('bank-container').style.display = 'none';
    }
  },
  
  downloadPDF: function() {
    var self = this;
    var b = self._data.bill;
    
    Toast.show('Generating PDF...', 'info');
    
    window.api.generatePDF({
      bill: b,
      items: self._data.items,
      customer: self._data.customer,
      settings: self._settings
    }).then(function(pdfBuffer) {
      var blob = new Blob([pdfBuffer], { type: 'application/pdf' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'Invoice_' + b.bill_number + '.pdf';
      a.click();
      URL.revokeObjectURL(url);
      Toast.show('PDF downloaded successfully', 'success');
    }).catch(function(err) {
      Toast.show('Failed to generate PDF: ' + err.message, 'error');
    });
  },

  sendBill: function(channels, triggerPrint) {
    var self = this;
    if (!self._data || !self._data.bill) {
      return Toast.show('Invoice data not loaded yet', 'warning');
    }
    
    Toast.show('Generating PDF & sending...', 'info');
    
    window.api.generatePDF({
      bill: self._data.bill,
      items: self._data.items,
      customer: self._data.customer,
      settings: self._settings
    }).then(function(pdfBuffer) {
      var binary = '';
      var bytes = new Uint8Array(pdfBuffer);
      var len = bytes.byteLength;
      for (var i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      var pdfBase64 = window.btoa(binary);

      var b = self._data.bill;
      var taxRecord = {
        bill_date:           b.bill_date,
        bill_number:         b.bill_number,
        customer_name:       self._data.customer ? self._data.customer.name : 'Walk-in Customer',
        customer_gstin:      self._data.customer ? self._data.customer.gstin : '',
        customer_state:      self._data.customer ? self._data.customer.state : '',
        customer_state_code: self._data.customer ? self._data.customer.state_code : '',
        total_taxable:       b.total_taxable,
        total_cgst:          b.total_cgst,
        total_sgst:          b.total_sgst,
        total_igst:          b.total_igst,
        total_tax:           (b.total_cgst||0) + (b.total_sgst||0) + (b.total_igst||0),
        grand_total:         b.grand_total,
        rate_wise_breakdown: [],
        hsn_wise_breakdown:  []
      };

      return window.api.billSent(b, self._data.customer, self._data.items, taxRecord, pdfBase64, channels).then(function() {
        Toast.show('Bill sent successfully!', 'success');
        if (triggerPrint) {
          window.print();
        }
      });
    }).catch(function(err) {
      Toast.show('Failed to send bill: ' + err.message, 'error');
    });
  },

  triggerPaymentReminder: function() {
    var self = this;
    if (!self._data || !self._data.bill) {
      return Toast.show('Invoice data not loaded yet', 'warning');
    }
    
    var billNumber = self._data.bill.bill_number;
    
    // Create custom overlay
    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    
    var box = document.createElement('div');
    box.className = 'modal-box';
    box.style.maxWidth = '400px';
    
    var title = document.createElement('h3');
    title.textContent = 'Send Payment Reminder';
    title.style.marginBottom = '12px';
    title.style.fontFamily = 'var(--font-serif)';
    box.appendChild(title);
    
    var msg = document.createElement('p');
    msg.textContent = 'Choose delivery channels to send the payment reminder for bill ' + billNumber + ':';
    msg.style.marginBottom = '20px';
    msg.style.fontSize = '13px';
    box.appendChild(msg);
    
    var btnWA = document.createElement('button');
    btnWA.className = 'btn btn-primary';
    btnWA.textContent = 'WhatsApp Only';
    btnWA.style.backgroundColor = '#25D366';
    btnWA.style.border = 'none';
    btnWA.style.marginRight = '8px';
    btnWA.onclick = function() {
      document.body.removeChild(overlay);
      self.sendReminder(['whatsapp']);
    };
    box.appendChild(btnWA);
    
    var btnBoth = document.createElement('button');
    btnBoth.className = 'btn btn-primary';
    btnBoth.textContent = 'Email & WhatsApp';
    btnBoth.style.marginRight = '8px';
    btnBoth.onclick = function() {
      document.body.removeChild(overlay);
      self.sendReminder(['email', 'whatsapp']);
    };
    box.appendChild(btnBoth);
    
    var btnCancel = document.createElement('button');
    btnCancel.className = 'btn';
    btnCancel.textContent = 'Cancel';
    btnCancel.onclick = function() {
      document.body.removeChild(overlay);
    };
    box.appendChild(btnCancel);
    
    overlay.appendChild(box);
    document.body.appendChild(overlay);
  },

  sendReminder: function(channels) {
    var self = this;
    if (!self._data || !self._data.bill) {
      return Toast.show('Invoice data not loaded yet', 'warning');
    }
    
    Toast.show('Generating Invoice PDF...', 'info');
    
    window.api.generatePDF({
      bill: self._data.bill,
      items: self._data.items,
      customer: self._data.customer,
      settings: self._settings
    }).then(function(pdfBuffer) {
      var binary = '';
      var bytes = new Uint8Array(pdfBuffer);
      var len = bytes.byteLength;
      for (var i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      var pdfBase64 = window.btoa(binary);
      
      var b = self._data.bill;
      var taxRecord = {
        bill_date:           b.bill_date,
        bill_number:         b.bill_number,
        customer_name:       self._data.customer ? self._data.customer.name : 'Walk-in Customer',
        customer_gstin:      self._data.customer ? self._data.customer.gstin : '',
        customer_state:      self._data.customer ? self._data.customer.state : '',
        customer_state_code: self._data.customer ? self._data.customer.state_code : '',
        total_taxable:       b.total_taxable,
        total_cgst:          b.total_cgst,
        total_sgst:          b.total_sgst,
        total_igst:          b.total_igst,
        total_tax:           (b.total_cgst||0) + (b.total_sgst||0) + (b.total_igst||0),
        grand_total:         b.grand_total,
        rate_wise_breakdown: [],
        hsn_wise_breakdown:  []
      };

      Toast.show('Triggering payment reminder via n8n...', 'info');
      return window.api.paymentReminder(
        b,
        self._data.customer,
        self._data.items,
        taxRecord,
        pdfBase64,
        channels
      );
    }).then(function() {
      Toast.show('Payment reminder sent successfully!', 'success');
    }).catch(function(err) {
      console.error(err);
      Toast.show('Failed to send reminder: ' + err.message, 'error');
    });
  }
};
