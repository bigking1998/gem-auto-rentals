import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  User,
  FileText,
  CreditCard,
  Settings,
  LogOut,
  ChevronRight,
  Menu,
  X,
  HelpCircle,
  Car,
  Home,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { BOOKING_VEHICLE_KEY } from '@/pages/BookingPage';

const sidebarLinks = [
  {
    label: 'My Bookings',
    href: '/dashboard/bookings',
    icon: Calendar,
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
    label: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
];

// Session storage key for pending booking return URL
const RETURN_URL_KEY = 'gem_auth_return_url';

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [pendingBooking, setPendingBooking] = useState<{ vehicleName: string; returnUrl: string } | null>(null);
  const { user, logout } = useAuthStore();

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

  // Fallback if user is not loaded yet
  const displayUser = user || { firstName: 'User', lastName: '', email: '' };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Dashboard Header - replaces the main site header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="flex items-center justify-between px-4 lg:px-8 py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center transition-transform group-hover:scale-105">
              <Car className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight hidden sm:block">
              Gem Auto Rentals
            </span>
          </Link>

          {/* Right side actions */}
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-primary transition-colors"
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Site</span>
            </Link>
            <Link
              to="/vehicles"
              className="hidden sm:flex items-center gap-2 text-sm font-bold bg-primary hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Car className="w-4 h-4" />
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
            className="bg-gradient-to-r from-primary to-orange-600 text-white px-4 py-3"
          >
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold">You have an incomplete booking!</p>
                  <p className="text-sm text-white/80">Continue booking your {pendingBooking.vehicleName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDismissBooking}
                  className="px-4 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors"
                >
                  Dismiss
                </button>
                <button
                  onClick={handleContinueBooking}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-primary font-bold rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Continue Booking
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200">
          {/* User Info */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                <span className="text-lg font-semibold text-indigo-600">
                  {displayUser.firstName[0]}{displayUser.lastName?.[0] || ''}
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
                        'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                        active
                          ? 'bg-indigo-50 text-indigo-600'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{link.label}</span>
                      {active && (
                        <ChevronRight className="w-4 h-4 ml-auto" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Help & Logout */}
          <div className="p-4 border-t border-gray-100">
            <Link
              to="/help"
              className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors"
            >
              <HelpCircle className="w-5 h-5" />
              <span className="font-medium">Help Center</span>
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="lg:hidden fixed bottom-6 right-6 z-40 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center"
        >
          <Menu className="w-6 h-6" />
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
                className="lg:hidden fixed inset-0 z-40 bg-black/50"
              />
              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="lg:hidden fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-xl"
              >
                {/* Close Button */}
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>

                {/* User Info */}
                <div className="p-6 pt-16 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-lg font-semibold text-indigo-600">
                        {displayUser.firstName[0]}{displayUser.lastName?.[0] || ''}
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
                              'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                              active
                                ? 'bg-indigo-50 text-indigo-600'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            )}
                          >
                            <Icon className="w-5 h-5" />
                            <span className="font-medium">{link.label}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </nav>

                {/* Logout */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
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
