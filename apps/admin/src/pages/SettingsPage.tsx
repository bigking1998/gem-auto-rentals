import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User,
  Bell,
  Lock,
  CreditCard,
  Building,
  Globe,
  Plus,
  Trash2,
  Check,
  Download,
  Clock,
  MapPin,
  Phone,
  Mail,
  Upload,
  ExternalLink,
  Zap,
  RefreshCw,
} from 'lucide-react';
import { cn, formatCurrency, formatDate } from '@/lib/utils';

// Mock billing data
const mockPaymentMethods = [
  { id: '1', type: 'visa', last4: '4242', expiry: '12/26', isDefault: true },
  { id: '2', type: 'mastercard', last4: '8888', expiry: '09/25', isDefault: false },
];

const mockInvoices = [
  { id: 'INV-001', date: new Date('2026-01-01'), amount: 299, status: 'paid' },
  { id: 'INV-002', date: new Date('2025-12-01'), amount: 299, status: 'paid' },
  { id: 'INV-003', date: new Date('2025-11-01'), amount: 299, status: 'paid' },
];

const mockIntegrations = [
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Accept payments online',
    icon: '💳',
    connected: true,
    category: 'payments',
  },
  {
    id: 'paypal',
    name: 'PayPal',
    description: 'Alternative payment method',
    icon: '🅿️',
    connected: false,
    category: 'payments',
  },
  {
    id: 'mailchimp',
    name: 'Mailchimp',
    description: 'Email marketing campaigns',
    icon: '📧',
    connected: true,
    category: 'marketing',
  },
  {
    id: 'twilio',
    name: 'Twilio',
    description: 'SMS notifications',
    icon: '📱',
    connected: false,
    category: 'communications',
  },
  {
    id: 'google-analytics',
    name: 'Google Analytics',
    description: 'Website analytics',
    icon: '📊',
    connected: true,
    category: 'analytics',
  },
  {
    id: 'quickbooks',
    name: 'QuickBooks',
    description: 'Accounting software',
    icon: '📚',
    connected: false,
    category: 'accounting',
  },
];

const tabs = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'company', label: 'Company', icon: Building },
  { id: 'integrations', label: 'Integrations', icon: Globe },
];

export default function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const validTabs = ['profile', 'notifications', 'security', 'billing', 'company', 'integrations'];
  const initialTab = tabFromUrl && validTabs.includes(tabFromUrl) ? tabFromUrl : 'profile';
  const [activeTab, setActiveTab] = useState(initialTab);

  // Sync tab with URL
  useEffect(() => {
    if (tabFromUrl && validTabs.includes(tabFromUrl) && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500">Manage your account and preferences</p>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:w-56 flex-shrink-0"
        >
          <nav className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
            {tabs.map((tab, index) => (
              <motion.button
                key={tab.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + index * 0.05 }}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap',
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-orange-50 to-orange-100 text-primary shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50'
                )}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </motion.button>
            ))}
          </nav>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex-1"
        >
          {activeTab === 'profile' && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Profile Settings</h2>

              <div className="flex items-center gap-6 mb-8">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-2xl font-semibold shadow-lg shadow-orange-200">
                  JD
                </div>
                <div>
                  <button className="px-5 py-2.5 bg-primary text-white rounded-xl shadow-lg shadow-orange-200 hover:shadow-orange-300 hover:bg-orange-600 transition-all duration-300 text-sm font-medium">
                    Change Avatar
                  </button>
                  <p className="text-sm text-gray-500 mt-2">JPG, GIF or PNG. Max size 2MB.</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    defaultValue="John"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    defaultValue="Doe"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    defaultValue="john.doe@gemauto.com"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    defaultValue="+1 (555) 123-4567"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
                <button className="px-5 py-2.5 text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all">
                  Cancel
                </button>
                <button className="px-5 py-2.5 bg-primary text-white rounded-xl shadow-lg shadow-orange-200 hover:shadow-orange-300 hover:bg-orange-600 transition-all duration-300">
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Notification Preferences</h2>

              <div className="space-y-4">
                {[
                  { label: 'New booking notifications', description: 'Receive alerts when a new booking is made' },
                  { label: 'Booking updates', description: 'Get notified about booking status changes' },
                  { label: 'Payment confirmations', description: 'Receive payment receipts and confirmations' },
                  { label: 'Vehicle maintenance alerts', description: 'Get reminders for scheduled maintenance' },
                  { label: 'Weekly reports', description: 'Receive weekly performance summary' },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="font-medium text-gray-900">{item.label}</p>
                      <p className="text-sm text-gray-500">{item.description}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Security Settings</h2>

              <div className="space-y-6 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  />
                </div>

                <button className="px-5 py-2.5 bg-primary text-white rounded-xl shadow-lg shadow-orange-200 hover:shadow-orange-300 hover:bg-orange-600 transition-all duration-300">
                  Update Password
                </button>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-6">
              {/* Current Plan */}
              <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-sm mb-1">Current Plan</p>
                    <h3 className="text-2xl font-bold">Professional</h3>
                    <p className="text-white/80 mt-1">$299/month • Billed monthly</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/80 text-sm mb-1">Next billing date</p>
                    <p className="text-lg font-semibold">February 1, 2026</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      <Check className="w-4 h-4" /> Unlimited vehicles
                    </span>
                    <span className="flex items-center gap-1">
                      <Check className="w-4 h-4" /> Priority support
                    </span>
                    <span className="flex items-center gap-1">
                      <Check className="w-4 h-4" /> Advanced analytics
                    </span>
                  </div>
                  <button className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium transition-colors">
                    Upgrade Plan
                  </button>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Payment Methods</h2>
                  <button className="flex items-center gap-2 px-4 py-2 text-sm text-primary border border-orange-200 rounded-xl hover:bg-orange-50 transition-colors">
                    <Plus className="w-4 h-4" />
                    Add Method
                  </button>
                </div>

                <div className="space-y-3">
                  {mockPaymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className={cn(
                        'flex items-center justify-between p-4 rounded-xl border transition-colors',
                        method.isDefault
                          ? 'bg-orange-50 border-orange-200'
                          : 'bg-gray-50 border-gray-200'
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-8 bg-white rounded-lg border border-gray-200 flex items-center justify-center">
                          {method.type === 'visa' ? (
                            <span className="text-blue-600 font-bold text-sm">VISA</span>
                          ) : (
                            <span className="text-red-500 font-bold text-xs">MC</span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            •••• •••• •••• {method.last4}
                          </p>
                          <p className="text-sm text-gray-500">Expires {method.expiry}</p>
                        </div>
                        {method.isDefault && (
                          <span className="px-2 py-0.5 bg-orange-100 text-primary text-xs font-medium rounded-full">
                            Default
                          </span>
                        )}
                      </div>
                      <button className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Billing History */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Billing History</h2>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                        <th className="pb-3 font-medium">Invoice</th>
                        <th className="pb-3 font-medium">Date</th>
                        <th className="pb-3 font-medium">Amount</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {mockInvoices.map((invoice) => (
                        <tr key={invoice.id} className="text-sm">
                          <td className="py-4 font-medium text-gray-900">{invoice.id}</td>
                          <td className="py-4 text-gray-600">{formatDate(invoice.date)}</td>
                          <td className="py-4 text-gray-900">{formatCurrency(invoice.amount)}</td>
                          <td className="py-4">
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full capitalize">
                              {invoice.status}
                            </span>
                          </td>
                          <td className="py-4 text-right">
                            <button className="flex items-center gap-1 text-primary hover:text-orange-600 ml-auto">
                              <Download className="w-4 h-4" />
                              Download
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'company' && (
            <div className="space-y-6">
              {/* Company Logo & Name */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Company Profile</h2>

                <div className="flex items-start gap-6 mb-8">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-orange-200">
                    GA
                  </div>
                  <div>
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl shadow-lg shadow-orange-200 hover:shadow-orange-300 hover:bg-orange-600 transition-all duration-300 text-sm font-medium">
                      <Upload className="w-4 h-4" />
                      Upload Logo
                    </button>
                    <p className="text-sm text-gray-500 mt-2">PNG, JPG or SVG. Max size 2MB.</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Name
                    </label>
                    <input
                      type="text"
                      defaultValue="Gem Auto Rentals"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Type
                    </label>
                    <select className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all">
                      <option>Car Rental Company</option>
                      <option>Fleet Management</option>
                      <option>Transportation Service</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tax ID / EIN
                    </label>
                    <input
                      type="text"
                      defaultValue="XX-XXXXXXX"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Website
                    </label>
                    <input
                      type="url"
                      defaultValue="https://gemautorentals.com"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Contact Information</h2>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail className="w-4 h-4 inline mr-1" /> Email
                    </label>
                    <input
                      type="email"
                      defaultValue="contact@gemautorentals.com"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone className="w-4 h-4 inline mr-1" /> Phone
                    </label>
                    <input
                      type="tel"
                      defaultValue="+1 (800) GEM-AUTO"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="w-4 h-4 inline mr-1" /> Address
                    </label>
                    <input
                      type="text"
                      defaultValue="123 Ocean Drive"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all mb-3"
                    />
                    <div className="grid grid-cols-3 gap-3">
                      <input
                        type="text"
                        defaultValue="Miami"
                        placeholder="City"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                      />
                      <input
                        type="text"
                        defaultValue="FL"
                        placeholder="State"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                      />
                      <input
                        type="text"
                        defaultValue="33139"
                        placeholder="ZIP"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Operating Hours */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">
                  <Clock className="w-5 h-5 inline mr-2" />
                  Operating Hours
                </h2>

                <div className="space-y-3">
                  {[
                    { day: 'Monday - Friday', hours: '8:00 AM - 8:00 PM' },
                    { day: 'Saturday', hours: '9:00 AM - 6:00 PM' },
                    { day: 'Sunday', hours: '10:00 AM - 4:00 PM' },
                  ].map((schedule, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                    >
                      <span className="font-medium text-gray-900">{schedule.day}</span>
                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          defaultValue={schedule.hours}
                          className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-100">
                  <button className="px-5 py-2.5 text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all">
                    Cancel
                  </button>
                  <button className="px-5 py-2.5 bg-primary text-white rounded-xl shadow-lg shadow-orange-200 hover:shadow-orange-300 hover:bg-orange-600 transition-all duration-300">
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className="space-y-6">
              {/* Integration Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {mockIntegrations.filter((i) => i.connected).length}
                      </p>
                      <p className="text-sm text-gray-500">Connected</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                      <Globe className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{mockIntegrations.length}</p>
                      <p className="text-sm text-gray-500">Available</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                      <RefreshCw className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">Live</p>
                      <p className="text-sm text-gray-500">Sync Status</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Integrations List */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Available Integrations</h2>
                  <button className="flex items-center gap-2 px-4 py-2 text-sm text-primary border border-orange-200 rounded-xl hover:bg-orange-50 transition-colors">
                    <ExternalLink className="w-4 h-4" />
                    Browse Marketplace
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {mockIntegrations.map((integration) => (
                    <div
                      key={integration.id}
                      className={cn(
                        'flex items-center justify-between p-4 rounded-xl border transition-all',
                        integration.connected
                          ? 'bg-green-50 border-green-200'
                          : 'bg-gray-50 border-gray-200 hover:border-orange-200'
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-2xl">
                          {integration.icon}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{integration.name}</p>
                          <p className="text-sm text-gray-500">{integration.description}</p>
                        </div>
                      </div>
                      {integration.connected ? (
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                            <Check className="w-3 h-3" />
                            Connected
                          </span>
                          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors">
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl shadow-lg shadow-orange-200 hover:shadow-orange-300 hover:bg-orange-600 transition-all duration-300">
                          Connect
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* API Access */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">API Access</h2>
                <p className="text-gray-500 text-sm mb-4">
                  Use our API to build custom integrations with your existing systems.
                </p>

                <div className="p-4 bg-gray-900 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 text-sm">API Key</span>
                    <button className="text-primary text-sm hover:text-orange-600">Copy</button>
                  </div>
                  <code className="text-green-400 font-mono text-sm">
                    gem_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
                  </code>
                </div>

                <div className="flex items-center gap-4 mt-4">
                  <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                    <RefreshCw className="w-4 h-4" />
                    Regenerate Key
                  </button>
                  <a
                    href="#"
                    className="flex items-center gap-2 text-sm text-primary hover:text-orange-600"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View API Documentation
                  </a>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
