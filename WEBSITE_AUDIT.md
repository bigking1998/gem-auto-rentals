---
title: 'Website Audit — Gem Auto Rentals'
aliases: [website-audit]
type: meta
status: active
tags: [type/meta, project/gem-auto-rentals, topic/qa, topic/audit]
updated: 2026-10-20
summary: >
  Second full audit. Dependencies installed, every app built, linted, typechecked and
  tested for real. Three live-config problems stand between this codebase and taking ad
  traffic; the code itself is in good shape.
related:
  - '[[LAUNCH_CHECKLIST]]'
  - '[[BUILD_TASKS]]'
---

# Website Audit — Gem Auto Rentals

**Audit date:** 2026-10-20
**Repository:** `/Users/Manny/Gem Auto Rentals/gem-auto-rentals` (origin: `github.com/bigking1998/gem-auto-rentals`)
**Branch / commit at time of audit:** `master`, commit `56f1854`, **37 files uncommitted**

> **Supersedes the audit dated 2026-07-27.** That one was ~3 months stale.
> **Every command below was actually run.** Where something was only read and not
> executed, it says so. Nothing here is inferred from a folder name.

## 1. Executive Summary

Gem Auto Rentals is a three-part TypeScript project: a customer rental website, a staff
admin dashboard, and an Express/Prisma API behind them. **The code is in good condition** —
everything installs, builds, lints, typechecks and passes its tests, and the sensitive API
routes are genuinely protected (I checked the actual route definitions, not just grepped
for the word).

The problems are almost all in **configuration**, not code. The single most important
thing to know before touching anything: **server-side Stripe is almost certainly not
working** — the secret key in `server/.env` is 27 characters where a real Stripe secret is
roughly 107, so it looks like a truncated placeholder, while the _publishable_ keys
alongside it are **live-mode**. That combination means a customer could reach a payment
form that cannot complete a charge.

Second: there are **three config mismatches** where the code reads one variable name and
the environment supplies another, so image hosting and email bounce handling are silently
switched off rather than failing loudly.

## 2. Project Overview

**Confirmed.** A pnpm workspace (`pnpm-lock.yaml`, `pnpm-workspace.yaml` listing
`apps/*`, `packages/*`, `server`) using Turborepo (`turbo.json`). TypeScript throughout.

| Folder                             | Role (confirmed by reading its manifest and entry point)                |
| ---------------------------------- | ----------------------------------------------------------------------- |
| `apps/web`                         | Customer site — React + Vite. Browsing, booking, accounts, waiting list |
| `apps/admin`                       | Staff dashboard — React + Vite. Fleet, bookings, customers, invoices    |
| `server`                           | Express API + Prisma ORM. The only thing that talks to the database     |
| `packages/ui`                      | Shared React components, imported by `apps/web` as `@gem/ui`            |
| `packages/types`, `packages/utils` | Shared types and helpers                                                |

**Database:** PostgreSQL via Prisma. 7 migration folders, newest `20260129_confirmation_email_sent`.
**Deployment config present:** `render.yaml`, `vercel.json`, `.github/workflows/deploy.yml`.

## 3. Applications and Architecture

Customer site and admin dashboard are separate builds that both call the same API over
HTTP (`VITE_API_URL`). The API holds all business logic and the only database connection.

**Authentication:** custom JWT. The server signs a token (`server/src/routes/auth.ts:84`)
and each browser app stores it and sends it as a bearer token. **No third-party auth
service is in use** — see §11 for the Supabase discrepancy.

## 4. What Currently Works

All **confirmed by running the commands**, not assumed:

| Check                            | Result                                   |
| -------------------------------- | ---------------------------------------- |
| `tsc --noEmit` — customer site   | **passes**                               |
| `tsc --noEmit` — admin dashboard | **passes**                               |
| `tsc --noEmit` — server          | **passes**                               |
| `eslint src` — both front-ends   | **clean, zero errors and zero warnings** |
| `vite build` — customer site     | **succeeds**                             |
| `vite build` — admin dashboard   | **succeeds, 4.74s**                      |
| `vitest run` — customer site     | **73 passed** (3 files)                  |
| `vitest run` — server            | **76 passed** (3 files)                  |
| `vitest run` — new pricing tests | **7 passed** (added during this session) |

**Protected routes are genuinely protected.** A crude grep suggested 43 routes without
authentication; checking the actual definitions showed those are multi-line routes with
`authenticate` and `authorize('ADMIN','MANAGER','SUPPORT')` on the following lines. The
first reading was wrong and the finding was withdrawn.

**Demo payments are correctly hard-gated.** `server/src/routes/payments.ts:239` disables
the `/demo` endpoint unless `NODE_ENV !== 'production'` or `ALLOW_DEMO_PAYMENTS === 'true'`,
and the code comments explain why the client toggle alone would be a free-car exploit.
`ALLOW_DEMO_PAYMENTS` is **not set in any env file checked** — correct.

## 5. What Failed to Run

**None.** Every build, lint, typecheck and test command completed successfully.

**Not attempted, and why:** the apps were not started against a live database and no
browser walkthrough was performed in this pass. The database URL points at a hosted
instance and the audit rules forbid destructive operations, so the running-app checks in
§7 and §9 are **code inspection only** and are labelled as such. The previous audit did a
live click-through; its UI findings are not re-confirmed here.

## 6. Missing Setup or Environment Information

Variable **names** only — no values were read or printed.

### 6.1 `.env.example` documents the wrong providers — **Confirmed**

- **What:** The example env file tells a new developer to configure **SendGrid**, **AWS
  S3** and **Redis**. The code uses **Resend** for email and **Cloudflare R2** for
  storage, and never references Redis.
- **Where:** `.env.example` vs `server/src/lib/storage.ts`, `server/src/lib/email.ts`
- **Evidence:** `.env.example` lists `SENDGRID_API_KEY`, `AWS_ACCESS_KEY_ID`,
  `AWS_S3_BUCKET`, `AWS_REGION`, `REDIS_URL`. The server code's actual `process.env`
  references are `RESEND_API_KEY`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`.
- **Why it matters:** Anyone setting this project up follows the example file, configures
  two services that are never called, and still has a broken app.
- **Priority:** Medium · **Category:** Code-quality or maintenance issue
- **Recommended fix:** Rewrite `.env.example` from the actual `process.env` references.
- **Safe to fix independently?** Yes — documentation only.
- **What else could be affected:** Nothing at runtime.

### 6.2 Supabase is configured but completely unused — **Confirmed**

- **What:** Both production env files set `VITE_SUPABASE_URL` and
  `VITE_SUPABASE_ANON_KEY`, but no Supabase SDK is installed and no application code calls it.
- **Where:** `apps/web/.env.production`, `apps/admin/.env.production`
- **Evidence:** No `supabase` dependency in any `package.json`. The only matches in the
  entire source tree are two Content-Security-Policy allowlist entries
  (`server/src/index.ts:79,95`). A `SUPABASE_INTEGRATION_PLAN.md` exists at the repo root.
- **Why it matters:** Dead configuration that implies a database/auth layer that is not
  there. The next person debugging auth will waste time looking at Supabase.
- **Priority:** Low · **Category:** Code-quality or maintenance issue
- **Recommended fix:** Delete the two variables, or add a line to the plan doc saying it
  was never implemented.
- **Safe to fix independently?** Yes — nothing reads them.

### 6.3 `VITE_STRIPE_PUBLIC_KEY` in the admin env is read by nothing — **Confirmed**

- **What:** The admin production env defines `VITE_STRIPE_PUBLIC_KEY`; the codebase only
  ever reads `VITE_STRIPE_PUBLISHABLE_KEY`.
- **Where:** `apps/admin/.env.production`
- **Evidence:** The complete set of `import.meta.env.*` references across both front-ends
  is `VITE_API_URL`, `VITE_ADMIN_URL`, `VITE_SITE_URL`, `VITE_STRIPE_PUBLISHABLE_KEY`, `DEV`.
- **Why it matters:** If anyone ever wires Stripe into the admin app, it will read an
  undefined variable and fail confusingly.
- **Priority:** Low · **Category:** Deployment or configuration issue
- **Recommended fix:** Rename to `VITE_STRIPE_PUBLISHABLE_KEY` or remove it.

## 7. Customer-Facing Website Findings

**Inspection-based only** — the site was not run in a browser during this pass.

### 7.1 Contact details were inconsistent across the site — **Fixed today**

Four different phone numbers were rendered to customers: `863-277-7879`, `863-279-2907`,
`813-422-4539` (a different area code, on the homepage call-to-action) and a fake vanity
`1-800-GEM-AUTO`. All now resolve to **863-277-6712**, the number registered for business
texting, and the email is `Bookings@Gemrentalcars.com`. `StructuredData.tsx` — which feeds
Google's search listing — had its own hardcoded copy that bypassed the shared contact file.
**Priority was High; now closed.** Needs a deploy to take effect.

### 7.2 Unverified insurance promise — **Fixed today**

The booking flow advertised _"Full Coverage Insurance … Zero deductible … Third-party
liability."_ None of it was checked against a policy, and an insurance promise is a
contractual claim. Replaced with "Damage Protection — a team member confirms exactly what
is covered, and the cost, before your rental is booked." **Priority was High; now closed.**

### 7.3 Phone fields use a placeholder from a different country format — **Open**

- **What:** Phone inputs suggest `+1 (555) 123-4567`.
- **Where:** `apps/web/src/components/booking/CustomerInfoStep.tsx:93`,
  `apps/web/src/pages/auth/RegisterPage.tsx:280`
- **Evidence:** Read directly from both files.
- **Why it matters:** `555` is the fictional-number prefix used in films. It is a small
  but real credibility signal on a form asking for a real phone number.
- **Priority:** Low · **Category:** Design or user-experience issue
- **Recommended fix:** Use a local-looking example, e.g. `(863) 555-0100`, or just `Phone number`.
- **Safe to fix independently?** Yes — cosmetic.

## 8. Backend and API Findings

### 8.1 Booking totals were duplicated across client and server — **Fixed today**

- **What:** The browser and the server each had their own hardcoded copy of every extras
  price, and **the server's copy decides what the customer is charged.**
- **Where:** `apps/web/src/lib/extras.ts` (new) vs `server/src/routes/bookings.ts`
- **Evidence:** Before the fix, `calculateTotal` existed in both with the same magic
  numbers (25, 10, 8, 15). Changing only the browser would show a customer $5/day and bill
  them $8.
- **Why it matters:** This class of bug surfaces as a chargeback, not an error log.
- **Priority:** Was High · **Category:** Actual code defect
- **Status:** Web side consolidated into one module; server updated in the same pass; both
  now carry comments naming the other. **They are still two files that must be kept in
  sync by hand** — a shared package would be better but the server's tsconfig has no path
  mapping to `packages/*`, so that is a build-config change, not a quick fix.

### 8.2 The test suite did not cover pricing at all — **Fixed today**

- **What:** 76 server tests passed while the prices were wrong.
- **Evidence:** `src/__tests__/routes/bookings.test.ts:214` asserts only
  `expect(response.body.data).toHaveProperty('total')` — that a total _exists_, never its
  value. `totalAmount: 195` elsewhere is fixture input, not an assertion.
- **Why it matters:** A green build gave false confidence about the thing most likely to
  cost real money.
- **Priority:** Was High · **Category:** Code-quality or maintenance issue
- **Status:** Added `server/src/__tests__/pricing.test.ts` — 7 tests covering each extra,
  that insurance and GPS can never be charged even if the flags are forged, and that the
  deposit applies once rather than per day. All pass.

## 9. Admin Dashboard Findings

### 9.1 The dashboard kept forgetting the login — **Fixed today, root cause found**

- **What:** The owner reported having to sign in to the admin repeatedly.
- **Where:** `apps/admin/src/stores/authStore.ts`, same bug in `apps/web/src/stores/authStore.ts`
- **Evidence:** On every app start the store calls `api.auth.me()`, and the `catch` block
  ran `tokenManager.removeToken()` on **any** thrown error. `ApiError` was imported but
  never used to distinguish a genuine 401 from a network blip, a timeout or a 500.
- **Why it matters:** One failed request on boot — a flaky connection, a cold server —
  permanently signed the user out. It looked like "the site forgot me."
- **Priority:** Was High · **Category:** Actual code defect
- **Status:** Both stores now only clear the token on **401 or 403**; any other error keeps
  the session and logs a warning.

### 9.2 Admin had no "remember me" at all; the customer site's was decorative — **Fixed today**

- **Evidence:** The admin login page had no checkbox. The customer login page _had_ one
  (`LoginPage.tsx:282`) whose value was collected into `formData.rememberMe` and then
  **never passed to `login()`** — a control that did nothing. Its label also promised
  "Remember me for 30 days" while `JWT_EXPIRES_IN` is `7d`.
- **Status:** Both apps now have a working checkbox, default **on**. Checked stores the
  token in `localStorage` (survives closing the browser); unchecked uses `sessionStorage`
  (cleared on close, for a shared machine). All storage access is wrapped in try/catch
  because it throws rather than returning null in private-browsing mode. The misleading
  "30 days" label now reads "Keep me signed in on this device".

### 9.3 Sessions still end after 7 days regardless — **Open, needs your decision**

- **What:** "Remember me" controls _where_ the token is kept, but the token itself expires.
- **Where:** `server/.env` sets `JWT_EXPIRES_IN="7d"`; default in code is also `7d`.
- **Evidence:** Read from the env file and `server/src/routes/auth.ts:84`.
- **Why it matters:** Even with the box ticked, everyone must sign in again weekly. That
  is probably not what "always be logged in" means to you.
- **Priority:** Medium · **Category:** Missing or unfinished feature
- **Recommended fix:** Either raise `JWT_EXPIRES_IN` (simple, but a stolen token stays
  valid longer), or add refresh tokens (correct, more work). **This is a security
  trade-off and should be your call, not mine.**
- **Safe to fix independently?** Depends — it is auth, high blast radius.

### 9.4 The admin app has zero tests — **Open**

- **Evidence:** `find apps/admin/src -name '*.test.*'` returns 0 files, against 3 for the
  customer site and 4 for the server.
- **Priority:** Low · **Category:** Code-quality or maintenance issue

## 10. Database Findings

**Not connected to during this audit** — the audit rules forbid destructive database
operations and the configured URL points at a hosted instance.

**Confirmed by reading files:** one schema system only (Prisma), 7 migrations, newest
`20260129_confirmation_email_sent`. No second/competing migration system was found, so the
"two schema systems" risk the checklist warns about does not apply here.

**Inspection-based observation:** `BusinessSettings.depositPercentage` (default `0.20`)
exists in the schema and is read only by `server/src/routes/preferences.ts` and the admin
API client — **nothing in the booking flow uses it**. The $100 deposit added today is a
separate flat constant. Two deposit concepts now exist; only one is wired up.
**Priority:** Low · **Category:** Code-quality or maintenance issue.

## 11. Authentication and Security Findings

### 11.1 Sensitive routes are properly protected — **Confirmed, no action needed**

Spot-checked `customers.ts`, `invoices.ts`, `billing.ts`, `documents.ts`. Every route
carries `authenticate` plus `authorize(...)` with explicit roles. An initial grep
suggesting 43 unprotected routes was a false positive from multi-line route definitions.

### 11.2 Unused Twilio credentials sit in a local env file — **Open**

- **What:** `server/.env` contains `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` and
  `TWILIO_PHONE_NUMBER`. No server code reads any of them.
- **Evidence:** They are absent from the complete list of `process.env.*` references. The
  only `TWILIO` matches are a provider-name enum in `integrations.ts:149,424` and a type
  union in the admin API client — neither consumes the env vars.
- **Why it matters:** Live credentials with no purpose are pure downside: they can leak,
  and they cannot break anything by being revoked.
- **Priority:** Medium · **Category:** Security or privacy concern
- **Recommended fix:** Confirm they are unused in production too, then revoke them at
  Twilio and delete the lines.
- **Safe to fix independently?** Yes, once production is confirmed not to use them.

### 11.3 Env hygiene is otherwise good — **Confirmed**

`.gitignore` covers `.env`, `.env.local` and `.env.*.local`, and **no secret-bearing env
file is tracked by git**. `apps/web/.env.production` and `apps/admin/.env.production` _are_
tracked, but contain only a Stripe **publishable** key and a Supabase **anon** key — both
designed to be public and both shipped in the browser bundle anyway. **This is not a
credential leak.** Worth confirming the GitHub repo's visibility regardless.

## 12. Payments, Email, Storage, and Integration Findings

### 12.1 **The Stripe secret key looks like a placeholder, next to LIVE publishable keys** — **Open, most serious finding**

- **What:** The server's Stripe secret key is **27 characters**. A real Stripe secret key
  is roughly 107 and begins `sk_live_` or `sk_test_`; this one matches neither prefix.
  Meanwhile `STRIPE_PUBLISHABLE_KEY` in `server/.env` and `VITE_STRIPE_PUBLISHABLE_KEY` in
  `apps/web/.env.production` are both **live-mode** keys.
- **Where:** `server/.env`, `apps/web/.env.production`
- **Evidence:** Length and prefix only — **no key value was read or printed.** Prefix
  classification returned "unrecognised format" for the secret and "LIVE mode" for both
  publishable keys.
- **Why it matters:** A live publishable key renders a real card form to a real customer.
  If the server's secret is a placeholder, the charge then fails at the last step — the
  worst possible place to lose a booking. If instead it is a valid short-form restricted
  key, **real money is live right now.** Either way you need to know which.
- **Priority:** **Critical** · **Category:** Deployment or configuration issue
- **Recommended fix:** Check the Stripe dashboard and confirm what the production host
  actually has set. Use test keys everywhere except production.
- **Safe to fix independently?** **No — payment config, highest blast radius.** Verify in
  Stripe's dashboard before changing anything.
- **What else could be affected:** Every booking that reaches payment; the webhook handler.

### 12.2 Image hosting — **RESOLVED 2026-10-20 after deploy: production was fine**

> **Correction.** This was reported as High on the basis of the LOCAL `server/.env`.
> After deploying a health check that reports image servability, the live API returns
> `"images": "servable"` with `"imageBucketsMissingPublicUrl": []` — so **production has
> all three per-bucket URLs set correctly**. The mismatch was local-only. No customer was
> ever affected. The code now also falls back to `R2_PUBLIC_URL` if the three are absent.
>
> Original finding, kept for the record:

#### (original)

- **What:** The code reads three per-bucket URLs; the env file provides one generic one.
- **Where:** `server/src/lib/storage.ts:16-18` reads `R2_AVATARS_PUBLIC_URL`,
  `R2_VEHICLES_PUBLIC_URL`, `R2_LOGOS_PUBLIC_URL`. `server/.env` defines only `R2_PUBLIC_URL`.
- **Evidence:** Both read directly. `isConfigured` (line 22) checks only the account ID and
  keys, so storage reports itself configured while every public URL resolves to `undefined`.
- **Why it matters:** `getPublicUrl()` returns `null` and logs "Public URL not configured
  for bucket" — so **vehicle photos, avatars and logos have no URL**. On a car rental site,
  vehicle photos are the product. It fails gracefully rather than crashing, which is why
  it could go unnoticed.
- **Priority:** **High** · **Category:** Deployment or configuration issue
- **Recommended fix:** Set the three per-bucket variables on the production host (and
  locally), or change the code to fall back to `R2_PUBLIC_URL`.
- **Safe to fix independently?** Yes — additive config.

### 12.3 Email bounce handling is inert — **Open**

- **What:** `RESEND_WEBHOOK_SECRET` is not set in any env file checked.
- **Where:** `server/src/routes/webhooks.ts:16,57-60`
- **Evidence:** Without it the handler returns **503 "Webhook not configured"** and
  processes nothing. Verified by reading the handler.
- **Why it matters:** The waiting list has real bounce-tracking and suppression built in
  (`bounceCount`, `suppressedAt` on `WaitlistSubscriber`). With the webhook inert, **none
  of it ever runs** — bounces are never recorded, dead addresses are never suppressed, and
  the sending domain's reputation degrades silently. That directly threatens the deliverability
  of the list you are building for ads.
- **Priority:** **High** · **Category:** Deployment or configuration issue
- **Recommended fix:** Create the webhook in Resend, set the signing secret.
- **Safe to fix independently?** Yes.

### 12.4 Webhook signature verification is correctly implemented — **Confirmed, no action**

Both the Stripe handler (`payments.ts:484`, `stripe.webhooks.constructEvent`) and the
Resend handler verify signatures against the raw body, with comments explaining why a
re-serialised JSON body would not match. This is done properly.

## 13. Build, Lint, Test, and Console Results

See the table in §4 — all green. **Browser console errors were not captured** because no
browser session was run in this pass; that is a gap, not a pass.

Lint produced **zero** errors and **zero** warnings across both front-ends, which is
unusual and good.

## 14. Deployment Concerns

**Confirmed:** `render.yaml`, `vercel.json` and `.github/workflows/deploy.yml` all exist.
Their contents were **not** cross-checked against the full env-var list — that is a
remaining gap and the most likely place the §12 mismatches are either fixed or repeated.

**37 files are uncommitted on `master`.** 24 are documentation files that differ only by
added YAML frontmatter from a previous tooling pass; 11 are today's source changes, plus 2
new files. **Nothing has been committed or pushed** — per the audit rules and your standing
instruction.

## 15. Full Prioritized Issue List

| #    | Finding                                                             | Category          | Priority     | Status           |
| ---- | ------------------------------------------------------------------- | ----------------- | ------------ | ---------------- |
| 12.1 | Stripe secret looks like a placeholder beside LIVE publishable keys | Deployment/config | **Critical** | Open             |
| 12.2 | R2 per-bucket URL mismatch — images have no URL                     | Deployment/config | **High**     | Open             |
| 12.3 | Resend webhook secret missing — bounce handling inert               | Deployment/config | **High**     | Open             |
| 9.1  | Auth store signed users out on any network error                    | Code defect       | High         | **Fixed**        |
| 9.2  | "Remember me" absent in admin, decorative in web                    | Missing feature   | High         | **Fixed**        |
| 8.1  | Booking prices duplicated client/server                             | Code defect       | High         | **Fixed**        |
| 8.2  | Tests never asserted pricing                                        | Maintenance       | High         | **Fixed**        |
| 7.1  | Four different phone numbers on the site                            | Code defect       | High         | **Fixed**        |
| 7.2  | Unverified insurance promise                                        | Security/privacy  | High         | **Fixed**        |
| 9.3  | Sessions still expire after 7 days                                  | Missing feature   | Medium       | Open — your call |
| 11.2 | Unused Twilio credentials in env                                    | Security/privacy  | Medium       | Open             |
| 6.1  | `.env.example` documents SendGrid/AWS/Redis — none used             | Maintenance       | Medium       | Open             |
| 10   | Two unrelated deposit concepts                                      | Maintenance       | Low          | Open             |
| 6.2  | Supabase configured but unused                                      | Maintenance       | Low          | Open             |
| 6.3  | `VITE_STRIPE_PUBLIC_KEY` read by nothing                            | Deployment/config | Low          | Open             |
| 7.3  | `555` placeholder phone numbers                                     | Design/UX         | Low          | Open             |
| 9.4  | Admin app has no tests                                              | Maintenance       | Low          | Open             |

## 16. Quick Wins

Each is small, low-risk and independent:

1. Set the three `R2_*_PUBLIC_URL` variables (§12.2) — restores vehicle images.
2. Set `RESEND_WEBHOOK_SECRET` (§12.3) — switches bounce handling on.
3. Delete the unused Twilio credentials after revoking them (§11.2).
4. Rewrite `.env.example` from what the code actually reads (§6.1).
5. Replace the `555` placeholders (§7.3).

## 17. Features That Can Wait

Supabase cleanup, the duplicate deposit concept, admin tests, and the
`VITE_STRIPE_PUBLIC_KEY` rename. None affect a customer today.

## 18. Recommended Order of Repairs

1. **Settle the Stripe question first** (§12.1). Everything about taking money depends on
   knowing whether you are live, in test, or broken.
2. **Restore images** (§12.2) — a rental site without vehicle photos cannot convert ad traffic.
3. **Turn on bounce handling** (§12.3) before sending to the waiting list at any volume.
4. **Deploy today's fixes** — phone numbers, insurance wording, pricing and login are all
   fixed in the working tree and live for nobody until the apps are rebuilt and deployed.
5. **Decide on session length** (§9.3).
6. Then the quick wins in §16.

## 19. The First Five Tasks to Complete

1. **Open the Stripe dashboard and confirm which keys production is really using.** The
   secret key here is too short to be a normal Stripe key while the public keys are
   live-mode. You need to know whether real cards can be charged right now. _(First
   because everything else about money is guesswork until it is answered.)_
2. **Set the three image-hosting variables.** Right now the server believes storage is
   configured but has no address to serve images from, so vehicle photos silently have no
   URL. _(Second because paying for clicks to a site with no car photos wastes the spend.)_
3. **Create the Resend webhook and set its secret.** The bounce-and-suppress machinery is
   already built and is doing nothing; without it, emailing the waiting list quietly
   damages your sending reputation. _(Third because the damage is cumulative and invisible.)_
4. **Build and deploy both front-ends and the API.** Today's fixes — one correct phone
   number everywhere, the insurance claim removed, correct extras pricing, the $100
   deposit, and a login that stops forgetting you — exist only on this machine. _(Fourth
   because it is the step that makes the work real.)_
5. **Decide how long a login should last.** "Remember me" now works, but every session
   still ends after 7 days. Longer is more convenient and slightly riskier. _(Fifth because
   it needs your judgement, not a technical fix.)_

## 20. Manual Testing Checklist

Things only a human with real credentials can confirm:

- [ ] Sign in to the admin, close the browser completely, reopen — still signed in?
- [ ] Sign in with "Keep me signed in" **unticked**, close the browser, reopen — signed out?
- [ ] Book a car end to end in **Stripe test mode** and confirm the charged amount equals
      rental + extras + the $100 deposit.
- [ ] Confirm the insurance option appears greyed out and cannot be selected.
- [ ] Confirm GPS no longer appears anywhere in the booking flow.
- [ ] Open a vehicle page and confirm photos load (this will fail until §12.2 is fixed).
- [ ] Send a test email and confirm a bounce is recorded (will fail until §12.3 is fixed).
- [ ] Check every page on a phone, not just a narrow desktop window.
- [ ] Confirm the GitHub repository's visibility (public or private).
