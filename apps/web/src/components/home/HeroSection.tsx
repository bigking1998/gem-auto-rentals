import { motion } from 'framer-motion';
import { ShieldCheck, Star } from 'lucide-react';
import QuickPricingWidget from './QuickPricingWidget';

export default function HeroSection() {
  return (
    <section className="relative flex min-h-[100svh] w-full items-center overflow-hidden pb-8 pt-32 md:items-end md:pb-32 md:pt-0">
      {/*
        Owned brand background. This replaced a 7.8 MB hero video that was
        hotlinked from an unrelated third party's server (unlicensed, and they
        could break the homepage at any time). Pure CSS in the brand navy/gold
        palette: zero bytes over the wire, no third-party dependency, and the
        dark base keeps the white/gold text above 4.5:1.
      */}
      <div className="bg-navy absolute inset-0 z-0" aria-hidden="true">
        {/* Gold glow, upper right */}
        <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_78%_18%,hsl(var(--primary)/0.28)_0%,transparent_65%)]" />
        {/* Cooler navy lift, lower left, so the panel doesn't read flat */}
        <div className="absolute inset-0 bg-[radial-gradient(70%_70%_at_12%_88%,hsl(var(--navy-light)/0.22)_0%,transparent_60%)]" />
        {/* Vignette back down to navy so text always sits on the dark end */}
        <div className="absolute inset-0 bg-[linear-gradient(160deg,hsl(var(--navy)/0.55)_0%,hsl(var(--navy)/0.15)_45%,hsl(var(--navy)/0.85)_100%)]" />
      </div>

      <div className="container relative z-20 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl">
          {/* Trust Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-white backdrop-blur-md md:mb-6"
          >
            <Star className="text-primary fill-primary h-4 w-4" />
            <span className="text-sm font-medium tracking-wide">Premium Car Rental Service</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-4 text-4xl font-bold leading-tight text-white sm:text-5xl md:mb-6 lg:text-7xl"
          >
            Drive Your <span className="text-primary">Dream</span> Today
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-6 max-w-2xl text-lg leading-relaxed text-gray-200 md:mb-10 md:text-xl"
          >
            Experience the freedom of the road with our premium fleet. Flexible bookings,
            comprehensive insurance, and 24/7 support.
          </motion.p>

          {/* Quick Pricing Widget */}
          <QuickPricingWidget />

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-8 flex flex-wrap gap-6 md:gap-8"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 backdrop-blur-md">
                <ShieldCheck className="text-primary h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-white">Fully Insured</p>
                <p className="text-sm text-white/60">Peace of mind included</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 backdrop-blur-md">
                <Star className="text-primary h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-white">5-Star Service</p>
                <p className="text-sm text-white/60">Rated by customers</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
