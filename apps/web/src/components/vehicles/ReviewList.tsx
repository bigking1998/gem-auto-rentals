import { useState, useEffect, useCallback } from 'react';
import { Star, Loader2, ChevronDown } from 'lucide-react';
import ReviewCard from './ReviewCard';
import ReviewForm from './ReviewForm';
import { api, Review } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

interface ReviewListProps {
  vehicleId: string;
  initialReviewCount: number;
  initialAverageRating: number | null;
}

export default function ReviewList({
  vehicleId,
  initialReviewCount,
  initialAverageRating,
}: ReviewListProps) {
  const { isAuthenticated } = useAuthStore();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(initialReviewCount);
  const [averageRating, setAverageRating] = useState(initialAverageRating);
  const [canReview, setCanReview] = useState(false);
  const [existingReview, setExistingReview] = useState<{
    id: string;
    rating: number;
    comment?: string | null;
  } | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);

  // Fetch reviews
  const fetchReviews = useCallback(
    async (pageNum: number, replace = false) => {
      setIsLoading(true);
      try {
        const response = await api.reviews.list(vehicleId, { page: pageNum, limit: 5 });
        if (replace) {
          setReviews(response.items);
        } else {
          setReviews((prev) => [...prev, ...response.items]);
        }
        setTotal(response.total);
        setAverageRating(response.averageRating);
        setHasMore(pageNum < response.totalPages);
      } catch (err) {
        console.error('Failed to fetch reviews:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [vehicleId]
  );

  // Check if user can review
  const checkCanReview = useCallback(async () => {
    if (!isAuthenticated) {
      setCanReview(false);
      setExistingReview(null);
      return;
    }

    try {
      const response = await api.reviews.canReview(vehicleId);
      setCanReview(response.canReview);
      setExistingReview(response.existingReview);
    } catch (err) {
      console.error('Failed to check review eligibility:', err);
    }
  }, [vehicleId, isAuthenticated]);

  // Initial load
  useEffect(() => {
    if (initialReviewCount > 0) {
      fetchReviews(1, true);
    }
    checkCanReview();
  }, [fetchReviews, checkCanReview, initialReviewCount]);

  // Handle review submitted
  const handleReviewSubmitted = () => {
    // Refresh reviews and review eligibility
    setPage(1);
    fetchReviews(1, true);
    checkCanReview();
    setShowReviewForm(false);
  };

  // Load more reviews
  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchReviews(nextPage);
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Customer Reviews</h2>
          {total > 0 && (
            <div className="mt-1 flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= Math.round(averageRating || 0)
                        ? 'text-primary fill-primary'
                        : 'fill-gray-200 text-gray-200'
                    }`}
                  />
                ))}
              </div>
              <span className="font-bold text-gray-900">
                {averageRating != null ? averageRating.toFixed(1) : 'N/A'}
              </span>
              <span className="text-sm text-gray-500">({total} reviews)</span>
            </div>
          )}
        </div>

        {/* Write Review Button */}
        {canReview && !showReviewForm && (
          <button
            onClick={() => setShowReviewForm(true)}
            className="bg-primary text-primary-foreground hover:bg-primary-dark rounded-lg px-4 py-2 font-semibold transition-colors"
          >
            {existingReview ? 'Edit Your Review' : 'Write a Review'}
          </button>
        )}
      </div>

      {/* Review Form */}
      {showReviewForm && canReview && (
        <div className="mb-6">
          <ReviewForm
            vehicleId={vehicleId}
            existingReview={existingReview}
            onReviewSubmitted={handleReviewSubmitted}
          />
          <button
            onClick={() => setShowReviewForm(false)}
            className="mt-3 text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Reviews List */}
      {total === 0 ? (
        <div className="py-8 text-center">
          <Star className="mx-auto mb-3 h-12 w-12 text-gray-200" />
          <p className="text-gray-500">No reviews yet</p>
          <p className="text-sm text-gray-400">
            {canReview
              ? 'Be the first to review this vehicle!'
              : 'Be the first to review this vehicle after your rental!'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}

          {/* Load More Button */}
          {hasMore && (
            <div className="pt-4 text-center">
              <button
                onClick={handleLoadMore}
                disabled={isLoading}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-6 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Load More Reviews
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Loading state for initial load */}
      {isLoading && reviews.length === 0 && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="text-primary h-6 w-6 animate-spin" />
        </div>
      )}
    </div>
  );
}
