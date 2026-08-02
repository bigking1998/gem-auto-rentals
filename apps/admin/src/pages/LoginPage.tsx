import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { tokenManager, api } from '@/lib/api';

// Allowed roles for admin dashboard access
const ADMIN_ROLES = ['ADMIN', 'MANAGER', 'SUPPORT'];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [ssoLoading, setSsoLoading] = useState(false);
  const [ssoError, setSsoError] = useState<string | null>(null);
  const { login, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Memoized so it is referentially stable across renders. Its only non-static
  // dependency is `navigate` (stable for the life of the router), and every other
  // value it touches is a `useState` setter or a module-level import — so this
  // callback identity never changes and cannot re-trigger the effect below.
  const handleSsoCode = useCallback(
    async (code: string) => {
      setSsoLoading(true);
      setSsoError(null);

      try {
        // Exchange the short-lived code for a token (server-side validation)
        const { user, token } = await api.auth.exchangeSsoCode(code);

        // Check if user has admin privileges
        if (!ADMIN_ROLES.includes(user.role)) {
          setSsoError('Access denied. Admin privileges required.');
          setSsoLoading(false);
          return;
        }

        // Clear any stale persisted auth state before setting new credentials
        // This prevents showing cached user data from a previous session
        localStorage.removeItem('admin-auth-storage');

        // Store the token
        tokenManager.setToken(token);

        // Set user data directly from the SSO exchange response (more reliable than re-fetching)
        useAuthStore.setState({
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone || null,
            role: user.role,
            avatarUrl: null,
            emailVerified: user.emailVerified,
            createdAt: user.createdAt,
          },
          isAuthenticated: true,
          isLoading: false,
          isInitialized: true,
        });

        setSsoLoading(false);

        // Redirect to dashboard
        navigate('/', { replace: true });
      } catch (err) {
        // Code exchange failed (expired, already used, or invalid)
        console.warn('SSO code exchange failed', {
          error: err instanceof Error ? err.message : 'Unknown error',
          origin: 'admin-login-sso',
        });
        setSsoError('SSO login failed. The link may have expired. Please log in manually.');
        setSsoLoading(false);
      }
    },
    [navigate]
  );

  // Handle SSO code from URL (secure - code is exchanged for token server-side)
  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      // Clear code from URL immediately
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('code');
      window.history.replaceState(
        {},
        '',
        `${window.location.pathname}${newSearchParams.toString() ? '?' + newSearchParams.toString() : ''}`
      );
      handleSsoCode(code);
    }
  }, [searchParams, handleSsoCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setSsoError(null);
    const success = await login(email, password);
    if (success) {
      navigate('/');
    }
  };

  // Show loading state while processing SSO token
  if (ssoLoading) {
    return (
      <div className="from-accent to-primary-light/30 flex min-h-screen items-center justify-center bg-gradient-to-br via-white p-4">
        <div className="text-center">
          <Loader2 className="text-primary-ink mx-auto mb-4 h-12 w-12 animate-spin" />
          <p className="font-medium text-gray-600">Signing you in...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="from-accent to-primary-light/30 flex min-h-screen items-center justify-center bg-gradient-to-br via-white p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-xl">
          {/* Logo */}
          <div className="mb-8 text-center">
            <div className="bg-navy mb-4 inline-flex h-20 w-20 items-center justify-center rounded-2xl shadow-lg">
              <img src="/logo-mark.svg" alt="Gem Car Rentals" className="h-12 w-auto" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="mt-1 text-gray-500">Sign in to manage your fleet</p>
          </div>

          {/* Error Message */}
          {(error || ssoError) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4"
            >
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
              <div>
                <p className="text-sm font-medium text-red-800">Authentication Error</p>
                <p className="text-sm text-red-600">{error || ssoError}</p>
              </div>
            </motion.div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="focus:ring-primary w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 transition-all focus:border-transparent focus:ring-2"
                  placeholder="admin@gemrentalcars.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="focus:ring-primary w-full rounded-xl border border-gray-200 py-3 pl-10 pr-12 transition-all focus:border-transparent focus:ring-2"
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 transition-colors hover:bg-gray-100"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="from-primary-light to-primary-dark text-primary-foreground shadow-primary/20 hover:shadow-primary/30 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r py-3 font-semibold shadow-lg transition-all hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 border-t border-gray-100 pt-6">
            <p className="text-center text-sm text-gray-500">
              Access restricted to authorized personnel only.
            </p>
          </div>
        </div>

        {/* Branding */}
        <p className="mt-8 text-center text-sm text-gray-400">Gem Car Rentals - Admin Portal</p>
      </motion.div>
    </div>
  );
}
