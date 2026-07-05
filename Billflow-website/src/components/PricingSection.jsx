import { motion } from "framer-motion";
import { CheckCircle, XCircle, Sparkles, Crown, ArrowRight, Users, Shield, Cloud, MessageSquare, BarChart, CreditCard, Download, Lock, Zap, WifiOff, Truck, RotateCcw } from "lucide-react";

const plans = [
  {
    name: "Starter",
    tagline: "For solo entrepreneurs",
    monthlyPrice: 999,
    yearlyPrice: 9990,
    popular: false,
    features: [
      { name: "Up to 100 invoices/month", included: true },
      { name: "GST-compliant invoicing (CGST/SGST/IGST)", included: true },
      { name: "HSN/SAC code library", included: true },
      { name: "Offline-first with cloud sync", included: true },
      { name: "Professional PDF generation", included: true },
      { name: "WhatsApp & Email delivery", included: true },
      { name: "Automated payment reminders (3)", included: true },
      { name: "Basic GSTR-1 export", included: true },
      { name: "Single user access", included: true },
      { name: "Email support", included: true },
      { name: "Advanced reporting & analytics", included: false },
      { name: "Multi-user team access", included: false },
      { name: "Unlimited invoices", included: false },
      { name: "Priority WhatsApp/SMS support", included: false },
      { name: "Dedicated account manager", included: false },
    ],
  },
  {
    name: "Professional",
    tagline: "For growing businesses",
    monthlyPrice: 1999,
    yearlyPrice: 19990,
    popular: true,
    features: [
      { name: "Up to 100 invoices/month", included: true },
      { name: "GST-compliant invoicing (CGST/SGST/IGST)", included: true },
      { name: "HSN/SAC code library", included: true },
      { name: "Offline-first with cloud sync", included: true },
      { name: "Professional PDF generation", included: true },
      { name: "WhatsApp & Email delivery", included: true },
      { name: "Automated payment reminders (3)", included: true },
      { name: "Basic GSTR-1 export", included: true },
      { name: "Single user access", included: true },
      { name: "Email support", included: true },
      { name: "Advanced reporting & analytics", included: true },
      { name: "Multi-user team access (5 users)", included: true },
      { name: "Unlimited invoices", included: true },
      { name: "Priority WhatsApp/SMS support", included: true },
      { name: "Dedicated account manager", included: false },
    ],
  },
  {
    name: "Enterprise",
    tagline: "For established companies",
    monthlyPrice: 4999,
    yearlyPrice: 49990,
    popular: false,
    features: [
      { name: "Up to 100 invoices/month", included: true },
      { name: "GST-compliant invoicing (CGST/SGST/IGST)", included: true },
      { name: "HSN/SAC code library", included: true },
      { name: "Offline-first with cloud sync", included: true },
      { name: "Professional PDF generation", included: true },
      { name: "WhatsApp & Email delivery", included: true },
      { name: "Automated payment reminders (3)", included: true },
      { name: "Basic GSTR-1 export", included: true },
      { name: "Single user access", included: true },
      { name: "Email support", included: true },
      { name: "Advanced reporting & analytics", included: true },
      { name: "Multi-user team access (5 users)", included: true },
      { name: "Unlimited invoices", included: true },
      { name: "Priority WhatsApp/SMS support", included: true },
      { name: "Dedicated account manager", included: true },
    ],
  },
];

const billingPeriods = [
  { value: "monthly", label: "Monthly", savings: null },
  { value: "yearly", label: "Yearly", savings: "Save 20%" },
];

export function PricingSection() {
  return (
    <section className="relative section-padding overflow-hidden" aria-labelledby="pricing-heading">
      {/* Background */}
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute top-0 right-1/3 w-[500px] h-[500px] rounded-full bg-gradient-to-r from-brand-primary/3 via-transparent to-brand-accent/3 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full bg-gradient-to-r from-brand-accent/3 via-transparent to-brand-secondary/3 blur-3xl" />
        <div className="absolute inset-0 bg-[var(--paper-fibers)] bg-[var(--fibers)] opacity-[0.02]" />
      </div>

      <div className="section-container relative z-10">
        {/* Section Header */}
        <motion.div
          className="text-center max-w-3xl mx-auto mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.span className="badge-gold inline-block mb-4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
            Simple, transparent pricing — no surprises
          </motion.span>
          <h2 id="pricing-heading" className="ink-heading text-display-md mb-4 text-gradient-ink">
            Choose the plan that
            <br />
            <span className="ink-handwriting text-brand-accent">fits your business</span>
          </h2>
          <p className="ink-body text-body-lg text-text-secondary max-w-2xl mx-auto">
            All plans include a 14-day free trial. No credit card required. Cancel anytime. Yearly billing saves 20% — like getting 2.5 months free.
          </p>
        </motion.div>

        {/* Billing Toggle */}
        <motion.div
          className="flex justify-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="paper-card p-1 flex items-center gap-1 rounded-paper-lg" style={{ width: 'fit-content' }}>
            {billingPeriods.map((period) => (
              <button
                key={period.value}
                className={`relative px-6 py-3 rounded-paper font-medium text-sm transition-all duration-300 ease-spring flex items-center gap-2 ${
                  period.value === 'monthly'
                    ? 'bg-brand-primary text-surface shadow-paper'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {period.label}
                {period.savings && (
                  <motion.span
                    className="badge-gold text-xs px-2 py-0.5 -ml-1"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3, type: "spring" }}
                  >
                    {period.savings}
                  </motion.span>
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <motion.div
          className="grid gap-8 lg:grid-cols-3 max-w-7xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.12 }
            }
          }}
        >
          {plans.map((plan, planIndex) => (
            <motion.div
              key={plan.name}
              className={`relative paper-card-elevated p-8 flex flex-col ${
                plan.popular 
                  ? 'border-gradient-gold shadow-ink-glow-lg ring-1 ring-brand-accent/20' 
                  : ''
              }`}
              variants={{
                hidden: { opacity: 0, y: 40, scale: 0.98 },
                visible: { 
                  opacity: 1, 
                  y: 0, 
                  scale: 1,
                  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
                }
              }}
              whileHover={{ 
                y: plan.popular ? 0 : -8,
                scale: plan.popular ? 1 : 1.01,
                boxShadow: plan.popular ? 'var(--shadow-ink-glow-lg)' : 'var(--shadow-paper-xl)',
                transition: { duration: 0.3, type: "spring" }
              }}
            >
              {/* Popular badge */}
              {plan.popular && (
                <motion.div
                  className="absolute -top-4 left-1/2 -translate-x-1/2"
                  initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{ delay: 0.3, type: "spring" }}
                >
                  <div className="badge-gold px-4 py-1.5 whitespace-nowrap shadow-ink-glow">
                    <Sparkles className="w-4 h-4 mr-1" />
                    Most Popular
                  </div>
                </motion.div>
              )}

              {/* Plan Header */}
              <div className="mb-6 text-center relative">
                <h3 className="ink-heading text-heading-lg mb-2">{plan.name}</h3>
                <p className="ink-body text-sm text-text-muted mb-6">{plan.tagline}</p>
                
                {/* Price */}
                <div className="mb-4">
                  <span className="text-5xl lg:text-6xl font-bold ink-heading text-gradient-ink">
                    ₹{plan.monthlyPrice.toLocaleString()}
                  </span>
                  <span className="ink-body text-text-muted ml-2">/month</span>
                </div>
                
                {/* Yearly price hint */}
                <p className="ink-body text-sm text-brand-accent font-medium">
                  ₹{plan.yearlyPrice.toLocaleString()}/year (save ₹{(plan.monthlyPrice * 12 - plan.yearlyPrice).toLocaleString()})
                </p>
              </div>

              {/* Features List */}
              <div className="flex-1 mb-8">
                <ul className="space-y-3" role="list">
                  {plan.features.map((feature, featureIndex) => (
                    <motion.li
                      key={feature.name}
                      className={`flex items-start gap-3 p-3 rounded-paper transition-all duration-300 ${
                        feature.included 
                          ? 'bg-surface/50 border border-border/50' 
                          : 'bg-surface/30 border border-border/30 opacity-60'
                      }`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + featureIndex * 0.04, duration: 0.3 }}
                      whileHover={{ 
                        backgroundColor: feature.included ? 'var(--color-brand-primary)/5' : 'transparent',
                        borderColor: feature.included ? 'var(--color-brand-primary)/30' : 'transparent',
                        x: 4,
                        transition: { duration: 0.2 }
                      }}
                    >
                      <motion.div
                        className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${
                          feature.included 
                            ? 'bg-brand-primary text-surface' 
                            : 'bg-transparent text-text-muted border border-border'
                        }`}
                        whileHover={{ scale: 1.2, rotate: feature.included ? 0 : 180, transition: { duration: 0.3, type: "spring" } }}
                      >
                        {feature.included ? (
                          <CheckCircle className="w-3.5 h-3.5" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5" />
                        )}
                      </motion.div>
                      <span className={`ink-body text-sm ${feature.included ? 'text-text-secondary' : 'text-text-muted line-through'}`}>
                        {feature.name}
                      </span>
                    </motion.li>
                  ))}
                </ul>
              </div>

              {/* CTA Button */}
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => window.location.hash = "#/download"}
                className={`${plan.popular ? 'btn-fountain text-white' : 'btn-ink'} w-full py-4 text-base font-semibold shadow-md`}
              >
                {plan.popular ? 'Get Started Free' : 'Choose Plan'}
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </motion.button>

              {/* Corner fold for popular */}
              {plan.popular && (
                <div className="absolute bottom-0 right-0 w-10 h-10 border-l border-b border-brand-accent/50 rounded-br-paper-xl opacity-50" />
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* Guarantee bar */}
        <motion.div
          className="mt-16 paper-card p-6 md:p-8 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, delay: 0.4 }}
        >
          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-paper flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--color-brand-primary)/10, var(--color-brand-accent)/10)' }}>
                <Shield className="w-6 h-6 text-brand-primary" />
              </div>
              <div>
                <p className="ink-heading font-medium">14-Day Free Trial</p>
                <p className="ink-body text-sm text-text-muted">Full access, no credit card</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-paper flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--color-brand-accent)/10, var(--color-success)/10)' }}>
                <RotateCcw className="w-6 h-6 text-brand-accent" />
              </div>
              <div>
                <p className="ink-heading font-medium">Cancel Anytime</p>
                <p className="ink-body text-sm text-text-muted">No questions asked</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-paper flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--color-success)/10, var(--color-brand-secondary)/10)' }}>
                <Cloud className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="ink-heading font-medium">Secure Cloud Sync</p>
                <p className="ink-body text-sm text-text-muted">Bank-grade encryption</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-paper flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--color-brand-secondary)/10, var(--color-warning)/10)' }}>
                <MessageSquare className="w-6 h-6 text-brand-secondary" />
              </div>
              <div>
                <p className="ink-heading font-medium">Email & WhatsApp Support</p>
                <p className="ink-body text-sm text-text-muted">Real humans, fast replies</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}