import { motion } from 'framer-motion';
import { Shield, MapPin, Award, Users, Phone, Lock } from 'lucide-react';

// 2026-10-20 — four of the six original badges were claims the business cannot
// support, on a site about to carry paid advertising:
//   "10,000+ Customers"  — fabricated; there are no completed bookings yet
//   "4.9 Rating"         — fabricated; there are no reviews at all
//   "Guaranteed lowest rates" — a price-match promise nobody agreed to honour
//   "Fully Insured / Complete coverage included" — the same unverified insurance
//                          claim that was removed from the booking flow
//   "24/7 Support"       — the business answers during business hours
// Replaced with facts that are true today and can be defended if challenged.
const badges = [
  {
    icon: Lock,
    title: 'Secure Checkout',
    description: 'Encrypted connection',
  },
  {
    icon: MapPin,
    title: 'Mulberry, Florida',
    description: 'Serving Polk County',
  },
  {
    icon: Phone,
    title: 'Call or Text Us',
    description: '(863) 277-6712',
  },
  {
    icon: Users,
    title: 'Drivers 21+',
    description: 'Valid licence required',
  },
  {
    icon: Award,
    title: 'From $50 / day',
    description: 'Weekly rates available',
  },
  {
    icon: Shield,
    title: 'Confirmed by a Person',
    description: 'We check before you book',
  },
];

export default function TrustBadges() {
  return (
    <section className="border-y border-gray-100 bg-gray-50 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-6">
          {badges.map((badge, index) => (
            <motion.div
              key={badge.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="flex flex-col items-center text-center"
            >
              <div className="bg-primary/10 mb-3 flex h-12 w-12 items-center justify-center rounded-full">
                <badge.icon className="text-primary h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-gray-900">{badge.title}</h3>
              <p className="mt-0.5 text-xs text-gray-500">{badge.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
