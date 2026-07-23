// ES5 — Settings page controller
window.switchSettingsTab = function(evt, tabId) {
  if (evt && evt.preventDefault) evt.preventDefault();
  var tabPanes = document.querySelectorAll(".settings-tab-pane");
  for (var i = 0; i < tabPanes.length; i++) {
    tabPanes[i].style.display = "none";
  }
  var tabLinks = document.querySelectorAll(".tab-nav .tab-link");
  for (var i = 0; i < tabLinks.length; i++) {
    tabLinks[i].classList.remove("active");
    tabLinks[i].style.color = "var(--color-text-muted)";
    tabLinks[i].style.borderBottom = "none";
    tabLinks[i].style.fontWeight = "500";
  }
  var target = document.getElementById(tabId);
  if (target) target.style.display = "block";
  var btn = (evt && (evt.currentTarget || evt.target)) ? (evt.currentTarget || evt.target).closest('.tab-link') : null;
  if (btn) {
    btn.classList.add("active");
    btn.style.color = "var(--color-primary)";
    btn.style.borderBottom = "2px solid var(--color-primary)";
    btn.style.fontWeight = "600";
  }
};

window.PageControllers = window.PageControllers || {};
window.PageControllers['settings'] = {
  init: function() {
    var self = this;
    // WhatsApp Local Link Setup
    var connectBtn = document.getElementById('btn-wa-connect');
    var disconnectBtn = document.getElementById('btn-wa-disconnect');
    
    if (connectBtn) {
      connectBtn.onclick = function() {
        connectBtn.disabled = true;
        connectBtn.textContent = 'Connecting...';
        window.api.waConnect();
      };
    }
    
    if (disconnectBtn) {
      disconnectBtn.onclick = function() {
        if (confirm('Are you sure you want to disconnect your WhatsApp account?')) {
          disconnectBtn.disabled = true;
          window.api.waDisconnect().then(function() {
            disconnectBtn.disabled = false;
          });
        }
      };
    }

    if (window._waStatusUnsubscribe) {
      window._waStatusUnsubscribe();
    }
    window._waStatusUnsubscribe = window.api.onWaStatusChange(function(update) {
      self.updateWaUI(update);
    });

    // Initial status check
    window.api.waGetStatus().then(function(res) {
      self.updateWaUI(res);
    });

    // Logo & Signature upload event handlers
    var logoUpload = document.getElementById('logo-upload');
    if (logoUpload) {
      logoUpload.addEventListener('change', function(e) {
        var file = e.target.files[0];
        if (file) {
          var reader = new FileReader();
          reader.onload = function(evt) {
            var base64 = evt.target.result;
            document.getElementById('s-logo_data').value = base64;
            document.getElementById('logo-preview-name').textContent = file.name;
            var preview = document.getElementById('logo-preview-img');
            if (preview) {
              preview.src = base64;
              preview.style.display = 'block';
            }
          };
          reader.readAsDataURL(file);
        }
      });
    }

    var sigUpload = document.getElementById('signature-upload');
    if (sigUpload) {
      sigUpload.addEventListener('change', function(e) {
        var file = e.target.files[0];
        if (file) {
          var reader = new FileReader();
          reader.onload = function(evt) {
            var base64 = evt.target.result;
            document.getElementById('s-signature_data').value = base64;
            document.getElementById('signature-preview-name').textContent = file.name;
            var preview = document.getElementById('signature-preview-img');
            if (preview) {
              preview.src = base64;
              preview.style.display = 'block';
            }
          };
          reader.readAsDataURL(file);
        }
      });
    }

    if (window.StateCodes) {
      var selectState = document.getElementById('s-business_state');
      if (selectState) {
        selectState.innerHTML = '<option value="">Select State</option>';
        window.StateCodes.forEach(function(st) {
          var opt = document.createElement('option');
          opt.value = st.name;
          opt.textContent = st.name + ' (' + st.code + ')';
          selectState.appendChild(opt);
        });
      }
    }
    window.api.getAllSettings().then(function(s) {
      // Populate all fields from settings
      var fields = ['business_name','gstin','business_address','business_city',
                    'business_state','business_pin','pan','bank_name','bank_account',
                    'bank_ifsc','bill_prefix','default_gst_rate',
                    'email_from_name','email_from_address','smtp_host','smtp_port',
                    'smtp_user','accountant_email',
                    'n8n_base_url','n8n_secret',
                    'notify_owner_phone','wati_api_url','msg91_sender_id',
                    'logo_data', 'signature_data',
                    'business_phone', 'business_email', 'business_udyam',
                    'business_category', 'business_status', 'upi_id'];
      for (var i = 0; i < fields.length; i++) {
        var el = document.getElementById('s-' + fields[i]);
        if (el) el.value = s[fields[i]] || '';
      }

      // Update image previews if data exists
      if (s.logo_data) {
        var logoPreview = document.getElementById('logo-preview-img');
        if (logoPreview) {
          logoPreview.src = s.logo_data;
          logoPreview.style.display = 'block';
          document.getElementById('logo-preview-name').textContent = 'Saved logo';
        }
      }
      if (s.signature_data) {
        var sigPreview = document.getElementById('signature-preview-img');
        if (sigPreview) {
          sigPreview.src = s.signature_data;
          sigPreview.style.display = 'block';
          document.getElementById('signature-preview-name').textContent = 'Saved signature';
        }
      }

      // Toggles
      function setToggle(id, key) {
        var el = document.getElementById(id);
        if (el) el.checked = s[key] === '1';
      }
      setToggle('s-wati-enabled',          'wati_enabled');
      setToggle('s-sms-enabled',           'sms_enabled');
      setToggle('s-notify-whatsapp',       'notify_owner_whatsapp');
      setToggle('s-notify-daily-summary',  'notify_daily_summary');
      setToggle('s-notify-weekly-report',  'notify_weekly_report');
      setToggle('s-notify-monthly-gst',    'notify_monthly_gst');
    });

    // Save button
    var saveBtn = document.getElementById('btn-save-settings');
    if (saveBtn) {
      saveBtn.addEventListener('click', function() {
        self.saveSettings();
      });
    }

    // Auto-populate n8n webhook URLs when base URL changes
    var n8nUrlEl = document.getElementById('s-n8n_base_url');
    if (n8nUrlEl) {
      n8nUrlEl.addEventListener('blur', function() {
        self.autoFillN8nUrls(this.value);
      });
    }
    // Attach live validation on blur for key fields
    if (window.FormValidator) {
      FormValidator.attachLiveValidation('s-gstin', 'gstin');
      FormValidator.attachLiveValidation('s-pan', 'pan');
      FormValidator.attachLiveValidation('s-business_pin', 'pin');
      FormValidator.attachLiveValidation('s-bank_ifsc', 'ifsc');
      FormValidator.attachLiveValidation('s-business_phone', 'phone');
      FormValidator.attachLiveValidation('s-business_email', 'email');
      FormValidator.attachLiveValidation('s-email_from_address', 'email');
      FormValidator.attachLiveValidation('s-accountant_email', 'email');
      FormValidator.attachLiveValidation('s-upi_id', 'upi');
    }
  },

  saveSettings: function() {
    // ── Validate before saving ──────────────────────────────────────────────
    if (window.FormValidator) {
      var validationChecks = [
        FormValidator.validateField(document.getElementById('s-gstin'), 'gstin'),
        FormValidator.validateField(document.getElementById('s-pan'), 'pan'),
        FormValidator.validateField(document.getElementById('s-business_pin'), 'pin'),
        FormValidator.validateField(document.getElementById('s-bank_ifsc'), 'ifsc'),
        FormValidator.validateField(document.getElementById('s-business_phone'), 'phone'),
        FormValidator.validateField(document.getElementById('s-business_email'), 'email'),
        FormValidator.validateField(document.getElementById('s-email_from_address'), 'email'),
        FormValidator.validateField(document.getElementById('s-accountant_email'), 'email'),
        FormValidator.validateField(document.getElementById('s-upi_id'), 'upi')
      ];

      var hasErrors = false;
      for (var v = 0; v < validationChecks.length; v++) {
        if (!validationChecks[v].valid) { hasErrors = true; }
      }
      if (hasErrors) {
        Toast.show('Please fix validation errors before saving', 'error');
        return;
      }
    }
    // ── End validation ──────────────────────────────────────────────────────

    var fields = ['business_name','gstin','business_address','business_city',
                  'business_state','business_pin','pan','bank_name','bank_account',
                  'bank_ifsc','bill_prefix','default_gst_rate',
                  'email_from_name','email_from_address','smtp_host','smtp_port',
                  'smtp_user','smtp_pass','accountant_email',
                  'n8n_base_url','n8n_secret','notify_owner_phone',
                  'wati_api_url','wati_api_token','msg91_auth_key','msg91_sender_id',
                  'logo_data', 'signature_data',
                  'business_phone', 'business_email', 'business_udyam',
                  'business_category', 'business_status', 'upi_id'];
    var toggles = [
      { el: 's-wati-enabled',         key: 'wati_enabled' },
      { el: 's-sms-enabled',          key: 'sms_enabled' },
      { el: 's-notify-whatsapp',      key: 'notify_owner_whatsapp' },
      { el: 's-notify-daily-summary', key: 'notify_daily_summary' },
      { el: 's-notify-weekly-report', key: 'notify_weekly_report' },
      { el: 's-notify-monthly-gst',   key: 'notify_monthly_gst' }
    ];

    var obj = {};
    for (var i = 0; i < fields.length; i++) {
      var el = document.getElementById('s-' + fields[i]);
      if (el) obj[fields[i]] = el.value;
    }
    for (var j = 0; j < toggles.length; j++) {
      var tel = document.getElementById(toggles[j].el);
      if (tel) obj[toggles[j].key] = tel.checked ? '1' : '0';
    }

    if (obj.business_state && window.StateCodes) {
      var found = window.StateCodes.find(function(x) { return x.name === obj.business_state; });
      if (found) { obj.business_state_code = found.code; }
    }

    window.api.setMultipleSettings(obj).then(function() {
      Toast.show('Settings saved', 'success');
      window.api.settingsUpdated(obj);
    }).catch(function(err) {
      Toast.show('Save failed: ' + err.message, 'error');
    });
  },

  autoFillN8nUrls: function(base) {
    base = base.replace(/\/$/, '');
    var paths = {
      'n8n_wh_bill_created':  '/webhook/bill-created',
      'n8n_wh_bill_sent':     '/webhook/bill-send',
      'n8n_wh_bill_paid':     '/webhook/bill-paid',
      'n8n_wh_bill_cancelled':'/webhook/bill-cancelled',
      'n8n_wh_customer_saved':'/webhook/customer-saved',
      'n8n_wh_item_saved':    '/webhook/item-saved',
      'n8n_wh_sync_push':     '/webhook/sync-push',
      'n8n_wh_report_request':'/webhook/report-request',
      'n8n_wh_settings':      '/webhook/settings-updated'
    };
    var obj = {};
    for (var key in paths) {
      if (paths.hasOwnProperty(key)) obj[key] = base + paths[key];
    }
    window.api.setMultipleSettings(obj);
    Toast.show('n8n webhook URLs updated', 'info');
  },

  updateWaUI: function(res) {
    var statusEl = document.getElementById('wa-link-status');
    var connectBtn = document.getElementById('btn-wa-connect');
    var disconnectBtn = document.getElementById('btn-wa-disconnect');
    var qrContainer = document.getElementById('wa-qr-container');
    var qrCodeEl = document.getElementById('wa-qr-code');

    if (!statusEl) return;

    if (res.status === 'linked') {
      statusEl.textContent = 'Linked to phone number: ' + (res.user || 'connected');
      statusEl.style.color = '#2c5f2e'; // ledger-green
      if (connectBtn) connectBtn.style.display = 'none';
      if (disconnectBtn) {
        disconnectBtn.style.display = 'inline-block';
        disconnectBtn.disabled = false;
      }
      if (qrContainer) qrContainer.style.display = 'none';
    } else if (res.status === 'qr') {
      statusEl.textContent = 'Awaiting scan...';
      statusEl.style.color = '#8b7233'; // aged-gold
      if (connectBtn) connectBtn.style.display = 'none';
      if (disconnectBtn) disconnectBtn.style.display = 'inline-block';
      if (qrContainer) {
        qrContainer.style.display = 'flex';
        qrCodeEl.innerHTML = '';
        if (typeof QRCode !== 'undefined') {
          new QRCode(qrCodeEl, {
            text: res.qr,
            width: 128,
            height: 128,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.M
          });
        } else {
          qrCodeEl.textContent = res.qr;
        }
      }
    } else if (res.status === 'connecting') {
      statusEl.textContent = 'Connecting to WhatsApp Web...';
      statusEl.style.color = '#7a6850'; // ink-500
      if (connectBtn) {
        connectBtn.style.display = 'inline-block';
        connectBtn.disabled = true;
        connectBtn.textContent = 'Connecting...';
      }
      if (disconnectBtn) disconnectBtn.style.display = 'none';
      if (qrContainer) qrContainer.style.display = 'none';
    } else {
      statusEl.textContent = 'Not linked. Click Link Account to scan QR code.';
      statusEl.style.color = '#8b3a2a'; // rubber-red
      if (connectBtn) {
        connectBtn.style.display = 'inline-block';
        connectBtn.disabled = false;
        connectBtn.textContent = 'Link Account';
      }
      if (disconnectBtn) disconnectBtn.style.display = 'none';
      if (qrContainer) qrContainer.style.display = 'none';
    }
  }
};
