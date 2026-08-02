import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Navigate, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  User,
  FileText,
  CreditCard,
  LogOut,
  ChevronRight,
  Menu,
  X,
  HelpCircle,
  Car,
  Home,
  ArrowRight,
  Heart,
  Gift,
  Share2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import PageLoader from '@/components/ui/PageLoader';
import { useAuthStore } from '@/stores/authStore';
import { BOOKING_VEHICLE_KEY } from '@/pages/BookingPage';

const sidebarLinks = [
  {
    label: 'My Bookings',
    href: '/dashboard/bookings',
    icon: Calendar,
  },
  {
    label: 'Favorites',
    href: '/dashboard/favorites',
    icon: Heart,
  },
  {
    label: 'Profile',
    href: '/dashboard/profile',
    icon: User,
  },
  {
    label: 'Documents',
    href: '/dashboard/documents',
    icon: FileText,
  },
  {
    label: 'Payment Methods',
    href: '/dashboard/payments',
    icon: CreditCard,
  },
  {
    label: 'Loyalty Rewards',
    href: '/dashboard/loyalty',
    icon: Gift,
  },
  {
    label: 'Refer a Friend',
    href: '/dashboard/referrals',
    icon: Share2,
  },
];

// Session storage key for pending booking return URL
const RETURN_URL_KEY = 'gem_auth_return_url';

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [pendingBooking, setPendingBooking] = useState<{
    vehicleName: string;
    returnUrl: string;
  } | null>(null);
  const { user, logout, isAuthenticated, isInitialized } = useAuthStore();

  // Check for pending booking on mount
  useEffect(() => {
    const returnUrl = sessionStorage.getItem(RETURN_URL_KEY);
    const vehicleData = sessionStorage.getItem(BOOKING_VEHICLE_KEY);

    if (returnUrl && returnUrl.startsWith('/booking') && vehicleData) {
      try {
        const vehicle = JSON.parse(vehicleData);
        setPendingBooking({
          vehicleName: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
          returnUrl,
        });
      } catch {
        // Invalid vehicle data, clear it
        sessionStorage.removeItem(BOOKING_VEHICLE_KEY);
      }
    }
  }, []);

  const handleContinueBooking = () => {
    if (pendingBooking) {
      sessionStorage.removeItem(RETURN_URL_KEY);
      navigate(pendingBooking.returnUrl);
    }
  };

  const handleDismissBooking = () => {
    sessionStorage.removeItem(RETURN_URL_KEY);
    sessionStorage.removeItem(BOOKING_VEHICLE_KEY);
    setPendingBooking(null);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (href: string) => location.pathname === href;

  // Auth guard — mirrors the pattern used by BookingPage.tsx.
  // Wait for the auth store to finish initialising, then send anonymous
  // visitors to /login. Rendering must not fall through: the dashboard
  // children below would otherwise fire authenticated API calls and paint
  // account content for a logged-out visitor.
  if (!isInitialized) {
    return <PageLoader message="Loading your account..." />;
  }

  if (!isAuthenticated) {
    const returnUrl = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?returnUrl=${encodeURIComponent(returnUrl)}`} replace />;
  }

  // Fallback if the profile fetch hasn't resolved yet
  const displayUser = user || { firstName: 'User', lastName: '', email: '' };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Dashboard Header - replaces the main site header */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between px-4 py-4 lg:px-8">
          {/* Logo */}
          <Link to="/" className="group flex items-center space-x-2">
            <div className="from-primary to-primary-dark flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br transition-transform group-hover:scale-105">
              <Car className="text-primary-foreground h-6 w-6" />
            </div>
            <span className="hidden text-xl font-bold tracking-tight text-gray-900 sm:block">
              Gem Auto Rentals
            </span>
          </Link>

          {/* Right side actions */}
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="hover:text-primary flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors"
            >
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Site</span>
            </Link>
            <Link
              to="/vehicles"
              className="bg-primary hover:bg-primary-dark text-primary-foreground hidden items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-colors sm:flex"
            >
              <Car className="h-4 w-4" />
              Book a Car
            </Link>
          </div>
        </div>
      </header>

      {/* Pending Booking Banner */}
      <AnimatePresence>
        {pendingBooking && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="from-primary to-primary-dark text-primary-foreground bg-gradient-to-r px-4 py-3"
          >
            <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 sm:flex-row">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
                  <Car className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">You have an incomplete booking!</p>
                  <p className="text-primary-foreground/80 text-sm">
                    Continue booking your {pendingBooking.vehicleName}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDismissBooking}
                  className="text-primary-foreground/80 hover:text-primary-foreground px-4 py-2 text-sm font-medium transition-colors"
                >
                  Dismiss
                </button>
                <button
                  onClick={handleContinueBooking}
                  className="text-primary-ink flex items-center gap-2 rounded-lg bg-white px-4 py-2 font-bold transition-colors hover:bg-gray-100"
                >
                  Continue Booking
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside className="hidden w-64 flex-col border-r border-gray-200 bg-white lg:flex">
          {/* User Info */}
          <div className="border-b border-gray-100 p-6">
            <div className="flex items-center gap-3">
              <div className="bg-accent flex h-12 w-12 items-center justify-center rounded-full">
                <span className="text-primary-ink text-lg font-semibold">
                  {displayUser.firstName[0]}
                  {displayUser.lastName?.[0] || ''}
                </span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  {displayUser.firstName} {displayUser.lastName}
                </p>
                <p className="text-sm text-gray-500">{displayUser.email}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-1">
              {sidebarLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.href);
                return (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-4 py-3 transition-colors',
                        active
                          ? 'bg-accent text-primary-ink'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{link.label}</span>
                      {active && <ChevronRight className="ml-auto h-4 w-4" />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Help & Logout */}
          <div className="border-t border-gray-100 p-4">
            <Link
              to="/contact"
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
            >
              <HelpCircle className="h-5 w-5" />
              <span className="font-medium">Help Center</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-red-600 transition-colors hover:bg-red-50"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="bg-primary text-primary-foreground fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full shadow-lg lg:hidden"
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              />
              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-xl lg:hidden"
              >
                {/* Close Button */}
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="absolute right-4 top-4 p-2 text-gray-500 hover:text-gray-700"
                >
                  <X className="h-6 w-6" />
                </button>

                {/* User Info */}
                <div className="border-b border-gray-100 p-6 pt-16">
                  <div className="flex items-center gap-3">
                    <div className="bg-accent flex h-12 w-12 items-center justify-center rounded-full">
                      <span className="text-primary-ink text-lg font-semibold">
                        {displayUser.firstName[0]}
                        {displayUser.lastName?.[0] || ''}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {displayUser.firstName} {displayUser.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{displayUser.email}</p>
                    </div>
                  </div>
                </div>

                {/* Navigation */}
                <nav className="p-4">
                  <ul className="space-y-1">
                    {sidebarLinks.map((link) => {
                      const Icon = link.icon;
                      const active = isActive(link.href);
                      return (
                        <li key={link.href}>
                          <Link
                            to={link.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={cn(
                              'flex items-center gap-3 rounded-lg px-4 py-3 transition-colors',
                              active
                                ? 'bg-accent text-primary-ink'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            )}
                          >
                            <Icon className="h-5 w-5" />
                            <span className="font-medium">{link.label}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </nav>

                {/* Logout */}
                <div className="absolute bottom-0 left-0 right-0 border-t border-gray-100 p-4">
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-red-600 transition-colors hover:bg-red-50"
                  >
                    <LogOut className="h-5 w-5" />
                    <span className="font-medium">Sign Out</span>
                  </button>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
