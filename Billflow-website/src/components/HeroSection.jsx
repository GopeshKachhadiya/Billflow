import { motion, useMotionValue, useTransform } from "framer-motion";
import { ArrowRight, CheckCircle, Shield, Zap, Smartphone, Truck, WifiOff, Cloud, MessageSquare } from "lucide-react";
import { useState } from "react";

const trustBadges = [
  { label: "Offline-First", icon: WifiOff },
  { label: "22 Workflows", icon: Zap },
  { label: "100% GST Compliant", icon: Shield },
  { label: "Bank-Grade Security", icon: CheckCircle },
  { label: "WhatsApp & SMS", icon: MessageSquare },
  { label: "Auto Cloud Sync", icon: Cloud },
];

const floatingElements = [
  { id: 1, icon: Shield, label: "GST Compliant", color: "brand-primary", delay: 0 },
  { id: 2, icon: Zap, label: "Auto Reminders", color: "brand-accent", delay: 1.2 },
  { id: 3, icon: Cloud, label: "Cloud Sync", color: "brand-secondary", delay: 2.4 },
  { id: 4, icon: MessageSquare, label: "WhatsApp Bills", color: "success", delay: 3.6 },
  { id: 5, icon: Truck, label: "Doorstep Delivery", color: "warning", delay: 4.8 },
];

export function HeroSection() {
  const x = useMotionValue(200);
  const y = useMotionValue(200);

  const rotateX = useTransform(y, [0, 400], [15, -15]);
  const rotateY = useTransform(x, [0, 400], [-15, 15]);

  function handleMouse(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = event.clientX - rect.left - width / 2;
    const mouseY = event.clientY - rect.top - height / 2;
    x.set(mouseX + 200);
    y.set(mouseY + 200);
  }

  function handleMouseLeave() {
    x.set(200);
    y.set(200);
  }

  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden section-padding ledger-lines">
      {/* Background Paper Texture & Gradient Blobs */}
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        {/* Subtle gradient blobs for depth */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-gradient-to-r from-brand-primary/5 via-transparent to-brand-accent/5 blur-3xl animate-gradient-shift" style={{ animationDuration: '20s' }} />
        <div className="absolute bottom-1/4 right-1/4 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-gradient-to-r from-brand-accent/5 via-transparent to-brand-secondary/5 blur-3xl animate-gradient-shift" style={{ animationDuration: '25s', animationDelay: '-5s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-gradient-to-r from-brand-secondary/5 via-transparent to-brand-primary/5 blur-3xl animate-gradient-shift" style={{ animationDuration: '30s', animationDelay: '-10s' }} />
        
        {/* Paper fibers overlay */}
        <div className="absolute inset-0 bg-[var(--paper-fibers)] bg-[var(--fibers)] opacity-[0.02]" />
      </div>

      <div className="section-container relative z-10 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Column - Content */}
          <motion.div
            className="max-w-2xl ledger-margin-red"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Badge */}
            <motion.span
              className="badge-paper inline-block mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
            >
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-brand-accent animate-pulse-soft" />
                Made for Indian SMBs — Pen & Paper Simplicity
              </span>
            </motion.span>

            {/* Headline */}
            <motion.h1
              className="ink-heading text-display-xl mb-6 text-gradient-ink leading-[1.05]"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              Billing that feels like
              <br />
              <span className="ink-handwriting text-4xl sm:text-5xl lg:text-6xl font-medium text-brand-accent underline decoration-wavy decoration-brand-accent/40">pen & paper</span>
              <br />
              GST that just works.
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              className="ink-body text-body-lg text-text-secondary mb-8 max-w-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              BillFlow brings the comfort of your traditional ledger to the digital world. Create GST-compliant invoices, send via WhatsApp, automate reminders — all with the familiar feel of pen on paper.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              className="flex flex-col sm:flex-row gap-4 mb-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="btn-fountain group relative overflow-hidden text-white shadow-lg"
              >
                <a href="#/download" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  Start 14-Day Free Trial
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </a>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="btn-ink-outline border-border"
              >
                <a href="#/how-it-works" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  Watch Demo →
                </a>
              </motion.button>
            </motion.div>

            {/* Trust Line */}
            <motion.p
              className="flex flex-wrap items-center gap-3 text-text-muted text-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <span className="flex items-center gap-1.5 text-success">
                <CheckCircle className="w-4 h-4" />
                No credit card required
              </span>
              <span className="hidden sm:inline text-border">·</span>
              <span className="flex items-center gap-1.5 text-success">
                <CheckCircle className="w-4 h-4" />
                Full access for 14 days
              </span>
              <span className="hidden sm:inline text-border">·</span>
              <span className="flex items-center gap-1.5 text-success">
                <CheckCircle className="w-4 h-4" />
                Cancel anytime
              </span>
            </motion.p>

            {/* Trust Badges */}
            <motion.div
              className="flex flex-wrap gap-3 mt-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
            >
              {trustBadges.map((badge, index) => (
                <motion.div
                  key={badge.label}
                  className="flex items-center gap-2 px-4 py-2 rounded-paper bg-surface border border-border shadow-paper"
                  initial={{ opacity: 0, scale: 0.9, rotate: -3 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{ delay: 0.8 + index * 0.08, type: "spring" }}
                  whileHover={{ y: -3, boxShadow: 'var(--shadow-paper-lg)', borderColor: 'var(--color-brand-primary)' }}
                >
                  <badge.icon className="w-5 h-5 text-brand-primary" />
                  <span className="text-sm font-medium text-text-secondary">{badge.label}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right Column - 3D Paper Scene */}
          <motion.div
            className="relative h-[550px] lg:h-[650px] w-full"
            initial={{ opacity: 0, x: 60, rotateY: 15 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            transition={{ delay: 0.4, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            onMouseMove={handleMouse}
            onMouseLeave={handleMouseLeave}
          >
            <div className="relative w-full h-full perspective-1500 transform-style-3d">
              {/* Main Paper Sheet - 3D */}
              <motion.div
                className="absolute inset-0 bg-surface border border-border rounded-paper-xl shadow-paper-xl transform-style-3d paper-curl-shadow"
                style={{
                  transformOrigin: 'center center',
                  boxShadow: '0 25px 50px -12px rgba(24, 19, 14, 0.15), 0 0 0 1px rgba(24, 19, 14, 0.05)',
                }}
                animate={{
                  rotateX: [0, 1, 0, -1, 0],
                  rotateY: [0, -1, 0, 1, 0],
                }}
                transition={{ duration: 20, ease: "linear", repeat: Infinity }}
              >
                {/* Paper texture overlay */}
                <div className="absolute inset-0 bg-[var(--paper-texture)] bg-[var(--paper)] opacity-[0.04] rounded-paper-xl pointer-events-none" />
                
                {/* Paper content - Invoice preview */}
                <div className="absolute inset-0 p-8 overflow-hidden">
                  {/* Header */}
                  <div className="mb-6 pb-4 border-b border-border">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="ink-handwriting text-2xl text-brand-primary">BillFlow</p>
                        <p className="ink-body text-sm text-text-muted">GST Invoice • INV-2024-001</p>
                      </div>
                      <div className="text-right">
                        <p className="ink-heading text-lg">₹ 1,25,430</p>
                        <p className="ink-body text-sm text-text-muted">Incl. 18% GST</p>
                      </div>
                    </div>
                  </div>

                  {/* From/To */}
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div className="bg-background/50 rounded-paper p-4 border border-border/50">
                      <p className="ink-body text-xs text-text-muted uppercase tracking-wider mb-2">From</p>
                      <p className="ink-heading font-medium">Mehta Textiles</p>
                      <p className="ink-body text-sm text-text-muted">Surat, Gujarat • GSTIN: 24AAAAA0000A1Z5</p>
                    </div>
                    <div className="bg-background/50 rounded-paper p-4 border border-border/50">
                      <p className="ink-body text-xs text-text-muted uppercase tracking-wider mb-2">Bill To</p>
                      <p className="ink-heading font-medium">Sharma Fabrics</p>
                      <p className="ink-body text-sm text-text-muted">Mumbai, Maharashtra • GSTIN: 27BBBBB1111B2Z6</p>
                    </div>
                  </div>

                  {/* Line Items */}
                  <div className="space-y-3 mb-6">
                    {[
                      { item: "Cotton Fabric - 500 Mtrs", hsn: "5208", qty: 500, rate: 180, gst: 5, amt: 90000 },
                      { item: "Silk Thread - 100 Kgs", hsn: "5006", qty: 100, rate: 220, gst: 12, amt: 22000 },
                      { item: "Dyeing Services", hsn: "9988", qty: 1, rate: 8500, gst: 18, amt: 8500 },
                    ].map((row, i) => (
                      <motion.div
                        key={i}
                        className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4 items-center text-sm bg-background/30 rounded-paper p-3 border border-border/50"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + i * 0.1, duration: 0.4 }}
                      >
                        <span className="ink-body text-text-secondary">{row.item}</span>
                        <span className="ink-body text-text-muted text-center">{row.hsn}</span>
                        <span className="ink-body text-text-muted text-center">{row.qty}</span>
                        <span className="ink-body text-text-muted text-center">₹{row.rate}</span>
                        <span className="ink-heading font-medium text-right">₹{row.amt.toLocaleString()}</span>
                      </motion.div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="flex justify-end">
                    <div className="w-64 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="ink-body text-text-secondary">Subtotal</span>
                        <span className="ink-body text-text-secondary">₹1,20,500</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="ink-body text-text-secondary">CGST (9%)</span>
                        <span className="ink-body text-text-secondary">₹10,845</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="ink-body text-text-secondary">SGST (9%)</span>
                        <span className="ink-body text-text-secondary">₹10,845</span>
                      </div>
                      <div className="border-t border-border pt-2 flex justify-between">
                        <span className="ink-heading text-lg">Total</span>
                        <span className="ink-heading text-lg text-brand-primary">₹1,42,190</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer actions */}
                  <div className="mt-6 flex gap-3 pt-4 border-t border-border">
                    <button className="btn-ink text-xs px-4 py-2 flex-1">
                      <MessageSquare className="w-4 h-4" /> Send WhatsApp
                    </button>
                    <button className="btn-ink-outline text-xs px-4 py-2 flex-1">
                      Download PDF
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Floating Badge Cards - 3D orbiting */}
              {floatingElements.map((el, i) => (
                <motion.div
                  key={el.id}
                  className="absolute"
                  style={{
                    top: `${15 + i * 12}%`,
                    left: `${85 + (i % 2) * 8}%`,
                    zIndex: 10 - i,
                  }}
                  initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    rotate: 0,
                    y: [0, -15, 0, 10, 0],
                    x: [0, 5, 0, -5, 0],
                  }}
                  transition={{
                    delay: 1 + el.delay + i * 0.15,
                    duration: 0.6,
                    type: "spring",
                  }}
                >
                  <motion.div
                    className="paper-card-elevated px-4 py-3 flex items-center gap-3 min-w-[180px] shadow-ink-glow border-gradient-gold"
                    animate={{
                      rotateX: [0, 2, 0, -2, 0],
                      rotateY: [0, -2, 0, 2, 0],
                    }}
                    transition={{ duration: 8 + i, ease: "linear", repeat: Infinity }}
                    whileHover={{ scale: 1.05, zIndex: 20 }}
                  >
                    <div className="w-10 h-10 rounded-paper flex items-center justify-center"
                         style={{ background: `linear-gradient(135deg, var(--color-${el.color})/20, var(--color-${el.color})/10)` }}>
                      <el.icon className="w-5 h-5" style={{ color: `var(--color-${el.color})` }} />
                    </div>
                    <span className="ink-heading text-sm whitespace-nowrap">{el.label}</span>
                  </motion.div>
                </motion.div>
              ))}

              {/* Corner fold effect */}
              <div className="absolute top-0 right-0 w-16 h-16 border-l border-b border-border bg-gradient-to-br from-surface to-background rounded-tr-paper-xl pointer-events-none opacity-50" />
              
              {/* Subtle paper shadow on ground */}
              <div className="absolute bottom-[-30px] left-1/2 -translate-x-1/2 w-[80%] h-20 bg-gradient-to-r from-transparent via-brand-primary/5 to-transparent rounded-full blur-3xl -z-10" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}