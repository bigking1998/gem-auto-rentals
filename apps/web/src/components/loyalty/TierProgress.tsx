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
  BRONZE: <Award className="h-6 w-6" />,
  SILVER: <Star className="h-6 w-6" />,
  GOLD: <Crown className="h-6 w-6" />,
  PLATINUM: <Gem className="h-6 w-6" />,
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
    <div className={cn('rounded-xl border border-gray-200 bg-white p-6', className)}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn('rounded-full p-3', colors.bg, colors.text)}>
            {tierIcons[currentTier] || <Award className="h-6 w-6" />}
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
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-gray-600">Progress to {nextTier}</span>
            <span className="font-medium text-gray-900">
              {pointsToNextTier.toLocaleString()} points to go
            </span>
          </div>

          <div
            className="h-3 overflow-hidden rounded-full bg-gray-100"
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

          <p className="mt-2 text-center text-xs text-gray-400">
            {Math.round(progressToNextTier)}% of the way there!
          </p>
        </div>
      )}

      {!nextTier && (
        <div className="py-4 text-center">
          <p className="font-medium text-purple-600">You&apos;ve reached the highest tier!</p>
          <p className="mt-1 text-sm text-gray-500">Enjoy maximum rewards on all your rentals.</p>
        </div>
      )}
    </div>
  );
}
