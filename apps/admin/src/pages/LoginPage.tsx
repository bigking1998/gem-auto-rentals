import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Car, Mail, Lock, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
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

  // Handle SSO code from URL (secure - code is exchanged for token server-side)
  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      // Clear code from URL immediately
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('code');
      window.history.replaceState({}, '', `${window.location.pathname}${newSearchParams.toString() ? '?' + newSearchParams.toString() : ''}`);
      handleSsoCode(code);
    }
  }, [searchParams]);

  const handleSsoCode = async (code: string) => {
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
  };

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
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Signing you in...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl mb-4 shadow-lg shadow-orange-200">
              <Car className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-500 mt-1">Sign in to manage your fleet</p>
          </div>

          {/* Error Message */}
          {(error || ssoError) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Authentication Error</p>
                <p className="text-sm text-red-600">{error || ssoError}</p>
              </div>
            </motion.div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  placeholder="admin@gemautorentals.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-gray-400" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl shadow-lg shadow-orange-200 hover:shadow-xl hover:shadow-orange-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-center text-sm text-gray-500">
              Access restricted to authorized personnel only.
            </p>
          </div>
        </div>

        {/* Branding */}
        <p className="mt-8 text-center text-sm text-gray-400">
          Gem Auto Rentals - Admin Portal
        </p>
      </motion.div>
    </div>
  );
}
