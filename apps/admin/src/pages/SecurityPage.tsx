import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  Smartphone,
  Key,
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
  QrCode,
  Copy,
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
  const deviceType = apiSession.device?.toLowerCase().includes('mobile') || apiSession.device?.toLowerCase().includes('iphone') || apiSession.device?.toLowerCase().includes('android')
    ? 'mobile'
    : apiSession.device?.toLowerCase().includes('tablet') || apiSession.device?.toLowerCase().includes('ipad')
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
  { id: 'two-factor', label: 'Two-Factor Auth', icon: Smartphone },
  { id: 'sessions', label: 'Active Sessions', icon: Monitor },
  { id: 'history', label: 'Login History', icon: Clock },
];

export default function SecurityPage() {
  const [activeTab, setActiveTab] = useState('two-factor');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginActivity[]>([]);
  const [backupCodes] = useState(['ABC12-DEF34', 'GHI56-JKL78', 'MNO90-PQR12', 'STU34-VWX56']);
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

  const handleEnable2FA = () => {
    setShowSetup(true);
  };

  const handleVerify2FA = () => {
    if (verificationCode.length === 6) {
      setTwoFactorEnabled(true);
      setShowSetup(false);
      setVerificationCode('');
    }
  };

  const handleDisable2FA = () => {
    if (window.confirm('Are you sure you want to disable two-factor authentication? This will make your account less secure.')) {
      setTwoFactorEnabled(false);
    }
  };

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
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-gray-900">Security</h1>
        <p className="text-gray-500">Manage your account security settings</p>
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
                onClick={() => setActiveTab(tab.id)}
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

          {/* Security Status Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="hidden lg:block mt-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center',
                twoFactorEnabled ? 'bg-green-100' : 'bg-yellow-100'
              )}>
                <Shield className={cn(
                  'w-5 h-5',
                  twoFactorEnabled ? 'text-green-600' : 'text-yellow-600'
                )} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Security Status</p>
                <p className={cn(
                  'text-xs font-medium',
                  twoFactorEnabled ? 'text-green-600' : 'text-yellow-600'
                )}>
                  {twoFactorEnabled ? 'Strong' : 'Moderate'}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                {twoFactorEnabled ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-yellow-500" />
                )}
                <span className="text-gray-600">2FA {twoFactorEnabled ? 'Enabled' : 'Disabled'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
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
          {/* Two-Factor Authentication */}
          {activeTab === 'two-factor' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-start gap-4 mb-6">
                  <div className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center',
                    twoFactorEnabled ? 'bg-green-100' : 'bg-orange-100'
                  )}>
                    <Smartphone className={cn(
                      'w-6 h-6',
                      twoFactorEnabled ? 'text-green-600' : 'text-primary'
                    )} />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-gray-900">Two-Factor Authentication</h2>
                    <p className="text-gray-500 text-sm">
                      Add an extra layer of security to your account by requiring a verification code in addition to your password.
                    </p>
                  </div>
                  <div className={cn(
                    'px-3 py-1 rounded-full text-xs font-medium',
                    twoFactorEnabled
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  )}>
                    {twoFactorEnabled ? 'Enabled' : 'Disabled'}
                  </div>
                </div>

                {!twoFactorEnabled && !showSetup && (
                  <button
                    onClick={handleEnable2FA}
                    className="px-5 py-2.5 bg-primary text-white rounded-xl shadow-lg shadow-orange-200 hover:shadow-orange-300 hover:bg-orange-600 transition-all duration-300"
                  >
                    Enable Two-Factor Authentication
                  </button>
                )}

                {showSetup && (
                  <div className="space-y-6">
                    <div className="flex items-start gap-6 p-4 bg-gray-50 rounded-xl">
                      <div className="w-32 h-32 bg-white rounded-xl border border-gray-200 flex items-center justify-center">
                        <QrCode className="w-24 h-24 text-gray-800" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-2">Scan QR Code</h3>
                        <p className="text-sm text-gray-600 mb-4">
                          Use your authenticator app (Google Authenticator, Authy, etc.) to scan this QR code.
                        </p>
                        <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200">
                          <code className="text-sm font-mono text-gray-700 flex-1">JBSWY3DPEHPK3PXP</code>
                          <button className="p-1.5 hover:bg-gray-100 rounded transition-colors">
                            <Copy className="w-4 h-4 text-gray-500" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Enter verification code
                      </label>
                      <div className="flex gap-3">
                        <input
                          type="text"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="000000"
                          maxLength={6}
                          className="w-40 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-center text-lg tracking-widest font-mono"
                        />
                        <button
                          onClick={handleVerify2FA}
                          disabled={verificationCode.length !== 6}
                          className="px-5 py-2.5 bg-primary text-white rounded-xl shadow-lg shadow-orange-200 hover:shadow-orange-300 hover:bg-orange-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                        >
                          Verify & Enable
                        </button>
                        <button
                          onClick={() => setShowSetup(false)}
                          className="px-5 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {twoFactorEnabled && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span className="text-sm text-green-700">Two-factor authentication is active on your account.</span>
                    </div>
                    <button
                      onClick={handleDisable2FA}
                      className="px-5 py-2.5 text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
                    >
                      Disable Two-Factor Authentication
                    </button>
                  </div>
                )}
              </div>

              {/* Backup Codes */}
              {twoFactorEnabled && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                      <Key className="w-6 h-6 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-lg font-semibold text-gray-900">Backup Codes</h2>
                      <p className="text-gray-500 text-sm">
                        Save these codes in a safe place. You can use them to access your account if you lose your authenticator device.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {backupCodes.map((code, index) => (
                      <div
                        key={index}
                        className="p-3 bg-gray-50 rounded-lg border border-gray-200 font-mono text-sm text-center"
                      >
                        {code}
                      </div>
                    ))}
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                    <RefreshCw className="w-4 h-4" />
                    Generate New Codes
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Active Sessions */}
          {activeTab === 'sessions' && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Active Sessions</h2>
                  <p className="text-gray-500 text-sm">Manage devices where you're logged in</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={fetchSessions}
                    disabled={isLoadingSessions}
                    className="px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={cn('w-4 h-4', isLoadingSessions && 'animate-spin')} />
                  </button>
                  {sessions.filter(s => !s.isCurrent).length > 0 && (
                    <button
                      onClick={handleLogoutAllOther}
                      className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
                    >
                      Log out all other sessions
                    </button>
                  )}
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                  {error}
                </div>
              )}

              {isLoadingSessions ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No active sessions found
                </div>
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
                        'flex items-center justify-between p-4 rounded-xl border',
                        session.isCurrent
                          ? 'bg-green-50 border-green-200'
                          : 'bg-gray-50 border-gray-200'
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          'w-12 h-12 rounded-xl flex items-center justify-center',
                          session.isCurrent ? 'bg-green-100' : 'bg-gray-100'
                        )}>
                          <DeviceIcon className={cn(
                            'w-6 h-6',
                            session.isCurrent ? 'text-green-600' : 'text-gray-600'
                          )} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">{session.device}</p>
                            {session.isCurrent && (
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                Current
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                            <span className="flex items-center gap-1">
                              <Chrome className="w-3 h-3" />
                              {session.browser}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {session.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Globe className="w-3 h-3" />
                              {session.ip}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            Last active: {session.isCurrent ? 'Now' : formatDate(session.lastActive)}
                          </p>
                        </div>
                      </div>
                      {!session.isCurrent && (
                        <button
                          onClick={() => handleLogoutSession(session.id)}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
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
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Login History</h2>
                  <p className="text-gray-500 text-sm">Recent sign-in activity on your account</p>
                </div>
                <button
                  onClick={fetchLoginHistory}
                  disabled={isLoadingHistory}
                  className="px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={cn('w-4 h-4', isLoadingHistory && 'animate-spin')} />
                </button>
              </div>

              {isLoadingHistory ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              ) : loginHistory.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No login activity found
                </div>
              ) : (
              <div className="space-y-3">
                {loginHistory.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      'flex items-center justify-between p-4 rounded-xl border',
                      activity.status === 'success'
                        ? 'bg-gray-50 border-gray-200'
                        : 'bg-red-50 border-red-200'
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center',
                        activity.status === 'success' ? 'bg-green-100' : 'bg-red-100'
                      )}>
                        {activity.status === 'success' ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">
                            {activity.status === 'success' ? 'Successful login' : 'Failed login attempt'}
                          </p>
                          <span className={cn(
                            'px-2 py-0.5 text-xs font-medium rounded-full',
                            activity.status === 'success'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          )}>
                            {activity.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                          <span>{activity.device}</span>
                          <span>•</span>
                          <span>{activity.browser}</span>
                          <span>•</span>
                          <span>{activity.location}</span>
                        </div>
                        {activity.reason && (
                          <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
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
