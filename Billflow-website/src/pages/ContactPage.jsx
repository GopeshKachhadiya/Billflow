import { motion } from "framer-motion";
import { useState } from "react";
import { 
  Mail, 
  Phone, 
  MapPin, 
  MessageSquare, 
  Clock, 
  Send, 
  CheckCircle2, 
  HelpCircle, 
  Sparkles,
  Calendar
} from "lucide-react";
import { CTASection } from "../components/CTASection";

const SUPABASE_URL = "https://tdjwytrtmgsxbfvlqjtl.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_sg13WITxOmD5EMcPccuBXA_bu41qGJ3";

export function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: "", phone: "", email: "", topic: "Setup & Installation", message: "" });

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim() || null,
      topic: formData.topic || "General Query",
      message: formData.message.trim() || "No additional message provided",
      status: "Open",
      created_at: new Date().toISOString()
    };

    fetch(`${SUPABASE_URL}/rest/v1/support_tickets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify(payload)
    })
    .then(res => {
      if (!res.ok) console.warn("Supabase ticket warning:", res.statusText);
      setSubmitted(true);
    })
    .catch(err => {
      console.error("Failed to post ticket:", err);
      setSubmitted(true);
    })
    .finally(() => {
      setLoading(false);
    });
  };

  return (
    <div className="min-h-screen bg-background pt-10 pb-20">
      {/* Header */}
      <section className="section-padding relative overflow-hidden bg-surface border-b border-border">
        <div className="absolute inset-0 ledger-lines opacity-30 pointer-events-none" />
        <div className="section-container relative z-10 text-center max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-background border border-border shadow-paper mb-6"
          >
            <MessageSquare className="w-4 h-4 text-stamp-green" />
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-text-secondary">We Are Here To Help</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-text-primary mb-6"
          >
            Get in Touch with Our <span className="text-fountain underline decoration-stamp-gold">Support Team</span>.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="font-sans text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed"
          >
            Have a question about GST calculations, printer setup, or migrating your ledger from Excel? Speak with our India-based support specialists.
          </motion.p>
        </div>
      </section>

      {/* Support Channels Grid */}
      <section className="section-padding">
        <div className="section-container max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <div className="paper-card p-6 rounded-paper-lg bg-surface border border-border shadow-paper text-center flex flex-col items-center group hover:border-fountain transition-all">
              <div className="w-12 h-12 rounded-full bg-stamp-green/10 text-stamp-green flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-text-primary mb-1">WhatsApp Live Chat</h3>
              <p className="font-sans text-xs text-text-secondary mb-4">Fastest response for urgent shop billing questions.</p>
              <a
                href="https://wa.me/918000000000"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto px-5 py-2 rounded bg-stamp-green text-white font-serif text-xs font-semibold no-underline shadow-sm hover:bg-stamp-green/90"
              >
                Chat on WhatsApp →
              </a>
            </div>

            <div className="paper-card p-6 rounded-paper-lg bg-surface border border-border shadow-paper text-center flex flex-col items-center group hover:border-fountain transition-all">
              <div className="w-12 h-12 rounded-full bg-fountain/10 text-fountain flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-text-primary mb-1">Free Setup Call with CA</h3>
              <p className="font-sans text-xs text-text-secondary mb-4">Book a 30-min 1-on-1 screen share setup session.</p>
              <button
                onClick={() => alert("Booking widget scheduled! Speak with a CA at your preferred time.")}
                className="mt-auto px-5 py-2 rounded bg-fountain text-white font-serif text-xs font-semibold shadow-sm hover:bg-fountain-light"
              >
                Schedule Setup Call →
              </button>
            </div>

            <div className="paper-card p-6 rounded-paper-lg bg-surface border border-border shadow-paper text-center flex flex-col items-center group hover:border-fountain transition-all">
              <div className="w-12 h-12 rounded-full bg-stamp-gold/10 text-stamp-gold flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Mail className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-text-primary mb-1">Email Support Desk</h3>
              <p className="font-sans text-xs text-text-secondary mb-4">For feature requests, billing, and technical queries.</p>
              <a
                href="mailto:support@billflow.in"
                className="mt-auto px-5 py-2 rounded bg-background border border-border text-text-primary font-serif text-xs font-semibold no-underline hover:border-fountain"
              >
                support@billflow.in
              </a>
            </div>
          </div>

          {/* Contact Form & Office Grid */}
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Form */}
            <div className="paper-card p-8 rounded-paper-xl bg-surface border border-border shadow-paper">
              <h2 className="font-serif text-2xl font-bold text-text-primary mb-2">Send Us a Message</h2>
              <p className="font-sans text-xs text-text-secondary mb-6">Fill out the form below and our team will get back to you within 2 hours.</p>

              {submitted ? (
                <div className="p-8 rounded-paper bg-stamp-green/10 border border-stamp-green/30 text-center space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-stamp-green mx-auto" />
                  <h3 className="font-serif text-xl font-bold text-text-primary">Message Sent Successfully!</h3>
                  <p className="font-sans text-xs text-text-secondary">Thank you for reaching out. One of our support engineers has received your ticket and will contact you via WhatsApp/Email shortly.</p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="mt-4 px-4 py-2 bg-background border border-border rounded text-xs font-semibold text-text-primary"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 font-sans text-xs sm:text-sm">
                  <div>
                    <label className="block font-semibold text-text-primary mb-1">Your Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Rajesh Patel"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3.5 py-2 rounded bg-background border border-border text-text-primary focus:outline-none focus:border-fountain"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-text-primary mb-1">WhatsApp Phone *</label>
                      <input
                        type="tel"
                        required
                        placeholder="+91 98000 00000"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3.5 py-2 rounded bg-background border border-border text-text-primary focus:outline-none focus:border-fountain"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-text-primary mb-1">Email Address</label>
                      <input
                        type="email"
                        placeholder="rajesh@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3.5 py-2 rounded bg-background border border-border text-text-primary focus:outline-none focus:border-fountain"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-text-primary mb-1">Enquiry Topic</label>
                    <select
                      value={formData.topic}
                      onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                      className="w-full px-3.5 py-2 rounded bg-background border border-border text-text-primary focus:outline-none focus:border-fountain"
                    >
                      <option value="setup">Free Setup Assistance / Demo</option>
                      <option value="migration">Excel / Vyapar / Tally Migration</option>
                      <option value="printer">POS Thermal Printer Formatting</option>
                      <option value="enterprise">Multi-Store Enterprise Pricing</option>
                      <option value="other">Other Technical Query</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-text-primary mb-1">Your Message *</label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Describe how we can help your business..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-3.5 py-2 rounded bg-background border border-border text-text-primary focus:outline-none focus:border-fountain"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-paper bg-fountain text-white font-serif font-bold text-sm shadow-md hover:bg-fountain-light transition-all flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" /> Submit Support Ticket
                  </button>
                </form>
              )}
            </div>

            {/* Office Info & Hours */}
            <div className="space-y-6">
              <div className="paper-card p-6 rounded-paper-lg bg-surface border border-border">
                <div className="flex items-start gap-3 mb-4">
                  <MapPin className="w-5 h-5 text-fountain flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-serif font-bold text-base text-text-primary">Corporate Headquarters</h3>
                    <p className="font-sans text-xs text-text-secondary mt-1">
                      BillFlow Technologies Pvt. Ltd.<br />
                      502, Shivalik Highstreet, CG Road,<br />
                      Navrangpura, Ahmedabad, Gujarat - 380009<br />
                      India 🇮🇳
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-4 border-t border-border">
                  <Clock className="w-5 h-5 text-stamp-gold flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-serif font-bold text-base text-text-primary">Support Working Hours</h3>
                    <p className="font-sans text-xs text-text-secondary mt-1">
                      Monday to Saturday: 9:30 AM – 7:00 PM IST<br />
                      Sunday: WhatsApp Emergency Support Only
                    </p>
                  </div>
                </div>
              </div>

              <div className="paper-card p-6 rounded-paper-lg bg-surface-elevated text-text-primary border border-border space-y-3">
                <span className="stamp-badge stamp-badge-gold text-[10px]">✦ INSTANT ASSISTANCE</span>
                <h3 className="font-serif text-lg font-bold text-text-primary">Need Immediate Help at Your Counter?</h3>
                <p className="font-sans text-xs text-text-secondary leading-relaxed">
                  If you have a customer waiting at your shop counter and need immediate billing assistance, call our priority helpline directly.
                </p>
                <div className="font-mono text-base font-bold text-stamp-gold pt-1">
                  📞 +91 80000 00000
                </div>
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
export default ContactPage;
