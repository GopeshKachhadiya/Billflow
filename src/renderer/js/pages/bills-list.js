window.PageControllers = window.PageControllers || {};
window.PageControllers['bills-list'] = {
  _debounceTimer: null,
  _currentBills: [],
  init: function() {
    var self = this;
    self.loadBills();

    var newBtn = document.getElementById('btn-new-bill');
    if (newBtn) {
      newBtn.addEventListener('click', function() {
        window.loadPage('bill-edit', { mode: 'create' });
      });
    }

    var statusFilter = document.getElementById('filter-status');
    var searchInput  = document.getElementById('filter-search');
    var dateFrom     = document.getElementById('filter-date-from');
    var dateTo       = document.getElementById('filter-date-to');

    if (statusFilter) statusFilter.addEventListener('change', function() { self.loadBills(); });
    if (dateFrom)     dateFrom.addEventListener('change',     function() { self.loadBills(); });
    if (dateTo)       dateTo.addEventListener('change',       function() { self.loadBills(); });
    if (searchInput) {
      searchInput.addEventListener('input', function() {
        clearTimeout(self._debounceTimer);
        self._debounceTimer = setTimeout(function() { self.loadBills(); }, 300);
      });
    }

    var exportBtn = document.getElementById('btn-export-csv');
    if (exportBtn) {
      exportBtn.addEventListener('click', function() { self.exportCSV(); });
    }
  },

  loadBills: function() {
    var self = this;
    var filter = {
      status:   (document.getElementById('filter-status')    || {}).value || 'all',
      search:   (document.getElementById('filter-search')    || {}).value || '',
      dateFrom: (document.getElementById('filter-date-from') || {}).value || '',
      dateTo:   (document.getElementById('filter-date-to')   || {}).value || '',
      limit: 100
    };

    window.api.listBills(filter).then(function(bills) {
      var tbody = document.getElementById('bills-table-body');
      if (!tbody) return;
      tbody.innerHTML = '';
      self._currentBills = bills;

      if (bills.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--color-text-muted); padding: 20px;">No bills matched the current filters.</td></tr>';
        return;
      }

      for (var i = 0; i < bills.length; i++) {
        var b = bills[i];
        (function(bill) {
          var tr = document.createElement('tr');
          tr.innerHTML =
            '<td><a href="#" class="bill-link-view" style="color: var(--color-primary); font-weight: 600; text-decoration: none;">' + bill.bill_number + '</a></td>' +
            '<td>' + (bill.customer_name || '—') + '</td>' +
            '<td>' + DateUtils.toDisplay(bill.bill_date) + '</td>' +
            '<td>' + DateUtils.toDisplay(bill.due_date) + '</td>' +
            '<td>' + FormatCurrency.toRupees(bill.grand_total) + '</td>' +
            '<td><span class="badge badge-' + bill.status + '">' + bill.status + '</span></td>' +
            '<td class="actions" style="text-align: right; padding-right: 24px;">' +
              '<button class="btn btn-sm btn-view" style="margin-right: 6px;">View</button>' +
              '<button class="btn btn-sm btn-edit" style="margin-right: 6px;">Edit</button>' +
              (bill.status === 'sent' || bill.status === 'overdue' ? '<button class="btn btn-sm btn-success btn-paid" style="margin-right: 6px;">Paid</button>' : '') +
              (bill.status === 'draft' ? '<button class="btn btn-sm btn-danger btn-del">Del</button>' : '') +
            '</td>';

          tr.querySelector('.bill-link-view').addEventListener('click', function(e) {
            e.preventDefault();
            window.loadPage('bill-view', { billId: bill.id });
          });
          tr.querySelector('.btn-view').addEventListener('click', function() {
            window.loadPage('bill-view', { billId: bill.id });
          });
          tr.querySelector('.btn-edit').addEventListener('click', function() {
            window.loadPage('bill-edit', { mode: 'edit', billId: bill.id });
          });

          var paidBtn = tr.querySelector('.btn-paid');
          if (paidBtn) {
            paidBtn.addEventListener('click', function() {
              window.api.updateBillStatus(bill.id, 'paid', {
                amount_paid: bill.grand_total,
                payment_date: DateUtils.today(),
                payment_method: 'Manual'
              }).then(function() {
                Toast.show('Bill marked as paid', 'success');
                self.loadBills();
              });
            });
          }

          var delBtn = tr.querySelector('.btn-del');
          if (delBtn) {
            delBtn.addEventListener('click', function() {
              Modal.confirm('Delete bill ' + bill.bill_number + '?', function() {
                window.api.deleteBill(bill.id).then(function() {
                  Toast.show('Bill deleted', 'info');
                  self.loadBills();
                });
              });
            });
          }

          tbody.appendChild(tr);
        }(b));
      }
    }).catch(function(err) {
      Toast.show('Failed to load bills: ' + err.message, 'error');
    });
  },

  exportCSV: function() {
    var bills = this._currentBills || [];
    var headers = ['Bill No','Customer','Date','Due Date','Amount','Status'];
    var rows = bills.map(function(b) {
      return [b.bill_number, b.customer_name||'', b.bill_date, b.due_date||'',
              b.grand_total, b.status];
    });
    var csv = headers.join(',') + '\n';
    for (var i = 0; i < rows.length; i++) {
      csv += rows[i].map(function(v) {
        return '"' + String(v||'').replace(/"/g,'""') + '"';
      }).join(',') + '\n';
    }
    var blob = new Blob([csv], { type: 'text/csv' });
    var url  = URL.createObjectURL(blob);
    var a    = document.createElement('a');
    a.href = url; a.download = 'bills-export.csv'; a.click();
    URL.revokeObjectURL(url);
  }
};
