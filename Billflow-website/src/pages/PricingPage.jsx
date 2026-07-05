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
    name: "14-Day Free Trial",
    priceMonthly: "₹0",
    priceAnnual: "₹0",
    desc: "Perfect for testing all 22 features on your Windows desktop with zero commitment.",
    badge: "No Credit Card",
    popular: false,
    ctaText: "Download Free Now",
    ctaLink: "#/download",
    features: [
      { name: "Unlimited GST Invoices", included: true },
      { name: "Customer Khata & Ledger", included: true },
      { name: "1-Click WhatsApp Send", included: true },
      { name: "GSTR-1 JSON & Excel Export", included: true },
      { name: "100% Offline SQLite Storage", included: true },
      { name: "Multi-User Role Permissions", included: false },
      { name: "Automated Google Drive Sync", included: false },
      { name: "Dedicated Setup Call with CA", included: false },
    ],
  },
  {
    name: "Shop Owner Pro",
    priceMonthly: "₹149",
    priceAnnual: "₹1,499",
    periodMonthly: "/month",
    periodAnnual: "/year",
    desc: "The complete digital ledger for single-retail stores, distributors, and traders.",
    badge: "✦ MOST POPULAR · SAVE 20%",
    popular: true,
    ctaText: "Start Pro Trial →",
    ctaLink: "#/download",
    features: [
      { name: "Unlimited GST Invoices", included: true },
      { name: "Customer Khata & Ledger", included: true },
      { name: "1-Click WhatsApp Send", included: true },
      { name: "GSTR-1 JSON & Excel Export", included: true },
      { name: "100% Offline SQLite Storage", included: true },
      { name: "Automated Google Drive Sync", included: true },
      { name: "A4 & POS Thermal Print Layouts", included: true },
      { name: "Multi-User Role Permissions", included: false },
    ],
  },
  {
    name: "Multi-Store Enterprise",
    priceMonthly: "₹349",
    priceAnnual: "₹3,499",
    periodMonthly: "/month",
    periodAnnual: "/year",
    desc: "For growing agencies, multi-branch distributors, and businesses with multiple cashiers.",
    badge: "Full Power",
    popular: false,
    ctaText: "Contact Sales / Buy Now",
    ctaLink: "#/contact",
    features: [
      { name: "Everything in Shop Owner Pro", included: true },
      { name: "Up to 5 Windows PC Licenses", included: true },
      { name: "Multi-User Role Permissions (Cashier/Admin)", included: true },
      { name: "Real-time Cloud Branch Sync", included: true },
      { name: "Dedicated 2-Hour Setup Call with CA", included: true },
      { name: "Custom PDF Invoice Branding & Watermark", included: true },
      { name: "Priority Telephone & WhatsApp Support", included: true },
      { name: "Custom API & ERP Integration", included: true },
    ],
  },
];

const comparisonMatrix = [
  { feature: "Offline-First SQLite Database", trial: "Yes", pro: "Yes", enterprise: "Yes" },
  { feature: "GST CGST/SGST/IGST Calculations", trial: "Yes", pro: "Yes", enterprise: "Yes" },
  { feature: "1-Click WhatsApp & SMS Sending", trial: "Yes", pro: "Yes", enterprise: "Yes" },
  { feature: "GSTR-1 JSON & Excel Export", trial: "Yes", pro: "Yes", enterprise: "Yes" },
  { feature: "POS Thermal & A4 Print Templates", trial: "Yes", pro: "Yes", enterprise: "Yes" },
  { feature: "Automated Google Drive Cloud Sync", trial: "No", pro: "Yes", enterprise: "Yes" },
  { feature: "Multi-User Staff Login Accounts", trial: "No", pro: "No", enterprise: "Up to 5 Staff" },
  { feature: "Multi-Branch Real-time Sync", trial: "No", pro: "No", enterprise: "Yes" },
  { feature: "Dedicated Setup Call with CA", trial: "No", pro: "No", enterprise: "Included (2 Hrs)" },
  { feature: "Support Channel", trial: "Email", pro: "Email & Chat", enterprise: "24/7 Phone & WhatsApp" },
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

          {/* Billing Frequency Toggle */}
          <div className="inline-flex items-center p-1.5 rounded-full bg-background border border-border shadow-sm gap-2">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-5 py-2 rounded-full font-serif text-sm font-semibold transition-all ${!isAnnual ? "bg-fountain text-white shadow" : "text-text-secondary hover:text-text-primary"}`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-5 py-2 rounded-full font-serif text-sm font-semibold transition-all flex items-center gap-2 ${isAnnual ? "bg-fountain text-white shadow" : "text-text-secondary hover:text-text-primary"}`}
            >
              <span>Annual Billing</span>
              <span className="stamp-badge stamp-badge-gold text-[10px] py-0.5">Save 20% + Free CA Setup</span>
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Cards Grid */}
      <section className="section-padding">
        <div className="section-container max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 items-stretch">
            {plans.map((plan, i) => {
              const price = isAnnual ? plan.priceAnnual : plan.priceMonthly;
              const period = isAnnual ? (plan.periodAnnual || "") : (plan.periodMonthly || "");
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
                      <span className="font-mono text-4xl sm:text-5xl font-extrabold text-text-primary tracking-tight">{price}</span>
                      <span className="text-xs font-mono text-text-muted">{period}</span>
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
                  <th className="py-4 px-4 text-center font-bold">14-Day Free Trial</th>
                  <th className="py-4 px-4 text-center font-bold text-fountain">Shop Owner Pro</th>
                  <th className="py-4 px-4 text-center font-bold">Multi-Store Enterprise</th>
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
