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
    answer: 'Navigate to Fleet Management from the sidebar, then click the "Add Vehicle" button in the top right corner. Fill in all the required vehicle details including make, model, year, daily rate, and upload vehicle images. Click "Add Vehicle" to save.',
    category: 'fleet',
  },
  {
    id: '2',
    question: 'How do I process a refund for a customer?',
    answer: 'Go to the Bookings page and find the relevant booking. Click on the booking to open details, then click "View Payments". In the payment tracking modal, find the payment you want to refund and click the "Refund" button. Enter the refund amount and confirm.',
    category: 'payments',
  },
  {
    id: '3',
    question: 'How do I verify a customer\'s documents?',
    answer: 'Navigate to Customers, then click on the customer profile. Go to the "Documents" tab where you\'ll see all uploaded documents. Review each document and click the "Verify" button to mark it as verified.',
    category: 'customers',
  },
  {
    id: '4',
    question: 'How do I schedule vehicle maintenance?',
    answer: 'In Fleet Management, find the vehicle you want to schedule maintenance for. Click the three-dot menu on the right and select "Schedule Maintenance". Choose the maintenance type, date, and add any notes. The vehicle status will automatically change to "Maintenance".',
    category: 'fleet',
  },
  {
    id: '5',
    question: 'How do I export booking reports?',
    answer: 'Go to the Analytics page from the sidebar. Use the date filters to select your desired time period. Click the "Export" button in the top right corner to download the report in CSV or PDF format.',
    category: 'reports',
  },
  {
    id: '6',
    question: 'How do I change my notification settings?',
    answer: 'Click on Settings in the sidebar, then navigate to the "Notifications" tab. Here you can toggle different notification types including booking alerts, payment confirmations, and weekly reports.',
    category: 'settings',
  },
  {
    id: '7',
    question: 'What should I do if a customer wants to extend their rental?',
    answer: 'Find the active booking in the Bookings page and click to open details. Click "Extend Booking" and select the new end date. The system will calculate any additional charges. Process the additional payment and confirm the extension.',
    category: 'bookings',
  },
  {
    id: '8',
    question: 'How do I set up two-factor authentication?',
    answer: 'Go to Security from the sidebar. Under the "Two-Factor Auth" tab, click "Enable Two-Factor Authentication". Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.) and enter the verification code to complete setup.',
    category: 'security',
  },
];

const quickLinks = [
  { icon: Zap, label: 'Getting Started', description: 'New to Gem Auto? Start here', href: '#' },
  { icon: BookOpen, label: 'Documentation', description: 'Full admin guide & tutorials', href: '#' },
  { icon: MessageCircle, label: 'Contact Support', description: 'Get help from our team', href: '#' },
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
        className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-8 text-white"
      >
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-3">How can we help you?</h1>
          <p className="text-white/80 mb-6">Search our help center or browse topics below</p>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white text-gray-900 rounded-xl focus:outline-none focus:ring-4 focus:ring-white/30 shadow-lg"
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
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickLinks.map((link, index) => (
            <motion.a
              key={link.label}
              href={link.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + index * 0.05 }}
              className="group bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg hover:border-orange-200 transition-all duration-300"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                  <link.icon className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors">
                    {link.label}
                  </h3>
                  <p className="text-sm text-gray-500">{link.description}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary group-hover:translate-x-1 transition-all" />
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
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
      >
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Frequently Asked Questions</h2>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  selectedCategory === category.id
                    ? 'bg-orange-100 text-primary'
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
              <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
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
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium text-gray-900 pr-4">{faq.question}</span>
                  {expandedFaq === faq.id ? (
                    <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                </button>
                {expandedFaq === faq.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-5 pb-5"
                  >
                    <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
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
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Support</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mb-4">
              <MessageCircle className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Live Chat</h3>
            <p className="text-sm text-gray-500 mb-4">Get instant help from our support team</p>
            <div className="flex items-center gap-2 text-sm text-green-600 mb-4">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Available now
            </div>
            <button className="w-full px-4 py-2.5 bg-primary text-white rounded-xl shadow-lg shadow-orange-200 hover:shadow-orange-300 hover:bg-orange-600 transition-all duration-300 text-sm font-medium">
              Start Chat
            </button>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-4">
              <Mail className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Email Support</h3>
            <p className="text-sm text-gray-500 mb-4">Send us a detailed message</p>
            <p className="text-sm text-gray-600 mb-4">support@gemauto.com</p>
            <button className="w-full px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium">
              Send Email
            </button>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center mb-4">
              <Phone className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Phone Support</h3>
            <p className="text-sm text-gray-500 mb-4">Call us during business hours</p>
            <p className="text-sm text-gray-600 mb-4">+1 (800) GEM-AUTO</p>
            <button className="w-full px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium">
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
        className="bg-gray-50 rounded-2xl p-6"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Resources</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Car, label: 'Fleet Setup Guide', href: '#' },
            { icon: CreditCard, label: 'Payment Integration', href: '#' },
            { icon: Users, label: 'Customer Management', href: '#' },
            { icon: FileText, label: 'Terms of Service', href: '#' },
          ].map((resource) => (
            <a
              key={resource.label}
              href={resource.href}
              className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-orange-200 hover:shadow-md transition-all group"
            >
              <resource.icon className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
              <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                {resource.label}
              </span>
              <ExternalLink className="w-4 h-4 text-gray-400 ml-auto group-hover:text-primary transition-colors" />
            </a>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
