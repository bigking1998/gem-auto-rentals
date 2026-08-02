import { z } from 'zod';

/**
 * Shared validation for record identifiers.
 *
 * Every model in schema.prisma declares `@default(cuid())`, so ids are cuids —
 * never uuids. `z.string().uuid()` therefore rejects every real id, which is how
 * abandonment tracking silently failed closed for its whole life.
 *
 * This validates the shape without hard-coding the cuid format, so ids created
 * by other means (seed data, imports) still pass. It also guarantees the value
 * is a string: ids taken from a request *body* and dropped into a Prisma `where`
 * would otherwise accept an object such as {"not":"x"} and be interpreted as a
 * filter operator rather than a value.
 */
export const recordIdSchema = z
  .string()
  .min(1, 'Invalid ID')
  .max(64, 'Invalid ID')
  .regex(/^[a-zA-Z0-9-_]+$/, 'Invalid ID');

/** Same rules, with a caller-supplied message for a specific field. */
export const recordId = (message: string) =>
  z
    .string()
    .min(1, message)
    .max(64, message)
    .regex(/^[a-zA-Z0-9-_]+$/, message);
