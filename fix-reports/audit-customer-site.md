---
title: Customer Site Audit (apps/web)
aliases: [Web Audit, Customer Site Audit]
tags: [audit, apps-web, customer-site, live-site]
created: 2026-08-02
description: Evidence-based read-only audit of the live customer-facing site at gemrentalcars.com — routes, dead links, dashboard auth, contrast, mobile, forms.
related:
  [
    '[[WEBSITE_AUDIT]]',
    '[[recolor-web-pages]]',
    '[[recolor-web-components]]',
    '[[contact-and-404]]',
    '[[stats-counter]]',
  ]
---

# Customer Site Audit — `apps/web`

**Scope:** customer-facing site only (`apps/web`). Admin app and backend excluded.
**Live site:** https://gemrentalcars.com (Vercel) · **API:** https://api.gemrentalcars.com
**Audited:** 2026-08-02, ~04:00–04:20 EDT · **Mode:** read-only, nothing modified.

## Read this first — two caveats

1. **The repo changed underneath this audit.** `apps/web/src/App.tsx` was modified at `04:12` (adding `/waitinglist` + `/waitinglist/thank-you`), and a Vercel deploy landed mid-session (chunk hashes rotated: `LoginPage-ZmsXD-0x.js` → `LoginPage-tY6eCe3g.js`). Another agent is editing `apps/web` concurrently. **Line numbers below may have drifted — grep the quoted string, don't trust the line number blindly.**
2. **Browser-pane artifacts were actively filtered out.** `document.hidden === true` in the pane, which freezes `requestAnimationFrame` and `IntersectionObserver`. Several apparent failures were disproved and are **not** reported as findings — see [Ruled Out](#ruled-out-verified-non-issues) so nobody re-reports them.

## Summary

| Severity | Count |
| -------- | ----- |
| Critical | 2     |
| High     | 6     |
| Medium   | 7     |
| Low      | 4     |

**All 21 findings below are CONFIRMED** (directly observed on the live site or in the shipped production bundle). There is a separate short [Suspected](#suspected-not-directly-observed) section for the two inferences I could not fully verify without login.

Route inventory and dashboard API health both came back **clean** — details in [What's working](#whats-working-verified).

---

# CRITICAL

## C1. "Demo Mode" payment bypass is live in production

- **Where:** `apps/web/src/components/booking/PaymentStep.tsx:267-281` (checkbox UI), `:78-92` (handler)
- **What's wrong:** The booking payment step renders a **"Demo Mode — Skip actual payment processing for testing"** checkbox with **no environment gating whatsoever**. `grep -n "import.meta.env\|DEV\|PROD" PaymentStep.tsx` returns **zero matches**. When ticked, `handleSubmit` calls `api.payments.demo(bookingId)` and then `onSubmit()` — completing a real booking with **no card charged**.
- **Evidence observed:**
  - Source has no env guard (grep returned nothing).
  - Present in the **live production chunk**: `curl https://gemrentalcars.com/assets/js/BookingPage-BaDx9qTc.js | grep "Skip actual payment processing for testing"` → **match**. Also matches `"Demo Mode"`.
  - Endpoint is live and auth-gated only: `POST https://api.gemrentalcars.com/api/payments/demo` → `401 {"success":false,"error":"No token provided"}`. So **any logged-in customer** can reach it.
- **Impact:** Any customer who creates an account can reserve a vehicle for free. This is a direct revenue-loss and fraud vector on a live site.
- **Suggested fix:** Gate the entire block behind `import.meta.env.DEV`, and independently reject `/payments/demo` in the backend when `NODE_ENV === 'production'` (belt and braces — do not rely on the client alone). Coordinate the server half with the backend agent.

```tsx
{
  import.meta.env.DEV && (
    <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3"> …Demo Mode… </div>
  );
}
```

Also guard the handler: `if (useDemoMode && import.meta.env.DEV) { … }`.

## C2. No auth guard on `/dashboard/*` — logged-out visitors see broken pages and fake ID documents

- **Where:** `apps/web/src/components/dashboard/DashboardLayout.tsx` (whole component; route wiring in `App.tsx:69-78`)
- **What's wrong:** `DashboardLayout` never checks authentication. It imports `useAuthStore` only for `{ user, logout }` and has **no** `isAuthenticated` check and **no** `<Navigate to="/login" />`. There is no `ProtectedRoute`/`RequireAuth` component anywhere in `apps/web`. It even papers over the missing user with `const displayUser = user || { firstName: 'User', … }` (line ~120).
- **Evidence observed (logged out, live site, real page loads):**
  - `https://gemrentalcars.com/dashboard/favorites` → entire page body is **`"No token provided | Try Again"`** (28 characters). Raw API error string shown as the UI. No header, no footer, no redirect.
  - `https://gemrentalcars.com/dashboard/documents` → renders **fabricated identity documents** to an anonymous visitor: `"Driver's License | Uploaded Jan 14, 2025 • Expires May 19, 2028 | Verified"` and `"Passport | Uploaded Jan 9, 2026 • Expires Aug 14, 2030 | Pending"`.
  - Contrast: `/booking` **does** guard correctly (`BookingPage.tsx:129`) and redirected to `/login?returnUrl=%2Fbooking%3F`. The dashboard simply lacks the equivalent.
- **Impact:** Every dashboard URL is a broken or misleading experience when logged out. The documents page in particular displays "Verified" government-ID records to anyone with the URL, which looks like a data leak to a user even though the data is mock (see H1).
- **Suggested fix:** Add a guard at the top of `DashboardLayout`, mirroring `BookingPage.tsx:129`:

```tsx
const { user, logout, isAuthenticated, isInitialized } = useAuthStore();
if (!isInitialized) return <PageLoader />;
if (!isAuthenticated)
  return <Navigate to={`/login?returnUrl=${encodeURIComponent(location.pathname)}`} replace />;
```

Separately, never render a raw API `error` string as page content — wrap dashboard children in an error boundary with a friendly message.

---

# HIGH

## H1. `DocumentsPage` is 100% mock data with non-functional actions

- **Where:** `apps/web/src/pages/dashboard/DocumentsPage.tsx:29` (`const mockDocuments: Document[] = [...]`), `:94` (`const [documents] = useState<Document[]>(mockDocuments);`)
- **What's wrong:** The page has **no API calls at all** (it's the only dashboard page that imports neither `api` nor a store). State is initialised from `mockDocuments` and destructured **without a setter**, so Upload/View/Delete can never change anything.
- **Evidence observed:** Rendered live (see C2) showing two fake documents with fabricated upload/expiry dates and a green "Verified" badge. `grep "api\." DocumentsPage.tsx` → no matches.
- **Impact:** A customer who uploads their licence sees nothing happen; a customer who already uploaded one sees someone else's fictional record marked Verified. Also blocks the real booking requirement ("please upload a valid driver's license").
- **Suggested fix:** Wire to the real documents endpoints (confirm the contract with the backend agent), or — if the backend isn't ready — replace the whole page with an honest empty state and hide the sidebar entry until it is. Do not ship mock records as real ones.

## H2. Fabricated 4.5-star rating on every vehicle

- **Where:** `apps/web/src/pages/VehiclesPage.tsx:57` — `averageRating: v.averageRating || 4.5,`
- **What's wrong:** Any vehicle with no reviews is silently given a **4.5-star rating**.
- **Evidence observed:** `/vehicles` renders "4.5" against **all 8** vehicles. The corresponding detail page for the same vehicle (`/vehicles/cmklsanx40007gag5hfv99f4c`) says **"(0 reviews)"** and **"No reviews yet — Be the first to review this vehicle after your rental!"**. The API confirms no ratings: `GET /api/stats/public` → `"averageRating": null`.
- **Impact:** Invented social proof, directly contradicted by the site's own detail pages. Same class of problem as the "10,000+ customers" claim that was already fixed in `Statistics.tsx` — this one was missed.
- **Suggested fix:** Drop the `|| 4.5` fallback and render the rating conditionally, matching the honest pattern already used in `Statistics.tsx:78` (which filters out unbacked metrics):

```ts
averageRating: v.averageRating ?? null,
// …and in VehicleCard, render the stars block only when averageRating != null
```

## H3. Signup requires agreeing to Terms & Privacy pages that 404

- **Where:** `apps/web/src/pages/auth/RegisterPage.tsx:383` (`to="/terms"`), `:387` (`to="/privacy"`); same pair in `apps/web/src/components/booking/CustomerInfoStep.tsx:208, :212`
- **What's wrong:** The registration checkbox reads _"I agree to the Terms of Service and Privacy Policy"_, and both links lead to the 404 page.
- **Evidence observed:** `/signup` renders the checkbox text live. `/terms` and `/privacy` both render **"404 — This Page Took a Wrong Turn"** (verified by real page load, and independently by dumping the live router table — see M1).
- **Impact:** Legal/compliance exposure: users are asked to accept an agreement that does not exist, and the same dead links sit inside the checkout flow (`CustomerInfoStep`).
- **Suggested fix:** Highest-value item in the dead-link cluster — publish real `/terms` and `/privacy` pages and register the routes. Until they exist, the signup consent text is not defensible.

## H4. Google and GitHub login buttons are completely dead

- **Where:** `apps/web/src/pages/auth/LoginPage.tsx:~326-355`
- **What's wrong:** Both are bare `<button className="…">` elements with **no `onClick`, no handler, no OAuth call**. `grep -nE "Google|GitHub|oauth|signInWith" LoginPage.tsx` returns **only the two label lines (347, 353)** — there is no supporting logic anywhere in the file.
- **Evidence observed:** Live `/login` renders "Or continue with | Google | GitHub". Source confirms the buttons contain only an SVG and a text label.
- **Impact:** Two prominent buttons on the login page do nothing when clicked. (They also lack `type="button"`.)
- **Suggested fix:** Remove both buttons and the "Or continue with" divider until OAuth is actually implemented. If keeping them, add `type="button"` and wire them to a real provider flow.

## H5. Homepage hero video is hotlinked from an unrelated third-party website

- **Where:** `apps/web/src/components/home/HeroSection.tsx:19-22`
- **What's wrong:** The full-screen hero background video is loaded straight from **`https://www.extendas.com/content/uploads/2025/09/heroe-1.mp4`** — a file on a third party's server (Extendas, a retail-software company). The code even says so: `{/* Placeholder URL - Replace with licensed video */}`.
- **Evidence observed:**
  - Live DOM: `document.querySelector('video source').src` → the extendas.com URL; `readyState: 4`, `videoWidth: 1920`.
  - `curl -I` → `200`, `content-type: video/mp4`, **`content-length: 7784143`** (7.8 MB), served by their LiteSpeed host.
- **Impact:** Three problems at once — (a) no licence to use this footage, (b) bandwidth theft from a third party who can change or remove the file at any moment, breaking the homepage, (c) **7.8 MB downloaded on every homepage visit**, which is punishing on mobile data and hurts LCP.
- **Suggested fix:** Replace with owned/licensed footage, compress it (target < 2 MB, H.264 + WebM), self-host it in `apps/web/public/`, and add `poster={…}` plus `preload="metadata"` so the first paint doesn't wait on the video.

## H6. Placeholder phone number displayed on every vehicle detail page

- **Where:** `apps/web/src/pages/VehicleDetailPage.tsx:611` (`href="tel:+1234567890"`), `:614` (display text)
- **What's wrong:** The "Need Help? — Call our expert support team" card shows the fictional number **`+1 (555) 123-4567`** linked to **`tel:+1234567890`**. Both the visible text and the dial target are placeholders.
- **Evidence observed:** Live on `/vehicles/cmklsanx40007gag5hfv99f4c`: the page's only `tel:` link is `{href: "tel:+1234567890", txt: "+1 (555) 123-4567"}`, rendered and visible (162px wide).
- **Impact:** This sits on the primary conversion page, in the support-contact slot. A customer with a pre-booking question dials a dead number.
- **Suggested fix:** Use the real number from `ContactPage.tsx:9` — `863-277-7879`. Better: lift `CONTACT_EMAIL`/`PRIMARY_PHONE`/`SECONDARY_PHONE` out of `ContactPage.tsx:8-10` into a shared `lib/contact.ts` constant and import everywhere, so this can't drift again (see M5).

---

# MEDIUM

## M1. Eleven dead internal links

All confirmed twice: (a) by dumping the **live** router table out of the production bundle (`curl .../assets/js/index-ExRlgpKh.js | grep -oE 'path:"[^"]*"'`), which contains **no** entry for any target below; and (b) by loading `/terms` in the browser and observing the 404 page. Server returns HTTP 200 for all of them (Vercel SPA rewrite in `vercel.json`), so these are **soft 404s** — invisible to uptime checks.

| #   | File:line                                               | Target                              | Notes                                                                 |
| --- | ------------------------------------------------------- | ----------------------------------- | --------------------------------------------------------------------- |
| 1   | `components/layout/Footer.tsx:8`                        | `/pricing`                          | footer "Pricing"                                                      |
| 2   | `components/layout/Footer.tsx:9`                        | `/locations`                        | footer "Locations"                                                    |
| 3   | `components/layout/Footer.tsx:13`                       | `/careers`                          | footer "Careers"                                                      |
| 4   | `components/layout/Footer.tsx:14`                       | `/blog`                             | footer "Blog"                                                         |
| 5   | `components/layout/Footer.tsx:15`                       | `/press`                            | footer "Press"                                                        |
| 6   | `components/layout/Footer.tsx:18`                       | `/help`                             | footer "Help Center"                                                  |
| 7   | `components/layout/Footer.tsx:21`                       | `/terms`                            | also `RegisterPage.tsx:383`, `CustomerInfoStep.tsx:208` — see **H3**  |
| 8   | `components/layout/Footer.tsx:22`                       | `/privacy`                          | also `RegisterPage.tsx:387`, `CustomerInfoStep.tsx:212` — see **H3**  |
| 9   | `components/dashboard/DashboardLayout.tsx:~60` + `:251` | `/dashboard/settings`, `/help`      | sidebar "Settings" entry and a "Help" link                            |
| 10  | `pages/dashboard/MyBookingsPage.tsx:346`                | `/vehicles/${vehicle.id}/book`      | **no such route** — real route is `/booking`. "Book again" is broken. |
| 11  | `pages/dashboard/MyBookingsPage.tsx:356`                | `/dashboard/bookings/${booking.id}` | **no such route** — booking detail view doesn't exist.                |

**Suggested fix:** Split by intent — (a) publish `/terms` + `/privacy` (H3, legal); (b) delete the marketing links that have no page (`/pricing`, `/locations`, `/careers`, `/blog`, `/press`) rather than shipping a footer of 404s; (c) fix #10 to point at `/booking?vehicleId=${vehicle.id}` and either build the booking-detail route or remove #11's link; (d) remove the `/dashboard/settings` sidebar entry and the `/help` link.

> Note: `/#how-it-works` and `/#faq` (`Footer.tsx:7, :20`) are `<Link to>` hash targets, which react-router treats as a path, not an anchor scroll. They land on `/` but will **not** scroll to the section. Minor; folded in here rather than listed separately.

## M2. Gold-on-white contrast failures (WCAG AA)

Measured on the **live** homepage by computing actual `getComputedStyle` colour ratios against each element's effective background — not inferred from class names.

| File:line                                 | Element                  | Measured   | Required |
| ----------------------------------------- | ------------------------ | ---------- | -------- |
| `components/home/FeaturedVehicles.tsx:81` | "Our Fleet" badge        | **2.10:1** | 4.5:1    |
| `components/home/HowItWorks.tsx:47`       | "Simple Process" badge   | **2.01:1** | 4.5:1    |
| `components/home/WhyChooseUs.tsx:58`      | "Why Us" badge           | **2.10:1** | 4.5:1    |
| `components/home/Testimonials.tsx:66`     | "Testimonials" badge     | **2.01:1** | 4.5:1    |
| `components/home/FAQ.tsx:113`             | "FAQ" badge              | **2.10:1** | 4.5:1    |
| `components/home/FAQ.tsx:69`              | open FAQ question (18px) | **2.10:1** | 4.5:1    |

All six are the same root cause: `text-primary` (gold `rgb(212,175,53)`) on white/`gray-50`. The shared badge pattern is `className="bg-primary/10 text-primary …"`.

**Suggested fix:** Swap `text-primary` → `text-primary-ink` in these six spots (that's exactly what `--primary-ink` exists for — see the comment in `index.css:12-14`). `text-primary-ink` is `hsl(42 73% 33%)`, which clears 4.5:1 on white.

Two hover-state variants share the cause and should be fixed in the same pass: `FeaturedVehicles.tsx:139` and `WhyChooseUs.tsx:86` both use `group-hover:text-primary` on `text-gray-900` headings over white, and `FAQ.tsx:69` also has `group-hover:text-primary`.

**Not a finding:** `text-primary` in `HeroSection.tsx`, `Footer.tsx`, `Header.tsx`, `CTASection.tsx` — those sit on dark backgrounds and pass. See [Ruled Out](#ruled-out-verified-non-issues).

## M3. Horizontal overflow at 375px from the testimonial carousel

- **Where:** `apps/web/src/components/home/Testimonials.tsx:80` — `<div className="relative">`
- **What's wrong:** This wrapper holds an `AnimatePresence`/`motion.div` slide that animates on the X axis (`transform: translateX(50px)` on enter), but the wrapper is **`overflow: visible`**. The translated slide is not clipped, so it widens the document.
- **Evidence observed:** At 375×812, `document.documentElement.scrollWidth = 409` vs `clientWidth = 375` → **34px of horizontal overflow**. Walking the tree for unclipped overflowing elements returned the testimonial card (`right: 409`) as the source; `getComputedStyle(wrapper).overflow` → **`"visible"`**.
- **Honest caveat:** the pane's frozen `rAF` left the slide parked mid-animation, so the overflow I measured was _persistent_ where a real user would see it **transiently during each carousel transition** (auto-rotate + dot clicks). The missing `overflow-hidden` is a real structural defect either way; the severity is "jitter on every slide change", not "permanently broken".
- **Suggested fix:** `<div className="relative overflow-hidden">` at line 80. Consider `overflow-x-hidden` on the section as a safety net.

## M4. `.env.production` points at a dead Render host

- **Where:** `apps/web/.env.production:6` — `VITE_API_URL=https://gem-auto-rentals-server.onrender.com`
- **Evidence observed:** That host is **dead** — `curl --max-time 15 https://gem-auto-rentals-server.onrender.com/api/vehicles` → exit 28 (timeout), status `000`. The live site is fine because Vercel's dashboard env var overrides the file: the deployed bundle contains `https://api.gemrentalcars.com` and **no** `onrender.com` string.
- **Impact:** Not breaking production today, but anyone running `vite build --mode production` locally, or any deploy path that reads the file instead of the dashboard, produces a bundle pointed at a dead API. It's a live landmine.
- **Suggested fix:** Update the file to `https://api.gemrentalcars.com` so file and dashboard agree.

## M5. Three different phone numbers across the site

- **Evidence observed:** `ContactPage.tsx:9` + `Footer.tsx:53` → **863-277-7879** (and `:10` → 863-279-2907, both rendered live on `/contact`). `CTASection.tsx:38-42` → **813-422-4539** (`tel:+18134224539`), a different area code, rendered on the homepage CTA. `VehicleDetailPage.tsx:611` → placeholder (**H6**).
- **Impact:** The homepage CTA and the contact page give customers different numbers; at most one is right.
- **Suggested fix:** Single source of truth — `lib/contact.ts` exporting `PRIMARY_PHONE`, `SECONDARY_PHONE`, `CONTACT_EMAIL`, `ADDRESS`; import in `Footer`, `CTASection`, `ContactPage`, `VehicleDetailPage`. Confirm with the owner which number is correct first.

## M6. Contact form has no validation and can send an empty email

- **Where:** `apps/web/src/pages/ContactPage.tsx:32-46`
- **What's wrong:** The mailto hand-off is a deliberate, documented design choice (the code comment at `:29-31` explains there's no public submission endpoint — that's fine and honest). The gap is that **no field is validated or required**: live DOM shows all five inputs with `required: false`, and `handleSubmit` has no guard. Submitting an empty form opens the user's mail client with an empty body and subject "Website enquiry".
- **Evidence observed:** Live `/contact` field dump — `contact-name`, `contact-email`, `contact-subject`, `contact-message` all `required: false`; handler goes straight to building the `mailto:` string.
- **Suggested fix:** Add `required` to name/email/message and an early return in `handleSubmit` if `message.trim()` is empty. The project already has `lib/validations/` (zod) if you want consistency with the auth forms.

## M7. Orange brand leftovers in the Tailwind config

- **Where:** `apps/web/tailwind.config.ts:119-120`

```ts
'hero-gradient': 'linear-gradient(135deg, #FF871E 0%, #F59E0B 100%)',
'cta-gradient':  'linear-gradient(to right, #FF871E 0%, #F59E0B 100%)',
```

- **Evidence observed:** These are the **only** surviving orange hex values in `apps/web` (a recursive grep for `#FF871E|#F59E0B|#FB923C|#F97316|#EA580C|orange-[0-9]` across `src/` returned **nothing**). Neither utility is referenced anywhere: `grep -rn "hero-gradient\|cta-gradient" src/ packages/ui/src` → no matches.
- **Impact:** Dead config, but it's a loaded gun — the next person to reach for `bg-hero-gradient` silently reintroduces the old orange brand.
- **Suggested fix:** Delete both lines, or restyle them to the gold/navy palette using the CSS vars.

---

# LOW

## L1. `/auth/forgot-password` silently redirects to the login page

- **Where:** `App.tsx:66` (`<Route path="/auth/*" element={<Navigate to="/login" replace />} />`) vs `pages/auth/ResetPasswordPage.tsx:101` (`to="/auth/forgot-password"`).
- **Evidence observed:** Navigating to `/auth/forgot-password` renders the login page ("Welcome back") — the catch-all swallows it. The real route is `/forgot-password`.
- **Fix:** Change `ResetPasswordPage.tsx:101` to `to="/forgot-password"`. (`:111, :280, :295` use `/auth/login`, which redirects to `/login` correctly enough, but are worth normalising in the same pass.)

## L2. Dead `createPaymentIntent` helper with a broken relative URL

- **Where:** `apps/web/src/lib/stripe.ts:16-70` — `fetch('/api/payments/create-intent')` and `fetch('/api/payments/confirm')`.
- **Evidence observed:** `grep -rn "createPaymentIntent" src/` matches **only its own definition** — it is never called (the live flow correctly uses `api.payments.createIntent`). Both fetches use a **relative** `/api/...` path, which on gemrentalcars.com hits the Vercel SPA rewrite and returns `index.html`, not the API.
- **Fix:** Delete the two dead functions. If kept, route them through `API_BASE_URL` from `lib/api.ts:5`.

## L3. Social links point at bare platform homepages

- **Where:** `components/layout/Footer.tsx:27-30` — `https://facebook.com`, `https://twitter.com`, `https://instagram.com`, `https://linkedin.com`.
- **Fix:** Point to the real company profiles, or remove the icons until they exist.

## L4. `returnUrl` carries a stray trailing `?`

- **Evidence observed:** Visiting `/booking` logged out redirects to `/login?returnUrl=%2Fbooking%3F` — the encoded value is `/booking?` with an empty query string.
- **Where:** `pages/BookingPage.tsx:129-133`.
- **Fix:** Only append `?${searchParams}` when `searchParams.toString()` is non-empty. Cosmetic.

---

# SUSPECTED (not directly observed)

Both need an authenticated session to confirm; I could not log in.

- **S1 — `MyBookingsPage` "Book again" and booking-detail links are dead ends (likely High once logged in).** The targets `/vehicles/:id/book` and `/dashboard/bookings/:id` are confirmed absent from the live router table (M1 #10/#11), so they _will_ 404 — but I could not observe the buttons rendering, so I can't confirm they're reachable in practice or how prominent they are.
- **S2 — Stripe card payment may fail even with Demo Mode off.** The live publishable key **is** present and is a **live** key (`pk_live_51QIGpLFHr…` in `assets/js/stripe-u2QDPOjJ.js`), so the front end is configured — this contradicts the "Stripe unconfigured" note in the brief, at least on the client side. Whether the **backend** has a matching secret key is out of my lane; flagging for the backend agent to confirm, since C1's demo bypass may be masking a broken real payment path.

---

# What's working (verified)

Recording these so they don't get re-audited.

- **Every route in `App.tsx` renders real content.** Checked live with real page loads: `/`, `/vehicles`, `/vehicles/:id`, `/about`, `/contact`, `/login`, `/signup`, `/waitinglist`, `/waitinglist/thank-you`, `/booking` (correctly redirects to login), `/booking/confirmation` (graceful "No booking found"), and the 404 catch-all. **No route returned a blank 200.**
- **The 9 new database tables fixed the dashboard backends.** Every endpoint the dashboard pages call returns a clean **401**, not a 500:
  `/api/favorites`, `/api/favorites/ids`, `/api/bookings/my`, `/api/customers/profile`, `/api/billing/payment-methods`, `/api/invoices/my`, `/api/loyalty/account`, `/api/loyalty/history`, `/api/referrals/my-code`, `/api/referrals/history` → all `401 {"success":false,"error":"No token provided"}`. `/api/loyalty/tier-info` returns `200` with static tier data (correctly public). **Favorites / Loyalty / Referrals are fixed at the API layer** — their remaining problem is C2 (no auth guard), not missing tables.
- **The "10,000+ Customers" claim is fixed.** `Statistics.tsx:57-80` now pulls `/api/stats/public` and explicitly filters out unbacked metrics (`items.filter(item => item.value > 0)`), with a comment stating placeholder numbers are never seeded. Live API returns real figures: `totalCustomers: 6, totalRentals: 0, averageRating: null, yearsInBusiness: 8, vehicleCount: 8`. Honest. **Do not re-report this.**
- **No `text-white` on `bg-primary` anywhere.** The gold/navy recolour was applied correctly — a regex sweep for that combination returned **zero** matches, and `text-primary-foreground` is used correctly across 36 files.
- **`/vehicles` has zero contrast failures** (full computed-contrast sweep returned an empty list).
- **No console errors and no failed network requests** on any public page — every asset request returned 200/304.
- **Login and register forms validate properly** (`LoginPage.tsx:100-117`, `RegisterPage.tsx:101-130` — per-field required checks with error state) and post to the real API via `api.auth.login` / `api.auth.register`.
- **`/booking` auth guard works** (`BookingPage.tsx:129`) — the pattern C2 should copy.
- **Mobile tap targets** are acceptable apart from the carousel dots (10×10px, `Testimonials.tsx:~137`) — worth bumping to a 44px hit area, but they're supplementary controls with working prev/next, so not listed as a finding.

---

# Ruled out (verified non-issues)

Each of these looked like a bug and was **disproved**. Listing them so no one burns time re-finding them.

| Apparent issue                                                                    | Why it's not real                                                                                                                                                                                |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Gold "Dream" in the hero heading measured 2.1:1 on white                          | The hero has `bg-black/40` overlay + video (`HeroSection.tsx:10`). Contrast script couldn't see the video-backed ancestor. Gold on the dark overlay is fine.                                     |
| Hero body text measured white-on-white (1:1)                                      | Same cause — text sits above the `bg-black/40` overlay, not on white.                                                                                                                            |
| `/vehicles` images appeared broken (`src=""`, `naturalWidth: 0`)                  | `document.hidden === true` disables `IntersectionObserver`, so `LazyImage` never swaps in the real `src`. Real vehicle data renders correctly (8 vehicles, names/prices/categories all present). |
| `gemrentalcars.com/terms` appeared to redirect to `admin.gemrentalcars.com/login` | Browser-pane tab-switching artifact. `curl -sL` shows **0 redirects**, final URL `https://gemrentalcars.com/terms`, status 200.                                                                  |
| `/waitinglist` appeared to 404                                                    | Artifact of testing via `history.pushState` + synthetic `popstate`. A **real page load** renders it correctly ("COMING SOON — Be first in line when the keys drop.").                            |
| `/signup` and `/booking` appeared to render blank (0 chars)                       | Same `pushState` artifact. Both render correctly on real page loads.                                                                                                                             |
| Vehicle images are Unsplash stock URLs                                            | True, but that's backend/seed data (`/api/vehicles` returns the Unsplash URLs) — out of `apps/web` scope. Flagging for the backend agent only.                                                   |

**Methodology note for whoever tests next:** verify anything suspicious with a **real `navigate`** or `curl`, never with `history.pushState`, and never trust lazy-loaded/animated state in the pane.

---

# Suggested fix order

1. **C1** — kill the Demo Mode payment bypass (live revenue loss, one-line guard).
2. **C2** — add the `/dashboard/*` auth guard (also stops the fake-ID page being publicly readable).
3. **H3 + M1** — publish `/terms` and `/privacy`, then clear the rest of the dead links.
4. **H1, H2, H6** — remove fabricated content: mock documents, the invented 4.5 rating, the 555 phone number.
5. **H4, H5** — remove dead OAuth buttons; replace the hotlinked 7.8 MB video.
6. **M2, M3** — contrast (`text-primary` → `text-primary-ink` ×6+2) and the mobile overflow one-liner.
7. **M4–M7, L1–L4** — config, consistency, and cleanup.
