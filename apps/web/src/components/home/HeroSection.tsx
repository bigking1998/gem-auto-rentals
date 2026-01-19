import { motion } from 'framer-motion';
import { CalendarRange, ShieldCheck, Star, Car } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative h-screen min-h-[800px] w-full overflow-hidden flex items-end pb-32">
      {/* Video Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-black/40 z-10" /> {/* Overlay for text contrast */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
        >
          {/* Placeholder URL - Replace with licensed video */}
          <source
            src="https://www.extendas.com/content/uploads/2025/09/heroe-1.mp4"
            type="video/mp4"
          />
          Your browser does not support the video tag.
        </video>
      </div>

      <div className="container relative z-20 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl">
          {/* Trust Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white mb-6"
          >
            <Star className="w-4 h-4 text-primary fill-primary" />
            <span className="text-sm font-medium tracking-wide">Premium Car Rental Service</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight"
          >
            Drive Your <span className="text-primary">Dream</span> Today
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl text-gray-200 mb-10 max-w-2xl leading-relaxed"
          >
            Experience the freedom of the road with our premium fleet.
            Flexible bookings, comprehensive insurance, and 24/7 support.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <button
              className="inline-flex items-center justify-center bg-primary hover:bg-orange-600 text-white font-bold h-14 px-8 text-lg shadow-xl shadow-orange-500/20 rounded-xl transition-all"
            >
              <Car className="mr-2 h-5 w-5" />
              Browse Vehicles
            </button>
            <button
              className="inline-flex items-center justify-center bg-white/10 hover:bg-white/20 text-white border border-white/30 h-14 px-8 text-lg backdrop-blur-sm rounded-xl transition-all"
            >
              <CalendarRange className="mr-2 h-5 w-5" />
              Book Now
            </button>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-16 flex flex-wrap gap-8"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10">
                <ShieldCheck className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-white font-semibold">Fully Insured</p>
                <p className="text-white/60 text-sm">Peace of mind included</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10">
                <Star className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-white font-semibold">5-Star Service</p>
                <p className="text-white/60 text-sm">Rated by customers</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
