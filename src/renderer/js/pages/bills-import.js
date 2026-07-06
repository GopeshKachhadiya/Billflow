window.PageControllers = window.PageControllers || {};
window.PageControllers['bills-import'] = {
  _csvText: '',
  _parsedRows: [],
  _selectedFile: null,

  init: function() {
    var self = this;
    self._csvText = '';
    self._parsedRows = [];
    self._selectedFile = null;

    // Bind back button
    var backBtn = document.getElementById('btn-back-to-list');
    if (backBtn) {
      backBtn.addEventListener('click', function() {
        window.loadPage('bills-list');
      });
    }

    // Bind file selection
    var selectBtn = document.getElementById('btn-select-file');
    var fileInput = document.getElementById('csv-file-input');
    var filenameSpan = document.getElementById('selected-filename');
    var submitBtn = document.getElementById('btn-import-submit');
    var progressCard = document.getElementById('import-progress-card');

    if (selectBtn && fileInput) {
      selectBtn.addEventListener('click', function() {
        fileInput.click();
      });

      fileInput.addEventListener('change', function(e) {
        var file = e.target.files[0];
        if (!file) return;

        self._selectedFile = file;
        selectBtn.textContent = 'Selected: ' + file.name;
        filenameSpan.style.display = 'inline';
        filenameSpan.textContent = file.name + ' (' + (file.size / 1024).toFixed(1) + ' KB)';

        var reader = new FileReader();
        reader.onload = function(evt) {
          self._csvText = evt.target.result;
          self.verifyAndParseCSV();
        };
        reader.readAsText(file);
      });
    }

    if (submitBtn) {
      submitBtn.addEventListener('click', function() {
        submitBtn.disabled = true;
        self.processImport();
      });
    }
  },

  logConsole: function(message, isError, isSuccess) {
    var consoleDiv = document.getElementById('import-log-console');
    if (!consoleDiv) return;

    var color = '#34D399'; // Default Success/Info Green
    if (isError) color = '#F87171'; // Red
    else if (isSuccess) color = '#60A5FA'; // Blue

    var span = document.createElement('span');
    span.style.color = color;
    span.textContent = '[' + new Date().toLocaleTimeString() + '] ' + message + '\n';
    consoleDiv.appendChild(span);
    consoleDiv.scrollTop = consoleDiv.scrollHeight;
  },

  verifyAndParseCSV: function() {
    var self = this;
    var progressCard = document.getElementById('import-progress-card');
    var submitBtn = document.getElementById('btn-import-submit');
    var consoleDiv = document.getElementById('import-log-console');

    if (progressCard) progressCard.style.display = 'block';
    if (consoleDiv) consoleDiv.innerHTML = '';

    self.logConsole('Parsing CSV file...', false, true);

    try {
      var parsed = self.parseCSVData(self._csvText);
      if (parsed.length < 2) {
        throw new Error('CSV file is empty or only contains headers');
      }

      var headers = parsed[0].map(function(h) { return h.trim().toLowerCase(); });
      self.logConsole('Headers found: ' + headers.join(', '), false, false);

      // Verify required fields
      var requiredFields = ['bill_number', 'bill_date', 'customer_name', 'customer_state', 'item_name', 'item_qty', 'item_rate', 'item_gst_rate'];
      var missing = [];
      requiredFields.forEach(function(f) {
        if (headers.indexOf(f) === -1) missing.push(f);
      });

      if (missing.length > 0) {
        throw new Error('Missing required columns: ' + missing.join(', '));
      }

      // Store parsed rows (excluding header) mapped to objects
      self._parsedRows = [];
      for (var i = 1; i < parsed.length; i++) {
        var row = parsed[i];
        if (row.length < headers.length) continue; // Skip malformed rows
        
        var obj = {};
        headers.forEach(function(h, idx) {
          obj[h] = row[idx] ? row[idx].trim() : '';
        });

        if (obj.bill_number && obj.item_name) {
          self._parsedRows.push(obj);
        }
      }

      self.logConsole('CSV Verification successful! Total invoice rows to parse: ' + self._parsedRows.length, false, true);
      if (submitBtn) {
        submitBtn.removeAttribute('disabled');
        submitBtn.disabled = false;
      }

      document.getElementById('import-stats').textContent = '0 / ' + self._parsedRows.length + ' rows';

    } catch (err) {
      self.logConsole('CSV Error: ' + err.message, true, false);
      if (submitBtn) submitBtn.disabled = true;
    }
  },

  parseCSVData: function(text) {
    var lines = [];
    var row = [""];
    var inQuotes = false;
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      var next = text[i+1];
      if (c === '"') {
        if (inQuotes && next === '"') {
          row[row.length - 1] += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === ',' && !inQuotes) {
        row.push('');
      } else if ((c === '\r' || c === '\n') && !inQuotes) {
        if (c === '\r' && next === '\n') { i++; }
        lines.push(row);
        row = [''];
      } else {
        row[row.length - 1] += c;
      }
    }
    if (row.length > 1 || row[0] !== '') {
      lines.push(row);
    }
    return lines;
  },

  processImport: function() {
    var self = this;
    var rows = self._parsedRows;
    var totalRows = rows.length;
    var submitBtn = document.getElementById('btn-import-submit');

    self.logConsole('Starting database import...', false, true);

    // Group rows by bill_number
    var billGroups = {};
    rows.forEach(function(row) {
      var bNo = row.bill_number;
      if (!billGroups[bNo]) billGroups[bNo] = [];
      billGroups[bNo].push(row);
    });

    var billKeys = Object.keys(billGroups);
    self.logConsole('Found ' + billKeys.length + ' unique invoices to process.', false, false);

    // Fetch existing customers and settings
    Promise.all([
      window.api.listCustomers(),
      window.api.getAllSettings()
    ]).then(function(results) {
      var existingCustomers = results[0] || [];
      var settings = results[1] || {};

      var customerMap = {};
      existingCustomers.forEach(function(c) {
        customerMap[c.name.toLowerCase()] = c;
        if (c.gstin) customerMap[c.gstin.toUpperCase()] = c;
      });

      var index = 0;
      var gstinCacheRecords = [];

      function importNextBill() {
        if (index >= billKeys.length) {
          self.logConsole('Import finished! Caching extracted GSTINs...', false, true);
          self.updateProgressBar(100);
          
          if (gstinCacheRecords.length > 0) {
            window.api.cacheGSTINBulk(gstinCacheRecords).then(function() {
              self.logConsole('Successfully cached ' + gstinCacheRecords.length + ' GSTINs locally and globally!', false, true);
              Toast.show('Bills successfully imported!', 'success');
              if (submitBtn) submitBtn.disabled = false;
            }).catch(function(err) {
              self.logConsole('GSTIN caching failed: ' + err.message, true, false);
              Toast.show('Import completed with warnings', 'warning');
            });
          } else {
            self.logConsole('No new GSTINs to cache.', false, false);
            Toast.show('Bills successfully imported!', 'success');
            if (submitBtn) submitBtn.disabled = false;
          }
          return;
        }

        var billNo = billKeys[index];
        var billRows = billGroups[billNo];
        var firstRow = billRows[0];

        // 1. Customer creation/matching
        var customerPromise;
        var custName = firstRow.customer_name;
        var custGstin = firstRow.customer_gstin ? firstRow.customer_gstin.toUpperCase() : '';
        var matched = customerMap[custName.toLowerCase()] || (custGstin ? customerMap[custGstin] : null);

        if (matched) {
          customerPromise = Promise.resolve(matched);
        } else {
          // Detect state code from GSTIN
          var stateCode = '';
          if (custGstin && custGstin.length >= 2) {
            stateCode = custGstin.substring(0, 2);
          }

          var newCustData = {
            name: custName,
            gstin: custGstin,
            phone: firstRow.customer_phone || '9999999999',
            email: firstRow.customer_email || '',
            state: firstRow.customer_state || 'Maharashtra',
            state_code: stateCode,
            address: firstRow.customer_address || '',
            is_active: 1
          };

          customerPromise = window.api.createCustomer(newCustData).then(function(res) {
            newCustData.id = res.id;
            customerMap[custName.toLowerCase()] = newCustData;
            if (custGstin) customerMap[custGstin] = newCustData;
            self.logConsole('Created new customer: ' + custName, false, false);
            return newCustData;
          });
        }

        customerPromise.then(function(customer) {
          // If customer has a GSTIN, extract it to our cache queue
          if (customer.gstin) {
            var existingCache = gstinCacheRecords.find(function(r) { return r.gstin === customer.gstin; });
            if (!existingCache) {
              // Parse billing address details
              var billingCity = '';
              var billingPin = '';
              if (firstRow.customer_address) {
                var addrParts = firstRow.customer_address.split(',');
                billingCity = addrParts[addrParts.length - 2] ? addrParts[addrParts.length - 2].trim() : '';
                billingPin = addrParts[addrParts.length - 1] ? addrParts[addrParts.length - 1].trim().replace(/[^0-9]/g, '') : '';
              }
              gstinCacheRecords.push({
                gstin:           customer.gstin,
                name:            customer.name,
                type:            'Business',
                state:           customer.state,
                state_code:      customer.state_code,
                billing_address: customer.address,
                billing_city:    billingCity,
                billing_pin:     billingPin,
                status:          'Active'
              });
            }
          }

          // Calculate GST and line items
          var bizState = settings.business_state_code || '';
          var custState = customer.state_code || '';
          var supplyType = GSTCalculator.getSupplyType(bizState, custState, false);

          var items = [];
          var lineItemsResults = [];

          billRows.forEach(function(row, sortOrder) {
            var qty = parseFloat(row.item_qty) || 1;
            var rate = parseFloat(row.item_rate) || 0;
            var disc = parseFloat(row.item_discount) || 0;
            var gst = parseFloat(row.item_gst_rate) || 18;

            var calc = GSTCalculator.calcLineItem({
              quantity:        qty,
              unitPrice:       rate,
              discountPercent: disc,
              gstRate:         gst,
              supplyType:      supplyType
            });

            lineItemsResults.push(calc);

            items.push({
              sort_order:       sortOrder,
              description:      row.item_name,
              hsn_sac:          row.item_hsn || '',
              unit:             'Nos',
              quantity:         qty,
              unit_price:       rate,
              discount_percent: disc,
              gst_rate:         gst,
              base_amount:      calc.baseAmount,
              discount_amount:  calc.discountAmount,
              taxable_amount:   calc.taxableAmount,
              cgst_rate:        calc.cgstRate,  cgst_amount: calc.cgstAmount,
              sgst_rate:        calc.sgstRate,  sgst_amount: calc.sgstAmount,
              igst_rate:        calc.igstRate,  igst_amount: calc.igstAmount,
              line_total:       calc.lineTotal
            });
          });

          // Bill Totals
          var totals = GSTCalculator.calcBillTotals(lineItemsResults);
          var billDate = firstRow.bill_date || DateUtils.today();
          var dueDate = firstRow.due_date || '';

          var rateWise = GSTCalculator.buildRateWiseBreakdown(
            items.map(function(it) {
              return { gstRate: it.gst_rate, taxableAmount: it.taxable_amount,
                       cgstAmount: it.cgst_amount, sgstAmount: it.sgst_amount, igstAmount: it.igst_amount };
            })
          );
          var hsnWise = GSTCalculator.buildHSNBreakdown(
            items.map(function(it) {
              return { hsnSac: it.hsn_sac, description: it.description, unit: it.unit,
                       gstRate: it.gst_rate, quantity: it.quantity,
                       taxableAmount: it.taxable_amount, cgstAmount: it.cgst_amount,
                       sgstAmount: it.sgst_amount, igstAmount: it.igst_amount };
            })
          );

          var billData = {
            bill_number:     billNo,
            customer_id:     customer.id,
            bill_date:       billDate,
            due_date:        dueDate,
            status:          'sent',
            supply_type:     supplyType,
            place_of_supply: customer.state_code || '',
            subtotal:        totals.subtotal,
            total_discount:  totals.totalDiscount,
            total_taxable:   totals.totalTaxable,
            total_cgst:      totals.totalCGST,
            total_sgst:      totals.totalSGST,
            total_igst:      totals.totalIGST,
            total_tax:       (totals.totalCGST||0) + (totals.totalSGST||0) + (totals.totalIGST||0),
            round_off:       totals.roundOff,
            grand_total:     totals.grandTotal,
            amount_due:      0, // Assume imported historical bills are paid
            amount_paid:     totals.grandTotal,
            notes:           firstRow.notes || 'Imported from previous system',
            terms:           firstRow.terms || 'Standard payment terms',
            items:           items,
            taxRecord: {
              bill_date:           billDate,
              bill_number:         billNo,
              customer_name:       customer.name,
              customer_gstin:      customer.gstin,
              customer_state:      customer.state,
              customer_state_code: customer.state_code,
              total_taxable:       totals.totalTaxable,
              total_cgst:          totals.totalCGST,
              total_sgst:          totals.totalSGST,
              total_igst:          totals.totalIGST,
              total_tax:           (totals.totalCGST||0) + (totals.totalSGST||0) + (totals.totalIGST||0),
              grand_total:         totals.grandTotal,
              rate_wise_breakdown: rateWise,
              hsn_wise_breakdown:  hsnWise
            }
          };

          // 2. Save bill to SQLite
          window.api.createBill(billData).then(function(result) {
            return window.api.replaceBillItems(result.id, items).then(function() {
              return window.api.upsertTaxRecord(result.id, billData.taxRecord).then(function() {
                self.logConsole('Successfully imported bill: ' + billNo + ' (Amount: ₹' + totals.grandTotal.toFixed(2) + ')', false, false);
                
                // Update stats progress
                index++;
                var processedCount = 0;
                for (var k = 0; k < index; k++) {
                  processedCount += billGroups[billKeys[k]].length;
                }
                document.getElementById('import-stats').textContent = processedCount + ' / ' + totalRows + ' rows';
                self.updateProgressBar((index / billKeys.length) * 100);

                // Import next bill in stack
                importNextBill();
              });
            });
          }).catch(function(err) {
            self.logConsole('Failed to import bill ' + billNo + ': ' + err.message, true, false);
            index++;
            importNextBill();
          });
        });
      }

      importNextBill();
    }).catch(function(err) {
      self.logConsole('Failed loading databases: ' + err.message, true, false);
      if (submitBtn) submitBtn.disabled = false;
    });
  },

  updateProgressBar: function(percent) {
    var progressBar = document.getElementById('import-progress-bar');
    if (progressBar) {
      progressBar.style.width = percent + '%';
    }
  }
};
