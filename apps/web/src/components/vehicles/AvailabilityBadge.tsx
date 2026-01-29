import { cn } from '@/lib/utils';
import { Check, AlertCircle, XCircle, Loader2 } from 'lucide-react';

interface AvailabilityBadgeProps {
  status: 'available' | 'limited' | 'unavailable' | 'loading' | 'unknown';
  className?: string;
  showLabel?: boolean;
}

const statusConfig = {
  available: {
    label: 'Available',
    icon: Check,
    className: 'bg-green-100 text-green-700 border-green-200',
    dotClassName: 'bg-green-500',
  },
  limited: {
    label: 'Limited',
    icon: AlertCircle,
    className: 'bg-amber-100 text-amber-700 border-amber-200',
    dotClassName: 'bg-amber-500',
  },
  unavailable: {
    label: 'Unavailable',
    icon: XCircle,
    className: 'bg-red-100 text-red-700 border-red-200',
    dotClassName: 'bg-red-500',
  },
  loading: {
    label: 'Checking',
    icon: Loader2,
    className: 'bg-gray-100 text-gray-500 border-gray-200',
    dotClassName: 'bg-gray-400',
  },
  unknown: {
    label: 'Select dates',
    icon: AlertCircle,
    className: 'bg-gray-100 text-gray-500 border-gray-200',
    dotClassName: 'bg-gray-400',
  },
};

export default function AvailabilityBadge({
  status,
  className,
  showLabel = true,
}: AvailabilityBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border',
        config.className,
        className
      )}
      role="status"
      aria-label={!showLabel ? config.label : undefined}
    >
      {status === 'loading' ? (
        <Icon className="w-3 h-3 animate-spin" aria-hidden="true" />
      ) : (
        <span className={cn('w-2 h-2 rounded-full', config.dotClassName)} aria-hidden="true" />
      )}
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}
