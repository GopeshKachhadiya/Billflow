import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section className="py-20 px-6 sm:px-12">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-4xl mx-auto text-center"
      >
        <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
          Simplify Your GST Billing
        </h1>
        <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
          BillFlow is an intuitive, offline-first GST billing and inventory software with real-time Supabase cloud sync. Generate professional tax invoices, track item catalogs, and export GSTR-1 data with ease.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-transform duration-200 text-lg"
          >
            Start Free Trial
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-3 border border-purple-400 hover:border-purple-500 text-purple-400 hover:text-white bg-transparent rounded-lg transition-all duration-200 text-lg"
          >
            Learn More
          </motion.button>
        </div>
      </motion.div>
    </section>
  );
}
