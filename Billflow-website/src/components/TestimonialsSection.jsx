import { motion } from "framer-motion";
import { Star, Quote, ArrowLeft, ArrowRight, Shield, CheckCircle, MessageSquare, Cloud, Zap, BarChart, Users, Truck } from "lucide-react";

const testimonials = [
  {
    id: 1,
    name: "Rajesh Mehta",
    role: "Owner",
    company: "Mehta Textiles, Surat",
    avatar: "RM",
    quote: "BillFlow cut our invoicing time by 80%. The GST calculations are spot-on and the WhatsApp reminders actually get us paid faster. It feels just like writing in my old ledger, but digital.",
    rating: 5,
    metrics: { invoices: "2,400+", timeSaved: "15 hrs/week", collectionRate: "+40%" },
    tags: ["Textiles", "Gujarat", "Team of 8"],
  },
  {
    id: 2,
    name: "Priya Sharma",
    role: "Chartered Accountant",
    company: "Sharma & Associates, Mumbai",
    avatar: "PS",
    quote: "As a CA, I recommend BillFlow to all my SMB clients. The GSTR-1 export saves hours of manual work every month. The offline-first approach means their data is always safe.",
    rating: 5,
    metrics: { clients: "50+", gstr1Time: "-90%", errors: "Zero" },
    tags: ["CA Firm", "Maharashtra", "Advisory"],
  },
  {
    id: 3,
    name: "Amit Patel",
    role: "Director",
    company: "TechForge Solutions, Ahmedabad",
    avatar: "AP",
    quote: "We were using Excel sheets before. BillFlow's offline-first approach means our warehouse team can bill even without WiFi. The automated reminders via WhatsApp are a game changer.",
    rating: 5,
    metrics: { team: "25 staff", offlineUsage: "60%", reminders: "Auto" },
    tags: ["Manufacturing", "Gujarat", "Warehouse"],
  },
  {
    id: 4,
    name: "Sneha Reddy",
    role: "Founder",
    company: "Bloom Organics, Hyderabad",
    avatar: "SR",
    quote: "The automated payment reminders via WhatsApp and email have improved our collection rate by 40%. I don't have to chase anyone anymore. It's like having a virtual accountant.",
    rating: 5,
    metrics: { collectionRate: "+40%", overdue: "-60%", peaceOfMind: "Priceless" },
    tags: ["Organic Foods", "Telangana", "D2C Brand"],
  },
  {
    id: 5,
    name: "Vikram Singh",
    role: "Proprietor",
    company: "Singh Diamond Co., Surat",
    avatar: "VS",
    quote: "Diamond business needs precise GST with HSN codes. BillFlow handles the complex tax slabs perfectly. The PDF invoices look professional with our logo — clients trust us more.",
    rating: 5,
    metrics: { accuracy: "100%", invoices: "500+/mo", clientTrust: "High" },
    tags: ["Diamonds", "Gujarat", "High-value"],
  },
  {
    id: 6,
    name: "Kavya Nair",
    role: "Finance Head",
    company: "Kerala Spices, Kochi",
    avatar: "KN",
    quote: "Managing interstate GST was a nightmare. BillFlow auto-detects supply type and applies correct IGST/CGST/SGST. The cloud sync means I can check reports from anywhere.",
    rating: 5,
    metrics: { states: "12+", accuracy: "100%", sync: "Real-time" },
    tags: ["Spices", "Kerala", "Interstate"],
  },
];

const trustIndicators = [
  { icon: Shield, label: "Bank-Grade Security", value: "AES-256" },
  { icon: CheckCircle, label: "GST Compliant", value: "100%" },
  { icon: Cloud, label: "Cloud Sync", value: "Real-time" },
  { icon: Zap, label: "Automation", value: "22 Workflows" },
  { icon: MessageSquare, label: "WhatsApp Ready", value: "Business API" },
  { icon: BarChart, label: "GSTR-1 Export", value: "One-click" },
];

export function TestimonialsSection() {
  return (
    <section className="relative section-padding overflow-hidden" aria-labelledby="testimonials-heading">
      {/* Background */}
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-gradient-to-r from-brand-primary/3 via-transparent to-brand-accent/3 blur-3xl" />
        <div className="absolute bottom-0 right-1/3 w-[400px] h-[400px] rounded-full bg-gradient-to-r from-brand-accent/3 via-transparent to-brand-secondary/3 blur-3xl" />
        <div className="absolute inset-0 bg-[var(--paper-fibers)] bg-[var(--fibers)] opacity-[0.02]" />
      </div>

      <div className="section-container relative z-10">
        {/* Section Header */}
        <motion.div
          className="text-center max-w-3xl mx-auto mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.span className="badge-gold inline-block mb-4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
            Built for Indian Wholesalers & Retailers
          </motion.span>
          <h2 id="testimonials-heading" className="ink-heading text-display-md mb-4 text-gradient-ink">
            What our customers
            <br />
            <span className="ink-handwriting text-brand-accent">say about BillFlow</span>
          </h2>
          <p className="ink-body text-body-lg text-text-secondary max-w-2xl mx-auto">
            From textile merchants in Surat to diamond traders in Mumbai — hear from real businesses who switched from pen & paper to BillFlow.
          </p>
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {trustIndicators.map((item, i) => (
            <motion.div
              key={item.label}
              className="paper-card p-4 text-center group"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + i * 0.05, type: "spring" }}
              whileHover={{ y: -3, scale: 1.02 }}
            >
              <div className="w-10 h-10 rounded-paper flex items-center justify-center mx-auto mb-3" style={{ background: 'linear-gradient(135deg, var(--color-brand-primary)/10, var(--color-brand-accent)/10)' }}>
                <item.icon className="w-5 h-5 text-brand-primary" />
              </div>
              <p className="ink-heading text-sm mb-1">{item.label}</p>
              <p className="ink-body text-xs text-text-muted font-medium">{item.value}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Testimonials Carousel */}
        <div className="relative">
          <div className="overflow-hidden">
            <motion.div
              className="flex gap-6 scrollbar-paper pb-4"
              style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={testimonial.id}
                  className="flex-shrink-0 w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] scroll-snap-start"
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.08, duration: 0.5 }}
                >
                  <motion.div
                    className="paper-card-elevated p-6 h-full flex flex-col relative overflow-hidden group pt-8"
                    whileHover={{ 
                      y: -6, 
                      boxShadow: 'var(--shadow-paper-xl)',
                      transition: { duration: 0.3, type: "spring" }
                    }}
                  >
                    {/* Paper tape decoration */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-6 bg-[var(--color-surface-elevated)] opacity-80 border-x border-b border-border/30 -rotate-2 shadow-sm z-20 pointer-events-none" />
                    
                    {/* Quote icon background */}
                    <div className="absolute top-6 right-6 opacity-5">
                      <Quote className="w-16 h-16 text-brand-primary/20" />
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-1 mb-4 relative z-10">
                      {[...Array(5)].map((_, i) => (
                        <motion.span
                          key={i}
                          className="text-brand-accent"
                          initial={{ opacity: 0, scale: 0.5, rotate: -90 }}
                          animate={{ opacity: 1, scale: 1, rotate: 0 }}
                          transition={{ delay: 0.3 + i * 0.05, type: "spring" }}
                        >
                          <Star className="w-5 h-5 fill-current" />
                        </motion.span>
                      ))}
                    </div>

                    {/* Quote Text */}
                    <motion.blockquote className="ink-body text-body-md text-text-secondary mb-6 flex-1 leading-relaxed relative z-10" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                      "{testimonial.quote}"
                    </motion.blockquote>

                    {/* Metrics */}
                    <div className="grid grid-cols-3 gap-4 mb-5 p-4 bg-surface/50 rounded-paper border border-border/50 relative z-10">
                      {Object.entries(testimonial.metrics).map(([key, value], i) => (
                        <motion.div
                          key={key}
                          className="text-center"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.5 + i * 0.05, type: "spring" }}
                        >
                          <p className="ink-heading text-xl font-bold text-gradient-gold">{value}</p>
                          <p className="ink-body text-xs text-text-muted capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                        </motion.div>
                      ))}
                    </div>

                    {/* Author */}
                    <div className="flex items-center gap-4 pt-4 border-t border-border relative z-10">
                      <motion.div
                        className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-brand-primary relative overflow-hidden"
                        style={{ background: 'linear-gradient(135deg, var(--color-brand-primary)/10, var(--color-brand-accent)/10)' }}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.6, type: "spring" }}
                      >
                        {testimonial.avatar}
                      </motion.div>
                      <div>
                        <motion.p className="ink-heading font-medium" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}>
                          {testimonial.name}
                        </motion.p>
                        <motion.p className="ink-body text-sm text-text-muted" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
                          {testimonial.role} • {testimonial.company}
                        </motion.p>
                      </div>
                    </div>

                    {/* Industry tags */}
                    <div className="flex flex-wrap gap-2 mt-4 relative z-10">
                      {testimonial.tags.map((tag, i) => (
                        <motion.span
                          key={tag}
                          className="badge-paper text-xs"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.75 + i * 0.05, type: "spring" }}
                        >
                          {tag}
                        </motion.span>
                      ))}
                    </div>

                    {/* Corner fold */}
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-l border-b border-border/50 rounded-br-paper-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </motion.div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Carousel Navigation */}
          <div className="flex justify-center gap-4 mt-8">
            <button
              className="paper-card p-3 rounded-full shadow-paper hover:shadow-paper-lg transition-all duration-300"
              aria-label="Previous testimonial"
            >
              <ArrowLeft className="w-5 h-5 text-brand-primary" />
            </button>
            <div className="flex items-center gap-2">
              {testimonials.map((_, i) => (
                <motion.button
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${i === 0 ? 'w-6 bg-brand-primary' : 'bg-border'}`}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.8 + i * 0.05 }}
                />
              ))}
            </div>
            <button
              className="paper-card p-3 rounded-full shadow-paper hover:shadow-paper-lg transition-all duration-300"
              aria-label="Next testimonial"
            >
              <ArrowRight className="w-5 h-5 text-brand-primary" />
            </button>
          </div>
        </div>

        {/* CTA */}
        <motion.div
          className="mt-16 paper-card-elevated p-8 md:p-12 text-center border-gradient-gold"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, delay: 0.4 }}
        >
          <h3 className="ink-heading text-display-sm mb-4 max-w-2xl mx-auto">
            Ready to experience effortless GST billing?
          </h3>
          <p className="ink-body text-body-lg text-text-secondary mb-6 max-w-xl mx-auto">
            Start your 14-day free trial today. Experience the comfort of pen & paper with the power of automation.
          </p>
          <a href="#/download" className="btn-fountain text-white group inline-flex px-8 py-3 shadow-md no-underline">
            Start Free Trial
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}