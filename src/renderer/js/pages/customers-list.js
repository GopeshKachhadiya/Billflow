window.PageControllers = window.PageControllers || {};
window.PageControllers['customers-list'] = {
  init: function() {
    var self = this;
    
    // Bind search and filter events
    var searchInput = document.getElementById('customer-search');
    if (searchInput) {
      searchInput.addEventListener('input', self.debounce(function() {
        self.loadCustomers();
      }, 300));
    }
    
    var activeFilter = document.getElementById('customer-filter-active');
    if (activeFilter) {
      activeFilter.addEventListener('change', function() {
        self.loadCustomers();
      });
    }
    
    var addBtn = document.getElementById('btn-add-customer');
    if (addBtn) {
      addBtn.addEventListener('click', function() {
        window.loadPage('customer-edit', { mode: 'create' });
      });
    }
    
    self.loadCustomers();
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
  
  loadCustomers: function() {
    var self = this;
    var search = document.getElementById('customer-search').value;
    var activeVal = document.getElementById('customer-filter-active').value;
    
    var filter = { search: search };
    if (activeVal === 'active') {
      filter.isActive = true;
    } else if (activeVal === 'inactive') {
      filter.isActive = false;
    }
    
    window.api.listCustomers(filter).then(function(customers) {
      var tbody = document.getElementById('customers-tbody');
      tbody.innerHTML = '';
      
      if (customers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--color-text-muted); padding: 20px;">No customers found.</td></tr>';
        return;
      }
      
      for (var i = 0; i < customers.length; i++) {
        var cust = customers[i];
        var tr = document.createElement('tr');
        tr.innerHTML = 
          '<td style="font-weight: 600;">' + cust.name + '</td>' +
          '<td>' + (cust.email || '—') + '</td>' +
          '<td>' + (cust.phone || '—') + '</td>' +
          '<td>' + (cust.state || '—') + '</td>' +
          '<td style="text-align: center;"><span class="badge badge-' + (cust.is_active ? 'paid' : 'draft') + '">' + (cust.is_active ? 'Active' : 'Inactive') + '</span></td>' +
          '<td style="text-align: right;">' +
            '<button class="btn btn-sm btn-edit" data-id="' + cust.id + '" style="margin-right: 6px;">Edit</button>' +
            '<button class="btn btn-sm btn-danger btn-del" data-id="' + cust.id + '" style="margin-right: 6px;">Delete</button>' +
            '<button class="btn btn-sm btn-view-bills" data-id="' + cust.id + '">View Bills</button>' +
          '</td>';
        tbody.appendChild(tr);
      }
      
      // Bind action buttons
      var editBtns = tbody.querySelectorAll('.btn-edit');
      for (var j = 0; j < editBtns.length; j++) {
        editBtns[j].addEventListener('click', function() {
          var id = this.getAttribute('data-id');
          window.loadPage('customer-edit', { mode: 'edit', customerId: id });
        });
      }
      
      var delBtns = tbody.querySelectorAll('.btn-del');
      for (var k = 0; k < delBtns.length; k++) {
        delBtns[k].addEventListener('click', function() {
          var id = this.getAttribute('data-id');
          Modal.confirm('Are you sure you want to delete this customer? This won\'t delete their existing bills but will soft-delete the customer record.', function() {
            window.api.deleteCustomer(id).then(function() {
              Toast.show('Customer deleted', 'success');
              self.loadCustomers();
            });
          });
        });
      }
      
      var viewBillsBtns = tbody.querySelectorAll('.btn-view-bills');
      for (var l = 0; l < viewBillsBtns.length; l++) {
        viewBillsBtns[l].addEventListener('click', function() {
          var id = this.getAttribute('data-id');
          // Navigate to bills list with customer filter
          window.loadPage('bills-list', { customerId: id });
        });
      }
    });
  }
};
