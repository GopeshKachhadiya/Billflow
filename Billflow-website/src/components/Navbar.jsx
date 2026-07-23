import { motion, useScroll, useTransform } from "framer-motion";
import { Menu, X, Sun, Moon, ArrowRight, PenTool } from "lucide-react";
import { useState, useEffect } from "react";

const navLinks = [
  { label: "Features", href: "#/features" },
  { label: "How It Works", href: "#/how-it-works" },
  { label: "Pricing", href: "#/pricing" },
  { label: "Blog", href: "#/blog" },
  { label: "About", href: "#/about" },
  { label: "Contact", href: "#/contact" },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeHash, setActiveHash] = useState("");
  const { scrollY } = useScroll();
  
  const navBgOpacity = useTransform(scrollY, [0, 60], [0, 0.95]);
  const navBlur = useTransform(scrollY, [0, 60], [0, 12]);

  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      setActiveHash(window.location.hash || "#/");
    };
    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return (
    <>
      {/* Top Accent Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 h-0.5 z-50"
        style={{
          background: 'linear-gradient(90deg, var(--color-fountain), var(--color-stamp-gold), var(--color-fountain-light))',
          backgroundSize: '200% 100%',
        }}
        animate={{ 
          width: scrollY, 
          backgroundPosition: ['0% 50%', '100% 50%'] 
        }}
        transition={{ 
          width: { type: "spring", stiffness: 500, damping: 30 },
          backgroundPosition: { duration: 20, ease: "linear", repeat: Infinity }
        }}
      />

      {/* Navbar */}
      <motion.header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${isScrolled ? "border-b border-border shadow-paper" : ""}`}
        style={{
          backgroundColor: `rgba(253, 250, 244, ${isScrolled ? 0.95 : 0})`,
          backdropFilter: isScrolled ? `blur(12px)` : 'none',
        }}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <nav className="section-container" aria-label="Main navigation">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <a href="#/" className="flex items-center gap-2.5 group" aria-label="Satya BillFlow Home">
                <div className="relative w-10 h-10 rounded-paper flex items-start justify-start pt-0.5 pl-1.5 overflow-hidden bg-surface-elevated border-[1.5px] border-brand-primary shadow-paper group-hover:border-brand-accent transition-colors">
                  <span className="font-sans font-extrabold text-[21px] text-brand-primary select-none group-hover:scale-110 transition-transform leading-none">स</span>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-transparent via-brand-accent/15 to-transparent"
                    whileHover={{ rotate: 180 }}
                    transition={{ duration: 0.6 }}
                  />
                </div>
                <div className="brand-satya-billflow group-hover:text-brand-accent transition-colors">
                  <span className="brand-satya text-text-primary group-hover:text-brand-accent transition-colors">SATYA</span>
                  <span className="brand-billflow text-brand-primary group-hover:text-brand-accent transition-colors">BILLFLOW</span>
                </div>
              </a>
            </motion.div>

            {/* Desktop Nav Links */}
            <motion.div
              className="hidden lg:flex items-center gap-1"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {navLinks.map((link, i) => {
                const isActive = activeHash === link.href || (link.href === "#/" && !activeHash);
                return (
                  <motion.a
                    key={link.href}
                    href={link.href}
                    className={`relative px-4 py-2 rounded-paper text-sm font-medium transition-colors duration-200 group ${isActive ? "text-fountain font-semibold" : "text-text-secondary hover:text-text-primary"}`}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.04 }}
                    whileHover={{ y: -2 }}
                  >
                    {link.label}
                    <motion.div
                      className={`absolute bottom-1 left-1/2 -translate-x-1/2 h-0.5 bg-fountain transition-all duration-300 ${isActive ? "w-3/5" : "w-0 group-hover:w-3/5"}`}
                    />
                  </motion.a>
                );
              })}
            </motion.div>

            {/* Desktop Actions */}
            <motion.div
              className="hidden lg:flex items-center gap-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              {/* Login Link */}
              <a
                href="#/contact"
                className="btn-ghost hidden xl:inline-flex text-sm font-medium text-text-secondary hover:text-fountain"
              >
                Login
              </a>

              {/* Primary CTA */}
              <motion.a
                href="#/download"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="btn-fountain group no-underline text-white shadow-md hover:shadow-lg"
              >
                <span>Download Free →</span>
              </motion.a>
            </motion.div>

            {/* Mobile Menu Button */}
            <motion.button
              className="lg:hidden paper-card p-2 rounded-paper border border-border"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-fountain" />
              ) : (
                <Menu className="w-6 h-6 text-text-primary" />
              )}
            </motion.button>
          </div>

          {/* Mobile Menu Drawer */}
          <motion.div
            className="lg:hidden overflow-hidden bg-surface border-t border-border shadow-paper rounded-b-paper-lg"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: isMobileMenuOpen ? "auto" : 0, opacity: isMobileMenuOpen ? 1 : 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="py-6 px-4 space-y-2">

              {navLinks.map((link, i) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  className="block px-4 py-3 rounded-paper text-base font-serif font-medium text-text-secondary hover:text-fountain hover:bg-background/80 transition-all duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.04 }}
                  whileHover={{ x: 4 }}
                >
                  {link.label}
                </motion.a>
              ))}

              <motion.div
                className="pt-4 mt-2 space-y-3 border-t border-border"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <a
                  href="#/download"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="btn-fountain w-full text-center block no-underline text-white py-3 rounded-paper shadow-md font-medium"
                >
                  Download Free (14-Day Trial) →
                </a>
                <a
                  href="#/contact"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="btn-ink-outline w-full text-center block py-2.5 rounded-paper border border-border font-medium text-text-secondary hover:text-text-primary"
                >
                  Contact & Support
                </a>
              </motion.div>
            </div>
          </motion.div>
        </nav>
      </motion.header>
    </>
  );
}