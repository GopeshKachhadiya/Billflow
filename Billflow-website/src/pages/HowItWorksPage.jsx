import { motion } from "framer-motion";
import { useState } from "react";
import { 
  Download, 
  FileCheck2, 
  Send, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  Monitor, 
  HelpCircle, 
  Database, 
  FileSpreadsheet, 
  ShieldCheck,
  Play,
  Check
} from "lucide-react";
import { CTASection } from "../components/CTASection";

const detailedSteps = [
  {
    number: "01",
    title: "Download & Install the Windows Application",
    time: "Takes 60 Seconds",
    icon: Download,
    desc: "No confusing web signups, no email verification loops, and zero credit cards required. Click our secure download link to save the lightweight 24MB setup file.",
    details: [
      "Runs smoothly on Windows 7, Windows 10, and Windows 11 (32-bit & 64-bit)",
      "Digitally signed by Microsoft Authenticode for 100% virus-free installation",
      "No administrator privileges needed — installs in your user directory instantly",
    ],
    mockupType: "installer",
  },
  {
    number: "02",
    title: "Enter Your GSTIN & Auto-Fetch Details",
    time: "Takes 2 Minutes",
    icon: FileCheck2,
    desc: "Simply type your 15-digit GSTIN number. BillFlow connects to the official Government GST portal in the background to auto-fill your legal trade name and address.",
    details: [
      "Auto-configures CGST/SGST/IGST tax rates based on your home state code",
      "Sets up your bank account details and generates an instant UPI QR code",
      "Choose your preferred starting invoice number (e.g., INV-2026/001)",
    ],
    mockupType: "gstin",
  },
  {
    number: "03",
    title: "Create Your First Bill & Send via WhatsApp",
    time: "Takes 30 Seconds",
    icon: Send,
    desc: "Select your customer, add products from your catalog with HSN codes, and hit save. Print directly to your shop printer or trigger an instant WhatsApp message.",
    details: [
      "Generates clean A4 PDF invoices or 2-inch / 3-inch POS thermal slips",
      "1-Click WhatsApp sending attaches the PDF invoice automatically",
      "Customer outstanding balance is automatically updated in your Khata ledger",
    ],
    mockupType: "whatsapp",
  },
];

const faqs = [
  {
    q: "Do I need a continuous internet connection to use BillFlow?",
    a: "No! BillFlow is 100% offline-first. You can create invoices, add customers, and check ledger balances even when your WiFi is disconnected. When your internet restores, it automatically syncs an encrypted backup to your cloud storage."
  },
  {
    q: "Can I import my existing customer list and items from Excel or Tally?",
    a: "Yes. BillFlow comes with a 1-Click Excel / CSV Import wizard. Simply upload your existing spreadsheet of customers or products, map the columns, and your entire inventory and khata balance will be ready in under 10 seconds."
  },
  {
    q: "Is my financial data shared with third-party servers?",
    a: "Never. Your accounting database lives locally on your own Windows computer, encrypted with AES-256 military-grade security. We cannot read your sales numbers, customer names, or profit margins."
  },
  {
    q: "How does the 1-Click WhatsApp feature work?",
    a: "When you save an invoice, BillFlow opens a WhatsApp message window pre-loaded with a polite payment request and the PDF invoice attached. You don't need to save the customer's phone number to your contacts!"
  },
];

export function HowItWorksPage() {
  const [openFaq, setOpenFaq] = useState(0);
  const [demoGstin, setDemoGstin] = useState("24AAACB1234F1Z9");

  return (
    <div className="min-h-screen bg-background pt-10 pb-20">
      {/* Hero Header */}
      <section className="section-padding relative overflow-hidden bg-surface border-b border-border">
        <div className="absolute inset-0 ledger-lines opacity-30 pointer-events-none" />
        <div className="section-container relative z-10 text-center max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-background border border-border shadow-paper mb-6"
          >
            <Sparkles className="w-4 h-4 text-stamp-gold" />
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-text-secondary">3-Step Setup Guide</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-text-primary mb-6"
          >
            How BillFlow Works <span className="text-fountain underline decoration-stamp-gold">in Real Life</span>.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="font-sans text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed"
          >
            No lengthy training seminars or accounting manuals. Here is exactly how you can set up your complete GST billing system today.
          </motion.p>
        </div>
      </section>

      {/* Detailed Steps Section */}
      <section className="section-padding">
        <div className="section-container max-w-6xl mx-auto space-y-24">
          {detailedSteps.map((step, i) => {
            const IconComponent = step.icon;
            const isEven = i % 2 === 1;
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className={`grid lg:grid-cols-2 gap-12 items-center ${isEven ? "lg:flex-row-reverse" : ""}`}
              >
                {/* Content */}
                <div className={isEven ? "lg:order-2" : "lg:order-1"}>
                  <div className="inline-flex items-center gap-3 mb-4">
                    <span className="w-10 h-10 rounded-full bg-fountain text-white font-serif font-bold text-lg flex items-center justify-center shadow-md">
                      {step.number}
                    </span>
                    <span className="stamp-badge text-xs">✦ {step.time}</span>
                  </div>

                  <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-text-primary mb-4">
                    {step.title}
                  </h2>
                  <p className="font-sans text-base text-text-secondary leading-relaxed mb-6">
                    {step.desc}
                  </p>

                  <div className="space-y-3 pt-4 border-t border-border">
                    {step.details.map((detail, idx) => (
                      <div key={idx} className="flex items-start gap-3 text-sm text-text-primary">
                        <CheckCircle2 className="w-5 h-5 text-stamp-green flex-shrink-0 mt-0.5" />
                        <span>{detail}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Interactive Mockup Box */}
                <div className={isEven ? "lg:order-1" : "lg:order-2"}>
                  <div className="paper-card p-6 sm:p-8 rounded-paper-xl bg-surface border-2 border-border shadow-paper-xl relative overflow-hidden text-text-primary">
                    {/* Mockup 1: Installer */}
                    {step.mockupType === "installer" && (
                      <div className="font-mono text-xs space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-border text-text-muted">
                          <span>Setup - BillFlow Desktop v2.4.exe</span>
                          <span className="text-stamp-green flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> Verified Publisher</span>
                        </div>
                        <div className="bg-surface-elevated p-4 rounded border border-border space-y-3">
                          <p className="text-sm font-sans font-semibold text-text-primary">Welcome to BillFlow Setup Wizard</p>
                          <p className="text-xs text-text-secondary font-sans">This will install BillFlow Offline Ledger on your computer. Requires 24 MB disk space.</p>
                          <div className="w-full bg-background h-3 rounded-full overflow-hidden border border-border">
                            <motion.div 
                              className="bg-fountain h-full"
                              animate={{ width: ["0%", "100%"] }}
                              transition={{ duration: 3, repeat: Infinity }}
                            />
                          </div>
                          <div className="flex justify-end gap-2 pt-2">
                            <button className="px-4 py-1.5 bg-fountain text-white rounded font-sans text-xs font-semibold">Install Now</button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Mockup 2: GSTIN Simulator */}
                    {step.mockupType === "gstin" && (
                      <div className="font-sans text-xs space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-border text-text-muted font-mono">
                          <span>STEP 1: AUTOMATIC FIRM SETUP</span>
                          <span className="text-stamp-gold">✦ Portal Connected</span>
                        </div>
                        <div className="space-y-3">
                          <label className="block text-text-secondary font-semibold">Enter your 15-Digit GSTIN Number:</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={demoGstin}
                              onChange={(e) => setDemoGstin(e.target.value)}
                              className="bg-background border border-fountain text-text-primary px-3 py-2 rounded flex-1 font-mono text-sm uppercase tracking-wider"
                            />
                            <button className="px-4 py-2 bg-fountain text-white font-semibold rounded flex items-center gap-1">
                              Fetch Details
                            </button>
                          </div>
                          <div className="p-3 rounded bg-stamp-green/10 border border-stamp-green/30 text-stamp-green space-y-1 font-mono text-[11px]">
                            <p className="font-bold">✓ TRADE NAME: SHREE GANESH TRADERS</p>
                            <p>✓ STATE CODE: 24 (GUJARAT) · REGULAR TAXPAYER</p>
                            <p>✓ ADDRESS: CG ROAD, NAVRANGPURA, AHMEDABAD - 380009</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Mockup 3: WhatsApp Preview */}
                    {step.mockupType === "whatsapp" && (
                      <div className="font-sans text-xs space-y-3">
                        <div className="flex items-center gap-2 pb-3 border-b border-border text-stamp-green font-semibold">
                          <Send className="w-4 h-4" /> WhatsApp Live Dispatch Preview
                        </div>
                        <div className="bg-[#efeae2] p-4 rounded-lg border border-border text-text-primary space-y-2 max-w-sm ml-auto shadow-md">
                          <p className="text-[11px] text-[#667781] font-semibold">BillFlow Assistant · To: +91 98250 XXXXX</p>
                          <div className="bg-[#d9fdd3] p-3 rounded-lg border border-[#c1e8b2] text-text-primary space-y-2 shadow-sm">
                            <p className="text-sm">Namaste <span className="font-bold text-text-primary">Patel Builders</span> 🙏</p>
                            <p>Here is your GST Invoice <span className="font-mono font-bold text-stamp-gold">#INV-2026/048</span> for <span className="font-bold text-text-primary">₹48,500.00</span>.</p>
                            <div className="p-2.5 rounded bg-[#cfe9ba] border border-[#a2cf82] flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <FileSpreadsheet className="w-5 h-5 text-stamp-red" />
                                <div>
                                  <p className="font-bold text-xs text-text-primary">Invoice_INV048.pdf</p>
                                  <p className="text-[10px] text-[#667781]">245 KB · Official Tax Document</p>
                                </div>
                              </div>
                              <span className="text-xs text-fountain font-bold">PDF</span>
                            </div>
                            <p className="text-[10px] text-right text-[#667781] pt-1">10:42 AM ✓✓</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Tally & Excel Migration Strip */}
      <section className="section-padding bg-surface border-y border-border">
        <div className="section-container max-w-4xl mx-auto text-center">
          <span className="stamp-badge stamp-badge-gold mb-4 inline-block">✦ ZERO DATA ENTRY REQUIRED</span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-text-primary mb-4">
            Switching from Excel, Vyapar, or Tally?
          </h2>
          <p className="font-sans text-base text-text-secondary mb-8">
            Use our 1-Click spreadsheet import wizard. Upload your existing `.xlsx` or `.csv` customer list and item inventory, and BillFlow will automatically map your khata balances in seconds.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="#/download" className="btn-fountain text-white px-6 py-2.5 text-xs font-semibold no-underline">
              Download Migration Tool →
            </a>
            <a href="#/contact" className="btn-ink-outline px-6 py-2.5 text-xs font-semibold border-border">
              Request Free CA Setup Assistance
            </a>
          </div>
        </div>
      </section>

      {/* Setup FAQ Section */}
      <section className="section-padding">
        <div className="section-container max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl font-bold text-text-primary mb-2">Frequently Asked Setup Questions</h2>
            <p className="text-sm text-text-secondary">Everything you need to know about installing BillFlow</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <div key={i} className="paper-card rounded-paper bg-surface border border-border overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="w-full p-5 text-left font-serif font-bold text-base text-text-primary flex items-center justify-between gap-4 hover:text-fountain transition-colors"
                  >
                    <span>{faq.q}</span>
                    <span className="text-fountain font-mono text-lg">{isOpen ? "−" : "+"}</span>
                  </button>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="px-5 pb-5 font-sans text-sm text-text-secondary leading-relaxed border-t border-border/50 pt-3"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <CTASection />
    </div>
  );
}
export default HowItWorksPage;
