window.PageControllers = window.PageControllers || {};
window.PageControllers['customer-edit'] = {
  _mode: 'create',
  _customerId: null,
  
  init: function(params) {
    var self = this;
    self._mode = (params && params.mode) || 'create';
    self._customerId = params && params.customerId;
    
    // Fill states dropdown
    var stateSelect = document.getElementById('c-state');
    if (stateSelect && window.StateCodes) {
      stateSelect.innerHTML = '<option value="">Select State</option>';
      window.StateCodes.forEach(function(st) {
        var opt = document.createElement('option');
        opt.value = st.name;
        opt.textContent = st.name + ' (' + st.code + ')';
        stateSelect.appendChild(opt);
      });
    }
    
    // Bind GSTIN validation on blur and fetch button
    var gstinInput = document.getElementById('c-gstin');
    var fetchBtn = document.getElementById('btn-fetch-gstin');
    if (gstinInput) {
      gstinInput.addEventListener('input', function() {
        self.validateGSTINInput();
      });
      gstinInput.addEventListener('blur', function() {
        self.validateGSTINInput();
      });
      gstinInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (fetchBtn) fetchBtn.click();
        }
      });
    }
    if (fetchBtn) {
      fetchBtn.addEventListener('click', function() {
        self.fetchGSTDetails();
      });
    }
    
    // Bind buttons
    var cancelBtn = document.getElementById('btn-cancel');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', function() {
        window.loadPage('customers-list');
      });
    }
    
    var saveBtn = document.getElementById('btn-save');
    if (saveBtn) {
      saveBtn.addEventListener('click', function() {
        self.saveCustomer();
      });
    }

    // Attach live validation for key fields
    if (window.FormValidator) {
      FormValidator.attachLiveValidation('c-phone', 'phone');
      FormValidator.attachLiveValidation('c-email', 'email');
    }
    
    if (self._mode === 'edit' && self._customerId) {
      document.getElementById('page-title').textContent = 'Edit Customer';
      window.api.getCustomer(self._customerId).then(function(cust) {
        if (cust) {
          document.getElementById('c-id').value = cust.id || '';
          document.getElementById('c-name').value = cust.name || '';
          document.getElementById('c-type').value = cust.type || 'Business';
          document.getElementById('c-gstin').value = cust.gstin || '';
          document.getElementById('c-email').value = cust.email || '';
          document.getElementById('c-phone').value = cust.phone || '';
          document.getElementById('c-state').value = cust.state || '';
          document.getElementById('c-payment_terms').value = cust.payment_terms || 'due_on_receipt';
          document.getElementById('c-address').value = cust.address || '';
          document.getElementById('c-notes').value = cust.notes || '';
          document.getElementById('c-is_active').checked = cust.is_active !== 0;
        }
      });
    } else {
      document.getElementById('page-title').textContent = 'Add Customer';
      document.getElementById('c-id').value = '';
      document.getElementById('c-name').value = '';
      document.getElementById('c-type').value = 'Business';
      document.getElementById('c-gstin').value = '';
      document.getElementById('c-email').value = '';
      document.getElementById('c-phone').value = '';
      document.getElementById('c-state').value = '';
      document.getElementById('c-payment_terms').value = 'due_on_receipt';
      document.getElementById('c-address').value = '';
      document.getElementById('c-notes').value = '';
      document.getElementById('c-is_active').checked = true;
    }
  },
  
  isValidGSTIN: function(gstin) {
    if (!gstin) return false;
    gstin = gstin.trim().toUpperCase();
    if (gstin.length !== 15) return false;
    var regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!regex.test(gstin)) return false;
    var stateCode = parseInt(gstin.substring(0, 2), 10);
    if (stateCode < 1 || stateCode > 38) return false;
    return true;
  },
  
  validateGSTINInput: function() {
    var gstinInput = document.getElementById('c-gstin');
    var errorSpan = document.getElementById('gstin-error');
    if (!gstinInput) return true;
    
    var val = gstinInput.value.trim();
    if (val === '') {
      gstinInput.style.borderColor = '';
      if (errorSpan) errorSpan.style.display = 'none';
      return true;
    }
    
    if (this.isValidGSTIN(val)) {
      gstinInput.style.borderColor = 'var(--color-success)';
      if (errorSpan) errorSpan.style.display = 'none';
      return true;
    } else {
      gstinInput.style.borderColor = 'var(--color-danger)';
      if (errorSpan) errorSpan.style.display = 'block';
      return false;
    }
  },
  
  fetchGSTDetails: function() {
    var self = this;
    var gstinInput = document.getElementById('c-gstin');
    var fetchBtn = document.getElementById('btn-fetch-gstin');
    var loadingSpan = document.getElementById('gstin-loading');
    var errorSpan = document.getElementById('gstin-error');
    
    if (!gstinInput) return;
    var val = gstinInput.value.trim().toUpperCase();
    
    if (val === '') {
      return Toast.show('Please enter a GSTIN first', 'warning');
    }
    
    if (!self.isValidGSTIN(val)) {
      if (gstinInput) gstinInput.style.borderColor = 'var(--color-danger)';
      if (errorSpan) errorSpan.style.display = 'block';
      return Toast.show('Please enter a valid GSTIN format', 'error');
    }
    
    // Valid GSTIN - trigger lookup
    if (gstinInput) gstinInput.style.borderColor = 'var(--color-success)';
    if (errorSpan) errorSpan.style.display = 'none';
    if (loadingSpan) loadingSpan.style.display = 'block';
    if (fetchBtn) fetchBtn.disabled = true;
    
    window.api.fetchGSTINDetails(val).then(function(data) {
      if (loadingSpan) loadingSpan.style.display = 'none';
      if (fetchBtn) fetchBtn.disabled = false;
      
      if (data) {
        // Pre-populate fields
        document.getElementById('c-name').value = data.name || '';
        document.getElementById('c-type').value = data.type || 'Business';
        document.getElementById('c-email').value = data.email || '';
        document.getElementById('c-phone').value = data.phone || '';
        document.getElementById('c-state').value = data.state || '';
        document.getElementById('c-address').value = data.billing_address || '';
        if (data.notes) {
          var notesEl = document.getElementById('c-notes');
          if (notesEl && notesEl.value.trim() === '') {
            notesEl.value = data.notes;
          }
        }
        if (data.payment_terms) {
          document.getElementById('c-payment_terms').value = data.payment_terms;
        }
        
        Toast.show('Details successfully fetched for ' + data.name, 'success');
      } else {
        Toast.show('No details found for the entered GSTIN', 'warning');
      }
    }).catch(function(err) {
      if (loadingSpan) loadingSpan.style.display = 'none';
      if (fetchBtn) fetchBtn.disabled = false;
      Toast.show('GST lookup failed: ' + err.message, 'error');
    });
  },
  
  saveCustomer: function() {
    var self = this;
    var name = document.getElementById('c-name').value.trim();
    var type = document.getElementById('c-type').value;
    var gstin = document.getElementById('c-gstin').value.trim().toUpperCase();
    var email = document.getElementById('c-email').value.trim();
    var phone = document.getElementById('c-phone').value.trim();
    var state = document.getElementById('c-state').value;
    var paymentTerms = document.getElementById('c-payment_terms').value;
    var address = document.getElementById('c-address').value.trim();
    var notes = document.getElementById('c-notes').value.trim();
    var isActive = document.getElementById('c-is_active').checked ? 1 : 0;
    
    if (!name) {
      return Toast.show('Customer name is required', 'error');
    }
    if (!phone) {
      return Toast.show('Phone number is required', 'error');
    }

    // Validate phone/email formats using FormValidator
    if (window.FormValidator) {
      var phoneCheck = FormValidator.validateField(document.getElementById('c-phone'), 'phone');
      var emailCheck = FormValidator.validateField(document.getElementById('c-email'), 'email');
      if (!phoneCheck.valid || !emailCheck.valid) {
        return Toast.show('Please fix validation errors before saving', 'error');
      }
    }
    
    // Validate GSTIN format if entered
    if (gstin && !self.validateGSTINInput()) {
      return Toast.show('Please fix the invalid GSTIN format', 'error');
    }
    
    // Find state code
    var stateCode = '';
    if (window.StateCodes) {
      var found = window.StateCodes.find(function(x) { return x.name === state; });
      if (found) { stateCode = found.code; }
    }
    
    var customerData = {
      name: name,
      type: type,
      gstin: gstin,
      email: email,
      phone: phone,
      state: state,
      state_code: stateCode,
      payment_terms: paymentTerms,
      address: address,
      notes: notes,
      is_active: isActive
    };
    
    var promise;
    if (self._mode === 'edit' && self._customerId) {
      promise = window.api.updateCustomer(self._customerId, customerData);
    } else {
      promise = window.api.createCustomer(customerData);
    }
    
    promise.then(function() {
      Toast.show('Customer saved successfully', 'success');
      window.loadPage('customers-list');
    }).catch(function(err) {
      Toast.show('Save failed: ' + err.message, 'error');
    });
  }
};
