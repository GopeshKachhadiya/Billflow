import { motion } from "framer-motion";
import { ShieldCheck, Heart, Award, Users, MapPin, Sparkles, PenTool, Lock, WifiOff, CheckCircle2 } from "lucide-react";
import { CTASection } from "../components/CTASection";
import { ProblemSolutionSection } from "../components/home/ProblemSolutionSection";

export function AboutPage() {
  return (
    <div className="min-h-screen bg-background pt-10 pb-20">
      {/* Header */}
      <section className="section-padding relative overflow-hidden bg-surface border-b border-border">
        <div className="absolute inset-0 ledger-lines opacity-30 pointer-events-none" />
        <div className="section-container relative z-10 text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-background border border-border shadow-paper mb-6"
          >
            <Heart className="w-4 h-4 text-stamp-red" />
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-text-secondary">Our Story & Mission</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-text-primary mb-6"
          >
            Built for India's <span className="text-fountain underline decoration-stamp-gold">63 Million Small Businesses</span>.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="font-sans text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed"
          >
            We believe accounting software shouldn't require a finance degree. We designed BillFlow to feel like your trusted paper ledger — fast, private, and always reliable.
          </motion.p>
        </div>
      </section>

      {/* Problem vs Solution */}
      <ProblemSolutionSection />

      {/* Philosophy Section */}
      <section className="section-padding">
        <div className="section-container max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="stamp-badge stamp-badge-gold mb-4 inline-block">✦ THE DIGITAL LEDGER PHILOSOPHY</span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-text-primary mb-6">
                Why Replace a Trusted System with Clunky Cloud SaaS?
              </h2>
              <div className="space-y-4 font-sans text-base text-text-secondary leading-relaxed">
                <p>
                  For decades, Indian shop owners and traders have relied on traditional red-bound ledger books ("Khata"). Why? Because pen and paper is instantaneous, never crashes due to server downtime, and keeps your financial records private inside your shop.
                </p>
                <p>
                  However, modern GST compliance, GSTR-1 returns, and digital WhatsApp communication require software. Most enterprise accounting tools forced Indian SMBs into bloated cloud dashboards with monthly subscription fees and slow loading screens.
                </p>
                <p className="font-medium text-text-primary">
                  We asked a simple question: What if software could feel just like pen and paper?
                </p>
              </div>
            </div>

            <div className="paper-card p-8 rounded-paper-xl bg-gradient-to-br from-[#fefefc] to-[#f9f6ed] border-2 border-fountain shadow-paper-xl relative">
              <div className="w-12 h-12 rounded-paper bg-fountain/10 border border-fountain/20 flex items-center justify-center text-fountain mb-6">
                <PenTool className="w-6 h-6" />
              </div>
              <blockquote className="font-handwriting text-2xl sm:text-3xl text-text-primary mb-6 leading-relaxed">
                "Our mission is to give every Indian shopkeeper, trader, and distributor the speed of a physical ledger with the precision of automated GST compliance."
              </blockquote>
              <div className="flex items-center gap-3 pt-4 border-t border-fountain/20">
                <div className="w-10 h-10 rounded-full bg-stamp-gold text-white font-serif font-bold flex items-center justify-center">
                  BF
                </div>
                <div>
                  <h4 className="font-serif font-bold text-sm text-text-primary">The BillFlow Engineering Team</h4>
                  <p className="text-xs font-mono text-text-muted">Ahmedabad, Gujarat · Made in India 🇮🇳</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Principles Grid */}
      <section className="section-padding bg-surface border-y border-border">
        <div className="section-container max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-serif text-3xl font-bold text-text-primary mb-4">Our Core Engineering Principles</h2>
            <p className="font-sans text-base text-text-secondary">The four non-negotiable pillars behind every line of code we write.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: WifiOff, title: "100% Offline First", desc: "Your software must never stop working because your internet service provider had an outage.", color: "stamp-gold" },
              { icon: Lock, title: "Absolute Data Privacy", desc: "Your accounting ledger is stored locally on your own hard drive. We cannot read or sell your sales data.", color: "stamp-green" },
              { icon: Sparkles, title: "Zero Jargon UI", desc: "We use plain English and familiar terms like Khata, Challan, and Bill instead of complex GAAP terminology.", color: "fountain" },
              { icon: Award, title: "Built for Indian SMBs", desc: "Tailored specifically for Indian GST tax slabs, HSN/SAC codes, UPI QR payments, and WhatsApp Business.", color: "stamp-red" },
            ].map((p, idx) => {
              const IconComponent = p.icon;
              return (
                <div key={idx} className="paper-card p-6 rounded-paper-lg bg-background border border-border shadow-paper flex flex-col justify-between group hover:border-fountain transition-all">
                  <div>
                    <div className="w-12 h-12 rounded-paper bg-surface border border-border flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                      <IconComponent className={`w-6 h-6 text-${p.color}`} />
                    </div>
                    <h3 className="font-serif text-lg font-bold text-text-primary mb-2.5">{p.title}</h3>
                    <p className="font-sans text-xs sm:text-sm text-text-secondary leading-relaxed">{p.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats / Impact Section */}
      <section className="section-padding">
        <div className="section-container max-w-4xl mx-auto text-center">
          <div className="paper-card p-8 sm:p-12 rounded-paper-xl bg-surface text-text-primary border border-border">
            <h2 className="font-serif text-3xl font-bold mb-8 text-fountain">Built for Seamless GST Compliance</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 divide-y md:divide-y-0 md:divide-x divide-border">
              <div className="pt-4 md:pt-0">
                <div className="font-mono text-3xl sm:text-4xl font-extrabold text-text-primary">30s</div>
                <div className="text-xs text-text-muted mt-1">Avg. Invoice Creation</div>
              </div>
              <div className="pt-4 md:pt-0">
                <div className="font-mono text-3xl sm:text-4xl font-extrabold text-stamp-gold">100%</div>
                <div className="text-xs text-text-muted mt-1">Offline & Cloud Sync</div>
              </div>
              <div className="pt-4 md:pt-0">
                <div className="font-mono text-3xl sm:text-4xl font-extrabold text-stamp-green">28</div>
                <div className="text-xs text-text-muted mt-1">States & UTs Supported</div>
              </div>
              <div className="pt-4 md:pt-0">
                <div className="font-mono text-3xl sm:text-4xl font-extrabold text-text-primary">100%</div>
                <div className="text-xs text-text-muted mt-1">GSTR-1 Portal Ready</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <CTASection />
    </div>
  );
}
export default AboutPage;
