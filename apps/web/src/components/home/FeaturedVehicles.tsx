import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Users, Fuel, Settings2, ArrowRight, Car } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { api } from '@/lib/api';
import LazyImage, { EagerImage } from '@/components/ui/LazyImage';

interface FeaturedVehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  category: string;
  dailyRate: number;
  rating: number;
  reviewCount: number;
  seats: number;
  transmission: string;
  fuelType: string;
  image: string;
}


const categoryColors: Record<string, string> = {
  ECONOMY: 'bg-primary text-white shadow-md',
  STANDARD: 'bg-primary text-white shadow-md',
  PREMIUM: 'bg-primary text-white shadow-md',
  LUXURY: 'bg-primary text-white shadow-md',
  SUV: 'bg-primary text-white shadow-md',
  VAN: 'bg-primary text-white shadow-md',
};

export default function FeaturedVehicles() {
  const [vehicles, setVehicles] = useState<FeaturedVehicle[]>([]);
  const [, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchFeaturedVehicles() {
      try {
        const response = await api.vehicles.list({ limit: 4 });

        if (response.items && response.items.length > 0) {
          const transformedVehicles: FeaturedVehicle[] = response.items.map((v) => ({
            id: v.id,
            make: v.make,
            model: v.model,
            year: v.year,
            category: v.category,
            dailyRate: Number(v.dailyRate),
            rating: v.averageRating || 4.8,
            reviewCount: v.reviewCount || 0,
            seats: v.seats,
            transmission: v.transmission,
            fuelType: v.fuelType,
            image: v.images?.[0] || '',
          }));
          setVehicles(transformedVehicles);
        }
      } catch (err) {
        console.error('Failed to fetch featured vehicles:', err);
        setVehicles([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchFeaturedVehicles();
  }, []);

  return (
    <section className="py-20 lg:py-28 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12 lg:mb-16"
        >
          <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-semibold mb-4">
            Our Fleet
          </span>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Popular Vehicles
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Explore our most popular vehicles, from economical options to luxury rides.
            All vehicles are well-maintained and ready for your next adventure.
          </p>
        </motion.div>

        {/* Vehicle Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {vehicles.map((vehicle, index) => {
            // Use EagerImage for first 2 vehicles (above the fold on desktop)
            // Use LazyImage for the rest
            const ImageComponent = index < 2 ? EagerImage : LazyImage;

            return (
              <motion.div
                key={vehicle.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link
                  to={`/vehicles/${vehicle.id}`}
                  className="group block bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Image */}
                  <div className="relative aspect-[4/3] bg-gray-50 overflow-hidden">
                    {vehicle.image ? (
                      <ImageComponent
                        src={vehicle.image}
                        alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                        aspectRatio="4/3"
                        className="group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Car className="w-20 h-20 text-gray-300" />
                      </div>
                    )}

                    {/* Category Badge */}
                    <span className={cn(
                      'absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold tracking-wide uppercase z-10',
                      categoryColors[vehicle.category] || 'bg-gray-100 text-gray-800'
                    )}>
                      {vehicle.category}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    {/* Title */}
                    <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-primary transition-colors">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </h3>

                    {/* Rating */}
                    <div className="flex items-center gap-1 mb-4">
                      <Star className="w-4 h-4 text-primary fill-current" />
                      <span className="text-sm font-medium text-gray-900">{vehicle.rating}</span>
                      <span className="text-sm text-gray-500">({vehicle.reviewCount} reviews)</span>
                    </div>

                    {/* Specs */}
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{vehicle.seats}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Settings2 className="w-4 h-4" />
                        <span>{vehicle.transmission === 'AUTOMATIC' ? 'Auto' : 'Manual'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Fuel className="w-4 h-4" />
                        <span>{vehicle.fuelType.charAt(0) + vehicle.fuelType.slice(1).toLowerCase()}</span>
                      </div>
                    </div>

                    {/* Price & CTA */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div>
                        <span className="text-2xl font-bold text-gray-900">{formatCurrency(vehicle.dailyRate)}</span>
                        <span className="text-gray-500">/day</span>
                      </div>
                      <span className="inline-flex items-center text-sm font-bold text-primary group-hover:text-orange-700 uppercase tracking-wide">
                        View Details
                        <ArrowRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* View All Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center mt-12"
        >
          <Link
            to="/vehicles"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-primary rounded-lg hover:bg-orange-600 transition-all shadow-lg hover:shadow-xl group"
          >
            View All Vehicles
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
