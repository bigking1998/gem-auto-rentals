import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  Bell,
  Settings,
  User,
  LogOut,
  X,
  Car,
  CreditCard,
  AlertCircle,
  Calendar,
  Shield,
  HelpCircle,
  Loader2,
  Mail,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { api, Notification as ApiNotification, NotificationType } from '@/lib/api';

const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://gemrentalcars.com';

interface HeaderProps {
  onMenuClick: () => void;
  sidebarCollapsed: boolean;
}

interface Notification {
  id: string;
  type: 'booking' | 'payment' | 'alert' | 'system' | 'message' | 'document';
  title: string;
  message: string;
  time: Date;
  read: boolean;
  actionUrl?: string;
}

// Map API notification types to local types
const mapNotificationType = (type: NotificationType): Notification['type'] => {
  if (type.startsWith('BOOKING_')) return 'booking';
  if (type.startsWith('PAYMENT_') || type.startsWith('INVOICE_')) return 'payment';
  if (type.startsWith('DOCUMENT_')) return 'document';
  if (type === 'NEW_MESSAGE') return 'message';
  if (type === 'SYSTEM_ALERT') return 'alert';
  return 'system';
};

// Transform API notification to local format
const transformNotification = (apiNotif: ApiNotification): Notification => ({
  id: apiNotif.id,
  type: mapNotificationType(apiNotif.type),
  title: apiNotif.title,
  message: apiNotif.message,
  time: new Date(apiNotif.createdAt),
  read: !!apiNotif.readAt,
  actionUrl: apiNotif.actionUrl,
});

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'booking':
      return Calendar;
    case 'payment':
      return CreditCard;
    case 'alert':
      return AlertCircle;
    case 'message':
      return Mail;
    case 'document':
      return FileText;
    case 'system':
      return Car;
    default:
      return Bell;
  }
};

const getNotificationColor = (type: Notification['type']) => {
  switch (type) {
    case 'booking':
      return 'bg-accent text-accent-foreground';
    case 'payment':
      return 'bg-green-100 text-green-600';
    case 'alert':
      return 'bg-red-100 text-red-600';
    case 'message':
      return 'bg-accent text-accent-foreground';
    case 'document':
      return 'bg-accent text-accent-foreground';
    case 'system':
      return 'bg-gray-100 text-gray-600';
    default:
      return 'bg-gray-100 text-gray-600';
  }
};

const formatTimeAgo = (date: Date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return formatDate(date);
};

export default function Header({ onMenuClick }: HeaderProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  // Dark mode was removed: the admin has no `dark:` variants and 130+ literal
  // `bg-white` surfaces, so enabling `.dark` only flipped the CSS custom
  // properties and dropped gold text to ~1.7:1 on still-white cards. Clear any
  // flag left over from the old toggle so nobody is stuck in the broken state.
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    localStorage.removeItem('darkMode');
  }, []);

  const notificationsRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    setIsLoadingNotifications(true);
    try {
      const { items } = await api.notifications.list({ limit: 20 });
      setNotifications(items.map(transformNotification));
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setIsLoadingNotifications(false);
    }
  }, []);

  // Fetch notifications on mount and when dropdown opens
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Refresh notifications when dropdown opens
  useEffect(() => {
    if (notificationsOpen) {
      fetchNotifications();
    }
  }, [notificationsOpen, fetchNotifications]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setSettingsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id: string) => {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
      await api.notifications.markAsRead(id);
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      // Revert on error
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: false } : n)));
    }
  };

  const markAllAsRead = async () => {
    // Optimistic update
    const previousNotifications = notifications;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await api.notifications.markAllAsRead();
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
      // Revert on error
      setNotifications(previousNotifications);
    }
  };

  const removeNotification = async (id: string) => {
    // Optimistic update
    const previousNotifications = notifications;
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await api.notifications.delete(id);
    } catch (err) {
      console.error('Failed to delete notification:', err);
      // Revert on error
      setNotifications(previousNotifications);
    }
  };

  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="rounded-lg p-2 transition-colors hover:bg-gray-100 lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5 text-gray-600" />
          </button>

          {/* Global search removed — the input had no onChange/onSubmit and the
              ⌘K hint had no key listener anywhere in the app. Each page has its
              own working search box. */}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Back to Site */}
          <a
            href={SITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary-ink hover:bg-accent flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Site</span>
          </a>

          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => {
                setNotificationsOpen(!notificationsOpen);
                setSettingsOpen(false);
              }}
              className={cn(
                'relative rounded-lg p-2 transition-colors',
                notificationsOpen
                  ? 'bg-accent text-accent-foreground'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {notificationsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-80 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl sm:w-96"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                      {unreadCount > 0 && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-primary-ink text-xs font-medium hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  {/* Notifications List */}
                  <div className="max-h-96 overflow-y-auto">
                    {isLoadingNotifications ? (
                      <div className="p-8 text-center">
                        <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin text-gray-400" />
                        <p className="text-sm text-gray-500">Loading notifications...</p>
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <Bell className="mx-auto mb-2 h-10 w-10 text-gray-300" />
                        <p className="text-sm text-gray-500">No notifications</p>
                      </div>
                    ) : (
                      notifications.map((notification) => {
                        const Icon = getNotificationIcon(notification.type);
                        return (
                          <div
                            key={notification.id}
                            className={cn(
                              'group flex cursor-pointer items-start gap-3 p-4 transition-colors hover:bg-gray-50',
                              !notification.read && 'bg-accent'
                            )}
                            onClick={() => markAsRead(notification.id)}
                          >
                            <div
                              className={cn(
                                'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl',
                                getNotificationColor(notification.type)
                              )}
                            >
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <p
                                  className={cn(
                                    'text-sm',
                                    notification.read
                                      ? 'text-gray-700'
                                      : 'font-medium text-gray-900'
                                  )}
                                >
                                  {notification.title}
                                </p>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeNotification(notification.id);
                                  }}
                                  className="rounded p-1 opacity-0 transition-all hover:bg-gray-200 group-hover:opacity-100"
                                >
                                  <X className="h-3 w-3 text-gray-400" />
                                </button>
                              </div>
                              <p className="mt-0.5 truncate text-xs text-gray-500">
                                {notification.message}
                              </p>
                              <p className="mt-1 text-xs text-gray-400">
                                {formatTimeAgo(notification.time)}
                              </p>
                            </div>
                            {!notification.read && (
                              <div className="bg-primary mt-2 h-2 w-2 flex-shrink-0 rounded-full" />
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Footer */}
                  <div className="border-t border-gray-100 bg-gray-50 p-3">
                    <button
                      onClick={() => {
                        setNotificationsOpen(false);
                        navigate('/settings?tab=notifications');
                      }}
                      className="text-primary-ink w-full py-2 text-sm font-medium hover:underline"
                    >
                      View notification settings
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Settings */}
          <div className="relative" ref={settingsRef}>
            <button
              onClick={() => {
                setSettingsOpen(!settingsOpen);
                setNotificationsOpen(false);
              }}
              className={cn(
                'rounded-lg p-2 transition-colors',
                settingsOpen
                  ? 'bg-accent text-accent-foreground'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              <Settings className="h-5 w-5" />
            </button>

            <AnimatePresence>
              {settingsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl"
                >
                  {/* Header */}
                  <div className="border-b border-gray-100 px-4 py-3">
                    <p className="text-sm font-semibold text-gray-900">Quick Settings</p>
                  </div>

                  {/* Menu Items */}
                  <div className="p-2">
                    <button
                      onClick={() => {
                        setSettingsOpen(false);
                        navigate('/settings');
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-gray-100"
                    >
                      <div className="bg-accent flex h-8 w-8 items-center justify-center rounded-lg">
                        <User className="text-accent-foreground h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Profile Settings</p>
                        <p className="text-xs text-gray-500">Manage your account</p>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setSettingsOpen(false);
                        navigate('/security');
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-gray-100"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">
                        <Shield className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Security</p>
                        <p className="text-xs text-gray-500">2FA & sessions</p>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setSettingsOpen(false);
                        navigate('/help');
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-gray-100"
                    >
                      <div className="bg-accent flex h-8 w-8 items-center justify-center rounded-lg">
                        <HelpCircle className="text-accent-foreground h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Help Center</p>
                        <p className="text-xs text-gray-500">FAQs & support</p>
                      </div>
                    </button>

                    <a
                      href={SITE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-gray-100"
                      onClick={() => setSettingsOpen(false)}
                    >
                      <div className="bg-accent flex h-8 w-8 items-center justify-center rounded-lg">
                        <ExternalLink className="text-accent-foreground h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Back to Site</p>
                        <p className="text-xs text-gray-500">Visit main website</p>
                      </div>
                    </a>

                    {/* Dark-mode toggle removed — see the comment on the cleanup
                        effect above. Re-add it only once the pages use semantic
                        surface tokens instead of literal bg-white. */}
                  </div>

                  {/* Logout */}
                  <div className="border-t border-gray-100 p-2">
                    <button
                      onClick={async () => {
                        setSettingsOpen(false);
                        await logout();
                        navigate('/login');
                      }}
                      className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-red-50"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100">
                        <LogOut className="h-4 w-4 text-red-600" />
                      </div>
                      <p className="text-sm font-medium text-red-600">Sign Out</p>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Avatar — goes to the profile tab in Settings (previously a no-op button) */}
          <button
            onClick={() => navigate('/settings?tab=profile')}
            aria-label="Open your profile settings"
            className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-gray-100"
          >
            <div className="from-primary-light to-primary-dark text-primary-foreground flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br text-sm font-semibold">
              {user ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}` : '??'}
            </div>
            <span className="hidden text-sm font-medium text-gray-700 lg:block">
              {user ? `${user.firstName} ${user.lastName}` : 'Loading...'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
