import { motion } from "framer-motion";

export default function CTA() {
  return (
    <section className="py-20 bg-gradient-to-r from-purple-600 to-pink-500">
      <div className="max-w-4xl mx-auto px-6 sm:px-12 text-center">
        <h2 className="text-3xl font-bold text-white mb-6">
          Ready to Simplify Your GST Billing?
        </h2>
        <p className="text-xl text-white/90 mb-8">
          Experience the modern desktop & cloud GST billing solution built specifically for Indian businesses.
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-8 py-3 bg-white text-purple-600 font-semibold rounded-lg hover:bg-gray-50 transition-transform duration-200 text-lg"
        >
          Start Free Trial Today
        </motion.button>
      </div>
    </section>
  );
}
