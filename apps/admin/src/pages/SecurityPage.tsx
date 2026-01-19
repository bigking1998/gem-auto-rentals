import { useState } from 'react';
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
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

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

const mockSessions: Session[] = [
  {
    id: '1',
    device: 'MacBook Pro',
    deviceType: 'desktop',
    browser: 'Chrome 120',
    location: 'Miami, FL',
    ip: '192.168.1.100',
    lastActive: new Date(),
    isCurrent: true,
  },
  {
    id: '2',
    device: 'iPhone 15 Pro',
    deviceType: 'mobile',
    browser: 'Safari Mobile',
    location: 'Miami, FL',
    ip: '192.168.1.105',
    lastActive: new Date('2026-01-17T18:30:00'),
    isCurrent: false,
  },
  {
    id: '3',
    device: 'Windows PC',
    deviceType: 'desktop',
    browser: 'Edge 120',
    location: 'Fort Lauderdale, FL',
    ip: '10.0.0.50',
    lastActive: new Date('2026-01-16T09:00:00'),
    isCurrent: false,
  },
];

const mockLoginHistory: LoginActivity[] = [
  {
    id: '1',
    device: 'MacBook Pro',
    browser: 'Chrome 120',
    location: 'Miami, FL',
    ip: '192.168.1.100',
    timestamp: new Date('2026-01-18T08:00:00'),
    status: 'success',
  },
  {
    id: '2',
    device: 'Unknown Device',
    browser: 'Firefox',
    location: 'Unknown Location',
    ip: '45.33.32.156',
    timestamp: new Date('2026-01-17T22:15:00'),
    status: 'failed',
    reason: 'Invalid password',
  },
  {
    id: '3',
    device: 'iPhone 15 Pro',
    browser: 'Safari Mobile',
    location: 'Miami, FL',
    ip: '192.168.1.105',
    timestamp: new Date('2026-01-17T14:30:00'),
    status: 'success',
  },
  {
    id: '4',
    device: 'MacBook Pro',
    browser: 'Chrome 120',
    location: 'Miami, FL',
    ip: '192.168.1.100',
    timestamp: new Date('2026-01-16T09:00:00'),
    status: 'success',
  },
  {
    id: '5',
    device: 'Unknown Device',
    browser: 'Chrome',
    location: 'New York, NY',
    ip: '72.229.28.185',
    timestamp: new Date('2026-01-15T03:45:00'),
    status: 'failed',
    reason: 'Account locked - too many attempts',
  },
];

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
  const [sessions, setSessions] = useState<Session[]>(mockSessions);
  const [backupCodes] = useState(['ABC12-DEF34', 'GHI56-JKL78', 'MNO90-PQR12', 'STU34-VWX56']);

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

  const handleLogoutSession = (sessionId: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
  };

  const handleLogoutAllOther = () => {
    setSessions((prev) => prev.filter((s) => s.isCurrent));
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
                    <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                      <Key className="w-6 h-6 text-purple-600" />
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
                {sessions.length > 1 && (
                  <button
                    onClick={handleLogoutAllOther}
                    className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
                  >
                    Log out all other sessions
                  </button>
                )}
              </div>

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
            </div>
          )}

          {/* Login History */}
          {activeTab === 'history' && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Login History</h2>
                <p className="text-gray-500 text-sm">Recent sign-in activity on your account</p>
              </div>

              <div className="space-y-3">
                {mockLoginHistory.map((activity, index) => (
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
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
