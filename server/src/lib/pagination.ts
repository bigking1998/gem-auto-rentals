import { z } from 'zod';

/**
 * Shared pagination parsing for list endpoints.
 *
 * Query values always arrive as strings, so a bare `parseInt()` quietly yields
 * NaN for junk input such as `?page=abc`. That NaN used to flow straight into
 * Prisma's `skip`/`take`, which rejects it — surfacing a plain client mistake as
 * a 500. `?page=0` was the same story via a negative `skip`.
 *
 * Parsing through Zod turns both cases into a 400 with a useful field message
 * (the shared error handler already renders ZodError as 400).
 *
 * `limit` is *clamped* rather than rejected when it exceeds `maxLimit`, because
 * that is what the previous `Math.min(..., 100)` did and callers may rely on it.
 * An over-large limit therefore still cannot reach the database as an unbounded
 * `take`.
 */

export interface Pagination {
  page: number;
  limit: number;
  skip: number;
}

/** Treat an omitted or blank query value as "not supplied" so defaults apply. */
const blankToUndefined = (value: unknown) => (value === '' || value === null ? undefined : value);

export function parsePagination(
  rawPage: unknown,
  rawLimit: unknown,
  options: { defaultLimit?: number; maxLimit?: number } = {}
): Pagination {
  const { defaultLimit = 20, maxLimit = 100 } = options;

  const schema = z.object({
    page: z.preprocess(
      blankToUndefined,
      z.coerce
        .number({ invalid_type_error: 'page must be a number' })
        .int('page must be a whole number')
        .min(1, 'page must be 1 or greater')
        .default(1)
    ),
    limit: z.preprocess(
      blankToUndefined,
      z.coerce
        .number({ invalid_type_error: 'limit must be a number' })
        .int('limit must be a whole number')
        .min(1, 'limit must be 1 or greater')
        .default(defaultLimit)
    ),
  });

  const { page, limit } = schema.parse({ page: rawPage, limit: rawLimit });
  const cappedLimit = Math.min(limit, maxLimit);

  return { page, limit: cappedLimit, skip: (page - 1) * cappedLimit };
}
