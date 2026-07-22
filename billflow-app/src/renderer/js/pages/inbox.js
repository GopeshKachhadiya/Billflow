(function() {
  window.PageControllers = window.PageControllers || {};

  var state = {
    bills: [],
    selectedBillId: null,
    statusFilter: 'all',
    searchQuery: ''
  };

  function formatCurrency(val) {
    if (window.FormatCurrency && window.FormatCurrency.format) {
      return window.FormatCurrency.format(val);
    }
    return '₹' + (parseFloat(val) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  }

  function formatDate(str) {
    if (window.DateUtils && window.DateUtils.toDisplay) {
      return window.DateUtils.toDisplay(str);
    }
    return str || '—';
  }

  function updateUnreadBadges() {
    if (!window.api || !window.api.getInboxUnreadCount) return;
    window.api.getInboxUnreadCount().then(function(count) {
      var sidebarBadge = document.getElementById('sidebar-inbox-badge');
      var tabBadge = document.getElementById('tab-count-unread');

      if (sidebarBadge) {
        if (count > 0) {
          sidebarBadge.textContent = count;
          sidebarBadge.style.display = 'inline-block';
        } else {
          sidebarBadge.style.display = 'none';
        }
      }
      if (tabBadge) {
        if (count > 0) {
          tabBadge.textContent = count;
          tabBadge.style.display = 'inline-block';
        } else {
          tabBadge.style.display = 'none';
        }
      }
    }).catch(function() {});
  }

  function loadInbox() {
    var masterListEl = document.getElementById('inbox-master-list');
    if (!masterListEl) return;

    window.api.listInboxBills({
      status: state.statusFilter,
      search: state.searchQuery
    }).then(function(bills) {
      state.bills = bills || [];
      renderMasterList();
      updateUnreadBadges();
    }).catch(function(err) {
      masterListEl.innerHTML = '<div style="padding: 20px; color: var(--color-danger); text-align: center;">Failed to load inbox: ' + err.message + '</div>';
    });
  }

  function renderMasterList() {
    var masterListEl = document.getElementById('inbox-master-list');
    var countEl = document.getElementById('inbox-total-count');
    if (!masterListEl) return;

    if (countEl) countEl.textContent = state.bills.length + ' item' + (state.bills.length === 1 ? '' : 's');

    if (state.bills.length === 0) {
      masterListEl.innerHTML = `
        <div style="padding: 40px 20px; text-align: center; color: var(--color-text-muted);">
          <span style="font-size: 32px; display: block; margin-bottom: 8px;">📥</span>
          No incoming bills found in this view.
        </div>
      `;
      renderDetailPanel(null);
      return;
    }

    var html = '';
    state.bills.forEach(function(b) {
      var isSelected = (b.id === state.selectedBillId);
      var isUnread = (b.status === 'unread');

      var statusColor = '#6b7280';
      var statusLabel = b.status.toUpperCase();
      if (b.status === 'unread') { statusColor = '#8b3a3a'; statusLabel = 'UNREAD'; }
      else if (b.status === 'accepted') { statusColor = '#4a6b3e'; statusLabel = 'ACCEPTED'; }
      else if (b.status === 'converted_expense') { statusColor = '#1A56DB'; statusLabel = 'EXPENSE'; }
      else if (b.status === 'rejected') { statusColor = '#dc2626'; statusLabel = 'REJECTED'; }

      var sourceIcon = '📄';
      if (b.source === 'email') sourceIcon = '✉️';
      else if (b.source === 'whatsapp') sourceIcon = '💬';
      else if (b.source === 'webhook') sourceIcon = '⚡';

      html += `
        <div class="inbox-card-item ${isSelected ? 'active' : ''} ${isUnread ? 'unread' : ''}" 
             data-id="${b.id}"
             style="padding: 12px 14px; border-bottom: 1px solid var(--color-border); cursor: pointer; transition: background-color 0.15s ease; position: relative; background-color: ${isSelected ? 'var(--color-surface-elevated)' : (isUnread ? '#fffdf7' : 'transparent')};">
          ${isUnread ? '<span style="position: absolute; top: 14px; left: 6px; width: 6px; height: 6px; border-radius: 50%; background-color: var(--color-danger);"></span>' : ''}
          
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
            <span style="font-weight: ${isUnread ? '700' : '600'}; font-size: 13px; color: var(--color-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px;">
              ${b.sender_name}
            </span>
            <span style="font-family: var(--font-mono); font-size: 12px; font-weight: 700; color: var(--color-primary);">
              ${formatCurrency(b.amount)}
            </span>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: var(--color-text-muted);">
            <span>${sourceIcon} #${b.bill_number} &bull; ${formatDate(b.bill_date)}</span>
            <span style="font-size: 9px; padding: 2px 6px; border-radius: 4px; background-color: ${statusColor}15; color: ${statusColor}; font-weight: 700;">
              ${statusLabel}
            </span>
          </div>
        </div>
      `;
    });

    masterListEl.innerHTML = html;

    // Attach click listeners to cards
    var cardEls = masterListEl.querySelectorAll('.inbox-card-item');
    cardEls.forEach(function(el) {
      el.addEventListener('click', function() {
        var id = el.getAttribute('data-id');
        selectBill(id);
      });
    });

    // Auto-select first bill if none selected
    if (!state.selectedBillId && state.bills.length > 0) {
      selectBill(state.bills[0].id);
    }
  }

  function selectBill(id) {
    state.selectedBillId = id;
    var target = state.bills.find(function(b) { return b.id === id; });

    // Mark as read if currently unread
    if (target && target.status === 'unread') {
      target.status = 'read';
      window.api.updateInboxStatus(id, 'read').then(function() {
        updateUnreadBadges();
      }).catch(function() {});
    }

    renderMasterList();
    renderDetailPanel(target);
  }

  function renderDetailPanel(b) {
    var panelEl = document.getElementById('inbox-detail-panel');
    if (!panelEl) return;

    if (!b) {
      panelEl.innerHTML = `
        <div style="padding: 60px 20px; text-align: center; color: var(--color-text-muted); font-size: 14px;">
          <span style="font-size: 36px; display: block; margin-bottom: 8px;">📬</span>
          Select an incoming bill from the list on the left to inspect details.
        </div>
      `;
      return;
    }

    var statusBadgeHtml = '<span style="padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 700; background:#e5e7eb; color:#374151;">READ</span>';
    if (b.status === 'unread') statusBadgeHtml = '<span style="padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 700; background:#fee2e2; color:#991b1b;">UNREAD</span>';
    else if (b.status === 'accepted') statusBadgeHtml = '<span style="padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 700; background:#dcfce7; color:#166534;">ACCEPTED</span>';
    else if (b.status === 'converted_expense') statusBadgeHtml = '<span style="padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 700; background:#dbeafe; color:#1e40af;">CONVERTED TO EXPENSE</span>';
    else if (b.status === 'rejected') statusBadgeHtml = '<span style="padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 700; background:#fef2f2; color:#b91c1c;">REJECTED</span>';

    panelEl.innerHTML = `
      <!-- Detail Header -->
      <div style="padding: 16px 20px; border-bottom: 1px solid var(--color-border); background-color: var(--color-surface-elevated); display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
            <h2 style="font-family: var(--font-serif); font-size: 18px; font-weight: 700; color: var(--color-primary);">${b.sender_name}</h2>
            ${statusBadgeHtml}
          </div>
          <p style="font-size: 12px; color: var(--color-text-muted);">
            GSTIN: <strong>${b.sender_gstin || '—'}</strong> &bull; Email: <strong>${b.sender_email || '—'}</strong>
          </p>
        </div>
        <div style="text-align: right;">
          <div style="font-family: var(--font-mono); font-size: 20px; font-weight: 800; color: var(--color-primary);">${formatCurrency(b.amount)}</div>
          <div style="font-size: 11px; color: var(--color-text-muted);">GST Tax: ${formatCurrency(b.tax_amount)}</div>
        </div>
      </div>

      <!-- Action Toolbar -->
      <div style="padding: 10px 20px; border-bottom: 1px solid var(--color-border); background-color: #fff; display: flex; gap: 8px; flex-wrap: wrap;">
        ${b.status !== 'converted_expense' ? `
          <button id="btn-action-convert" class="btn btn-sm btn-primary" style="display: flex; align-items: center; gap: 4px;">
            ⚡ Convert to Expense
          </button>
        ` : '<span style="font-size: 12px; color: #1e40af; font-weight: 600; padding: 4px 0;">✓ Recorded as Expense Entry</span>'}
        
        <button id="btn-action-accept" class="btn btn-sm" style="border: 1px solid var(--color-border); background: #f9fafb;">
          ✓ Accept
        </button>
        <button id="btn-action-reject" class="btn btn-sm" style="border: 1px solid #fee2e2; background: #fff5f5; color: #b91c1c;">
          ✕ Reject
        </button>
        <button id="btn-action-unread" class="btn btn-sm" style="border: 1px solid var(--color-border); background: #fff;">
          ✉️ Mark Unread
        </button>
      </div>

      <!-- Detail Body -->
      <div style="flex: 1; padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 16px;">
        <!-- Bill Overview Grid -->
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; background-color: var(--color-surface-elevated); padding: 14px; border-radius: 6px; border: 1px solid var(--color-border); font-size: 12px;">
          <div>
            <span style="color: var(--color-text-muted); display: block; font-size: 11px;">BILL NUMBER</span>
            <strong style="font-size: 13px;">${b.bill_number}</strong>
          </div>
          <div>
            <span style="color: var(--color-text-muted); display: block; font-size: 11px;">BILL DATE</span>
            <strong>${formatDate(b.bill_date)}</strong>
          </div>
          <div>
            <span style="color: var(--color-text-muted); display: block; font-size: 11px;">DUE DATE</span>
            <strong>${formatDate(b.due_date)}</strong>
          </div>
          <div>
            <span style="color: var(--color-text-muted); display: block; font-size: 11px;">SOURCE CHANNEL</span>
            <strong style="text-transform: capitalize;">${b.source}</strong>
          </div>
          <div>
            <span style="color: var(--color-text-muted); display: block; font-size: 11px;">SENDER PHONE</span>
            <strong>${b.sender_phone || '—'}</strong>
          </div>
          <div>
            <span style="color: var(--color-text-muted); display: block; font-size: 11px;">RECEIVED AT</span>
            <strong>${formatDate(b.created_at ? b.created_at.split('T')[0] : '')}</strong>
          </div>
        </div>

        <!-- Notes Section -->
        <div>
          <h4 style="font-size: 12px; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase; margin-bottom: 6px;">Notes / Description</h4>
          <div style="background: #fff; padding: 12px; border-radius: 6px; border: 1px solid var(--color-border); font-size: 13px; min-height: 60px; white-space: pre-wrap;">
            ${b.notes || 'No description attached.'}
          </div>
        </div>
      </div>
    `;

    // Attach Event Listeners for Action Toolbar
    var btnConvert = document.getElementById('btn-action-convert');
    var btnAccept  = document.getElementById('btn-action-accept');
    var btnReject  = document.getElementById('btn-action-reject');
    var btnUnread  = document.getElementById('btn-action-unread');

    if (btnConvert) {
      btnConvert.addEventListener('click', function() {
        btnConvert.disabled = true;
        btnConvert.textContent = 'Converting...';
        window.api.convertInboxToExpense(b.id).then(function(res) {
          if (window.Toast) window.Toast.show('Successfully converted incoming bill to Expense!', 'success');
          loadInbox();
        }).catch(function(err) {
          if (window.Toast) window.Toast.show('Conversion failed: ' + err.message, 'error');
          btnConvert.disabled = false;
        });
      });
    }

    if (btnAccept) {
      btnAccept.addEventListener('click', function() {
        window.api.updateInboxStatus(b.id, 'accepted').then(function() {
          if (window.Toast) window.Toast.show('Bill marked as Accepted', 'success');
          loadInbox();
        });
      });
    }

    if (btnReject) {
      btnReject.addEventListener('click', function() {
        window.api.updateInboxStatus(b.id, 'rejected').then(function() {
          if (window.Toast) window.Toast.show('Bill marked as Rejected', 'info');
          loadInbox();
        });
      });
    }

    if (btnUnread) {
      btnUnread.addEventListener('click', function() {
        window.api.updateInboxStatus(b.id, 'unread').then(function() {
          if (window.Toast) window.Toast.show('Marked as unread', 'info');
          loadInbox();
        });
      });
    }
  }

  function setupModal() {
    var modal = document.getElementById('modal-incoming-bill');
    var btnOpen = document.getElementById('btn-receive-bill');
    var btnClose = document.getElementById('btn-close-incoming-modal');
    var btnCancel = document.getElementById('btn-cancel-incoming');
    var form = document.getElementById('form-incoming-bill');

    if (!modal || !btnOpen) return;

    btnOpen.addEventListener('click', function() {
      // Set today's date default
      var dateEl = document.getElementById('inc-bill-date');
      if (dateEl && !dateEl.value) dateEl.value = new Date().toISOString().split('T')[0];
      modal.style.display = 'flex';
    });

    function closeModal() {
      modal.style.display = 'none';
      if (form) form.reset();
    }

    if (btnClose) btnClose.addEventListener('click', closeModal);
    if (btnCancel) btnCancel.addEventListener('click', closeModal);

    if (form) {
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        var payload = {
          sender_name: document.getElementById('inc-sender-name').value,
          sender_email: document.getElementById('inc-sender-email').value,
          sender_gstin: document.getElementById('inc-sender-gstin').value,
          bill_number: document.getElementById('inc-bill-number').value,
          bill_date: document.getElementById('inc-bill-date').value,
          amount: parseFloat(document.getElementById('inc-amount').value) || 0,
          tax_amount: parseFloat(document.getElementById('inc-tax-amount').value) || 0,
          source: document.getElementById('inc-source').value,
          notes: document.getElementById('inc-notes').value,
          status: 'unread'
        };

        window.api.createInboxBill(payload).then(function(res) {
          if (window.Toast) window.Toast.show('Incoming bill logged to Inbox!', 'success');
          closeModal();
          loadInbox();
        }).catch(function(err) {
          if (window.Toast) window.Toast.show('Failed to log bill: ' + err.message, 'error');
        });
      });
    }
  }

  function setupFilters() {
    var tabsContainer = document.getElementById('inbox-status-tabs');
    if (tabsContainer) {
      var tabs = tabsContainer.querySelectorAll('.tab-filter');
      tabs.forEach(function(tab) {
        tab.addEventListener('click', function() {
          tabs.forEach(function(t) { t.classList.remove('active'); });
          tab.classList.add('active');
          state.statusFilter = tab.getAttribute('data-status');
          state.selectedBillId = null;
          loadInbox();
        });
      });
    }

    var searchInput = document.getElementById('inbox-search-input');
    if (searchInput) {
      var timer = null;
      searchInput.addEventListener('input', function() {
        clearTimeout(timer);
        timer = setTimeout(function() {
          state.searchQuery = searchInput.value;
          loadInbox();
        }, 300);
      });
    }
  }

  window.PageControllers['inbox'] = {
    init: function() {
      state.selectedBillId = null;
      state.statusFilter = 'all';
      state.searchQuery = '';
      setupFilters();
      setupModal();
      loadInbox();
    }
  };
})();
