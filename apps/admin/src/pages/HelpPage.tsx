import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  HelpCircle,
  BookOpen,
  MessageCircle,
  Mail,
  Phone,
  Video,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Zap,
  Car,
  CreditCard,
  Users,
  FileText,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQ[] = [
  {
    id: '1',
    question: 'How do I add a new vehicle to the fleet?',
    answer:
      'Navigate to Fleet Management from the sidebar, then click the "Add Vehicle" button in the top right corner. Fill in all the required vehicle details including make, model, year, daily rate, and upload vehicle images. Click "Add Vehicle" to save.',
    category: 'fleet',
  },
  {
    id: '2',
    question: 'How do I process a refund for a customer?',
    answer:
      'Go to the Bookings page and find the relevant booking. Click on the booking to open details, then click "View Payments". In the payment tracking modal, find the payment you want to refund and click the "Refund" button. Enter the refund amount and confirm.',
    category: 'payments',
  },
  {
    id: '3',
    question: "How do I verify a customer's documents?",
    answer:
      'Navigate to Customers, then click on the customer profile. Go to the "Documents" tab where you\'ll see all uploaded documents. Review each document and click the "Verify" button to mark it as verified.',
    category: 'customers',
  },
  {
    id: '4',
    question: 'How do I schedule vehicle maintenance?',
    answer:
      'In Fleet Management, find the vehicle you want to schedule maintenance for. Click the three-dot menu on the right and select "Schedule Maintenance". Choose the maintenance type, date, and add any notes. The vehicle status will automatically change to "Maintenance".',
    category: 'fleet',
  },
  {
    id: '5',
    question: 'How do I export booking reports?',
    answer:
      'Go to the Analytics page from the sidebar. Use the date filters to select your desired time period. Click the "Export" button in the top right corner to download the report in CSV or PDF format.',
    category: 'reports',
  },
  {
    id: '6',
    question: 'How do I change my notification settings?',
    answer:
      'Click on Settings in the sidebar, then navigate to the "Notifications" tab. Here you can toggle different notification types including booking alerts, payment confirmations, and weekly reports.',
    category: 'settings',
  },
  {
    id: '7',
    question: 'What should I do if a customer wants to extend their rental?',
    answer:
      'Find the active booking in the Bookings page and click to open details. Click "Extend Booking" and select the new end date. The system will calculate any additional charges. Process the additional payment and confirm the extension.',
    category: 'bookings',
  },
  {
    id: '8',
    question: 'How do I set up two-factor authentication?',
    answer:
      'Go to Security from the sidebar. Under the "Two-Factor Auth" tab, click "Enable Two-Factor Authentication". Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.) and enter the verification code to complete setup.',
    category: 'security',
  },
];

const quickLinks = [
  { icon: Zap, label: 'Getting Started', description: 'New to Gem Auto? Start here', href: '#' },
  {
    icon: BookOpen,
    label: 'Documentation',
    description: 'Full admin guide & tutorials',
    href: '#',
  },
  {
    icon: MessageCircle,
    label: 'Contact Support',
    description: 'Get help from our team',
    href: '#',
  },
  { icon: Video, label: 'Video Tutorials', description: 'Watch step-by-step guides', href: '#' },
];

const categories = [
  { id: 'all', label: 'All Topics' },
  { id: 'fleet', label: 'Fleet Management' },
  { id: 'bookings', label: 'Bookings' },
  { id: 'customers', label: 'Customers' },
  { id: 'payments', label: 'Payments' },
  { id: 'settings', label: 'Settings' },
  { id: 'security', label: 'Security' },
  { id: 'reports', label: 'Reports' },
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  const filteredFaqs = faqs.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleFaq = (faqId: string) => {
    setExpandedFaq(expandedFaq === faqId ? null : faqId);
  };

  return (
    <div className="space-y-6">
      {/* Hero Section with Search */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="from-primary-light to-primary-dark text-primary-foreground rounded-2xl bg-gradient-to-r p-8"
      >
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="mb-3 text-3xl font-bold">How can we help you?</h1>
          <p className="text-primary-foreground/80 mb-6">
            Search our help center or browse topics below
          </p>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl bg-white py-3.5 pl-12 pr-4 text-gray-900 shadow-lg focus:outline-none focus:ring-4 focus:ring-white/30"
            />
          </div>
        </div>
      </motion.div>

      {/* Quick Links */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Quick Links</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map((link, index) => (
            <motion.a
              key={link.label}
              href={link.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + index * 0.05 }}
              className="hover:border-primary group rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-lg"
            >
              <div className="flex items-start gap-4">
                <div className="bg-accent group-hover:bg-primary-light flex h-12 w-12 items-center justify-center rounded-xl transition-colors">
                  <link.icon className="text-primary-ink h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="group-hover:text-primary-ink font-semibold text-gray-900 transition-colors">
                    {link.label}
                  </h3>
                  <p className="text-sm text-gray-500">{link.description}</p>
                </div>
                <ArrowRight className="group-hover:text-primary-ink h-5 w-5 text-gray-400 transition-all group-hover:translate-x-1" />
              </div>
            </motion.a>
          ))}
        </div>
      </motion.div>

      {/* FAQ Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
      >
        <div className="border-b border-gray-100 p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Frequently Asked Questions</h2>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                  selectedCategory === category.id
                    ? 'bg-accent text-primary-ink'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {filteredFaqs.length === 0 ? (
            <div className="p-8 text-center">
              <HelpCircle className="mx-auto mb-3 h-12 w-12 text-gray-300" />
              <p className="text-gray-500">No FAQs found matching your search.</p>
            </div>
          ) : (
            filteredFaqs.map((faq, index) => (
              <motion.div
                key={faq.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.03 }}
              >
                <button
                  onClick={() => toggleFaq(faq.id)}
                  className="flex w-full items-center justify-between p-5 text-left transition-colors hover:bg-gray-50"
                >
                  <span className="pr-4 font-medium text-gray-900">{faq.question}</span>
                  {expandedFaq === faq.id ? (
                    <ChevronUp className="h-5 w-5 flex-shrink-0 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 flex-shrink-0 text-gray-400" />
                  )}
                </button>
                {expandedFaq === faq.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-5 pb-5"
                  >
                    <p className="leading-relaxed text-gray-600">{faq.answer}</p>
                  </motion.div>
                )}
              </motion.div>
            ))
          )}
        </div>
      </motion.div>

      {/* Contact Support Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Contact Support</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
              <MessageCircle className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="mb-2 font-semibold text-gray-900">Live Chat</h3>
            <p className="mb-4 text-sm text-gray-500">Get instant help from our support team</p>
            <div className="mb-4 flex items-center gap-2 text-sm text-green-600">
              <span className="h-2 w-2 animate-pulse rounded-full bg-green-500"></span>
              Available now
            </div>
            <button className="bg-primary text-primary-foreground shadow-primary/20 hover:shadow-primary/30 hover:bg-primary-dark w-full rounded-xl px-4 py-2.5 text-sm font-medium shadow-lg transition-all duration-300">
              Start Chat
            </button>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg">
            <div className="bg-accent mb-4 flex h-12 w-12 items-center justify-center rounded-xl">
              <Mail className="text-primary-ink h-6 w-6" />
            </div>
            <h3 className="mb-2 font-semibold text-gray-900">Email Support</h3>
            <p className="mb-4 text-sm text-gray-500">Send us a detailed message</p>
            <p className="mb-4 text-sm text-gray-600">support@gemauto.com</p>
            <button className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
              Send Email
            </button>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg">
            <div className="bg-accent mb-4 flex h-12 w-12 items-center justify-center rounded-xl">
              <Phone className="text-primary-ink h-6 w-6" />
            </div>
            <h3 className="mb-2 font-semibold text-gray-900">Phone Support</h3>
            <p className="mb-4 text-sm text-gray-500">Call us during business hours</p>
            <p className="mb-4 text-sm text-gray-600">+1 (800) GEM-AUTO</p>
            <button className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
              Call Now
            </button>
          </div>
        </div>
      </motion.div>

      {/* Additional Resources */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-2xl bg-gray-50 p-6"
      >
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Additional Resources</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Car, label: 'Fleet Setup Guide', href: '#' },
            { icon: CreditCard, label: 'Payment Integration', href: '#' },
            { icon: Users, label: 'Customer Management', href: '#' },
            { icon: FileText, label: 'Terms of Service', href: '#' },
          ].map((resource) => (
            <a
              key={resource.label}
              href={resource.href}
              className="hover:border-primary group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 transition-all hover:shadow-md"
            >
              <resource.icon className="group-hover:text-primary-ink h-5 w-5 text-gray-400 transition-colors" />
              <span className="text-sm font-medium text-gray-700 transition-colors group-hover:text-gray-900">
                {resource.label}
              </span>
              <ExternalLink className="group-hover:text-primary-ink ml-auto h-4 w-4 text-gray-400 transition-colors" />
            </a>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
