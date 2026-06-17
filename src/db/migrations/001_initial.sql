-- settings table (local app configuration)
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- users_local table (Supabase session caching)
CREATE TABLE IF NOT EXISTS users_local (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    role TEXT,
    access_token TEXT,
    refresh_token TEXT,
    expires_at INTEGER
);

-- customers table (with encryption columns)
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

-- items_catalog table (with encryption columns)
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

-- bills table (invoices headers)
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

-- bill_items table (line items)
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
    cgst_rate REAL,
    cgst_amount REAL,
    sgst_rate REAL,
    sgst_amount REAL,
    igst_rate REAL,
    igst_amount REAL,
    line_total REAL,
    is_nil_rated INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE,
    FOREIGN KEY (catalog_item_id) REFERENCES items_catalog(id) ON DELETE SET NULL
);

-- tax_records table (rate-wise tax summaries)
CREATE TABLE IF NOT EXISTS tax_records (
    id TEXT PRIMARY KEY,
    bill_id TEXT UNIQUE NOT NULL,
    bill_date TEXT,
    bill_number TEXT,
    total_taxable REAL,
    total_cgst REAL,
    total_sgst REAL,
    total_igst REAL,
    total_tax REAL,
    grand_total REAL,
    encrypted_data TEXT,
    enc_iv TEXT,
    enc_auth_tag TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE
);

-- sync_queue table (offline synchronizer queue)
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

-- communication_log table (external notifications triggered by workflows)
CREATE TABLE IF NOT EXISTS communication_log (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    bill_id     TEXT,
    customer_id TEXT,
    channel     TEXT NOT NULL,
    template    TEXT,
    recipient   TEXT,
    sent_at     TEXT DEFAULT (datetime('now')),
    status      TEXT DEFAULT 'sent',
    error_msg   TEXT
);

-- Initial app configuration settings parameters
INSERT OR IGNORE INTO settings (key, value) VALUES
  ('email_from_name', ''),
  ('email_from_address', ''),
  ('smtp_host', ''),
  ('smtp_port', '587'),
  ('smtp_user', ''),
  ('smtp_pass', ''),
  ('accountant_email', ''),
  ('wati_enabled', '0'),
  ('wati_api_url', ''),
  ('wati_api_token', ''),
  ('business_phone_wa', ''),
  ('sms_enabled', '0'),
  ('msg91_auth_key', ''),
  ('msg91_sender_id', ''),
  ('msg91_dlt_template_id', ''),
  ('n8n_wh_bill_cancelled', ''),
  ('n8n_wh_customer_saved', ''),
  ('n8n_wh_item_saved', ''),
  ('n8n_wh_sync_push', ''),
  ('n8n_wh_report_request', ''),
  ('n8n_wh_bill_viewed', ''),
  ('notify_owner_email', '1'),
  ('notify_owner_whatsapp', '0'),
  ('notify_owner_phone', ''),
  ('notify_daily_summary', '1'),
  ('notify_weekly_report', '1'),
  ('notify_monthly_gst', '1'),
  ('reminder_7day', '1'),
  ('reminder_3day', '1'),
  ('reminder_1day', '1'),
  ('reminder_channels', 'email,whatsapp'),
  ('overdue_followup_days', '7,30'),
  ('bill_prefix', 'INV'),
  ('bill_next_number', '1'),
  ('default_gst_rate', '18'),
  ('setup_complete', '0'),
  ('supabase_url', ''),
  ('supabase_anon_key', ''),
  ('n8n_base_url', 'http://localhost:5678'),
  ('n8n_secret', ''),
  ('last_sync_at', '');
