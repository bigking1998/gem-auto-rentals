import { useState } from 'react';
import { Heart, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFavoritesStore, useIsFavorited } from '@/stores/favoritesStore';
import { useAuthStore } from '@/stores/authStore';
import { useNavigate } from 'react-router-dom';

interface FavoriteButtonProps {
  vehicleId: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export default function FavoriteButton({
  vehicleId,
  className,
  size = 'md',
  showLabel = false,
}: FavoriteButtonProps) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const isFavorited = useIsFavorited(vehicleId);
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite);
  const [isLoading, setIsLoading] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      // Redirect to login with return URL
      const currentPath = window.location.pathname + window.location.search;
      navigate(`/login?returnUrl=${encodeURIComponent(currentPath)}`);
      return;
    }

    setIsLoading(true);
    try {
      await toggleFavorite(vehicleId);
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={cn(
        'flex items-center justify-center rounded-full transition-all',
        'hover:scale-110 active:scale-95',
        'focus:outline-none focus:ring-2 focus:ring-primary/50',
        isFavorited
          ? 'bg-red-50 text-red-500 hover:bg-red-100'
          : 'bg-white/90 text-gray-400 hover:text-red-500 hover:bg-white shadow-sm',
        showLabel ? 'gap-2 px-4' : sizeClasses[size],
        className
      )}
      aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      {isLoading ? (
        <Loader2 className={cn('animate-spin', iconSizes[size])} />
      ) : (
        <Heart
          className={cn(
            iconSizes[size],
            'transition-all',
            isFavorited && 'fill-current'
          )}
        />
      )}
      {showLabel && (
        <span className="font-medium text-sm">
          {isFavorited ? 'Saved' : 'Save'}
        </span>
      )}
    </button>
  );
}
