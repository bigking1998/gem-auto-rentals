import { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { api } from '@/lib/api';

interface StatItem {
  value: number;
  suffix: string;
  label: string;
}

function AnimatedCounter({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
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

  // `count` is animation state that starts at 0 and is only ever advanced once the
  // viewport observer fires. Fall back to the real number until then, so a browser
  // that never delivers an intersection callback (backgrounded/non-painting tab,
  // prerender, snapshot tooling) can't leave the section stuck reading "0".
  const displayed = isInView ? count : value;

  const displayValue =
    value % 1 === 0
      ? displayed.toLocaleString('en-US', { maximumFractionDigits: 0 })
      : displayed.toFixed(1);

  return (
    <span ref={ref}>
      {displayValue}
      {suffix}
    </span>
  );
}

export default function Statistics() {
  // `null` = not loaded yet. Never seeded with placeholder numbers: every figure
  // rendered here has to come from the API.
  const [stats, setStats] = useState<StatItem[] | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.stats.getPublic();
        const rating = data.averageRating ?? 0;

        // Ordered by how much each one says about the business; the first four
        // that hold real data are the ones we show.
        const items: StatItem[] = [
          { value: data.totalCustomers, suffix: '+', label: 'Happy Customers' },
          { value: rating, suffix: '/5', label: 'Average Rating' },
          { value: data.yearsInBusiness, suffix: '+', label: 'Years Experience' },
          { value: data.totalRentals, suffix: '+', label: 'Completed Rentals' },
          { value: data.vehicleCount, suffix: '', label: 'Vehicles in Fleet' },
        ];

        // Only show stats we can actually back with data. A metric that is 0 or
        // not yet recorded is dropped rather than padded out with a made-up number.
        setStats(items.filter((item) => item.value > 0).slice(0, 4));
      } catch {
        // No data, no claims.
        setStats([]);
      }
    };

    fetchStats();
  }, []);

  if (!stats || stats.length === 0) return null;

  const gridColumns =
    stats.length >= 4
      ? 'grid-cols-2 lg:grid-cols-4'
      : stats.length === 3
        ? 'grid-cols-2 lg:grid-cols-3'
        : stats.length === 2
          ? 'grid-cols-2'
          : 'grid-cols-1';

  return (
    <section className="relative overflow-hidden bg-gray-900 py-20 lg:py-28">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-20">
        <div className="bg-primary/30 absolute -right-40 -top-40 h-80 w-80 rounded-full blur-[100px]" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-gray-100/10 blur-[100px]" />
      </div>

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center lg:mb-16"
        >
          <h2 className="mb-4 text-3xl font-bold text-white lg:text-4xl">By the Numbers</h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-300">
            A straight look at where Gem Car Rentals stands today.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className={`grid gap-8 lg:gap-12 ${gridColumns}`}>
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center"
            >
              <div className="mb-2 text-4xl font-bold text-white lg:text-5xl">
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              </div>
              <p className="text-lg text-gray-400">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
