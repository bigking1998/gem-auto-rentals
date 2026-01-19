import { motion } from 'framer-motion';
import { Car, Calendar, DollarSign, Headphones, ShieldCheck, Zap } from 'lucide-react';

const benefits = [
  {
    icon: Car,
    title: 'Quality Fleet',
    description: 'All vehicles are regularly maintained and inspected to ensure your safety and comfort.',
    color: 'bg-orange-50 text-primary',
  },
  {
    icon: Calendar,
    title: 'Flexible Rentals',
    description: 'Daily, weekly, or monthly rentals available. Extend or modify your booking anytime.',
    color: 'bg-orange-50 text-primary',
  },
  {
    icon: DollarSign,
    title: 'Transparent Pricing',
    description: 'No hidden fees or surprises. What you see is what you pay, with all taxes included.',
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
    <section id="why-us" className="py-16 lg:py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-semibold mb-4">
            Why Us
          </span>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Why Choose Gem Auto Rentals
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            We go above and beyond to provide you with the best car rental experience.
            Here's what sets us apart.
          </p>
        </motion.div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group p-5 bg-white rounded-xl border border-gray-100 hover:border-primary/20 hover:shadow-xl transition-all duration-300"
            >
              <div className={`w-12 h-12 rounded-xl ${benefit.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <benefit.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors">
                {benefit.title}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {benefit.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
