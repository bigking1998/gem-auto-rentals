---
title: Admin App Fix Report — apps/admin
aliases: [Admin Fixes, fixed-admin]
tags: [fix-report, admin, react, api-contract, accessibility, dead-code]
created: 2026-08-02
description: What was changed in apps/admin in response to the audit, what was deliberately left alone, and what the audit itself got wrong. Covers the 9 assigned findings plus the safe remainder, with verification results.
related:
  - '[[audit-admin]]'
---

# Admin App Fix Report — `apps/admin`

Scope kept to `apps/admin` throughout. **No file under `server/` was modified** —
see [[#Finding 1]] and [[#Finding 2]], where the server turned out to already be
correct and the bug was entirely client-side.

## Verification (all run, all green)

| Command                          | Result                                   |
| -------------------------------- | ---------------------------------------- |
| `pnpm --filter admin typecheck`  | clean                                    |
| `pnpm --filter admin lint`       | 0 errors, 0 warnings                     |
| `pnpm --filter admin build`      | succeeds, exit 0                         |
| `pnpm --filter server typecheck` | **not run — no server file was touched** |
| `pnpm --filter server test`      | **not run — no server file was touched** |

No dev server left listening on 3000 / 5173 / 5174 (verified with `lsof`).

---

# Assigned findings

## Finding 1 — Change Password 404 (CRITICAL) · FIXED

`server/src/routes/auth.ts:236` implements `router.put('/change-password', …)`.
The server is right; the client was wrong. Changed `apps/admin/src/lib/api.ts`
`auth.changePassword` from `method: 'POST'` to `method: 'PUT'`. **No server
change was needed**, which also means `apps/web` is unaffected.

## Finding 2 — Booking status workflow dead (CRITICAL) · FIXED

Confirmed `server/src/routes/bookings.ts` has no `/:id/status` route. The real
route is `PATCH /:id` at line 310, and I verified both requirements you asked about:

- **It accepts a status change** — `updateBookingSchema` (line 45) includes
  `status: z.enum(['PENDING','CONFIRMED','ACTIVE','COMPLETED','CANCELLED']).optional()`.
- **It enforces staff authorisation** — lines 326–341: non-staff can only touch
  their own bookings, only while `PENDING`, and `if (!isStaff && data.status)`
  throws `ForbiddenError('You cannot change booking status')`.

So again the fix is purely client-side. `api.bookings.updateStatus` now calls
`PATCH /bookings/:id` with `{ status }`. Confirm / activate / complete now persist.

**Also fixed while here:** `api.bookings.update` used `PUT /bookings/:id`, which
also 404s. Changed to `PATCH`. It was unused, but it was a trap for the next caller.

## Finding 3 — Fake 2FA (CRITICAL) · FIXED (made honest, no TOTP built)

`apps/admin/src/pages/SecurityPage.tsx`. Deleted outright: the hardcoded RFC-6238
example secret `JBSWY3DPEHPK3PXP`, the fake `<QrCode>` glyph, the four hardcoded
backup codes, the "any 6 digits verifies" `handleVerify2FA`, `handleEnable2FA`,
`handleDisable2FA`, and all the local-only `twoFactorEnabled` / `showSetup` /
`verificationCode` state. Grep for any of those strings now returns nothing.

The tab remains but is inert and labelled: a grey "Coming soon" pill, a yellow
warning panel stating plainly that 2FA is **not** active and the account is
password-only, and a single `disabled` button. There is nothing left that looks
functional. The sidebar Security Status card no longer claims "Strong" — it reads
"Password only" / "2FA not available yet".

Tab order changed so the page opens on **Active Sessions** (real) rather than the
non-functional 2FA tab.

`HelpPage.tsx` FAQ #8 rewritten to say 2FA is not available and to point at the
Sessions / Login History tabs instead.

## Finding 4 — Settings overwrote company info (HIGH) · FIXED — and it was worse than the audit thought

The audit said the hardcoded constants get **written over the real DB values**.
That is not what was happening, and the truth is worse. The client's
`CompanySettings` interface was **entirely fictional** relative to the database:

| Client claimed                                                                                                 | Actually in `CompanySettings` (Prisma + zod)                    |
| -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `name`, `email`, `phone`, `address`                                                                            | `companyName`, `companyEmail`, `companyPhone`, `companyAddress` |
| `logo`                                                                                                         | `companyLogo`                                                   |
| `businessHours`                                                                                                | `operatingHours`                                                |
| `city`, `state`, `zipCode`, `legalName`, `taxId`, `website`, `country`, `currency`, `timezone`, `bookingTerms` | **do not exist at all**                                         |

`updateCompanySettingsSchema` is a plain `z.object`, so `.parse()` **silently
strips every unknown key**. The Save button was therefore sending `{}` — a total
no-op that returned success and didn't even write an activity log. And
`api.company.get()` returned `companyLogo`, while the page read `settings.logo`,
so the uploaded company logo never displayed either.

Fixes in `apps/admin/src/lib/api.ts` and `apps/admin/src/pages/SettingsPage.tsx`:

- Rewrote the `CompanySettings` interface to mirror the Prisma model field-for-field,
  with a comment warning that a mismatched name is a silent no-op, not an error.
- Company tab now loads real values via `api.company.get()` into controlled state
  (name, email, phone, address) and re-applies the server's response after save.
- **Operating Hours** are now real controlled state: 7 days, `type="time"` open/close
  inputs plus a "Closed" checkbox, sent as `operatingHours`. The old `defaultValue`
  free-text rows are gone.
- **Cancel** now re-fetches from the API instead of re-seeding hardcoded literals.
- Logo now reads `companyLogo`.
- Removed the Business Type / Tax ID / Website inputs — no DB columns back them, so
  they were three more fields that discarded whatever was typed.
- Address collapsed to one field, because the DB has one `companyAddress` column.
  Splitting/rejoining an arbitrary address string would have been guesswork.
- Save is disabled for non-ADMIN with an explanatory note, because
  `PUT /api/settings/company` is `authorize('ADMIN')` while `GET` allows SUPPORT
  (audit F-20). The form no longer looks editable to someone whose save would 403.

## Finding 5 — False success on vehicle image upload (HIGH) · FIXED

`apps/admin/src/pages/AddVehiclePage.tsx` now collects failed filenames in the
loop. On any failure it emits an error toast naming the count and the files, and
navigates to `/fleet/${newVehicle.id}` (the edit page, where uploads are immediate
and errors surface per-file) instead of `/fleet`. `toast.success` only fires when
zero uploads failed. Deleted the dead `uploadedImages` accumulator.

## Finding 6 — Fabricated data on the dashboard (MEDIUM) · FIXED (wired to real data)

**Recent Activity** — the five invented events with fake customer names are gone.
The feed is now `api.activity.list({ limit: 5 })`, rendering the real
`description`, the real acting user, and a relative timestamp, with loading and
empty states. The dot colour is derived from the real `action` prefix.

**Trend percentages** — removed. I checked whether they could be wired to real
data instead and they cannot: `GET /api/stats/revenue` returns
`{ period, data, totals: { revenue, bookings, averageBookingValue } }`. The
`growthRate` the audit suggested wiring up **does not exist on the server** — the
client `RevenueStats` interface invented both `growthRate` and `averageOrderValue`.
I corrected that interface too, with a comment not to re-add a delta client-side.
Each stat card now shows a factual caption ("Payments received today") in place of
the fake "+8.2% vs last week".

**Bonus, same class of problem:** the Weekly Revenue chart was a hardcoded 7-point
array behind a `DEMO` badge. It is now wired to `GET /api/stats/revenue`, and the
period `<select>` (previously a dead control) drives it — Last 7 / 30 / 90 days.
The `DEMO` badge is gone because the data is now real. The "View All" button on the
activity card was removed rather than pointed somewhere wrong; there is no
full-activity page in the admin.

## Finding 7 — Inverted conversation status colours (MEDIUM) · FIXED

Created `apps/admin/src/lib/statusColors.ts` as the single source of truth, with a
documented convention. `MessagesPage.tsx` (which had the sane map) and
`TrashPage.tsx` (which had the inverted ternary) both import
`conversationStatusColors` now. Kept blue for `OPEN`, green for `RESOLVED`.

While there, collapsed the other four duplicated booking-status maps
(`BookingsPage`, `DashboardHome`, `CustomerProfilePage`, `VehicleBookings`) onto
`bookingStatusColors` from the same module. They agreed today; the duplication is
what let them drift before.

## Finding 8 — Dark mode toggle (MEDIUM) · FIXED (removed)

Removed the toggle UI and the `darkMode` state from
`apps/admin/src/components/layout/Header.tsx`. Replaced with a small mount effect
that strips the `.dark` class and clears `localStorage['darkMode']`, so anyone
currently stuck in the unreadable state is recovered on next load. Left the
`.dark` custom-property block in `index.css` — it is inert without the class and
is the starting point for doing this properly later.

## Finding 9 — Sidebar "Bookings" badge (MEDIUM) · FIXED

`DashboardLayout.tsx` now calls `api.bookings.list({ status: 'PENDING', limit: 1 })`.
Also fixed the second badge in the same function: `unreadMessages` was fed the count
of OPEN conversations; it now uses `api.conversations.getUnreadCount()`, which
existed and was never called. (I verified `/unread-count` is registered _before_
`/:id` in `conversations.ts`, so it is not shadowed.)

Also added a `visibilitychange` guard so the 30s poll stops in a background tab.

---

# Coordinator's two additions

## A — `apps/admin/.env.production` pointed at the dead Render host · FIXED

Changed `VITE_API_URL` from `https://gem-auto-rentals-server.onrender.com` to
`https://api.gemrentalcars.com`, matching what `apps/web/.env.production` already
has. Only that one line was touched; the Supabase and Stripe publishable keys in
the file are untouched.

> **Flagging honestly:** my original brief said "Do NOT modify .env files." I made
> this change only because you explicitly amended that instruction and confirmed
> the file is committed non-secret config. If that was not your intent, revert this
> one line.

## B — Blocking `wakeUpServer()` in the request path · FIXED

Confirmed both gated call sites (`request` and `requestWithPagination`), plus a
third eager call in `main.tsx`. The whole `wakeUpServer` function is gone, along
with `isServerAwake`, `serverWakeUpPromise` and the now-unused `SERVER_BASE_URL`.
A comment records why, so nobody reintroduces it.

Retries tightened to match the customer site: `MAX_RETRIES` 10 → **2**, backoff
`2s/3s/…/6s` → **400ms, 800ms**. Combined with the idempotency gate below, a failed
write now surfaces in well under a second instead of after ~45s.

---

# Additional findings fixed (from the audit's remainder)

| Audit ref | What I did                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **F-04**  | **NOT FIXED — out of scope.** `DELETE /sessions/revoke-all` is shadowed by `router.delete('/:id')` registered earlier in `server/src/routes/sessions.ts`. Real bug, correct diagnosis, one-block move — but `sessions.ts` belongs to the server agent. **Please hand this to them.**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| F-06      | `authStore.initialize()` now has the missing `else` branch: no token ⇒ `isAuthenticated: false`. The persisted flag can no longer let a tokenless user into the shell.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| F-08      | Retries gated on idempotent methods only (`isRetryableMethod`). A `POST /bookings` or `DELETE /vehicles/:id` that 500s after a partial commit is no longer replayed.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| F-13      | Deleted `BookingDetailModal.tsx`, `PaymentTrackingModal.tsx`, `CustomerProfileModal.tsx` (~1,476 lines, verified unimported). Removed the now-empty `components/customers/` directory.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| F-15      | Schedule Maintenance modal no longer collects a type, date and notes it silently discards. It is now an honest "Mark as Under Maintenance" confirmation that says outright no maintenance record is stored. Toast reworded to match what actually happens.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| F-16      | Deleted the fake API Access block (`gem_live_xxxx…` key, Copy, Regenerate, `href="#"` docs link) for a feature with no server support. Deleted the Help page's fake contacts (`support@gemauto.com`, `+1 (800) GEM-AUTO`, "Live Chat — Available now") and all 8 `href="#"` quick links / resources, replaced by one honest "Still stuck?" note. Removed the dead global search + `⌘K` hint from the header, the dead "Filters" button, and the dead conversation overflow menu. Wired up: the header avatar (→ Settings › Profile), the conversation Archive button (→ status `CLOSED`, verified the server accepts it), and Customer "Email" (→ `mailto:`). Removed Customer "Edit" — there is no edit form.                                                                    |
| F-17      | Help FAQs #2 (refunds), #4 (maintenance) and #7 (extend booking) rewritten to describe what the app actually does, alongside #8 (2FA).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| F-18      | `BookingsPage` now reads `?customerId=` via `useSearchParams` and passes it as `userId`, with a dismissible "Filtered to one customer" chip so the filter is visible. Sidebar active state now matches nested routes (`/fleet/new`, `/customers/:id`), special-casing `/`. Dashboard quick actions: "Add Vehicle" goes to `/fleet/new` (real route), the unread `{ state: { action } }` payload is gone, and "Add Customer" and "Record Payment" were removed — neither destination has any create/payment flow.                                                                                                                                                                                                                                                                  |
| F-21      | `--primary-ink` and `--accent-foreground` darkened `42 73% 33%` → `42 73% 30%` in the light theme. Verified by computing WCAG ratios: **4.75 → 5.56 on white**, **4.40 → 5.15 on `bg-accent`** — both now pass AA. I checked `apps/web/src/index.css` first: it already uses `42 73% 30%`, so this **converges** the two apps rather than diverging them. `hover:text-primary-dark` (3.74:1) replaced with `hover:underline` in Header.                                                                                                                                                                                                                                                                                                                                           |
| F-22      | Removed the no-op `text-primary-ink hover:text-primary-ink` pairs across AnalyticsPage, FleetManagement, SettingsPage, DashboardHome. Login gradient `from-accent … to-accent` given a real endpoint (`to-primary-light/30`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| F-24      | Added the missing `api.customers.delete` and wired `handleDeleteCustomer` — the endpoint existed all along (`customers.ts:504`, `adminOnly`). `api.bookings.update` PUT → PATCH. Deleted the unreachable Billing tab (155 lines), `mockInvoices`, and the three now-orphaned modals (`AddPaymentMethodModal`, `DeletePaymentMethodModal`, `UpgradePlanModal`). Integrations connect/disconnect are now awaited with error toasts and a refetch instead of fire-and-forget. Completed-bookings stat recoloured to `text-gray-900`. Login placeholder domain → `gemrentalcars.com`. Badge poll pauses on hidden tab. `VehicleForm` now appends file and preview together inside `onloadend`, so multi-select can no longer desync the arrays and make remove delete the wrong file. |

---

# Left alone, deliberately

- **F-04 (session revoke-all shadowing)** — server-side, another agent's file. Real
  and worth fixing; please route it. This is the one genuinely broken thing from my
  audit list that I could not touch.
- **F-19 (no admin UI for promos / loyalty / abandonment)** — a feature gap, not a
  defect. Building a Promotions page is well beyond a fix pass.
- **F-20 (role-gated UI)** — partially addressed: the Company Save button is now
  ADMIN-gated. I did **not** hide the Recycle Bin nav item or the Integrations tab
  from SUPPORT/MANAGER, because the audit is right that this is a deliberate
  product decision (hide the UI, or relax the server guard to `managerOnly`?) and
  it should not be made silently in a fix pass.
- **`.dark` block in `index.css`** — kept as inert dead CSS; it is the scaffolding
  for a real dark mode later.
- **`--primary-dark` token** — not changed. It fails as _text_ on white (3.74:1) but
  passes comfortably as a _background_ with navy foreground (4.81:1), and it is used
  far more often as a background. Fixed the two text usages instead.
- **S-01 … S-04 (suspected)** — untouched. All four need an authenticated session
  to confirm and I had none. S-03 in particular (`unreadCount`/`lastMessage` missing
  from the `Conversation` interface) is worth a look next time someone is logged in.
- **`apps/web` and `server/`** — not touched at all, per scope.

# Nothing failed

Every change above is in place and the full verification suite passes. There is no
partial or abandoned work in this pass. The two items I could not complete (F-04,
F-19/F-20 product decisions) are called out above rather than half-done.

# One thing worth escalating

The `CompanySettings` and `RevenueStats` mismatches in [[#Finding 4]] and
[[#Finding 6]] were the same failure mode: **a hand-written client interface that
drifted from the server, where zod's silent key-stripping turns the mismatch into a
successful-looking no-op instead of an error.** Two were found here by reading the
Prisma schema; there is no reason to believe they are the only two. Generating these
types from the server (or at least a contract test) would catch the whole class.
