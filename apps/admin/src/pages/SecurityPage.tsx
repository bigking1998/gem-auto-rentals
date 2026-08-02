import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  Smartphone,
  Monitor,
  Globe,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  LogOut,
  MapPin,
  Chrome,
  Laptop,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { api, Session as ApiSession, ActivityLog, ApiError } from '@/lib/api';

interface Session {
  id: string;
  device: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  location: string;
  ip: string;
  lastActive: Date;
  isCurrent: boolean;
}

interface LoginActivity {
  id: string;
  device: string;
  browser: string;
  location: string;
  ip: string;
  timestamp: Date;
  status: 'success' | 'failed';
  reason?: string;
}

// Transform API session to local format
function transformSession(apiSession: ApiSession): Session {
  const deviceType =
    apiSession.device?.toLowerCase().includes('mobile') ||
    apiSession.device?.toLowerCase().includes('iphone') ||
    apiSession.device?.toLowerCase().includes('android')
      ? 'mobile'
      : apiSession.device?.toLowerCase().includes('tablet') ||
          apiSession.device?.toLowerCase().includes('ipad')
        ? 'tablet'
        : 'desktop';

  return {
    id: apiSession.id,
    device: apiSession.device || 'Unknown Device',
    deviceType,
    browser: apiSession.browser || 'Unknown Browser',
    location: apiSession.location || 'Unknown Location',
    ip: apiSession.ipAddress || 'Unknown IP',
    lastActive: new Date(apiSession.lastActiveAt),
    isCurrent: apiSession.isCurrent || false,
  };
}

// Transform API activity log to login activity format
function transformActivityToLogin(activity: ActivityLog): LoginActivity | null {
  // Only include login-related activities
  if (!['USER_LOGIN', 'LOGIN_FAILED', 'USER_LOGOUT'].includes(activity.action)) {
    return null;
  }

  const metadata = activity.metadata as Record<string, string> | undefined;

  return {
    id: activity.id,
    device: metadata?.device || 'Unknown Device',
    browser: metadata?.browser || 'Unknown Browser',
    location: metadata?.location || activity.ipAddress || 'Unknown Location',
    ip: activity.ipAddress || 'Unknown IP',
    timestamp: new Date(activity.createdAt),
    status: activity.status === 'SUCCESS' ? 'success' : 'failed',
    reason: activity.errorMessage,
  };
}

const tabs = [
  { id: 'sessions', label: 'Active Sessions', icon: Monitor },
  { id: 'history', label: 'Login History', icon: Clock },
  { id: 'two-factor', label: 'Two-Factor Auth', icon: Smartphone },
];

export default function SecurityPage() {
  const [activeTab, setActiveTab] = useState('sessions');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginActivity[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch sessions from API
  const fetchSessions = useCallback(async () => {
    setIsLoadingSessions(true);
    setError(null);
    try {
      const apiSessions = await api.sessions.list();
      setSessions(apiSessions.map(transformSession));
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
      setError(err instanceof ApiError ? err.message : 'Failed to fetch sessions');
    } finally {
      setIsLoadingSessions(false);
    }
  }, []);

  // Fetch activity/login history from API
  const fetchLoginHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const { data: activities } = await api.activity.list({
        action: 'USER_LOGIN',
        limit: 20,
      });

      // Also fetch failed logins
      const { data: failedLogins } = await api.activity.list({
        action: 'LOGIN_FAILED',
        limit: 20,
      });

      // Combine and sort by date
      const allActivities = [...activities, ...failedLogins]
        .map(transformActivityToLogin)
        .filter((a): a is LoginActivity => a !== null)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 20);

      setLoginHistory(allActivities);
    } catch (err) {
      console.error('Failed to fetch login history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  // Load data when tab changes
  useEffect(() => {
    if (activeTab === 'sessions') {
      fetchSessions();
    } else if (activeTab === 'history') {
      fetchLoginHistory();
    }
  }, [activeTab, fetchSessions, fetchLoginHistory]);

  const handleLogoutSession = async (sessionId: string) => {
    try {
      await api.sessions.revoke(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (err) {
      console.error('Failed to revoke session:', err);
      setError(err instanceof ApiError ? err.message : 'Failed to revoke session');
    }
  };

  const handleLogoutAllOther = async () => {
    try {
      await api.sessions.revokeAll();
      setSessions((prev) => prev.filter((s) => s.isCurrent));
    } catch (err) {
      console.error('Failed to revoke sessions:', err);
      setError(err instanceof ApiError ? err.message : 'Failed to revoke sessions');
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile':
        return Smartphone;
      case 'tablet':
        return Laptop;
      default:
        return Monitor;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-gray-900">Security</h1>
        <p className="text-gray-500">Manage your account security settings</p>
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
                onClick={() => setActiveTab(tab.id)}
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

          {/* Security Status Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-4 hidden rounded-2xl border border-gray-100 bg-white p-4 shadow-sm lg:block"
          >
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-100">
                <Shield className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Security Status</p>
                <p className="text-xs font-medium text-yellow-600">Password only</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <XCircle className="h-4 w-4 text-yellow-500" />
                <span className="text-gray-600">2FA not available yet</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-gray-600">{sessions.length} Active Sessions</span>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex-1"
        >
          {/* Two-Factor Authentication — not implemented yet */}
          {activeTab === 'two-factor' && (
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100">
                  <Smartphone className="h-6 w-6 text-gray-400" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-gray-900">Two-Factor Authentication</h2>
                  <p className="text-sm text-gray-500">
                    An extra verification code on top of your password. This is not built yet — your
                    account is currently protected by your password alone.
                  </p>
                </div>
                <div className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                  Coming soon
                </div>
              </div>

              <div className="mb-6 flex items-start gap-3 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
                <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Two-factor authentication is not active.</p>
                  <p className="mt-1">
                    Until it ships, use a long unique password and review your active sessions and
                    login history regularly.
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled
                title="Two-factor authentication is not available yet"
                className="cursor-not-allowed rounded-xl bg-gray-100 px-5 py-2.5 text-gray-400"
              >
                Enable Two-Factor Authentication
              </button>
            </div>
          )}

          {/* Active Sessions */}
          {activeTab === 'sessions' && (
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Active Sessions</h2>
                  <p className="text-sm text-gray-500">
                    Manage devices where you&apos;re logged in
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={fetchSessions}
                    disabled={isLoadingSessions}
                    className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
                  >
                    <RefreshCw className={cn('h-4 w-4', isLoadingSessions && 'animate-spin')} />
                  </button>
                  {sessions.filter((s) => !s.isCurrent).length > 0 && (
                    <button
                      onClick={handleLogoutAllOther}
                      className="rounded-xl border border-red-200 px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
                    >
                      Log out all other sessions
                    </button>
                  )}
                </div>
              </div>

              {error && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              {isLoadingSessions ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="text-primary-ink h-8 w-8 animate-spin" />
                </div>
              ) : sessions.length === 0 ? (
                <div className="py-12 text-center text-gray-500">No active sessions found</div>
              ) : (
                <div className="space-y-4">
                  {sessions.map((session, index) => {
                    const DeviceIcon = getDeviceIcon(session.deviceType);
                    return (
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={cn(
                          'flex items-center justify-between rounded-xl border p-4',
                          session.isCurrent
                            ? 'border-green-200 bg-green-50'
                            : 'border-gray-200 bg-gray-50'
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={cn(
                              'flex h-12 w-12 items-center justify-center rounded-xl',
                              session.isCurrent ? 'bg-green-100' : 'bg-gray-100'
                            )}
                          >
                            <DeviceIcon
                              className={cn(
                                'h-6 w-6',
                                session.isCurrent ? 'text-green-600' : 'text-gray-600'
                              )}
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900">{session.device}</p>
                              {session.isCurrent && (
                                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                                  Current
                                </span>
                              )}
                            </div>
                            <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Chrome className="h-3 w-3" />
                                {session.browser}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {session.location}
                              </span>
                              <span className="flex items-center gap-1">
                                <Globe className="h-3 w-3" />
                                {session.ip}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-gray-400">
                              Last active:{' '}
                              {session.isCurrent ? 'Now' : formatDate(session.lastActive)}
                            </p>
                          </div>
                        </div>
                        {!session.isCurrent && (
                          <button
                            onClick={() => handleLogoutSession(session.id)}
                            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-100"
                          >
                            <LogOut className="h-4 w-4" />
                            Log out
                          </button>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Login History */}
          {activeTab === 'history' && (
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Login History</h2>
                  <p className="text-sm text-gray-500">Recent sign-in activity on your account</p>
                </div>
                <button
                  onClick={fetchLoginHistory}
                  disabled={isLoadingHistory}
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
                >
                  <RefreshCw className={cn('h-4 w-4', isLoadingHistory && 'animate-spin')} />
                </button>
              </div>

              {isLoadingHistory ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="text-primary-ink h-8 w-8 animate-spin" />
                </div>
              ) : loginHistory.length === 0 ? (
                <div className="py-12 text-center text-gray-500">No login activity found</div>
              ) : (
                <div className="space-y-3">
                  {loginHistory.map((activity, index) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn(
                        'flex items-center justify-between rounded-xl border p-4',
                        activity.status === 'success'
                          ? 'border-gray-200 bg-gray-50'
                          : 'border-red-200 bg-red-50'
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={cn(
                            'flex h-10 w-10 items-center justify-center rounded-lg',
                            activity.status === 'success' ? 'bg-green-100' : 'bg-red-100'
                          )}
                        >
                          {activity.status === 'success' ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">
                              {activity.status === 'success'
                                ? 'Successful login'
                                : 'Failed login attempt'}
                            </p>
                            <span
                              className={cn(
                                'rounded-full px-2 py-0.5 text-xs font-medium',
                                activity.status === 'success'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              )}
                            >
                              {activity.status}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
                            <span>{activity.device}</span>
                            <span>•</span>
                            <span>{activity.browser}</span>
                            <span>•</span>
                            <span>{activity.location}</span>
                          </div>
                          {activity.reason && (
                            <p className="mt-1 flex items-center gap-1 text-sm text-red-600">
                              <AlertTriangle className="h-3 w-3" />
                              {activity.reason}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-900">{formatDate(activity.timestamp)}</p>
                        <p className="text-xs text-gray-500">{activity.ip}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
