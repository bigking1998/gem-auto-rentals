import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Car,
  ArrowRight,
  Loader2,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';

// Session storage key for preserving return URL across page loads
const RETURN_URL_KEY = 'gem_auth_return_url';

// Admin dashboard URL - configurable via environment variable
const ADMIN_DASHBOARD_URL = import.meta.env.VITE_ADMIN_URL || 'https://admin.gemrentalcars.com';

// Trusted domains for admin dashboard redirect (prevents open redirect attacks)
const TRUSTED_ADMIN_DOMAINS = [
  'admin.gemrentalcars.com',
  'gem-auto-rentals-admin.onrender.com',
  'localhost',
];

// Validate that the admin URL points to a trusted domain
function isValidAdminUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return TRUSTED_ADMIN_DOMAINS.some(
      (domain) => parsed.hostname === domain || parsed.hostname.endsWith('.' + domain)
    );
  } catch {
    return false;
  }
}

// Roles that have access to admin dashboard
const ADMIN_ROLES = ['ADMIN', 'MANAGER', 'SUPPORT'];

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, error: authError, clearError } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});

  // Get redirect path from URL query param, location state, sessionStorage backup, or default to dashboard
  const searchParams = new URLSearchParams(location.search);
  const returnUrlParam = searchParams.get('returnUrl');

  // Validate returnUrl to prevent open redirect attacks
  const isValidReturnUrl = (url: string | null): boolean => {
    if (!url) return false;
    // Must be a relative path starting with '/' and not starting with '//' (protocol-relative URL)
    return url.startsWith('/') && !url.startsWith('//') && !url.includes('://');
  };

  // Try to get returnUrl from: query param > sessionStorage > location state > default
  const getReturnUrl = (): string => {
    // First try query param
    if (isValidReturnUrl(returnUrlParam)) {
      return returnUrlParam!;
    }
    // Then try sessionStorage (backup in case URL was modified)
    const storedUrl = sessionStorage.getItem(RETURN_URL_KEY);
    if (isValidReturnUrl(storedUrl)) {
      return storedUrl!;
    }
    // Then try location state
    const stateFrom = (location.state as { from?: string })?.from;
    if (stateFrom) {
      return stateFrom;
    }
    // Default to dashboard
    return '/dashboard';
  };

  const from = getReturnUrl();

  // Store valid returnUrl in sessionStorage as backup
  useEffect(() => {
    if (isValidReturnUrl(returnUrlParam)) {
      sessionStorage.setItem(RETURN_URL_KEY, returnUrlParam!);
    }
  }, [returnUrlParam]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setErrors({});

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await login(formData.email, formData.password);

      // Get the user from the store after login
      const user = useAuthStore.getState().user;

      // Check if user has admin role - redirect to admin dashboard with SSO code
      if (user && ADMIN_ROLES.includes(user.role)) {
        // Validate admin URL before redirecting (prevents open redirect)
        if (!isValidAdminUrl(ADMIN_DASHBOARD_URL)) {
          console.error('Invalid admin dashboard URL configured', {
            url: ADMIN_DASHBOARD_URL,
            origin: 'web-login-sso-redirect',
          });
          setErrors({
            general: 'Admin dashboard URL is misconfigured. Please contact support.',
          });
          return;
        }

        try {
          // Generate a short-lived SSO code (more secure than passing token in URL)
          const { code } = await api.auth.generateSsoCode();

          // Redirect to admin dashboard with the code (not the token)
          // The admin dashboard will exchange this code for a token server-side
          window.location.href = `${ADMIN_DASHBOARD_URL}/login?code=${encodeURIComponent(code)}`;
          return;
        } catch (ssoError) {
          // SSO code generation failed - clear partial session and show error
          // Log without PII (no email)
          console.warn('SSO code generation failed for admin user', {
            role: user.role,
            userId: user.id,
            error: ssoError instanceof Error ? ssoError.message : 'Unknown error',
            origin: 'web-login-sso-redirect',
          });

          // Clear the partially established session to avoid inconsistent state
          await useAuthStore.getState().logout();

          setErrors({
            general: `Unable to redirect to admin dashboard. Please try again or log in directly at the admin portal.`,
          });
          setIsLoading(false);
          return;
        }
      }

      // Regular user - navigate to the intended destination or dashboard
      // Clear the stored return URL since we're about to use it
      sessionStorage.removeItem(RETURN_URL_KEY);
      navigate(from, { replace: true });
    } catch (error) {
      // Error is already set in the auth store
      setErrors({ general: authError || 'Login failed. Please check your credentials.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Side - Form */}
      <div className="relative flex flex-1 items-center justify-center bg-white p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Back to Home */}
          <div className="mb-8">
            <Link
              to="/"
              className="hover:text-primary-ink inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </Link>
          </div>
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Welcome back</h1>
            <p className="mt-2 text-gray-500">Sign in to your account to continue</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Alert */}
            {(errors.general || authError) && (
              <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <p className="text-sm">{errors.general || authError}</p>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="you@example.com"
                  className={cn(
                    'focus:ring-primary/20 focus:border-primary w-full rounded-xl border py-3 pl-10 pr-4 transition-all focus:ring-2',
                    errors.email ? 'border-red-300' : 'border-gray-200'
                  )}
                />
              </div>
              {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
            </div>

            {/* Password Field */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <Link
                  to="/forgot-password"
                  className="text-primary-ink text-sm font-medium hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter your password"
                  className={cn(
                    'focus:ring-primary/20 focus:border-primary w-full rounded-xl border py-3 pl-10 pr-12 transition-all focus:ring-2',
                    errors.password ? 'border-red-300' : 'border-gray-200'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="rememberMe"
                checked={formData.rememberMe}
                onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                className="text-primary-ink focus:ring-primary h-4 w-4 rounded border-gray-300"
              />
              <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-600">
                Remember me for 30 days
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                'text-primary-foreground flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 font-bold shadow-lg transition-all',
                'bg-primary hover:bg-primary-dark',
                isLoading ? 'cursor-not-allowed opacity-70' : ''
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>

          {/* The "Or continue with / Google / GitHub" block was removed: both
              buttons were bare <button> elements with no onClick, no handler and
              no OAuth call anywhere in the app — two prominent controls that did
              nothing. Reinstate them when a real provider flow exists. */}

          {/* Sign Up Link */}
          <p className="mt-8 text-center text-gray-600">
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="text-primary-ink font-bold hover:underline">
              Sign up for free
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Right Side - Image/Branding */}
      <div className="relative hidden overflow-hidden bg-gray-900 lg:flex lg:flex-1">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 z-10 bg-gray-900/90" />
          <img
            src="https://images.unsplash.com/photo-1485291571150-772bcfc10da5?w=1920"
            alt="Luxury Car"
            className="h-full w-full object-cover opacity-50 grayscale"
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex h-full flex-col items-center justify-center p-12 text-white">
          {/* Logo */}
          <div className="absolute left-8 top-8">
            <Link to="/" className="group flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 backdrop-blur-md transition-all group-hover:bg-white/20">
                <Car className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Gem Car Rentals</span>
            </Link>
          </div>

          <div className="max-w-md text-center">
            <h2 className="mb-6 text-4xl font-bold">
              Your Journey <span className="text-primary">Starts Here</span>
            </h2>
            <p className="mb-12 text-lg text-gray-300">
              Access your bookings, manage your profile, and explore our premium fleet of vehicles.
            </p>

            {/* Feature List */}
            <div className="space-y-6 text-left">
              {[
                'Instant booking confirmations',
                'Manage multiple reservations',
                '24/7 customer support',
                'Exclusive member discounts',
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="bg-primary/20 border-primary/20 flex h-8 w-8 items-center justify-center rounded-full border">
                    <Car className="text-primary h-4 w-4" />
                  </div>
                  <span className="text-lg text-gray-200">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
