---
title: Backend & Database Audit
aliases: [audit-backend, server audit, api audit]
tags: [audit, backend, security, database, prisma, gem-auto-rentals]
created: 2026-08-02
description: Read-only audit of server/ and the live PostgreSQL database on the DigitalOcean droplet — schema drift, auth enforcement, validation, error handling, and security config.
related:
  - '[[INFRASTRUCTURE]]'
  - '[[DEPLOYMENT]]'
  - '[[WEBSITE_AUDIT]]'
  - '[[BUGFIX_CHECKLIST]]'
---

# Backend & Database Audit

**Scope:** `server/` + live PostgreSQL 17 on droplet `157.245.120.117`
**Audited:** 2026-08-02 ~08:07–08:15 UTC
**Method:** read-only. No files edited, no DB writes, no deploys. All `psql` was `SELECT`; `prisma migrate diff` was run with `--script` and its output analysed, never applied.

---

## Executive summary

The database is in **better shape than expected**. The 12 recently-created tables landed correctly — `prisma migrate diff` produces **zero** `CREATE TABLE` and **zero** `ALTER TABLE` statements. Every model in `schema.prisma` matches the live database column-for-column. That part of the drift problem is genuinely closed.

Auth enforcement is also **broadly correct**. Every protected endpoint tested returned `401`, never `500`. Ownership (IDOR) checks are present and consistent across `bookings`, `documents`, `customers`, `notifications`, `sessions`, `preferences`. The `/api/migrate` routes, which looked alarming, actually fail closed.

The real problems are elsewhere:

1. **`_prisma_migrations` is empty (0 rows).** This is the root cause of the recurring drift, and it is still fully present.
2. **Three route-shadowing bugs** silently break `/customers/profile`, `/invoices/my`, and `/sessions/revoke-all`.
3. **No brute-force rate limiting on auth**, only a global 200/15min.
4. **Deployed code is behind the repo** — `waitlist.ts` and 3 Waitlist tables exist but are not served in production.
5. **`prisma migrate diff` output is a data-loss landmine** — running it would drop 12 rows and 3 tables.

> [!warning] Concurrent edits during this audit
> `server/src/index.ts` changed mid-audit (hash `5585de41…` → `b7f4b93e…`, gaining the `waitlist` import/mount at lines 41 and 220). Another agent or the user is editing this repo live. Line numbers below were captured at ~08:12 UTC and may have shifted. Re-verify before applying fixes.

---

## CONFIRMED findings

### C1 — `_prisma_migrations` is empty; migration history does not exist

**Severity: Critical (data-integrity)** · **Not safe to fix independently**

- **Where:** live DB table `_prisma_migrations`; `server/prisma/migrations/` (5 dirs)
- **Evidence:**
  ```
  SELECT count(*) FROM _prisma_migrations;  -->  0
  SELECT migration_name, ... FROM _prisma_migrations;  -->  (0 rows)
  ```
  Local repo has 5 migration directories: `20260125_admin_features`, `20260125_crm_features`, `20260125_soft_delete`, `20260125_stripe_customer`, `20260129_confirmation_email_sent`.
- **What's wrong:** Prisma believes **no migration has ever been applied**, while the database is fully populated with 30 model tables and live data (8 users, 8 vehicles, 5 bookings). This is precisely why schema changes keep getting hand-patched — there is no safe automated path, so every change becomes manual, and manual changes drift.
- **Consequence if untouched:** the next person who runs `prisma migrate deploy` will have Prisma attempt to apply all 5 migrations from scratch against a populated database. Expect immediate failure on `CREATE TABLE ... already exists`, and a half-applied state.
- **Fix:** baseline the migration history. Do **not** run `migrate deploy` first.
  1. Take a verified DB backup (`/var/www/gem/backups` exists — confirm it is current and restorable).
  2. Generate a baseline migration reflecting current DB state, then mark all 5 existing migrations as already-applied:
     `npx prisma migrate resolve --applied <migration_name>` for each, in chronological order.
  3. Verify `SELECT count(*) FROM _prisma_migrations` returns 5 and `prisma migrate status` reports clean.
  4. Only then does `migrate deploy` become safe for future changes.
- **Why not independent:** this writes to production DB metadata and needs a backup + a rollback plan. Requires human sign-off.

---

### C2 — `prisma migrate diff` output would destroy live data

**Severity: Critical (data-integrity landmine)** · **Fix = documentation only, safe**

- **Where:** output of `prisma migrate diff --from-url "$DATABASE_URL" --to-schema-datamodel prisma/schema.prisma --script`, run on droplet
- **Evidence:** the full script contains **only** destructive statements — no `CREATE`, no `ALTER`:
  ```sql
  DROP TABLE "WaitlistCampaign";
  DROP TABLE "WaitlistCampaignRecipient";
  DROP TABLE "WaitlistSubscriber";
  DROP TABLE "bookings"; DROP TABLE "documents"; DROP TABLE "maintenance_records";
  DROP TABLE "payments"; DROP TABLE "reviews"; DROP TABLE "users"; DROP TABLE "vehicles";
  DROP TYPE "CampaignStatus"; DROP TYPE "WaitlistStatus"; DROP TYPE "WaitlistTimeframe";
  ```
- **What's wrong:** two separate reasons this output is misleading:
  - The **Waitlist drops are an artifact of stale deployed code.** The droplet's `schema.prisma` is 1071 lines / 53 models+enums with **zero** Waitlist definitions; the local repo's is 1207 lines / 58 with them (`md5` 2fcf83f3… vs a7f4a578…). The diff was computed against the _old_ schema, so it wants to drop tables the _current_ schema actually defines.
  - `DROP TABLE "vehicles"` would delete the 12 rows in the legacy Supabase table.
- **Positive finding (important):** because there are no `CREATE`/`ALTER` statements, **all 30 Prisma models match the live database exactly**. The 12 recently-created tables are correct. Schema drift for Prisma-managed models is resolved.
- **Fix:** never pipe this diff to `psql`. Re-run the diff _after_ deploying current code so the Waitlist tables stop appearing as drops. Handle the 7 legacy lowercase tables as a separate, deliberate decision (see M4).

---

### C3 — Route shadowing silently breaks three endpoints

**Severity: High (functional)** · **Safe to fix independently**

Express matches routes in registration order. In all three cases a literal path is registered _after_ a `/:param` route that already matches it, so the literal route is unreachable.

| File                                 | Shadowed route       | Shadowed by              | Actual behaviour                                                                                 |
| ------------------------------------ | -------------------- | ------------------------ | ------------------------------------------------------------------------------------------------ |
| `server/src/routes/customers.ts:592` | `GET /profile`       | `GET /:id` (line 142)    | matches `/:id` with `id="profile"` → 403 for customers, 404 for staff                            |
| `server/src/routes/customers.ts:624` | `PUT /profile`       | `PUT /:id` (line 218)    | same                                                                                             |
| `server/src/routes/invoices.ts:512`  | `GET /my`            | `GET /:id` (line 149)    | `/:id` is `authorize('ADMIN','MANAGER','SUPPORT')` → **customers get 403 on their own invoices** |
| `server/src/routes/sessions.ts:272`  | `DELETE /revoke-all` | `DELETE /:id` (line 241) | matches `/:id` with `id="revoke-all"` → 404, sessions never revoked                              |

- **Evidence:** route registration order confirmed by line number via `grep -nE "^router\.(get|put|post|delete|patch)\('/"`.
- **Note on severity:** `GET /api/invoices/my` is the worst of the three — a customer requesting their own invoices hits the staff-only handler and is rejected. `DELETE /revoke-all` is a security-relevant failure: "sign out everywhere" silently does nothing.
- **Fix:** move each literal route **above** its `/:id` counterpart in the same file. Pure reordering, no logic change.
- **Safe independently:** yes. Confirm the frontends actually call these paths before/after (see S1).

---

### C4 — No brute-force rate limiting on authentication endpoints

**Severity: High (security)** · **Safe to fix independently**

- **Where:** `server/src/index.ts:120-125` (only global limiter); `server/src/routes/auth.ts:61,118,352,398,287`
- **Evidence:**
  ```js
  const limiter = rateLimit({ windowMs: 15*60*1000, max: 200, ... });
  app.use('/api', limiter);
  ```
  `grep -rnE "rateLimit|Limiter"` across all route files returns only `index.ts:121` and `waitlist.ts:14` (`signupLimiter`). No auth-specific limiter exists.
- **What's wrong:** 200 requests per 15 minutes per IP applies uniformly to `POST /api/auth/login`, `/register`, `/forgot-password`, `/reset-password`, and `/sso-exchange`. That permits ~19,200 password attempts per IP per day against a known email, plus unthrottled user enumeration via `/register` and `/forgot-password`.
- **Fix:** add a strict limiter (e.g. `windowMs: 15*60*1000, max: 5-10, skipSuccessfulRequests: true`, keyed on IP + submitted email) applied to `/login`, `/forgot-password`, `/reset-password`, `/sso-exchange`. `waitlist.ts:14` already demonstrates the per-route pattern to copy.
- **Safe independently:** yes, but pick limits that won't lock out legitimate admin usage.

---

### C5 — Deployed backend is behind the repo; Waitlist feature is dead in production

**Severity: High (functional)** · **Not safe to fix independently**

- **Evidence:**
  - `server/src/routes/waitlist.ts` exists locally, **missing** on droplet (`/var/www/gem/app/server/src/routes/waitlist.ts` → MISSING).
  - Droplet `src/index.ts` and `dist/index.js` both contain **0** occurrences of `waitlist`.
  - `curl https://api.gemrentalcars.com/api/waitlist` → **404**.
  - Droplet `schema.prisma` has 0 Waitlist references → the **generated Prisma Client in production has no `waitlistSubscriber` model**, so those 3 tables are unreachable by the running API even if the route were added.
  - All other 26 route files + middleware + lib are **byte-identical** local vs deployed (md5 comparison) — so the rest of this audit reflects production accurately.
- **What's wrong:** three Waitlist tables were created in the DB, and the route file was written, but neither the code nor a regenerated Prisma Client was deployed. The feature is 100% non-functional.
- **Fix:** deploy current `server/` to the droplet, run `prisma generate` (**not** `migrate deploy` until C1 is resolved), rebuild `dist`, `pm2 restart gem-api`. Then re-run the C2 diff to confirm the Waitlist drops disappear.
- **Why not independent:** a production deploy. Sequence it after C1, and note `pm2` already shows **7 restarts** on this process.

---

### C6 — `/api/migrate` exposes destructive operations behind a single static header secret

**Severity: High (design risk)** · **Safe to fix independently**

- **Where:** `server/src/routes/migrate.ts:19, 340, 365, 536, 566`; mounted at `server/src/index.ts:214` (`app.use('/api/migrate', migrateRoutes)`)
- **Evidence — currently fails closed (verified):**
  ```js
  const authKey = req.headers['x-migration-key'];
  const expectedKey = process.env.MIGRATION_KEY;
  if (!expectedKey || authKey !== expectedKey) { res.status(401)...; return; }
  ```
  `grep -cE "^(MIGRATION_KEY|SOURCE_DATABASE_URL|STRIPE_SECRET_KEY|STRIPE_WEBHOOK_SECRET)=" .env` → **0**. `MIGRATION_KEY` is unset, so `!expectedKey` short-circuits and **all 5 endpoints return 401 today**. This is correct fail-closed behaviour.
- **What's still wrong:** the endpoints themselves are extraordinarily dangerous and are one `.env` line away from being live:
  - `POST /make-admin` — **privilege escalation to ADMIN by email**, no `authenticate`, no `authorize`
  - `POST /clear-table` — `TRUNCATE TABLE ... CASCADE` (table name _is_ whitelisted against `ALLOWED_TABLES`, so no SQL injection — good)
  - `DELETE /user` — deletes a user by email
  - `POST /import-data` — arbitrary upsert into the DB from unvalidated request body (no Zod: `zodImport=0 parseCalls=0`)
  - `POST /from-source` — bulk cross-database migration
    They use a hand-rolled header comparison rather than the `authenticate`/`adminOnly` middleware, are non-constant-time, and are subject only to the global 200/15min limiter.
- **Fix (preferred):** un-mount `server/src/index.ts:214` entirely. The migration from Supabase is complete; these are one-time tools that no longer need a network surface. If they must stay, add `authenticate, adminOnly` **in addition to** the key check, and bind the route to localhost only.
- **Safe independently:** yes — removing the mount cannot break the frontends (nothing calls `/api/migrate`).

---

### C7 — Soft-delete cleanup job is never scheduled

**Severity: Medium (data-integrity)** · **Safe to fix independently**

- **Where:** `server/src/jobs/cleanupDeletedRecords.ts`
- **Evidence:** `grep -rn "cleanupDeletedRecords" --include=*.ts` returns **only the file's own definition** — zero importers. No scheduler, no cron entry in `index.ts`.
- **What's wrong:** soft-deleted records accumulate forever. The trash/restore feature (`routes/trash.ts`, `adminOnly` throughout — correctly guarded) writes tombstones that are never purged.
- **Impact today is low** (most tables have 0 rows), but it grows silently.
- **Fix:** either schedule it (`node-cron` in `index.ts`, or a system cron/systemd timer on the droplet calling a script), or delete the file if the retention policy changed.

---

## Findings that checked out CLEAN

Recording these so the next agent doesn't re-audit them.

- **Schema ↔ DB parity: clean.** All 30 Prisma models exist with matching columns. 38 tables total = 30 models + 7 legacy + `_prisma_migrations`. The 12 newly-created tables (`Favorite`, `AbandonedBooking`, `LoyaltyAccount`, `LoyaltyTransaction`, `Referral`, `PromoCode`, `PromoCodeUsage`, `BookingExtension`, `PassRegistration`, 3× Waitlist) are all present and correct.
- **Auth enforcement on mounted routes: clean.** All 19 protected endpoints curled returned `401`, none returned `500`:
  `/api/bookings`, `/customers`, `/favorites`, `/notifications`, `/sessions`, `/activity`, `/conversations`, `/invoices`, `/integrations`, `/billing/plan`, `/trash`, `/promos`, `/loyalty/account`, `/referrals/my-code`, `/documents`, `/stats/dashboard`, `/settings/company`, `/wallet/status`, `/auth/me`.
- **IDOR / ownership checks: clean.** Consistent `isOwner`/`isStaff` gating verified in `customers.ts` (148, 226, 283, 355, 402, 447, 537, 695), `bookings.ts` (104, 205, 327, 409, 512, 601), `documents.ts` (111, 178, 260, 304), `notifications.ts` (89, 140), `sessions.ts` (256), `preferences.ts` (81, 114). `favorites.ts` and `extensions.ts` scope every query by `req.user!.id` rather than trusting a param — the safest pattern in the codebase.
- **Admin-only surfaces correctly gated:** `trash.ts` (all 5 routes `adminOnly`), `promos.ts` CRUD (`adminOnly`), `loyalty.ts` `/admin/*` (`adminOnly`), `integrations.ts` (`authorize('ADMIN')`), `customers.ts:347` role-change (`adminOnly`), `preferences.ts` company writes (`ADMIN`).
- **Stripe unconfigured handling: confirmed correct.** `payments.ts:12` and `billing.ts:13` both use `process.env.STRIPE_SECRET_KEY ? new Stripe(...) : null`. Guards at `payments.ts:19,109,387,467` and `billing.ts:17` (`requireStripe()`) throw `BadRequestError` → **400, not 500**. `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are both unset, as intended.
- **Error handling: clean.** `middleware/errorHandler.ts:68` gates stack traces on `NODE_ENV === 'development'`; `NODE_ENV` is set on the droplet and stacks are not leaking. Line 63 (`err.isOperational ? err.message : 'Internal server error'`) correctly suppresses internal messages. Live probes: malformed JSON → 400; empty login body → 400 with clean Zod field errors; unknown route → 404 `{"success":false,"error":"Route not found"}`.
- **CORS: correct.** `Origin: https://evil.example.com` → **no** `Access-Control-Allow-Origin` header. `Origin: https://gemrentalcars.com` → echoed with `Allow-Credentials: true`. Allowlist at `index.ts:105-114` is explicit (no wildcard, no regex).
- **Runtime error log: clean.** `pm2 logs gem-api --lines 200 --nostream` → `gem-api-error.log` is **empty**. Only morgan access lines in stdout, all 200/304. No recurring errors.
- **Public endpoints all 200:** `/health`, `/api/stats/public`, `/api/vehicles`, `/api/loyalty/tier-info`, `/sitemap.xml`, `/api/vehicles/preview-pricing`, `/api/referrals/validate/:code`. `/api/abandonment/recover/:id` → 404 for a nonexistent id (correct, and `abandonment.ts:144` validates the id format first).
- **Secrets handling:** `.env` is `-rw------- deploy:deploy` (mode 600). 18 variables, all referenced by name only in this report. PostgreSQL bound to 127.0.0.1 as expected.
- **No SQL injection found.** The single `$executeRawUnsafe` (`migrate.ts:558`) interpolates a table name validated against an `ALLOWED_TABLES` whitelist. Every other query uses the Prisma query builder.

---

## SUSPECTED — needs verification

### S1 — Frontends may already be calling the shadowed paths

**Severity: unknown until checked** · Verify before fixing C3

`grep` for `/customers/profile`, `/invoices/my`, `/sessions/revoke-all` across `apps/web` and `apps/admin`. If a frontend calls them, users are hitting silent 403/404s right now and C3 becomes urgent. If nothing calls them, they are dead code and could be deleted instead of reordered. The frontend agents can answer this directly.

### S2 — Missing Zod validation on write routes

**Severity: Medium** · **Safe to fix independently**

Route files with `POST`/`PUT`/`PATCH` handlers but no Zod import:

| File                      | Write routes | Assessment                                                                                                |
| ------------------------- | ------------ | --------------------------------------------------------------------------------------------------------- |
| `routes/migrate.ts`       | 4            | **Writes arbitrary records to the DB from `req.body`** — see C6. Highest risk, but currently unreachable. |
| `routes/notifications.ts` | 2            | `PATCH /:id/read`, `PATCH /read-all` — param-only, no body consumed. Likely fine.                         |
| `routes/favorites.ts`     | 1            | `POST /:vehicleId` — param-only, scoped by `req.user!.id`. Likely fine.                                   |

Coverage elsewhere is good (`vehicles.ts` 10 parse calls, `auth.ts` 6, `customers.ts` 5, `promos.ts` 5, `trash.ts` 5, `loyalty.ts` 5). Suggest confirming the param-only routes genuinely ignore `req.body`, then adding `z.string().uuid()` param validation for defence in depth.

### S3 — `GET /api/vehicles?limit=notanumber` returns 200

**Severity: Low** · **Safe to fix independently**

Live probe returned 200 rather than 400. Likely a `parseInt` producing `NaN` that Prisma coerces or ignores. Worth checking `routes/vehicles.ts:139` for how `limit`/`offset` are parsed — an unvalidated `take` can become an unbounded query. Confirm there is a hard max on `limit`.

### S4 — `/health` and `/sitemap.xml` are outside the rate limiter

**Severity: Low**

`index.ts:125` applies the limiter to `/api` only. `/health` (line 152) queries DB connection state and `/sitemap.xml` (line 222) generates from DB. Both are unthrottled. `/sitemap.xml` has a 3600s cache header which mitigates it. Low priority.

### S5 — OAuth callback is unauthenticated by necessity

**Severity: Low — likely by design**

`routes/integrations.ts:245` — `GET /:provider/callback` has no `authenticate`, correct for an OAuth redirect. It validates `provider` against the `IntegrationProvider` enum and requires `code`. However `state` is destructured as `_state` (**unused**), so CSRF state is not verified. Worth confirming whether the OAuth flow is live — `Integration` has 7 rows, so it may be. If live, validate `state`.

---

## Orphaned / dead code

| Item                                          | Status                                                                                                                                                                                                            |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `server/src/jobs/cleanupDeletedRecords.ts`    | **Never imported.** See C7.                                                                                                                                                                                       |
| `server/src/lib/softDelete.ts`                | Only referenced by `lib/prisma.ts` (Prisma extension) — in use, not dead.                                                                                                                                         |
| `server/src/routes/waitlist.ts`               | Mounted locally (`index.ts:41,220`), **not deployed**. See C5.                                                                                                                                                    |
| 7 legacy lowercase tables                     | `bookings`, `documents`, `maintenance_records`, `payments`, `reviews`, `users` are all **0 rows**; `vehicles` has **12 rows**. No code references them (all Prisma models map to PascalCase). Confirmed orphaned. |
| `server/test-db.ts`, `server/region_check.js` | Ad-hoc scripts at package root, not wired into anything. Cosmetic.                                                                                                                                                |

**Legacy table recommendation (M4):** before dropping, export the 12 `vehicles` rows and diff against the 8 rows in `"Vehicle"`. Verified with exact `count(*)`:

```
 legacy_vehicles | 12       Vehicle | 8
 legacy_users    |  0       User    | 8
```

The legacy `vehicles` table holds **4 more rows** than the live `"Vehicle"` table, so it may contain vehicles that were never migrated. **Verify that before any drop.** Worth checking regardless of whether the tables are removed — this is the one place in the DB where data could be silently missing. (`users` reconciles cleanly at 0 vs 8, so only `vehicles` is in question.)

---

## Suggested order of work

1. **C1** — baseline `_prisma_migrations` (backup first; needs sign-off). Unblocks everything else.
2. **M4 check** — reconcile legacy `vehicles` (12 rows) vs `"Vehicle"` (8 rows) before any cleanup.
3. **C6** — un-mount `/api/migrate`. One line, zero blast radius.
4. **C4** — auth rate limiting.
5. **S1** then **C3** — confirm frontend usage, then reorder the shadowed routes.
6. **C5** — deploy current backend + `prisma generate`, then re-run the C2 diff to verify it comes back empty.
7. **C7, S2, S3, S5** — cleanup pass.

## Commands used (all read-only)

```bash
ssh -i ~/.ssh/gem_auto_rentals root@157.245.120.117
sudo -u deploy pm2 list
sudo -u deploy pm2 logs gem-api --lines 200 --nostream
npx prisma migrate diff --from-url "$DATABASE_URL" \
  --to-schema-datamodel prisma/schema.prisma --script   # output analysed, NOT applied
psql "$DATABASE_URL" -c "SELECT ... FROM _prisma_migrations"
psql "$DATABASE_URL" -c "SELECT relname, n_live_tup FROM pg_stat_user_tables"
curl -s -o /dev/null -w "%{http_code}" https://api.gemrentalcars.com/...
```
