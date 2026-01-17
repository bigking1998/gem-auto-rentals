import { motion } from 'framer-motion';
import { Search, CalendarCheck, FileSignature, Car } from 'lucide-react';

const steps = [
  {
    icon: Search,
    title: 'Browse & Select',
    description: 'Explore our diverse fleet and find the perfect vehicle for your needs. Filter by category, price, or features.',
    color: 'from-blue-500 to-blue-600',
  },
  {
    icon: CalendarCheck,
    title: 'Book & Verify',
    description: 'Choose your dates, add optional extras, and complete a quick verification process.',
    color: 'from-purple-500 to-purple-600',
  },
  {
    icon: FileSignature,
    title: 'Sign & Pay',
    description: 'Review and sign the rental agreement digitally. Secure payment with multiple options.',
    color: 'from-pink-500 to-pink-600',
  },
  {
    icon: Car,
    title: 'Pick Up & Go',
    description: 'Collect your vehicle at the designated location. Our team will walk you through everything.',
    color: 'from-indigo-500 to-indigo-600',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 lg:py-28 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12 lg:mb-16"
        >
          <span className="inline-block px-4 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium mb-4">
            Simple Process
          </span>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Renting a car has never been easier. Follow these simple steps to get on the road.
          </p>
        </motion.div>

        {/* Steps Grid */}
        <div className="relative">
          {/* Connector Line (Desktop) */}
          <div className="hidden lg:block absolute top-24 left-[12%] right-[12%] h-0.5 bg-gradient-to-r from-blue-200 via-purple-200 to-indigo-200" />

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative"
              >
                <div className="text-center">
                  {/* Step Number */}
                  <div className="relative inline-flex mb-6">
                    <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg`}>
                      <step.icon className="w-10 h-10 text-white" />
                    </div>
                    <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center text-sm font-bold text-gray-900">
                      {index + 1}
                    </span>
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
