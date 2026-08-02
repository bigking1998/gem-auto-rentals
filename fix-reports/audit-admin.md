---
title: Admin App Audit — apps/admin
aliases: [Admin Audit, audit-admin]
tags: [audit, admin, react, api-contract, accessibility, design-system, dead-code]
created: 2026-08-02
description: Read-only audit of apps/admin covering every route, API-contract mismatches against server/src/index.ts, colour/status-palette consistency, dead UI, auth-guard behaviour, and live console/network checks on admin.gemrentalcars.com.
related:
  - '[[recolor-admin-pages]]'
  - '[[recolor-admin-components]]'
  - '[[admin-upload-investigation]]'
  - '[[admin-email-husky]]'
---

# Admin App Audit — `apps/admin`

**Nothing was modified.** Read-only: file reads, greps, unauthenticated `curl` probes
against `https://api.gemrentalcars.com`, and a browser load of the live login page.
No login attempted, no credentials entered, no writes to the live system.

## Method / evidence sources

| Source                                                                    | What it proved                                                                                                                         |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `curl -X <M> https://api.gemrentalcars.com<path>` unauthenticated         | 401 = route exists + guarded. 404 = route does not exist. Verified against a known-bad control (`/api/nonexistent-route-check` → 404). |
| Live bundle `https://admin.gemrentalcars.com/assets/js/index-B9BwdjAL.js` | Confirms the _deployed_ code, not just the repo, ships the broken calls.                                                               |
| Browser pane on live login page                                           | Console + network clean; `/fleet` client-redirects to `/login`.                                                                        |
| `pnpm --filter admin typecheck` / `lint`                                  | Both clean — none of these findings are type or lint errors.                                                                           |

---

## Verdict

| Area                                   | Status                                                                     |
| -------------------------------------- | -------------------------------------------------------------------------- |
| Route protection (client)              | Works, **one hole** (F-06)                                                 |
| Route protection (server)              | Correct — every admin endpoint 401s unauthenticated                        |
| Known `AddVehiclePage` bug             | **Confirmed**, exact lines below (F-01)                                    |
| Hardcoded personal email on login page | **Gone** — confirmed in source and in the live bundle                      |
| Booking status colour map              | **Now consistent** across all 6 live definitions                           |
| Conversation status colour map         | **Still inverted** between two pages (F-11)                                |
| API calls vs mounted routes            | **3 endpoints 404 in production** (F-02, F-03, F-04)                       |
| 9 new DB tables                        | No admin page touched them before or now — **zero admin UI exists** (F-19) |
| Console errors on live login           | **None.** No failed requests.                                              |

Counts: **21 confirmed**, **4 suspected**.

---

# CONFIRMED — Critical

## F-01 · `AddVehiclePage` swallows image-upload failures, then lies and navigates away

**File:** `apps/admin/src/pages/AddVehiclePage.tsx`

```
31   if (pendingFiles && pendingFiles.length > 0) {
32     toast.info(`Uploading ${pendingFiles.length} image(s)...`);
33     const uploadedImages: string[] = [];
34     for (const file of pendingFiles) {
35       try {
36         const result = await api.vehicles.uploadImage(newVehicle.id, file);
37         uploadedImages.push(result.imageUrl);
38       } catch (uploadError) {
39         console.error('Error uploading image:', uploadError);   // <-- swallowed
40       }
41     }
42   }
43
44   toast.success('Vehicle added successfully');                   // <-- unconditional
45   navigate('/fleet');                                            // <-- leaves the page
```

- **Line 38–40** — the `catch` only `console.error`s. No rethrow, no `toast.error`, no
  failure counter, no abort of the loop.
- **Line 44** — `toast.success('Vehicle added successfully')` fires even when 0 of N
  images uploaded.
- **Line 45** — navigates to `/fleet`, destroying the in-memory `pendingFiles` so the
  operator cannot retry. The vehicle exists with no images and the operator believes it
  succeeded.
- **Line 33 / 37** — `uploadedImages` is populated and then never read. Dead variable
  (lint doesn't catch it because `.push()` counts as a use).

**Edit flow does it correctly** — `apps/admin/src/components/vehicles/VehicleForm.tsx:145-150`:

```
145  } catch (error) {
146    console.error('Error uploading image:', error);
147    toast.error(error instanceof Error ? error.message : 'Failed to upload image');
```

**Severity:** Critical (silent data loss + false success).
**Fix:** collect failures in the loop; after the loop, if `failed > 0` emit
`toast.error(\`Vehicle created, but ${failed} of ${pendingFiles.length} image(s) failed to upload\`)`
and **do not** navigate — instead `navigate(\`/fleet/${newVehicle.id}\`)`so the operator lands on
the edit page where images upload immediately and errors surface correctly. Only emit`toast.success`when`failed === 0`. Delete `uploadedImages`.

---

## F-02 · Change Password is a 404 in production — wrong HTTP method

- **Client:** `apps/admin/src/lib/api.ts:770-774` → `POST /auth/change-password`
- **Server:** `server/src/routes/auth.ts:208` → `router.put('/change-password', ...)`
- **Caller:** `apps/admin/src/pages/SettingsPage.tsx:245` (Settings → Security tab)

**Live evidence:**

```
POST /api/auth/change-password  -> 404
PUT  /api/auth/change-password  -> 401   (route exists, auth-guarded)
```

**Deployed bundle evidence** (`index-B9BwdjAL.js`):

```
changePassword:(e,t)=>je("/auth/change-password",{method:"POST",...})
```

No admin can change their password. The error surfaces as a generic
"Empty response from server" / 404 message after the retry loop.

**Severity:** Critical.
**Fix:** change `method: 'POST'` → `'PUT'` in `api.ts:771`. (Do **not** change the server —
the customer web app may call the same route; check `apps/web` before touching `auth.ts`.)

---

## F-03 · Booking status changes are a 404 in production — route does not exist

- **Client:** `apps/admin/src/lib/api.ts:926-930` → `PATCH /bookings/:id/status`
- **Server:** `server/src/routes/bookings.ts` has `patch('/:id')` (line 310) — **no `/:id/status` route at all.**
  `server/src/routes/extensions.ts` and `wallet.ts` also mount under `/api/bookings` and define
  no `/status` route.
- **Caller:** `apps/admin/src/pages/BookingsPage.tsx:97-109` (`handleStatusUpdate`, the
  per-row status dropdown).

**Live evidence:**

```
PATCH /api/bookings/abc123/status  -> 404
PATCH /api/bookings/abc123         -> 401   (this is the real route)
```

**Deployed bundle:** `updateStatus:(e,t)=>je(\`/bookings/${e}/status\`,{method:"PATCH",...})`

Confirming a PENDING booking, marking a booking ACTIVE or COMPLETED — all silently fail
with `toast.error('Failed to update booking status')` after the client's ~45 s retry loop
(see F-08). **Cancel** works (`POST /bookings/:id/cancel` → 401, route exists).

**Severity:** Critical — the primary booking workflow is dead.
**Fix:** in `api.ts:926`, call `request(\`/bookings/${id}\`, { method: 'PATCH', body: JSON.stringify({ status }) })`.
Verify `server/src/routes/bookings.ts:310`accepts`status` in its body schema first.

---

## F-04 · "Log out all other sessions" hits the wrong handler — route-order shadowing

- **Client:** `apps/admin/src/lib/api.ts:787-788` → `DELETE /sessions/revoke-all`
- **Caller:** `apps/admin/src/pages/SecurityPage.tsx:196-204`, button at `SecurityPage.tsx:486`
- **Server:** `server/src/routes/sessions.ts`
  - line **241**: `router.delete('/:id', ...)`
  - line **272**: `router.delete('/revoke-all', ...)`

Express matches in registration order, so `DELETE /sessions/revoke-all` is captured by
`/:id` with `id === 'revoke-all'`, hits `prisma.session.findUnique({ where: { id: 'revoke-all' } })`
→ `null` → `NotFoundError('Session not found')`. The handler at line 272 is unreachable.
(Live probe returns 401 because `authenticate` runs first — the shadowing is proven by
registration order, not by the probe.)

**Severity:** Critical — a security control that reports failure and does nothing.
**Fix:** move the `router.delete('/revoke-all', ...)` block (sessions.ts:272) **above**
`router.delete('/:id', ...)` (sessions.ts:241). Static-route-before-param-route.

---

## F-05 · Two-factor authentication on the Security page is entirely fake

**File:** `apps/admin/src/pages/SecurityPage.tsx`

| Line    | Problem                                                                                       |
| ------- | --------------------------------------------------------------------------------------------- |
| 164-174 | `handleEnable2FA` / `handleVerify2FA` are pure local state. **No API call anywhere.**         |
| 169-172 | Any 6 digits "verifies". `verificationCode.length === 6` is the only check.                   |
| 372     | Hardcoded TOTP secret `JBSWY3DPEHPK3PXP` — the RFC 6238 example secret, shown to every admin. |
| 362     | The "QR code" is a static lucide `<QrCode>` glyph, not a real provisioning QR.                |
| 105     | Backup codes hardcoded: `['ABC12-DEF34','GHI56-JKL78','MNO90-PQR12','STU34-VWX56']`.          |
| 374     | Copy-secret button: no `onClick`.                                                             |
| 457     | "Generate New Codes" button: no `onClick`.                                                    |
| 176-184 | Disable-2FA also only flips local state.                                                      |

`twoFactorEnabled` is never persisted — a page refresh silently reverts to "Disabled"
after the operator believes they enabled 2FA. There is no 2FA field in the server
auth routes either. `HelpPage.tsx:82-85` documents this as a working feature.

**Severity:** Critical (security theatre — worse than no 2FA, because it advertises protection).
**Fix:** Remove the entire Two-Factor tab (`SecurityPage.tsx:92-96` tab entry and the
`activeTab === 'two-factor'` block, lines 311-464) and FAQ #8 in `HelpPage.tsx:80-86`,
until a real TOTP flow exists server-side. Keep Sessions and Login History — those are real.

---

# CONFIRMED — High

## F-06 · Auth guard passes with a persisted flag but no token

**File:** `apps/admin/src/stores/authStore.ts:44-88`

`isAuthenticated` is persisted to `localStorage['admin-auth-storage']` (`partialize`,
lines 192-195). The token lives in a _separate_ key, `admin_auth_token` (`api.ts:1224`).

`initialize()` only validates when a token exists:

```
48   if (token) {
       ... api.auth.me() ... else set({ isAuthenticated: false })
81   }
83   set({ isLoading: false, isInitialized: true });   // no else branch
```

If the token key is cleared/expired but the persisted `isAuthenticated: true` survives,
`ProtectedRoute` (`App.tsx:102`) lets the user through. Result: the dashboard shell renders
with the previous user's name and avatar (Sidebar 163-172, Header 558-565), and every API
call 401s. The user is never redirected to `/login`.

No data leaks — the server correctly 401s everything (see the endpoint matrix below) — but
the app is stuck in a broken half-authenticated state.

**Severity:** High.
**Fix:** add `else { set({ user: null, isAuthenticated: false }); }` after `authStore.ts:81`.
Separately, add a global 401 handler in `api.ts request()` that clears the token and hard-redirects
to `/login`, so mid-session expiry is handled (currently only `fetchProfile` handles 401,
`authStore.ts:177-180`).

## F-07 · Dark-mode toggle makes the admin unreadable

- **Toggle:** `apps/admin/src/components/layout/Header.tsx:519-532` (writes `.dark` on
  `documentElement`, persists to `localStorage['darkMode']`, `Header.tsx:132-140`).
- **Reality:** the admin app has **0** `dark:` variants and **0** semantic surface tokens.
  Measured across `apps/admin/src/**/*.tsx`:

  | Class             | Count |
  | ----------------- | ----- |
  | `bg-white`        | 139   |
  | `bg-card`         | 0     |
  | `text-gray-900`   | 212   |
  | `text-foreground` | 0     |
  | `dark:`           | 0     |

Toggling dark mode changes only the CSS variables in `apps/admin/src/index.css:74-...`,
while every surface stays literally white. `--primary-ink` flips from
`42 73% 33%` to `46 70% 62%`:

| Pairing                                    | Light             | Dark                    |
| ------------------------------------------ | ----------------- | ----------------------- |
| `text-primary-ink` on `bg-white`           | **4.77:1** (pass) | **1.73:1** (total fail) |
| `bg-accent` patch inside a `bg-white` card | pale gold         | dark brown              |

Every gold label, spinner, tab and link in the app becomes invisible.

**Severity:** High.
**Fix (cheapest):** delete the toggle block (`Header.tsx:507-533`) and the `darkMode`
state/effect (`Header.tsx:123-140`), and clear the stale `localStorage['darkMode']` on boot.
Re-introduce only after the pages are migrated to `bg-card` / `text-foreground` / `bg-background`.

## F-08 · Non-idempotent requests are retried up to 10× on HTTP 500

**File:** `apps/admin/src/lib/api.ts:153-157`, `167-171`, `184-188` (and the mirrored
block in `requestWithPagination`, lines 243-247 / 257-261 / 278-282).

The retry branches key only on `response.status === 500` and `error instanceof TypeError`
— they do not check `fetchOptions.method`. A `POST /bookings`, `POST /trash/empty`,
`DELETE /vehicles/:id` or `POST /conversations` that 500s _after_ partially committing
gets replayed up to 10 times. Backoff is 2s→6s, so worst case ≈ **45 seconds** before the
user sees any error, on top of the duplicate-write risk.

**Severity:** High.
**Fix:** gate the retry on `!fetchOptions.method || fetchOptions.method === 'GET'`, and cut
`maxRetries` to 3 for the wake-up case.

## F-09 · Sidebar badges show the wrong numbers

**File:** `apps/admin/src/components/layout/DashboardLayout.tsx:16-26`

```
16   const bookingsResponse = await api.bookings.list({ limit: 1 });
17   const totalBookings = bookingsResponse.pagination?.total || 0;
...
24     pendingBookings: totalBookings > 0 ? totalBookings : undefined,
25     unreadMessages: openConversations > 0 ? openConversations : undefined,
```

- `pendingBookings` (rendered next to **Bookings** in `Sidebar.tsx:38`) is fed the
  **total** booking count — no `status: 'PENDING'` filter. The badge will read e.g. "342"
  forever and never decrease as work is done.
- `unreadMessages` is fed the count of **OPEN conversations**, not unread messages.
  `api.conversations.getUnreadCount()` exists (`api.ts:1071`, server route
  `conversations.ts:183`) and is never called.

**Severity:** High (an operator-facing counter that is always wrong is worse than no counter).
**Fix:** `api.bookings.list({ status: 'PENDING', limit: 1 })` for the first;
`api.conversations.getUnreadCount()` for the second.

## F-10 · Fabricated trend percentages presented as real metrics

**DashboardHome** — `apps/admin/src/pages/DashboardHome.tsx:221-256`, rendered at 379-394
with the literal label **"vs last week"**:

| Line | Value                            |
| ---- | -------------------------------- |
| 225  | `change: 12` (Active Rentals)    |
| 233  | `change: 8.2` (Today's Revenue)  |
| 243  | `change: -3` (Pending Bookings)  |
| 251  | `change: 5` (Available Vehicles) |

All four are constants. Green up-arrows / red down-arrows are driven by hardcoded `trend`.

**AnalyticsPage** — `apps/admin/src/pages/AnalyticsPage.tsx:162-196`, rendered at 452-464:

| Line | Problem                                                                                                          |
| ---- | ---------------------------------------------------------------------------------------------------------------- |
| 167  | `change: 12.5, // Would need historical comparison to calculate` — an in-code admission                          |
| 175  | `change: 8.2`                                                                                                    |
| 182  | `change: customerData?.newCustomers \|\| 0` — a **raw count** rendered as `{Math.abs(stat.change)}%` at line 464 |
| 189  | `change: utilizationRate > 50 ? 2.1 : -2.1` — a fabricated delta derived from a level                            |

**Severity:** High — a business owner will make decisions on these.
**Fix:** either compute real period-over-period deltas server-side (`/api/stats/revenue`
already returns `growthRate`, `api.ts:465`), or delete the change/trend chips entirely.
The `growthRate` field is fetched and never used — wire it into the Revenue card at minimum.

## F-11 · Conversation status colours are inverted between two pages

| File:line                      | `OPEN`    | `RESOLVED`                 | `CLOSED` | `PENDING` |
| ------------------------------ | --------- | -------------------------- | -------- | --------- |
| `pages/MessagesPage.tsx:26-32` | **blue**  | **green**                  | gray     | yellow    |
| `pages/TrashPage.tsx:231-238`  | **green** | **yellow** (falls through) | gray     | yellow    |

`TrashPage` ternary: `OPEN ? green : CLOSED ? gray : yellow`. So a conversation that is
green on the Trash page is blue on Messages, and a RESOLVED conversation is green on
Messages but yellow in Trash. This is the same class of bug as the previously-fixed
CONFIRMED/ACTIVE inversion.

**Severity:** High (this is precisely the "different colours everywhere" complaint).
**Fix:** extract the `MessagesPage.tsx:26-32` map to `apps/admin/src/lib/statusColors.ts`
and import it in both. See F-12 for the wider consolidation.

## F-12 · Six duplicated copies of the booking status map (currently in sync — a landmine)

All six now agree (`PENDING` yellow / `CONFIRMED` blue / `ACTIVE` green / `COMPLETED` gray
/ `CANCELLED` red), so the previously-reported inversion **is fixed**. But the duplication
that caused it is untouched:

| File:line                                             | Form                                                   |
| ----------------------------------------------------- | ------------------------------------------------------ |
| `pages/BookingsPage.tsx:26-32`                        | `bg-*-100 text-*-800`                                  |
| `pages/DashboardHome.tsx:44-50`                       | `bg-*-100 text-*-800`                                  |
| `pages/CustomerProfilePage.tsx:61-67`                 | `bg-*-100 text-*-800`                                  |
| `components/vehicles/VehicleBookings.tsx:21-27`       | `bg-*-100 text-*-800`                                  |
| `pages/FleetManagement.tsx:405-421`                   | `switch` statement, same values                        |
| `components/customers/CustomerProfileModal.tsx:78-84` | dead file (F-13)                                       |
| `components/bookings/BookingDetailModal.tsx:68-74`    | dead file, **different shades** (`bg-*-50 text-*-700`) |

**Severity:** High (structural — guarantees the bug recurs).
**Fix:** create `apps/admin/src/lib/statusColors.ts` exporting `bookingStatusColors`,
`conversationStatusColors`, `vehicleStatusColors`, `documentStatusColors`,
`paymentStatusColors`. Replace all seven definitions with imports. Delete the two dead ones
along with their files (F-13).

## F-13 · 1,476 lines of dead component code

Verified unimported anywhere in `apps/admin/src` (grep for each name across all `.tsx`,
excluding self):

| File                                            | Lines | Referenced by |
| ----------------------------------------------- | ----- | ------------- |
| `components/bookings/BookingDetailModal.tsx`    | 511   | **nothing**   |
| `components/bookings/PaymentTrackingModal.tsx`  | 436   | **nothing**   |
| `components/customers/CustomerProfileModal.tsx` | 529   | **nothing**   |

These contain 8 of the dead buttons found in this audit, a divergent status colour map,
and a divergent payment status map. They are tree-shaken from the bundle so there is no
runtime cost — but they are a permanent source of grep noise and colour drift, and
`HelpPage.tsx:42` documents `PaymentTrackingModal` as a shipped feature (F-17).

**Severity:** High (maintenance).
**Fix:** delete all three files. If the payment-tracking UI is wanted, rebuild it against
`server/src/routes/payments.ts` (`GET /payments/:bookingId`, `POST /payments/:bookingId/refund`).

## F-14 · Settings → Company shows hardcoded data, not what is in the database

**File:** `apps/admin/src/pages/SettingsPage.tsx`

```
89   const [companyForm, setCompanyForm] = useState({
90     email: 'gemautosalesinc@gmail.com',
91     phone: '863-277-7879',
92     street: '1311 E CANAL ST',
93     city: 'Mulberry',
94     state: 'FL',
95     zipCode: '33860',
96   });
```

`api.company.get()` **is** called (lines 116-128) — but only `settings.logo` is read
(line 120). The rest of the response is discarded. So:

- The Company tab always shows the six hardcoded values, regardless of what is stored.
- Pressing **Save Changes** (line 986, `handleCompanySave` at 200-217) writes those
  hardcoded values back over whatever is in the DB.
- **Cancel** (lines 972-982) re-seeds the same hardcoded literals rather than re-fetching.
- The second copy of the same email is at **line 975**.

Also in this block — **Operating Hours** (`SettingsPage.tsx:940-969`): 7 rows of
uncontrolled `defaultValue` inputs. There is no `onChange`, no state, and
`handleCompanySave` never sends `businessHours`. Every edit is silently discarded on save.
(`CompanySettings.businessHours` exists in the type, `api.ts:540`.)

**Severity:** High (silent data loss + stale display).
**Fix:** populate `companyForm` from the `api.company.get()` response inside the existing
effect; make Operating Hours controlled state and include `businessHours` in the
`api.company.update()` payload; make Cancel re-fetch.

## F-15 · Schedule Maintenance discards everything the operator types

**File:** `apps/admin/src/pages/FleetManagement.tsx:313-333`

The modal (lines 865-925) collects `type` (one of 6 maintenance types, `maintenanceTypes`
at line 74), `scheduledDate` and `notes`. `handleScheduleMaintenance` then does exactly one
thing:

```
318   await api.vehicles.updateStatus(maintenanceVehicle.id, 'MAINTENANCE');
```

…and reports `toast.success('Maintenance scheduled successfully')`. No maintenance record is
created. A `MaintenanceRecord` model exists (it is a Trash entity type, `TrashPage.tsx:31`,
`server/src/routes/trash.ts` `prisma.maintenanceRecord`), but there is **no create endpoint**
in `server/src/routes/`. `HelpPage.tsx:52-58` documents this as a working scheduler.

**Severity:** High.
**Fix (short term):** strip the type/date/notes fields from the modal so it honestly reads
"Mark as under maintenance". **(Long term):** add `POST /api/vehicles/:id/maintenance` on the
server and wire it.

---

# CONFIRMED — Medium

## F-16 · Dead buttons and links (no handler, no href)

Every one of these renders as an interactive control and does nothing on click.

**Live pages:**

| File:line                              | Control                                                                                                             |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `components/layout/Header.tsx:246-255` | Global search input — no `onChange`/`onSubmit`; the `⌘K` kbd hint (253-255) has no key listener anywhere in the app |
| `components/layout/Header.tsx:558`     | User avatar / name button                                                                                           |
| `pages/DashboardHome.tsx:458-462`      | Revenue period `<select>` (This Week / Last Week / This Month) — no `onChange`                                      |
| `pages/DashboardHome.tsx:574`          | "View All" (Recent Activity)                                                                                        |
| `pages/CustomersPage.tsx:131`          | "Filters" button                                                                                                    |
| `pages/CustomerProfilePage.tsx:294`    | "Edit"                                                                                                              |
| `pages/CustomerProfilePage.tsx:298`    | "Email"                                                                                                             |
| `pages/MessagesPage.tsx:466`           | Archive conversation                                                                                                |
| `pages/MessagesPage.tsx:475`           | Conversation overflow menu (`MoreHorizontal`)                                                                       |
| `pages/SecurityPage.tsx:374`           | Copy TOTP secret                                                                                                    |
| `pages/SecurityPage.tsx:457`           | "Generate New Codes"                                                                                                |
| `pages/SettingsPage.tsx:1133`          | Copy API key                                                                                                        |
| `pages/SettingsPage.tsx:1143`          | "Regenerate Key"                                                                                                    |
| `pages/SettingsPage.tsx:1148`          | `href="#"` — "View API Documentation"                                                                               |
| `pages/HelpPage.tsx:90,95,101,103`     | All 4 quick links are `href: '#'`                                                                                   |
| `pages/HelpPage.tsx:282`               | "Start Chat"                                                                                                        |
| `pages/HelpPage.tsx:294`               | "Send Email"                                                                                                        |
| `pages/HelpPage.tsx:306`               | "Call Now"                                                                                                          |

**Dead-file pages** (delete with F-13): `BookingDetailModal.tsx:443,447,451,499`,
`CustomerProfileModal.tsx:170,174,424,427,489`, `UpgradePlanModal.tsx:204`.

**Severity:** Medium.
**Fix:** wire or remove. The API key block (`SettingsPage.tsx:1124-1152`) advertises a fake
key `gem_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` for an API-key feature that does not exist
server-side — delete the whole block. Same for the Help page contact card:
`support@gemauto.com` (line 293) and `+1 (800) GEM-AUTO` (line 305) are not real contacts
(the real domain is `gemrentalcars.com`).

## F-17 · Help page documents features that do not exist

`apps/admin/src/pages/HelpPage.tsx`

| FAQ | Line  | Claim                                                                    | Reality                                                                                                          |
| --- | ----- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| #2  | 40-44 | "click 'View Payments' … payment tracking modal … 'Refund' button"       | `PaymentTrackingModal` is never rendered (F-13). No refund UI exists.                                            |
| #4  | 52-58 | "three-dot menu → 'Schedule Maintenance' … status changes automatically" | Only the status change happens (F-15).                                                                           |
| #7  | 73-79 | "Click 'Extend Booking' and select the new end date"                     | No extend UI exists anywhere in the admin. `server/src/routes/extensions.ts` exists but is customer-facing only. |
| #8  | 80-86 | "click 'Enable Two-Factor Authentication' … scan the QR code"            | Fake (F-05).                                                                                                     |

**Severity:** Medium.
**Fix:** delete FAQs #2, #7, #8 and rewrite #4 until the features exist.

## F-18 · Navigation intents that go nowhere

- **Quick Actions** — `pages/DashboardHome.tsx:53-120` every action navigates with
  `{ state: { action: <id> } }` (dispatched at line 213). **No page in the app reads
  `location.state`** — grep for `useLocation` across `pages/` and `components/` returns only
  `Sidebar.tsx:1,68` (which uses it for `pathname` only). So:
  - "Add Vehicle" → lands on `/fleet`, no form opens.
  - "Add Customer" → lands on `/customers`, which has **no create flow at all**
    (`api.customers` has no `create` method, `api.ts:936-979`).
  - "Record Payment" → lands on `/bookings`, no payment modal.
  - "Maintenance" → lands on `/fleet`, no modal.
  - Same for the header "Quick Add" button, `DashboardHome.tsx:267-273`.
- **Customers → "View Bookings"** — `pages/CustomersPage.tsx:290` navigates to
  `/bookings?customerId=${id}`, but `BookingsPage.tsx` never calls `useSearchParams`
  (it imports only `Link` from react-router-dom, line 3). The filter is ignored.
- **Sidebar active state** — `components/layout/Sidebar.tsx:73` uses
  `location.pathname === item.href`, so on `/fleet/new`, `/fleet/:id` and `/customers/:id`
  **no** nav item is highlighted.

**Severity:** Medium.
**Fix:** read `location.state?.action` in `FleetManagement`/`BookingsPage` (both already
have the modals — `showMaintenanceModal`, `CreateBookingModal`); read `customerId` from
`useSearchParams` in `BookingsPage` and pass it to `api.bookings.list`; change the Sidebar
check to `location.pathname === item.href || location.pathname.startsWith(item.href + '/')`
(special-case `'/'`). Remove the "Add Customer" quick action until a create flow exists.

## F-19 · The 9 new tables have **zero** admin UI — nothing was broken, nothing is fixed

Grepping `apps/admin/src` for `favorite|loyalty|referral|promo|extension|abandon|passregistration|wallet`
returns exactly two irrelevant hits (`api.ts:728` `'PROMOTION'` notification enum,
`HelpPage.tsx:77` prose). **No admin page ever touched these tables**, so none of them were
broken before the tables were created, and none start working now.

What this _does_ expose is a management gap — the server already has admin-only endpoints
with no UI to drive them:

| Server route                                                                                       | Guard       | Admin UI |
| -------------------------------------------------------------------------------------------------- | ----------- | -------- |
| `GET/POST/PATCH/DELETE /api/promos` (`promos.ts:267,333,388,419`)                                  | `adminOnly` | **none** |
| `POST /api/loyalty/admin/award`, `/admin/deduct`, `GET /admin/user/:id` (`loyalty.ts:178,208,244`) | `adminOnly` | **none** |
| `GET /api/abandonment/...` (`abandonment.ts`)                                                      | —           | **none** |

So promo codes exist in the database and can be redeemed by customers, but the owner has no
way to create, list, disable or audit them.

**Severity:** Medium (feature gap, not a defect).
**Fix:** a "Promotions" page is the highest-value addition — the backend CRUD is already
there and guarded. Loyalty adjust could live on the Customer Profile page.

## F-20 · Role-gated endpoints with no role-gated UI

`Sidebar.tsx` renders every nav item for every role — it reads `user` (line 69) only for the
name/role footer, never to filter. But the server gates several of them tighter than
`staffOnly` (`server/src/middleware/auth.ts:136-142`: `adminOnly = ADMIN`,
`staffOnly = SUPPORT|MANAGER|ADMIN`), while `authStore.ts:33` admits `ADMIN|MANAGER|SUPPORT`:

| UI                                                        | Server guard                                                                                           | Result for SUPPORT / MANAGER            |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | --------------------------------------- |
| **Recycle Bin** nav item (`Sidebar.tsx:57`)               | `adminOnly` (`trash.ts:39,77,287,349,399`)                                                             | Page loads, every request 403s          |
| Settings → **Integrations** tab (`SettingsPage.tsx:47`)   | `authorize('ADMIN')` (`integrations.ts:11,64,120,303,335,370`)                                         | Toast: "Failed to load integrations"    |
| Settings → **Company** Save (`SettingsPage.tsx:986`)      | `PUT` is `authorize('ADMIN')` (`preferences.ts:175`) while `GET` allows SUPPORT (`preferences.ts:154`) | Form renders and is editable; Save 403s |
| Security → **Login History** (`SecurityPage.tsx:126-153`) | `/activity` allows SUPPORT (`activity.ts:9`) ✓                                                         | fine                                    |

**Severity:** Medium.
**Fix:** filter `Sidebar` nav and `SettingsPage` tabs on `user.role === 'ADMIN'` for those
three, or relax the server guards to `managerOnly` — but decide deliberately.

## F-21 · Contrast failures from the gold token

Measured (WCAG 2.1 relative luminance) from the tokens in `apps/admin/src/index.css:18-26`:

| Pairing                                                 | Ratio      | Verdict                            |
| ------------------------------------------------------- | ---------- | ---------------------------------- |
| `text-primary-ink` on `bg-white`                        | 4.77:1     | pass (barely)                      |
| **`text-primary-ink` on `bg-accent`**                   | **4.42:1** | **fail AA for normal text**        |
| **`text-accent-foreground` on `bg-accent`**             | **4.42:1** | **fail** (same two values)         |
| **`text-primary-ink` on `bg-gray-900`**                 | **3.72:1** | **fail**                           |
| **`hover:text-primary-dark` on `bg-white`**             | **3.74:1** | **fail on hover**                  |
| `text-primary-foreground` (navy) on `bg-primary` (gold) | 8.56:1     | pass — this is the correct pattern |
| `text-primary-foreground` on `bg-primary-dark`          | 4.81:1     | pass                               |

The `bg-accent` + gold-ink pairing is the most-used combination in the app — active tabs,
selected filters, badges, hover states. Instances (non-exhaustive):
`SettingsPage.tsx:373,725`, `SecurityPage.tsx:244`, `BookingsPage.tsx:305,482`,
`MessagesPage.tsx:323,461`, `HelpPage.tsx:213`, `FleetManagement.tsx:68,69,749`,
`Header.tsx:89,95,97,282,420`, plus every `hover:bg-accent` paired with
`hover:text-primary-ink` (`DashboardHome.tsx:509,574`, `AnalyticsPage.tsx:502,565,633`,
`FleetManagement.tsx:808,815,822`, `Header.tsx:266`).

The `bg-gray-900` case is `SettingsPage.tsx:1133` (deleting that block per F-16 resolves it).
The hover case is `Header.tsx:316,400` and `UpgradePlanModal.tsx:204`.

**Severity:** Medium.
**Fix:** darken `--accent-foreground` / `--primary-ink` from `42 73% 33%` to about
`42 73% 29%` (≈5.6:1 on `bg-accent`, ≈6.1:1 on white) in `apps/admin/src/index.css:24` and
`:20` — check `apps/web` uses the same token before changing, so the two apps don't diverge.
Replace `hover:text-primary-dark` with `hover:text-primary-ink` + `hover:underline`.

---

# CONFIRMED — Low

## F-22 · No-op hover classes (recolour-pass artifacts)

Base and hover resolve to the same colour, so the hover state is dead:

| File:line                                                                      |
| ------------------------------------------------------------------------------ |
| `pages/DashboardHome.tsx:509, 574` — `text-primary-ink hover:text-primary-ink` |
| `pages/AnalyticsPage.tsx:502, 565, 633` — same                                 |
| `pages/SettingsPage.tsx:688, 769, 1133, 1149` — same                           |

`pages/LoginPage.tsx:112` and `:122` — `from-accent to-accent … via-white`: the gradient
starts and ends on the same colour, an artifact of the orange→gold mapping. Renders as
accent→white→accent, which is probably not the intent.

**Fix:** drop the redundant `hover:text-*` classes; give the login gradient a real endpoint
(e.g. `from-accent via-white to-primary-light/30`).

## F-23 · Hardcoded fake activity feed on the production dashboard

`pages/DashboardHome.tsx:582-612` — the "Recent Activity" timeline is a hardcoded array of
five fabricated events with **fabricated customer names**: "Sarah Johnson – Toyota Camry",
"$360.00 – Michael Chen", "2024 BMW 5 Series – Emily Rodriguez", "New customer: James Wilson",
"2024 Ford Explorer – Oil change". Unlike the revenue chart (line 452, which at least carries
a `DEMO` badge), this block is **unlabelled** and reads as real data.

`/api/activity` is live and 401s correctly — real data is available.

**Fix:** wire it to `api.activity.list({ limit: 5 })` (already used by `SecurityPage.tsx:129`),
or delete the section. Also: `DashboardHome.tsx:122-131` mock revenue array and
`:167` `vehiclesInMaintenance: 0` (set to a constant and never displayed) are dead.

## F-24 · Miscellaneous

| File:line                                     | Issue                                                                                                                                                                                                                                                          | Fix                                                                                                                                            |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `pages/CustomerProfilePage.tsx:202-203`       | `// TODO: Implement customer deletion API endpoint` then `toast.error('not yet implemented')`. **The endpoint already exists** — `server/src/routes/customers.ts:397` `DELETE /:id` `adminOnly`. Only `api.customers.delete` is missing from `api.ts:936-979`. | Add the client method and wire it.                                                                                                             |
| `lib/api.ts:920-924`                          | `api.bookings.update` → `PUT /bookings/:id`. Live probe: **404** (server uses `PATCH`). Currently unused, so harmless — but it is a trap.                                                                                                                      | Change to `PATCH` or delete.                                                                                                                   |
| `pages/SettingsPage.tsx:45`                   | Billing tab commented out of `tabs`, and `'billing'` is not in `validTabs` (line 53) — but the whole tab body (628-782), the `mockInvoices` array (35-39), `fetchPaymentMethods` (131-147), and three modal components remain, unreachable.                    | Delete the block, `mockInvoices`, and `AddPaymentMethodModal` / `DeletePaymentMethodModal` / `UpgradePlanModal` if billing is permanently out. |
| `pages/DashboardHome.tsx:489`                 | `fill="#D4AF37"` raw hex in Recharts. `AnalyticsPage.tsx:36-44` does the same with 6 hexes. Recharts can't take Tailwind classes, but these will silently drift from `index.css`.                                                                              | Read the tokens once via `getComputedStyle(document.documentElement).getPropertyValue('--primary')` into a shared `chartColors` module.        |
| `pages/BookingsPage.tsx:244`                  | `text-gray-600` for the Completed count while the other four stat values use `text-gray-900`.                                                                                                                                                                  | Make it `text-gray-900`.                                                                                                                       |
| `pages/LoginPage.tsx:164`                     | Placeholder `admin@gemautorentals.com` — generic (no personal email, **confirmed clean**), but the live domain is `gemrentalcars.com`.                                                                                                                         | Cosmetic; align the domain.                                                                                                                    |
| `components/vehicles/VehicleForm.tsx:153-160` | `pendingFiles` is appended synchronously while `pendingPreviews` is appended from an async `FileReader.onloadend`. With multiple files selected at once, preview order can desync from file order, so `removePendingImage(index)` may delete the wrong file.   | Build both entries together in `onloadend`, or key previews by file identity.                                                                  |
| `components/layout/DashboardLayout.tsx:35`    | Badge poll every 30 s → 2 requests / 30 s / open tab, indefinitely, with no `visibilitychange` pause.                                                                                                                                                          | Pause when `document.hidden`.                                                                                                                  |
| `pages/SettingsPage.tsx:1091-1104`            | `api.integrations.disconnect(...)` and `connect(provider, {})` are called fire-and-forget — not awaited, no error handling, no refetch. `connect` sends an empty credentials object, which `integrations.ts:120` will reject.                                  | Await, toast on error, then `fetchIntegrations()`.                                                                                             |

---

# SUSPECTED (needs an authenticated session to confirm)

| #    | Suspicion                                                                                                                                                                                                                                                                                                                                  | Why                                                                                            | How to confirm                                                           |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| S-01 | `api.trash.list()` returns `{items, pagination}` via plain `request()` (`api.ts:1201-1204`), which unwraps `json.data`. `trash.ts:267-278` nests `{items, pagination}` **inside** `data`, so this happens to line up — but `TrashPage.tsx:65` then reads `response.items`. Should work; the other trash entity branches were not all read. | Only the `maintenance` branch of `trash.ts` was inspected.                                     | Log in as ADMIN, open Recycle Bin, click through all 8 entity tabs.      |
| S-02 | Settings → Profile "Save" calls `api.customers.update(user.id, {...})` → `PUT /customers/:id` (`customers.ts:218`). That route may reject `email` changes or require different field names.                                                                                                                                                | Route exists (401 confirmed) but the body schema was not read.                                 | Log in, change a phone number, confirm it persists after reload.         |
| S-03 | `MessagesPage` conversation list uses `unreadCount`/`lastMessage` fields that `conversations.ts:154-160` adds at runtime but that are **not** on the `Conversation` interface (`api.ts:691-709`). Any code reading them is untyped.                                                                                                        | Type-level gap; typecheck passes because the fields aren't referenced.                         | Log in, open Messages, check whether unread indicators render.           |
| S-04 | Sonner `<Toaster richColors />` (`App.tsx:301`) uses its own built-in red/green/amber palette, unrelated to the brand tokens. Every toast in the app therefore renders in colours the recolour pass never touched.                                                                                                                         | Confirmed by config, not visually verified (needs an authenticated action that fires a toast). | Log in, trigger a success and an error toast, compare against gold/navy. |

---

# Verified working (no action)

- **Server-side auth on every admin endpoint.** Unauthenticated probes, all 401
  (control: `/api/nonexistent-route-check` → 404, so 401 genuinely means "exists + guarded"):
  `/api/stats/{dashboard,revenue,fleet,bookings,customers}`, `/api/bookings`,
  `/api/customers`, `/api/documents`, `/api/conversations`, `/api/conversations/unread-count`,
  `/api/notifications`, `/api/notifications/unread-count`, `/api/notifications/read-all`,
  `/api/sessions`, `/api/activity`, `/api/activity/stats`, `/api/activity/actions`,
  `/api/settings/company`, `/api/integrations`, `/api/billing/payment-methods`,
  `/api/trash`, `/api/trash/empty`, `/api/vehicles/:id/status`, `/api/bookings/:id`,
  `/api/bookings/:id/cancel`, `/api/auth/change-password` (PUT).
  `/api/vehicles` is 200 by design (public catalogue).
  `/health` → `{"status":"ok","database":"connected","storage":"configured"}`.
- **Client-side route protection.** Browser: `https://admin.gemrentalcars.com/fleet`
  client-redirects to `/login` with no token. All SPA paths return 200 HTML (nginx fallback
  correct). `App.tsx:85-107` / `110-131` guard and public-route logic is sound _apart from_ F-06.
- **Console on the live login page: completely clean.** No errors, no warnings, no failed
  network requests — 7 requests, all 200. (`document.hidden === true` in the pane, so the
  clean result was cross-checked against `curl` and a direct DOM read.)
- **Hardcoded personal email on the login page: gone.** Not in
  `apps/admin/src/pages/LoginPage.tsx` and not in the deployed bundle. Remaining hardcoded
  emails are elsewhere: `SettingsPage.tsx:90,975` (F-14) and `HelpPage.tsx:293` (F-16).
- **Booking status colour map is now consistent** across all live definitions (F-12
  documents the remaining structural duplication, not a live inconsistency).
- **No raw `text-primary`** (gold-on-white, ~2.1:1) remains anywhere — the recolour pass
  cleared all 41 previous instances. Zero `orange-*` classes and zero `#FF871E` remain.
- **`pnpm --filter admin typecheck`** and **`lint --max-warnings 0`** both pass clean.

---

## Suggested order of work

1. **F-02, F-03** — two one-line `api.ts` edits; restores password change and the entire
   booking status workflow. Highest value per keystroke.
2. **F-04** — move one route block in `sessions.ts`.
3. **F-01** — the Add Vehicle silent failure.
4. **F-05, F-07** — delete the fake 2FA tab and the dark-mode toggle.
5. **F-06, F-08** — auth-store `else` branch + method-gated retries.
6. **F-09, F-10, F-14, F-15, F-23** — stop showing operators numbers and forms that lie.
7. **F-11, F-12** — extract `lib/statusColors.ts`; **F-13** delete the three dead modals.
8. **F-16 … F-22, F-24** — dead UI sweep, contrast token bump, cleanup.
