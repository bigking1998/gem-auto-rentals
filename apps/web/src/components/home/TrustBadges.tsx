import { motion } from 'framer-motion';
import { Shield, Clock, Award, Users, Star, Lock } from 'lucide-react';

const badges = [
  {
    icon: Lock,
    title: 'Secure Payment',
    description: '256-bit SSL encryption',
  },
  {
    icon: Clock,
    title: '24/7 Support',
    description: 'Always here to help',
  },
  {
    icon: Shield,
    title: 'Fully Insured',
    description: 'Complete coverage included',
  },
  {
    icon: Users,
    title: '10,000+ Customers',
    description: 'Trusted by thousands',
  },
  {
    icon: Star,
    title: '4.9 Rating',
    description: 'Highly rated service',
  },
  {
    icon: Award,
    title: 'Best Price',
    description: 'Guaranteed lowest rates',
  },
];

export default function TrustBadges() {
  return (
    <section className="py-8 bg-gray-50 border-y border-gray-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {badges.map((badge, index) => (
            <motion.div
              key={badge.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="flex flex-col items-center text-center"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <badge.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm">{badge.title}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{badge.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
