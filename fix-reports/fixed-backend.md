---
title: Backend & Database Fixes
aliases: [fixed-backend, backend fixes, prisma baseline]
tags: [fix, backend, database, prisma, migration, validation, gem-auto-rentals]
created: 2026-08-02
description: Remediation of the backend audit — Prisma migration history baselined against live production, legacy Supabase table investigation, input validation and error-handling fixes in server/.
related:
  - '[[audit-backend]]'
  - '[[INFRASTRUCTURE]]'
  - '[[DEPLOYMENT]]'
  - '[[BUGFIX_CHECKLIST]]'
---

# Backend & Database Fixes

**Scope:** `server/` excluding `server/src/routes/bookings.ts` and `server/src/routes/auth.ts` (owned by another agent).
**Executed:** 2026-08-02 ~08:24–08:40 UTC
**Source task list:** [[audit-backend]]

> [!success] Headline
> The Prisma migration history is baselined. `_prisma_migrations` went from **0 rows to 6**, `prisma migrate status` reports **"Database schema is up to date!"**, and **not a single row of application data changed**. The `prisma migrate diff` landmine no longer proposes dropping any Prisma-managed table — only the 7 orphaned legacy tables remain in its output, and those were deliberately left alone.

---

## Verification summary

| Check                                       | Result                                                          |
| ------------------------------------------- | --------------------------------------------------------------- |
| `pnpm --filter server typecheck`            | **clean** (no output, exit 0)                                   |
| `pnpm --filter server test`                 | **76 passed (76)** — 3 files, unchanged from baseline           |
| `pnpm --filter server build`                | **succeeds** (`prisma generate` + `tsc`)                        |
| Row counts before vs after DB change        | **identical** except `_prisma_migrations` 0 → 6                 |
| `curl https://api.gemrentalcars.com/health` | `{"status":"ok","database":"connected","storage":"configured"}` |

The test suite was run **before** any edit (76 passed) and again after every change (76 passed). No test was added or modified, so the "all 76 must pass" criterion is directly comparable.

---

## 1. CRITICAL — Prisma migration history baselined ✅ DONE

### Before

```
SELECT count(*) FROM _prisma_migrations;  -->  0
```

Zero rows against a fully populated 38-table database. Prisma believed no migration had ever run.

### Backup taken first

```
$ ssh … 'cd /var/www/gem && sudo -u deploy /usr/local/bin/gem-db-backup'
2026-08-02T08:27:34+00:00 OK /var/www/gem/backups/gem_2026-08-02_0827.sql.gz (16083 bytes)
```

The backup rota is healthy — daily backups since 2026-07-27, plus this on-demand one.

### What I did

Standard Prisma "baseline an existing production database" workflow:

1. **Generated a baseline migration** from the schema alone, with no database connection involved:

   ```
   npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script
     > prisma/migrations/0_init/migration.sql
   ```

   Result: 1071 lines — **30 `CREATE TABLE`**, 29 `CREATE TYPE`, 105 index statements, 32 `ALTER TABLE` (foreign keys), and **zero `DROP` statements**.

2. **Added the missing `prisma/migrations/migration_lock.toml`** (`provider = "postgresql"`). It did not exist at all, which is why the migrations directory was not a valid Prisma migration history.

3. **Proved the baseline was correct before touching production.** I created a throwaway database (`gem_baseline_verify_tmp`, owned by `gem_app`, created via the `postgres` superuser), applied `0_init` to it, and diffed the result back against `schema.prisma`:

   ```
   scratch db created (owner gem_app)
   --- applying 0_init to empty scratch db ---
   OK: 0_init applied cleanly to an empty database
   --- table count in scratch ---
   30
   --- DIFF scratch(after 0_init) -> schema.prisma  [EXPECT EMPTY] ---
   bytes=32
   -- This is an empty migration.
   --- cleanup ---
   scratch db dropped
   ```

   This is the strongest available evidence that `0_init` faithfully reproduces the schema. The scratch database was dropped afterwards and is confirmed gone (`pg_database` now lists only `gem_auto_rentals`, `postgres`, `template0`, `template1`). **Production was never involved in this step.**

4. **Marked all six migrations applied** — metadata-only writes, no SQL executed against the schema:
   ```
   Migration 0_init marked as applied.
   Migration 20260125_admin_features marked as applied.
   Migration 20260125_crm_features marked as applied.
   Migration 20260125_soft_delete marked as applied.
   Migration 20260125_stripe_customer marked as applied.
   Migration 20260129_confirmation_email_sent marked as applied.
   ```

All five pre-existing migrations had to be marked applied too, not just `0_init`. If only `0_init` were recorded, the next `migrate deploy` would see five pending migrations and try to run them — and `20260125_admin_features` contains 18 `CREATE TABLE` statements with **no** `IF NOT EXISTS`, so it would fail immediately against the populated database. That is precisely the failure mode the audit warned about.

### After — proof

```
          migration_name          |      finished       | steps | rolled_back_at
----------------------------------+---------------------+-------+----------------
 0_init                           | 2026-08-02 08:28:54 |     0 |
 20260125_admin_features          | 2026-08-02 08:28:55 |     0 |
 20260125_crm_features            | 2026-08-02 08:28:57 |     0 |
 20260125_soft_delete             | 2026-08-02 08:28:59 |     0 |
 20260125_stripe_customer         | 2026-08-02 08:29:01 |     0 |
 20260129_confirmation_email_sent | 2026-08-02 08:29:03 |     0 |
(6 rows)
```

```
$ npx prisma migrate status
6 migrations found in prisma/migrations

Database schema is up to date!
```

No pending migrations. `migrate deploy` is now a safe no-op on this database.

### Row counts — before vs after

Exact `count(*)` on all 38 tables, captured immediately before and immediately after. The complete diff of the two captures:

```
31c31
< _prisma_migrations|0
---
> _prisma_migrations|6
```

**That is the only difference in the entire database.** Every application table is byte-for-byte identical: `User|8`, `Vehicle|8`, `Booking|5`, `Integration|7`, `ActivityLog|2`, `Conversation|2`, `Message|2`, `Document|1`, `CompanySettings|1`, `WaitlistSubscriber|1`, all others 0, `legacy:vehicles|12`.

Health after the change: `{"status":"ok","database":"connected",…}`.

> [!note] Correction to the audit
> The audit's step 3 expected `count(*) = 5`. It is **6**, because a `0_init` baseline had to be created — the five existing migrations are incremental patches that do not describe the full schema on their own, so they cannot serve as a baseline by themselves.

### One caveat, stated plainly

Baselining fixes production, which was the goal. It does **not** make the migration history replayable from scratch onto a brand-new empty database: `0_init` creates every table, and then `20260125_admin_features` would try to `CREATE TABLE` many of them again without `IF NOT EXISTS` and fail.

This was already broken before I started and there is no other environment that provisions from scratch, so I did not act on it. The clean fix is to move the five superseded migration directories into an archive folder leaving only `0_init`, but that rewrites recorded history and is a judgement call I left to the owner.

---

## 2. HIGH — the drop landmine is gone ✅ VERIFIED

Command run on the droplet, **output analysed only, never applied**:

```
npx prisma migrate diff --from-url "$DATABASE_URL" \
  --to-schema-datamodel prisma/schema.prisma --script
```

**Exact and complete output:**

```sql
-- DropTable
DROP TABLE "bookings";

-- DropTable
DROP TABLE "documents";

-- DropTable
DROP TABLE "maintenance_records";

-- DropTable
DROP TABLE "payments";

-- DropTable
DROP TABLE "reviews";

-- DropTable
DROP TABLE "users";

-- DropTable
DROP TABLE "vehicles";
```

That is the entire output — nothing else.

**What changed since the audit.** The audit saw three additional `DROP TABLE "Waitlist*"` statements and three `DROP TYPE` statements. Those are **gone**. The cause was stale deployed code, and it has since been resolved: the droplet's `schema.prisma` now matches the local repo exactly (both `md5 a7f4a578c61b910f26c4065cb7504180`, 1207 lines, 11 waitlist references), `waitlist.ts` is present on the droplet, and `WaitlistSubscriber` now holds 1 live row. Audit finding **C5 is resolved** — not by me; it was already done when I started.

**Interpretation.** Zero `CREATE`, zero `ALTER`, zero `DROP TYPE`. All 30 Prisma models match the live database exactly, column for column. The only destructive proposals are the 7 orphaned legacy tables, handled deliberately in section 3.

**Not applied.** This diff must never be piped to `psql` while those legacy tables are wanted — it would delete the 12 rows in `vehicles`.

---

## 3. MEDIUM — legacy Supabase tables investigated ✅ NOTHING DELETED

The audit hypothesised that legacy `vehicles` (12 rows) vs live `"Vehicle"` (8 rows) meant "4 vehicles were never migrated". **That hypothesis is wrong.** The two tables are independent demo seed datasets, not two versions of one fleet.

### The evidence

**Legacy `vehicles` — 12 rows, all created 2026-01-20, plates `GEM-1001`…`GEM-1012`:**

| make          | model    | plate    | vin               | rate   |
| ------------- | -------- | -------- | ----------------- | ------ |
| Audi          | A4       | GEM-1011 | WAUENAF47MN123456 | 115.00 |
| BMW           | 3 Series | GEM-1003 | 3MW5R1J04M8B12345 | 120.00 |
| Chevrolet     | Suburban | GEM-1007 | 1GNSKJKC4MR123456 | 135.00 |
| Ford          | Explorer | GEM-1005 | 1FM5K8GC2MGA12345 | 95.00  |
| Honda         | Civic    | GEM-1002 | 2HGFC2F59MH123456 | 55.00  |
| Jeep          | Wrangler | GEM-1012 | 1C4HJXDG5MW123456 | 105.00 |
| Mercedes-Benz | E-Class  | GEM-1004 | W1KZF8DB4MA123456 | 175.00 |
| Nissan        | Altima   | GEM-1010 | 1N4BL4BV5MN123456 | 60.00  |
| Porsche       | 911      | GEM-1008 | WP0AB2A94MS123456 | 350.00 |
| Tesla         | Model 3  | GEM-1006 | 5YJ3E1EA5MF123456 | 110.00 |
| Toyota        | Camry    | GEM-1001 | 1HGBH41JXMN109186 | 65.00  |
| Toyota        | RAV4     | GEM-1009 | 2T3W1RFV5MW123456 | 85.00  |

**Live `"Vehicle"` — 8 rows, all created 2026-01-19 (one day _earlier_), plates `ABC-1234`…`VWX-9012`:**

| make          | model    | plate    | vin               | rate   |
| ------------- | -------- | -------- | ----------------- | ------ |
| BMW           | 3 Series | GHI-9012 | 3HGBH41JXMN109188 | 120.00 |
| Chevrolet     | Suburban | STU-5678 | 7HGBH41JXMN109192 | 140.00 |
| Ford          | Mustang  | MNO-7890 | 5HGBH41JXMN109190 | 150.00 |
| Honda         | CR-V     | DEF-5678 | 2HGBH41JXMN109187 | 85.00  |
| Mercedes-Benz | S-Class  | VWX-9012 | 8HGBH41JXMN109193 | 250.00 |
| Nissan        | Versa    | PQR-1234 | 6HGBH41JXMN109191 | 45.00  |
| Tesla         | Model 3  | JKL-3456 | 4HGBH41JXMN109189 | 130.00 |
| Toyota        | Camry    | ABC-1234 | 1HGBH41JXMN109186 | 65.00  |

### Reconciliation

- **Only 1 of 12 legacy rows matches a live row by VIN** — Toyota Camry `1HGBH41JXMN109186`. The other 11 VINs exist nowhere in `"Vehicle"`.
- By make+model+year, 4 pairs "match" (Camry, 3 Series, Suburban, Model 3) but with **different plates, different VINs and different daily rates** — so they are different records describing similar cars, not migrated copies.
- **8 legacy rows have no live counterpart at all:** Audi A4, Ford Explorer, Honda Civic, Jeep Wrangler, Mercedes E-Class, Nissan Altima, Porsche 911, Toyota RAV4.
- **4 live rows have no legacy counterpart:** Ford Mustang, Honda CR-V, Mercedes S-Class, Nissan Versa.

So it is not 12 ⊃ 8 with 4 missing. It is two overlapping-by-one sets going in both directions.

### Provenance — decisive

Both datasets are demo seed data, and I found the exact source of each:

- Legacy `vehicles` is the verbatim output of **`supabase/migrations/003_seed_data.sql`** — that file contains all twelve `GEM-1001`…`GEM-1012` plates and their matching VINs.
- Live `"Vehicle"` is the verbatim output of **`server/prisma/seed.ts`** — that file contains all eight `ABC-1234`…`VWX-9012` plates (lines 110–250).

**No real customer inventory exists in either table.** Nothing was silently lost in the Supabase migration.

### Orphan confirmation

- **Foreign keys referencing the 7 legacy tables: 0.** Foreign keys out of them: 0.
- **Views depending on them: 0.**
- **Bookings pointing at legacy vehicle ids: 0.** All 5 live `Booking.vehicleId` values resolve to `"Vehicle"` rows (Mercedes S-Class ×3, Toyota Camry ×2).
- **No code references them.** Every raw-SQL site in `server/src` uses quoted PascalCase identifiers; a grep for lowercase legacy table names in `FROM`/`INTO` position returns nothing.
- 6 of the 7 are empty; only `vehicles` has rows (12), and `legacy:users` is 0 vs `User` 8.
- `"Vehicle"` has **0 soft-deleted rows** (8 active, 0 with `deletedAt`), so the 8 is not hiding anything.

### Recommendation (owner's call — I deleted nothing)

**Safe to drop all 7 legacy tables.** They are demo seed data from the retired Supabase stack, fully orphaned at the database level and unreferenced by any code. Dropping them would also make `prisma migrate diff` return empty, closing the landmine permanently.

Two caveats before anyone acts:

1. The 12 legacy rows include **8 vehicle models the live fleet does not have** (Porsche 911, Jeep Wrangler, Audi A4, …). If anyone ever wanted that list as a starting point for real inventory, export it first — `supabase/migrations/003_seed_data.sql` already preserves it in the repo, so an export is arguably redundant.
2. Take a backup immediately before, and drop with explicit `DROP TABLE` statements — **not** by piping the `migrate diff` output, so the action stays deliberate and reviewable.

I did not perform the drop: the task said deletion is the owner's call, and a `DROP TABLE` against live production is not reversible without a restore.

---

## 4. MEDIUM — input validation gaps ✅ FIXED

I surveyed every route file for `req.body` reaching the database without a Zod parse. Coverage was already good (`vehicles.ts` 10 parse calls, `promos.ts` 5, `trash.ts` 5, `loyalty.ts` 5, `conversations.ts` 4 …). Four genuine gaps, one of which turned out to be a live bug.

### 4a. `abandonment.ts` — `.uuid()` on cuid ids (real, live bug) 🔴

**`server/src/routes/abandonment.ts:10`**

```ts
vehicleId: z.string().uuid('Invalid vehicle ID'),
```

Every model in `schema.prisma` declares `@id @default(cuid())`. Live vehicle ids look like `cmklsaoi80009gag5etyngkcn` — **cuids, not uuids**. This was the only `.uuid()` call in the entire codebase, and it rejected _every real vehicle id_, so `POST /api/abandonment/track` returned 400 for all valid input.

**Corroborating evidence: `AbandonedBooking` has 0 rows.** The abandoned-booking recovery feature has never recorded a single row since it was written.

Fixed by introducing a shared, correct id validator (see 4d) and using it:

```ts
const vehicleIdSchema = recordId('Invalid vehicle ID');
…
vehicleId: vehicleIdSchema,
```

### 4b. `abandonment.ts` — Prisma operator injection into a `where`

**`POST /api/abandonment/complete`** read `const { vehicleId } = req.body;` with no validation and dropped it straight into `prisma.abandonedBooking.updateMany({ where: { userId, vehicleId, recovered: false } })`.

Because the value came from a JSON body it did not have to be a string. A body of `{"vehicleId":{"not":"x"}}` is interpreted by Prisma as a **filter operator**, not a value, and would mark all of the caller's abandoned bookings recovered in one call. Blast radius was limited to the caller's own rows (`userId` is server-side), but this is exactly the class of bug validation exists to prevent.

Now parsed through `completeAbandonmentSchema`, which forces a string. `vehicleId` is kept `.optional()` because the handler deliberately treats a missing id as a no-op success.

### 4c. `integrations.ts` — arbitrary JSON written to the database

**`PUT /api/integrations/:provider/config`** did `const config = req.body;` and wrote it verbatim into a JSON column. ADMIN-only, but entirely unvalidated — an array, string, number or a 10 MB object (the global body limit) would all be accepted and stored.

Added a shape guard. The individual keys are intentionally not enumerated, because config is provider-specific free-form settings; what is enforced is that it is a plain object of bounded size:

```ts
const configSchema = z
  .record(z.unknown())
  .refine((value) => !Array.isArray(value), { message: 'Config must be an object' })
  .refine((value) => Object.keys(value).length <= 100, {
    message: 'Config cannot have more than 100 keys',
  });
```

I also moved the provider check _above_ the body parse so an invalid provider still fails fast.

### 4d. `favorites.ts` — param validation (defence in depth)

`POST`/`DELETE`/`GET /api/favorites/:vehicleId` took the id straight from the path. Path params are always strings, so there was no injection risk, and the handler verifies the vehicle exists before writing — this was genuinely low-severity. Added shape validation anyway so junk ids return a clear 400 rather than a misleading 404.

**New shared module `server/src/lib/validation.ts`** holds the id validator, so the rule lives in one place:

```ts
export const recordIdSchema = z
  .string().min(1, 'Invalid ID').max(64, 'Invalid ID')
  .regex(/^[a-zA-Z0-9-_]+$/, 'Invalid ID');
export const recordId = (message: string) => …;
```

> [!note] Why not `z.string().cuid()`
> `payments.ts` uses `.cuid()`, but live data contains ids that are **not** cuids — e.g. the `Booking` row with id `sample-booking-1`. A strict `.cuid()` would reject seeded and imported records. The permissive charset check accepts both while still guaranteeing a string of sane length. The audit suggested `z.string().uuid()` here, which would have reproduced bug 4a.

---

## 5. MEDIUM — error handling ✅ FIXED

### 5a. Systemic NaN pagination → 500 where 400 is correct

The audit flagged one instance; it is actually **8 handlers across 5 files**, all sharing this pattern:

```ts
const pageNum = parseInt(page as string, 10);
const limitNum = Math.min(parseInt(limit as string, 10), 100);
const skip = (pageNum - 1) * limitNum;
```

`?page=abc` yields `NaN`, which propagates into Prisma's `skip`/`take`; Prisma rejects it and the request returns **500 for what is plainly a client error**. `?page=0` does the same via a negative `skip`. A JSON-typed value such as `limit[gt]=1` also produces `NaN`.

Fixed with a new shared helper **`server/src/lib/pagination.ts`**, applied at all 8 sites:

| File               | Handler(s)                                            |
| ------------------ | ----------------------------------------------------- |
| `notifications.ts` | `GET /`                                               |
| `conversations.ts` | `GET /`, `GET /:id`                                   |
| `invoices.ts`      | `GET /`                                               |
| `activity.ts`      | `GET /`, `GET /user/:userId`, `GET /entity/:type/:id` |
| `customers.ts`     | `GET /:id/bookings` (uses `pageSize`)                 |

Measured behaviour of the helper (verified by direct execution):

```
OK   normal          -> page=2 limit=20 skip=20
OK   defaults        -> page=1 limit=20 skip=0
OK   blank strings   -> page=1 limit=20 skip=0
400  NaN page        -> page must be a number
400  NaN limit       -> limit must be a number
400  page=0          -> page must be 1 or greater
400  negative page   -> page must be 1 or greater
400  negative limit  -> limit must be 1 or greater
OK   limit over max  -> page=1 limit=100 skip=0     <- still clamps
400  float page      -> page must be a whole number
400  object inject   -> limit must be a number
```

Two deliberate design choices:

- **`limit` above the maximum is clamped, not rejected.** The old `Math.min(…, 100)` silently clamped, and a frontend may be sending a larger value expecting that. Rejecting it would have been a breaking change. An unbounded `take` still cannot reach the database.
- **Blank values fall back to defaults.** `?page=` would otherwise coerce to `0` and 400; treating blank as "not supplied" preserves the existing lenient behaviour.

The per-handler default page sizes were preserved exactly (activity 50/50/50, conversations 20/50, invoices 20, notifications 20, customers 20), verified against the original destructuring defaults.

`ZodError` is already rendered as a 400 with clean field details by `middleware/errorHandler.ts:18`, so no error-handler change was needed.

`promos.ts` and `loyalty.ts` already guarded correctly (`Math.max(1, parseInt(page) || 1)`) and were left alone.

### 5b. `billing.ts` — non-string `planId` reaching Stripe

`POST /api/billing/upgrade` did `const { planId } = req.body;` and forwarded it to `stripe.checkout.sessions.create`. The handler maps `StripeInvalidRequestError` to 400, but a non-string (e.g. an object) can fail inside the SDK _before_ becoming a Stripe error, producing a 500. Now validated as a non-empty string, so it is a 400.

### 5c. Internal-detail leakage — re-verified, no change needed

`middleware/errorHandler.ts` is correct: line 63 returns `'Internal server error'` for non-operational errors, and line 68 gates stack traces on `NODE_ENV === 'development'`. `NODE_ENV` is set on the droplet. Live probes during the audit confirmed malformed JSON → 400 and unknown route → 404 with a clean body. **No leak found; nothing changed.**

---

## 6. Remaining findings

### 6a. C6 `/api/migrate` — hardened, not removed ✅

`server/src/routes/migrate.ts` exposes `/make-admin` (grants ADMIN by email, with **no** `authenticate` and **no** `authorize`), `/clear-table` (`TRUNCATE … CASCADE`), `/user` (delete by email), `/import-data` and `/from-source`. Each handler checks only a static `x-migration-key` header with a non-constant-time comparison.

It fails closed **today** solely because `MIGRATION_KEY` is unset — one `.env` line from being live.

I added router-level defence in depth so the key alone is never sufficient:

```ts
router.use(authenticate, adminOnly);
```

Zero blast radius: I grepped the whole repo and **nothing** references `/api/migrate` or `x-migration-key` outside `migrate.ts` itself — no frontend call, no deploy script. Every route returned 401 before and returns 401 now.

**I did not un-mount it**, which is the audit's preferred fix (`index.ts:215`). Removing a capability from live infrastructure is a product decision, and the hardening above removes the immediate risk. **Recommendation: delete the mount** — the Supabase migration is complete and section 3 shows the legacy tables are orphaned, so these one-time tools no longer need a network surface.

### 6b. C3 route shadowing — already fixed by another agent ✅ VERIFIED

The audit reported `/customers/profile`, `/invoices/my` and `/sessions/revoke-all` being shadowed by `/:id` routes. **All three were already reordered before I started.** Current registration order:

- `customers.ts`: `GET /profile` line 149, `PUT /profile` line 181 — both **before** `GET /:id` (245) and `PUT /:id` (321) ✅
- `invoices.ts`: `GET /my` line 158 — **before** `GET /:id` (192) ✅
- `sessions.ts`: `DELETE /revoke-all` line 242 — **before** `DELETE /:id` (278) ✅

I wrote a checker that parses every `router.<method>('<path>')` in all 26 route files and reports any literal route registered after a param route that would match it. Result: **0 shadowing issues** across the whole codebase.

**Answering audit item S1** (the audit deferred this to the frontend agents): the frontends _do_ call all three paths, so these were live user-facing failures —
`apps/web/src/lib/api.ts:629,632` → `/customers/profile`; `apps/web/src/lib/api.ts:772` → `/invoices/my`; `apps/admin/src/lib/api.ts:805` → `/sessions/revoke-all`.
Confirming the fix was worth making.

### 6c. C4 auth rate limiting — already fixed by another agent; my duplicate reverted ✅

I first added per-endpoint limiters in `index.ts`, then found the `auth.ts` owner had already added `authLimiter` (10 / 15 min, `skipSuccessfulRequests: true`) on `/register`, `/login`, `/reset-password` and `passwordResetLimiter` (5 / hr) on `/forgot-password`.

**I reverted my `index.ts` change entirely.** Two independent limiters stacked on the same paths would double-count every request against separate stores, roughly halving the real allowance and producing confusing throttling. `index.ts` is unchanged from how I found it.

> [!warning] Handover to the `auth.ts` owner
> **`POST /api/auth/sso-exchange` (`auth.ts:315`) still has no limiter** — it is the one credential-exchange endpoint left on the global 200/15min. `auth.ts` is outside my scope so I did not touch it.

### 6d. S3 `?limit=notanumber` on `/api/vehicles` — false positive, no change

`vehicles.ts:139` validates with `vehicleFilterSchema.parse(req.query)`, and the schema uses **`pageSize`**, not `limit`:

```ts
page: z.coerce.number().int().positive().default(1),
pageSize: z.coerce.number().int().min(1).max(100).default(12),
```

`limit` is simply an unknown key, which Zod strips — so **200 is the correct response**, and there _is_ a hard maximum (`.max(100)`). Nothing to fix.

### 6e. C7 soft-delete cleanup job — deliberately NOT scheduled ⚠️

`server/src/jobs/cleanupDeletedRecords.ts` has zero importers, confirmed.

**I deliberately left this alone.** Scheduling it would start **permanently deleting** soft-deleted records from live production on a timer. That is an irreversible, data-destroying background job, and switching it on is not a change to make unilaterally during a fix pass — the retention policy is a business decision and the job's thresholds have never been exercised against real data. Impact of leaving it is low and slow-growing (most tables have 0 rows).

**Recommendation:** decide the retention window first, then run `pnpm --filter server cleanup:deleted:dry` (a dry-run script already exists) against production and review the output before scheduling anything.

### 6f. S5 OAuth `state` not verified — left, needs product context

`integrations.ts` `GET /:provider/callback` destructures `state` as `_state` and never checks it, so the OAuth CSRF state is unvalidated. `Integration` has 7 rows, so the flow may be live.

I left this: implementing state verification requires storing and expiring a per-request nonce, which is a design change to a live OAuth flow rather than a contained fix, and getting it wrong would break integrations that currently work. Flagging for a dedicated piece of work.

### 6g. S4 `/health` and `/sitemap.xml` outside the rate limiter — left

Confirmed accurate (`index.ts` applies the limiter to `/api` only). Left as-is: both are cheap, `/sitemap.xml` has a 3600 s cache header, and adding throttling to `/health` risks interfering with uptime monitoring.

---

## Files changed

**New**

| File                                            | Purpose                                                  |
| ----------------------------------------------- | -------------------------------------------------------- |
| `server/src/lib/pagination.ts`                  | Shared Zod pagination parsing — fixes the NaN→500 class  |
| `server/src/lib/validation.ts`                  | Shared `recordId` validator (cuid-compatible)            |
| `server/prisma/migrations/0_init/migration.sql` | Baseline migration, 1071 lines, verified on a scratch DB |
| `server/prisma/migrations/migration_lock.toml`  | Was missing; required for a valid migration history      |

**Modified**

| File                                 | Change                                                             |
| ------------------------------------ | ------------------------------------------------------------------ |
| `server/src/routes/abandonment.ts`   | `.uuid()`→cuid-safe id (live bug); validated `/complete` body      |
| `server/src/routes/integrations.ts`  | Validated config JSON shape and size; provider check moved earlier |
| `server/src/routes/billing.ts`       | Validated `planId` as a non-empty string                           |
| `server/src/routes/favorites.ts`     | Param id validation ×3                                             |
| `server/src/routes/notifications.ts` | Pagination helper                                                  |
| `server/src/routes/conversations.ts` | Pagination helper ×2                                               |
| `server/src/routes/activity.ts`      | Pagination helper ×3                                               |
| `server/src/routes/invoices.ts`      | Pagination helper                                                  |
| `server/src/routes/customers.ts`     | Pagination helper (`pageSize`)                                     |
| `server/src/routes/migrate.ts`       | Router-level `authenticate, adminOnly`                             |

`server/src/index.ts` is **unchanged** (my rate-limiter addition was reverted — see 6c). `server/src/routes/payments.ts` shows in `git diff` but is **another agent's** demo-payment gating, not mine. `bookings.ts` and `auth.ts` were never touched.

**Not committed and not pushed**, as instructed. No `.env` file was read or modified. No dev server was started.

---

## Deployment status

> [!important] These code changes are NOT deployed
> Everything in section 4, 5 and 6 exists only in the local repo. The droplet still runs the previously built `dist/`. The database work in sections 1–3 **is** live, and is independent of the code changes.
>
> The droplet's `prisma/migrations/` directory was updated with `0_init/migration.sql` and `migration_lock.toml` — this was required for `migrate resolve` to run there, and it must stay in place for `migrate status` to keep reporting correctly. It matches the repo exactly (`md5 518caf7bf4f117dafa06a53dec97678c`).
>
> When deploying: run `prisma generate`, rebuild, `pm2 restart gem-api`. **`prisma migrate deploy` is now safe** (it is a no-op), but it is still unnecessary.

### Latent trap worth knowing about

`server/package.json` still has:

```json
"start": "prisma migrate deploy && tsx prisma/seed.ts && node dist/index.js"
```

pm2 does **not** use this — it runs `node dist/index.js` directly (`pm_exec_path: /var/www/gem/app/server/dist/index.js`, `exec_interpreter: node`), which is why the empty-history problem never crashed a restart. But anyone running `npm start` on the droplet would have triggered `migrate deploy` against the un-baselined database, plus a re-seed. After this fix that path is safe; before it, it would have half-applied. Worth keeping in mind.

---

## Housekeeping

All temporary artefacts I created on the droplet were removed: the scratch SQL and shell scripts under `/var/www/gem/` and `/tmp/`, and the `gem_baseline_verify_tmp` database. Verified — `/var/www/gem/` contains only `admin app backups install.log server web`, and `pg_database` lists only `gem_auto_rentals`, `postgres`, `template0`, `template1`.

Backup retained: `/var/www/gem/backups/gem_2026-08-02_0827.sql.gz`.

---

## Nothing failed

Every change I attempted succeeded and is verified above. Two things were **deliberately not done** and are called out with reasons: **scheduling the cleanup job** (6e — irreversible deletion of live data) and **dropping the legacy tables** (section 3 — explicitly the owner's call). One thing was **done and then reverted** on purpose: the duplicate auth rate limiter (6c). Two audit findings needed **no action** because another agent had already fixed them (C3, C5) and one was a **false positive** (S3).
