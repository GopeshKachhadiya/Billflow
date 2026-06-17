# BillFlow — Missing Pieces & Renderer-Side Patches
## Addendum to billflow-MASTER.md

This file covers four things missed in the main task cards:
1. `src/utils/format-currency.js`
2. `src/utils/date.js`
3. `src/db/queries/bill-items.js` — `replaceBillItems` IPC registration gap
4. How `GSTCalculator` loads in the renderer (browser context)

---

## ADDENDUM TASK-A · Currency Formatter [CODE → Qwen Coder]

**Create file:** `src/utils/format-currency.js`

**Purpose:** Format numbers in Indian lakh/crore style with ₹ symbol.

```javascript
// src/utils/format-currency.js
// ES5 — no ES6

var FormatCurrency = (function () {

  // Format number to Indian style: 1,00,000.00
  // 1234567.89 → "12,34,567.89"
  function formatIndian(num) {
    num = parseFloat(num) || 0;
    var fixed = num.toFixed(2);
    var parts = fixed.split('.');
    var integer = parts[0];
    var decimal = parts[1];

    // Indian number grouping: last 3 digits, then groups of 2
    var negative = integer.charAt(0) === '-';
    if (negative) { integer = integer.slice(1); }

    var result = '';
    if (integer.length > 3) {
      var last3 = integer.slice(-3);
      var remaining = integer.slice(0, integer.length - 3);
      // Group remaining into pairs from the right
      var pairs = '';
      for (var i = remaining.length; i > 0; i -= 2) {
        var start = Math.max(0, i - 2);
        pairs = remaining.slice(start, i) + (pairs ? ',' : '') + pairs;
      }
      result = pairs + ',' + last3;
    } else {
      result = integer;
    }

    return (negative ? '-' : '') + result + '.' + decimal;
  }

  // Add ₹ prefix
  function toRupees(num) {
    return '\u20B9' + formatIndian(num);   // ₹ unicode
  }

  // Short display: 1,00,000 → "1.00 L"  (lakh), 1,00,00,000 → "1.00 Cr"
  function toShort(num) {
    num = parseFloat(num) || 0;
    if (num >= 10000000) { return (num / 10000000).toFixed(2) + ' Cr'; }
    if (num >= 100000)   { return (num / 100000).toFixed(2) + ' L'; }
    if (num >= 1000)     { return (num / 1000).toFixed(1) + ' K'; }
    return num.toFixed(2);
  }

  // Parse a formatted string back to float
  function parse(str) {
    if (typeof str === 'number') { return str; }
    return parseFloat(String(str).replace(/[₹,\s]/g, '')) || 0;
  }

  return {
    formatIndian: formatIndian,
    toRupees:     toRupees,
    toShort:      toShort,
    parse:        parse
  };

}());

module.exports = FormatCurrency;
```

**In renderer (HTML pages):**
The renderer cannot use `require()` because `contextIsolation: true`.
So for the renderer, include as an inline `<script>` in `index.html`:

```html
<!-- In src/renderer/index.html, add before app.js -->
<script>
// Paste the IIFE content of format-currency.js here (without module.exports)
var FormatCurrency = (function () {
  // ... same code as above, without the module.exports line ...
}());
</script>
```

Or add a `src/renderer/js/vendor/format-currency.js` file (same IIFE, no `module.exports`)
and load it with `<script src="js/vendor/format-currency.js"></script>`.

---

## ADDENDUM TASK-B · Date Helpers [CODE → Qwen Coder]

**Create file:** `src/utils/date.js`

```javascript
// src/utils/date.js
// ES5 — no ES6

var DateUtils = (function () {

  // Parse a YYYY-MM-DD string to a Date object (safe, no timezone issues)
  function parseDate(str) {
    if (!str) { return null; }
    var parts = str.split('-');
    return new Date(parseInt(parts[0], 10),
                    parseInt(parts[1], 10) - 1,
                    parseInt(parts[2], 10));
  }

  // Format a Date to YYYY-MM-DD (for SQLite storage)
  function toSQL(date) {
    if (!date) { return ''; }
    var d = (typeof date === 'string') ? parseDate(date) : date;
    var month = String(d.getMonth() + 1);
    var day   = String(d.getDate());
    if (month.length < 2) { month = '0' + month; }
    if (day.length < 2)   { day   = '0' + day;   }
    return d.getFullYear() + '-' + month + '-' + day;
  }

  // Format for display: DD/MM/YYYY
  function toDisplay(str) {
    if (!str) { return ''; }
    var parts = str.split('-');
    if (parts.length !== 3) { return str; }
    return parts[2] + '/' + parts[1] + '/' + parts[0];
  }

  // Today as YYYY-MM-DD
  function today() {
    return toSQL(new Date());
  }

  // Add N days to a YYYY-MM-DD string, return YYYY-MM-DD
  function addDays(str, n) {
    var d = parseDate(str);
    d.setDate(d.getDate() + n);
    return toSQL(d);
  }

  // Get default due date based on payment_terms
  // terms: 'due_on_receipt' | 'net_7' | 'net_15' | 'net_30' | 'net_60'
  function getDueDate(billDate, paymentTerms) {
    var daysMap = {
      'due_on_receipt': 0,
      'net_7':  7,
      'net_15': 15,
      'net_30': 30,
      'net_60': 60
    };
    var days = daysMap[paymentTerms] || 0;
    return addDays(billDate || today(), days);
  }

  // Is a bill overdue? (status !== paid/cancelled AND due_date < today)
  function isOverdue(dueDate, status) {
    if (!dueDate) { return false; }
    if (status === 'paid' || status === 'cancelled') { return false; }
    return dueDate < today();
  }

  // Days until due date (negative = overdue)
  function daysUntilDue(dueDate) {
    if (!dueDate) { return null; }
    var diff = parseDate(dueDate).getTime() - new Date().setHours(0,0,0,0);
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  // Month label: '2025-01' → 'Jan 2025'
  function monthLabel(yyyyMM) {
    var months = ['Jan','Feb','Mar','Apr','May','Jun',
                  'Jul','Aug','Sep','Oct','Nov','Dec'];
    var parts = yyyyMM.split('-');
    return months[parseInt(parts[1], 10) - 1] + ' ' + parts[0];
  }

  return {
    parseDate:    parseDate,
    toSQL:        toSQL,
    toDisplay:    toDisplay,
    today:        today,
    addDays:      addDays,
    getDueDate:   getDueDate,
    isOverdue:    isOverdue,
    daysUntilDue: daysUntilDue,
    monthLabel:   monthLabel
  };

}());

module.exports = DateUtils;
```

Same pattern as FormatCurrency — load as inline IIFE in renderer, without `module.exports`.

---

## ADDENDUM TASK-C · Fix: replaceBillItems IPC Gap [CODE → Qwen Coder]

**Problem:** `window.api.replaceBillItems` is called in `bill-edit.js` (TASK-25)
but was NOT registered as an IPC handler in `main.js` (TASK-19) or `preload.js` (TASK-20).

**Fix 1 — Add to `src/db/queries/bill-items.js`:**

Ensure `replaceItemsForBill` is exported (it was defined in TASK-08).
No change needed there if TASK-08 was done correctly.

**Fix 2 — Add to `src/main.js` IPC handlers block:**

```javascript
// Add this IPC handler alongside the others in main.js
ipcMain.handle('db:billitems:replace', function(event, args) {
  // args = { billId: string, items: array }
  return billItemsQueries.replaceItemsForBill(args.billId, args.items);
});
```

**Fix 3 — Add to `src/preload.js` window.api block:**

```javascript
// Add to the contextBridge.exposeInMainWorld call
replaceBillItems: function(billId, items) {
  return ipc('db:billitems:replace', { billId: billId, items: items });
},
```

**Fix 4 — Add to `src/main.js` imports at the top:**

```javascript
var billItemsQueries = require('./db/queries/bill-items');
```

---

## ADDENDUM TASK-D · GSTCalculator in the Renderer [CODE → Qwen Coder]

**Problem:** `bill-edit.js` calls `GSTCalculator.calcLineItem(...)` but
`GSTCalculator` is defined in `src/gst/calculator.js` which uses `module.exports`.
In the renderer, `require()` is NOT available (contextIsolation is ON, nodeIntegration OFF).

**Solution: Two steps.**

**Step 1 — Create renderer-side copy without module.exports:**

**Create file:** `src/renderer/js/vendor/gst-calculator.js`

Copy the ENTIRE content of `src/gst/calculator.js` (from Part 2, Section F.1)
but remove the final `module.exports` line.
The file ends with `}());` and `GSTCalculator` becomes a global variable.

```javascript
// src/renderer/js/vendor/gst-calculator.js
// Same as src/gst/calculator.js but WITHOUT module.exports
// GSTCalculator is exposed as a global window variable

var GSTCalculator = (function () {
  // ... full IIFE code from Part 2 Section F.1 ...
  // ... (copy everything) ...
  return {
    getSupplyType:           getSupplyType,
    calcLineItem:            calcLineItem,
    calcBillTotals:          calcBillTotals,
    buildRateWiseBreakdown:  buildRateWiseBreakdown,
    buildHSNBreakdown:       buildHSNBreakdown
  };
}());
// NO module.exports here
```

**Also create renderer-side copies of:**
- `src/renderer/js/vendor/amount-to-words.js` (from `src/gst/amount-to-words.js`, remove `module.exports`)
- `src/renderer/js/vendor/date-utils.js` (from `src/utils/date.js`, remove `module.exports`)
- `src/renderer/js/vendor/format-currency.js` (from `src/utils/format-currency.js`, remove `module.exports`)
- `src/renderer/js/vendor/state-codes.js` (from `src/utils/state-codes.js`, remove `module.exports`)

**Step 2 — Load vendor scripts in `index.html` before any page JS:**

```html
<!-- In src/renderer/index.html, add inside <head> after the CSS link -->
<script src="js/vendor/gst-calculator.js"></script>
<script src="js/vendor/amount-to-words.js"></script>
<script src="js/vendor/date-utils.js"></script>
<script src="js/vendor/format-currency.js"></script>
<script src="js/vendor/state-codes.js"></script>
```

Now every page's JS can freely call:
- `GSTCalculator.calcLineItem(...)`
- `AmountToWords.toWords(...)`
- `DateUtils.today()`
- `FormatCurrency.toRupees(...)`
- `STATE_CODES` and `getAllStates()`

---

## ADDENDUM TASK-E · Complete File List Update

**Add these files to the folder structure** in `billflow-MASTER.md` Section C:

```
src/
├── utils/
│   ├── format-currency.js    ← ADDENDUM TASK-A (Node/main process)
│   ├── date.js               ← ADDENDUM TASK-B (Node/main process)
│   ├── bill-number.js        ← TASK-14
│   └── state-codes.js        ← TASK-12
│
└── renderer/
    └── js/
        └── vendor/           ← NEW FOLDER
            ├── gst-calculator.js    ← ADDENDUM TASK-D (renderer copy)
            ├── amount-to-words.js   ← ADDENDUM TASK-D (renderer copy)
            ├── date-utils.js        ← ADDENDUM TASK-D (renderer copy)
            ├── format-currency.js   ← ADDENDUM TASK-D (renderer copy)
            └── state-codes.js       ← ADDENDUM TASK-D (renderer copy)
```

**Rule for vendor files:** They are EXACT copies of their `src/` counterparts
with `module.exports = ...` removed from the last line.
No other changes. This keeps logic in sync across both environments.

---

## ADDENDUM TASK-F · Bill Edit: Customer State Detection Fix [CODE → Qwen Coder]

**Problem:** When user selects a customer in bill-edit, the supply type (intrastate
vs interstate) must be detected and shown, and all line item taxes must recalculate.

**Add this to `src/renderer/js/pages/bill-edit.js`:**

```javascript
// Global for this page
var currentSupplyType = 'intrastate';
var currentCustomer   = null;
var currentSettings   = {};
var lineItems         = [];  // array of item data objects

// Called when a customer is selected from the dropdown
function onCustomerSelected(customer) {
  currentCustomer = customer;

  // Get business state code from settings (loaded on init)
  var bizCode  = currentSettings['business_state_code'] || '';
  var custCode = customer.state_code || '';

  currentSupplyType = GSTCalculator.getSupplyType(bizCode, custCode, false);

  // Update display
  var supplyEl = document.getElementById('supply-type-display');
  if (supplyEl) {
    supplyEl.textContent = currentSupplyType === 'intrastate'
      ? 'Intrastate (CGST + SGST)'
      : 'Interstate (IGST)';
  }

  // Update column header labels
  document.getElementById('th-cgst').textContent =
    currentSupplyType === 'intrastate' ? 'CGST' : '';
  document.getElementById('th-sgst').textContent =
    currentSupplyType === 'intrastate' ? 'SGST' : '';
  document.getElementById('th-igst').textContent =
    currentSupplyType === 'interstate' ? 'IGST' : '';

  // Recalculate all existing line items with new supply type
  recalculateAllLines();

  // Auto-set due date from customer payment_terms
  var billDate = document.getElementById('bill-date').value || DateUtils.today();
  document.getElementById('due-date').value =
    DateUtils.getDueDate(billDate, customer.payment_terms || 'net_30');
}

function recalculateAllLines() {
  var rows = document.querySelectorAll('.line-item-row');
  for (var i = 0; i < rows.length; i++) {
    recalculateLine(i);
  }
}
```

---

## ADDENDUM TASK-G · n8n Workflow: Supabase HTTP Request Node Config [REASON → Gemma 4]

When building n8n workflows that call Supabase, the HTTP Request nodes must be configured
exactly as shown below. This is easy to get wrong.

**Supabase REST API — Fetch bills due in 3 days (for WF-03):**

```
Node Type:    HTTP Request
Method:       GET
URL:          {{ $env.SUPABASE_URL }}/rest/v1/bills
Query Params:
  status      eq.sent
  due_date    eq.{{ $now.plus({days:3}).toFormat('yyyy-MM-dd') }}
Headers:
  apikey      {{ $env.SUPABASE_SERVICE_KEY }}
  Authorization  Bearer {{ $env.SUPABASE_SERVICE_KEY }}
  Content-Type   application/json
  Prefer      return=representation
```

**Supabase REST API — Upsert a bill (for WF-06):**

```
Node Type:    HTTP Request
Method:       POST
URL:          {{ $env.SUPABASE_URL }}/rest/v1/bills
Headers:
  apikey         {{ $env.SUPABASE_SERVICE_KEY }}
  Authorization  Bearer {{ $env.SUPABASE_SERVICE_KEY }}
  Content-Type   application/json
  Prefer         resolution=merge-duplicates,return=representation
Body (JSON):  {{ $json.payload }}
```

**Supabase REST API — Update bill status (for WF-08):**

```
Node Type:    HTTP Request
Method:       PATCH
URL:          {{ $env.SUPABASE_URL }}/rest/v1/bills?id=eq.{{ $json.bill_id }}
Headers:
  apikey         {{ $env.SUPABASE_SERVICE_KEY }}
  Authorization  Bearer {{ $env.SUPABASE_SERVICE_KEY }}
  Content-Type   application/json
  Prefer         return=representation
Body (JSON):
  {
    "status": "paid",
    "payment_date": "{{ $json.payment_date }}",
    "payment_method": "{{ $json.payment_method }}",
    "payment_reference": "{{ $json.payment_reference }}"
  }
```

**Environment variables to set in n8n:**
- `SUPABASE_URL` → your Supabase project URL (from Settings → API)
- `SUPABASE_SERVICE_KEY` → your service_role key (NOT anon key — service key bypasses RLS)

---

## ADDENDUM TASK-H · Offline Detection Pattern [CODE → Qwen Coder]

**Used in `src/supabase/sync.js`**

Since `XMLHttpRequest` must be used (no `fetch`), here is the correct offline check:

```javascript
// src/supabase/sync.js — isOnline function
function isOnline(callback) {
  // callback(true) if online, callback(false) if offline
  var supabaseUrl = require('../db/queries/settings').getSetting('supabase_url');
  if (!supabaseUrl) { callback(false); return; }

  var xhr = new XMLHttpRequest();
  xhr.timeout = 3000;  // 3 second timeout

  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4) {
      callback(xhr.status > 0);
    }
  };

  xhr.ontimeout = function() { callback(false); };
  xhr.onerror   = function() { callback(false); };

  try {
    xhr.open('HEAD', supabaseUrl, true);
    xhr.send();
  } catch (e) {
    callback(false);
  }
}

// Usage in syncNow:
function syncNow() {
  isOnline(function(online) {
    if (!online) {
      console.log('Offline — sync skipped');
      return;
    }
    pushToSupabase(function() {
      pullFromSupabase(function() {
        require('../db/queries/settings').setSetting(
          'last_sync_at', new Date().toISOString()
        );
      });
    });
  });
}
```

---

## VALIDATION ADDITIONS (append to MASTER.md Section 10)

```
ADDENDUM CHECKS:
[ ] GSTCalculator available in renderer:
    Open DevTools console in the app → type GSTCalculator.calcLineItem({quantity:1, unitPrice:1000, discountPercent:0, gstRate:18, supplyType:'intrastate'})
    Expected: { taxableAmount: 1000, cgstAmount: 90, sgstAmount: 90, lineTotal: 1180 }

[ ] FormatCurrency works in renderer:
    Console: FormatCurrency.toRupees(1234567.89)
    Expected: '₹12,34,567.89'

[ ] DateUtils in renderer:
    Console: DateUtils.getDueDate('2025-01-01', 'net_30')
    Expected: '2025-01-31'

[ ] replaceBillItems IPC works:
    In renderer console: window.api.replaceBillItems('test-id', [])
    Expected: resolves (does not reject)

[ ] isOnline() in sync:
    With internet: resolves callback(true)
    With network disabled: resolves callback(false) within 3 seconds
```

---

*End of Addendum — append this content to billflow-MASTER.md or keep as separate reference*
