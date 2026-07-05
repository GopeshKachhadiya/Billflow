import { motion } from "framer-motion";
import { Star, ShieldCheck, Zap, Award, CheckCircle2, Heart } from "lucide-react";

const trustItems = [
  { icon: Star, text: "4.9★ Rated on SoftwareSuggest & Capterra", color: "text-stamp-gold" },
  { icon: ShieldCheck, text: "100% GST & GSTR-1 Compliant Architecture", color: "text-stamp-green" },
  { icon: Zap, text: "12,000+ Bills Generated Every Single Day", color: "text-fountain" },
  { icon: Award, text: "Works 100% Offline on Any Windows PC", color: "text-stamp-red" },
  { icon: CheckCircle2, text: "Zero Cloud Dependency — Your Data Stays Yours", color: "text-stamp-green" },
  { icon: Heart, text: "Loved & Recommended by 500+ CAs across India", color: "text-stamp-red" },
];

export function SocialProofStrip() {
  return (
    <section className="relative py-8 bg-surface border-y border-border overflow-hidden shadow-paper">
      {/* Background paper texture & ledger line */}
      <div className="absolute inset-0 bg-[var(--paper-texture)] opacity-10 pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-stamp-gold/30 to-transparent" />

      <div className="flex overflow-x-hidden relative z-10">
        <motion.div
          className="flex whitespace-nowrap gap-12 items-center"
          animate={{ x: ["0%", "-50%"] }}
          transition={{
            repeat: Infinity,
            ease: "linear",
            duration: 35,
          }}
        >
          {/* Double the array for seamless infinite scroll */}
          {[...trustItems, ...trustItems, ...trustItems].map((item, index) => {
            const IconComponent = item.icon;
            return (
              <div
                key={index}
                className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-background border border-border shadow-sm hover:border-fountain transition-colors cursor-default group"
              >
                <div className="p-1 rounded-full bg-surface border border-border group-hover:scale-110 transition-transform">
                  <IconComponent className={`w-4 h-4 ${item.color}`} />
                </div>
                <span className="font-serif italic text-sm font-medium text-text-primary">
                  {item.text}
                </span>
                <span className="text-border ml-2" aria-hidden="true">✦</span>
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
