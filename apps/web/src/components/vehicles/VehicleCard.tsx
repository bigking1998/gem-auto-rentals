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
  variant?: 'grid' | 'list';
}

const categoryColors: Record<string, string> = {
  ECONOMY: 'bg-primary text-white shadow-md',
  STANDARD: 'bg-primary text-white shadow-md',
  PREMIUM: 'bg-primary text-white shadow-md',
  LUXURY: 'bg-primary text-white shadow-md',
  SUV: 'bg-primary text-white shadow-md',
  VAN: 'bg-primary text-white shadow-md',
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
  variant = 'grid',
}: VehicleCardProps) {
  const imageUrl = images[0] || 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800';
  const isList = variant === 'list';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className={cn(
        'group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300',
        isList ? 'flex flex-col md:flex-row' : 'flex flex-col',
        className
      )}
    >
      {/* Image */}
      <Link
        to={`/vehicles/${id}`}
        className={cn(
          "block relative overflow-hidden",
          isList ? 'w-full md:w-1/2 h-64 md:h-auto min-h-[220px]' : 'aspect-[4/3] w-full'
        )}
      >
        <LazyImage
          src={imageUrl}
          alt={`${year} ${make} ${model}`}
          aspectRatio={isList ? "16/9" : "4/3"}
          className="group-hover:scale-110 transition-transform duration-700 object-cover w-full h-full"
        />
        <div className="absolute top-3 left-3 z-10">
          <span
            className={cn(
              'px-2.5 py-1 text-xs font-semibold rounded-full backdrop-blur-md',
              categoryColors[category] || 'bg-primary/10 text-primary'
            )}
          >
            {category}
          </span>
        </div>
      </Link>

      {/* Content */}
      <div className={cn("p-5 flex flex-col justify-center", isList ? "w-full md:w-1/2" : "w-full")}>
        {/* Title */}
        <Link to={`/vehicles/${id}`} className="block mb-2 group-hover:text-primary transition-colors">
          <h3 className="font-bold text-lg text-gray-900 truncate">
            {year} {make} {model}
          </h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-1 text-sm mb-4">
          <Star className="w-4 h-4 text-primary fill-primary" />
          <span className="font-bold text-gray-900">{averageRating ? averageRating.toFixed(1) : 'New'}</span>
          {reviewCount > 0 && <span className="text-gray-400">({reviewCount} reviews)</span>}
        </div>

        {/* Specs */}
        <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-gray-400" />
            <span>{seats} seats</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Gauge className="w-4 h-4 text-gray-400" />
            <span>{transmission === 'AUTOMATIC' ? 'Auto' : 'Manual'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Fuel className="w-4 h-4 text-gray-400" />
            <span className="capitalize">{fuelType.toLowerCase()}</span>
          </div>
        </div>

        {/* Price & CTA */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
          <div>
            <span className="text-2xl font-bold text-gray-900">${dailyRate}</span>
            <span className="text-gray-500 text-sm">/day</span>
          </div>
          <Link
            to={`/vehicles/${id}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-orange-200 hover:bg-orange-600 hover:shadow-orange-300 transition-all group/btn"
          >
            View Details
            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
