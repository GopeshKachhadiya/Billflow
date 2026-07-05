import { motion } from "framer-motion";
import { Download, FileCheck2, Send, ArrowRight, Sparkles } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Download,
    title: "Download & Install (60 Sec)",
    description: "No tedious web signups or credit cards required. Download our lightweight Windows installer that runs smoothly on Windows 7, 10, and 11.",
    badge: "Lightweight 24MB",
    color: "from-fountain/20 to-fountain/5",
  },
  {
    number: "02",
    icon: FileCheck2,
    title: "Enter GSTIN & Firm Details (2 Min)",
    description: "Type your GST number and BillFlow automatically sets up your ledger book, state codes, bank QR code, and sequential invoice numbering.",
    badge: "Auto-Configuration",
    color: "from-stamp-gold/20 to-stamp-gold/5",
  },
  {
    number: "03",
    icon: Send,
    title: "Create & Share Bills (30 Sec)",
    description: "Select a customer from your Khata, add items from your catalogue, and hit Print or 1-Click WhatsApp send directly to their phone.",
    badge: "Instant WhatsApp",
    color: "from-stamp-green/20 to-stamp-green/5",
  },
];

export function HowItWorksPreview() {
  return (
    <section className="section-padding relative bg-surface border-t border-border overflow-hidden">
      {/* Background ledger grid */}
      <div className="absolute inset-0 ledger-lines opacity-40 pointer-events-none" />

      <div className="section-container relative z-10">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-background border border-border shadow-paper mb-4"
          >
            <Sparkles className="w-4 h-4 text-stamp-gold" />
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-text-secondary">Simple 3-Step Onboarding</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-text-primary tracking-tight mb-6"
          >
            From Download to Your First <span className="text-fountain underline decoration-wavy decoration-stamp-gold">Compliant Bill</span> in 5 Minutes.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="font-sans text-lg text-text-secondary"
          >
            No user manuals or CA training sessions needed. Here is how easy it is to switch your business to BillFlow.
          </motion.p>
        </div>

        {/* 3-Step Horizontal Grid with Connecting Line */}
        <div className="relative max-w-6xl mx-auto">
          {/* Animated Connecting Dashed Line (Desktop Only) */}
          <div className="hidden lg:block absolute top-24 left-20 right-20 h-0.5 border-t-2 border-dashed border-border z-0" />

          <div className="grid lg:grid-cols-3 gap-8 relative z-10">
            {steps.map((step, i) => {
              const IconComponent = step.icon;
              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.15 }}
                  whileHover={{ y: -8, transition: { duration: 0.2 } }}
                  className="paper-card p-8 rounded-paper-lg bg-background border border-border shadow-paper flex flex-col justify-between relative group hover:border-fountain hover:shadow-paper-lg transition-all"
                >
                  {/* Step Number Badge */}
                  <div className="absolute -top-4 -right-4 w-12 h-12 rounded-full bg-surface border-2 border-border font-serif text-lg font-bold text-text-muted flex items-center justify-center shadow-sm group-hover:border-fountain group-hover:text-fountain group-hover:scale-110 transition-all">
                    {step.number}
                  </div>

                  <div>
                    {/* Icon Box */}
                    <div className={`w-14 h-14 rounded-paper bg-gradient-to-br ${step.color} border border-border flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform`}>
                      <IconComponent className="w-7 h-7 text-fountain" />
                    </div>

                    {/* Tag */}
                    <span className="inline-block text-[11px] font-mono font-semibold uppercase tracking-wider px-2.5 py-1 rounded bg-surface border border-border text-text-secondary mb-3">
                      ✦ {step.badge}
                    </span>

                    {/* Title & Desc */}
                    <h3 className="font-serif text-xl font-bold text-text-primary mb-3 group-hover:text-fountain transition-colors">
                      {step.title}
                    </h3>
                    <p className="font-sans text-sm text-text-secondary leading-relaxed mb-6">
                      {step.description}
                    </p>
                  </div>

                  {/* Bottom link */}
                  <div className="pt-4 border-t border-border/60 flex items-center justify-between">
                    <span className="text-xs font-mono text-text-muted">Step {step.number} of 03</span>
                    <a href="#/how-it-works" className="text-xs font-semibold text-fountain hover:underline flex items-center gap-1">
                      See video demo <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-16 max-w-2xl mx-auto paper-card p-6 rounded-paper-lg bg-gradient-to-r from-fountain/10 via-surface to-stamp-gold/10 border border-border text-center flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <div className="text-left">
            <h4 className="font-serif text-base font-bold text-text-primary">Ready to test it out?</h4>
            <p className="text-xs text-text-secondary">Try all 22 workflows free for 14 days. No credit card.</p>
          </div>
          <a
            href="#/download"
            className="btn-fountain px-6 py-2.5 text-xs font-semibold whitespace-nowrap shadow-md no-underline text-white"
          >
            Download Now →
          </a>
        </motion.div>
      </div>
    </section>
  );
}
