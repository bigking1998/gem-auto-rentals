import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Car } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Browse Cars', href: '/vehicles' },
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'Why Us', href: '/#why-us' },
  { label: 'FAQ', href: '/#faq' },
];

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 pt-6 px-4 sm:px-6 lg:px-8 transition-all duration-300">
      <div
        className={`
          max-w-7xl mx-auto rounded-2xl transition-all duration-300
          ${isScrolled
            ? 'bg-white/95 backdrop-blur-md shadow-lg py-3 px-6'
            : 'bg-white shadow-md py-4 px-8'}
        `}
      >
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center transition-transform group-hover:scale-105">
              <Car className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">
              Gem Auto Rentals
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-gray-600 hover:text-primary transition-colors hover:bg-gray-50 px-3 py-2 rounded-lg"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-primary hover:bg-orange-50 px-4 py-2 rounded-lg transition-colors">
              Log in
            </Link>
            <Link to="/signup" className="text-sm font-bold bg-primary hover:bg-orange-600 text-white px-5 py-2.5 rounded-lg shadow-lg shadow-orange-200 hover:shadow-orange-300 transition-all">
              Sign up
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-gray-600 hover:text-primary hover:bg-gray-50 rounded-lg transition-colors"
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
            className="absolute top-[calc(100%+0.5rem)] left-4 right-4 bg-white rounded-2xl shadow-xl p-6 md:hidden border border-gray-100"
          >
            <nav className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-lg font-medium text-gray-600 hover:text-primary hover:bg-gray-50 px-4 py-3 rounded-xl transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-4 border-t border-gray-100 flex flex-col space-y-3">
                <Link to="/login" className="w-full text-center text-gray-700 hover:bg-gray-50 hover:text-primary font-medium py-3 rounded-lg border border-gray-200 block" onClick={() => setIsMobileMenuOpen(false)}>
                  Log in
                </Link>
                <Link to="/signup" className="w-full text-center bg-primary hover:bg-orange-600 text-white font-bold py-3 rounded-lg shadow-lg shadow-orange-200 block" onClick={() => setIsMobileMenuOpen(false)}>
                  Sign up
                </Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
