---
title: Server Test Suite Fix Report
aliases: [server-tests-fix]
tags: [fix-report, testing, vitest, server]
created: 2026-07-25
description: Root cause and fix for 36 failing tests in vehicles.test.ts and bookings.test.ts (auth mock exhaustion + cuid payload validation).
related: ['[[BUGFIX_CHECKLIST]]']
---

# Server Test Suite Fix Report

## Result

- **Before:** 36 failed / 40 passed (76 total) — `vehicles.test.ts` and `bookings.test.ts` failing, `auth.test.ts` passing.
- **After:** **76 passed / 0 failed** (3 test files, all passing).
- `pnpm --filter server typecheck` (`tsc --noEmit`): **clean, no errors**.
- No application code touched. No commits made. Only files under `server/src/__tests__/routes/` changed, plus this report.

## Root Cause (confirmed as diagnosed)

Two layered issues, the second masked by the first:

1. **Auth mock exhaustion (34 of 36 failures).** The token helpers (`getAdminToken` / `getCustomerToken` / `getUserToken`) queued a single `vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(...)`. The login request (`POST /api/auth/login`, which looks the user up by `where: { email }`) consumed that one-shot mock. Every subsequent authenticated request then runs `authenticate` in `server/src/middleware/auth.ts` (lines 48–61), which calls `prisma.user.findUnique` **again** by `where: { id }`. With the queue empty, the fully-mocked Prisma client (from `server/src/__tests__/setup.ts`) resolved `undefined`, so the middleware correctly threw 401 "User not found" — and tests expecting 200/201/400/403 saw 401.

2. **Invalid cuid payloads (remaining 6 failures, previously masked).** Once auth worked, all six `POST /api/bookings` tests hit the route's Zod schema (`server/src/routes/bookings.ts` line 29: `vehicleId: z.string().cuid()`). The tests sent `vehicleId: 'vehicle-1'` / `'non-existent'`, which are not cuids, so validation returned 400 before the logic each test meant to exercise. These test payloads were genuinely wrong; the 401 had been hiding it.

## Pattern Chosen and Why

**A `primeUserLookup(user)` helper in each test file** that installs a _persistent_ `mockImplementation` on `prisma.user.findUnique`:

- Resolves the primed user when the query's `where.id` **or** `where.email` matches (covering both the login route's email lookup and the middleware's id re-fetch on every authenticated request), and returns `null` for anything else.
- The token helpers now call `primeUserLookup({ ...mockUser, password: hashedPassword })` instead of `mockResolvedValueOnce`.

Why this over the alternatives:

- **Deliberate 401/403 tests stay honest.** A customer token against an admin-only route still resolves the CUSTOMER user in the middleware, so the `authorize` role check is what fires the 403 (not a missing-user 401). No-token tests still 401 in the middleware before any lookup happens. Unknown ids resolve `null`, so the middleware's "User not found" path remains reachable.
- **No cross-test leakage.** `beforeEach` was changed from `vi.clearAllMocks()` to `vi.resetAllMocks()` in both files. `clearAllMocks` only clears call history — a persistent implementation installed in one test would silently leak into the next. `resetAllMocks` removes implementations too, so every test's mock arrangement is explicit and self-contained. (No test in these files relied on mocks set outside its own body/helpers, so this was safe; `auth.test.ts` was untouched.)
- **No interference with per-test mocks.** The lookup implementation only touches `prisma.user.findUnique`; no test in these two files sets its own `user.findUnique` expectations after getting a token, and all other model mocks (`vehicle.*`, `booking.*`) are unaffected.

For the six bookings-payload failures, the minimal correct fix was in the tests (the app schema is correct): added two constants, `validVehicleCuid` and `missingVehicleCuid` (cuid-shaped strings), and used them in the `POST /api/bookings` request payloads. The Prisma mocks ignore the actual id value — each test's mocked `vehicle.findUnique` return still drives the branch under test (available / MAINTENANCE / conflict / null-404), and the date-validation tests fail on dates before the vehicle lookup, exactly as intended.

## Files Changed

- `/Users/Manny/Gem Auto Rentals/gem-auto-rentals/server/src/__tests__/routes/vehicles.test.ts`
  - Added `primeUserLookup()`; rewrote `getAdminToken()` / `getCustomerToken()` to use it.
  - `beforeEach`: `vi.clearAllMocks()` → `vi.resetAllMocks()`.
- `/Users/Manny/Gem Auto Rentals/gem-auto-rentals/server/src/__tests__/routes/bookings.test.ts`
  - Added `primeUserLookup()`; rewrote `getUserToken()` / `getAdminToken()` to use it.
  - `beforeEach`: `vi.clearAllMocks()` → `vi.resetAllMocks()`.
  - Added `validVehicleCuid` / `missingVehicleCuid` constants; replaced non-cuid `vehicleId` values in the six `POST /api/bookings` payloads (test-only fix — payloads previously violated the route's `z.string().cuid()` validation, masked by the 401s).

Not touched: application code, `.env` files, `setup.ts`, `auth.test.ts`, `helpers/app.ts`. No servers started.

## Final Verification Output

```
Test Files  3 passed (3)
     Tests  76 passed (76)
```

`pnpm --filter server typecheck` — exit 0, no diagnostics. (One intermediate typecheck error — `primeUserLookup` typed via `typeof mockAdminUser` pinned `role` to a literal — was fixed by widening the parameter to `{ id: string; email: string } & Record<string, unknown>`.)

## Unresolved

Nothing unresolved. One observation, not acted on (out of scope): the helpers hash a fresh bcrypt password at cost 12 for every test that needs a token, which accounts for most of the ~23s test wall time; precomputing the hash once per file would speed the suite up considerably.
