window.PageControllers = window.PageControllers || {};
window.PageControllers['catalog-list'] = {
  init: function() {
    var self = this;
    
    // Bind search and filter events
    var searchInput = document.getElementById('catalog-search');
    if (searchInput) {
      searchInput.addEventListener('input', self.debounce(function() {
        self.loadItems();
      }, 300));
    }
    
    var activeFilter = document.getElementById('catalog-filter-active');
    if (activeFilter) {
      activeFilter.addEventListener('change', function() {
        self.loadItems();
      });
    }
    
    // Bind action buttons
    var addBtn = document.getElementById('btn-add-item');
    if (addBtn) {
      addBtn.addEventListener('click', function() {
        self.openModal();
      });
    }
    
    var cancelBtn = document.getElementById('btn-modal-cancel');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', function() {
        self.closeModal();
      });
    }
    
    var saveBtn = document.getElementById('btn-modal-save');
    if (saveBtn) {
      saveBtn.addEventListener('click', function() {
        self.saveItem();
      });
    }
    
    self.loadItems();
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
  
  loadItems: function() {
    var self = this;
    var search = document.getElementById('catalog-search').value;
    var activeVal = document.getElementById('catalog-filter-active').value;
    
    var filter = { search: search };
    if (activeVal === 'active') {
      filter.isActive = true;
    } else if (activeVal === 'inactive') {
      filter.isActive = false;
    }
    
    window.api.listItems(filter).then(function(items) {
      var tbody = document.getElementById('catalog-tbody');
      tbody.innerHTML = '';
      
      if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--color-text-muted); padding: 20px;">No items found in catalog.</td></tr>';
        return;
      }
      
      for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var tr = document.createElement('tr');
        tr.innerHTML = 
          '<td style="font-weight: 600;">' + item.name + '</td>' +
          '<td style="color: var(--color-text-muted);">' + (item.description || '—') + '</td>' +
          '<td>' + (item.hsn_sac || '—') + '</td>' +
          '<td>' + (item.unit || 'Nos') + '</td>' +
          '<td style="text-align: right; font-weight: 500;">' + FormatCurrency.toRupees(item.unit_price || 0) + '</td>' +
          '<td style="text-align: right;">' + (item.gst_rate || 0) + '%</td>' +
          '<td style="text-align: center;"><span class="badge badge-' + (item.is_active ? 'paid' : 'draft') + '">' + (item.is_active ? 'Active' : 'Inactive') + '</span></td>' +
          '<td style="text-align: right;">' +
            '<button class="btn btn-sm btn-edit" data-id="' + item.id + '" style="margin-right: 6px;">Edit</button>' +
            '<button class="btn btn-sm btn-danger btn-del" data-id="' + item.id + '">Delete</button>' +
          '</td>';
        tbody.appendChild(tr);
      }
      
      // Bind action buttons inside table
      var editBtns = tbody.querySelectorAll('.btn-edit');
      for (var j = 0; j < editBtns.length; j++) {
        editBtns[j].addEventListener('click', function() {
          var id = this.getAttribute('data-id');
          // Fetch item details and open modal
          window.api.listItems({}).then(function(allItems) {
            var selectedItem = allItems.find(function(x) { return x.id === id; });
            if (selectedItem) {
              self.openModal(selectedItem);
            }
          });
        });
      }
      
      var delBtns = tbody.querySelectorAll('.btn-del');
      for (var k = 0; k < delBtns.length; k++) {
        delBtns[k].addEventListener('click', function() {
          var id = this.getAttribute('data-id');
          Modal.confirm('Are you sure you want to delete this catalog item?', function() {
            window.api.deleteItem(id).then(function() {
              Toast.show('Item deleted', 'success');
              self.loadItems();
            });
          });
        });
      }
    });
  },
  
  openModal: function(item) {
    var modal = document.getElementById('item-modal');
    var title = document.getElementById('modal-title');
    
    if (item) {
      title.textContent = 'Edit Item';
      document.getElementById('m-item-id').value = item.id;
      document.getElementById('m-item-name').value = item.name || '';
      document.getElementById('m-item-desc').value = item.description || '';
      document.getElementById('m-item-hsn').value = item.hsn_sac || '';
      document.getElementById('m-item-unit').value = item.unit || 'Nos';
      document.getElementById('m-item-price').value = item.unit_price || 0.00;
      document.getElementById('m-item-gst').value = item.gst_rate || 18;
      document.getElementById('m-item-active').checked = !!item.is_active;
    } else {
      title.textContent = 'Add New Item';
      document.getElementById('m-item-id').value = '';
      document.getElementById('m-item-name').value = '';
      document.getElementById('m-item-desc').value = '';
      document.getElementById('m-item-hsn').value = '';
      document.getElementById('m-item-unit').value = 'Nos';
      document.getElementById('m-item-price').value = '0.00';
      document.getElementById('m-item-gst').value = '18';
      document.getElementById('m-item-active').checked = true;
    }
    
    modal.style.display = 'flex';
  },
  
  closeModal: function() {
    document.getElementById('item-modal').style.display = 'none';
  },
  
  saveItem: function() {
    var self = this;
    var id = document.getElementById('m-item-id').value;
    var name = document.getElementById('m-item-name').value.trim();
    var desc = document.getElementById('m-item-desc').value.trim();
    var hsn = document.getElementById('m-item-hsn').value.trim();
    var unit = document.getElementById('m-item-unit').value;
    var price = parseFloat(document.getElementById('m-item-price').value) || 0.00;
    var gst = parseFloat(document.getElementById('m-item-gst').value) || 18;
    var active = document.getElementById('m-item-active').checked;
    
    if (!name) {
      return Toast.show('Item name is required', 'error');
    }
    
    var itemData = {
      name: name,
      description: desc,
      hsn_sac: hsn,
      unit: unit,
      unit_price: price,
      gst_rate: gst,
      is_active: active ? 1 : 0
    };
    
    var promise;
    if (id) {
      promise = window.api.updateItem(id, itemData);
    } else {
      promise = window.api.createItem(itemData);
    }
    
    promise.then(function() {
      Toast.show('Catalog item saved successfully', 'success');
      self.closeModal();
      self.loadItems();
    }).catch(function(err) {
      Toast.show('Error saving item: ' + err.message, 'error');
    });
  }
};
