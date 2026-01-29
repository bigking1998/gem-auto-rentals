import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { authenticate, adminOnly, optionalAuth } from '../middleware/auth.js';

const router = Router();

// POST /api/promos/validate - Validate a promo code
router.post('/validate', optionalAuth, async (req, res, next) => {
  try {
    const { code, bookingAmount } = z
      .object({
        code: z.string().min(1),
        bookingAmount: z.number().positive().optional(),
      })
      .parse(req.body);

    const promo = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!promo) {
      res.json({
        success: true,
        data: { valid: false, message: 'Invalid promo code' },
      });
      return;
    }

    // Check if promo is active
    if (!promo.isActive) {
      res.json({
        success: true,
        data: { valid: false, message: 'This promo code is no longer active' },
      });
      return;
    }

    // Check validity dates
    const now = new Date();
    if (now < promo.validFrom) {
      res.json({
        success: true,
        data: { valid: false, message: 'This promo code is not yet valid' },
      });
      return;
    }

    if (now > promo.validUntil) {
      res.json({
        success: true,
        data: { valid: false, message: 'This promo code has expired' },
      });
      return;
    }

    // Check total usage limit
    if (promo.maxUsesTotal !== null && promo.usedCount >= promo.maxUsesTotal) {
      res.json({
        success: true,
        data: { valid: false, message: 'This promo code has reached its usage limit' },
      });
      return;
    }

    // Check per-user usage if authenticated
    if (req.user) {
      const userUsageCount = await prisma.promoCodeUsage.count({
        where: {
          promoCodeId: promo.id,
          userId: req.user.id,
        },
      });

      if (userUsageCount >= promo.maxUsesPerUser) {
        res.json({
          success: true,
          data: { valid: false, message: 'You have already used this promo code' },
        });
        return;
      }
    }

    // Check minimum booking amount
    if (promo.minBookingAmount && bookingAmount && Number(bookingAmount) < Number(promo.minBookingAmount)) {
      res.json({
        success: true,
        data: {
          valid: false,
          message: `Minimum booking amount is $${Number(promo.minBookingAmount).toFixed(2)}`,
        },
      });
      return;
    }

    // Calculate discount
    let discountAmount = 0;
    let discountDescription = '';

    if (bookingAmount) {
      switch (promo.type) {
        case 'PERCENTAGE':
          discountAmount = (Number(bookingAmount) * Number(promo.value)) / 100;
          discountDescription = `${Number(promo.value)}% off`;
          break;
        case 'FIXED_AMOUNT':
          discountAmount = Math.min(Number(promo.value), Number(bookingAmount));
          discountDescription = `$${Number(promo.value).toFixed(2)} off`;
          break;
        case 'FREE_EXTRA':
          discountDescription = 'Free add-on included';
          break;
      }
    }

    res.json({
      success: true,
      data: {
        valid: true,
        code: promo.code,
        type: promo.type,
        value: Number(promo.value),
        discountAmount: Math.round(discountAmount * 100) / 100,
        discountDescription,
        minBookingAmount: promo.minBookingAmount ? Number(promo.minBookingAmount) : null,
        validUntil: promo.validUntil,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/promos/apply - Apply a promo code to a booking
router.post('/apply', authenticate, async (req, res, next) => {
  try {
    const { code, bookingId, bookingAmount } = z
      .object({
        code: z.string().min(1),
        bookingId: z.string(),
        bookingAmount: z.number().positive(),
      })
      .parse(req.body);

    const userId = req.user!.id;

    // Validate the promo code again
    const promo = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!promo || !promo.isActive) {
      res.status(400).json({
        success: false,
        error: 'Invalid or inactive promo code',
      });
      return;
    }

    const now = new Date();
    if (now < promo.validFrom || now > promo.validUntil) {
      res.status(400).json({
        success: false,
        error: 'Promo code is not valid at this time',
      });
      return;
    }

    if (promo.maxUsesTotal !== null && promo.usedCount >= promo.maxUsesTotal) {
      res.status(400).json({
        success: false,
        error: 'Promo code has reached its usage limit',
      });
      return;
    }

    // Check per-user usage
    const userUsageCount = await prisma.promoCodeUsage.count({
      where: {
        promoCodeId: promo.id,
        userId,
      },
    });

    if (userUsageCount >= promo.maxUsesPerUser) {
      res.status(400).json({
        success: false,
        error: 'You have already used this promo code',
      });
      return;
    }

    // Check if already applied to this booking
    const existingUsage = await prisma.promoCodeUsage.findFirst({
      where: {
        promoCodeId: promo.id,
        bookingId,
      },
    });

    if (existingUsage) {
      res.status(400).json({
        success: false,
        error: 'Promo code already applied to this booking',
      });
      return;
    }

    // Check minimum amount
    if (promo.minBookingAmount && bookingAmount < Number(promo.minBookingAmount)) {
      res.status(400).json({
        success: false,
        error: `Minimum booking amount is $${Number(promo.minBookingAmount).toFixed(2)}`,
      });
      return;
    }

    // Calculate discount
    let discountAmount = 0;
    switch (promo.type) {
      case 'PERCENTAGE':
        discountAmount = (bookingAmount * Number(promo.value)) / 100;
        break;
      case 'FIXED_AMOUNT':
        discountAmount = Math.min(Number(promo.value), bookingAmount);
        break;
      case 'FREE_EXTRA':
        // For free extras, we'd need to handle this differently
        // For now, set a nominal discount or handle in booking extras
        discountAmount = 0;
        break;
    }

    // Create usage record and increment counter
    await prisma.$transaction([
      prisma.promoCodeUsage.create({
        data: {
          promoCodeId: promo.id,
          userId,
          bookingId,
          discountApplied: discountAmount,
        },
      }),
      prisma.promoCode.update({
        where: { id: promo.id },
        data: { usedCount: { increment: 1 } },
      }),
    ]);

    res.json({
      success: true,
      data: {
        code: promo.code,
        type: promo.type,
        discountApplied: Math.round(discountAmount * 100) / 100,
        message: `Promo code applied! You saved $${discountAmount.toFixed(2)}`,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ============ Admin Routes ============

// GET /api/promos - List all promo codes (admin)
router.get('/', authenticate, adminOnly, async (req, res, next) => {
  try {
    const { page = '1', limit = '20', status } = z
      .object({
        page: z.string().optional(),
        limit: z.string().optional(),
        status: z.enum(['active', 'expired', 'all']).optional(),
      })
      .parse(req.query);

    // Validate pagination values
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const skip = (pageNum - 1) * limitNum;
    const now = new Date();

    let whereClause = {};
    if (status === 'active') {
      whereClause = {
        isActive: true,
        validFrom: { lte: now },
        validUntil: { gte: now },
      };
    } else if (status === 'expired') {
      whereClause = {
        OR: [
          { isActive: false },
          { validUntil: { lt: now } },
        ],
      };
    }

    const [promos, total] = await Promise.all([
      prisma.promoCode.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
        include: {
          _count: { select: { usages: true } },
        },
      }),
      prisma.promoCode.count({ where: whereClause }),
    ]);

    res.json({
      success: true,
      data: {
        promos: promos.map((p) => ({
          ...p,
          value: Number(p.value),
          minBookingAmount: p.minBookingAmount ? Number(p.minBookingAmount) : null,
          usageCount: p._count.usages,
        })),
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/promos - Create a new promo code (admin)
router.post('/', authenticate, adminOnly, async (req, res, next) => {
  try {
    const data = z
      .object({
        code: z.string().min(3).max(20),
        type: z.enum(['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_EXTRA']),
        value: z.number().positive(),
        maxUsesTotal: z.number().positive().optional(),
        maxUsesPerUser: z.number().positive().default(1),
        minBookingAmount: z.number().positive().optional(),
        validFrom: z.string().transform((s) => new Date(s)),
        validUntil: z.string().transform((s) => new Date(s)),
      })
      .parse(req.body);

    // Check for duplicate code
    const existing = await prisma.promoCode.findUnique({
      where: { code: data.code.toUpperCase() },
    });

    if (existing) {
      res.status(400).json({
        success: false,
        error: 'A promo code with this code already exists',
      });
      return;
    }

    const promo = await prisma.promoCode.create({
      data: {
        code: data.code.toUpperCase(),
        type: data.type,
        value: data.value,
        maxUsesTotal: data.maxUsesTotal,
        maxUsesPerUser: data.maxUsesPerUser,
        minBookingAmount: data.minBookingAmount,
        validFrom: data.validFrom,
        validUntil: data.validUntil,
      },
    });

    res.json({
      success: true,
      data: {
        ...promo,
        value: Number(promo.value),
        minBookingAmount: promo.minBookingAmount ? Number(promo.minBookingAmount) : null,
      },
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/promos/:id - Update a promo code (admin)
router.patch('/:id', authenticate, adminOnly, async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = z
      .object({
        isActive: z.boolean().optional(),
        maxUsesTotal: z.number().positive().optional(),
        maxUsesPerUser: z.number().positive().optional(),
        validUntil: z.string().transform((s) => new Date(s)).optional(),
      })
      .parse(req.body);

    const promo = await prisma.promoCode.update({
      where: { id },
      data,
    });

    res.json({
      success: true,
      data: {
        ...promo,
        value: Number(promo.value),
        minBookingAmount: promo.minBookingAmount ? Number(promo.minBookingAmount) : null,
      },
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/promos/:id - Delete a promo code (admin)
router.delete('/:id', authenticate, adminOnly, async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.promoCode.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Promo code deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
