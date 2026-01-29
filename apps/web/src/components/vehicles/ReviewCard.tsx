import { useState } from 'react';
import { Star, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReviewCardProps {
  review: {
    id: string;
    rating: number;
    comment?: string | null;
    images?: string[];
    createdAt: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      avatarUrl?: string | null;
    };
  };
}

export default function ReviewCard({ review }: ReviewCardProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const initials = `${review.user.firstName?.[0] || ''}${review.user.lastName?.[0] || ''}`.toUpperCase() || '?';

  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const goToPrevious = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? (review.images?.length || 1) - 1 : prev - 1
    );
  };

  const goToNext = () => {
    setCurrentImageIndex((prev) =>
      prev === (review.images?.length || 1) - 1 ? 0 : prev + 1
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    const weeks = Math.floor(diffDays / 7);
    if (diffDays < 30) return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
    const months = Math.floor(diffDays / 30);
    if (diffDays < 365) return `${months} month${months === 1 ? '' : 's'} ago`;
    const years = Math.floor(diffDays / 365);
    return `${years} year${years === 1 ? '' : 's'} ago`;
  };

  return (
    <div className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {review.user.avatarUrl ? (
            <img
              src={review.user.avatarUrl}
              alt={`${review.user.firstName} ${review.user.lastName}`}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
              {initials}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="font-semibold text-gray-900">
              {review.user.firstName} {review.user.lastName[0]}.
            </span>
            <span className="text-gray-400 text-sm">&bull;</span>
            <span className="text-gray-500 text-sm">{formatDate(review.createdAt)}</span>
          </div>

          {/* Star Rating */}
          <div className="flex items-center gap-0.5 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn(
                  'w-4 h-4',
                  star <= review.rating
                    ? 'text-primary fill-primary'
                    : 'text-gray-200 fill-gray-200'
                )}
              />
            ))}
          </div>

          {/* Comment */}
          {review.comment && (
            <p className="text-gray-600 leading-relaxed">{review.comment}</p>
          )}

          {/* Images */}
          {review.images && review.images.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {review.images.map((url, index) => (
                <button
                  key={index}
                  onClick={() => openLightbox(index)}
                  className="relative group overflow-hidden rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <img
                    src={url}
                    alt={`Review photo ${index + 1}`}
                    className="w-20 h-20 object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && review.images && review.images.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
          aria-label="Image lightbox"
        >
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
            aria-label="Close lightbox"
          >
            <X className="w-8 h-8" aria-hidden="true" />
          </button>

          {/* Navigation - Previous */}
          {review.images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
              className="absolute left-4 text-white hover:text-gray-300 transition-colors p-2"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-8 h-8" aria-hidden="true" />
            </button>
          )}

          {/* Current Image */}
          <img
            src={review.images[currentImageIndex]}
            alt={`Review photo ${currentImageIndex + 1}`}
            className="max-w-[90vw] max-h-[85vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Navigation - Next */}
          {review.images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              className="absolute right-4 text-white hover:text-gray-300 transition-colors p-2"
              aria-label="Next image"
            >
              <ChevronRight className="w-8 h-8" aria-hidden="true" />
            </button>
          )}

          {/* Image counter */}
          {review.images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
              {currentImageIndex + 1} / {review.images.length}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
