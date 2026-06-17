# BillFlow Part 2 Implementation Specification
Version 3.0

Production SaaS Architecture

## Section A: Database Specifications

### A.1 Complete SQLite Schema
The following schema defines the core relational structure using better-sqlite3 syntax. All tables adhere to soft-delete conventions where applicable, and foreign keys are enforced.

**organizations:**
CREATE TABLE organizations (
    id TEXT PRIMARY KEY, -- UUID
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    plan TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP DEFAULT NULL
);

**users:**
CREATE TABLE users (
    id TEXT PRIMARY KEY, -- UUID
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    role TEXT NOT NULL, -- e.g., 'admin', 'staff'
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP DEFAULT NULL
);

**organization_users:**
CREATE TABLE organization_users (
    id TEXT PRIMARY KEY, -- UUID
    organization_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, user_id),
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

**settings:** (Application configuration and business profile data)
CREATE TABLE settings (
    organization_id TEXT PRIMARY KEY, -- UUID - Enforces single set of settings per organization
    key TEXT NOT NULL,
    value TEXT,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

**customers:** (SMB/Individual client records)
CREATE TABLE customers (
    id TEXT PRIMARY KEY, -- UUID
    organization_id TEXT NOT NULL, -- Multi-tenancy key
    type TEXT NOT NULL, -- 'Business' or 'Individual'
    name TEXT NOT NULL,
    supabase_id TEXT UNIQUE, -- Sync ID
    gstin TEXT UNIQUE,
    state TEXT, -- Full State Name
    state_code TEXT NOT NULL, -- ISO Code
    address TEXT,
    city TEXT,
    pin TEXT,
    phone TEXT,
    email TEXT,
    payment_terms TEXT,
    notes TEXT,
    billing_address TEXT, -- New field
    billing_city TEXT,   -- New field
    billing_pin TEXT,    -- New field
    is_active BOOLEAN DEFAULT TRUE, -- New field
    sync_status TEXT DEFAULT 'pending', -- New field: pending, synced, error
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- New field
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- New field
    deleted_at TIMESTAMP DEFAULT NULL, -- Soft delete
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

**items_catalog:** (Product and service master list)
CREATE TABLE items_catalog (
    id TEXT PRIMARY KEY, -- UUID
    organization_id TEXT NOT NULL, -- Multi-tenancy key
    supabase_id TEXT UNIQUE, -- Sync ID
    description TEXT NOT NULL, -- Updated field
    hsn_sac TEXT UNIQUE,       -- Existing field
    unit TEXT DEFAULT 'Unit',  -- Existing field
    gst_rate REAL NOT NULL,
    is_active BOOLEAN DEFAULT TRUE, -- New field
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- New field
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- New field
    deleted_at TIMESTAMP DEFAULT NULL, -- Soft delete
    sync_status TEXT DEFAULT 'pending', -- New field: pending, synced, error
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

**bills:** (Master bill header record)
CREATE TABLE bills (
    id TEXT PRIMARY KEY, -- UUID
    organization_id TEXT NOT NULL, -- Multi-tenancy key
    supabase_id TEXT UNIQUE, -- Sync ID
    bill_number TEXT UNIQUE NOT NULL,
    customer_id TEXT NOT NULL, -- References customers(id)
    bill_date DATE NOT NULL,
    due_date DATE,
    status TEXT NOT NULL, -- 'draft', 'sent', 'paid', 'overdue', 'cancelled'
    notes TEXT,
    terms TEXT,
    subtotal REAL DEFAULT 0.00, -- New field
    total_discount REAL DEFAULT 0.00, -- New field
    total_taxable REAL DEFAULT 0.00, -- New field
    total_cgst REAL DEFAULT 0.00,  -- New field
    total_sgst REAL DEFAULT 0.00,  -- New field
    total_igst REAL DEFAULT 0.00,  -- New field
    total_tax REAL DEFAULT 0.00,   -- New field
    round_off REAL DEFAULT 0.00,   -- New field
    grand_total REAL DEFAULT 0.00, -- New field
    amount_paid REAL DEFAULT 0.00,  -- New field
    amount_due REAL DEFAULT 0.00,   -- New field
    supply_type TEXT NOT NULL,     -- New field
    place_of_supply TEXT,          -- New field
    pdf_path TEXT,                 -- New field: file path to generated PDF
    sync_status TEXT DEFAULT 'pending', -- New field
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- New field
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- New field
    deleted_at TIMESTAMP DEFAULT NULL, -- Soft delete
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

**bill_items:** (Line items for a specific bill)
CREATE TABLE bill_items (
    id TEXT PRIMARY KEY, -- UUID
    organization_id TEXT NOT NULL, -- Multi-tenancy key
    sort_order INTEGER DEFAULT 0, -- New field
    catalog_item_id TEXT, -- References items_catalog(id)
    description TEXT NOT NULL,
    hsn_sac TEXT,
    quantity REAL NOT NULL,
    unit_price REAL NOT NULL,
    discount_percent REAL DEFAULT 0.0,
    base_amount REAL NOT NULL, -- New field: qty * unit_price
    discount_amount REAL NOT NULL, -- New field
    taxable_amount REAL NOT NULL,
    cgst_rate REAL NOT NULL,
    cgst_amount REAL NOT NULL,
    sgst_rate REAL NOT NULL,
    sgst_amount REAL NOT NULL,
    igst_rate REAL NOT NULL,
    igst_amount REAL NOT NULL,
    line_total REAL NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- New field
    FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (catalog_item_id) REFERENCES items_catalog(id) ON DELETE SET NULL
);

**tax_records:** (Detailed tax breakdowns per bill/rate)
CREATE TABLE tax_records (
    id TEXT PRIMARY KEY, -- UUID
    organization_id TEXT NOT NULL, -- Multi-tenancy key
    bill_id TEXT UNIQUE NOT NULL, -- References bills(id) - should be unique per organization/bill
    gst_rate REAL NOT NULL,
    total_taxable REAL NOT NULL,
    total_cgst REAL NOT NULL,
    total_sgst REAL NOT NULL,
    total_igst REAL NOT NULL,
    FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

**sync_queue:** (Queue for offline-first operations to be synced with n8n)
CREATE TABLE sync_queue (
    id TEXT PRIMARY KEY, -- UUID
    organization_id TEXT NOT NULL, -- Multi-tenancy key
    operation TEXT NOT NULL, -- e.g., 'customer:create', 'bill:update'
    payload TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'pending', -- pending, in_progress, failed, completed
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

**payment_log:** (Record of payments received for bills)
CREATE TABLE payment_log (
    id TEXT PRIMARY KEY, -- UUID
    organization_id TEXT NOT NULL,
    bill_id TEXT NOT NULL,
    amount REAL NOT NULL,
    payment_date DATE NOT NULL,
    payment_method TEXT,
    payment_reference TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

**communication_log:** (Log of external communications triggered by n8n)
CREATE TABLE communication_log (
    id TEXT PRIMARY KEY, -- UUID
    organization_id TEXT NOT NULL,
    bill_id TEXT, -- Nullable if not bill related
    channel TEXT NOT NULL, -- e.g., 'email', 'whatsapp', 'sms'
    recipient TEXT NOT NULL,
    status TEXT NOT NULL, -- success, failed, pending
    provider_response TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE SET NULL
);

**webhook_log:** (Log of incoming webhooks)
CREATE TABLE webhook_log (
    id TEXT PRIMARY KEY, -- UUID
    organization_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    payload TEXT,
    response TEXT,
    status TEXT NOT NULL, -- success/failure
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

**sync_error_log:** (Records failed synchronization attempts)
CREATE TABLE sync_error_log (
    id TEXT PRIMARY KEY, -- UUID
    organization_id TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id TEXT,
    error_message TEXT NOT NULL,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

**audit_log:** (Record of significant data changes)
CREATE TABLE audit_log (
    id TEXT PRIMARY KEY, -- UUID
    organization_id TEXT NOT NULL,
    user_id TEXT, -- Nullable if system action
    action TEXT NOT NULL, -- e.g., 'customer:update', 'bill:create'
    table_name TEXT NOT NULL,
    record_id TEXT,
    old_value TEXT,
    new_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

**plans:** (SaaS subscription tiers definition)
CREATE TABLE plans (
    id TEXT PRIMARY KEY, -- UUID
    name TEXT NOT NULL UNIQUE,
    monthly_price REAL NOT NULL,
    yearly_price REAL NOT NULL,
    features_json TEXT -- Stores feature set as JSON string
);

**subscriptions:** (Active organization subscriptions)
CREATE TABLE subscriptions (
    id TEXT PRIMARY KEY, -- UUID
    organization_id TEXT UNIQUE NOT NULL, -- One subscription per org
    plan_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- active, pending, cancelled
    starts_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ends_at TIMESTAMP DEFAULT NULL,
    stripe_subscription_id TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE RESTRICT
);

### A.2 Supabase Schema
BillFlow uses:

Electron App
→ SQLite
→ sync_queue
→ n8n
→ Supabase (via n8n)

This architecture is final. The desktop application never communicates directly with Supabase or authenticates against it; all external data exchange runs through the Sync Queue and n8n workflows.

### A.3 RLS Policies
### A.3 RLS Policies
Organization isolation is mandatory. Row Level Security (RLS) must be configured on all core tables (`customers`, `bills`, `items_catalog`, etc.) in the Supabase instance to enforce data segregation based on the tenant's organization ID. The policy must ensure that users can only access records where:

`record.organization_id = current_user.organization_id`

## Section B: n8n Implementation Reference
n8n is responsible for all external communication and complex business logic outside of the core desktop app functionality.
*   **Ownership:** email, WhatsApp, SMS, scheduled reminders, reports, and **Supabase synchronization are owned exclusively by n8n workflows**.
*   **Desktop App Role:** The Electron application only stores data locally in SQLite, edits it, displays it, prints PDFs, and *fires webhooks* to trigger automation flows (including sync requests) in n8n upon critical events. The desktop app never communicates directly with Supabase.

## Section C: Folder Structure
The project structure is organized as follows:

```
F:\Ai Bill Generator\
├── src\
│   ├── db\
│   │   ├── connection.js      // Singleton DB connection wrapper (better-sqlite3)
│   │   └── migrations\        // SQL files for schema changes
│   ├── gst\                   // GST calculation and utilities
│   │   ├── calculator.js      // GSTCalculator implementation
│   │   ├── amount-to-words.js // Utility to convert numbers to Indian language words
│   │   └── test-calculator.js
│   ├── supabase\              // Supabase specific client code/migration scripts
│   ├── n8n\                   // Local definitions for webhook interactions (if any)
│   ├── pdf\
│   │   ├── generator.js       // PDFKit wrapper to create bills/invoices
│   │   └── pdf\
│   │       └── templates\    // HTML/template files used by PDFKit
│   └── utils\                 // General helper functions (e.g., DateUtils)
├── src\renderer\
│   ├── assets\icons\          // Iconography
│   ├── pages\                 // Top-level page containers (.html, .js)
│   │   ├── dashboard/
│   │   ├── login/
│   │   └── bills-list/
│   ├── js\                    // Renderer JavaScript modules
│   │   ├── components\       // Reusable UI elements (modal.js, toast.js)
│   │   └── pages\            // Page controllers (.js) that interact with window.api
│   ├── styles-modern.css     // CSS for modern UI/desktop experience
│   └── styles-legacy.css     // XP compatible layout and styling (float/fixed colors)
├── dist\                      // Compiled build output (Electron/NW.js)
├── package.json               // Dependencies and scripts definition
└── n8n-workflows\             // Local configuration for n8n webhooks
```

## Section D: Build Guide
The project supports two environments: Modern Desktop and Legacy XP compatibility.

*   **Modern Build:** Uses `electron` and `electron-builder`. The build script is defined in `package.json` as `"build:modern": "electron-builder"`. This targets modern Chromium versions.
*   **Legacy Build (NW.js):** Requires specific configuration for NW.js v0.14.7 compatibility, ensuring all code adheres strictly to ES5 standards and avoids modern APIs like `fetch()` or arrow functions.

## Section E: Supabase Setup
Supabase is used exclusively for disaster recovery and long-term data synchronization via n8n. The client integration requires the public Supabase URL and anonymous key (`anon`). All write operations must first be queued locally in `sync_queue` before being transmitted to Supabase to ensure offline usability remains mandatory.

## Section F: Functional Modules
### F.1 GST Calculator (GSTCalculator)
This module handles all tax logic. It is a critical, non-negotiable component (`src/gst/calculator.js`).
*   **Functionality:** Calculates line item totals, including `taxableAmount`, `cgstAmount`, `sgstAmount`, and `igstAmount`.
*   **Inputs:** Requires `quantity`, `unitPrice`, `discountPercent`, `gstRate`, and crucially, the `supplyType` (intrastate/interstate).
*   **Supply Type Detection:** The application must dynamically determine supply type by comparing the business state (`currentSettings['business_state_code']`) with the customer's state (`customer.state_code`), utilizing `GSTCalculator.getSupplyType()`.

### F.2 GST Validator (GSTValidators)
A utility module responsible for validating Indian tax identification numbers. It provides a function, `isValidGSTIN()`, which must be triggered on blur events of GSTIN input fields to provide immediate UI feedback regarding data correctness.

### F.3 Amount-to-Words
This utility converts numerical totals into their corresponding word representation using the specific Indian numbering system (e.g., 1,00,000). It is located in `src/gst/amount-to-words.js` and must be made available globally to renderer components (`src/renderer/js/vendor/amount-to-words.js`) for display purposes.

### F.4 GST Test Cases
A comprehensive test suite (e.g., `src/gst/test-calculator.js`) must verify:
1.  Intrastate calculations (CGST + SGST).
2.  Interstate calculations (IGST only).
3.  Correct rounding rules for all tax components and final totals.
4.  Taxable amount calculation accuracy after applying discounts.

### F.5 GSTR-1 Export
This module (`src/gst/gstr1-export.js`) is responsible for aggregating data from `tax_records` across a specified period, structuring it into the required JSON format mandated by GST authorities (specifically referencing Section F.5 of an external document). This process facilitates export to meet regulatory reporting requirements and must be initiated via an n8n webhook trigger after generation.