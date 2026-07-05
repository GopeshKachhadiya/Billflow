import { motion } from "framer-motion";
import { ArrowRight, Zap, Shield, CheckCircle, Users, Cloud, MessageSquare, BarChart } from "lucide-react";

const benefits = [
  { icon: Zap, label: "Instant invoices", description: "Create GST bills in under 30 seconds" },
  { icon: Cloud, label: "Works offline", description: "Local-first, syncs when online" },
  { icon: MessageSquare, label: "Auto WhatsApp", description: "Send bills & reminders automatically" },
  { icon: Shield, label: "Bank-grade security", description: "Your data, encrypted & isolated" },
  { icon: BarChart, label: "GSTR-1 ready", description: "Export compliant returns in one click" },
  { icon: Users, label: "Team access", description: "Role-based permissions for staff" },
];

export function CTASection() {
  return (
    <section className="relative section-padding overflow-hidden" aria-labelledby="cta-heading">
      {/* Background - Rich paper with gradient blobs */}
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        {/* Large gradient mesh */}
        <div className="absolute top-0 left-0 right-0 bottom-0 bg-gradient-to-br from-brand-primary/5 via-transparent to-brand-accent/5" />
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-r from-brand-primary/10 via-transparent to-brand-accent/10 blur-3xl animate-gradient-shift" style={{ animationDuration: '25s' }} />
        <div className="absolute bottom-1/4 right-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-gradient-to-r from-brand-accent/10 via-transparent to-brand-secondary/10 blur-3xl animate-gradient-shift" style={{ animationDuration: '30s', animationDelay: '-5s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-gradient-to-r from-brand-secondary/10 via-transparent to-brand-primary/10 blur-3xl animate-gradient-shift" style={{ animationDuration: '35s', animationDelay: '-10s' }} />
        
        {/* Paper texture overlay */}
        <div className="absolute inset-0 bg-[var(--paper-texture)] bg-[var(--paper)] opacity-[0.03]" />
        <div className="absolute inset-0 bg-[var(--paper-fibers)] bg-[var(--fibers)] opacity-[0.02]" />
        
        {/* Subtle decorative lines */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-brand-primary/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-brand-accent/20 to-transparent" />
      </div>

      <div className="section-container relative z-10">
        {/* Main CTA Card - Large paper sheet */}
        <motion.div
          className="relative paper-card-elevated p-8 md:p-12 lg:p-16 rounded-paper-xl overflow-hidden border-gradient-gold"
          initial={{ opacity: 0, y: 40, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Decorative top edge */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-primary via-brand-accent to-brand-secondary" />
          
          {/* Floating ink blobs decoration */}
          <div className="absolute top-10 right-10 w-32 h-32 rounded-full bg-gradient-to-br from-brand-primary/10 to-brand-accent/10 blur-2xl animate-float-slow" style={{ animationDelay: '0s' }} />
          <div className="absolute bottom-20 left-10 w-24 h-24 rounded-full bg-gradient-to-br from-brand-accent/10 to-brand-secondary/10 blur-2xl animate-float" style={{ animationDelay: '2s' }} />
          
          {/* Corner fold effect */}
          <div className="absolute top-0 right-0 w-16 h-16 border-l border-b border-brand-accent/30 rounded-tr-paper-xl opacity-50" />
          
          {/* Watermark */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ zIndex: 0 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.03 }}
            transition={{ delay: 0.5, duration: 1 }}
          >
            <span className="ink-handwriting text-7xl lg:text-9xl whitespace-nowrap transform rotate-[-12deg]">BillFlow</span>
          </motion.div>

          <div className="relative z-10 max-w-4xl mx-auto text-center">
            {/* Badge */}
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-paper mb-6"
              style={{ background: 'linear-gradient(135deg, var(--color-brand-primary)/10, var(--color-brand-accent)/10)' }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
            >
              <motion.span
                className="w-2 h-2 rounded-full"
                style={{ background: 'var(--color-brand-accent)' }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              />
              <span className="ink-body text-sm font-medium" style={{ color: 'var(--color-brand-primary)' }}>
                14-Day Free Trial • No Credit Card • Cancel Anytime
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h2
              id="cta-heading"
              className="ink-heading text-display-lg lg:text-display-xl mb-6 text-gradient-ink leading-[1.1]"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              Ready to bill like
              <br />
              <span className="ink-handwriting text-brand-accent">never before?</span>
            </motion.h2>

            {/* Subheadline */}
            <motion.p
              className="ink-body text-body-lg lg:text-body-xl text-text-secondary mb-10 max-w-2xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              Join 10,000+ Indian businesses who've ditched the paper ledger for BillFlow. 
              Same familiar feel — zero manual GST calculations, automated WhatsApp reminders, 
              and peace of mind.
            </motion.p>

            {/* Quick Benefits */}
            <motion.div
              className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              {benefits.map((benefit, i) => (
                <motion.div
                  key={benefit.label}
                  className="paper-card p-4 text-left group"
                  style={{ backgroundImage: 'var(--paper-texture)', backgroundSize: 'var(--paper)' }}
                  whileHover={{ y: -3, borderColor: 'var(--color-brand-primary)', boxShadow: 'var(--shadow-paper-lg)' }}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + i * 0.06, type: "spring" }}
                >
                  <div className="w-10 h-10 rounded-paper flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300" style={{ background: 'linear-gradient(135deg, var(--color-brand-primary)/10, var(--color-brand-accent)/10)' }}>
                    <benefit.icon className="w-5 h-5" style={{ color: 'var(--color-brand-primary)' }} />
                  </div>
                  <p className="ink-heading text-sm font-medium mb-1">{benefit.label}</p>
                  <p className="ink-body text-xs text-text-muted">{benefit.description}</p>
                </motion.div>
              ))}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
            >
              <motion.button
                whileHover={{ scale: 1.02, y: -3 }}
                whileTap={{ scale: 0.98 }}
                className="btn-fountain text-white group px-10 py-4 text-lg relative overflow-hidden shadow-lg"
              >
                <a href="#/download" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  Start Your Free Trial
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </a>
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02, y: -3 }}
                whileTap={{ scale: 0.98 }}
                className="btn-ink-outline border-border px-10 py-4 text-lg"
              >
                <a href="#/how-it-works" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  Watch 2-Min Demo →
                </a>
              </motion.button>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              className="mt-10 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-center gap-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
            >
              <div className="flex items-center gap-4 text-text-muted">
                <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                <span className="ink-body text-sm">No credit card required</span>
              </div>
              <div className="flex items-center gap-4 text-text-muted">
                <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                <span className="ink-body text-sm">Full access for 14 days</span>
              </div>
              <div className="flex items-center gap-4 text-text-muted">
                <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                <span className="ink-body text-sm">Cancel anytime, no hassle</span>
              </div>
              <div className="flex items-center gap-4 text-text-muted">
                <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                <span className="ink-body text-sm">Data export anytime</span>
              </div>
            </motion.div>

            {/* Social proof line */}
            <motion.p
              className="mt-8 ink-body text-sm text-text-muted"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.5 }}
            >
              Trusted by textile merchants in Surat, diamond traders in Mumbai, 
              manufacturers in Gujarat, and retailers across India.
            </motion.p>
          </div>
        </motion.div>

        {/* Floating trust badges around the main card */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none"
          style={{ width: '100%', height: '100%' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          {[
            { top: '5%', left: '2%', icon: Shield, label: 'GST Compliant', color: 'brand-primary' },
            { top: '15%', right: '3%', icon: Zap, label: 'Auto Reminders', color: 'brand-accent' },
            { top: '45%', right: '1%', icon: Cloud, label: 'Cloud Sync', color: 'brand-secondary' },
            { bottom: '20%', right: '2%', icon: MessageSquare, label: 'WhatsApp', color: 'success' },
            { bottom: '5%', left: '3%', icon: BarChart, label: 'GSTR-1 Ready', color: 'warning' },
          ].map((badge, i) => (
            <motion.div
              key={badge.label}
              className="absolute paper-card-elevated px-4 py-3 flex items-center gap-3 min-w-[180px] shadow-ink-glow border-gradient-gold"
              style={{ 
                top: badge.top, 
                bottom: badge.bottom, 
                left: badge.left, 
                right: badge.right,
                zIndex: 10 - i,
              }}
              initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
              animate={{ 
                opacity: 1, 
                scale: 1, 
                rotate: 0,
                y: [0, -10, 0, 8, 0],
                x: [0, 5, 0, -5, 0],
              }}
              transition={{ 
                delay: 1.2 + i * 0.15, 
                duration: 0.6, 
                type: "spring",
                y: { duration: 6 + i, repeat: Infinity, ease: "linear" },
                x: { duration: 8 + i, repeat: Infinity, ease: "linear" },
              }}
            >
              <div className="w-10 h-10 rounded-paper flex items-center justify-center" style={{ background: `linear-gradient(135deg, var(--color-${badge.color})/15, var(--color-${badge.color})/5)` }}>
                <badge.icon className="w-5 h-5" style={{ color: `var(--color-${badge.color})` }} />
              </div>
              <span className="ink-heading text-sm whitespace-nowrap">{badge.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}