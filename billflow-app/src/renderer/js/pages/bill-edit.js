// ES5 — Bill create/edit page controller
// Depends on: GSTCalculator, AmountToWords, DateUtils, FormatCurrency (vendor globals)

window.PageControllers = window.PageControllers || {};
window.PageControllers['bill-edit'] = {
  _mode:          'create',
  _billId:        null,
  _currentBill:   null,
  _supplyType:    'intrastate',
  _customer:      null,
  _settings:      null,
  _itemRows:      [],
  _autoSaveTimer: null,
  _catalog:       [],
  _customersList: [],

  init: function(params) {
    var self = this;
    self._mode   = (params && params.mode) || 'create';
    self._billId = params && params.billId;
    self._itemRows = [];
    self._customer = null;
    self._supplyType = 'intrastate';

    // Clear existing body items
    var tbody = document.getElementById('items-tbody');
    if (tbody) tbody.innerHTML = '';

    // Load setup details
    Promise.all([
      window.api.getAllSettings(),
      window.api.listItems({ isActive: true }),
      window.api.listCustomers({ isActive: true })
    ]).then(function(results) {
      self._settings = results[0];
      self._catalog = results[1] || [];
      self._customersList = results[2] || [];

      // Populate catalog datalist for autocomplete
      var datalist = document.getElementById('catalog-items-list');
      if (datalist) {
        datalist.innerHTML = '';
        self._catalog.forEach(function(item) {
          var opt = document.createElement('option');
          opt.value = item.name;
          datalist.appendChild(opt);
        });
      }

      // Populate customer select dropdown
      var custSelect = document.getElementById('bill-customer-select');
      if (custSelect) {
        custSelect.innerHTML = '<option value="">Select a customer...</option>';
        self._customersList.forEach(function(c) {
          var opt = document.createElement('option');
          opt.value = c.id;
          opt.textContent = c.name + (c.gstin ? ' · ' + c.gstin : '');
          custSelect.appendChild(opt);
        });

        // Bind customer select change event
        custSelect.addEventListener('change', function() {
          var cid = this.value;
          var selected = self._customersList.find(function(c) { return c.id === cid; });
          if (selected) {
            self.selectCustomer(selected);
          } else {
            self._customer = null;
            document.getElementById('customer-display').textContent = 'No customer selected';
            self.recalculateTotals();
          }
        });
      }

      // Populate settings-dependent fields
      if (self._mode === 'edit' && self._billId) {
        window.api.getBillWithItems(self._billId).then(function(data) {
          self._currentBill = data.bill;
          self._customer    = data.customer;
          self.populateForm(data);
        });
      } else {
        // New bill defaults
        window.api.getNextBillNumber().then(function(num) {
          var el = document.getElementById('bill-number');
          if (el) el.value = num;
        });
        var dateEl = document.getElementById('bill-date');
        if (dateEl) dateEl.value = DateUtils.today();
        
        // Default terms from settings
        var termsEl = document.getElementById('bill-terms');
        if (termsEl && self._settings && self._settings.terms_default) {
          termsEl.value = self._settings.terms_default;
        }

        self.addItemRow();  // Start with one blank line item
      }
    });

    // Bind action buttons
    var saveDraft = document.getElementById('btn-save-draft');
    var sendWhatsApp = document.getElementById('btn-send-whatsapp');
    var printSend  = document.getElementById('btn-print-send');
    
    if (saveDraft) {
      saveDraft.replaceWith(saveDraft.cloneNode(true));
      saveDraft = document.getElementById('btn-save-draft');
      saveDraft.addEventListener('click', function() { self.saveBill('draft', ['email']); });
    }
    if (sendWhatsApp) {
      sendWhatsApp.replaceWith(sendWhatsApp.cloneNode(true));
      sendWhatsApp = document.getElementById('btn-send-whatsapp');
      sendWhatsApp.addEventListener('click', function() { self.saveBill('sent', ['whatsapp']); });
    }
    if (printSend) {
      printSend.replaceWith(printSend.cloneNode(true));
      printSend = document.getElementById('btn-print-send');
      printSend.addEventListener('click', function() { self.saveBill('sent', ['email', 'whatsapp'], true); });
    }

    var addItemBtn = document.getElementById('btn-add-item');
    if (addItemBtn) {
      addItemBtn.replaceWith(addItemBtn.cloneNode(true));
      addItemBtn = document.getElementById('btn-add-item');
      addItemBtn.addEventListener('click', function() { self.addItemRow(); });
    }

    var cancelBtn = document.getElementById('btn-cancel');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', function() {
        window.loadPage('bills-list');
      });
    }

    var newCustBtn = document.getElementById('btn-new-customer');
    if (newCustBtn) {
      newCustBtn.addEventListener('click', function() {
        window.loadPage('customer-edit', { mode: 'create' });
      });
    }

    // Auto-save every 60 seconds
    if (self._autoSaveTimer) clearInterval(self._autoSaveTimer);
    self._autoSaveTimer = setInterval(function() { self.autoSave(); }, 60000);

    // Payment status change & downpayment listeners
    var payStatusSelect = document.getElementById('payment-status-select');
    var dpGroup = document.getElementById('downpayment-group');
    var dpInput = document.getElementById('downpayment-amount');

    if (payStatusSelect) {
      payStatusSelect.addEventListener('change', function() {
        if (this.value === 'partial') {
          if (dpGroup) dpGroup.style.display = 'block';
        } else {
          if (dpGroup) dpGroup.style.display = 'none';
        }
        self.recalculateTotals();
      });
    }

    if (dpInput) {
      dpInput.addEventListener('input', function() {
        self.recalculateTotals();
      });
    }
  },

  // ── Customer selection ────────────────────────────────────────────────────
  selectCustomer: function(customer) {
    var self      = this;
    self._customer = customer;
    var bizCode   = (self._settings || {}).business_state_code || '';
    var custCode  = customer.state_code || '';
    self._supplyType = GSTCalculator.getSupplyType(bizCode, custCode, false);

    var el = document.getElementById('customer-display');
    if (el) el.textContent = customer.name + (customer.gstin ? ' · ' + customer.gstin : '');

    var supplyEl = document.getElementById('supply-type-display');
    if (supplyEl) {
      supplyEl.textContent = self._supplyType === 'intrastate' ? 'Intrastate (CGST+SGST)' : 'Interstate (IGST)';
      supplyEl.className = 'badge ' + (self._supplyType === 'intrastate' ? 'badge-sent' : 'badge-paid');
    }

    // Update column headers based on supply type
    var cgstHeader = document.getElementById('th-cgst');
    var sgstHeader = document.getElementById('th-sgst');
    var igstHeader = document.getElementById('th-igst');
    if (self._supplyType === 'intrastate') {
      if (cgstHeader) cgstHeader.style.display = '';
      if (sgstHeader) sgstHeader.style.display = '';
      if (igstHeader) igstHeader.style.display = 'none';
      
      var cgstRows = document.querySelectorAll('.item-cgst');
      var sgstRows = document.querySelectorAll('.item-sgst');
      var igstRows = document.querySelectorAll('.item-igst');
      for (var i = 0; i < cgstRows.length; i++) cgstRows[i].style.display = '';
      for (var i = 0; i < sgstRows.length; i++) sgstRows[i].style.display = '';
      for (var i = 0; i < igstRows.length; i++) igstRows[i].style.display = 'none';
      
      var cgstSummary = document.querySelector('.row-cgst');
      var sgstSummary = document.querySelector('.row-sgst');
      var igstSummary = document.querySelector('.row-igst');
      if (cgstSummary) cgstSummary.style.display = '';
      if (sgstSummary) sgstSummary.style.display = '';
      if (igstSummary) igstSummary.style.display = 'none';
    } else {
      if (cgstHeader) cgstHeader.style.display = 'none';
      if (sgstHeader) sgstHeader.style.display = 'none';
      if (igstHeader) igstHeader.style.display = '';
      
      var cgstRows = document.querySelectorAll('.item-cgst');
      var sgstRows = document.querySelectorAll('.item-sgst');
      var igstRows = document.querySelectorAll('.item-igst');
      for (var i = 0; i < cgstRows.length; i++) cgstRows[i].style.display = 'none';
      for (var i = 0; i < sgstRows.length; i++) sgstRows[i].style.display = 'none';
      for (var i = 0; i < igstRows.length; i++) igstRows[i].style.display = '';
      
      var cgstSummary = document.querySelector('.row-cgst');
      var sgstSummary = document.querySelector('.row-sgst');
      var igstSummary = document.querySelector('.row-igst');
      if (cgstSummary) cgstSummary.style.display = 'none';
      if (sgstSummary) sgstSummary.style.display = 'none';
      if (igstSummary) igstSummary.style.display = '';
    }

    // Update customer select value in dropdown
    var custSelect = document.getElementById('bill-customer-select');
    if (custSelect) custSelect.value = customer.id;

    // Auto due date from customer payment terms
    var billDate = (document.getElementById('bill-date') || {}).value || DateUtils.today();
    var dueEl    = document.getElementById('due-date');
    if (dueEl) dueEl.value = DateUtils.getDueDate(billDate, customer.payment_terms || 'net_30');

    self.recalculateAll();
  },

  // ── Line item rows ────────────────────────────────────────────────────────
  addItemRow: function(data) {
    data = data || {};
    var self  = this;
    var idx   = self._itemRows.length;
    var tbody = document.getElementById('items-tbody');
    if (!tbody) return;

    var tr = document.createElement('tr');
    tr.className = 'item-row';
    tr.setAttribute('data-idx', idx);
    
    var cgstStyle = self._supplyType === 'intrastate' ? '' : 'display:none;';
    var sgstStyle = self._supplyType === 'intrastate' ? '' : 'display:none;';
    var igstStyle = self._supplyType === 'interstate' ? '' : 'display:none;';

    tr.innerHTML =
      '<td><input class="item-desc" list="catalog-items-list" value="' + (data.description||'') + '"></td>' +
      '<td><input class="item-hsn"      value="' + (data.hsn_sac||'') + '" style="width:80px"></td>' +
      '<td><input class="item-lot"      value="' + (data.lot_no||'') + '" style="width:90px"></td>' +
      '<td><input class="item-grade"    value="' + (data.grade||'') + '" style="width:80px"></td>' +
      '<td><input class="item-cartons"  type="number" value="' + (data.cartons||0) + '" style="width:70px"></td>' +
      '<td><input class="item-qty"  type="number" value="' + (data.quantity||1) + '" style="width:85px"></td>' +
      '<td><input class="item-unit"     value="' + (data.unit||'KGS') + '" style="width:70px"></td>' +
      '<td><input class="item-price" type="number" value="' + (data.unit_price||0) + '" style="width:90px"></td>' +
      '<td><input class="item-disc"  type="number" value="' + (data.discount_percent||0) + '" style="width:60px"></td>' +
      '<td><select class="item-gst" style="width:85px">' +
        [0,5,12,18,28].map(function(r) {
          return '<option value="'+r+'"'+(r===(data.gst_rate||(self._settings && parseInt(self._settings.default_gst_rate,10))||18)?' selected':'')+'>'+r+'%</option>';
        }).join('') +
      '</select></td>' +
      '<td class="item-cgst" style="text-align:right;' + cgstStyle + '">0.00</td>' +
      '<td class="item-sgst" style="text-align:right;' + sgstStyle + '">0.00</td>' +
      '<td class="item-igst" style="text-align:right;' + igstStyle + '">0.00</td>' +
      '<td><input class="item-total" type="number" step="any" value="' + ((data.line_total || data.total || 0).toFixed(2)) + '" style="width:95px; text-align:right; font-weight:600;"></td>' +
      '<td style="text-align:center;"><button class="btn btn-sm btn-danger item-del">✕</button></td>';

    tbody.appendChild(tr);
    self._itemRows.push(tr);

    // Bind autocomplete from items catalog on description change
    var descInput = tr.querySelector('.item-desc');
    if (descInput) {
      descInput.addEventListener('input', function() {
        var val = this.value;
        var found = self._catalog.find(function(item) { return item.name === val; });
        if (found) {
          tr.querySelector('.item-hsn').value = found.hsn_sac || '';
          tr.querySelector('.item-price').value = found.unit_price || 0.00;
          tr.querySelector('.item-gst').value = found.gst_rate || 18;
          self.recalculateLine(tr, idx);
        }
      });
    }

    // Bind recalc on change
    var inputs = tr.querySelectorAll('input:not(.item-total), select');
    for (var i = 0; i < inputs.length; i++) {
      inputs[i].addEventListener('input', function() { self.recalculateLine(tr, idx); });
      inputs[i].addEventListener('change', function() { self.recalculateLine(tr, idx); });
    }

    var totalInput = tr.querySelector('.item-total');
    if (totalInput) {
      totalInput.addEventListener('input', function() { self.reverseCalculateLine(tr, idx); });
      totalInput.addEventListener('change', function() { self.reverseCalculateLine(tr, idx); });
    }

    tr.querySelector('.item-del').addEventListener('click', function() {
      tbody.removeChild(tr);
      self._itemRows.splice(self._itemRows.indexOf(tr), 1);
      self.recalculateAll();
    });

    if (data.unit_price || data.line_total || data.total) { self.recalculateLine(tr, idx); }
  },

  reverseCalculateLine: function(tr, idx) {
    var totalVal = parseFloat(tr.querySelector('.item-total').value) || 0;
    var qty      = parseFloat(tr.querySelector('.item-qty').value)   || 1;
    if (qty <= 0) qty = 1;
    var disc     = parseFloat(tr.querySelector('.item-disc').value)  || 0;
    var rate     = parseFloat(tr.querySelector('.item-gst').value)   || 0;

    var taxable = totalVal / (1 + rate / 100);
    var price   = 0;
    if (disc < 100) {
      price = taxable / (qty * (1 - disc / 100));
    }

    tr.querySelector('.item-price').value = price.toFixed(2);
    this.recalculateLine(tr, idx, true);
  },

  recalculateLine: function(tr, idx, skipTotalUpdate) {
    var qty   = parseFloat(tr.querySelector('.item-qty').value)   || 0;
    var price = parseFloat(tr.querySelector('.item-price').value) || 0;
    var disc  = parseFloat(tr.querySelector('.item-disc').value)  || 0;
    var rate  = parseFloat(tr.querySelector('.item-gst').value)   || 0;

    var result = GSTCalculator.calcLineItem({
      quantity: qty, unitPrice: price, discountPercent: disc,
      gstRate: rate, supplyType: this._supplyType
    });

    tr.querySelector('.item-cgst').textContent  = result.cgstAmount.toFixed(2);
    tr.querySelector('.item-sgst').textContent  = result.sgstAmount.toFixed(2);
    tr.querySelector('.item-igst').textContent  = result.igstAmount.toFixed(2);
    if (!skipTotalUpdate) {
      var totEl = tr.querySelector('.item-total');
      if (totEl) {
        if (totEl.tagName === 'INPUT') totEl.value = result.lineTotal.toFixed(2);
        else totEl.textContent = result.lineTotal.toFixed(2);
      }
    }
    tr._calcResult = result;

    this.recalculateTotals();
  },

  recalculateAll: function() {
    var self  = this;
    var rows  = document.querySelectorAll('.item-row');
    for (var i = 0; i < rows.length; i++) {
      self.recalculateLine(rows[i], i);
    }
  },

  recalculateTotals: function() {
    var results = [];
    var rows    = document.querySelectorAll('.item-row');
    for (var i = 0; i < rows.length; i++) {
      if (rows[i]._calcResult) results.push(rows[i]._calcResult);
    }
    var totals = GSTCalculator.calcBillTotals(results);

    function setEl(id, val) { var e=document.getElementById(id); if(e) e.textContent=val; }
    setEl('total-subtotal',  FormatCurrency.toRupees(totals.subtotal));
    setEl('total-discount',  FormatCurrency.toRupees(totals.totalDiscount));
    setEl('total-taxable',   FormatCurrency.toRupees(totals.totalTaxable));
    setEl('total-cgst',      FormatCurrency.toRupees(totals.totalCGST));
    setEl('total-sgst',      FormatCurrency.toRupees(totals.totalSGST));
    setEl('total-igst',      FormatCurrency.toRupees(totals.totalIGST));
    setEl('total-roundoff',  FormatCurrency.toRupees(totals.roundOff));
    setEl('total-grand',     FormatCurrency.toRupees(totals.grandTotal));
    setEl('amount-words',    AmountToWords.toWords(totals.grandTotal));

    var payStatus = (document.getElementById('payment-status-select') || {}).value || 'unpaid';
    var paidAmount = 0;
    var grandTotal = totals.grandTotal || 0;
    if (payStatus === 'paid') {
      paidAmount = grandTotal;
    } else if (payStatus === 'partial') {
      var dpInput = document.getElementById('downpayment-amount');
      paidAmount = parseFloat(dpInput ? dpInput.value : 0) || 0;
      if (paidAmount > grandTotal) paidAmount = grandTotal;
    } else {
      paidAmount = 0;
    }
    var dueAmount = Math.max(0, grandTotal - paidAmount);

    setEl('total-paid-display', FormatCurrency.toRupees(paidAmount));
    setEl('total-due-display',  FormatCurrency.toRupees(dueAmount));

    totals.paidAmount = paidAmount;
    totals.dueAmount = dueAmount;
    totals.paymentStatus = payStatus;

    this._currentTotals = totals;
  },

  collectItems: function() {
    var results = [];
    var rows    = document.querySelectorAll('.item-row');
    for (var i = 0; i < rows.length; i++) {
      var tr = rows[i];
      if (!tr._calcResult) continue;
      var r  = tr._calcResult;
      results.push({
        sort_order:       i,
        description:      tr.querySelector('.item-desc').value  || '',
        hsn_sac:          tr.querySelector('.item-hsn').value   || '',
        unit:             tr.querySelector('.item-unit').value  || 'KGS',
        quantity:         r.quantity,
        unit_price:       r.unitPrice,
        discount_percent: r.discountPercent,
        gst_rate:         r.gstRate,
        base_amount:      r.baseAmount,
        discount_amount:  r.discountAmount,
        taxable_amount:   r.taxableAmount,
        cgst_rate:        r.cgstRate,  cgst_amount: r.cgstAmount,
        sgst_rate:        r.sgstRate,  sgst_amount: r.sgstAmount,
        igst_rate:        r.igstRate,  igst_amount: r.igstAmount,
        line_total:       r.lineTotal,
        lot_no:           tr.querySelector('.item-lot').value   || '',
        grade:            tr.querySelector('.item-grade').value || '',
        cartons:          parseFloat(tr.querySelector('.item-cartons').value) || 0
      });
    }
    return results;
  },

  saveBill: function(status, channels, triggerPrint) {
    var self    = this;
    if (!self._customer) {
      return Toast.show('Please select a customer', 'error');
    }
    var items   = self.collectItems();
    if (items.length === 0) {
      return Toast.show('Please add at least one line item', 'error');
    }
    var totals  = self._currentTotals || {};
    var rateWise = GSTCalculator.buildRateWiseBreakdown(
      items.map(function(it) {
        return { gstRate:it.gst_rate, taxableAmount:it.taxable_amount,
                 cgstAmount:it.cgst_amount, sgstAmount:it.sgst_amount, igstAmount:it.igst_amount };
      })
    );
    var hsnWise = GSTCalculator.buildHSNBreakdown(
      items.map(function(it) {
        return { hsnSac:it.hsn_sac, description:it.description, unit:it.unit,
                 gstRate:it.gst_rate, quantity:it.quantity,
                 taxableAmount:it.taxable_amount, cgstAmount:it.cgst_amount,
                 sgstAmount:it.sgst_amount, igstAmount:it.igst_amount };
      })
    );

    var payStatusSelect = (document.getElementById('payment-status-select') || {}).value || 'unpaid';
    var finalStatus = status;
    if (status !== 'draft') {
      if (payStatusSelect === 'paid') finalStatus = 'paid';
      else if (payStatusSelect === 'partial') finalStatus = 'partial';
      else finalStatus = 'sent';
    }

    var payMethod = (document.getElementById('payment-method-select') || {}).value || 'Cash';
    var payRef = (document.getElementById('payment-reference') || {}).value || '';

    var billData = {
      bill_number:     (document.getElementById('bill-number')||{}).value || '',
      customer_id:     self._customer.id,
      bill_date:       (document.getElementById('bill-date')||{}).value   || DateUtils.today(),
      due_date:        (document.getElementById('due-date')||{}).value    || '',
      status:          finalStatus,
      supply_type:     self._supplyType,
      place_of_supply: self._customer.state_code || '',
      subtotal:        totals.subtotal      || 0,
      total_discount:  totals.totalDiscount || 0,
      total_taxable:   totals.totalTaxable  || 0,
      total_cgst:      totals.totalCGST     || 0,
      total_sgst:      totals.totalSGST     || 0,
      total_igst:      totals.totalIGST     || 0,
      total_tax:       (totals.totalCGST||0) + (totals.totalSGST||0) + (totals.totalIGST||0),
      round_off:       totals.roundOff      || 0,
      grand_total:     totals.grandTotal    || 0,
      amount_due:      totals.dueAmount !== undefined ? totals.dueAmount : (finalStatus === 'paid' ? 0 : totals.grandTotal),
      amount_paid:     totals.paidAmount !== undefined ? totals.paidAmount : (finalStatus === 'paid' ? totals.grandTotal : 0),
      payment_method:  payMethod,
      payment_reference: payRef,
      notes:           (document.getElementById('bill-notes')||{}).value  || '',
      terms:           (document.getElementById('bill-terms')||{}).value  || '',
      order_number:    (document.getElementById('order-number')||{}).value || '',
      order_date:      (document.getElementById('order-date')||{}).value   || '',
      due_days:        parseInt((document.getElementById('due-days')||{}).value, 10) || 0,
      party_name:      (document.getElementById('party-name')||{}).value || '',
      party_phone:     (document.getElementById('party-phone')||{}).value || '',
      consignee_name:  (document.getElementById('consignee-name')||{}).value || '',
      consignee_address:(document.getElementById('consignee-address')||{}).value || '',
      consignee_gstin: (document.getElementById('consignee-gstin')||{}).value || '',
      consignee_state: (document.getElementById('consignee-state')||{}).value || '',
      transporter:     (document.getElementById('transporter')||{}).value || '',
      lr_number:       (document.getElementById('lr-number')||{}).value || '',
      vehicle_number:  (document.getElementById('vehicle-number')||{}).value || '',
      transporter_gst: (document.getElementById('transporter-gst')||{}).value || '',
      lr_date:         (document.getElementById('lr-date')||{}).value || '',
      company_name:    (document.getElementById('company-name')||{}).value || '',
      company_bill_no: (document.getElementById('company-bill-no')||{}).value || '',
      ack_no:          (document.getElementById('ack-no')||{}).value || '',
      ack_dt:          (document.getElementById('ack-dt')||{}).value || '',
      irn_no:          (document.getElementById('irn-no')||{}).value || '',
      items:           items,
      taxRecord: {
        bill_date:           (document.getElementById('bill-date')||{}).value || DateUtils.today(),
        bill_number:         (document.getElementById('bill-number')||{}).value || '',
        customer_name:       self._customer.name     || '',
        customer_gstin:      self._customer.gstin    || '',
        customer_state:      self._customer.state    || '',
        customer_state_code: self._customer.state_code || '',
        total_taxable:       totals.totalTaxable  || 0,
        total_cgst:          totals.totalCGST     || 0,
        total_sgst:          totals.totalSGST     || 0,
        total_igst:          totals.totalIGST     || 0,
        total_tax:           (totals.totalCGST||0)+(totals.totalSGST||0)+(totals.totalIGST||0),
        grand_total:         totals.grandTotal    || 0,
        rate_wise_breakdown: rateWise,
        hsn_wise_breakdown:  hsnWise
      }
    };

    var promise;
    if (self._mode === 'create') {
      promise = window.api.createBill(billData).then(function(result) {
        self._billId = result.id;
        self._mode   = 'edit';
        
        // Wait, replaceBillItems must be called to save items!
        return window.api.replaceBillItems(result.id, items).then(function() {
          // Upsert tax record
          return window.api.upsertTaxRecord(result.id, billData.taxRecord).then(function() {
            // Increment bill number
            return window.api.incrementBillNumber().then(function() {
              return result;
            });
          });
        });
      });
    } else {
      promise = window.api.updateBill(self._billId, billData).then(function() {
        return window.api.replaceBillItems(self._billId, items).then(function() {
          return window.api.upsertTaxRecord(self._billId, billData.taxRecord);
        });
      });
    }

    promise.then(function(result) {
      var finalBillId = self._billId || (result && result.id);
      if (status === 'sent') {
        // Generate PDF then fire n8n webhook
        window.api.generatePDF({ bill: billData, items: items,
                                  customer: self._customer, settings: self._settings })
          .then(function(pdfBuffer) {
            // Convert pdfBuffer (Uint8Array) to base64
            var binary = '';
            var bytes = new Uint8Array(pdfBuffer);
            var len = bytes.byteLength;
            for (var i = 0; i < len; i++) {
              binary += String.fromCharCode(bytes[i]);
            }
            var pdfBase64 = window.btoa(binary);

            window.api.waGetStatus().then(function(waState) {
              var isLocalWaLinked = (waState && waState.status === 'linked');

              var sendToN8n = [];
              var sendLocalWa = false;
              var openWaRedirect = false;
              var chs = channels || ['email'];

              for (var i = 0; i < chs.length; i++) {
                if (chs[i] === 'whatsapp') {
                  if (self._settings && self._settings.wati_enabled === '1') {
                    sendToN8n.push('whatsapp');
                  } else if (isLocalWaLinked) {
                    sendLocalWa = true;
                  } else {
                    openWaRedirect = true;
                  }
                } else {
                  sendToN8n.push(chs[i]);
                }
              }

              if (sendLocalWa) {
                var customerPhone = (self._customer && self._customer.phone) || billData.party_phone;
                var businessName = self._settings ? self._settings.business_name : '';
                var text = "Dear Customer,\n\n" +
                           "Please find your invoice " + billData.bill_number + " from " + (businessName || 'us') + ".\n" +
                           "Total Amount: " + billData.grand_total.toFixed(2) + ".\n\n" +
                           "Thank you!";
                var filename = 'Invoice_' + billData.bill_number + '.pdf';
                
                Toast.show('Sending invoice PDF via local WhatsApp...', 'info');
                window.api.waSendBill(customerPhone, text, pdfBase64, filename).then(function() {
                  Toast.show('WhatsApp invoice sent automatically!', 'success');
                }).catch(function(waErr) {
                  console.error('[wa] auto-send failed:', waErr.message);
                  Toast.show('Auto-send failed. Falling back to WhatsApp Web redirect...', 'warning');
                  self.openWhatsAppRedirect(customerPhone, billData.bill_number, billData.grand_total, businessName);
                });
              } else if (openWaRedirect) {
                var customerPhone = (self._customer && self._customer.phone) || billData.party_phone;
                var businessName = self._settings ? self._settings.business_name : '';
                self.openWhatsAppRedirect(customerPhone, billData.bill_number, billData.grand_total, businessName);
              }

              if (sendToN8n.length > 0) {
                window.api.billSent(billData, self._customer, items, billData.taxRecord, pdfBase64, sendToN8n);
              }
            });
          });
        Toast.show('Bill sent successfully!', 'success');
      } else {
        Toast.show('Draft saved', 'info');
      }
      clearInterval(self._autoSaveTimer);
      if (triggerPrint && finalBillId) {
        window.loadPage('bill-view', { billId: finalBillId, print: true });
      } else {
        window.loadPage('bills-list');
      }
    }).catch(function(err) {
      Toast.show('Save failed: ' + err.message, 'error');
    });
  },

  autoSave: function() {
    // Silent save as draft without changing page
    var items = this.collectItems();
    if (items.length === 0 || !this._customer) return;
    this.recalculateAll();
  },

  populateForm: function(data) {
    var self = this;
    var bill = data.bill;
    function setVal(id, v) { var e=document.getElementById(id); if(e) e.value=v||''; }
    setVal('bill-number', bill.bill_number);
    setVal('bill-date',   bill.bill_date);
    setVal('due-date',    bill.due_date);
    setVal('bill-notes',  bill.notes);
    setVal('bill-terms',  bill.terms);
    setVal('order-number', bill.order_number);
    setVal('order-date',  bill.order_date);
    setVal('due-days',    bill.due_days);
    setVal('party-name',  bill.party_name);
    setVal('party-phone', bill.party_phone);
    setVal('consignee-name', bill.consignee_name);
    setVal('consignee-address', bill.consignee_address);
    setVal('consignee-gstin', bill.consignee_gstin);
    setVal('consignee-state', bill.consignee_state);
    setVal('transporter',  bill.transporter);
    setVal('lr-number',    bill.lr_number);
    setVal('vehicle-number', bill.vehicle_number);
    setVal('transporter-gst', bill.transporter_gst);
    setVal('lr-date',      bill.lr_date);
    setVal('company-name', bill.company_name);
    setVal('company-bill-no', bill.company_bill_no);
    setVal('ack-no',       bill.ack_no);
    setVal('ack-dt',       bill.ack_dt);
    setVal('irn-no',       bill.irn_no);
    setVal('payment-reference', bill.payment_reference);

    var pSelect = document.getElementById('payment-status-select');
    var dpGroup = document.getElementById('downpayment-group');
    var dpInput = document.getElementById('downpayment-amount');
    var pmSelect = document.getElementById('payment-method-select');

    if (pmSelect && bill.payment_method) pmSelect.value = bill.payment_method;

    if (pSelect) {
      if (bill.status === 'paid') {
        pSelect.value = 'paid';
        if (dpGroup) dpGroup.style.display = 'none';
      } else if (bill.status === 'partial' || (bill.amount_paid > 0 && bill.amount_due > 0)) {
        pSelect.value = 'partial';
        if (dpGroup) dpGroup.style.display = 'block';
        if (dpInput) dpInput.value = bill.amount_paid || 0;
      } else {
        pSelect.value = 'unpaid';
        if (dpGroup) dpGroup.style.display = 'none';
      }
    }

    if (data.customer) { self.selectCustomer(data.customer); }

    // Repopulate items
    var tbody = document.getElementById('items-tbody');
    if (tbody) tbody.innerHTML = '';
    self._itemRows = [];

    var items = data.items || bill.items || [];
    for (var i = 0; i < items.length; i++) {
      self.addItemRow(items[i]);
    }
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
  }
};
