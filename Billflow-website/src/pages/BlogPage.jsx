import { motion } from "framer-motion";
import { useState } from "react";
import { 
  BookOpen, 
  Clock, 
  User, 
  ArrowRight, 
  Sparkles, 
  Tag, 
  Share2, 
  CheckCircle2, 
  X,
  FileText
} from "lucide-react";
import { CTASection } from "../components/CTASection";

const articles = [
  {
    id: 1,
    title: "GSTR-1 Filing Rules Explained for 2026: What Indian Shop Owners Need to Know",
    category: "GST Compliance",
    readTime: "6 Min Read",
    author: "CA Priya Sharma",
    date: "July 2, 2026",
    featured: true,
    excerpt: "With the latest CBIC guidelines for 2026, understanding HSN code requirements and B2B invoice matching is critical to avoid portal penalties.",
    content: `The Goods and Services Tax (GST) landscape in India continues to evolve, bringing more transparency and automation to monthly tax filings. For small and medium business owners, staying compliant with GSTR-1 rules is essential not just for avoiding penalties, but for ensuring your B2B customers receive their Input Tax Credit (ITC) without delays.

### What has changed in 2026?
1. **Mandatory 6-Digit HSN Codes:** For businesses with an annual aggregate turnover above ₹5 Crore, specifying 6-digit HSN or SAC codes on all B2B tax invoices is now strictly enforced by the GST portal validation engine.
2. **Real-time 2B Auto-Drafting:** The timeline for uploading outward supplies has been streamlined. Invoices uploaded via GSTR-1 automatically reflect in your recipient's GSTR-2B statement within 24 hours.

### How BillFlow Automates This For You
Instead of manually compiling Excel spreadsheets at month-end, BillFlow records every invoice transaction in real-time in its encrypted offline SQLite database. When you are ready to file:
- Simply navigate to the **Tax & GSTR-1** tab in BillFlow Desktop.
- Click **Generate GSTR-1 JSON**. BillFlow automatically validates HSN codes, checks state codes against GSTIN prefixes, and produces a Government portal-verified JSON file.
- Upload the file directly to gov.in without paying expensive data-entry fees!`,
  },
  {
    id: 2,
    title: "e-Invoicing Limit Changes for 2026: Is Your Business Affected?",
    category: "Tax Regulations",
    readTime: "5 Min Read",
    author: "Rajesh Mehta, Founder",
    date: "June 28, 2026",
    featured: false,
    excerpt: "The Government is gradually lowering the turnover threshold for mandatory e-Invoicing. Check if your trade or retail shop falls under the new bracket.",
    content: `Electronic Invoicing (e-Invoicing) is rapidly becoming the standard for Indian B2B transactions. By generating an Invoice Reference Number (IRN) and QR code directly from the Invoice Registration Portal (IRP), businesses ensure complete authenticity and real-time tax tracking.

### Who needs e-Invoicing today?
If your business aggregate turnover exceeded the specified notification limit in any preceding financial year from 2017-18 onwards, generating e-Invoices is mandatory for all B2B supplies and exports.

### Why Desktop Offline Software is Superior for e-Invoicing
Cloud accounting software often suffers from API timeouts when the Government IRP server experiences heavy traffic. With BillFlow Desktop, your invoices are generated locally instantly. The software cues the IRN requests in the background and syncs seamlessly without blocking your shop counter billing!`,
  },
  {
    id: 3,
    title: "Offline vs Cloud Accounting: Why Indian Traders Are Returning to Desktop Software",
    category: "Technology",
    readTime: "7 Min Read",
    author: "Amit Patel, Eng Lead",
    date: "June 20, 2026",
    featured: false,
    excerpt: "Cloud outages, rising subscription fees, and data privacy concerns have sparked a massive resurgence in offline-first desktop ledger software.",
    content: `Over the past decade, enterprise SaaS companies pushed Indian merchants toward 100% cloud-based accounting dashboards. While cloud accessibility offers benefits, it introduced severe drawbacks for daily shop operations:
- **The WiFi Dependency Trap:** When your internet drops during peak market hours, cloud software freezes, leaving customers waiting at the counter.
- **Data Hostage Subscriptions:** If you stop paying monthly cloud fees, many SaaS providers lock access to your historical financial records.

### The BillFlow Hybrid Solution
BillFlow combines the best of both worlds:
1. **100% Offline Billing Engine:** All data lives on your computer's hard drive in an encrypted SQLite database. Invoicing takes less than 1 second.
2. **Automated Background Cloud Sync:** When internet is available, BillFlow silently backs up your ledger to your personal Google Drive or our secure Indian cloud servers. You own your data forever.`,
  },
  {
    id: 4,
    title: "WhatsApp DLT Registration: How to Legally Send Invoices & Payment Reminders",
    category: "Business Guides",
    readTime: "4 Min Read",
    author: "CA Priya Sharma",
    date: "June 14, 2026",
    featured: false,
    excerpt: "Learn how to comply with TRAI DLT regulations while leveraging WhatsApp Business to send automated invoice PDFs and payment reminder links.",
    content: `Sending invoices and payment reminders via WhatsApp is the fastest way to get paid in India today. However, understanding how to use WhatsApp Business messaging without facing spam blocks is important.

### Why 1-Click WhatsApp in BillFlow is Different
Unlike generic broadcast tools, BillFlow integrates directly with your desktop WhatsApp application or WhatsApp Business API:
- **No Contact Saving Required:** BillFlow opens a direct chat window using the customer's phone number without cluttering your phone contact book.
- **Pre-Formatted Professional Templates:** Messages include your firm name, invoice number, due amount, and an attached PDF invoice automatically.`,
  },
  {
    id: 5,
    title: "How to Calculate Input Tax Credit (ITC) Without CA Mistakes",
    category: "GST Compliance",
    readTime: "6 Min Read",
    author: "CA Priya Sharma",
    date: "June 05, 2026",
    featured: false,
    excerpt: "Master the rules of claiming GST Input Tax Credit on shop expenses, purchase inventory, and capital goods to maximize your legal tax savings.",
    content: `Input Tax Credit (ITC) is the backbone of GST, allowing businesses to reduce their tax liability by claiming credit for GST paid on business purchases and expenses.

### Common ITC Mistakes to Avoid
1. **Mismatched GSTINs:** Claiming credit on an invoice where the supplier typed your GSTIN incorrectly.
2. **Ineligible Expenses:** Claiming ITC on blocked credits under Section 17(5) such as personal motor vehicles or food and beverages.

BillFlow automatically categorizes your purchase invoices and warns you if an HSN code falls under blocked ITC categories, ensuring clean audits every time.`,
  },
  {
    id: 6,
    title: "5 Simple Ways to Reduce Customer Overdue Payment Times by 40%",
    category: "Cashflow",
    readTime: "5 Min Read",
    author: "Rajesh Mehta, Founder",
    date: "May 28, 2026",
    featured: false,
    excerpt: "Practical ledger management strategies to maintain healthy customer relationships while ensuring your receivables are collected on time.",
    content: `Cashflow is the lifeblood of any trading or retail business. When customer khata balances remain overdue for months, it hampers your ability to purchase new inventory.

### 5 Proven Action Steps:
1. **Set Clear Credit Limits in Your Khata:** Use BillFlow to set a maximum outstanding limit per customer. The system alerts you before you issue a new bill to an overdue account.
2. **Send Instant UPI QR Codes:** Make paying effortless. Every BillFlow invoice includes a dynamic UPI QR code with the exact bill amount pre-filled.
3. **Automate 7-Day & 14-Day Reminders:** Don't chase clients manually over phone calls. Let automated, polite WhatsApp reminder links do the work for you.`,
  },
];

export function BlogPage() {
  const [selectedArticle, setSelectedArticle] = useState(null);
  const featuredArticle = articles.find(a => a.featured);
  const regularArticles = articles.filter(a => !a.featured);

  return (
    <div className="min-h-screen bg-background pt-10 pb-20">
      {/* Header */}
      <section className="section-padding relative overflow-hidden bg-surface border-b border-border">
        <div className="absolute inset-0 ledger-lines opacity-30 pointer-events-none" />
        <div className="section-container relative z-10 text-center max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-background border border-border shadow-paper mb-6"
          >
            <BookOpen className="w-4 h-4 text-stamp-gold" />
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-text-secondary">Knowledge Base</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-text-primary mb-6"
          >
            GST Guides & Digital <span className="text-fountain underline decoration-stamp-gold">Ledger Insights</span>.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="font-sans text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed"
          >
            Expert advice from Chartered Accountants and engineering leaders on GST compliance, offline accounting, and shop cashflow optimization.
          </motion.p>
        </div>
      </section>

      {/* Featured Article Card */}
      {featuredArticle && (
        <section className="section-padding">
          <div className="section-container max-w-6xl mx-auto">
            <div 
              onClick={() => setSelectedArticle(featuredArticle)}
              className="paper-card p-8 sm:p-12 rounded-paper-xl bg-gradient-to-br from-surface via-background to-surface border-2 border-fountain shadow-paper-xl cursor-pointer group hover:shadow-[0_20px_50px_rgba(27,77,62,0.15)] transition-all relative overflow-hidden"
            >
              <div className="absolute top-6 right-6 stamp-badge stamp-badge-gold text-xs">
                ✦ FEATURED ARTICLE
              </div>

              <div className="max-w-3xl">
                <div className="flex items-center gap-4 text-xs font-mono text-text-muted mb-4">
                  <span className="px-2.5 py-1 rounded bg-fountain/10 text-fountain font-bold">{featuredArticle.category}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {featuredArticle.readTime}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {featuredArticle.author}</span>
                </div>

                <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-text-primary mb-4 group-hover:text-fountain transition-colors">
                  {featuredArticle.title}
                </h2>

                <p className="font-sans text-base text-text-secondary leading-relaxed mb-8">
                  {featuredArticle.excerpt}
                </p>

                <div className="inline-flex items-center gap-2 font-serif font-bold text-sm text-fountain group-hover:translate-x-2 transition-transform">
                  Read Full Guide <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Regular Articles Grid */}
      <section className="section-padding pt-0">
        <div className="section-container max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {regularArticles.map((art) => (
              <motion.div
                key={art.id}
                onClick={() => setSelectedArticle(art)}
                whileHover={{ y: -6, borderColor: 'var(--color-fountain)' }}
                className="paper-card p-6 rounded-paper-lg bg-surface border border-border shadow-paper flex flex-col justify-between cursor-pointer group transition-all"
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-mono text-text-muted mb-3">
                    <span className="text-fountain font-semibold">{art.category}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {art.readTime}</span>
                  </div>

                  <h3 className="font-serif text-lg font-bold text-text-primary mb-3 group-hover:text-fountain transition-colors line-clamp-2">
                    {art.title}
                  </h3>

                  <p className="font-sans text-xs text-text-secondary leading-relaxed mb-6 line-clamp-3">
                    {art.excerpt}
                  </p>
                </div>

                <div className="pt-4 border-t border-border/60 flex items-center justify-between text-xs font-mono text-text-muted">
                  <span>By {art.author}</span>
                  <span className="text-fountain font-bold group-hover:underline flex items-center gap-1">Read →</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Article Reader Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 sm:p-6 overflow-y-auto backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-background border-2 border-border rounded-paper-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-10 relative shadow-paper-xl my-auto"
          >
            <button
              onClick={() => setSelectedArticle(null)}
              className="absolute top-6 right-6 p-2 rounded-full bg-surface border border-border text-text-muted hover:text-text-primary hover:border-fountain transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 text-xs font-mono text-fountain font-bold mb-3">
              <span>{selectedArticle.category}</span>
              <span>•</span>
              <span>{selectedArticle.readTime}</span>
            </div>

            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-text-primary mb-4">
              {selectedArticle.title}
            </h2>

            <div className="flex items-center gap-4 text-xs font-mono text-text-muted pb-6 border-b border-border mb-6">
              <span>By {selectedArticle.author}</span>
              <span>•</span>
              <span>Published on {selectedArticle.date}</span>
            </div>

            <div className="font-sans text-sm sm:text-base text-text-secondary leading-relaxed space-y-4 whitespace-pre-line">
              {selectedArticle.content}
            </div>

            <div className="mt-10 pt-6 border-t border-border flex items-center justify-between">
              <span className="text-xs font-mono text-text-muted">Hope this guide was helpful for your billing setup!</span>
              <button
                onClick={() => setSelectedArticle(null)}
                className="px-5 py-2 rounded bg-fountain text-white font-serif text-xs font-bold shadow-sm hover:bg-fountain-light"
              >
                Close Guide
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Bottom CTA */}
      <CTASection />
    </div>
  );
}
export default BlogPage;
