import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageLoaderProps {
  className?: string;
  message?: string;
}

export default function PageLoader({ className, message = 'Loading...' }: PageLoaderProps) {
  return (
    <div className={cn('min-h-screen flex items-center justify-center bg-gray-50', className)}>
      <div className="text-center">
        <Loader2 className="w-10 h-10 animate-spin text-orange-600 mx-auto mb-4" />
        <p className="text-gray-500 text-sm">{message}</p>
      </div>
    </div>
  );
}

export function InlineLoader({ className, message }: PageLoaderProps) {
  return (
    <div className={cn('flex items-center justify-center py-12', className)}>
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600 mx-auto mb-3" />
        {message && <p className="text-gray-500 text-sm">{message}</p>}
      </div>
    </div>
  );
}
