import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageLoaderProps {
  className?: string;
  message?: string;
}

export default function PageLoader({ className, message = 'Loading...' }: PageLoaderProps) {
  return (
    <div className={cn('flex min-h-screen items-center justify-center bg-gray-50', className)}>
      <div className="text-center">
        <Loader2 className="text-primary-ink mx-auto mb-4 h-10 w-10 animate-spin" />
        <p className="text-sm text-gray-500">{message}</p>
      </div>
    </div>
  );
}

export function InlineLoader({ className, message }: PageLoaderProps) {
  return (
    <div className={cn('flex items-center justify-center py-12', className)}>
      <div className="text-center">
        <Loader2 className="text-primary-ink mx-auto mb-3 h-8 w-8 animate-spin" />
        {message && <p className="text-sm text-gray-500">{message}</p>}
      </div>
    </div>
  );
}
