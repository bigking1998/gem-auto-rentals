import { motion } from 'framer-motion';
import { Car, Calendar, DollarSign, Headphones, ShieldCheck, Zap } from 'lucide-react';

const benefits = [
  {
    icon: Car,
    title: 'Quality Fleet',
    description:
      'All vehicles are regularly maintained and inspected to ensure your safety and comfort.',
    color: 'bg-orange-50 text-primary',
  },
  {
    icon: Calendar,
    title: 'Flexible Rentals',
    description:
      'Daily, weekly, or monthly rentals available. Extend or modify your booking anytime.',
    color: 'bg-orange-50 text-primary',
  },
  {
    icon: DollarSign,
    title: 'Transparent Pricing',
    description:
      'No hidden fees or surprises. What you see is what you pay, with all taxes included.',
    color: 'bg-orange-50 text-primary',
  },
  {
    icon: Headphones,
    title: '24/7 Support',
    description: 'Our dedicated support team is available around the clock to assist you.',
    color: 'bg-orange-50 text-primary',
  },
  {
    icon: ShieldCheck,
    title: 'Fully Insured',
    description: 'Comprehensive insurance coverage included with every rental for peace of mind.',
    color: 'bg-orange-50 text-primary',
  },
  {
    icon: Zap,
    title: 'Easy Booking',
    description: 'Book in minutes with our streamlined online process. No paperwork hassle.',
    color: 'bg-orange-50 text-primary',
  },
];

export default function WhyChooseUs() {
  return (
    <section id="why-us" className="bg-white py-16 lg:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <span className="bg-primary/10 text-primary mb-4 inline-block rounded-full px-4 py-1.5 text-sm font-semibold">
            Why Us
          </span>
          <h2 className="mb-4 text-3xl font-bold text-gray-900 lg:text-4xl">
            Why Choose Gem Auto Rentals
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            We go above and beyond to provide you with the best car rental experience. Here&apos;s
            what sets us apart.
          </p>
        </motion.div>

        {/* Benefits Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="hover:border-primary/20 group rounded-xl border border-gray-100 bg-white p-5 transition-all duration-300 hover:shadow-xl"
            >
              <div
                className={`h-12 w-12 rounded-xl ${benefit.color} mb-4 flex items-center justify-center transition-transform group-hover:scale-110`}
              >
                <benefit.icon className="h-6 w-6" />
              </div>
              <h3 className="group-hover:text-primary mb-2 text-lg font-bold text-gray-900 transition-colors">
                {benefit.title}
              </h3>
              <p className="text-sm leading-relaxed text-gray-600">{benefit.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
