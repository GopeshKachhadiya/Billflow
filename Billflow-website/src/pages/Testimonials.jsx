import { motion } from "framer-motion";

export default function Testimonials() {
  const testimonials = [
    {
      name: "Rajesh Kumar",
      business: "Kumar Textiles",
      location: "Mumbai",
      rating: 5,
      comment:
        "GSTBill has completely transformed how we handle our invoicing and GST compliance. The automated GST filing feature has saved us countless hours each month.",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
    },
    {
      name: "Priya Sharma",
      business: "Sharma Consultants",
      location: "Delhi",
      rating: 4,
      comment:
        "As a small consulting firm, we were struggling with GST compliance. This software made it simple and error-free.",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face"
    },
    {
      name: "Amit Patel",
      business: "Patel Electronics",
      location: "Ahmedabad",
      rating: 5,
      comment:
        "The invoicing features are fantastic. We can now generate GST-compliant invoices in seconds, and our clients love the professional format.",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face"
    }
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 sm:px-12">
        <h2 className="text-3xl font-bold text-center mb-16">
          What Our Customers Say
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.05 }}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
            >
              <div className="flex items-center mb-4">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full mr-4"
                />
                <div>
                  <h3 className="font-bold">{testimonial.name}</h3>
                  <p className="text-sm text-gray-500">
                    {testimonial.business} • {testimonial.location}
                  </p>
                </div>
              </div>
              <div className="flex mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className="text-yellow-400"
                    aria-hidden="true"
                  >
                    {"\u2605"}
                  </span>
                ))}
              </div>
              <p className="text-gray-600 italic">
                "{testimonial.comment}"
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
