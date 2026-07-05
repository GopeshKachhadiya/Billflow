import { motion, useInView } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { TrendingUp, ShieldCheck, Star, Clock } from "lucide-react";

const stats = [
  { icon: TrendingUp, value: 12000, suffix: "+", label: "Daily GST Bills Generated", sub: "Across 28 states & UTs" },
  { icon: ShieldCheck, value: 45, prefix: "₹", suffix: " Cr+", label: "Monthly GST Vol Tracked", sub: "100% Tax Compliant" },
  { icon: Star, value: 4.9, decimals: 1, suffix: " / 5", label: "Average User Rating", sub: "Verified on SoftwareSuggest" },
  { icon: Clock, value: 30, suffix: " Sec", label: "Average Bill Creation Time", sub: "Fastest in Indian market" },
];

function AnimatedCounter({ value, prefix = "", suffix = "", decimals = 0 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    const stepTime = duration / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [isInView, value]);

  return (
    <span ref={ref} className="font-mono text-3xl sm:text-4xl lg:text-5xl font-extrabold text-stamp-gold tracking-tight">
      {prefix}{count.toFixed(decimals)}{suffix}
    </span>
  );
}

export function StatsBar() {
  return (
    <section className="relative py-16 bg-[#0f172a] text-white border-y-2 border-stamp-gold overflow-hidden shadow-paper-xl">
      {/* Background aesthetics */}
      <div className="absolute inset-0 bg-[radial-gradient(#ca8a04_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-full bg-gradient-to-r from-transparent via-fountain/20 to-transparent blur-3xl pointer-events-none" />

      <div className="section-container relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 divide-y sm:divide-y-0 sm:divide-x divide-white/10">
          {stats.map((stat, i) => {
            const IconComponent = stat.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className={`pt-8 sm:pt-0 ${i > 0 ? "sm:pl-8 lg:pl-12" : ""} flex flex-col items-center sm:items-start text-center sm:text-left group`}
              >
                <div className="w-10 h-10 rounded-paper bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover:border-stamp-gold group-hover:scale-110 transition-all">
                  <IconComponent className="w-5 h-5 text-stamp-gold" />
                </div>
                <div className="mb-2">
                  <AnimatedCounter
                    value={stat.value}
                    prefix={stat.prefix}
                    suffix={stat.suffix}
                    decimals={stat.decimals}
                  />
                </div>
                <h3 className="font-serif text-base sm:text-lg font-bold text-white mb-1">
                  {stat.label}
                </h3>
                <p className="font-sans text-xs text-[#94a3b8]">
                  {stat.sub}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
