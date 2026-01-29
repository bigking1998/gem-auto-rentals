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
  const fetchReviews = useCallback(async (pageNum: number, replace = false) => {
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
  }, [vehicleId]);

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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Customer Reviews</h2>
          {total > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= Math.round(averageRating || 0)
                        ? 'text-primary fill-primary'
                        : 'text-gray-200 fill-gray-200'
                    }`}
                  />
                ))}
              </div>
              <span className="font-bold text-gray-900">{averageRating != null ? averageRating.toFixed(1) : 'N/A'}</span>
              <span className="text-gray-500 text-sm">({total} reviews)</span>
            </div>
          )}
        </div>

        {/* Write Review Button */}
        {canReview && !showReviewForm && (
          <button
            onClick={() => setShowReviewForm(true)}
            className="px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors"
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
        <div className="text-center py-8">
          <Star className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500">No reviews yet</p>
          <p className="text-sm text-gray-400">
            {canReview ? 'Be the first to review this vehicle!' : 'Be the first to review this vehicle after your rental!'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center pt-4">
              <button
                onClick={handleLoadMore}
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-6 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
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
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}
    </div>
  );
}
