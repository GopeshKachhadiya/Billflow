window.PageControllers = window.PageControllers || {};
window.PageControllers['reports'] = {
  _customers: [],
  _revBills: [],
  _ledgerBills: [],
  _overdueBills: [],
  
  init: function() {
    var self = this;
    
    // Set default dates for revenue report
    var todayStr = DateUtils.today();
    var firstOfMonth = todayStr.substring(0, 8) + '01';
    
    var fromInput = document.getElementById('rev-from');
    var toInput = document.getElementById('rev-to');
    if (fromInput) fromInput.value = firstOfMonth;
    if (toInput) toInput.value = todayStr;
    
    // Load customer dropdown
    window.api.listCustomers({}).then(function(custs) {
      self._customers = custs || [];
      var ledgerSelect = document.getElementById('ledger-customer');
      if (ledgerSelect) {
        ledgerSelect.innerHTML = '<option value="">Choose Customer...</option>';
        self._customers.forEach(function(c) {
          var opt = document.createElement('option');
          opt.value = c.id;
          opt.textContent = c.name + (c.gstin ? ' (' + c.gstin + ')' : '');
          ledgerSelect.appendChild(opt);
        });
      }
    });
    
    // Event listeners
    var revFilterBtn = document.getElementById('btn-rev-filter');
    if (revFilterBtn) {
      revFilterBtn.addEventListener('click', function() { self.loadRevenueReport(); });
    }
    
    var revCsvBtn = document.getElementById('btn-rev-csv');
    if (revCsvBtn) {
      revCsvBtn.addEventListener('click', function() { self.exportRevenueCSV(); });
    }
    
    var gstFilterBtn = document.getElementById('btn-gst-filter');
    if (gstFilterBtn) {
      gstFilterBtn.addEventListener('click', function() { self.loadGSTTaxReport(); });
    }
    
    var gstJsonBtn = document.getElementById('btn-gst-gstr1');
    if (gstJsonBtn) {
      gstJsonBtn.addEventListener('click', function() { self.exportGSTR1JSON(); });
    }
    
    var ledgerFilterBtn = document.getElementById('btn-ledger-filter');
    if (ledgerFilterBtn) {
      ledgerFilterBtn.addEventListener('click', function() { self.loadCustomerLedger(); });
    }
    
    var ledgerCsvBtn = document.getElementById('btn-ledger-csv');
    if (ledgerCsvBtn) {
      ledgerCsvBtn.addEventListener('click', function() { self.exportLedgerCSV(); });
    }
    
    var overdueCsvBtn = document.getElementById('btn-overdue-csv');
    if (overdueCsvBtn) {
      overdueCsvBtn.addEventListener('click', function() { self.exportOverdueCSV(); });
    }
    
    // Default load
    self.loadRevenueReport();
    self.loadGSTTaxReport();
    self.loadOverdueReport();
  },
  
  exportCSV: function(headers, rows, filename) {
    var csv = headers.join(',') + '\n';
    for (var i = 0; i < rows.length; i++) {
      csv += rows[i].map(function(v) {
        return '"' + String(v || '').replace(/"/g, '""') + '"';
      }).join(',') + '\n';
    }
    var blob = new Blob([csv], { type: 'text/csv' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  },
  
  // ── Tab 1: Revenue Report ──────────────────────────────────────────────────
  loadRevenueReport: function() {
    var self = this;
    var fromVal = document.getElementById('rev-from').value;
    var toVal = document.getElementById('rev-to').value;
    
    window.api.listBills({ dateFrom: fromVal, dateTo: toVal, limit: 1000 }).then(function(bills) {
      self._revBills = bills || [];
      
      var count = 0;
      var total = 0;
      var paid = 0;
      var unpaid = 0;
      
      var tbody = document.getElementById('rev-tbody');
      tbody.innerHTML = '';
      
      if (self._revBills.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--color-text-muted); padding: 20px;">No invoices found in this date range.</td></tr>';
      } else {
        self._revBills.forEach(function(b) {
          count++;
          total += b.grand_total || 0;
          paid += b.amount_paid || 0;
          unpaid += b.amount_due || 0;
          
          var tr = document.createElement('tr');
          tr.innerHTML = 
            '<td style="font-weight: 600;">' + b.bill_number + '</td>' +
            '<td>' + (b.customer_name || '—') + '</td>' +
            '<td>' + DateUtils.toDisplay(b.bill_date) + '</td>' +
            '<td style="text-align: right; font-weight: 500;">' + FormatCurrency.toRupees(b.grand_total) + '</td>' +
            '<td style="text-align: right; color: var(--color-success);">' + FormatCurrency.toRupees(b.amount_paid) + '</td>' +
            '<td style="text-align: right; color: var(--color-warning);">' + FormatCurrency.toRupees(b.amount_due) + '</td>' +
            '<td><span class="badge badge-' + b.status + '">' + b.status + '</span></td>';
          tbody.appendChild(tr);
        });
      }
      
      document.getElementById('rev-stat-count').textContent = count;
      document.getElementById('rev-stat-total').textContent = FormatCurrency.toRupees(total);
      document.getElementById('rev-stat-paid').textContent = FormatCurrency.toRupees(paid);
      document.getElementById('rev-stat-unpaid').textContent = FormatCurrency.toRupees(unpaid);
    });
  },
  
  exportRevenueCSV: function() {
    var self = this;
    if (self._revBills.length === 0) return Toast.show('No data to export', 'error');
    
    var headers = ['Bill Number', 'Customer Name', 'Bill Date', 'Grand Total', 'Amount Paid', 'Amount Due', 'Status'];
    var rows = self._revBills.map(function(b) {
      return [
        b.bill_number,
        b.customer_name || '',
        b.bill_date,
        b.grand_total,
        b.amount_paid,
        b.amount_due,
        b.status
      ];
    });
    
    self.exportCSV(headers, rows, 'Revenue_Report_' + DateUtils.today() + '.csv');
  },
  
  // ── Tab 2: GST Report ──────────────────────────────────────────────────────
  loadGSTTaxReport: function() {
    var year = document.getElementById('gst-year').value;
    var month = document.getElementById('gst-month').value;
    
    window.api.exportGSTR1(year, month).then(function(gstr1) {
      // Aggregate rate-wise from GSTR-1 B2B and B2CS data
      var breakdown = {
        0:  { rate: 0,  taxable: 0, cgst: 0, sgst: 0, igst: 0 },
        5:  { rate: 5,  taxable: 0, cgst: 0, sgst: 0, igst: 0 },
        12: { rate: 12, taxable: 0, cgst: 0, sgst: 0, igst: 0 },
        18: { rate: 18, taxable: 0, cgst: 0, sgst: 0, igst: 0 },
        28: { rate: 28, taxable: 0, cgst: 0, sgst: 0, igst: 0 }
      };
      
      // Process B2B
      var b2b = gstr1.b2b || [];
      b2b.forEach(function(ctinGroup) {
        var invs = ctinGroup.inv || [];
        invs.forEach(function(inv) {
          var items = inv.itms || [];
          items.forEach(function(item) {
            var det = item.itm_det || {};
            var rt = parseInt(det.rt, 10);
            if (breakdown[rt] === undefined) {
              breakdown[rt] = { rate: rt, taxable: 0, cgst: 0, sgst: 0, igst: 0 };
            }
            breakdown[rt].taxable += det.txval || 0;
            breakdown[rt].cgst += det.camt || 0;
            breakdown[rt].sgst += det.samt || 0;
            breakdown[rt].igst += det.iamt || 0;
          });
        });
      });
      
      // Process B2CS
      var b2cs = gstr1.b2cs || [];
      b2cs.forEach(function(item) {
        var rt = parseInt(item.rt, 10);
        if (breakdown[rt] === undefined) {
          breakdown[rt] = { rate: rt, taxable: 0, cgst: 0, sgst: 0, igst: 0 };
        }
        breakdown[rt].taxable += item.txval || 0;
        breakdown[rt].cgst += item.camt || 0;
        breakdown[rt].sgst += item.samt || 0;
        breakdown[rt].igst += item.iamt || 0;
      });
      
      var tbody = document.getElementById('gst-tbody');
      tbody.innerHTML = '';
      
      var rates = [0, 5, 12, 18, 28];
      rates.forEach(function(r) {
        var row = breakdown[r];
        var totalTax = row.cgst + row.sgst + row.igst;
        
        var tr = document.createElement('tr');
        tr.innerHTML = 
          '<td style="font-weight: 600;">' + r + '%</td>' +
          '<td style="text-align: right;">' + FormatCurrency.toRupees(row.taxable) + '</td>' +
          '<td style="text-align: right;">' + FormatCurrency.toRupees(row.cgst) + '</td>' +
          '<td style="text-align: right;">' + FormatCurrency.toRupees(row.sgst) + '</td>' +
          '<td style="text-align: right;">' + FormatCurrency.toRupees(row.igst) + '</td>' +
          '<td style="text-align: right; font-weight: 600; color: var(--color-primary);">' + FormatCurrency.toRupees(totalTax) + '</td>';
        tbody.appendChild(tr);
      });
      
      window._currentGSTR1Data = gstr1;
      window._currentGSTR1Filename = 'GSTR1_Report_' + year + '_' + month + '.json';
    });
  },
  
  exportGSTR1JSON: function() {
    if (!window._currentGSTR1Data) return Toast.show('No GST data compiled yet', 'error');
    
    var jsonStr = JSON.stringify(window._currentGSTR1Data, null, 2);
    var blob = new Blob([jsonStr], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = window._currentGSTR1Filename;
    a.click();
    URL.revokeObjectURL(url);
    Toast.show('GSTR-1 JSON downloaded', 'success');
  },
  
  // ── Tab 3: Customer Ledger ────────────────────────────────────────────────
  loadCustomerLedger: function() {
    var self = this;
    var custId = document.getElementById('ledger-customer').value;
    if (!custId) {
      document.getElementById('ledger-tbody').innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--color-text-muted); padding: 20px;">Please select a customer first.</td></tr>';
      document.getElementById('ledger-stat-billed').textContent = '₹0.00';
      document.getElementById('ledger-stat-paid').textContent = '₹0.00';
      document.getElementById('ledger-stat-due').textContent = '₹0.00';
      return;
    }
    
    window.api.listBills({ customerId: custId, limit: 1000 }).then(function(bills) {
      self._ledgerBills = bills || [];
      
      var billed = 0;
      var paid = 0;
      var due = 0;
      
      var tbody = document.getElementById('ledger-tbody');
      tbody.innerHTML = '';
      
      if (self._ledgerBills.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--color-text-muted); padding: 20px;">No billing history found for this customer.</td></tr>';
      } else {
        self._ledgerBills.forEach(function(b) {
          billed += b.grand_total || 0;
          paid += b.amount_paid || 0;
          due += b.amount_due || 0;
          
          var tr = document.createElement('tr');
          tr.innerHTML = 
            '<td style="font-weight: 600;">' + b.bill_number + '</td>' +
            '<td>' + DateUtils.toDisplay(b.bill_date) + '</td>' +
            '<td>' + (b.due_date ? DateUtils.toDisplay(b.due_date) : '—') + '</td>' +
            '<td style="text-align: right; font-weight: 500;">' + FormatCurrency.toRupees(b.grand_total) + '</td>' +
            '<td style="text-align: right; color: var(--color-success);">' + FormatCurrency.toRupees(b.amount_paid) + '</td>' +
            '<td style="text-align: right; color: var(--color-warning);">' + FormatCurrency.toRupees(b.amount_due) + '</td>' +
            '<td><span class="badge badge-' + b.status + '">' + b.status + '</span></td>';
          tbody.appendChild(tr);
        });
      }
      
      document.getElementById('ledger-stat-billed').textContent = FormatCurrency.toRupees(billed);
      document.getElementById('ledger-stat-paid').textContent = FormatCurrency.toRupees(paid);
      document.getElementById('ledger-stat-due').textContent = FormatCurrency.toRupees(due);
    });
  },
  
  exportLedgerCSV: function() {
    var self = this;
    if (self._ledgerBills.length === 0) return Toast.show('No ledger data to export', 'error');
    
    var custSelect = document.getElementById('ledger-customer');
    var custName = custSelect.options[custSelect.selectedIndex].text;
    
    var headers = ['Bill Number', 'Bill Date', 'Due Date', 'Billed Amount', 'Amount Paid', 'Outstanding Amount', 'Status'];
    var rows = self._ledgerBills.map(function(b) {
      return [
        b.bill_number,
        b.bill_date,
        b.due_date || '',
        b.grand_total,
        b.amount_paid,
        b.amount_due,
        b.status
      ];
    });
    
    self.exportCSV(headers, rows, 'Customer_Ledger_' + custName.replace(/\s+/g, '_') + '_' + DateUtils.today() + '.csv');
  },
  
  // ── Tab 4: Overdue & Ageing ────────────────────────────────────────────────
  loadOverdueReport: function() {
    var self = this;
    var todayStr = DateUtils.today();
    
    // Fetch all unpaid bills (status in 'sent', 'overdue')
    window.api.listBills({ limit: 1000 }).then(function(allBills) {
      self._overdueBills = (allBills || []).filter(function(b) {
        return (b.status === 'sent' || b.status === 'overdue') && b.due_date && b.due_date < todayStr;
      });
      
      var tbody = document.getElementById('overdue-tbody');
      tbody.innerHTML = '';
      
      if (self._overdueBills.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--color-text-muted); padding: 20px;">No overdue invoices. Great job!</td></tr>';
      } else {
        self._overdueBills.forEach(function(b) {
          // Calculate ageing days
          var days = DateUtils.daysUntilDue(b.due_date); // Negative if overdue
          var overdueDays = Math.abs(days || 0);
          
          var bucket = '0–30 days';
          if (overdueDays > 90)      { bucket = '90+ days'; }
          else if (overdueDays > 60) { bucket = '61–90 days'; }
          else if (overdueDays > 30) { bucket = '31–60 days'; }
          
          var tr = document.createElement('tr');
          tr.innerHTML = 
            '<td style="font-weight: 600;">' + b.bill_number + '</td>' +
            '<td>' + (b.customer_name || '—') + '</td>' +
            '<td>' + DateUtils.toDisplay(b.due_date) + '</td>' +
            '<td style="text-align: right;">' + FormatCurrency.toRupees(b.grand_total) + '</td>' +
            '<td style="text-align: right; font-weight: 600; color: var(--color-danger);">' + FormatCurrency.toRupees(b.amount_due) + '</td>' +
            '<td><span class="badge" style="background:#FDE8E8; color:#E02424;">' + bucket + ' (' + overdueDays + ' days)</span></td>';
          tbody.appendChild(tr);
        });
      }
    });
  },
  
  exportOverdueCSV: function() {
    var self = this;
    if (self._overdueBills.length === 0) return Toast.show('No overdue data to export', 'error');
    
    var todayStr = DateUtils.today();
    var headers = ['Bill Number', 'Customer Name', 'Due Date', 'Total Amount', 'Balance Due', 'Overdue Days', 'Ageing Bucket'];
    var rows = self._overdueBills.map(function(b) {
      var days = DateUtils.daysUntilDue(b.due_date);
      var overdueDays = Math.abs(days || 0);
      var bucket = '0–30 days';
      if (overdueDays > 90)      { bucket = '90+ days'; }
      else if (overdueDays > 60) { bucket = '61–90 days'; }
      else if (overdueDays > 30) { bucket = '31–60 days'; }
      
      return [
        b.bill_number,
        b.customer_name || '',
        b.due_date,
        b.grand_total,
        b.amount_due,
        overdueDays,
        bucket
      ];
    });
    
    self.exportCSV(headers, rows, 'Overdue_Ageing_Report_' + todayStr + '.csv');
  }
};
