# BillFlow — Admin & Manager Panel
## Complete Specification · SaaS Owner Dashboard

> **What this is:** A separate web application you (the BillFlow product owner) use
> to manage every business that has purchased BillFlow. Monitor trials, billing,
> revenue, add new customers, and configure their accounts — all from one panel.
>
> **Who uses it:** Only you (the admin/owner). Your customers never see this.
>
> **Separate from the desktop app:** The admin panel is a web app hosted online.
> The BillFlow desktop app is what your customers use on their Windows machines.
        
---

## TABLE OF CONTENTS

```
1.  Architecture Overview
2.  Tech Stack
3.  Supabase Admin Schema (new tables)
4.  Admin Panel Features — Full List
5.  Dashboard Page
6.  Users Management Page
7.  User Detail Page
8.  Add / Onboard New User Page
9.  Billing & Subscription Management
10. Trial Management
11. Revenue Analytics Page
12. Configuration & Settings Page
13. Activity Logs
14. n8n Admin Workflows (7 new workflows)
15. Complete Source Code — All Files
16. Supabase Admin SQL (copy-paste ready)
17. Deployment Guide (Vercel/Netlify — free)
18. Environment Variables Reference
```

---

## 1. ARCHITECTURE OVERVIEW

```
╔══════════════════════════════════════════════════════════════════╗
║              YOU (BILLFLOW PRODUCT OWNER)                        ║
║                                                                  ║
║  ┌──────────────────────────────────────────────────────────┐   ║
║  │           BillFlow Admin Panel (Web App)                  │   ║
║  │           admin.billflow.yourdomain.com                   │   ║
║  │                                                           │   ║
║  │  Dashboard · Users · Billing · Trials · Analytics        │   ║
║  │  Add User · Configure User · Logs · Revenue              │   ║
║  └──────────────────────┬────────────────────────────────────┘  ║
╚═════════════════════════╪════════════════════════════════════════╝
                          │ HTTPS
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
  ┌──────────────┐ ┌────────────┐ ┌────────────────┐
  │  Supabase    │ │    n8n     │ │  Email / WA    │
  │              │ │            │ │  (Alerts to    │
  │  admin_*     │ │  Admin     │ │   you when     │
  │  tables      │ │  Workflows │ │   trials end,  │
  │              │ │  AWF-01–07 │ │   payments due)│
  │  + existing  │ └────────────┘ └────────────────┘
  │  user tables │
  └──────────────┘
          │
          ▼
  ┌──────────────────────────────────────────────┐
  │       YOUR CUSTOMERS (BillFlow Users)        │
  │  Each has their own Supabase project         │
  │  Each runs BillFlow desktop app              │
  │  You manage their accounts from admin panel  │
  └──────────────────────────────────────────────┘
```

### Key Architecture Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Admin panel type | Web app (browser) | Admin uses modern machine, no XP needed |
| Frontend | React (JSX) + Tailwind | Rich UI, fast to build |
| Hosting | Vercel (free tier) | Deploy in minutes, HTTPS automatic |
| Admin database | New `admin_*` tables in your Supabase | Single Supabase project for admin data |
| Auth | Supabase Auth (email + password) | Only you can log in — 1 admin account |
| Customer data | Separate Supabase project per customer | Each customer's data is isolated |
| Automation | Existing n8n + 7 new admin workflows | Consistent with main project |
| Payments | Manual (Phase 1) → Razorpay (Phase 2) | Start simple, add gateway later |

---

## 2. TECH STACK

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS v3 |
| Charts | Recharts |
| Tables | TanStack Table v8 |
| Icons | Lucide React |
| HTTP client | Supabase JS SDK v2 |
| Auth | Supabase Auth |
| Database | Supabase PostgreSQL (admin tables) |
| Hosting | Vercel (free) |
| Automation | n8n (existing instance) |
| Email | SMTP via n8n |
| WhatsApp | WATI via n8n |

---

## 3. SUPABASE ADMIN SCHEMA

Run all SQL below in your Supabase SQL Editor.
**File:** `supabase/admin-migrations/001_admin_tables.sql`

```sql
-- ═══════════════════════════════════════════════════
-- ADMIN USERS TABLE
-- One row per BillFlow customer (your paying customers)
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.admin_users (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  full_name             TEXT NOT NULL,
  business_name         TEXT NOT NULL,
  email                 TEXT NOT NULL UNIQUE,
  phone                 TEXT DEFAULT '',
  gstin                 TEXT DEFAULT '',
  city                  TEXT DEFAULT '',
  state                 TEXT DEFAULT '',

  -- Account status
  status                TEXT NOT NULL DEFAULT 'trial'
                          CHECK(status IN ('trial','active','suspended','cancelled','expired')),
  plan                  TEXT NOT NULL DEFAULT 'standard'
                          CHECK(plan IN ('standard')),

  -- Trial info
  trial_start_date      DATE,
  trial_end_date        DATE,
  trial_days            INTEGER DEFAULT 14,
  converted_from_trial  BOOLEAN DEFAULT FALSE,

  -- Billing
  billing_cycle         TEXT DEFAULT 'monthly'
                          CHECK(billing_cycle IN ('monthly','half_yearly','yearly')),
  plan_price            NUMERIC(10,2) DEFAULT 0,
  next_billing_date     DATE,
  last_payment_date     DATE,
  last_payment_amount   NUMERIC(10,2) DEFAULT 0,
  total_paid            NUMERIC(12,2) DEFAULT 0,
  payment_method        TEXT DEFAULT 'bank_transfer'
                          CHECK(payment_method IN ('bank_transfer','upi','cheque','cash','razorpay','other')),

  -- Their BillFlow config (what you set up for them)
  their_supabase_url    TEXT DEFAULT '',
  their_supabase_key    TEXT DEFAULT '',
  their_n8n_url         TEXT DEFAULT '',
  their_n8n_secret      TEXT DEFAULT '',
  license_key           TEXT UNIQUE DEFAULT NULL,
  app_version           TEXT DEFAULT '1.0.0',

  -- Internal admin notes
  notes                 TEXT DEFAULT '',
  referral_source       TEXT DEFAULT '',
  assigned_to           TEXT DEFAULT '',    -- admin staff name if team

  -- Timestamps
  onboarded_at          TIMESTAMPTZ DEFAULT NOW(),
  activated_at          TIMESTAMPTZ,
  suspended_at          TIMESTAMPTZ,
  cancelled_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_users_status ON public.admin_users(status);
CREATE INDEX IF NOT EXISTS idx_admin_users_email  ON public.admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_plan   ON public.admin_users(plan);
CREATE INDEX IF NOT EXISTS idx_admin_users_next_billing ON public.admin_users(next_billing_date);
CREATE INDEX IF NOT EXISTS idx_admin_users_trial_end    ON public.admin_users(trial_end_date);

-- ═══════════════════════════════════════════════════
-- PAYMENT HISTORY
-- Every payment ever received from every customer
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.admin_payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.admin_users(id) ON DELETE CASCADE,

  amount          NUMERIC(10,2) NOT NULL,
  currency        TEXT DEFAULT 'INR',
  payment_date    DATE NOT NULL,
  payment_method  TEXT DEFAULT 'bank_transfer',
  reference       TEXT DEFAULT '',       -- UTR number / cheque number / UPI ref
  period_from     DATE,
  period_to       DATE,
  plan            TEXT,
  status          TEXT DEFAULT 'received'
                    CHECK(status IN ('received','pending','failed','refunded')),
  invoice_number  TEXT DEFAULT '',
  notes           TEXT DEFAULT '',

  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_user    ON public.admin_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_date    ON public.admin_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_status  ON public.admin_payments(status);

-- ═══════════════════════════════════════════════════
-- ACTIVITY LOG
-- Everything that happens to a user account
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.admin_activity_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES public.admin_users(id) ON DELETE CASCADE,
  action      TEXT NOT NULL,
  description TEXT DEFAULT '',
  metadata    JSONB DEFAULT '{}',
  performed_by TEXT DEFAULT 'system',   -- 'system', 'admin', or admin staff name
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_actlog_user    ON public.admin_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_actlog_created ON public.admin_activity_log(created_at DESC);

-- ═══════════════════════════════════════════════════
-- SUPPORT NOTES
-- Internal notes about a customer
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.admin_support_notes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.admin_users(id) ON DELETE CASCADE,
  note        TEXT NOT NULL,
  category    TEXT DEFAULT 'general'
                CHECK(category IN ('general','billing','technical','sales','complaint')),
  created_by  TEXT DEFAULT 'admin',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notes_user ON public.admin_support_notes(user_id);

-- ═══════════════════════════════════════════════════
-- PLAN CONFIGURATIONS
-- Defines what each plan includes
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.admin_plans (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL UNIQUE,
  display_name        TEXT NOT NULL,
  monthly_price       NUMERIC(10,2) NOT NULL DEFAULT 0,
  half_yearly_price   NUMERIC(10,2) DEFAULT 0,
  yearly_price        NUMERIC(10,2) DEFAULT 0,
  max_bills_per_month INTEGER DEFAULT 999999,
  max_customers       INTEGER DEFAULT 999999,
  whatsapp_enabled    BOOLEAN DEFAULT TRUE,
  sms_enabled         BOOLEAN DEFAULT TRUE,
  multi_user          BOOLEAN DEFAULT TRUE,
  priority_support    BOOLEAN DEFAULT TRUE,
  is_active           BOOLEAN DEFAULT TRUE,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default plans
INSERT INTO public.admin_plans
  (name, display_name, monthly_price, half_yearly_price, yearly_price,
   max_bills_per_month, max_customers, whatsapp_enabled, sms_enabled, multi_user, priority_support)
VALUES
  ('standard', 'Standard', 1000.00, 5500.00, 10000.00, 999999, 999999, TRUE, TRUE, TRUE, TRUE)
ON CONFLICT(name) DO NOTHING;

-- ═══════════════════════════════════════════════════
-- AUTO-UPDATE TIMESTAMPS
-- ═══════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION update_admin_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_admin_users_upd
  BEFORE UPDATE ON public.admin_users
  FOR EACH ROW EXECUTE FUNCTION update_admin_updated_at();

-- ═══════════════════════════════════════════════════
-- RLS — only the admin Supabase account can access
-- ═══════════════════════════════════════════════════
ALTER TABLE public.admin_users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_payments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_log  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_support_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_plans         ENABLE ROW LEVEL SECURITY;

-- Admin-only: only your personal Supabase account can read/write
-- Replace 'YOUR_ADMIN_UUID' with your auth.users id after first login
-- For now: use service_role key in the admin panel (bypasses RLS entirely)
-- The admin panel is not public — it's your private tool

-- Grant full access via service_role (used by admin panel — never expose to customers)
-- No additional RLS policies needed when using service_role key
```

---

## 4. ADMIN PANEL FEATURES — FULL LIST

### Dashboard (Home)
- KPI cards: Total Users · Active · On Trial · Suspended · Churned
- Revenue cards: MRR · ARR · Total Revenue All-Time · Revenue This Month
- Charts: Monthly revenue bar chart (12 months) · User growth line chart
- Alerts panel: Trials expiring in 7 days · Payments overdue · Suspended users
- Recent activity feed

### Users Management
- Full paginated table of all customers
- Columns: Name · Business · Plan · Status · Trial End · Next Billing · Last Payment · Total Paid · Actions
- Filter by: status, plan, billing cycle, state
- Search by: name, email, business name, phone, GSTIN
- Sort by any column
- Export as CSV
- Bulk actions: Send email · Change plan · Extend trial

### User Detail Page (per customer)
- Full profile: name, business, contact, GSTIN, city/state
- Account timeline: Onboarded → Trial → Active → (Suspended/Cancelled)
- Billing section: plan, cycle, price, next billing date
- Payment history table (all payments with UTR, date, amount, status)
- Add payment manually
- Configuration section: their Supabase URL/key, n8n URL, license key
- Support notes (internal only)
- Activity log for this user
- Quick actions: Extend trial · Change plan · Suspend · Reactivate · Delete

### Add New User
- Step 1: Personal & business info
- Step 2: Plan selection with price breakdown
- Step 3: Trial or immediate activation
- Step 4: Auto-generate license key
- Step 5: Send welcome email (via n8n)
- Step 6: (Optional) Setup their Supabase config

### Billing & Subscription
- All upcoming payments (next 30/60/90 days)
- Payment collection form (record manual payment)
- Generate invoice/receipt PDF
- Outstanding balance per customer
- Revenue breakdown by plan

### Revenue Analytics
- MRR (Monthly Recurring Revenue)
- ARR (Annual Recurring Revenue)
- ARPU (Average Revenue Per User)
- Churn rate (monthly)
- Trial-to-paid conversion rate
- Revenue by plan
- Revenue by state
- New vs renewal revenue

### Trial Management
- All trial users in one view
- Days remaining per trial
- Trial conversion funnel
- One-click extend trial
- Batch send trial-ending reminders

### Activity Logs
- All admin actions (who added what, when)
- System events (trial expired, payment recorded)
- Filter by user, date range, action type

---

## 5. PROJECT FILE STRUCTURE

```
billflow-admin/
│
├── package.json
├── vite.config.js
├── index.html
├── .env                          ← your secrets (never commit)
├── .env.example
│
├── src/
│   ├── main.jsx                  ← React entry point
│   ├── App.jsx                   ← Router + layout
│   │
│   ├── lib/
│   │   ├── supabase.js           ← Supabase client
│   │   └── utils.js              ← formatCurrency, formatDate, generateLicenseKey
│   │
│   ├── hooks/
│   │   ├── useUsers.js           ← fetch/mutate users
│   │   ├── usePayments.js        ← payment history
│   │   ├── useStats.js           ← dashboard KPIs
│   │   └── useActivityLog.js     ← activity feed
│   │
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Users.jsx
│   │   ├── UserDetail.jsx
│   │   ├── AddUser.jsx
│   │   ├── Billing.jsx
│   │   ├── Analytics.jsx
│   │   ├── Trials.jsx
│   │   └── ActivityLogs.jsx
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Topbar.jsx
│   │   │   └── AppLayout.jsx
│   │   ├── ui/
│   │   │   ├── KPICard.jsx
│   │   │   ├── StatusBadge.jsx
│   │   │   ├── DataTable.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Toast.jsx
│   │   │   └── ConfirmDialog.jsx
│   │   ├── users/
│   │   │   ├── UserTable.jsx
│   │   │   ├── UserFilters.jsx
│   │   │   ├── UserCard.jsx
│   │   │   └── AddUserForm.jsx
│   │   ├── billing/
│   │   │   ├── PaymentHistory.jsx
│   │   │   ├── AddPaymentModal.jsx
│   │   │   └── BillingCalendar.jsx
│   │   └── charts/
│   │       ├── RevenueChart.jsx
│   │       ├── UserGrowthChart.jsx
│   │       └── PlanBreakdownChart.jsx
│   │
│   └── styles/
│       └── index.css             ← Tailwind base + custom
│
└── supabase/
    └── admin-migrations/
        └── 001_admin_tables.sql  ← from Section 3
```

---

## 6. COMPLETE SOURCE CODE

---

### package.json

```json
{
  "name": "billflow-admin",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev":   "vite",
    "build": "vite build",
    "preview":"vite preview"
  },
  "dependencies": {
    "react":              "^18.2.0",
    "react-dom":          "^18.2.0",
    "react-router-dom":   "^6.22.0",
    "@supabase/supabase-js": "^2.39.0",
    "recharts":           "^2.12.0",
    "lucide-react":       "^0.383.0",
    "@tanstack/react-table": "^8.17.0",
    "date-fns":           "^3.6.0",
    "clsx":               "^2.1.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.0",
    "vite":                "^5.2.0",
    "tailwindcss":         "^3.4.0",
    "autoprefixer":        "^10.4.0",
    "postcss":             "^8.4.0"
  }
}
```

---

### src/lib/supabase.js

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl    = import.meta.env.VITE_SUPABASE_URL
const supabaseKey    = import.meta.env.VITE_SUPABASE_SERVICE_KEY  // service_role key — admin only

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: true, persistSession: true }
})
```

---

### src/lib/utils.js

```javascript
import { format, formatDistanceToNow, differenceInDays } from 'date-fns'

export const formatCurrency = (amount) => {
  if (amount == null) return '₹0'
  return '₹' + Number(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 0, maximumFractionDigits: 2
  })
}

export const formatDate = (date) => {
  if (!date) return '—'
  return format(new Date(date), 'dd MMM yyyy')
}

export const formatDatetime = (date) => {
  if (!date) return '—'
  return format(new Date(date), 'dd MMM yyyy, HH:mm')
}

export const timeAgo = (date) => {
  if (!date) return '—'
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export const daysUntil = (date) => {
  if (!date) return null
  return differenceInDays(new Date(date), new Date())
}

export const generateLicenseKey = () => {
  const segments = () => Math.random().toString(36).toUpperCase().substring(2, 7)
  return `BF-${segments()}-${segments()}-${segments()}`
}

export const getStatusColor = (status) => {
  const map = {
    trial:     'bg-blue-100 text-blue-800',
    active:    'bg-green-100 text-green-800',
    suspended: 'bg-yellow-100 text-yellow-800',
    cancelled: 'bg-red-100 text-red-800',
    expired:   'bg-gray-100 text-gray-800'
  }
  return map[status] || 'bg-gray-100 text-gray-600'
}

export const getPlanColor = (plan) => {
  const map = {
    starter:      'bg-slate-100 text-slate-700',
    professional: 'bg-indigo-100 text-indigo-800',
    enterprise:   'bg-purple-100 text-purple-800'
  }
  return map[plan] || 'bg-gray-100 text-gray-600'
}

export const callAdminWebhook = async (path, payload) => {
  const base   = import.meta.env.VITE_N8N_BASE_URL
  const secret = import.meta.env.VITE_N8N_SECRET
  if (!base) return
  try {
    await fetch(base + path, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'X-BillFlow-Secret': secret },
      body:    JSON.stringify(payload)
    })
  } catch (e) {
    console.error('Admin webhook failed:', path, e.message)
  }
}
```

---

### src/hooks/useStats.js

```javascript
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useStats() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      // Users by status
      const { data: users } = await supabase
        .from('admin_users')
        .select('id, status, plan, plan_price, billing_cycle, total_paid, trial_end_date, created_at')

      if (!users) { setLoading(false); return }

      const byStatus = users.reduce((a, u) => {
        a[u.status] = (a[u.status] || 0) + 1
        return a
      }, {})

      // MRR calculation
      const active = users.filter(u => u.status === 'active')
      const mrr = active.reduce((sum, u) => {
        const price = parseFloat(u.plan_price) || 0
        if (u.billing_cycle === 'monthly')   return sum + price
        if (u.billing_cycle === 'quarterly') return sum + price / 3
        if (u.billing_cycle === 'yearly')    return sum + price / 12
        return sum
      }, 0)

      // Revenue this month
      const monthStart = new Date()
      monthStart.setDate(1)
      monthStart.setHours(0, 0, 0, 0)

      const { data: payments } = await supabase
        .from('admin_payments')
        .select('amount, payment_date, status')
        .eq('status', 'received')

      const allPayments  = payments || []
      const monthPayments = allPayments.filter(p => new Date(p.payment_date) >= monthStart)
      const monthRevenue  = monthPayments.reduce((s, p) => s + parseFloat(p.amount), 0)
      const totalRevenue  = allPayments.reduce((s, p) => s + parseFloat(p.amount), 0)

      // Trials expiring in 7 days
      const today   = new Date().toISOString().split('T')[0]
      const in7days = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
      const expiringTrials = users.filter(u =>
        u.status === 'trial' && u.trial_end_date >= today && u.trial_end_date <= in7days
      )

      // Conversion rate
      const converted = users.filter(u => u.converted_from_trial).length
      const totalTrials = users.filter(u => u.status !== 'active' || u.converted_from_trial).length
      const conversionRate = totalTrials > 0
        ? Math.round((converted / totalTrials) * 100)
        : 0

      // Monthly revenue for chart (last 12 months)
      const monthlyRevenue = []
      for (let i = 11; i >= 0; i--) {
        const d     = new Date()
        d.setDate(1)
        d.setMonth(d.getMonth() - i)
        const label = d.toLocaleString('en-IN', { month: 'short', year: '2-digit' })
        const start = d.toISOString().split('T')[0]
        const end   = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0]
        const rev   = allPayments
          .filter(p => p.payment_date >= start && p.payment_date <= end)
          .reduce((s, p) => s + parseFloat(p.amount), 0)
        monthlyRevenue.push({ month: label, revenue: Math.round(rev) })
      }

      // User growth (last 12 months)
      const userGrowth = []
      for (let i = 11; i >= 0; i--) {
        const d     = new Date()
        d.setDate(1)
        d.setMonth(d.getMonth() - i)
        const label = d.toLocaleString('en-IN', { month: 'short', year: '2-digit' })
        const end   = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0]
        const count = users.filter(u => u.created_at.split('T')[0] <= end).length
        userGrowth.push({ month: label, users: count })
      }

      setStats({
        total:           users.length,
        active:          byStatus.active    || 0,
        trial:           byStatus.trial     || 0,
        suspended:       byStatus.suspended || 0,
        cancelled:       byStatus.cancelled || 0,
        expired:         byStatus.expired   || 0,
        mrr:             Math.round(mrr),
        arr:             Math.round(mrr * 12),
        monthRevenue:    Math.round(monthRevenue),
        totalRevenue:    Math.round(totalRevenue),
        arpu:            active.length > 0 ? Math.round(mrr / active.length) : 0,
        conversionRate,
        expiringTrials,
        monthlyRevenue,
        userGrowth
      })
      setLoading(false)
    }
    load()
  }, [])

  return { stats, loading }
}
```

---

### src/hooks/useUsers.js

```javascript
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useUsers(filter = {}) {
  const [users, setUsers]     = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal]     = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    let q = supabase
      .from('admin_users')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (filter.status && filter.status !== 'all') q = q.eq('status', filter.status)
    if (filter.plan   && filter.plan   !== 'all') q = q.eq('plan',   filter.plan)
    if (filter.search) {
      q = q.or(
        `full_name.ilike.%${filter.search}%,` +
        `business_name.ilike.%${filter.search}%,` +
        `email.ilike.%${filter.search}%,` +
        `phone.ilike.%${filter.search}%`
      )
    }
    if (filter.limit)  q = q.limit(filter.limit)
    if (filter.offset) q = q.range(filter.offset, filter.offset + (filter.limit || 50) - 1)

    const { data, count, error } = await q
    if (!error) { setUsers(data || []); setTotal(count || 0) }
    setLoading(false)
  }, [JSON.stringify(filter)])

  useEffect(() => { load() }, [load])

  return { users, loading, total, refetch: load }
}

export function useUser(id) {
  const [user, setUser]       = useState(null)
  const [payments, setPayments] = useState([])
  const [notes, setNotes]     = useState([])
  const [logs, setLogs]       = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    const [uRes, pRes, nRes, lRes] = await Promise.all([
      supabase.from('admin_users').select('*').eq('id', id).single(),
      supabase.from('admin_payments').select('*').eq('user_id', id).order('payment_date', { ascending: false }),
      supabase.from('admin_support_notes').select('*').eq('user_id', id).order('created_at', { ascending: false }),
      supabase.from('admin_activity_log').select('*').eq('user_id', id).order('created_at', { ascending: false }).limit(50)
    ])
    if (!uRes.error) setUser(uRes.data)
    if (!pRes.error) setPayments(pRes.data || [])
    if (!nRes.error) setNotes(nRes.data || [])
    if (!lRes.error) setLogs(lRes.data || [])
    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

  return { user, payments, notes, logs, loading, refetch: load }
}

export async function createUser(data) {
  const { data: u, error } = await supabase
    .from('admin_users')
    .insert([data])
    .select()
    .single()
  if (error) throw error
  await logActivity(u.id, 'user_created', `New user ${u.full_name} added to BillFlow`, 'admin')
  return u
}

export async function updateUser(id, data) {
  const { data: u, error } = await supabase
    .from('admin_users')
    .update(data)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  await logActivity(id, 'user_updated', `Account updated`, 'admin')
  return u
}

export async function addPayment(userId, payment) {
  const { data: p, error } = await supabase
    .from('admin_payments')
    .insert([{ ...payment, user_id: userId }])
    .select()
    .single()
  if (error) throw error
  // Update user's totals and next billing date
  const { data: u } = await supabase.from('admin_users').select('total_paid, billing_cycle').eq('id', userId).single()
  const newTotal    = (parseFloat(u?.total_paid) || 0) + parseFloat(payment.amount)
  const nextDate    = calcNextBillingDate(payment.payment_date, u?.billing_cycle)
  await supabase.from('admin_users').update({
    total_paid:         newTotal,
    last_payment_date:  payment.payment_date,
    last_payment_amount: payment.amount,
    next_billing_date:  nextDate
  }).eq('id', userId)
  await logActivity(userId, 'payment_received', `Payment of ₹${payment.amount} received. Ref: ${payment.reference}`, 'admin')
  return p
}

function calcNextBillingDate(fromDate, cycle) {
  const d = new Date(fromDate)
  if (cycle === 'monthly')   d.setMonth(d.getMonth() + 1)
  if (cycle === 'quarterly') d.setMonth(d.getMonth() + 3)
  if (cycle === 'yearly')    d.setFullYear(d.getFullYear() + 1)
  return d.toISOString().split('T')[0]
}

export async function logActivity(userId, action, description, performedBy = 'system') {
  await supabase.from('admin_activity_log').insert([{
    user_id: userId, action, description, performed_by: performedBy
  }])
}
```

---

### src/App.jsx

```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import AppLayout  from './components/layout/AppLayout'
import Login      from './pages/Login'
import Dashboard  from './pages/Dashboard'
import Users      from './pages/Users'
import UserDetail from './pages/UserDetail'
import AddUser    from './pages/AddUser'
import Billing    from './pages/Billing'
import Analytics  from './pages/Analytics'
import Trials     from './pages/Trials'
import ActivityLogs from './pages/ActivityLogs'

function ProtectedRoute({ session, children }) {
  if (!session) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
    </div>
  )

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={session ? <Navigate to="/" /> : <Login />} />
        <Route path="/" element={<ProtectedRoute session={session}><AppLayout /></ProtectedRoute>}>
          <Route index         element={<Dashboard />} />
          <Route path="users"  element={<Users />} />
          <Route path="users/:id" element={<UserDetail />} />
          <Route path="users/add" element={<AddUser />} />
          <Route path="billing"   element={<Billing />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="trials"    element={<Trials />} />
          <Route path="logs"      element={<ActivityLogs />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
```

---

### src/pages/Login.jsx

```jsx
import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) { setError(err.message); setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-indigo-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-600 rounded-xl mb-4">
            <span className="text-white text-2xl font-bold">B</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">BillFlow Admin</h1>
          <p className="text-gray-500 text-sm mt-1">Manager Dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="admin@yourdomain.com" required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="••••••••" required
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit" disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

---

### src/components/layout/AppLayout.jsx

```jsx
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar  from './Topbar'

export default function AppLayout() {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
```

---

### src/components/layout/Sidebar.jsx

```jsx
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, CreditCard, BarChart3,
  Clock, FileText, Settings, LogOut
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

const nav = [
  { to: '/',          icon: LayoutDashboard, label: 'Dashboard'  },
  { to: '/users',     icon: Users,           label: 'Users'       },
  { to: '/trials',    icon: Clock,           label: 'Trials'      },
  { to: '/billing',   icon: CreditCard,      label: 'Billing'     },
  { to: '/analytics', icon: BarChart3,       label: 'Analytics'   },
  { to: '/logs',      icon: FileText,        label: 'Activity Logs'},
]

export default function Sidebar() {
  return (
    <aside className="w-60 bg-indigo-900 flex flex-col text-white shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-indigo-800">
        <div className="w-8 h-8 bg-indigo-400 rounded-lg flex items-center justify-center font-bold">B</div>
        <div>
          <p className="font-bold text-sm">BillFlow Admin</p>
          <p className="text-indigo-300 text-xs">Manager Panel</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ` +
              (isActive
                ? 'bg-indigo-700 text-white'
                : 'text-indigo-200 hover:bg-indigo-800 hover:text-white')
            }
          >
            <Icon size={18} /> {label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-indigo-800">
        <button
          onClick={() => supabase.auth.signOut()}
          className="flex items-center gap-3 w-full px-3 py-2.5 text-indigo-200 hover:text-white hover:bg-indigo-800 rounded-lg text-sm font-medium transition-colors"
        >
          <LogOut size={18} /> Sign Out
        </button>
      </div>
    </aside>
  )
}
```

---

### src/components/ui/KPICard.jsx

```jsx
export default function KPICard({ title, value, subtitle, icon: Icon, color = 'indigo', trend }) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600',
    green:  'bg-green-50  text-green-600',
    blue:   'bg-blue-50   text-blue-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red:    'bg-red-50    text-red-600',
    purple: 'bg-purple-50 text-purple-600',
  }
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
          {trend != null && (
            <p className={`text-xs font-medium mt-1 ${trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last month
            </p>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl ${colors[color]}`}>
            <Icon size={20} />
          </div>
        )}
      </div>
    </div>
  )
}
```

---

### src/components/ui/StatusBadge.jsx

```jsx
import { getStatusColor, getPlanColor } from '../../lib/utils'

export function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(status)}`}>
      {status}
    </span>
  )
}

export function PlanBadge({ plan }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getPlanColor(plan)}`}>
      {plan}
    </span>
  )
}
```

---

### src/pages/Dashboard.jsx

```jsx
import { Users, TrendingUp, IndianRupee, AlertTriangle, Clock, UserCheck } from 'lucide-react'
import { useStats } from '../hooks/useStats'
import KPICard from '../components/ui/KPICard'
import { formatCurrency, formatDate, daysUntil } from '../lib/utils'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const { stats, loading } = useStats()

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
    </div>
  )
  if (!stats) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">BillFlow SaaS Overview</p>
        </div>
        <Link to="/users/add"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          + Add New User
        </Link>
      </div>

      {/* Alerts */}
      {stats.expiringTrials.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              {stats.expiringTrials.length} trial{stats.expiringTrials.length > 1 ? 's' : ''} expiring within 7 days
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              {stats.expiringTrials.map(u => u.full_name).join(', ')}
            </p>
          </div>
          <Link to="/trials" className="ml-auto text-xs text-amber-700 underline font-medium whitespace-nowrap">
            View Trials →
          </Link>
        </div>
      )}

      {/* KPI Cards — Revenue */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Revenue</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard title="MRR"           value={formatCurrency(stats.mrr)}          color="green"  icon={IndianRupee}  subtitle="Monthly Recurring Revenue" />
          <KPICard title="ARR"           value={formatCurrency(stats.arr)}          color="purple" icon={TrendingUp}   subtitle="Annual Recurring Revenue" />
          <KPICard title="This Month"    value={formatCurrency(stats.monthRevenue)} color="indigo" icon={IndianRupee}  subtitle="Payments received" />
          <KPICard title="All-Time"      value={formatCurrency(stats.totalRevenue)} color="blue"   icon={IndianRupee}  subtitle="Total revenue collected" />
        </div>
      </div>

      {/* KPI Cards — Users */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Users</h2>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <KPICard title="Total Users"   value={stats.total}           color="indigo" icon={Users}     />
          <KPICard title="Active"        value={stats.active}          color="green"  icon={UserCheck} />
          <KPICard title="On Trial"      value={stats.trial}           color="blue"   icon={Clock}     />
          <KPICard title="Suspended"     value={stats.suspended}       color="yellow" icon={AlertTriangle} />
          <KPICard title="Conversion"    value={stats.conversionRate + '%'} color="purple" icon={TrendingUp} subtitle="Trial to paid" />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Monthly Revenue (Last 12 Months)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.monthlyRevenue}>
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => '₹' + (v >= 1000 ? (v/1000).toFixed(0)+'K' : v)} />
              <Tooltip formatter={v => ['₹' + v.toLocaleString('en-IN'), 'Revenue']} />
              <Bar dataKey="revenue" fill="#6366f1" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* User Growth Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">User Growth (Last 12 Months)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={stats.userGrowth}>
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="users" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
```

---

### src/pages/Users.jsx

```jsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Filter, Download, Plus } from 'lucide-react'
import { useUsers } from '../hooks/useUsers'
import { StatusBadge, PlanBadge } from '../components/ui/StatusBadge'
import { formatCurrency, formatDate, daysUntil } from '../lib/utils'

export default function Users() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [plan,   setPlan  ] = useState('all')
  const [page,   setPage  ] = useState(0)
  const PER_PAGE = 50

  const { users, total, loading, refetch } = useUsers({
    search, status, plan, limit: PER_PAGE, offset: page * PER_PAGE
  })

  const exportCSV = () => {
    const headers = ['Name','Business','Email','Phone','Plan','Status','Trial End','Next Billing','Last Payment','Total Paid']
    const rows    = users.map(u => [
      u.full_name, u.business_name, u.email, u.phone,
      u.plan, u.status, u.trial_end_date || '',
      u.next_billing_date || '', u.last_payment_date || '',
      u.total_paid || 0
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const a   = document.createElement('a')
    a.href    = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = 'billflow-users.csv'
    a.click()
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-500 text-sm">{total} total customers</p>
        </div>
        <div className="flex gap-3">
          <button onClick={exportCSV} className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
            <Download size={15} /> Export CSV
          </button>
          <Link to="/users/add" className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
            <Plus size={15} /> Add User
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 shadow-sm">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search} onChange={e => { setSearch(e.target.value); setPage(0) }}
            placeholder="Search name, email, business, phone..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(0) }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="all">All Status</option>
          <option value="trial">Trial</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="cancelled">Cancelled</option>
          <option value="expired">Expired</option>
        </select>
        <select value={plan} onChange={e => { setPlan(e.target.value); setPage(0) }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="all">All Plans</option>
          <option value="starter">Starter</option>
          <option value="professional">Professional</option>
          <option value="enterprise">Enterprise</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {['Customer','Plan','Status','Trial End','Next Billing','Last Payment','Total Paid','Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">Loading...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">No users found</td></tr>
              ) : users.map(u => {
                const trialDays  = daysUntil(u.trial_end_date)
                const billingDue = daysUntil(u.next_billing_date)
                return (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link to={`/users/${u.id}`} className="font-medium text-gray-900 hover:text-indigo-600">
                        {u.full_name}
                      </Link>
                      <p className="text-xs text-gray-400">{u.business_name}</p>
                      <p className="text-xs text-gray-400">{u.email}</p>
                    </td>
                    <td className="px-4 py-3"><PlanBadge plan={u.plan} /></td>
                    <td className="px-4 py-3"><StatusBadge status={u.status} /></td>
                    <td className="px-4 py-3">
                      {u.trial_end_date ? (
                        <div>
                          <p className="text-gray-700">{formatDate(u.trial_end_date)}</p>
                          {u.status === 'trial' && trialDays != null && (
                            <p className={`text-xs font-medium ${trialDays <= 3 ? 'text-red-500' : trialDays <= 7 ? 'text-amber-500' : 'text-gray-400'}`}>
                              {trialDays > 0 ? `${trialDays}d left` : 'Expired'}
                            </p>
                          )}
                        </div>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {u.next_billing_date ? (
                        <div>
                          <p className="text-gray-700">{formatDate(u.next_billing_date)}</p>
                          {billingDue != null && billingDue <= 7 && (
                            <p className={`text-xs font-medium ${billingDue <= 3 ? 'text-red-500' : 'text-amber-500'}`}>
                              Due in {billingDue}d
                            </p>
                          )}
                        </div>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-700">{formatDate(u.last_payment_date)}</p>
                      {u.last_payment_amount > 0 && (
                        <p className="text-xs text-gray-400">{formatCurrency(u.last_payment_amount)}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{formatCurrency(u.total_paid)}</td>
                    <td className="px-4 py-3">
                      <Link to={`/users/${u.id}`}
                        className="text-indigo-600 hover:text-indigo-800 text-xs font-medium">
                        View →
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
          <span>Showing {Math.min(page * PER_PAGE + 1, total)}–{Math.min((page + 1) * PER_PAGE, total)} of {total}</span>
          <div className="flex gap-2">
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
              className="px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-50">← Prev</button>
            <button disabled={(page + 1) * PER_PAGE >= total} onClick={() => setPage(p => p + 1)}
              className="px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-50">Next →</button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

---

### src/pages/UserDetail.jsx

```jsx
import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit2, Plus, Trash2, Send, RefreshCw } from 'lucide-react'
import { useUser, updateUser, addPayment, logActivity } from '../hooks/useUsers'
import { StatusBadge, PlanBadge } from '../components/ui/StatusBadge'
import { formatCurrency, formatDate, formatDatetime, daysUntil, callAdminWebhook } from '../lib/utils'

export default function UserDetail() {
  const { id }       = useParams()
  const navigate     = useNavigate()
  const { user, payments, notes, logs, loading, refetch } = useUser(id)

  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showNoteModal,    setShowNoteModal   ] = useState(false)
  const [editingConfig,    setEditingConfig   ] = useState(false)
  const [paymentForm, setPaymentForm] = useState({ amount:'', payment_date:'', payment_method:'bank_transfer', reference:'', notes:'' })
  const [noteText,    setNoteText   ] = useState('')
  const [noteCategory, setNoteCategory] = useState('general')
  const [saving, setSaving] = useState(false)

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
  if (!user)   return <div className="text-center py-20 text-gray-500">User not found.</div>

  const trialDaysLeft  = daysUntil(user.trial_end_date)
  const billingDaysLeft = daysUntil(user.next_billing_date)

  const handleStatusChange = async (newStatus) => {
    if (!confirm(`Change status to "${newStatus}"?`)) return
    const updates = { status: newStatus }
    if (newStatus === 'active' && !user.activated_at) updates.activated_at = new Date().toISOString()
    if (newStatus === 'suspended') updates.suspended_at = new Date().toISOString()
    if (newStatus === 'cancelled') updates.cancelled_at = new Date().toISOString()
    await updateUser(id, updates)
    await callAdminWebhook('/webhook/admin-user-status', {
      event: 'status_changed', user_email: user.email, user_name: user.full_name,
      business_name: user.business_name, new_status: newStatus
    })
    refetch()
  }

  const handleExtendTrial = async (days) => {
    const current  = user.trial_end_date ? new Date(user.trial_end_date) : new Date()
    const newEnd   = new Date(Math.max(current, new Date()))
    newEnd.setDate(newEnd.getDate() + days)
    await updateUser(id, { trial_end_date: newEnd.toISOString().split('T')[0] })
    await logActivity(id, 'trial_extended', `Trial extended by ${days} days`, 'admin')
    refetch()
  }

  const handleAddPayment = async (e) => {
    e.preventDefault(); setSaving(true)
    await addPayment(id, paymentForm)
    await callAdminWebhook('/webhook/admin-payment-received', {
      event: 'payment_received', user_email: user.email,
      user_name: user.full_name, business_name: user.business_name,
      amount: paymentForm.amount, reference: paymentForm.reference
    })
    setShowPaymentModal(false)
    setPaymentForm({ amount:'', payment_date:'', payment_method:'bank_transfer', reference:'', notes:'' })
    setSaving(false); refetch()
  }

  const handleAddNote = async (e) => {
    e.preventDefault(); setSaving(true)
    const { supabase } = await import('../lib/supabase')
    await supabase.from('admin_support_notes').insert([{ user_id: id, note: noteText, category: noteCategory, created_by: 'admin' }])
    setShowNoteModal(false); setNoteText(''); setSaving(false); refetch()
  }

  const handleSendEmail = async (template) => {
    await callAdminWebhook('/webhook/admin-send-email', {
      template, user_email: user.email, user_name: user.full_name,
      business_name: user.business_name, plan: user.plan,
      trial_end_date: user.trial_end_date, next_billing_date: user.next_billing_date
    })
    alert('Email queued via n8n.')
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Back + Header */}
      <div className="flex items-center gap-4">
        <Link to="/users" className="text-gray-400 hover:text-gray-700"><ArrowLeft size={20} /></Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{user.full_name}</h1>
          <p className="text-gray-500 text-sm">{user.business_name} · {user.email}</p>
        </div>
        <div className="flex gap-2">
          <StatusBadge status={user.status} />
          <PlanBadge plan={user.plan} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN — Profile + Billing + Config */}
        <div className="lg:col-span-2 space-y-5">

          {/* Profile Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Profile</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                ['Full Name',      user.full_name],
                ['Business Name',  user.business_name],
                ['Email',          user.email],
                ['Phone',          user.phone || '—'],
                ['GSTIN',          user.gstin || '—'],
                ['City / State',   `${user.city || '—'}, ${user.state || '—'}`],
                ['Onboarded',      formatDate(user.onboarded_at)],
                ['Referral Source',user.referral_source || '—'],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-gray-400 text-xs">{label}</p>
                  <p className="text-gray-800 font-medium">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Billing Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700">Billing</h2>
              <button onClick={() => setShowPaymentModal(true)}
                className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-1">
                <Plus size={12} /> Record Payment
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              {[
                ['Plan',           user.plan],
                ['Billing Cycle',  user.billing_cycle],
                ['Plan Price',     formatCurrency(user.plan_price) + ' / ' + user.billing_cycle],
                ['Total Paid',     formatCurrency(user.total_paid)],
                ['Last Payment',   formatDate(user.last_payment_date) + ' — ' + formatCurrency(user.last_payment_amount)],
                ['Next Billing',   user.next_billing_date ? `${formatDate(user.next_billing_date)} (${billingDaysLeft != null ? billingDaysLeft + 'd' : '—'})` : '—'],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-gray-400 text-xs">{label}</p>
                  <p className="text-gray-800 font-medium">{value}</p>
                </div>
              ))}
            </div>

            {/* Payment History */}
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Payment History</h3>
            {payments.length === 0 ? (
              <p className="text-xs text-gray-400">No payments recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="text-left text-gray-400">
                    <th className="pb-2">Date</th><th className="pb-2">Amount</th>
                    <th className="pb-2">Method</th><th className="pb-2">Reference</th><th className="pb-2">Status</th>
                  </tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {payments.map(p => (
                      <tr key={p.id} className="text-gray-700">
                        <td className="py-1.5">{formatDate(p.payment_date)}</td>
                        <td className="py-1.5 font-semibold">{formatCurrency(p.amount)}</td>
                        <td className="py-1.5 capitalize">{p.payment_method}</td>
                        <td className="py-1.5 font-mono text-gray-500">{p.reference || '—'}</td>
                        <td className="py-1.5">
                          <span className={`px-1.5 py-0.5 rounded-full text-xs ${p.status === 'received' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* BillFlow Config */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700">BillFlow Configuration</h2>
              <button onClick={() => setEditingConfig(v => !v)} className="text-xs text-indigo-600 underline">
                {editingConfig ? 'Cancel' : 'Edit'}
              </button>
            </div>
            {editingConfig ? (
              <ConfigEditForm user={user} onSave={async (data) => {
                await updateUser(id, data); setEditingConfig(false); refetch()
              }} />
            ) : (
              <div className="grid grid-cols-1 gap-3 text-sm">
                {[
                  ['License Key',     user.license_key   || '—'],
                  ['Supabase URL',    user.their_supabase_url || '—'],
                  ['Supabase Key',    user.their_supabase_key ? '••••••••' + user.their_supabase_key.slice(-6) : '—'],
                  ['n8n URL',         user.their_n8n_url  || '—'],
                  ['n8n Secret',      user.their_n8n_secret ? '••••••••' : '—'],
                  ['App Version',     user.app_version   || '—'],
                ].map(([label, value]) => (
                  <div key={label} className="flex gap-3">
                    <span className="text-gray-400 w-32 shrink-0">{label}</span>
                    <span className="text-gray-800 font-mono text-xs break-all">{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN — Actions + Trial + Notes + Log */}
        <div className="space-y-5">

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h2>
            <div className="space-y-2">
              <button onClick={() => handleSendEmail('welcome')}
                className="w-full text-left text-sm px-3 py-2 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 flex items-center gap-2">
                <Send size={14} /> Send Welcome Email
              </button>
              <button onClick={() => handleSendEmail('trial_reminder')}
                className="w-full text-left text-sm px-3 py-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center gap-2">
                <Send size={14} /> Send Trial Reminder
              </button>
              <button onClick={() => handleSendEmail('payment_reminder')}
                className="w-full text-left text-sm px-3 py-2 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 flex items-center gap-2">
                <Send size={14} /> Send Payment Reminder
              </button>
              <hr className="my-2" />
              {user.status !== 'active' && (
                <button onClick={() => handleStatusChange('active')}
                  className="w-full text-left text-sm px-3 py-2 rounded-lg bg-green-50 text-green-700 hover:bg-green-100">
                  ✓ Activate Account
                </button>
              )}
              {user.status === 'trial' && (
                <div className="flex gap-2">
                  <button onClick={() => handleExtendTrial(7)}  className="flex-1 text-xs px-2 py-2 border rounded-lg hover:bg-gray-50">+7 Days</button>
                  <button onClick={() => handleExtendTrial(14)} className="flex-1 text-xs px-2 py-2 border rounded-lg hover:bg-gray-50">+14 Days</button>
                  <button onClick={() => handleExtendTrial(30)} className="flex-1 text-xs px-2 py-2 border rounded-lg hover:bg-gray-50">+30 Days</button>
                </div>
              )}
              {user.status === 'active' && (
                <button onClick={() => handleStatusChange('suspended')}
                  className="w-full text-left text-sm px-3 py-2 rounded-lg bg-yellow-50 text-yellow-700 hover:bg-yellow-100">
                  ⏸ Suspend Account
                </button>
              )}
              {user.status === 'suspended' && (
                <button onClick={() => handleStatusChange('active')}
                  className="w-full text-left text-sm px-3 py-2 rounded-lg bg-green-50 text-green-700 hover:bg-green-100">
                  ▶ Reactivate Account
                </button>
              )}
              {user.status !== 'cancelled' && (
                <button onClick={() => handleStatusChange('cancelled')}
                  className="w-full text-left text-sm px-3 py-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-100">
                  ✕ Cancel Account
                </button>
              )}
            </div>
          </div>

          {/* Trial Status */}
          {user.status === 'trial' && (
            <div className={`rounded-xl border p-4 ${trialDaysLeft != null && trialDaysLeft <= 3 ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">Trial Status</p>
              <p className="text-2xl font-bold text-blue-900">{trialDaysLeft != null ? trialDaysLeft : '—'} days</p>
              <p className="text-xs text-blue-600">Expires {formatDate(user.trial_end_date)}</p>
            </div>
          )}

          {/* Support Notes */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700">Internal Notes</h2>
              <button onClick={() => setShowNoteModal(true)} className="text-xs text-indigo-600 hover:underline">+ Add</button>
            </div>
            {notes.length === 0 ? (
              <p className="text-xs text-gray-400">No notes yet.</p>
            ) : (
              <div className="space-y-3">
                {notes.map(n => (
                  <div key={n.id} className="text-xs border-l-2 border-indigo-200 pl-3">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded capitalize">{n.category}</span>
                      <span className="text-gray-400">{formatDate(n.created_at)}</span>
                    </div>
                    <p className="text-gray-700">{n.note}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Activity Log */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Activity Log</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {logs.map(l => (
                <div key={l.id} className="text-xs">
                  <p className="text-gray-700 font-medium">{l.description}</p>
                  <p className="text-gray-400">{formatDatetime(l.created_at)} · {l.performed_by}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Record Payment — {user.full_name}</h3>
            <form onSubmit={handleAddPayment} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Amount (₹)*</label>
                  <input type="number" required value={paymentForm.amount}
                    onChange={e => setPaymentForm(p => ({...p, amount: e.target.value}))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Payment Date*</label>
                  <input type="date" required value={paymentForm.payment_date}
                    onChange={e => setPaymentForm(p => ({...p, payment_date: e.target.value}))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Payment Method</label>
                <select value={paymentForm.payment_method}
                  onChange={e => setPaymentForm(p => ({...p, payment_method: e.target.value}))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="bank_transfer">Bank Transfer (NEFT/RTGS/IMPS)</option>
                  <option value="upi">UPI</option>
                  <option value="cheque">Cheque</option>
                  <option value="cash">Cash</option>
                  <option value="razorpay">Razorpay</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">UTR / Reference No.</label>
                <input type="text" value={paymentForm.reference}
                  onChange={e => setPaymentForm(p => ({...p, reference: e.target.value}))}
                  placeholder="UTR1234567890"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                <textarea value={paymentForm.notes}
                  onChange={e => setPaymentForm(p => ({...p, notes: e.target.value}))}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowPaymentModal(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                  {saving ? 'Saving...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold mb-4">Add Internal Note</h3>
            <form onSubmit={handleAddNote} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                <select value={noteCategory} onChange={e => setNoteCategory(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="general">General</option>
                  <option value="billing">Billing</option>
                  <option value="technical">Technical</option>
                  <option value="sales">Sales</option>
                  <option value="complaint">Complaint</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Note*</label>
                <textarea required value={noteText} onChange={e => setNoteText(e.target.value)} rows={4}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowNoteModal(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                  {saving ? 'Saving...' : 'Add Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// Inline config edit form
function ConfigEditForm({ user, onSave }) {
  const [form, setForm] = useState({
    their_supabase_url:  user.their_supabase_url  || '',
    their_supabase_key:  user.their_supabase_key  || '',
    their_n8n_url:       user.their_n8n_url        || '',
    their_n8n_secret:    user.their_n8n_secret     || '',
    license_key:         user.license_key          || '',
    app_version:         user.app_version          || '1.0.0',
  })
  const [saving, setSaving] = useState(false)
  const handle = async (e) => {
    e.preventDefault(); setSaving(true)
    await onSave(form); setSaving(false)
  }
  return (
    <form onSubmit={handle} className="space-y-3 text-sm">
      {[
        ['License Key',    'license_key',          'BF-XXXXX-XXXXX-XXXXX'],
        ['Supabase URL',   'their_supabase_url',   'https://xxx.supabase.co'],
        ['Supabase Key',   'their_supabase_key',   'eyJ...'],
        ['n8n URL',        'their_n8n_url',         'http://localhost:5678'],
        ['n8n Secret',     'their_n8n_secret',      'secret-token'],
        ['App Version',    'app_version',           '1.0.0'],
      ].map(([label, key, ph]) => (
        <div key={key}>
          <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
          <input value={form[key]} onChange={e => setForm(f => ({...f, [key]: e.target.value}))}
            placeholder={ph}
            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono" />
        </div>
      ))}
      <button type="submit" disabled={saving}
        className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
        {saving ? 'Saving...' : 'Save Configuration'}
      </button>
    </form>
  )
}
```

---

### src/pages/AddUser.jsx

```jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createUser, logActivity } from '../hooks/useUsers'
import { generateLicenseKey, callAdminWebhook } from '../lib/utils'

const PLANS = [
  { id: 'standard',      name: 'Standard',      price: 1000,  desc: 'Unlimited bills, unlimited customers, Email + WhatsApp + SMS automations, Multi-user support' }
]

export default function AddUser() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    full_name:        '',
    business_name:    '',
    email:            '',
    phone:            '',
    gstin:            '',
    city:             '',
    state:            '',
    plan:             'standard',
    billing_cycle:    'monthly',
    plan_price:       1000,
    status:           'trial',
    trial_days:       14,
    trial_start_date: new Date().toISOString().split('T')[0],
    trial_end_date:   new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    referral_source:  '',
    notes:            '',
    license_key:      generateLicenseKey(),
    their_supabase_url: '',
    their_supabase_key: '',
    their_n8n_url:    'http://localhost:5678',
    their_n8n_secret: '',
    app_version:      '1.0.0',
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const selectPlan = (plan) => {
    const prices = { monthly: 1000, half_yearly: 5500, yearly: 10000 }
    set('plan', 'standard')
    set('plan_price', prices[form.billing_cycle])
  }

  const selectCycle = (cycle) => {
    const prices = { monthly: 1000, half_yearly: 5500, yearly: 10000 }
    set('billing_cycle', cycle)
    set('plan_price', prices[cycle])
  }

  const updateTrialDays = (days) => {
    const end = new Date(Date.now() + days * 86400000).toISOString().split('T')[0]
    set('trial_days', days)
    set('trial_end_date', end)
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      const userData = { ...form }
      if (form.status === 'active') {
        userData.activated_at   = new Date().toISOString()
        userData.next_billing_date = form.trial_start_date
      }
      const created = await createUser(userData)
      await callAdminWebhook('/webhook/admin-user-added', {
        event:         'new_user_added',
        user_email:    form.email,
        user_name:     form.full_name,
        business_name: form.business_name,
        plan:          form.plan,
        status:        form.status,
        trial_end:     form.trial_end_date,
        license_key:   form.license_key
      })
      navigate(`/users/${created.id}`)
    } catch (e) {
      alert('Error: ' + e.message)
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Add New User</h1>

      {/* Step Indicator */}
      <div className="flex gap-2 mb-8">
        {['Profile','Plan & Trial','Configuration'].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step === i+1 ? 'bg-indigo-600 text-white' : step > i+1 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
              {step > i+1 ? '✓' : i+1}
            </div>
            <span className={`text-sm ${step === i+1 ? 'text-indigo-700 font-medium' : 'text-gray-400'}`}>{s}</span>
            {i < 2 && <span className="text-gray-200 mx-1">—</span>}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        {/* Step 1 */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-2">Customer Information</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                ['Full Name*',     'full_name',    'text', 'Rajesh Kumar'],
                ['Business Name*', 'business_name','text', 'Rajesh Enterprises'],
                ['Email*',         'email',        'email','rajesh@example.com'],
                ['Phone*',         'phone',        'tel',  '9876543210'],
                ['GSTIN',          'gstin',        'text', '27AABCU9603R1ZX'],
                ['City',           'city',         'text', 'Mumbai'],
              ].map(([label, key, type, ph]) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                  <input type={type} value={form[key]} onChange={e => set(key, e.target.value)}
                    placeholder={ph}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">State</label>
                <input value={form.state} onChange={e => set('state', e.target.value)} placeholder="Maharashtra"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Referral Source</label>
                <select value={form.referral_source} onChange={e => set('referral_source', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">Select...</option>
                  <option value="referral">Referral</option>
                  <option value="google">Google Search</option>
                  <option value="instagram">Instagram</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="direct">Direct / Walk-in</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Internal Notes</label>
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Any internal notes about this customer..." />
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Select Plan</h2>
              <div className="grid grid-cols-3 gap-3">
                {PLANS.map(p => (
                  <button key={p.id} type="button" onClick={() => selectPlan(p.id)}
                    className={`text-left border-2 rounded-xl p-4 transition-colors ${form.plan === p.id ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <p className="font-semibold text-gray-900 text-sm">{p.name}</p>
                    <p className="text-indigo-600 font-bold mt-1">₹{p.price}<span className="text-xs text-gray-400 font-normal">/mo</span></p>
                    <p className="text-xs text-gray-500 mt-2">{p.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-2">Billing Cycle</h2>
              <div className="flex gap-3">
                {[
                  ['monthly','Monthly', 1000],
                  ['half_yearly','6 Months', 5500],
                  ['yearly','Yearly', 10000]
                ].map(([v,l,pr]) => (
                  <button key={v} type="button" onClick={() => selectCycle(v)}
                    className={`flex-1 border-2 rounded-xl p-3 text-sm text-center transition-colors ${form.billing_cycle === v ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 hover:border-gray-300'}`}>
                    <p className="font-medium">{l}</p>
                    <p className="text-indigo-600 font-bold mt-1">₹{pr}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-2">Account Activation</h2>
              <div className="flex gap-3">
                {[['trial','Start Trial'],['active','Activate Immediately']].map(([v,l]) => (
                  <button key={v} type="button" onClick={() => set('status', v)}
                    className={`flex-1 border-2 rounded-xl p-3 text-sm text-center transition-colors ${form.status === v ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 hover:border-gray-300'}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {form.status === 'trial' && (
              <div>
                <h2 className="text-sm font-semibold text-gray-700 mb-2">Trial Duration</h2>
                <div className="flex gap-3">
                  {[7,14,30].map(d => (
                    <button key={d} type="button" onClick={() => updateTrialDays(d)}
                      className={`flex-1 border-2 rounded-xl p-3 text-sm font-medium text-center transition-colors ${form.trial_days === d ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200'}`}>
                      {d} Days
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">Trial ends: {form.trial_end_date}</p>
              </div>
            )}

            <div className="bg-indigo-50 rounded-xl p-4 text-sm">
              <p className="font-semibold text-indigo-800">Summary</p>
              <div className="mt-2 space-y-1 text-indigo-700">
                <p>Plan: <b>{form.plan}</b> · {form.billing_cycle}</p>
                <p>Price: <b>₹{form.plan_price}</b></p>
                <p>Status: <b>{form.status}</b></p>
                {form.status === 'trial' && <p>Trial ends: <b>{form.trial_end_date}</b></p>}
                <p>License Key: <b className="font-mono text-xs">{form.license_key}</b></p>
              </div>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-2">BillFlow Configuration (Optional)</h2>
            <p className="text-xs text-gray-400">Fill these in when you set up the customer's installation. Can also be added later from the User Detail page.</p>
            {[
              ['Supabase URL',  'their_supabase_url', 'https://xxx.supabase.co'],
              ['Supabase Key',  'their_supabase_key', 'eyJ...'],
              ['n8n URL',       'their_n8n_url',       'http://localhost:5678'],
              ['n8n Secret',    'their_n8n_secret',    'webhook-secret-token'],
            ].map(([label, key, ph]) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                <input value={form[key]} onChange={e => set(key, e.target.value)} placeholder={ph}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            ))}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm">
              <p className="font-semibold text-green-800 mb-1">Ready to Create!</p>
              <p className="text-green-700 text-xs">After saving, a welcome email will be automatically sent via n8n. The license key <b className="font-mono">{form.license_key}</b> will be included.</p>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6 pt-5 border-t border-gray-100">
          {step > 1 ? (
            <button onClick={() => setStep(s => s - 1)} className="border border-gray-300 text-gray-700 px-5 py-2 rounded-lg text-sm">← Back</button>
          ) : <div />}
          {step < 3 ? (
            <button onClick={() => setStep(s => s + 1)}
              disabled={step === 1 && (!form.full_name || !form.email || !form.business_name)}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white px-5 py-2 rounded-lg text-sm font-medium">
              Continue →
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={saving}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white px-6 py-2 rounded-lg text-sm font-medium">
              {saving ? 'Creating...' : '✓ Create User & Send Welcome Email'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
```

---

### src/pages/Trials.jsx

```jsx
import { useUsers } from '../hooks/useUsers'
import { updateUser, logActivity } from '../hooks/useUsers'
import { formatDate, daysUntil } from '../lib/utils'
import { useState } from 'react'

export default function Trials() {
  const { users, loading, refetch } = useUsers({ status: 'trial', limit: 200 })
  const [extending, setExtending] = useState(null)

  const extend = async (user, days) => {
    setExtending(user.id)
    const cur = user.trial_end_date ? new Date(user.trial_end_date) : new Date()
    const newEnd = new Date(Math.max(cur, new Date()))
    newEnd.setDate(newEnd.getDate() + days)
    await updateUser(user.id, { trial_end_date: newEnd.toISOString().split('T')[0] })
    await logActivity(user.id, 'trial_extended', `Trial extended by ${days} days to ${newEnd.toISOString().split('T')[0]}`, 'admin')
    setExtending(null)
    refetch()
  }

  const convert = async (user) => {
    if (!confirm(`Convert ${user.full_name} from trial to active paid account?`)) return
    await updateUser(user.id, {
      status: 'active', converted_from_trial: true, activated_at: new Date().toISOString()
    })
    await logActivity(user.id, 'trial_converted', 'Converted from trial to active account', 'admin')
    refetch()
  }

  const todayStr  = new Date().toISOString().split('T')[0]
  const active    = users.filter(u => u.trial_end_date >= todayStr)
  const expired   = users.filter(u => u.trial_end_date < todayStr)
  const urgentUsers = active.filter(u => {
    const d = daysUntil(u.trial_end_date)
    return d != null && d <= 7
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Trial Management</h1>
        <p className="text-gray-500 text-sm">{users.length} users on trial</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-xs text-blue-600 font-medium">Active Trials</p>
          <p className="text-3xl font-bold text-blue-900">{active.length}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-xs text-red-600 font-medium">Expiring in 7 Days</p>
          <p className="text-3xl font-bold text-red-900">{urgentUsers.length}</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-600 font-medium">Expired (Not Converted)</p>
          <p className="text-3xl font-bold text-gray-900">{expired.length}</p>
        </div>
      </div>

      {urgentUsers.length > 0 && (
        <div className="bg-white rounded-xl border border-red-200 shadow-sm overflow-hidden">
          <div className="bg-red-50 px-5 py-3 border-b border-red-100">
            <h2 className="text-sm font-semibold text-red-700">⚠ Expiring Within 7 Days</h2>
          </div>
          <TrialTable users={urgentUsers} onExtend={extend} onConvert={convert} extending={extending} urgent />
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">All Active Trials ({active.length})</h2>
        </div>
        <TrialTable users={active} onExtend={extend} onConvert={convert} extending={extending} />
      </div>

      {expired.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">Expired Trials ({expired.length})</h2>
          </div>
          <TrialTable users={expired} onExtend={extend} onConvert={convert} extending={extending} />
        </div>
      )}
    </div>
  )
}

function TrialTable({ users, onExtend, onConvert, extending }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="bg-gray-50 border-b">
          {['Customer','Email','Plan','Trial End','Days Left','Actions'].map(h =>
            <th key={h} className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">{h}</th>
          )}
        </tr></thead>
        <tbody className="divide-y divide-gray-50">
          {users.map(u => {
            const left = daysUntil(u.trial_end_date)
            return (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{u.full_name}</p>
                  <p className="text-xs text-gray-400">{u.business_name}</p>
                </td>
                <td className="px-4 py-3 text-gray-600">{u.email}</td>
                <td className="px-4 py-3 capitalize">{u.plan}</td>
                <td className="px-4 py-3">{formatDate(u.trial_end_date)}</td>
                <td className="px-4 py-3">
                  <span className={`font-semibold ${left == null ? 'text-gray-400' : left <= 0 ? 'text-red-600' : left <= 3 ? 'text-red-500' : left <= 7 ? 'text-amber-500' : 'text-green-600'}`}>
                    {left == null ? '—' : left <= 0 ? 'Expired' : `${left} days`}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => onExtend(u, 7)}  disabled={extending === u.id}
                      className="text-xs border border-gray-300 px-2 py-1 rounded hover:bg-gray-50 disabled:opacity-40">+7d</button>
                    <button onClick={() => onExtend(u, 14)} disabled={extending === u.id}
                      className="text-xs border border-gray-300 px-2 py-1 rounded hover:bg-gray-50 disabled:opacity-40">+14d</button>
                    <button onClick={() => onConvert(u)}
                      className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded">→ Activate</button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
```

---

## 7. n8n ADMIN WORKFLOWS (7 New Workflows)

Add these to your existing n8n instance.

| ID | Webhook Path | Trigger | Action |
|----|-------------|---------|--------|
| AWF-01 | `/webhook/admin-user-added` | New user added | Send welcome email + WhatsApp to customer |
| AWF-02 | `/webhook/admin-user-status` | Status changed | Notify customer of suspension/reactivation |
| AWF-03 | `/webhook/admin-payment-received` | Payment recorded | Send receipt to customer |
| AWF-04 | `/webhook/admin-send-email` | Manual email trigger | Send chosen template to customer |
| AWF-05 | Schedule: `0 9 1 * *` | Monthly | Find trials expiring this month, email you + WhatsApp |
| AWF-06 | Schedule: `0 9 1 * *` | Monthly | Find payments due this month, email you with collection list |
| AWF-07 | Schedule: `0 8 1 * *` | Monthly | Revenue summary to you |

### AWF-01 Node Breakdown — New User Welcome
```
1  Webhook: POST /webhook/admin-user-added
2  Email to Customer:
     To:      {{ $json.user_email }}
     Subject: Welcome to BillFlow, {{ $json.user_name }}!
     Body:    Dear {{ $json.user_name }},
              Welcome to BillFlow! Here are your setup details:

              Business: {{ $json.business_name }}
              Plan: {{ $json.plan }}
              Status: {{ $json.status }}
              Trial Ends: {{ $json.trial_end }} (if on trial)
              License Key: {{ $json.license_key }}

              Download BillFlow: [your download link]
              Setup Guide: [your guide link]

              We will contact you within 24 hours to complete your setup.

              Team BillFlow

3  Email to Yourself (AWF-01 Internal Alert):
     To:      {{ $env.ADMIN_OWNER_EMAIL }}
     Subject: 🆕 New BillFlow User: {{ $json.business_name }}
     Body:    New user added: {{ $json.user_name }} ({{ $json.user_email }})
              Business: {{ $json.business_name }}
              Plan: {{ $json.plan }}
              Status: {{ $json.status }}

4  If WATI enabled:
     WhatsApp to customer phone with template: billflow_welcome

5  Respond 200 OK
```

### AWF-05 Node Breakdown — Monthly Trial Expiry Alert
```
1  Schedule: 0 9 1 * *  (1st of every month, 9 AM)
2  Code Node: Calculate dates
     thisMonth_start = first day of this month
     thisMonth_end   = last day of this month
3  HTTP GET Supabase: trials expiring this month
     SELECT * FROM admin_users
     WHERE status = 'trial'
     AND trial_end_date BETWEEN thisMonth_start AND thisMonth_end
4  Code Node: Format expiry list
5  Email to Admin:
     Subject: BillFlow — X Trial Users Expiring This Month
     Body:    [list of users, trial end dates, plan, phone]
              Quick links to each user's admin panel page
6  If > 0 expiring within 3 days: WhatsApp alert to admin phone
```

### AWF-06 Node Breakdown — Monthly Payment Collection Reminder
```
1  Schedule: 0 9 1 * *
2  HTTP GET Supabase: users where next_billing_date is this month
3  Code Node: Sort by date, calculate outstanding
4  Email to Admin:
     Subject: BillFlow — X Payments Due This Month — Total ₹XX,XXX
     Body:    Table: Customer | Amount | Due Date | Method
              Total expected: ₹XX,XXX
```

### AWF-07 Node Breakdown — Monthly Revenue Summary to You
```
1  Schedule: 0 8 1 * *  (earlier than other workflows)
2  HTTP GET: payments received last month
3  HTTP GET: new users added last month
4  HTTP GET: users by status (for MRR calc)
5  Code Node: Calculate MRR, ARR, new MRR, churned MRR
6  Email to Admin:
     Subject: BillFlow Monthly Revenue — [Month] — MRR: ₹XX,XXX
     Body:    Revenue this month: ₹XX,XXX
              New customers: X
              Churned: X
              MRR: ₹XX,XXX
              ARR: ₹XX,XXX
              Active users: X
              Trial users: X
```

---

## 8. ENVIRONMENT VARIABLES

**File:** `.env` (never commit to git)

```bash
# Supabase — your admin project
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...

# n8n
VITE_N8N_BASE_URL=http://localhost:5678
VITE_N8N_SECRET=your-webhook-secret

# (For n8n admin workflows)
ADMIN_OWNER_EMAIL=you@yourdomain.com
ADMIN_OWNER_PHONE=919876543210
```

**File:** `.env.example` (commit this)

```bash
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_SERVICE_KEY=your-service-role-key
VITE_N8N_BASE_URL=http://localhost:5678
VITE_N8N_SECRET=your-secret
```

---

## 9. DEPLOYMENT GUIDE

### Deploy to Vercel (Free, 5 minutes)

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Build locally first to check for errors
npm run build

# 3. Deploy
vercel

# 4. Set environment variables in Vercel dashboard:
#    Project → Settings → Environment Variables
#    Add: VITE_SUPABASE_URL, VITE_SUPABASE_SERVICE_KEY, VITE_N8N_BASE_URL, VITE_N8N_SECRET
#    Important: set for Production environment

# 5. Redeploy after setting env vars:
vercel --prod

# Your admin panel is now live at:
# https://billflow-admin-xxx.vercel.app
# Or set a custom domain: admin.yourdomain.com
```

### Security Checklist Before Going Live

```
[ ] VITE_SUPABASE_SERVICE_KEY is the SERVICE ROLE key (not anon key)
    — this gives full DB access, keep it secret
[ ] Add your Vercel domain to Supabase Auth → URL Configuration → Allowed URLs
[ ] Create your admin Supabase account:
    Supabase Dashboard → Authentication → Users → Invite User
    (Use your own email, strong password)
[ ] Test login on deployed URL — only your email should be able to log in
[ ] Supabase → SQL Editor → run admin 001_admin_tables.sql
[ ] Verify admin_users table is empty and all tables created
[ ] Add yourself as first admin user from the Supabase SQL Editor:
    INSERT INTO admin_users (full_name, business_name, email, status)
    VALUES ('Your Name', 'BillFlow Admin', 'you@yourdomain.com', 'active');
    — This is your own record for tracking purposes (optional)
[ ] Test Add User flow end to end
[ ] Confirm n8n webhook AWF-01 triggers and welcome email arrives
```

---

## 10. QUICK START — LOCAL DEVELOPMENT

```bash
# Clone / create project
mkdir billflow-admin && cd billflow-admin
npm create vite@latest . -- --template react

# Install all dependencies
npm install @supabase/supabase-js react-router-dom recharts lucide-react \
  @tanstack/react-table date-fns clsx
npm install -D tailwindcss autoprefixer postcss

# Init Tailwind
npx tailwindcss init -p

# Copy tailwind.config.js content:
# content: ["./index.html","./src/**/*.{js,jsx}"],
# theme: { extend: {} },
# plugins: []

# Add to src/index.css:
# @tailwind base;
# @tailwind components;
# @tailwind utilities;

# Create .env file with your Supabase credentials

# Run migrations in Supabase SQL Editor (copy from Section 3)

# Start dev server
npm run dev
# Open: http://localhost:5173
```

---

*End of billflow-admin-panel.md*
*Admin panel is a separate web app from the desktop app.*
*It manages your customers — their trials, billing, configuration, and communications.*