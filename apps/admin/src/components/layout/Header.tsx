import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  Search,
  Bell,
  Settings,
  User,
  LogOut,
  Moon,
  Sun,
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
      return 'bg-orange-100 text-orange-600';
    case 'payment':
      return 'bg-green-100 text-green-600';
    case 'alert':
      return 'bg-red-100 text-red-600';
    case 'message':
      return 'bg-blue-100 text-blue-600';
    case 'document':
      return 'bg-indigo-100 text-indigo-600';
    case 'system':
      return 'bg-purple-100 text-purple-600';
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
  const [searchFocused, setSearchFocused] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    // Initialize from localStorage
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true';
    }
    return false;
  });

  // Apply dark mode class to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [darkMode]);

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
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    try {
      await api.notifications.markAsRead(id);
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      // Revert on error
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: false } : n))
      );
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
    <header className="sticky top-0 z-20 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>

          {/* Search */}
          <div
            className={cn(
              'hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg transition-all',
              searchFocused && 'ring-2 ring-primary bg-white'
            )}
          >
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="bg-transparent border-none outline-none text-sm w-48 lg:w-64"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
            <kbd className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 text-xs text-gray-400 bg-white rounded border border-gray-200">
              <span>⌘</span>K
            </kbd>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Back to Site */}
          <a
            href={SITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-primary hover:bg-orange-50 rounded-lg transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
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
                'relative p-2 rounded-lg transition-colors',
                notificationsOpen ? 'bg-orange-100 text-primary' : 'hover:bg-gray-100 text-gray-600'
              )}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
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
                  className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-medium rounded-full">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-primary hover:text-orange-600 font-medium"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  {/* Notifications List */}
                  <div className="max-h-96 overflow-y-auto">
                    {isLoadingNotifications ? (
                      <div className="p-8 text-center">
                        <Loader2 className="w-8 h-8 text-gray-400 mx-auto mb-2 animate-spin" />
                        <p className="text-gray-500 text-sm">Loading notifications...</p>
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <Bell className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">No notifications</p>
                      </div>
                    ) : (
                      notifications.map((notification) => {
                        const Icon = getNotificationIcon(notification.type);
                        return (
                          <div
                            key={notification.id}
                            className={cn(
                              'flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors cursor-pointer group',
                              !notification.read && 'bg-orange-50/50'
                            )}
                            onClick={() => markAsRead(notification.id)}
                          >
                            <div
                              className={cn(
                                'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
                                getNotificationColor(notification.type)
                              )}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className={cn(
                                  'text-sm',
                                  notification.read ? 'text-gray-700' : 'text-gray-900 font-medium'
                                )}>
                                  {notification.title}
                                </p>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeNotification(notification.id);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-all"
                                >
                                  <X className="w-3 h-3 text-gray-400" />
                                </button>
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5 truncate">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {formatTimeAgo(notification.time)}
                              </p>
                            </div>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Footer */}
                  <div className="p-3 border-t border-gray-100 bg-gray-50">
                    <button
                      onClick={() => {
                        setNotificationsOpen(false);
                        navigate('/settings?tab=notifications');
                      }}
                      className="w-full py-2 text-sm text-primary hover:text-orange-600 font-medium"
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
                'p-2 rounded-lg transition-colors',
                settingsOpen ? 'bg-orange-100 text-primary' : 'hover:bg-gray-100 text-gray-600'
              )}
            >
              <Settings className="w-5 h-5" />
            </button>

            <AnimatePresence>
              {settingsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
                >
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">Quick Settings</p>
                  </div>

                  {/* Menu Items */}
                  <div className="p-2">
                    <button
                      onClick={() => {
                        setSettingsOpen(false);
                        navigate('/settings');
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100 transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
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
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100 transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                        <Shield className="w-4 h-4 text-green-600" />
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
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100 transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                        <HelpCircle className="w-4 h-4 text-purple-600" />
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
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100 transition-colors text-left"
                      onClick={() => setSettingsOpen(false)}
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                        <ExternalLink className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Back to Site</p>
                        <p className="text-xs text-gray-500">Visit main website</p>
                      </div>
                    </a>

                    {/* Theme Toggle */}
                    <div className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                          {darkMode ? (
                            <Moon className="w-4 h-4 text-gray-600" />
                          ) : (
                            <Sun className="w-4 h-4 text-amber-500" />
                          )}
                        </div>
                        <p className="text-sm font-medium text-gray-900">Dark Mode</p>
                      </div>
                      <button
                        onClick={() => setDarkMode(!darkMode)}
                        className={cn(
                          'relative w-10 h-5 rounded-full transition-colors',
                          darkMode ? 'bg-primary' : 'bg-gray-300'
                        )}
                      >
                        <div
                          className={cn(
                            'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform',
                            darkMode ? 'translate-x-5' : 'translate-x-0.5'
                          )}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Logout */}
                  <div className="p-2 border-t border-gray-100">
                    <button
                      onClick={async () => {
                        setSettingsOpen(false);
                        await logout();
                        navigate('/login');
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 transition-colors text-left group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                        <LogOut className="w-4 h-4 text-red-600" />
                      </div>
                      <p className="text-sm font-medium text-red-600">Sign Out</p>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Avatar */}
          <button className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-sm font-semibold">
              {user ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}` : '??'}
            </div>
            <span className="hidden lg:block text-sm font-medium text-gray-700">
              {user ? `${user.firstName} ${user.lastName}` : 'Loading...'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
