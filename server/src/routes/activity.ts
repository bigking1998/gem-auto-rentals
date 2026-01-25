import { Router } from 'express';
import { ActivityAction } from '@prisma/client';
import prisma from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// GET /api/activity - Get activity logs (with filters)
router.get('/', authenticate, authorize('ADMIN', 'MANAGER', 'SUPPORT'), async (req, res, next) => {
  try {
    const {
      page = '1',
      limit = '50',
      userId,
      action,
      entityType,
      entityId,
      status,
      startDate,
      endDate,
      search,
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = Math.min(parseInt(limit as string, 10), 100);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (userId && typeof userId === 'string') {
      where.userId = userId;
    }

    if (action && typeof action === 'string') {
      // Validate action is a valid enum value
      if (Object.values(ActivityAction).includes(action as ActivityAction)) {
        where.action = action;
      }
    }

    if (entityType && typeof entityType === 'string') {
      where.entityType = entityType;
    }

    if (entityId && typeof entityId === 'string') {
      where.entityId = entityId;
    }

    if (status && typeof status === 'string') {
      where.status = status;
    }

    // Date range filter
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate && typeof startDate === 'string') {
        (where.createdAt as Record<string, Date>).gte = new Date(startDate);
      }
      if (endDate && typeof endDate === 'string') {
        (where.createdAt as Record<string, Date>).lte = new Date(endDate);
      }
    }

    // Search in description
    if (search && typeof search === 'string') {
      where.description = { contains: search, mode: 'insensitive' };
    }

    const [activities, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        select: {
          id: true,
          action: true,
          entityType: true,
          entityId: true,
          description: true,
          metadata: true,
          ipAddress: true,
          userAgent: true,
          status: true,
          errorMessage: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.activityLog.count({ where }),
    ]);

    res.json({
      success: true,
      data: activities,
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

// GET /api/activity/user/:userId - Get activity for specific user
router.get('/user/:userId', authenticate, authorize('ADMIN', 'MANAGER', 'SUPPORT'), async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page = '1', limit = '50' } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = Math.min(parseInt(limit as string, 10), 100);
    const skip = (pageNum - 1) * limitNum;

    const [activities, total, user] = await Promise.all([
      prisma.activityLog.findMany({
        where: { userId },
        select: {
          id: true,
          action: true,
          entityType: true,
          entityId: true,
          description: true,
          metadata: true,
          ipAddress: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.activityLog.count({ where: { userId } }),
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        user,
        activities,
      },
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

// GET /api/activity/entity/:type/:id - Get activity for specific entity
router.get('/entity/:type/:id', authenticate, authorize('ADMIN', 'MANAGER', 'SUPPORT'), async (req, res, next) => {
  try {
    const { type, id } = req.params;
    const { page = '1', limit = '50' } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = Math.min(parseInt(limit as string, 10), 100);
    const skip = (pageNum - 1) * limitNum;

    const [activities, total] = await Promise.all([
      prisma.activityLog.findMany({
        where: {
          entityType: type,
          entityId: id,
        },
        select: {
          id: true,
          action: true,
          description: true,
          metadata: true,
          ipAddress: true,
          status: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.activityLog.count({
        where: {
          entityType: type,
          entityId: id,
        },
      }),
    ]);

    res.json({
      success: true,
      data: activities,
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

// GET /api/activity/stats - Get activity statistics
router.get('/stats', authenticate, authorize('ADMIN', 'MANAGER'), async (req, res, next) => {
  try {
    const { days = '7' } = req.query;
    const daysNum = parseInt(days as string, 10);
    const startDate = new Date(Date.now() - daysNum * 24 * 60 * 60 * 1000);

    // Get counts by action type
    const actionCounts = await prisma.activityLog.groupBy({
      by: ['action'],
      _count: { id: true },
      where: {
        createdAt: { gte: startDate },
      },
    });

    // Get counts by status
    const statusCounts = await prisma.activityLog.groupBy({
      by: ['status'],
      _count: { id: true },
      where: {
        createdAt: { gte: startDate },
      },
    });

    // Get most active users
    const activeUsers = await prisma.activityLog.groupBy({
      by: ['userId'],
      _count: { id: true },
      where: {
        createdAt: { gte: startDate },
        userId: { not: null },
      },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    // Get user details for active users
    const userIds = activeUsers.map((u) => u.userId).filter(Boolean) as string[];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));
    const activeUsersWithDetails = activeUsers.map((u) => ({
      user: u.userId ? userMap.get(u.userId) : null,
      count: u._count.id,
    }));

    // Get failed login attempts
    const failedLogins = await prisma.activityLog.count({
      where: {
        action: 'LOGIN_FAILED',
        createdAt: { gte: startDate },
      },
    });

    res.json({
      success: true,
      data: {
        period: { days: daysNum, startDate },
        actionCounts: Object.fromEntries(actionCounts.map((a) => [a.action, a._count.id])),
        statusCounts: Object.fromEntries(statusCounts.map((s) => [s.status, s._count.id])),
        activeUsers: activeUsersWithDetails,
        failedLogins,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/activity/actions - Get available action types
router.get('/actions', authenticate, (_req, res) => {
  res.json({
    success: true,
    data: Object.values(ActivityAction),
  });
});

export default router;
