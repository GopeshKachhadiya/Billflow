import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, CheckCircle, ArrowRight, Sparkles, ShieldCheck } from "lucide-react";

export function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("Please enter a valid work or personal email address.");
      return;
    }
    setError("");
    setSubmitted(true);
    setEmail("");
  };

  return (
    <section className="py-20 bg-surface-elevated border-y border-border relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-r from-brand-accent/10 via-stamp-gold/10 to-brand-accent/5 rounded-full blur-3xl pointer-events-none" />

      <div className="section-container relative z-10 max-w-4xl mx-auto text-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-surface border border-border p-8 md:p-12 rounded-paper-lg shadow-paper relative"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-elevated border border-border text-xs font-mono uppercase tracking-widest text-text-muted mb-6">
            <Sparkles className="w-3.5 h-3.5 text-brand-accent" />
            <span>BillFlow Insider Bulletin</span>
          </div>

          <h2 className="font-serif text-3xl md:text-4xl font-bold text-text-primary mb-4">
            Stay Ahead of Indian GST Law & Compliance Updates
          </h2>

          <p className="font-sans text-base text-text-secondary max-w-2xl mx-auto mb-8 leading-relaxed">
            Join 34,000+ Indian chartered accountants, tax professionals, and SMB founders. Receive curated weekly updates on GST council rulings, e-Invoicing deadlines, and financial automation strategies.
          </p>

          {submitted ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-6 bg-stamp-green/10 border border-stamp-green/30 rounded-paper flex flex-col sm:flex-row items-center justify-center gap-3 text-stamp-green font-medium"
            >
              <CheckCircle className="w-6 h-6 flex-shrink-0" />
              <span>You have successfully subscribed to the BillFlow Insider Bulletin! Check your inbox for confirmation.</span>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="max-w-md mx-auto flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address..."
                  required
                  className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-paper text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                />
              </div>
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-fountain px-6 py-3 rounded-paper text-white font-medium text-sm inline-flex items-center justify-center gap-2 shadow-md hover:shadow-lg flex-shrink-0"
              >
                <span>Subscribe Free</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </form>
          )}

          {error && <p className="text-xs text-stamp-red mt-3 font-medium">{error}</p>}

          <div className="mt-6 flex items-center justify-center gap-6 text-xs text-text-muted">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-stamp-green" />
              100% Privacy Guaranteed. No Spam Ever.
            </span>
            <span>•</span>
            <span>Unsubscribe Anytime in 1-Click</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
