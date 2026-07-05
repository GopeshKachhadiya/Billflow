import { motion } from "framer-motion";

export default function Features() {
  const features = [
    {
      icon: "??",
      title: "GST Compliant Invoicing",
      description:
        "Generate professional invoices with automatic GST calculations, HSN/SAC codes, and compliant formats."
    },
    {
      icon: "??",
      title: "Expense Tracking",
      description:
        "Track all business expenses, categorize them, and generate reports for better financial management."
    },
    {
      icon: "??",
      title: "Automated Reminders",
      description:
        "Never miss a payment deadline with automated reminders for invoices and tax filings."
    },
    {
      icon: "??",
      title: "Bank Reconciliation",
      description:
        "Import bank statements and automatically match transactions with your records."
    },
    {
      icon: "??",
      title: "Financial Reports",
      description:
        "Get insights with profit & loss statements, balance sheets, and GST reports."
    },
    {
      icon: "??",
      title: "Data Security",
      description:
        "Your financial data is encrypted and stored securely with regular backups."
    }
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 sm:px-12">
        <h2 className="text-3xl font-bold text-center mb-16">
          Features Built for Your Business
        </h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={feature.icon}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.05 }}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
