import { Router } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import prisma from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { BadRequestError, NotFoundError, ForbiddenError } from '../middleware/errorHandler.js';
import { parseUserAgent, getIpAddress, getUserAgent } from '../lib/activityLogger.js';

const router = Router();

// Helper to hash token for storage
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Calculate token expiry (default 7 days, configurable via env)
function getTokenExpiry(): Date {
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  const match = expiresIn.match(/^(\d+)([dhms])$/);

  if (!match) {
    // Default to 7 days
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  const multipliers: Record<string, number> = {
    d: 24 * 60 * 60 * 1000,
    h: 60 * 60 * 1000,
    m: 60 * 1000,
    s: 1000,
  };

  return new Date(Date.now() + value * multipliers[unit]);
}

/**
 * Create a session record
 * Called internally when user logs in
 */
export async function createSession(
  userId: string,
  token: string,
  req: { ip?: string; headers?: Record<string, string | string[] | undefined> }
) {
  const userAgent = getUserAgent(req);
  const { device, browser, os } = parseUserAgent(userAgent);
  const ipAddress = getIpAddress(req);

  const session = await prisma.session.create({
    data: {
      userId,
      token: hashToken(token),
      userAgent,
      ipAddress,
      device,
      browser,
      os,
      expiresAt: getTokenExpiry(),
    },
  });

  return session;
}

/**
 * Update session activity timestamp
 * Can be called from auth middleware to track last activity
 */
export async function updateSessionActivity(token: string) {
  try {
    await prisma.session.updateMany({
      where: {
        token: hashToken(token),
        isActive: true,
      },
      data: {
        lastActiveAt: new Date(),
      },
    });
  } catch (error) {
    // Don't let this break the request
    console.error('Failed to update session activity:', error);
  }
}

/**
 * Revoke a session
 */
export async function revokeSession(sessionId: string, reason?: string) {
  return prisma.session.update({
    where: { id: sessionId },
    data: {
      isActive: false,
      revokedAt: new Date(),
      revokedReason: reason,
    },
  });
}

/**
 * Revoke session by token
 */
export async function revokeSessionByToken(token: string, reason?: string) {
  return prisma.session.updateMany({
    where: {
      token: hashToken(token),
      isActive: true,
    },
    data: {
      isActive: false,
      revokedAt: new Date(),
      revokedReason: reason,
    },
  });
}

// GET /api/sessions - List active sessions for current user
router.get('/', authenticate, async (req, res, next) => {
  try {
    const sessions = await prisma.session.findMany({
      where: {
        userId: req.user!.id,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        device: true,
        browser: true,
        os: true,
        ipAddress: true,
        location: true,
        lastActiveAt: true,
        createdAt: true,
      },
      orderBy: { lastActiveAt: 'desc' },
    });

    // Get current session token from auth header
    const authHeader = req.headers.authorization;
    const currentToken = authHeader?.replace('Bearer ', '');
    const currentTokenHash = currentToken ? hashToken(currentToken) : null;

    // Find current session to mark it
    const currentSession = currentToken
      ? await prisma.session.findFirst({
          where: {
            token: currentTokenHash!,
            userId: req.user!.id,
            isActive: true,
          },
          select: { id: true },
        })
      : null;

    const sessionsWithCurrent = sessions.map((session) => ({
      ...session,
      isCurrent: session.id === currentSession?.id,
    }));

    res.json({
      success: true,
      data: sessionsWithCurrent,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/sessions/all - List all sessions (admin view)
router.get('/all', authenticate, authorize('ADMIN', 'MANAGER'), async (req, res, next) => {
  try {
    const { page = '1', limit = '50', userId, isActive } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = Math.min(parseInt(limit as string, 10), 100);
    const skip = (pageNum - 1) * limitNum;

    const where: Record<string, unknown> = {};

    if (userId && typeof userId === 'string') {
      where.userId = userId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const [sessions, total] = await Promise.all([
      prisma.session.findMany({
        where,
        select: {
          id: true,
          userId: true,
          user: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
          device: true,
          browser: true,
          os: true,
          ipAddress: true,
          location: true,
          isActive: true,
          lastActiveAt: true,
          expiresAt: true,
          revokedAt: true,
          revokedReason: true,
          createdAt: true,
        },
        orderBy: { lastActiveAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.session.count({ where }),
    ]);

    res.json({
      success: true,
      data: sessions,
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

// DELETE /api/sessions/:id - Revoke specific session
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = z.object({ reason: z.string().optional() }).parse(req.body || {});

    const session = await prisma.session.findUnique({
      where: { id },
    });

    if (!session) {
      throw NotFoundError('Session not found');
    }

    // Users can only revoke their own sessions unless they're admin
    const isAdmin = ['ADMIN', 'MANAGER'].includes(req.user!.role);
    if (session.userId !== req.user!.id && !isAdmin) {
      throw ForbiddenError('You can only revoke your own sessions');
    }

    await revokeSession(id, reason || 'Manually revoked by user');

    res.json({
      success: true,
      message: 'Session revoked successfully',
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/sessions/all - Revoke all sessions except current
router.delete('/revoke-all', authenticate, async (req, res, next) => {
  try {
    // Get current session token
    const authHeader = req.headers.authorization;
    const currentToken = authHeader?.replace('Bearer ', '');

    if (!currentToken) {
      throw BadRequestError('No active session found');
    }

    const currentTokenHash = hashToken(currentToken);

    // Revoke all other sessions for this user
    const result = await prisma.session.updateMany({
      where: {
        userId: req.user!.id,
        isActive: true,
        token: { not: currentTokenHash },
      },
      data: {
        isActive: false,
        revokedAt: new Date(),
        revokedReason: 'Revoked all other sessions',
      },
    });

    res.json({
      success: true,
      message: `Revoked ${result.count} session(s)`,
      count: result.count,
    });
  } catch (error) {
    next(error);
  }
});

// Cleanup expired sessions (called by cron job)
export async function cleanupExpiredSessions() {
  try {
    const result = await prisma.session.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          {
            isActive: false,
            revokedAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // 30 days old
          },
        ],
      },
    });

    console.log(`Cleaned up ${result.count} expired/revoked sessions`);
    return result.count;
  } catch (error) {
    console.error('Failed to cleanup sessions:', error);
    return 0;
  }
}

export default router;
