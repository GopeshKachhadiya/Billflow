# BillFlow n8n Trigger & Configuration Guide

This guide details how to verify and test the 8 primary n8n webhook nodes used by the **BillFlow** desktop client. It includes their mock trigger structures, exact purposes, and the API configuration environment variables required to run them.

---

## 1. Webhook Testing Status (Offline Validation)

To check the connectivity of the n8n webhook endpoints without launching the desktop client, a testing script has been pre-configured:
*   **Path**: `C:\Users\ASUS\.gemini\antigravity-ide\brain\deedc9a2-9537-47e5-a94a-ff688b8731cd/scratch/trigger-n8n-webhooks.js`

### Running the Validation Script
You can trigger all webhook checkpoints sequentially to test your n8n instance's availability:
```bash
node C:\Users\ASUS\.gemini\antigravity-ide\brain\deedc9a2-9537-47e5-a94a-ff688b8731cd/scratch/trigger-n8n-webhooks.js all
```

*   **Current Result (Offline)**: All 8 checkpoints will return `❌ Connection failed` if n8n is not running locally on port `5678`.
*   **Success Result (Online)**: Returns HTTP `[200]` once the unified workflow canvas is imported and active inside n8n.

---

## 2. Webhook Nodes Breakdown & Purpose

The desktop app fires HTTP webhooks for these 8 events. Here is what they are used for and the payloads they require:

### 1. `billCreated` (`/webhook/bill-created`)
*   **Purpose**: Syncs newly created invoices (draft or sent) from the local SQLite database to Supabase.
*   **Payload Required**:
    ```json
    {
      "event": "bill_created",
      "bill": { "id": "bill_uuid", "bill_number": "INV-2026-001", "grand_total": 1180.00, "status": "draft" },
      "customer": { "id": "cust_uuid", "name": "Client Name", "email": "client@example.com" },
      "items": [{ "description": "Consulting Services", "quantity": 1, "unit_price": 1000.00, "gst_rate": 18, "line_total": 1180.00 }],
      "business": { "name": "My Business", "owner_email": "owner@mybusiness.com" }
    }
    ```

### 2. `billSent` (`/webhook/bill-send`)
*   **Purpose**: Dispatches the generated PDF invoice attachment to the customer via configured channels (Email, WhatsApp, or SMS).
*   **Payload Required**:
    ```json
    {
      "event": "bill_send",
      "bill": { "id": "bill_uuid", "bill_number": "INV-2026-001", "status": "sent" },
      "customer": { "name": "Client Name", "email": "client@example.com", "phone": "919876543210" },
      "pdf_base64": "SGVsbG8gV29ybGQ=", // Base64 representation of generated PDF Kit file
      "send_channels": ["email", "whatsapp"],
      "business": { "name": "My Business", "owner_email": "owner@mybusiness.com" }
    }
    ```

### 3. `billPaid` (`/webhook/bill-paid`)
*   **Purpose**: Updates the invoice payment status in the cloud and sends a payment receipt to the customer while notifying the SaaS owner.
*   **Payload Required**:
    ```json
    {
      "event": "bill_paid",
      "bill": { "id": "bill_uuid", "status": "paid", "amount_paid": 1180.00 },
      "customer": { "name": "Client Name", "email": "client@example.com" },
      "business": { "name": "My Business", "owner_email": "owner@mybusiness.com" },
      "payment": { "amount": 1180.00, "payment_method": "upi", "payment_reference": "UPI9876543210" }
    }
    ```

### 4. `billCancelled` (`/webhook/bill-cancelled`)
*   **Purpose**: Handles cancellations. If the bill was already sent, it sends a cancellation notification to the client and marks the status as cancelled in the database.
*   **Payload Required**:
    ```json
    {
      "event": "bill_cancelled",
      "bill": { "id": "bill_uuid", "status": "cancelled" },
      "customer": { "name": "Client Name", "email": "client@example.com" },
      "business": { "name": "My Business" },
      "was_sent": true
    }
    ```

### 5. `customerSaved` (`/webhook/customer-saved`)
*   **Purpose**: Syncs customer creation or modification updates to Supabase, and optionally fires a welcome message to newly onboarded clients.
*   **Payload Required**:
    ```json
    {
      "event": "customer_saved",
      "operation": "INSERT", // "INSERT" or "UPDATE"
      "customer": { "id": "cust_uuid", "name": "Client Name", "email": "client@example.com" },
      "business": { "name": "My Business", "owner_email": "owner@mybusiness.com" }
    }
    ```

### 6. `itemSaved` (`/webhook/item-saved`)
*   **Purpose**: Synchronizes the items/inventory catalog between the local client database and the cloud database.
*   **Payload Required**:
    ```json
    {
      "event": "item_saved",
      "operation": "INSERT",
      "item": { "id": "item_uuid", "name": "Product Name", "gst_rate": 18 },
      "owner_id": "owner_uuid"
    }
    ```

### 7. `reportRequest` (`/webhook/report-request`)
*   **Purpose**: Generates periodic reports (e.g. GSTR-1 formats, sales summaries, aging analysis) and emails them to the owner, with an optional CC to the accountant.
*   **Payload Required**:
    ```json
    {
      "report_type": "gst", // "gst" | "revenue" | "aging"
      "period": "2026-06",
      "email_to": "owner@mybusiness.com",
      "cc_to": "accountant@ca-firm.com"
    }
    ```

### 8. `settingsUpdated` (`/webhook/settings-updated`)
*   **Purpose**: Syncs business profile changes (company name, address, verified GSTIN) to the profile metadata on Supabase.
*   **Payload Required**:
    ```json
    {
      "business_name": "My Updated Company Ltd",
      "gstin": "27AABCU9603R1ZX",
      "business_state_code": "27"
    }
    ```

---

## 3. Required API Environment Variables in n8n

Ensure these variables are configured in n8n (**Settings → Variables**) before running tests:

| Variable Key | Required For | Description |
| :--- | :--- | :--- |
| **`SUPABASE_URL`** | Supabase database | Your Supabase project URL (e.g. `https://xxx.supabase.co`). |
| **`SUPABASE_SERVICE_KEY`** | Supabase authentication | The `service_role` private key used to bypass RLS policies. |
| **`EMAIL_FROM_ADDRESS`** | SMTP / Send email | The sender email address (e.g. `billing@company.com`). |
| **`EMAIL_FROM_NAME`** | SMTP / Send email | The display sender name (e.g. `BillFlow Billing`). |
| **`ACCOUNTANT_EMAIL`** | Accountant reporting | Default email of your Accountant/CA (for tax returns summaries). |
| **`OWNER_EMAIL`** | SaaS/Owner alerts | Owner's email address for receiving summaries and error logs. |
| **`WATI_API_URL`** | WhatsApp messages | WATI API endpoint (e.g. `https://live-server-xxx.wati.io`). |
| **`WATI_AUTH_TOKEN`** | WhatsApp authorization | Bearer token generated on the WATI credentials page. |
| **`BUSINESS_PHONE_WA`** | WhatsApp communications | Verified WhatsApp Business telephone number. |
| **`MSG91_AUTH_KEY`** | SMS notifications | MSG91 auth key for transactional Indian SMS. |
| **`MSG91_SENDER_ID`** | SMS notifications | Registered 6-character sender ID from the DLT system. |

---

## 4. SMTP Node Credentials setup in n8n

Configure a single SMTP credential key to process emails from your workflows:
1. Go to **Credentials → New** inside n8n.
2. Select **SMTP** and name the credential exactly: **`SMTP BillFlow`**.
3. Configure the details:
   *   **Host**: `smtp.gmail.com` (if using Google Mail).
   *   **Port**: `587`.
   *   **SSL/TLS**: Disabled (STARTTLS enabled).
   *   **User**: Your full email address.
   *   **Password**: Google App Password (not your personal account password).
