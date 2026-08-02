import { Router, raw } from 'express';
import { createHmac, timingSafeEqual } from 'crypto';
import prisma from '../lib/prisma.js';

const router = Router();

/**
 * Resend delivery webhooks.
 *
 * Without this, dead addresses stay on the list forever: the bounce rate climbs,
 * and eventually Gmail and Outlook route EVERYTHING from this domain to spam —
 * including booking confirmations and password resets. Suppressing bad
 * addresses is what protects the sending reputation over time.
 */

const SIGNING_SECRET = process.env.RESEND_WEBHOOK_SECRET;

/**
 * Resend signs with Svix. The signature is base64 HMAC-SHA256 over
 * `${id}.${timestamp}.${rawBody}`, keyed by the secret with its `whsec_` prefix
 * stripped and the remainder base64-decoded.
 *
 * Requires the RAW body — parsed JSON re-serialised will not match.
 */
function verifySignature(rawBody: Buffer, headers: Record<string, unknown>): boolean {
  if (!SIGNING_SECRET) return false;

  const id = headers['svix-id'] as string | undefined;
  const timestamp = headers['svix-timestamp'] as string | undefined;
  const signatureHeader = headers['svix-signature'] as string | undefined;
  if (!id || !timestamp || !signatureHeader) return false;

  // Reject stale timestamps so a captured request cannot be replayed later.
  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > 300) return false;

  const secretBytes = Buffer.from(SIGNING_SECRET.replace(/^whsec_/, ''), 'base64');
  const expected = createHmac('sha256', secretBytes)
    .update(`${id}.${timestamp}.${rawBody.toString('utf8')}`)
    .digest('base64');

  // The header may carry several space-separated `v1,<sig>` values during a
  // secret rotation; any one matching is valid.
  return signatureHeader.split(' ').some((part) => {
    const sig = part.split(',')[1];
    if (!sig) return false;
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  });
}

router.post('/resend', raw({ type: 'application/json' }), async (req, res, next) => {
  try {
    const rawBody: Buffer = Buffer.isBuffer(req.body) ? req.body : Buffer.from('');

    if (!SIGNING_SECRET) {
      console.error('Resend webhook received but RESEND_WEBHOOK_SECRET is not set — ignoring');
      return res.status(503).json({ success: false, error: 'Webhook not configured' });
    }

    if (!verifySignature(rawBody, req.headers as Record<string, unknown>)) {
      // Anyone can POST here, so an unverified payload must never touch data.
      return res.status(401).json({ success: false, error: 'Invalid signature' });
    }

    const event = JSON.parse(rawBody.toString('utf8')) as {
      type?: string;
      data?: { to?: string | string[]; email_id?: string };
    };

    const type = event.type ?? '';
    const to = Array.isArray(event.data?.to) ? event.data?.to[0] : event.data?.to;
    if (!to) return res.json({ success: true, data: { ignored: 'no recipient' } });

    const email = to.toLowerCase();
    const subscriber = await prisma.waitlistSubscriber.findUnique({ where: { email } });
    // Bounces for booking confirmations etc. are not waiting-list records; ack
    // them so Resend does not retry.
    if (!subscriber) return res.json({ success: true, data: { ignored: 'not a subscriber' } });

    if (type === 'email.bounced') {
      const bounces = subscriber.bounceCount + 1;
      // One bounce can be a full mailbox or a transient outage. Three is a dead
      // address, and continuing to mail it is what damages the domain.
      const suppress = bounces >= 3;
      await prisma.waitlistSubscriber.update({
        where: { id: subscriber.id },
        data: {
          bounceCount: bounces,
          lastBounceAt: new Date(),
          ...(suppress
            ? {
                status: 'SUPPRESSED' as const,
                suppressedAt: new Date(),
                suppressedReason: `Hard bounce (${bounces} failures)`,
              }
            : {}),
        },
      });
      return res.json({ success: true, data: { bounced: true, suppressed: suppress } });
    }

    if (type === 'email.complained') {
      // A spam complaint is unambiguous. Suppress immediately — one more email
      // to this person is worse for deliverability than losing them.
      await prisma.waitlistSubscriber.update({
        where: { id: subscriber.id },
        data: {
          status: 'SUPPRESSED',
          suppressedAt: new Date(),
          suppressedReason: 'Marked as spam',
          unsubscribedAt: new Date(),
        },
      });
      return res.json({ success: true, data: { complained: true, suppressed: true } });
    }

    return res.json({ success: true, data: { ignored: type || 'unknown type' } });
  } catch (err) {
    return next(err);
  }
});

export default router;
