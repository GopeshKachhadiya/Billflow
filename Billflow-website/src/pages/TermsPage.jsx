import { motion } from "framer-motion";
import { FileText, CheckCircle, AlertTriangle, HelpCircle, Scale } from "lucide-react";

export function TermsPage() {
  return (
    <div className="py-16 md:py-24 bg-background selection:bg-fountain selection:text-white">
      <div className="section-container max-w-4xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 border-b border-border pb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-elevated border border-border text-xs font-mono uppercase tracking-widest text-text-muted mb-4">
            <Scale className="w-3.5 h-3.5 text-brand-primary" />
            <span>Software Licensing & Terms of Use</span>
          </div>
          <h1 className="font-serif text-3xl md:text-5xl font-bold text-text-primary mb-4 tracking-tight">
            Terms of Service & Licensing Agreement
          </h1>
          <p className="font-sans text-base text-text-secondary max-w-2xl mx-auto leading-relaxed">
            By downloading, installing, or subscribing to BillFlow desktop software or associated cloud services, you agree to these legal terms governed by Indian corporate and copyright law.
          </p>
          <div className="mt-4 text-xs font-mono text-text-muted">
            Last Updated: July 21, 2026 • Jurisdiction: Ahmedabad, Gujarat, India
          </div>
        </motion.div>

        {/* Content Body */}
        <div className="space-y-12 font-sans text-text-secondary leading-relaxed text-sm md:text-base">
          {/* Section 1 */}
          <section className="bg-surface border border-border p-6 md:p-8 rounded-paper shadow-paper">
            <h2 className="font-serif text-xl font-bold text-text-primary mb-3">1. Grant of License</h2>
            <p>
              Subject to your payment of applicable subscription fees, BillFlow Technologies Private Limited grants you a non-exclusive, non-transferable, revocable license to install and execute the BillFlow application on personal computers or workstations owned or controlled by your business entity.
            </p>
            <ul className="mt-3 space-y-2 list-disc pl-5">
              <li><strong>Per-Device or Per-Seat Allocation:</strong> Your license tier specifies the exact number of active device installations or user accounts permitted. Unauthorized redistribution or sharing of license activation keys is strictly prohibited.</li>
              <li><strong>Offline Trial Period:</strong> We offer a 14-day full-featured trial. At the end of the trial period, certain features (such as automated GSTR-1 export or cloud sync) require a paid license to continue operation.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="bg-surface border border-border p-6 md:p-8 rounded-paper shadow-paper">
            <h2 className="font-serif text-xl font-bold text-text-primary mb-3">2. User Responsibilities & GST Compliance</h2>
            <p>
              While BillFlow incorporates automated calculation engines for Indian Goods and Services Tax (CGST, SGST, IGST, Cess, and Rounding Off), <strong className="text-text-primary">you remain solely responsible for verifying tax rates, HSN/SAC classifications, and official returns filed with the GST Council / GSTIN Portal.</strong>
            </p>
            <p className="mt-3">
              BillFlow is an accounting and invoicing utility tool, not a certified Chartered Accountant or legal tax advisor. We disclaim liability for any penalties, interest, or regulatory disputes arising from incorrect tax data entry or misclassified invoices.
            </p>
          </section>

          {/* Section 3 */}
          <section className="bg-surface border border-border p-6 md:p-8 rounded-paper shadow-paper">
            <h2 className="font-serif text-xl font-bold text-text-primary mb-3">3. Subscription, Payments & Refund Policy</h2>
            <ul className="space-y-3 list-disc pl-5">
              <li><strong>Billing Cycle:</strong> Subscriptions are billed annually or monthly in advance via authorized payment gateways (e.g., Razorpay, Stripe). All fees are quoted in Indian Rupees (INR) or USD and exclude applicable GST unless stated otherwise.</li>
              <li><strong>30-Day Money-Back Guarantee:</strong> We stand behind our digital ledger quality. If you are dissatisfied with BillFlow during your first 30 days of paid subscription, you may request a 100% full refund with zero questions asked by emailing <a href="mailto:billing@billflow.in" className="text-fountain underline">billing@billflow.in</a>.</li>
              <li><strong>Cancellation:</strong> You may cancel auto-renewal anytime from the billing settings panel or website account dashboard. Upon cancellation, your software will continue operating until the current paid billing period expires.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="bg-surface border border-border p-6 md:p-8 rounded-paper shadow-paper">
            <h2 className="font-serif text-xl font-bold text-text-primary mb-3">4. Intellectual Property Rights</h2>
            <p>
              All software binaries, source code, user interfaces, documentation, visual design systems, and trademarks associated with BillFlow are the proprietary intellectual property of BillFlow Technologies Pvt. Ltd. You may not reverse engineer, decompile, disassemble, or derive the source code of the application without express written consent.
            </p>
          </section>

          {/* Section 5 */}
          <section className="bg-surface border border-border p-6 md:p-8 rounded-paper shadow-paper">
            <h2 className="font-serif text-xl font-bold text-text-primary mb-3">5. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by applicable Indian law, BillFlow Technologies Pvt. Ltd. and its directors, employees, and partners shall not be liable for any indirect, incidental, special, consequential, or punitive damages—including loss of profits, business interruption, or data loss—resulting from the use or inability to use the software.
            </p>
          </section>

          {/* Section 6 */}
          <section className="bg-surface border border-border p-6 md:p-8 rounded-paper shadow-paper">
            <h2 className="font-serif text-xl font-bold text-text-primary mb-3">6. Governing Law & Dispute Resolution</h2>
            <p>
              These Terms of Service shall be governed by and construed in accordance with the laws of India. Any disputes or claims arising out of or relating to this agreement shall be subject to the exclusive jurisdiction of the competent courts situated in Ahmedabad, Gujarat, India.
            </p>
          </section>
        </div>

        {/* Footer Contact */}
        <div className="mt-16 p-8 bg-surface-elevated border border-border rounded-paper text-center">
          <h3 className="font-serif text-lg font-bold text-text-primary mb-2">Need Custom Enterprise Licensing Agreements?</h3>
          <p className="text-xs text-text-muted mb-4">For multi-branch retail chains, CA firms, or custom deployment terms, reach out to our legal department.</p>
          <a href="mailto:legal@billflow.in" className="btn-ink-outline px-6 py-2.5 rounded-paper text-xs font-semibold inline-block">
            Contact Legal Department → legal@billflow.in
          </a>
        </div>
      </div>
    </div>
  );
}
export default TermsPage;
