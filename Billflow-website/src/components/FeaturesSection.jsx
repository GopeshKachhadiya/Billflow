import { motion } from "framer-motion";
import { useState } from "react";
import { 
  FileText, 
  WifiOff, 
  Cloud, 
  MessageSquare, 
  Shield, 
  Zap, 
  BarChart3, 
  Users, 
  Lock, 
  Download,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Printer,
  Send,
  Database,
  Layers
} from "lucide-react";

export function FeaturesSection() {
  const [hoveredCard, setHoveredCard] = useState(null);

  return (
    <section className="relative section-padding overflow-hidden bg-background" aria-labelledby="features-heading">
      {/* Background aesthetics */}
      <div className="absolute inset-0 ledger-lines opacity-40 pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-tr from-fountain/10 via-transparent to-stamp-gold/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="section-container relative z-10">
        {/* Section Header */}
        <motion.div
          className="text-center max-w-3xl mx-auto mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.span className="badge-paper inline-block mb-4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
            ✦ ASYMMETRIC BENTO GRID POWER
          </motion.span>
          <h2 id="features-heading" className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-text-primary mb-4">
            Everything You Need to Run Your <span className="text-fountain underline decoration-stamp-gold">Business Ledger</span>
          </h2>
          <p className="font-sans text-base sm:text-lg text-text-secondary max-w-2xl mx-auto">
            We stripped away the confusing accounting jargon and packed 22 automated workflows into a familiar, lightning-fast digital ledger.
          </p>
        </motion.div>

        {/* Asymmetric Bento Grid (1 large + 4 medium + 1 large) */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {/* Card 1: Large (Span 2 col, 2 row on lg) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -6, transition: { duration: 0.3 } }}
            className="md:col-span-2 lg:col-span-2 lg:row-span-2 paper-card rounded-paper-xl bg-gradient-to-br from-surface via-background to-surface border border-border p-6 sm:p-8 shadow-paper flex flex-col justify-between relative group hover:border-fountain overflow-hidden"
          >
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-fountain/5 rounded-full blur-2xl pointer-events-none group-hover:bg-fountain/15 transition-colors" />
            
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-paper bg-fountain/10 border border-fountain/20 flex items-center justify-center text-fountain">
                  <FileText className="w-6 h-6" />
                </div>
                <span className="stamp-badge text-[10px]">✦ FLAGSHIP ENGINE</span>
              </div>
              
              <h3 className="font-serif text-2xl font-bold text-text-primary mb-3 group-hover:text-fountain transition-colors">
                The 30-Second GST Invoice Engine
              </h3>
              <p className="font-sans text-sm text-text-secondary leading-relaxed mb-6">
                Generate professional, tax-compliant GST invoices faster than writing on paper. Auto-detects state codes, calculates multi-slab CGST/SGST/IGST, and validates HSN/SAC codes instantly.
              </p>
            </div>

            {/* Interactive Mini Mockup */}
            <div className="rounded-paper bg-background text-text-primary p-4 font-mono text-xs shadow-inner border border-border relative overflow-hidden mt-auto">
              <div className="flex items-center justify-between pb-3 border-b border-border mb-3 text-[11px] text-text-muted">
                <span>NEW INVOICE #2026/104</span>
                <span className="text-stamp-green font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> GSTIN Validated</span>
              </div>
              <div className="space-y-2 mb-3">
                <div className="flex justify-between">
                  <span className="text-text-primary">1. Tata Steel Wire 8mm (100 Kg)</span>
                  <span className="text-text-primary font-bold">₹8,500</span>
                </div>
                <div className="flex justify-between text-[11px] text-text-muted">
                  <span>HSN: 7217 · GST @ 18%</span>
                  <span className="text-fountain font-semibold">+ ₹1,530 Tax</span>
                </div>
              </div>
              <div className="pt-3 border-t border-border flex items-center justify-between font-serif">
                <span className="text-xs text-text-secondary">Total Payable:</span>
                <span className="text-lg font-bold text-stamp-gold">₹10,030.00</span>
              </div>
            </div>
          </motion.div>

          {/* Card 2: Medium */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            whileHover={{ y: -6, transition: { duration: 0.3 } }}
            className="paper-card rounded-paper-xl bg-surface border border-border p-6 shadow-paper flex flex-col justify-between group hover:border-fountain overflow-hidden"
          >
            <div>
              <div className="w-12 h-12 rounded-paper bg-stamp-gold/10 border border-stamp-gold/20 flex items-center justify-center text-stamp-gold mb-5">
                <WifiOff className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-text-primary mb-2 group-hover:text-fountain transition-colors">
                100% Offline-First Architecture
              </h3>
              <p className="font-sans text-xs text-text-secondary leading-relaxed">
                Bill customers even when your WiFi is down. All data is encrypted locally in SQLite and syncs seamlessly to the cloud once online.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-border/80 flex items-center gap-2 text-[11px] font-mono text-stamp-green font-semibold">
              <Database className="w-3.5 h-3.5" /> Zero Data Loss Guarantee
            </div>
          </motion.div>

          {/* Card 3: Medium */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            whileHover={{ y: -6, transition: { duration: 0.3 } }}
            className="paper-card rounded-paper-xl bg-surface border border-border p-6 shadow-paper flex flex-col justify-between group hover:border-fountain overflow-hidden"
          >
            <div>
              <div className="w-12 h-12 rounded-paper bg-stamp-green/10 border border-stamp-green/20 flex items-center justify-center text-stamp-green mb-5">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-text-primary mb-2 group-hover:text-fountain transition-colors">
                1-Click WhatsApp & SMS
              </h3>
              <p className="font-sans text-xs text-text-secondary leading-relaxed">
                Deliver PDF bills and UPI payment reminder links directly to your customer's WhatsApp without saving their phone number.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-border/80 flex items-center gap-2 text-[11px] font-mono text-stamp-green font-semibold">
              <Send className="w-3.5 h-3.5" /> Automated Reminders
            </div>
          </motion.div>

          {/* Card 4: Medium */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            whileHover={{ y: -6, transition: { duration: 0.3 } }}
            className="paper-card rounded-paper-xl bg-surface border border-border p-6 shadow-paper flex flex-col justify-between group hover:border-fountain overflow-hidden"
          >
            <div>
              <div className="w-12 h-12 rounded-paper bg-stamp-red/10 border border-stamp-red/20 flex items-center justify-center text-stamp-red mb-5">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-text-primary mb-2 group-hover:text-fountain transition-colors">
                Auto GSTR-1 & Tax Ready
              </h3>
              <p className="font-sans text-xs text-text-secondary leading-relaxed">
                Export portal-ready GSTR-1 JSON and Excel reports with 1 click. Eliminates manual data entry and saves CA consultancy fees.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-border/80 flex items-center gap-2 text-[11px] font-mono text-stamp-red font-semibold">
              <Download className="w-3.5 h-3.5" /> Portal JSON Ready
            </div>
          </motion.div>

          {/* Card 5: Medium */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            whileHover={{ y: -6, transition: { duration: 0.3 } }}
            className="paper-card rounded-paper-xl bg-surface border border-border p-6 shadow-paper flex flex-col justify-between group hover:border-fountain overflow-hidden"
          >
            <div>
              <div className="w-12 h-12 rounded-paper bg-fountain/10 border border-fountain/20 flex items-center justify-center text-fountain mb-5">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-text-primary mb-2 group-hover:text-fountain transition-colors">
                Customer Khata & Ledger
              </h3>
              <p className="font-sans text-xs text-text-secondary leading-relaxed">
                Maintain a clean digital khata book. Track customer outstanding balances, payment history, and credit limits effortlessly.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-border/80 flex items-center gap-2 text-[11px] font-mono text-fountain font-semibold">
              <Layers className="w-3.5 h-3.5" /> Instant Balance Tracking
            </div>
          </motion.div>

          {/* Card 6: Large (Span 2 col on lg) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            whileHover={{ y: -6, transition: { duration: 0.3 } }}
            className="md:col-span-2 lg:col-span-2 paper-card rounded-paper-xl bg-gradient-to-r from-surface to-surface-elevated text-text-primary border border-border p-6 sm:p-8 shadow-paper-xl flex flex-col justify-between group hover:border-fountain overflow-hidden"
          >
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-paper bg-stamp-gold/20 border border-stamp-gold/40 flex items-center justify-center text-stamp-gold">
                  <Zap className="w-6 h-6" />
                </div>
                <span className="stamp-badge stamp-badge-gold text-[10px]">✦ 22 WORKFLOWS IN 1</span>
              </div>
              
              <h3 className="font-serif text-2xl font-bold text-text-primary mb-3 group-hover:text-fountain transition-colors">
                From Quotations to Delivery Challans
              </h3>
              <p className="font-sans text-sm text-text-secondary leading-relaxed mb-6">
                One software replaces 5 tools. Easily convert Quotations into Invoices, manage Inventory items, generate Delivery Challans, record Expenses, and print E-Way bills.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-border">
              {[
                "Quotations & Proforma",
                "Delivery Challans",
                "Expense Tracking",
                "Inventory Register",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 bg-background p-2.5 rounded border border-border text-xs font-mono text-text-primary">
                  <span className="text-stamp-gold">✓</span>
                  <span className="truncate">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Bottom Call to Action */}
        <motion.div
          className="mt-16 paper-card-elevated p-8 md:p-12 text-center border-gradient-gold bg-gradient-to-b from-surface to-background rounded-paper-xl shadow-paper-lg"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, delay: 0.3 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-fountain/10 text-fountain mb-4 border border-fountain/20">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs font-mono font-semibold uppercase tracking-wider">Experience all 22 features live</span>
          </div>
          <h3 className="font-serif text-3xl sm:text-4xl font-bold text-text-primary mb-4">
            Ready to upgrade your accounting ledger?
          </h3>
          <p className="font-sans text-base sm:text-lg text-text-secondary mb-8 max-w-xl mx-auto">
            Start your 14-day free trial today. Download our Windows desktop application with zero credit card needed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#/download" className="btn-fountain px-8 py-3 text-sm font-semibold text-white no-underline shadow-lg">
              Download Free for Windows →
            </a>
            <a href="#/features" className="btn-ink-outline px-8 py-3 text-sm font-semibold border-border">
              Explore Full Feature Matrix
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}