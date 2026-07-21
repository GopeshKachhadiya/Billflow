import { motion } from "framer-motion";
import { Shield, Lock, EyeOff, Database, Server, FileText, CheckCircle2 } from "lucide-react";

export function PrivacyPage() {
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
            <Shield className="w-3.5 h-3.5 text-stamp-green" />
            <span>Digital Personal Data Protection (DPDP Act 2023) Compliant</span>
          </div>
          <h1 className="font-serif text-3xl md:text-5xl font-bold text-text-primary mb-4 tracking-tight">
            Privacy Policy & Data Security Guarantee
          </h1>
          <p className="font-sans text-base text-text-secondary max-w-2xl mx-auto leading-relaxed">
            At BillFlow, our core architectural philosophy is simple: <strong className="text-text-primary">Your financial data belongs exclusively to your business.</strong> Here is our exact technical and legal commitment to keeping your data private, offline-first, and encrypted.
          </p>
          <div className="mt-4 text-xs font-mono text-text-muted">
            Last Updated: July 21, 2026 • Effective Date: Immediate
          </div>
        </motion.div>

        {/* Content Body */}
        <div className="space-y-12 font-sans text-text-secondary leading-relaxed text-sm md:text-base">
          {/* Section 1 */}
          <section className="bg-surface border border-border p-6 md:p-8 rounded-paper shadow-paper">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-paper bg-surface-elevated border border-border flex items-center justify-center flex-shrink-0 text-brand-primary">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-serif text-xl font-bold text-text-primary">1. Offline-First Architecture & Local Data Sovereignty</h2>
                <p className="mt-2">
                  Unlike traditional cloud-hosted SaaS apps that store your customer invoices, GSTINs, and revenue figures on centralized third-party servers, BillFlow is designed as an <strong className="text-text-primary">offline-first desktop operating system</strong>.
                </p>
                <ul className="mt-4 space-y-2.5 list-disc pl-5">
                  <li><strong>Local SQLite Storage:</strong> All invoices, customer ledgers, item catalogs, and expense records are stored locally on your device in encrypted SQLite databases.</li>
                  <li><strong>Zero Mandatory Cloud Uploads:</strong> You can operate BillFlow indefinitely without an internet connection. Your financial records never leave your machine unless you explicitly enable cloud sync or backups.</li>
                  <li><strong>Complete Ownership:</strong> If you uninstall BillFlow or cancel your subscription, your data remains accessible in local exported formats (SQL/CSV/JSON). We hold zero proprietary lock-in.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section className="bg-surface border border-border p-6 md:p-8 rounded-paper shadow-paper">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-paper bg-surface-elevated border border-border flex items-center justify-center flex-shrink-0 text-brand-primary">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-serif text-xl font-bold text-text-primary">2. Encryption Standards (At Rest & In Transit)</h2>
                <p className="mt-2">
                  For businesses utilizing our optional multi-device synchronization and Supabase cloud backup engine, we enforce military-grade cryptographic protection:
                </p>
                <ul className="mt-4 space-y-2.5 list-disc pl-5">
                  <li><strong>Local Envelope Encryption:</strong> Sensitive keys and credentials are derived using PBKDF2 with high iteration counts and encrypted using AES-256-GCM before resting on disk.</li>
                  <li><strong>Transport Layer Security:</strong> Any data synced between devices or backed up to cloud endpoints travels strictly over TLS 1.3 with certificate pinning enforced in the desktop client.</li>
                  <li><strong>Zero-Knowledge Cloud Backups:</strong> Cloud snapshots are encrypted with user-controlled encryption keys. BillFlow engineers and system administrators cannot decrypt or read your invoice totals, profit margins, or customer lists.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="bg-surface border border-border p-6 md:p-8 rounded-paper shadow-paper">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-paper bg-surface-elevated border border-border flex items-center justify-center flex-shrink-0 text-brand-primary">
                <EyeOff className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-serif text-xl font-bold text-text-primary">3. Information We Collect & Why</h2>
                <p className="mt-2">
                  To provide software licenses, OTA updates, and customer support, we collect only the minimum necessary telemetry and account metadata:
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="p-4 rounded-paper bg-surface-elevated border border-border">
                    <h4 className="font-semibold text-text-primary text-sm mb-1">Account & License Data</h4>
                    <p className="text-xs">Your email address, business name, and encrypted license key fingerprint used strictly for authentication and subscription verification.</p>
                  </div>
                  <div className="p-4 rounded-paper bg-surface-elevated border border-border">
                    <h4 className="font-semibold text-text-primary text-sm mb-1">Anonymous Crash Logs</h4>
                    <p className="text-xs">With explicit opt-in, we receive anonymized stack traces (via Electron runtime logs) to resolve application crashes. No financial numbers are ever included.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="bg-surface border border-border p-6 md:p-8 rounded-paper shadow-paper">
            <h2 className="font-serif text-xl font-bold text-text-primary mb-3">4. Compliance with Indian DPDP Act (2023)</h2>
            <p>
              In full compliance with India's Digital Personal Data Protection Act, you retain absolute rights over any personal identifiers shared with our support or licensing portal:
            </p>
            <ul className="mt-3 space-y-2 list-disc pl-5">
              <li><strong>Right to Correction & Erasure:</strong> You can request immediate deletion of your cloud sync account and licensing metadata by contacting our Data Protection Officer at <a href="mailto:dpo@billflow.in" className="text-fountain underline">dpo@billflow.in</a>.</li>
              <li><strong>Right to Grievance Redressal:</strong> All data inquiries are investigated and responded to within 48 business hours from our Ahmedabad compliance office.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="bg-surface border border-border p-6 md:p-8 rounded-paper shadow-paper">
            <h2 className="font-serif text-xl font-bold text-text-primary mb-3">5. Third-Party Integrations & Webhooks</h2>
            <p>
              When you activate optional third-party integrations (such as n8n webhooks, WhatsApp API gateways, or Razorpay payment links), data transmission is governed by your configured API tokens. BillFlow acts solely as a secure execution bridge and never intercepts or monetizes webhook payloads.
            </p>
          </section>
        </div>

        {/* Footer Contact */}
        <div className="mt-16 p-8 bg-surface-elevated border border-border rounded-paper text-center">
          <h3 className="font-serif text-lg font-bold text-text-primary mb-2">Have Questions About Our Security Policy?</h3>
          <p className="text-xs text-text-muted mb-4">Our engineering and security teams are ready to walk through our code architecture with your IT officers.</p>
          <a href="mailto:security@billflow.in" className="btn-ink-outline px-6 py-2.5 rounded-paper text-xs font-semibold inline-block">
            Contact Security Team → security@billflow.in
          </a>
        </div>
      </div>
    </div>
  );
}
export default PrivacyPage;
