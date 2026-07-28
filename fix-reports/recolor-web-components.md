---
title: 'Recolor — apps/web/src/components (orange → gold + navy)'
aliases: ['Web components recolor', 'Gold rebrand: web components']
tags: [rebrand, theming, accessibility, contrast, apps-web, fix-report]
created: 2026-07-28
description: 'Replacement of hardcoded orange/amber/yellow Tailwind classes with the gold + navy theme tokens across apps/web/src/components, including white-on-gold contrast fixes.'
related:
  - '[[recolor-web-pages]]'
  - '[[recolor-admin]]'
---

# Recolor — `apps/web/src/components`

Brand moved from ORANGE to GOLD (`#D4AF37`) + NAVY (`#0A1628`). This pass replaced
hardcoded Tailwind palette classes inside `apps/web/src/components/` with the
already-defined theme tokens, and fixed the white-on-gold contrast failures that
came with them.

## Counts

Command:

```
grep -roE '(bg|text|border|from|to|via|ring|shadow)-(orange|amber|yellow)-[0-9]{2,3}' \
  apps/web/src/components --include='*.tsx' | wc -l
```

|         | Count   |
| ------- | ------- |
| Before  | **193** |
| After   | **19**  |
| Removed | **174** |

All 19 remaining are amber/yellow that were **deliberately left** (see
[[#Deliberately left]]). **Zero `orange-*` classes remain** in scope.

> Note on the brief's "~216" estimate: the actual count under the stated grep was 193
> before any edits. Counting every `*-orange|amber|yellow-NNN` token regardless of
> prefix (including `hover:`, `focus:`, `group-hover:` variants, which the stated
> pattern already covers) also gives 193. I could not reproduce 216 — stating that
> plainly rather than inflating the number.

## Verification — all run, all clean

| Check     | Command                       | Result                                           |
| --------- | ----------------------------- | ------------------------------------------------ |
| Typecheck | `pnpm --filter web typecheck` | PASS — no output, clean                          |
| Lint      | `pnpm --filter web lint`      | PASS — 0 errors, 0 warnings (`--max-warnings 0`) |
| Build     | `pnpm --filter web build`     | PASS — bundles emitted                           |
| Tests     | `pnpm --filter web test`      | PASS — 73/73 tests, 3/3 files, no regressions    |

No dev servers left running (ports 3000 / 5173 / 5174 confirmed free). No commits,
no pushes, no `.env` touched. Nothing outside `apps/web/src/components/` was edited.

## Files changed (25)

| File                                                     | Nature of change                                                                                                   |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `apps/web/src/components/booking/CustomerInfoStep.tsx`   | focus rings, section icons, T&C links, consent checkbox                                                            |
| `apps/web/src/components/booking/DateLocationStep.tsx`   | step-number badges (contrast), focus rings, checkbox                                                               |
| `apps/web/src/components/booking/DocumentUploadStep.tsx` | dropzone active/hover state, upload button (contrast), spinner, icon chip                                          |
| `apps/web/src/components/booking/ExtensionModal.tsx`     | icon bubble, confirm button (contrast + shadow)                                                                    |
| `apps/web/src/components/booking/ExtrasStep.tsx`         | selected-card state, "Recommended" gradient badge, checkbox tick, icon tile, benefit chips, totals panel, info box |
| `apps/web/src/components/booking/PaymentStep.tsx`        | price breakdown panel, submit gradient (contrast), focus rings, extras chip, spinner                               |
| `apps/web/src/components/booking/PromoCodeInput.tsx`     | toggle link, apply button (contrast)                                                                               |
| `apps/web/src/components/dashboard/DashboardLayout.tsx`  | logo tile, pending-booking banner (multiple contrast fixes), avatar, active nav, mobile FAB                        |
| `apps/web/src/components/forms/FormField.tsx`            | focus rings on input/select/textarea, checkbox fill                                                                |
| `apps/web/src/components/home/FAQ.tsx`                   | contact link (contrast)                                                                                            |
| `apps/web/src/components/home/FeaturedVehicles.tsx`      | category badges (contrast), "view" link, CTA button (contrast)                                                     |
| `apps/web/src/components/home/HowItWorks.tsx`            | four step gradients, connector line                                                                                |
| `apps/web/src/components/home/QuickPricingWidget.tsx`    | search button (contrast + shadow)                                                                                  |
| `apps/web/src/components/home/Testimonials.tsx`          | quote-icon bubble                                                                                                  |
| `apps/web/src/components/home/WhyChooseUs.tsx`           | six feature icon tiles (contrast)                                                                                  |
| `apps/web/src/components/layout/Footer.tsx`              | logo tile gradient, newsletter button (contrast)                                                                   |
| `apps/web/src/components/layout/Header.tsx`              | **Sign-up button (the reported live bug)**, desktop + mobile CTAs, logout items, hover states                      |
| `apps/web/src/components/loyalty/PointsCard.tsx`         | gradient card (contrast)                                                                                           |
| `apps/web/src/components/ui/PageLoader.tsx`              | two spinners                                                                                                       |
| `apps/web/src/components/vehicles/FilterSidebar.tsx`     | clear-filters link (contrast)                                                                                      |
| `apps/web/src/components/vehicles/ReviewForm.tsx`        | submit button (contrast + shadow)                                                                                  |
| `apps/web/src/components/vehicles/ReviewList.tsx`        | load-more button (contrast)                                                                                        |
| `apps/web/src/components/vehicles/VehicleCard.tsx`       | category badges (contrast), book button (contrast + shadow)                                                        |

Two more files were touched only by the `bg-primary` + `text-white` contrast sweep
(they had no orange classes of their own):
`home/FeaturedVehicles.tsx` and `vehicles/VehicleCard.tsx` category-badge maps —
already listed above.

## Mappings applied

| From                                                                       | To                                                                |
| -------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `bg-orange-500/600/700`                                                    | `bg-primary`                                                      |
| `hover:bg-orange-600/700`                                                  | `hover:bg-primary-dark`                                           |
| `bg-orange-50` / `bg-orange-100` / `hover:bg-orange-50`                    | `bg-accent` / `hover:bg-accent`                                   |
| `text-orange-500/600/700`                                                  | `text-primary-ink`                                                |
| `text-orange-900`                                                          | `text-navy`                                                       |
| `hover:text-orange-600`, `group-hover:text-orange-700`                     | `hover:text-primary-dark`, `group-hover:text-primary-dark`        |
| `border-orange-200/400/500/600`                                            | `border-primary`                                                  |
| `focus:ring-orange-500`, `ring-orange-600`, `focus-within:ring-orange-500` | `focus:ring-primary`, `ring-primary`, `focus-within:ring-primary` |
| `focus:border-orange-500`, `focus-within:border-orange-500`                | `focus:border-primary`, `focus-within:border-primary`             |
| `from-orange-400 to-orange-600`                                            | `from-primary-light to-primary-dark`                              |
| `from-orange-500 to-amber-600`                                             | `from-primary to-primary-dark`                                    |
| `from-primary to-orange-600`                                               | `from-primary to-primary-dark`                                    |
| `via-orange-200`                                                           | `via-primary`                                                     |
| `shadow-orange-200/300`, `shadow-orange-500/30`                            | dropped; `shadow-lg` retained/restored                            |

### `text-orange-900` → `text-navy` (not `text-primary-ink`)

`text-orange-900` was only ever used for near-black heading/value text sitting on a
pale `orange-50` panel. Mapping it to `text-primary-ink` would have flattened it into
the same gold as the surrounding body text and lost the visual hierarchy. Deep navy on
a pale gold wash keeps the hierarchy, is on-brand, and has far better contrast
(roughly 15:1 vs ~5:1). Affects `booking/ExtrasStep.tsx` and `booking/PaymentStep.tsx`.

## Contrast fixes beyond simple substitution

Gold is a light colour. Every place where white text or a white icon sat on a gold
surface was corrected. These are changes to classes that were _already_ using theme
tokens — i.e. not part of the orange count, but the same bug class.

1. **`bg-primary` + `text-white` → `text-primary-foreground`** (~1.9:1 → ~8.6:1).
   This is the live Sign-up button bug. Fixed in `layout/Header.tsx` (4 CTAs: desktop
   sign-up ×2, mobile sign-up ×2), `layout/Footer.tsx` newsletter button,
   `dashboard/DashboardLayout.tsx` "Book a Car" + mobile FAB,
   `home/FeaturedVehicles.tsx` (6 category badges + browse CTA),
   `vehicles/VehicleCard.tsx` (6 category badges + book button),
   `vehicles/ReviewForm.tsx`, `vehicles/ReviewList.tsx`,
   `booking/PromoCodeInput.tsx`, `booking/ExtensionModal.tsx`,
   `booking/DateLocationStep.tsx` (step badges),
   `booking/DocumentUploadStep.tsx`, `booking/ExtrasStep.tsx` (icon tile),
   `home/QuickPricingWidget.tsx`.

2. **Gold gradients carrying white text.** `loyalty/PointsCard.tsx` (whole card),
   `dashboard/DashboardLayout.tsx` pending-booking banner,
   `booking/PaymentStep.tsx` submit button, `booking/ExtrasStep.tsx` "Recommended"
   badge — all switched to `text-primary-foreground`. In the dashboard banner this
   also required converting the nested `text-white/80` and `hover:text-white` on the
   sub-copy and Dismiss button to `text-primary-foreground/80` /
   `hover:text-primary-foreground`, and the white icon inside the logo tile.

3. **White icons on gold.** `booking/ExtrasStep.tsx` selected-checkbox `<Check>` was
   `text-white` inside a now-gold box → `text-primary-foreground`.
   `dashboard/DashboardLayout.tsx` logo `<Car>` likewise.

4. **`text-primary` (raw gold) used as text on white → `text-primary-ink`**, on lines
   I was already editing: `home/FAQ.tsx:144`, `home/FeaturedVehicles.tsx:173`,
   `booking/PromoCodeInput.tsx:102`, `vehicles/FilterSidebar.tsx:129`, and all six
   `home/WhyChooseUs.tsx` icon tiles (gold-on-pale-gold was the worst of these).
   Also `dashboard/DashboardLayout.tsx:184` — a white button whose label was
   `text-primary` — now `text-primary-ink`.

5. **Checkbox/radio fills** (`text-orange-600` on a native input sets the _checked
   background_, with a white checkmark drawn on it). Mapped to `text-primary-ink`
   rather than `text-primary` so the white glyph stays legible (~5.6:1 instead of
   ~1.9:1). Affects `forms/FormField.tsx:201`,
   `booking/CustomerInfoStep.tsx:214`, `booking/DateLocationStep.tsx:171`.

6. **Coloured shadows dropped, elevation preserved.** `shadow-orange-200/300` and
   `shadow-orange-500/30` were removed. Where removing them would also have removed
   the accompanying `shadow-lg`, `shadow-lg` was explicitly restored, so the four
   Header CTAs, `vehicles/VehicleCard.tsx`, `vehicles/ReviewForm.tsx` and
   `booking/ExtensionModal.tsx` buttons keep their elevation.

## Judgement calls on ambiguous colours

### Amber converted to gold (decorative, not semantic)

- **`booking/ExtrasStep.tsx:201–205` — "Insurance Coverage" info box.**
  `bg-amber-50 border-amber-200` with an `Info` icon. The copy is purely
  informational ("All rentals include basic liability insurance…") — no caution,
  no consequence. The amber was chosen back when the brand was orange, i.e. it is
  brand-adjacent decoration. Converted to `bg-accent` / `border-primary` /
  `text-primary-ink`, heading to `text-navy`. Leaving it amber next to the now-gold
  "Selected Extras Total" panel directly above would have read as a stale-orange bug.
  **This is the call I'd most expect pushback on** — if the intent was "advisory
  notice", reverting this one block is a two-line change.

- **`booking/PaymentStep.tsx:249` — "Additional Driver" extras chip.**
  Part of a purely categorical chip set (green / blue / pink / amber) that labels
  which extras were selected. The amber carries no warning meaning — it is the fourth
  colour in a decorative rotation. Converted to `bg-accent text-accent-foreground`.
  The green / blue / pink siblings were left untouched.

### Amber deliberately kept (semantic warning)

- **`booking/PaymentStep.tsx:266–276` — Demo Mode toggle.**
  "Skip actual payment processing for testing" is a genuine warning about the payment
  flow being bypassed. All five amber classes kept (`bg-amber-50`, `border-amber-200`,
  `border-amber-300`, `text-amber-600` ×2, `text-amber-800`, `focus:ring-amber-500`).

- **`vehicles/AvailabilityBadge.tsx:20–21` — "Limited" status.**
  Sits in an explicit green / amber / red status scale alongside "Available" and
  "Unavailable". Purely semantic. Kept (4 classes).

### Blue

No blue was changed. The only blues in scope are `booking/PaymentStep.tsx:239`
(`bg-blue-100 text-blue-700`, GPS Navigation chip) and
`home/QuickPricingWidget.tsx` glass surfaces. The GPS chip is part of the same
categorical set as the amber chip above; I left it because blue does not read as
stale-orange the way amber does next to gold, and the brief said to leave info-blue
alone. If the whole extras-chip set should become monochrome brand, that's a
follow-up.

## Deliberately left

### `loyalty/TierProgress.tsx` — 8 classes, untouched

BRONZE uses `amber-*`, SILVER `gray-*`, GOLD `yellow-*`, PLATINUM `purple-*`. These
are **categorical loyalty-tier identity colours representing metals**, not brand
chrome. Two reasons for leaving them:

1. Mapping the GOLD tier onto the brand gold tokens would put it visually adjacent to
   the BRONZE tier's amber, and `bg-accent` vs `bg-amber-100` are close enough that
   the two tiers would become hard to distinguish at a glance.
2. It would also make the GOLD tier indistinguishable from every generic brand
   surface on the page, defeating the point of a tier badge.

If the product decision is that the GOLD tier _should_ be the brand gold, the
BRONZE tier needs a different hue at the same time. Flagging rather than guessing.

### Pre-existing `text-primary` on white surfaces — NOT swept

There are roughly 30 more instances of `text-primary` (raw gold, ~1.9:1 on white)
across `home/CTASection.tsx`, `home/HeroSection.tsx`, `home/TrustBadges.tsx`,
`home/FAQ.tsx` (lines 55, 62, 100), `home/FeaturedVehicles.tsx` (82, 140, 146),
`home/WhyChooseUs.tsx` (58, 86), `layout/Header.tsx` hover states,
`vehicles/FilterSidebar.tsx:120`, `booking/ExtensionModal.tsx:175`,
`home/QuickPricingWidget.tsx:291`.

These already use theme tokens — they were not part of the hardcoded-class task — and
several of them are on navy or dark-glass backgrounds where gold text is _correct_ and
high-contrast. Sweeping them blindly would have broken those. I only converted the
ones on lines I was already editing. **This is a real, remaining accessibility gap and
should be a separate, context-checked pass** — each instance needs its background
determined individually.

Also unchanged: `bg-primary/10 text-primary` pill badges (FAQ, FeaturedVehicles,
WhyChooseUs, Testimonials, HowItWorks, FilterSidebar). Gold text on a 10% gold tint is
poor contrast, but these were pre-existing token usage and fall in the same follow-up.

### Everything else

All `red-*`, `green-*`, `pink-*`, `purple-*`, `gray-*` and `slate-*` classes left
entirely alone, as instructed.

## Nothing failed

Every verification step ran and passed. No edits were made outside
`apps/web/src/components/`.
