import { useState, useEffect, useRef } from 'react';
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
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { api, PaymentMethod, Integration } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { AddPaymentMethodModal } from '@/components/settings/AddPaymentMethodModal';
import { DeletePaymentMethodModal } from '@/components/settings/DeletePaymentMethodModal';
import { UpgradePlanModal } from '@/components/settings/UpgradePlanModal';

const mockInvoices = [
  { id: 'INV-001', date: new Date('2026-01-01'), amount: 299, status: 'paid' },
  { id: 'INV-002', date: new Date('2025-12-01'), amount: 299, status: 'paid' },
  { id: 'INV-003', date: new Date('2025-11-01'), amount: 299, status: 'paid' },
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

  // Get user from auth store
  const { user, updateAvatar } = useAuthStore();

  // Avatar upload state
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Logo upload state
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);

  // Payment methods state
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoadingPaymentMethods, setIsLoadingPaymentMethods] = useState(false);
  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
  const [isDeletePaymentModalOpen, setIsDeletePaymentModalOpen] = useState(false);
  const [paymentMethodToDelete, setPaymentMethodToDelete] = useState<PaymentMethod | null>(null);

  // Upgrade plan modal state
  const [isUpgradePlanModalOpen, setIsUpgradePlanModalOpen] = useState(false);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [isProfileSaving, setIsProfileSaving] = useState(false);

  // Company contact form state
  const [companyForm, setCompanyForm] = useState({
    email: 'gemautosalesinc@gmail.com',
    phone: '863-277-7879',
    street: '1311 E CANAL ST',
    city: 'Mulberry',
    state: 'FL',
    zipCode: '33860',
  });
  const [isCompanySaving, setIsCompanySaving] = useState(false);

  // Integrations state
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isLoadingIntegrations, setIsLoadingIntegrations] = useState(false);

  // Initialize profile form when user loads
  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  // Fetch company settings for logo
  useEffect(() => {
    const fetchCompanySettings = async () => {
      try {
        const settings = await api.company.get();
        if (settings.logo) {
          setCompanyLogo(settings.logo);
        }
      } catch (error) {
        console.error('Failed to fetch company settings:', error);
      }
    };
    fetchCompanySettings();
  }, []);

  // Fetch payment methods when billing tab is active
  const fetchPaymentMethods = async () => {
    setIsLoadingPaymentMethods(true);
    try {
      const methods = await api.billing.getPaymentMethods();
      setPaymentMethods(methods);
    } catch (error) {
      console.error('Failed to fetch payment methods:', error);
    } finally {
      setIsLoadingPaymentMethods(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'billing') {
      fetchPaymentMethods();
    }
  }, [activeTab]);

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

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

  const handleProfileSave = async () => {
    if (!user) return;

    setIsProfileSaving(true);
    try {
      await api.customers.update(user.id, {
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        email: profileForm.email,
        phone: profileForm.phone,
      });
      toast.success('Profile updated successfully');
      // Update the user in the store
      useAuthStore.setState({
        user: {
          ...user,
          ...profileForm
        }
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsProfileSaving(false);
    }
  };

  const handleCompanySave = async () => {
    setIsCompanySaving(true);
    try {
      await api.company.update({
        email: companyForm.email,
        phone: companyForm.phone,
        address: companyForm.street,
        city: companyForm.city,
        state: companyForm.state,
        zipCode: companyForm.zipCode,
      });
      toast.success('Company settings updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update company settings');
    } finally {
      setIsCompanySaving(false);
    }
  };

  const handlePasswordChange = async () => {
    setPasswordError(null);
    setPasswordSuccess(false);

    // Validation
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('Please fill in all fields');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setPasswordLoading(true);
    try {
      await api.auth.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordSuccess(true);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password changed successfully');
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
      toast.error('Please select a valid image file (JPG, PNG, or GIF)');
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const result = await api.customers.uploadAvatar(user.id, file);
      updateAvatar(result.avatarUrl);
      toast.success('Avatar updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload avatar');
    } finally {
      setIsUploadingAvatar(false);
      // Reset the input so the same file can be selected again
      if (avatarInputRef.current) {
        avatarInputRef.current.value = '';
      }
    }
  };

  const handleDeletePaymentMethod = (method: PaymentMethod) => {
    setPaymentMethodToDelete(method);
    setIsDeletePaymentModalOpen(true);
  };

  // Fetch integrations from API
  const fetchIntegrations = async () => {
    setIsLoadingIntegrations(true);
    try {
      const items = await api.integrations.list();
      setIntegrations(items);
    } catch (error: any) {
      console.error('Failed to fetch integrations:', error);
      toast.error(error.message || 'Failed to load integrations');
    } finally {
      setIsLoadingIntegrations(false);
    }
  };

  // Load integrations when the integrations tab is active
  useEffect(() => {
    if (activeTab === 'integrations') {
      fetchIntegrations();
    }
  }, [activeTab]);

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'].includes(file.type)) {
      toast.error('Please select a valid image file (JPG, PNG, SVG, or WebP)');
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    setIsUploadingLogo(true);
    try {
      const result = await api.company.uploadLogo(file);
      setCompanyLogo(result.logoUrl);
      toast.success('Logo updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload logo');
    } finally {
      setIsUploadingLogo(false);
      // Reset the input so the same file can be selected again
      if (logoInputRef.current) {
        logoInputRef.current.value = '';
      }
    }
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
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt="Avatar"
                    className="w-20 h-20 rounded-2xl object-cover shadow-lg shadow-orange-200"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-2xl font-semibold shadow-lg shadow-orange-200">
                    {user ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}` : '??'}
                  </div>
                )}
                <div>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className="px-5 py-2.5 bg-primary text-white rounded-xl shadow-lg shadow-orange-200 hover:shadow-orange-300 hover:bg-orange-600 transition-all duration-300 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isUploadingAvatar ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      'Change Avatar'
                    )}
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
                    value={profileForm.firstName}
                    onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={profileForm.lastName}
                    onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
                <button
                  onClick={() => {
                    if (user) {
                      setProfileForm({
                        firstName: user.firstName || '',
                        lastName: user.lastName || '',
                        email: user.email || '',
                        phone: user.phone || '',
                      });
                    }
                  }}
                  className="px-5 py-2.5 text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProfileSave}
                  disabled={isProfileSaving}
                  className="px-5 py-2.5 bg-primary text-white rounded-xl shadow-lg shadow-orange-200 hover:shadow-orange-300 hover:bg-orange-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isProfileSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
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

              {/* Success Message */}
              {passwordSuccess && (
                <div className="mb-6 flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm">Password changed successfully!</p>
                </div>
              )}

              {/* Error Message */}
              {passwordError && (
                <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm">{passwordError}</p>
                </div>
              )}

              <div className="space-y-6 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  />
                  <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  />
                </div>

                <button
                  onClick={handlePasswordChange}
                  disabled={passwordLoading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl shadow-lg shadow-orange-200 hover:shadow-orange-300 hover:bg-orange-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {passwordLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Password'
                  )}
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
                  <button
                    onClick={() => setIsUpgradePlanModalOpen(true)}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium transition-colors"
                  >
                    Upgrade Plan
                  </button>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Payment Methods</h2>
                  <button
                    onClick={() => setIsAddPaymentModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-primary border border-orange-200 rounded-xl hover:bg-orange-50 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Method
                  </button>
                </div>

                <div className="space-y-3">
                  {isLoadingPaymentMethods ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    </div>
                  ) : paymentMethods.length === 0 ? (
                    <div className="text-center py-8">
                      <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No payment methods added yet</p>
                      <button
                        onClick={() => setIsAddPaymentModalOpen(true)}
                        className="mt-3 text-sm text-primary hover:text-orange-600"
                      >
                        Add your first payment method
                      </button>
                    </div>
                  ) : (
                    paymentMethods.map((method) => (
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
                            {method.brand.toLowerCase() === 'visa' ? (
                              <span className="text-blue-600 font-bold text-sm">VISA</span>
                            ) : method.brand.toLowerCase() === 'mastercard' ? (
                              <span className="text-red-500 font-bold text-xs">MC</span>
                            ) : method.brand.toLowerCase() === 'amex' ? (
                              <span className="text-blue-500 font-bold text-xs">AMEX</span>
                            ) : (
                              <CreditCard className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              •••• •••• •••• {method.last4}
                            </p>
                            <p className="text-sm text-gray-500">Expires {method.expMonth}/{method.expYear}</p>
                          </div>
                          {method.isDefault && (
                            <span className="px-2 py-0.5 bg-orange-100 text-primary text-xs font-medium rounded-full">
                              Default
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeletePaymentMethod(method)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
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
                  {companyLogo ? (
                    <img
                      src={companyLogo}
                      alt="Company Logo"
                      className="w-24 h-24 rounded-2xl object-contain bg-white border border-gray-200 shadow-lg shadow-orange-200"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-orange-200">
                      GA
                    </div>
                  )}
                  <div>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/svg+xml,image/webp"
                      className="hidden"
                      onChange={handleLogoChange}
                    />
                    <button
                      onClick={() => logoInputRef.current?.click()}
                      disabled={isUploadingLogo}
                      className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl shadow-lg shadow-orange-200 hover:shadow-orange-300 hover:bg-orange-600 transition-all duration-300 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUploadingLogo ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Upload Logo
                        </>
                      )}
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
                      defaultValue="59-2586252"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Website
                    </label>
                    <input
                      type="url"
                      defaultValue="https://gemautosalesinc.com"
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
                      value={companyForm.email}
                      onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone className="w-4 h-4 inline mr-1" /> Phone
                    </label>
                    <input
                      type="tel"
                      value={companyForm.phone}
                      onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="w-4 h-4 inline mr-1" /> Address
                    </label>
                    <input
                      type="text"
                      value={companyForm.street}
                      onChange={(e) => setCompanyForm({ ...companyForm, street: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all mb-3"
                    />
                    <div className="grid grid-cols-3 gap-3">
                      <input
                        type="text"
                        value={companyForm.city}
                        onChange={(e) => setCompanyForm({ ...companyForm, city: e.target.value })}
                        placeholder="City"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                      />
                      <input
                        type="text"
                        value={companyForm.state}
                        onChange={(e) => setCompanyForm({ ...companyForm, state: e.target.value })}
                        placeholder="State"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                      />
                      <input
                        type="text"
                        value={companyForm.zipCode}
                        onChange={(e) => setCompanyForm({ ...companyForm, zipCode: e.target.value })}
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
                    { day: 'Monday', hours: '10:00 AM – 6:00 PM' },
                    { day: 'Tuesday', hours: '10:00 AM – 12:30 PM' },
                    { day: 'Wednesday', hours: '10:00 AM – 6:00 PM' },
                    { day: 'Thursday', hours: '10:00 AM – 6:00 PM' },
                    { day: 'Friday', hours: '10:00 AM – 6:00 PM' },
                    { day: 'Saturday', hours: '11:00 AM – 3:00 PM' },
                    { day: 'Sunday', hours: 'Closed' },
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
                  <button
                    onClick={() => setCompanyForm({
                      email: 'gemautosalesinc@gmail.com',
                      phone: '863-277-7879',
                      street: '1311 E CANAL ST',
                      city: 'Mulberry',
                      state: 'FL',
                      zipCode: '33860',
                    })}
                    className="px-5 py-2.5 text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCompanySave}
                    disabled={isCompanySaving}
                    className="px-5 py-2.5 bg-primary text-white rounded-xl shadow-lg shadow-orange-200 hover:shadow-orange-300 hover:bg-orange-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isCompanySaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
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
                        {integrations.filter((i) => i.isConnected).length}
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
                      <p className="text-2xl font-bold text-gray-900">{integrations.length}</p>
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
                  <button
                    onClick={fetchIntegrations}
                    disabled={isLoadingIntegrations}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-primary border border-orange-200 rounded-xl hover:bg-orange-50 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={cn('w-4 h-4', isLoadingIntegrations && 'animate-spin')} />
                    Refresh
                  </button>
                </div>

                {isLoadingIntegrations ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  </div>
                ) : integrations.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    No integrations available
                  </div>
                ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {integrations.map((integration) => (
                    <div
                      key={integration.id}
                      className={cn(
                        'flex items-center justify-between p-4 rounded-xl border transition-all',
                        integration.isConnected
                          ? 'bg-green-50 border-green-200'
                          : 'bg-gray-50 border-gray-200 hover:border-orange-200'
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center">
                          <Globe className="w-6 h-6 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 capitalize">{integration.provider}</p>
                          <p className="text-sm text-gray-500">
                            {integration.isConnected && integration.connectedAt
                              ? `Connected ${formatDate(new Date(integration.connectedAt))}`
                              : 'Not connected'}
                          </p>
                        </div>
                      </div>
                      {integration.isConnected ? (
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                            <CheckCircle2 className="w-3 h-3" />
                            Connected
                          </span>
                          <button
                            onClick={() => api.integrations.disconnect(integration.provider)}
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Disconnect"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => api.integrations.connect(integration.provider, {})}
                          disabled={!integration.isEnabled}
                          className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl shadow-lg shadow-orange-200 hover:shadow-orange-300 hover:bg-orange-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Connect
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                )}
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

      {/* Payment Method Modals */}
      <AddPaymentMethodModal
        isOpen={isAddPaymentModalOpen}
        onClose={() => setIsAddPaymentModalOpen(false)}
        onSuccess={fetchPaymentMethods}
      />
      <DeletePaymentMethodModal
        isOpen={isDeletePaymentModalOpen}
        onClose={() => {
          setIsDeletePaymentModalOpen(false);
          setPaymentMethodToDelete(null);
        }}
        onSuccess={fetchPaymentMethods}
        paymentMethod={paymentMethodToDelete}
      />

      {/* Upgrade Plan Modal */}
      <UpgradePlanModal
        isOpen={isUpgradePlanModalOpen}
        onClose={() => setIsUpgradePlanModalOpen(false)}
        currentPlan="professional"
      />
    </div>
  );
}
