window.PageControllers = window.PageControllers || {};
window.PageControllers['dashboard'] = {
  init: function() {
    window.api.getDashboardSummary().then(function(data) {
      document.getElementById('card-total').textContent  = data.counts.total  || 0;
      document.getElementById('card-paid').textContent   = FormatCurrency.toRupees(data.month_revenue || 0);
      document.getElementById('card-unpaid').textContent = FormatCurrency.toRupees(data.unpaid_total  || 0);
      document.getElementById('card-overdue').textContent = data.counts.overdue || 0;

      var tbody = document.getElementById('recent-bills-body');
      tbody.innerHTML = '';
      var bills = data.recent_bills || [];
      
      if (bills.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--color-text-muted);">No bills found. Create your first bill to get started!</td></tr>';
        return;
      }

      for (var i = 0; i < bills.length; i++) {
        var b  = bills[i];
        var tr = document.createElement('tr');
        tr.innerHTML =
          '<td><a href="#" class="bill-link" data-id="' + b.id + '" style="color: var(--color-primary); font-weight: 600; text-decoration: none;">' + b.bill_number + '</a></td>' +
          '<td>' + (b.customer_name || '—') + '</td>' +
          '<td>' + DateUtils.toDisplay(b.bill_date) + '</td>' +
          '<td>' + FormatCurrency.toRupees(b.grand_total) + '</td>' +
          '<td><span class="badge badge-' + b.status + '">' + b.status + '</span></td>';
        tbody.appendChild(tr);
      }

      var links = tbody.querySelectorAll('.bill-link');
      for (var j = 0; j < links.length; j++) {
        links[j].addEventListener('click', function(e) {
          e.preventDefault();
          window.loadPage('bill-view', { billId: this.getAttribute('data-id') });
        });
      }
    }).catch(function(err) {
      console.error('Dashboard load failed:', err);
    });

    var newBillBtn = document.getElementById('btn-new-bill');
    if (newBillBtn) {
      newBillBtn.addEventListener('click', function() {
        window.loadPage('bill-edit', { mode: 'create' });
      });
    }
    var newCustBtn = document.getElementById('btn-new-customer');
    if (newCustBtn) {
      newCustBtn.addEventListener('click', function() {
        window.loadPage('customer-edit', { mode: 'create' });
      });
    }
  }
};
