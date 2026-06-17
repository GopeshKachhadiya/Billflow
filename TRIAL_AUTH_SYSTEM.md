# Trial Authentication & Anti-Abuse System

> **Document Purpose:** Define how users authenticate, how the 14-day trial is enforced, how abuse is prevented, and how users transition to paid plans.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Trial Philosophy](#2-trial-philosophy)
3. [Authentication Strategy](#3-authentication-strategy)
4. [Anti-Abuse Mechanisms](#4-anti-abuse-mechanisms)
5. [Trial Lifecycle](#5-trial-lifecycle)
6. [Transition to Paid](#6-transition-to-paid)
7. [Feature Access — Trial vs Paid](#7-feature-access--trial-vs-paid)
8. [Edge Cases & Handling](#8-edge-cases--handling)
9. [Tech Stack Recommendations](#9-tech-stack-recommendations)
10. [Database Schema (Reference)](#10-database-schema-reference)

---

## 1. Overview

The product offers a **14-day free trial** where users get access to **100% of paid features** — no artificial limits, no feature gating. After 14 days, the user must subscribe to continue using the product.

The core challenge is **ensuring one trial per real person**, not one trial per email address. This document describes the layered system used to enforce that.

---

## 2. Trial Philosophy

| Principle | Decision |
|---|---|
| Trial duration | **14 days** from first sign-up (not from first login) |
| Feature access | **Full access** — identical to paid plan |
| Trial restart | **Not allowed** — one trial per real person/device |
| Credit card required at sign-up? | **No** — frictionless start, card collected before Day 14 ends |
| Notification cadence | Day 0, Day 7, Day 12, Day 13, Day 14 (final warning) |

---

## 3. Authentication Strategy

### 3.1 Sign-Up Flow

```
User visits → Enters Email → Verifies Email OTP → Profile Setup
→ System runs Anti-Abuse Checks → Trial Activated (or Blocked)
```

### 3.2 Supported Auth Methods

Users can sign up using:

- **Email + Password** with mandatory email OTP verification
- **Google OAuth** (recommended — harder to abuse with throwaway accounts)
- **GitHub OAuth** (for developer-facing products)

> **Rule:** Disposable / temporary email providers are **blocked at sign-up**. See Section 4.2.

### 3.3 Session Management

- Issue a **JWT access token** (15-minute expiry) + **refresh token** (30-day expiry, rotated on each use)
- All sessions are stored server-side so they can be **revoked instantly** when a trial expires or abuse is detected
- A user can have a maximum of **3 active sessions** (e.g., mobile, desktop, browser)

---

## 4. Anti-Abuse Mechanisms

This is the most critical section. The system uses **layered signals** — no single check is used alone, because each can be circumvented individually. Together they form a strong fingerprint.

### 4.1 Layer 1 — Device Fingerprinting

When a user visits the sign-up page, a **device fingerprint** is generated in the browser **before** the user submits their email. This fingerprint is stored server-side and linked to the trial.

The fingerprint includes:

| Signal | Description |
|---|---|
| `canvas_hash` | Unique rendering output of a hidden HTML canvas element |
| `webgl_hash` | GPU/driver-level rendering signature |
| `audio_hash` | AudioContext output signature |
| `screen_resolution` | Width × Height × color depth |
| `timezone` | Browser-reported timezone |
| `language` | Browser language setting |
| `installed_fonts` | Subset of detected fonts |
| `user_agent` | Browser + OS string |
| `hardware_concurrency` | Number of CPU cores |
| `device_memory` | Reported device RAM |

> **Recommended library:** [FingerprintJS Pro](https://fingerprint.com/) — provides a `visitorId` that is stable even across incognito mode, browser updates, and clearing cookies.

**How it works:**
- On sign-up, the `visitorId` is submitted alongside the email
- Backend checks: *"Has this `visitorId` been associated with a previous trial?"*
- If yes → sign-up is **blocked** with message: *"A trial has already been used on this device."*

### 4.2 Layer 2 — Disposable Email Blocking

Maintain a blocklist of known **disposable/temporary email providers**:

- `mailinator.com`, `guerrillamail.com`, `tempmail.com`, `10minutemail.com`, `yopmail.com`, `throwam.com`, `sharklasers.com`, and 3,000+ others

Use an API service to check in real-time:

- [Abstract API — Email Validation](https://www.abstractapi.com/email-verification-validation-api)
- [Hunter.io Email Verifier](https://hunter.io/email-verifier)
- [MailCheck.ai](https://www.mailcheck.ai/) (open-source blocklist)

**Check at sign-up:**
```
Email submitted → Check MX record exists → Check against disposable list
→ Check if domain is < 6 months old (new domains used for abuse) → Allow or Block
```

> Also block **sub-addressed emails** used for abuse (e.g., `user+trial2@gmail.com` and `user+newtrial@gmail.com` map to the same real address `user@gmail.com`). Normalize by stripping the `+alias` part before storing.

### 4.3 Layer 3 — IP Address Tracking

Track the **IP address** at the time of sign-up:

| Check | Action |
|---|---|
| More than **3 accounts** created from same IP | Flag for manual review; block if 5+ |
| IP is a known **VPN / proxy / Tor exit node** | Require additional verification (phone OTP) |
| IP is a known **datacenter IP** (AWS, GCP, DO, etc.) | Block automated sign-ups; require phone OTP |

Use an IP intelligence API:

- [IPQualityScore](https://www.ipqualityscore.com/) — detects VPN, proxy, bot traffic
- [MaxMind GeoIP2](https://www.maxmind.com/) — for geolocation + ISP detection
- [AbstractAPI IP Geolocation](https://www.abstractapi.com/ip-geolocation-api)

> **Important:** IP tracking is a supporting signal only. A legitimate user on a shared office network or university WiFi should not be permanently blocked — just flagged for one additional verification step.

### 4.4 Layer 4 — Phone Number Verification (Strongest Signal)

For users flagged by Layer 1, 2, or 3 — or as an **optional universal requirement** — request **phone number + SMS OTP** verification.

Rules:
- One phone number = one trial, globally
- Phone numbers are stored as **hashed** (bcrypt) — never in plaintext, for privacy compliance
- Numbers from known VoIP providers (Google Voice, TextNow, Hushed) are **blocked**

> **Recommended providers:** [Twilio Verify](https://www.twilio.com/verify) or [AWS SNS OTP](https://docs.aws.amazon.com/sns/latest/dg/channels-sms-verify.html)

**Decision tree for phone verification:**

```
New sign-up
  └─ Device seen before?         → YES → Block (or require phone to appeal)
  └─ Disposable email?           → YES → Block
  └─ High-risk IP (VPN/proxy)?   → YES → Require phone OTP → Proceed if valid
  └─ 3+ accounts from this IP?   → YES → Require phone OTP → Proceed if valid
  └─ All clear                   → Proceed without phone (low friction path)
```

### 4.5 Layer 5 — Cookie + localStorage Persistence

Set a **long-lived cookie** (1 year) on the user's browser at the moment the trial starts:

```
Cookie Name: _trial_fingerprint
Value: encrypted_trial_id (signed with server secret)
Expiry: 365 days
HttpOnly: true, Secure: true, SameSite=Strict
```

Also write to **localStorage**:
```
Key: _app_trial_ref
Value: trial_id + start_date (encrypted)
```

**On any new sign-up attempt from the same browser:**
- Read the cookie / localStorage value
- Verify trial exists in database for that trial ID
- If found → Block new trial with message: *"A free trial was already started in this browser."*

> Clearing cookies doesn't clear localStorage and vice versa. Both must be cleared to bypass this check — and even then, Device Fingerprinting (Layer 1) catches the same device.

### 4.6 Layer 6 — Behavioral Risk Scoring

Assign a real-time **Risk Score (0–100)** to each sign-up based on combined signals:

| Signal | Risk Added |
|---|---|
| Device fingerprint matched to previous trial | +60 |
| Disposable email domain | +50 |
| VPN / proxy IP detected | +25 |
| Datacenter IP | +30 |
| Trial cookie / localStorage found | +55 |
| 3+ accounts from same IP | +20 |
| Account created in < 90 seconds of page load | +15 |
| No mouse movement before form submit (bot) | +20 |

**Thresholds:**

| Score | Action |
|---|---|
| 0–20 | ✅ Allow — proceed to trial |
| 21–49 | ⚠️ Soft flag — require email OTP re-verification |
| 50–74 | ⚠️ High risk — require phone OTP verification |
| 75+ | 🚫 Block — "Trial not available. Contact support." |

---

## 5. Trial Lifecycle

### 5.1 States

```
[SIGNUP] → [TRIAL_ACTIVE] → [TRIAL_EXPIRED] → [SUBSCRIBED]
                                            → [CHURNED]
```

### 5.2 Day-by-Day Timeline

| Day | Event | Action |
|---|---|---|
| Day 0 | Sign-up complete | Trial starts, welcome email sent, full access granted |
| Day 7 | Midpoint | Email: "You're halfway through your trial — here's what's new" |
| Day 12 | 2 days left | Email + in-app banner: "Your trial expires in 2 days. Add payment to continue." |
| Day 13 | 1 day left | Email (urgent) + in-app modal: "Last day of your free trial!" |
| Day 14 | Trial ends | Access revoked at **exact timestamp** of sign-up (not midnight) |
| Day 14+ | Post-trial | Read-only mode or full block (see Section 8.2) |

> **Trial expiry is calculated from the exact UTC timestamp of sign-up**, not the calendar date. A user who signs up at 3:47 PM on June 1 will lose access at 3:47 PM on June 15.

### 5.3 Trial Clock Rules

- The clock **starts on sign-up** — not on first login
- The clock **does not pause** (no freeze for inactivity)
- If a user deletes their account and attempts to re-sign-up with the same device/email, they are blocked

---

## 6. Transition to Paid

### 6.1 Payment Collection

- Use **Stripe** for all payments (subscriptions, invoicing, card management)
- Collect payment details at **any point during the trial** (encouraged from Day 1, required by Day 14)
- No charge is made until the trial ends

**Stripe integration approach:**
- Create a Stripe `Customer` on sign-up
- On payment method entry: call `stripe.setupIntent` → save card as `PaymentMethod` attached to Customer
- On Day 14: trigger `stripe.subscriptions.create` with the saved payment method

### 6.2 What Happens When Trial Ends

| User State | Access |
|---|---|
| Added payment method | ✅ Seamlessly converts to paid, no interruption |
| Did not add payment method | ❌ Access revoked, redirected to payment page |
| Payment fails on auto-charge | ⚠️ 72-hour grace period, 3 retry attempts, then revoked |

### 6.3 Pricing Gate (Post-Trial)

Once the trial expires without payment, the user is placed in a **"locked" state**:

- They can **log in** and see a read-only dashboard (data preserved for 30 days)
- They **cannot** use any features
- They see a persistent paywall modal
- After **30 days** of no payment, their data is scheduled for deletion (with 7-day warning email)

---

## 7. Feature Access — Trial vs Paid

> **Policy: No feature differentiation.** Trial users get exactly the same features as paid users.

| Feature | Trial | Paid |
|---|---|---|
| Core product features | ✅ Full access | ✅ Full access |
| API access | ✅ Full access | ✅ Full access |
| Integrations | ✅ Full access | ✅ Full access |
| Data export | ✅ Full access | ✅ Full access |
| Priority support | ❌ Community support only | ✅ Priority email/chat |
| SLA guarantee | ❌ | ✅ 99.9% uptime SLA |
| Custom contracts / invoicing | ❌ | ✅ (Enterprise) |

> The **only** differences are support tier and contractual guarantees — not product functionality. This ensures users experience the full value before being asked to pay.

---

## 8. Edge Cases & Handling

### 8.1 Legitimate Users Blocked

**Scenario:** A real user gets blocked because they share a device/IP with someone who already trialled.

**Resolution:**
- User contacts support
- Support verifies identity via government ID or LinkedIn profile
- Support manually whitelists the user's email and grants a fresh trial
- All manual overrides are logged with the support agent's ID

### 8.2 User Requests Trial Extension

**Policy:** Extensions are granted only in exceptional circumstances:

- Product outage during the trial period → grant days equal to downtime
- User onboarding delay caused by support team → grant 3–5 days
- All extensions require a support ticket and manager approval
- Extensions are logged in the `trial_extensions` database table

### 8.3 User Deletes Account Mid-Trial and Re-Registers

- Email + device fingerprint + phone (if collected) are all stored post-deletion in a **tombstone record** (anonymized but uniquely identifiable)
- Re-registration with the same email → blocked
- Re-registration on the same device → blocked by fingerprint
- Re-registration with different email but same device → blocked by fingerprint

### 8.4 Corporate / Team Sign-Ups

- When a company signs up, the **trial is per organization**, not per user
- Additional team members added during the trial do not start a new trial
- The organization's trial timer is tied to the first admin's sign-up date
- After converting to paid, the organization manages its own seat count

### 8.5 Failed Payment After Trial

| Attempt | Timing | Action |
|---|---|---|
| Attempt 1 | Day 14 (trial end) | Charge card on file |
| Attempt 2 | Day 15 (+24h) | Retry charge, send "Payment failed" email |
| Attempt 3 | Day 17 (+48h) | Retry charge, send urgent warning email |
| Final | Day 18 | Revoke access, send "Account suspended" email |

---

## 9. Tech Stack Recommendations

| Component | Recommended Tool |
|---|---|
| Authentication (core) | [Clerk](https://clerk.com/) or [Supabase Auth](https://supabase.com/auth) |
| Device Fingerprinting | [FingerprintJS Pro](https://fingerprint.com/) |
| Disposable Email Detection | [Abstract API](https://www.abstractapi.com/) or [MailCheck.ai](https://www.mailcheck.ai/) |
| IP Intelligence | [IPQualityScore](https://www.ipqualityscore.com/) |
| SMS / Phone OTP | [Twilio Verify](https://www.twilio.com/verify) |
| Payments & Subscriptions | [Stripe](https://stripe.com/) |
| Background Jobs (trial expiry) | [BullMQ](https://bullmq.io/) / [Inngest](https://www.inngest.com/) / cron job |
| Email Notifications | [Resend](https://resend.com/) or [SendGrid](https://sendgrid.com/) |

---

## 10. Database Schema (Reference)

```sql
-- Core user table
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT UNIQUE NOT NULL,
  email_normalized TEXT UNIQUE NOT NULL,  -- lowercase, + stripped
  phone_hash      TEXT,                   -- bcrypt hash of phone (if collected)
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  stripe_customer_id TEXT
);

-- Trial record (one per user)
CREATE TABLE trials (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ NOT NULL,  -- started_at + 14 days
  status          TEXT CHECK (status IN ('active', 'expired', 'converted', 'blocked')),
  device_fp_id    TEXT,     -- FingerprintJS visitorId
  signup_ip       INET,
  extended_days   INT DEFAULT 0,
  extension_reason TEXT
);

-- Device/IP fingerprint tombstones (kept after account deletion)
CREATE TABLE trial_fingerprints (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_fp_id    TEXT,
  ip_address      INET,
  email_hash      TEXT,   -- one-way hash of email
  phone_hash      TEXT,
  trial_id        UUID,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Subscription (created when trial converts to paid)
CREATE TABLE subscriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id),
  stripe_sub_id   TEXT UNIQUE,
  plan            TEXT,     -- 'monthly', 'annual', 'enterprise'
  status          TEXT,     -- 'active', 'past_due', 'canceled'
  current_period_end TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Audit log for all abuse checks
CREATE TABLE auth_risk_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT,
  risk_score      INT,
  flags           JSONB,    -- { "vpn": true, "disposable_email": false, ... }
  decision        TEXT,     -- 'allowed', 'phone_required', 'blocked'
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Summary Checklist

- [x] 14-day trial with 100% feature access — no artificial limits
- [x] Device fingerprinting — catches same device, even incognito
- [x] Disposable email blocking — real-time API check + normalize `+alias` abuse
- [x] IP tracking — flag VPN/proxy, limit accounts per IP
- [x] Phone OTP verification — for high-risk sign-ups
- [x] Cookie + localStorage persistence — catches same browser re-sign-ups
- [x] Behavioral risk score — combined signal to decide action
- [x] Trial clock starts at sign-up timestamp (UTC), not calendar day
- [x] Tombstone records prevent re-trial after account deletion
- [x] Stripe integration — card saved during trial, charged at expiry
- [x] 72-hour grace period with 3 payment retry attempts
- [x] 30-day data preservation window after trial expiry
- [x] Manual override process for legitimately blocked users
- [x] All decisions logged in `auth_risk_log` for auditing

---

*Last updated: June 2026 — maintained by the product & engineering team.*
