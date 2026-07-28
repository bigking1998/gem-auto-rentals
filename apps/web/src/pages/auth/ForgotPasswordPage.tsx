import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Car, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setError('Email is required');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email');
      return;
    }

    setError('');
    setIsLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsLoading(false);
    setIsSubmitted(true);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="rounded-2xl bg-white p-8 shadow-xl">
          {/* Logo */}
          <Link to="/" className="mb-8 flex items-center justify-center gap-2">
            <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-xl">
              <Car className="text-primary-ink h-7 w-7" />
            </div>
          </Link>

          {!isSubmitted ? (
            <>
              {/* Header */}
              <div className="mb-8 text-center">
                <h1 className="text-2xl font-bold text-gray-900">Forgot password?</h1>
                <p className="mt-2 text-gray-500">
                  No worries, we&apos;ll send you reset instructions.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError('');
                      }}
                      placeholder="Enter your email"
                      className={cn(
                        'focus:ring-primary/20 focus:border-primary w-full rounded-lg border py-2.5 pl-10 pr-4 transition-all focus:ring-2',
                        error ? 'border-red-300' : 'border-gray-200'
                      )}
                    />
                  </div>
                  {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className={cn(
                    'text-primary-foreground flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3 font-medium transition-all',
                    'bg-primary hover:bg-primary-dark shadow-lg',
                    isLoading ? 'cursor-not-allowed opacity-70' : ''
                  )}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </form>
            </>
          ) : (
            /* Success State */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="mb-2 text-2xl font-bold text-gray-900">Check your email</h2>
              <p className="mb-6 text-gray-500">
                We sent a password reset link to
                <br />
                <span className="font-medium text-gray-900">{email}</span>
              </p>

              <button
                onClick={() => window.open('mailto:', '_blank')}
                className={cn(
                  'text-primary-foreground mb-4 flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3 font-medium transition-all',
                  'bg-primary hover:bg-primary-dark shadow-lg'
                )}
              >
                <Mail className="h-5 w-5" />
                Open Email App
              </button>

              <p className="text-sm text-gray-500">
                Didn&apos;t receive the email?{' '}
                <button
                  onClick={() => {
                    setIsSubmitted(false);
                    setEmail('');
                  }}
                  className="text-primary-ink font-medium hover:underline"
                >
                  Click to resend
                </button>
              </p>
            </motion.div>
          )}

          {/* Back to Login */}
          <div className="mt-8 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
