import { Router } from 'express';
import { NotificationType, NotificationChannel, Prisma } from '@prisma/client';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { NotFoundError, ForbiddenError } from '../middleware/errorHandler.js';

const router = Router();

// GET /api/notifications - List user notifications
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { page = '1', limit = '20', unreadOnly, type } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = Math.min(parseInt(limit as string, 10), 100);
    const skip = (pageNum - 1) * limitNum;

    const where: Prisma.NotificationWhereInput = {
      userId: req.user!.id,
    };

    if (unreadOnly === 'true') {
      where.readAt = null;
    }

    if (type && typeof type === 'string') {
      if (Object.values(NotificationType).includes(type as NotificationType)) {
        where.type = type as NotificationType;
      }
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.notification.count({ where }),
    ]);

    res.json({
      success: true,
      data: notifications,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/notifications/unread-count - Get unread count
router.get('/unread-count', authenticate, async (req, res, next) => {
  try {
    const count = await prisma.notification.count({
      where: {
        userId: req.user!.id,
        readAt: null,
      },
    });

    res.json({
      success: true,
      data: { count },
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/notifications/:id/read - Mark as read
router.patch('/:id/read', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw NotFoundError('Notification not found');
    }

    if (notification.userId !== req.user!.id) {
      throw ForbiddenError('You can only mark your own notifications as read');
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/notifications/read-all - Mark all as read
router.patch('/read-all', authenticate, async (req, res, next) => {
  try {
    const result = await prisma.notification.updateMany({
      where: {
        userId: req.user!.id,
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    res.json({
      success: true,
      data: { count: result.count },
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/notifications/:id - Delete notification
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw NotFoundError('Notification not found');
    }

    if (notification.userId !== req.user!.id) {
      throw ForbiddenError('You can only delete your own notifications');
    }

    await prisma.notification.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (error) {
    next(error);
  }
});

// =============================================
// Notification Service Functions (for internal use)
// =============================================

interface NotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  actionUrl?: string;
  channels?: NotificationChannel[];
}

/**
 * Send a notification to a user
 */
export async function sendNotification(payload: NotificationPayload) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: payload.userId,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        entityType: payload.entityType,
        entityId: payload.entityId,
        actionUrl: payload.actionUrl,
        channels: payload.channels || ['IN_APP'],
      },
    });

    // Check user preferences for email/SMS
    const preferences = await prisma.userPreferences.findUnique({
      where: { userId: payload.userId },
    });

    // Send email if requested and user has email notifications enabled
    if (payload.channels?.includes('EMAIL')) {
      const shouldSendEmail = shouldSendEmailNotification(payload.type, preferences);
      if (shouldSendEmail) {
        // TODO: Actually send email via email service
        await prisma.notification.update({
          where: { id: notification.id },
          data: {
            emailSent: true,
            emailSentAt: new Date(),
          },
        });
      }
    }

    // Send SMS if requested and user has SMS notifications enabled
    if (payload.channels?.includes('SMS')) {
      const shouldSendSms = shouldSendSmsNotification(payload.type, preferences);
      if (shouldSendSms) {
        // TODO: Actually send SMS via Twilio
        await prisma.notification.update({
          where: { id: notification.id },
          data: {
            smsSent: true,
            smsSentAt: new Date(),
          },
        });
      }
    }

    return notification;
  } catch (error) {
    console.error('Failed to send notification:', error);
    return null;
  }
}

/**
 * Send notification to multiple users
 */
export async function sendBulkNotification(
  userIds: string[],
  payload: Omit<NotificationPayload, 'userId'>
) {
  const results = await Promise.all(
    userIds.map((userId) => sendNotification({ ...payload, userId }))
  );
  return results.filter(Boolean);
}

/**
 * Check if email should be sent based on notification type and user preferences
 */
function shouldSendEmailNotification(
  type: NotificationType,
  preferences: { emailBookingConfirm?: boolean; emailBookingReminder?: boolean; emailPaymentReceipt?: boolean } | null
): boolean {
  if (!preferences) return true; // Default to sending if no preferences

  switch (type) {
    case 'BOOKING_CONFIRMED':
    case 'BOOKING_CANCELLED':
    case 'BOOKING_COMPLETED':
      return preferences.emailBookingConfirm !== false;
    case 'BOOKING_REMINDER':
    case 'BOOKING_STARTED':
    case 'BOOKING_ENDING_SOON':
      return preferences.emailBookingReminder !== false;
    case 'PAYMENT_RECEIVED':
    case 'PAYMENT_FAILED':
    case 'PAYMENT_REFUNDED':
    case 'INVOICE_SENT':
    case 'INVOICE_OVERDUE':
      return preferences.emailPaymentReceipt !== false;
    default:
      return true;
  }
}

/**
 * Check if SMS should be sent based on notification type and user preferences
 */
function shouldSendSmsNotification(
  type: NotificationType,
  preferences: { smsBookingReminder?: boolean; smsPaymentAlert?: boolean } | null
): boolean {
  if (!preferences) return false; // Default to not sending SMS

  switch (type) {
    case 'BOOKING_REMINDER':
    case 'BOOKING_STARTED':
    case 'BOOKING_ENDING_SOON':
      return preferences.smsBookingReminder === true;
    case 'PAYMENT_FAILED':
    case 'INVOICE_OVERDUE':
      return preferences.smsPaymentAlert === true;
    default:
      return false;
  }
}

// Convenience functions for common notifications
export const NotificationService = {
  bookingConfirmed: async (userId: string, bookingId: string, vehicleName: string) => {
    return sendNotification({
      userId,
      type: 'BOOKING_CONFIRMED',
      title: 'Booking Confirmed',
      message: `Your booking for ${vehicleName} has been confirmed.`,
      entityType: 'Booking',
      entityId: bookingId,
      actionUrl: `/bookings/${bookingId}`,
      channels: ['IN_APP', 'EMAIL'],
    });
  },

  bookingReminder: async (userId: string, bookingId: string, vehicleName: string, pickupDate: string) => {
    return sendNotification({
      userId,
      type: 'BOOKING_REMINDER',
      title: 'Pickup Reminder',
      message: `Reminder: Your pickup for ${vehicleName} is scheduled for ${pickupDate}.`,
      entityType: 'Booking',
      entityId: bookingId,
      actionUrl: `/bookings/${bookingId}`,
      channels: ['IN_APP', 'EMAIL', 'SMS'],
    });
  },

  paymentReceived: async (userId: string, bookingId: string, amount: number) => {
    return sendNotification({
      userId,
      type: 'PAYMENT_RECEIVED',
      title: 'Payment Received',
      message: `We received your payment of $${amount.toFixed(2)}. Thank you!`,
      entityType: 'Booking',
      entityId: bookingId,
      actionUrl: `/bookings/${bookingId}`,
      channels: ['IN_APP', 'EMAIL'],
    });
  },

  paymentFailed: async (userId: string, bookingId: string, reason?: string) => {
    return sendNotification({
      userId,
      type: 'PAYMENT_FAILED',
      title: 'Payment Failed',
      message: `Your payment could not be processed${reason ? `: ${reason}` : '. Please try again.'}`,
      entityType: 'Booking',
      entityId: bookingId,
      actionUrl: `/bookings/${bookingId}`,
      channels: ['IN_APP', 'EMAIL', 'SMS'],
    });
  },

  documentVerified: async (userId: string, documentType: string) => {
    return sendNotification({
      userId,
      type: 'DOCUMENT_VERIFIED',
      title: 'Document Verified',
      message: `Your ${documentType} has been verified.`,
      actionUrl: '/profile/documents',
      channels: ['IN_APP', 'EMAIL'],
    });
  },

  documentRejected: async (userId: string, documentType: string, reason?: string) => {
    return sendNotification({
      userId,
      type: 'DOCUMENT_REJECTED',
      title: 'Document Rejected',
      message: `Your ${documentType} was rejected${reason ? `: ${reason}` : '. Please upload a new document.'}`,
      actionUrl: '/profile/documents',
      channels: ['IN_APP', 'EMAIL'],
    });
  },

  newMessage: async (userId: string, conversationId: string, senderName: string) => {
    return sendNotification({
      userId,
      type: 'NEW_MESSAGE',
      title: 'New Message',
      message: `You have a new message from ${senderName}.`,
      entityType: 'Conversation',
      entityId: conversationId,
      actionUrl: `/messages/${conversationId}`,
      channels: ['IN_APP', 'EMAIL'],
    });
  },
};

export default router;
