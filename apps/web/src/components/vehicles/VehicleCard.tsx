import { memo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Fuel, Gauge, Star, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import LazyImage from '@/components/ui/LazyImage';
import FavoriteButton from './FavoriteButton';

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
  ECONOMY: 'bg-primary text-primary-foreground shadow-md',
  STANDARD: 'bg-primary text-primary-foreground shadow-md',
  PREMIUM: 'bg-primary text-primary-foreground shadow-md',
  LUXURY: 'bg-primary text-primary-foreground shadow-md',
  SUV: 'bg-primary text-primary-foreground shadow-md',
  VAN: 'bg-primary text-primary-foreground shadow-md',
};

const VehicleCard = memo(function VehicleCard({
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
  const imageUrl =
    images[0] || 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800';
  const isList = variant === 'list';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className={cn(
        'group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:shadow-xl',
        isList ? 'flex flex-col md:flex-row' : 'flex flex-col',
        className
      )}
    >
      {/* Image */}
      <Link
        to={`/vehicles/${id}`}
        className={cn(
          'relative block overflow-hidden',
          isList ? 'h-64 min-h-[220px] w-full md:h-auto md:w-1/2' : 'aspect-[4/3] w-full'
        )}
      >
        <LazyImage
          src={imageUrl}
          alt={`${year} ${make} ${model}`}
          aspectRatio={isList ? '16/9' : '4/3'}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute left-3 top-3 z-10">
          <span
            className={cn(
              'rounded-full px-2.5 py-1 text-xs font-semibold backdrop-blur-md',
              categoryColors[category] || 'bg-primary/10 text-primary'
            )}
          >
            {category}
          </span>
        </div>
        <div className="absolute right-3 top-3 z-10" onClick={(e) => e.stopPropagation()}>
          <FavoriteButton vehicleId={id} />
        </div>
      </Link>

      {/* Content */}
      <div
        className={cn('flex flex-col justify-center p-5', isList ? 'w-full md:w-1/2' : 'w-full')}
      >
        {/* Title */}
        <Link
          to={`/vehicles/${id}`}
          className="group-hover:text-primary mb-2 block transition-colors"
        >
          <h3 className="truncate text-lg font-bold text-gray-900">
            {year} {make} {model}
          </h3>
        </Link>

        {/* Rating */}
        <div className="mb-4 flex items-center gap-1 text-sm">
          <Star className="text-primary fill-primary h-4 w-4" />
          <span className="font-bold text-gray-900">
            {averageRating ? averageRating.toFixed(1) : 'New'}
          </span>
          {reviewCount > 0 && <span className="text-gray-400">({reviewCount} reviews)</span>}
        </div>

        {/* Specs */}
        <div className="mb-4 flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-gray-400" />
            <span>{seats} seats</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Gauge className="h-4 w-4 text-gray-400" />
            <span>{transmission === 'AUTOMATIC' ? 'Auto' : 'Manual'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Fuel className="h-4 w-4 text-gray-400" />
            <span className="capitalize">{fuelType.toLowerCase()}</span>
          </div>
        </div>

        {/* Price & CTA */}
        <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-4">
          <div>
            <span className="text-2xl font-bold text-gray-900">${dailyRate}</span>
            <span className="text-sm text-gray-500">/day</span>
          </div>
          <Link
            to={`/vehicles/${id}`}
            className="bg-primary text-primary-foreground hover:bg-primary-dark group/btn inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold shadow-lg transition-all"
          >
            View Details
            <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
});

export default VehicleCard;
