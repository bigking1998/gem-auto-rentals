---
title: Contact Page & 404 Catch-All Fix
aliases: [contact-and-404, Contact Page Fix, 404 Page Fix]
tags: [fix-report, web, routing, contact, 404]
created: 2026-07-25
description: Adds a real /contact page and a customer-facing 404 catch-all route to apps/web, replacing the previously blank /contact page.
related:
  - '[[WEBSITE_AUDIT]]'
  - '[[BUGFIX_CHECKLIST]]'
---

# Contact Page & 404 Catch-All Fix

## Summary

`/contact` was linked from the footer but had no route and no catch-all, so it rendered a
completely blank body. Both are now fixed: a real Contact page exists, and any unmatched URL
renders a friendly 404 page instead of nothing.

## Files Created

| File                                  | Purpose                                                                             |
| ------------------------------------- | ----------------------------------------------------------------------------------- |
| `apps/web/src/pages/ContactPage.tsx`  | Real contact page — contact details, operating hours, and a `mailto:` hand-off form |
| `apps/web/src/pages/NotFoundPage.tsx` | Customer-facing 404 with links to Home, Vehicles, and Contact                       |

## Files Changed

| File                   | Change                                                                                                                                                                                                                            |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web/src/App.tsx` | Added two `lazy()` imports (`ContactPage`, `NotFoundPage`) matching the existing lazy-loading style; added `<Route path="/contact" …>` next to `/about`; added `<Route path="*" element={<NotFoundPage />} />` as the final route |

Nothing else was touched. `Footer.tsx` and `CTASection.tsx` were read but **not modified** —
the footer already pointed at `/contact` correctly, and the bug was the missing route, not the
link. (See [[#Unresolved / For the owner]] for a note about `CTASection.tsx`.)

## Contact details — reused vs. omitted

### Reused (all found in the codebase, nothing invented)

| Detail          | Value                                                                              | Source file(s)                                                                                                                                                                       |
| --------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Primary phone   | `863-277-7879`                                                                     | `apps/web/src/components/layout/Footer.tsx:53`, `apps/web/src/components/StructuredData.tsx:195`, `apps/web/src/pages/AboutPage.tsx:145`, `apps/admin/src/pages/SettingsPage.tsx:91` |
| Secondary phone | `863-279-2907`                                                                     | `apps/web/src/pages/AboutPage.tsx:145`                                                                                                                                               |
| Email           | `gemautosalesinc@gmail.com`                                                        | `apps/web/src/components/layout/Footer.tsx:57`, `apps/web/src/components/StructuredData.tsx:196`, `apps/web/src/pages/AboutPage.tsx:154`, `apps/admin/src/pages/SettingsPage.tsx:90` |
| Address         | `1311 E CANAL ST, MULBERRY, FL 33860`                                              | `apps/web/src/components/layout/Footer.tsx:61`, `apps/web/src/pages/AboutPage.tsx:136`, `apps/web/src/components/StructuredData.tsx:198-202`                                         |
| Operating hours | Mon 10:00–18:00, Tue 10:00–12:30, Wed–Fri 10:00–18:00, Sat 11:00–15:00, Sun Closed | `apps/web/src/pages/AboutPage.tsx:94-123`                                                                                                                                            |

### Deliberately omitted — no real data exists in the codebase

| Omitted                                                           | Why                                                                                                                                                                                                                                                                                  |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Social media links**                                            | `Footer.tsx:26-31` uses bare placeholders (`https://facebook.com`, `https://twitter.com`, …). `StructuredData.tsx:204-207` has `facebook.com/gemautorentals` and `instagram.com/gemautorentals`, but the two sources disagree and neither looks verified. Omitted rather than guess. |
| **Map / embedded location**                                       | The only coordinates in the repo are `latitude: 27.8953, longitude: -81.9756` (`StructuredData.tsx`), which is the geographic centre of Florida — clearly a placeholder, not the lot. No map embedded.                                                                               |
| **Fax number, WhatsApp, live chat, after-hours / emergency line** | No such value appears anywhere in the repo.                                                                                                                                                                                                                                          |
| **Per-department contacts** (sales vs. rentals vs. service)       | Only one shared inbox and two shared phone numbers exist.                                                                                                                                                                                                                            |
| **Response-time SLA**                                             | The page says "we typically respond… the same business day", which is a soft statement, not an invented guarantee. Flagging it anyway in case the owner wants it removed or changed.                                                                                                 |

### Contact data source notes

- `server/prisma/schema.prisma:659` defines a `CompanySettings` model, but **`server/prisma/seed.ts` never seeds it** — the seed only creates an admin user and a test customer (`customer@example.com`, `+1 (555) 123-4567`, both obvious test fixtures). So there is no database-backed source of truth for company contact info; every real value above is hard-coded in the frontend.
- **Hours conflict found (pre-existing, not introduced here):** `AboutPage.tsx` lists Mon 10–6 / Tue 10–12:30 / Sat 11–3, while the `OrganizationSchema` JSON-LD in `StructuredData.tsx:65-77` publishes Mon–Fri 08:00–18:00 and Sat 09:00–17:00 to search engines. These cannot both be right. I followed `AboutPage.tsx` (more specific, customer-facing, day-by-day). **The owner should reconcile these — the structured data is what Google shows.**

## Form decision: `mailto:` hand-off, no fake POST

**Finding:** there is **no public message-submission endpoint.** I enumerated every route in
`server/src/routes/` and every mount in `server/src/index.ts:159-200`. There is no
`/api/contact`, no `/api/messages`, no `/api/inquiries`. The closest thing is
`server/src/routes/conversations.ts`, and **every single one of its 10 handlers is gated
behind `authenticate` + `authorize('ADMIN','MANAGER','SUPPORT')`** — it is an internal
admin-side inbox, unusable by an anonymous website visitor.

**Decision — option (b): a form that composes a `mailto:` link.**

- On submit, `handleSubmit` builds `mailto:gemautosalesinc@gmail.com?subject=…&body=…` (with the
  visitor's name and email appended to the body) and sets `window.location.href` to it.
- The helper text above the form states plainly: _"Fill this in and we will open a pre-filled
  email in your own mail app addressed to gemautosalesinc@gmail.com. Nothing is sent until you
  press send in your mail app."_
- The button is labelled **"Open in My Email App"**, not "Send".
- There is **no** `fetch`/`axios` call, **no** success toast, and **no** "thanks, we got your
  message" state. Nothing can silently fail because nothing is submitted anywhere.
- A source comment in `ContactPage.tsx` records why, so a future dev does not wire it to a
  non-existent endpoint.
- Plain-text phone/email/address are also shown as `tel:`/`mailto:` links independent of the
  form, so the page is fully useful even if the visitor has no mail client configured.

## Verification

### 1. `pnpm --filter web typecheck` — PASS

```
> web@0.1.0 typecheck
> tsc --noEmit
```

Clean, no output, exit 0.

### 2. Lint — PASS for my files

My three files, run with the exact project lint flags:

```
npx eslint src/pages/ContactPage.tsx src/pages/NotFoundPage.tsx src/App.tsx \
  --ext ts,tsx --report-unused-disable-directives --max-warnings 0
→ EXIT=0   (0 errors, 0 warnings)
```

The **full** `pnpm --filter web lint` currently **fails**, but _not because of my changes_:

```
apps/web/src/components/home/Statistics.tsx
  94:9  warning  Unexpected console statement  no-console
✖ 1 problem (0 errors, 1 warning)
```

`Statistics.tsx` is explicitly out of my scope (another agent owns it). That is the only
outstanding lint issue in the package; once it is cleared, `pnpm --filter web lint` will be green.

Note: `react/no-unescaped-entities` is not actually enabled in `/.eslintrc.js` (the config
extends `plugin:react/recommended`, which does include it) — either way I wrote the JSX to avoid
raw apostrophes entirely, so it is a non-issue.

### 3. `pnpm --filter web build` — PASS

Exit 0. Both lazy chunks were emitted, confirming the routes are wired and code-split:

```
apps/web/dist/assets/js/ContactPage-DWykgE15.js      (contains "Open in My Email App")
apps/web/dist/assets/js/NotFoundPage-CScnUptK.js     (contains "This Page Took a Wrong Turn")
```

_(Side note: the machine hit `ENOSPC` — the disk is at 100%, ~675 MB free — which killed the
first build invocation's output capture. A rerun succeeded. Worth freeing space; see
[[#Unresolved / For the owner]].)_

### 4. Runtime proof — PASS

**`http://localhost:5273/contact` rendered (actual text captured from `document.body.innerText`):**

```
Gem Auto Rentals
Contact Us

Questions about a rental, a reservation, or a vehicle in our fleet? Our team in
Mulberry, Florida is happy to help.

Get in Touch
We Are Here to Help

Reach us by phone or email during business hours, or stop by the lot in person.
We typically respond to email during the same business day we receive it.

Call Us
863-277-7879/863-279-2907
Email Us
gemautosalesinc@gmail.com
Visit Us
1311 E CANAL ST, MULBERRY, FL 33860

Operating Hours
Monday      10:00 AM – 6:00 PM
Tuesday     10:00 AM – 12:30 PM
Wednesday   10:00 AM – 6:00 PM
Thursday    10:00 AM – 6:00 PM
Friday      10:00 AM – 6:00 PM
Saturday    11:00 AM – 3:00 PM
Sunday      Closed

Send Us a Message
Fill this in and we will open a pre-filled email in your own mail app addressed to
gemautosalesinc@gmail.com. Nothing is sent until you press send in your mail app.
Your Name / Your Email / Subject / Message
Open in My Email App

Prefer to talk it through? Call 863-277-7879 during the hours listed here.
[…footer…]
```

`<h1>` = `"Contact Us"`, `location.pathname` = `/contact`, body length 1493 chars (was **0** before the fix).

**`http://localhost:5273/asdfghjkl` rendered:**

```
Gem Auto Rentals

404
This Page Took a Wrong Turn

We could not find the page you were looking for. It may have been moved, renamed,
or it never existed. Let us get you back on the road.

Back to Home
Browse Vehicles

Still stuck? Contact us and we will point you in the right direction.
[…footer…]
```

`<h1>` = `"This Page Took a Wrong Turn"`, `location.pathname` = `/asdfghjkl`.

**Footer "Contact Us" link click:** from `/`, dispatched a real bubbling `MouseEvent('click')`
on the footer anchor (`href="/contact"`). Result: client-side navigation to `/contact`,
`<h1>` = `"Contact Us"`, page content rendered. Confirmed the dead link is now live.

**Regression checks on existing routing (the catch-all did not break anything):**

| URL visited           | Result                                                                                                 | Status |
| --------------------- | ------------------------------------------------------------------------------------------------------ | ------ |
| `/auth/callback`      | Redirected to `/login`, rendered "Welcome back / Sign in to your account to continue"                  | OK     |
| `/dashboard`          | Redirected to `/dashboard/bookings`, rendered "My Bookings — View and manage all your vehicle rentals" | OK     |
| `/dashboard/bookings` | Rendered "My Bookings" directly                                                                        | OK     |
| `/about`              | Renders normally                                                                                       | OK     |
| `/`                   | Renders normally                                                                                       | OK     |

**Form honesty check:** filled all four fields via native setters (React state confirmed to hold
`Jane Tester` / `jane@example.com` / `SUV for next weekend` / `Do you have an SUV available
Fri-Sun?`), then clicked the submit button. Result: **zero network requests**, **zero console
errors**, **zero toasts**, no success message, page stayed on `/contact`. Nothing fakes success
and nothing silently fails.

Caveat, stated plainly: the automation browser has no OS mail handler registered, so I could
**not** observe the `mailto:` URL actually opening a mail client end-to-end. What I did verify is
that submitting performs no network call, shows no fabricated confirmation, and throws no error.
The `mailto:` string construction itself is straightforward, typechecked code.

## Dev servers — read this

**I did not start the servers on ports 3000 / 5173 / 5174.** They were already listening when I
began (started by the user or a parallel agent).

**The pre-existing vite server on port 5173 is serving stale code.** Its file watcher has
desynced: `curl http://localhost:5173/src/App.tsx` returns a transform with **no** ContactPage
and **no** NotFoundPage, and the browser console logs `No routes matched location "/contact"` —
even though the on-disk `App.tsx` is correct. This is a broken watcher on a long-running
process, not a problem with the code. **Anyone testing against `localhost:5173` will see stale
results and should restart that server.** (I noticed the other parallel agents hit the same wall
— they are running their own vite instances on ports 5199 and 5231.)

Because of that, I ran my own fresh vite instance with `--force` on **port 5273** and verified
there. **I killed it afterwards; port 5273 is free.**

> **I need to flag a mistake.** When cleaning up port 5273, my `lsof -ti:5273` cleanup also
> matched two processes that were _not_ my server — PIDs `37309` and `46016` — and killed them.
> **PID `46016` was the listener on port 5174** (most likely a parallel agent's admin-app dev
> server). It is now dead and port 5174 is free. I am sorry — that was my error, and whoever
> owned it will need to restart it. Ports 3000 and 5173 are untouched and still listening;
> I deliberately left them alone rather than kill work I did not start.

## Unresolved / For the owner

1. **PID 46016 / port 5174 killed by me in error** — see the callout above. Needs a restart by
   whoever owns it.
2. **Stale vite on port 5173** — restart it; it is serving pre-fix code.
3. **`react-helmet-async` is not applying meta tags in dev.** On `/contact`, `/asdfghjkl`, _and_
   the pre-existing `/about`, `document.title` stays `"Gem Auto Rentals - Premium Car Rentals"`
   (the `index.html` default) and `<link rel="canonical">` / `<meta name="robots">` are absent.
   **This is pre-existing and site-wide — I confirmed it reproduces on `/about`, which I did not
   touch — so it is not a regression from this change.** But it means the `noIndex` I set on the
   404 page is currently not reaching crawlers. Worth a separate investigation
   (likely a missing or misplaced `HelmetProvider`).
4. **Hours conflict** between `AboutPage.tsx` and `StructuredData.tsx` JSON-LD — see
   [[#Contact data source notes]]. Search engines are being fed the wrong hours.
5. **Disk is full** — `/System/Volumes/Data` at 100%, ~675 MB free. This already caused one
   `ENOSPC` build failure. Builds and dev servers will keep failing intermittently until space
   is freed.
6. **`CTASection.tsx:39-45` "Contact Us" button still points at `tel:1-800-GEM-AUTO`** — a
   vanity number that appears **nowhere else in the codebase** and does not match either real
   phone number. I left it alone because the task scoped me to fixing the dead `/contact` route,
   and changing it is a content decision. **Recommend** pointing it at `/contact` (now that the
   page exists) or at the real `tel:863-277-7879`. Right now that button dials a number that
   probably does not exist.
7. **Other dead footer links remain.** `Footer.tsx` links to `/pricing`, `/locations`,
   `/careers`, `/blog`, `/press`, `/help`, `/terms`, `/privacy` — **none of which have routes.**
   Before this fix they rendered blank pages; they now land on the new 404 page, which is a
   strict improvement but still not a real destination. `/terms` and `/privacy` in particular
   are usually legally expected to exist.
8. **`CompanySettings` is never seeded**, so admin-editable company info has no backing data and
   all contact details remain hard-coded in the frontend in four separate places.
