import { useState } from 'react';
import { X, Loader2, Check, Zap } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface UpgradePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan?: string;
}

const plans = [
  {
    id: 'basic',
    name: 'Basic',
    price: 99,
    interval: 'month',
    description: 'Perfect for small rental businesses',
    features: [
      'Up to 10 vehicles',
      'Basic analytics',
      'Email support',
      'Standard booking system',
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 299,
    interval: 'month',
    description: 'For growing rental companies',
    features: [
      'Unlimited vehicles',
      'Advanced analytics',
      'Priority support',
      'Custom branding',
      'API access',
      'Multi-location support',
    ],
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 599,
    interval: 'month',
    description: 'For large-scale operations',
    features: [
      'Everything in Professional',
      'Dedicated account manager',
      '24/7 phone support',
      'Custom integrations',
      'White-label solution',
      'SLA guarantee',
    ],
  },
];

export function UpgradePlanModal({ isOpen, onClose, currentPlan = 'professional' }: UpgradePlanModalProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUpgrade = async (planId: string) => {
    if (planId === currentPlan) {
      toast.info('This is your current plan');
      return;
    }

    setIsLoading(planId);
    try {
      const result = await api.billing.upgradePlan(planId);

      if (result.checkoutUrl) {
        // Redirect to Stripe Checkout
        window.location.href = result.checkoutUrl;
      } else {
        toast.success(result.message || 'Plan updated successfully');
        onClose();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to upgrade plan';
      toast.error(message);
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />

        {/* Modal */}
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-4xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Upgrade Your Plan</h2>
              <p className="text-sm text-gray-500 mt-1">Choose the plan that best fits your needs</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            <div className="grid md:grid-cols-3 gap-4">
              {plans.map((plan) => {
                const isCurrent = plan.id === currentPlan;
                const isDowngrade = plans.findIndex(p => p.id === plan.id) < plans.findIndex(p => p.id === currentPlan);

                return (
                  <div
                    key={plan.id}
                    className={cn(
                      'relative rounded-xl border-2 p-5 transition-all',
                      plan.popular
                        ? 'border-orange-500 bg-orange-50/50'
                        : isCurrent
                          ? 'border-green-500 bg-green-50/50'
                          : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    {plan.popular && !isCurrent && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="px-3 py-1 bg-orange-500 text-white text-xs font-medium rounded-full flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          Most Popular
                        </span>
                      </div>
                    )}
                    {isCurrent && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="px-3 py-1 bg-green-500 text-white text-xs font-medium rounded-full">
                          Current Plan
                        </span>
                      </div>
                    )}

                    <div className="text-center mb-4 mt-2">
                      <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                      <div className="mt-2">
                        <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
                        <span className="text-gray-500">/{plan.interval}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">{plan.description}</p>
                    </div>

                    <ul className="space-y-2 mb-5">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => handleUpgrade(plan.id)}
                      disabled={isLoading !== null || isCurrent}
                      className={cn(
                        'w-full py-2.5 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2',
                        isCurrent
                          ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                          : isDowngrade
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : plan.popular
                              ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-200'
                              : 'bg-gray-900 text-white hover:bg-gray-800'
                      )}
                    >
                      {isLoading === plan.id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Processing...
                        </>
                      ) : isCurrent ? (
                        'Current Plan'
                      ) : isDowngrade ? (
                        'Downgrade'
                      ) : (
                        'Upgrade'
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 text-center text-sm text-gray-500">
              <p>All plans include a 14-day free trial. Cancel anytime.</p>
              <p className="mt-1">Need a custom plan? <a href="#" className="text-orange-500 hover:text-orange-600">Contact sales</a></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
