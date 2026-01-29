import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Loader2, Gift, TrendingUp, ArrowUp, ArrowDown,
  Star, Crown, Award, Gem, Info, ChevronRight
} from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import PointsCard from '@/components/loyalty/PointsCard';
import TierProgress from '@/components/loyalty/TierProgress';

interface LoyaltyAccount {
  id: string;
  userId: string;
  points: number;
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  lifetimePoints: number;
  transactions: Array<{
    id: string;
    type: 'EARNED' | 'REDEEMED' | 'BONUS' | 'EXPIRED' | 'ADJUSTMENT';
    points: number;
    description: string;
    bookingId?: string;
    createdAt: string;
  }>;
  tierProgress: {
    currentTier: string;
    nextTier: string | null;
    pointsToNextTier: number;
    progressToNextTier: number;
    multiplier: number;
  };
  pointsValue: number;
}

interface TierInfo {
  tiers: Array<{
    name: string;
    threshold: number;
    multiplier: number;
    benefits: string[];
  }>;
  redemption: {
    pointsPerDollar: number;
    description: string;
  };
}

const tierIcons: Record<string, React.ReactNode> = {
  BRONZE: <Award className="w-5 h-5" />,
  SILVER: <Star className="w-5 h-5" />,
  GOLD: <Crown className="w-5 h-5" />,
  PLATINUM: <Gem className="w-5 h-5" />,
};

const tierColors: Record<string, string> = {
  BRONZE: 'text-amber-600 bg-amber-100',
  SILVER: 'text-gray-600 bg-gray-100',
  GOLD: 'text-yellow-600 bg-yellow-100',
  PLATINUM: 'text-purple-600 bg-purple-100',
};

const transactionTypeColors: Record<string, { icon: React.ReactNode; color: string }> = {
  EARNED: { icon: <ArrowUp className="w-4 h-4" />, color: 'text-green-600 bg-green-100' },
  REDEEMED: { icon: <ArrowDown className="w-4 h-4" />, color: 'text-orange-600 bg-orange-100' },
  BONUS: { icon: <Gift className="w-4 h-4" />, color: 'text-purple-600 bg-purple-100' },
  EXPIRED: { icon: <ArrowDown className="w-4 h-4" />, color: 'text-gray-600 bg-gray-100' },
  ADJUSTMENT: { icon: <TrendingUp className="w-4 h-4" />, color: 'text-blue-600 bg-blue-100' },
};

export default function LoyaltyPage() {
  const [account, setAccount] = useState<LoyaltyAccount | null>(null);
  const [tierInfo, setTierInfo] = useState<TierInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTierInfo, setShowTierInfo] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [accountData, tierData] = await Promise.all([
          api.loyalty.getAccount(),
          api.loyalty.getTierInfo(),
        ]);
        setAccount(accountData);
        setTierInfo(tierData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load loyalty data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!account) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Loyalty Rewards</h1>
        <p className="text-gray-500">
          Earn points on every rental and redeem them for discounts.
        </p>
      </div>

      {/* Points Card & Tier Progress */}
      <div className="grid md:grid-cols-2 gap-6">
        <PointsCard
          points={account.points}
          pointsValue={account.pointsValue}
          multiplier={account.tierProgress.multiplier}
          tier={account.tier}
        />
        <TierProgress
          currentTier={account.tierProgress.currentTier}
          nextTier={account.tierProgress.nextTier}
          pointsToNextTier={account.tierProgress.pointsToNextTier}
          progressToNextTier={account.tierProgress.progressToNextTier}
          lifetimePoints={account.lifetimePoints}
        />
      </div>

      {/* Tier Benefits */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl border border-gray-200 overflow-hidden"
      >
        <button
          onClick={() => setShowTierInfo(!showTierInfo)}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5 text-primary" />
            <span className="font-medium text-gray-900">How the Loyalty Program Works</span>
          </div>
          <ChevronRight
            className={cn(
              'w-5 h-5 text-gray-400 transition-transform',
              showTierInfo && 'rotate-90'
            )}
          />
        </button>

        {showTierInfo && tierInfo && (
          <div className="border-t border-gray-200 p-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {tierInfo.tiers.map((tier) => (
                <div
                  key={tier.name}
                  className={cn(
                    'p-4 rounded-lg border',
                    account.tier === tier.name
                      ? 'border-primary bg-orange-50'
                      : 'border-gray-200'
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn('p-2 rounded-full', tierColors[tier.name])}>
                      {tierIcons[tier.name]}
                    </span>
                    <span className="font-semibold text-gray-900">{tier.name}</span>
                  </div>
                  <p className="text-sm text-gray-500 mb-2">
                    {tier.threshold === 0
                      ? 'Starting tier'
                      : `${tier.threshold.toLocaleString()}+ points`}
                  </p>
                  <p className="text-sm font-medium text-primary mb-2">
                    {tier.multiplier}x points earning
                  </p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {tier.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="text-green-500 mt-0.5">•</span>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-1">Redeeming Points</h4>
              <p className="text-sm text-gray-600">{tierInfo.redemption.description}</p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Transaction History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl border border-gray-200 p-6"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>

        {account.transactions.length === 0 ? (
          <div className="text-center py-8">
            <Gift className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No activity yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Start earning points by completing a rental!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {account.transactions.map((transaction) => {
              const typeStyle = transactionTypeColors[transaction.type] || transactionTypeColors.EARNED;
              return (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className={cn('p-2 rounded-full', typeStyle.color)}>
                      {typeStyle.icon}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">{transaction.description}</p>
                      <p className="text-sm text-gray-500">{formatDate(transaction.createdAt)}</p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      'font-semibold',
                      transaction.points > 0 ? 'text-green-600' : 'text-orange-600'
                    )}
                  >
                    {transaction.points > 0 ? '+' : ''}
                    {transaction.points.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
