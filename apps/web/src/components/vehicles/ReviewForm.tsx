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

export default function ReviewForm({
  vehicleId,
  existingReview,
  onReviewSubmitted,
}: ReviewFormProps) {
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
      const response = await api.reviews.submit(vehicleId, {
        rating,
        comment: comment.trim() || undefined,
      });
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
    <form onSubmit={handleSubmit} className="rounded-xl bg-gray-50 p-6">
      <h3 className="mb-4 font-bold text-gray-900">
        {existingReview ? 'Update Your Review' : 'Write a Review'}
      </h3>

      {/* Star Rating */}
      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-gray-700">Your Rating</label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="focus:ring-primary/20 rounded p-1 transition-transform hover:scale-110 focus:outline-none focus:ring-2"
            >
              <Star
                className={cn(
                  'h-8 w-8 transition-colors',
                  star <= displayRating
                    ? 'text-primary fill-primary'
                    : 'hover:text-primary/50 text-gray-300'
                )}
              />
            </button>
          ))}
          <span className="ml-2 text-sm text-gray-500">
            {displayRating > 0
              ? `${displayRating} star${displayRating !== 1 ? 's' : ''}`
              : 'Select rating'}
          </span>
        </div>
      </div>

      {/* Comment */}
      <div className="mb-4">
        <label htmlFor="comment" className="mb-2 block text-sm font-medium text-gray-700">
          Your Review (optional)
        </label>
        <textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience with this vehicle..."
          rows={4}
          maxLength={1000}
          className="focus:ring-primary/20 focus:border-primary w-full resize-none rounded-xl border border-gray-200 px-4 py-3 transition-colors focus:ring-2"
        />
        <div className="mt-1 text-right text-xs text-gray-400">
          {comment.length}/1000 characters
        </div>
      </div>

      {/* Image Upload */}
      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Add Photos (optional)
        </label>

        {/* Uploaded Images Preview */}
        {(images.length > 0 || pendingImages.length > 0) && (
          <div className="mb-3 flex flex-wrap gap-2">
            {/* Already uploaded images */}
            {images.map((url, index) => (
              <div key={`uploaded-${index}`} className="group relative">
                <img
                  src={url}
                  alt={`Review ${index + 1}`}
                  className="h-20 w-20 rounded-lg border border-gray-200 object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeUploadedImage(url)}
                  className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}

            {/* Pending images (not yet uploaded) */}
            {pendingImages.map((file, index) => (
              <div key={`pending-${index}`} className="group relative">
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Pending ${index + 1}`}
                  className="border-primary h-20 w-20 rounded-lg border border-dashed object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePendingImage(index)}
                  className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/20">
                  <ImageIcon className="h-4 w-4 text-white" />
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
              className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-gray-600 transition-colors hover:bg-gray-50"
            >
              {isUploadingImages ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
              <span>Add Photos</span>
            </button>
            <p className="mt-1 text-xs text-gray-400">Up to 5 photos, max 5MB each</p>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mb-4 flex items-center gap-2 text-sm text-green-600">
          <Check className="h-4 w-4 flex-shrink-0" />
          <span>Review {existingReview ? 'updated' : 'submitted'} successfully!</span>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting || rating === 0}
        className={cn(
          'flex w-full items-center justify-center gap-2 rounded-xl py-3 font-semibold transition-all',
          rating === 0
            ? 'cursor-not-allowed bg-gray-100 text-gray-400'
            : 'bg-primary text-primary-foreground hover:bg-primary-dark shadow-lg'
        )}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Submitting...
          </>
        ) : (
          <>{existingReview ? 'Update Review' : 'Submit Review'}</>
        )}
      </button>
    </form>
  );
}
