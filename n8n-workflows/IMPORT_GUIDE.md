# BillFlow n8n Workflows — Import Guide

## ✅ All 22 Workflows Consolidated Into One Single Canvas
To make it as easy as possible to import, manage, and run all 22 automation tracks, we have combined them into **one single, unified workflow canvas** named **"BillFlow Core Automation"**. 

You do not need to import 22 separate files or manage multiple toggles. Everything lives on a single canvas, beautifully aligned, and can be activated with a single click.

All files are in `e:\automation\n8n-workflows\`

---

## 🚀 How to Import into n8n

### Option A — Import via n8n Editor UI (easiest)
1. Open n8n in your browser (typically `http://localhost:5678`).
2. Click the **"+" (Add Workflow)** button in the top navigation or sidebar to open a new empty canvas.
3. Click the three dots (⋮) in the top-right corner of the canvas.
4. Select **Import from File**.
5. Choose the file: `e:\automation\n8n-workflows\BILLFLOW_ALL_22_WORKFLOWS.json`.
6. Click **Import** — all 176 nodes and parallel automation tracks will load onto the canvas instantly!

### Option B — Import via CLI
If you prefer using the command line, run this command in your terminal (from the `e:\automation` directory):
```bash
n8n import:workflow --input=e:\automation\n8n-workflows\BILLFLOW_ALL_22_WORKFLOWS.json
```

---

## 🔧 After Import: Set Environment Variables

Go to **n8n Settings → Variables** and add these:

```
SUPABASE_URL         = https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_KEY = eyJ...  (from Supabase → API → service_role key)

EMAIL_FROM_ADDRESS   = youremail@gmail.com
EMAIL_FROM_NAME      = Your Business Name
ACCOUNTANT_EMAIL     = accountant@ca.com

WATI_API_URL         = https://live-server-XXXXX.wati.io
WATI_AUTH_TOKEN      = eyJ...  (from WATI dashboard)

MSG91_AUTH_KEY       = XXXXXXXXXXXXXX
MSG91_SENDER_ID      = BILLFW   (6-char DLT sender ID)

OWNER_EMAIL          = owner@mybusiness.com
OWNER_PHONE          = 919876543210  (country code + no.)

NOTIFY_DAILY_SUMMARY   = true
NOTIFY_WEEKLY_REPORT   = true
NOTIFY_MONTHLY_GST     = true
NOTIFY_OWNER_WHATSAPP  = false
```

---

## 📧 Set Up SMTP Credential in n8n

1. Go to **Credentials** → **New**
2. Choose **SMTP**
3. Name it exactly: `SMTP BillFlow`
4. Fill in Gmail settings:
   - Host: `smtp.gmail.com`
   - Port: `587`
   - Security: `STARTTLS`
   - User: your Gmail
   - Pass: Gmail App Password (not account password)

---

## 📋 Workflow Summary

| # | File | Trigger | Purpose |
|---|------|---------|---------|
| WF-01 | WF-01_bill_created.json | POST /webhook/bill-created | Supabase sync on bill create |
| WF-02 | WF-02_bill_send.json | POST /webhook/bill-send | Email + WA + SMS to customer |
| WF-03 | WF-03_bill_paid.json | POST /webhook/bill-paid | Payment receipt + owner notify |
| WF-04 | WF-04_bill_cancelled.json | POST /webhook/bill-cancelled | Cancellation notice |
| WF-05 | WF-05_customer_saved.json | POST /webhook/customer-saved | Supabase sync + welcome email |
| WF-06 | WF-06_item_saved.json | POST /webhook/item-saved | Item catalog sync |
| WF-07 | WF-07_sync_push.json | POST /webhook/sync-push | Batch data sync |
| WF-08 | WF-08_report_request.json | POST /webhook/report-request | On-demand reports |
| WF-09 | WF-09_settings_updated.json | POST /webhook/settings-updated | Profile sync |
| WF-10 | WF-10_daily_summary.json | CRON 0 8 * * * | Daily summary @ 8 AM |
| WF-11 | WF-11_reminder_7day.json | CRON 0 9 1 * * | 7-day payment reminder (Monthly) |
| WF-12 | WF-12_reminder_3day.json | CRON 0 9 1 * * | 3-day reminder + SMS (Monthly) |
| WF-13 | WF-13_reminder_1day.json | CRON 0 9 1 * * | Final notice + owner alert (Monthly) |
| WF-14 | WF-14_overdue_day1.json | CRON 0 10 1 * * | Detect new overdue bills (Monthly) |
| WF-15 | WF-15_overdue_day7.json | CRON 0 10 1 * * | 7-day overdue follow-up (Monthly) |
| WF-16 | WF-16_overdue_day30.json | CRON 0 10 1 * * | 30-day escalation (Monthly) |
| WF-17 | WF-17_weekly_overdue_report.json | CRON 0 9 * * 1 | Weekly ageing report |
| WF-18 | WF-18_monthly_gst_report.json | CRON 0 9 1 * * | Monthly GST + CC accountant |
| WF-19 | WF-19_quarterly_gst_reminder.json | CRON 0 9 15 3,6,9,12 * | Filing reminder |
| WF-20 | WF-20_weekly_revenue_report.json | CRON 0 9 * * 1 | Weekly revenue summary |
| WF-21 | WF-21_periodic_sync.json | CRON */15 * * * * | 15-min fallback sync |
| WF-22 | WF-22_comm_log_writer.json | Sub-workflow | Log all sent comms |

---

## 🔗 App Webhook URLs (after n8n import)

Your app calls these URLs (configured as `n8n_base_url` in BillFlow settings):

```
POST http://localhost:5678/webhook/bill-created
POST http://localhost:5678/webhook/bill-send
POST http://localhost:5678/webhook/bill-paid
POST http://localhost:5678/webhook/bill-cancelled
POST http://localhost:5678/webhook/customer-saved
POST http://localhost:5678/webhook/item-saved
POST http://localhost:5678/webhook/sync-push
POST http://localhost:5678/webhook/report-request
POST http://localhost:5678/webhook/settings-updated
```

---

## ✅ Activate All Workflows

After import + env vars + SMTP cred:
1. Open each workflow
2. Toggle the **Active** switch ON
3. Webhook workflows become live immediately
4. Scheduled workflows start at their next scheduled time
