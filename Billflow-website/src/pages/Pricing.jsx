import { motion } from "framer-motion";

export default function Pricing() {
  const plans = [
    {
      name: "Monthly Flex",
      price: "₹700",
      period: "/ month",
      features: [
        "Unlimited GST Invoices",
        "Customer Khata & Ledger",
        "1-Click WhatsApp & SMS Send",
        "GSTR-1 JSON & Excel Export",
        "100% Offline SQLite Storage"
      ],
      popular: false
    },
    {
      name: "6-Month Saver",
      price: "₹600",
      period: "/ month (₹3,600 total)",
      features: [
        "Unlimited GST Invoices",
        "Customer Khata & Ledger",
        "1-Click WhatsApp & SMS Send",
        "GSTR-1 JSON & Excel Export",
        "100% Offline SQLite Storage",
        "Priority CA Setup Assistance"
      ],
      popular: true
    },
    {
      name: "Annual Pro",
      price: "₹500",
      period: "/ month (₹6,000 total)",
      features: [
        "Unlimited GST Invoices",
        "Customer Khata & Ledger",
        "1-Click WhatsApp & SMS Send",
        "GSTR-1 JSON & Excel Export",
        "100% Offline SQLite Storage",
        "Priority CA Setup Assistance",
        "Multi-User Role Permissions"
      ],
      popular: false
    }
  ];

  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-6 sm:px-12">
        <h2 className="text-3xl font-bold text-center mb-16">
          Choose Your Plan
        </h2>
        <p className="text-center text-gray-500 mb-12 max-w-2xl mx-auto">
          Flexible pricing for businesses at every stage
        </p>
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className={`flex flex-col items-center border rounded-xl p-6 hover:shadow-lg transition-shadow duration-300 ${plan.popular ? "border-purple-500 bg-purple-50" : "border-gray-200"}`}
            >
              {plan.popular && (
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-purple-600 text-white px-3 py-1 rounded text-sm">
                  Most Popular
                </span>
              )}
              <div className="mt-4">
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <div className="mt-3">
                  <span className="text-3xl font-bold text-purple-600">{plan.price}</span>
                  <span className="ml-2 text-sm text-gray-500">{plan.period}</span>
                </div>
              </div>
              <ul className="mt-6 space-y-3 text-left w-full">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="flex-shrink-0 mt-0.5">
                      ?
                    </span>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`mt-auto w-full px-6 py-3 font-semibold rounded-lg transition-transform duration-200 ${plan.popular ? "bg-purple-600 hover:bg-purple-700 text-white" : "border border-purple-500 hover:bg-purple-50 text-purple-600"}`}
              >
                {plan.popular ? "Get Started" : "Choose Plan"}
              </motion.button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
