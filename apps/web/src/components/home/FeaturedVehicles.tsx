import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Users, Fuel, Settings2, ArrowRight } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';

// Mock data - in production, fetch from API
const vehicles = [
  {
    id: '1',
    make: 'Toyota',
    model: 'Camry',
    year: 2024,
    category: 'STANDARD',
    dailyRate: 65,
    rating: 4.8,
    reviewCount: 124,
    seats: 5,
    transmission: 'AUTOMATIC',
    fuelType: 'GASOLINE',
    image: null,
  },
  {
    id: '2',
    make: 'BMW',
    model: '5 Series',
    year: 2024,
    category: 'LUXURY',
    dailyRate: 150,
    rating: 4.9,
    reviewCount: 89,
    seats: 5,
    transmission: 'AUTOMATIC',
    fuelType: 'GASOLINE',
    image: null,
  },
  {
    id: '3',
    make: 'Tesla',
    model: 'Model 3',
    year: 2024,
    category: 'PREMIUM',
    dailyRate: 120,
    rating: 4.9,
    reviewCount: 156,
    seats: 5,
    transmission: 'AUTOMATIC',
    fuelType: 'ELECTRIC',
    image: null,
  },
  {
    id: '4',
    make: 'Ford',
    model: 'Explorer',
    year: 2024,
    category: 'SUV',
    dailyRate: 95,
    rating: 4.7,
    reviewCount: 78,
    seats: 7,
    transmission: 'AUTOMATIC',
    fuelType: 'GASOLINE',
    image: null,
  },
];

const categoryColors: Record<string, string> = {
  ECONOMY: 'bg-green-100 text-green-800',
  STANDARD: 'bg-blue-100 text-blue-800',
  PREMIUM: 'bg-purple-100 text-purple-800',
  LUXURY: 'bg-amber-100 text-amber-800',
  SUV: 'bg-orange-100 text-orange-800',
  VAN: 'bg-teal-100 text-teal-800',
};

export default function FeaturedVehicles() {
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
          <span className="inline-block px-4 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium mb-4">
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
          {vehicles.map((vehicle, index) => (
            <motion.div
              key={vehicle.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link
                to={`/vehicles/${vehicle.id}`}
                className="group block bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                {/* Image */}
                <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-50 overflow-hidden">
                  {vehicle.image ? (
                    <img
                      src={vehicle.image}
                      alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-20 h-20 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
                      </svg>
                    </div>
                  )}

                  {/* Category Badge */}
                  <span className={cn(
                    'absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-medium',
                    categoryColors[vehicle.category] || 'bg-gray-100 text-gray-800'
                  )}>
                    {vehicle.category}
                  </span>
                </div>

                {/* Content */}
                <div className="p-5">
                  {/* Title */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </h3>

                  {/* Rating */}
                  <div className="flex items-center gap-1 mb-4">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
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
                    <span className="inline-flex items-center text-sm font-medium text-indigo-600 group-hover:text-indigo-700">
                      View Details
                      <ArrowRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
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
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl group"
          >
            View All Vehicles
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
