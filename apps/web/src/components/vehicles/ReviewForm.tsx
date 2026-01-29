import { useState, useRef } from 'react';
import { Star, Loader2, Check, AlertCircle, Camera, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

interface ReviewFormProps {
  vehicleId: string;
  existingReview?: {
    id: string;
    rating: number;
    comment?: string | null;
    images?: string[];
  } | null;
  onReviewSubmitted: () => void;
}

export default function ReviewForm({ vehicleId, existingReview, onReviewSubmitted }: ReviewFormProps) {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Image upload state
  const [images, setImages] = useState<string[]>(existingReview?.images || []);
  const [pendingImages, setPendingImages] = useState<File[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalImages = images.length + pendingImages.length + files.length;

    if (totalImages > 5) {
      setError('Maximum 5 images allowed');
      return;
    }

    // Validate file types and sizes
    const validFiles = files.filter((file) => {
      if (!file.type.startsWith('image/')) {
        setError('Only image files are allowed');
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Each image must be less than 5MB');
        return false;
      }
      return true;
    });

    setPendingImages((prev) => [...prev, ...validFiles]);
    setError(null);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removePendingImage = (index: number) => {
    setPendingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeUploadedImage = async (imageUrl: string) => {
    if (!existingReview?.id) return;

    try {
      await api.reviews.removeImage(vehicleId, existingReview.id, imageUrl);
      setImages((prev) => prev.filter((img) => img !== imageUrl));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove image');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Submit the review first
      const response = await api.reviews.submit(vehicleId, { rating, comment: comment.trim() || undefined });
      const reviewId = response.id || existingReview?.id;

      // Upload any pending images
      if (pendingImages.length > 0 && reviewId) {
        setIsUploadingImages(true);
        try {
          const uploadedUrls = await api.reviews.uploadImages(vehicleId, reviewId, pendingImages);
          setImages((prev) => [...prev, ...uploadedUrls]);
          setPendingImages([]);
        } catch (uploadErr) {
          console.error('Failed to upload images:', uploadErr);
          // Don't fail the whole submission, just log the error
        }
        setIsUploadingImages(false);
      }

      setSuccess(true);
      onReviewSubmitted();

      // Reset success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
      setIsUploadingImages(false);
    }
  };

  const displayRating = hoverRating || rating;

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 rounded-xl p-6">
      <h3 className="font-bold text-gray-900 mb-4">
        {existingReview ? 'Update Your Review' : 'Write a Review'}
      </h3>

      {/* Star Rating */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Your Rating</label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-1 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary/20 rounded"
            >
              <Star
                className={cn(
                  'w-8 h-8 transition-colors',
                  star <= displayRating
                    ? 'text-primary fill-primary'
                    : 'text-gray-300 hover:text-primary/50'
                )}
              />
            </button>
          ))}
          <span className="ml-2 text-sm text-gray-500">
            {displayRating > 0 ? `${displayRating} star${displayRating !== 1 ? 's' : ''}` : 'Select rating'}
          </span>
        </div>
      </div>

      {/* Comment */}
      <div className="mb-4">
        <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
          Your Review (optional)
        </label>
        <textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience with this vehicle..."
          rows={4}
          maxLength={1000}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"
        />
        <div className="text-right text-xs text-gray-400 mt-1">
          {comment.length}/1000 characters
        </div>
      </div>

      {/* Image Upload */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Add Photos (optional)
        </label>

        {/* Uploaded Images Preview */}
        {(images.length > 0 || pendingImages.length > 0) && (
          <div className="flex flex-wrap gap-2 mb-3">
            {/* Already uploaded images */}
            {images.map((url, index) => (
              <div key={`uploaded-${index}`} className="relative group">
                <img
                  src={url}
                  alt={`Review ${index + 1}`}
                  className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => removeUploadedImage(url)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}

            {/* Pending images (not yet uploaded) */}
            {pendingImages.map((file, index) => (
              <div key={`pending-${index}`} className="relative group">
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Pending ${index + 1}`}
                  className="w-20 h-20 object-cover rounded-lg border border-dashed border-primary"
                />
                <button
                  type="button"
                  onClick={() => removePendingImage(index)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center">
                  <ImageIcon className="w-4 h-4 text-white" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload Button */}
        {images.length + pendingImages.length < 5 && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingImages}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
            >
              {isUploadingImages ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
              <span>Add Photos</span>
            </button>
            <p className="text-xs text-gray-400 mt-1">
              Up to 5 photos, max 5MB each
            </p>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm mb-4">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="flex items-center gap-2 text-green-600 text-sm mb-4">
          <Check className="w-4 h-4 flex-shrink-0" />
          <span>Review {existingReview ? 'updated' : 'submitted'} successfully!</span>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting || rating === 0}
        className={cn(
          'w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2',
          rating === 0
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-primary text-white hover:bg-orange-600 shadow-lg shadow-orange-200'
        )}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            {existingReview ? 'Update Review' : 'Submit Review'}
          </>
        )}
      </button>
    </form>
  );
}
