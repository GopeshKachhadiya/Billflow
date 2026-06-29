# BillFlow — Remaining Work & Gap Analysis
## What `complete_till_now.md` Got Wrong — Full Audit Report

> **How this was produced:** Every file claimed as "done" in `complete_till_now.md`
> was cross-referenced against the actual code in `billflow-code-complete.md`,
> `billflow-MASTER.md`, `billflow-ADDENDUM.md`, `billflow-n8n-maximum.md`,
> and `billadmin.md`. Files with no code in any document are flagged as MISSING.
>
> **Verdict:** The `complete_till_now.md` is significantly optimistic.
> While the architecture, logic, and structure are fully designed, a large number
> of files have ZERO actual code written for them.

---

## QUICK SUMMARY

| Category | Total Needed | Done (code exists) | Missing |
|----------|-------------|-------------------|---------|
| Core backend JS | 15 | 13 | 2 (crypto module) |
| GST engine files | 5 | 0 | **5** |
| HTML page views | 11 | 0 | **11** |
| JS page controllers | 8 | 6 | **2 partial + 5 missing** |
| Vendor JS (renderer copies) | 5 | 0 | **5** |
| CSS files | 2 | 0 | **2** |
| DB migration SQL | 2 | 0 | **2** |
| Build / config files | 3 | 0 | **3** |
| Admin panel pages | 9 | 6 | 3 |
| Admin panel hooks | 4 | 2 | 2 |
| Admin panel components | 14 | 5 | 9 |
| Admin panel setup files | 5 | 0 | **5** |
| **TOTAL** | **83** | **32** | **~51** |

---

## PART 1 — CRITICAL BLOCKERS (App Cannot Launch Without These)

These files are imported by other files that are already coded. If they don't exist,
`npm run dev` will throw `Cannot find module` errors immediately.

---

### 1A. The Crypto Module — COMPLETELY MISSING

Both files are imported in 5+ coded files but have no code anywhere in any document.

**File:** `src/crypto/key-derivation.js`

This is used in `src/supabase/auth.js` (Section 10 of code-complete.md):
```javascript
var kd = require('../crypto/key-derivation');
```

Functions that must be exported (inferred from usage in auth.js):
```
kd.generateDeviceSalt()              → returns hex string (random 32-byte salt)
kd.deriveKey(password, salt)         → returns 256-bit Buffer (PBKDF2, ~100k iterations)
kd.generateVerificationBlob(key)     → returns JSON string for storing key verification
kd.verifyKey(key, verificationBlob)  → returns true/false
```

**File:** `src/crypto/data-encryptor.js`

This is imported in `customers.js`, `items.js`, `bills.js`, `tax-records.js`,
`webhooks.js`, and `auth.js`. Functions that must be exported:
```
encryptor.setKey(derivedKey)                                  → stores key in memory
encryptor.clearKey()                                          → wipes key from memory
encryptor.encryptCustomer(customer)                           → { meta, encryptedData, iv, authTag }
encryptor.decryptCustomer(row, encryptedData, iv, authTag)   → decrypted customer object
encryptor.encryptItem(item)                                   → { meta, encryptedData, iv, authTag }
encryptor.decryptItem(row, encryptedData, iv, authTag)       → decrypted item object
encryptor.encryptBill(bill, items, taxRecord)                 → { meta, encryptedData, iv, authTag }
encryptor.decryptBill(row, encryptedData, iv, authTag)       → decrypted bill object
encryptor.encryptObject(obj)                                  → { encryptedData, iv, authTag }
encryptor.decryptObject(encryptedData, iv, authTag)          → decrypted plain object
```

The encryption algorithm to use: `AES-256-GCM` via Node.js `crypto` module.
The `meta` field should contain non-sensitive searchable fields (name, email,
phone, bill_number, status) for list views to work without decrypting everything.

---

### 1B. GST Engine — COMPLETELY MISSING

All 5 files are referenced in code but have ZERO code written anywhere.
`billflow-part2-implementation.md` only DESCRIBES them — it has no actual JS code.

**File:** `src/gst/calculator.js`

Used in `src/pdf/generator.js` (Section 17) and in `bill-edit.js` (Section 25),
and is the core of the entire billing feature. Must export `GSTCalculator` with:
```
GSTCalculator.getSupplyType(bizStateCode, custStateCode, isUnionTerritory) → 'intrastate'|'interstate'
GSTCalculator.calcLineItem({ quantity, unitPrice, discountPercent, gstRate, supplyType })
  → { quantity, unitPrice, discountPercent, gstRate, supplyType,
      baseAmount, discountAmount, taxableAmount,
      cgstRate, cgstAmount, sgstRate, sgstAmount, igstRate, igstAmount, lineTotal }
GSTCalculator.calcBillTotals(lineResults[])
  → { subtotal, totalDiscount, totalTaxable, totalCGST, totalSGST, totalIGST, roundOff, grandTotal }
GSTCalculator.buildRateWiseBreakdown(lineResults[])
  → [{ rate, taxable, cgst, sgst, igst }, ...]
GSTCalculator.buildHSNBreakdown(lineResults[])
  → [{ hsnSac, description, unit, quantity, taxable, cgst, sgst, igst }, ...]
```

Key rules:
- Intrastate: CGST = SGST = gstRate/2. IGST = 0
- Interstate: IGST = gstRate. CGST = SGST = 0
- Round-off: round grandTotal to nearest rupee, track the difference
- Taxable = (quantity × unitPrice) × (1 - discountPercent/100)

**File:** `src/gst/amount-to-words.js`

Used in `src/pdf/generator.js` (Section 17). Must export:
```
AmountToWords.toWords(amount) → "Rupees One Lakh Eighteen Thousand only"
```
Indian numbering system: lakh, crore. Must handle paise if decimal > 0.

**File:** `src/gst/validators.js`

Used in customer-edit page. Must export:
```
GSTValidators.isValidGSTIN(gstin) → true/false
  Format: 2 digits (state code) + 10 alpha-numeric (PAN) + 1 digit (entity) + 1 'Z' + 1 checksum
GSTValidators.isValidPAN(pan) → true/false
GSTValidators.isValidPhone(phone) → true/false  (10 digits, India)
GSTValidators.isValidPIN(pin) → true/false  (6 digits)
```

**File:** `src/gst/gstr1-export.js`

Used in reports page. Must export:
```
generateGSTR1JSON(dateFrom, dateTo) → structured JSON matching GST portal B2B/B2C/HSN format
```

**File:** `src/gst/test-calculator.js`

Run via `npm run test:gst`. Should test at minimum:
1. Intrastate 18%: qty=10, price=1000, disc=5% → taxable=9500, cgst=855, sgst=855, total=11210
2. Interstate 18%: same input → taxable=9500, igst=1710, cgst=0, sgst=0, total=11210
3. Zero-rated (0%): verify no tax
4. Round-off: grandTotal rounds correctly
5. Discount=0: base_amount equals taxable_amount

---

### 1C. SQLite Migration SQL — SCHEMA MISMATCH

**File:** `src/db/migrations/001_initial.sql`

The SQL in `billflow-part2-implementation.md` Section A.1 is for a **multi-tenant SaaS**
(every table has `organization_id`). But all the code in `billflow-code-complete.md`
uses single-tenant queries WITHOUT `organization_id`. The migration file needs the
**corrected single-tenant schema** that matches the existing code.

The correct schema for this desktop app must have:

```sql
-- CORRECT settings table (code uses key as primary key, not organization_id)
CREATE TABLE IF NOT EXISTS settings (
    key        TEXT PRIMARY KEY,
    value      TEXT,
    updated_at TEXT DEFAULT (datetime('now'))
);

-- REQUIRED: users_local table (used in auth.js but absent from part2 schema)
CREATE TABLE IF NOT EXISTS users_local (
    id            TEXT PRIMARY KEY,
    email         TEXT NOT NULL,
    role          TEXT DEFAULT 'owner',
    access_token  TEXT,
    refresh_token TEXT,
    expires_at    INTEGER,
    created_at    TEXT DEFAULT (datetime('now'))
);

-- customers (NO organization_id — single user app)
CREATE TABLE IF NOT EXISTS customers (
    id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name            TEXT NOT NULL,
    email           TEXT DEFAULT '',
    phone           TEXT DEFAULT '',
    state           TEXT DEFAULT '',
    state_code      TEXT DEFAULT '',
    is_active       INTEGER DEFAULT 1,
    encrypted_data  TEXT,
    enc_iv          TEXT,
    enc_auth_tag    TEXT,
    created_at      TEXT DEFAULT (datetime('now')),
    updated_at      TEXT DEFAULT (datetime('now')),
    deleted_at      TEXT DEFAULT NULL
);

-- items_catalog (single-tenant)
CREATE TABLE IF NOT EXISTS items_catalog (
    id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name            TEXT NOT NULL,
    gst_rate        REAL NOT NULL DEFAULT 18,
    is_active       INTEGER DEFAULT 1,
    encrypted_data  TEXT,
    enc_iv          TEXT,
    enc_auth_tag    TEXT,
    created_at      TEXT DEFAULT (datetime('now')),
    updated_at      TEXT DEFAULT (datetime('now')),
    deleted_at      TEXT DEFAULT NULL
);

-- bills (references customers.id, no organization_id)
CREATE TABLE IF NOT EXISTS bills (
    id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    bill_number     TEXT UNIQUE NOT NULL,
    customer_id     TEXT NOT NULL,
    bill_date       TEXT NOT NULL,
    due_date        TEXT,
    status          TEXT NOT NULL DEFAULT 'draft',
    grand_total     REAL DEFAULT 0,
    amount_paid     REAL DEFAULT 0,
    amount_due      REAL DEFAULT 0,
    encrypted_data  TEXT,
    enc_iv          TEXT,
    enc_auth_tag    TEXT,
    created_by      TEXT DEFAULT '',
    created_at      TEXT DEFAULT (datetime('now')),
    updated_at      TEXT DEFAULT (datetime('now')),
    deleted_at      TEXT DEFAULT NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT
);

-- bill_items
CREATE TABLE IF NOT EXISTS bill_items (
    id                TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    bill_id           TEXT NOT NULL,
    sort_order        INTEGER DEFAULT 0,
    catalog_item_id   TEXT,
    description       TEXT NOT NULL,
    hsn_sac           TEXT DEFAULT '',
    unit              TEXT DEFAULT 'Nos',
    quantity          REAL NOT NULL,
    unit_price        REAL NOT NULL,
    discount_percent  REAL DEFAULT 0,
    gst_rate          REAL NOT NULL,
    base_amount       REAL NOT NULL,
    discount_amount   REAL NOT NULL,
    taxable_amount    REAL NOT NULL,
    cgst_rate         REAL DEFAULT 0,
    cgst_amount       REAL DEFAULT 0,
    sgst_rate         REAL DEFAULT 0,
    sgst_amount       REAL DEFAULT 0,
    igst_rate         REAL DEFAULT 0,
    igst_amount       REAL DEFAULT 0,
    line_total        REAL NOT NULL,
    is_nil_rated      INTEGER DEFAULT 0,
    created_at        TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE
);

-- tax_records (UNIQUE constraint on bill_id — for ON CONFLICT in upsertTaxRecord)
CREATE TABLE IF NOT EXISTS tax_records (
    id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    bill_id         TEXT NOT NULL UNIQUE,
    bill_date       TEXT NOT NULL,
    bill_number     TEXT NOT NULL,
    total_taxable   REAL DEFAULT 0,
    total_cgst      REAL DEFAULT 0,
    total_sgst      REAL DEFAULT 0,
    total_igst      REAL DEFAULT 0,
    total_tax       REAL DEFAULT 0,
    grand_total     REAL DEFAULT 0,
    encrypted_data  TEXT,
    enc_iv          TEXT,
    enc_auth_tag    TEXT,
    created_at      TEXT DEFAULT (datetime('now')),
    updated_at      TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE
);

-- sync_queue
CREATE TABLE IF NOT EXISTS sync_queue (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    operation   TEXT NOT NULL,
    table_name  TEXT NOT NULL,
    record_id   TEXT NOT NULL,
    payload     TEXT,
    retry_count INTEGER DEFAULT 0,
    last_error  TEXT,
    created_at  TEXT DEFAULT (datetime('now'))
);

-- communication_log
CREATE TABLE IF NOT EXISTS communication_log (
    id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    bill_id     TEXT,
    customer_id TEXT,
    channel     TEXT NOT NULL,
    template    TEXT,
    recipient   TEXT,
    sent_at     TEXT DEFAULT (datetime('now')),
    status      TEXT DEFAULT 'sent',
    error_msg   TEXT
);

-- Default settings rows
INSERT OR IGNORE INTO settings (key, value) VALUES
    ('bill_prefix',           'INV'),
    ('bill_next_number',      '1'),
    ('default_gst_rate',      '18'),
    ('setup_complete',        '0'),
    ('notify_daily_summary',  '1'),
    ('notify_weekly_report',  '1'),
    ('notify_monthly_gst',    '1'),
    ('wati_enabled',          '0'),
    ('sms_enabled',           '0'),
    ('notify_owner_whatsapp', '0'),
    ('reminder_7day',         '1'),
    ('reminder_3day',         '1'),
    ('reminder_1day',         '1'),
    ('reminder_channels',     'email');
```

> **Also missing from the part2 schema:** `enc_iv` and `enc_auth_tag` columns on
> `customers`, `items_catalog`, `bills`, `tax_records` — the entire encryption layer
> wasn't in the original schema design but is required by the crypto-enabled code.

---

## PART 2 — MISSING UI (App Renders Blank Without These)

The HTML files are the actual pages the Electron renderer loads.
None of them have been written. The JS controllers for some pages are done
(dashboard.js, bills-list.js, bill-edit.js, settings.js, login.js) but the
HTML structure they inject into doesn't exist.

---

### 2A. Core App Shell

**File:** `src/renderer/index.html` — MISSING

Structure is described in TASK-21 of MASTER.md. Must include:
- `#topbar` with logo, user email, logout button
- `#sidebar` with nav links (data-page attributes)
- `#content` div where pages load
- `#statusbar` with sync badge
- Script tags loading vendor files FIRST, then components, then app.js
  (vendor load order per ADDENDUM TASK-D is critical)

```html
<!-- Required script load order -->
<script src="js/vendor/format-currency.js"></script>
<script src="js/vendor/date-utils.js"></script>
<script src="js/vendor/state-codes.js"></script>
<script src="js/vendor/amount-to-words.js"></script>
<script src="js/vendor/gst-calculator.js"></script>
<script src="js/components/toast.js"></script>
<script src="js/components/modal.js"></script>
<script src="js/components/sync-status.js"></script>
<script src="app.js"></script>
```

---

### 2B. All Page HTML Files — ALL MISSING

| File | Loads With JS Controller | Key HTML Elements Needed |
|------|--------------------------|--------------------------|
| `src/renderer/pages/login.html` | `login.js` | `#login-email`, `#login-password`, `#login-btn`, `#login-error` |
| `src/renderer/pages/dashboard.html` | `dashboard.js` | `#card-total`, `#card-paid`, `#card-unpaid`, `#card-overdue`, `#recent-bills-body`, `#btn-new-bill`, `#btn-new-customer` |
| `src/renderer/pages/bills-list.html` | `bills-list.js` | `#filter-status`, `#filter-search`, `#filter-date-from`, `#filter-date-to`, `#bills-table-body`, `#btn-new-bill`, `#btn-export-csv` |
| `src/renderer/pages/bill-edit.html` | `bill-edit.js` | `#bill-number`, `#bill-date`, `#due-date`, `#customer-display`, `#supply-type-display`, `#items-tbody`, `#btn-add-item`, `#btn-save-draft`, `#btn-save-send`, `#total-subtotal`, `#total-discount`, `#total-taxable`, `#total-cgst`, `#total-sgst`, `#total-igst`, `#total-roundoff`, `#total-grand`, `#amount-words`, `#bill-notes`, `#bill-terms` |
| `src/renderer/pages/bill-view.html` | `bill-view.js` | Invoice layout: business header, bill-to block, items table, totals, bank details, action buttons |
| `src/renderer/pages/customers-list.html` | `customers-list.js` | `#customer-search`, `#customers-tbody`, `#btn-new-customer` |
| `src/renderer/pages/customer-edit.html` | `customer-edit.js` | All customer fields: type, name, GSTIN, state dropdown (from STATE_CODES), address, city, PIN, phone, email, payment_terms, notes. GSTIN validation feedback element. |
| `src/renderer/pages/catalog-list.html` | `catalog-list.js` | `#catalog-search`, `#catalog-tbody`, `#btn-new-item`, modal form |
| `src/renderer/pages/reports.html` | `reports.js` | 4 tab buttons, 4 tab panels: revenue, GST, customer ledger, overdue |
| `src/renderer/pages/settings.html` | `settings.js` | All `s-*` prefixed input IDs, 4 tab sections, `#btn-save-settings`, `#s-n8n_base_url` blur trigger |

---

### 2C. Missing JS Page Controllers

**File:** `src/renderer/js/pages/bill-view.js` — MISSING

Must expose `window.PageControllers['bill-view']`. On init:
1. Read `window._pageParams.billId`
2. Call `window.api.getBillWithItems(billId)`
3. Populate invoice layout (bill header, customer block, items table, totals)
4. Wire Print button → `window.print()`
5. Wire Download PDF button → `window.api.generatePDF(...)` → trigger download
6. Wire Back button → `window.loadPage('bills-list')`

**File:** `src/renderer/js/pages/customers-list.js` — MISSING

Must expose `window.PageControllers['customers-list']`. On init:
1. Load customers via `window.api.listCustomers()`
2. Render table with Name, GSTIN, State, Phone, Email columns
3. Action buttons: View Bills (→ bills-list with customerId filter), Edit (→ customer-edit), Delete (Modal.confirm)
4. Search input with debounce

**File:** `src/renderer/js/pages/customer-edit.js` — MISSING

Handles both create and edit (check `window._pageParams.customerId`). Must:
1. Populate state dropdown from `STATE_CODES` (vendor global)
2. On GSTIN field blur: call `GSTValidators.isValidGSTIN()` and show/hide error
3. Auto-detect state from GSTIN first 2 digits
4. On save: call `window.api.createCustomer()` or `window.api.updateCustomer()`
5. Fire customerSaved webhook

**File:** `src/renderer/js/pages/catalog-list.js` — MISSING

Must expose `window.PageControllers['catalog-list']`. Features:
1. Load items from `window.api.listItems()`
2. Inline edit via modal OR row click expand
3. GST rate dropdown: 0, 5, 12, 18, 28
4. Active/inactive toggle
5. Create/update/delete via API calls

**File:** `src/renderer/js/pages/reports.js` — MISSING

4 tabs with full logic:
1. Revenue Report: date range → bills query → CSV export
2. GST Summary: month/year selector → tax_records query → rate-wise table → GSTR-1 JSON export button
3. Customer Ledger: customer dropdown → filtered bills → summary totals
4. Overdue Report: age buckets (0-30, 31-60, 61-90, 90+) → CSV export

Must include the `exportCSV(headers, rows, filename)` helper and the
`window.api.reportRequest(type, period, emailTo, ccTo)` trigger for emailing.

---

## PART 3 — VENDOR FILES (All 5 Missing)

These are renderer-side copies of main-process modules. Without them, all
renderer pages that call `GSTCalculator.*`, `DateUtils.*`, etc. will crash
because `require()` is not available in the renderer (contextIsolation: true).

Per ADDENDUM TASK-D, the rule is: copy exact IIFE content, remove `module.exports`.

| Vendor File | Source | Status |
|-------------|--------|--------|
| `src/renderer/js/vendor/gst-calculator.js` | `src/gst/calculator.js` | ❌ Source missing too |
| `src/renderer/js/vendor/amount-to-words.js` | `src/gst/amount-to-words.js` | ❌ Source missing too |
| `src/renderer/js/vendor/date-utils.js` | `src/utils/date.js` | ✅ Source exists in code-complete Section 14 |
| `src/renderer/js/vendor/format-currency.js` | `src/utils/format-currency.js` | ✅ Source exists in code-complete Section 15 |
| `src/renderer/js/vendor/state-codes.js` | `src/utils/state-codes.js` | ✅ Source exists in code-complete Section 16 |

> `date-utils.js`, `format-currency.js`, and `state-codes.js` vendor copies can be
> created immediately by copying the IIFE body from their source files (already coded).
> The other two must wait until the source files are written.

---

## PART 4 — CSS FILES (Both Missing)

**File:** `src/renderer/styles-modern.css` — MISSING

Described in TASK-33. All CSS variables and layout rules are spec'd in MASTER.md:
- CSS custom properties: `--color-primary: #1A56DB`, etc.
- Flexbox layout for #app-container, #topbar, #main-layout, #sidebar, #content
- Component classes: `.card`, `.btn`, `.btn-primary`, `.btn-danger`, `.badge-*`
- Status badge colors for all 5 bill states
- Table styles, form input styles, modal overlay/box, toast positioning
- `@media print` rules to hide `.no-print` elements (for bill-view page)

**File:** `src/renderer/styles-legacy.css` — MISSING

Same visual output as modern CSS but XP-compatible constraints (TASK-34):
- No Flexbox, no Grid — float + inline-block + clearfix only
- No CSS variables — hardcoded hex colors
- No border-radius > 4px
- No box-shadow, no transitions, no animations

---

## PART 5 — BUILD & CONFIG FILES

**File:** `electron-builder.config.js` — CLAIMED DONE, VERIFY

Complete_till_now.md claims this exists. Content not in code-complete.md.
Minimum required content:
```javascript
module.exports = {
  appId: 'com.billflow.app',
  productName: 'BillFlow',
  files: ['src/**/*', 'package.json'],
  win: { target: [{ target: 'nsis', arch: ['x64', 'ia32'] }] },
  nsis: { oneClick: false, allowToChangeInstallationDirectory: true },
  extraResources: [{ from: 'assets/', to: 'assets/' }]
};
```

**File:** `scripts/build-legacy.js` — CLAIMED DONE, VERIFY

NW.js build script for Windows XP. Not in any document code.

**File:** `supabase_schema.sql` — CLAIMED DONE, VERIFY

Cloud PostgreSQL tables. The part2-implementation.md has the CREATE TABLE SQL
but it uses multi-tenant `organization_id` pattern. The sync from n8n uses
`owner_id` references. Needs verification that the SQL matches what n8n writes.

---

## PART 6 — ADMIN PANEL GAPS

The billadmin.md has code for 6 pages and core hooks. These are missing:

### Missing Pages (3 pages)

**File:** `billadmin/src/pages/Analytics.jsx` — MISSING

The billadmin.md file structure lists this but provides NO code for it.
Should show: MRR, ARR, ARPU, churn rate, trial-to-paid conversion charts,
revenue by plan breakdown, revenue by state.

**File:** `billadmin/src/pages/Billing.jsx` — MISSING

Should show: upcoming payment schedule for all active users,
payment collection form, outstanding balance per customer,
revenue breakdown by plan.

**File:** `billadmin/src/pages/ActivityLogs.jsx` — MISSING

Should show: full activity log filtered by user/date/action type.
Uses `useActivityLog` hook.

### Missing Hooks (2 hooks)

**File:** `billadmin/src/hooks/usePayments.js` — MISSING

```javascript
// Complete_till_now claims this exists. billadmin.md does NOT code it.
// Should query admin_payments table with filters
export function usePayments(filter) { ... }
```

**File:** `billadmin/src/hooks/useActivityLog.js` — MISSING

```javascript
// Should query admin_activity_log with pagination
export function useActivityLog(filter) { ... }
```

### Missing UI Components (9 components)

| File | Notes |
|------|-------|
| `billadmin/src/components/layout/Topbar.jsx` | Top bar with page title and user info. Referenced in AppLayout.jsx which is coded. |
| `billadmin/src/components/ui/DataTable.jsx` | Generic table used by Users page — may be inline there but needs standalone |
| `billadmin/src/components/billing/PaymentHistory.jsx` | Payment history table (partially inline in UserDetail, needs proper component) |
| `billadmin/src/components/billing/AddPaymentModal.jsx` | Payment modal (inline in UserDetail but not a reusable component) |
| `billadmin/src/components/billing/BillingCalendar.jsx` | Visual calendar of upcoming payments — not coded anywhere |
| `billadmin/src/components/charts/RevenueChart.jsx` | Revenue bar chart (inline in Dashboard.jsx but not a standalone component) |
| `billadmin/src/components/charts/UserGrowthChart.jsx` | User growth line chart (inline in Dashboard.jsx but not standalone) |
| `billadmin/src/components/charts/PlanBreakdownChart.jsx` | Plan breakdown pie/donut chart — not coded at all |
| `billadmin/src/components/ui/ConfirmDialog.jsx` | Listed in billadmin.md structure but not coded |

### Missing Setup Files (5 files — App Won't Start Without These)

| File | Notes |
|------|-------|
| `billadmin/vite.config.js` | Required for `npm run dev` in admin panel |
| `billadmin/index.html` | Vite entry HTML |
| `billadmin/tailwind.config.js` | Tailwind CSS configuration |
| `billadmin/src/main.jsx` | React root render entry point |
| `billadmin/src/styles/index.css` | Tailwind base/components/utilities imports |

These are listed in billadmin.md's file structure but no code is provided. Without `vite.config.js`, `index.html`, and `main.jsx`, the admin panel cannot start at all.

---

## PART 7 — KNOWN BUGS IN EXISTING CODE

Even in files that DO have code, there are bugs that will prevent features from working.

---

### BUG 1 — XMLHttpRequest in Electron Main Process

**Severity: HIGH — Webhooks Won't Fire, Sync Won't Work**

**Affected files:** `src/n8n/webhooks.js` (Section 12), `src/supabase/sync.js` (Section 11)

Both use `new XMLHttpRequest()`. Electron's **main process is a Node.js process**.
`XMLHttpRequest` only exists in the renderer process (browser context). Calling it
from main.js IPC handlers will throw `ReferenceError: XMLHttpRequest is not defined`.

**Fix:** Replace `XMLHttpRequest` with Electron's `net` module in both files:

```javascript
// In webhooks.js and sync.js, replace the xhr block with:
var net = require('electron').net;

function callWebhook(url, payload, callback) {
  var request = net.request({ method: 'POST', url: url });
  request.setHeader('Content-Type', 'application/json');
  request.setHeader('X-BillFlow-Secret', secret);
  request.on('response', function(response) {
    if (callback) callback(response.statusCode > 0);
  });
  request.on('error', function() { if (callback) callback(false); });
  request.write(JSON.stringify(payload));
  request.end();
}
```

> **Note:** For NW.js (XP builds), `XMLHttpRequest` works in both main and renderer.
> You need a runtime check: `if (process.type === 'browser')` in NW.js.
> For Electron, use `require('electron').net`.

---

### BUG 2 — Double Statement Preparation in customers.js

**Severity: LOW — Performance Issue, Not a Crash**

**Affected file:** `src/db/queries/customers.js` (Section 4, `listCustomers` function)

```javascript
// CURRENT (buggy — prepares statement twice):
var rows = db.prepare(sql).all.apply(db.prepare(sql), args);

// CORRECT:
var stmt = db.prepare(sql);
var rows = stmt.all.apply(stmt, args);
```

Same pattern should be checked in items.js, bills.js anywhere `apply` is used.

---

### BUG 3 — getDashboardSummary IPC Channel Mismatch

**Severity: MEDIUM — Dashboard Won't Load**

`dashboard.js` (Section 23) calls `window.api.getDashboardSummary()`.
`preload.js` (Section 28) exposes `getDashboardSummary` mapped to `'db:bills:dashboard'`.
`main.js` (Section 27) registers `ipcMain.handle('db:bills:dashboard', ...)`.
`bills.js` (Section 6) exports `getDashboardSummary`.

This looks correct — however, `getDashboardSummary` in bills.js calls `listBills({ limit: 10 })`
which calls `conn.getDB().prepare(sql).all.apply(...)` with the double-prepare bug.
More importantly, it calls `getBillCountByStatus()` which doesn't have the double-prepare bug
but needs to be verified.

---

### BUG 4 — Missing `updated_at` in settings table

**Severity: MEDIUM — setSetting Will Fail**

`settings.js` (Section 2) inserts with `updated_at`:
```javascript
'INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime("now"))'
```

But the settings table in part2-implementation.md doesn't have `updated_at`.
The corrected 001_initial.sql in Part 1C above includes `updated_at`. Make sure
the SQL migration uses the corrected schema.

---

### BUG 5 — setMultipleSettings Not Exposed in Original preload.js

**Severity: HIGH — Settings Save Will Fail**

`settings.js` (Section 26) calls `window.api.setMultipleSettings(obj)`.
`preload.js` (Section 28) exposes `setMultipleSettings` mapped to `'db:settings:setMultiple'`.
`main.js` (Section 27) registers `ipcMain.handle('db:settings:setMultiple', ...)`.

This is correct in the code-complete.md versions. But double-check that `settings.js` in
`src/db/queries/settings.js` exports `setMultiple` (it does in Section 2). No bug here,
but flagged for verification during testing.

---

### BUG 6 — bill-edit.js References `window.api.incrementBillNumber` but preload Doesn't Expose It

**Severity: MEDIUM — Bill Number Won't Auto-Increment**

In `bill-edit.js` (Section 25):
```javascript
window.api.incrementBillNumber && window.api.incrementBillNumber();
```

In `preload.js` (Section 28), this IS exposed:
```javascript
incrementBillNumber: function() { return ipc('bills:incrementNum', {}); }
```

In `main.js` (Section 27), this IS registered:
```javascript
ipcMain.handle('bills:incrementNum', function() { getModules().billNum.incrementBillNumber(); return { ok:true }; });
```

No bug — flagged as "verify" since the defensive `&&` check suggests the original
spec wasn't sure if it was exposed.

---

## PART 8 — WHAT IS ACTUALLY CONFIRMED DONE

These files have complete, copy-paste-ready code in the provided documents:

### Core Backend (from billflow-code-complete.md)
- `src/db/connection.js` (TASK-02 in MASTER.md)
- `src/db/migrate.js`
- `src/db/queries/settings.js`
- `src/db/queries/sync-queue.js`
- `src/db/queries/customers.js` *(needs crypto module to work)*
- `src/db/queries/items.js` *(needs crypto module to work)*
- `src/db/queries/bills.js` *(needs crypto module to work)*
- `src/db/queries/bill-items.js`
- `src/db/queries/tax-records.js` *(needs crypto module to work)*
- `src/supabase/client.js`
- `src/supabase/auth.js` *(needs crypto module to work)*
- `src/supabase/sync.js` *(has XMLHttpRequest bug)*
- `src/n8n/webhooks.js` *(has XMLHttpRequest bug)*
- `src/utils/bill-number.js`
- `src/utils/date.js`
- `src/utils/format-currency.js`
- `src/utils/state-codes.js`
- `src/pdf/generator.js` *(needs amount-to-words.js to work)*
- `src/renderer/app.js`
- `src/renderer/js/components/toast.js`
- `src/renderer/js/components/modal.js`
- `src/renderer/js/components/sync-status.js`
- `src/renderer/js/pages/login.js`
- `src/renderer/js/pages/dashboard.js`
- `src/renderer/js/pages/bills-list.js`
- `src/renderer/js/pages/bill-edit.js`
- `src/renderer/js/pages/settings.js`
- `src/main.js`
- `src/preload.js`

### Admin Panel (from billadmin.md)
- `billadmin/package.json`
- `billadmin/src/lib/supabase.js`
- `billadmin/src/lib/utils.js`
- `billadmin/src/hooks/useStats.js`
- `billadmin/src/hooks/useUsers.js`
- `billadmin/src/App.jsx`
- `billadmin/src/pages/Login.jsx`
- `billadmin/src/pages/Dashboard.jsx`
- `billadmin/src/pages/Users.jsx`
- `billadmin/src/pages/UserDetail.jsx`
- `billadmin/src/pages/AddUser.jsx`
- `billadmin/src/pages/Trials.jsx`
- `billadmin/src/components/layout/AppLayout.jsx`
- `billadmin/src/components/layout/Sidebar.jsx`
- `billadmin/src/components/ui/KPICard.jsx`
- `billadmin/src/components/ui/StatusBadge.jsx`
- `billadmin/supabase/admin-migrations/001_admin_tables.sql`

---

## PART 9 — RECOMMENDED BUILD ORDER

Build in this exact order — each item unblocks the next.

### 🔴 PHASE A — Must-Do First (Nothing Works Without These)

| # | File | Why First |
|---|------|-----------|
| A1 | `src/db/migrations/001_initial.sql` | Every DB query file needs the schema |
| A2 | `src/crypto/key-derivation.js` | auth.js imports it — login is broken without it |
| A3 | `src/crypto/data-encryptor.js` | All DB queries import it — nothing saves without it |
| A4 | `src/gst/calculator.js` | bill-edit.js uses it, vendor copy needed, PDF uses it |
| A5 | `src/gst/amount-to-words.js` | PDF generator imports it |
| A6 | `src/gst/validators.js` | customer-edit page needs GSTIN validation |
| A7 | Fix XMLHttpRequest bug in webhooks.js and sync.js | n8n integration completely broken |
| A8 | `src/renderer/styles-modern.css` | App renders as unstyled HTML without this |
| A9 | `src/renderer/index.html` | Electron has nothing to load |

### 🟡 PHASE B — UI Pages (After Phase A, App Is Runnable)

| # | File | Depends On |
|---|------|------------|
| B1 | `src/renderer/pages/login.html` | styles, app.js, login.js |
| B2 | `src/renderer/pages/dashboard.html` | styles, dashboard.js |
| B3 | `src/renderer/pages/bills-list.html` | styles, bills-list.js |
| B4 | `src/renderer/pages/bill-edit.html` | styles, bill-edit.js, vendor JS |
| B5 | `src/renderer/js/pages/customers-list.js` | API calls |
| B6 | `src/renderer/pages/customers-list.html` | customers-list.js |
| B7 | `src/renderer/js/pages/customer-edit.js` | GSTValidators vendor |
| B8 | `src/renderer/pages/customer-edit.html` | customer-edit.js |
| B9 | `src/renderer/js/pages/catalog-list.js` | API calls |
| B10 | `src/renderer/pages/catalog-list.html` | catalog-list.js |
| B11 | `src/renderer/pages/settings.html` | settings.js |
| B12 | `src/renderer/js/pages/bill-view.js` | bill display logic |
| B13 | `src/renderer/pages/bill-view.html` | bill-view.js |
| B14 | `src/renderer/js/pages/reports.js` | tax-records API, export logic |
| B15 | `src/renderer/pages/reports.html` | reports.js |

### 🟢 PHASE C — Vendor Files (After GST calculator is written)

| # | File | Source |
|---|------|--------|
| C1 | `src/renderer/js/vendor/gst-calculator.js` | Copy gst/calculator.js, remove module.exports |
| C2 | `src/renderer/js/vendor/amount-to-words.js` | Copy gst/amount-to-words.js, remove module.exports |
| C3 | `src/renderer/js/vendor/date-utils.js` | Copy utils/date.js, remove module.exports |
| C4 | `src/renderer/js/vendor/format-currency.js` | Copy utils/format-currency.js, remove module.exports |
| C5 | `src/renderer/js/vendor/state-codes.js` | Copy utils/state-codes.js, remove module.exports |

### 🔵 PHASE D — Additional Features

| # | File | Priority |
|---|------|----------|
| D1 | `src/gst/gstr1-export.js` | HIGH — required for reports page GSTR-1 export |
| D2 | `src/gst/test-calculator.js` | MEDIUM — validation tool |
| D3 | `src/renderer/styles-legacy.css` | LOW — only needed for XP builds |
| D4 | `electron-builder.config.js` | MEDIUM — required before packaging |
| D5 | `scripts/build-legacy.js` | LOW — only for NW.js XP build |
| D6 | `supabase_schema.sql` | HIGH — needed before going live |

### 🟣 PHASE E — Admin Panel Completion

| # | File |
|---|------|
| E1 | `billadmin/vite.config.js` |
| E2 | `billadmin/index.html` |
| E3 | `billadmin/tailwind.config.js` |
| E4 | `billadmin/src/main.jsx` |
| E5 | `billadmin/src/styles/index.css` |
| E6 | `billadmin/src/components/layout/Topbar.jsx` |
| E7 | `billadmin/src/hooks/usePayments.js` |
| E8 | `billadmin/src/hooks/useActivityLog.js` |
| E9 | `billadmin/src/pages/Analytics.jsx` |
| E10 | `billadmin/src/pages/Billing.jsx` |
| E11 | `billadmin/src/pages/ActivityLogs.jsx` |
| E12 | `billadmin/src/components/billing/PaymentHistory.jsx` |
| E13 | `billadmin/src/components/charts/PlanBreakdownChart.jsx` |
| E14 | `billadmin/src/components/ui/ConfirmDialog.jsx` |

---

## PART 10 — DEPLOYMENT ACTIONS (After Code Is Complete)

These are non-code tasks that must be done to go live:

1. **Supabase cloud tables** — run `supabase_schema.sql` in Supabase SQL Editor
2. **Admin Supabase tables** — run `billadmin/supabase/admin-migrations/001_admin_tables.sql`
3. **n8n Workflow Import** — import `BILLFLOW_ALL_22_WORKFLOWS.json`, set env vars
4. **WATI Template Approval** — submit all 8 WhatsApp templates to Meta for approval (24-48h wait)
5. **MSG91 DLT Registration** — register sender ID and 4 SMS templates on TRAI DLT portal
6. **Admin Panel Deploy** — configure `.env`, `npm run build`, deploy to Vercel
7. **Electron Code Sign** (optional) — for distributing to customers without Windows SmartScreen warning
8. **First Admin User** — insert first row in `admin_users` table, create Supabase auth account

---

## PART 11 — FILES THAT MAY ALREADY EXIST ON DISK

The following files were created in earlier sessions (per complete_till_now.md) but
their code was NOT provided in any document shared now. Verify these exist before rebuilding:

- `src/crypto/key-derivation.js` — **verify first, it's critical**
- `src/crypto/data-encryptor.js` — **verify first, it's critical**
- `src/gst/calculator.js` — **verify first, it's critical**
- `src/gst/amount-to-words.js` — **verify first**
- `src/gst/validators.js` — verify
- `src/gst/gstr1-export.js` — verify
- `src/gst/lookup.js` — mentioned in complete_till_now.md but not in any spec document. Unknown what this does.
- `electron-builder.config.js` — verify
- `scripts/build-legacy.js` — verify
- `supabase_schema.sql` — verify
- `n8n-workflows/BILLFLOW_ALL_22_WORKFLOWS.json` — verify and test import
- All HTML page files — verify each one exists
- `src/renderer/styles-modern.css` — verify
- `src/renderer/styles-legacy.css` — verify
- Admin panel setup files (vite.config.js, index.html, etc.) — verify

**Recommended verification command:**
```bash
# Run in e:\automation\ to see what actually exists
node scripts/check.js
# OR manually:
dir src\crypto\
dir src\gst\
dir src\renderer\pages\
dir src\renderer\js\vendor\
dir billadmin\src\pages\
```

---

## SUMMARY TABLE — PRIORITY MATRIX

| Priority | File Count | Effort | Impact |
|----------|-----------|--------|--------|
| 🔴 Critical (Phase A) | 9 files | High | App cannot start without these |
| 🟡 UI Pages (Phase B) | 15 files | Medium | Core user features |
| 🟢 Vendor Copies (Phase C) | 5 files | Very Low | Copy-paste from existing code |
| 🔵 Additional (Phase D) | 6 files | Medium | Reporting, packaging |
| 🟣 Admin Panel (Phase E) | 14 files | Medium | Admin dashboard completeness |
| **Total Remaining** | **~49 files** | | |

---

*Generated by cross-referencing billflow-code-complete.md, billflow-MASTER.md,*
*billflow-ADDENDUM.md, billflow-n8n-maximum.md, billadmin.md, and*
*billflow-part2-implementation.md against complete_till_now.md claims.*
*Last updated: June 2026*
