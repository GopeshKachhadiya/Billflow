// ES5 — Settings page controller
window.switchSettingsTab = function(evt, tabId) {
  var tabPanes = document.getElementsByClassName("settings-tab-pane");
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
  if (evt && evt.currentTarget) {
    evt.currentTarget.classList.add("active");
    evt.currentTarget.style.color = "var(--color-primary)";
    evt.currentTarget.style.borderBottom = "2px solid var(--color-primary)";
    evt.currentTarget.style.fontWeight = "600";
  }
};

window.PageControllers = window.PageControllers || {};
window.PageControllers['settings'] = {
  init: function() {
    var self = this;
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
                    'notify_owner_phone','wati_api_url','msg91_sender_id'];
      for (var i = 0; i < fields.length; i++) {
        var el = document.getElementById('s-' + fields[i]);
        if (el) el.value = s[fields[i]] || '';
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
  },

  saveSettings: function() {
    var fields = ['business_name','gstin','business_address','business_city',
                  'business_state','business_pin','pan','bank_name','bank_account',
                  'bank_ifsc','bill_prefix','default_gst_rate',
                  'email_from_name','email_from_address','smtp_host','smtp_port',
                  'smtp_user','smtp_pass','accountant_email',
                  'n8n_base_url','n8n_secret','notify_owner_phone',
                  'wati_api_url','wati_api_token','msg91_auth_key','msg91_sender_id'];
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
  }
};
