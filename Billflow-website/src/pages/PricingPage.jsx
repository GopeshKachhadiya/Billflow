import { motion } from "framer-motion";
import { useState } from "react";
import { 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  HelpCircle, 
  Zap, 
  Award, 
  MessageSquare,
  Users,
  Database
} from "lucide-react";
import { CTASection } from "../components/CTASection";

const plans = [
  {
    name: "Monthly Flex",
    priceDisplay: "₹700",
    period: "/month",
    desc: "Flexible month-to-month billing with full access to all 22 core features on your Windows desktop.",
    badge: "Pay As You Go",
    popular: false,
    ctaText: "Start 14-Day Free Trial",
    ctaLink: "#/download",
    features: [
      { name: "Unlimited GST Invoices", included: true },
      { name: "Customer Khata & Ledger", included: true },
      { name: "1-Click WhatsApp & SMS Send", included: true },
      { name: "GSTR-1 JSON & Excel Export", included: true },
      { name: "100% Offline SQLite Storage", included: true },
      { name: "Real-time Cloud Sync & Backup", included: true },
      { name: "A4 & POS Thermal Print Layouts", included: true },
      { name: "Priority CA Setup Assistance", included: false },
    ],
  },
  {
    name: "6-Month Saver",
    priceDisplay: "₹600",
    period: "/month",
    desc: "Save ₹600 with our half-yearly package (billed ₹3,600 every 6 months). Ideal for growing stores & traders.",
    badge: "✦ MOST POPULAR · SAVE ₹600",
    popular: true,
    ctaText: "Start 14-Day Free Trial →",
    ctaLink: "#/download",
    features: [
      { name: "Unlimited GST Invoices", included: true },
      { name: "Customer Khata & Ledger", included: true },
      { name: "1-Click WhatsApp & SMS Send", included: true },
      { name: "GSTR-1 JSON & Excel Export", included: true },
      { name: "100% Offline SQLite Storage", included: true },
      { name: "Real-time Cloud Sync & Backup", included: true },
      { name: "A4 & POS Thermal Print Layouts", included: true },
      { name: "Priority CA Setup Assistance", included: true },
    ],
  },
  {
    name: "Annual Pro",
    priceDisplay: "₹500",
    period: "/month",
    desc: "Save ₹2,400 annually (billed ₹6,000 every 12 months)! Complete power for established businesses & multi-store setups.",
    badge: "Best Value · Save ₹2,400",
    popular: false,
    ctaText: "Start 14-Day Free Trial",
    ctaLink: "#/download",
    features: [
      { name: "Unlimited GST Invoices", included: true },
      { name: "Customer Khata & Ledger", included: true },
      { name: "1-Click WhatsApp & SMS Send", included: true },
      { name: "GSTR-1 JSON & Excel Export", included: true },
      { name: "100% Offline SQLite Storage", included: true },
      { name: "Real-time Cloud Sync & Backup", included: true },
      { name: "A4 & POS Thermal Print Layouts", included: true },
      { name: "Priority CA Setup Assistance", included: true },
    ],
  },
];

const comparisonMatrix = [
  { feature: "Offline-First SQLite Database", trial: "Yes", pro: "Yes", enterprise: "Yes" },
  { feature: "GST CGST/SGST/IGST Calculations", trial: "Yes", pro: "Yes", enterprise: "Yes" },
  { feature: "1-Click WhatsApp & SMS Sending", trial: "Yes", pro: "Yes", enterprise: "Yes" },
  { feature: "GSTR-1 JSON & Excel Export", trial: "Yes", pro: "Yes", enterprise: "Yes" },
  { feature: "POS Thermal & A4 Print Templates", trial: "Yes", pro: "Yes", enterprise: "Yes" },
  { feature: "Automated Google Drive Cloud Sync", trial: "Yes", pro: "Yes", enterprise: "Yes" },
  { feature: "Multi-User Staff Login Accounts", trial: "1 User", pro: "Up to 2 Staff", enterprise: "Up to 5 Staff" },
  { feature: "Multi-Branch Real-time Sync", trial: "No", pro: "Yes", enterprise: "Yes" },
  { feature: "Dedicated Setup Call with CA", trial: "No", pro: "Included", enterprise: "Priority (2 Hrs)" },
  { feature: "Support Channel", trial: "Email", pro: "Email & WhatsApp", enterprise: "24/7 Phone & WhatsApp VIP" },
];

export function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    <div className="min-h-screen bg-background pt-10 pb-20">
      {/* Page Header */}
      <section className="section-padding relative overflow-hidden bg-surface border-b border-border">
        <div className="absolute inset-0 ledger-lines opacity-30 pointer-events-none" />
        <div className="section-container relative z-10 text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-background border border-border shadow-paper mb-6"
          >
            <Award className="w-4 h-4 text-stamp-gold" />
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-text-secondary">Transparent Ledger Pricing</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-text-primary mb-6"
          >
            Simple, Honest Pricing for <span className="text-fountain underline decoration-stamp-gold">Indian Businesses</span>.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="font-sans text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto mb-10"
          >
            No hidden subscription traps or cloud storage fees. Start with a 14-day free trial and upgrade only when you see the value.
          </motion.p>

          {/* Billing Options Note */}
          <div className="inline-flex items-center px-6 py-2 rounded-full bg-background border border-border shadow-sm gap-2">
            <span className="font-serif text-sm font-semibold text-text-primary">All plans include a 14-Day Free Trial.</span>
            <span className="stamp-badge stamp-badge-gold text-[10px] py-0.5">Save up to ₹2,400 with Annual Billing</span>
          </div>
        </div>
      </section>

      {/* Pricing Cards Grid */}
      <section className="section-padding">
        <div className="section-container max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 items-stretch">
            {plans.map((plan, i) => {
              return (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.15 }}
                  whileHover={{ y: -8, transition: { duration: 0.3 } }}
                  className={`paper-card rounded-paper-xl p-8 flex flex-col justify-between relative transition-all ${
                    plan.popular
                      ? "bg-gradient-to-b from-[#fefefc] to-[#f9f6ed] border-2 border-fountain shadow-paper-xl scale-105 z-10"
                      : "bg-surface border border-border shadow-paper"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-fountain text-white font-mono text-xs font-bold uppercase tracking-widest px-4 py-1 rounded-full shadow-md whitespace-nowrap">
                      {plan.badge}
                    </div>
                  )}

                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="text-xs font-mono text-text-muted uppercase tracking-wider block mb-1">{plan.badge}</span>
                        <h3 className="font-serif text-2xl font-bold text-text-primary">{plan.name}</h3>
                      </div>
                    </div>

                    <div className="my-6 pb-6 border-b border-border flex items-baseline gap-1">
                      <span className="font-mono text-4xl sm:text-5xl font-extrabold text-text-primary tracking-tight">{plan.priceDisplay}</span>
                      <span className="text-xs font-mono text-text-muted">{plan.period}</span>
                    </div>

                    <p className="font-sans text-sm text-text-secondary leading-relaxed mb-6 min-h-[40px]">
                      {plan.desc}
                    </p>

                    {/* Features List */}
                    <div className="space-y-3 mb-8">
                      {plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm">
                          {feature.included ? (
                            <CheckCircle2 className="w-4 h-4 text-stamp-green flex-shrink-0 mt-0.5" />
                          ) : (
                            <XCircle className="w-4 h-4 text-border flex-shrink-0 mt-0.5" />
                          )}
                          <span className={feature.included ? "text-text-primary font-medium" : "text-text-muted line-through"}>
                            {feature.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CTA Button */}
                  <a
                    href={plan.ctaLink}
                    className={`w-full py-3.5 rounded-paper text-center font-serif text-sm font-semibold transition-all shadow-md block no-underline ${
                      plan.popular
                        ? "bg-fountain text-white hover:bg-fountain-light shadow-lg"
                        : "bg-background border border-border text-text-primary hover:border-fountain"
                    }`}
                  >
                    {plan.ctaText}
                  </a>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Feature Matrix Table */}
      <section className="section-padding bg-surface border-y border-border">
        <div className="section-container max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="stamp-badge stamp-badge-gold mb-3 inline-block">✦ DETAILED MATRIX</span>
            <h2 className="font-serif text-3xl font-bold text-text-primary">Compare All Features Side-by-Side</h2>
          </div>

          <div className="overflow-x-auto rounded-paper-lg border border-border bg-background shadow-paper">
            <table className="w-full text-left border-collapse font-sans text-xs sm:text-sm">
              <thead>
                <tr className="border-b-2 border-border bg-surface font-serif text-text-primary">
                  <th className="py-4 px-6 font-bold">Feature Capability</th>
                  <th className="py-4 px-4 text-center font-bold">Monthly Flex</th>
                  <th className="py-4 px-4 text-center font-bold text-fountain">6-Month Saver</th>
                  <th className="py-4 px-4 text-center font-bold">Annual Pro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {comparisonMatrix.map((row, i) => (
                  <tr key={i} className="hover:bg-surface/50 transition-colors">
                    <td className="py-3.5 px-6 font-medium text-text-primary">{row.feature}</td>
                    <td className="py-3.5 px-4 text-center text-text-secondary">{row.trial}</td>
                    <td className="py-3.5 px-4 text-center font-semibold text-fountain bg-fountain/5">{row.pro}</td>
                    <td className="py-3.5 px-4 text-center text-text-primary font-medium">{row.enterprise}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Custom Enterprise Quotation Strip */}
      <section className="section-padding">
        <div className="section-container max-w-4xl mx-auto paper-card p-8 sm:p-12 rounded-paper-xl bg-gradient-to-r from-surface-elevated via-surface to-surface-elevated text-text-primary border border-border text-center">
          <span className="stamp-badge stamp-badge-gold mb-4 inline-block">✦ FOR CA FIRMS & LARGE TRADERS</span>
          <h3 className="font-serif text-2xl sm:text-3xl font-bold mb-4 text-text-primary">Need More than 5 PC Licenses or Custom ERP Sync?</h3>
          <p className="font-sans text-sm sm:text-base text-text-secondary max-w-xl mx-auto mb-8">
            We offer custom volume pricing, dedicated CA onboarding support, and white-labeled PDF invoice layouts for associations and franchises.
          </p>
          <a href="#/contact" className="btn-fountain px-8 py-3 text-xs font-semibold text-white no-underline shadow-lg inline-flex items-center gap-2">
            Request Custom Quotation <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* Bottom CTA */}
      <CTASection />
    </div>
  );
}
export default PricingPage;
