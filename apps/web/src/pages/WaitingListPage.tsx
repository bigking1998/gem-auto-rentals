import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, ArrowRight, AlertCircle } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import SEO from '@/components/SEO';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const perks = [
  'First to know when vehicles arrive',
  'Early access before public booking',
  'No spam — only when there is something to say',
];

export default function WaitingListPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  // Honeypot: hidden from real users. Bots fill it in, and we silently drop them.
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

      // Hand the one-time profile token to the thank-you page so it can attach
      // preferences without ever exposing the subscriber id.
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

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="Join the Waiting List | Gem Car Rentals"
        description="Be the first to know when vehicles become available at Gem Car Rentals in Mulberry, Florida."
      />
      <Header />

      <main className="bg-navy relative overflow-hidden pb-24 pt-32">
        {/* soft gold glow */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.18]">
          <div className="bg-primary absolute -top-40 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full blur-[140px]" />
        </div>

        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-5xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
            {/* ---------- pitch ---------- */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <img src="/logo-mark.svg" alt="" aria-hidden="true" className="mb-8 h-16 w-auto" />

              <span className="text-primary mb-4 inline-block text-xs font-semibold uppercase tracking-[0.22em]">
                Coming Soon
              </span>

              <h1 className="mb-6 text-4xl font-bold leading-[1.1] text-white sm:text-5xl">
                Be first in line
                <span className="text-primary block">when the keys drop.</span>
              </h1>

              <p className="text-navy-light mb-8 text-lg leading-relaxed">
                We are building our fleet in Mulberry, Florida. Leave your details and we will reach
                out the moment vehicles are ready to rent.
              </p>

              <ul className="space-y-3">
                {perks.map((perk) => (
                  <li key={perk} className="text-navy-light flex items-start gap-3">
                    <span
                      aria-hidden="true"
                      className="bg-primary mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full"
                    />
                    <span>{perk}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* ---------- form ---------- */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="rounded-2xl bg-white p-7 shadow-2xl sm:p-9"
            >
              <h2 className="text-navy mb-1 text-xl font-bold">Join the waiting list</h2>
              <p className="mb-7 text-sm text-gray-500">Takes about ten seconds.</p>

              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div>
                  <label
                    htmlFor="wl-name"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Full name
                  </label>
                  <input
                    id="wl-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    className="focus:ring-primary w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 transition-all focus:border-transparent focus:outline-none focus:ring-2"
                    placeholder="Jane Doe"
                  />
                </div>

                <div>
                  <label
                    htmlFor="wl-email"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Email address
                  </label>
                  <input
                    id="wl-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    className="focus:ring-primary w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 transition-all focus:border-transparent focus:outline-none focus:ring-2"
                    placeholder="jane@example.com"
                  />
                </div>

                <div>
                  <label
                    htmlFor="wl-phone"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Phone <span className="font-normal text-gray-400">(optional)</span>
                  </label>
                  <input
                    id="wl-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    autoComplete="tel"
                    className="focus:ring-primary w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 transition-all focus:border-transparent focus:outline-none focus:ring-2"
                    placeholder="813-555-0142"
                  />
                </div>

                {/* honeypot — hidden from humans, catches bots */}
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
                    className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-primary text-primary-foreground hover:bg-primary-dark group flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-base font-bold shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Joining…
                    </>
                  ) : (
                    <>
                      Join the list
                      <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>

                <p className="text-center text-xs leading-relaxed text-gray-400">
                  We will only email you about vehicle availability. Unsubscribe any time.
                </p>
              </form>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
