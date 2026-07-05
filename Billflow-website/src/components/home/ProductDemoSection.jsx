import { motion } from "framer-motion";
import { useState } from "react";
import { Monitor, Printer, Send, ShieldCheck, CheckCircle2, Sparkles, FileText, Users, BarChart3, Lock } from "lucide-react";

const demoTabs = [
  { id: "invoicing", label: "30-Sec Invoicing", icon: FileText },
  { id: "khata", label: "Customer Khata & Ledger", icon: Users },
  { id: "gstr1", label: "1-Click GSTR-1 Export", icon: BarChart3 },
];

export function ProductDemoSection() {
  const [activeTab, setActiveTab] = useState("invoicing");

  return (
    <section className="section-padding relative bg-background border-y border-border text-text-primary overflow-hidden">
      {/* Warm Lamp Glow Effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-gradient-to-b from-stamp-gold/10 via-fountain/5 to-transparent rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-fountain/30 to-transparent" />

      <div className="section-container relative z-10">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface border border-border shadow-paper mb-4"
          >
            <Monitor className="w-4 h-4 text-fountain" />
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-text-secondary">Live Windows Desktop Application</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-text-primary mb-6"
          >
            Built for <span className="text-fountain underline decoration-stamp-gold">Speed & Simplicity</span>. No Accounting Degree Required.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="font-sans text-lg text-text-secondary"
          >
            Take a peek inside the BillFlow Windows desktop interface. Designed with familiar ledger lines, bold numbers, and zero clutter.
          </motion.p>
        </div>

        {/* Interactive Tab Selector */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex p-1.5 rounded-paper bg-surface border border-border shadow-sm gap-2">
            {demoTabs.map((tab) => {
              const IconComponent = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-paper text-xs sm:text-sm font-medium transition-all ${isActive ? "bg-fountain text-white shadow-md font-semibold" : "text-text-muted hover:text-text-primary hover:bg-surface-elevated"}`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3D Tilted Windows Desktop Frame Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative max-w-5xl mx-auto perspective-1500"
        >
          {/* Floating Callout Badges */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="absolute -top-6 -left-6 z-30 hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-[#fefdf8] text-[#1a1611] font-serif font-bold text-xs shadow-paper-xl border-2 border-stamp-gold"
          >
            <Sparkles className="w-4 h-4 text-stamp-gold" />
            <span>✦ Auto-Calculates CGST/SGST</span>
          </motion.div>

          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
            className="absolute -bottom-6 -right-6 z-30 hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-fountain text-white font-serif font-bold text-xs shadow-paper-xl border-2 border-fountain/20"
          >
            <Send className="w-4 h-4 text-stamp-gold" />
            <span>1-Click WhatsApp Send Included</span>
          </motion.div>

          {/* Main Frame */}
          <div className="rounded-paper-xl bg-surface border-2 border-border p-3 sm:p-4 shadow-paper-xl transform rotate-x-2 hover:rotate-0 transition-transform duration-500">
            {/* Windows Titlebar */}
            <div className="flex items-center justify-between px-3 py-2 bg-surface-elevated rounded-t-paper border-b border-border text-xs font-mono text-text-muted">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                <span className="ml-2 text-text-primary font-semibold">BillFlow Desktop v2.4.1 (Offline Ledger)</span>
              </div>
              <div className="hidden sm:flex items-center gap-3">
                <span className="flex items-center gap-1 text-stamp-green font-bold"><ShieldCheck className="w-3.5 h-3.5" /> 100% Offline Mode</span>
                <span>|</span>
                <span>GSTIN: 24AAACB1234F1Z9</span>
              </div>
            </div>

            {/* Application Content Screen */}
            <div className="bg-[#fefdf8] text-[#1a1611] rounded-b-paper p-4 sm:p-6 min-h-[420px] font-sans relative overflow-hidden shadow-inner">
              {/* Ledger Ruled Background */}
              <div className="absolute inset-0 ledger-ruled opacity-60 pointer-events-none" />
              <div className="absolute inset-0 ledger-margin-red opacity-50 pointer-events-none" />

              {/* Tab Content 1: Invoicing */}
              {activeTab === "invoicing" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="relative z-10 pl-4 sm:pl-8">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b-2 border-[#1a1611] mb-6">
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-text-muted">TAX INVOICE · ORIGINAL FOR RECIPIENT</span>
                      <h3 className="font-serif text-2xl font-bold text-[#1a1611]">Shree Ganesh Enterprises</h3>
                      <p className="text-xs text-text-secondary">Wholesale Distributors & Traders · Ahmedabad, Gujarat</p>
                    </div>
                    <div className="text-right bg-surface p-3 rounded border border-border">
                      <div className="text-[10px] font-mono text-text-muted">INVOICE NO</div>
                      <div className="font-mono text-base font-bold text-fountain">INV-2026/0482</div>
                      <div className="text-[10px] text-text-secondary">Date: 04-Jul-2026</div>
                    </div>
                  </div>

                  {/* Items Table Mock */}
                  <div className="overflow-x-auto mb-6">
                    <table className="w-full text-left border-collapse text-xs sm:text-sm">
                      <thead>
                        <tr className="border-b-2 border-[#1a1611] font-serif font-bold text-[#1a1611] bg-surface/80">
                          <th className="py-2 px-3">#</th>
                          <th className="py-2 px-3">Item Description</th>
                          <th className="py-2 px-3">HSN Code</th>
                          <th className="py-2 px-3">Qty</th>
                          <th className="py-2 px-3">Rate (₹)</th>
                          <th className="py-2 px-3">GST %</th>
                          <th className="py-2 px-3 text-right">Amount (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="font-mono divide-y divide-border/60">
                        <tr>
                          <td className="py-3 px-3 font-sans font-medium">1</td>
                          <td className="py-3 px-3 font-sans font-bold text-[#1a1611]">UltraTech Cement 50kg Bag (PPC)</td>
                          <td className="py-3 px-3 text-text-muted">252329</td>
                          <td className="py-3 px-3">100 Bags</td>
                          <td className="py-3 px-3">380.00</td>
                          <td className="py-3 px-3 text-stamp-red font-bold">28%</td>
                          <td className="py-3 px-3 text-right font-bold">38,000.00</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-3 font-sans font-medium">2</td>
                          <td className="py-3 px-3 font-sans font-bold text-[#1a1611]">Jindal Panther TMT Steel Bars 12mm</td>
                          <td className="py-3 px-3 text-text-muted">721420</td>
                          <td className="py-3 px-3">2.5 Ton</td>
                          <td className="py-3 px-3">62,000.00</td>
                          <td className="py-3 px-3 text-fountain font-bold">18%</td>
                          <td className="py-3 px-3 text-right font-bold">1,55,000.00</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Bottom Total Bar */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t-2 border-[#1a1611] bg-surface/50 p-4 rounded">
                    <div className="flex items-center gap-2">
                      <span className="stamp-badge text-[10px]">✦ INSTANT CGST/SGST</span>
                      <span className="text-xs text-text-secondary">Tax Payable under RCM: No</span>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <span className="text-xs text-text-muted block">Subtotal: ₹1,93,000</span>
                        <span className="text-xs text-stamp-red font-semibold block">+ GST Tax: ₹38,540</span>
                      </div>
                      <div className="text-right bg-fountain/10 border border-fountain px-4 py-2 rounded">
                        <span className="text-[10px] font-mono font-bold text-text-muted block uppercase">GRAND TOTAL</span>
                        <span className="font-serif text-xl font-bold text-fountain">₹2,31,540.00</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Tab Content 2: Khata */}
              {activeTab === "khata" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="relative z-10 pl-4 sm:pl-8 py-6">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
                    <div>
                      <h3 className="font-serif text-xl font-bold text-text-primary">Customer Khata & Ledger Book</h3>
                      <p className="text-xs text-text-secondary">Instant outstanding tracking with 1-click WhatsApp reminder links</p>
                    </div>
                    <span className="px-3 py-1 bg-stamp-green/10 text-stamp-green font-mono text-xs font-bold rounded border border-stamp-green/30">
                      Total Receivables: ₹4,82,500
                    </span>
                  </div>
                  <div className="space-y-3 font-sans">
                    {[
                      { name: "Patel Builders & Co.", gst: "24AADCB2233M1Z2", due: "₹1,45,000", status: "Overdue 12 Days", color: "text-stamp-red" },
                      { name: "Mahalaxmi Hardware Stores", gst: "24BBBCX9988K1Z5", due: "₹82,400", status: "Due in 5 Days", color: "text-stamp-gold" },
                      { name: "Apex Infrastructure Pvt Ltd", gst: "24AAACA1111A1Z1", due: "₹2,55,100", status: "Paid on Time", color: "text-stamp-green" },
                    ].map((c, i) => (
                      <div key={i} className="flex items-center justify-between p-3.5 rounded bg-surface border border-border shadow-sm">
                        <div>
                          <h4 className="font-serif font-bold text-sm text-text-primary">{c.name}</h4>
                          <span className="text-[11px] font-mono text-text-muted">GSTIN: {c.gst}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <span className="font-mono font-bold text-sm text-text-primary block">{c.due}</span>
                            <span className={`text-[10px] font-semibold ${c.color}`}>{c.status}</span>
                          </div>
                          <button className="px-3 py-1.5 rounded bg-fountain text-white text-xs font-medium flex items-center gap-1 shadow-sm hover:bg-fountain-light">
                            <Send className="w-3 h-3" /> WhatsApp
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Tab Content 3: GSTR-1 */}
              {activeTab === "gstr1" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="relative z-10 pl-4 sm:pl-8 py-6 text-center">
                  <div className="max-w-md mx-auto py-8">
                    <div className="w-16 h-16 rounded-full bg-stamp-green/10 border-2 border-stamp-green text-stamp-green flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h3 className="font-serif text-2xl font-bold text-text-primary mb-2">GSTR-1 JSON Ready for Portal</h3>
                    <p className="text-xs text-text-secondary mb-6">
                      BillFlow automatically compiles all B2B invoices, B2C large/small sales, HSN summary, and document details into a Government-verified JSON file.
                    </p>
                    <div className="flex justify-center gap-3">
                      <button className="btn-fountain text-xs px-5 py-2">
                        Download GSTR-1 JSON
                      </button>
                      <button className="px-4 py-2 rounded border border-border bg-surface text-xs font-medium text-text-primary">
                        Share with CA via Email
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
