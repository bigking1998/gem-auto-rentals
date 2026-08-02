import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Loader2, AlertCircle } from 'lucide-react';
import SEO from '@/components/SEO';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

type State = 'working' | 'done' | 'invalid';

/**
 * Every marketing email carries a link here. CAN-SPAM requires that link to
 * actually work, so this page runs the unsubscribe immediately on load rather
 * than asking the visitor to confirm — one click, done, as the header promises.
 */
export default function UnsubscribePage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [state, setState] = useState<State>('working');
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setState('invalid');
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const base = API_URL.replace(/\/api$/, '');
        const res = await fetch(`${base}/api/waitlist/unsubscribe/${encodeURIComponent(token)}`);
        const json = await res.json();
        if (cancelled) return;

        if (res.ok && json.success) {
          setEmail(json.data?.email ?? null);
          setState('done');
        } else {
          setState('invalid');
        }
      } catch {
        if (!cancelled) setState('invalid');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="bg-navy relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-5 py-16">
      <SEO
        title="Unsubscribe"
        description="Manage your Gem Car Rentals email preferences."
        noIndex
      />

      <div
        aria-hidden="true"
        className="bg-primary pointer-events-none absolute -top-32 left-1/2 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full opacity-[0.10] blur-[130px]"
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-md text-center"
      >
        <Link to="/" aria-label="Gem Car Rentals home">
          <img src="/logo-mark.svg" alt="" className="mx-auto mb-8 h-12 w-auto" />
        </Link>

        {state === 'working' && (
          <>
            <Loader2 className="text-primary mx-auto mb-5 h-8 w-8 animate-spin" />
            <p className="text-navy-light">Updating your preferences…</p>
          </>
        )}

        {state === 'done' && (
          <>
            <div className="bg-primary mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full">
              <Check className="text-primary-foreground h-8 w-8" strokeWidth={3} />
            </div>
            <h1 className="mb-3 text-3xl font-bold text-white">You have been unsubscribed</h1>
            <p className="text-navy-light mb-2 leading-relaxed">
              {email ? (
                <>
                  We will not send any more emails to{' '}
                  <span className="text-primary font-medium">{email}</span>.
                </>
              ) : (
                'We will not send you any more emails.'
              )}
            </p>
            <p className="text-navy-light/70 text-sm">
              Changed your mind? You can join the waiting list again any time.
            </p>

            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                to="/waitinglist"
                className="bg-primary text-primary-foreground hover:bg-primary-light rounded-xl px-6 py-3 text-sm font-bold transition-colors"
              >
                Re-join the list
              </Link>
              <Link
                to="/"
                className="rounded-xl border border-white/15 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/5"
              >
                Back to home
              </Link>
            </div>
          </>
        )}

        {state === 'invalid' && (
          <>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
              <AlertCircle className="h-8 w-8 text-white/70" />
            </div>
            <h1 className="mb-3 text-2xl font-bold text-white">This link is no longer valid</h1>
            <p className="text-navy-light mb-2 leading-relaxed">
              It may have already been used, or the address may have been removed from our list
              already.
            </p>
            <p className="text-navy-light/70 text-sm">
              If you are still receiving emails, reply to any of them and we will remove you
              manually.
            </p>

            <div className="mt-9">
              <Link
                to="/"
                className="rounded-xl border border-white/15 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/5"
              >
                Back to home
              </Link>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
