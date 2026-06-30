# BillFlow — Product Website Blueprint

> **Purpose:** This document is the complete, detailed specification for building the BillFlow marketing/product website. It covers every page, every section, exact copywriting, layout descriptions, animation directives, design tokens, and specific **21st.dev** template/component recommendations. The website is designed to **showcase BillFlow to potential customers** without leaking any source code, internal architecture, or implementation details.

---

## Table of Contents

1. [Brand Identity & Design System](#1-brand-identity--design-system)
2. [Tech Stack & Setup](#2-tech-stack--setup)
3. [21st.dev Components Master List](#3-21stdev-components-master-list)
4. [Page 1 — Homepage (Landing Page)](#4-page-1--homepage-landing-page)
5. [Page 2 — Features](#5-page-2--features)
6. [Page 3 — Pricing](#6-page-3--pricing)
7. [Page 4 — How It Works](#7-page-4--how-it-works)
8. [Page 5 — About Us](#8-page-5--about-us)
9. [Page 6 — Contact & Support](#9-page-6--contact--support)
10. [Page 7 — Blog / Resources](#10-page-7--blog--resources)
11. [Page 8 — Privacy Policy & Terms](#11-page-8--privacy-policy--terms)
12. [Page 9 — Download / Get Started](#12-page-9--download--get-started)
13. [Shared Components](#13-shared-components)
14. [Animation & Interaction Guidelines](#14-animation--interaction-guidelines)
15. [SEO & Performance](#15-seo--performance)

---

## 1. Brand Identity & Design System

### 1.1 Brand Essence

| Attribute | Value |
|---|---|
| **Brand Name** | BillFlow |
| **Tagline** | *"Billing that flows. GST that just works."* |
| **Voice** | Professional, confident, approachable. Speaks directly to Indian SMB owners. |
| **Target Audience** | Indian small and medium businesses (retailers, manufacturers, service providers, freelancers) who need GST-compliant invoicing. |
| **Core Promise** | The fastest, most automated billing software built specifically for Indian businesses — works offline, syncs to the cloud, and handles all GST compliance automatically. |

### 1.2 Color Palette

| Token | Light Mode | Dark Mode | Usage |
|---|---|---|---|
| `--brand-primary` | `#5046e6` (Indigo 600) | `#6366f1` (Indigo 500) | CTAs, links, active states |
| `--brand-primary-hover` | `#4338ca` | `#818cf8` | Button hovers |
| `--brand-secondary` | `#0ea5e9` (Sky 500) | `#38bdf8` | Accent highlights, badges |
| `--bg-canvas` | `#ffffff` | `#000000` | Page background |
| `--bg-surface` | `#f8fafc` (Slate 50) | `#0a0a0a` | Card surfaces |
| `--bg-elevated` | `#f1f5f9` (Slate 100) | `#18181b` (Zinc 900) | Elevated containers |
| `--text-heading` | `#0f172a` (Slate 900) | `#f8fafc` | Headings |
| `--text-body` | `#475569` (Slate 600) | `#94a3b8` (Slate 400) | Body text |
| `--text-muted` | `#94a3b8` (Slate 400) | `#64748b` (Slate 500) | Captions, labels |
| `--border` | `#e2e8f0` (Slate 200) | `#27272a` (Zinc 800) | Dividers, card borders |
| `--gradient-hero` | `linear-gradient(135deg, #5046e6, #0ea5e9)` | Same | Hero gradients |
| `--gradient-cta` | `linear-gradient(135deg, #6366f1, #a855f7)` | Same | CTA buttons |

### 1.3 Typography

| Element | Font | Weight | Size |
|---|---|---|---|
| Display / Hero | **Inter** (Google Fonts) | 800 (Extra Bold) | `4rem` / `3.5rem` mobile |
| H1 | Inter | 700 (Bold) | `2.75rem` |
| H2 | Inter | 700 | `2.25rem` |
| H3 | Inter | 600 (Semibold) | `1.5rem` |
| Body | Inter | 400 (Regular) | `1.125rem` |
| Caption / Small | Inter | 500 (Medium) | `0.875rem` |
| Code / Mono | **JetBrains Mono** | 400 | `0.875rem` |

### 1.4 Spacing & Layout

- **Max content width:** `1280px` centered
- **Section vertical padding:** `96px` top and bottom (`6rem`)
- **Card border-radius:** `16px` (`1rem`)
- **Button border-radius:** `12px` (`0.75rem`)
- **Shadow (cards):** `0 4px 24px rgba(0,0,0,0.06)` light / `0 4px 24px rgba(0,0,0,0.4)` dark
- **Shadow (elevated):** `0 8px 40px rgba(0,0,0,0.08)` light

---

## 2. Tech Stack & Setup

| Layer | Technology |
|---|---|
| **Framework** | Next.js 14+ (App Router) |
| **Styling** | Tailwind CSS v4 + custom design tokens |
| **Animations** | Framer Motion |
| **Icons** | Lucide React |
| **Components** | 21st.dev community components + shadcn/ui |
| **Fonts** | Google Fonts: Inter, JetBrains Mono |
| **Deployment** | Vercel |
| **Analytics** | Vercel Analytics or Plausible (privacy-focused) |
| **Forms** | Resend (contact form email delivery) |

---

## 3. 21st.dev Components Master List

Below is a curated list of **21st.dev** components and templates to use for each section of the website. Browse these on [21st.dev](https://21st.dev) and copy the code directly into your project.

| Website Section | 21st.dev Component / Search Term | Notes |
|---|---|---|
| **Navigation** | `navbar` / `animated-navbar` | Sticky nav with glassmorphism blur + mobile hamburger |
| **Hero Section** | `hero-section-dark` / `animated-hero` | Full-width hero with gradient text, floating mockups, and particle effects |
| **Logo Cloud / Trust Bar** | `logo-cloud` / `company-logos` | Animated marquee of partner/technology logos |
| **Feature Bento Grid** | `bento-grid` / `feature-section-with-bento-grid` | Modular grid cards with icons and micro-animations |
| **Feature Showcase** | `feature-section` / `features-with-image` | Alternating left-right image+text layouts |
| **Stats / Metrics** | `stats-section` / `animated-counter` | Counting number animations for key metrics |
| **Pricing Table** | `pricing-section` / `pricing-cards` | 3-column pricing with toggle (monthly/annual) |
| **Testimonials** | `animated-testimonials` / `testimonial-carousel` | Sliding card carousel with avatar, name, company |
| **How It Works** | `steps-section` / `timeline` | Vertical/horizontal numbered steps with connecting lines |
| **FAQ Accordion** | `faq-section` / `accordion` | Expandable Q&A with smooth height transitions |
| **CTA Banner** | `cta-section` / `cta-with-gradient` | Full-width gradient banner with action buttons |
| **Footer** | `footer-section` / `animated-footer` | Multi-column footer with social links, newsletter |
| **Blog Cards** | `blog-card` / `article-preview` | Image + title + excerpt card grid |
| **Contact Form** | `contact-section` / `contact-form` | Styled form with validation states |
| **Comparison Table** | `comparison-table` / `feature-comparison` | Feature matrix (BillFlow vs competitors) |
| **Floating Mockup** | `device-mockup` / `laptop-mockup` | Tilted 3D device frame showing app screenshot |
| **Scroll Animations** | `scroll-reveal` / `fade-in-section` | Intersection Observer-based reveal animations |
| **Dark Mode Toggle** | `theme-toggle` / `dark-mode-switch` | Sun/moon animated toggle |
| **Marquee** | `marquee` / `infinite-scroll` | Infinite horizontal scrolling for logos or testimonials |
| **Spotlight Effect** | `spotlight` / `hover-spotlight` | Mouse-following gradient spotlight on cards |

---

## 4. Page 1 — Homepage (Landing Page)

**Route:** `/`
**Meta Title:** `BillFlow — Modern Billing & GST Management for Indian Businesses`
**Meta Description:** `Create GST-compliant invoices in seconds. BillFlow is the fastest offline-first billing software built exclusively for Indian SMBs. 14-day free trial, no credit card required.`

---

### Section 1: Navigation Bar (Shared)

> **21st.dev:** Search `navbar` or `animated-navbar`

- **Layout:** Sticky top bar with glassmorphism (`backdrop-blur-xl bg-white/70 dark:bg-black/70`)
- **Left:** BillFlow logo (purple square with offset white "B" + "BillFlow" text)
- **Center links:** Features, Pricing, How It Works, About, Blog
- **Right:** Theme toggle (sun/moon) + "Start Free Trial" button (gradient `--gradient-cta`)
- **Mobile:** Hamburger icon → full-screen slide-in menu with staggered item entrance
- **Animation:** Nav links have subtle underline slide-in on hover. The entire navbar becomes solid background on scroll (`scroll > 50px`).

---

### Section 2: Hero Section

> **21st.dev:** Search `hero-section-dark` or `animated-hero`

- **Background:** Deep gradient mesh from `#0f0a2e` → `#1a0e3e` → `#0c1445` with subtle floating particle dots (Framer Motion)
- **Layout:** Two columns on desktop. Left column = text content. Right column = floating 3D laptop mockup showing BillFlow dashboard screenshot.

**Left Column Content:**

```
Badge (pill): "🇮🇳 Made for India" (animated fade-in)

Headline (display):
"Billing that flows.
GST that just works."

Subheadline (body):
"Create professional GST-compliant invoices in seconds.
BillFlow is the fastest offline-first billing software built
exclusively for Indian small and medium businesses."

CTA Buttons (side by side):
[Start 14-Day Free Trial] → gradient button, primary
[Watch Demo →] → ghost/outline button, secondary

Trust line (small text):
"No credit card required · Full access for 14 days · Cancel anytime"
```

**Right Column:**
- Floating laptop/desktop mockup (use CSS `perspective` and `rotateY(-8deg) rotateX(5deg)`) showing a screenshot of the BillFlow dashboard with revenue charts and invoice list
- Subtle floating glow behind the mockup (`radial-gradient`)
- Small floating cards orbiting the mockup:
  - "₹2,47,500 Collected" (green badge)
  - "GSTR-1 Ready ✓" (blue badge)
  - "12 Invoices Sent" (purple badge)

**Animations:**
- Headline: `blur-fade-in` from bottom (stagger each line by 100ms)
- Subheadline: Fade in 200ms after headline
- CTA buttons: Slide up with spring physics
- Laptop mockup: Float in from right with slight rotation
- Floating badges: Delayed fade-in + continuous subtle `float` animation (translateY ±8px, 3s infinite)

---

### Section 3: Logo/Trust Cloud

> **21st.dev:** Search `logo-cloud` or `marquee`

- **Heading:** `"Trusted technologies powering BillFlow"`
- **Layout:** Infinite horizontal marquee (right-to-left auto-scroll)
- **Logos (grayscale, colored on hover):** Supabase, n8n, Electron, SQLite, Node.js, Stripe, Tailwind CSS, React
- **Animation:** Continuous CSS marquee. Each logo transitions from `grayscale(100%) opacity(0.4)` to `grayscale(0) opacity(1)` on hover.

---

### Section 4: Key Benefits / Value Propositions

> **21st.dev:** Search `bento-grid` or `feature-section-with-bento-grid`

- **Heading:** `"Everything Indian businesses need to bill smarter"`
- **Subheading:** `"BillFlow combines the speed of offline-first software with the power of cloud automation — all tailored for Indian GST compliance."`

**Bento Grid Layout (2×3 on desktop, 1 column on mobile):**

| Card | Icon | Title | Description |
|---|---|---|---|
| **Large (spans 2 cols)** | `⚡` | "Lightning-Fast Invoicing" | "Create and send professional GST-compliant invoices in under 30 seconds. Our local-first architecture means zero loading screens — your data is always instant." |
| **Standard** | `🔒` | "Bank-Grade Security" | "AES-256 encryption protects your business data locally. Row-Level Security on the cloud ensures complete tenant isolation. Your data, your control." |
| **Standard** | `📊` | "Automatic GST Calculations" | "CGST, SGST, IGST — automatically computed based on your business state and customer location. HSN/SAC codes, tax slabs, and inter/intra-state rules handled for you." |
| **Standard** | `☁️` | "Works Offline, Syncs Online" | "Bill your customers even without internet. BillFlow stores everything locally and syncs seamlessly to the cloud when you're back online. Never lose a transaction." |
| **Standard** | `🤖` | "22 Automated Workflows" | "From sending invoice emails to WhatsApp payment reminders to monthly GST filing alerts — BillFlow automates repetitive tasks so you can focus on your business." |
| **Large (spans 2 cols)** | `📱` | "Multi-Channel Communication" | "Send invoices and payment reminders via Email, WhatsApp, and SMS — all from one place. Automated escalation sequences ensure you get paid on time, every time." |

**Animation:** Each card uses `scroll-reveal` (fade-in + slide-up, staggered by 80ms). On hover, cards have a subtle `spotlight` effect (mouse-following gradient glow on the border).

---

### Section 5: Product Screenshot Showcase

> **21st.dev:** Search `device-mockup` or `laptop-mockup`

- **Heading:** `"See BillFlow in action"`
- **Layout:** Full-width centered section with a large, tilted desktop mockup screenshot
- **Screenshot shows:** The main BillFlow invoice creation screen with a filled-out invoice, GST breakdown, and customer details
- **Behind the mockup:** Soft gradient blob background (`#5046e6` at 10% opacity, blurred 100px)
- **Below the mockup:** Three small feature pills:
  - "✨ Glassmorphism UI"
  - "🌙 Dark & Light Modes"
  - "📄 PDF Export Ready"
- **Animation:** The mockup slides in from below on scroll with a slight 3D tilt effect. Feature pills stagger-fade in.

---

### Section 6: Metrics / Social Proof

> **21st.dev:** Search `stats-section` or `animated-counter`

- **Background:** Subtle gradient stripe or different surface color to break visual flow
- **Layout:** 4 columns of large animated numbers

| Metric | Value | Label |
|---|---|---|
| `22+` | Automated Workflows | `Across email, WhatsApp & SMS` |
| `100%` | GST Compliant | `CGST, SGST, IGST, GSTR-1` |
| `<1s` | Invoice Generation | `Local-first = instant speed` |
| `14` | Day Free Trial | `No credit card required` |

**Animation:** Numbers count up from 0 when the section enters the viewport (Intersection Observer + `useSpring` from Framer Motion). Each counter triggers with a 150ms stagger.

---

### Section 7: Testimonials

> **21st.dev:** Search `animated-testimonials` or `testimonial-carousel`

- **Heading:** `"Loved by businesses across India"`
- **Layout:** Horizontal scrolling carousel with 3 visible cards at a time (1 on mobile)

**Testimonial Cards (placeholder content — replace with real testimonials):**

| Name | Role | Company | Quote |
|---|---|---|---|
| Rajesh Mehta | Owner | Mehta Textiles, Surat | "BillFlow cut our invoicing time by 80%. The GST calculations are spot-on and the WhatsApp reminders actually get us paid faster." |
| Priya Sharma | CA | Sharma & Associates, Mumbai | "As a chartered accountant, I recommend BillFlow to all my SMB clients. The GSTR-1 export saves hours of manual work every month." |
| Amit Patel | Director | TechForge Solutions, Ahmedabad | "We were using Excel sheets before. BillFlow's offline-first approach means our warehouse team can bill even without WiFi. Game changer." |
| Sneha Reddy | Founder | Bloom Organics, Hyderabad | "The automated payment reminders via WhatsApp and email have improved our collection rate by 40%. I don't have to chase anyone anymore." |

**Card Design:** White card (`bg-surface`) with left-border accent in `--brand-primary`. Contains: quote text (italic), avatar circle, name (bold), role + company (muted).

**Animation:** Cards auto-scroll every 5 seconds. Manual drag/swipe enabled. Cards fade-in on entry.

---

### Section 8: CTA Banner

> **21st.dev:** Search `cta-section` or `cta-with-gradient`

- **Background:** Full-width gradient from `#5046e6` → `#7c3aed` → `#a855f7` with subtle grid pattern overlay
- **Content (centered):**

```
Heading: "Ready to transform your billing?"
Subheading: "Join thousands of Indian businesses already using BillFlow.
Start your 14-day free trial today — no credit card required."

[Start Free Trial] → white button on gradient background
[Schedule a Demo →] → ghost white-border button
```

**Animation:** The entire section has a slow gradient-shift animation (background-position moves continuously). Text fades in on scroll.

---

### Section 9: Footer (Shared)

> **21st.dev:** Search `footer-section` or `animated-footer`

- **Background:** `#0f172a` (Slate 900) or `bg-zinc-950`
- **Layout:** 4-column grid + bottom bar

| Column 1 | Column 2 | Column 3 | Column 4 |
|---|---|---|---|
| **BillFlow** (logo + tagline) | **Product** | **Company** | **Legal** |
| "Billing that flows. GST that just works." | Features | About Us | Privacy Policy |
| Social icons: Twitter, LinkedIn, GitHub, YouTube | Pricing | Contact | Terms of Service |
| | How It Works | Blog | Refund Policy |
| | Download | Careers | Cookie Policy |
| | Changelog | Press Kit | |

**Bottom bar:** `"© 2026 BillFlow. All rights reserved. Made with ❤️ in India 🇮🇳"`

**Animation:** Footer columns stagger-fade-in on scroll.

---

## 5. Page 2 — Features

**Route:** `/features`
**Meta Title:** `Features — BillFlow | Complete GST Billing & Automation`
**Meta Description:** `Explore every feature of BillFlow — from instant GST-compliant invoicing to automated WhatsApp reminders, offline sync, PDF exports, and complete tax management.`

---

### Section 1: Hero

- **Heading:** `"Packed with features your business actually needs"`
- **Subheading:** `"Every feature in BillFlow was designed by talking to real Indian business owners. No bloat, no complexity — just powerful tools that save you time and money."`
- **Background:** Subtle dot grid pattern

---

### Section 2: Feature Deep-Dive (Alternating Layout)

> **21st.dev:** Search `feature-section` or `features-with-image`

Each feature block alternates: image left + text right, then text left + image right.

#### Feature 1: GST-Compliant Invoicing
- **Image:** Screenshot of invoice creation form with GST breakdown visible
- **Title:** "Professional GST Invoices in Seconds"
- **Description:** "Create beautiful, legally compliant invoices with automatic CGST, SGST, and IGST calculations. BillFlow automatically determines the correct tax treatment based on your business state and your customer's location — intrastate or interstate, it just works."
- **Bullet points:**
  - ✅ Auto-detect supply type (intra/inter-state)
  - ✅ HSN/SAC code lookup with validation
  - ✅ Multiple tax slab support (5%, 12%, 18%, 28%)
  - ✅ Nil-rated and exempt item handling
  - ✅ Indian number formatting (lakhs & crores)

#### Feature 2: Offline-First Architecture
- **Image:** Illustration showing laptop with WiFi-off icon → arrow → cloud sync
- **Title:** "Works Without Internet. Syncs When Ready."
- **Description:** "BillFlow stores all your data locally on your computer using an encrypted database. Create invoices, manage customers, and track payments — even in areas with poor connectivity. When you're back online, everything syncs automatically to the cloud."
- **Bullet points:**
  - ✅ Local encrypted database
  - ✅ Automatic background sync queue
  - ✅ Zero data loss — every transaction cached
  - ✅ Cloud backup with full security

#### Feature 3: Automated Communications
- **Image:** Mockup showing email, WhatsApp, and SMS notification examples
- **Title:** "Email, WhatsApp & SMS — Automated"
- **Description:** "Stop manually chasing payments. BillFlow automatically sends invoices via email, payment reminders through WhatsApp, and confirmation SMS messages — all without you lifting a finger. Set it up once, and let the system work for you."
- **Bullet points:**
  - ✅ Invoice delivery via email with PDF attachment
  - ✅ WhatsApp payment reminders
  - ✅ DLT-compliant SMS notifications
  - ✅ Configurable reminder schedules (7, 3, 1 day before due)

#### Feature 4: 22 Automation Workflows
- **Image:** Abstract workflow diagram (node-graph style, NOT showing actual internal screenshots)
- **Title:** "22 Workflows Running in the Background"
- **Description:** "BillFlow comes with 22 pre-built automation workflows that handle everything from syncing your data to the cloud, sending overdue escalation notices, generating weekly aging reports, to preparing your monthly GSTR-1 filing data."
- **Key workflows highlighted (marketing-friendly names):**
  - 🔄 Auto-Sync — Real-time cloud backup
  - 📧 Smart Invoice Delivery — Email + WhatsApp + SMS
  - ⏰ Payment Reminder Sequences — Automated escalation
  - 📊 Weekly Business Reports — Delivered to your inbox
  - 🧾 Monthly GST Filing Alerts — Never miss a deadline
  - 💰 Payment Confirmation — Instant receipts to customers

#### Feature 5: Professional PDF Invoices
- **Image:** Screenshot of a generated PDF invoice (clean, professional template)
- **Title:** "Beautiful PDF Invoices, Generated Locally"
- **Description:** "Generate print-ready PDF invoices with your business logo, GST details, bank information, and complete tax breakdowns. PDFs are created instantly on your computer — no internet required, no cloud processing delays."
- **Bullet points:**
  - ✅ Custom business logo and branding
  - ✅ Complete GST breakdown (CGST/SGST/IGST)
  - ✅ Bank account details for easy payments
  - ✅ Amount in words (Indian format)
  - ✅ HSN/SAC codes on every line item

#### Feature 6: Security & Data Protection
- **Image:** Shield icon with lock, encryption visualization
- **Title:** "Your Data. Your Control. Bank-Grade Security."
- **Description:** "BillFlow encrypts your business data locally with industry-standard encryption before it ever touches the cloud. On the server side, strict security policies ensure absolute tenant isolation — no one else can ever see your data."
- **Bullet points:**
  - ✅ Industry-standard local encryption
  - ✅ Derived encryption keys per user
  - ✅ Row-Level Security on cloud database
  - ✅ Strict Content Security Policies
  - ✅ Sandboxed application architecture

#### Feature 7: Tax Management & GSTR-1
- **Image:** Screenshot of GST summary report with monthly tax breakdown
- **Title:** "Tax Season? We've Got You Covered."
- **Description:** "BillFlow automatically tracks every tax record for every invoice. View monthly GST summaries, categorize by supply type, and export GSTR-1-ready data — making your CA's job 10x easier."
- **Bullet points:**
  - ✅ Automatic tax record creation per invoice
  - ✅ Monthly CGST / SGST / IGST summaries
  - ✅ GSTR-1 export-ready data
  - ✅ Year-at-a-glance tax dashboard
  - ✅ Intrastate vs interstate breakdowns

---

### Section 3: Feature Comparison Table

> **21st.dev:** Search `comparison-table` or `feature-comparison`

**Heading:** `"BillFlow vs the alternatives"`

| Feature | BillFlow | Tally | Zoho Invoice | Vyapar |
|---|---|---|---|---|
| Works Offline | ✅ Full offline | ❌ | ❌ | ✅ Partial |
| Automatic GST | ✅ | ✅ | ✅ | ✅ |
| WhatsApp Reminders | ✅ Automated | ❌ | ❌ | ✅ Manual |
| Email + SMS Alerts | ✅ Automated | ❌ | ✅ Email only | ✅ Partial |
| Cloud Sync | ✅ Automatic | ❌ | ✅ Cloud-only | ✅ |
| Data Encryption | ✅ Bank-grade | ❌ | ✅ Server-side | ❌ |
| GSTR-1 Export | ✅ | ✅ | ✅ | ✅ |
| Automation Workflows | ✅ 22 workflows | ❌ | ❌ | ❌ |
| PDF Invoices | ✅ Local generation | ✅ | ✅ | ✅ |
| 14-Day Free Trial | ✅ Full access | ❌ | ✅ Limited | ✅ Limited |
| **Pricing** | **₹499/mo** | **₹18,000/yr** | **₹749/mo** | **₹399/mo** |

> **Important:** Highlight BillFlow column with `--brand-primary` background tint. Use ✅ in green and ❌ in red/muted.

---

## 6. Page 3 — Pricing

**Route:** `/pricing`
**Meta Title:** `Pricing — BillFlow | Simple, Transparent Pricing for Indian SMBs`
**Meta Description:** `Start free for 14 days with full access. BillFlow pricing starts at ₹499/month — no hidden fees, no feature limits, no surprises.`

---

### Section 1: Pricing Hero

- **Heading:** `"Simple pricing. No surprises."`
- **Subheading:** `"Start with a 14-day free trial — full access, no credit card required. When you're ready, pick the plan that fits your business."`
- **Toggle:** Monthly / Annual (annual shows "Save 20%" badge)

---

### Section 2: Pricing Cards

> **21st.dev:** Search `pricing-section` or `pricing-cards`

**Layout:** 3 cards side by side (stacked on mobile)

#### Plan 1: Starter
- **Price:** ₹499/month (₹4,790/year = ₹399/mo billed annually)
- **Badge:** None
- **Description:** "Perfect for solo entrepreneurs and freelancers"
- **Features:**
  - ✅ Unlimited invoices
  - ✅ Full GST compliance
  - ✅ PDF invoice generation
  - ✅ Offline-first with cloud sync
  - ✅ Email invoice delivery
  - ✅ Basic automation (5 workflows)
  - ✅ Community support
  - ❌ WhatsApp & SMS
  - ❌ Priority support
- **CTA:** "Start Free Trial"

#### Plan 2: Professional ⭐ (Recommended)
- **Price:** ₹999/month (₹9,590/year = ₹799/mo billed annually)
- **Badge:** "Most Popular" (gradient pill)
- **Description:** "Built for growing businesses that need full automation"
- **Card Style:** Slightly larger, elevated with gradient border glow (`--gradient-cta`)
- **Features:**
  - ✅ Everything in Starter
  - ✅ All 22 automation workflows
  - ✅ WhatsApp payment reminders
  - ✅ SMS notifications (DLT-compliant)
  - ✅ Automated payment escalation
  - ✅ Weekly business reports
  - ✅ Monthly GST filing alerts
  - ✅ Priority email support
  - ✅ GSTR-1 export
- **CTA:** "Start Free Trial" (gradient button)

#### Plan 3: Enterprise
- **Price:** "Custom" (or ₹2,499/month)
- **Badge:** None
- **Description:** "For established businesses with custom requirements"
- **Features:**
  - ✅ Everything in Professional
  - ✅ Multi-user / multi-device support
  - ✅ Custom automation workflows
  - ✅ Dedicated account manager
  - ✅ SLA guarantee (99.9% uptime)
  - ✅ Custom invoicing & contracts
  - ✅ On-call phone support
  - ✅ Data migration assistance
- **CTA:** "Contact Sales"

---

### Section 3: FAQ Section

> **21st.dev:** Search `faq-section` or `accordion`

**Heading:** `"Frequently asked questions"`

| Question | Answer |
|---|---|
| "Is my data safe?" | "Absolutely. BillFlow encrypts your data locally with industry-standard encryption before it ever leaves your computer. On the cloud, strict security policies ensure complete tenant isolation. Your data is yours — always." |
| "Do I need internet to use BillFlow?" | "No. BillFlow is offline-first. You can create invoices, manage customers, and track payments without any internet connection. When connectivity is available, your data syncs automatically to the cloud." |
| "What happens after my 14-day trial?" | "After 14 days, you'll need to subscribe to continue using BillFlow. Your data is preserved for 30 days after trial expiry, so you won't lose anything. Simply add a payment method to continue seamlessly." |
| "Can I export data for my CA?" | "Yes. BillFlow generates GSTR-1-ready export data and provides monthly tax summaries that your chartered accountant can directly use for filings." |
| "What payment methods do you accept?" | "We accept all major credit/debit cards, UPI, and net banking through our secure payment partner." |
| "Can I cancel anytime?" | "Yes, you can cancel your subscription at any time. There are no long-term contracts or cancellation fees. You'll retain access until the end of your billing period." |
| "Do you offer discounts for annual billing?" | "Yes! Save 20% when you choose annual billing on any plan." |
| "Is BillFlow compliant with Indian GST laws?" | "Yes. BillFlow handles CGST, SGST, IGST calculations, HSN/SAC codes, tax slab rates (5%, 12%, 18%, 28%), and generates GSTR-1-compatible export data." |

---

## 7. Page 4 — How It Works

**Route:** `/how-it-works`
**Meta Title:** `How It Works — BillFlow | From Install to Invoice in 5 Minutes`
**Meta Description:** `See how BillFlow works — download, set up your business profile, create your first invoice, and let automation handle the rest. Get started in under 5 minutes.`

---

### Section 1: Steps Timeline

> **21st.dev:** Search `steps-section` or `timeline`

**Heading:** `"From download to your first invoice — in 5 minutes"`
**Subheading:** `"BillFlow is designed to get out of your way. Here's how it works:"`

**Layout:** Vertical timeline with alternating left/right content blocks and a connecting line.

#### Step 1: Download & Install
- **Icon:** `Download` (Lucide)
- **Title:** "Download BillFlow"
- **Description:** "Download the BillFlow desktop application for Windows. The installer is under 80MB and takes less than 2 minutes to set up."
- **Visual:** Download button mockup

#### Step 2: Set Up Your Business
- **Icon:** `Building` (Lucide)
- **Title:** "Enter Your Business Details"
- **Description:** "Add your business name, GSTIN, address, state code, PAN, and bank details. This information automatically appears on every invoice you generate."
- **Visual:** Screenshot of settings/profile page (sanitized)

#### Step 3: Add Customers & Items
- **Icon:** `Users` (Lucide)
- **Title:** "Add Your Customers & Product Catalog"
- **Description:** "Create your customer database with their GST details and state codes. Add your products or services with HSN/SAC codes and default tax rates."
- **Visual:** Screenshot of customer list (sanitized)

#### Step 4: Create Your First Invoice
- **Icon:** `FileText` (Lucide)
- **Title:** "Create & Send Invoices"
- **Description:** "Select a customer, add line items, and BillFlow handles everything else — GST calculations, PDF generation, and delivery via email, WhatsApp, or SMS."
- **Visual:** Screenshot of invoice form (sanitized)

#### Step 5: Let Automation Work
- **Icon:** `Zap` (Lucide)
- **Title:** "Sit Back — Automation Takes Over"
- **Description:** "BillFlow's 22 built-in workflows automatically send payment reminders, sync your data to the cloud, generate weekly reports, and prepare your monthly GST filing data."
- **Visual:** Abstract automation flow diagram

**Animation:** Each step reveals on scroll with a connecting line that draws itself (SVG path animation). Steps alternate fade-in from left and right.

---

### Section 2: Architecture Overview (Customer-Friendly)

> This section shows a simplified, non-technical view of how BillFlow works — without exposing source code or internal details.

**Heading:** `"How BillFlow keeps your business running"`

**Layout:** Horizontal flow diagram (or Bento grid) with 4 connected blocks:

```
[Your Computer]  →  [BillFlow App]  →  [Automation Engine]  →  [Cloud Backup]
  "Fast local       "Invoicing,        "Email, WhatsApp,      "Secure backup,
   storage"          GST, PDFs"         SMS, Reports"          multi-device"
```

> **Important:** Do NOT mention specific technologies like "SQLite", "n8n", "Electron", or "Supabase" in this customer-facing section. Use generic terms like "local database", "automation engine", "cloud storage".

---

## 8. Page 5 — About Us

**Route:** `/about`
**Meta Title:** `About BillFlow — Built in India, for Indian Businesses`
**Meta Description:** `BillFlow was born from a simple frustration — Indian SMBs deserve billing software that actually understands their needs. Learn our story.`

---

### Section 1: Story

**Heading:** `"Built by Indians, for Indian businesses"`

**Content (2 paragraphs):**

> "BillFlow was born from a simple frustration: why does billing software for Indian businesses still feel like it was designed in 2005? We watched small business owners struggle with clunky, outdated tools that charged premium prices but couldn't even handle basic GST calculations correctly."

> "We set out to build something different — a billing application that's as fast as a native desktop app, as smart as a cloud service, and as automated as a Fortune 500 enterprise system. The result is BillFlow: local-first, GST-native, and automation-powered billing software that genuinely saves Indian SMBs time and money."

---

### Section 2: Values

**Layout:** 3-column card grid

| Value | Icon | Description |
|---|---|---|
| **Speed First** | ⚡ | "We believe business software should never make you wait. BillFlow runs on your computer, not in a browser tab — that means instant response times, always." |
| **India Native** | 🇮🇳 | "BillFlow isn't a global product localized for India. It was built from day one for Indian tax laws, Indian number formats, and Indian business workflows." |
| **Privacy by Design** | 🔒 | "Your business data is encrypted before it leaves your computer. We can't read your invoices, your customer details, or your revenue numbers. And that's by design." |

---

### Section 3: Team

- **Heading:** `"The team behind BillFlow"`
- **Layout:** Team member cards with photo, name, role, and a one-line bio
- **Note:** Populate with actual team members when available

---

## 9. Page 6 — Contact & Support

**Route:** `/contact`
**Meta Title:** `Contact Us — BillFlow Support`
**Meta Description:** `Have a question about BillFlow? Get in touch — we typically respond within 24 hours.`

---

### Section 1: Contact Form

> **21st.dev:** Search `contact-section` or `contact-form`

**Layout:** Two columns — left is form, right is contact info

**Form Fields:**
- Full Name (required)
- Email Address (required)
- Company Name (optional)
- Subject (dropdown: General Inquiry / Technical Support / Billing / Partnership / Feature Request)
- Message (textarea, required)
- Submit button: "Send Message"

**Right Column — Contact Info:**
- 📧 Email: `support@billflow.in`
- 📱 Phone: `+91 98XXX XXXXX` (fill with real number)
- 📍 Location: `Ahmedabad, Gujarat, India`
- 🕐 Response Time: `Typically within 24 hours`
- Social links: Twitter, LinkedIn, GitHub

---

### Section 2: Support Resources

**Layout:** 3-card grid

| Card | Title | Description | Link |
|---|---|---|---|
| 📖 | Documentation | Step-by-step guides for setup, configuration, and troubleshooting | `/docs` |
| 💬 | Community Forum | Join the community to ask questions and share tips | Link |
| 📹 | Video Tutorials | Watch walkthrough videos of every BillFlow feature | YouTube link |

---

## 10. Page 7 — Blog / Resources

**Route:** `/blog`
**Meta Title:** `Blog — BillFlow | GST Tips, Business Insights & Product Updates`
**Meta Description:** `Read the latest from BillFlow — GST compliance tips, billing best practices, product updates, and insights for Indian SMBs.`

---

### Layout

> **21st.dev:** Search `blog-card` or `article-preview`

**Heading:** `"Insights for Indian businesses"`
**Subheading:** `"GST compliance tips, billing best practices, and product updates from the BillFlow team."`

**Layout:** 3-column card grid (2 on tablet, 1 on mobile)

**Sample Blog Posts (create actual content later):**

| Title | Category | Excerpt |
|---|---|---|
| "Complete Guide to GSTR-1 Filing for SMBs" | GST Compliance | "Everything you need to know about GSTR-1 — what it is, when it's due, and how BillFlow makes filing effortless." |
| "5 Ways to Get Paid Faster in India" | Business Tips | "From WhatsApp reminders to early payment discounts — practical tips for improving your cash flow." |
| "BillFlow v1.0 Launch — What's Inside" | Product Updates | "Introducing BillFlow — the billing software Indian SMBs have been waiting for. Here's everything in our launch release." |
| "Understanding HSN Codes: A Quick Reference" | GST Compliance | "A business-friendly guide to HSN codes — what they are, why they matter, and how to find the right one." |
| "Offline-First: Why Your Billing Software Should Work Without Internet" | Technology | "Why we chose an offline-first architecture for BillFlow, and why it matters for businesses in India." |
| "Automating Payment Reminders: The Complete Guide" | Automation | "How to set up automated payment reminders via email, WhatsApp, and SMS using BillFlow." |

**Card Design:** Thumbnail image (top), category pill, title (bold), excerpt (2 lines truncated), "Read More →" link, publish date.

---

## 11. Page 8 — Privacy Policy & Terms

**Route:** `/privacy` and `/terms`

Standard legal pages. Use clean typography, clear headings, and a table of contents sidebar.

### Privacy Policy Key Sections:
1. Data We Collect
2. How We Use Your Data
3. Data Encryption & Storage
4. Third-Party Services
5. Your Rights (Data export, deletion)
6. Contact for Privacy Concerns

### Terms of Service Key Sections:
1. Acceptance of Terms
2. Account Registration
3. Trial Period & Subscription
4. Payment Terms
5. Acceptable Use
6. Intellectual Property
7. Limitation of Liability
8. Termination
9. Governing Law (India)

---

## 12. Page 9 — Download / Get Started

**Route:** `/download`
**Meta Title:** `Download BillFlow — Free 14-Day Trial`
**Meta Description:** `Download BillFlow for Windows and start creating GST-compliant invoices in minutes. Free 14-day trial with full access.`

---

### Section 1: Download Hero

**Heading:** `"Download BillFlow"`
**Subheading:** `"Get started with a 14-day free trial. Full access, no credit card required."`

**Download Cards:**

| Platform | Status | Button |
|---|---|---|
| 🪟 Windows 10/11 | Available | `[Download for Windows]` (primary gradient button) |
| 🍎 macOS | Coming Soon | `[Notify Me]` (disabled/ghost button) |
| 🐧 Linux | Coming Soon | `[Notify Me]` (disabled/ghost button) |

**System Requirements:**
- Windows 10 or higher
- 4GB RAM minimum
- 200MB disk space
- Internet connection for initial setup (offline use after setup)

---

### Section 2: Quick Start Guide

**Heading:** `"Up and running in 3 steps"`

1. **Download** → Download and install BillFlow
2. **Sign In** → Create your account or sign in with your credentials
3. **Start Billing** → Set up your business profile and create your first invoice

---

## 13. Shared Components

These components appear on multiple pages:

### 13.1 Announcement Bar (Optional)
- Thin bar at the very top of the page
- Content: "🎉 BillFlow is now live! Start your 14-day free trial → [Get Started]"
- Dismissible with an `X` button
- Gradient background: `--gradient-hero`

### 13.2 Floating CTA
- A small floating action button that appears in the bottom-right corner after scrolling past the hero section
- Content: "Start Free Trial" with an arrow icon
- Hides when footer is visible
- Has a subtle pulse animation

### 13.3 Cookie Consent Banner
- Minimal bottom banner
- "We use cookies to improve your experience. [Accept] [Learn More]"

---

## 14. Animation & Interaction Guidelines

### 14.1 Global Animation Rules

| Trigger | Animation | Duration | Easing |
|---|---|---|---|
| Page load | Staggered fade-in from top | 300-600ms | `ease-out` |
| Scroll into view | Slide-up + fade-in | 500ms | `cubic-bezier(0.16, 1, 0.3, 1)` |
| Button hover | Scale up 1.02 + shadow increase | 200ms | `ease-in-out` |
| Card hover | Translate Y -4px + shadow increase | 200ms | `ease-out` |
| Link hover | Underline slide-in from left | 300ms | `ease-out` |
| Page transition | Fade out → Fade in | 200ms | `ease-in-out` |
| Number counter | Count from 0 to target | 1500ms | `ease-out` (decelerate) |
| Marquee (logos) | Continuous linear scroll | 30s loop | `linear` |

### 14.2 Framer Motion Presets

```jsx
// Fade in from below
const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
}

// Stagger children
const staggerContainer = {
  animate: { transition: { staggerChildren: 0.08 } }
}

// Scale on hover
const hoverScale = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.98 }
}
```

### 14.3 Scroll-Triggered Animations

Use `framer-motion`'s `useInView` hook with `once: true` to trigger animations only on first scroll into view. Set `margin: "-100px"` for early trigger.

### 14.4 Micro-Interactions

- **Buttons:** Subtle gradient shift on hover + pressed state (scale 0.98)
- **Cards:** Border glow effect using `box-shadow` transition on hover
- **Nav links:** Underline width animates from 0% to 100% on hover
- **Toggle switches:** Spring physics with overshoot (`type: "spring", stiffness: 300, damping: 20`)
- **Floating elements:** Continuous subtle float (`translateY: [0, -8px, 0]`, duration: 3s, repeat: Infinity)
- **Spotlight effect on cards:** Track mouse position relative to card, render a radial gradient that follows the cursor

---

## 15. SEO & Performance

### 15.1 Technical SEO

| Item | Implementation |
|---|---|
| **Sitemap** | Auto-generate `sitemap.xml` with Next.js `generateSitemap()` |
| **Robots.txt** | Allow all crawlers, disallow `/api/` routes |
| **Canonical URLs** | Set `<link rel="canonical">` on every page |
| **Open Graph** | Include `og:title`, `og:description`, `og:image` for social sharing |
| **Twitter Cards** | `twitter:card = summary_large_image` |
| **Structured Data** | JSON-LD for `SoftwareApplication`, `FAQPage`, `Organization` |
| **Alt Text** | Every image must have descriptive alt text |
| **Heading Hierarchy** | One `<h1>` per page, proper nesting |

### 15.2 Performance Targets

| Metric | Target |
|---|---|
| Lighthouse Performance | > 95 |
| First Contentful Paint | < 1.2s |
| Largest Contentful Paint | < 2.5s |
| Cumulative Layout Shift | < 0.05 |
| Total Bundle Size | < 200KB (gzipped JS) |

### 15.3 Performance Techniques

- **Image optimization:** Use Next.js `<Image>` with automatic WebP/AVIF conversion
- **Font loading:** Use `next/font` for Inter with `display: swap`
- **Code splitting:** Lazy load below-fold sections with `dynamic()` imports
- **Animation budget:** Disable complex animations on `prefers-reduced-motion: reduce`
- **Edge caching:** Deploy on Vercel with ISR for blog pages

---

## Summary

This website consists of **9 pages** with the following structure:

| # | Page | Route | Primary 21st.dev Components |
|---|---|---|---|
| 1 | **Homepage** | `/` | `hero-section-dark`, `bento-grid`, `marquee`, `animated-testimonials`, `cta-section`, `animated-footer` |
| 2 | **Features** | `/features` | `features-with-image`, `comparison-table`, `bento-grid` |
| 3 | **Pricing** | `/pricing` | `pricing-section`, `faq-section` |
| 4 | **How It Works** | `/how-it-works` | `steps-section`, `timeline` |
| 5 | **About** | `/about` | `stats-section`, team cards |
| 6 | **Contact** | `/contact` | `contact-form`, card grid |
| 7 | **Blog** | `/blog` | `blog-card`, `article-preview` |
| 8 | **Legal** | `/privacy`, `/terms` | Prose typography |
| 9 | **Download** | `/download` | `cta-section`, download cards |

> **Security Reminder:** This website must **never** expose source code, file paths, database schemas, API keys, cloud URLs, webhook endpoints, encryption algorithms, or any internal architecture details. All technical descriptions should be customer-friendly abstractions (e.g., "encrypted database" not "AES-256-GCM with PBKDF2-derived keys via better-sqlite3").

---

*Last updated: June 2026 — BillFlow Marketing Team*
