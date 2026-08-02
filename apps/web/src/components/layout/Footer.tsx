import { Link } from 'react-router-dom';
import { Car, Mail, Phone, MapPin } from 'lucide-react';
import { ADDRESS, CONTACT_EMAIL, PRIMARY_PHONE, PRIMARY_PHONE_HREF } from '@/lib/contact';

// Every href here must resolve to a real route in App.tsx.
// `/pricing`, `/locations`, `/careers`, `/blog`, `/press` and `/help` were
// removed rather than left as soft 404s — Vercel's SPA rewrite returns HTTP 200
// for them, so uptime checks never catch it and only customers do.
const footerLinks = {
  quickLinks: [
    { label: 'Browse Cars', href: '/vehicles' },
    { label: 'How It Works', href: '/#how-it-works' },
    { label: 'Book a Car', href: '/booking' },
  ],
  company: [
    { label: 'About Us', href: '/about' },
    { label: 'Contact Us', href: '/contact' },
  ],
  support: [
    { label: 'FAQs', href: '/#faq' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Privacy Policy', href: '/privacy' },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-300">
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-5 lg:gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link to="/" className="mb-4 flex items-center space-x-2">
              <div className="from-primary to-primary-dark flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br">
                <Car className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Gem Car Rentals</span>
            </Link>
            <p className="mb-6 max-w-sm text-gray-400">
              Premium car rental services with a wide selection of vehicles. Experience the freedom
              of the open road with Gem Car Rentals.
            </p>
            <div className="space-y-3">
              <a
                href={PRIMARY_PHONE_HREF}
                className="hover:text-primary flex items-center space-x-3 transition-colors"
              >
                <Phone className="text-primary h-5 w-5" />
                <span>{PRIMARY_PHONE}</span>
              </a>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="hover:text-primary flex items-center space-x-3 transition-colors"
              >
                <Mail className="text-primary h-5 w-5" />
                <span>{CONTACT_EMAIL}</span>
              </a>
              <div className="flex items-center space-x-3">
                <MapPin className="text-primary h-5 w-5" />
                <span>{ADDRESS}</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 font-semibold text-white">Quick Links</h3>
            <ul className="space-y-3">
              {footerLinks.quickLinks.map((link) => (
                <li key={link.label}>
                  <Link to={link.href} className="hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="mb-4 font-semibold text-white">Company</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link to={link.href} className="hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="mb-4 font-semibold text-white">Support</h3>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.label}>
                  <Link to={link.href} className="hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Newsletter */}
        <div className="mt-12 border-t border-gray-800 pt-8">
          <div className="flex flex-col items-center justify-between gap-6 lg:flex-row">
            <div>
              <h3 className="mb-2 font-semibold text-white">Subscribe to our newsletter</h3>
              <p className="text-sm text-gray-400">
                Get the latest deals and updates delivered to your inbox.
              </p>
            </div>
            <form className="flex w-full gap-3 lg:w-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="focus:ring-primary flex-1 rounded-lg border border-gray-700 bg-gray-900 px-4 py-2 text-white placeholder-gray-400 focus:border-transparent focus:outline-none focus:ring-2 lg:w-64"
              />
              <button
                type="submit"
                className="bg-primary text-primary-foreground hover:bg-primary-dark rounded-lg px-6 py-2 font-bold transition-all"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        {/* Social icons removed: they pointed at bare platform homepages
            (facebook.com, twitter.com, …), not at company profiles. Put them
            back once the real profile URLs exist. */}
        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-gray-800 pt-8 md:flex-row">
          <p className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} Gem Car Rentals. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <Link to="/terms" className="hover:text-primary transition-colors">
              Terms
            </Link>
            <Link to="/privacy" className="hover:text-primary transition-colors">
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
