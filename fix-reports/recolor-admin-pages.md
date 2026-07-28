---
title: Recolour — admin pages (orange → gold + navy)
aliases: [Admin Pages Rebrand, recolor-admin-pages]
tags: [rebrand, design-system, admin, tailwind, accessibility]
created: 2026-07-28
description: Rebrand of apps/admin/src/pages from the legacy ORANGE palette to the GOLD + NAVY brand, including a decorative-vs-status colour audit that cuts the admin dashboard down to one coherent brand.
related:
  - '[[recolor-admin-components]]'
  - '[[recolor-web]]'
---

# Recolour — `apps/admin/src/pages`

Scope: **only** `apps/admin/src/pages/*.tsx`. No files outside that directory were
touched. Nothing committed, nothing pushed, no `.env` touched, no dev server left
running.

## Result

| Metric                                                                                                           | Before     | After  |
| ---------------------------------------------------------------------------------------------------------------- | ---------- | ------ |
| `(bg\|text\|border\|from\|to\|via\|ring\|shadow)-(orange\|amber\|yellow\|blue\|indigo\|purple\|pink)-[0-9]{2,3}` | **287**    | **78** |
| Literal `orange` occurrences                                                                                     | 44 classes | **0**  |
| Legacy brand hex `#FF871E`                                                                                       | 6          | **0**  |
| Raw `text-primary` (gold text on white, ~1.9:1)                                                                  | 41         | **0**  |

The remaining **78** are all deliberate: booking/vehicle/conversation status
badges, genuine `amber` warnings (DEMO-data banners, maintenance state), 2FA
security state, and two third-party card-brand marks. Every one is listed and
justified below.

### Verification (all actually run)

| Command                                         | Result                        |
| ----------------------------------------------- | ----------------------------- |
| `pnpm --filter admin typecheck`                 | clean                         |
| `pnpm --filter admin lint` (`--max-warnings 0`) | clean                         |
| `pnpm --filter admin build`                     | succeeded, `✓ built in 6.53s` |

I also grepped the emitted CSS bundle to confirm the new utilities actually
generate: `shadow-primary/20`, `bg-primary-light`, `to-primary-dark`,
`text-primary-ink`, `bg-navy`, `bg-accent`, `text-primary-foreground`,
`bg-secondary`, `border-primary` — all present.

## Files changed (13)

`AnalyticsPage.tsx` · `BookingsPage.tsx` · `CustomerProfilePage.tsx` ·
`CustomersPage.tsx` · `DashboardHome.tsx` · `EditVehiclePage.tsx` ·
`FleetManagement.tsx` · `HelpPage.tsx` · `LoginPage.tsx` · `MessagesPage.tsx` ·
`SecurityPage.tsx` · `SettingsPage.tsx` · `TrashPage.tsx`

`AddVehiclePage.tsx` had zero colour classes and was not modified.

## Mechanical mappings applied

| From                                                                                             | To                                        |
| ------------------------------------------------------------------------------------------------ | ----------------------------------------- |
| `bg-orange-50` / `bg-orange-100`                                                                 | `bg-accent`                               |
| `bg-orange-200`                                                                                  | `bg-primary-light`                        |
| `bg-orange-300…900`                                                                              | `bg-primary`                              |
| `hover:bg-orange-500/600/700`                                                                    | `hover:bg-primary-dark`                   |
| `text-orange-*`                                                                                  | `text-primary-ink`                        |
| `border-orange-*`                                                                                | `border-primary`                          |
| `ring-orange-*`                                                                                  | `ring-primary`                            |
| `shadow-orange-200` / `-300`                                                                     | `shadow-primary/20` / `shadow-primary/30` |
| `from-orange-400 to-orange-600`, `from-orange-500 to-orange-600`, `from-orange-500 to-amber-500` | `from-primary-light to-primary-dark`      |
| `from-orange-50 via-white to-orange-100`                                                         | `from-accent via-white to-accent`         |
| `bg-gradient-to-r from-orange-50 to-orange-100`                                                  | `bg-accent` (was a no-op gradient)        |
| `#FF871E` (chart fills/strokes)                                                                  | `#D4AF37`                                 |

### Contrast fixes (the important ones)

1. **`text-white` on gold → `text-primary-foreground`.** Every gold surface
   (`bg-primary`, `from-primary-light to-primary-dark`) that carried white text
   now carries deep navy. ~30 sites. Also `text-white/80` →
   `text-primary-foreground/80` inside the two multi-line gold blocks
   (`HelpPage.tsx` hero, `SettingsPage.tsx` billing card) and
   `border-white/20` → `border-primary-foreground/20` on the billing card divider.
   Left alone: `text-white` on `bg-red-*` / `bg-green-*` modal headers and on the
   new navy quick-action tiles — those are correct.

2. **Raw `text-primary` → `text-primary-ink`, 41 sites.** This was a pre-existing
   problem, not introduced by the orange sweep: raw gold `#D4AF37` as text on
   white is ~1.9:1. Every instance was on a white or `bg-accent` surface, so the
   swap is unconditionally safe (loaders, tab labels, link hovers, icon glyphs,
   ghost buttons).

3. **`hover:bg-primary` on `bg-primary` buttons → `hover:bg-primary-dark`,
   19 sites.** A naive orange→primary substitution would have made every primary
   button lose its hover state entirely.

---

## Judgement calls: decorative vs status

The rule I applied throughout: **colour lives in the badge, not in the chrome.**
A pill that names a state gets a semantic colour. Anything that is framing —
stat-card icon chips, section headers, quick-action tiles, taxonomy badges,
big stat numbers — goes brand.

### Moved to brand (decorative)

| Where                                                             | Was                                                                                                                                 | Now                                                                                                     | Reasoning                                                                                                                                                                                                                                                                                                                                                                                       |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DashboardHome.tsx` — 6 quick-action tiles                        | `bg-blue-500`, `bg-green-500`, `bg-emerald-500`, `bg-amber-500`, ×2 orange, each with a matching `hover:border-*` + `hover:bg-*-50` | all `bg-navy` + `hover:border-navy` + `hover:bg-accent`                                                 | Six different colours for six buttons that do unrelated things — the colour carried no information at all, the icon and label already do. This block alone was 18 of the offending classes and is the single biggest contributor to "different colors everywhere". Navy (not gold) so the tile row reads as secondary to the gold stat row above it. Icons stay `text-white` — correct on navy. |
| `DashboardHome.tsx` — 4 stat-card icon chips                      | `bg-red-500`, `bg-green-500`, ×2 orange                                                                                             | all `bg-primary`, icon `text-primary-foreground`                                                        | Decorative accents. Note the `bg-red-500` on "Active Rentals": red is normally protected as the error colour, but here it was decorating a neutral count — that is exactly the misuse that makes red stop meaning "error". Changed deliberately.                                                                                                                                                |
| `DashboardHome.tsx` — `info` alert variant                        | `border-blue-200 bg-blue-50`, `text-blue-500` icon, `text-blue-600 hover:bg-blue-100` action                                        | `border-primary bg-accent`, `text-primary-ink`, `text-primary-ink hover:bg-accent`                      | "Info" is not a state anything can be in — it is the absence of urgency. The `warning` (amber) and `success` (green) variants in the same block are untouched, so the alert row now reads: gold = FYI, amber = attention, green = good.                                                                                                                                                         |
| `DashboardHome.tsx` — activity timeline dots                      | `booking`/`customer` both gold, `return` amber                                                                                      | `booking` gold, `customer` navy, `return` secondary blue                                                | Type indicators, not states. Booking and customer collided on the same gold after the mechanical pass; spread across the brand family instead. `payment` stays green (money in = success) and `maintenance` stays gray.                                                                                                                                                                         |
| `FleetManagement.tsx` — `categoryColors`                          | ECONOMY green, STANDARD blue, PREMIUM rose, LUXURY amber, SUV gold, VAN teal                                                        | ECONOMY/STANDARD/SUV/VAN `bg-gray-100 text-gray-700`; PREMIUM/LUXURY `bg-accent text-accent-foreground` | **Six-colour rainbow on a taxonomy, one badge per table row.** Vehicle class is not a state — nothing is "wrong" about a van. Neutralised, with gold reserved for the premium tiers where "this is the expensive one" is real signal.                                                                                                                                                           |
| `FleetManagement.tsx` — "Booked" stat card                        | `bg-blue-100` / `text-blue-600`                                                                                                     | `bg-accent` / `text-primary-ink`                                                                        | Collided with the adjacent "Rented" card, which is _also_ blue and _is_ a real status. "Booked" means "has ≥1 booking record", a count — not a vehicle state.                                                                                                                                                                                                                                   |
| `FleetManagement.tsx` — "N bookings" count pill                   | `bg-blue-100 text-blue-800`                                                                                                         | `bg-accent text-accent-foreground`                                                                      | Informational count, was borrowing the RENTED status colour and implying a state it doesn't represent.                                                                                                                                                                                                                                                                                          |
| `FleetManagement.tsx` — "View Bookings" row-action hover          | `hover:bg-blue-50 hover:text-blue-600`                                                                                              | `hover:bg-accent hover:text-primary-ink`                                                                | Its two sibling icon buttons in the same cell already hover gold. Pure inconsistency.                                                                                                                                                                                                                                                                                                           |
| `CustomerProfilePage.tsx` — "Avg. Booking Value" chip             | `bg-amber-100` / `text-amber-600`                                                                                                   | `bg-accent` / `text-primary-ink`                                                                        | Stat-card accent. Amber here also read as a false warning on a perfectly healthy metric.                                                                                                                                                                                                                                                                                                        |
| `CustomerProfilePage.tsx` — document row icon chip                | `bg-blue-100` / `text-blue-600`                                                                                                     | `bg-accent` / `text-primary-ink`                                                                        | Decorative. The document's real state lives in the adjacent `documentStatusColors` badge, which is untouched.                                                                                                                                                                                                                                                                                   |
| `HelpPage.tsx` — "Email Support" chip                             | `bg-blue-100` / `text-blue-600`                                                                                                     | `bg-accent` / `text-primary-ink`                                                                        | Support-channel icon chip; its sibling "Live Chat" card is already gold.                                                                                                                                                                                                                                                                                                                        |
| `AnalyticsPage.tsx` — export-menu spreadsheet icon                | `text-blue-500`                                                                                                                     | `text-primary-ink`                                                                                      | One icon in a menu where every other item is uncoloured.                                                                                                                                                                                                                                                                                                                                        |
| `SecurityPage.tsx` — "Backup Codes" section header chip           | `bg-amber-100` / `text-amber-600`                                                                                                   | `bg-accent` / `text-primary-ink`                                                                        | Section-header decoration. Every other section header on the page is neutral or gold; amber implied an alert that isn't there.                                                                                                                                                                                                                                                                  |
| `MessagesPage.tsx` — "Reopen" button                              | `bg-blue-50 text-blue-600 hover:bg-blue-100`                                                                                        | `bg-accent text-primary-ink hover:bg-primary-light`                                                     | A secondary action, not a state. It was borrowing the OPEN status colour.                                                                                                                                                                                                                                                                                                                       |
| `CustomersPage.tsx` — "With Bookings" number                      | `text-blue-600`                                                                                                                     | `text-gray-900`                                                                                         | Its three sibling stat numbers on the same row were already `text-gray-900`.                                                                                                                                                                                                                                                                                                                    |
| `AnalyticsPage.tsx` — pie-chart `categoryColors`                  | emerald / blue / pink / amber / red / cyan hex                                                                                      | brand ramp: `#D4AF37`, `#1E3A6E`, `#A87C1A`, `#0A1929`, `#F2D99A`, `#7E9AC4`                            | A six-slice rainbow was the loudest thing on the analytics page. Replaced with a gold→navy ramp that alternates light/dark so adjacent slices stay distinguishable. Gray `#9ca3af` fallback kept.                                                                                                                                                                                               |
| All stat-card **numbers** on `BookingsPage` and `FleetManagement` | `text-yellow-600` / `text-blue-600` / `text-green-600` / gold                                                                       | `text-gray-900`                                                                                         | Cross-cutting: the icon chip already encodes the status, so colouring the number too doubled the noise. Also fixes an inconsistency where "Total Bookings" was neutral while its neighbours were not.                                                                                                                                                                                           |

### Kept semantic (real status) — and made consistent

**Canonical booking-status palette**, now identical in all four places it is defined:

```
PENDING   bg-yellow-100 text-yellow-800   (awaiting action)
CONFIRMED bg-blue-100   text-blue-800
ACTIVE    bg-green-100  text-green-800
COMPLETED bg-gray-100   text-gray-800
CANCELLED bg-red-100    text-red-800
```

> **Bug found and fixed.** `DashboardHome.tsx` and `CustomerProfilePage.tsx` had
> `CONFIRMED: green` / `ACTIVE: blue` — the **exact inverse** of
> `BookingsPage.tsx` and `FleetManagement.tsx`'s `getBookingStatusColor()`. The
> same booking rendered green on one screen and blue on another. Both files now
> follow `BookingsPage`/`FleetManagement`. This was a real correctness problem,
> not just a cosmetic one, and it is a decent chunk of why the admin felt random.

Other status colour kept as-is:

- **`FleetManagement` vehicle status** — `AVAILABLE` green, `RENTED` blue,
  `RETIRED` gray, and the matching `Available`/`Rented` stat-card icon chips.
- **`MessagesPage` conversation status** — `OPEN` blue, `PENDING` yellow,
  `RESOLVED` green, `CLOSED` gray.
- **`SecurityPage` 2FA state** — green (Strong/Enabled) vs yellow
  (Moderate/Disabled), across the sidebar summary chip, the status text, the
  `XCircle` icon and the Enabled/Disabled pill. Genuine security posture.
- **`CustomersPage` / `CustomerProfilePage` verification** — green Verified vs
  yellow Unverified/Pending, and `documentStatusColors`
  (PENDING/VERIFIED/REJECTED).
- **`TrashPage`** status fallback yellow.
- All `red-*` destructive buttons and modal headers, all `green-*` success
  buttons and modal headers.

### Moved _off_ brand, deliberately

Two cases where the mechanical orange→gold pass produced a _worse_ result,
because the original orange was carrying warning meaning rather than brand:

| Where                                                                                        | After mechanical pass               | Corrected to                                     | Reasoning                                                                                                                                                                                                                                   |
| -------------------------------------------------------------------------------------------- | ----------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `FleetManagement.tsx` `statusColors.MAINTENANCE`, plus its stat card and its bulk-action dot | `bg-accent text-primary-ink` (gold) | `bg-amber-100 text-amber-800` / `bg-amber-500`   | Maintenance is a genuine "needs attention, not earning revenue" state. Gold would have made the brand colour mean "something is wrong", which poisons it everywhere else. Amber is the correct semantic and is explicitly in the keep-list. |
| `MessagesPage.tsx` `priorityColors.HIGH` and `IN_PROGRESS` status                            | gold                                | `text-amber-500` / `bg-amber-100 text-amber-800` | Priority is a real ordered scale — LOW gray → NORMAL blue → **HIGH amber** → URGENT red. Gold in the middle of that ramp broke the escalation reading and collided with brand.                                                              |

### Left alone after review

- **DEMO-data banners** (`DashboardHome`, `AnalyticsPage`) and the small `DEMO`
  pills on the revenue chart and revenue stat — `amber-50/100/200/600/700/800`.
  These warn the user the numbers are fake. That is as real as meaning gets, and
  the two banners are already byte-identical across both pages.
- **`SettingsPage` card-brand marks** — `text-blue-600` "VISA",
  `text-blue-500` "AMEX", `text-red-500` "MC". Third-party brand identity, not
  our palette; recolouring them would make the cards harder to recognise.

## `LoginPage.tsx` — special note honoured

The navy logo tile at line ~131 is untouched:

```html
<div
  className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-navy shadow-lg"
>
  <img src="/logo-mark.svg" alt="Gem Car Rentals" className="h-12 w-auto" />
</div>
```

Surrounding colours were brought in line with it: the page background gradient is
now `from-accent via-white to-accent` (pale gold wash), the SSO spinner is
`text-primary-ink`, and the Sign In button is `from-primary-light to-primary-dark`
with `text-primary-foreground` instead of white-on-gold.

## Nothing failed

All three verification commands passed on the first full run after the final edit.
No workarounds, no suppressed lint rules, no `@ts-expect-error`, no partial edits.

## Follow-ups (out of my scope — other agents own these)

- `apps/admin/src/components/**` defines its own status colour maps
  (e.g. `BookingDetailModal.tsx`, `PaymentTrackingModal.tsx`). The canonical
  booking palette above should be applied there too, otherwise the
  page/modal inconsistency I just fixed reappears at the modal boundary.
- The booking-status palette is now duplicated verbatim in four page files.
  Worth hoisting into `@/lib/status-colors` (or `packages/ui`) so it can only
  ever drift once. That refactor spans `pages/` **and** `components/`, so it
  needs to be done by whoever owns both.
