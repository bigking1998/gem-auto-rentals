import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Loader2, Copy, Check, Share2, Users, Gift, Clock,
  Facebook, Twitter, Mail, MessageCircle, ChevronRight
} from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ReferralData {
  code: string;
  expiresAt: string;
  referrerReward: number;
  refereeReward: number;
  shareUrl: string;
  stats: {
    completed: number;
    pending: number;
    signedUp: number;
    totalEarned: number;
  };
}

interface ReferralHistoryItem {
  id: string;
  code: string;
  status: 'PENDING' | 'SIGNED_UP' | 'COMPLETED' | 'EXPIRED';
  refereeFirstName?: string;
  refereeLastName?: string;
  refereeJoinDate?: string;
  reward: number;
  completedAt?: string;
  createdAt: string;
  expiresAt: string;
}

const statusColors: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: 'bg-gray-100', text: 'text-gray-600' },
  SIGNED_UP: { bg: 'bg-blue-100', text: 'text-blue-600' },
  COMPLETED: { bg: 'bg-green-100', text: 'text-green-600' },
  EXPIRED: { bg: 'bg-red-100', text: 'text-red-600' },
};

export default function ReferralPage() {
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [history, setHistory] = useState<ReferralHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [codeData, historyData] = await Promise.all([
          api.referrals.getMyCode(),
          api.referrals.getHistory({ limit: 10 }),
        ]);
        setReferralData(codeData);
        setHistory(historyData.referrals);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load referral data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const copyToClipboard = async () => {
    if (!referralData) return;

    try {
      await navigator.clipboard.writeText(referralData.shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const shareVia = (platform: string) => {
    if (!referralData) return;

    const text = `Join me on Gem Auto Rentals! Use my referral code ${referralData.code} to get ${referralData.refereeReward} bonus points on your first rental.`;
    const url = referralData.shareUrl;

    let shareUrl = '';
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
        break;
      case 'email':
        shareUrl = `mailto:?subject=${encodeURIComponent('Join me on Gem Auto Rentals!')}&body=${encodeURIComponent(text + '\n\n' + url)}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
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

  if (!referralData) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Refer a Friend</h1>
        <p className="text-gray-500">
          Share your code and earn {referralData.referrerReward} points when friends complete their first rental.
        </p>
      </div>

      {/* Referral Code Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-primary to-orange-600 rounded-xl p-6 text-white"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            <span className="font-medium">Your Referral Code</span>
          </div>
          <div className="flex items-center gap-1 bg-white/20 rounded-full px-3 py-1 text-xs font-medium">
            <Gift className="w-3 h-3" />
            <span>{referralData.referrerReward} pts each</span>
          </div>
        </div>

        {/* Code Display */}
        <div className="bg-white/10 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-3xl font-bold tracking-widest">{referralData.code}</span>
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-2 px-4 py-2 bg-white text-primary rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Link
                </>
              )}
            </button>
          </div>
        </div>

        {/* Share Buttons */}
        <div className="flex items-center gap-3">
          <span className="text-sm opacity-75">Share via:</span>
          <div className="flex gap-2">
            <button
              onClick={() => shareVia('facebook')}
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              title="Share on Facebook"
            >
              <Facebook className="w-5 h-5" />
            </button>
            <button
              onClick={() => shareVia('twitter')}
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              title="Share on Twitter"
            >
              <Twitter className="w-5 h-5" />
            </button>
            <button
              onClick={() => shareVia('whatsapp')}
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              title="Share on WhatsApp"
            >
              <MessageCircle className="w-5 h-5" />
            </button>
            <button
              onClick={() => shareVia('email')}
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              title="Share via Email"
            >
              <Mail className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-3xl font-bold text-gray-900">{referralData.stats.completed}</div>
          <div className="text-sm text-gray-500">Completed</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-3xl font-bold text-gray-900">{referralData.stats.signedUp}</div>
          <div className="text-sm text-gray-500">Signed Up</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-3xl font-bold text-gray-900">{referralData.stats.pending}</div>
          <div className="text-sm text-gray-500">Pending</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-3xl font-bold text-primary">{referralData.stats.totalEarned}</div>
          <div className="text-sm text-gray-500">Points Earned</div>
        </div>
      </motion.div>

      {/* How It Works */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl border border-gray-200 p-6"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Share2 className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-medium text-gray-900 mb-1">1. Share Your Code</h3>
            <p className="text-sm text-gray-500">
              Share your unique referral code with friends and family.
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-medium text-gray-900 mb-1">2. They Sign Up</h3>
            <p className="text-sm text-gray-500">
              They create an account using your referral code.
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Gift className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-medium text-gray-900 mb-1">3. You Both Earn</h3>
            <p className="text-sm text-gray-500">
              You get {referralData.referrerReward} pts, they get {referralData.refereeReward} pts after their first rental.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Referral History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl border border-gray-200 overflow-hidden"
      >
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-gray-400" />
            <span className="font-medium text-gray-900">Referral History</span>
          </div>
          <ChevronRight
            className={cn(
              'w-5 h-5 text-gray-400 transition-transform',
              showHistory && 'rotate-90'
            )}
          />
        </button>

        {showHistory && (
          <div className="border-t border-gray-200">
            {history.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No referrals yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Start sharing your code to see your referral history here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {history.map((item) => {
                  const statusStyle = statusColors[item.status] || statusColors.PENDING;
                  return (
                    <div key={item.id} className="flex items-center justify-between p-4">
                      <div>
                        {item.refereeFirstName ? (
                          <p className="font-medium text-gray-900">
                            {item.refereeFirstName} {item.refereeLastName?.charAt(0)}.
                          </p>
                        ) : (
                          <p className="font-medium text-gray-500">Pending signup</p>
                        )}
                        <p className="text-sm text-gray-500">
                          Code: {item.code} • {formatDate(item.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={cn(
                            'inline-block px-2 py-1 rounded-full text-xs font-medium',
                            statusStyle.bg,
                            statusStyle.text
                          )}
                        >
                          {item.status.replace('_', ' ')}
                        </span>
                        {item.status === 'COMPLETED' && (
                          <p className="text-sm text-green-600 mt-1">
                            +{item.reward} pts
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
