# BILLFLOW — MASTER IMPLEMENTATION GUIDE
### For: Claude Code + Qwen Coder 2.5 4B + Gemma 4:4B

> **What this file is:** The single source of truth that Claude Code reads to
> orchestrate local LLMs. Every task card below is a self-contained unit of
> work designed to fit inside a 4B model's context window.
>
> **Source documents:**
> - Full feature spec → `billflow-part1-overview.md`
> - Full DB schema + code reference → `billflow-part2-implementation.md`
> - This file → task breakdown, routing, and prompt templates

---

## HOW TO USE THIS FILE

```
Claude Code reads this file first.
For each task Claude Code sends to a local LLM:

  [PROJECT CONTEXT BLOCK]     ← always prepend this (Section 2)
  +
  [RELEVANT DATA STRUCTURES]  ← from Section 5, only what the task needs
  +
  [TASK CARD]                 ← from Section 7, one task at a time

Qwen Coder 2.5 4B  → all TASK cards tagged  [CODE]
Gemma 4:4B         → all TASK cards tagged  [REASON] or [HTML]
```

---

## SECTION 1: CROSS-REFERENCE INDEX

Use this to find full details in the two source documents.

| Topic | Document | Section |
|-------|---------|---------|
| Full feature list | Part 1 | Section 7 |
| Platform compatibility (XP) | Part 1 | Section 5 |
| Data storage strategy | Part 1 | Section 6 |
| Supabase integration plan | Part 1 | Section 9 |
| n8n automation workflows | Part 1 | Section 10 |
| GST & taxation module | Part 1 | Section 11 |
| UI/UX guidelines + colors | Part 1 | Section 12 |
| Out of scope items | Part 1 | Section 13 |
| SQLite CREATE TABLE SQL | Part 2 | Section A.1 |
| Supabase PostgreSQL SQL | Part 2 | Section A.2 |
| RLS policies SQL | Part 2 | Section A.3 |
| n8n workflow node breakdown | Part 2 | Section B |
| Full folder/file structure | Part 2 | Section C |
| Build guide (Electron + NW.js) | Part 2 | Section D |
| Supabase setup steps | Part 2 | Section E |
| GST calculator JS code | Part 2 | Section F.1 |
| GSTIN validator code | Part 2 | Section F.2 |
| Amount to words code | Part 2 | Section F.3 |
| GST unit test cases | Part 2 | Section F.4 |
| GSTR-1 export code | Part 2 | Section F.5 |
| Full test plan | Part 2 | Section G |

---

## SECTION 2: PROJECT CONTEXT BLOCK

> **Prepend this to EVERY prompt sent to a local LLM.**

```
PROJECT: BillFlow — a desktop billing + GST management app for Indian SMBs.

TECH STACK (do not change these):
- Runtime (modern):  Electron v28, Node.js v20 (Windows 7 to 11)
- Runtime (legacy):  NW.js v0.14.7 (Windows XP SP3 and Vista)
- Local DB:          SQLite via better-sqlite3 npm package
- Cloud DB + Auth:   Supabase (PostgreSQL + Auth)
- Automation:        n8n (self-hosted, HTTP webhooks)
- PDF:               PDFKit npm package
- UI:                HTML + CSS + Vanilla JS only (no React, no Vue, no jQuery)
- Packaging:         electron-builder for modern, NW.js zip for legacy

CRITICAL RULES (never break these):
1. All JS files must be written in ES5 syntax:
   - Use var, not let or const
   - Use function(){}, not () =>
   - Use string concat, not template literals `${}`
   - Use XMLHttpRequest, not fetch()
   - This is required so the same code runs on NW.js (XP) and Electron
2. SQLite is the primary data store — write to SQLite first, ALWAYS
3. Supabase is a backup layer — never block the user waiting for Supabase
4. All Supabase calls go in sync_queue if offline, flushed later
5. No npm packages other than: better-sqlite3, @supabase/supabase-js, pdfkit
6. No CSS frameworks — plain CSS only
7. All monetary amounts stored as REAL in SQLite (2 decimal places)
8. All dates stored as TEXT in 'YYYY-MM-DD' format in SQLite
```

---

## SECTION 3: ARCHITECTURE QUICK REFERENCE

```
USER'S WINDOWS MACHINE
├── BillFlow App (Electron / NW.js)
│   ├── src/renderer/        ← all HTML + CSS + JS UI files
│   ├── src/db/              ← SQLite connection and queries
│   ├── src/gst/             ← tax calculation engine
│   ├── src/supabase/        ← cloud auth + sync
│   ├── src/n8n/             ← webhook fire-and-forget calls
│   ├── src/pdf/             ← invoice PDF generator
│   └── src/utils/           ← helpers (bill number, date, currency)
│
├── SQLite data.db           ← ALL data lives here first
│   └── tables: bills, bill_items, customers, items_catalog,
│               tax_records, settings, sync_queue, users_local
│
└── n8n (running locally on port 5678)
    └── 8 workflows triggered by HTTP webhooks from the app

INTERNET (optional):
└── Supabase Cloud
    ├── Auth (login + JWT sessions)
    └── PostgreSQL (mirror of local SQLite — backup + multi-device)
```

---

## SECTION 4: KEY TECHNOLOGY DECISIONS (already made — do not re-decide)

| Decision | Choice | Reason |
|----------|--------|--------|
| JS syntax | ES5 only | Must run on NW.js v0.14 (Chromium 49, no ES6) |
| UI framework | None (Vanilla JS) | Avoids version conflicts on old Chromium |
| Desktop runtime | Electron (modern) + NW.js (XP) | XP support requires NW.js v0.14 |
| Local DB | SQLite / better-sqlite3 | Synchronous, zero-install, works on XP |
| Cloud | Supabase only | Single platform for auth + DB + realtime |
| Automation | n8n only | All email, reminders, reports flow through n8n |
| CSS layout (modern) | Flexbox | Standard and clean |
| CSS layout (legacy) | Float + inline-block | Flexbox not reliable in Chromium 49 |
| PDF | PDFKit | Works in Node without a browser |
| Bill numbers | Auto-increment with prefix | e.g. INV-2025-001, INV-2025-002 |
| Tax detection | Based on customer state vs business state | Standard GST rule |
| Amounts | Stored as REAL, displayed rounded to 2 decimals | SQL REAL is sufficient |
| Offline conflict resolution | Last `updated_at` timestamp wins | Simple and reliable |

---

## SECTION 5: KEY DATA STRUCTURES

> Include the relevant structure in your LLM prompt when the task uses that object.

### 5.1 Bill Object (from SQLite)
```json
{
  "id": "abc123def456",
  "supabase_id": null,
  "bill_number": "INV-2025-001",
  "customer_id": "cust001",
  "bill_date": "2025-01-15",
  "due_date": "2025-02-14",
  "status": "draft",
  "supply_type": "intrastate",
  "place_of_supply": "27",
  "subtotal": 10000.00,
  "total_discount": 500.00,
  "total_taxable": 9500.00,
  "total_cgst": 855.00,
  "total_sgst": 855.00,
  "total_igst": 0.00,
  "total_tax": 1710.00,
  "round_off": -0.30,
  "grand_total": 11210.00,
  "amount_paid": 0.00,
  "amount_due": 11210.00,
  "notes": "Thank you",
  "terms": "Payment due in 30 days",
  "pdf_path": null,
  "created_at": "2025-01-15T10:30:00",
  "updated_at": "2025-01-15T10:30:00",
  "deleted_at": null
}
```

### 5.2 Bill Line Item Object
```json
{
  "id": "item001",
  "bill_id": "abc123def456",
  "sort_order": 0,
  "catalog_item_id": null,
  "description": "Web Development Services",
  "hsn_sac": "9983",
  "unit": "Hr",
  "quantity": 10,
  "unit_price": 1000.00,
  "discount_percent": 5,
  "gst_rate": 18,
  "base_amount": 10000.00,
  "discount_amount": 500.00,
  "taxable_amount": 9500.00,
  "cgst_rate": 9,
  "cgst_amount": 855.00,
  "sgst_rate": 9,
  "sgst_amount": 855.00,
  "igst_rate": 0,
  "igst_amount": 0.00,
  "line_total": 11210.00
}
```

### 5.3 Customer Object
```json
{
  "id": "cust001",
  "supabase_id": null,
  "type": "business",
  "name": "Rajesh Enterprises",
  "gstin": "27AABCU9603R1ZX",
  "state": "Maharashtra",
  "state_code": "27",
  "billing_address": "123 MG Road",
  "billing_city": "Mumbai",
  "billing_pin": "400001",
  "phone": "9876543210",
  "email": "rajesh@example.com",
  "payment_terms": "net_30",
  "is_active": 1
}
```

### 5.4 Sync Queue Entry
```json
{
  "id": 1,
  "operation": "INSERT",
  "table_name": "bills",
  "record_id": "abc123def456",
  "payload": "{...full JSON of the record...}",
  "retry_count": 0,
  "last_error": null,
  "created_at": "2025-01-15T10:30:00"
}
```

### 5.5 Settings Object (key-value pairs in SQLite)
```
Key examples: business_name, gstin, business_state_code,
bill_prefix, bill_next_number, default_gst_rate,
supabase_url, supabase_anon_key,
n8n_base_url, n8n_wh_bill_created, n8n_wh_bill_sent,
n8n_wh_bill_paid, n8n_wh_customer_added,
last_sync_at, setup_complete
```

### 5.6 GST Rate-Wise Breakdown (stored as JSON TEXT in tax_records)
```json
[
  { "rate": 18, "taxable": 9500.00, "cgst": 855.00, "sgst": 855.00, "igst": 0 }
]
```

---

## SECTION 6: IMPLEMENTATION SEQUENCE

Build in this exact order. Each phase's tasks must complete before the next phase starts.

```
PHASE 1 — FOUNDATION (no UI, no Supabase needed)
  TASK-01  package.json + folder scaffold
  TASK-02  SQLite connection (src/db/connection.js)
  TASK-03  Database migration runner
  TASK-04  Settings queries (read/write settings table)
  TASK-05  Customer queries (CRUD)
  TASK-06  Items catalog queries (CRUD)
  TASK-07  Bill queries (CRUD + list with filters)
  TASK-08  Bill items queries
  TASK-09  Tax records queries
  TASK-10  Sync queue queries
  TASK-11  GST calculator engine
  TASK-12  GSTIN validator + state codes
  TASK-13  Amount to words (Indian format)
  TASK-14  Bill number auto-generator
  TASK-15  n8n webhook caller

PHASE 2 — SUPABASE
  TASK-16  Supabase client init
  TASK-17  Supabase auth (login, logout, session cache)
  TASK-18  Supabase sync (push + pull + conflict resolution)

PHASE 3 — ELECTRON SHELL
  TASK-19  Electron main.js (window, IPC handlers)
  TASK-20  Electron preload.js (window.api bridge)

PHASE 4 — CORE UI
  TASK-21  App shell (index.html + sidebar + router)
  TASK-22  Login page (login.html + login.js)
  TASK-23  Dashboard page
  TASK-24  Bills list page
  TASK-25  Bill edit page (most complex — line items, live GST calc)
  TASK-26  Bill view + print page
  TASK-27  Customers list + edit pages
  TASK-28  Items catalog page
  TASK-29  Reports page
  TASK-30  Settings page

PHASE 5 — PDF + CSS
  TASK-31  PDF generator (src/pdf/generator.js)
  TASK-32  GSTR-1 JSON export
  TASK-33  Modern CSS (styles-modern.css — Flexbox)
  TASK-34  Legacy CSS (styles-legacy.css — Float/inline-block for XP)

PHASE 6 — PACKAGING
  TASK-35  electron-builder.config.js
  TASK-36  Legacy NW.js build script
```

---

## SECTION 7: TASK CARDS

> Each card is a complete self-contained unit. Send one card at a time to the LLM.
> Always prepend the PROJECT CONTEXT BLOCK (Section 2) before the task card.

---

### TASK-01 · Project Scaffold [CODE → Qwen Coder]

**Goal:** Create `package.json` and the empty folder structure.

**Create file:** `package.json`

```json
{
  "name": "billflow",
  "version": "1.0.0",
  "description": "Local-first billing and GST management for Indian SMBs",
  "main": "src/main.js",
  "scripts": {
    "dev": "electron .",
    "build:modern": "electron-builder",
    "test:gst": "node src/gst/test-calculator.js"
  },
  "dependencies": {
    "better-sqlite3": "^9.4.3",
    "@supabase/supabase-js": "^2.39.0",
    "pdfkit": "^0.14.0"
  },
  "devDependencies": {
    "electron": "^28.2.0",
    "electron-builder": "^24.9.1"
  }
}
```

**Create these empty folders:**
```
src/db/queries/
src/db/migrations/
src/gst/
src/supabase/
src/n8n/
src/pdf/pdf/templates/
src/utils/
src/renderer/pages/
src/renderer/js/pages/
src/renderer/js/components/
src/renderer/assets/icons/
n8n-workflows/
supabase/migrations/
dist/
```

---

### TASK-02 · SQLite Connection [CODE → Qwen Coder]

**Goal:** Open the SQLite database file and export the connection.

**Create file:** `src/db/connection.js`

**Rules:** ES5. Must use `better-sqlite3` (synchronous, not async).

```javascript
// EXACT IMPLEMENTATION:
var path = require('path');
var Database = require('better-sqlite3');

var db = null;

function getDBPath() {
  // In Electron: use userData folder so data survives app updates
  // In dev/test: use ./data/data.db relative to project root
  if (process.type === 'renderer') {
    throw new Error('getDB must be called from main process only');
  }
  try {
    var app = require('electron').app;
    return path.join(app.getPath('userData'), 'data.db');
  } catch (e) {
    // Not running in Electron (e.g. unit tests)
    return path.join(__dirname, '../../data/data.db');
  }
}

function getDB() {
  if (!db) {
    var dbPath = getDBPath();
    // Create parent directory if it doesn't exist
    var fs = require('fs');
    var dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) { fs.mkdirSync(dir, { recursive: true }); }

    db = new Database(dbPath);
    db.pragma('foreign_keys = ON');
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');
  }
  return db;
}

function closeDB() {
  if (db) { db.close(); db = null; }
}

module.exports = { getDB: getDB, closeDB: closeDB };
```

---

### TASK-03 · Migration Runner [CODE → Qwen Coder]

**Goal:** Run the SQL migration file on first app launch.

**Create file:** `src/db/migrate.js`

**Logic:**
1. Read `src/db/migrations/001_initial.sql`
2. Execute the entire SQL string using `db.exec(sql)`
3. Only run once — check if `bills` table exists first

```javascript
var fs = require('fs');
var path = require('path');
var getDB = require('./connection').getDB;

function runMigrations() {
  var db = getDB();

  // Check if already migrated
  var tableExists = db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='bills'"
  ).get();

  if (!tableExists) {
    var sqlPath = path.join(__dirname, 'migrations', '001_initial.sql');
    var sql = fs.readFileSync(sqlPath, 'utf8');
    db.exec(sql);
    console.log('Database migrations complete');
  }
}

module.exports = { runMigrations: runMigrations };
```

**Also create:** `src/db/migrations/001_initial.sql`
Copy the ENTIRE SQL from `billflow-part2-implementation.md` **Section A.1** verbatim.

---

### TASK-04 · Settings Queries [CODE → Qwen Coder]

**Create file:** `src/db/queries/settings.js`

**Export these 3 functions:**

```javascript
// getSetting(key) → returns string value or null
// setSetting(key, value) → saves to DB, no return value
// getAllSettings() → returns plain object { key: value, ... }

var getDB = require('../connection').getDB;

function getSetting(key) {
  var row = getDB().prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row ? row.value : null;
}

function setSetting(key, value) {
  getDB().prepare(
    'INSERT INTO settings (key, value) VALUES (?, ?) ' +
    'ON CONFLICT(key) DO UPDATE SET value = excluded.value, ' +
    'updated_at = datetime("now")'
  ).run(key, String(value));
}

function getAllSettings() {
  var rows = getDB().prepare('SELECT key, value FROM settings').all();
  var result = {};
  for (var i = 0; i < rows.length; i++) {
    result[rows[i].key] = rows[i].value;
  }
  return result;
}

module.exports = { getSetting: getSetting, setSetting: setSetting, getAllSettings: getAllSettings };
```

---

### TASK-05 · Customer Queries [CODE → Qwen Coder]

**Create file:** `src/db/queries/customers.js`

**Export these functions — all ES5:**

| Function | Signature | Returns |
|----------|-----------|---------|
| `listCustomers(filter)` | `{ search, isActive }` | Array of customer rows |
| `getCustomer(id)` | `id: string` | Single customer row or null |
| `createCustomer(data)` | data object | `{ id }` |
| `updateCustomer(id, data)` | id, data object | void |
| `deleteCustomer(id)` | id | void (soft delete — sets `deleted_at`) |
| `getCustomerBillSummary(id)` | id | `{ total_billed, total_paid, outstanding }` |

**Rules:**
- `listCustomers`: search matches `name` LIKE `%search%` OR `gstin` LIKE `%search%`
- `createCustomer`: generate `id` as `lower(hex(randomblob(16)))` via SQL default, set `updated_at = datetime('now')`
- `deleteCustomer`: set `deleted_at = datetime('now')` — do NOT use SQL DELETE
- All queries must filter out `deleted_at IS NOT NULL` rows by default
- Add this row to sync_queue after any write: `{ operation: 'INSERT'|'UPDATE'|'DELETE', table_name: 'customers', record_id: id, payload: JSON.stringify(row) }`

**Import needed:** `var getDB = require('../connection').getDB;`

---

### TASK-06 · Items Catalog Queries [CODE → Qwen Coder]

**Create file:** `src/db/queries/items.js`

**Export these functions:**

| Function | Signature | Returns |
|----------|-----------|---------|
| `listItems(filter)` | `{ search, type, isActive }` | Array |
| `getItem(id)` | id | Single row or null |
| `createItem(data)` | data | `{ id }` |
| `updateItem(id, data)` | id, data | void |
| `deleteItem(id)` | id | void (soft delete) |

**`data` fields for create/update:**
`type, name, description, hsn_sac, unit, unit_price, gst_rate, is_active`

Same sync_queue rule as TASK-05.

---

### TASK-07 · Bill Queries [CODE → Qwen Coder]

**Create file:** `src/db/queries/bills.js`

**Export these functions:**

| Function | Returns |
|----------|---------|
| `listBills({ status, customerId, dateFrom, dateTo, search, limit, offset })` | Array with customer name joined |
| `getBill(id)` | Full bill row or null |
| `getBillWithItems(id)` | `{ bill, items, customer }` |
| `createBill(data)` | `{ id }` |
| `updateBill(id, data)` | void |
| `updateBillStatus(id, status)` | void — also updates `updated_at` |
| `deleteBill(id)` | void (soft delete) |
| `getBillCountByStatus()` | `{ draft, sent, paid, overdue, cancelled }` |
| `getMonthlyRevenue(months)` | Array of `{ month, total }` for last N months |

**SQL for `listBills` JOIN:**
```sql
SELECT b.*, c.name as customer_name, c.email as customer_email
FROM bills b
LEFT JOIN customers c ON b.customer_id = c.id
WHERE b.deleted_at IS NULL
```
Add WHERE clauses for each filter if provided.

**`getMonthlyRevenue` SQL:**
```sql
SELECT strftime('%Y-%m', bill_date) as month, SUM(grand_total) as total
FROM bills
WHERE status = 'paid' AND deleted_at IS NULL
  AND bill_date >= date('now', '-' || ? || ' months')
GROUP BY month
ORDER BY month ASC
```

Same sync_queue rule as TASK-05.

---

### TASK-08 · Bill Items Queries [CODE → Qwen Coder]

**Create file:** `src/db/queries/bill-items.js`

**Export these functions:**

| Function | Signature | Returns |
|----------|-----------|---------|
| `getItemsForBill(billId)` | billId | Array ordered by sort_order |
| `replaceItemsForBill(billId, items)` | billId, items array | void |

**`replaceItemsForBill` logic:**
1. `DELETE FROM bill_items WHERE bill_id = ?`
2. For each item in items array: INSERT new row
3. Run inside a transaction: `db.transaction(fn)()`
4. After insert, return all inserted IDs

**Item fields to insert:** All fields from the Bill Line Item Object (Section 5.2). The `id` uses SQLite default `lower(hex(randomblob(16)))`.

---

### TASK-09 · Tax Records Queries [CODE → Qwen Coder]

**Create file:** `src/db/queries/tax-records.js`

**Export these functions:**

| Function | Signature | Returns |
|----------|-----------|---------|
| `upsertTaxRecord(billId, data)` | billId, data | void |
| `getTaxSummary({ dateFrom, dateTo })` | date range | `{ total_taxable, total_cgst, total_sgst, total_igst, total_tax }` |
| `getMonthlyGSTSummary(year)` | year string e.g. '2025' | Array of 12 months with tax totals |
| `getRateWiseSummary({ dateFrom, dateTo })` | date range | Aggregated rate-wise totals from JSON |

**`upsertTaxRecord` SQL:**
```sql
INSERT INTO tax_records (...) VALUES (...)
ON CONFLICT(bill_id) DO UPDATE SET
  total_taxable = excluded.total_taxable,
  total_cgst = excluded.total_cgst,
  ...
  updated_at = datetime('now')
```

Same sync_queue rule as TASK-05.

---

### TASK-10 · Sync Queue Queries [CODE → Qwen Coder]

**Create file:** `src/db/queries/sync-queue.js`

**Export these functions:**

| Function | Signature | Returns |
|----------|-----------|---------|
| `addToQueue(operation, tableName, recordId, payload)` | strings | void |
| `getPendingQueue()` | — | Array ordered by created_at ASC |
| `markSuccess(id)` | queue row id | void (DELETE the row) |
| `markFailed(id, errorMessage)` | id, error | void (increment retry_count, set last_error) |
| `getPendingCount()` | — | Number |
| `clearQueue()` | — | void (DELETE all rows) |

**Rules:**
- `addToQueue`: only add if the same `record_id` + `operation` isn't already queued
  (use `INSERT OR IGNORE` with a UNIQUE constraint, or check first)
- `getPendingQueue`: only return rows with `retry_count < 5`

---

### TASK-11 · GST Calculator Engine [CODE → Qwen Coder]

**Create file:** `src/gst/calculator.js`

**Copy the COMPLETE code** from `billflow-part2-implementation.md` **Section F.1** exactly.

Do not modify it. Do not convert ES5 to ES6. The code is already correct.

**Also create test file:** `src/gst/test-calculator.js`
Copy from `billflow-part2-implementation.md` **Section F.4** exactly.

---

### TASK-12 · GSTIN Validator + State Codes [CODE → Qwen Coder]

**Create file:** `src/gst/validators.js`
Copy from `billflow-part2-implementation.md` **Section F.2** exactly.

**Create file:** `src/utils/state-codes.js`

```javascript
// All 37 Indian GST state codes
var STATE_CODES = {
  '01': 'Jammu & Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '26': 'Dadra & Nagar Haveli and Daman & Diu',
  '27': 'Maharashtra',
  '28': 'Andhra Pradesh',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '35': 'Andaman & Nicobar Islands',
  '36': 'Telangana',
  '37': 'Andhra Pradesh (new)',
  '38': 'Ladakh'
};

function getStateName(code) {
  return STATE_CODES[code] || '';
}

function getAllStates() {
  var result = [];
  for (var code in STATE_CODES) {
    result.push({ code: code, name: STATE_CODES[code] });
  }
  return result.sort(function(a, b) { return a.name.localeCompare(b.name); });
}

module.exports = { STATE_CODES: STATE_CODES, getStateName: getStateName, getAllStates: getAllStates };
```

---

### TASK-13 · Amount to Words [CODE → Qwen Coder]

**Create file:** `src/gst/amount-to-words.js`
Copy from `billflow-part2-implementation.md` **Section F.3** exactly.

---

### TASK-14 · Bill Number Generator [CODE → Qwen Coder]

**Create file:** `src/utils/bill-number.js`

**Purpose:** Generate next bill number like `INV-2025-001`, `INV-2025-002`, etc.

```javascript
var settings = require('../db/queries/settings');

function getNextBillNumber() {
  var prefix = settings.getSetting('bill_prefix') || 'INV';
  var nextNum = parseInt(settings.getSetting('bill_next_number') || '1', 10);
  var year = new Date().getFullYear();

  // Zero-pad to 3 digits minimum
  var padded = String(nextNum);
  while (padded.length < 3) { padded = '0' + padded; }

  return prefix + '-' + year + '-' + padded;
}

function incrementBillNumber() {
  var current = parseInt(settings.getSetting('bill_next_number') || '1', 10);
  settings.setSetting('bill_next_number', String(current + 1));
}

module.exports = { getNextBillNumber: getNextBillNumber, incrementBillNumber: incrementBillNumber };
```

---

### TASK-15 · n8n Webhook Caller [CODE → Qwen Coder]

**Create file:** `src/n8n/webhooks.js`

**Purpose:** Fire-and-forget HTTP POST to n8n. Never block the main thread.
**Rule:** Use `XMLHttpRequest` not `fetch` (ES5 + XP compatibility).

```javascript
var settings = require('../db/queries/settings');

function callWebhook(webhookKey, payload) {
  // webhookKey: setting key e.g. 'n8n_wh_bill_created'
  var url = settings.getSetting(webhookKey);
  if (!url || url.trim() === '') { return; }  // silently skip if not configured

  try {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);  // true = async
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('X-BillFlow-Secret',
      settings.getSetting('n8n_secret') || '');
    xhr.send(JSON.stringify(payload));
    // Do NOT wait for response — fire and forget
  } catch (e) {
    console.error('Webhook call failed:', webhookKey, e.message);
  }
}

// Convenience wrappers
module.exports = {
  billCreated: function(bill, customer, ownerEmail) {
    callWebhook('n8n_wh_bill_created', {
      event: 'bill_created',
      bill_id: bill.id,
      bill_number: bill.bill_number,
      customer_name: customer.name,
      customer_email: customer.email,
      owner_email: ownerEmail,
      grand_total: bill.grand_total,
      bill_date: bill.bill_date,
      due_date: bill.due_date
    });
  },
  billSent: function(bill, customer, ownerEmail, pdfBase64) {
    callWebhook('n8n_wh_bill_sent', {
      event: 'bill_send',
      bill_id: bill.id,
      bill_number: bill.bill_number,
      customer_name: customer.name,
      customer_email: customer.email,
      owner_email: ownerEmail,
      grand_total: bill.grand_total,
      due_date: bill.due_date,
      pdf_base64: pdfBase64 || ''
    });
  },
  billPaid: function(bill, customer, paymentDetails) {
    callWebhook('n8n_wh_bill_paid', {
      event: 'bill_paid',
      bill_id: bill.id,
      bill_number: bill.bill_number,
      customer_email: customer.email,
      amount_paid: paymentDetails.amount_paid,
      payment_date: paymentDetails.payment_date,
      payment_method: paymentDetails.payment_method,
      payment_reference: paymentDetails.payment_reference
    });
  },
  customerAdded: function(customer) {
    callWebhook('n8n_wh_customer_added', {
      event: 'customer_added',
      customer_id: customer.id,
      name: customer.name,
      email: customer.email,
      gstin: customer.gstin
    });
  }
};
```

---

### TASK-16 · Supabase Client Init [CODE → Qwen Coder]

**Create file:** `src/supabase/client.js`

```javascript
var SupabaseJS = require('@supabase/supabase-js');
var settings = require('../db/queries/settings');

var _client = null;

function getSupabaseClient() {
  var url = settings.getSetting('supabase_url');
  var key = settings.getSetting('supabase_anon_key');

  if (!url || !key) { return null; }  // not configured

  if (!_client) {
    _client = SupabaseJS.createClient(url, key, {
      auth: { persistSession: false }  // we handle session persistence in SQLite
    });
  }
  return _client;
}

function resetClient() {
  _client = null;  // call this when settings change
}

module.exports = { getSupabaseClient: getSupabaseClient, resetClient: resetClient };
```

---

### TASK-17 · Supabase Auth [CODE → Qwen Coder]

**Create file:** `src/supabase/auth.js`

**Export these functions:**

| Function | Does |
|----------|------|
| `login(email, password)` | Calls Supabase signIn, caches JWT in `users_local`, returns `{ success, error }` |
| `logout()` | Signs out, clears `users_local` table |
| `getSession()` | Returns cached session from `users_local` or null |
| `isLoggedIn()` | Returns true if valid cached session exists |
| `refreshSession()` | Calls Supabase refresh, updates `users_local` |

**Session caching pattern:**
```javascript
// After successful login:
db.prepare('DELETE FROM users_local').run();
db.prepare('INSERT INTO users_local (id, email, role, access_token, refresh_token, expires_at) VALUES (?,?,?,?,?,?)')
  .run(user.id, user.email, 'owner', session.access_token, session.refresh_token, session.expires_at);

// isLoggedIn check:
var row = db.prepare('SELECT * FROM users_local LIMIT 1').get();
if (!row) return false;
if (row.expires_at < Math.floor(Date.now() / 1000)) return false;  // expired
return true;
```

---

### TASK-18 · Supabase Sync [CODE → Qwen Coder]

**Create file:** `src/supabase/sync.js`

**Export these functions:**

| Function | Does |
|----------|------|
| `pushToSupabase()` | Reads sync_queue, upserts each row to Supabase, marks done or failed |
| `pullFromSupabase()` | Fetches rows newer than `last_sync_at` from Supabase, merges into SQLite |
| `syncNow()` | Calls pushToSupabase() then pullFromSupabase(), updates `last_sync_at` |
| `isOnline()` | Simple HTTP HEAD to Supabase URL, returns true/false |

**`pushToSupabase` logic:**
```
1. If not isOnline() → return immediately
2. Get pending = getPendingQueue() from sync-queue.js
3. For each entry:
   a. Parse entry.payload as JSON
   b. Call supabase.from(entry.table_name).upsert(payload, { onConflict: 'local_id' })
   c. If success → markSuccess(entry.id)
   d. If error → markFailed(entry.id, error.message)
```

**`pullFromSupabase` logic:**
```
1. Get lastSync = getSetting('last_sync_at')
2. For each table in ['customers', 'bills', 'items_catalog', 'tax_records']:
   a. Query Supabase: .from(table).select('*').gt('updated_at', lastSync)
   b. For each returned row:
      - Check local SQLite: does a row with supabase_id = row.id exist?
        YES + local updated_at > row.updated_at → skip (local wins)
        YES + local updated_at <= row.updated_at → UPDATE local
        NO → INSERT local (set supabase_id = row.id)
```

---

### TASK-19 · Electron Main Process [CODE → Qwen Coder]

**Create file:** `src/main.js`

**Must do:**
1. Import `app`, `BrowserWindow`, `ipcMain` from electron
2. Call `runMigrations()` on app ready
3. Create a 1280×800 window loading `src/renderer/index.html`
4. Set `minWidth: 800, minHeight: 600`
5. Set `webPreferences: { preload: path.join(__dirname, 'preload.js'), nodeIntegration: false, contextIsolation: true }`
6. Register IPC handlers for every database operation (see TASK-20)
7. On window close: call `closeDB()`

**IPC channels to register (using `ipcMain.handle`):**

```
db:settings:get      → getSetting(key)
db:settings:set      → setSetting(key, value)
db:settings:getAll   → getAllSettings()
db:customers:list    → listCustomers(filter)
db:customers:get     → getCustomer(id)
db:customers:create  → createCustomer(data)
db:customers:update  → updateCustomer(id, data)
db:customers:delete  → deleteCustomer(id)
db:items:list        → listItems(filter)
db:items:create      → createItem(data)
db:items:update      → updateItem(id, data)
db:items:delete      → deleteItem(id)
db:bills:list        → listBills(filter)
db:bills:get         → getBill(id)
db:bills:getWithItems→ getBillWithItems(id)
db:bills:create      → createBill(data)
db:bills:update      → updateBill(id, data)
db:bills:updateStatus→ updateBillStatus(id, status)
db:bills:delete      → deleteBill(id)
db:bills:counts      → getBillCountByStatus()
db:bills:revenue     → getMonthlyRevenue(months)
db:taxrecords:upsert → upsertTaxRecord(billId, data)
db:taxrecords:summary→ getTaxSummary(filter)
db:sync:pending      → getPendingCount()
auth:login           → auth.login(email, password)
auth:logout          → auth.logout()
auth:session         → auth.getSession()
auth:isLoggedIn      → auth.isLoggedIn()
sync:now             → sync.syncNow()
pdf:generate         → pdfGenerator.generateBillPDF(billWithItems)
bills:nextNumber     → billNumber.getNextBillNumber()
```

---

### TASK-20 · Electron Preload Bridge [CODE → Qwen Coder]

**Create file:** `src/preload.js`

**Purpose:** Expose all IPC calls to the renderer as `window.api`

```javascript
var contextBridge = require('electron').contextBridge;
var ipcRenderer = require('electron').ipcRenderer;

// Generic IPC caller
function ipc(channel, args) {
  return ipcRenderer.invoke(channel, args);
}

contextBridge.exposeInMainWorld('api', {
  // Settings
  getSetting: function(key) { return ipc('db:settings:get', { key: key }); },
  setSetting: function(key, value) { return ipc('db:settings:set', { key: key, value: value }); },
  getAllSettings: function() { return ipc('db:settings:getAll', {}); },

  // Customers
  listCustomers: function(f) { return ipc('db:customers:list', f || {}); },
  getCustomer: function(id) { return ipc('db:customers:get', { id: id }); },
  createCustomer: function(d) { return ipc('db:customers:create', d); },
  updateCustomer: function(id, d) { return ipc('db:customers:update', { id: id, data: d }); },
  deleteCustomer: function(id) { return ipc('db:customers:delete', { id: id }); },

  // Items catalog
  listItems: function(f) { return ipc('db:items:list', f || {}); },
  createItem: function(d) { return ipc('db:items:create', d); },
  updateItem: function(id, d) { return ipc('db:items:update', { id: id, data: d }); },
  deleteItem: function(id) { return ipc('db:items:delete', { id: id }); },

  // Bills
  listBills: function(f) { return ipc('db:bills:list', f || {}); },
  getBill: function(id) { return ipc('db:bills:get', { id: id }); },
  getBillWithItems: function(id) { return ipc('db:bills:getWithItems', { id: id }); },
  createBill: function(d) { return ipc('db:bills:create', d); },
  updateBill: function(id, d) { return ipc('db:bills:update', { id: id, data: d }); },
  updateBillStatus: function(id, s) { return ipc('db:bills:updateStatus', { id: id, status: s }); },
  deleteBill: function(id) { return ipc('db:bills:delete', { id: id }); },
  getBillCounts: function() { return ipc('db:bills:counts', {}); },
  getMonthlyRevenue: function(m) { return ipc('db:bills:revenue', { months: m }); },

  // Tax
  getTaxSummary: function(f) { return ipc('db:taxrecords:summary', f || {}); },

  // Auth
  login: function(e, p) { return ipc('auth:login', { email: e, password: p }); },
  logout: function() { return ipc('auth:logout', {}); },
  isLoggedIn: function() { return ipc('auth:isLoggedIn', {}); },

  // Sync
  syncNow: function() { return ipc('sync:now', {}); },
  getPendingSyncCount: function() { return ipc('db:sync:pending', {}); },

  // PDF
  generatePDF: function(bill) { return ipc('pdf:generate', bill); },

  // Bill number
  getNextBillNumber: function() { return ipc('bills:nextNumber', {}); }
});
```

---

### TASK-21 · App Shell HTML [HTML → Qwen Coder]

**Create file:** `src/renderer/index.html`

**Structure:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BillFlow</title>
  <link rel="stylesheet" href="styles-modern.css">
</head>
<body>
  <div id="app-container">
    <!-- Top bar -->
    <div id="topbar">
      <span id="topbar-logo">BillFlow</span>
      <div id="topbar-right">
        <span id="sync-status">Synced</span>
        <span id="user-email"></span>
        <button id="logout-btn">Logout</button>
      </div>
    </div>
    <!-- Sidebar + Content -->
    <div id="main-layout">
      <nav id="sidebar">
        <ul>
          <li><a href="#" data-page="dashboard">Dashboard</a></li>
          <li><a href="#" data-page="bills-list">Bills</a></li>
          <li><a href="#" data-page="customers-list">Customers</a></li>
          <li><a href="#" data-page="catalog-list">Items</a></li>
          <li><a href="#" data-page="reports">Reports</a></li>
          <li><a href="#" data-page="settings">Settings</a></li>
        </ul>
      </nav>
      <main id="content">
        <!-- Page content loads here -->
        <div id="loading">Loading...</div>
      </main>
    </div>
    <!-- Status bar -->
    <div id="statusbar">
      <span id="sync-badge">● Synced</span>
      <span id="app-version">v1.0.0</span>
    </div>
  </div>
  <script src="js/components/toast.js"></script>
  <script src="js/components/modal.js"></script>
  <script src="js/components/sync-status.js"></script>
  <script src="app.js"></script>
</body>
</html>
```

**Create file:** `src/renderer/app.js`

**Purpose:** Client-side router. On nav link click, load the matching page HTML into `#content`.

```javascript
// ES5 SPA router
var currentPage = null;
var pageCache = {};

function loadPage(pageName) {
  if (currentPage === pageName) return;
  currentPage = pageName;

  // Highlight active nav item
  var links = document.querySelectorAll('[data-page]');
  for (var i = 0; i < links.length; i++) {
    links[i].classList.remove('active');
    if (links[i].getAttribute('data-page') === pageName) {
      links[i].classList.add('active');
    }
  }

  // Load page HTML via XHR (cached after first load)
  if (pageCache[pageName]) {
    renderPage(pageName, pageCache[pageName]);
    return;
  }

  var xhr = new XMLHttpRequest();
  xhr.open('GET', 'pages/' + pageName + '.html', true);
  xhr.onload = function() {
    if (xhr.status === 200) {
      pageCache[pageName] = xhr.responseText;
      renderPage(pageName, xhr.responseText);
    }
  };
  xhr.send();
}

function renderPage(pageName, html) {
  document.getElementById('content').innerHTML = html;
  // Load the page's JS controller
  var script = document.createElement('script');
  script.src = 'js/pages/' + pageName + '.js';
  script.onload = function() {
    if (window.PageControllers && window.PageControllers[pageName]) {
      window.PageControllers[pageName].init();
    }
  };
  document.body.appendChild(script);
}

// Nav click handlers
document.addEventListener('DOMContentLoaded', function() {
  var links = document.querySelectorAll('[data-page]');
  for (var i = 0; i < links.length; i++) {
    links[i].addEventListener('click', function(e) {
      e.preventDefault();
      loadPage(e.target.getAttribute('data-page'));
    });
  }

  // Check login state on startup
  window.api.isLoggedIn().then(function(loggedIn) {
    if (!loggedIn) {
      loadPage('login');
    } else {
      loadPage('dashboard');
    }
  });

  // Logout button
  document.getElementById('logout-btn').addEventListener('click', function() {
    window.api.logout().then(function() { loadPage('login'); });
  });
});
```

---

### TASK-22 · Login Page [HTML → Qwen Coder]

**Create file:** `src/renderer/pages/login.html`
**Create file:** `src/renderer/js/pages/login.js`

**HTML:** Simple centered form with email field, password field, "Login" button, error message div.
**No `<form>` tags** — use `<div>` with button `onclick`.

**JS controller (`window.PageControllers.login`):**
1. Get email and password values
2. Show loading state on button
3. Call `window.api.login(email, password)`
4. On success → `loadPage('dashboard')` + show user email in topbar
5. On error → show error message below fields
6. Clear password field on any attempt

---

### TASK-23 · Dashboard Page [HTML → Qwen Coder]

**Create file:** `src/renderer/pages/dashboard.html`
**Create file:** `src/renderer/js/pages/dashboard.js`

**HTML layout (4 summary cards + recent bills table + quick actions):**
```
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│ Total   │ │ Paid    │ │ Unpaid  │ │ Overdue │
│ Bills   │ │ This Mo │ │ Amount  │ │ Count   │
└─────────┘ └─────────┘ └─────────┘ └─────────┘

[ + New Bill ]  [ + New Customer ]

Recent Bills (last 10)
| Bill No | Customer | Date | Amount | Status |
```

**JS controller:**
- `init()`: call `window.api.getBillCounts()` → fill summary cards
- Load last 10 bills: `window.api.listBills({ limit: 10 })`
- Render bills table with status badges (color-coded spans)
- Quick action buttons call `loadPage('bill-edit')` and `loadPage('customer-edit')`

---

### TASK-24 · Bills List Page [HTML → Qwen Coder]

**Create file:** `src/renderer/pages/bills-list.html`
**Create file:** `src/renderer/js/pages/bills-list.js`

**HTML:** Filter bar (status dropdown, date range, search) + "+ New Bill" button + sortable table.

**Table columns:** Bill No · Customer · Date · Due Date · Amount · Status · Actions

**Actions per row:** View | Edit | Mark Paid | Delete

**JS controller must:**
- Load bills with current filter on `init()`
- Re-load bills on any filter change (debounce search input 300ms)
- Status badge colors: draft=grey, sent=blue, paid=green, overdue=red, cancelled=dark-grey
- "Mark Paid" opens a small modal asking for payment date + method
- Pagination: load 50 at a time, "Load More" button at bottom

---

### TASK-25 · Bill Edit Page (most complex) [CODE → Qwen Coder]

**Create files:**
- `src/renderer/pages/bill-edit.html`
- `src/renderer/js/pages/bill-edit.js`

**This page handles both CREATE (no bill_id) and EDIT (bill_id in URL hash).**

**Form sections:**
1. Top: Bill Number (auto), Bill Date, Due Date, Status
2. Customer picker: searchable dropdown → select customer or "+ New"
3. Line items table (dynamic rows):
   - Columns: Description | HSN/SAC | Qty | Unit | Price | Disc% | GST% | CGST | SGST | IGST | Total
   - "+ Add Item" button adds a new empty row
   - Each row has a delete button
   - Selecting from catalog auto-fills description, HSN, price, GST rate
4. Totals panel (auto-calculated, read-only):
   - Subtotal · Discount · Taxable · CGST · SGST · IGST · Round-off · **Grand Total**
   - Amount in words (below grand total)
5. Notes + Terms textareas
6. Action buttons: Save Draft | Save & Send | Preview PDF | Cancel

**Critical JS behaviour in `bill-edit.js`:**

```javascript
// On ANY change to a line item field → recalculate that row + all totals
function recalculateLine(rowIndex) {
  var qty   = parseFloat(getField(rowIndex, 'qty'))   || 0;
  var price = parseFloat(getField(rowIndex, 'price')) || 0;
  var disc  = parseFloat(getField(rowIndex, 'disc'))  || 0;
  var rate  = parseFloat(getField(rowIndex, 'gst'))   || 0;

  var result = GSTCalculator.calcLineItem({
    quantity: qty, unitPrice: price, discountPercent: disc,
    gstRate: rate, supplyType: currentSupplyType   // set from customer state vs business state
  });

  // Update display fields in this row
  setField(rowIndex, 'taxable', result.taxableAmount.toFixed(2));
  setField(rowIndex, 'cgst',    result.cgstAmount.toFixed(2));
  setField(rowIndex, 'sgst',    result.sgstAmount.toFixed(2));
  setField(rowIndex, 'igst',    result.igstAmount.toFixed(2));
  setField(rowIndex, 'total',   result.lineTotal.toFixed(2));

  recalculateTotals();  // update the summary panel
}
```

**Supply type detection (call when customer is selected):**
```javascript
function detectSupplyType(customer) {
  var bizState = currentSettings['business_state_code'] || '';
  var custState = customer.state_code || '';
  return GSTCalculator.getSupplyType(bizState, custState, false);
}
```

**On Save:**
1. Collect all line item data from DOM
2. Recalculate all lines + totals
3. Call `window.api.createBill(billData)` or `window.api.updateBill(id, billData)`
4. Replace bill items: `window.api.replaceBillItems(billId, items)`
5. Upsert tax record with rate-wise and HSN breakdown
6. Increment bill number (on new bill only)
7. If "Save & Send": generate PDF → fire n8n webhook

**Auto-save draft:** Every 60 seconds, silently save if form has changes.

---

### TASK-26 · Bill View + Print Page [HTML → Qwen Coder]

**Create files:**
- `src/renderer/pages/bill-view.html`
- `src/renderer/js/pages/bill-view.js`

**Purpose:** Show a read-only rendered preview of the bill exactly as it will look on the PDF.

**Layout mirrors an invoice:**
```
[ Business Logo ]              [ Bill Number: INV-2025-001 ]
[ Business Name + GSTIN ]      [ Bill Date / Due Date ]

Bill To:                       Place of Supply: [State]
[Customer Name]
[Address + GSTIN]

| # | Description | HSN | Qty | Rate | Disc | Taxable | CGST | SGST | IGST | Total |

Subtotal: ___   Notes: ___
Discount: ___
Taxable:  ___   Terms: ___
CGST:     ___
SGST:     ___   Bank Details: ___
Grand Total: ___
Amount in Words: ___

Action buttons (not printed): [ Print ] [ Download PDF ] [ Back ]
```

**Print:** `window.print()` — use CSS `@media print` to hide action buttons.

---

### TASK-27 · Customers Pages [HTML → Qwen Coder]

**Create files:**
- `src/renderer/pages/customers-list.html` + `.js`
- `src/renderer/pages/customer-edit.html` + `.js`

**Customers List:** Search bar + table (Name, GSTIN, State, Phone, Email, Actions).
Actions: View Bills | Edit | Delete.

**Customer Edit (create + edit):** Form with all customer fields.
Fields: type toggle (Business/Individual), Name*, GSTIN (with format validation),
State dropdown (from state-codes.js), Address, City, PIN, Phone, Email,
Payment Terms dropdown, Notes.
Validate GSTIN format using `GSTValidators.isValidGSTIN()` on blur.
Show red border + error text if invalid.

---

### TASK-28 · Items Catalog Page [HTML → Qwen Coder]

**Create files:**
- `src/renderer/pages/catalog-list.html` + `.js`

**Table:** Name, Type (Product/Service), HSN/SAC, Unit Price, GST Rate, Active toggle.
**Edit inline** or open a small modal for create/edit.
**Fields:** type, name, description, hsn_sac, unit, unit_price, gst_rate.
GST rate is a dropdown: 0 / 5 / 12 / 18 / 28.

---

### TASK-29 · Reports Page [HTML → Qwen Coder]

**Create files:**
- `src/renderer/pages/reports.html` + `.js`

**Tab layout with 4 tabs:**

**Tab 1: Revenue Report**
- Date range picker (From – To)
- Summary: Total Bills, Total Revenue, Total Paid, Total Unpaid
- Table: Bill No, Customer, Date, Amount, Status
- Export CSV button

**Tab 2: GST Tax Collected**
- Period selector: Month (MM/YYYY)
- Summary table: Rate | Taxable | CGST | SGST | IGST | Total
- Export JSON (GSTR-1 format) button

**Tab 3: Customer Ledger**
- Customer dropdown
- Table of all bills for that customer
- Summary: Total Billed, Total Paid, Outstanding

**Tab 4: Overdue Report**
- Table of all overdue + unpaid bills
- Ageing columns: 0–30 days | 31–60 days | 61–90 days | 90+ days
- Export CSV button

**CSV Export function (reuse across tabs):**
```javascript
function exportCSV(headers, rows, filename) {
  var csv = headers.join(',') + '\n';
  for (var i = 0; i < rows.length; i++) {
    csv += rows[i].map(function(v) {
      return '"' + String(v || '').replace(/"/g, '""') + '"';
    }).join(',') + '\n';
  }
  var blob = new Blob([csv], { type: 'text/csv' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
```

---

### TASK-30 · Settings Page [HTML → Qwen Coder]

**Create files:**
- `src/renderer/pages/settings.html` + `.js`

**Tab layout with 4 tabs:**

**Business Profile:** business_name, gstin (with validation), business_state (dropdown),
business_address, business_city, business_pin, pan, bank_name, bank_account, bank_ifsc.
Logo upload input (saves to userData folder, stores path in settings).

**Bill Template:** bill_prefix, bill_start_number, date_format, terms_default, footer_text.
Preview of bill number: "Next bill will be: INV-2025-005".

**Integrations:**
- Supabase URL + anon key fields + "Test Connection" button
- n8n Base URL + individual webhook URL fields (one per workflow)
- "Test n8n Connection" button (sends a test POST)

**Data & Backup:**
- "Export Backup (.db file)" button → copies data.db to user's chosen location
- "Export All Bills as CSV" button
- "App Version" display

**On each tab save:** Call `window.api.setSetting(key, value)` for each field.
Show green "Saved" toast after save.

---

### TASK-31 · PDF Generator [CODE → Qwen Coder]

**Create file:** `src/pdf/generator.js`

**Uses:** PDFKit (`var PDFDocument = require('pdfkit');`)

**Function to export:**
```javascript
// generateBillPDF(billData) → returns Buffer (binary PDF)
// billData shape: { bill, items, customer, settings }
// where settings = getAllSettings() result
```

**PDF content must include:**
- Business logo (if logo_path set and file exists)
- Business name (bold, large), address, GSTIN
- "TAX INVOICE" heading
- Bill number, bill date, due date
- "Bill To" block: customer name, address, GSTIN
- Place of supply
- Line items table: Description | HSN | Qty | Unit | Rate | Disc% | Taxable | CGST | SGST | IGST | Total
- Totals section: Subtotal, Discount, Taxable, CGST, SGST, IGST, Round-off, Grand Total (bold)
- Amount in words
- Notes and Terms
- Bank details (if set in settings)
- Return the PDF as a Buffer using:
  ```javascript
  var buffers = [];
  doc.on('data', function(c) { buffers.push(c); });
  doc.on('end', function() { resolve(Buffer.concat(buffers)); });
  doc.end();
  ```

---

### TASK-32 · GSTR-1 Export [CODE → Qwen Coder]

**Create file:** `src/gst/gstr1-export.js`
Copy from `billflow-part2-implementation.md` **Section F.5** exactly.

---

### TASK-33 · Modern CSS [HTML → Qwen Coder]

**Create file:** `src/renderer/styles-modern.css`

**Apply the color tokens from Part 1 Section 12:**
- `--color-primary: #1A56DB`
- `--color-success: #0E9F6E`
- `--color-warning: #FF8A00`
- `--color-danger: #E02424`
- `--color-bg: #F3F4F6`
- `--color-surface: #FFFFFF`
- `--color-border: #E5E7EB`
- `--color-text: #111928`
- `--color-text-muted: #6B7280`

**Layout rules:**
- `#app-container`: full height flexbox column
- `#topbar`: fixed height 48px, flex row, white background, border-bottom
- `#main-layout`: flex row, flex: 1, overflow hidden
- `#sidebar`: width 200px, white background, border-right, overflow-y auto
- `#content`: flex: 1, overflow-y auto, padding 24px, background `--color-bg`
- `#statusbar`: height 28px, background #374151, color white, font-size 11px

**Component styles needed:**
- `.card`: white, border-radius 8px, padding 20px, box-shadow subtle
- `.btn`: padding 8px 16px, border-radius 6px, cursor pointer
- `.btn-primary`: bg `--color-primary`, color white
- `.btn-danger`: bg `--color-danger`, color white
- `.badge`: inline-block, small padding, border-radius 12px
- `.badge-draft`: bg #E5E7EB, color #374151
- `.badge-sent`: bg #DBEAFE, color #1E40AF
- `.badge-paid`: bg #D1FAE5, color #065F46
- `.badge-overdue`: bg #FEE2E2, color #991B1B
- `.badge-cancelled`: bg #F3F4F6, color #6B7280
- `table`: full width, border-collapse collapse, `th` bg #F9FAFB, text-align left
- `input, select, textarea`: full width, border 1px solid `--color-border`, border-radius 6px, padding 8px
- `.form-group`: margin-bottom 16px, `label` display block, font-size 14px, margin-bottom 4px
- `.toast`: fixed bottom-right, bg #111928, color white, padding 12px 20px, border-radius 8px

---

### TASK-34 · Legacy CSS (Windows XP) [HTML → Qwen Coder]

**Create file:** `src/renderer/styles-legacy.css`

**Same visual result as modern CSS but using ONLY:**
- `float: left/right` and `clear: both` for layout — no Flexbox, no Grid
- Hardcoded hex colors — no CSS variables (`var(--x)`)
- No `border-radius` over 4px (unreliable in Chromium 49)
- No `box-shadow` (performance on low-RAM XP machines)
- No `transition` or `animation`

**XP-compatible layout pattern:**
```css
/* Instead of: display: flex; gap: 16px; */
.sidebar { float: left; width: 200px; }
.content { margin-left: 216px; }
.clearfix:after { content: ''; display: block; clear: both; }
```

---

### TASK-35 · Electron Builder Config [CODE → Qwen Coder]

**Create file:** `electron-builder.config.js`
Copy the config from `billflow-part2-implementation.md` **Section D.4** exactly.

---

### TASK-36 · Legacy NW.js Build Script [CODE → Qwen Coder]

**Create file:** `scripts/build-legacy.js`

Follow the logic described in `billflow-part2-implementation.md` **Section D.5** exactly.

---

## SECTION 8: COMPONENT SNIPPETS (copy into relevant task prompts)

### Toast Notification Component

**Create file:** `src/renderer/js/components/toast.js`

```javascript
// Usage: Toast.show('Bill saved', 'success')  or  Toast.show('Error', 'error')
var Toast = (function() {
  function show(message, type) {
    var el = document.createElement('div');
    el.className = 'toast toast-' + (type || 'info');
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(function() {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 3000);
  }
  return { show: show };
}());
```

### Confirm Modal Component

**Create file:** `src/renderer/js/components/modal.js`

```javascript
// Usage: Modal.confirm('Delete this bill?', function() { doDelete(); });
var Modal = (function() {
  function confirm(message, onYes) {
    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML =
      '<div class="modal-box">' +
      '<p>' + message + '</p>' +
      '<button class="btn btn-danger" id="modal-yes">Yes, Delete</button> ' +
      '<button class="btn" id="modal-no">Cancel</button>' +
      '</div>';
    document.body.appendChild(overlay);

    document.getElementById('modal-yes').onclick = function() {
      document.body.removeChild(overlay);
      onYes();
    };
    document.getElementById('modal-no').onclick = function() {
      document.body.removeChild(overlay);
    };
  }
  return { confirm: confirm };
}());
```

### Sync Status Updater

**Create file:** `src/renderer/js/components/sync-status.js`

```javascript
var SyncStatus = (function() {
  function update() {
    window.api.getPendingSyncCount().then(function(count) {
      var el = document.getElementById('sync-badge');
      if (!el) return;
      if (count === 0) {
        el.textContent = '● Synced';
        el.style.color = '#0E9F6E';
      } else {
        el.textContent = '● ' + count + ' pending';
        el.style.color = '#FF8A00';
      }
    });
  }
  // Poll every 30 seconds
  setInterval(update, 30000);
  return { update: update };
}());
```

---

## SECTION 9: LLM ROUTING GUIDE

| Task Type | Send to | Why |
|-----------|---------|-----|
| Node.js / JS logic files | **Qwen Coder 2.5 4B** | Optimised for code generation |
| SQL queries | **Qwen Coder 2.5 4B** | Strong SQL understanding |
| HTML page structure | **Qwen Coder 2.5 4B** | Handles HTML well |
| CSS files | **Qwen Coder 2.5 4B** | Good at CSS rules |
| Config files (JSON, JS) | **Qwen Coder 2.5 4B** | Structured output |
| Writing text content (terms, messages) | **Gemma 4:4B** | Better at natural language |
| Debugging/explaining code | **Gemma 4:4B** | Better general reasoning |
| Architecture decisions | **Do not ask local LLMs** → Claude Code decides | Too complex for 4B |

### Optimal Prompt Length for 4B Models
- Maximum context to send: ~2,500 tokens per prompt
- PROJECT CONTEXT BLOCK = ~400 tokens
- Leave ~2,000 tokens for the actual task card + any code examples
- If a task card is too long: split it into sub-tasks

### What to always include in every 4B LLM prompt
```
1. PROJECT CONTEXT BLOCK (Section 2) — always first
2. The specific task card
3. The data structures relevant to that task (from Section 5)
4. "Return ONLY the file content. No explanation. No markdown fences."
```

---

## SECTION 10: VALIDATION CHECKLIST

After each task, Claude Code should validate:

```
PHASE 1 TASKS:
[ ] src/db/connection.js — require() and call getDB() — should not throw
[ ] 001_initial.sql — db.exec() runs without error
[ ] All query files — call each function with test data, check return shapes
[ ] GST calculator — run test-calculator.js — all 5 tests pass
[ ] Bill number — getNextBillNumber() returns 'INV-YYYY-001' format
[ ] Webhooks — callWebhook with empty URL silently skips (no crash)

PHASE 2 TASKS:
[ ] Supabase client — getSupabaseClient() returns null when no URL configured
[ ] Auth login — returns { success: false, error: 'message' } on wrong credentials
[ ] Sync — getPendingCount() returns 0 on fresh DB

PHASE 3 TASKS:
[ ] main.js — app launches, window opens, DevTools show no errors
[ ] preload.js — window.api is defined in renderer console

PHASE 4 TASKS:
[ ] Login page — wrong password shows error, correct logs in
[ ] Dashboard — 4 cards load with numbers from DB
[ ] Bill edit — adding 2 line items at 18% intrastate calculates CGST/SGST correctly
[ ] Bill list — filters update the table without page reload

PHASE 5 TASKS:
[ ] PDF generator — generateBillPDF() returns a Buffer (typeof Buffer)
[ ] Modern CSS — app looks correct at 1280×800
[ ] Legacy CSS — app layout is usable at 800×600 with no Flexbox

PHASE 6 TASKS:
[ ] electron-builder — npm run build:modern produces a .exe in dist/
```

---

*End of BILLFLOW MASTER IMPLEMENTATION GUIDE*
*Source documents: billflow-part1-overview.md · billflow-part2-implementation.md*
*This file is the CLAUDE.md for the billflow project directory.*
