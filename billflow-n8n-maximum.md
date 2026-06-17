# BillFlow — Maximum n8n Automation
## Complete Workflow Specification: All 22 Workflows

> **Philosophy:** The app is a thin UI + local SQLite only.
> n8n owns ALL external communication, ALL Supabase sync, ALL scheduling.
> The app fires a webhook and forgets. n8n does everything else.
>
> **Replaces:** Section B of `billflow-part2-implementation.md` (8 workflows)
> **Expands to:** 22 workflows, 3 communication channels, full scheduling

---

## TABLE OF CONTENTS

- [1. Updated Architecture](#1-updated-architecture)
- [2. Communication Channels Setup](#2-communication-channels-setup)
- [3. New Settings Required](#3-new-settings-required)
- [4. Webhook-Triggered Workflows (App → n8n)](#4-webhook-triggered-workflows)
- [5. Schedule-Triggered Workflows (n8n internal)](#5-schedule-triggered-workflows)
- [6. Message Templates](#6-message-templates)
- [7. n8n Environment Variables](#7-n8n-environment-variables)
- [8. App Code Changes](#8-app-code-changes)
- [9. n8n Setup Guide](#9-n8n-setup-guide)
- [10. Updated CLAUDE.md Patch](#10-updated-claudemd-patch)

---

## 1. Updated Architecture

```
╔══════════════════════════════════════════════════════════════════════════╗
║                      USER'S WINDOWS MACHINE                              ║
║                                                                          ║
║  ┌─────────────────────────────────────────────────────────────────┐    ║
║  │                 BillFlow Desktop App (THIN)                      │    ║
║  │                                                                  │    ║
║  │   UI (HTML/CSS/JS)  ←→  SQLite  ←→  Webhook Caller             │    ║
║  │                                                                  │    ║
║  │   App responsibilities:                                          │    ║
║  │   ✅ Data entry (create/edit bills, customers, items)            │    ║
║  │   ✅ Display (list, search, filter from SQLite)                  │    ║
║  │   ✅ Local PDF preview + print                                   │    ║
║  │   ✅ Fire webhooks to n8n for every event                        │    ║
║  │   ❌ NO Supabase calls from app (n8n does all sync)              │    ║
║  │   ❌ NO email sending from app                                   │    ║
║  │   ❌ NO WhatsApp/SMS from app                                    │    ║
║  └──────────────────────────┬──────────────────────────────────────┘    ║
║                             │ HTTP POST webhooks                         ║
║  ┌──────────────────────────▼──────────────────────────────────────┐    ║
║  │                  n8n Automation Engine                           │    ║
║  │              (runs locally on port 5678)                         │    ║
║  │                                                                  │    ║
║  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │    ║
║  │  │  Webhook     │  │  Schedulers  │  │  Sub-workflows       │  │    ║
║  │  │  Triggers    │  │  (Cron)      │  │  (reusable nodes)    │  │    ║
║  │  │  WF-01–08    │  │  WF-09–22    │  │  Send Email, WA, SMS │  │    ║
║  │  └──────────────┘  └──────────────┘  └──────────────────────┘  │    ║
║  └─────────────┬────────────┬───────────────┬────────────────────────┘    ║
╚════════════════╪════════════╪═══════════════╪════════════════════════════╝
                 │            │               │
       ┌─────────▼──┐  ┌──────▼──────┐  ┌───▼──────────────────────┐
       │  Supabase  │  │   Email     │  │   WhatsApp + SMS          │
       │  Cloud DB  │  │   SMTP /    │  │   WATI / Twilio /         │
       │  (all sync │  │   SendGrid  │  │   MSG91 / TextLocal       │
       │   via n8n) │  └─────────────┘  └──────────────────────────┘
       └────────────┘
```

### Key Architecture Change from Previous Design

| Before | After (Maximum n8n) |
|--------|---------------------|
| App → Supabase directly | App → n8n → Supabase |
| App fires 5 webhook types | App fires 10 webhook types |
| n8n sends emails only | n8n sends Email + WhatsApp + SMS |
| 8 n8n workflows | 22 n8n workflows |
| App refreshes Supabase token | n8n manages all Supabase writes |
| App does sync on startup | n8n syncs on every event + every 15 min |

---

## 2. Communication Channels Setup

### Channel 1: Email (SMTP or SendGrid)

**Recommended for India:** Gmail SMTP (free) or SendGrid (5,000 emails/month free).

n8n credential type: **SMTP** or **SendGrid API**

```
Gmail SMTP settings:
  Host:     smtp.gmail.com
  Port:     587
  Security: STARTTLS
  User:     youremail@gmail.com
  Password: App Password (not your Gmail password)
             → Gmail → Security → 2FA → App Passwords → Generate
```

---

### Channel 2: WhatsApp (WATI — recommended for India)

**WATI** (whatsapp.com/business/api via WATI.io) is the most popular in India.
Free trial gives 500 conversations/month.

n8n integration: **HTTP Request node** (no native n8n WATI node, but HTTP works perfectly).

**WATI API base URL:** `https://live-server-XXXXX.wati.io`
**Authentication:** Bearer token from WATI dashboard.

**WhatsApp requires pre-approved message templates** for business-initiated messages.
All templates are in Section 6. Submit them to WATI before going live.

Alternative options:
| Provider | Free Tier | Setup |
|---------|---------|-------|
| WATI | 500 conv/month | Easy, India-popular |
| Twilio | Pay-as-you-go | Best for global |
| Interakt | Limited free | Good India support |
| AiSensy | Pay-as-you-go | India-focused |
| Meta Direct | Complex | Cheapest at scale |

---

### Channel 3: SMS (MSG91 — recommended for India)

**MSG91** is the most reliable SMS provider in India (DLT registration required).

n8n integration: **HTTP Request node**.

**DLT Registration Note:** Indian regulations require all commercial SMS to be
registered on the DLT (Distributed Ledger Technology) platform before sending.
Register at: `https://www.trai.gov.in/dlt`
Required: Company PAN, GST certificate, Header (sender ID), Templates.

Alternative: **TextLocal** (also popular, similar pricing).

---

## 3. New Settings Required

Add these to SQLite `settings` table and the Settings page in the app:

```sql
-- In 001_initial.sql, add to the INSERT OR IGNORE block:
INSERT OR IGNORE INTO settings (key, value) VALUES
  -- Email
  ('email_from_name',       ''),   -- "My Business Name"
  ('email_from_address',    ''),   -- sender@mybusiness.com
  ('smtp_host',             ''),
  ('smtp_port',             '587'),
  ('smtp_user',             ''),
  ('smtp_pass',             ''),
  ('accountant_email',      ''),   -- CC on GST reports
  -- WhatsApp (WATI)
  ('wati_enabled',          '0'),
  ('wati_api_url',          ''),   -- https://live-server-XXXXX.wati.io
  ('wati_api_token',        ''),
  ('business_phone_wa',     ''),   -- business WhatsApp number
  -- SMS (MSG91)
  ('sms_enabled',           '0'),
  ('msg91_auth_key',        ''),
  ('msg91_sender_id',       ''),   -- 6-char DLT registered sender ID
  ('msg91_dlt_template_id', ''),   -- for each template, stored as JSON
  -- n8n webhooks (add new ones)
  ('n8n_wh_bill_cancelled', ''),
  ('n8n_wh_customer_added', ''),
  ('n8n_wh_report_request', ''),
  ('n8n_wh_bill_viewed',    ''),
  -- Notification preferences
  ('notify_owner_email',    '1'),
  ('notify_owner_whatsapp', '0'),
  ('notify_owner_phone',    ''),   -- owner's WhatsApp number
  ('notify_daily_summary',  '1'),
  ('notify_weekly_report',  '1'),
  ('notify_monthly_gst',    '1'),
  -- Reminder settings
  ('reminder_7day',         '1'),
  ('reminder_3day',         '1'),
  ('reminder_1day',         '1'),
  ('reminder_channels',     'email,whatsapp'), -- comma-separated
  ('overdue_followup_days', '7,30');  -- follow-up at day 7 and day 30
```

---

## 4. Webhook-Triggered Workflows

### WF-01 — Bill Created
**Trigger:** App fires on every new bill save (draft or sent)

**Webhook path:** `/webhook/bill-created`

**Payload from app:**
```json
{
  "event": "bill_created",
  "bill": {
    "id": "abc123",
    "bill_number": "INV-2025-001",
    "bill_date": "2025-01-15",
    "due_date": "2025-02-14",
    "status": "draft",
    "grand_total": 11800.00,
    "total_cgst": 900.00,
    "total_sgst": 900.00,
    "total_igst": 0.00,
    "supply_type": "intrastate",
    "notes": ""
  },
  "customer": {
    "id": "cust001",
    "name": "Rajesh Enterprises",
    "email": "rajesh@example.com",
    "phone": "9876543210",
    "gstin": "27AABCU9603R1ZX",
    "state": "Maharashtra"
  },
  "items": [
    {
      "description": "Web Development",
      "hsn_sac": "9983",
      "quantity": 10,
      "unit_price": 1000,
      "gst_rate": 18,
      "line_total": 11800
    }
  ],
  "business": {
    "name": "My Business",
    "gstin": "27XYZAB1234C1Z5",
    "owner_email": "owner@mybusiness.com",
    "owner_phone": "9123456789"
  }
}
```

**n8n Nodes:**
| # | Node | Action |
|---|------|--------|
| 1 | Webhook | Receive POST on `/webhook/bill-created` |
| 2 | Set | Extract bill, customer, business from payload |
| 3 | HTTP Request | **Supabase upsert** — POST to `/rest/v1/bills` (upsert) |
| 4 | HTTP Request | **Supabase upsert customers** — POST to `/rest/v1/customers` |
| 5 | HTTP Request | **Supabase upsert bill_items** — POST each item |
| 6 | HTTP Request | **Supabase upsert tax_records** — POST tax summary |
| 7 | IF | `bill.status === 'sent'`? |
| 8 → YES | Execute Workflow | Trigger **WF-02** (Send Bill to Customer) |
| 9 → NO | Respond | 200 OK (draft saved) |

---

### WF-02 — Bill Sent to Customer (Multi-Channel)
**Trigger:** App fires when user clicks "Save & Send" OR called by WF-01

**Webhook path:** `/webhook/bill-send`

**Additional payload field beyond WF-01:**
```json
{
  "pdf_base64": "JVBERi0xLjQ...",
  "send_channels": ["email", "whatsapp", "sms"]
}
```

**n8n Nodes:**
| # | Node | Action |
|---|------|--------|
| 1 | Webhook | Receive POST on `/webhook/bill-send` |
| 2 | Set | Prepare all variables |
| 3 | HTTP Request | Supabase UPDATE bill `status = 'sent'`, `updated_at = now()` |
| 4 | IF | `send_channels includes 'email'` AND customer email exists |
| 5 → YES | Send Email | Email to customer (see template EMAIL-01) with PDF attachment |
| 6 | IF | `send_channels includes 'whatsapp'` AND customer phone exists AND `wati_enabled` |
| 7 → YES | HTTP Request | WATI send template message WA-BILL-SENT (see Section 6) |
| 8 | IF | `send_channels includes 'sms'` AND customer phone exists AND `sms_enabled` |
| 9 → YES | HTTP Request | MSG91 send SMS (see template SMS-01) |
| 10 | Send Email | **Owner copy** — "Bill INV-2025-001 sent to Rajesh Enterprises" |
| 11 | IF | `notify_owner_whatsapp === '1'` AND owner phone set |
| 12 → YES | HTTP Request | WATI message to owner confirming bill was sent |
| 13 | Respond | 200 OK |

---

### WF-03 — Bill Marked Paid (Multi-Channel)
**Trigger:** App fires when user marks a bill as paid

**Webhook path:** `/webhook/bill-paid`

**Payload:**
```json
{
  "event": "bill_paid",
  "bill": { "...all bill fields...", "status": "paid" },
  "customer": { "...customer fields..." },
  "payment": {
    "amount_paid": 11800.00,
    "payment_date": "2025-01-20",
    "payment_method": "Bank Transfer",
    "payment_reference": "UTR123456789"
  },
  "business": { "...business fields..." }
}
```

**n8n Nodes:**
| # | Node | Action |
|---|------|--------|
| 1 | Webhook | Receive POST on `/webhook/bill-paid` |
| 2 | HTTP Request | Supabase PATCH bill — status=paid, payment_date, method, reference |
| 3 | HTTP Request | Supabase INSERT into `payment_log` table (for audit trail) |
| 4 | Send Email | **Customer receipt email** (template EMAIL-02) |
| 5 | IF | WhatsApp enabled + customer phone |
| 6 → YES | HTTP Request | WATI template WA-PAYMENT-RECEIVED to customer |
| 7 | Send Email | **Owner notification** — "Payment received: INV-2025-001 — ₹11,800" |
| 8 | IF | Owner WhatsApp enabled |
| 9 → YES | HTTP Request | WATI message to owner |
| 10 | Respond | 200 OK |

---

### WF-04 — Bill Cancelled
**Trigger:** App fires when user cancels a bill

**Webhook path:** `/webhook/bill-cancelled`

**n8n Nodes:**
| # | Node | Action |
|---|------|--------|
| 1 | Webhook | Receive POST |
| 2 | HTTP Request | Supabase PATCH bill `status = 'cancelled'` |
| 3 | IF | Bill was previously 'sent' (customer had already received it) |
| 4 → YES | Send Email | **Customer cancellation notice** (template EMAIL-03) |
| 5 → YES | HTTP Request | WATI cancellation message to customer (if WhatsApp enabled) |
| 6 | Respond | 200 OK |

---

### WF-05 — Customer Added / Updated
**Trigger:** App fires when a customer is created or edited

**Webhook path:** `/webhook/customer-saved`

**Payload:**
```json
{
  "event": "customer_saved",
  "operation": "INSERT",
  "customer": { "...all customer fields..." },
  "business": { "name": "...", "owner_email": "..." }
}
```

**n8n Nodes:**
| # | Node | Action |
|---|------|--------|
| 1 | Webhook | Receive POST |
| 2 | Switch | Route by `operation`: INSERT or UPDATE |
| 3a INSERT | HTTP Request | Supabase INSERT customer |
| 3b INSERT | IF | Customer has email |
| 4b → YES | Send Email | **Welcome email to customer** (template EMAIL-04) |
| 3c UPDATE | HTTP Request | Supabase PATCH customer |
| 5 | Respond | 200 OK |

---

### WF-06 — Item Catalog Sync
**Trigger:** App fires when an item is created/updated/deleted

**Webhook path:** `/webhook/item-saved`

**n8n Nodes:**
| # | Node | Action |
|---|------|--------|
| 1 | Webhook | Receive POST |
| 2 | Switch | Route by `operation`: INSERT / UPDATE / DELETE |
| 3a | HTTP Request | Supabase INSERT item |
| 3b | HTTP Request | Supabase PATCH item |
| 3c | HTTP Request | Supabase PATCH item `deleted_at = now()` (soft delete) |
| 4 | Respond | 200 OK |

---

### WF-07 — Full Data Sync Push
**Trigger:** App fires on startup (if offline during last session) and periodically

**Webhook path:** `/webhook/sync-push`

**Payload:**
```json
{
  "sync_items": [
    {
      "operation": "INSERT",
      "table_name": "bills",
      "record_id": "abc123",
      "payload": { "...full record..." }
    },
    {
      "operation": "UPDATE",
      "table_name": "customers",
      "record_id": "cust001",
      "payload": { "...full record..." }
    }
  ]
}
```

**n8n Nodes:**
| # | Node | Action |
|---|------|--------|
| 1 | Webhook | Receive POST |
| 2 | Split In Batches | Process 10 items at a time |
| 3 | Switch | Route each item by `operation` + `table_name` |
| 4 | HTTP Request | Supabase upsert/patch/soft-delete accordingly |
| 5 | IF | Any errors occurred? |
| 6 → YES | HTTP Request | POST back to `/webhook/sync-errors` on app (if app has a listener on localhost) OR log to Supabase error log |
| 7 | Respond | 200 with `{ "processed": N, "errors": M }` |

---

### WF-08 — Report Request (On-Demand)
**Trigger:** User clicks "Email Report" button in Reports page

**Webhook path:** `/webhook/report-request`

**Payload:**
```json
{
  "report_type": "gst_monthly",
  "period": "2025-01",
  "email_to": "owner@mybusiness.com",
  "cc_to": "accountant@ca.com"
}
```

**n8n Nodes:**
| # | Node | Action |
|---|------|--------|
| 1 | Webhook | Receive POST |
| 2 | Switch | Route by `report_type` |
| 3a `gst_monthly` | HTTP Request | Fetch tax_records from Supabase for period |
| 3a | Function | Aggregate by rate slab + format HTML table |
| 3a | Send Email | Email GST report to `email_to` with CC to `cc_to` |
| 3b `revenue` | HTTP Request | Fetch bills from Supabase for period |
| 3b | Function | Calculate totals, format HTML table |
| 3b | Send Email | Email revenue report |
| 3c `overdue` | HTTP Request | Fetch overdue bills from Supabase |
| 3c | Function | Format ageing report |
| 3c | Send Email | Email overdue report |
| 4 | Respond | 200 OK |

---

### WF-09 — Settings Updated (Sync to Supabase)
**Trigger:** User saves business profile in Settings

**Webhook path:** `/webhook/settings-updated`

**Payload:**
```json
{
  "business_name": "My Business",
  "gstin": "27XYZAB1234C1Z5",
  "business_state": "Maharashtra",
  "business_state_code": "27"
}
```

**n8n Nodes:**
| # | Node | Action |
|---|------|--------|
| 1 | Webhook | Receive POST |
| 2 | HTTP Request | Supabase PATCH `profiles` table for this user |
| 3 | Respond | 200 OK |

---

## 5. Schedule-Triggered Workflows

---

### WF-10 — Daily Morning Summary (Every day at 8:00 AM)

**Purpose:** Give the business owner a start-of-day overview.

**n8n Nodes:**
| # | Node | Action |
|---|------|--------|
| 1 | Cron | `0 8 * * *` (8 AM every day) |
| 2 | HTTP Request | Supabase — count bills by status (today + this month) |
| 3 | HTTP Request | Supabase — sum `grand_total` of paid bills this month |
| 4 | HTTP Request | Supabase — count overdue bills |
| 5 | HTTP Request | Supabase — list bills due TODAY |
| 6 | Function | Build summary HTML and plain text |
| 7 | IF | `notify_daily_summary === '1'` |
| 8 → YES | Send Email | Owner — daily summary (template EMAIL-05) |
| 9 | IF | Owner WhatsApp enabled AND `notify_owner_whatsapp === '1'` |
| 10 → YES | HTTP Request | WATI — short daily summary to owner (template WA-DAILY-SUMMARY) |

**Summary includes:**
- Bills due TODAY: `{count}` (list them by name + amount)
- Overdue bills total: `{count}` bills worth ₹`{total}`
- Revenue this month: ₹`{amount}` from `{count}` paid bills
- Unpaid this month: `{count}` bills worth ₹`{total}`

---

### WF-11 — 7-Day Payment Reminder (Every day at 9:00 AM)

**Purpose:** Remind customers whose bill is due in exactly 7 days.

**n8n Nodes:**
| # | Node | Action |
|---|------|--------|
| 1 | Cron | `0 9 * * *` |
| 2 | Function | `dueDate = today + 7 days` |
| 3 | HTTP Request | Supabase — bills where `due_date = dueDate` AND `status = 'sent'` |
| 4 | IF | Any results? |
| 5 → YES | Split In Batches | One bill at a time |
| 6 | HTTP Request | Supabase — get customer details for this bill |
| 7 | IF | Customer has email AND `reminder_7day = '1'` |
| 8 → YES | Send Email | Email to customer (template EMAIL-06) |
| 9 | IF | WhatsApp enabled AND customer phone AND `reminder_channels includes 'whatsapp'` |
| 10 → YES | HTTP Request | WATI — 7-day reminder (template WA-REMINDER-7) |
| 11 | HTTP Request | Supabase — log communication to `communication_log` table |

---

### WF-12 — 3-Day Payment Reminder (Every day at 9:00 AM)

**Purpose:** Urgent reminder — bill due in 3 days.

Same structure as WF-11 but:
- `dueDate = today + 3 days`
- More urgent tone in templates
- Also sends SMS if enabled (template SMS-02)

**n8n Nodes:** Same as WF-11 + add:
| # | Node | Action |
|---|------|--------|
| + | IF | SMS enabled AND customer phone AND `reminder_channels includes 'sms'` |
| + → YES | HTTP Request | MSG91 — 3-day SMS reminder (template SMS-02) |

---

### WF-13 — 1-Day Payment Reminder (Every day at 9:00 AM)

**Purpose:** Final notice — bill due tomorrow.

Same structure as WF-12 but:
- `dueDate = today + 1 day`
- Final/urgent tone
- Also alert the OWNER via WhatsApp (list of bills due tomorrow)

**Additional owner alert node:**
| # | Node | Action |
|---|------|--------|
| + | Function | Build owner alert: "Bills due tomorrow: {list}" |
| + | IF | Owner WhatsApp enabled |
| + → YES | HTTP Request | WATI — alert owner with list of bills due tomorrow |

---

### WF-14 — Overdue Detection + Day-1 Alert (Every day at 10:00 AM)

**Purpose:** Find bills that became overdue today (due_date = yesterday, status = sent).
Flag them and notify both customer and owner.

**n8n Nodes:**
| # | Node | Action |
|---|------|--------|
| 1 | Cron | `0 10 * * *` |
| 2 | Function | `yesterday = today - 1 day` |
| 3 | HTTP Request | Supabase — bills where `due_date = yesterday` AND `status = 'sent'` |
| 4 | IF | Any results? |
| 5 → YES | Split In Batches | One bill at a time |
| 6 | HTTP Request | Supabase — PATCH bill `status = 'overdue'` |
| 7 | HTTP Request | Supabase — get customer details |
| 8 | Send Email | Customer — overdue notice (template EMAIL-07) |
| 9 | IF | WhatsApp enabled AND customer phone |
| 10 → YES | HTTP Request | WATI — overdue notice (template WA-OVERDUE-1) |
| 11 | IF | SMS enabled AND customer phone |
| 12 → YES | HTTP Request | MSG91 — overdue SMS (template SMS-03) |
| 13 | (after all bills processed) | Aggregate all newly overdue bills |
| 14 | Send Email | Owner — "X bills became overdue today: {list}" |
| 15 | IF | Owner WhatsApp enabled |
| 16 → YES | HTTP Request | WATI — owner overdue alert |

---

### WF-15 — Overdue Day-7 Follow-Up (Every day at 10:00 AM)

**Purpose:** Second notice to customers who are 7 days overdue. More firm tone.

**n8n Nodes:**
| # | Node | Action |
|---|------|--------|
| 1 | Cron | `0 10 * * *` |
| 2 | Function | `overdueSince = today - 7 days` |
| 3 | HTTP Request | Supabase — bills where `due_date = overdueSince` AND `status = 'overdue'` |
| 4 | IF | Any results? |
| 5 → YES | Split In Batches | One at a time |
| 6 | Send Email | Customer — day-7 follow-up (template EMAIL-08) |
| 7 | IF | WhatsApp enabled + phone |
| 8 → YES | HTTP Request | WATI — day-7 message (template WA-OVERDUE-7) |
| 9 | HTTP Request | Log to `communication_log` in Supabase |

---

### WF-16 — Overdue Day-30 Escalation (Every day at 10:00 AM)

**Purpose:** Formal escalation for 30-day-overdue bills.

Same structure as WF-15 but:
- `overdueSince = today - 30 days`
- Formal/legal-tone templates
- Also sends SMS regardless (escalation)
- Flags bill in Supabase with `escalated = true`
- Sends owner a special alert with action required

**n8n Nodes:** Same as WF-15 + add:
| # | Node | Action |
|---|------|--------|
| + | HTTP Request | Supabase PATCH bill — set custom field `escalation_date = today` |
| + | Send Email | Formal escalation to customer (template EMAIL-09) |
| + | HTTP Request | MSG91 — escalation SMS (template SMS-04) |
| + | Send Email | Owner — escalation alert with action items |

---

### WF-17 — Weekly Overdue Report (Every Monday at 9:00 AM)

**Purpose:** Give owner a full ageing analysis of all overdue bills.

**n8n Nodes:**
| # | Node | Action |
|---|------|--------|
| 1 | Cron | `0 9 * * 1` (Monday) |
| 2 | HTTP Request | Supabase — all overdue bills with customer names |
| 3 | Function | Group into ageing buckets: 1–7d / 8–30d / 31–60d / 60+d |
| 4 | Function | Build HTML table with totals per bucket |
| 5 | IF | `notify_weekly_report === '1'` |
| 6 → YES | Send Email | Owner — weekly overdue ageing report (template EMAIL-10) |
| 7 | IF | Owner WhatsApp AND `notify_owner_whatsapp` |
| 8 → YES | HTTP Request | WATI — short summary to owner (e.g. "12 overdue bills, ₹45,800 total") |

---

### WF-18 — Monthly GST Report (1st of every month at 9:00 AM)

**Purpose:** Full GST summary for the previous month to owner + accountant.

**n8n Nodes:**
| # | Node | Action |
|---|------|--------|
| 1 | Cron | `0 9 1 * *` (1st of month) |
| 2 | Function | Calculate previous month date range |
| 3 | HTTP Request | Supabase — `tax_records` for previous month |
| 4 | Function | Aggregate: total taxable, CGST, SGST, IGST, total tax, by slab |
| 5 | Function | Build rate-wise HTML table |
| 6 | Function | Build HSN-wise HTML table |
| 7 | IF | `notify_monthly_gst === '1'` |
| 8 → YES | Send Email | Owner + accountant CC — full GST report (template EMAIL-11) |
| 9 | IF | Owner WhatsApp |
| 10 → YES | HTTP Request | WATI — GST summary numbers to owner |
| 11 | HTTP Request | Supabase — store report metadata in `report_log` table |

---

### WF-19 — Quarterly GST Filing Reminder

**Purpose:** Remind owner 15 days before each GST quarter ends to file returns.

**GST Quarter ends:** 30 June / 30 September / 31 December / 31 March

**n8n Nodes:**
| # | Node | Action |
|---|------|--------|
| 1 | Cron | `0 9 15 3,6,9,12 *` (15th of Mar/Jun/Sep/Dec) |
| 2 | Function | Calculate which quarter is ending + last date |
| 3 | Send Email | Owner — GST filing reminder (template EMAIL-12) |
| 4 | IF | WhatsApp enabled |
| 5 → YES | HTTP Request | WATI — filing reminder to owner |

---

### WF-20 — Weekly Revenue Report (Every Monday at 9:00 AM)

**Purpose:** Previous week's revenue summary for the owner.

**n8n Nodes:**
| # | Node | Action |
|---|------|--------|
| 1 | Cron | `0 9 * * 1` (Monday — runs alongside WF-17) |
| 2 | Function | Calculate previous week's Monday–Sunday dates |
| 3 | HTTP Request | Supabase — paid bills in that date range |
| 4 | Function | Sum revenue, count bills, top customer by revenue |
| 5 | HTTP Request | Supabase — bills created this week (pipeline) |
| 6 | Function | Build weekly revenue HTML email |
| 7 | IF | `notify_weekly_report === '1'` |
| 8 → YES | Send Email | Owner — weekly revenue report (template EMAIL-13) |

---

### WF-21 — Periodic Supabase Sync (Every 15 minutes)

**Purpose:** Keep Supabase in sync even if app webhooks were missed (fallback).

**n8n Nodes:**
| # | Node | Action |
|---|------|--------|
| 1 | Cron | `*/15 * * * *` (every 15 minutes) |
| 2 | HTTP Request | Supabase — query `sync_events` table for unprocessed events |
| 3 | IF | Any unprocessed events? |
| 4 → YES | Split In Batches | Process each |
| 5 | Switch | Route by `table_name` |
| 6 | HTTP Request | Supabase upsert for each table |
| 7 | HTTP Request | Mark event processed |

> **Note:** This requires the app to write to a `sync_events` table in SQLite
> AND a matching `sync_events` table in Supabase. OR you can skip this if
> WF-07 (Full Data Sync Push) is called reliably from the app on startup.

---

### WF-22 — Communication Log Writer (Sub-workflow)

**Purpose:** Every workflow that sends a message calls this sub-workflow to log it.
This gives the owner a full history of all communications sent.

**Called by:** WF-02, WF-03, WF-04, WF-11, WF-12, WF-13, WF-14, WF-15, WF-16

**Input payload:**
```json
{
  "bill_id": "abc123",
  "customer_id": "cust001",
  "channel": "email",
  "template": "EMAIL-06",
  "recipient": "rajesh@example.com",
  "sent_at": "2025-01-15T09:00:00Z",
  "status": "sent"
}
```

**n8n Nodes:**
| # | Node | Action |
|---|------|--------|
| 1 | Execute Workflow Trigger | Receives payload from parent workflow |
| 2 | HTTP Request | Supabase INSERT into `communication_log` |

**New Supabase table (add to migration SQL):**
```sql
CREATE TABLE IF NOT EXISTS public.communication_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    UUID NOT NULL REFERENCES auth.users(id),
  bill_id     UUID REFERENCES public.bills(id),
  customer_id UUID REFERENCES public.customers(id),
  channel     TEXT NOT NULL CHECK(channel IN ('email','whatsapp','sms')),
  template    TEXT,
  recipient   TEXT,
  sent_at     TIMESTAMPTZ DEFAULT NOW(),
  status      TEXT DEFAULT 'sent',
  error_msg   TEXT
);
CREATE INDEX ON public.communication_log(owner_id);
CREATE INDEX ON public.communication_log(bill_id);
```

**Also add to SQLite:**
```sql
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
```

---

## 6. Message Templates

---

### Email Templates

#### EMAIL-01 — Bill Sent to Customer
```
Subject: Invoice {{bill_number}} from {{business_name}} — ₹{{grand_total}}

Dear {{customer_name}},

Please find attached Invoice {{bill_number}} for ₹{{grand_total}}.

Bill Date: {{bill_date}}
Due Date:  {{due_date}}

For any queries, please reply to this email.

Bank Details:
  Bank:    {{bank_name}}
  Account: {{bank_account}}
  IFSC:    {{bank_ifsc}}

Thank you for your business.

{{business_name}}
GSTIN: {{business_gstin}}
```

#### EMAIL-02 — Payment Received (Receipt)
```
Subject: Payment Received — Invoice {{bill_number}} — Thank You!

Dear {{customer_name}},

We have received your payment of ₹{{amount_paid}}.

Invoice:          {{bill_number}}
Amount Paid:      ₹{{amount_paid}}
Payment Date:     {{payment_date}}
Payment Method:   {{payment_method}}
Reference/UTR:    {{payment_reference}}

This is your payment confirmation. No further action needed.

Thank you for your prompt payment.

{{business_name}}
```

#### EMAIL-03 — Bill Cancelled
```
Subject: Invoice {{bill_number}} has been cancelled

Dear {{customer_name}},

Please note that Invoice {{bill_number}} dated {{bill_date}}
for ₹{{grand_total}} has been cancelled.

If you believe this is an error, please contact us.

{{business_name}}
```

#### EMAIL-04 — Welcome New Customer
```
Subject: Welcome to {{business_name}}

Dear {{customer_name}},

Thank you for choosing {{business_name}}. We look forward to working with you.

Your invoices will be sent to this email address. If you have any questions,
please don't hesitate to reach out.

{{business_name}}
```

#### EMAIL-05 — Daily Summary (Owner)
```
Subject: BillFlow Daily Summary — {{today_date}}

Good morning,

Here is your business summary for today:

📋 BILLS DUE TODAY
{{#if bills_due_today}}
{{bills_due_today_table}}
{{else}}
No bills due today.
{{/if}}

⚠️ OVERDUE BILLS
Total overdue: {{overdue_count}} bills worth ₹{{overdue_total}}

💰 THIS MONTH'S REVENUE
Paid: ₹{{month_revenue}} from {{paid_count}} bills
Unpaid: ₹{{unpaid_total}} from {{unpaid_count}} bills

— BillFlow Automation
```

#### EMAIL-06 — 7-Day Reminder
```
Subject: Friendly Reminder: Invoice {{bill_number}} due in 7 days

Dear {{customer_name}},

This is a friendly reminder that Invoice {{bill_number}} for ₹{{grand_total}}
is due on {{due_date}} (7 days from now).

Bank Details:
  Bank:    {{bank_name}}
  Account: {{bank_account}}
  IFSC:    {{bank_ifsc}}

Please disregard if payment has already been made.

{{business_name}}
```

#### EMAIL-07 — Overdue Notice (Day 1)
```
Subject: OVERDUE: Invoice {{bill_number}} payment due

Dear {{customer_name}},

Invoice {{bill_number}} for ₹{{grand_total}} was due on {{due_date}}
and remains unpaid.

Please arrange payment at your earliest convenience.

If you are facing any difficulties, please contact us to discuss.

{{business_name}}
```

#### EMAIL-08 — Overdue Follow-Up (Day 7)
```
Subject: Second Notice: Invoice {{bill_number}} — {{days_overdue}} days overdue

Dear {{customer_name}},

Despite our earlier reminder, Invoice {{bill_number}} for ₹{{grand_total}}
remains unpaid. It is now {{days_overdue}} days past the due date.

Please make payment immediately or contact us within 48 hours
to discuss a resolution.

{{business_name}}
```

#### EMAIL-09 — Escalation (Day 30)
```
Subject: URGENT: Invoice {{bill_number}} — 30 days overdue

Dear {{customer_name}},

Invoice {{bill_number}} for ₹{{grand_total}} remains unpaid after 30 days.

This is our final notice before we are required to take further action.
Please arrange payment within 7 days of receiving this notice.

If payment has been made, please send us the payment reference immediately.

{{business_name}}
```

#### EMAIL-10 — Weekly Overdue Ageing Report (Owner)
```
Subject: Weekly Overdue Report — {{report_week}}

OVERDUE AGEING SUMMARY

1–7 Days:    {{count_1_7}} bills — ₹{{total_1_7}}
8–30 Days:   {{count_8_30}} bills — ₹{{total_8_30}}
31–60 Days:  {{count_31_60}} bills — ₹{{total_31_60}}
60+ Days:    {{count_60plus}} bills — ₹{{total_60plus}}

TOTAL OUTSTANDING: {{total_overdue_count}} bills — ₹{{total_overdue}}

{{overdue_table}}

— BillFlow Automation
```

#### EMAIL-11 — Monthly GST Report (Owner + Accountant)
```
Subject: GST Summary — {{month_name}} {{year}} | {{business_name}}

GST COLLECTION SUMMARY — {{month_name}} {{year}}

BUSINESS: {{business_name}}
GSTIN:    {{gstin}}
STATE:    {{state}}

RATE-WISE SUMMARY
{{rate_wise_table}}

HSN-WISE SUMMARY
{{hsn_wise_table}}

GRAND TOTALS
Total Taxable Value: ₹{{total_taxable}}
Total CGST:          ₹{{total_cgst}}
Total SGST:          ₹{{total_sgst}}
Total IGST:          ₹{{total_igst}}
Total Tax Collected: ₹{{total_tax}}
Total Invoice Value: ₹{{grand_total}}

No. of Invoices: {{invoice_count}}
No. of Customers: {{customer_count}}

Note: This is an auto-generated summary for reference.
Please verify with your accountant before filing.

— BillFlow Automation
```

#### EMAIL-12 — GST Quarterly Filing Reminder
```
Subject: Reminder: GST Return Filing Due — {{quarter}} Quarter

The GST quarter ending {{quarter_end_date}} is approaching.

GSTR-1 Due: {{gstr1_due_date}}
GSTR-3B Due: {{gstr3b_due_date}}

Use BillFlow Reports → GST Summary → Export JSON to download
your GSTR-1 data for this quarter.

— BillFlow Automation
```

#### EMAIL-13 — Weekly Revenue Report (Owner)
```
Subject: Weekly Revenue Report — Week of {{week_start}}

LAST WEEK ({{week_start}} to {{week_end}})

Revenue collected:  ₹{{week_revenue}}
Bills paid:         {{week_paid_count}}
Bills created:      {{week_created_count}}
Best customer:      {{top_customer}} (₹{{top_customer_amount}})

THIS MONTH SO FAR
Revenue: ₹{{month_revenue}}
Paid bills: {{month_paid_count}}

— BillFlow Automation
```

---

### WhatsApp Templates (WATI — must be pre-approved by Meta)

> **How to submit:** WATI Dashboard → Message Templates → Create Template
> Category: UTILITY (for transactional messages)
> Language: English (or Hindi if needed)

#### WA-BILL-SENT
```
Template name: billflow_invoice_sent
Category: UTILITY

Body:
Hello {{1}}, Invoice {{2}} for ₹{{3}} has been sent by {{4}}. Due date: {{5}}. Please check your email for the attached invoice. Thank you!

Parameters:
{{1}} = customer_name
{{2}} = bill_number
{{3}} = grand_total
{{4}} = business_name
{{5}} = due_date
```

#### WA-PAYMENT-RECEIVED
```
Template name: billflow_payment_received
Category: UTILITY

Body:
Hi {{1}}, we received your payment of ₹{{2}} for Invoice {{3}}. Reference: {{4}}. Thank you for the prompt payment! — {{5}}

Parameters:
{{1}} = customer_name
{{2}} = amount_paid
{{3}} = bill_number
{{4}} = payment_reference
{{5}} = business_name
```

#### WA-REMINDER-7
```
Template name: billflow_reminder_7day
Category: UTILITY

Body:
Hi {{1}}, friendly reminder: Invoice {{2}} for ₹{{3}} from {{4}} is due on {{5}} (7 days). Please arrange payment. Thank you!

Parameters:
{{1}} = customer_name, {{2}} = bill_number, {{3}} = amount,
{{4}} = business_name, {{5}} = due_date
```

#### WA-REMINDER-3
```
Template name: billflow_reminder_3day
Category: UTILITY

Body:
Hi {{1}}, urgent reminder: Invoice {{2}} for ₹{{3}} is due in 3 days on {{4}}. Please pay to {{5}} (A/C: {{6}}, IFSC: {{7}}). Thank you!

Parameters:
{{1}} = customer_name, {{2}} = bill_number, {{3}} = amount,
{{4}} = due_date, {{5}} = bank_name, {{6}} = bank_account, {{7}} = bank_ifsc
```

#### WA-REMINDER-1
```
Template name: billflow_reminder_1day
Category: UTILITY

Body:
Hi {{1}}, final reminder: Invoice {{2}} for ₹{{3}} is due TOMORROW ({{4}}). Please pay now. Bank: {{5}}, A/C: {{6}}. Ref: {{7}}. — {{8}}
```

#### WA-OVERDUE-1
```
Template name: billflow_overdue_notice
Category: UTILITY

Body:
Hi {{1}}, Invoice {{2}} for ₹{{3}} from {{4}} was due on {{5}} and is now overdue. Please pay immediately or contact us. Thank you.
```

#### WA-OVERDUE-7
```
Template name: billflow_overdue_7day
Category: UTILITY

Body:
Hi {{1}}, this is a second notice. Invoice {{2}} for ₹{{3}} is 7 days overdue. Please arrange payment or contact {{4}} within 48 hours.
```

#### WA-DAILY-SUMMARY (Owner)
```
Template name: billflow_daily_summary
Category: UTILITY

Body:
BillFlow Summary {{1}}: Due today: {{2}} bills. Overdue: {{3}} bills (₹{{4}}). Month revenue: ₹{{5}}. — BillFlow
```

---

### SMS Templates (MSG91 — DLT registered)

> **DLT Registration:** Submit each template on the Telecom DLT portal.
> Use 6-char Sender ID (Header) registered under your company.
> Keep SMS under 160 characters when possible.

#### SMS-01 — Bill Sent
```
Dear {#var#}, Invoice {#var#} for Rs.{#var#} from {#var#} is due on {#var#}. Check email for details. -{#var#}

DLT Template ID: (assigned after DLT approval)
```

#### SMS-02 — 3-Day Reminder
```
REMINDER: Invoice {#var#} Rs.{#var#} due {#var#}. Pay to {#var#} A/C {#var#} IFSC {#var#}. -{#var#}
```

#### SMS-03 — Overdue Notice
```
OVERDUE: Invoice {#var#} Rs.{#var#} was due {#var#}. Pay immediately or call {#var#}. -{#var#}
```

#### SMS-04 — Escalation
```
URGENT: Invoice {#var#} Rs.{#var#} is 30 days overdue. Immediate payment required. -{#var#}
```

---

## 7. n8n Environment Variables

Set these in n8n → Settings → Environment Variables (or in a `.env` file if self-hosted):

```bash
# Supabase
SUPABASE_URL=https://abcdefgh.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=youremail@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM_NAME=My Business
EMAIL_FROM_ADDRESS=youremail@gmail.com
ACCOUNTANT_EMAIL=accountant@ca.com

# WhatsApp (WATI)
WATI_API_URL=https://live-server-XXXXX.wati.io
WATI_AUTH_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6...

# SMS (MSG91)
MSG91_AUTH_KEY=XXXXXXXXXXXXXXXXXXXXXX
MSG91_SENDER_ID=BILLFW

# Owner contact (for owner notifications)
OWNER_EMAIL=owner@mybusiness.com
OWNER_PHONE=919876543210    # country code + number, no +

# n8n webhook secret
WEBHOOK_SECRET=your-random-secret-token-here

# Owner notification prefs
NOTIFY_DAILY_SUMMARY=true
NOTIFY_WEEKLY_REPORT=true
NOTIFY_MONTHLY_GST=true
NOTIFY_OWNER_WHATSAPP=false
```

---

## 8. App Code Changes

### 8.1 Updated Webhook Calls in `src/n8n/webhooks.js`

Expand the module to cover all new events. Replace the existing file:

```javascript
var settings = require('../db/queries/settings');

function callWebhook(webhookKey, payload) {
  var baseUrl = settings.getSetting('n8n_base_url') || 'http://localhost:5678';
  var path = webhookKey;  // e.g. '/webhook/bill-created'
  var url = baseUrl + path;
  var secret = settings.getSetting('n8n_secret') || '';

  try {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('X-BillFlow-Secret', secret);
    xhr.timeout = 5000;
    xhr.send(JSON.stringify(payload));
  } catch (e) {
    console.error('Webhook failed:', path, e.message);
  }
}

// Build the full payload (reused across multiple events)
function buildBillPayload(bill, customer, items, business) {
  return {
    bill: bill,
    customer: customer,
    items: items || [],
    business: {
      name:         business.business_name || '',
      gstin:        business.gstin || '',
      address:      business.business_address || '',
      state:        business.business_state || '',
      bank_name:    business.bank_name || '',
      bank_account: business.bank_account || '',
      bank_ifsc:    business.bank_ifsc || '',
      owner_email:  business.owner_email || '',
      owner_phone:  business.owner_phone || ''
    }
  };
}

module.exports = {

  billCreated: function(bill, customer, items, business) {
    var payload = buildBillPayload(bill, customer, items, business);
    payload.event = 'bill_created';
    callWebhook('/webhook/bill-created', payload);
  },

  billSent: function(bill, customer, items, business, pdfBase64, channels) {
    var payload = buildBillPayload(bill, customer, items, business);
    payload.event = 'bill_send';
    payload.pdf_base64 = pdfBase64 || '';
    payload.send_channels = channels || ['email'];
    callWebhook('/webhook/bill-send', payload);
  },

  billPaid: function(bill, customer, business, payment) {
    var payload = buildBillPayload(bill, customer, [], business);
    payload.event = 'bill_paid';
    payload.payment = payment;
    callWebhook('/webhook/bill-paid', payload);
  },

  billCancelled: function(bill, customer, business) {
    var payload = buildBillPayload(bill, customer, [], business);
    payload.event = 'bill_cancelled';
    payload.was_sent = (bill.status === 'sent');
    callWebhook('/webhook/bill-cancelled', payload);
  },

  customerSaved: function(operation, customer, business) {
    callWebhook('/webhook/customer-saved', {
      event: 'customer_saved',
      operation: operation,  // 'INSERT' or 'UPDATE'
      customer: customer,
      business: { name: business.business_name, owner_email: business.owner_email }
    });
  },

  itemSaved: function(operation, item, ownerId) {
    callWebhook('/webhook/item-saved', {
      event: 'item_saved',
      operation: operation,
      item: item,
      owner_id: ownerId
    });
  },

  syncPush: function(syncItems) {
    // syncItems: array from sync_queue table
    callWebhook('/webhook/sync-push', { sync_items: syncItems });
  },

  reportRequest: function(reportType, period, emailTo, ccTo) {
    callWebhook('/webhook/report-request', {
      report_type: reportType,
      period: period,
      email_to: emailTo,
      cc_to: ccTo || ''
    });
  },

  settingsUpdated: function(changedSettings) {
    callWebhook('/webhook/settings-updated', changedSettings);
  }
};
```

### 8.2 Remove Supabase Direct Calls from App

Since n8n now handles all Supabase sync, remove `src/supabase/sync.js`
auto-calls from `main.js`. Keep the Supabase client for auth only.

**In `src/main.js`** — remove or comment out:
```javascript
// REMOVE THIS:
// sync.syncNow();  // no longer called by app — n8n handles sync

// KEEP THIS (auth still uses Supabase):
// auth.login() / auth.logout() / auth.getSession()
```

**In `ipcMain.handle('sync:now', ...)` handler** — change to:
```javascript
ipcMain.handle('sync:now', function() {
  // Trigger n8n sync instead of direct Supabase push
  var syncQueue = require('./db/queries/sync-queue');
  var pending = syncQueue.getPendingQueue();
  if (pending.length > 0) {
    var webhooks = require('./n8n/webhooks');
    webhooks.syncPush(pending);
  }
  return { pending: pending.length };
});
```

### 8.3 Updated Settings Page (Integrations Tab)

Add these new fields to the Settings → Integrations tab:

```
SECTION: Email
  From Name:      [text input]  → email_from_name
  From Address:   [text input]  → email_from_address
  SMTP Host:      [text input]  → smtp_host
  SMTP Port:      [text input]  → smtp_port
  SMTP User:      [text input]  → smtp_user
  SMTP Password:  [password]    → smtp_pass
  Accountant CC:  [text input]  → accountant_email

SECTION: WhatsApp (WATI)
  [toggle] Enable WhatsApp     → wati_enabled
  WATI API URL:   [text input]  → wati_api_url
  WATI Token:     [password]    → wati_api_token

SECTION: SMS (MSG91)
  [toggle] Enable SMS           → sms_enabled
  AUTH Key:       [text input]  → msg91_auth_key
  Sender ID:      [text input]  → msg91_sender_id  (max 6 chars)

SECTION: Owner Notifications
  Owner Phone (WhatsApp): [text] → notify_owner_phone
  [toggle] Daily Summary         → notify_daily_summary
  [toggle] Weekly Reports        → notify_weekly_report
  [toggle] Monthly GST Report    → notify_monthly_gst
  [toggle] WhatsApp Alerts       → notify_owner_whatsapp

SECTION: Reminder Channels (for customer-facing messages)
  [checkbox] Email               → reminder_channels (email)
  [checkbox] WhatsApp            → reminder_channels (whatsapp)
  [checkbox] SMS                 → reminder_channels (sms)

SECTION: n8n Webhooks (auto-populated from n8n_base_url)
  n8n Base URL:  [text input]    → n8n_base_url
  n8n Secret:    [text input]    → n8n_secret
  [button] Test n8n Connection
  [button] Re-import all webhook URLs
```

**Auto-populate webhook URLs:** When `n8n_base_url` is saved, auto-fill all
`n8n_wh_*` settings by appending the standard paths:
```javascript
var base = newBaseUrl.replace(/\/$/, '');
setSetting('n8n_wh_bill_created',  base + '/webhook/bill-created');
setSetting('n8n_wh_bill_sent',     base + '/webhook/bill-send');
setSetting('n8n_wh_bill_paid',     base + '/webhook/bill-paid');
setSetting('n8n_wh_bill_cancelled',base + '/webhook/bill-cancelled');
setSetting('n8n_wh_customer_saved',base + '/webhook/customer-saved');
setSetting('n8n_wh_item_saved',    base + '/webhook/item-saved');
setSetting('n8n_wh_sync_push',     base + '/webhook/sync-push');
setSetting('n8n_wh_report_request',base + '/webhook/report-request');
setSetting('n8n_wh_settings',      base + '/webhook/settings-updated');
```

---

## 9. n8n Setup Guide

### Step 1 — Install n8n
```bash
npm install -g n8n
n8n start
# Access at: http://localhost:5678
```

### Step 2 — Set Environment Variables

Create `~/.n8n/.env`:
```bash
N8N_USER_FOLDER=~/.n8n
WEBHOOK_URL=http://localhost:5678
# Add all variables from Section 7
```
Restart n8n after editing.

### Step 3 — Create Credentials

In n8n UI → Credentials → Add New:

| Credential Name | Type | Fields |
|----------------|------|--------|
| BillFlow SMTP | SMTP | host, port, user, pass |
| Supabase API | HTTP Header Auth | key=`apikey`, value=service_role_key |
| WATI API | HTTP Header Auth | key=`Authorization`, value=`Bearer {token}` |
| MSG91 API | HTTP Header Auth | key=`authkey`, value=auth_key |

### Step 4 — Import Workflows

For each workflow file in `n8n-workflows/`:
1. n8n UI → Workflows → Import from File
2. Open the JSON file
3. Update credentials in each HTTP Request node
4. Toggle the workflow to ACTIVE

### Step 5 — Test Each Workflow

```
WF-01: Create a test bill in the app → Check Supabase bills table for the new row
WF-02: Click "Send Bill" → Check customer email inbox
WF-03: Mark a bill paid → Check customer email for receipt
WF-10: Manually trigger in n8n → Check owner email for daily summary
WF-11: Set a bill due_date 7 days away in Supabase → Trigger WF-11 manually → Check email
WF-14: Set a bill due_date = yesterday in Supabase → Trigger WF-14 → Check status update
WF-18: Manually trigger → Check owner email for GST report
```

### Step 6 — WATI WhatsApp Setup

1. Sign up at wati.io → verify your business WhatsApp number
2. Go to WATI Dashboard → Message Templates → Create each template from Section 6
3. Wait for Meta approval (typically 24–48 hours)
4. Copy your API URL and token to n8n environment variables
5. Test: WATI Dashboard → Contacts → Send test message

### Step 7 — MSG91 SMS Setup

1. Sign up at msg91.com
2. Complete KYC (PAN + business documents)
3. Register on DLT portal (trai.gov.in)
4. Register your Sender ID (BILLFW) on DLT
5. Register each SMS template from Section 6 on DLT
6. Add DLT template IDs to n8n environment variables
7. Test: MSG91 Dashboard → Campaign → Test SMS

---

## 10. Updated CLAUDE.md Patch

Add this block to `CLAUDE.md` under the CURRENT PROJECT STATE section:

```markdown
## N8N ARCHITECTURE (Maximum Mode)

The app does NOT call Supabase directly (except for auth login/logout).
ALL Supabase sync goes through n8n webhooks.
ALL emails, WhatsApp, SMS go through n8n.

WEBHOOK PATHS (all POST to n8n_base_url + path):
  /webhook/bill-created      → on every new bill save
  /webhook/bill-send         → on "Save & Send" click
  /webhook/bill-paid         → on "Mark as Paid" click
  /webhook/bill-cancelled    → on "Cancel Bill" click
  /webhook/customer-saved    → on create/edit customer
  /webhook/item-saved        → on create/edit/delete catalog item
  /webhook/sync-push         → on app startup (flush offline queue)
  /webhook/report-request    → on "Email Report" button
  /webhook/settings-updated  → on business profile save

SCHEDULED WORKFLOWS IN N8N:
  WF-10: Daily summary        8:00 AM every day
  WF-11: 7-day reminder       9:00 AM every day
  WF-12: 3-day reminder       9:00 AM every day
  WF-13: 1-day reminder       9:00 AM every day
  WF-14: Overdue day-1        10:00 AM every day
  WF-15: Overdue day-7        10:00 AM every day
  WF-16: Overdue day-30       10:00 AM every day
  WF-17: Weekly overdue       9:00 AM Monday
  WF-18: Monthly GST          9:00 AM 1st of month
  WF-19: Quarterly reminder   9:00 AM 15th of Mar/Jun/Sep/Dec
  WF-20: Weekly revenue       9:00 AM Monday
  WF-21: Periodic sync        Every 15 minutes

COMMUNICATION CHANNELS:
  Email:     SMTP (Gmail or SendGrid) — configured in n8n SMTP credential
  WhatsApp:  WATI API — templates must be pre-approved by Meta
  SMS:       MSG91 — templates must be DLT-registered (India requirement)

n8n TASK CARD ROUTING:
  All n8n HTTP Request node configs → [REASON → Gemma 4:4B]
  n8n Function node JS code → [CODE → Qwen Coder 2.5 4B]
  Email template HTML → [HTML → Qwen Coder 2.5 4B]
```

---

## WORKFLOW SUMMARY TABLE

| ID | Name | Trigger | Channels | Supabase |
|----|------|---------|---------|---------|
| WF-01 | Bill Created | App webhook | — | ✅ Upsert bill, items, tax |
| WF-02 | Bill Sent | App webhook | Email + WA + SMS | ✅ Update status |
| WF-03 | Bill Paid | App webhook | Email + WA | ✅ Update payment |
| WF-04 | Bill Cancelled | App webhook | Email + WA | ✅ Update status |
| WF-05 | Customer Saved | App webhook | Email (welcome) | ✅ Upsert customer |
| WF-06 | Item Saved | App webhook | — | ✅ Upsert item |
| WF-07 | Full Sync Push | App webhook | — | ✅ Bulk upsert |
| WF-08 | Report Request | App webhook | Email | — |
| WF-09 | Settings Updated | App webhook | — | ✅ Update profile |
| WF-10 | Daily Summary | 8 AM daily | Email + WA (owner) | Read |
| WF-11 | 7-Day Reminder | 9 AM daily | Email + WA | Read |
| WF-12 | 3-Day Reminder | 9 AM daily | Email + WA + SMS | Read |
| WF-13 | 1-Day Reminder | 9 AM daily | Email + WA + SMS | Read |
| WF-14 | Overdue Day-1 | 10 AM daily | Email + WA + SMS | ✅ Update status |
| WF-15 | Overdue Day-7 | 10 AM daily | Email + WA | Read + Log |
| WF-16 | Overdue Day-30 | 10 AM daily | Email + WA + SMS | ✅ Flag escalation |
| WF-17 | Weekly Overdue | Monday 9 AM | Email + WA (owner) | Read |
| WF-18 | Monthly GST | 1st of month | Email (owner + accountant) | Read |
| WF-19 | Quarterly Reminder | Mar/Jun/Sep/Dec 15th | Email + WA (owner) | — |
| WF-20 | Weekly Revenue | Monday 9 AM | Email (owner) | Read |
| WF-21 | Periodic Sync | Every 15 min | — | ✅ Sync fallback |
| WF-22 | Comm Log Writer | Sub-workflow | — | ✅ Log all messages |

*Total: 22 workflows · 3 channels · Full automation from bill creation to escalation*
