import { Router } from 'express';
import { randomBytes } from 'crypto';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import prisma from '../lib/prisma.js';
import { authenticate, staffOnly } from '../middleware/auth.js';
import { BadRequestError, NotFoundError } from '../middleware/errorHandler.js';
import { sendWaitlistWelcomeEmail } from '../lib/email.js';

const router = Router();

// A public form collecting email addresses WILL attract bots, usually within
// days of going live. Tight limit per IP.
const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, error: 'Too many signups from this address. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  // rate limit state is process-wide, so it bleeds between tests
  skip: () => process.env.NODE_ENV === 'test',
});

const signupSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your name').max(100),
  email: z.string().trim().toLowerCase().email('Please enter a valid email address').max(200),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  source: z.string().trim().max(50).optional(),
  // Honeypot: a field hidden from real users. Accept ANY value here — if we
  // reject it in validation the bot learns it was detected. It is handled
  // silently in the handler instead.
  website: z.string().max(200).optional(),
});

const profileSchema = z.object({
  interestCategory: z.enum(['ECONOMY', 'STANDARD', 'PREMIUM', 'LUXURY', 'SUV', 'VAN']).optional(),
  timeframe: z.enum(['THIS_WEEK', 'THIS_MONTH', 'NEXT_FEW_MONTHS', 'JUST_BROWSING']).optional(),
  budgetMax: z.number().positive().max(100000).optional(),
  notes: z.string().trim().max(1000).optional(),
});

function newToken(): string {
  return randomBytes(24).toString('hex');
}

/**
 * POST /api/waitlist
 * Public. Deliberately minimal — name, email, phone. Segmentation is collected
 * afterwards on the thank-you page, so abandoning that step never costs us the
 * subscriber.
 */
router.post('/', signupLimiter, async (req, res, next) => {
  try {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      throw BadRequestError(parsed.error.errors[0]?.message ?? 'Invalid details');
    }
    const { name, email, phone, source, website } = parsed.data;

    // Bot filled the honeypot. Return success so it does not learn anything.
    if (website) {
      return res.status(201).json({ success: true, data: { alreadySubscribed: false } });
    }

    const profileToken = newToken();
    const profileTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const consentIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || null;
    const consentUserAgent = (req.headers['user-agent'] as string)?.slice(0, 500) || null;

    const existing = await prisma.waitlistSubscriber.findUnique({ where: { email } });

    if (existing) {
      // Already on the list. Do not send a second welcome email, but do refresh
      // the profile token so they can still fill in preferences.
      const updated = await prisma.waitlistSubscriber.update({
        where: { email },
        data: {
          name,
          phone: phone || existing.phone,
          profileToken,
          profileTokenExpires,
          // someone re-subscribing has clearly opted back in
          ...(existing.status === 'UNSUBSCRIBED'
            ? { status: 'SUBSCRIBED' as const, unsubscribedAt: null }
            : {}),
        },
      });

      return res.status(200).json({
        success: true,
        data: {
          alreadySubscribed: true,
          profileToken: updated.profileToken,
          name: updated.name,
        },
      });
    }

    const subscriber = await prisma.waitlistSubscriber.create({
      data: {
        name,
        email,
        phone: phone || null,
        source: source || 'website',
        referrer: (req.headers.referer as string)?.slice(0, 500) || null,
        consentIp,
        consentUserAgent,
        profileToken,
        profileTokenExpires,
      },
    });

    // Never let an email failure lose the signup — the record is already saved.
    sendWaitlistWelcomeEmail(subscriber.email, subscriber.name, subscriber.unsubscribeToken).catch(
      (err) => console.error('Waitlist welcome email failed:', err?.message ?? err)
    );

    return res.status(201).json({
      success: true,
      data: {
        alreadySubscribed: false,
        profileToken: subscriber.profileToken,
        name: subscriber.name,
      },
    });
  } catch (err) {
    return next(err);
  }
});

/**
 * PATCH /api/waitlist/profile/:token
 * Public but token-scoped. Can ONLY update preference fields — never email or
 * identity — so a leaked token cannot be used to alter someone's contact details.
 */
router.patch('/profile/:token', async (req, res, next) => {
  try {
    const { token } = req.params;
    const parsed = profileSchema.safeParse(req.body);
    if (!parsed.success) {
      throw BadRequestError(parsed.error.errors[0]?.message ?? 'Invalid selection');
    }

    const subscriber = await prisma.waitlistSubscriber.findUnique({
      where: { profileToken: token },
    });

    if (!subscriber) throw NotFoundError('This link is no longer valid');
    if (subscriber.profileTokenExpires && subscriber.profileTokenExpires < new Date()) {
      throw BadRequestError('This link has expired');
    }

    await prisma.waitlistSubscriber.update({
      where: { id: subscriber.id },
      data: {
        ...parsed.data,
        profileCompletedAt: new Date(),
        // one-time use
        profileToken: null,
        profileTokenExpires: null,
      },
    });

    return res.json({ success: true, data: { saved: true } });
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /api/waitlist/unsubscribe/:token
 * Public, permanent token. Required in every marketing email by CAN-SPAM.
 */
router.get('/unsubscribe/:token', async (req, res, next) => {
  try {
    const subscriber = await prisma.waitlistSubscriber.findUnique({
      where: { unsubscribeToken: req.params.token },
    });
    if (!subscriber) throw NotFoundError('This link is no longer valid');

    if (subscriber.status !== 'UNSUBSCRIBED') {
      await prisma.waitlistSubscriber.update({
        where: { id: subscriber.id },
        data: { status: 'UNSUBSCRIBED', unsubscribedAt: new Date() },
      });
    }

    return res.json({ success: true, data: { unsubscribed: true, email: subscriber.email } });
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /api/waitlist
 * Staff only. Search, filter and paginate the list.
 */
router.get('/', authenticate, staffOnly, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(String(req.query.limit ?? '50'), 10) || 50));
    const search = String(req.query.search ?? '').trim();
    const status = String(req.query.status ?? '').trim();
    const interest = String(req.query.interest ?? '').trim();

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status;
    if (interest) where.interestCategory = interest;

    const [items, total, stats] = await Promise.all([
      prisma.waitlistSubscriber.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          status: true,
          interestCategory: true,
          timeframe: true,
          source: true,
          createdAt: true,
          lastEmailedAt: true,
          emailsReceived: true,
          profileCompletedAt: true,
        },
      }),
      prisma.waitlistSubscriber.count({ where }),
      prisma.waitlistSubscriber.groupBy({ by: ['status'], _count: true }),
    ]);

    return res.json({
      success: true,
      data: {
        items,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        stats: Object.fromEntries(stats.map((s) => [s.status, s._count])),
      },
    });
  } catch (err) {
    return next(err);
  }
});

export default router;
