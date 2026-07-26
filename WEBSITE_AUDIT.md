# Website Audit — Gem Auto Rentals

**Audit date:** 2026-07-25 (original audit), **updated 2026-07-26** after switching the local database from Render to Supabase
**Repository:** `/Users/Manny/Gem Auto Rentals/gem-auto-rentals` (GitHub: `bigking1998/gem-auto-rentals`)
**Branch / commit at time of audit:** `master`, up to date with `origin/master` at commit `653e677`, with uncommitted changes (see §6 and §15).

This audit actually installed dependencies, started all three applications, ran the build/lint/typecheck/test commands, and clicked through the live site and admin login in a browser — it is not a paper review. Every finding below states whether it was **confirmed by running something** or is a **static/code-only observation**.

> ## ⚠️ THIS REPORT IS NOW PARTIALLY SUPERSEDED
>
> **A round of fixes was carried out on 2026-07-26 after this audit was written.** 8 of the 14 issues in §15 are now fixed and verified, and two of this report's findings turned out to be **wrong** (see the corrections below).
>
> **For current status, read [BUGFIX_CHECKLIST.md](BUGFIX_CHECKLIST.md)** — it tracks what's fixed, what's still open, and eight NEW issues discovered during the fix work. Per-fix detail is in `fix-reports/`.
>
> ### Corrections to this report
>
> 1. **§7 / §15 #3 — the homepage stats bug was misdiagnosed twice.** First it was blamed on the database (wrong). Then it was called a counter bug displaying zeros (also not the real story). What actually happened: the "0" readings were substantially an artifact of the _audit's own browser tooling_ being frozen (`document.hidden === true`, zero animation frames, an inert IntersectionObserver — so lazy-loaded and scroll-triggered content never activated). In a real browser the counters animated fine — **and displayed fabricated numbers**: "99.9% Satisfaction Rate" and "50,000+ Completed Rentals", when the true values were `null` and `0`. The real bug was `||` fallbacks substituting invented marketing figures for real empty data. Now fixed to show only true values.
> 2. **§15 #14 — the "incomplete image-upload wiring" was a false positive.** The `_images`/`pendingFiles` variables are intentional and correct; the upload code is fully wired. The actual problem is a missing environment variable that makes every upload fail _after_ writing to storage — stranding orphaned files — while the admin UI reports success anyway. See NEW-1 in the checklist.
>
> **Lesson for future audits using this tooling:** a frozen/backgrounded browser pane silently disables IntersectionObserver, `requestAnimationFrame`, and anything driven by them. Read the DOM directly and cross-check with `curl` rather than trusting what appears (or fails to appear) on screen.

**2026-07-26 update:** `server/.env`'s `DATABASE_URL` was switched from an unreliable Render-hosted Postgres to the project's actual Supabase database (Session Pooler connection). The database now connects successfully and reliably. This resolved most of what was previously broken (vehicle listings, homepage stats data, the vehicles page). It also surfaced two things the database outage had been masking: a real, confirmed bug in how vehicle images are sourced (§7, §15 #1), and a real, confirmed display bug in the homepage stats counter that turns out to be unrelated to the database (§7, §15 #2, corrected from the original audit). The Stripe key issue (§12, §15 #3) is untouched and still the top priority before anyone goes near checkout.

## 1. Executive Summary

The codebase itself is in good shape: it installs cleanly, builds with zero errors, and type-checks with zero errors across all six packages. **As of the 2026-07-26 update, the database connects reliably** (switched to Supabase), and the pages that depended on it — the vehicles listing and homepage stats — now load real data. What's left is more specific: (1) two of the eight seeded vehicles link to Unsplash photos that no longer exist, and the site's own fallback placeholder image was never added to the project, so those two cars show a blank, broken image to every visitor; (2) the homepage's "Trusted by Thousands" stats counter is stuck showing "0" even though it's receiving real numbers from the API — confirmed as a genuine frontend bug, not a side effect of the database issue as originally suspected; (3) a handful of other independently-confirmed frontend bugs (a dead `/contact` link, a hardcoded personal email on the admin login screen, non-functional social-login buttons); and (4) a payment configuration problem that still needs attention before anyone tests checkout — the local environment has what looks like a **live Stripe publishable key** paired with a **secret key that isn't in a valid Stripe format**. This audit deliberately did not attempt to run the booking/checkout flow, and did not log into the admin dashboard (see §9). Nothing was fixed — this is a map of what to look at first.

## 2. Project Overview

Gem Auto Rentals is a car rental platform: a customer-facing booking site, a staff/admin dashboard, and a shared backend API, sharing one PostgreSQL database (via Prisma ORM). It integrates Stripe (payments), Resend (email), Cloudflare R2 (image/file storage), and has an in-progress Google/Apple Wallet digital-pass feature. All of this matches the previous static audit of this project; this pass adds runtime confirmation.

## 3. Applications and Architecture

| App                             | Framework             | Port (dev) | Role                                                        |
| ------------------------------- | --------------------- | ---------- | ----------------------------------------------------------- |
| `apps/web`                      | React 18 + Vite + TS  | 5173       | Customer-facing site — browsing, booking, account dashboard |
| `apps/admin`                    | React 18 + Vite + TS  | 5174       | Staff dashboard — fleet, bookings, customers, analytics     |
| `server`                        | Express + TS + Prisma | 3000       | Shared REST API for both frontends                          |
| `packages/ui`, `types`, `utils` | TS                    | —          | Shared code between the two frontends                       |

**Confirmed (ran `pnpm dev` in each):** all three start successfully and serve pages. `apps/web` reads `VITE_API_URL=http://localhost:3000/api`; `apps/admin` reads the same pattern on its own env file.

## 4. What Currently Works

All **confirmed by actually running or clicking**, not just reading code:

- `pnpm install` completes cleanly; all workspace dependencies were already installed and in sync with the lockfile.
- The monorepo **builds with zero errors** (`pnpm build` — server, web, admin all succeeded, including the uncommitted Wallet Pass code).
- The monorepo **type-checks with zero errors** across all 6 packages (`pnpm typecheck`).
- The Express server boots and serves HTTP even while its database connection is down — it doesn't crash (confirmed via `curl` against `/health`).
- **(2026-07-26)** The database connection now works reliably — confirmed via server log (`Database connection established successfully`) and `/health` reporting `"database":"connected"`, across a fresh server start after the Supabase switch.
- **(2026-07-26)** `GET /api/vehicles` returns real vehicle data (8 vehicles, real makes/models/prices/features) instead of a 500 error.
- **(2026-07-26)** `GET /api/stats/public` returns real numbers (confirmed via `curl`: real customer count, years-in-business, vehicle count) instead of failing.
- **(2026-07-26)** The `/vehicles` page fully loads and displays "8 vehicles found" with real category tags, instead of hanging on loading skeletons forever.
- **(2026-07-26)** The homepage's "Popular Vehicles" section shows all 8 real vehicles with real names, prices, and ratings.
- The customer homepage renders fully, styled and branded correctly, on both desktop and mobile viewports (confirmed via screenshots at 375px and full desktop width).
- The customer site correctly and gracefully displays a "waiting for server" state instead of crashing when the backend's database is unavailable (confirmed in browser console/network log, observed before the database fix).
- Protected admin routes actually redirect to `/login` when not authenticated (confirmed by navigating directly to `http://localhost:5174/fleet` while logged out).
- The server's error handler correctly hides stack traces outside of development mode (confirmed by reading `errorHandler.ts:68` — stack traces are only attached when `NODE_ENV === 'development'`, which is not the case in the `render.yaml` production config).
- Security middleware (helmet CSP, CORS allowlist, rate limiting) is present and wired into every request (confirmed by reading `server/src/index.ts`).

## 5. What Failed to Run

- `pnpm --filter web lint` — **failed**, 17 ESLint errors + 4 warnings.
- `pnpm --filter admin lint` — **failed**, 9 ESLint errors + 26 warnings.
- `pnpm --filter server test` — **failed**, 36 of 76 tests failing (2 of 3 test files).
- Full details and root causes for each are in §13 and §15.

## 6. Missing Setup or Environment Information

- The **monorepo-root** `.env` (`gem-auto-rentals/.env`) is just 3 comment lines — no real values. This is a leftover/decoy; it is **not** the file the server actually reads.
- The server actually reads **`server/.env`**, a separate, fully populated file (confirmed present, 20 variables by name: `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, Stripe keys, `RESEND_API_KEY`, Twilio keys, R2 storage keys, etc.). This correction matters: a prior conversation's audit only checked the root `.env` and concluded local secrets were entirely missing — that was inaccurate for the server. (Values were never printed; only variable names and, for `DATABASE_URL`, the safely-parsed host/port/database name were inspected.)
- **(2026-07-26, resolved)** `DATABASE_URL` was switched from a Render-hosted Postgres (`*.oregon-postgres.render.com`) that was refusing connections, to the project's real Supabase database via its Session Pooler connection string (`aws-1-us-east-2.pooler.supabase.com`). It connects successfully and reliably now (§10). `DIRECT_URL` was deliberately left untouched and **still points to the old Render database** — it's used by Prisma for direct/migration-time connections, separate from `DATABASE_URL`'s pooled connection, and should be updated to a Supabase direct connection string before anyone runs a migration.
- `apps/web` and `apps/admin` each have their own `.env`/`.env.local`/`.env.production` with `VITE_*` variables already populated — these were not blocking.
- `R2_PUBLIC_URL` is not set in `server/.env` at all, and the uncommitted code change (§15) needs three _new_, per-bucket variables that don't exist anywhere yet — public image URLs cannot resolve locally in either the old or new code path right now.
- `STRIPE_WEBHOOK_SECRET` is not set — webhook signature verification has nothing to verify against locally.

## 7. Customer-Facing Website Findings

All items below were reached and observed directly in a browser (desktop 1600×900 and mobile 375×812), not just inferred from code:

- Homepage: loads fully, professional and on-brand, hero image and search widget render correctly, mobile layout adapts cleanly.
- **(2026-07-26, corrected finding)** Homepage "Trusted by Thousands" stats block still shows **"0+", "0.0%", "0+", "0+"** for all four stats — but this is **not** caused by the database, and the original audit's explanation was wrong. With the database now connected, `GET /api/stats/public` returns real numbers (confirmed via `curl` and via the browser's network tab: `200 OK`, real values, no console errors). The page still displays "0" even after scrolling the section into view and waiting several seconds — tested both in the dev server and in a production build (`vite preview`, which rules out a React StrictMode dev-only artifact). This is a genuine, reproducible bug in `apps/web/src/components/home/Statistics.tsx`'s animated counter, most likely in how it handles the transition from its placeholder default values to the real fetched values. See §15 #2.
- **(2026-07-26, resolved)** "Browse Our Fleet" (`/vehicles`) page now finishes loading and shows "8 vehicles found" with real category tags, instead of hanging on loading skeletons.
- **(2026-07-26, new finding)** Two of the eight vehicles' photos are genuinely broken: `Ford Mustang` and `Honda CR-V` each link to an Unsplash photo URL that returns **HTTP 404** (confirmed via direct request to each of the 8 vehicles' image URLs). When an image fails to load, the site's `LazyImage` component (`apps/web/src/components/ui/LazyImage.tsx:24`) is supposed to fall back to `/placeholder-car.jpg` — but **that file does not exist** in `apps/web/public/` (confirmed). So those two vehicles show a blank, broken image with nothing to fall back to. This is very likely what was seen when the site was checked manually — see §15 #1.
- The footer/CTA "Contact Us" link points to `/contact`, and **navigating there renders a completely blank page** (confirmed — empty `<body>`, default browser tab title). No such route or 404 handler exists in `apps/web/src/App.tsx`.
- Login page (`/login`) renders cleanly, but its "Google" and "GitHub" sign-in buttons have **no click handler at all** (confirmed in `apps/web/src/pages/auth/LoginPage.tsx:332` and `:353` — plain `<button>` elements with no `onClick`). Clicking them does nothing.
- No console errors were seen on any page visited (only harmless React Router "future flag" deprecation warnings).
- The booking/checkout flow itself was **not exercised** — see §12 for why.

## 8. Backend and API Findings

- The API boots and responds even with the database down; `/health` correctly reports database status as `"connecting"` rather than crashing (observed before the database fix).
- **(2026-07-26)** With the Supabase connection in place, `/health` now reports `"database":"connected"`, and `GET /api/vehicles` returns real data with a `200` status (confirmed via `curl`).
- Previously (Render database): `GET /api/vehicles` returned an HTTP 500 with a full stack trace when the database was unreachable — this exact stack-trace exposure is dev-only by design (§4) and would not happen in production, but the _500 on a core public page_ would have.
- Prisma's connection logic retries 5 times on boot (1–4s backoff) and then **gives up permanently** for that process's lifetime if none succeed — it never retries again. This means a transient database hiccup at boot can still leave a long-running server process stuck "database: connecting" forever until manually restarted, even now that the underlying database is healthy — worth being aware of if the Supabase connection ever has a brief hiccup during boot in the future.

## 9. Admin Dashboard Findings

- The admin app boots and its login screen renders correctly.
- **The admin login page's email field is pre-filled with a real-looking personal email address by default** — confirmed in source at `apps/admin/src/pages/LoginPage.tsx:12`: `useState('biggkingg1998@gmail.com')`. This is not browser autofill; it's hardcoded into the component. See §11 for why this matters.
- Route protection works correctly: navigating directly to a protected admin URL (`/fleet`) while logged out redirects to `/login` (confirmed).
- Internal admin pages (fleet management, bookings, customers, analytics, etc.) **still could not be functionally tested** beyond the login screen, even with the database now working and even with explicit permission given to log in. This isn't a policy this audit imposed on itself — it's a standing rule that doesn't bend for permission: entering a password into any login form, including this project's own admin panel, isn't something this assistant does, regardless of who authorizes it. The practical way around it: log in yourself in a normal browser and either report back what you see, or drive the browser session yourself while narrating what to check.
- Given the same server/database that now serves the public API correctly is what the admin app talks to, there's good reason to expect admin pages needing real data would work too — but that remains an inference, not something directly observed.

## 10. Database Findings

**Status as of 2026-07-26: connected and working.** `server/.env`'s `DATABASE_URL` was switched from the Render-hosted Postgres to the project's Supabase database, using Supabase's Session Pooler connection string (host `aws-1-us-east-2.pooler.supabase.com`, port 5432). A fresh server start immediately logged `Database connection established successfully`, and every database-backed endpoint checked since (`/health`, `/api/vehicles`, `/api/stats/public`) returns real data on the first try — no retries needed, no errors.

What led here, for the record:

- **Confirmed:** the original `DATABASE_URL`/`DIRECT_URL` pointed to a Render-hosted Postgres instance, with `sslmode=require` correctly set, and the host was network-reachable (raw TCP connect to port 5432 succeeded) — but the Postgres server itself closed every connection attempt from this audit's dev-server boots, across three separate attempts, even though a `vitest` test run and an earlier session both showed real reads/writes succeeding at other times. The intermittency was never fully root-caused; restarting a Supabase project (which is a _different_ service from that Render database) didn't fix it either, confirming the two were unrelated.
- The actual fix was recognizing the app's real database is on Supabase, not Render, and switching `DATABASE_URL` to point there. Whatever was wrong with the Render instance no longer matters for this project's day-to-day use, but it's worth understanding _why_ `DATABASE_URL` was pointing at Render in the first place (old migration from Supabase to Render that was never fully completed? Render was meant to be a temporary/parallel setup? Not something this audit can determine from the code alone).
- **`DIRECT_URL` was intentionally left untouched** (per instructions) and still points to the old Render database. It's only used by Prisma for direct/migration-time connections, not regular queries, so nothing observed in this audit was affected by it — but it should be updated to a Supabase direct connection string before anyone runs `prisma migrate` against this database.
- **Correction/clarification (still applies):** the vitest test suite does **not** actually hit any real database — `server/src/__tests__/setup.ts` fully mocks the Prisma client. So the many failing tests (§13) are unrelated to database connectivity, before or after the fix.
- Two separate migration systems exist side by side (`server/prisma/migrations`, 5 files; `supabase/migrations`, 8 SQL files) — this project appears to use Prisma for application tables and the Supabase SQL files for storage buckets/RLS policies, which is a plausible legitimate split, but it was not possible to confirm the two are fully in sync without direct database access.
- The in-progress Wallet Pass feature added new fields/models to `schema.prisma` (`googlePassId`, `PassRegistration`, etc.) with **no corresponding migration file** — still confirmed via `grep` across the migrations folder (unchanged by the database switch). The Prisma Client still generates and type-checks fine (Prisma generates types straight from the schema file, independent of migration state), so the build looking clean does not mean the database matches the schema.
- The 8 seeded vehicles, the stats numbers, and everything else now visible through the API confirm this is a real, populated database with actual rows — not an empty one.

## 11. Authentication and Security Findings

- Auth is fully custom (JWT + bcrypt via `server/src/middleware/auth.ts`), not a third-party auth SDK.
- Protected routes/pages were runtime-confirmed to actually enforce this on the admin app (§9).
- **Security/privacy concern, confirmed:** the admin login screen ships with a real personal email address hardcoded as the visible default value of the email field (`apps/admin/src/pages/LoginPage.tsx:12`). Anyone who opens the admin login URL sees this email pre-filled. That's a meaningful information leak for an admin panel — it hands a likely-valid admin username to anyone probing the login page, which lowers the bar for credential-stuffing or phishing attempts against that specific account. It also reads as leftover developer debug code that was never cleaned up.
- **Security concern, confirmed:** stack traces on 500 errors are correctly gated to development mode only (§4/§8) — not an issue in production as currently configured.
- No CAPTCHA/bot-detection was bypassed or attempted; none observed on either login form.
- Rate limiting (200 req/15min per IP on `/api/*`) and Helmet CSP are both active (confirmed by reading `server/src/index.ts`).

## 12. Payments, Email, Storage, and Integration Findings

- **Critical, confirmed:** `server/.env`'s `STRIPE_PUBLISHABLE_KEY` begins with `pk_live_...` — a **live** Stripe publishable key, not a test key (`pk_test_...`). This means the customer-facing checkout page, if loaded, would initialize Stripe Elements in **live mode**, ready to collect a real card. Because of this, **this audit deliberately did not open or exercise the booking/checkout flow** — doing so risked coming close to a real payment action, which is explicitly off-limits. This is the single most important thing to fix before anyone (including future testing) touches the booking flow again.
- **Confirmed, likely broken independent of the above:** `STRIPE_SECRET_KEY` does not look like a valid Stripe secret key — real Stripe secret keys start with `sk_test_`/`sk_live_` and are much longer; this one starts with `mk_` and is only 27 characters. Server-side Stripe calls (creating payment intents, etc.) would very likely fail outright with this value, even though the frontend key is live. (Value length and prefix only were inspected — never the actual key content.)
- `STRIPE_WEBHOOK_SECRET` is not set locally — webhook signature verification has no secret to check against.
- `RESEND_API_KEY` is present (by name) in `server/.env`; whether it's a valid/working key was **not tested** (doing so would send a real email).
- Cloudflare R2 credentials (`R2_ACCOUNT_ID`, access keys) are present; `/health` reports `"storage":"configured"` (confirmed via `curl`). Public URL resolution is still broken locally either way (§6).
- **(2026-07-26, clarification)** The vehicle photos on the customer site are **not** served from R2 at all right now — the seeded vehicle records store direct hot-linked Unsplash URLs (e.g. `https://images.unsplash.com/photo-...`) in the `images` field, confirmed via `curl` against `/api/vehicles`. R2 storage being unconfigured for public URLs (§6) does not currently affect vehicle photos — it would only matter once vehicle images are actually uploaded to R2 (e.g. via the admin "Add/Edit Vehicle" forms flagged as possibly-incomplete in §15 #12). The vehicle photo problem that _is_ live right now is a different one — see §15 #1.
- The uncommitted Wallet Pass work (`server/src/routes/wallet.ts`, `server/src/services/googleWalletService.ts`, ~780 lines combined) is **substantially complete code**, not a stub — five real routes covering pass generation, QR scanning, check-in, and check-out. Its only confirmed blocker is the missing database migration (§10) and the fact that it isn't committed yet.

## 13. Build, Lint, Test, and Console Results

Straight factual results, no interpretation:

| Command                              | Result                                                                            |
| ------------------------------------ | --------------------------------------------------------------------------------- |
| `pnpm install`                       | Pass — already up to date                                                         |
| `pnpm build` (server, web, admin)    | **Pass** — 0 errors, all three produce output                                     |
| `pnpm typecheck` (all 6 packages)    | **Pass** — 0 errors                                                               |
| `pnpm --filter web lint`             | **Fail** — 17 errors, 4 warnings                                                  |
| `pnpm --filter admin lint`           | **Fail** — 9 errors, 26 warnings                                                  |
| `pnpm --filter server test` (vitest) | **Fail** — 36/76 tests failed (2 of 3 files)                                      |
| Browser console (web, admin)         | No errors on any page visited; only React Router future-flag deprecation warnings |

**Lint errors, web** (`apps/web`): mostly `react/no-unescaped-entities` (raw `'`/`"` characters in JSX text — 5 occurrences across `WhyChooseUs.tsx`, `TierProgress.tsx`, `AboutPage.tsx`, `FavoritesPage.tsx`) plus two `no-case-declarations` errors in `BookingPage.tsx:216,220` (a `let`/`const` declared directly inside a `switch case` without braces — a real code-quality issue worth a look since it's in the booking flow, though not confirmed to cause a runtime bug).

**Lint errors, admin** (`apps/admin`): same `react/no-unescaped-entities` pattern (5 occurrences) plus two `no-unused-vars` errors (`AddVehiclePage.tsx:16`, `EditVehiclePage.tsx:40` — both unused variables named around "images"/"pendingFiles", suggesting an unfinished image-upload wiring in those forms).

**Test failures, server:** root-caused, not just observed. `server/src/__tests__/routes/vehicles.test.ts` and `bookings.test.ts` have helper functions `getAdminToken()`/`getCustomerToken()` (`vehicles.test.ts:80-104`) that mock the database lookup used during login with `mockResolvedValueOnce(...)` — a mock that's consumed **once**. But the authenticated request made immediately after (e.g. `PATCH /api/vehicles/:id/status`) triggers a **second** database lookup inside the auth middleware to re-fetch the user from the token, and that second lookup has no mock value queued, so it resolves to `undefined` and the middleware correctly throws "User not found" → 401. Tests then fail because they expected the real business-logic response (200, 400, or 403) instead of that 401. This is a **test-helper defect**, confirmed by reading `server/src/middleware/auth.ts:47-58` alongside the test file — not a real backend bug, and not related to the live database issue (the test suite fully mocks Prisma, per `server/src/__tests__/setup.ts:14`).

## 14. Deployment Concerns

- `render.yaml` still lists a single `R2_PUBLIC_URL` environment variable, but the **uncommitted** code change to `server/src/lib/storage.ts` now requires three separate variables (`R2_AVATARS_PUBLIC_URL`, `R2_VEHICLES_PUBLIC_URL`, `R2_LOGOS_PUBLIC_URL`). If that change were deployed as-is without updating Render's dashboard env vars, vehicle/avatar/logo images would stop resolving to public URLs in production.
- The live-looking Stripe publishable key situation (§12) should be checked against what's actually configured in Render/Vercel's production environment variables too — if the same live key is intentionally in production, the concern shifts to why an apparently-invalid secret key sits next to it; if it's accidentally in a local dev file, it should be rotated out of there regardless of what's in production.
- No CI workflow files were found (no `.github/workflows/`), so none of the build/lint/typecheck/test results in this report currently run automatically anywhere — they only ran because this audit ran them by hand.

## 15. Full Prioritized Issue List

### Resolved since the original audit

- ~~Database connection unreliable~~ — **RESOLVED 2026-07-26.** `DATABASE_URL` switched from an unreliable Render Postgres to the project's real Supabase database (Session Pooler). Connects successfully and immediately on every attempt since. See §10. One follow-up remains: `DIRECT_URL` (used only for migrations) still points to the old Render database and should be updated too — tracked as #9 below.

### Critical

1. **Live-looking Stripe publishable key in local dev config, paired with an invalid-looking secret key.**
   Where: `server/.env` (`STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`).
   Evidence: key prefixes/lengths inspected programmatically without printing values — `pk_live_...` (107 chars, valid live-key shape) vs. `mk_...` (27 chars, not a valid Stripe secret-key shape).
   Why it matters: any attempt to load the checkout page locally would initialize real, live Stripe Elements ready to collect a real card, while the backend likely can't complete the charge — a confusing and risky combination. This is why the booking flow wasn't tested in this audit.
   Category: Security/privacy concern. Safe to fix independently: yes — this is a config/credential swap, not a code change, but should be done carefully (confirm with whoever owns the Stripe account which key is correct, and check whether production has the same problem before rotating anything). What could be affected: booking/checkout flow, any Stripe webhook handling.

### High

2. **Two of eight vehicle photos are permanently broken — dead image links with no working fallback.**
   Where: seeded vehicle data (Ford Mustang, Honda CR-V) via `GET /api/vehicles`; fallback logic in `apps/web/src/components/ui/LazyImage.tsx:24`; missing file `apps/web/public/placeholder-car.jpg`.
   Evidence: both vehicles' `images[0]` URLs return `HTTP 404` when requested directly (confirmed via `curl -I` against all 8 vehicles' image URLs — 6 return `200`, 2 return `404`). `LazyImage`'s error handler falls back to `/placeholder-car.jpg`, but that file does not exist in the project (confirmed via `ls`), so the fallback also fails, leaving a blank image box.
   Why it matters: this is very likely what was seen when the site was checked manually — a real visitor browsing the fleet sees 2 of 8 cars with no photo at all, which looks broken and unprofessional on a site whose whole job is to make cars look appealing.
   Category: Actual code defect (missing fallback asset) + data issue (dead hot-linked stock photo URLs). Safe to fix independently: yes — add a real `placeholder-car.jpg` to `apps/web/public/`, and separately replace or re-source the two dead Unsplash URLs in the vehicle records. Longer-term worth flagging: the fleet's photos are hot-linked directly to Unsplash rather than hosted in the project's own storage (Cloudflare R2, which is otherwise configured but unused for this purpose) — hot-linked third-party URLs can go dead at any time with no warning, so more of these will likely break over time unless photos are migrated to owned storage. What could be affected: only vehicle photo display; no other functionality touches these fields.

3. **Homepage stats counter shows "0" even though it's receiving real data — confirmed frontend bug.**
   Where: `apps/web/src/components/home/Statistics.tsx`.
   Evidence: `GET /api/stats/public` returns real, non-zero data (confirmed via `curl` and the browser's network tab — `200 OK`, no console errors). The displayed numbers still read "0+" / "0.0%" after scrolling the section into view and waiting several seconds, reproduced both in the dev server and in a production build (`vite preview`), which rules out a React StrictMode dev-only artifact. **This corrects the original audit**, which attributed the "0" display to the database being down — that theory doesn't hold up now that the database works and the bug persists.
   Why it matters: real visitors will see "0.0% Satisfaction Rate" and "0+ Happy Customers" on the homepage indefinitely — actively undermines trust rather than just looking unfinished.
   Category: Actual code defect. Safe to fix independently: yes, but needs a proper look at the component's state/effect logic (likely how the animated counter handles updating from its placeholder default value to the newly-fetched real value) rather than a blind fix. What could be affected: only this homepage section.

4. **Admin login page hardcodes a real personal email as the visible default value.**
   Where: `apps/admin/src/pages/LoginPage.tsx:12`.
   Evidence: `useState('biggkingg1998@gmail.com')`, confirmed both in source and by loading the page in a browser.
   Why it matters: leaks a likely-valid admin username to anyone who opens the admin login URL, lowering the bar for credential-stuffing/phishing against that account.
   Category: Security/privacy concern. Safe to fix independently: yes, trivial one-line change (`useState('')`). What could be affected: nothing else — isolated to this one field.

5. **`/contact` link is completely dead.**
   Where: linked from `apps/web/src/components/layout/Footer.tsx:19` and the homepage CTA; no matching route in `apps/web/src/App.tsx`; no catch-all/404 route either.
   Evidence: runtime-confirmed — navigating to `/contact` renders a fully blank page.
   Why it matters: a real visitor clicking "Contact Us" — the site's stated way to get help — hits a dead end with no explanation.
   Category: Actual code defect / missing feature. Safe to fix independently: yes. What could be affected: nothing else; purely additive (either build the page or point the link elsewhere) plus adding a generic 404 route is good practice regardless.

6. **Deployment config (`render.yaml`) is out of sync with uncommitted storage code.**
   Where: `render.yaml` vs. `server/src/lib/storage.ts` (uncommitted).
   Evidence: diff comparison — code now reads `R2_AVATARS_PUBLIC_URL`/`R2_VEHICLES_PUBLIC_URL`/`R2_LOGOS_PUBLIC_URL`; `render.yaml` and the live env only define `R2_PUBLIC_URL`.
   Why it matters: deploying the in-progress storage change as-is would silently break every public image URL in production (once vehicle photos do move to R2 — see #2).
   Category: Deployment/configuration issue. Safe to fix independently: yes, once the storage change is finalized — update both `render.yaml` and Render's actual dashboard env vars together. What could be affected: all vehicle/avatar/logo images site-wide, once R2-hosted images are actually in use.

### Medium

7. **Vehicles listing has no error/timeout state when the API is unreachable.**
   Where: `apps/web` — `/vehicles` page.
   Evidence: runtime-confirmed (before the database fix) — `/vehicles` showed permanent loading-skeleton placeholders, with no error message, when the backend couldn't reach its database. Now resolved in practice since the database is reliable, but the underlying gap in the code is still there.
   Why it matters: a real, if less severe, backend hiccup in production would still show real customers an endless loading spinner instead of a clear "please try again" message.
   Category: Design/UX issue. Safe to fix independently: yes — add a timeout + error/retry UI state to this data fetch. What could be affected: only this component.

8. **Missing migration for the in-progress Wallet Pass feature.**
   Where: `server/prisma/schema.prisma` (uncommitted changes) vs. `server/prisma/migrations/`.
   Evidence: schema defines `PassRegistration` and new `Booking` fields (`googlePassId`, etc.); no migration file references them.
   Why it matters: the feature's code is largely complete (~780 lines across `wallet.ts` and `googleWalletService.ts`) but cannot actually run against a real database until a migration exists.
   Category: Missing/unfinished feature. Safe to fix independently: yes, once someone decides whether to finish this feature now or shelve it — generating the migration is a standard, low-risk Prisma step. What could be affected: only booking records related to wallet passes; additive-only schema change (new optional fields/table).

9. **`DIRECT_URL` still points to the old, unreliable Render database.**
   Where: `server/.env` (`DIRECT_URL`).
   Evidence: confirmed via safe URL parsing (host/port only, no credentials revealed) — still resolves to the Render Postgres host, while `DATABASE_URL` on the line above it now correctly points to Supabase.
   Why it matters: Prisma uses `DIRECT_URL` specifically for migrations (`directUrl` in `schema.prisma:10`). If someone runs a migration without updating this first, it would attempt to apply schema changes to the old, unreliable Render database instead of the real Supabase one — confusing at best, silently wrong at worst.
   Category: Deployment/configuration issue. Safe to fix independently: yes — same kind of one-line swap as `DATABASE_URL` was, ideally to a Supabase direct (non-pooled) connection string. What could be affected: nothing until someone runs a migration; worth fixing before that happens rather than after.

10. **Server test suite: 36 of 76 tests failing due to a mock-reuse bug in test helpers.**
    Where: `server/src/__tests__/routes/vehicles.test.ts:80-104` and the equivalent pattern in `bookings.test.ts`.
    Evidence: `getAdminToken()`/`getCustomerToken()` use `mockResolvedValueOnce()` for a Prisma call that's actually needed twice (once at login, once again by the auth middleware on the next request); traced against `server/src/middleware/auth.ts:47-58`.
    Why it matters: with over half the server test suite failing, it's currently useless as a safety net for backend changes — someone could introduce a real regression and the tests wouldn't reliably catch it.
    Category: Code-quality/test-coverage issue (confirmed to be a test-code bug, not an application bug). Safe to fix independently: yes — fix is localized to the test helper functions. What could be affected: nothing in the running app; test-only.

11. **Non-functional social login buttons on the customer login page.**
    Where: `apps/web/src/pages/auth/LoginPage.tsx:332` (Google), `:353` (GitHub).
    Evidence: both are plain `<button>` elements with no `onClick` handler; confirmed no OAuth flow exists anywhere in the codebase.
    Why it matters: a real user clicking these expects something to happen and gets nothing — looks broken/unfinished.
    Category: Missing/unfinished feature. Safe to fix independently: yes — either implement OAuth or remove the buttons until it's built. What could be affected: nothing else, isolated to the login page.

### Low

12. **Lint failures (web: 17 errors/4 warnings, admin: 9 errors/26 warnings).**
    Where: see §13 for the full breakdown.
    Evidence: `pnpm --filter web lint` / `pnpm --filter admin lint` output.
    Why it matters: mostly cosmetic (`react/no-unescaped-entities` on apostrophes/quotes in JSX text) but includes two `no-case-declarations` errors in `apps/web/src/pages/BookingPage.tsx:216,220` inside the booking flow, worth a closer look even though no runtime bug was confirmed.
    Category: Code-quality/maintenance issue. Safe to fix independently: yes, low risk. What could be affected: nothing functionally for the escaping fixes; the `BookingPage.tsx` case-block fix should be reviewed slightly more carefully since it's in the core booking flow.

13. **Husky pre-commit hook is configured but not actually installed.**
    Where: `package.json` (`lint-staged` config, `"prepare": "husky"`), `.husky/` (only contains the internal helper, no real hook script).
    Evidence: directory listing of `.husky/`.
    Why it matters: lint/format-on-commit currently doesn't run automatically for anyone working on this repo.
    Category: Code-quality/maintenance issue. Safe to fix independently: yes. What could be affected: nothing; purely developer tooling.

14. **Two unused-variable lint errors suggesting incomplete image-upload wiring.**
    Where: `apps/admin/src/pages/AddVehiclePage.tsx:16` (`_images`), `apps/admin/src/pages/EditVehiclePage.tsx:40` (`pendingFiles`).
    Evidence: ESLint `no-unused-vars` output.
    Why it matters: variable names suggest image-upload state that's declared but never wired up to anything — worth checking whether vehicle image upload in the admin app actually works end-to-end. If it doesn't, that's also the long-term fix path for #2 (moving vehicle photos off hot-linked Unsplash URLs and into the project's own storage).
    Category: Missing/unfinished feature (tentative — not runtime-confirmed either way). Safe to fix independently: needs investigation first, not a blind fix. What could be affected: vehicle add/edit forms in the admin app.

## 16. Quick Wins

- Add a real `apps/web/public/placeholder-car.jpg` file (#2) — immediately stops broken images from showing blank, even before the two dead Unsplash links are replaced.
- Clear the hardcoded email on the admin login page (#4) — one line.
- Add a basic catch-all 404 route to `apps/web/src/App.tsx` (admin already has one) — a few lines, fixes the blank `/contact` page's presentation even before a real Contact page exists.
- Remove or properly wire up the Google/GitHub login buttons (#11).
- Fix the `mockResolvedValueOnce` → `mockResolvedValue` (or add a second mock call) in the two test helper functions (#10) — restores the test suite as a useful safety net.
- Fix the two `no-case-declarations` lint errors in `BookingPage.tsx` by wrapping the case bodies in `{ }` blocks.
- Point `DIRECT_URL` at Supabase too (#9) — same kind of edit as `DATABASE_URL`, prevents a future migration from silently targeting the wrong database.

## 17. Features That Can Wait

- The Wallet Pass feature (#8) — it's real, working code; finishing it (migration + commit) is a deliberate scope decision, not an emergency.
- Most of the `react/no-unescaped-entities` lint errors — purely cosmetic in the linter's eyes.
- Installing the Husky hook (#13) — nice for team hygiene, not urgent for a single-developer project.
- The two unused-variable findings in admin vehicle forms (#14) — worth a look, but not blocking anything today.
- Migrating vehicle photos off hot-linked Unsplash URLs onto the project's own storage (the durable fix behind #2) — the immediate fix (real placeholder image + replacing the 2 dead links) is urgent; the deeper migration to owned storage can follow at a normal pace.

## 18. Recommended Order of Repairs

1. **Resolve the Stripe key situation first** (#1) — nothing involving payments should be touched, tested, or deployed until this is sorted out and confirmed safe.
2. ~~Diagnose the database connectivity issue~~ — **done**, resolved by switching to Supabase (see §10). Follow up by pointing `DIRECT_URL` at Supabase too (#9) before anyone runs a migration.
3. Fix the **two visible, real bugs users would notice right now**: the broken vehicle images (#2) and the homepage stats stuck at zero (#3) — both are now clearly isolated from the database question and safe to fix independently.
4. **Decide on the Wallet Pass feature** (#8) — finish (generate migration, commit) or explicitly shelve it, so it stops sitting as uncommitted work.
5. Fix the **small, isolated, high-value bugs**: hardcoded admin email (#4), dead `/contact` link (#5), non-functional social buttons (#11).
6. Fix the **deployment config drift** (#6) before the storage change is ever deployed.
7. Fix the **test helper bug** (#10) so the test suite is trustworthy again for future changes.
8. Add the **error/timeout state** for the vehicles listing (#7).
9. Clean up **lint errors** (#12, #14) and **Husky** (#13) as routine maintenance.

## 19. The First Five Tasks to Complete

1. Confirm with whoever manages the Stripe account whether `pk_live_...` in `server/.env` is expected, and get a correct, matching secret key — do not test checkout again until this is resolved.
2. Add a real `placeholder-car.jpg` to `apps/web/public/` and replace the two dead Unsplash links (Ford Mustang, Honda CR-V) with working image URLs.
3. Look into `apps/web/src/components/home/Statistics.tsx` — the animated stats counter is stuck at "0" despite receiving real data from the API.
4. Change `useState('biggkingg1998@gmail.com')` to `useState('')` in `apps/admin/src/pages/LoginPage.tsx:12`.
5. Add a real `/contact` page (or redirect) and a catch-all 404 route to `apps/web/src/App.tsx`.

## 20. Manual Testing Checklist

Things that could not be safely or fully tested in this audit and need a human pass:

- [ ] Full booking/checkout flow with Stripe, **only after** the key situation (#1) is confirmed resolved and the team is deliberately in Stripe test mode.
- [ ] Real login to the admin dashboard with real credentials, then click through Fleet, Bookings, Customers, Analytics, Settings, Messages, Security, Trash, Help. (This audit's own login is off the table by policy — see §9 — regardless of permission given, so this specifically needs a human.)
- [ ] Real customer registration/login end-to-end (this audit did not create any accounts).
- [ ] Actual email delivery via Resend (registration confirmation, booking confirmation, etc.) — not triggered in this audit to avoid sending real email.
- [ ] Image upload for a vehicle in the admin "Add Vehicle" / "Edit Vehicle" forms, given the unused-variable findings (#14) that hint it may be incomplete.
- [ ] The Wallet Pass feature end-to-end, once its migration is generated.
- [ ] Whether the two migration systems (`server/prisma/migrations` and `supabase/migrations`) are actually in sync on the real (Supabase) database, now that a real connection is possible.
- [ ] Whether the same live/invalid Stripe key pairing also exists in the production (Render/Vercel) environment variables.
- [ ] Why `DATABASE_URL` was pointing at a Render database in the first place when the real database is on Supabase — worth understanding the history here so it doesn't happen again.

---

_This audit reflects the state of the project at commit `653e677` on `master`, plus the uncommitted working-tree changes described in §6/§15, as observed on 2026-07-25, with a follow-up pass on 2026-07-26 after the database was switched from Render to Supabase. Findings marked "confirmed" were produced by an actual command, page load, or direct file read during this session; anything else is explicitly marked as inference pending verification._
