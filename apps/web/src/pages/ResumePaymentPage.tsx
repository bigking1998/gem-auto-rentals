import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import PaymentStep from '@/components/booking/PaymentStep';
import { api, ApiError, type Booking } from '@/lib/api';
import type { BookingData } from '@/pages/BookingPage';

/**
 * Pay for a booking that already exists.
 *
 * Before this page, a booking left in PENDING was a dead end: the only control
 * on it in "My Bookings" was Cancel. A customer who closed the tab mid-payment,
 * or whose card was declined, had no way back in — they had to cancel and build
 * the whole booking again from scratch. That is a lost sale on a customer who
 * had already decided to buy.
 *
 * The booking flow could not be reused as-is because /booking creates a NEW
 * booking from a vehicle held in session storage. This loads the real booking by
 * id and hands the existing PaymentStep everything it needs.
 */
export default function ResumePaymentPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!bookingId) {
        setError('No booking was specified.');
        setIsLoading(false);
        return;
      }
      try {
        const result = await api.bookings.get(bookingId);
        if (cancelled) return;

        if (result.status !== 'PENDING') {
          // Already paid, or cancelled. Sending them to a card form would be
          // worse than telling them plainly.
          setError(
            result.status === 'CONFIRMED'
              ? 'This booking is already confirmed — there is nothing left to pay.'
              : `This booking is ${String(result.status).toLowerCase()} and can no longer be paid for.`
          );
        } else {
          setBooking(result);
        }
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof ApiError && err.message
            ? err.message
            : 'We could not load this booking. Please try again.'
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  const vehicle = booking?.vehicle;

  const days =
    booking && booking.startDate && booking.endDate
      ? Math.max(
          1,
          Math.ceil(
            (new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        )
      : 0;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />

      <main className="container mx-auto flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <Link
          to="/dashboard/bookings"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to my bookings
        </Link>

        <h1 className="mb-2 text-2xl font-bold text-gray-900">Complete your payment</h1>
        <p className="mb-8 text-gray-500">
          Your booking is held but not confirmed until payment goes through.
        </p>

        {isLoading && (
          <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-8 text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading your booking…
          </div>
        )}

        {!isLoading && error && (
          <div className="rounded-xl border border-gray-100 bg-white p-8 text-center">
            <AlertCircle className="mx-auto mb-3 h-10 w-10 text-red-500" />
            <p className="mb-6 text-gray-700">{error}</p>
            <Link
              to="/dashboard/bookings"
              className="bg-primary text-primary-foreground hover:bg-primary-dark inline-block rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors"
            >
              Back to my bookings
            </Link>
          </div>
        )}

        {!isLoading && !error && booking && vehicle && (
          <PaymentStep
            // PaymentStep only reads the extras and customer name out of this,
            // so the stored booking supplies everything it needs.
            data={
              {
                ...(booking.extras ? { extras: booking.extras } : {}),
              } as unknown as BookingData
            }
            vehicle={{
              make: vehicle.make,
              model: vehicle.model,
              year: vehicle.year,
              category: String(vehicle.category),
              dailyRate: Number(vehicle.dailyRate),
              images: vehicle.images ?? [],
            }}
            total={Number(booking.totalAmount)}
            days={days}
            bookingId={booking.id}
            onSubmit={() => navigate('/dashboard/bookings')}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}
