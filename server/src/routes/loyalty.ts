import { Router } from 'express';
import { z } from 'zod';
import { authenticate, adminOnly } from '../middleware/auth.js';
import { loyaltyService } from '../services/loyaltyService.js';

const router = Router();

// GET /api/loyalty/account - Get current user's loyalty account
router.get('/account', authenticate, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const account = await loyaltyService.getOrCreateAccount(userId);
    const tierProgress = loyaltyService.getTierProgress(account.lifetimePoints);

    res.json({
      success: true,
      data: {
        ...account,
        tierProgress,
        pointsValue: loyaltyService.calculatePointsValue(account.points),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/loyalty/history - Get transaction history
router.get('/history', authenticate, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const { page = '1', limit = '20' } = z
      .object({
        page: z.string().optional(),
        limit: z.string().optional(),
      })
      .parse(req.query);

    // Validate pagination values
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));

    const history = await loyaltyService.getTransactionHistory(
      userId,
      pageNum,
      limitNum
    );

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/loyalty/calculate-redemption - Calculate redemption value
router.post('/calculate-redemption', authenticate, async (req, res, next) => {
  try {
    const { points } = z
      .object({
        points: z.number().min(1),
      })
      .parse(req.body);

    const userId = req.user!.id;
    const account = await loyaltyService.getOrCreateAccount(userId);

    if (account.points < points) {
      res.status(400).json({
        success: false,
        error: `Insufficient points. Available: ${account.points}`,
      });
      return;
    }

    const dollarValue = loyaltyService.calculatePointsValue(points);

    res.json({
      success: true,
      data: {
        points,
        dollarValue,
        availablePoints: account.points,
        remainingPoints: account.points - points,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/loyalty/redeem - Redeem points for a booking discount
router.post('/redeem', authenticate, async (req, res, next) => {
  try {
    const { points, bookingId } = z
      .object({
        points: z.number().min(1),
        bookingId: z.string().optional(),
      })
      .parse(req.body);

    const userId = req.user!.id;
    const description = bookingId
      ? `Redeemed for booking ${bookingId.substring(0, 8)}...`
      : 'Points redeemed for discount';

    const result = await loyaltyService.redeemPoints(
      userId,
      points,
      description,
      bookingId
    );

    res.json({
      success: true,
      data: {
        transaction: result.transaction,
        account: result.account,
        dollarValue: result.dollarValue,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Insufficient points')) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
      return;
    }
    next(error);
  }
});

// GET /api/loyalty/tier-info - Get tier information
router.get('/tier-info', async (_req, res) => {
  res.json({
    success: true,
    data: {
      tiers: [
        {
          name: 'BRONZE',
          threshold: 0,
          multiplier: 1.0,
          benefits: ['Earn 1 point per $1 spent', 'Member-only promotions'],
        },
        {
          name: 'SILVER',
          threshold: 1000,
          multiplier: 1.1,
          benefits: ['Earn 1.1x points per $1 spent', 'Priority support', 'Early access to deals'],
        },
        {
          name: 'GOLD',
          threshold: 5000,
          multiplier: 1.25,
          benefits: ['Earn 1.25x points per $1 spent', 'Free vehicle upgrades (subject to availability)', 'Dedicated support line'],
        },
        {
          name: 'PLATINUM',
          threshold: 15000,
          multiplier: 1.5,
          benefits: ['Earn 1.5x points per $1 spent', 'Guaranteed upgrades', 'Complimentary extras', 'VIP support'],
        },
      ],
      redemption: {
        pointsPerDollar: 100,
        description: 'Redeem 100 points for $1 off your rental',
      },
    },
  });
});

// ============ Admin Routes ============

// POST /api/loyalty/admin/award - Award points to a user (admin only)
router.post('/admin/award', authenticate, adminOnly, async (req, res, next) => {
  try {
    const { userId, points, description, type } = z
      .object({
        userId: z.string(),
        points: z.number().min(1),
        description: z.string().min(1),
        type: z.enum(['bonus', 'adjustment']).default('bonus'),
      })
      .parse(req.body);

    const adminUserId = req.user!.id;

    let result;
    if (type === 'adjustment') {
      result = await loyaltyService.adjustPoints(userId, points, description, adminUserId);
    } else {
      result = await loyaltyService.awardBonusPoints(userId, points, description);
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/loyalty/admin/deduct - Deduct points from a user (admin only)
router.post('/admin/deduct', authenticate, adminOnly, async (req, res, next) => {
  try {
    const { userId, points, description } = z
      .object({
        userId: z.string(),
        points: z.number().min(1),
        description: z.string().min(1),
      })
      .parse(req.body);

    const adminUserId = req.user!.id;

    const result = await loyaltyService.adjustPoints(
      userId,
      -points, // Negative for deduction
      description,
      adminUserId
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('negative points')) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
      return;
    }
    next(error);
  }
});

// GET /api/loyalty/admin/user/:userId - Get user's loyalty account (admin only)
router.get('/admin/user/:userId', authenticate, adminOnly, async (req, res, next) => {
  try {
    const { userId } = req.params;
    const account = await loyaltyService.getAccount(userId);

    if (!account) {
      res.status(404).json({
        success: false,
        error: 'Loyalty account not found',
      });
      return;
    }

    const tierProgress = loyaltyService.getTierProgress(account.lifetimePoints);

    res.json({
      success: true,
      data: {
        ...account,
        tierProgress,
        pointsValue: loyaltyService.calculatePointsValue(account.points),
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
