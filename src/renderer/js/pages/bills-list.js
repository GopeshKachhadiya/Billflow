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

    var importBtn = document.getElementById('btn-import-bills');
    if (importBtn) {
      importBtn.addEventListener('click', function() {
        window.loadPage('bills-import');
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
              (bill.status === 'sent' || bill.status === 'overdue' ? '<button class="btn btn-sm btn-warning btn-remind" style="margin-right: 6px; background-color: var(--color-warning); color: #fff; border: none;">Remind</button><button class="btn btn-sm btn-success btn-paid" style="margin-right: 6px;">Paid</button>' : '') +
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

          var remindBtn = tr.querySelector('.btn-remind');
          if (remindBtn) {
            remindBtn.addEventListener('click', function() {
              self.triggerPaymentReminder(bill.id, bill.bill_number);
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
  },

  triggerPaymentReminder: function(billId, billNumber) {
    var self = this;
    
    // Create custom overlay
    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    
    var box = document.createElement('div');
    box.className = 'modal-box';
    box.style.maxWidth = '400px';
    
    var title = document.createElement('h3');
    title.textContent = 'Send Payment Reminder';
    title.style.marginBottom = '12px';
    title.style.fontFamily = 'var(--font-serif)';
    box.appendChild(title);
    
    var msg = document.createElement('p');
    msg.textContent = 'Choose delivery channels to send the payment reminder for bill ' + billNumber + ':';
    msg.style.marginBottom = '20px';
    msg.style.fontSize = '13px';
    box.appendChild(msg);
    
    var btnWA = document.createElement('button');
    btnWA.className = 'btn btn-primary';
    btnWA.textContent = 'WhatsApp Only';
    btnWA.style.backgroundColor = '#25D366';
    btnWA.style.border = 'none';
    btnWA.style.marginRight = '8px';
    btnWA.onclick = function() {
      document.body.removeChild(overlay);
      self.sendReminder(billId, ['whatsapp']);
    };
    box.appendChild(btnWA);
    
    var btnBoth = document.createElement('button');
    btnBoth.className = 'btn btn-primary';
    btnBoth.textContent = 'Email & WhatsApp';
    btnBoth.style.marginRight = '8px';
    btnBoth.onclick = function() {
      document.body.removeChild(overlay);
      self.sendReminder(billId, ['email', 'whatsapp']);
    };
    box.appendChild(btnBoth);
    
    var btnCancel = document.createElement('button');
    btnCancel.className = 'btn';
    btnCancel.textContent = 'Cancel';
    btnCancel.onclick = function() {
      document.body.removeChild(overlay);
    };
    box.appendChild(btnCancel);
    
    overlay.appendChild(box);
    document.body.appendChild(overlay);
  },

  sendReminder: function(billId, channels) {
    var self = this;
    Toast.show('Fetching bill details...', 'info');
    
    Promise.all([
      window.api.getBill(billId),
      window.api.getBillItems(billId),
      window.api.getTaxRecord(billId),
      window.api.getAllSettings()
    ]).then(function(results) {
      var bill = results[0];
      var items = results[1];
      var taxRecord = results[2] || {};
      var settings = results[3];
      
      if (!bill) {
        throw new Error('Bill not found');
      }
      
      return window.api.getCustomer(bill.customer_id).then(function(customer) {
        if (!customer) {
          throw new Error('Customer not found');
        }
        
        Toast.show('Generating Invoice PDF...', 'info');
        return window.api.generatePDF({
          bill: bill,
          items: items,
          customer: customer,
          settings: settings
        }).then(function(pdfBuffer) {
          var binary = '';
          var bytes = new Uint8Array(pdfBuffer);
          var len = bytes.byteLength;
          for (var i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          var base64 = window.btoa(binary);
          
          return window.api.waGetStatus().then(function(waState) {
            var isLocalWaLinked = (waState && waState.status === 'linked');

            var sendToN8n = [];
            var sendLocalWa = false;
            var openWaRedirect = false;

            for (var i = 0; i < channels.length; i++) {
              if (channels[i] === 'whatsapp') {
                if (settings && settings.wati_enabled === '1') {
                  sendToN8n.push('whatsapp');
                } else if (isLocalWaLinked) {
                  sendLocalWa = true;
                } else {
                  openWaRedirect = true;
                }
              } else {
                sendToN8n.push(channels[i]);
              }
            }

            var promiseChain = Promise.resolve();

            if (sendLocalWa) {
              var customerPhone = customer.phone || bill.party_phone;
              var businessName = settings ? settings.business_name : '';
              var text = "Dear Customer,\n\n" +
                         "This is a friendly reminder that payment for invoice " + bill.bill_number + " is outstanding.\n" +
                         "Amount Due: " + bill.amount_due.toFixed(2) + ".\n\n" +
                         "Please make the payment as soon as possible. Thank you!\n" +
                         (businessName || '');
              var filename = 'Reminder_' + bill.bill_number + '.pdf';
              
              Toast.show('Sending payment reminder via local WhatsApp...', 'info');
              promiseChain = promiseChain.then(function() {
                return window.api.waSendBill(customerPhone, text, base64, filename).then(function() {
                  Toast.show('WhatsApp reminder sent automatically!', 'success');
                }).catch(function(waErr) {
                  console.error('[wa] reminder auto-send failed:', waErr.message);
                  Toast.show('Auto-send failed. Falling back to WhatsApp Web redirect...', 'warning');
                  self.openWhatsAppReminderRedirect(customerPhone, bill.bill_number, bill.amount_due, businessName);
                });
              });
            } else if (openWaRedirect) {
              var customerPhone = customer.phone || bill.party_phone;
              var businessName = settings ? settings.business_name : '';
              self.openWhatsAppReminderRedirect(customerPhone, bill.bill_number, bill.amount_due, businessName);
            }

            if (sendToN8n.length > 0) {
              promiseChain = promiseChain.then(function() {
                Toast.show('Triggering payment reminder via n8n...', 'info');
                return window.api.paymentReminder(
                  bill,
                  customer,
                  items,
                  taxRecord,
                  base64,
                  sendToN8n
                );
              });
            }

            return promiseChain;
          });
        });
      });
    }).then(function() {
      // Show success toast only if we actually triggered n8n
      // For WA only, Toast is already shown or handled
    }).catch(function(err) {
      console.error(err);
      Toast.show('Failed to send reminder: ' + err.message, 'error');
    });
  },

  openWhatsAppReminderRedirect: function(phone, billNumber, amountDue, businessName) {
    if (!phone) {
      Toast.show('Customer phone number not available for WhatsApp', 'warning');
      return;
    }
    var cleanedPhone = phone.replace(/\D/g, '');
    if (cleanedPhone.length === 10) {
      cleanedPhone = '91' + cleanedPhone;
    }
    var text = "Dear Customer,\n\n" +
               "This is a friendly reminder that payment for invoice " + billNumber + " is outstanding.\n" +
               "Amount Due: " + amountDue.toFixed(2) + ".\n\n" +
               "Please make the payment as soon as possible. Thank you!\n" +
               (businessName || '');
    var url = "https://api.whatsapp.com/send?phone=" + cleanedPhone + "&text=" + encodeURIComponent(text);
    window.api.openExternal(url);
  }
};
