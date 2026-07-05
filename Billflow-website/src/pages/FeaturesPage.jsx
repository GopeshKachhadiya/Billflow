import { motion } from "framer-motion";
import { useState } from "react";
import { 
  FileText, 
  WifiOff, 
  MessageSquare, 
  Zap, 
  Download, 
  Lock, 
  BarChart3, 
  CreditCard, 
  Users, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  Layers,
  Printer,
  Smartphone,
  Database,
  RefreshCw
} from "lucide-react";
import { CTASection } from "../components/CTASection";

const categories = [
  { id: "all", label: "All 22 Workflows" },
  { id: "invoicing", label: "Invoicing & GST" },
  { id: "offline", label: "Offline & Security" },
  { id: "automation", label: "WhatsApp & Automation" },
  { id: "ledger", label: "Khata & Inventory" },
];

const allFeatures = [
  {
    category: "invoicing",
    icon: FileText,
    title: "30-Second GST Invoice Generation",
    desc: "Create compliant B2B and B2C invoices instantly. Automatic HSN/SAC code lookup, rate calculation, and sequential invoice numbering without manual effort.",
    badge: "Most Popular",
    color: "from-fountain/20 to-fountain/5"
  },
  {
    category: "invoicing",
    icon: BarChart3,
    title: "Automated GSTR-1 JSON & Reports",
    desc: "No more CA stress at month end. Export Government portal-verified GSTR-1 JSON files, HSN summaries, and document-wise registers with a single click.",
    badge: "Tax Ready",
    color: "from-stamp-red/20 to-stamp-red/5"
  },
  {
    category: "invoicing",
    icon: Printer,
    title: "Thermal & A4 PDF Print Templates",
    desc: "Print professional invoices on standard A4 sheets or 2-inch / 3-inch thermal POS receipt printers. Customize logos, terms, and signatures.",
    badge: "Customizable",
    color: "from-stamp-gold/20 to-stamp-gold/5"
  },
  {
    category: "invoicing",
    icon: Layers,
    title: "Quotations & Delivery Challans",
    desc: "Convert proforma invoices or estimates into tax invoices in 1 click. Issue delivery challans for goods movement and track pending approvals.",
    badge: "Workflow",
    color: "from-stamp-green/20 to-stamp-green/5"
  },
  {
    category: "offline",
    icon: WifiOff,
    title: "100% Offline-First Desktop Engine",
    desc: "Your billing never stops when the internet goes down. All data is written locally to lightning-fast SQLite databases with zero latency.",
    badge: "Zero Latency",
    color: "from-fountain/20 to-fountain/5"
  },
  {
    category: "offline",
    icon: Lock,
    title: "Bank-Grade Local Encryption",
    desc: "Your business data is encrypted with AES-256 before it ever touches your disk. Nobody can read your ledger without your master password.",
    badge: "AES-256",
    color: "from-stamp-gold/20 to-stamp-gold/5"
  },
  {
    category: "offline",
    icon: Database,
    title: "Automated Google Drive / Cloud Sync",
    desc: "When internet restores, your ledger silently syncs encrypted backups to your personal Google Drive or our secure Indian cloud servers.",
    badge: "Auto Backup",
    color: "from-stamp-green/20 to-stamp-green/5"
  },
  {
    category: "offline",
    icon: ShieldCheck,
    title: "Multi-User Role Permissions",
    desc: "Create separate login accounts for your cashier, accountant, and store manager. Restrict them from viewing profit margins or deleting old invoices.",
    badge: "Security",
    color: "from-stamp-red/20 to-stamp-red/5"
  },
  {
    category: "automation",
    icon: MessageSquare,
    title: "1-Click WhatsApp Invoice Sending",
    desc: "Send PDF bills and UPI payment links directly to your customer's WhatsApp without having to save their phone number in your contacts first.",
    badge: "Time Saver",
    color: "from-stamp-green/20 to-stamp-green/5"
  },
  {
    category: "automation",
    icon: Zap,
    title: "Automated Payment Reminders",
    desc: "Set automated SMS and WhatsApp reminder sequences for overdue invoices. Reduce unpaid receivables by up to 45% automatically.",
    badge: "Cashflow",
    color: "from-fountain/20 to-fountain/5"
  },
  {
    category: "automation",
    icon: Smartphone,
    title: "Dynamic UPI QR Code on Invoices",
    desc: "Automatically print a dynamic QR code on every bill with the exact invoice amount pre-filled. Customers scan and pay in 3 seconds.",
    badge: "Instant Pay",
    color: "from-stamp-gold/20 to-stamp-gold/5"
  },
  {
    category: "automation",
    icon: RefreshCw,
    title: "Recurring Billing & Subscriptions",
    desc: "Automatically generate monthly maintenance bills, retainer invoices, or rent receipts on the 1st of every month without manual data entry.",
    badge: "Automation",
    color: "from-stamp-red/20 to-stamp-red/5"
  },
  {
    category: "ledger",
    icon: Users,
    title: "Digital Customer Khata Book",
    desc: "Maintain clean credit registers for regular clients. Track running outstanding balances, set credit limits, and send ledger statements via WhatsApp.",
    badge: "Khata",
    color: "from-stamp-gold/20 to-stamp-gold/5"
  },
  {
    category: "ledger",
    icon: Layers,
    title: "Real-Time Inventory & Stock Alerts",
    desc: "Track item quantities across warehouses. Receive automated low-stock warnings before you run out of fast-moving products.",
    badge: "Stock Tracking",
    color: "from-fountain/20 to-fountain/5"
  },
  {
    category: "ledger",
    icon: CreditCard,
    title: "Expense Recording & GST Input Credit",
    desc: "Record shop expenses, vendor bills, and utility payments. Automatically calculate eligible GST Input Tax Credit (ITC) for your monthly returns.",
    badge: "Tax Savings",
    color: "from-stamp-green/20 to-stamp-green/5"
  },
  {
    category: "ledger",
    icon: BarChart3,
    title: "Profit & Loss Executive Dashboard",
    desc: "Visual graphs showing daily sales, top-selling products, state-wise revenue, and monthly net profit at a glance.",
    badge: "Analytics",
    color: "from-stamp-red/20 to-stamp-red/5"
  },
];

export function FeaturesPage() {
  const [activeTab, setActiveTab] = useState("all");

  const filteredFeatures = activeTab === "all" 
    ? allFeatures 
    : allFeatures.filter(f => f.category === activeTab);

  return (
    <div className="min-h-screen bg-background pt-10 pb-20">
      {/* Page Header */}
      <section className="section-padding relative overflow-hidden bg-surface border-b border-border">
        <div className="absolute inset-0 ledger-lines opacity-30 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[350px] bg-gradient-to-tr from-fountain/15 to-stamp-gold/15 rounded-full blur-3xl pointer-events-none" />

        <div className="section-container relative z-10 text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-background border border-border shadow-paper mb-6"
          >
            <Sparkles className="w-4 h-4 text-stamp-gold" />
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-text-secondary">Complete Feature Matrix</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-text-primary mb-6"
          >
            22 Powerful Workflows in <span className="text-fountain underline decoration-stamp-gold">One Digital Ledger</span>.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="font-sans text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed"
          >
            Explore how BillFlow automates your GST billing, customer khata, inventory, and WhatsApp communication without cluttering your screen.
          </motion.p>
        </div>
      </section>

      {/* Interactive Category Filter */}
      <section className="section-padding">
        <div className="section-container">
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className={`px-5 py-2.5 rounded-paper font-serif text-sm font-semibold transition-all shadow-sm ${
                  activeTab === cat.id
                    ? "bg-fountain text-white shadow-md scale-105"
                    : "bg-surface border border-border text-text-secondary hover:text-text-primary hover:border-fountain"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Features Grid */}
          <motion.div
            layout
            className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto"
          >
            {filteredFeatures.map((feature, i) => {
              const IconComponent = feature.icon;
              return (
                <motion.div
                  layout
                  key={feature.title}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  whileHover={{ y: -6, borderColor: 'var(--color-fountain)' }}
                  className="paper-card p-6 rounded-paper-lg bg-surface border border-border shadow-paper flex flex-col justify-between group transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <div className={`w-12 h-12 rounded-paper bg-gradient-to-br ${feature.color} border border-border flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <IconComponent className="w-6 h-6 text-fountain" />
                      </div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-background border border-border text-text-muted">
                        ✦ {feature.badge}
                      </span>
                    </div>

                    <h3 className="font-serif text-lg font-bold text-text-primary mb-2.5 group-hover:text-fountain transition-colors">
                      {feature.title}
                    </h3>
                    <p className="font-sans text-xs sm:text-sm text-text-secondary leading-relaxed mb-6">
                      {feature.desc}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs font-mono text-stamp-green font-semibold">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Included in all plans
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* CTA Bottom Banner */}
      <CTASection />
    </div>
  );
}
export default FeaturesPage;
