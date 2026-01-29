import { motion } from 'framer-motion';
import { Coins, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PointsCardProps {
  points: number;
  pointsValue: number;
  multiplier: number;
  tier: string;
  className?: string;
}

export default function PointsCard({
  points,
  pointsValue,
  multiplier,
  tier,
  className,
}: PointsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative overflow-hidden rounded-xl bg-gradient-to-br from-primary to-orange-600 p-6 text-white',
        className
      )}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5" />
            <span className="text-sm font-medium opacity-90">Available Points</span>
          </div>
          <div className="flex items-center gap-1 bg-white/20 rounded-full px-3 py-1 text-xs font-medium">
            <TrendingUp className="w-3 h-3" />
            <span>{multiplier}x</span>
          </div>
        </div>

        <div className="mb-4">
          <div className="text-4xl font-bold tracking-tight">
            {points.toLocaleString()}
          </div>
          <div className="text-sm opacity-75 mt-1">
            Worth ${pointsValue.toFixed(2)} in rentals
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/20">
          <span className="text-sm opacity-75">{tier} Member</span>
          <span className="text-sm font-medium">100 pts = $1</span>
        </div>
      </div>
    </motion.div>
  );
}
