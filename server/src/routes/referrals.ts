import { Router } from 'express';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { loyaltyService } from '../services/loyaltyService.js';

const router = Router();

// Referral reward amounts (in points)
const REFERRER_REWARD = 500;  // Points for the person who referred
const REFEREE_REWARD = 250;   // Points for the new user who was referred

// Referral code validity period (30 days)
const CODE_VALIDITY_DAYS = 30;

// Generate a unique referral code
function generateReferralCode(): string {
  return randomBytes(4).toString('hex').toUpperCase();
}

// GET /api/referrals/my-code - Get or create the user's referral code
router.get('/my-code', authenticate, async (req, res, next) => {
  try {
    const userId = req.user!.id;

    // Check for existing active referral code
    let referral = await prisma.referral.findFirst({
      where: {
        referrerId: userId,
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    // If no active code, create a new one using transaction for atomicity
    if (!referral) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + CODE_VALIDITY_DAYS);

      // Use transaction to handle race conditions and unique code generation
      referral = await prisma.$transaction(async (tx) => {
        // Generate unique code with retry logic inside transaction
        let code: string;
        let attempts = 0;
        do {
          code = generateReferralCode();
          attempts++;
          const existing = await tx.referral.findUnique({ where: { code } });
          if (!existing) break;
        } while (attempts < 10);

        if (attempts >= 10) {
          throw new Error('Failed to generate unique referral code');
        }

        return tx.referral.create({
          data: {
            referrerId: userId,
            code: code!,
            expiresAt,
            referrerReward: REFERRER_REWARD,
            refereeReward: REFEREE_REWARD,
          },
        });
      });
    }

    // Get referral stats
    const stats = await prisma.referral.groupBy({
      by: ['status'],
      where: { referrerId: userId },
      _count: { id: true },
    });

    const completed = stats.find((s) => s.status === 'COMPLETED')?._count.id || 0;
    const pending = stats.find((s) => s.status === 'PENDING')?._count.id || 0;
    const signedUp = stats.find((s) => s.status === 'SIGNED_UP')?._count.id || 0;

    // Calculate total earned from referrals
    const totalEarned = completed * REFERRER_REWARD;

    res.json({
      success: true,
      data: {
        code: referral.code,
        expiresAt: referral.expiresAt,
        referrerReward: REFERRER_REWARD,
        refereeReward: REFEREE_REWARD,
        shareUrl: `${process.env.WEB_URL}/signup?ref=${referral.code}`,
        stats: {
          completed,
          pending,
          signedUp,
          totalEarned,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/referrals/history - Get referral history
router.get('/history', authenticate, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const { page = '1', limit = '20' } = z
      .object({
        page: z.string().optional(),
        limit: z.string().optional(),
      })
      .parse(req.query);

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [referrals, total] = await Promise.all([
      prisma.referral.findMany({
        where: { referrerId: userId },
        include: {
          referee: {
            select: {
              firstName: true,
              lastName: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.referral.count({
        where: { referrerId: userId },
      }),
    ]);

    res.json({
      success: true,
      data: {
        referrals: referrals.map((r) => ({
          id: r.id,
          code: r.code,
          status: r.status,
          refereeFirstName: r.referee?.firstName,
          refereeLastName: r.referee?.lastName,
          refereeJoinDate: r.referee?.createdAt,
          reward: r.referrerReward,
          completedAt: r.completedAt,
          createdAt: r.createdAt,
          expiresAt: r.expiresAt,
        })),
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/referrals/validate/:code - Validate a referral code (used during signup)
router.get('/validate/:code', async (req, res, next) => {
  try {
    const { code } = req.params;

    const referral = await prisma.referral.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        referrer: {
          select: { firstName: true },
        },
      },
    });

    if (!referral) {
      res.json({
        success: true,
        data: { valid: false, message: 'Invalid referral code' },
      });
      return;
    }

    if (referral.status !== 'PENDING') {
      res.json({
        success: true,
        data: { valid: false, message: 'This referral code has already been used' },
      });
      return;
    }

    if (referral.expiresAt < new Date()) {
      res.json({
        success: true,
        data: { valid: false, message: 'This referral code has expired' },
      });
      return;
    }

    res.json({
      success: true,
      data: {
        valid: true,
        referrerName: referral.referrer.firstName,
        refereeReward: referral.refereeReward,
        message: `You were referred by ${referral.referrer.firstName}! You'll earn ${referral.refereeReward} bonus points after your first rental.`,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/referrals/apply - Apply a referral code to the current user (called after signup)
router.post('/apply', authenticate, async (req, res, next) => {
  try {
    const { code } = z
      .object({
        code: z.string().min(1),
      })
      .parse(req.body);

    const userId = req.user!.id;

    // Check if user was already referred
    const existingReferral = await prisma.referral.findFirst({
      where: { refereeId: userId },
    });

    if (existingReferral) {
      res.status(400).json({
        success: false,
        error: 'You have already used a referral code',
      });
      return;
    }

    // Find the referral
    const referral = await prisma.referral.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!referral) {
      res.status(400).json({
        success: false,
        error: 'Invalid referral code',
      });
      return;
    }

    // Check if the user is trying to refer themselves
    if (referral.referrerId === userId) {
      res.status(400).json({
        success: false,
        error: 'You cannot use your own referral code',
      });
      return;
    }

    if (referral.status !== 'PENDING') {
      res.status(400).json({
        success: false,
        error: 'This referral code has already been used',
      });
      return;
    }

    if (referral.expiresAt < new Date()) {
      res.status(400).json({
        success: false,
        error: 'This referral code has expired',
      });
      return;
    }

    // Update the referral with the referee
    await prisma.referral.update({
      where: { id: referral.id },
      data: {
        refereeId: userId,
        status: 'SIGNED_UP',
      },
    });

    res.json({
      success: true,
      data: {
        message: 'Referral code applied! Complete your first rental to receive your bonus points.',
        refereeReward: referral.refereeReward,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/referrals/complete - Complete a referral (called when referee completes first booking)
// This is typically called internally by the bookings system
router.post('/complete', authenticate, async (req, res, next) => {
  try {
    const userId = req.user!.id;

    // Find the user's pending referral
    const referral = await prisma.referral.findFirst({
      where: {
        refereeId: userId,
        status: 'SIGNED_UP',
      },
    });

    if (!referral) {
      res.json({
        success: true,
        data: { completed: false, message: 'No pending referral found' },
      });
      return;
    }

    // Complete the referral and award points to both parties
    await prisma.$transaction(async (tx) => {
      // Update referral status
      await tx.referral.update({
        where: { id: referral.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      // Award points to referrer
      await loyaltyService.awardBonusPoints(
        referral.referrerId,
        referral.referrerReward,
        `Referral bonus - friend completed first rental`
      );

      // Award points to referee
      await loyaltyService.awardBonusPoints(
        referral.refereeId!,
        referral.refereeReward,
        `Welcome bonus - first rental completed`
      );
    });

    res.json({
      success: true,
      data: {
        completed: true,
        referrerReward: referral.referrerReward,
        refereeReward: referral.refereeReward,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
