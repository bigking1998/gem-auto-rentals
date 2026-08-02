import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Loader2, ArrowRight } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import SEO from '@/components/SEO';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const categories = [
  { value: 'ECONOMY', label: 'Economy', hint: 'Best value' },
  { value: 'STANDARD', label: 'Standard', hint: 'Everyday driving' },
  { value: 'SUV', label: 'SUV', hint: 'Space & families' },
  { value: 'PREMIUM', label: 'Premium', hint: 'A step up' },
  { value: 'LUXURY', label: 'Luxury', hint: 'Something special' },
  { value: 'VAN', label: 'Van', hint: 'Groups & cargo' },
] as const;

const timeframes = [
  { value: 'THIS_WEEK', label: 'This week' },
  { value: 'THIS_MONTH', label: 'This month' },
  { value: 'NEXT_FEW_MONTHS', label: 'Next few months' },
  { value: 'JUST_BROWSING', label: 'Just browsing' },
] as const;

interface NavState {
  token?: string | null;
  name?: string;
  alreadySubscribed?: boolean;
}

export default function WaitingListThankYouPage() {
  const location = useLocation();
  const state = (location.state ?? {}) as NavState;
  const token = state.token ?? null;
  const firstName = (state.name ?? '').split(' ')[0];

  const [category, setCategory] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // No token means they landed here directly rather than via signup — show the
  // confirmation, but there is nothing to attach answers to.
  const canAnswer = Boolean(token) && !saved;

  const save = async (nextCategory: string | null, nextTimeframe: string | null) => {
    if (!token) return;
    setSaving(true);
    try {
      await fetch(`${API_URL.replace(/\/api$/, '')}/api/waitlist/profile/${token}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(nextCategory ? { interestCategory: nextCategory } : {}),
          ...(nextTimeframe ? { timeframe: nextTimeframe } : {}),
        }),
      });
      setSaved(true);
    } catch {
      // Their signup is already safe; a failed preference save is not worth
      // interrupting them over.
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  const handleTimeframe = (value: string) => {
    setTimeframe(value);
    save(category, value);
  };

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="You're on the list | Gem Car Rentals"
        description="Thanks for joining the Gem Car Rentals waiting list."
      />
      <Header />

      <main className="bg-navy relative overflow-hidden pb-24 pt-32">
        <div className="pointer-events-none absolute inset-0 opacity-[0.18]">
          <div className="bg-primary absolute -top-40 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full blur-[140px]" />
        </div>

        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="bg-primary mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full"
            >
              <Check className="text-primary-foreground h-10 w-10" strokeWidth={3} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.1 }}
            >
              <h1 className="mb-5 text-4xl font-bold text-white sm:text-5xl">
                {firstName ? `You're on the list, ${firstName}.` : "You're on the list."}
              </h1>
              <p className="text-navy-light mb-3 text-lg leading-relaxed">
                {state.alreadySubscribed
                  ? 'You were already signed up — we have refreshed your details.'
                  : 'Check your inbox for a confirmation from us.'}
              </p>
              <p className="text-navy-light/80">
                We will reach out the moment vehicles become available.
              </p>
            </motion.div>

            {/* ---------- optional segmentation ---------- */}
            {canAnswer && (
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.25 }}
                className="mt-14 rounded-2xl bg-white p-7 text-left shadow-2xl sm:p-9"
              >
                <h2 className="text-navy mb-1.5 text-xl font-bold">
                  One quick thing — what are you after?
                </h2>
                <p className="mb-7 text-sm text-gray-500">
                  This lets us contact you first when the right vehicle arrives, instead of emailing
                  everyone about everything.
                </p>

                <div className="mb-8">
                  <p className="mb-3 text-sm font-medium text-gray-700">What kind of vehicle?</p>
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                    {categories.map((c) => {
                      const active = category === c.value;
                      return (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => setCategory(active ? null : c.value)}
                          aria-pressed={active}
                          className={`rounded-xl border-2 px-3 py-3 text-left transition-all ${
                            active
                              ? 'border-primary bg-accent'
                              : 'hover:border-primary/40 border-gray-200'
                          }`}
                        >
                          <span className="text-navy block text-sm font-semibold">{c.label}</span>
                          <span className="mt-0.5 block text-xs text-gray-500">{c.hint}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-sm font-medium text-gray-700">When do you need it?</p>
                  <div className="grid grid-cols-2 gap-2.5">
                    {timeframes.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        disabled={saving}
                        onClick={() => handleTimeframe(t.value)}
                        aria-pressed={timeframe === t.value}
                        className={`rounded-xl border-2 px-3 py-3 text-sm font-semibold transition-all disabled:opacity-60 ${
                          timeframe === t.value
                            ? 'border-primary bg-accent text-navy'
                            : 'text-navy hover:border-primary/40 border-gray-200'
                        }`}
                      >
                        {saving && timeframe === t.value ? (
                          <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                        ) : (
                          t.label
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {saved && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="border-primary/25 mt-14 rounded-2xl border bg-white/5 p-7 backdrop-blur"
              >
                <p className="text-primary mb-1.5 text-lg font-semibold">Got it — thank you.</p>
                <p className="text-navy-light">
                  We will keep an eye out for exactly that and let you know first.
                </p>
              </motion.div>
            )}

            <div className="mt-12">
              <Link
                to="/"
                className="text-primary hover:text-primary-light group inline-flex items-center gap-2 text-sm font-semibold transition-colors"
              >
                Back to home
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
