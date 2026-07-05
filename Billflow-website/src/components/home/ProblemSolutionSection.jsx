import { motion } from "framer-motion";
import { XCircle, CheckCircle2, AlertTriangle, Sparkles, Clock, Calculator, ShieldCheck, WifiOff } from "lucide-react";

const beforeProblems = [
  "Spending 15–20 minutes manually writing or formatting a single bill",
  "Calculation mistakes in GST 5%, 12%, 18% leading to CA headaches",
  "Generic cloud software that gets slow or locks your data when internet drops",
  "Chasing customers for payment over phone with zero audit trail or reminders",
  "Complex SaaS dashboards with 100 features you never use or understand",
];

const afterSolutions = [
  "Generate professional, tax-compliant GST bills in under 30 seconds",
  "Automated state-wise CGST, SGST & IGST calculation with zero human error",
  "100% Offline-first desktop performance — lightning fast even without WiFi",
  "1-Click WhatsApp invoice & automated UPI payment reminder links",
  "Clean, familiar 'Digital Ledger' design that anyone can master in 5 minutes",
];

export function ProblemSolutionSection() {
  return (
    <section className="section-padding relative overflow-hidden bg-background">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[500px] bg-gradient-to-tr from-stamp-red/5 via-transparent to-fountain/5 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="section-container">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface border border-border shadow-paper mb-4"
          >
            <AlertTriangle className="w-4 h-4 text-stamp-red" />
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-text-secondary">Why We Built BillFlow</span>
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-text-primary tracking-tight mb-6"
          >
            Stop Wrestling With <span className="line-through text-stamp-red/70 decoration-2">Pen & Paper</span> or Clunky Enterprise Software.
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="font-sans text-lg text-text-secondary leading-relaxed"
          >
            Most accounting software is built for corporate CAs with degrees. We designed BillFlow specifically for the shop owner, distributor, and agency who wants compliance without the chaos.
          </motion.p>
        </div>

        {/* Two-Column Comparison Cards */}
        <div className="grid lg:grid-cols-2 gap-8 items-stretch max-w-6xl mx-auto">
          {/* Card 1: Before (The Old Way) */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -6, rotate: -0.5 }}
            transition={{ duration: 0.4, type: "spring" }}
            className="relative rounded-paper-lg bg-surface border-2 border-dashed border-stamp-red/30 p-8 shadow-paper flex flex-col justify-between overflow-hidden"
          >
            {/* Coffee Stain SVG Decor */}
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full border-[12px] border-[#8b5a2b]/10 pointer-events-none opacity-40 blur-[1px]" />
            <div className="absolute top-4 right-4 text-xs font-mono text-stamp-red/60 uppercase tracking-widest border border-stamp-red/20 px-2.5 py-1 rounded bg-stamp-red/5 rotate-6">
              ✦ OBSOLETE METHOD
            </div>

            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-stamp-red/10 border border-stamp-red/20 flex items-center justify-center text-stamp-red">
                  <XCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-serif text-2xl font-bold text-text-primary">The Traditional / SaaS Trap</h3>
                  <p className="text-xs font-mono text-stamp-red">High stress · Hidden fees · Data hostage</p>
                </div>
              </div>

              <div className="my-6 pt-6 border-t border-border/80 space-y-4">
                {beforeProblems.map((problem, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-stamp-red mt-1 font-bold text-sm">✕</span>
                    <p className="font-sans text-sm sm:text-base text-text-secondary leading-relaxed">
                      {problem}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-dashed border-border bg-background/50 -mx-8 -mb-8 p-6 rounded-b-paper-lg">
              <p className="font-handwriting text-xl text-stamp-red/90 text-center rotate-[-1deg]">
                "Arre yaar, server is down again and client is waiting at the counter!"
              </p>
            </div>
          </motion.div>

          {/* Card 2: After (The BillFlow Way) */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -6, rotate: 0.5 }}
            transition={{ duration: 0.4, type: "spring" }}
            className="relative rounded-paper-lg bg-gradient-to-b from-[#fefefc] to-[#f9f6ed] border-2 border-fountain p-8 shadow-paper-xl flex flex-col justify-between overflow-hidden"
          >
            {/* Stamp Badge */}
            <div className="absolute top-6 right-6">
              <span className="stamp-badge stamp-badge-green text-[11px]">
                ✦ VERIFIED COMPLIANT
              </span>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-fountain/10 border border-fountain/20 flex items-center justify-center text-fountain">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-serif text-2xl font-bold text-fountain">The BillFlow Digital Ledger</h3>
                  <p className="text-xs font-mono text-stamp-green font-semibold">Instant · Compliant · Peace of mind</p>
                </div>
              </div>

              <div className="my-6 pt-6 border-t border-fountain/20 space-y-4">
                {afterSolutions.map((solution, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-stamp-green mt-0.5 flex-shrink-0" />
                    <p className="font-sans text-sm sm:text-base text-text-primary font-medium leading-relaxed">
                      {solution}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-fountain/20 bg-fountain/5 -mx-8 -mb-8 p-6 rounded-b-paper-lg flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs font-mono font-semibold text-fountain">
                <Clock className="w-4 h-4" /> 30-Sec Average Bill Time
              </div>
              <a href="#/download" className="text-xs font-bold text-fountain hover:underline flex items-center gap-1">
                Try it free now →
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
