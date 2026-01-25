import { ActivityAction, ActivityStatus, Prisma } from '@prisma/client';
import prisma from './prisma.js';

interface ActivityLogOptions {
  userId?: string | null;
  action: ActivityAction;
  entityType?: string;
  entityId?: string;
  description: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  status?: ActivityStatus;
  errorMessage?: string;
}

/**
 * Log an activity event to the database
 */
export async function logActivity(options: ActivityLogOptions) {
  try {
    const activity = await prisma.activityLog.create({
      data: {
        userId: options.userId ?? undefined,
        action: options.action,
        entityType: options.entityType,
        entityId: options.entityId,
        description: options.description,
        metadata: options.metadata as Prisma.InputJsonValue ?? Prisma.JsonNull,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
        status: options.status ?? 'SUCCESS',
        errorMessage: options.errorMessage,
      },
    });

    return activity;
  } catch (error) {
    // Don't let logging failures break the main operation
    console.error('Failed to log activity:', error);
    return null;
  }
}

/**
 * Helper to get IP address from request
 */
export function getIpAddress(req: { ip?: string; headers?: Record<string, string | string[] | undefined> }): string | undefined {
  // Check for proxy headers first
  const forwardedFor = req.headers?.['x-forwarded-for'];
  if (forwardedFor) {
    const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
    return ips.split(',')[0].trim();
  }

  const realIp = req.headers?.['x-real-ip'];
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] : realIp;
  }

  return req.ip;
}

/**
 * Helper to get user agent from request
 */
export function getUserAgent(req: { headers?: Record<string, string | string[] | undefined> }): string | undefined {
  const ua = req.headers?.['user-agent'];
  return Array.isArray(ua) ? ua[0] : ua;
}

/**
 * Parse user agent to extract device info
 */
export function parseUserAgent(userAgent: string | undefined): {
  device: string;
  browser: string;
  os: string;
} {
  if (!userAgent) {
    return { device: 'Unknown', browser: 'Unknown', os: 'Unknown' };
  }

  // Simple parsing - in production, use a library like ua-parser-js
  let device = 'Desktop';
  let browser = 'Unknown';
  let os = 'Unknown';

  // Detect device type
  if (/mobile/i.test(userAgent)) {
    device = 'Mobile';
  } else if (/tablet|ipad/i.test(userAgent)) {
    device = 'Tablet';
  }

  // Detect browser
  if (/chrome/i.test(userAgent) && !/edge|edg/i.test(userAgent)) {
    browser = 'Chrome';
  } else if (/firefox/i.test(userAgent)) {
    browser = 'Firefox';
  } else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) {
    browser = 'Safari';
  } else if (/edge|edg/i.test(userAgent)) {
    browser = 'Edge';
  } else if (/opera|opr/i.test(userAgent)) {
    browser = 'Opera';
  }

  // Detect OS
  if (/windows/i.test(userAgent)) {
    os = 'Windows';
  } else if (/macintosh|mac os/i.test(userAgent)) {
    os = 'macOS';
  } else if (/linux/i.test(userAgent)) {
    os = 'Linux';
  } else if (/android/i.test(userAgent)) {
    os = 'Android';
  } else if (/iphone|ipad|ipod/i.test(userAgent)) {
    os = 'iOS';
  }

  return { device, browser, os };
}

// Convenience functions for common actions
export const ActivityLogger = {
  login: async (userId: string, req: { ip?: string; headers?: Record<string, string | string[] | undefined> }) => {
    return logActivity({
      userId,
      action: 'LOGIN',
      description: 'User logged in',
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
    });
  },

  logout: async (userId: string, req: { ip?: string; headers?: Record<string, string | string[] | undefined> }) => {
    return logActivity({
      userId,
      action: 'LOGOUT',
      description: 'User logged out',
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
    });
  },

  loginFailed: async (email: string, req: { ip?: string; headers?: Record<string, string | string[] | undefined> }) => {
    return logActivity({
      action: 'LOGIN_FAILED',
      description: `Failed login attempt for ${email}`,
      metadata: { email },
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
      status: 'FAILURE',
    });
  },

  passwordChange: async (userId: string, req: { ip?: string; headers?: Record<string, string | string[] | undefined> }) => {
    return logActivity({
      userId,
      action: 'PASSWORD_CHANGE',
      description: 'User changed password',
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
    });
  },

  passwordReset: async (userId: string, req: { ip?: string; headers?: Record<string, string | string[] | undefined> }) => {
    return logActivity({
      userId,
      action: 'PASSWORD_RESET',
      description: 'User reset password via email link',
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
    });
  },

  userCreate: async (actorId: string, targetUserId: string, targetEmail: string) => {
    return logActivity({
      userId: actorId,
      action: 'USER_CREATE',
      entityType: 'User',
      entityId: targetUserId,
      description: `Created user account for ${targetEmail}`,
    });
  },

  userUpdate: async (actorId: string, targetUserId: string, changes: string[]) => {
    return logActivity({
      userId: actorId,
      action: 'USER_UPDATE',
      entityType: 'User',
      entityId: targetUserId,
      description: `Updated user profile: ${changes.join(', ')}`,
      metadata: { changes },
    });
  },

  userDelete: async (actorId: string, targetUserId: string, targetEmail: string) => {
    return logActivity({
      userId: actorId,
      action: 'USER_DELETE',
      entityType: 'User',
      entityId: targetUserId,
      description: `Deleted user account: ${targetEmail}`,
    });
  },

  vehicleCreate: async (userId: string, vehicleId: string, vehicleName: string) => {
    return logActivity({
      userId,
      action: 'VEHICLE_CREATE',
      entityType: 'Vehicle',
      entityId: vehicleId,
      description: `Added vehicle: ${vehicleName}`,
    });
  },

  vehicleUpdate: async (userId: string, vehicleId: string, vehicleName: string, changes: string[]) => {
    return logActivity({
      userId,
      action: 'VEHICLE_UPDATE',
      entityType: 'Vehicle',
      entityId: vehicleId,
      description: `Updated vehicle ${vehicleName}: ${changes.join(', ')}`,
      metadata: { changes },
    });
  },

  vehicleDelete: async (userId: string, vehicleId: string, vehicleName: string) => {
    return logActivity({
      userId,
      action: 'VEHICLE_DELETE',
      entityType: 'Vehicle',
      entityId: vehicleId,
      description: `Deleted vehicle: ${vehicleName}`,
    });
  },

  vehicleStatusChange: async (userId: string, vehicleId: string, vehicleName: string, oldStatus: string, newStatus: string) => {
    return logActivity({
      userId,
      action: 'VEHICLE_STATUS_CHANGE',
      entityType: 'Vehicle',
      entityId: vehicleId,
      description: `Changed ${vehicleName} status from ${oldStatus} to ${newStatus}`,
      metadata: { oldStatus, newStatus },
    });
  },

  bookingCreate: async (userId: string, bookingId: string, customerName: string, vehicleName: string) => {
    return logActivity({
      userId,
      action: 'BOOKING_CREATE',
      entityType: 'Booking',
      entityId: bookingId,
      description: `Created booking for ${customerName} - ${vehicleName}`,
    });
  },

  bookingUpdate: async (userId: string, bookingId: string, changes: string[]) => {
    return logActivity({
      userId,
      action: 'BOOKING_UPDATE',
      entityType: 'Booking',
      entityId: bookingId,
      description: `Updated booking: ${changes.join(', ')}`,
      metadata: { changes },
    });
  },

  bookingCancel: async (userId: string, bookingId: string, reason?: string) => {
    return logActivity({
      userId,
      action: 'BOOKING_CANCEL',
      entityType: 'Booking',
      entityId: bookingId,
      description: `Cancelled booking${reason ? `: ${reason}` : ''}`,
      metadata: reason ? { reason } : undefined,
    });
  },

  bookingStatusChange: async (userId: string, bookingId: string, oldStatus: string, newStatus: string) => {
    return logActivity({
      userId,
      action: 'BOOKING_STATUS_CHANGE',
      entityType: 'Booking',
      entityId: bookingId,
      description: `Changed booking status from ${oldStatus} to ${newStatus}`,
      metadata: { oldStatus, newStatus },
    });
  },

  paymentProcess: async (userId: string, paymentId: string, amount: number, bookingId: string) => {
    return logActivity({
      userId,
      action: 'PAYMENT_PROCESS',
      entityType: 'Payment',
      entityId: paymentId,
      description: `Processed payment of $${amount.toFixed(2)} for booking`,
      metadata: { amount, bookingId },
    });
  },

  paymentRefund: async (userId: string, paymentId: string, amount: number, reason?: string) => {
    return logActivity({
      userId,
      action: 'PAYMENT_REFUND',
      entityType: 'Payment',
      entityId: paymentId,
      description: `Refunded $${amount.toFixed(2)}${reason ? `: ${reason}` : ''}`,
      metadata: { amount, reason },
    });
  },

  documentUpload: async (userId: string, documentId: string, documentType: string) => {
    return logActivity({
      userId,
      action: 'DOCUMENT_UPLOAD',
      entityType: 'Document',
      entityId: documentId,
      description: `Uploaded document: ${documentType}`,
    });
  },

  documentVerify: async (actorId: string, documentId: string, documentType: string, ownerEmail: string) => {
    return logActivity({
      userId: actorId,
      action: 'DOCUMENT_VERIFY',
      entityType: 'Document',
      entityId: documentId,
      description: `Verified ${documentType} for ${ownerEmail}`,
    });
  },

  documentReject: async (actorId: string, documentId: string, documentType: string, ownerEmail: string, reason?: string) => {
    return logActivity({
      userId: actorId,
      action: 'DOCUMENT_REJECT',
      entityType: 'Document',
      entityId: documentId,
      description: `Rejected ${documentType} for ${ownerEmail}${reason ? `: ${reason}` : ''}`,
      metadata: reason ? { reason } : undefined,
    });
  },

  conversationCreate: async (userId: string, conversationId: string, customerEmail: string) => {
    return logActivity({
      userId,
      action: 'CONVERSATION_CREATE',
      entityType: 'Conversation',
      entityId: conversationId,
      description: `Started conversation with ${customerEmail}`,
    });
  },

  messageSend: async (userId: string, messageId: string, conversationId: string) => {
    return logActivity({
      userId,
      action: 'MESSAGE_SEND',
      entityType: 'Message',
      entityId: messageId,
      description: 'Sent message in conversation',
      metadata: { conversationId },
    });
  },

  settingsUpdate: async (userId: string, settingsType: string, changes: string[]) => {
    return logActivity({
      userId,
      action: 'SETTINGS_UPDATE',
      entityType: 'Settings',
      entityId: settingsType,
      description: `Updated ${settingsType} settings: ${changes.join(', ')}`,
      metadata: { changes },
    });
  },
};

export default ActivityLogger;
