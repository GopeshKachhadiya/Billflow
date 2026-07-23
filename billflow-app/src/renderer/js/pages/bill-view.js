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

    // Business Profile
    document.getElementById('biz-name').textContent = s.business_name || 'Your Business Name';
    
    var bizAddr = [s.business_address, s.business_city, s.business_pin].filter(Boolean).join(', ');
    document.getElementById('biz-address').textContent = bizAddr || 'Address not configured';
    
    var contactParts = [];
    if (s.business_phone) contactParts.push('MO : ' + s.business_phone);
    if (s.business_email) contactParts.push(s.business_email);
    document.getElementById('biz-contact').textContent = contactParts.join(' | ') || '—';
    
    // GSTIN & PAN & State
    document.getElementById('biz-gstin').textContent = s.gstin || '—';
    document.getElementById('biz-pan').textContent = s.pan || '—';
    var bizStateSpan = document.getElementById('biz-state');
    if (bizStateSpan) {
      bizStateSpan.textContent = s.business_state || '24 GUJARAT';
    }
    
    // Logo
    var logoImg = document.getElementById('logo');
    if (logoImg) {
      if (s.logo_data) {
        logoImg.src = s.logo_data;
        logoImg.style.display = 'block';
      } else {
        logoImg.style.display = 'none';
      }
    }
    
    // Invoice Details & Order Details
    document.getElementById('inv-number').textContent = b.bill_number;
    document.getElementById('inv-date').textContent = DateUtils.toDisplay(b.bill_date);
    document.getElementById('inv-due-date').textContent = b.due_date ? DateUtils.toDisplay(b.due_date) : '—';
    
    var setElText = function(id, val) { var el = document.getElementById(id); if (el) el.textContent = val || '—'; };
    setElText('inv-order-no', b.order_number);
    setElText('inv-order-date', b.order_date ? DateUtils.toDisplay(b.order_date) : '—');
    setElText('inv-due-days', b.due_days);
    setElText('inv-party-name', b.party_name);
    setElText('inv-party-phone', b.party_phone);

    // Billed To Details
    document.getElementById('cust-name').textContent = cust ? cust.name : 'Walk-in Customer';
    document.getElementById('cust-address').textContent = cust ? cust.address : '';
    var custPhoneSpan = document.getElementById('cust-phone');
    if (custPhoneSpan) {
      custPhoneSpan.textContent = (cust && cust.phone) ? 'Mo: ' + cust.phone : 'Mo: —';
    }
    document.getElementById('cust-gstin').textContent = (cust && cust.gstin) ? cust.gstin : '—';
    
    var stateDisplay = '—';
    if (cust && cust.state) {
      stateDisplay = cust.state + (cust.state_code ? ' (' + cust.state_code + ')' : '');
    }
    var custStateEl = document.getElementById('cust-state');
    if (custStateEl) {
      custStateEl.textContent = stateDisplay;
    }

    // Consignee Details (Default to customer details if not specified)
    setElText('consignee-name', b.consignee_name || (cust ? cust.name : 'Walk-in Customer'));
    setElText('consignee-address', b.consignee_address || (cust ? cust.address : ''));
    setElText('consignee-gstin', b.consignee_gstin || (cust ? cust.gstin : '—'));
    
    var consigneeStateDisplay = '—';
    if (b.consignee_state) {
      consigneeStateDisplay = b.consignee_state;
    } else if (cust && cust.state) {
      consigneeStateDisplay = cust.state + (cust.state_code ? ' (' + cust.state_code + ')' : '');
    }
    setElText('consignee-state', consigneeStateDisplay);

    // Transporter Details
    setElText('transporter-val', b.transporter);
    setElText('transporter-gst-val', b.transporter_gst);
    setElText('lr-number-val', b.lr_number);
    setElText('lr-date-val', b.lr_date ? DateUtils.toDisplay(b.lr_date) : '—');
    setElText('vehicle-number-val', b.vehicle_number);

    // E-Invoice Reference details
    setElText('company-name-val', b.company_name);
    setElText('company-bill-no-val', b.company_bill_no);
    setElText('ack-no-val', b.ack_no);
    setElText('ack-dt-val', b.ack_dt ? DateUtils.toDisplay(b.ack_dt) : '—');
    setElText('irn-no-val', b.irn_no || b.irn_number);

    // Table Body
    var tbody = document.getElementById('items-tbody');
    tbody.innerHTML = '';
    
    var totalQty = 0;
    var totalCartons = 0;
    var lastUnit = 'KGS';
    
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var tr = document.createElement('tr');
      tr.style.height = '24px';
      tr.style.borderBottom = '1px solid #000';
      
      totalQty += item.quantity || 0;
      totalCartons += item.cartons || 0;
      if (item.unit) lastUnit = item.unit;
      
      tr.innerHTML = 
        '<td style="border-right: 1px solid #000; padding: 5px; text-align: center; width: 35px;">' + (i + 1) + '</td>' +
        '<td style="border-right: 1px solid #000; padding: 5px; text-align: left; font-weight: bold;">' + item.description + '</td>' +
        '<td style="border-right: 1px solid #000; padding: 5px; text-align: center; width: 75px;">' + (item.hsn_sac || '—') + '</td>' +
        '<td style="border-right: 1px solid #000; padding: 5px; text-align: center; width: 95px;">' + (item.lot_no || '—') + '</td>' +
        '<td style="border-right: 1px solid #000; padding: 5px; text-align: center; width: 65px;">' + (item.grade || '—') + '</td>' +
        '<td style="border-right: 1px solid #000; padding: 5px; text-align: center; width: 50px;">' + (item.cartons || 0) + '</td>' +
        '<td style="border-right: 1px solid #000; padding: 5px; text-align: center; width: 80px;">' + (item.quantity || 0).toFixed(3) + '</td>' +
        '<td style="border-right: 1px solid #000; padding: 5px; text-align: center; width: 50px;">' + (item.unit || 'KGS') + '</td>' +
        '<td style="border-right: 1px solid #000; padding: 5px; text-align: right; width: 75px;">' + (item.unit_price || 0).toFixed(2) + '</td>' +
        '<td style="padding: 5px; text-align: right; width: 85px; font-weight: bold;">' + (item.taxable_amount || 0).toFixed(2) + '</td>';
      tbody.appendChild(tr);
    }
    
    // Fill remaining rows if items count is small to keep print layout stable
    var minRows = 8;
    if (items.length < minRows) {
      for (var k = items.length; k < minRows; k++) {
        var trSpacer = document.createElement('tr');
        trSpacer.style.height = '24px';
        trSpacer.style.borderBottom = '1px solid #000';
        trSpacer.innerHTML = 
          '<td style="border-right: 1px solid #000;"></td>' +
          '<td style="border-right: 1px solid #000;"></td>' +
          '<td style="border-right: 1px solid #000;"></td>' +
          '<td style="border-right: 1px solid #000;"></td>' +
          '<td style="border-right: 1px solid #000;"></td>' +
          '<td style="border-right: 1px solid #000;"></td>' +
          '<td style="border-right: 1px solid #000;"></td>' +
          '<td style="border-right: 1px solid #000;"></td>' +
          '<td style="border-right: 1px solid #000;"></td>' +
          '<td></td>';
        tbody.appendChild(trSpacer);
      }
    }
    
    // Update footer total values
    document.getElementById('total-cartons').textContent = totalCartons;
    document.getElementById('total-qty').textContent = totalQty.toFixed(3);
    document.getElementById('total-unit').textContent = lastUnit;
    document.getElementById('total-subtotal').textContent = (b.subtotal || 0).toFixed(2);
    
    // Dynamic Net Rate display
    var netRateVal = totalQty > 0 ? (b.grand_total / totalQty) : 0;
    document.getElementById('net-rate').textContent = netRateVal.toFixed(2);
    
    // Summary & Amounts
    var summarySubtotalEl = document.getElementById('summary-subtotal');
    if (summarySubtotalEl) {
      summarySubtotalEl.textContent = FormatCurrency.toRupees(b.subtotal || 0);
    }
    
    if (b.total_discount > 0) {
      document.getElementById('row-discount').style.display = 'flex';
      document.getElementById('total-discount').textContent = '-' + FormatCurrency.toRupees(b.total_discount);
    } else {
      document.getElementById('row-discount').style.display = 'none';
    }
    
    // Dynamic GST Rate label and values
    var mainGstRate = (items.length > 0) ? (items[0].gst_rate || 0) : 0;
    
    if (b.supply_type === 'intrastate') {
      document.getElementById('row-cgst').style.display = 'flex';
      document.getElementById('row-sgst').style.display = 'flex';
      document.getElementById('row-igst').style.display = 'none';
      
      document.getElementById('total-cgst').textContent = FormatCurrency.toRupees(b.total_cgst || 0);
      document.getElementById('total-sgst').textContent = FormatCurrency.toRupees(b.total_sgst || 0);
      
      var cgstPercentEl = document.getElementById('cgst-rate-percent');
      var sgstPercentEl = document.getElementById('sgst-rate-percent');
      if (cgstPercentEl) cgstPercentEl.textContent = (mainGstRate / 2).toFixed(2);
      if (sgstPercentEl) sgstPercentEl.textContent = (mainGstRate / 2).toFixed(2);
    } else {
      document.getElementById('row-cgst').style.display = 'none';
      document.getElementById('row-sgst').style.display = 'none';
      document.getElementById('row-igst').style.display = 'flex';
      
      document.getElementById('total-igst').textContent = FormatCurrency.toRupees(b.total_igst || 0);
      
      var igstPercentEl = document.getElementById('igst-rate-percent');
      if (igstPercentEl) igstPercentEl.textContent = mainGstRate.toFixed(2);
    }
    
    document.getElementById('total-roundoff').textContent = FormatCurrency.toRupees(b.round_off || 0);
    
    // Set Grand Total (Net payable)
    var grandTotalEls = document.querySelectorAll('#total-grand');
    for (var j = 0; j < grandTotalEls.length; j++) {
      grandTotalEls[j].textContent = FormatCurrency.toRupees(b.grand_total || 0);
    }
    document.getElementById('amount-words').textContent = AmountToWords.toWords(b.grand_total || 0);
    
    // Header Title & Payment Status Stamp
    var docTitleEl = document.getElementById('doc-header-title');
    var statusStampEl = document.getElementById('payment-status-stamp');
    var paidAmount = parseFloat(b.amount_paid) || 0;
    var grandTotal = parseFloat(b.grand_total) || 0;
    var dueAmount = b.amount_due !== undefined ? parseFloat(b.amount_due) : Math.max(0, grandTotal - paidAmount);

    var isFullPaid = b.status === 'paid' || (dueAmount <= 0.01 && grandTotal > 0);
    var isPartialPaid = b.status === 'partial' || (paidAmount > 0 && dueAmount > 0.01);

    if (docTitleEl) {
      if (isFullPaid) {
        docTitleEl.textContent = 'TAX INVOICE / PAID RECEIPT';
      } else if (isPartialPaid) {
        docTitleEl.textContent = 'TAX INVOICE / DOWNPAYMENT RECEIPT';
      } else {
        docTitleEl.textContent = 'TAX INVOICE';
      }
    }

    if (statusStampEl) {
      if (isFullPaid) {
        statusStampEl.textContent = 'PAID';
        statusStampEl.style.backgroundColor = '#d4edda';
        statusStampEl.style.color = '#155724';
        statusStampEl.style.border = '1px solid #c3e6cb';
        statusStampEl.style.display = 'inline-block';
      } else if (isPartialPaid) {
        statusStampEl.textContent = 'DOWNPAYMENT PAID';
        statusStampEl.style.backgroundColor = '#fff3cd';
        statusStampEl.style.color = '#856404';
        statusStampEl.style.border = '1px solid #ffeeba';
        statusStampEl.style.display = 'inline-block';
      } else {
        statusStampEl.textContent = 'UNPAID / DUE';
        statusStampEl.style.backgroundColor = '#f8d7da';
        statusStampEl.style.color = '#721c24';
        statusStampEl.style.border = '1px solid #f5c6cb';
        statusStampEl.style.display = 'inline-block';
      }
    }

    // Set Amount Paid & Balance Due
    setElText('total-paid', FormatCurrency.toRupees(paidAmount));
    setElText('total-due', FormatCurrency.toRupees(dueAmount));

    // Populate NEFT / Payment Grid box
    setElText('pay-grid-date', DateUtils.toDisplay(b.bill_date));
    var payMethodStr = (b.payment_method || '—') + (b.payment_reference ? ' (' + b.payment_reference + ')' : '');
    setElText('pay-grid-method', payMethodStr);
    setElText('pay-grid-amt', FormatCurrency.toRupees(paidAmount));
    setElText('pay-grid-bank', s.bank_name || '—');
    setElText('pay-grid-billno', b.bill_number);

    // Terms
    document.getElementById('inv-terms').textContent = b.terms || '—';
    
    // Bank details
    setElText('bank-name-val', s.bank_name);
    setElText('bank-account-val', s.bank_account);
    setElText('bank-ifsc-val', s.bank_ifsc);
    setElText('bank-branch-val', s.bank_branch);
    setElText('upi-id-val', s.upi_id);
    
    // Signatures
    var sigImg = document.getElementById('signature');
    if (sigImg) {
      if (s.signature_data) {
        sigImg.src = s.signature_data;
        sigImg.style.display = 'block';
      } else {
        sigImg.style.display = 'none';
      }
    }
    
    var sellerLabel = document.getElementById('seller-name-label');
    if (sellerLabel) {
      sellerLabel.textContent = s.business_name || 'Your Business Name';
    }
    
    // UPI QR Code
    var upiContainer = document.getElementById('upi-qrcode');
    upiContainer.innerHTML = '';
    if (s.upi_id && typeof QRCode !== 'undefined') {
      var upiStr = 'upi://pay?pa=' + encodeURIComponent(s.upi_id) +
                   '&pn=' + encodeURIComponent(s.business_name || 'Business') +
                   '&am=' + (dueAmount > 0 ? dueAmount : grandTotal).toFixed(2) +
                   '&cu=INR';
      new QRCode(upiContainer, {
        text: upiStr,
        width: 76,
        height: 76,
        colorDark : "#000000",
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.M
      });
      upiContainer.style.display = 'flex';
    } else {
      upiContainer.style.display = 'none';
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

      return window.api.waGetStatus().then(function(waState) {
        var isLocalWaLinked = (waState && waState.status === 'linked');

        var sendToN8n = [];
        var sendLocalWa = false;
        var openWaRedirect = false;

        for (var i = 0; i < channels.length; i++) {
          if (channels[i] === 'whatsapp') {
            if (self._settings && self._settings.wati_enabled === '1') {
              sendToN8n.push('whatsapp');
            } else if (isLocalWaLinked) {
              sendLocalWa = true;
            } else {
              openWaRedirect = true;
            }
          } else {
            sendToN8n.push(channels[i]);
          }
        }

        var promiseChain = Promise.resolve();

        if (sendLocalWa || openWaRedirect) {
          var customerPhone = (self._data.customer && self._data.customer.phone) || b.party_phone;
          var businessName = self._settings ? self._settings.business_name : '';
          var text = "Dear Customer,\n\n" +
                     "Please find your invoice " + b.bill_number + " from " + (businessName || 'us') + ".\n" +
                     "Total Amount: " + b.grand_total.toFixed(2) + ".\n\n" +
                     "Thank you!";
          var filename = 'Invoice_' + b.bill_number + '.pdf';
          
          Toast.show('Sending invoice PDF via WhatsApp...', 'info');
          promiseChain = promiseChain.then(function() {
            return window.api.waSendBill(customerPhone, text, pdfBase64, filename).then(function() {
              Toast.show('WhatsApp invoice sent automatically!', 'success');
            }).catch(function(waErr) {
              console.error('[wa] auto-send failed:', waErr.message);
              Toast.show('WhatsApp send failed: ' + (waErr.message || waErr) + '. Please connect WhatsApp in Settings -> Integrations.', 'error');
            });
          });
        }

        if (sendToN8n.length > 0) {
          promiseChain = promiseChain.then(function() {
            return window.api.billSent(b, self._data.customer, self._data.items, taxRecord, pdfBase64, sendToN8n).then(function() {
              Toast.show('Bill sent successfully!', 'success');
              if (triggerPrint) {
                window.print();
              }
            });
          });
        } else {
          if (triggerPrint) {
            promiseChain = promiseChain.then(function() {
              window.print();
            });
          }
        }

        return promiseChain;
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

      return window.api.waGetStatus().then(function(waState) {
        var isLocalWaLinked = (waState && waState.status === 'linked');

        var sendToN8n = [];
        var sendLocalWa = false;
        var openWaRedirect = false;

        for (var i = 0; i < channels.length; i++) {
          if (channels[i] === 'whatsapp') {
            if (self._settings && self._settings.wati_enabled === '1') {
              sendToN8n.push('whatsapp');
            } else if (isLocalWaLinked) {
              sendLocalWa = true;
            } else {
              openWaRedirect = true;
            }
          } else {
            sendToN8n.push(channels[i]);
          }
        }

        var promiseChain = Promise.resolve();

        if (sendLocalWa) {
          var customerPhone = (self._data.customer && self._data.customer.phone) || b.party_phone;
          var businessName = self._settings ? self._settings.business_name : '';
          var text = "Dear Customer,\n\n" +
                     "This is a friendly reminder that payment for invoice " + b.bill_number + " is outstanding.\n" +
                     "Amount Due: " + b.amount_due.toFixed(2) + ".\n\n" +
                     "Please make the payment as soon as possible. Thank you!\n" +
                     (businessName || '');
          var filename = 'Reminder_' + b.bill_number + '.pdf';
          
          Toast.show('Sending payment reminder via local WhatsApp...', 'info');
          promiseChain = promiseChain.then(function() {
            return window.api.waSendBill(customerPhone, text, pdfBase64, filename).then(function() {
              Toast.show('WhatsApp reminder sent automatically!', 'success');
            }).catch(function(waErr) {
              console.error('[wa] reminder auto-send failed:', waErr.message);
              Toast.show('Auto-send failed. Falling back to WhatsApp Web redirect...', 'warning');
              self.openWhatsAppReminderRedirect(customerPhone, b.bill_number, b.amount_due, businessName);
            });
          });
        } else if (openWaRedirect) {
          var customerPhone = (self._data.customer && self._data.customer.phone) || b.party_phone;
          var businessName = self._settings ? self._settings.business_name : '';
          self.openWhatsAppReminderRedirect(customerPhone, b.bill_number, b.amount_due, businessName);
        }

        if (sendToN8n.length > 0) {
          Toast.show('Triggering payment reminder via n8n...', 'info');
          promiseChain = promiseChain.then(function() {
            return window.api.paymentReminder(
              b,
              self._data.customer,
              self._data.items,
              taxRecord,
              pdfBase64,
              sendToN8n
            ).then(function() {
              Toast.show('Payment reminder sent successfully!', 'success');
            });
          });
        }

        return promiseChain;
      });
    }).catch(function(err) {
      console.error(err);
      Toast.show('Failed to send reminder: ' + err.message, 'error');
    });
  },

  openWhatsAppRedirect: function(phone, billNumber, grandTotal, businessName) {
    if (!phone) {
      Toast.show('Customer phone number not available for WhatsApp', 'warning');
      return;
    }
    var cleanedPhone = phone.replace(/\D/g, '');
    if (cleanedPhone.length === 10) {
      cleanedPhone = '91' + cleanedPhone;
    }
    var text = "Dear Customer,\n\n" +
               "Please find your invoice " + billNumber + " from " + (businessName || 'us') + ".\n" +
               "Total Amount: " + grandTotal.toFixed(2) + ".\n\n" +
               "Thank you!";
    var url = "https://api.whatsapp.com/send?phone=" + cleanedPhone + "&text=" + encodeURIComponent(text);
    window.api.openExternal(url);
  },

  openWhatsAppReminderRedirect: function(phone, billNumber, amountDue, businessName) {
    if (!phone) {
      Toast.show('Customer phone number not available for WhatsApp', 'warning');
      return;
    }
    var cleanedPhone = phone.replace(/\D/g, '');
    if (cleanedPhone.length === 10) {
      cleanedPhone = '91' + cleanedPhone;
    }
    var text = "Dear Customer,\n\n" +
               "This is a friendly reminder that payment for invoice " + billNumber + " is outstanding.\n" +
               "Amount Due: " + amountDue.toFixed(2) + ".\n\n" +
               "Please make the payment as soon as possible. Thank you!\n" +
               (businessName || '');
    var url = "https://api.whatsapp.com/send?phone=" + cleanedPhone + "&text=" + encodeURIComponent(text);
    window.api.openExternal(url);
  }
};
