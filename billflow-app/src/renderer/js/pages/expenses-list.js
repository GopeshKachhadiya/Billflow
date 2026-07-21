window.PageControllers = window.PageControllers || {};
window.PageControllers['expenses-list'] = {
  init: function() {
    var self = this;

    var searchInput = document.getElementById('expense-search');
    if (searchInput) {
      searchInput.addEventListener('input', self.debounce(function() {
        self.loadExpenses();
      }, 300));
    }

    var catFilter = document.getElementById('expense-filter-category');
    if (catFilter) {
      catFilter.addEventListener('change', function() {
        self.loadExpenses();
      });
    }

    var addBtn = document.getElementById('btn-add-expense');
    if (addBtn) {
      addBtn.addEventListener('click', function() {
        self.openModal();
      });
    }

    var cancelBtn = document.getElementById('btn-exp-cancel');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', function() {
        self.closeModal();
      });
    }

    var saveBtn = document.getElementById('btn-exp-save');
    if (saveBtn) {
      saveBtn.addEventListener('click', function() {
        self.saveExpense();
      });
    }

    self.loadSummary();
    self.loadExpenses();
  },

  debounce: function(func, wait) {
    var timeout;
    return function() {
      var context = this, args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(function() {
        func.apply(context, args);
      }, wait);
    };
  },

  loadSummary: function() {
    window.api.getExpenseSummary({}).then(function(summary) {
      var totEl = document.getElementById('exp-summary-total');
      var gstEl = document.getElementById('exp-summary-gst');
      var catEl = document.getElementById('exp-summary-cat');

      if (totEl) totEl.textContent = FormatCurrency.toRupees(summary.total_amount || 0);
      if (gstEl) gstEl.textContent = FormatCurrency.toRupees(summary.total_gst || 0);

      if (catEl) {
        var top = (summary.by_category || []).sort(function(a,b) { return b.amount - a.amount; })[0];
        catEl.textContent = top ? top.category + ' (' + FormatCurrency.toShort(top.amount) + ')' : '—';
      }
    }).catch(function() {});
  },

  loadExpenses: function() {
    var self = this;
    var search = document.getElementById('expense-search').value;
    var catVal = document.getElementById('expense-filter-category').value;

    var filter = { search: search };
    if (catVal && catVal !== 'all') {
      filter.category = catVal;
    }

    window.api.listExpenses(filter).then(function(expenses) {
      var tbody = document.getElementById('expenses-tbody');
      tbody.innerHTML = '';

      if (expenses.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--color-text-muted); padding: 24px;">No business expenses recorded yet. Click "+ Record Expense" to add your first expenditure.</td></tr>';
        return;
      }

      for (var i = 0; i < expenses.length; i++) {
        var exp = expenses[i];
        var tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid var(--color-border)';
        tr.innerHTML = 
          '<td style="padding: 12px 16px; font-family: var(--font-mono); font-size: 13px;">' + DateUtils.toDisplay(exp.bill_date) + '</td>' +
          '<td style="padding: 12px 16px;"><span class="badge badge-draft" style="background: var(--color-surface-elevated); border: 1px solid var(--color-border); padding: 3px 8px; border-radius: 4px; font-weight: 500;">' + (exp.category || 'General') + '</span></td>' +
          '<td style="padding: 12px 16px; font-weight: 600;">' + (exp.vendor_name || '—') + '</td>' +
          '<td style="padding: 12px 16px; text-align: right; font-weight: 600; color: var(--color-primary);">' + FormatCurrency.toRupees(exp.amount || 0) + '</td>' +
          '<td style="padding: 12px 16px; text-align: right; color: var(--color-success); font-weight: 500;">' + (exp.gst_amount ? FormatCurrency.toRupees(exp.gst_amount) : '—') + '</td>' +
          '<td style="padding: 12px 16px; color: var(--color-text-muted); max-width: 220px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">' + (exp.notes || '—') + '</td>' +
          '<td style="padding: 12px 16px; text-align: right;">' +
            '<button class="btn btn-sm btn-edit-exp" data-id="' + exp.id + '" style="margin-right: 6px; padding: 4px 8px; border: 1px solid var(--color-border); background: #fff; border-radius: 4px; cursor: pointer;">Edit</button>' +
            '<button class="btn btn-sm btn-del-exp" data-id="' + exp.id + '" style="padding: 4px 8px; border: 1px solid var(--color-danger); color: var(--color-danger); background: #fff; border-radius: 4px; cursor: pointer;">Delete</button>' +
          '</td>';
        tbody.appendChild(tr);
      }

      var editBtns = tbody.querySelectorAll('.btn-edit-exp');
      for (var j = 0; j < editBtns.length; j++) {
        editBtns[j].addEventListener('click', function() {
          var id = this.getAttribute('data-id');
          window.api.listExpenses({}).then(function(allExp) {
            var selected = allExp.find(function(x) { return x.id === id; });
            if (selected) {
              self.openModal(selected);
            }
          });
        });
      }

      var delBtns = tbody.querySelectorAll('.btn-del-exp');
      for (var k = 0; k < delBtns.length; k++) {
        delBtns[k].addEventListener('click', function() {
          var id = this.getAttribute('data-id');
          Modal.confirm('Are you sure you want to delete this expense record?', function() {
            window.api.deleteExpense(id).then(function() {
              Toast.show('Expense record deleted', 'success');
              self.loadSummary();
              self.loadExpenses();
            });
          });
        });
      }
    });
  },

  openModal: function(exp) {
    var modal = document.getElementById('expense-modal');
    var title = document.getElementById('exp-modal-title');

    if (exp) {
      title.textContent = 'Edit Expense Record';
      document.getElementById('m-exp-id').value = exp.id;
      document.getElementById('m-exp-date').value = exp.bill_date || DateUtils.today();
      document.getElementById('m-exp-category').value = exp.category || 'General';
      document.getElementById('m-exp-vendor').value = exp.vendor_name || '';
      document.getElementById('m-exp-amount').value = exp.amount || '';
      document.getElementById('m-exp-gst').value = exp.gst_amount || '';
      document.getElementById('m-exp-notes').value = exp.notes || '';
    } else {
      title.textContent = 'Record New Expense';
      document.getElementById('m-exp-id').value = '';
      document.getElementById('m-exp-date').value = DateUtils.today();
      document.getElementById('m-exp-category').value = 'General';
      document.getElementById('m-exp-vendor').value = '';
      document.getElementById('m-exp-amount').value = '';
      document.getElementById('m-exp-gst').value = '';
      document.getElementById('m-exp-notes').value = '';
    }

    modal.style.display = 'flex';
  },

  closeModal: function() {
    document.getElementById('expense-modal').style.display = 'none';
  },

  saveExpense: function() {
    var self = this;
    var id = document.getElementById('m-exp-id').value;
    var date = document.getElementById('m-exp-date').value;
    var cat = document.getElementById('m-exp-category').value;
    var vendor = document.getElementById('m-exp-vendor').value.trim();
    var amount = parseFloat(document.getElementById('m-exp-amount').value) || 0;
    var gst = parseFloat(document.getElementById('m-exp-gst').value) || 0;
    var notes = document.getElementById('m-exp-notes').value.trim();

    if (!vendor) {
      return Toast.show('Vendor / Payee name is required', 'error');
    }
    if (amount <= 0) {
      return Toast.show('Please enter a valid expense amount greater than 0', 'error');
    }

    var payload = {
      bill_date: date || DateUtils.today(),
      category: cat || 'General',
      vendor_name: vendor,
      amount: amount,
      gst_amount: gst,
      notes: notes
    };

    var promise;
    if (id) {
      promise = window.api.updateExpense(id, payload);
    } else {
      promise = window.api.createExpense(payload);
    }

    promise.then(function() {
      Toast.show('Expense saved successfully', 'success');
      self.closeModal();
      self.loadSummary();
      self.loadExpenses();
    }).catch(function(err) {
      Toast.show('Failed to save expense: ' + err.message, 'error');
    });
  }
};
