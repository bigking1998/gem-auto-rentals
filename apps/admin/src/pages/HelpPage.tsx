import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
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
      'Refunds cannot be issued from this dashboard yet — there is no payment tracking or refund screen in the admin. Process the refund directly in your payment provider, then add a note to the booking so the record matches.',
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
      'In Fleet Management, find the vehicle and use the three-dot menu on the right. This marks the vehicle\'s status as "Maintenance" so it stops appearing as available. Note: no maintenance record is stored yet, so keep the type, date and notes in your own records for now.',
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
      'There is no "Extend Booking" action in the admin dashboard yet. Customers can request an extension from the customer site; on the admin side, adjust the booking\'s end date from the Bookings page and collect any additional payment separately.',
    category: 'bookings',
  },
  {
    id: '8',
    question: 'How do I set up two-factor authentication?',
    answer:
      'Two-factor authentication is not available yet — the Security page shows it as "Coming soon". Your account is protected by your password alone, so use a long unique password and check the "Active Sessions" and "Login History" tabs on the Security page for anything unexpected.',
    category: 'security',
  },
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

      {/* Contact Support */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
      >
        <h2 className="mb-2 text-lg font-semibold text-gray-900">Still stuck?</h2>
        <p className="text-sm text-gray-600">
          There is no in-app support desk. If something in this dashboard is broken or a documented
          step does not match what you see, contact whoever maintains this installation directly.
        </p>
      </motion.div>
    </div>
  );
}
