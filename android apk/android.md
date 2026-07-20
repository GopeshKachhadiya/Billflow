# BillFlow Android APK — Complete Conversion Specification

> **Source Project:** BillFlow Electron Desktop App (`e:\automation`)
> **Target Platform:** Android 8.0+ (API 26+)
> **Document Version:** 1.0 — July 2026

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Technology Stack Decision](#2-technology-stack-decision)
3. [Project Initialization](#3-project-initialization)
4. [Android Permissions Required](#4-android-permissions-required)
5. [Database Schema & Migration](#5-database-schema--migration)
6. [Authentication & Session Management](#6-authentication--session-management)
7. [Encryption Layer](#7-encryption-layer)
8. [Navigation Architecture](#8-navigation-architecture)
9. [Screen-by-Screen Specification](#9-screen-by-screen-specification)
10. [PDF Generation](#10-pdf-generation)
11. [WhatsApp Integration](#11-whatsapp-integration)
12. [Supabase Cloud Sync](#12-supabase-cloud-sync)
13. [n8n Webhook Connectivity](#13-n8n-webhook-connectivity)
14. [UI/UX Design System](#14-uiux-design-system)
15. [Offline-First Architecture](#15-offline-first-architecture)
16. [Push Notifications](#16-push-notifications)
17. [APK Build & Distribution](#17-apk-build--distribution)
18. [Development Roadmap](#18-development-roadmap)

---

## 1. Executive Summary

BillFlow is a local-first GST billing & invoice management system currently built as an **Electron desktop application** using vanilla JavaScript, SQLite (via `better-sqlite3`), PDFKit, Supabase authentication, n8n webhooks, and Baileys for WhatsApp messaging.

This document provides a **complete specification** for converting it into an **Android APK** that:
- Runs natively on Android phones and tablets
- Maintains the same offline-first SQLite database
- Syncs with Supabase cloud when online
- Generates PDF invoices on-device
- Sends bills via WhatsApp directly from the seller's personal number
- Preserves the existing encryption layer for sensitive data (AES-256-GCM)

---

## 2. Technology Stack Decision

### Recommended: React Native + Expo

| Layer | Desktop (Current) | Android (Proposed) |
|-------|-------------------|-------------------|
| **Framework** | Electron (Chromium) | React Native + Expo |
| **Language** | Vanilla JS (ES5) | JavaScript/TypeScript (React) |
| **Database** | `better-sqlite3` | `expo-sqlite` (SQLite on device) |
| **PDF Generation** | `pdfkit` (Node.js) | `react-native-html-to-pdf` or `expo-print` |
| **Encryption** | Node.js `crypto` | `expo-crypto` + `react-native-aes-gcm-crypto` |
| **WhatsApp** | Baileys (WebSocket) | Android Intent Share (`react-native-share`) + optional Baileys via background service |
| **Cloud Auth** | `@supabase/supabase-js` | `@supabase/supabase-js` (same library) |
| **HTTP/Webhooks** | `fetch` / `electron.net` | `fetch` (native) |
| **QR Code** | `qrcode.js` (browser) | `react-native-qrcode-svg` |
| **Navigation** | Custom SPA router | `@react-navigation/native` |
| **State Management** | Global `window.*` | React Context + `useReducer` |
| **File Sharing** | `shell.openExternal` | `react-native-share` / `expo-sharing` |

### Why React Native + Expo?
1. **JavaScript reuse:** ~70% of the business logic (GST calculation, tax records, bill number formatting, encryption helpers) can be directly reused.
2. **SQLite compatibility:** `expo-sqlite` uses the exact same SQL syntax as `better-sqlite3`.
3. **Single codebase:** Can produce both Android APK and iOS IPA from the same project.
4. **Expo EAS Build:** Free cloud builds for APK generation without Android Studio on developer machine.

### Alternative: Capacitor (Wrap existing HTML)
If speed is the priority, the existing HTML/CSS/JS pages can be wrapped inside a Capacitor WebView shell. This gives a quick APK but with worse performance and native-feel compared to React Native.

---

## 3. Project Initialization

```bash
# Create the React Native project with Expo
npx create-expo-app@latest BillFlowMobile --template blank-typescript

# Install core dependencies
npx expo install expo-sqlite expo-file-system expo-sharing expo-print expo-crypto
npm install @supabase/supabase-js @react-navigation/native @react-navigation/bottom-tabs
npm install react-native-screens react-native-safe-area-context
npm install react-native-qrcode-svg react-native-svg
npm install react-native-share react-native-html-to-pdf
npm install react-native-aes-gcm-crypto
```

### Recommended Project Structure

```
BillFlowMobile/
├── app/                          # Expo Router pages
│   ├── (auth)/
│   │   └── login.tsx
│   ├── (tabs)/
│   │   ├── dashboard.tsx
│   │   ├── bills.tsx
│   │   ├── customers.tsx
│   │   ├── items.tsx
│   │   ├── reports.tsx
│   │   └── settings.tsx
│   ├── bill/
│   │   ├── [id].tsx              # Bill view
│   │   └── edit.tsx              # Bill create/edit
│   ├── customer/
│   │   └── [id].tsx              # Customer create/edit
│   └── _layout.tsx
├── src/
│   ├── db/
│   │   ├── connection.ts         # expo-sqlite initialization
│   │   ├── migrate.ts            # Schema migration runner
│   │   └── queries/
│   │       ├── settings.ts
│   │       ├── customers.ts
│   │       ├── items.ts
│   │       ├── bills.ts
│   │       ├── bill-items.ts
│   │       ├── tax-records.ts
│   │       └── sync-queue.ts
│   ├── crypto/
│   │   └── data-encryptor.ts     # AES-256-GCM via react-native-aes-gcm-crypto
│   ├── gst/
│   │   ├── calculator.ts         # GST computation (direct port)
│   │   └── gstr1-export.ts       # GSTR-1 JSON builder
│   ├── pdf/
│   │   └── generator.ts          # HTML-to-PDF invoice renderer
│   ├── sync/
│   │   └── supabase-sync.ts      # Cloud sync engine
│   ├── whatsapp/
│   │   └── sender.ts             # WhatsApp share/Baileys integration
│   ├── webhooks/
│   │   └── n8n.ts                # n8n webhook caller
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   ├── SettingsContext.tsx
│   │   └── SyncContext.tsx
│   ├── components/
│   │   ├── Toast.tsx
│   │   ├── Modal.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── DataTable.tsx
│   │   └── FormField.tsx
│   └── theme/
│       └── tokens.ts             # Design system color/font tokens
├── assets/
│   ├── logo.png
│   └── fonts/
├── app.json                      # Expo configuration
└── package.json
```

---

## 4. Android Permissions Required

Add these to `app.json` under `expo.android.permissions`:

| Permission | Why Needed |
|-----------|-----------|
| `INTERNET` | Supabase auth, n8n webhooks, sync, GSTIN lookup |
| `ACCESS_NETWORK_STATE` | Check online/offline status before sync |
| `WRITE_EXTERNAL_STORAGE` | Save generated PDF invoices to device storage |
| `READ_EXTERNAL_STORAGE` | Upload logo/signature images from gallery |
| `CAMERA` | Scan QR codes (WhatsApp linking, UPI QR scan) |
| `RECEIVE_BOOT_COMPLETED` | Auto-start background sync service on boot |
| `VIBRATE` | Haptic feedback on button press |
| `FOREGROUND_SERVICE` | Background WhatsApp connection (Baileys) |

```json
{
  "expo": {
    "android": {
      "permissions": [
        "INTERNET",
        "ACCESS_NETWORK_STATE",
        "WRITE_EXTERNAL_STORAGE",
        "READ_EXTERNAL_STORAGE",
        "CAMERA",
        "RECEIVE_BOOT_COMPLETED",
        "VIBRATE",
        "FOREGROUND_SERVICE"
      ],
      "package": "com.billflow.app"
    }
  }
}
```

---

## 5. Database Schema & Migration

### 5.1 Tables (Identical to Desktop SQLite)

The Android app uses **the exact same SQLite schema** as the desktop Electron app. All tables are carried over:

#### Table 1: `settings`
```sql
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
**Purpose:** Stores all app configuration key-value pairs (business name, GSTIN, bank details, n8n URLs, WATI tokens, bill prefix, etc.)

**Default Settings Keys (38 keys):**
- `business_name`, `gstin`, `business_address`, `business_city`, `business_state`, `business_state_code`, `business_pin`, `pan`
- `bank_name`, `bank_account`, `bank_ifsc`
- `bill_prefix` (default: `INV`), `bill_next_number` (default: `1`), `default_gst_rate` (default: `18`)
- `upi_id`, `business_phone`, `business_email`
- `email_from_name`, `email_from_address`, `smtp_host`, `smtp_port`, `smtp_user`, `smtp_pass`
- `accountant_email`
- `wati_enabled` (default: `0`), `wati_api_url`, `wati_api_token`, `business_phone_wa`
- `sms_enabled`, `msg91_auth_key`, `msg91_sender_id`, `msg91_dlt_template_id`
- `n8n_base_url` (default: `http://localhost:5678`), `n8n_secret`
- `n8n_wh_bill_cancelled`, `n8n_wh_customer_saved`, `n8n_wh_item_saved`, `n8n_wh_sync_push`, `n8n_wh_report_request`, `n8n_wh_bill_viewed`
- `notify_owner_email`, `notify_owner_whatsapp`, `notify_owner_phone`
- `notify_daily_summary`, `notify_weekly_report`, `notify_monthly_gst`
- `reminder_7day`, `reminder_3day`, `reminder_1day`, `reminder_channels`
- `overdue_followup_days`
- `supabase_url`, `supabase_anon_key`
- `last_sync_at`, `setup_complete`

#### Table 2: `users_local`
```sql
CREATE TABLE IF NOT EXISTS users_local (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    role TEXT,
    access_token TEXT,
    refresh_token TEXT,
    expires_at INTEGER,
    status TEXT,
    trial_end_date TEXT
);
```
**Purpose:** Caches the Supabase user session locally for offline access.

#### Table 3: `customers`
```sql
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    state TEXT,
    state_code TEXT,
    is_active INTEGER DEFAULT 1,
    encrypted_data TEXT,
    enc_iv TEXT,
    enc_auth_tag TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP DEFAULT NULL
);
```
**Purpose:** Customer/party master list with AES-256-GCM encrypted sensitive fields (GSTIN, address, payment terms, notes).

#### Table 4: `items_catalog`
```sql
CREATE TABLE IF NOT EXISTS items_catalog (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    gst_rate REAL,
    is_active INTEGER DEFAULT 1,
    encrypted_data TEXT,
    enc_iv TEXT,
    enc_auth_tag TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP DEFAULT NULL
);
```
**Purpose:** Product/service catalog with encrypted fields (description, HSN/SAC, unit, unit_price).

#### Table 5: `bills`
```sql
CREATE TABLE IF NOT EXISTS bills (
    id TEXT PRIMARY KEY,
    bill_number TEXT UNIQUE NOT NULL,
    customer_id TEXT NOT NULL,
    bill_date TEXT NOT NULL,
    due_date TEXT,
    status TEXT DEFAULT 'draft',
    grand_total REAL DEFAULT 0.00,
    amount_paid REAL DEFAULT 0.00,
    amount_due REAL DEFAULT 0.00,
    encrypted_data TEXT,
    enc_iv TEXT,
    enc_auth_tag TEXT,
    created_by TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP DEFAULT NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT
);
```
**Purpose:** Invoice header records. Status can be: `draft`, `sent`, `paid`, `cancelled`. Encrypted fields hold party details, notes, terms, consignee info, transporter info, e-way bill fields, IRN/ack numbers.

#### Table 6: `bill_items`
```sql
CREATE TABLE IF NOT EXISTS bill_items (
    id TEXT PRIMARY KEY,
    bill_id TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    catalog_item_id TEXT,
    description TEXT,
    hsn_sac TEXT,
    unit TEXT DEFAULT 'Nos',
    quantity REAL,
    unit_price REAL,
    discount_percent REAL DEFAULT 0.0,
    gst_rate REAL,
    base_amount REAL,
    discount_amount REAL,
    taxable_amount REAL,
    cgst_rate REAL, cgst_amount REAL,
    sgst_rate REAL, sgst_amount REAL,
    igst_rate REAL, igst_amount REAL,
    line_total REAL,
    is_nil_rated INTEGER DEFAULT 0,
    lot_no TEXT,
    grade TEXT,
    cartons REAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE,
    FOREIGN KEY (catalog_item_id) REFERENCES items_catalog(id) ON DELETE SET NULL
);
```
**Purpose:** Individual line items on each invoice. Includes yarn-industry-specific fields (lot_no, grade, cartons).

#### Table 7: `tax_records`
```sql
CREATE TABLE IF NOT EXISTS tax_records (
    id TEXT PRIMARY KEY,
    bill_id TEXT UNIQUE NOT NULL,
    bill_date TEXT,
    bill_number TEXT,
    total_taxable REAL,
    total_cgst REAL, total_sgst REAL, total_igst REAL,
    total_tax REAL, grand_total REAL,
    encrypted_data TEXT, enc_iv TEXT, enc_auth_tag TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE
);
```
**Purpose:** Tax summary per bill. Encrypted fields hold rate-wise and HSN-wise breakdowns for GSTR-1 export.

#### Table 8: `sync_queue`
```sql
CREATE TABLE IF NOT EXISTS sync_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    operation TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    payload TEXT,
    retry_count INTEGER DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
**Purpose:** Offline queue for pending Supabase sync operations. Flushed when connectivity is detected.

#### Table 9: `communication_log`
```sql
CREATE TABLE IF NOT EXISTS communication_log (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    bill_id TEXT,
    customer_id TEXT,
    channel TEXT NOT NULL,
    template TEXT,
    recipient TEXT,
    sent_at TEXT DEFAULT (datetime('now')),
    status TEXT DEFAULT 'sent',
    error_msg TEXT
);
```
**Purpose:** Tracks all outbound notifications (emails, WhatsApp messages, SMS sent to customers).

#### Table 10: `gstin_cache`
```sql
CREATE TABLE IF NOT EXISTS gstin_cache (
    gstin TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'Business',
    state TEXT, state_code TEXT,
    billing_address TEXT, billing_city TEXT, billing_pin TEXT,
    status TEXT DEFAULT 'Active',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```
**Purpose:** Local cache of GST Portal lookups to avoid repeated API calls.

### 5.2 Migration Runner (Android)

```typescript
// src/db/migrate.ts
import * as SQLite from 'expo-sqlite';

const MIGRATIONS = [
  // ... paste the full SQL from 001_initial.sql
];

export async function runMigrations(db: SQLite.SQLiteDatabase) {
  await db.execAsync('PRAGMA journal_mode=WAL;');
  for (const sql of MIGRATIONS) {
    await db.execAsync(sql);
  }
}
```

---

## 6. Authentication & Session Management

### Current Desktop Flow
1. User enters email + password on login screen.
2. Electron's main process calls `supabase.auth.signInWithPassword()`.
3. Session tokens are cached in the `users_local` SQLite table.
4. On app launch, the cached session is checked; if expired, a refresh is attempted.

### Android Equivalent
- Use `@supabase/supabase-js` (same library — works in React Native).
- Store the session in `users_local` SQLite table (same schema).
- Use `expo-secure-store` for the encryption key (instead of Electron's `safeStorage`).

```typescript
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: {
      getItem: (key) => SecureStore.getItemAsync(key),
      setItem: (key, value) => SecureStore.setItemAsync(key, value),
      removeItem: (key) => SecureStore.deleteItemAsync(key),
    },
  },
});
```

---

## 7. Encryption Layer

### Current Desktop Implementation
- Algorithm: **AES-256-GCM** via Node.js `crypto` module
- Key: 32-byte Buffer derived from user's Supabase session
- Functions: `encrypt(text)`, `decrypt(data, iv, authTag)`, `encryptBill()`, `decryptBill()`

### Android Equivalent
- Use `react-native-aes-gcm-crypto` for AES-256-GCM
- Same IV size (12 bytes), same auth tag approach
- Key stored in Android Keystore via `expo-secure-store`

```typescript
import AesGcmCrypto from 'react-native-aes-gcm-crypto';

async function encrypt(plainText: string, key: string): Promise<EncryptedData> {
  const result = await AesGcmCrypto.encrypt(plainText, false, key);
  return { encryptedData: result.content, iv: result.iv, authTag: result.tag };
}

async function decrypt(encryptedData: string, iv: string, authTag: string, key: string): Promise<string> {
  return AesGcmCrypto.decrypt(encryptedData, key, iv, authTag, false);
}
```

---

## 8. Navigation Architecture

### Desktop (Current)
Custom SPA router via `loadPage(pageName)` in `app.js`. Sidebar nav with 6 links.

### Android (Proposed)
Bottom Tab Navigation with Stack Navigators:

```
App Root
├── Auth Stack (no tabs)
│   └── LoginScreen
│
└── Main Tabs (after login)
    ├── Dashboard Tab
    │   └── DashboardScreen
    ├── Bills Tab
    │   ├── BillsListScreen
    │   ├── BillEditScreen (push)
    │   ├── BillViewScreen (push)
    │   └── BillsImportScreen (push)
    ├── Customers Tab
    │   ├── CustomersListScreen
    │   └── CustomerEditScreen (push)
    ├── Items Tab
    │   └── CatalogListScreen (with inline modal for add/edit)
    ├── Reports Tab
    │   └── ReportsScreen (4 sub-tabs: Revenue, GST, Ledger, Overdue)
    └── Settings Tab
        └── SettingsScreen (3 sub-tabs: Business, Template, Integrations)
```

### Bottom Tab Bar Icons & Labels

| Tab | Icon | Label |
|-----|------|-------|
| Dashboard | `home` | Home |
| Bills | `file-text` | Bills |
| Customers | `users` | Customers |
| Items | `package` | Items |
| Reports | `bar-chart-2` | Reports |
| Settings | `settings` | Settings |

> **Mobile Optimization:** Since 6 tabs are too many for a mobile bottom bar, group **Items** and **Reports** under a "More" menu, or use a drawer navigation for Settings/Reports.

---

## 9. Screen-by-Screen Specification

### 9.1 Login Screen

**Desktop Reference:** `login.html`

| Element | Type | Details |
|---------|------|---------|
| Logo | Image | BillFlow logo centered at top |
| App Title | Text | "BillFlow — The Digital Ledger" |
| Email Input | TextInput | `placeholder="Email"`, `keyboardType="email-address"` |
| Password Input | TextInput | `secureTextEntry=true`, `placeholder="Password"` |
| Login Button | TouchableOpacity | Primary color, text "Sign In" |
| Error Display | Text | Red error text below form |
| Loading Indicator | ActivityIndicator | Shown during auth request |

**API Calls:** `supabase.auth.signInWithPassword({ email, password })`

---

### 9.2 Dashboard Screen

**Desktop Reference:** `dashboard.html`

#### Summary Cards (horizontal scroll on mobile)

| Card | Data Key | Color |
|------|----------|-------|
| Total Bills | `totalBills` | Primary (ink) |
| Paid (This Month) | `paidThisMonth` | Success (green) |
| Outstanding Unpaid | `unpaidTotal` | Warning (gold) |
| Overdue Invoices | `overdueCount` | Danger (red) |

#### Quick Action Buttons

| Button | Label | Action |
|--------|-------|--------|
| FAB (+) | "+ New Bill" | Navigate to BillEditScreen |
| Secondary | "+ New Customer" | Navigate to CustomerEditScreen |

#### Recent Bills Table

| Column | Field |
|--------|-------|
| Bill Number | `bill_number` |
| Customer | `customer_name` (from JOIN) |
| Date | `bill_date` (formatted DD/MM/YYYY) |
| Total | `grand_total` (₹ formatted) |
| Status | Badge: `draft`/`sent`/`paid` |

**API Calls:** `getDashboardSummary()`, `listBills({ limit: 10 })`

---

### 9.3 Bills List Screen

**Desktop Reference:** `bills-list.html`

#### Filter Bar

| Element | Type | Options |
|---------|------|---------|
| Search | TextInput | Search by bill number or customer name |
| Status Filter | Dropdown/Picker | All / Draft / Sent / Paid |
| Date From | DatePicker | Filter bills from this date |
| Date To | DatePicker | Filter bills until this date |
| Export CSV | Button | Generate and share CSV file |

#### Bill Row (FlatList Item)

| Field | Display |
|-------|---------|
| Bill Number | e.g. `INV-2026-004` |
| Customer | e.g. `Acme Corp` |
| Bill Date | e.g. `14/07/2026` |
| Due Date | e.g. `14/07/2026` |
| Grand Total | e.g. `₹59.00` |
| Status | Badge component |

#### Row Action Buttons

| Button | Label | Color | Action |
|--------|-------|-------|--------|
| View | "View" | Default | Navigate to BillViewScreen |
| Edit | "Edit" | Default | Navigate to BillEditScreen |
| Remind | "Remind" | Warning (amber) | Opens channel picker modal, then sends reminder |
| Paid | "Paid" | Success (green) | Opens payment modal, marks bill as paid |

#### Import Button (Top Right)
- Label: "Import Bills"
- Action: Navigate to BillsImportScreen

#### New Bill Button (Top Right)
- Label: "+ New Bill"
- Action: Navigate to BillEditScreen

**API Calls:** `listBills(filters)`, `updateBillStatus(id, 'paid', payment)`, `paymentReminder(...)`, `waSendBill(...)`

---

### 9.4 Bill Edit Screen (Create / Edit Invoice)

**Desktop Reference:** `bill-edit.html`

This is the most complex screen in the app. It must be scrollable on mobile.

#### Header Section

| Field | Type | Required |
|-------|------|----------|
| Invoice Number | TextInput (auto-generated) | Yes |
| Invoice Date | DatePicker | Yes |
| Due Date | DatePicker | No |
| Customer | Searchable Dropdown + "+" button | Yes |

#### Customer Selection Display
- Shows selected customer name, GSTIN, state
- Shows supply type badge: "Intrastate (CGST+SGST)" or "Interstate (IGST)"

#### Additional Details Section (Yarn-Specific)

**Column 1: Order & Party Info**
| Field | Type |
|-------|------|
| Order Number | TextInput |
| Order Date | DatePicker |
| Due Days | NumberInput |
| Party Name | TextInput |
| Party Phone | TextInput (phone keyboard) |

**Column 2: Consignee Details**
| Field | Type |
|-------|------|
| Consignee Name | TextInput |
| Consignee Address | TextInput |
| Consignee GSTIN | TextInput |
| Consignee State | Dropdown |

**Column 3: Transport Details**
| Field | Type |
|-------|------|
| Transporter | TextInput |
| LR Number | TextInput |
| Vehicle Number | TextInput |
| Transporter GST | TextInput |
| LR Date | DatePicker |

**Column 4: E-Invoice Fields**
| Field | Type |
|-------|------|
| Company Name | TextInput |
| Company Bill No | TextInput |
| Acknowledgement No | TextInput |
| Acknowledgement Date | TextInput |
| IRN Number | TextInput |

#### Line Items Section

Each item row has:
| Field | Type | Width |
|-------|------|-------|
| Item (catalog dropdown) | Searchable Picker | 30% |
| HSN/SAC | TextInput | 10% |
| Qty | NumberInput | 8% |
| Unit | Picker (Nos/Kg/Ltr/Box/Hrs/Pcs) | 8% |
| Rate (₹) | NumberInput | 12% |
| Discount (%) | NumberInput | 8% |
| GST (%) | Picker (0/5/12/18/28) | 8% |
| Amount | Computed display | 12% |
| Lot No | TextInput | — |
| Grade | TextInput | — |
| Cartons | NumberInput | — |
| Delete Row | Icon Button (trash) | 4% |

> **Mobile Optimization:** On mobile, each line item should be displayed as an expandable card instead of a table row. Tap to expand and see all fields.

**Add Item Row:** "+ Add Item" button below the list.

#### Totals Section (Auto-Computed)

| Field | Computation |
|-------|-------------|
| Subtotal | Sum of all `base_amount` |
| Discount | Sum of all `discount_amount` |
| Taxable Amount | Sum of all `taxable_amount` |
| CGST | Sum of all `cgst_amount` |
| SGST | Sum of all `sgst_amount` |
| IGST | Sum of all `igst_amount` |
| **Grand Total** | `taxable_amount + total_tax` |

#### Notes & Terms Section

| Field | Type |
|-------|------|
| Notes | TextArea |
| Terms & Conditions | TextArea |

#### Action Buttons

| Button | Label | Style | Action |
|--------|-------|-------|--------|
| Cancel | "Cancel" | Outline | Navigate back |
| Save Draft | "Save Draft" | Default | Save with status `draft` |
| Send WhatsApp | "Send (WhatsApp)" | Green (#25D366) | Save as `sent` + send via WhatsApp |
| Print & Send | "Print & Send" | Primary | Save as `sent` + generate PDF + share |

**API Calls:** `createBill(data)`, `updateBill(id, data)`, `replaceBillItems(billId, items)`, `upsertTaxRecord(billId, taxData)`, `generatePDF(data)`, `waSendBill(...)`, `billSent(...)`

---

### 9.5 Bill View Screen

**Desktop Reference:** `bill-view.html`

Displays a full, read-only rendering of the invoice formatted exactly like the PDF printout. On mobile, this should be a scrollable view with all invoice sections.

#### Action Buttons (Bottom Bar or FAB Menu)

| Button | Label | Action |
|--------|-------|--------|
| Print / Share | "Share PDF" | Generate PDF, open Android share sheet |
| Send WhatsApp | "WhatsApp" | Send PDF + text via WhatsApp |
| Send Email | "Email" | Send via n8n webhook |
| Mark as Paid | "Mark Paid" | Opens payment amount modal |
| Send Reminder | "Send Reminder" | Opens channel picker + sends reminder |
| Edit | "Edit" | Navigate to BillEditScreen |

---

### 9.6 Customers List Screen

**Desktop Reference:** `customers-list.html`

#### Filter Bar
| Element | Type |
|---------|------|
| Search | TextInput (name/phone/email) |

#### Customer Row (FlatList Item)

| Field | Display |
|-------|---------|
| Name | e.g. "Acme Corp Delhi" |
| Phone | e.g. "+919876543210" |
| Email | e.g. "info@acme.com" |
| Outstanding | e.g. "₹8,408.00" |
| Status | Active/Inactive badge |

#### Row Actions
| Button | Label | Action |
|--------|-------|--------|
| View | "View" | Navigate to CustomerEditScreen (read mode) |
| Edit | "Edit" | Navigate to CustomerEditScreen |

#### Top Button
- "+ New Customer" → Navigate to CustomerEditScreen

**API Calls:** `listCustomers(filter)`, `getCustomerBillSummary(id)`

---

### 9.7 Customer Edit Screen

**Desktop Reference:** `customer-edit.html`

| Field | Type | Required |
|-------|------|----------|
| Customer Name | TextInput | Yes |
| Customer Type | Picker (Business / Individual) | No |
| GSTIN | TextInput + "Fetch Details" button | No |
| Email | TextInput (email keyboard) | No |
| Phone | TextInput (phone keyboard) | Yes |
| State | Picker (36 Indian states) | No |
| Payment Terms | Picker (Due on receipt / Net 7/15/30/60) | No |
| Address | TextArea | No |
| Notes | TextArea | No |
| Active | Switch/Checkbox | Default: ON |

#### GSTIN Auto-Fetch
When user taps "Fetch Details" next to GSTIN field:
1. Validate GSTIN format (15 chars, regex)
2. Check local `gstin_cache` table first
3. If not cached, call GST Portal API / Supabase edge function
4. Auto-fill: Name, State, Address, City, PIN

#### Action Buttons
| Button | Label | Action |
|--------|-------|--------|
| Cancel | "Cancel" | Navigate back |
| Save | "Save Customer" | Validate + save + navigate back |

**API Calls:** `createCustomer(data)`, `updateCustomer(id, data)`, `fetchGSTINDetails(gstin)`, `cacheGSTINBulk(records)`

---

### 9.8 Items Catalog Screen

**Desktop Reference:** `catalog-list.html`

#### Filter Bar
| Element | Type |
|---------|------|
| Search | TextInput (name/HSN) |
| Status Filter | Picker (All / Active / Inactive) |

#### Item Row

| Column | Field |
|--------|-------|
| Name | `name` |
| Description | `description` (decrypted) |
| HSN/SAC | `hsn_sac` |
| Unit | `unit` |
| Unit Price | `unit_price` (₹ formatted) |
| GST Rate | `gst_rate` (% formatted) |
| Status | Active/Inactive badge |

#### Row Actions
| Button | Action |
|--------|--------|
| Edit | Open inline modal |
| Delete | Soft delete (set `deleted_at`) |

#### Add/Edit Modal

| Field | Type |
|-------|------|
| Item Name | TextInput (required) |
| Description | TextArea |
| HSN/SAC | TextInput |
| Unit | Picker (Nos/Kg/Ltr/Box/Hrs/Pcs) |
| Unit Price (₹) | NumberInput (required) |
| GST Rate (%) | Picker (0/5/12/18/28%, required) |
| Active | Switch |

#### Modal Buttons
| Button | Label | Action |
|--------|-------|--------|
| Cancel | "Cancel" | Close modal |
| Save | "Save Item" | Validate + save + reload list |

**API Calls:** `listItems(filter)`, `createItem(data)`, `updateItem(id, data)`, `deleteItem(id)`

---

### 9.9 Reports Screen

**Desktop Reference:** `reports.html`

Uses a **Tab View** component (`react-native-tab-view`) with 4 sub-tabs:

#### Tab 1: Revenue Report
- Date range filter (From / To)
- "Run Report" + "Export CSV" buttons
- Summary cards: Invoice Count, Total Billed, Total Paid, Outstanding
- FlatList table: Bill No, Customer, Date, Amount, Paid, Outstanding, Status

#### Tab 2: GST Tax Collected
- Year + Month pickers
- "Run Report" + "Export GSTR-1 JSON" buttons
- Summary cards: Taxable Value, CGST, SGST, IGST, Total Tax
- Monthly breakdown table: Month, Taxable, CGST, SGST, IGST, Total Tax, Invoice Count
- B2B vs B2CS section breakdown

#### Tab 3: Customer Ledger
- Customer picker dropdown
- Date range filter
- Shows all bills for selected customer with running balance
- Summary: Total Billed, Total Paid, Balance Due

#### Tab 4: Overdue & Ageing
- Shows all unpaid bills grouped by ageing buckets:
  - 0–30 days
  - 31–60 days
  - 61–90 days
  - 90+ days
- Each row: Bill No, Customer, Due Date, Amount Due, Days Overdue

**API Calls:** `listBills(filters)`, `getTaxSummary(filter)`, `getMonthlyGST(year)`, `exportGSTR1(year, month)`, `getCustomerBillSummary(id)`

---

### 9.10 Settings Screen

**Desktop Reference:** `settings.html`

Uses a **Tab View** with 3 sub-tabs:

#### Tab 1: Business Profile
| Field | Type |
|-------|------|
| Business Name | TextInput (required) |
| GSTIN | TextInput |
| Address | TextArea |
| City | TextInput |
| State | Picker (36 states) |
| PIN Code | TextInput |
| PAN | TextInput |
| Bank Name | TextInput |
| Account Number | TextInput |
| IFSC Code | TextInput |

#### Tab 2: Bill Template
| Field | Type |
|-------|------|
| Bill Prefix | TextInput (e.g. "INV-2026-") |
| Default GST Rate | Picker (0/5/12/18/28%) |
| UPI ID | TextInput |
| Logo Upload | Image picker (camera/gallery) |
| Signature Upload | Image picker (camera/gallery) |

#### Tab 3: Integrations

**WhatsApp Local Link Panel**
| Element | Type | Action |
|---------|------|--------|
| Status Display | Text | Shows "Not linked" / "Linked: +91 XXXXX" |
| Link Account | Button (green) | Start Baileys connection, show QR |
| QR Code Display | QRCode component | Rendered from Baileys QR string |
| Disconnect | Button (red) | Logout + delete session |

**WATI Settings (Business API)**
| Field | Type |
|-------|------|
| Enable WhatsApp (WATI) | Switch |
| WATI API URL | TextInput |
| WATI Auth Token | TextInput |
| Business Phone | TextInput |

**Email Settings**
| Field | Type |
|-------|------|
| From Name | TextInput |
| From Address | TextInput |
| SMTP Host | TextInput |
| SMTP Port | TextInput |
| SMTP User | TextInput |
| SMTP Password | TextInput (secure) |
| Accountant Email | TextInput |

**n8n Webhook Settings**
| Field | Type |
|-------|------|
| n8n Base URL | TextInput |
| Auto-Fill Webhooks | Button |

**Notification Preferences**
| Field | Type |
|-------|------|
| Reminder at 7 days | Switch |
| Reminder at 3 days | Switch |
| Reminder at 1 day | Switch |
| Daily Summary | Switch |
| Weekly Report | Switch |
| Monthly GST Report | Switch |

#### Save Button
- Fixed at bottom or top-right
- Saves all settings to SQLite
- Calls `settingsUpdated(obj)` webhook

**API Calls:** `getAllSettings()`, `setMultipleSettings(obj)`, `settingsUpdated(obj)`, `waConnect()`, `waDisconnect()`, `waGetStatus()`

---

## 10. PDF Generation

### Desktop (Current)
Uses `pdfkit` Node.js library to generate a custom boxy-layout GST invoice PDF with:
- Company header (name, address, GSTIN, PAN, State)
- "TAX INVOICE" bar
- Customer & Consignee details
- Line items table with HSN, Qty, Rate, Discount, CGST, SGST, IGST
- Totals section with amount in words
- Bank details
- UPI QR Code
- Signature image
- Terms & conditions

### Android Equivalent
Since `pdfkit` is a Node.js library and cannot run on React Native, use **HTML-to-PDF**:

1. **Create an HTML template** that replicates the exact boxy invoice layout
2. Use `expo-print` to render the HTML into a PDF file
3. Use `expo-sharing` to share the generated PDF

```typescript
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

async function generateInvoicePDF(bill, items, customer, settings) {
  const html = buildInvoiceHTML(bill, items, customer, settings); // Port the layout
  const { uri } = await Print.printToFileAsync({ html, width: 595, height: 842 });
  return uri; // Local file path
}

async function shareInvoicePDF(uri: string) {
  await Sharing.shareAsync(uri, { mimeType: 'application/pdf' });
}
```

### UPI QR Code in PDF
- Use `react-native-qrcode-svg` to generate a QR code image
- Convert to base64 and embed in the HTML template as `<img src="data:image/png;base64,...">`

---

## 11. WhatsApp Integration

### 11.1 Option A: Android Intent Share (Simplest)

Use Android's native share system to send a PDF to WhatsApp:

```typescript
import Share from 'react-native-share';

async function shareToWhatsApp(phone: string, message: string, pdfUri: string) {
  const cleanPhone = phone.replace(/\D/g, '');
  const fullPhone = cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone;

  await Share.open({
    title: 'Send Invoice',
    message: message,
    url: pdfUri, // file:// URI to the PDF
    social: Share.Social.WHATSAPP,
    whatsAppNumber: fullPhone,
  });
}
```

**Pros:** No Baileys needed, uses native WhatsApp app
**Cons:** Requires user to tap "Send" in WhatsApp

### 11.2 Option B: Baileys Background Service (Fully Automated)

Run Baileys inside a **React Native background service** using `react-native-background-actions`:

1. Start a persistent background task
2. Initialize Baileys socket with stored credentials
3. Send messages programmatically without user interaction

> **Warning:** Baileys on React Native requires additional native module bridging for WebSocket and crypto. Consider using a **local Node.js server** running on the device (via `nodejs-mobile-react-native`) to host the Baileys instance.

### 11.3 Recommended Hybrid Approach

1. **Default:** Use Android Intent Share (Option A) — works out of the box
2. **Power Users:** If the seller links their WhatsApp in Settings, use Baileys via a local Node server for full automation

---

## 12. Supabase Cloud Sync

### Sync Strategy (Same as Desktop)

1. All CRUD operations write to **local SQLite first** (offline-first)
2. Each write also enqueues a record in `sync_queue`
3. A background sync worker runs every 60 seconds (or on demand):
   - Checks network connectivity
   - Reads `sync_queue` for pending operations
   - Pushes encrypted payloads to Supabase via the n8n sync webhook
   - Marks queue entries as completed on success

### Android-Specific Sync Triggers
- **App Foreground:** Sync immediately on app launch
- **Network Change:** Listen for WiFi/Mobile data connectivity changes via `@react-native-community/netinfo`
- **Background Fetch:** Use `expo-background-fetch` for periodic sync even when app is backgrounded

```typescript
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';

const SYNC_TASK = 'BILLFLOW_SYNC';

TaskManager.defineTask(SYNC_TASK, async () => {
  await flushSyncQueue();
  return BackgroundFetch.BackgroundFetchResult.NewData;
});

await BackgroundFetch.registerTaskAsync(SYNC_TASK, {
  minimumInterval: 60, // seconds
  stopOnTerminate: false,
  startOnBoot: true,
});
```

---

## 13. n8n Webhook Connectivity

### Current Desktop Webhooks

| Webhook Path | Triggered When |
|-------------|----------------|
| `/webhook/bill-created` | New bill is created |
| `/webhook/bill-send` | Bill is sent (with PDF base64 + channels) |
| `/webhook/bill-paid` | Bill is marked as paid |
| `/webhook/bill-cancelled` | Bill is cancelled |
| `/webhook/payment-reminder` | Payment reminder is triggered |
| `/webhook/customer-saved` | Customer is created/updated |
| `/webhook/item-saved` | Catalog item is created/updated |
| `/webhook/sync-push` | Sync queue is flushed to cloud |
| `/webhook/report-request` | Report is requested |
| `/webhook/settings-updated` | Settings are saved |

### Android Implementation

The webhook caller is a simple `fetch()` wrapper — identical on both platforms:

```typescript
async function callWebhook(path: string, payload: object) {
  const baseUrl = await getSetting('n8n_base_url') || 'http://localhost:5678';
  const secret = await getSetting('n8n_secret') || '';

  try {
    await fetch(baseUrl + path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-BillFlow-Secret': secret,
      },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    console.error('Webhook failed:', path, e.message);
    // Queue for retry in sync_queue
  }
}
```

> **Important:** On Android, if the n8n server is running on `localhost`, the mobile app won't be able to reach it since they're on different devices. The user must configure the n8n base URL to the **LAN IP** (e.g., `http://192.168.1.100:5678`) or use a public tunnel (ngrok/Cloudflare Tunnel).

---

## 14. UI/UX Design System

### 14.1 Color Palette (Port from Desktop CSS)

| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#302b24` | Deep Ink — headers, buttons, text |
| `primaryHover` | `#443d32` | Pressed state |
| `success` | `#4a6b3e` | Stamp Green — paid badges, success |
| `warning` | `#a88d2e` | Stamp Gold — pending, warnings |
| `danger` | `#8b3a3a` | Stamp Red — overdue, errors |
| `background` | `#f5efe0` | Cream page background |
| `surface` | `#fdfbf3` | Card/elevated surface |
| `surfaceElevated` | `#faf6e6` | Active/hover state |
| `border` | `#e3d9be` | Soft dividers |
| `text` | `#1a1611` | Primary text |
| `textMuted` | `#6b614d` | Secondary/label text |
| `whatsappGreen` | `#25D366` | WhatsApp buttons |

### 14.2 Typography

| Style | Font | Size | Weight |
|-------|------|------|--------|
| Heading 1 | Plus Jakarta Sans | 24px | Bold (700) |
| Heading 2 | Plus Jakarta Sans | 18px | SemiBold (600) |
| Body | Plus Jakarta Sans | 14px | Regular (400) |
| Caption | Plus Jakarta Sans | 12px | Medium (500) |
| Mono (numbers) | DM Mono | 14px | Regular (400) |

### 14.3 Component Library

| Component | Usage |
|-----------|-------|
| `Card` | Elevated surface container with shadow |
| `Badge` | Status indicators (Draft/Sent/Paid/Overdue) |
| `Toast` | Bottom notification bar (success/error/info/warning) |
| `Modal` | Overlay dialogs (payment, channel picker, item edit) |
| `FormField` | Label + Input/Picker wrapper with validation |
| `DataTable` | Scrollable list with column headers |
| `SearchBar` | Rounded search input with clear button |
| `FAB` | Floating action button (+ New Bill) |
| `TabBar` | Custom tab switcher for sub-sections |

### 14.4 Responsive Breakpoints

| Device | Width | Layout |
|--------|-------|--------|
| Phone (portrait) | < 480px | Single column, stacked cards |
| Phone (landscape) | 480–768px | 2-column forms |
| Tablet | 768px+ | Side-by-side panels, desktop-like layout |

---

## 15. Offline-First Architecture

```
User Action → Write to Local SQLite → Enqueue in sync_queue → Update UI Immediately
                                          ↓
                                    Is Online?
                                    ├── Yes → Push to Supabase via n8n webhook → Mark done
                                    └── No  → Wait for connectivity → Retry
```

**Key Principle:** The app must work 100% offline. All features (create bills, edit customers, generate PDFs, view reports) must function without internet. Sync happens opportunistically.

---

## 16. Push Notifications

### Local Notifications (No Server Required)
- Payment due reminders (7/3/1 day before due date)
- Overdue invoice alerts
- Sync status (failed/completed)

Use `expo-notifications` for scheduling local notifications:

```typescript
import * as Notifications from 'expo-notifications';

async function scheduleReminder(billNumber: string, dueDate: string, daysBefore: number) {
  const trigger = new Date(dueDate);
  trigger.setDate(trigger.getDate() - daysBefore);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Payment Reminder',
      body: `Invoice ${billNumber} is due in ${daysBefore} day(s)`,
    },
    trigger: { date: trigger },
  });
}
```

---

## 17. APK Build & Distribution

### Build with Expo EAS

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure build
eas build:configure

# Build Android APK (for direct distribution)
eas build --platform android --profile preview

# Build Android AAB (for Google Play Store)
eas build --platform android --profile production
```

### app.json Configuration

```json
{
  "expo": {
    "name": "BillFlow",
    "slug": "billflow",
    "version": "1.0.0",
    "orientation": "default",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#f5efe0"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#f5efe0"
      },
      "package": "com.billflow.app",
      "versionCode": 1,
      "permissions": [
        "INTERNET",
        "ACCESS_NETWORK_STATE",
        "WRITE_EXTERNAL_STORAGE",
        "READ_EXTERNAL_STORAGE",
        "CAMERA",
        "VIBRATE"
      ]
    }
  }
}
```

### Distribution Options
1. **Direct APK:** Share the `.apk` file via WhatsApp/email for sideloading
2. **Google Play Store:** Upload the `.aab` bundle to Play Console
3. **Firebase App Distribution:** For beta testing with select users

---

## 18. Development Roadmap

### Phase 1: Foundation (Week 1–2)
- [ ] Initialize React Native + Expo project
- [ ] Set up navigation (bottom tabs + stack navigators)
- [ ] Port SQLite schema and migration runner
- [ ] Port encryption layer (AES-256-GCM)
- [ ] Implement Supabase auth (login/logout/session caching)
- [ ] Build design system (theme tokens, Card, Badge, Toast, FormField)

### Phase 2: Core Screens (Week 3–4)
- [ ] Dashboard Screen with summary cards + recent bills
- [ ] Customers List + Customer Edit screens
- [ ] Items Catalog screen with add/edit modal
- [ ] Bills List screen with filters, search, and action buttons

### Phase 3: Invoice Engine (Week 5–6)
- [ ] Bill Edit screen (full form with line items, GST calculation)
- [ ] Bill View screen (read-only invoice display)
- [ ] PDF generation via HTML template + expo-print
- [ ] PDF sharing via expo-sharing

### Phase 4: Communication (Week 7)
- [ ] WhatsApp share via Android Intent (react-native-share)
- [ ] n8n webhook integration (bill-send, payment-reminder, etc.)
- [ ] Email sending via n8n
- [ ] Local notifications for payment reminders

### Phase 5: Reports & Sync (Week 8)
- [ ] Revenue Report tab
- [ ] GST Tax Collected tab + GSTR-1 JSON export
- [ ] Customer Ledger tab
- [ ] Overdue & Ageing tab
- [ ] Background sync engine (expo-background-fetch)
- [ ] Network state listener for auto-sync

### Phase 6: Settings & Polish (Week 9)
- [ ] Settings screen (3 tabs: Business, Template, Integrations)
- [ ] WhatsApp Local Link (QR scan via Baileys or bridge)
- [ ] Logo/Signature upload from camera/gallery
- [ ] Bills Import screen (CSV parsing)
- [ ] App icon, splash screen, final UI polish

### Phase 7: Testing & Release (Week 10)
- [ ] End-to-end testing on physical Android devices
- [ ] Performance optimization (FlatList virtualization, lazy loading)
- [ ] Accessibility audit (font scaling, screen reader)
- [ ] Build APK via EAS
- [ ] Deploy to Google Play Store (optional)

---

> **Quick Start Tip:** If you want a working APK in the shortest time possible, consider using **Capacitor** to wrap the existing HTML/CSS/JS inside a WebView shell. This can produce a functional (but not fully native) APK in 1–2 days. The React Native approach described above produces a premium native experience but requires the full 10-week timeline.
