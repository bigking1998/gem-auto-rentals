import { motion } from 'framer-motion';
import { Search, CalendarCheck, FileSignature, Car } from 'lucide-react';

const steps = [
  {
    icon: Search,
    title: 'Browse & Select',
    description:
      'Explore our diverse fleet and find the perfect vehicle for your needs. Filter by category, price, or features.',
    color: 'from-primary-light to-primary-dark',
  },
  {
    icon: CalendarCheck,
    title: 'Book & Verify',
    description:
      'Choose your dates, add optional extras, and complete a quick verification process.',
    color: 'from-primary-light to-primary-dark',
  },
  {
    icon: FileSignature,
    title: 'Sign & Pay',
    description:
      'Review and sign the rental agreement digitally. Secure payment with multiple options.',
    color: 'from-primary-light to-primary-dark',
  },
  {
    icon: Car,
    title: 'Pick Up & Go',
    description:
      'Collect your vehicle at the designated location. Our team will walk you through everything.',
    color: 'from-primary-light to-primary-dark',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-gray-50 py-20 lg:py-28">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center lg:mb-16"
        >
          <span className="bg-primary/10 text-primary mb-4 inline-block rounded-full px-4 py-1.5 text-sm font-semibold">
            Simple Process
          </span>
          <h2 className="mb-4 text-3xl font-bold text-gray-900 lg:text-4xl">How It Works</h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            Renting a car has never been easier. Follow these simple steps to get on the road.
          </p>
        </motion.div>

        {/* Steps Grid */}
        <div className="relative">
          {/* Connector Line (Desktop) */}
          <div className="via-primary absolute left-[12%] right-[12%] top-24 hidden h-0.5 bg-gradient-to-r from-gray-200 to-gray-200 lg:block" />

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
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
                  <div className="relative mb-6 inline-flex">
                    <div
                      className={`h-20 w-20 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg`}
                    >
                      <step.icon className="h-10 w-10 text-white" />
                    </div>
                    <span className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-bold text-gray-900 shadow-md">
                      {index + 1}
                    </span>
                  </div>

                  {/* Content */}
                  <h3 className="mb-3 text-xl font-bold text-gray-900">{step.title}</h3>
                  <p className="leading-relaxed text-gray-600">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
