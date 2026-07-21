"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { HomePage } from "./pages/HomePage";
import { FeaturesPage } from "./pages/FeaturesPage";
import { HowItWorksPage } from "./pages/HowItWorksPage";
import { PricingPage } from "./pages/PricingPage";
import { DownloadPage } from "./pages/DownloadPage";
import { AboutPage } from "./pages/AboutPage";
import { ContactPage } from "./pages/ContactPage";
import { BlogPage } from "./pages/BlogPage";
import { PrivacyPage } from "./pages/PrivacyPage";
import { TermsPage } from "./pages/TermsPage";
import { SupportChatbot } from "./components/SupportChatbot";

function App() {
  const [currentHash, setCurrentHash] = useState(window.location.hash || "#/");

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash || "#/";
      setCurrentHash(hash);
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const renderPage = () => {
    const basePath = currentHash.startsWith("#/features") ? "#/features"
      : currentHash.startsWith("#/how-it-works") ? "#/how-it-works"
      : currentHash.startsWith("#/pricing") ? "#/pricing"
      : currentHash.startsWith("#/download") ? "#/download"
      : currentHash.startsWith("#/about") ? "#/about"
      : currentHash.startsWith("#/contact") ? "#/contact"
      : currentHash.startsWith("#/blog") ? "#/blog"
      : currentHash.startsWith("#/privacy") ? "#/privacy"
      : currentHash.startsWith("#/terms") ? "#/terms"
      : "#/";

    switch (basePath) {
      case "#/features":
        return <FeaturesPage />;
      case "#/how-it-works":
        return <HowItWorksPage />;
      case "#/pricing":
        return <PricingPage />;
      case "#/download":
        return <DownloadPage />;
      case "#/about":
        return <AboutPage />;
      case "#/contact":
        return <ContactPage />;
      case "#/blog":
        return <BlogPage />;
      case "#/privacy":
        return <PrivacyPage />;
      case "#/terms":
        return <TermsPage />;
      case "#/":
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-text-primary selection:bg-fountain selection:text-white">
      <Navbar />
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentHash.split("?")[0].split("#")[1] || "home"}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
      <SupportChatbot />
    </div>
  );
}

export default App;