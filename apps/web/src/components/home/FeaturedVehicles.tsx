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
  ECONOMY: 'bg-primary text-primary-foreground shadow-md',
  STANDARD: 'bg-primary text-primary-foreground shadow-md',
  PREMIUM: 'bg-primary text-primary-foreground shadow-md',
  LUXURY: 'bg-primary text-primary-foreground shadow-md',
  SUV: 'bg-primary text-primary-foreground shadow-md',
  VAN: 'bg-primary text-primary-foreground shadow-md',
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
    <section className="bg-white py-20 lg:py-28">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center lg:mb-16"
        >
          <span className="bg-primary/10 text-primary mb-4 inline-block rounded-full px-4 py-1.5 text-sm font-semibold">
            Our Fleet
          </span>
          <h2 className="mb-4 text-3xl font-bold text-gray-900 lg:text-4xl">Popular Vehicles</h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            Explore our most popular vehicles, from economical options to luxury rides. All vehicles
            are well-maintained and ready for your next adventure.
          </p>
        </motion.div>

        {/* Vehicle Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
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
                  className="group block overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  {/* Image */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-gray-50">
                    {vehicle.image ? (
                      <ImageComponent
                        src={vehicle.image}
                        alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                        aspectRatio="4/3"
                        className="transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Car className="h-20 w-20 text-gray-300" />
                      </div>
                    )}

                    {/* Category Badge */}
                    <span
                      className={cn(
                        'absolute left-3 top-3 z-10 rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide',
                        categoryColors[vehicle.category] || 'bg-gray-100 text-gray-800'
                      )}
                    >
                      {vehicle.category}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    {/* Title */}
                    <h3 className="group-hover:text-primary mb-1 text-lg font-bold text-gray-900 transition-colors">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </h3>

                    {/* Rating */}
                    <div className="mb-4 flex items-center gap-1">
                      <Star className="text-primary h-4 w-4 fill-current" />
                      <span className="text-sm font-medium text-gray-900">{vehicle.rating}</span>
                      <span className="text-sm text-gray-500">({vehicle.reviewCount} reviews)</span>
                    </div>

                    {/* Specs */}
                    <div className="mb-4 flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{vehicle.seats}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Settings2 className="h-4 w-4" />
                        <span>{vehicle.transmission === 'AUTOMATIC' ? 'Auto' : 'Manual'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Fuel className="h-4 w-4" />
                        <span>
                          {vehicle.fuelType.charAt(0) + vehicle.fuelType.slice(1).toLowerCase()}
                        </span>
                      </div>
                    </div>

                    {/* Price & CTA */}
                    <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                      <div>
                        <span className="text-2xl font-bold text-gray-900">
                          {formatCurrency(vehicle.dailyRate)}
                        </span>
                        <span className="text-gray-500">/day</span>
                      </div>
                      <span className="text-primary-ink group-hover:text-primary-dark inline-flex items-center text-sm font-bold uppercase tracking-wide">
                        View Details
                        <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
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
          className="mt-12 text-center"
        >
          <Link
            to="/vehicles"
            className="text-primary-foreground bg-primary hover:bg-primary-dark group inline-flex items-center justify-center rounded-lg px-8 py-4 text-lg font-semibold shadow-lg transition-all hover:shadow-xl"
          >
            View All Vehicles
            <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
