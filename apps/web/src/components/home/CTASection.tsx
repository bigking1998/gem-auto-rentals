import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Phone } from 'lucide-react';

export default function CTASection() {
  return (
    <section className="relative overflow-hidden bg-gray-900 py-20 lg:py-28">
      {/* Background Effects - More subtle */}
      <div className="absolute inset-0 opacity-10">
        <div className="bg-primary absolute left-1/4 top-0 h-96 w-96 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-gray-100 blur-[128px]" />
      </div>

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl text-center"
        >
          <h2 className="mb-6 text-3xl font-bold text-white lg:text-5xl">Ready to Hit the Road?</h2>
          <p className="mb-10 text-xl leading-relaxed text-gray-300">
            Browse our fleet and book your perfect ride today. Experience the freedom of the open
            road with Gem Car Rentals.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/vehicles"
              className="text-primary-foreground bg-primary hover:bg-primary-dark group inline-flex w-full items-center justify-center rounded-lg px-8 py-4 text-lg font-semibold shadow-lg transition-all hover:shadow-xl sm:w-auto"
            >
              Browse Vehicles
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>

            <a
              href="tel:+18134224539"
              className="inline-flex w-full items-center justify-center rounded-lg border-2 border-white/20 px-8 py-4 text-lg font-semibold text-white transition-all hover:bg-white/10 sm:w-auto"
            >
              <Phone className="mr-2 h-5 w-5" />
              813-422-4539
            </a>
          </div>

          {/* Trust Badge */}
          <div className="mt-12 flex items-center justify-center gap-6 text-gray-400">
            <div className="flex items-center gap-2">
              <svg className="text-primary h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span className="text-sm">Secure Booking</span>
            </div>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex items-center gap-2">
              <svg className="text-primary h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
              <span className="text-sm">Free Cancellation</span>
            </div>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex items-center gap-2">
              <svg className="text-primary h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
              <span className="text-sm">Best Price Guarantee</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
