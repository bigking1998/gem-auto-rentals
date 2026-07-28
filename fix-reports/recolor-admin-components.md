---
title: Recolor Admin Components — Orange to Gold + Navy
aliases: [Admin Component Recolor, Gold Navy Admin Rebrand]
tags: [rebrand, admin, tailwind, design-tokens, accessibility, fix-report]
created: 2026-07-28
description: Migration of apps/admin/src/components from the legacy orange brand to the gold + navy token system, including every decorative-vs-status judgement call.
related:
  - '[[recolor-admin-pages]]'
  - '[[recolor-web]]'
---

# Recolor Admin Components — Orange → Gold + Navy

**Scope:** `apps/admin/src/components/**` only. No files outside this directory were
touched. `apps/admin/src/pages/`, all of `apps/web/`, `tailwind.config.ts` and
`index.css` were left alone (owned by other agents / already correct).

## Result

| Check                                           | Outcome                        |
| ----------------------------------------------- | ------------------------------ |
| `pnpm --filter admin typecheck`                 | **PASS** — clean, no output    |
| `pnpm --filter admin lint` (`--max-warnings 0`) | **PASS** — clean, no output    |
| `pnpm --filter admin build`                     | **PASS** — `✓ built in 10.13s` |
| Legacy palette count (before)                   | **119**                        |
| Legacy palette count (after)                    | **26**                         |
| Occurrences of the string `orange` remaining    | **0**                          |

Verification grep used:

```
grep -roE '(bg|text|border|from|to|via|ring|shadow)-(orange|amber|yellow|blue|indigo|purple|pink)-[0-9]{2,3}' \
  apps/admin/src/components --include='*.tsx' | wc -l
```

All 26 survivors are deliberate semantic-status colours — enumerated in
[[#Remaining 26 occurrences — all intentional]].

I also confirmed the new utility classes actually made it into the compiled CSS
(`apps/admin/dist/assets/css/index-*.css`) rather than being silently dropped by
Tailwind's JIT: `text-primary-ink`, `bg-accent`, `text-accent-foreground`,
`shadow-primary-light`, `from-primary-light`, `to-primary-dark`,
`text-primary-foreground`, `ring-primary`, `bg-secondary`, `hover:bg-primary-dark`
all emit rules.

## Files changed (12 of 12 in scope)

| File                                                              | What changed                                                                                                                     |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `apps/admin/src/components/layout/Sidebar.tsx`                    | Logo tile + user avatar gradients; nav badge contrast                                                                            |
| `apps/admin/src/components/layout/Header.tsx`                     | Notification type chips, settings-menu icon tiles, notification/settings popover accents, avatar gradient, theme-toggle sun icon |
| `apps/admin/src/components/layout/DashboardLayout.tsx`            | _(no changes needed — already token-clean)_                                                                                      |
| `apps/admin/src/components/bookings/BookingDetailModal.tsx`       | Header icon tile, customer avatar, vehicle-category badge, status-action panel + buttons                                         |
| `apps/admin/src/components/bookings/CreateBookingModal.tsx`       | 6 focus rings, customer avatar chip, selection states, price emphasis, submit button                                             |
| `apps/admin/src/components/bookings/PaymentTrackingModal.tsx`     | `PARTIAL` payment status, refund link/input/button                                                                               |
| `apps/admin/src/components/customers/CustomerProfileModal.tsx`    | Banner + avatar gradients, close button, 3 of 4 stat cards, booking/document row icons, 2 CTAs, note-author chip, active tab     |
| `apps/admin/src/components/settings/AddPaymentMethodModal.tsx`    | Primary submit button                                                                                                            |
| `apps/admin/src/components/settings/DeletePaymentMethodModal.tsx` | "Default" card badge                                                                                                             |
| `apps/admin/src/components/settings/UpgradePlanModal.tsx`         | Popular-plan border/badge/CTA/shadow, contact-sales link                                                                         |
| `apps/admin/src/components/vehicles/VehicleBookings.tsx`          | Active status-menu item, loading spinner                                                                                         |
| `apps/admin/src/components/vehicles/VehicleForm.tsx`              | Header icon tile, upload hints, pending-image border + badge, feature pills, submit button, upload-tile hover                    |

`DashboardLayout.tsx` had no palette classes at all — no edit was required.

## Contrast fixes (the important part)

Gold `#D4AF37` on white is ~1.9:1. Every place the old code leaned on gold as a
foreground colour or paired gold with `text-white` was a live WCAG failure. These
were fixed even where the class was not itself an `orange-*` class, so they do not
show up in the before/after grep count:

| Location                                       | Was                                        | Now                                                 | Why                          |
| ---------------------------------------------- | ------------------------------------------ | --------------------------------------------------- | ---------------------------- |
| `Sidebar.tsx:75,82`                            | `bg-primary text-white` (nav count badges) | `bg-primary text-primary-foreground`                | white on gold ≈ 1.9:1        |
| `Sidebar.tsx:111,147`                          | gold gradient + `text-white`               | gold gradient + `text-primary-foreground`           | same                         |
| `Header.tsx:555`                               | gold gradient avatar + `text-white`        | `text-primary-foreground`                           | same                         |
| `BookingDetailModal.tsx:184`                   | `text-primary` (active tab label)          | `text-primary-ink`                                  | gold text on white           |
| `BookingDetailModal.tsx:207,403,472`           | `text-white` on gold / `text-primary`      | `text-primary-foreground` / `-ink`                  | same                         |
| `CustomerProfileModal.tsx:136`                 | `text-white` close X over gold banner      | `text-primary-foreground`                           | white on gold banner         |
| `CustomerProfileModal.tsx:141,190,418,465,478` | `text-white` / `text-primary` on gold      | `text-primary-foreground` / `-ink`                  | same                         |
| `VehicleBookings.tsx:85`                       | `text-primary` spinner                     | `text-primary-ink`                                  | non-text graphic needs 3:1   |
| `VehicleForm.tsx:325,551,621`                  | `hover:text-primary`, `text-white` on gold | `hover:text-primary-ink`, `text-primary-foreground` | same                         |
| `CreateBookingModal.tsx` (3 sites)             | `text-orange-600` price/total              | `text-primary-ink`                                  | gold text needs the ink ramp |

Rule applied throughout: **gold is a background, never a foreground.** Gold-coloured
text on white is always `text-primary-ink` (`#8A6715`, ~5.6:1). Text sitting on gold
is always `text-primary-foreground` (deep navy).

I deliberately avoided slash-opacity on the CSS-variable tokens (e.g. `bg-accent/50`).
Tailwind v3 cannot inject an alpha channel into a bare `hsl(var(--x))` colour and
silently renders it at full opacity, so `bg-orange-50/50` became a flat `bg-accent`
(already a 95%-lightness wash, so visually equivalent) rather than a token with a
slash that would have been a no-op.

## Judgement calls — decorative vs status

This is the section that matters for "a whole bunch of different colors everywhere."
Every non-orange colour in scope was classified. Reasoning for each:

### Moved to brand (judged DECORATIVE)

| #   | Location                                                                                   | Was                                | Now                                                                                                                | Reasoning                                                                                                                                                                                                                                                                                                                                                     |
| --- | ------------------------------------------------------------------------------------------ | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `Header.tsx` — notification chip, type `message`                                           | `bg-blue-100 text-blue-600`        | `bg-accent text-accent-foreground`                                                                                 | Notification **type**, not state. The `Mail` icon already carries the meaning; the colour was pure decoration and added a fifth hue to the dropdown.                                                                                                                                                                                                          |
| 2   | `Header.tsx` — notification chip, type `document`                                          | `bg-blue-100 text-blue-600`        | `bg-accent text-accent-foreground`                                                                                 | Same. It was already colour-identical to `message`, proving the colour encoded nothing.                                                                                                                                                                                                                                                                       |
| 3   | `Header.tsx` — notification chip, type `booking`                                           | `bg-orange-100 text-orange-600`    | `bg-accent text-accent-foreground`                                                                                 | Legacy brand orange on the core entity → brand gold wash.                                                                                                                                                                                                                                                                                                     |
| 4   | `Header.tsx` — settings menu, "Help Center" icon tile                                      | `bg-blue-100` / `text-blue-600`    | `bg-accent` / `text-accent-foreground`                                                                             | A menu-row icon tile. Zero semantic content.                                                                                                                                                                                                                                                                                                                  |
| 5   | `Header.tsx` — settings menu, "Back to Site" icon tile                                     | `bg-blue-100` / `text-blue-600`    | `bg-accent` / `text-accent-foreground`                                                                             | Same.                                                                                                                                                                                                                                                                                                                                                         |
| 6   | `Header.tsx` — theme toggle sun icon                                                       | `text-amber-500`                   | `text-primary-ink`                                                                                                 | **Not** a warning — it is a light/dark-mode affordance. Worse, amber-500 `#F59E0B` sits a few degrees from brand gold `#D4AF37`, which reads as a _mistake_ rather than a second colour. Folded into gold.                                                                                                                                                    |
| 7   | `BookingDetailModal.tsx` — vehicle **category** badge (SUV / Sedan)                        | `bg-blue-100 text-blue-700`        | `bg-accent text-accent-foreground`                                                                                 | Taxonomy metadata, not lifecycle state. Explicitly a "decorative category colour".                                                                                                                                                                                                                                                                            |
| 8   | `CustomerProfileModal.tsx` — "Avg. Booking" stat card                                      | `bg-amber-50` / `text-amber-600`   | `bg-accent` / `text-accent-foreground`                                                                             | A stat-card accent. Amber here was decorative, not a warning — no threshold, no alert semantics.                                                                                                                                                                                                                                                              |
| 9   | `CustomerProfileModal.tsx` — "Days as Customer" stat card                                  | `bg-orange-50` / `text-orange-600` | `bg-accent` / `text-accent-foreground`                                                                             | Legacy brand accent on a stat tile.                                                                                                                                                                                                                                                                                                                           |
| 10  | `CustomerProfileModal.tsx` — "Total Bookings" stat card                                    | `bg-orange-50` / `text-primary`    | `bg-accent` / `text-accent-foreground`                                                                             | Same, plus fixed the gold-on-white contrast bug.                                                                                                                                                                                                                                                                                                              |
| 11  | `CustomerProfileModal.tsx` — document row icon tile                                        | `bg-blue-100` / `text-blue-600`    | `bg-accent` / `text-accent-foreground`                                                                             | List-row icon chrome.                                                                                                                                                                                                                                                                                                                                         |
| 12  | `DeletePaymentMethodModal.tsx` — "Default" card badge                                      | `bg-blue-100 text-blue-700`        | `bg-accent text-accent-foreground`                                                                                 | A label, not a status. "Default" has no severity, urgency, or success/failure meaning.                                                                                                                                                                                                                                                                        |
| 13  | `AddPaymentMethodModal.tsx` — submit button                                                | `bg-blue-600 text-white`           | `bg-primary text-primary-foreground`                                                                               | This is the modal's **primary action**. A primary action must be the brand colour; blue here was simply a leftover. Biggest single "why is this blue?" offender in settings.                                                                                                                                                                                  |
| 14  | `PaymentTrackingModal.tsx` — refund link, refund input focus ring, "Process Refund" button | `blue-600/700`, `ring-blue-500`    | `text-secondary` / `hover:text-navy`, `ring-secondary`, `bg-secondary text-secondary-foreground` / `hover:bg-navy` | An **action**, not a status. Moved into the brand's royal-blue/navy family rather than gold, so it stays visually subordinate to gold primary actions while still reading as one brand. `secondary` `#1E3A6E` on white is ~10:1.                                                                                                                              |
| 15  | `PaymentTrackingModal.tsx` — `PARTIAL` payment status                                      | `bg-orange-100 text-orange-600`    | `bg-accent text-accent-foreground`                                                                                 | _Borderline._ It is a genuine status, but its colour was the legacy brand orange, which cannot stay. Gold accent is the closest honest mapping. **Caveat:** pale gold now sits near the `PENDING` yellow chip. They remain distinguishable by icon (`DollarSign` vs `Clock`) and label, but if you want stronger separation, `PARTIAL` is the one to revisit. |
| 16  | `VehicleBookings.tsx` — active item in the status dropdown                                 | `bg-orange-50 text-primary`        | `bg-accent text-accent-foreground`                                                                                 | UI selection state, not data state.                                                                                                                                                                                                                                                                                                                           |

### Left alone (judged genuine STATUS / semantic)

| #   | Location                                                                               | Colour kept                                                                                           | Reasoning                                                                                                                                                                                                        |
| --- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A   | `BookingDetailModal.tsx:69-73` — booking lifecycle map                                 | `yellow-50/700/200` PENDING, `blue-50/700/200` CONFIRMED, green ACTIVE, gray COMPLETED, red CANCELLED | Real lifecycle states a user acts on. Yellow = awaiting action, blue = the neutral "informational/acknowledged" convention, green = live, red = cancelled. Recolouring these to gold would destroy scannability. |
| B   | `BookingDetailModal.tsx:76-81` — payment status map                                    | `yellow-600` PENDING, green PAID, `blue-600` REFUNDED, red FAILED                                     | Money states. Refunded-is-blue is a near-universal convention.                                                                                                                                                   |
| C   | `PaymentTrackingModal.tsx:40,42` — PENDING / REFUNDED                                  | `yellow-*`, `blue-*`                                                                                  | Same set as (B); kept identical so the two modals agree.                                                                                                                                                         |
| D   | `CustomerProfileModal.tsx:79-80` and `VehicleBookings.tsx:22-23` — booking status maps | `bg-yellow-100 text-yellow-800`, `bg-blue-100 text-blue-800`                                          | Same lifecycle semantics as (A).                                                                                                                                                                                 |
| E   | `CustomerProfileModal.tsx:156` — "Pending Verification"                                | `bg-yellow-100 text-yellow-700`                                                                       | Textbook pending/warning state, paired with a `Clock` icon.                                                                                                                                                      |
| F   | `DeletePaymentMethodModal.tsx:71-73` — warning callout                                 | `amber-50/200/600/800`                                                                                | A genuine `AlertTriangle` warning about destructive consequences. Explicitly out of bounds and correctly so.                                                                                                     |
| G   | all `red-*`                                                                            | unchanged                                                                                             | Errors, cancellation, sign-out, delete.                                                                                                                                                                          |
| H   | all `green-*`                                                                          | unchanged                                                                                             | Success, paid, verified, active.                                                                                                                                                                                 |
| I   | all `gray-*` / `slate-*`                                                               | unchanged                                                                                             | Neutral chrome.                                                                                                                                                                                                  |

### Known inconsistency I chose NOT to fix — needs a decision

**Two different status-chip conventions coexist and I could not reconcile them
without violating the "do not change green/red/gray" constraint:**

- `BookingDetailModal.tsx` uses a **bordered** convention: `bg-{c}-50 text-{c}-700 border-{c}-200`
- `CustomerProfileModal.tsx` and `VehicleBookings.tsx` use a **borderless** convention: `bg-{c}-100 text-{c}-800`

Each map is internally consistent, and normalising one to the other would have
required editing the `green-*`, `red-*`, and `gray-*` entries in those same maps —
explicitly forbidden by the brief. Flagging it as a follow-up: pick one convention
and lift it into a shared `statusChip()` helper.

**`PaymentTrackingModal.tsx:121` — the green modal header gradient
(`bg-gradient-to-r from-green-600 to-emerald-600`).**
This is the single loudest remaining source of "different colors everywhere" in my
scope. By the decorative test it is clearly decorative — a section-header gradient,
not a success indicator — and it clashes badly now that `CustomerProfileModal` has a
gold header and `BookingDetailModal` has a white one. However, the brief listed
`green-*` under DO NOT CHANGE without qualification, so **I left it and am escalating
instead of overreaching.** Recommendation: `from-navy to-secondary`, which keeps the
existing `text-white` / `text-white/80` / `bg-white/20` children valid at high
contrast and needs no other edits in the file. Say the word and it is a one-line change.

## Token usage summary

| Old pattern                                | New token                                |
| ------------------------------------------ | ---------------------------------------- |
| `bg-orange-500/600`                        | `bg-primary` (+ `hover:bg-primary-dark`) |
| `bg-orange-50/100`                         | `bg-accent`                              |
| `text-orange-500/600/700`                  | `text-primary-ink`                       |
| `text-primary` used as foreground text     | `text-primary-ink`                       |
| `text-white` on any gold surface           | `text-primary-foreground`                |
| `border-orange-300/500`                    | `border-primary`                         |
| `border-orange-100`                        | `border-primary-light`                   |
| `from-orange-400 to-orange-600`            | `from-primary-light to-primary-dark`     |
| `focus:ring-orange-500`                    | `focus:ring-primary`                     |
| `shadow-orange-200`                        | `shadow-primary-light`                   |
| decorative `bg-blue-100` / `text-blue-600` | `bg-accent` / `text-accent-foreground`   |
| blue **action** colours                    | `secondary` / `navy`                     |

## Notes

- Nothing was committed or pushed. No `.env` file was read or modified.
- No dev server was started; verification was done via `typecheck`, `lint`, and a
  production `build` only.
- `apps/admin/src/pages/LoginPage.tsx` was not touched.
- `apps/admin/dist/` now contains a fresh production build as a side effect of the
  verification step.
- Unrelated pre-existing gap spotted while reading `apps/admin/src/index.css`: the
  `.dark` block does not define `--primary-ink`, `--primary-light`, `--primary-dark`,
  `--navy`, `--navy-card`, or `--navy-light`. Any component using those tokens will
  fall back to the light-mode values (or nothing) in dark mode. The admin has a dark
  mode toggle in `Header.tsx`, so this will surface. Out of my scope (`index.css` is
  not under `components/`), flagging for whoever owns the theme files.
