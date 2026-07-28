import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut, ChevronDown, Shield, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';

const ADMIN_DASHBOARD_URL = import.meta.env.VITE_ADMIN_URL || 'https://admin.gemrentalcars.com';

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Browse Cars', href: '/vehicles' },
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'Why Us', href: '/#why-us' },
  { label: 'FAQ', href: '/#faq' },
];

interface HeaderProps {
  variant?: 'default' | 'booking';
}

export default function Header({ variant = 'default' }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const [isAdminRedirecting, setIsAdminRedirecting] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleAdminRedirect = async () => {
    setIsAdminRedirecting(true);
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
    try {
      const { code } = await api.auth.generateSsoCode();
      window.open(
        `${ADMIN_DASHBOARD_URL}/login?code=${encodeURIComponent(code)}`,
        '_blank',
        'noopener,noreferrer'
      );
    } catch {
      // Fallback: open admin dashboard without SSO (user will need to log in manually)
      window.open(ADMIN_DASHBOARD_URL, '_blank', 'noopener,noreferrer');
    } finally {
      setIsAdminRedirecting(false);
    }
  };

  return (
    <header className="fixed left-0 right-0 top-0 z-50 px-4 pt-6 transition-all duration-300 sm:px-6 lg:px-8">
      <div
        className={`
          mx-auto max-w-7xl rounded-2xl transition-all duration-300
          ${
            isScrolled
              ? 'bg-white/95 px-6 py-3 shadow-lg backdrop-blur-md'
              : 'bg-white px-8 py-4 shadow-md'
          }
        `}
      >
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="group flex items-center gap-2.5">
            <img
              src="/logo-mark.svg"
              alt=""
              aria-hidden="true"
              width={40}
              height={36}
              className="h-9 w-auto transition-transform group-hover:scale-105"
            />
            <span className="flex flex-col leading-none">
              <span className="text-navy font-serif text-xl font-bold tracking-tight">
                GEM
                <span className="text-primary-ink ml-1.5 text-lg font-semibold tracking-[0.12em]">
                  CAR RENTALS
                </span>
              </span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center space-x-8 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="hover:text-primary rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Auth Buttons / User Menu */}
          <div className="hidden items-center space-x-4 md:flex">
            {isAuthenticated && user ? (
              variant === 'booking' ? (
                // Booking page - show "Select Different Car" button
                <Link
                  to="/vehicles"
                  className="bg-primary hover:bg-primary-dark text-primary-foreground rounded-lg px-5 py-2.5 text-sm font-bold shadow-lg transition-all"
                >
                  Select Different Car
                </Link>
              ) : (
                // Default - show user dropdown menu
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="hover:text-primary flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full">
                      <User className="text-primary h-4 w-4" />
                    </div>
                    <span>{user.firstName}</span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border border-gray-100 bg-white py-2 shadow-lg"
                      >
                        <Link
                          to="/dashboard/bookings"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          My Dashboard
                        </Link>
                        {user.role === 'ADMIN' && (
                          <button
                            onClick={handleAdminRedirect}
                            disabled={isAdminRedirecting}
                            className="text-primary-ink hover:bg-accent flex w-full items-center gap-2 px-4 py-2 text-sm font-medium disabled:opacity-50"
                          >
                            {isAdminRedirecting ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Shield className="h-4 w-4" />
                            )}
                            {isAdminRedirecting ? 'Redirecting...' : 'My Admin'}
                          </button>
                        )}
                        <hr className="my-2 border-gray-100" />
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            handleLogout();
                          }}
                          className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign Out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            ) : (
              // Not authenticated - show login/signup
              <>
                <Link
                  to="/login"
                  className="hover:text-primary hover:bg-accent rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="bg-primary hover:bg-primary-dark text-primary-foreground rounded-lg px-5 py-2.5 text-sm font-bold shadow-lg transition-all"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="hover:text-primary rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-50 md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute left-4 right-4 top-[calc(100%+0.5rem)] rounded-2xl border border-gray-100 bg-white p-6 shadow-xl md:hidden"
          >
            <nav className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="hover:text-primary rounded-xl px-4 py-3 text-lg font-medium text-gray-600 transition-colors hover:bg-gray-50"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <div className="flex flex-col space-y-3 border-t border-gray-100 pt-4">
                {isAuthenticated && user ? (
                  variant === 'booking' ? (
                    <Link
                      to="/vehicles"
                      className="bg-primary hover:bg-primary-dark text-primary-foreground block w-full rounded-lg py-3 text-center font-bold shadow-lg"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Select Different Car
                    </Link>
                  ) : (
                    <>
                      <Link
                        to="/dashboard/bookings"
                        className="hover:text-primary block w-full rounded-lg border border-gray-200 py-3 text-center font-medium text-gray-700 hover:bg-gray-50"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        My Dashboard
                      </Link>
                      {user.role === 'ADMIN' && (
                        <button
                          onClick={handleAdminRedirect}
                          disabled={isAdminRedirecting}
                          className="text-primary-ink hover:bg-accent border-primary flex w-full items-center justify-center gap-2 rounded-lg border py-3 text-center font-medium disabled:opacity-50"
                        >
                          {isAdminRedirecting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Shield className="h-4 w-4" />
                          )}
                          {isAdminRedirecting ? 'Redirecting...' : 'My Admin'}
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          handleLogout();
                        }}
                        className="block w-full rounded-lg border border-red-200 py-3 text-center font-medium text-red-600 hover:bg-red-50"
                      >
                        Sign Out
                      </button>
                    </>
                  )
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="hover:text-primary block w-full rounded-lg border border-gray-200 py-3 text-center font-medium text-gray-700 hover:bg-gray-50"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Log in
                    </Link>
                    <Link
                      to="/signup"
                      className="bg-primary hover:bg-primary-dark text-primary-foreground block w-full rounded-lg py-3 text-center font-bold shadow-lg"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Sign up
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
