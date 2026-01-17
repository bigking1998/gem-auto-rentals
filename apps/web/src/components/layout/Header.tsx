import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Car } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Browse Cars', href: '/vehicles' },
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled
          ? 'bg-white/80 backdrop-blur-lg shadow-sm'
          : 'bg-transparent'
      )}
    >
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Car className="w-6 h-6 text-white" />
            </div>
            <span className={cn(
              'text-xl font-bold transition-colors',
              isScrolled ? 'text-gray-900' : 'text-white'
            )}>
              Gem Auto
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-indigo-500',
                  isScrolled ? 'text-gray-700' : 'text-white/90 hover:text-white'
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="hidden lg:flex items-center space-x-4">
            <Link
              to="/login"
              className={cn(
                'text-sm font-medium transition-colors',
                isScrolled ? 'text-gray-700 hover:text-gray-900' : 'text-white/90 hover:text-white'
              )}
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
            >
              Sign Up
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className={cn('w-6 h-6', isScrolled ? 'text-gray-900' : 'text-white')} />
            ) : (
              <Menu className={cn('w-6 h-6', isScrolled ? 'text-gray-900' : 'text-white')} />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden py-4 bg-white rounded-lg shadow-lg mt-2">
            <div className="flex flex-col space-y-1 px-4">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  className="text-gray-700 hover:text-indigo-500 py-2 text-sm font-medium transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <hr className="my-2" />
              <Link
                to="/login"
                className="text-gray-700 hover:text-gray-900 py-2 text-sm font-medium transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg mt-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Sign Up
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
