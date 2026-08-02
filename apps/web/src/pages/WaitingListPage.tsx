import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle } from 'lucide-react';
import SEO from '@/components/SEO';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Deliberately minimal. No site nav, no marketing copy, no perks list — this
 * page has exactly one job, and every extra element is another way to leave it.
 */
export default function WaitingListPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  // Honeypot: hidden from real users. Bots fill it in and get dropped silently.
  const [website, setWebsite] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch(`${API_URL.replace(/\/api$/, '')}/api/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, website, source: 'website' }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json?.error || 'Something went wrong. Please try again.');
      }

      navigate('/waitinglist/thank-you', {
        replace: true,
        state: {
          token: json.data?.profileToken ?? null,
          name: json.data?.name ?? name,
          alreadySubscribed: Boolean(json.data?.alreadySubscribed),
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  const field =
    'w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3.5 text-white placeholder:text-white/35 transition-all focus:border-primary/60 focus:bg-white/[0.07] focus:outline-none focus:ring-1 focus:ring-primary/60';

  return (
    <div className="bg-navy relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-5 py-16">
      <SEO
        title="Join the Waiting List"
        description="Be the first to know when vehicles become available at Gem Car Rentals in Mulberry, Florida."
      />

      {/* single soft gold glow */}
      <div
        aria-hidden="true"
        className="bg-primary pointer-events-none absolute -top-32 left-1/2 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full opacity-[0.13] blur-[130px]"
      />

      {/* car line drawing, sat low and faint so it reads as a watermark
          rather than competing with the form */}
      <img
        src="/car-silhouette.svg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute bottom-6 left-1/2 w-[min(1000px,150%)] -translate-x-1/2 select-none opacity-[0.18] sm:bottom-10 sm:opacity-[0.22]"
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative w-full max-w-md"
      >
        <div className="mb-9 text-center">
          <Link to="/" aria-label="Gem Car Rentals home">
            <img src="/logo-mark.svg" alt="" className="mx-auto mb-6 h-14 w-auto" />
          </Link>
          <h1 className="mb-3 text-3xl font-bold leading-tight text-white sm:text-4xl">
            Join the waiting list
          </h1>
          <p className="text-navy-light text-[15px] leading-relaxed">
            We will let you know the moment vehicles are available.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            className={field}
            placeholder="Full name"
            aria-label="Full name"
          />

          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className={field}
            placeholder="Email address"
            aria-label="Email address"
          />

          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
            className={field}
            placeholder="Phone (optional)"
            aria-label="Phone number, optional"
          />

          {/* honeypot */}
          <div className="absolute left-[-9999px]" aria-hidden="true">
            <label htmlFor="wl-website">Website</label>
            <input
              id="wl-website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-xl border border-red-400/25 bg-red-500/10 p-3.5"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" />
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="bg-primary text-primary-foreground hover:bg-primary-light flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-base font-bold transition-all disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Signing up…
              </>
            ) : (
              'Sign Up'
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-xs leading-relaxed text-white/35">
          No spam. Unsubscribe any time.
        </p>
      </motion.div>
    </div>
  );
}
