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
    
    // Load data
    Promise.all([
      window.api.getBillWithItems(self._billId),
      window.api.getAllSettings()
    ]).then(function(results) {
      self._data = results[0];
      self._settings = results[1];
      
      self.renderInvoice();
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
  }
};
