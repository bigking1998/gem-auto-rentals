import { motion } from 'framer-motion';
import { Crown, Star, Award, Gem } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TierProgressProps {
  currentTier: string;
  nextTier: string | null;
  pointsToNextTier: number;
  progressToNextTier: number;
  lifetimePoints: number;
  className?: string;
}

const tierIcons: Record<string, React.ReactNode> = {
  BRONZE: <Award className="w-6 h-6" />,
  SILVER: <Star className="w-6 h-6" />,
  GOLD: <Crown className="w-6 h-6" />,
  PLATINUM: <Gem className="w-6 h-6" />,
};

const tierColors: Record<string, { bg: string; text: string; border: string; progress: string }> = {
  BRONZE: {
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    border: 'border-amber-300',
    progress: 'bg-amber-500',
  },
  SILVER: {
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    border: 'border-gray-300',
    progress: 'bg-gray-400',
  },
  GOLD: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-700',
    border: 'border-yellow-400',
    progress: 'bg-yellow-500',
  },
  PLATINUM: {
    bg: 'bg-purple-100',
    text: 'text-purple-700',
    border: 'border-purple-300',
    progress: 'bg-purple-500',
  },
};

export default function TierProgress({
  currentTier,
  nextTier,
  pointsToNextTier,
  progressToNextTier,
  lifetimePoints,
  className,
}: TierProgressProps) {
  const colors = tierColors[currentTier] || tierColors.BRONZE;

  return (
    <div className={cn('bg-white rounded-xl border border-gray-200 p-6', className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn('p-3 rounded-full', colors.bg, colors.text)}>
            {tierIcons[currentTier] || <Award className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{currentTier} Member</h3>
            <p className="text-sm text-gray-500">
              {lifetimePoints.toLocaleString()} lifetime points
            </p>
          </div>
        </div>
      </div>

      {nextTier && (
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Progress to {nextTier}</span>
            <span className="font-medium text-gray-900">
              {pointsToNextTier.toLocaleString()} points to go
            </span>
          </div>

          <div
            className="h-3 bg-gray-100 rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={Math.round(progressToNextTier)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Progress to ${nextTier}: ${Math.round(progressToNextTier)}%`}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressToNextTier}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={cn('h-full rounded-full', colors.progress)}
            />
          </div>

          <p className="text-xs text-gray-400 mt-2 text-center">
            {Math.round(progressToNextTier)}% of the way there!
          </p>
        </div>
      )}

      {!nextTier && (
        <div className="text-center py-4">
          <p className="text-purple-600 font-medium">
            You've reached the highest tier!
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Enjoy maximum rewards on all your rentals.
          </p>
        </div>
      )}
    </div>
  );
}
