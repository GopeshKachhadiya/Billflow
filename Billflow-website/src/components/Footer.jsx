import { motion } from "framer-motion";
import { 
  Mail, 
  Phone, 
  MapPin, 
  ArrowRight,
  Shield,
  Cloud,
  Zap,
  MessageSquare,
  BarChart,
  Users,
  Download,
  Lock,
  CreditCard,
  WifiOff,
  Truck,
  CheckCircle,
  FileText,
  PenTool
} from "lucide-react";

const Twitter = (props) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

const Linkedin = (props) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const Github = (props) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

const Youtube = (props) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
  </svg>
);


const footerLinks = {
  product: [
    { label: "Features", href: "#/features" },
    { label: "Pricing", href: "#/pricing" },
    { label: "How It Works", href: "#/how-it-works" },
    { label: "Download App", href: "#/download" },
  ],
  company: [
    { label: "About Us", href: "#/about" },
    { label: "Blog & Guides", href: "#/blog" },
    { label: "Contact Support", href: "#/contact" },
  ],
  resources: [
    { label: "GST Guide", href: "#/blog" },
    { label: "Documentation", href: "#/contact" },
    { label: "Free Setup Call", href: "#/contact" },
    { label: "Windows Installer", href: "#/download" },
  ],
  legal: [
    { label: "Privacy Policy", href: "#/about" },
    { label: "Terms of Service", href: "#/about" },
    { label: "Security & Encryption", href: "#/features" },
  ],
};

const socialLinks = [
  { icon: Twitter, href: "https://twitter.com/billflow", label: "Twitter" },
  { icon: Linkedin, href: "https://linkedin.com/company/billflow", label: "LinkedIn" },
  { icon: Github, href: "https://github.com/billflow", label: "GitHub" },
  { icon: Youtube, href: "https://youtube.com/billflow", label: "YouTube" },
];

const contactInfo = [
  { icon: Mail, label: "Email", value: "hello@billflow.in", href: "mailto:hello@billflow.in" },
  { icon: Phone, label: "Phone", value: "+91 80000 00000", href: "tel:+918000000000" },
  { icon: MapPin, label: "Office", value: "Ahmedabad, Gujarat, India", href: null },
];

const featuresList = [
  { icon: FileText, label: "GST Invoicing", href: "#/features" },
  { icon: WifiOff, label: "Offline-First", href: "#/features" },
  { icon: MessageSquare, label: "WhatsApp & SMS", href: "#/features" },
  { icon: Zap, label: "22 Workflows", href: "#/features" },
  { icon: Download, label: "PDF Invoices", href: "#/features" },
  { icon: Shield, label: "Bank-Grade Security", href: "#/features" },
  { icon: BarChart, label: "GSTR-1 Export", href: "#/features" },
  { icon: Users, label: "Team Access", href: "#/features" },
  { icon: Cloud, label: "Cloud Sync", href: "#/features" },
  { icon: Lock, label: "Data Encryption", href: "#/features" },
  { icon: CreditCard, label: "Payments", href: "#/features" },
  { icon: Truck, label: "Delivery Receipts", href: "#/features" },
];

export function Footer() {
  return (
    <footer className="relative section-padding overflow-hidden bg-surface border-t border-border text-text-primary" role="contentinfo">
      {/* Ledger Cover Background Aesthetics */}
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] rounded-full bg-gradient-to-r from-fountain/5 via-transparent to-stamp-gold/5 blur-3xl" />
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-fountain/20 to-transparent" />
      </div>

      <div className="section-container relative z-10">
        {/* Quick Feature Access (Explore BillFlow Capabilities) */}
        <motion.div
          className="mb-16 border-b border-border pb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <h4 className="font-serif text-sm uppercase tracking-widest text-text-muted mb-5 text-center">Explore BillFlow Capabilities</h4>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {featuresList.map((feature, i) => (
              <motion.a
                key={feature.label}
                href={feature.href}
                className="p-3 rounded-paper bg-surface-elevated border border-border flex items-center gap-3 text-left group transition-all duration-300"
                whileHover={{ y: -2, borderColor: 'var(--color-brand-accent)', backgroundColor: 'var(--color-background)' }}
              >
                <div className="w-8 h-8 rounded-paper bg-background flex items-center justify-center flex-shrink-0 border border-border">
                  <feature.icon className="w-4 h-4 text-brand-primary group-hover:scale-110 transition-transform" />
                </div>
                <span className="text-xs font-medium text-text-secondary group-hover:text-brand-accent transition-colors">{feature.label}</span>
              </motion.a>
            ))}
          </div>
        </motion.div>

        {/* Main Footer Grid (Information) */}
        <motion.div
          className="grid gap-10 md:gap-16 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr] mb-16 border-b border-border pb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Brand Column */}
          <motion.div className="max-w-xs" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1, duration: 0.5 }}>
            <a href="#/" className="flex items-center gap-3 mb-6 group" aria-label="BillFlow Home">
              <div className="w-12 h-12 rounded-paper-lg flex items-center justify-center relative overflow-hidden bg-brand-primary border border-border group-hover:border-brand-accent transition-colors">
                <span className="font-serif font-black text-2xl text-surface-elevated select-none group-hover:scale-110 transition-transform">B</span>
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-brand-accent/15 to-transparent" />
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-2xl font-bold tracking-tight text-text-primary group-hover:text-brand-accent transition-colors">BillFlow</span>
                <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest -mt-1">The Digital Ledger</span>
              </div>
            </a>
            
            <p className="font-sans text-sm text-text-secondary mb-6 leading-relaxed">
              The billing software that feels like your trusted ledger — but with the power of automation. Built for Indian SMBs who value simplicity, speed, and privacy.
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-paper bg-surface-elevated border border-border flex items-center justify-center text-text-secondary hover:text-brand-accent hover:border-brand-accent transition-all duration-200"
                  aria-label={social.label}
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </motion.div>

          {/* Links Columns */}
          <div>
            <h3 className="font-serif text-base font-semibold text-text-primary mb-4 tracking-wide">Product</h3>
            <ul className="space-y-2.5">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm text-text-muted hover:text-brand-accent transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-serif text-base font-semibold text-text-primary mb-4 tracking-wide">Company</h3>
            <ul className="space-y-2.5">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm text-text-muted hover:text-brand-accent transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-serif text-base font-semibold text-text-primary mb-4 tracking-wide">Resources</h3>
            <ul className="space-y-2.5">
              {footerLinks.resources.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm text-text-muted hover:text-brand-accent transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-serif text-base font-semibold text-text-primary mb-4 tracking-wide">Contact</h3>
            <div className="space-y-3">
              {contactInfo.map((contact) => (
                <div key={contact.label} className="flex items-start gap-2.5 text-sm text-text-muted">
                  <contact.icon className="w-4 h-4 text-brand-primary mt-0.5 flex-shrink-0" />
                  {contact.href ? (
                    <a href={contact.href} className="hover:text-brand-accent transition-colors">
                      {contact.value}
                    </a>
                  ) : (
                    <span>{contact.value}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-text-muted">
          <div className="flex items-center gap-4">
            <p>© {new Date().getFullYear()} BillFlow Technologies Pvt. Ltd. All rights reserved.</p>
            <span className="hidden md:inline">•</span>
            <p className="flex items-center gap-1">
              <span>Made for India's 63 Million Small Businesses</span>
              <span role="img" aria-label="india">🇮🇳</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6">
            {footerLinks.legal.map((link) => (
              <a key={link.label} href={link.href} className="hover:text-fountain transition-colors">
                {link.label}
              </a>
            ))}
          </div>
        </div>

        {/* Scroll to top button */}
        <motion.button
          className="fixed bottom-6 right-6 w-11 h-11 rounded-full bg-fountain text-white shadow-lg flex items-center justify-center z-50 border border-white/20 hover:bg-fountain-light transition-colors"
          whileHover={{ scale: 1.1, rotate: -180 }}
          whileTap={{ scale: 0.9 }}
          aria-label="Scroll to top"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1, type: "spring" }}
        >
          <ArrowRight className="w-5 h-5 -rotate-90" />
        </motion.button>
      </div>
    </footer>
  );
}