import { motion } from "framer-motion";
import { CheckCircle2, XCircle, HelpCircle, ArrowRight, ShieldCheck, Zap, Award } from "lucide-react";

export function ComparisonSection() {
  const competitors = [
    { name: "TallyPrime", desc: "Clunky & Complex" },
    { name: "Zoho Books", desc: "Cloud-Locked SaaS" },
    { name: "Odoo ERP", desc: "Enterprise Overkill" },
    { name: "Miracle", desc: "Locked Legacy App" }
  ];

  const features = [
    {
      title: "Offline Autonomy",
      desc: "Keeps running even during power cuts or internet outages. Zero billing counter delays.",
      billflow: "100% Offline-First. Automatically syncs when internet returns.",
      tally: "Offline only. No modern cloud syncing/backups.",
      zoho: "Cloud-locked. If internet drops, your billing stops.",
      odoo: "Cloud-locked. Relies on active internet or heavy local server installation.",
      miracle: "PC-Locked. No automatic cloud backup or remote syncing.",
      status: { bf: "yes", ty: "neutral", zh: "no", od: "no", mc: "neutral" }
    },
    {
      title: "Learning Curve",
      desc: "Familiar digital ledger interface designed for the actual business owner, not just CAs.",
      billflow: "None. Set up and generate your first tax bill in under 5 minutes.",
      tally: "Extremely steep. Requires formal classes or a dedicated accountant.",
      zoho: "Moderate. Dozens of complex cloud accounting modules to navigate.",
      odoo: "Heavy. Massive enterprise resource system that takes months to configure.",
      miracle: "Legacy. Complex old-school database menus and layout.",
      status: { bf: "yes", ty: "no", zh: "neutral", od: "no", mc: "no" }
    },
    {
      title: "Built-in Automations",
      desc: "Send instant notifications via customer's preferred communication channels.",
      billflow: "Built-in. Send bills & auto reminders directly to WhatsApp/SMS in 1-click.",
      tally: "None. Requires expensive, custom TDL programming or plugins.",
      zoho: "Limited. Requires setting up custom webhook flows or manual emails.",
      odoo: "Complex. Requires custom developer script configurations.",
      miracle: "None. Only standard manual PDF generation and export.",
      status: { bf: "yes", ty: "no", zh: "neutral", od: "no", mc: "no" }
    },
    {
      title: "Privacy & Encryption",
      desc: "Absolute ownership of your data. Secure from tax leaks and third-party SaaS downtime.",
      billflow: "AES-256 local database encryption. Fully private and GDPR compliant.",
      tally: "Local files are unencrypted and vulnerable to copy-paste theft.",
      zoho: "Stored entirely on Zoho cloud servers (no local control).",
      odoo: "Stored in third-party data centers or self-hosted SQL databases.",
      miracle: "Stored locally in legacy files, no database level encryption.",
      status: { bf: "yes", ty: "neutral", zh: "neutral", od: "neutral", mc: "neutral" }
    },
    {
      title: "Licensing & Freedom",
      desc: "Modern SaaS pricing with no hardware key locking or activation headaches.",
      billflow: "No Dongle. Simply log in and access your account securely.",
      tally: "Dongle / Node locked. Licensing extra for multiple machines.",
      zoho: "No Dongle, but expensive user seats and transaction limits.",
      odoo: "No Dongle, but requires heavy subscription charges per app module.",
      miracle: "Hardware Dongle required. Locked to a single physical PC.",
      status: { bf: "yes", ty: "yes", zh: "yes", od: "yes", mc: "no" }
    },
    {
      title: "CA Collaboration",
      desc: "Seamlessly export compliance data for standard government filings.",
      billflow: "1-Click automated GSTR-1 JSON export ready for filing.",
      tally: "Standard, but files must be prepared manually by an CA.",
      zoho: "Supported, but settings are rigid and prone to custom invoice errors.",
      odoo: "Requires expensive custom module configurations for Indian GST.",
      miracle: "Supported, but exports require manual formatting adjustments.",
      status: { bf: "yes", ty: "yes", zh: "neutral", od: "no", mc: "neutral" }
    }
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case "yes":
        return <CheckCircle2 className="w-5 h-5 text-stamp-green inline-block" />;
      case "no":
        return <XCircle className="w-5 h-5 text-stamp-red inline-block" />;
      case "neutral":
      default:
        return <HelpCircle className="w-5 h-5 text-stamp-gold inline-block" />;
    }
  };

  return (
    <section className="section-padding relative overflow-hidden bg-background border-t border-border" id="comparison">
      {/* Decorative ledger red line on left margin */}
      <div className="absolute left-4 top-0 bottom-0 w-[1px] bg-stamp-red/10 hidden md:block" />
      <div className="absolute left-6 top-0 bottom-0 w-[1px] bg-stamp-red/10 hidden md:block" />

      <div className="section-container">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface border border-border shadow-paper mb-4"
          >
            <Award className="w-4 h-4 text-brand-accent" />
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-text-secondary">Side-by-Side Comparison</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-text-primary tracking-tight mb-6"
          >
            The Truth: How BillFlow Compares
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="font-sans text-lg text-text-muted leading-relaxed"
          >
            Don't get locked into complex systems that require a degree to operate, or cloud software that halts when your internet goes down. Compare the facts honestly.
          </motion.p>
        </div>

        {/* Ledger-Style Comparison Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="overflow-x-auto rounded-paper-lg border border-border bg-surface shadow-paper-xl mb-16"
        >
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-border bg-surface-elevated">
                <th className="p-5 font-serif text-base font-bold text-text-primary w-1/4">Core Capabilities</th>
                <th className="p-5 font-serif text-base font-bold text-brand-primary w-1/4 relative bg-paper-100/50 border-x border-border">
                  <div className="flex items-center gap-2">
                    <span className="text-brand-accent">✦</span> BillFlow
                    <span className="absolute -top-3 right-4 font-mono text-[9px] font-bold bg-brand-primary text-surface-elevated py-1 px-2.5 rounded-full border border-brand-accent tracking-widest uppercase">Best Choice</span>
                  </div>
                </th>
                <th className="p-5 font-serif text-sm font-semibold text-text-muted w-1/8">TallyPrime</th>
                <th className="p-5 font-serif text-sm font-semibold text-text-muted w-1/8">Zoho Books</th>
                <th className="p-5 font-serif text-sm font-semibold text-text-muted w-1/8">Odoo ERP</th>
                <th className="p-5 font-serif text-sm font-semibold text-text-muted w-1/8">Miracle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {features.map((item, index) => (
                <tr key={index} className="hover:bg-surface-elevated/40 transition-colors">
                  {/* Feature description */}
                  <td className="p-5">
                    <div className="font-serif text-sm font-bold text-text-primary mb-1">{item.title}</div>
                    <div className="font-sans text-xs text-text-muted leading-relaxed">{item.desc}</div>
                  </td>
                  {/* Billflow column */}
                  <td className="p-5 bg-paper-200/20 border-x border-border font-serif text-xs text-text-secondary font-medium leading-relaxed relative">
                    <div className="flex items-start gap-2.5">
                      <span className="mt-0.5">{getStatusIcon(item.status.bf)}</span>
                      <span>{item.billflow}</span>
                    </div>
                  </td>
                  {/* Tally */}
                  <td className="p-5 font-sans text-xs text-text-muted leading-relaxed">
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5">{getStatusIcon(item.status.ty)}</span>
                      <span>{item.tally}</span>
                    </div>
                  </td>
                  {/* Zoho */}
                  <td className="p-5 font-sans text-xs text-text-muted leading-relaxed">
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5">{getStatusIcon(item.status.zh)}</span>
                      <span>{item.zoho}</span>
                    </div>
                  </td>
                  {/* Odoo */}
                  <td className="p-5 font-sans text-xs text-text-muted leading-relaxed">
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5">{getStatusIcon(item.status.od)}</span>
                      <span>{item.odoo}</span>
                    </div>
                  </td>
                  {/* Miracle */}
                  <td className="p-5 font-sans text-xs text-text-muted leading-relaxed">
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5">{getStatusIcon(item.status.mc)}</span>
                      <span>{item.miracle}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        {/* Highlight Why BillFlow Wins */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="paper-card p-8 rounded-paper-xl bg-surface border border-border shadow-paper hover:shadow-paper-md transition-shadow relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-brand-accent/5 to-transparent rounded-bl-full" />
            <div className="w-10 h-10 rounded-paper bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent mb-6 group-hover:scale-110 transition-transform">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-bold text-text-primary mb-3">1. Built for Speed, Not Bloat</h3>
            <p className="font-sans text-sm text-text-muted leading-relaxed">
              Zoho and Odoo offer thousands of buttons you'll never press. BillFlow strips the noise, giving you a clean paper-like billing interface that anybody can operate on day one.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="paper-card p-8 rounded-paper-xl bg-surface border border-border shadow-paper hover:shadow-paper-md transition-shadow relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-stamp-green/5 to-transparent rounded-bl-full" />
            <div className="w-10 h-10 rounded-paper bg-stamp-green/10 border border-stamp-green/20 flex items-center justify-center text-stamp-green mb-6 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-bold text-text-primary mb-3">2. 100% Offline Resilience</h3>
            <p className="font-sans text-sm text-text-muted leading-relaxed">
              Don't lose sales when the internet drops. Unlike cloud-locked Zoho or Odoo, BillFlow runs entirely locally. It secures your ledger with local encryption and syncs silently when WiFi returns.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="paper-card p-8 rounded-paper-xl bg-surface border border-border shadow-paper hover:shadow-paper-md transition-shadow relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-stamp-red/5 to-transparent rounded-bl-full" />
            <div className="w-10 h-10 rounded-paper bg-stamp-red/10 border border-stamp-red/20 flex items-center justify-center text-stamp-red mb-6 group-hover:scale-110 transition-transform">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-bold text-text-primary mb-3">3. No Dongles or Lock-ins</h3>
            <p className="font-sans text-sm text-text-muted leading-relaxed">
              Miracle and other regional apps require physical USB keys or lock licenses to a single PC. BillFlow gives you the freedom to log in from anywhere with seamless automated messaging.
            </p>
          </motion.div>
        </div>

        {/* CA/Business note */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mt-16 p-6 rounded-paper bg-surface border-2 border-dashed border-brand-accent/30 text-center max-w-3xl mx-auto"
        >
          <span className="font-serif text-sm font-semibold text-text-primary block mb-1">
            🤝 Loved by Shop Owners. Certified by CAs.
          </span>
          <span className="font-sans text-xs text-text-muted leading-relaxed">
            BillFlow doesn't try to replace your CA. It empowers you to generate tax-compliant outward supplies reports, customer ledgers, and one-click portal-ready GSTR-1 files so your CA is always happy.
          </span>
        </motion.div>
      </div>
    </section>
  );
}
export default ComparisonSection;
