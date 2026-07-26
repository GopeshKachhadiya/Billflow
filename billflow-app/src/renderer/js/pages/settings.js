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
  var elem = evt && (evt.currentTarget || evt.target);
  var btn = (elem && typeof elem.closest === 'function') ? elem.closest('.tab-link') : null;
  if (!btn && tabId) {
    btn = document.querySelector('.tab-link[data-tab="' + tabId + '"]');
  }
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

    // Tab event listener for CSP compatibility
    var tabNav = document.querySelector('.tab-nav');
    if (tabNav) {
      tabNav.addEventListener('click', function(e) {
        var btn = e.target.closest ? e.target.closest('.tab-link') : null;
        if (btn) {
          var tabId = btn.getAttribute('data-tab');
          if (tabId) {
            window.switchSettingsTab(e, tabId);
          }
        }
      });
    }

    var saveBtn = document.getElementById('btn-save-settings');
    if (saveBtn) {
      saveBtn.addEventListener('click', function() {
        self.saveSettings();
      });
    }

    var btnChooseLogo = document.getElementById('btn-choose-logo');
    if (btnChooseLogo) {
      btnChooseLogo.addEventListener('click', function() {
        var logoInput = document.getElementById('logo-upload');
        if (logoInput) logoInput.click();
      });
    }

    var btnChooseSig = document.getElementById('btn-choose-signature');
    if (btnChooseSig) {
      btnChooseSig.addEventListener('click', function() {
        var sigInput = document.getElementById('signature-upload');
        if (sigInput) sigInput.click();
      });
    }

    var btnChooseUpiQr = document.getElementById('btn-choose-upi-qr');
    if (btnChooseUpiQr) {
      btnChooseUpiQr.addEventListener('click', function() {
        var upiQrInput = document.getElementById('upi-qr-upload');
        if (upiQrInput) upiQrInput.click();
      });
    }



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

    var upiQrUpload = document.getElementById('upi-qr-upload');
    if (upiQrUpload) {
      upiQrUpload.addEventListener('change', function(e) {
        var file = e.target.files[0];
        if (file) {
          var reader = new FileReader();
          reader.onload = function(evt) {
            var base64 = evt.target.result;
            document.getElementById('s-upi_qr_data').value = base64;
            document.getElementById('upi-qr-preview-name').textContent = file.name;
            var preview = document.getElementById('upi-qr-preview-img');
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
        var statesArr = typeof window.StateCodes.getAllStates === 'function' ? window.StateCodes.getAllStates() : (Array.isArray(window.StateCodes) ? window.StateCodes : []);
        if (Array.isArray(statesArr)) {
          selectState.innerHTML = '<option value="">Select State</option>';
          statesArr.forEach(function(st) {
            var opt = document.createElement('option');
            opt.value = st.name;
            opt.textContent = st.name + ' (' + st.code + ')';
            selectState.appendChild(opt);
          });
        }
      }
    }
    // Populate form fields function
    self.populateFields = function() {
      return window.api.getAllSettings().then(function(s) {
        if (!s) return;
        var fields = ['business_name','gstin','business_address','business_city',
                      'business_state','business_pin','pan','bank_name','bank_account',
                      'bank_ifsc','bill_prefix','default_gst_rate',
                      'email_from_name','email_from_address','smtp_host','smtp_port',
                      'smtp_user','smtp_pass','accountant_email',
                      'notify_owner_phone','wati_api_url','wati_api_token','msg91_auth_key','msg91_sender_id',
                      'logo_data', 'signature_data', 'upi_qr_data',
                      'business_phone', 'business_email', 'business_udyam',
                      'business_category', 'business_status', 'upi_id', 'invoice_tagline'];
        for (var i = 0; i < fields.length; i++) {
          var key = fields[i];
          var val = s[key] || '';
          if (key === 'business_state' && val && window.StateCodes) {
            var statesArr = typeof window.StateCodes.getAllStates === 'function' ? window.StateCodes.getAllStates() : (Array.isArray(window.StateCodes) ? window.StateCodes : []);
            var stMatch = Array.isArray(statesArr) ? statesArr.find(function(st) { return st.name === val || st.code === val; }) : null;
            if (stMatch) val = stMatch.name;
          }
          var els = document.querySelectorAll('[id="s-' + key + '"]');
          for (var j = 0; j < els.length; j++) {
            els[j].value = val;
          }
        }

        // Update image previews if data exists
        if (s.logo_data) {
          var logoPreview = document.getElementById('logo-preview-img');
          if (logoPreview) {
            logoPreview.src = s.logo_data;
            logoPreview.style.display = 'block';
            var nameEl = document.getElementById('logo-preview-name');
            if (nameEl) nameEl.textContent = 'Saved logo';
          }
        }
        if (s.signature_data) {
          var sigPreview = document.getElementById('signature-preview-img');
          if (sigPreview) {
            sigPreview.src = s.signature_data;
            sigPreview.style.display = 'block';
            var sigNameEl = document.getElementById('signature-preview-name');
            if (sigNameEl) sigNameEl.textContent = 'Saved signature';
          }
        }
        if (s.upi_qr_data) {
          var upiQrPreview = document.getElementById('upi-qr-preview-img');
          if (upiQrPreview) {
            upiQrPreview.src = s.upi_qr_data;
            upiQrPreview.style.display = 'block';
            var upiQrNameEl = document.getElementById('upi-qr-preview-name');
            if (upiQrNameEl) upiQrNameEl.textContent = 'Saved QR code';
          }
        }

        // Toggles
        function setToggle(id, key) {
          var els = document.querySelectorAll('[id="' + id + '"]');
          for (var k = 0; k < els.length; k++) {
            els[k].checked = s[key] === '1';
          }
        }
        setToggle('s-wati-enabled',          'wati_enabled');
        setToggle('s-sms-enabled',           'sms_enabled');
        setToggle('s-notify-whatsapp',       'notify_owner_whatsapp');
        setToggle('s-notify-daily-summary',  'notify_daily_summary');
        setToggle('s-notify-weekly-report',  'notify_weekly_report');
        setToggle('s-notify-monthly-gst',    'notify_monthly_gst');

        var langEls = document.querySelectorAll('[id="s-app_language"]');
        if (window.i18n) {
          for (var l1 = 0; l1 < langEls.length; l1++) {
            langEls[l1].value = window.i18n.getLanguage();
          }
        }
        return s;
      });
    };

    self.populateFields();

    var langEls = document.querySelectorAll('[id="s-app_language"]');
    if (window.i18n) {
      for (var l2 = 0; l2 < langEls.length; l2++) {
        langEls[l2].value = window.i18n.getLanguage();
        langEls[l2].addEventListener('change', function(e) {
          window.i18n.setLanguage(e.target.value);
        });
      }
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

    // Initialize Updates UI & Version Display
    self.initUpdateUI();
  },

  initUpdateUI: function() {
    var versionEl = document.getElementById('app-current-version');
    if (versionEl && window.api && window.api.getVersion) {
      window.api.getVersion().then(function(v) {
        if (v) versionEl.textContent = 'v' + v;
      }).catch(function() {});
    }

    var checkBtn = document.getElementById('btn-check-updates');
    var restartBtn = document.getElementById('btn-restart-install');
    var statusText = document.getElementById('update-status-text');
    var progressContainer = document.getElementById('update-progress-container');
    var progressBar = document.getElementById('update-progress-bar');
    var progressText = document.getElementById('update-progress-text');

    if (checkBtn) {
      checkBtn.onclick = function() {
        checkBtn.disabled = true;
        if (statusText) statusText.textContent = 'Status: Checking GitHub Releases for updates...';
        if (progressContainer) progressContainer.style.display = 'none';

        window.api.checkForUpdates().then(function(res) {
          checkBtn.disabled = false;
          if (!res || !res.ok) {
            if (statusText) statusText.textContent = 'Status: ' + (res && res.error ? res.error : 'Failed to connect to update server.');
          }
        }).catch(function(err) {
          checkBtn.disabled = false;
          if (statusText) statusText.textContent = 'Status: ' + (err.message || 'Error checking for updates.');
        });
      };
    }

    if (restartBtn) {
      restartBtn.onclick = function() {
        if (window.api && window.api.quitAndInstall) {
          window.api.quitAndInstall();
        }
      };
    }

    if (window._updateStatusUnsubscribe) {
      window._updateStatusUnsubscribe();
    }

    if (window.api && window.api.onUpdateStatus) {
      window._updateStatusUnsubscribe = window.api.onUpdateStatus(function(data) {
        if (!statusText) return;
        if (data.status === 'checking') {
          statusText.textContent = 'Status: Checking for new updates...';
          if (progressContainer) progressContainer.style.display = 'none';
        } else if (data.status === 'available') {
          statusText.textContent = 'Status: New update (v' + (data.info && data.info.version || '') + ') available! Downloading in background...';
          if (progressContainer) progressContainer.style.display = 'block';
        } else if (data.status === 'not-available') {
          statusText.textContent = 'Status: 🎉 Satya BillFlow is up to date! (Latest version installed)';
          if (progressContainer) progressContainer.style.display = 'none';
          if (checkBtn) checkBtn.disabled = false;
        } else if (data.status === 'downloading') {
          var pct = Math.round(data.progress ? data.progress.percent : 0);
          statusText.textContent = 'Status: Downloading update (' + pct + '%)...';
          if (progressContainer) progressContainer.style.display = 'block';
          if (progressBar) progressBar.style.width = pct + '%';
          if (progressText) progressText.textContent = pct + '%';
        } else if (data.status === 'downloaded') {
          statusText.textContent = 'Status: ✅ Update (v' + (data.info && data.info.version || '') + ') ready to install!';
          if (progressContainer) progressContainer.style.display = 'none';
          if (restartBtn) restartBtn.style.display = 'block';
          if (checkBtn) checkBtn.disabled = false;
        } else if (data.status === 'error') {
          statusText.textContent = 'Status: ' + (data.message || 'Update check completed.');
          if (progressContainer) progressContainer.style.display = 'none';
          if (checkBtn) checkBtn.disabled = false;
        }
      });
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
                  'notify_owner_phone',
                  'wati_api_url','wati_api_token','msg91_auth_key','msg91_sender_id',
                  'logo_data', 'signature_data', 'upi_qr_data',
                  'business_phone', 'business_email', 'business_udyam',
                  'business_category', 'business_status', 'upi_id', 'app_language', 'invoice_tagline'];
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
      var key = fields[i];
      var els = document.querySelectorAll('[id="s-' + key + '"]');
      var val = '';
      for (var j = 0; j < els.length; j++) {
        if (els[j].value !== undefined && els[j].value !== null) { val = els[j].value; break; }
      }
      obj[key] = val;
    }
    for (var k = 0; k < toggles.length; k++) {
      var tel = document.getElementById(toggles[k].el);
      if (tel) obj[toggles[k].key] = tel.checked ? '1' : '0';
    }

    if (obj.business_state && window.StateCodes) {
      var found = window.StateCodes.find(function(x) { return x.name === obj.business_state || x.code === obj.business_state; });
      if (found) { obj.business_state_code = found.code; }
    }

    var saveBtn = document.getElementById('btn-save-settings');
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';
    }

    var self = this;
    window.api.setMultipleSettings(obj).then(function() {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Settings';
      }
      if (window.Toast) window.Toast.show('Settings saved permanently!', 'success');
      if (window.api.settingsUpdated) window.api.settingsUpdated(obj);
      if (typeof self.populateFields === 'function') self.populateFields();
    }).catch(function(err) {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Settings';
      }
      if (window.Toast) window.Toast.show('Save failed: ' + (err.message || err), 'error');
    });
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
