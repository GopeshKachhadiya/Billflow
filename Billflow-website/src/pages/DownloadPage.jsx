import { motion } from "framer-motion";
import { useState } from "react";
import { 
  Download, 
  ShieldCheck, 
  Monitor, 
  CheckCircle2, 
  HelpCircle, 
  Cpu, 
  HardDrive, 
  Lock, 
  Sparkles,
  AlertCircle,
  FileText
} from "lucide-react";
import { CTASection } from "../components/CTASection";

export function DownloadPage() {
  const [arch, setArch] = useState("64");
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const handleDownload = () => {
    setDownloading(true);
    
    // Direct same-page download from static public/downloads/ directory (works for private repos without redirection)
    const fileName = arch === "64" ? "BillFlow_Setup_v2.4_64bit.exe" : "BillFlow_Setup_v2.4_32bit.exe";
    const downloadUrl = `/downloads/${fileName}`;

    const link = document.createElement("a");
    link.href = downloadUrl;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setDownloading(false);
      setDownloaded(true);
    }, 1500);
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
            <ShieldCheck className="w-4 h-4 text-stamp-green" />
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-text-secondary">100% Offline Desktop Application</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-text-primary mb-6"
          >
            Download BillFlow for <span className="text-fountain underline decoration-stamp-gold">Windows PC</span>.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="font-sans text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed"
          >
            Lightweight 24 MB installer. Digitally signed by Microsoft Authenticode for complete protection against malware and viruses.
          </motion.p>
        </div>
      </section>

      {/* Main Download Card */}
      <section className="section-padding">
        <div className="section-container max-w-4xl mx-auto">
          <div className="paper-card p-8 sm:p-12 rounded-paper-xl bg-gradient-to-br from-surface via-background to-surface border-2 border-fountain shadow-paper-xl relative overflow-hidden">
            <div className="absolute top-4 right-4 stamp-badge stamp-badge-green text-xs">
              ✦ VERSION 2.4.1 (STABLE)
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="w-16 h-16 rounded-paper bg-fountain/10 border border-fountain/20 flex items-center justify-center text-fountain mb-6">
                  <Monitor className="w-8 h-8" />
                </div>
                
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-text-primary mb-3">
                  BillFlow Desktop Ledger
                </h2>
                <p className="font-sans text-sm text-text-secondary leading-relaxed mb-6">
                  Select your system architecture below to download the official Windows setup wizard. Includes 14-day free trial with all 22 workflows unlocked.
                </p>

                {/* Architecture Selector */}
                <div className="space-y-2 mb-6">
                  <label className="text-xs font-mono font-semibold text-text-muted uppercase tracking-wider block">Select Windows Architecture:</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setArch("64")}
                      className={`p-3 rounded-paper text-left border transition-all ${
                        arch === "64"
                          ? "bg-fountain text-white border-fountain shadow-md font-semibold"
                          : "bg-background border-border text-text-secondary hover:border-fountain"
                      }`}
                    >
                      <div className="text-sm">64-Bit Installer</div>
                      <div className={`text-[10px] ${arch === "64" ? "text-white/80" : "text-text-muted"}`}>For Windows 10 & 11</div>
                    </button>
                    <button
                      onClick={() => setArch("32")}
                      className={`p-3 rounded-paper text-left border transition-all ${
                        arch === "32"
                          ? "bg-fountain text-white border-fountain shadow-md font-semibold"
                          : "bg-background border-border text-text-secondary hover:border-fountain"
                      }`}
                    >
                      <div className="text-sm">32-Bit (x86) Installer</div>
                      <div className={`text-[10px] ${arch === "32" ? "text-white/80" : "text-text-muted"}`}>For Windows 7 & 8</div>
                    </button>
                  </div>
                </div>

                {/* Download Button */}
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="w-full py-4 rounded-paper bg-fountain text-white font-serif font-bold text-base shadow-lg hover:bg-fountain-light transition-all flex items-center justify-center gap-3"
                >
                  {downloading ? (
                    <span>Downloading BillFlow_{arch}bit.exe...</span>
                  ) : downloaded ? (
                    <span className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> Download Started! Check Downloads Folder</span>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      <span>Download {arch}-Bit Installer (24 MB)</span>
                    </>
                  )}
                </button>
              </div>

              {/* Security & System Info Box */}
              <div className="bg-surface-elevated text-text-primary p-6 rounded-paper-lg border border-border space-y-4 font-sans text-xs">
                <div className="flex items-center gap-2 pb-3 border-b border-border text-stamp-green font-semibold font-mono">
                  <ShieldCheck className="w-4 h-4" /> MICROSOFT AUTHENTICODE SIGNED
                </div>
                <div className="space-y-2 text-text-secondary">
                  <div className="flex justify-between">
                    <span>File Name:</span>
                    <span className="font-mono text-text-primary">BillFlow_Setup_v2.4_{arch}bit.exe</span>
                  </div>
                  <div className="flex justify-between">
                    <span>File Size:</span>
                    <span className="font-mono text-text-primary">24.2 MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SHA-256 Checksum:</span>
                    <span className="font-mono text-[10px] text-stamp-gold">8f9e...2a4c</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Virus Total Scan:</span>
                    <span className="text-stamp-green font-bold">0 / 68 Clean</span>
                  </div>
                </div>
                <div className="p-3 rounded bg-surface border border-border text-[11px] text-text-secondary space-y-1">
                  <p className="font-semibold text-stamp-gold">✦ Why Desktop Software?</p>
                  <p>Desktop software cannot be hacked or locked remotely by cloud outages. Your SQLite database is stored locally on your hard drive under your control.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* System Requirements Grid */}
      <section className="section-padding">
        <div className="section-container max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-text-primary">System Requirements</h2>
            <p className="text-sm text-text-secondary">Designed to run smoothly even on older Windows computers</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="paper-card p-6 rounded-paper bg-surface border border-border">
              <div className="flex items-center gap-2 font-serif font-bold text-base text-text-primary mb-4 pb-2 border-b border-border">
                <Cpu className="w-5 h-5 text-fountain" /> Minimum Configuration
              </div>
              <ul className="space-y-2.5 font-sans text-xs sm:text-sm text-text-secondary">
                <li><strong className="text-text-primary">OS:</strong> Windows 7 SP1 (32-bit or 64-bit)</li>
                <li><strong className="text-text-primary">Processor:</strong> Intel Core 2 Duo or AMD Athlon X2</li>
                <li><strong className="text-text-primary">RAM:</strong> 2 GB RAM</li>
                <li><strong className="text-text-primary">Disk Space:</strong> 100 MB available storage</li>
                <li><strong className="text-text-primary">Printer:</strong> Any A4 ink/laser or thermal POS printer</li>
              </ul>
            </div>

            <div className="paper-card p-6 rounded-paper bg-surface border border-border">
              <div className="flex items-center gap-2 font-serif font-bold text-base text-text-primary mb-4 pb-2 border-b border-border">
                <Sparkles className="w-5 h-5 text-stamp-gold" /> Recommended Configuration
              </div>
              <ul className="space-y-2.5 font-sans text-xs sm:text-sm text-text-secondary">
                <li><strong className="text-text-primary">OS:</strong> Windows 10 or Windows 11 (64-bit)</li>
                <li><strong className="text-text-primary">Processor:</strong> Intel Core i3 / Ryzen 3 or newer</li>
                <li><strong className="text-text-primary">RAM:</strong> 4 GB RAM or higher</li>
                <li><strong className="text-text-primary">Disk Space:</strong> 500 MB SSD storage</li>
                <li><strong className="text-text-primary">Internet:</strong> Optional (Required only for Google Drive sync)</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Step Installation Guide */}
      <section className="section-padding bg-surface border-y border-border">
        <div className="section-container max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="stamp-badge stamp-badge-gold mb-3 inline-block">✦ QUICK INSTALLATION</span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-text-primary">How to Install in 3 Steps</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: "1", title: "Run Setup Wizard", desc: "Double click the downloaded file `BillFlow_Setup.exe` from your Downloads folder." },
              { step: "2", title: "Accept & Install", desc: "Click 'Next' and accept the license agreement. Installation takes less than 15 seconds." },
              { step: "3", title: "Launch & Create Bill", desc: "BillFlow shortcut icon will appear on your desktop. Launch and enter your GSTIN!" },
            ].map((s, idx) => (
              <div key={idx} className="paper-card p-6 rounded-paper bg-background border border-border relative">
                <div className="w-8 h-8 rounded-full bg-fountain text-white font-serif font-bold flex items-center justify-center mb-4">
                  {s.step}
                </div>
                <h3 className="font-serif font-bold text-base text-text-primary mb-2">{s.title}</h3>
                <p className="font-sans text-xs text-text-secondary leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <CTASection />
    </div>
  );
}
export default DownloadPage;
