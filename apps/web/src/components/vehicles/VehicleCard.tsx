import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Fuel, Gauge, Star, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import LazyImage from '@/components/ui/LazyImage';

interface VehicleCardProps {
  id: string;
  make: string;
  model: string;
  year: number;
  category: string;
  dailyRate: number;
  images: string[];
  seats: number;
  transmission: string;
  fuelType: string;
  averageRating?: number | null;
  reviewCount?: number;
  className?: string;
}

const categoryColors: Record<string, string> = {
  ECONOMY: 'bg-green-100 text-green-800',
  STANDARD: 'bg-blue-100 text-blue-800',
  PREMIUM: 'bg-purple-100 text-purple-800',
  LUXURY: 'bg-yellow-100 text-yellow-800',
  SUV: 'bg-orange-100 text-orange-800',
  VAN: 'bg-gray-100 text-gray-800',
};

export default function VehicleCard({
  id,
  make,
  model,
  year,
  category,
  dailyRate,
  images,
  seats,
  transmission,
  fuelType,
  averageRating,
  reviewCount = 0,
  className,
}: VehicleCardProps) {
  const imageUrl = images[0] || 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className={cn(
        'group bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300',
        className
      )}
    >
      {/* Image */}
      <Link to={`/vehicles/${id}`} className="block relative overflow-hidden">
        <LazyImage
          src={imageUrl}
          alt={`${year} ${make} ${model}`}
          aspectRatio="4/3"
          className="group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3 z-10">
          <span
            className={cn(
              'px-2.5 py-1 text-xs font-semibold rounded-full',
              categoryColors[category] || 'bg-gray-100 text-gray-800'
            )}
          >
            {category}
          </span>
        </div>
      </Link>

      {/* Content */}
      <div className="p-5">
        {/* Title & Rating */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <Link to={`/vehicles/${id}`} className="group-hover:text-indigo-600 transition-colors">
            <h3 className="font-semibold text-lg text-gray-900">
              {year} {make} {model}
            </h3>
          </Link>
          {averageRating && (
            <div className="flex items-center gap-1 text-sm">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="font-medium text-gray-900">{averageRating.toFixed(1)}</span>
              <span className="text-gray-400">({reviewCount})</span>
            </div>
          )}
        </div>

        {/* Specs */}
        <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            <span>{seats} seats</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Gauge className="w-4 h-4" />
            <span>{transmission === 'AUTOMATIC' ? 'Auto' : 'Manual'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Fuel className="w-4 h-4" />
            <span className="capitalize">{fuelType.toLowerCase()}</span>
          </div>
        </div>

        {/* Price & CTA */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div>
            <span className="text-2xl font-bold text-gray-900">${dailyRate}</span>
            <span className="text-gray-500 text-sm">/day</span>
          </div>
          <Link
            to={`/vehicles/${id}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors group/btn"
          >
            View Details
            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
