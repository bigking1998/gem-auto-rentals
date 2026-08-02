import { Router } from 'express';
import { randomBytes } from 'crypto';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import prisma from '../lib/prisma.js';
import { authenticate, staffOnly } from '../middleware/auth.js';
import { BadRequestError, NotFoundError, ConflictError } from '../middleware/errorHandler.js';
import { sendWaitlistWelcomeEmail, sendWaitlistCampaignEmail } from '../lib/email.js';

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

/**
 * GET /api/waitlist/export.csv
 * Staff only. The list is the asset — it must never be trapped in this admin.
 */
router.get('/export.csv', authenticate, staffOnly, async (_req, res, next) => {
  try {
    const subs = await prisma.waitlistSubscriber.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const esc = (v: unknown) => {
      const str = v === null || v === undefined ? '' : String(v);
      return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
    };

    const header = [
      'Name',
      'Email',
      'Phone',
      'Status',
      'Interest',
      'Timeframe',
      'Source',
      'Signed Up',
      'Emails Received',
      'Last Emailed',
    ];
    const rows = subs.map((s) =>
      [
        s.name,
        s.email,
        s.phone,
        s.status,
        s.interestCategory,
        s.timeframe,
        s.source,
        s.createdAt.toISOString(),
        s.emailsReceived,
        s.lastEmailedAt ? s.lastEmailedAt.toISOString() : '',
      ]
        .map(esc)
        .join(',')
    );

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="gem-waiting-list-${new Date().toISOString().slice(0, 10)}.csv"`
    );
    return res.send([header.join(','), ...rows].join('\n'));
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /api/waitlist/campaigns
 * Staff only. Send history — without it you re-send the same message or lose
 * track of who has heard what.
 */
router.get('/campaigns', authenticate, staffOnly, async (_req, res, next) => {
  try {
    const campaigns = await prisma.waitlistCampaign.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        subject: true,
        sentByEmail: true,
        recipientCount: true,
        successCount: true,
        failureCount: true,
        status: true,
        createdAt: true,
        completedAt: true,
      },
    });
    return res.json({ success: true, data: campaigns });
  } catch (err) {
    return next(err);
  }
});

const campaignSchema = z.object({
  subject: z.string().trim().min(3, 'Subject is required').max(200),
  body: z.string().trim().min(10, 'Message is too short').max(10000),
  // omit to email every eligible subscriber
  subscriberIds: z.array(z.string().cuid()).max(5000).optional(),
});

/**
 * POST /api/waitlist/campaign
 * Staff only. Sends INDIVIDUALLY — never one message with many recipients,
 * which would expose every subscriber's address to every other subscriber.
 */
router.post('/campaign', authenticate, staffOnly, async (req, res, next) => {
  try {
    const parsed = campaignSchema.safeParse(req.body);
    if (!parsed.success) {
      throw BadRequestError(parsed.error.errors[0]?.message ?? 'Invalid campaign');
    }
    const { subject, body, subscriberIds } = parsed.data;

    // Never email anyone who unsubscribed, hard-bounced or complained.
    const recipients = await prisma.waitlistSubscriber.findMany({
      where: {
        status: 'SUBSCRIBED',
        suppressedAt: null,
        ...(subscriberIds && subscriberIds.length ? { id: { in: subscriberIds } } : {}),
      },
      select: { id: true, name: true, email: true, unsubscribeToken: true },
    });

    if (recipients.length === 0) {
      throw BadRequestError('No eligible subscribers selected');
    }

    const campaign = await prisma.waitlistCampaign.create({
      data: {
        subject,
        body,
        sentById: req.user!.id,
        sentByEmail: req.user!.email,
        recipientCount: recipients.length,
        status: 'SENDING',
        startedAt: new Date(),
      },
    });

    let success = 0;
    let failure = 0;

    // Sequential with a small gap — Resend rate limits, and a burst of parallel
    // sends is also a good way to look like a spammer.
    for (const r of recipients) {
      const result = await sendWaitlistCampaignEmail(
        r.email,
        r.name,
        subject,
        body,
        r.unsubscribeToken
      );

      if (result.success) success++;
      else failure++;

      await prisma.waitlistCampaignRecipient.create({
        data: {
          campaignId: campaign.id,
          subscriberId: r.id,
          delivered: result.success,
          error: result.success ? null : (result.error ?? 'Unknown error'),
          providerId: result.messageId ?? null,
          sentAt: new Date(),
        },
      });

      if (result.success) {
        await prisma.waitlistSubscriber.update({
          where: { id: r.id },
          data: { lastEmailedAt: new Date(), emailsReceived: { increment: 1 } },
        });
      }

      await new Promise((resolve) => setTimeout(resolve, 120));
    }

    await prisma.waitlistCampaign.update({
      where: { id: campaign.id },
      data: {
        successCount: success,
        failureCount: failure,
        status: failure === recipients.length ? 'FAILED' : 'SENT',
        completedAt: new Date(),
      },
    });

    return res.json({
      success: true,
      data: { campaignId: campaign.id, sent: success, failed: failure, total: recipients.length },
    });
  } catch (err) {
    return next(err);
  }
});

const adminAddSchema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(100),
  email: z.string().trim().toLowerCase().email('Enter a valid email address').max(200),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  interestCategory: z.enum(['ECONOMY', 'STANDARD', 'PREMIUM', 'LUXURY', 'SUV', 'VAN']).optional(),
  timeframe: z.enum(['THIS_WEEK', 'THIS_MONTH', 'NEXT_FEW_MONTHS', 'JUST_BROWSING']).optional(),
  adminNotes: z.string().trim().max(1000).optional(),
  // staff decide — someone who phoned in may not expect a welcome email
  sendWelcome: z.boolean().optional(),
});

/**
 * POST /api/waitlist/admin
 * Staff adding someone who signed up by phone, in person or on paper.
 * Separate from the public route: no rate limit, no honeypot, and consent is
 * recorded as staff-entered rather than fabricating a web consent trail.
 */
router.post('/admin', authenticate, staffOnly, async (req, res, next) => {
  try {
    const parsed = adminAddSchema.safeParse(req.body);
    if (!parsed.success) {
      throw BadRequestError(parsed.error.errors[0]?.message ?? 'Invalid details');
    }
    const { name, email, phone, interestCategory, timeframe, adminNotes, sendWelcome } =
      parsed.data;

    const existing = await prisma.waitlistSubscriber.findUnique({ where: { email } });
    if (existing) {
      throw ConflictError('That email is already on the waiting list');
    }

    const subscriber = await prisma.waitlistSubscriber.create({
      data: {
        name,
        email,
        phone: phone || null,
        interestCategory: interestCategory ?? null,
        timeframe: timeframe ?? null,
        adminNotes: adminNotes || null,
        source: 'admin',
        // Honest consent record: this person did not tick a box on the website,
        // so do not pretend they did. Staff identity is the audit trail.
        consentIp: null,
        consentUserAgent: `staff-entry:${req.user!.email}`,
        profileCompletedAt: interestCategory || timeframe ? new Date() : null,
      },
    });

    if (sendWelcome) {
      sendWaitlistWelcomeEmail(
        subscriber.email,
        subscriber.name,
        subscriber.unsubscribeToken
      ).catch((err) => console.error('Waitlist welcome email failed:', err?.message ?? err));
    }

    return res.status(201).json({ success: true, data: { id: subscriber.id } });
  } catch (err) {
    return next(err);
  }
});

/**
 * PATCH /api/waitlist/:id/status
 * Staff only. Unsubscribe or re-subscribe someone who asked verbally.
 * Preferred over deletion — it keeps the consent history intact.
 */
router.patch('/:id/status', authenticate, staffOnly, async (req, res, next) => {
  try {
    const { status } = z.object({ status: z.enum(['SUBSCRIBED', 'UNSUBSCRIBED']) }).parse(req.body);

    const subscriber = await prisma.waitlistSubscriber.findUnique({ where: { id: req.params.id } });
    if (!subscriber) throw NotFoundError('Subscriber not found');

    // A suppressed address bounced or filed a spam complaint. Re-subscribing it
    // would damage sending reputation, so that has to be resolved deliberately.
    if (subscriber.status === 'SUPPRESSED' && status === 'SUBSCRIBED') {
      throw BadRequestError('This address bounced or reported spam and cannot be re-subscribed');
    }

    await prisma.waitlistSubscriber.update({
      where: { id: req.params.id },
      data: {
        status,
        unsubscribedAt: status === 'UNSUBSCRIBED' ? new Date() : null,
      },
    });

    return res.json({ success: true, data: { status } });
  } catch (err) {
    return next(err);
  }
});

/**
 * DELETE /api/waitlist/:id
 * Staff only. Permanent — for duplicates, typos, and erasure requests.
 * Unsubscribing is usually the better choice; this exists for when a record
 * genuinely should not exist.
 */
router.delete('/:id', authenticate, staffOnly, async (req, res, next) => {
  try {
    const subscriber = await prisma.waitlistSubscriber.findUnique({ where: { id: req.params.id } });
    if (!subscriber) throw NotFoundError('Subscriber not found');

    await prisma.waitlistSubscriber.delete({ where: { id: req.params.id } });

    return res.json({ success: true, data: { deleted: true, email: subscriber.email } });
  } catch (err) {
    return next(err);
  }
});

export default router;
