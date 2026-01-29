import { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { api } from '@/lib/api';

interface StatItem {
  value: number;
  suffix: string;
  label: string;
}

// Default stats (shown while loading or on error)
const defaultStats: StatItem[] = [
  { value: 1250, suffix: '+', label: 'Happy Customers' },
  { value: 99.9, suffix: '%', label: 'Satisfaction Rate' },
  { value: 10, suffix: '+', label: 'Years Experience' },
  { value: 50000, suffix: '+', label: 'Completed Rentals' },
];

function AnimatedCounter({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;

    const duration = 2000;
    const steps = 60;
    const stepValue = value / steps;
    const stepDuration = duration / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += stepValue;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current * 10) / 10);
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [value, isInView]);

  const displayValue = value % 1 === 0
    ? count.toLocaleString('en-US', { maximumFractionDigits: 0 })
    : count.toFixed(1);

  return (
    <span ref={ref}>
      {displayValue}{suffix}
    </span>
  );
}

export default function Statistics() {
  const [stats, setStats] = useState<StatItem[]>(defaultStats);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.stats.getPublic();

        // Convert average rating to percentage for satisfaction rate
        // (4.8 out of 5 = 96%)
        const satisfactionRate = Math.round((data.averageRating / 5) * 1000) / 10;

        setStats([
          {
            value: data.totalCustomers || 1250,
            suffix: '+',
            label: 'Happy Customers'
          },
          {
            value: satisfactionRate || 99.9,
            suffix: '%',
            label: 'Satisfaction Rate'
          },
          {
            value: data.yearsInBusiness || 10,
            suffix: '+',
            label: 'Years Experience'
          },
          {
            value: data.totalRentals || 50000,
            suffix: '+',
            label: 'Completed Rentals'
          },
        ]);
      } catch (error) {
        // Keep default values on error
        console.debug('Failed to fetch public stats:', error);
      }
    };

    fetchStats();
  }, []);

  return (
    <section className="py-20 lg:py-28 bg-gray-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/30 rounded-full blur-[100px]" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gray-100/10 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12 lg:mb-16"
        >
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Trusted by Thousands
          </h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Numbers that speak to our commitment to excellence and customer satisfaction.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center"
            >
              <div className="text-4xl lg:text-5xl font-bold text-white mb-2">
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              </div>
              <p className="text-gray-400 text-lg">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
