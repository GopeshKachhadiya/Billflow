# BillFlow — Website Design Specification
## "The Digital Ledger" · Paper & Ink Aesthetic

> **Build Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · Framer Motion · shadcn/ui
> **Component Sources:** 21st.dev · Aceternity UI · Magic UI · Motion Primitives
> **Hosting:** Vercel (recommended)
> **No source code, no architecture details leaked. Customer-facing only.**

---

## TABLE OF CONTENTS

```
1.  Design Philosophy & Brand Story
2.  Design System (Colors · Typography · Textures · Motion)
3.  Component Source Map (21st.dev, Aceternity, Magic UI)
4.  Site Architecture & Navigation
5.  PAGE 1 — Home / Landing (/)
6.  PAGE 2 — Features (/features)
7.  PAGE 3 — How It Works (/how-it-works)
8.  PAGE 4 — Pricing (/pricing)
9.  PAGE 5 — Download & Trial (/download)
10. PAGE 6 — About (/about)
11. PAGE 7 — Contact & Support (/contact)
12. PAGE 8 — Blog / Resources (/blog)
13. Global Components (Navbar · Footer · Shared)
14. Animation Playbook (Framer Motion Specs)
15. Responsive Breakpoints
16. SEO & Metadata
17. Customer Journey Map
```

---

## 1. DESIGN PHILOSOPHY & BRAND STORY

### The Core Metaphor: "The Digital Bahi-Khata"

Every Indian shopkeeper, trader, and small business owner knows the *bahi-khata* — the cloth-bound account ledger that sits behind the counter, holds every transaction, and never loses data. BillFlow is that ledger's digital descendant.

The website should feel like picking up a beautifully crafted, high-quality stationery notebook. When you open it, the pages are cream and clean. The text is printed in rich, dark ink. Numbers are precise, monospaced, authoritative. Rubber stamps say "PAID." Ruled lines guide the eye. There is no clutter, no neon, no startup-blue.

This aesthetic serves two purposes:
- **Familiarity**: The traditional business owner immediately recognises the visual language. It's not intimidating — it's comfortable.
- **Differentiation**: Every other GST software looks the same (dark dashboards, teal gradients, app-store screenshots). BillFlow looks like craft, like quality, like permanence.

### What the Website Must Communicate

1. **Ease**: "You already know how to use paper. This is even easier."
2. **Reliability**: "Works even when the internet is down. Your data is always safe."
3. **Compliance**: "GST-ready. Proper bills. No worries at tax time."
4. **Speed**: "A GST invoice in 30 seconds, sent to your customer's phone."
5. **Trust**: "Built for Indian businesses. Understands how you work."

### What the Website Must NEVER Show

- Source code snippets or technical architecture
- Backend system names (n8n, Supabase, SQLite, Electron)
- API keys, endpoints, or webhook URLs
- Internal data structure details
- Admin panel credentials or access
- Specific library versions or dependencies

---

## 2. DESIGN SYSTEM

### 2.1 Color Palette

```
PAPER TONES (Backgrounds)
━━━━━━━━━━━━━━━━━━━━━━━━━
  cream-lightest: #FDFAF4   → Page background, hero section
  cream-light:    #FAF6EB   → Section alternate background
  cream-mid:      #F2EBD6   → Card backgrounds, elevated surfaces
  cream-warm:     #E8DFC4   → Hover states, selected items
  cream-border:   #D4C9A8   → Borders, ruled lines, dividers
  cream-strong:   #B5A882   → Placeholder text, ornamental lines

INK TONES (Text & UI)
━━━━━━━━━━━━━━━━━━━━━
  ink-900: #1C1208   → Primary headings, hero text (darkest ink)
  ink-800: #2D1E0F   → Body text, paragraph copy
  ink-700: #3D2E18   → Subheadings, secondary labels
  ink-500: #7A6850   → Muted text, captions, metadata
  ink-300: #B5A882   → Placeholder, disabled states

ACCENT COLORS
━━━━━━━━━━━━━━━
  fountain-blue:   #1E3A5F   → Primary CTA buttons, links, active nav
  fountain-blue-lt: #2B4F7A  → Button hover states
  rubber-red:      #8B3A2A   → Badges, "Overdue" tags, urgency
  ledger-green:    #2C5F2E   → "Paid" badges, success states
  aged-gold:       #8B7233   → Premium features, highlights, sparkle
  indigo-ink:      #2D3561   → Alternate accent for variety

UTILITY
━━━━━━━
  white:       #FFFFFF   → Modals, popover backgrounds
  shadow-warm: rgba(28, 18, 8, 0.08)  → Card shadows (ink-tinted, not gray)
  overlay:     rgba(28, 18, 8, 0.45)  → Modal overlays
```

**Tailwind CSS Custom Config:**
```js
// tailwind.config.ts
colors: {
  paper: {
    50:  '#FDFAF4',
    100: '#FAF6EB',
    200: '#F2EBD6',
    300: '#E8DFC4',
    400: '#D4C9A8',
    500: '#B5A882',
  },
  ink: {
    300: '#B5A882',
    500: '#7A6850',
    700: '#3D2E18',
    800: '#2D1E0F',
    900: '#1C1208',
  },
  fountain: { DEFAULT: '#1E3A5F', light: '#2B4F7A' },
  stamp: {
    red:   '#8B3A2A',
    green: '#2C5F2E',
    gold:  '#8B7233',
  }
}
```

---

### 2.2 Typography

**Google Fonts to Import:**
```css
@import url('https://fonts.googleapis.com/css2?
  family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&
  family=Lora:ital,wght@0,400;0,500;0,600;1,400&
  family=DM+Mono:wght@300;400;500&
  family=Inter:wght@400;500;600;700&
  display=swap');
```

**Type Scale:**
```
Role            Font              Size        Weight    Usage
────────────────────────────────────────────────────────────────────
Display-XL      Playfair Display  72-96px     700       Hero H1
Display-L       Playfair Display  48-64px     600       Section H1
Display-M       Playfair Display  36-48px     600       Sub-headers
Heading-L       Lora              28-32px     600       H2 headings
Heading-M       Lora              22-26px     500       H3 headings
Heading-S       Lora              18-20px     500       H4, card titles
Body-L          Lora              18px        400       Hero description
Body-M          Lora              16px        400       Standard body
Body-S          Lora              14px        400       Captions, meta
UI-Label        Inter             14-16px     500-600   Buttons, nav links
UI-Caption      Inter             12-13px     400       Tags, badges text
Mono-L          DM Mono           20-24px     400       Large bill amounts
Mono-M          DM Mono           14-16px     300-400   Bill numbers, dates
Mono-S          DM Mono           12px        300       Table data
```

**Typography Rules:**
- Headlines: Playfair Display with slight negative letter-spacing (-0.02em)
- Italic variants used for emphasis phrases (not full paragraphs)
- Drop caps (CSS `::first-letter`) on key marketing paragraphs
- Bill numbers, GST amounts always in DM Mono
- Navigation items in Inter Medium (500)
- All-caps only for very short labels (e.g., "NEW", "PAID", "BETA"), letter-spacing: 0.08em

---

### 2.3 Textures & Decorative Elements

**Paper Grain Texture (CSS):**
```css
/* Apply to body or hero sections */
.paper-texture {
  background-image: 
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
  background-repeat: repeat;
}
```

**Ruled Lines (Ledger Effect):**
```css
/* For section backgrounds - like lined paper */
.ledger-lines {
  background-image: repeating-linear-gradient(
    transparent,
    transparent 31px,
    #D4C9A8 31px,
    #D4C9A8 32px
  );
  background-size: 100% 32px;
  opacity: 0.4;
}
```

**Graph Paper Grid (Subtle):**
```css
.graph-paper {
  background-image: 
    linear-gradient(#D4C9A8 1px, transparent 1px),
    linear-gradient(90deg, #D4C9A8 1px, transparent 1px);
  background-size: 24px 24px;
  opacity: 0.3;
}
```

**Decorative Elements (SVG):**
- Ink pen nib icon (hero section logo mark)
- Rubber stamp circle borders (for badges like "14-DAY FREE TRIAL")
- Wax seal effect (for premium/trust badges)
- Paper fold corner effect (for cards)
- Ink splatter (small, subtle, decorative only)
- Ruled ledger lines (horizontal dividers in feature sections)
- Dashed border pattern (like torn paper edge between sections)
- Handwriting-style underline SVG paths (for highlighted keywords)

---

### 2.4 Shadows & Depth

```css
/* Card lifted from paper */
.shadow-paper {
  box-shadow: 
    0 1px 2px rgba(28, 18, 8, 0.06),
    0 4px 12px rgba(28, 18, 8, 0.08),
    0 0 0 1px rgba(212, 201, 168, 0.5);
}

/* Deep card — like a thick ledger */
.shadow-ledger {
  box-shadow:
    0 2px 4px rgba(28, 18, 8, 0.08),
    0 8px 24px rgba(28, 18, 8, 0.12),
    0 0 0 1px rgba(212, 201, 168, 0.6),
    4px 4px 0 rgba(212, 201, 168, 0.8); /* offset for book-spine effect */
}

/* Stamp shadow — flat, no blur */
.shadow-stamp {
  box-shadow: 3px 3px 0 rgba(28, 18, 8, 0.15);
}
```

---

## 3. COMPONENT SOURCE MAP

### 3.1 From 21st.dev
> Browse at: **https://21st.dev**
> Install: `npx shadcn@latest add [component-url]`

| Section | Component | 21st.dev Search Term |
|---------|-----------|---------------------|
| Navigation | Floating Navbar | `21st.dev/community/components/s/navbar` |
| Hero | Animated Hero Section | `21st.dev/community/components/s/hero` |
| Features | Bento Grid | `21st.dev/community/components/s/bento-grid` |
| Pricing | Pricing Section | `21st.dev/community/components/s/pricing` |
| Testimonials | Testimonials | `21st.dev/community/components/s/testimonials` |
| Stats | Number Counter | `21st.dev/community/components/s/numbers` |
| Scroll | Scroll Areas / Infinite Scroll | `21st.dev/community/components/s/scroll-areas` |
| CTA | Call To Action sections | `21st.dev/community/components/s/calls-to-action` |
| Footer | Footer blocks | `21st.dev/community/components/s/footers` |
| Background | Background textures | `21st.dev/community/components/s/backgrounds` |
| Text | Text animations | `21st.dev/community/components/s/texts` |
| Clients/Logos | Logo cloud / Client strip | `21st.dev/community/components/s/clients` |

**Specific Recommended Components on 21st.dev:**
- **`uniquesonu/animated-hero-section-ui`** — Staggered word animation hero *(adapt for ink-write effect)*
- **`mikolajdobrucki/hero-section`** — Clean centered hero with CTA
- **`aceternity/bento-grid`** — Bento grid for features showcase
- **`avanishverma4/bento-grid-01`** — Alt bento layout
- **`designali-in/bento-grid`** — More complex bento with mixed sizes

---

### 3.2 From Aceternity UI
> Browse at: **https://ui.aceternity.com/components**

| Component | Usage in BillFlow Site |
|-----------|----------------------|
| **Background Beams** | Hero section background (tint to cream, not dark) |
| **Aurora Background** | Soft, warm glow behind hero — tinted amber/cream |
| **Spotlight** | Highlight key feature cards on hover |
| **Wavy Background** | Section dividers between features |
| **Text Generate Effect** | Hero headline appearing like ink being written |
| **Typewriter Effect** | Subheadline: rotating "GST Invoice · Payment Reminder · WhatsApp Alert" |
| **Tracing Beam** | How-It-Works vertical timeline scroll |
| **Card Hover Effect** | Feature cards — lift on hover |
| **Wobble Card** | Pricing cards — gentle wobble on hover |
| **3D Card Effect** | Product screenshot mockup floating in 3D |
| **Card Stack** | "Stack of invoices" visual metaphor |
| **Focus Cards** | Gallery of bill templates |
| **Infinite Moving Cards** | Testimonial marquee strip |
| **Background Lines** | Subtle lined paper effect (cream variant) |
| **Grid and Dot Backgrounds** | Graph paper effect for some sections |
| **Lamp Effect** | Warm glow for pricing/CTA hero |
| **Hero Highlight** | Highlight key words in hero text |
| **Shimmer Button** | Primary CTA button |
| **Canvas Reveal Effect** | Feature reveal on scroll |

---

### 3.3 From Magic UI
> Browse at: **https://magicui.design/components**

| Component | Usage |
|-----------|-------|
| **Number Ticker** | Animating stats: "12,000+ bills generated" |
| **Animated Shiny Text** | "New · Free Trial Now Available" pill badge |
| **Shimmer Button** | Primary download CTA |
| **Animated List** | Feature checklist with items appearing one by one |
| **Marquee** | Logos, testimonial strip |
| **Word Rotate** | Hero rotating subheadline |
| **Blur Fade** | Page section fade-in on scroll |
| **Dot Pattern** | Subtle background for certain sections |
| **Retro Grid** | Ledger-grid visual alternative |
| **Orbiting Circles** | Animated automation visual (hub + channels) |
| **Globe** | If showing India-focus geographic reach |

---

### 3.4 From Motion Primitives
> Browse at: **https://motion-primitives.com/components**

| Component | Usage |
|-----------|-------|
| **In View** | Trigger animations when element enters viewport |
| **Accordion** | FAQ section |
| **Progress Bar** | "Setup in 3 steps" progress indicator |
| **Scroll Progress** | Top-of-page reading progress |
| **Text Effect** | Char/word-by-word text reveal |
| **Animated Background** | Grain/noise texture animation |
| **Morphing Dialog** | Feature detail modals |

---

## 4. SITE ARCHITECTURE & NAVIGATION

### URL Structure
```
/                    → Home (Landing Page)
/features            → Full Feature Breakdown
/how-it-works        → Step-by-Step Guide
/pricing             → Pricing Plans
/download            → Download App & Start Trial
/about               → About BillFlow & Team
/contact             → Contact, Support, Demo Request
/blog                → Articles, GST Tips, Business Guides
/blog/[slug]         → Individual Blog Post
/legal/privacy       → Privacy Policy
/legal/terms         → Terms of Service
```

### Navigation Structure (Desktop)
```
[Logo + Wordmark]          [Features] [How It Works] [Pricing] [Blog]          [Login] [Download Free →]
```

### Navigation Structure (Mobile)
```
[Logo]  [≡ Hamburger]
↓ (slide-down drawer, full-width, with paper texture)
  Features
  How It Works
  Pricing
  Blog
  ─────────
  Login
  [Download Free — Primary Button]
```

---

## 5. PAGE 1 — HOME / LANDING ( / )

### Meta
- **Title:** `BillFlow — GST Billing Software for Indian Businesses`
- **Description:** `Create GST invoices in 30 seconds. Send via WhatsApp & email. Works offline. Free 14-day trial. Built for Indian traders, shops, and service providers.`
- **OG Image:** Hero invoice mockup on paper background

---

### SECTION 1.1 — NAVBAR

**Component:** Custom sticky navbar (21st.dev navbar component)
**Behavior:**
- Transparent on load, transitions to `cream-100/95` with backdrop blur on scroll
- Left: BillFlow logo (nib icon + "BillFlow" in Playfair Display, ink-900)
- Center: Nav links in Inter Medium, ink-700, with animated underline on hover (SVG path draw, 200ms)
- Right: "Login" (ghost link) + "Download Free →" (fountain-blue button, slight shimmer)
- On mobile: Hamburger with paper-texture slide drawer
- Active page: Nav link gets an ink-underline that "draws" in

**Framer Motion:**
```
Initial: { opacity: 0, y: -16 }
Animate: { opacity: 1, y: 0 }
Transition: { duration: 0.5, ease: "easeOut" }
Stagger children: 0.08s between each link
```

---

### SECTION 1.2 — HERO

**Layout:** Centered, full-viewport-height

**Background:**
- Base: `cream-50` (#FDFAF4)
- Paper grain texture overlay (CSS noise, opacity 0.04)
- Faint radial vignette at edges (darker cream at corners, like aged paper)
- Optional: Aceternity **Aurora Background** very softly (cream/amber tones, opacity 0.3)

**Content Structure:**
```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│         ┌────────────────────────────────┐              │
│         │  🖊️  STAMP: "GST-COMPLIANT"   │              │
│         └────────────────────────────────┘              │
│                   (rubber stamp aesthetic)               │
│                                                          │
│   ╔══════════════════════════════════════════════════╗  │
│   ║                                                  ║  │
│   ║    Banao Invoice Ek Minute Mein.                 ║  │
│   ║    ─────────────────────────────                 ║  │
│   ║    Create GST Bills in Seconds.                  ║  │
│   ║                                                  ║  │
│   ╚══════════════════════════════════════════════════╝  │
│                                                          │
│   The billing software built for India's real           │
│   businesses — shops, traders, freelancers, and         │
│   service providers who've been using pen and paper.    │
│   Now do it faster, smarter, and GST-ready.             │
│                                                          │
│   ┌─────────────────────┐  ┌──────────────────────┐    │
│   │  Download Free →    │  │  Watch Demo (2 min)  │    │
│   └─────────────────────┘  └──────────────────────┘    │
│                                                          │
│   ✓ Works offline  ✓ No monthly subscription needed     │
│   ✓ Windows 7, 8, 10, 11  ✓ 14-day free trial         │
│                                                          │
│   ┌────────────────────────────────────────────────┐    │
│   │                                                │    │
│   │   [ 3D INVOICE MOCKUP — floating, rotating ]  │    │
│   │   Paper-textured invoice card in 3D space      │    │
│   │   with subtle shadow & depth                   │    │
│   │                                                │    │
│   └────────────────────────────────────────────────┘    │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Hero Headline Typography:**
- Primary (Hindi): "Banao Invoice Ek Minute Mein." — Playfair Display Italic, 72px, ink-900
- Secondary (English translation): smaller Lora below in ink-700
- Animated: Each word appears as if being written with ink (Aceternity **Text Generate Effect**, or custom SVG stroke animation)
- Hero Highlight (Aceternity): "Seconds" word gets warm yellow highlight underline

**Hero Badge:**
- Circular rubber-stamp style badge: "GST Compliant · India's Own"
- CSS: border-radius: 50%, border: 2px solid rubber-red, transform: rotate(-8deg)
- Magic UI **Animated Shiny Text** inside: "✦ 14-Day Free Trial · No Credit Card"

**Hero CTA Buttons:**
- Primary: "Download Free →" — fountain-blue background, white Inter text, Magic UI **Shimmer Button** effect
- Secondary: "Watch Demo (2 min)" — ghost button, ink-800 border, paper background
- Both buttons: slight 3D press effect on click (scale 0.97)

**Hero Invoice Mockup (3D):**
- A realistic-looking invoice rendered as a React component (not a real screenshot)
- Paper texture background, DM Mono font for numbers
- Company name, bill number, GST amounts, "PAID" stamp
- Aceternity **3D Card Effect** — tilts on mouse move
- Floats with gentle up-down animation (CSS keyframe, 3s, ease-in-out)
- Casts a warm shadow below

**Hero Trust Strip (below buttons):**
- 4 inline items separated by · with small ink-500 check marks
- "Works offline · Windows 7–11 · 14-day free trial · Made for India"

**Framer Motion — Hero Sequence:**
```javascript
// Staggered reveal sequence:
Container: staggerChildren: 0.12s
1. Badge stamp: scale 0 → 1 (stamp pop, springy), delay: 0
2. Hindi headline: chars draw in left→right, delay: 0.1s
3. English subheadline: opacity 0 → 1, y: 10 → 0, delay: 0.5s
4. Description paragraph: opacity 0 → 1, delay: 0.7s
5. CTA buttons: opacity 0 → 1, y: 16 → 0, delay: 0.9s
6. Trust strip: opacity 0 → 1, delay: 1.1s
7. Invoice mockup: opacity 0 → 1, scale: 0.85 → 1, delay: 0.8s
```

---

### SECTION 1.3 — SOCIAL PROOF STRIP

**Layout:** Full-width horizontal strip, `cream-200` background, subtle paper texture
**Content:** Scrolling marquee (Magic UI **Marquee**)

```
12,000+ Invoices Generated   ·   4.9★ Rating   ·   "Saved me 2 hours a day" — Rahul, Mumbai   
·   Works on Windows XP onwards   ·   GST-ready since Day 1   ·   500+ happy businesses   
·   "My accountant loves it" — Priya, Surat   ·   Zero internet needed for billing   ·   ...
```

**Typography:** Lora italic, ink-500
**Speed:** Slow marquee (40s full loop), pausable on hover

---

### SECTION 1.4 — THE PROBLEM (EMOTIONAL HOOK)

**Layout:** Two-column, alternating sides on mobile stacked
**Background:** `cream-100` with faint ledger lines texture

**Left Column — "Before BillFlow":**
```
Visual: Hand-drawn style illustration or photo-style mockup
showing: pile of paper bills, calculator, notebook, rubber stamps
Caption: "This was your life."

Content card (paper-textured, coffee-ring stain SVG decoration):
  
  Every evening...
  • Calculate GST on each bill manually
  • Copy amounts into ledger by hand  
  • Forget which customers haven't paid
  • Lose track of invoices from last month
  • Miss payment deadlines. Again.
  • Prepare GSTR-1 by going through every paper
```

**Right Column — "After BillFlow":**
```
Visual: Clean invoice appearing on screen with ✓ stamps

  In 30 seconds...
  ✓ GST calculated automatically
  ✓ Invoice sent to customer's WhatsApp
  ✓ Reminder sent when payment is due
  ✓ All bills searchable in one place
  ✓ GSTR-1 data ready with one click
  ✓ Works even without internet
```

**Section Headline:** "You've been working too hard. Let us handle the paperwork."
**Typography:** Playfair Display, ink-900, 42px
**Animation:** Left card fades in from left, right card from right (Framer Motion, triggered on scroll)

---

### SECTION 1.5 — FEATURE HIGHLIGHTS (BENTO GRID)

**Layout:** Bento grid, asymmetric (1 large + 4 medium + 1 large)
**Background:** `cream-50` with paper grain
**Component:** Aceternity **Bento Grid** or 21st.dev bento grid, heavily restyled

**Headline:** "Everything You Need. Nothing You Don't."
**Subheadline:** Lora italic — "Built for how Indian businesses actually work."

**Bento Cells:**

```
┌────────────────────────────┬─────────────┬─────────────┐
│                            │             │             │
│   GST Invoice in           │  Works      │  WhatsApp   │
│   30 Seconds               │  Offline    │  Reminders  │
│                            │             │             │
│   [LARGE CARD - 2 cols]    │  [Med Card] │  [Med Card] │
│                            │             │             │
├─────────────┬──────────────┴─────────────┴─────────────┤
│             │                                           │
│  Auto GSTR-1│   Send Bills via Email,                  │
│  Export     │   WhatsApp & SMS                         │
│             │   [LARGE CARD - 3 cols]                   │
│  [Med Card] │                                           │
└─────────────┴───────────────────────────────────────────┘
```

**Card 1 — "GST Invoice in 30 Seconds" (Large):**
- Background: cream-200, thin border cream-400
- Mini animated mockup: typewriter filling in bill fields, totals calculating
- Label: "Intrastate · Interstate · All GST rates"
- Stamp badge: "CGST + SGST + IGST"

**Card 2 — "Works Offline" (Medium):**
- Icon: Cloud with X (crossed out) → smiling face
- Body: "No internet? No problem. Bill your customers anywhere. Syncs when you're back online."
- Visual: WiFi off icon with green check

**Card 3 — "WhatsApp Reminders" (Medium):**
- Icon: WhatsApp-style chat bubble in ledger-green
- Animation: Message bubble appearing with bill details
- Body: "Customers get payment reminders on WhatsApp. You don't have to call anyone."

**Card 4 — "Auto GSTR-1" (Medium):**
- Icon: Document with stamp
- Body: "One click exports your GSTR-1 data. Share it with your CA."

**Card 5 — "Multi-Channel Sending" (Large):**
- Aceternity **Orbiting Circles** adapted: center = BillFlow invoice, orbiting = Email, WhatsApp, SMS
- Body: "Send the same invoice through Email, WhatsApp, and SMS simultaneously. Your customer can't miss it."

**Hover Effect:** Aceternity **Spotlight** on each card — warm cream light follows cursor
**Animation:** Cards stagger in on scroll, slight scale 0.95 → 1

---

### SECTION 1.6 — HOW IT WORKS (ABBREVIATED)

**Layout:** 3-step horizontal flow on desktop, vertical on mobile
**Background:** `cream-200` with very faint graph-paper grid

**Headline:** "Simple as 1, 2, 3."
**Subheadline:** "No training needed. If you can write a bill on paper, you can use BillFlow."

**Steps:**
```
Step 1                    Step 2                    Step 3
────────                  ────────                  ────────
[Icon: Quill pen]         [Icon: Invoice stamp]     [Icon: WhatsApp bubble]
                                                    
Add Your                  Create the Bill           Send & Track
Business Details          
                          Fill customer name,       One click sends the
Enter your GSTIN,         items, quantities,        bill to your customer.
business name, and        and GST rates. BillFlow   Get notified when
bank details once.        calculates everything.    they pay.
Done in 2 minutes.        30 seconds per bill.      Auto-reminders too.
```

**Connecting Visual:** Dashed ink line connecting the three steps (SVG path, drawn on scroll with Framer Motion `pathLength` animation)

**CTA:** "See full walkthrough →" → links to /how-it-works

---

### SECTION 1.7 — PRODUCT SCREENSHOT / DEMO

**Layout:** Centered, full-width, dark paper background (`ink-900` or very deep cream-800)
**Background Effect:** Subtle warm glow behind the screenshot (Aceternity Lamp Effect, tinted amber)

**Content:**
- Large product screenshot (actual app screenshot or high-fidelity mockup)
- Shown as if sitting on a dark walnut desk
- Floating annotation labels:
  - "→ GST auto-calculated" pointing to totals
  - "→ Customer WhatsApp sent" pointing to action buttons
  - "→ Works on your existing Windows PC" pointing to window frame
  - "→ GSTR-1 ready anytime" pointing to reports section

**Screenshot Frame:**
- Realistic Windows application window chrome (title bar, minimize/maximize/close)
- Soft shadow + slight 3D tilt (Aceternity **3D Card Effect**)
- Floating, subtle up-down animation (3s ease-in-out loop)

**Below Screenshot:**
```
[Video thumbnail with play button]
"Watch 2-minute demo" — Lora italic, ink-300 (light, on dark background)
```

---

### SECTION 1.8 — TESTIMONIALS

**Layout:** 3-column card grid (mobile: single card carousel)
**Background:** `cream-100`
**Component:** 21st.dev testimonials component, restyled with paper aesthetic

**Headline:** "What Our Customers Say."
**Subheadline:** "Real businesses. Real results. Real savings."

**Testimonial Cards (paper card style):**
Each card:
- Background: `cream-50`, border `cream-400`, `shadow-paper`
- Top: 5 gold star icons (stamp-gold color)
- Quote in Lora italic, ink-800
- Bottom: Name in Inter Medium, ink-700 + City + Business type in ink-500
- Decorative: small coffee-ring stain SVG in corner (very subtle, adds character)
- Stamp badge: "Verified Customer"

**Testimonial Content:**
```
Card 1:
"Before BillFlow, I was spending 2 hours every evening doing 
calculations and writing bills. Now it takes 20 minutes and 
my customers get professional invoices on WhatsApp instantly."
— Manish Patel, Hardware Shop Owner, Ahmedabad

Card 2:
"The automatic payment reminders changed everything. I used to 
forget to follow up. Now the software does it for me and I 
collect payments 15 days faster on average."
— Kavita Sharma, Textile Trader, Surat

Card 3:
"My CA was impressed. The GSTR-1 export gave him exactly 
what he needed. No more collecting papers at year-end."
— Rajesh Verma, Electrical Goods, Mumbai

Card 4:
"Works on my old Windows 7 computer! I was worried it would 
need a new machine. It runs perfectly. Very happy."
— Suresh Gupta, Grocery Store, Jaipur

Card 5:
"I never thought billing software could be this simple. My 
employee learned it in one day with no training."
— Fatima Sheikh, Boutique Owner, Hyderabad

Card 6:
"The offline mode is what sold me. My shop has bad internet 
sometimes. BillFlow never stops working."
— Arun Nair, Pharmacy, Kochi
```

**Animation:** Aceternity **Infinite Moving Cards** for mobile testimonial marquee. Desktop: Framer Motion stagger reveal.

---

### SECTION 1.9 — STATS BAR

**Layout:** 4-column stats grid
**Background:** `fountain-blue` (dark navy ink color)
**Text:** cream-50 on dark background

```
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│                 │                 │                 │                 │
│   12,000+       │   ₹45 Crore+    │   4.9 / 5       │   30 Seconds    │
│   Bills Created │   Invoiced      │   Customer      │   Per Invoice   │
│                 │                 │   Rating        │                 │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

**Animation:** Magic UI **Number Ticker** — numbers count up when section enters viewport
**Typography:** DM Mono for numbers (large, white), Inter for labels (small, cream-300)
**Decoration:** Thin cream-400 vertical dividers between stats, faint horizontal ledger lines

---

### SECTION 1.10 — PRICING TEASER

**Layout:** Centered, simple
**Background:** `cream-200`

**Headline:** "Simple, Honest Pricing."
**Subheadline:** "One plan. All features. No hidden charges."

**Price Card:**
```
┌────────────────────────────────────────────────────────────┐
│                 [Stamp: "BEST VALUE"]                      │
│                                                            │
│    Starter Plan                Professional Plan          │
│    ────────────                ───────────────────        │
│    ₹499 / month                ₹999 / month               │
│    or ₹4,799 / year            or ₹9,599 / year           │
│    (save 20%)                  (save 20%)                  │
│                                                            │
│    ✓ Unlimited bills            All Starter features +     │
│    ✓ WhatsApp & Email          ✓ WhatsApp reminders        │
│    ✓ GSTR-1 export             ✓ SMS notifications         │
│    ✓ PDF invoices              ✓ Multiple businesses       │
│    ✓ Works offline             ✓ Priority support          │
│                                                            │
│    [ Start Free Trial → ]       [ Start Free Trial → ]    │
└────────────────────────────────────────────────────────────┘
```

**CTA:** "See full pricing details →" — links to /pricing

---

### SECTION 1.11 — FINAL CTA / HERO REPEAT

**Layout:** Full-width, centered
**Background:** Deep `ink-900` (very dark, like pressed leather cover of a ledger book)
**Texture:** Paper grain on dark (lighter opacity noise)
**Effect:** Aceternity **Background Beams** very subtle, warm amber tint

**Content:**
```
                    [Ink nib icon, cream, 40px]

           Start Your Free 14-Day Trial Today.
                        
         No credit card. No commitment.
     Just better billing for your business.

         [ Download BillFlow Free → ]

    Works on Windows 7, 8, 10, and 11
    Your data stays private on your own computer
    Free setup support included
```

**Typography:** Playfair Display, cream-50 on dark
**Button:** Magic UI **Shimmer Button**, cream/gold shimmer
**Framer Motion:** Fade up on scroll entry

---

### SECTION 1.12 — FAQ (ABBREVIATED)

**Layout:** Centered, max-width 720px
**Background:** `cream-100`
**Component:** Motion Primitives **Accordion**

**Headline:** "Common Questions."

**Questions:**
1. "Does it work without internet?" → Yes, fully offline. Syncs automatically when connected.
2. "Will it run on my old Windows PC?" → Works on Windows 7, 8, 10, and 11. No new hardware needed.
3. "Is it really GST-compliant?" → Yes. CGST, SGST, IGST, HSN codes, all GST rates supported.
4. "Can I send bills on WhatsApp?" → Yes, one-click sending via WhatsApp, Email, and SMS.
5. "What happens after 14 days?" → Choose a plan that fits you, or your data stays safe.
6. "How do I get started?" → Download, install, enter your GSTIN — done in 5 minutes.
7. "Do I need accounting knowledge?" → Not at all. If you know what to bill, BillFlow handles the rest.

---

## 6. PAGE 2 — FEATURES ( /features )

### Meta
- **Title:** `BillFlow Features — Complete GST Billing for Indian Businesses`
- **Description:** `WhatsApp billing, offline invoicing, auto GSTR-1, payment reminders and more. See everything BillFlow does for your business.`

---

### Layout Overview
Full deep-dive page. Alternating left/right sections with large visuals, mimicking a feature brochure.

**Background:** Alternating between `cream-50` and `cream-200`, paper texture throughout.

---

### Feature Sections (each with headline + visual + description)

**Section Header:**
```
┌──────────────────────────────────────┐
│                                      │
│   Every Feature Your Business Needs. │
│                                      │
│   GST billing was never this clean.  │
│                                      │
└──────────────────────────────────────┘
```

---

**FEATURE BLOCK 1 — GST Invoicing**

*Headline:* "Professional GST Invoices. In 30 Seconds."
*Visual (Right):* Animated invoice being filled in, numbers appearing, CGST/SGST calculated, then stamped "SENT"
*Body Copy:*
```
Create fully GST-compliant tax invoices with:
• Automatic CGST, SGST, and IGST calculation
• All GST rates supported: 0%, 5%, 12%, 18%, 28%
• HSN / SAC codes for products and services
• Intrastate and interstate supply detection
• Round-off calculation (as per GST rules)
• Indian rupee formatting (lakh/crore notation)
• GST amount in words at the bottom of every bill
• Customisable bill number format (e.g., INV-2025-001)
• Your business logo, GSTIN, and signature on every invoice
```

---

**FEATURE BLOCK 2 — PDF & Sending**

*Headline:* "Send Bills Your Way. All in One Click."
*Visual (Left):* Three phones showing WhatsApp, Email, SMS receiving the invoice
*Body Copy:*
```
Your customer gets the bill the way they want it:
• PDF invoices — print-quality, professional design
• WhatsApp — bill lands directly in their chat
• Email — with PDF attached, your branding in subject line
• SMS — short link or amount notification
• All channels in one click — no switching apps
• Customer sees: your business name, bill details, payment info
```

---

**FEATURE BLOCK 3 — Payment Tracking**

*Headline:* "Know Who Owes You Money. Always."
*Visual (Right):* Bills list with color-coded status badges (Draft, Sent, Paid, Overdue)
*Body Copy:*
```
Stop guessing which customers have paid:
• Real-time bill status: Draft → Sent → Paid → Overdue
• Outstanding balance shown clearly per customer
• Total paid, total due, and overdue at a glance
• Mark bills paid with payment method and reference
• Full payment history for every customer
• Dashboard shows today's collections vs. pending
```

---

**FEATURE BLOCK 4 — Automatic Reminders**

*Headline:* "Never Chase a Payment Manually Again."
*Visual (Left):* Timeline showing automated reminder sequence
*Body Copy:*
```
BillFlow sends reminders for you, automatically:
• 7-day reminder: "Your payment is due in a week"
• 3-day reminder: "3 days left to pay Invoice #001"
• 1-day reminder: "Payment due tomorrow"
• Overdue notice: "Invoice overdue — please pay"
• Follow-up at 7 days and 30 days overdue
• Reminders go via Email, WhatsApp, and SMS
• You get a daily summary of what's due today
```

---

**FEATURE BLOCK 5 — Customer Management**

*Headline:* "All Your Customers. One Clean Register."
*Visual (Right):* Customer profile card with bill history
*Body Copy:*
```
Your digital khata for every customer:
• Full customer profile: name, GSTIN, address, phone, email
• Auto-detect intrastate vs. interstate based on state
• Set payment terms per customer (30 days, 60 days, etc.)
• Complete billing history for every customer
• Search and filter by name, GSTIN, city, or state
• Outstanding balance always visible
```

---

**FEATURE BLOCK 6 — Items Catalogue**

*Headline:* "Your Products & Services, Always Ready."
*Visual (Left):* Items list with GST rates, one-click add to bill
*Body Copy:*
```
Save your common products and services:
• Add items with HSN/SAC code and GST rate once
• One click to add to any bill — no re-typing
• Supports goods (products) and services
• All standard units: pieces, kg, hours, sets, etc.
• 0%, 5%, 12%, 18%, 28% GST rate options
• Edit or remove anytime
```

---

**FEATURE BLOCK 7 — GST Reports**

*Headline:* "GSTR-1 Ready. Your CA Will Be Impressed."
*Visual (Right):* Tax summary table with rate-wise breakdown
*Body Copy:*
```
Tax time is no longer stressful:
• Monthly GST summary — CGST, SGST, IGST totals
• Rate-wise breakdown: exactly what GST authorities need
• HSN-wise summary for your goods and services
• GSTR-1 data export — share with your CA in one click
• Revenue report by month, customer, and bill status
• Overdue ageing report — who owes you, for how long
```

---

**FEATURE BLOCK 8 — Offline-First**

*Headline:* "Works Everywhere. Even Without Internet."
*Visual (Left):* App running with WiFi-off icon, green check mark
*Body Copy:*
```
Your billing never stops:
• 100% offline operation — no internet needed to bill
• Automatic cloud backup when internet is available
• Your data stays on your own computer, always
• Never lose a single bill or customer record
• Works in areas with poor connectivity
• Safe, private, and always accessible
```

---

**FEATURE BLOCK 9 — Windows Compatible**

*Headline:* "Runs on the Computer You Already Have."
*Visual (Right):* App running on Windows 7, 10, 11 shown
*Body Copy:*
```
No need to buy new hardware:
• Works on Windows 7, 8, 10, and 11
• Lightweight — runs on basic office computers
• Fast even on older machines with 4GB RAM
• Simple installer — ready in 5 minutes
• No browser required, works as a proper desktop app
• Data stored securely on your local machine
```

---

## 7. PAGE 3 — HOW IT WORKS ( /how-it-works )

### Meta
- **Title:** `How BillFlow Works — Setup to First Invoice in 5 Minutes`
- **Description:** `Step-by-step guide to getting started with BillFlow. From installation to your first GST invoice in minutes.`

---

### Layout
Vertical timeline with alternating content. Aceternity **Tracing Beam** down the left side.

**Headline:** "From Paper to Professional Billing. In 5 Minutes."

**Background:** `cream-100`, ledger lines texture very faint

---

**STEP 1 — Download & Install**
```
[Icon: Download arrow into document]

Download BillFlow (Free)
────────────────────────
1. Click Download Free on this page
2. Run the installer — takes about 2 minutes
3. Works on any Windows PC (7, 8, 10, or 11)

No technical knowledge needed. Just click Next → Next → Finish.
Works like any other Windows software you've installed before.
```

**STEP 2 — Enter Your Business Details**
```
[Icon: Stamp with business name]

Set Up Your Business Profile
─────────────────────────────
Enter once, use on every bill:
• Your business name and address
• Your GSTIN (15-digit number from GST registration)
• Your bank account details for payment info on bills
• Upload your business logo (optional but looks professional)

Takes 2–3 minutes. You'll never need to enter this again.
```

**STEP 3 — Add Your Customers**
```
[Icon: Person with ledger]

Add Your Regular Customers
──────────────────────────
Save your customer details:
• Name, GSTIN, address, phone number, email
• Set their payment terms (how many days to pay)
• BillFlow auto-detects if it's intrastate or interstate billing

You can add customers one by one, or import from a list.
Each new customer takes about 30 seconds to add.
```

**STEP 4 — Create Your First Bill**
```
[Icon: Quill writing on paper]

Create a GST Invoice in 30 Seconds
────────────────────────────────────
1. Click "New Bill"
2. Select the customer (or type name to search)
3. Add items — type or pick from your saved catalogue
4. Set quantities and prices
5. BillFlow calculates CGST, SGST, IGST automatically
6. Review and Save

The bill number, date, due date, and GST amounts are all 
handled for you. You just fill in what you're selling.
```

**STEP 5 — Send to Your Customer**
```
[Icon: WhatsApp and Email]

Send via WhatsApp, Email, or SMS
──────────────────────────────────
• Click "Save & Send"
• Choose: WhatsApp, Email, or SMS
• Your customer receives the bill in seconds
• A PDF is generated automatically — professional quality

You can also download the PDF and print it if you prefer paper.
```

**STEP 6 — Track Payments**
```
[Icon: Checkmark with rupee symbol]

Track Who Paid, Who Hasn't
──────────────────────────────────
• Dashboard shows all bills by status
• Mark a bill "Paid" when you receive payment
• Automatic reminders go out if unpaid after due date
• You get a daily summary: "3 bills due today, ₹45,000 pending"

No more mental tracking. BillFlow remembers everything.
```

**Bottom CTA:**
```
Ready to Start?
───────────────
Your first bill is 5 minutes away.

[ Download BillFlow Free → ]  (14-day free trial)
```

---

## 8. PAGE 4 — PRICING ( /pricing )

### Meta
- **Title:** `BillFlow Pricing — Simple, Honest GST Billing Plans`
- **Description:** `₹499/month for the Starter plan. ₹999/month for Professional with WhatsApp & SMS. 14-day free trial on all plans.`

---

### Layout
Centered pricing page. Toggle between Monthly / Yearly. 3 plan cards.

**Background:** `cream-50`, paper texture

**Headline:** "Honest Pricing. No Surprises."
**Subheadline:** "One software. One price. Everything included."

---

### Plan Cards (Aceternity **Wobble Card** on hover)

**Billing Toggle:** Monthly ↔ Yearly (save up to 20%)
- Framer Motion: smooth slide between states
- Yearly badge: "Save 20%" in stamp-gold stamp style

---

**PLAN 1 — Starter**
```
┌─────────────────────────────────────────┐
│                                         │
│  [Icon: Simple quill]                   │
│                                         │
│  Starter                                │
│  ───────                                │
│  ₹499 / month                           │
│  ₹4,799 / year  (save ₹1,189)           │
│                                         │
│  Perfect for small shops,               │
│  traders, and individual businesses     │
│                                         │
│  ✓ Up to 50 bills per month             │
│  ✓ Up to 100 customers                  │
│  ✓ PDF invoice generation               │
│  ✓ Email sending                        │
│  ✓ GSTR-1 export                        │
│  ✓ Works offline                        │
│  ✓ Basic payment reminders              │
│  ✓ Windows 7–11 support                 │
│  ✗ WhatsApp reminders                   │
│  ✗ SMS notifications                    │
│  ✗ Multiple businesses                  │
│                                         │
│  [Start Free Trial →]                   │
│  No credit card needed                  │
└─────────────────────────────────────────┘
```

**PLAN 2 — Professional (HIGHLIGHTED)**
```
┌─────────────────────────────────────────┐
│  ┌─────────────────────────────────┐    │
│  │  ★ MOST POPULAR · BEST VALUE   │    │
│  └─────────────────────────────────┘    │
│  (rubber stamp style badge, rotated 3°) │
│                                         │
│  [Icon: Professional stamp]             │
│                                         │
│  Professional                           │
│  ─────────────                          │
│  ₹999 / month                           │
│  ₹9,599 / year  (save ₹2,389)           │
│                                         │
│  For growing businesses who             │
│  want full automation                   │
│                                         │
│  ✓ Up to 500 bills per month            │
│  ✓ Up to 1,000 customers               │
│  ✓ PDF invoice generation               │
│  ✓ Email sending                        │
│  ✓ WhatsApp reminders ← NEW             │
│  ✓ SMS notifications ← NEW             │
│  ✓ GSTR-1 export                        │
│  ✓ Advanced payment reminders           │
│  ✓ Daily & weekly reports               │
│  ✓ Quarterly GST filing reminder        │
│  ✓ Priority support                     │
│  ✓ Works offline                        │
│  ✗ Multiple businesses                  │
│                                         │
│  [Start Free Trial →]                   │
│  No credit card needed                  │
└─────────────────────────────────────────┘
```
*This card gets slightly larger size, fountain-blue border, `shadow-ledger` effect, subtle blue glow*

**PLAN 3 — Enterprise**
```
┌─────────────────────────────────────────┐
│                                         │
│  [Icon: Multiple ledgers]               │
│                                         │
│  Enterprise                             │
│  ──────────                             │
│  ₹1,999 / month                         │
│  ₹19,199 / year  (save ₹4,789)          │
│                                         │
│  For businesses with multiple           │
│  locations or high volumes              │
│                                         │
│  ✓ Unlimited bills                      │
│  ✓ Unlimited customers                  │
│  ✓ Everything in Professional           │
│  ✓ Multiple business profiles           │
│  ✓ Multi-user access                    │
│  ✓ Priority phone support               │
│  ✓ Dedicated setup assistance           │
│  ✓ Custom invoice branding              │
│                                         │
│  [Contact Us →]                         │
│  or  [Start Free Trial →]               │
└─────────────────────────────────────────┘
```

---

### Pricing FAQ
Component: Motion Primitives Accordion

**Questions:**
1. "Can I switch between plans?" → Yes, anytime.
2. "What payment methods do you accept?" → Bank transfer, UPI, card.
3. "Is there a refund policy?" → 14-day trial, no questions.
4. "Do I pay per user?" → No. One price per installation.
5. "What happens if I don't renew?" → You keep your data, billing stops.

---

### Comparison Table
Full feature comparison across all 3 plans in a clean `<table>` with:
- Row groups: Billing · Sending · Automation · Reports · Support
- ✓ / ✗ icons + DM Mono font for numbers
- Alternating cream-50 / cream-200 row backgrounds

---

## 9. PAGE 5 — DOWNLOAD & TRIAL ( /download )

### Meta
- **Title:** `Download BillFlow Free — 14-Day Trial, No Credit Card`

---

### Layout

**Hero Section:**
```
                [Large download icon, paper aesthetic]

        Download BillFlow. Free for 14 Days.

   No credit card required. No subscription to start.
   Just download, install, and bill your first customer.

   [Windows icon] Version 1.0  ·  Windows 7, 8, 10, 11  ·  45 MB

   ┌─────────────────────────────────────┐
   │   ⬇  Download for Windows (.exe)   │
   └─────────────────────────────────────┘

   SHA-256 checksum: [hash shown in DM Mono, small text]
   VirusTotal: Clean (link)
```

**System Requirements Card:**
```
Minimum Requirements          Recommended
──────────────────           ─────────────
Windows 7 SP1+               Windows 10/11
2 GB RAM                     4 GB RAM
500 MB free space            2 GB free space
Any processor 1GHz+          Core i3 or better
Screen: 800×600+             Screen: 1280×720+
Internet: Optional           Internet: For cloud sync
```

**Installation Guide:**
Step-by-step accordion with screenshots

**What Happens After 14 Days:**
```
Your data is safe, forever.
You choose what to do next.
─────────────────────────────
Option 1: Subscribe → Continue using everything
Option 2: Not ready yet → Data stays, billing pauses
Option 3: Export → Take your data anywhere

We never delete your information without your permission.
```

**Trust Badges:**
- "No malware — verified clean"
- "Your data stays on your computer"
- "No account needed to download"
- "Cancel anytime"

---

## 10. PAGE 6 — ABOUT ( /about )

### Meta
- **Title:** `About BillFlow — Built for India's Real Businesses`

---

### Sections

**Mission Statement:**
```
   We built BillFlow because we watched our fathers,
   uncles, and neighbours struggle with pen-and-paper
   billing every single day.

   GST came in 2017. The paperwork got harder.
   Most billing software got more complicated.

   We went the other way.
   
   BillFlow is for the shop owner who's never touched
   billing software before. If you can write a bill on
   paper, you can use BillFlow on day one.
```

**The Story Section:**
- Timeline of BillFlow development (2023 → 2024 → 2025 → Today)
- Aceternity **Tracing Beam** down the left
- Each milestone has a brief note

**Values:**
```
Three Things We Believe In:
──────────────────────────
Privacy First       Simplicity Always       Made for India
───────────         ─────────────────       ──────────────
Your data lives     If you need              GST rules,
on your machine.    training, we've          Indian numbering,
Not ours. Not       failed. Every            rupee formatting,
anyone else's.      feature should           Hindi support,
                    be obvious.              and local needs.
```

**Team Section:**
- Small team introduction (generic for now, with initials and roles)
- Paper card style, with subtle decorative elements

---

## 11. PAGE 7 — CONTACT & SUPPORT ( /contact )

### Meta
- **Title:** `Contact BillFlow — Support, Demo, and Help`

---

### Layout: Two-column
**Left:** Contact info, support options
**Right:** Contact form (Motion Primitives form or 21st.dev form component)

**Support Options:**
```
📧 Email Support
   support@billflow.in
   Response within 24 hours

📱 WhatsApp Support
   +91 XXXXX XXXXX
   Chat with us on WhatsApp

📖 Documentation
   help.billflow.in
   Searchable guides and tutorials

🎥 Video Tutorials
   Walkthrough videos for every feature
   Watch on our YouTube channel
```

**Contact Form:**
```
Name: [________________]
Email: [________________]
Phone: [________________]
Business Type: [Dropdown: Shop / Trader / Freelancer / Service / Other]
Message: [_______________
          _______________]
[ Send Message → ]
```

**Free Setup Help:**
```
Need help getting started?
──────────────────────────
We offer free setup assistance for all new customers.
Book a 15-minute call and we'll help you:
• Install BillFlow on your computer
• Enter your business details
• Set up your first customer
• Create your first invoice

[Book Free Setup Call →]
```

---

## 12. PAGE 8 — BLOG / RESOURCES ( /blog )

### Meta
- **Title:** `BillFlow Blog — GST Tips, Business Advice for Indian SMBs`

---

### Layout
Clean editorial layout. Paper aesthetic with:
- Large featured article hero
- Article card grid below
- Category filters: GST Tips · Business Basics · Software Updates · Success Stories

**Article Card Design:**
- Paper card with thin border
- Category stamp badge (rubber stamp aesthetic)
- Reading time in DM Mono
- Hover: card lifts slightly, shadow deepens

**Content Categories:**
```
GST Tips & Compliance
   "What is GSTR-1? A Simple Guide for Shop Owners"
   "How to Calculate GST on Mixed Rate Invoices"
   "Common GST Mistakes Small Businesses Make"
   "How to Handle Interstate and Intrastate Billing"

Business Basics
   "How to Follow Up on Unpaid Invoices (Without Awkwardness)"
   "5 Things Every Small Business Should Track Monthly"
   "Setting Up Payment Terms That Actually Work"

Software Guides
   "How to Export GSTR-1 from BillFlow"
   "Setting Up WhatsApp Billing for Your Shop"
   "How to Use BillFlow Offline at Your Store"

Success Stories
   "How a Surat Textile Trader Reduced Payment Delays by 40%"
   "From Paper Ledger to Digital Billing: Manish's Story"
```

---

## 13. GLOBAL COMPONENTS

### 13.1 NAVBAR (Global, Sticky)

**Desktop:**
```
[🖊 BillFlow]  [Features] [How It Works] [Pricing] [Blog]  [Login] [Download Free →]
```

**Scroll Behavior:**
- At top: transparent or 98% transparent cream-50 background
- On scroll (>60px): `cream-100/95` bg + `backdrop-blur-sm` + thin cream-400 bottom border
- Transition: Framer Motion `useScroll` hook, smooth 200ms

**Logo:**
- SVG ink pen nib icon (custom, minimal, one-color)
- "BillFlow" in Playfair Display 700, ink-900
- Subtle hover effect: text color shifts to fountain-blue

**Nav Links:**
- Inter Medium 500, ink-700 default
- Hover: ink-900 with SVG underline path animation (draws in 180ms)
- Active: ink-900 with solid underline

**CTA Button:**
- "Download Free →" — fountain-blue bg, white text, 6px border-radius
- Hover: darker blue + very slight scale(1.02)
- Magic UI Shimmer effect (subtle, not gaudy)

**Mobile Nav (Hamburger Drawer):**
- Full-width slide-down drawer
- Background: cream-100 with paper texture
- Links large (24px, Playfair Display)
- Closes on outside click or nav link click
- Framer Motion: height animate 0 → auto, easeOut

---

### 13.2 FOOTER

**Layout:** 4-column grid + bottom bar
**Background:** `ink-900` (dark, like the back cover of a ledger)
**Text:** cream-300 and cream-500

```
┌────────────┬─────────────┬─────────────┬─────────────┐
│            │             │             │             │
│ 🖊 BillFlow │  Product    │  Support    │  Company    │
│            │             │             │             │
│ GST billing│  Features   │  Help Center│  About      │
│ software   │  Pricing    │  Contact    │  Blog       │
│ for Indian │  Download   │  WhatsApp   │  Privacy    │
│ businesses.│  Changelog  │  Support    │  Terms      │
│            │             │             │  Careers    │
│ Made with  │             │             │             │
│ ♥ in India │             │             │             │
└────────────┴─────────────┴─────────────┴─────────────┘

──────────────────────────────────────────────────────
   © 2025 BillFlow. All rights reserved.   |   [Instagram] [YouTube] [LinkedIn]
   Built for India's 63 million small businesses.
```

**Decoration:** Faint horizontal ruled line separating footer columns from bottom bar. Ink-nib watermark behind logo area (very faint, 5% opacity).

---

### 13.3 COOKIE CONSENT BANNER (if needed)

Paper-card style, bottom-right corner
"We use essential cookies only. No tracking, no ads."
[Accept] [Learn More]

---

### 13.4 TOAST NOTIFICATIONS

Paper card style: cream-50 background, thin cream-400 border, shadow-paper
"✓ Form submitted! We'll respond within 24 hours." — Lora italic, ink-800

---

## 14. ANIMATION PLAYBOOK (FRAMER MOTION SPECS)

### 14.1 Page Load Sequence
```javascript
// Root page container
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.3, ease: "easeOut" }}
/>

// Hero headline — characters reveal (ink writing effect)
<motion.span
  initial={{ opacity: 0, filter: "blur(4px)" }}
  animate={{ opacity: 1, filter: "blur(0px)" }}
  transition={{ duration: 0.5, ease: "easeOut", delay: index * 0.03 }}
/>
// Map over each character

// Hero description — word by word
<motion.span
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4, ease: "easeOut", delay: 0.6 + index * 0.05 }}
/>
```

### 14.2 Scroll-Triggered Animations
```javascript
// Using Framer Motion whileInView:
<motion.div
  initial={{ opacity: 0, y: 32 }}
  whileInView={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
  viewport={{ once: true, margin: "-80px" }}
/>

// Staggered children (feature cards, steps)
<motion.div
  variants={{
    hidden: {},
    visible: { transition: { staggerChildren: 0.12 } }
  }}
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true }}
/>
// Each child uses variants: { hidden: {opacity:0, y:24}, visible: {opacity:1, y:0} }
```

### 14.3 Hover Interactions
```javascript
// Feature card hover — lifts from paper
<motion.div
  whileHover={{ 
    y: -4, 
    boxShadow: "0 8px 24px rgba(28,18,8,0.14), 0 0 0 1px rgba(212,201,168,0.6), 4px 4px 0 rgba(212,201,168,0.8)"
  }}
  transition={{ duration: 0.2, ease: "easeOut" }}
/>

// Button press
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.97 }}
  transition={{ duration: 0.15 }}
/>

// Rubber stamp badge — pop on hover
<motion.div
  whileHover={{ rotate: [-3, 3, -2, 0], scale: [1, 1.05, 1.02] }}
  transition={{ duration: 0.4 }}
/>
```

### 14.4 Ink Writing Effect (Hero SVG)
```javascript
// SVG path with strokeDashoffset animation
<motion.path
  d="[the letter/underline path]"
  initial={{ pathLength: 0, opacity: 0 }}
  animate={{ pathLength: 1, opacity: 1 }}
  transition={{ duration: 1.2, ease: "easeInOut", delay: 0.5 }}
/>
```

### 14.5 Number Counter (Stats Section)
```javascript
// Using Magic UI NumberTicker or custom:
// Framer Motion useMotionValue + useTransform
// Count from 0 to target over 2 seconds when in view
// Easing: easeOut
// Numbers in DM Mono
```

### 14.6 Rubber Stamp Appearance
```javascript
// For badge/stamp elements
<motion.div
  initial={{ scale: 2, opacity: 0, rotate: -20 }}
  animate={{ scale: 1, opacity: 0.9, rotate: -3 }}
  transition={{ 
    type: "spring", 
    stiffness: 200, 
    damping: 15, 
    delay: 0.8 
  }}
/>
```

### 14.7 Dashed Path Connection (How It Works Steps)
```javascript
// SVG dashed line connecting steps
<motion.line
  strokeDasharray="6 4"
  initial={{ pathLength: 0 }}
  whileInView={{ pathLength: 1 }}
  transition={{ duration: 1.5, ease: "easeInOut" }}
  viewport={{ once: true }}
/>
```

### 14.8 Accordion (FAQ)
```javascript
// Using Framer Motion AnimatePresence
// height: 0 → auto on open
// opacity: 0 → 1
// easeOut, 250ms
```

### 14.9 Pricing Toggle (Monthly/Yearly)
```javascript
// AnimatePresence for price amount change
// When switching: old price exits with y: -10, opacity: 0
// New price enters with y: 10, opacity: 0 → y: 0, opacity: 1
// Duration: 200ms each
```

### 14.10 Page Transitions (Route Changes)
```javascript
// Using Next.js layout motion wrapper
// Exit: opacity 0, y: -8, 150ms
// Enter: opacity 1, y: 0, 200ms
// Creates a "page turn" feel
```

---

## 15. RESPONSIVE BREAKPOINTS

### Tailwind Breakpoints (custom config)
```javascript
screens: {
  'xs':  '375px',   // Small mobile
  'sm':  '640px',   // Large mobile / small tablet
  'md':  '768px',   // Tablet portrait
  'lg':  '1024px',  // Tablet landscape / small desktop
  'xl':  '1280px',  // Standard desktop
  '2xl': '1536px',  // Large desktop
}
```

### Key Responsive Rules

**Navbar:**
- `lg+`: Full horizontal navbar
- `md-`: Hamburger only, links in drawer

**Hero:**
- `xl+`: Large 2-col layout (text left, mockup right) or centered with mockup below
- `lg`: Slightly smaller type, mockup scales down
- `md-`: Single column, mockup below text
- `sm-`: Type scale drops 20%, mockup hidden or simplified

**Bento Grid:**
- `xl+`: 3 columns, mixed spans
- `lg`: 2 columns
- `md-`: Single column, all cards full-width

**Pricing Cards:**
- `xl+`: 3 columns side by side
- `lg`: 3 columns, slightly narrower
- `md`: 2 columns (Starter + Professional), Enterprise below
- `sm-`: Single column, stacked

**Stats Bar:**
- `xl+`: 4 columns
- `md`: 2×2 grid
- `sm-`: 2×2 grid, smaller numbers

**Footer:**
- `lg+`: 4 columns
- `md`: 2×2 grid
- `sm-`: Single column

### Minimum Touch Target: 44×44px for all interactive elements on mobile

---

## 16. SEO & METADATA

### Per-Page Meta Structure
```html
<!-- Home -->
<title>BillFlow — GST Billing Software for Indian Businesses</title>
<meta name="description" content="Create GST invoices in 30 seconds. Send via WhatsApp and email. Works offline. Free 14-day trial. Built for Indian shops, traders, and service providers." />
<meta property="og:title" content="BillFlow — GST Billing Software" />
<meta property="og:description" content="Professional GST billing for Indian SMBs. Works offline. Sends via WhatsApp. 14-day free trial." />
<meta property="og:image" content="/og/home.png" />
<meta property="og:type" content="website" />
```

### Structured Data (JSON-LD)
```json
// SoftwareApplication schema
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "BillFlow",
  "operatingSystem": "Windows",
  "applicationCategory": "BusinessApplication",
  "offers": {
    "@type": "Offer",
    "price": "499",
    "priceCurrency": "INR"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "reviewCount": "500"
  }
}
```

### Target Keywords
```
Primary: "GST billing software India", "GST invoice software Windows"
Secondary: "GST invoice maker free", "billing software for shops India"
Long-tail: "GST billing software works offline", "WhatsApp billing India"
Local: "GST billing software Surat", "invoice software for small business India"
```

---

## 17. CUSTOMER JOURNEY MAP

### User: "Suresh" — Grocery store owner, 45 years old, uses Windows 7 laptop

**Touchpoint 1 — Discovery:**
- Sees WhatsApp forward about GST software
- Searches Google: "GST billing software for shop India"
- Lands on Home page

**Conversion Goal at Home:**
- Sees headline in Hindi → "This is for me"
- Sees "Works on Windows 7" → "My laptop will work"
- Sees "Offline mode" → "My internet is bad, this is perfect"
- Clicks "Download Free" (14-day trial)

**Touchpoint 2 — Interest:**
- Scrolls to features → Bento grid shows everything at a glance
- Reads "30 seconds per invoice" → Interested
- Sees WhatsApp sending → "My customers use WhatsApp!"
- Checks pricing → ₹499/month, affordable

**Touchpoint 3 — Download:**
- Goes to /download
- Sees it's for Windows → Proceeds
- Sees 14-day free trial, no credit card → Downloads

**Touchpoint 4 — Activation:**
- Installs in 2 min
- Sets up business profile in 3 min
- Creates first bill in 30 seconds
- Sends to customer via WhatsApp
- Customer calls impressed → Suresh is sold

**Touchpoint 5 — Conversion:**
- Day 12: Trial ending reminder
- Goes to /pricing
- Chooses Professional plan (₹999/month) for WhatsApp reminders
- Pays via UPI

**Ongoing:**
- Receives daily summaries
- Customers get auto reminders
- Suresh never chases payments manually again

---

## APPENDIX A — FULL FONT LOAD CODE

```html
<!-- In <head>, preconnect first -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Lora:ital,wght@0,400;0,500;0,600;1,400&family=DM+Mono:wght@300;400;500&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

---

## APPENDIX B — TECH STACK FINAL

```
Framework:      Next.js 14 (App Router + Server Components)
Language:       TypeScript
Styling:        Tailwind CSS v3 (custom config with paper/ink tokens)
Animation:      Framer Motion v11 (all motion)
Components:     shadcn/ui (base) + 21st.dev + Aceternity UI + Magic UI
Icons:          Lucide React + custom SVG ink/paper icons
Fonts:          Google Fonts (Playfair Display, Lora, DM Mono, Inter)
3D:             CSS 3D transforms + Framer Motion (no Three.js needed)
Forms:          react-hook-form + zod validation
Email:          Resend (contact form)
Analytics:      Plausible (privacy-friendly)
Hosting:        Vercel
OG Images:      @vercel/og (dynamic)
```

---

## APPENDIX C — COMPONENT INSTALL QUICK REFERENCE

```bash
# Initialize shadcn/ui
npx shadcn@latest init

# From 21st.dev — browse at https://21st.dev and use CLI:
npx shadcn@latest add [component-url-from-21st.dev]

# Aceternity UI
npm install framer-motion clsx tailwind-merge
# Then copy component code from https://ui.aceternity.com/components

# Magic UI
npx magicui-cli@latest add [component-name]
# Or copy from https://magicui.design/components

# Motion Primitives
# Copy from https://motion-primitives.com/components

# Key npm packages:
npm install framer-motion
npm install @tabler/icons-react
npm install lucide-react
npm install react-hook-form zod @hookform/resolvers
npm install resend                         # for contact form
```

---

## APPENDIX D — IMAGE / ASSET REQUIREMENTS

```
/public/
  og/
    home.png                (1200×630 — OG image for home)
    features.png            (1200×630 — OG image for features)
    pricing.png             (1200×630 — OG image for pricing)
  images/
    hero-invoice-mockup.png (app invoice screenshot, high-quality)
    app-screenshot.png      (full app window screenshot)
    app-screenshot-2.png    (reports or bills list view)
    paper-texture.png       (tiling paper grain texture)
  icons/
    nib.svg                 (ink pen nib — logo icon)
    stamp-paid.svg          (rubber stamp "PAID")
    stamp-gst.svg           (rubber stamp "GST COMPLIANT")
    ledger-lines.svg        (decorative ledger line pattern)
    wax-seal.svg            (trust badge decoration)
    coffee-ring.svg         (testimonial card decoration)
  video/
    demo.mp4                (2-minute product demo video)
    demo-poster.png         (video thumbnail)
```

---

*End of BillFlow Website Design Specification*
*Version 1.0 — July 2025*
*This document covers design, content, and structure only.*
*No backend or source code implementation details are included.*
