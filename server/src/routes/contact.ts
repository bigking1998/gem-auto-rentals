import { Router } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import prisma from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { sendContactMessageEmails } from '../lib/email.js';

const router = Router();

/**
 * Public "Contact us" messages.
 *
 * The website form used to build a `mailto:` link and hand off to the visitor's
 * own mail client. That meant nothing was stored, nothing reached the business
 * unless the visitor pressed send themselves, and a visitor without a configured
 * mail client pressed the button and saw nothing happen at all. For a site about
 * to carry paid traffic that is a hole straight through the funnel.
 */

// Public and unauthenticated, so it needs its own throttle.
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many messages. Please try again shortly.' },
});

const contactSchema = z.object({
  name: z.string().trim().min(1, 'Please tell us your name').max(120),
  email: z.string().trim().email('That email address does not look right').max(200),
  subject: z.string().trim().max(200).optional().or(z.literal('')),
  message: z.string().trim().min(1, 'Please write a message').max(5000),
  // Honeypot: a real person never fills a hidden field. Bots fill everything.
  website: z.string().max(0).optional(),
});

// POST /api/contact — public
router.post('/', contactLimiter, async (req, res, next) => {
  try {
    const data = contactSchema.parse(req.body);

    // Silently accept and discard obvious bot submissions: returning an error
    // just tells the bot to try again differently.
    if (data.website) {
      return res.status(201).json({ success: true, data: { received: true } });
    }

    const saved = await prisma.contactMessage.create({
      data: {
        name: data.name,
        email: data.email,
        subject: data.subject || null,
        message: data.message,
        ipAddress: req.ip ?? null,
        userAgent: req.headers['user-agent']?.slice(0, 500) ?? null,
      },
    });

    // The message is already stored, so a mail failure must not fail the
    // request — the customer should never retype a message we already have.
    const teamInbox = process.env.CONTACT_INBOX || 'Bookings@Gemrentalcars.com';
    const mail = await sendContactMessageEmails({
      name: data.name,
      email: data.email,
      subject: data.subject || null,
      message: data.message,
      teamInbox,
    });
    if (!mail.success) {
      console.error('Contact message saved but email failed:', saved.id, mail.error);
    }

    return res.status(201).json({ success: true, data: { received: true } });
  } catch (error) {
    return next(error);
  }
});

// GET /api/contact — staff only
router.get('/', authenticate, authorize('ADMIN', 'MANAGER', 'SUPPORT'), async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 25));
    const handledParam = req.query.handled;
    const where =
      handledParam === 'true'
        ? { handled: true }
        : handledParam === 'false'
          ? { handled: false }
          : {};

    const [items, total] = await Promise.all([
      prisma.contactMessage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.contactMessage.count({ where }),
    ]);

    return res.json({
      success: true,
      data: { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error) {
    return next(error);
  }
});

// PATCH /api/contact/:id — staff only; mark handled / add a note
router.patch(
  '/:id',
  authenticate,
  authorize('ADMIN', 'MANAGER', 'SUPPORT'),
  async (req, res, next) => {
    try {
      const body = z
        .object({ handled: z.boolean().optional(), notes: z.string().max(5000).optional() })
        .parse(req.body);

      const updated = await prisma.contactMessage.update({
        where: { id: req.params.id },
        data: {
          ...(body.handled !== undefined
            ? { handled: body.handled, handledAt: body.handled ? new Date() : null }
            : {}),
          ...(body.notes !== undefined ? { notes: body.notes } : {}),
        },
      });

      return res.json({ success: true, data: updated });
    } catch (error) {
      return next(error);
    }
  }
);

export default router;
