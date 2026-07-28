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
        'from-primary to-primary-dark text-primary-foreground relative overflow-hidden rounded-xl bg-gradient-to-br p-6',
        className
      )}
    >
      {/* Background decoration */}
      <div className="absolute right-0 top-0 h-32 w-32 -translate-y-1/2 translate-x-1/2 rounded-full bg-white/10" />
      <div className="absolute bottom-0 left-0 h-24 w-24 -translate-x-1/2 translate-y-1/2 rounded-full bg-white/10" />

      <div className="relative z-10">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            <span className="text-sm font-medium opacity-90">Available Points</span>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-medium">
            <TrendingUp className="h-3 w-3" />
            <span>{multiplier}x</span>
          </div>
        </div>

        <div className="mb-4">
          <div className="text-4xl font-bold tracking-tight">{points.toLocaleString()}</div>
          <div className="mt-1 text-sm opacity-75">Worth ${pointsValue.toFixed(2)} in rentals</div>
        </div>

        <div className="flex items-center justify-between border-t border-white/20 pt-4">
          <span className="text-sm opacity-75">{tier} Member</span>
          <span className="text-sm font-medium">100 pts = $1</span>
        </div>
      </div>
    </motion.div>
  );
}
