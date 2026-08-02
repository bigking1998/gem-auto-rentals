import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User,
  Bell,
  Lock,
  Building,
  Globe,
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
import { cn, formatDate } from '@/lib/utils';
import { api, Integration, CompanySettings, OperatingHoursDay } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

const WEEK_DAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

const DAY_LABELS: Record<string, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

const EMPTY_OPERATING_HOURS: Record<string, OperatingHoursDay> = Object.fromEntries(
  WEEK_DAYS.map((day) => [day, { open: '09:00', close: '17:00', closed: false }])
);

const tabs = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'company', label: 'Company', icon: Building },
  { id: 'integrations', label: 'Integrations', icon: Globe },
];

export default function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const validTabs = ['profile', 'notifications', 'security', 'company', 'integrations'];
  const initialTab = tabFromUrl && validTabs.includes(tabFromUrl) ? tabFromUrl : 'profile';
  const [activeTab, setActiveTab] = useState(initialTab);

  // Get user from auth store
  const { user, updateAvatar } = useAuthStore();
  // PUT /api/settings/company is authorize('ADMIN') on the server.
  const isCompanyEditor = user?.role === 'ADMIN';

  // Avatar upload state
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Logo upload state
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [isProfileSaving, setIsProfileSaving] = useState(false);

  // Company settings form state — seeded from GET /api/settings/company, never hardcoded.
  const [companyForm, setCompanyForm] = useState({
    companyName: '',
    companyEmail: '',
    companyPhone: '',
    companyAddress: '',
  });
  const [operatingHours, setOperatingHours] =
    useState<Record<string, OperatingHoursDay>>(EMPTY_OPERATING_HOURS);
  const [isCompanySaving, setIsCompanySaving] = useState(false);
  const [isLoadingCompany, setIsLoadingCompany] = useState(true);

  // Integrations state
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isLoadingIntegrations, setIsLoadingIntegrations] = useState(false);
  const [integrationBusy, setIntegrationBusy] = useState<string | null>(null);

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

  // Apply a settings payload from the server to local form state
  const applyCompanySettings = (settings: CompanySettings) => {
    setCompanyLogo(settings.companyLogo || null);
    setCompanyForm({
      companyName: settings.companyName || '',
      companyEmail: settings.companyEmail || '',
      companyPhone: settings.companyPhone || '',
      companyAddress: settings.companyAddress || '',
    });
    setOperatingHours({
      ...EMPTY_OPERATING_HOURS,
      ...(settings.operatingHours || {}),
    });
  };

  // Fetch company settings (logo, contact details, operating hours)
  const fetchCompanySettings = async () => {
    setIsLoadingCompany(true);
    try {
      const settings = await api.company.get();
      applyCompanySettings(settings);
    } catch (error) {
      console.error('Failed to fetch company settings:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load company settings');
    } finally {
      setIsLoadingCompany(false);
    }
  };

  useEffect(() => {
    fetchCompanySettings();
    // Runs once on mount; fetchCompanySettings only touches setState.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    // One-way URL -> state sync: only re-run when the URL tab param changes.
    // validTabs is a render-scoped constant and activeTab is only read as a guard.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          ...profileForm,
        },
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsProfileSaving(false);
    }
  };

  const handleCompanySave = async () => {
    setIsCompanySaving(true);
    try {
      const updated = await api.company.update({
        companyName: companyForm.companyName,
        companyEmail: companyForm.companyEmail || null,
        companyPhone: companyForm.companyPhone || null,
        companyAddress: companyForm.companyAddress || null,
        operatingHours,
      });
      applyCompanySettings(updated);
      toast.success('Company settings updated successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update company settings');
    } finally {
      setIsCompanySaving(false);
    }
  };

  const handlePasswordChange = async () => {
    setPasswordError(null);
    setPasswordSuccess(false);

    // Validation
    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
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
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to change password');
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
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload avatar');
    } finally {
      setIsUploadingAvatar(false);
      // Reset the input so the same file can be selected again
      if (avatarInputRef.current) {
        avatarInputRef.current.value = '';
      }
    }
  };

  // Fetch integrations from API
  const fetchIntegrations = async () => {
    setIsLoadingIntegrations(true);
    try {
      const items = await api.integrations.list();
      setIntegrations(items);
    } catch (error) {
      console.error('Failed to fetch integrations:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load integrations');
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

  // These were fire-and-forget before: not awaited, no error handling, no refetch.
  const handleDisconnectIntegration = async (provider: Integration['provider']) => {
    setIntegrationBusy(provider);
    try {
      await api.integrations.disconnect(provider);
      toast.success(`${provider} disconnected`);
      await fetchIntegrations();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Failed to disconnect ${provider}`);
    } finally {
      setIntegrationBusy(null);
    }
  };

  const handleConnectIntegration = async (provider: Integration['provider']) => {
    setIntegrationBusy(provider);
    try {
      // No credentials form exists yet, so the server will reject key-based
      // providers. The error is surfaced instead of being swallowed.
      await api.integrations.connect(provider, {});
      toast.success(`${provider} connected`);
      await fetchIntegrations();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Failed to connect ${provider}`);
    } finally {
      setIntegrationBusy(null);
    }
  };

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
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload logo');
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
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500">Manage your account and preferences</p>
      </motion.div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="flex-shrink-0 lg:w-56"
        >
          <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-gray-100 bg-white p-3 shadow-sm lg:flex-col lg:overflow-visible">
            {tabs.map((tab, index) => (
              <motion.button
                key={tab.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + index * 0.05 }}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  'flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200',
                  activeTab === tab.id
                    ? 'text-primary-ink bg-accent shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50'
                )}
              >
                <tab.icon className="h-5 w-5" />
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
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg">
              <h2 className="mb-6 text-lg font-semibold text-gray-900">Profile Settings</h2>

              <div className="mb-8 flex items-center gap-6">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt="Avatar"
                    className="shadow-primary/20 h-20 w-20 rounded-2xl object-cover shadow-lg"
                  />
                ) : (
                  <div className="from-primary-light to-primary-dark text-primary-foreground shadow-primary/20 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br text-2xl font-semibold shadow-lg">
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
                    className="bg-primary text-primary-foreground shadow-primary/20 hover:bg-primary-dark hover:shadow-primary/30 flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium shadow-lg transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isUploadingAvatar ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      'Change Avatar'
                    )}
                  </button>
                  <p className="mt-2 text-sm text-gray-500">JPG, GIF or PNG. Max size 2MB.</p>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">First Name</label>
                  <input
                    type="text"
                    value={profileForm.firstName}
                    onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                    className="focus:ring-primary w-full rounded-xl border border-gray-200 px-4 py-2.5 transition-all focus:outline-none focus:ring-2"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Last Name</label>
                  <input
                    type="text"
                    value={profileForm.lastName}
                    onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                    className="focus:ring-primary w-full rounded-xl border border-gray-200 px-4 py-2.5 transition-all focus:outline-none focus:ring-2"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="focus:ring-primary w-full rounded-xl border border-gray-200 px-4 py-2.5 transition-all focus:outline-none focus:ring-2"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="focus:ring-primary w-full rounded-xl border border-gray-200 px-4 py-2.5 transition-all focus:outline-none focus:ring-2"
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3 border-t border-gray-100 pt-6">
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
                  className="rounded-xl border border-gray-200 px-5 py-2.5 text-gray-700 transition-all hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProfileSave}
                  disabled={isProfileSaving}
                  className="bg-primary text-primary-foreground shadow-primary/20 hover:bg-primary-dark hover:shadow-primary/30 flex items-center gap-2 rounded-xl px-5 py-2.5 shadow-lg transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isProfileSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
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
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg">
              <h2 className="mb-6 text-lg font-semibold text-gray-900">Notification Preferences</h2>

              <div className="space-y-4">
                {[
                  {
                    label: 'New booking notifications',
                    description: 'Receive alerts when a new booking is made',
                  },
                  {
                    label: 'Booking updates',
                    description: 'Get notified about booking status changes',
                  },
                  {
                    label: 'Payment confirmations',
                    description: 'Receive payment receipts and confirmations',
                  },
                  {
                    label: 'Vehicle maintenance alerts',
                    description: 'Get reminders for scheduled maintenance',
                  },
                  { label: 'Weekly reports', description: 'Receive weekly performance summary' },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-xl bg-gray-50/50 p-4 transition-colors hover:bg-gray-50"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{item.label}</p>
                      <p className="text-sm text-gray-500">{item.description}</p>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input type="checkbox" defaultChecked className="peer sr-only" />
                      <div className="peer-checked:bg-primary peer-focus:ring-primary peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg">
              <h2 className="mb-6 text-lg font-semibold text-gray-900">Security Settings</h2>

              {/* Success Message */}
              {passwordSuccess && (
                <div className="mb-6 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-green-700">
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                  <p className="text-sm">Password changed successfully!</p>
                </div>
              )}

              {/* Error Message */}
              {passwordError && (
                <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <p className="text-sm">{passwordError}</p>
                </div>
              )}

              <div className="max-w-md space-y-6">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                    }
                    className="focus:ring-primary w-full rounded-xl border border-gray-200 px-4 py-2.5 transition-all focus:outline-none focus:ring-2"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                    }
                    className="focus:ring-primary w-full rounded-xl border border-gray-200 px-4 py-2.5 transition-all focus:outline-none focus:ring-2"
                  />
                  <p className="mt-1 text-xs text-gray-500">Must be at least 8 characters</p>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                    }
                    className="focus:ring-primary w-full rounded-xl border border-gray-200 px-4 py-2.5 transition-all focus:outline-none focus:ring-2"
                  />
                </div>

                <button
                  onClick={handlePasswordChange}
                  disabled={passwordLoading}
                  className="bg-primary text-primary-foreground shadow-primary/20 hover:bg-primary-dark hover:shadow-primary/30 flex items-center gap-2 rounded-xl px-5 py-2.5 shadow-lg transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {passwordLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Password'
                  )}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'company' && (
            <div className="space-y-6">
              {/* Company Logo & Name */}
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h2 className="mb-6 text-lg font-semibold text-gray-900">Company Profile</h2>

                <div className="mb-8 flex items-start gap-6">
                  {companyLogo ? (
                    <img
                      src={companyLogo}
                      alt="Company Logo"
                      className="shadow-primary/20 h-24 w-24 rounded-2xl border border-gray-200 bg-white object-contain shadow-lg"
                    />
                  ) : (
                    <div className="from-primary-light to-primary-dark text-primary-foreground shadow-primary/20 flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br text-3xl font-bold shadow-lg">
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
                      className="bg-primary text-primary-foreground shadow-primary/20 hover:bg-primary-dark hover:shadow-primary/30 flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium shadow-lg transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isUploadingLogo ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          Upload Logo
                        </>
                      )}
                    </button>
                    <p className="mt-2 text-sm text-gray-500">PNG, JPG or SVG. Max size 2MB.</p>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Company Name
                    </label>
                    <input
                      type="text"
                      value={companyForm.companyName}
                      onChange={(e) =>
                        setCompanyForm({ ...companyForm, companyName: e.target.value })
                      }
                      disabled={isLoadingCompany}
                      className="focus:ring-primary w-full rounded-xl border border-gray-200 px-4 py-2.5 transition-all focus:outline-none focus:ring-2 disabled:bg-gray-50"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h2 className="mb-6 text-lg font-semibold text-gray-900">Contact Information</h2>

                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      <Mail className="mr-1 inline h-4 w-4" /> Email
                    </label>
                    <input
                      type="email"
                      value={companyForm.companyEmail}
                      onChange={(e) =>
                        setCompanyForm({ ...companyForm, companyEmail: e.target.value })
                      }
                      disabled={isLoadingCompany}
                      className="focus:ring-primary w-full rounded-xl border border-gray-200 px-4 py-2.5 transition-all focus:outline-none focus:ring-2 disabled:bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      <Phone className="mr-1 inline h-4 w-4" /> Phone
                    </label>
                    <input
                      type="tel"
                      value={companyForm.companyPhone}
                      onChange={(e) =>
                        setCompanyForm({ ...companyForm, companyPhone: e.target.value })
                      }
                      disabled={isLoadingCompany}
                      className="focus:ring-primary w-full rounded-xl border border-gray-200 px-4 py-2.5 transition-all focus:outline-none focus:ring-2 disabled:bg-gray-50"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      <MapPin className="mr-1 inline h-4 w-4" /> Address
                    </label>
                    <input
                      type="text"
                      value={companyForm.companyAddress}
                      onChange={(e) =>
                        setCompanyForm({ ...companyForm, companyAddress: e.target.value })
                      }
                      disabled={isLoadingCompany}
                      placeholder="Street, City, State ZIP"
                      className="focus:ring-primary w-full rounded-xl border border-gray-200 px-4 py-2.5 transition-all focus:outline-none focus:ring-2 disabled:bg-gray-50"
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      Stored as a single line. Include city, state and ZIP.
                    </p>
                  </div>
                </div>
              </div>

              {/* Operating Hours */}
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h2 className="mb-6 text-lg font-semibold text-gray-900">
                  <Clock className="mr-2 inline h-5 w-5" />
                  Operating Hours
                </h2>

                <div className="space-y-3">
                  {WEEK_DAYS.map((day) => {
                    const schedule = operatingHours[day] ?? EMPTY_OPERATING_HOURS[day];
                    return (
                      <div
                        key={day}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-gray-50 p-4"
                      >
                        <span className="font-medium text-gray-900">{DAY_LABELS[day]}</span>
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-2 text-sm text-gray-600">
                            <input
                              type="checkbox"
                              checked={schedule.closed}
                              disabled={isLoadingCompany}
                              onChange={(e) =>
                                setOperatingHours((prev) => ({
                                  ...prev,
                                  [day]: { ...schedule, closed: e.target.checked },
                                }))
                              }
                              className="accent-primary h-4 w-4 rounded border-gray-300"
                            />
                            Closed
                          </label>
                          <input
                            type="time"
                            value={schedule.open}
                            disabled={isLoadingCompany || schedule.closed}
                            onChange={(e) =>
                              setOperatingHours((prev) => ({
                                ...prev,
                                [day]: { ...schedule, open: e.target.value },
                              }))
                            }
                            aria-label={`${DAY_LABELS[day]} opening time`}
                            className="focus:ring-primary rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 disabled:bg-gray-100 disabled:text-gray-400"
                          />
                          <span className="text-sm text-gray-400">to</span>
                          <input
                            type="time"
                            value={schedule.close}
                            disabled={isLoadingCompany || schedule.closed}
                            onChange={(e) =>
                              setOperatingHours((prev) => ({
                                ...prev,
                                [day]: { ...schedule, close: e.target.value },
                              }))
                            }
                            aria-label={`${DAY_LABELS[day]} closing time`}
                            className="focus:ring-primary rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 disabled:bg-gray-100 disabled:text-gray-400"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {!isCompanyEditor && (
                  <p className="mt-6 flex items-center gap-2 rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    Only an administrator can change company settings.
                  </p>
                )}

                <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-6">
                  <button
                    onClick={fetchCompanySettings}
                    disabled={isCompanySaving || isLoadingCompany}
                    className="rounded-xl border border-gray-200 px-5 py-2.5 text-gray-700 transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCompanySave}
                    disabled={isCompanySaving || isLoadingCompany || !isCompanyEditor}
                    className="bg-primary text-primary-foreground shadow-primary/20 hover:bg-primary-dark hover:shadow-primary/30 flex items-center gap-2 rounded-xl px-5 py-2.5 shadow-lg transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isCompanySaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
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
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
                      <Zap className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {integrations.filter((i) => i.isConnected).length}
                      </p>
                      <p className="text-sm text-gray-500">Connected</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                      <Globe className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{integrations.length}</p>
                      <p className="text-sm text-gray-500">Available</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="bg-accent flex h-10 w-10 items-center justify-center rounded-xl">
                      <RefreshCw className="text-primary-ink h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">Live</p>
                      <p className="text-sm text-gray-500">Sync Status</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Integrations List */}
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Available Integrations</h2>
                  <button
                    onClick={fetchIntegrations}
                    disabled={isLoadingIntegrations}
                    className="text-primary-ink border-primary hover:bg-accent flex items-center gap-2 rounded-xl border px-4 py-2 text-sm transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={cn('h-4 w-4', isLoadingIntegrations && 'animate-spin')} />
                    Refresh
                  </button>
                </div>

                {isLoadingIntegrations ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="text-primary-ink h-8 w-8 animate-spin" />
                  </div>
                ) : integrations.length === 0 ? (
                  <div className="py-12 text-center text-gray-500">No integrations available</div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {integrations.map((integration) => (
                      <div
                        key={integration.id}
                        className={cn(
                          'flex items-center justify-between rounded-xl border p-4 transition-all',
                          integration.isConnected
                            ? 'border-green-200 bg-green-50'
                            : 'hover:border-primary border-gray-200 bg-gray-50'
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-gray-200 bg-white">
                            <Globe className="h-6 w-6 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-medium capitalize text-gray-900">
                              {integration.provider}
                            </p>
                            <p className="text-sm text-gray-500">
                              {integration.isConnected && integration.connectedAt
                                ? `Connected ${formatDate(new Date(integration.connectedAt))}`
                                : 'Not connected'}
                            </p>
                          </div>
                        </div>
                        {integration.isConnected ? (
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                              <CheckCircle2 className="h-3 w-3" />
                              Connected
                            </span>
                            <button
                              onClick={() => handleDisconnectIntegration(integration.provider)}
                              disabled={integrationBusy === integration.provider}
                              className="rounded-lg p-2 text-red-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                              title="Disconnect"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleConnectIntegration(integration.provider)}
                            disabled={
                              !integration.isEnabled || integrationBusy === integration.provider
                            }
                            className="bg-primary text-primary-foreground shadow-primary/20 hover:bg-primary-dark hover:shadow-primary/30 rounded-xl px-4 py-2 text-sm font-medium shadow-lg transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Connect
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
