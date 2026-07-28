---
title: 'Recolor — apps/web/src/pages (orange → gold + navy)'
aliases: ['Web pages recolor', 'Gold rebrand: web pages']
tags: [fix-report, rebrand, theming, accessibility, web]
created: 2026-07-28
description: 'Replaced all hardcoded orange Tailwind utilities in apps/web/src/pages with gold/navy theme tokens, and fixed the white-on-gold contrast failures introduced by the rebrand.'
related:
  - '[[recolor-web-components]]'
  - '[[contact-and-404]]'
  - '[[vehicles-error-state]]'
  - '[[DESIGN_CHECKLIST]]'
---

# Recolor — `apps/web/src/pages`

Scope was limited to `apps/web/src/pages/**` as instructed. Nothing under
`apps/web/src/components` or `apps/admin` was touched. No commits, no pushes,
no `.env` edits, no dev servers left running (ports 3000/5173/5174 verified idle).

## Result

| Check                                         | Result                                            |
| --------------------------------------------- | ------------------------------------------------- |
| `pnpm --filter web typecheck`                 | **clean**                                         |
| `pnpm --filter web lint` (`--max-warnings 0`) | **clean**                                         |
| `pnpm --filter web build`                     | **succeeds**                                      |
| `pnpm --filter web test`                      | **73/73 pass** (identical to pre-change baseline) |

Baseline was captured before any edits (typecheck clean, 73/73 tests) so the
"no regressions" claim is a real comparison, not an assumption.

### Before / after counts

`grep -roE '(bg|text|border|from|to|via|ring|shadow)-(orange|amber|yellow)-[0-9]{2,3}' apps/web/src/pages --include='*.tsx' | wc -l`

- **Before: 174**
- **After: 19**

Note: the brief estimated ~197. The actual starting count in `pages/` was 174 —
either the estimate was across a wider tree, or some had already been migrated.

**All 19 remaining are `amber-*`/`yellow-*` that were deliberately preserved** —
zero `orange` references remain anywhere in `pages/` (`grep -rc orange` → 0 in every file).

## Files changed (20)

`AboutPage.tsx`, `BookingConfirmationPage.tsx`, `BookingPage.tsx`, `ContactPage.tsx`,
`NotFoundPage.tsx`, `VehicleDetailPage.tsx`, `VehiclesPage.tsx`,
`auth/ForgotPasswordPage.tsx`, `auth/LoginPage.tsx`, `auth/RegisterPage.tsx`,
`auth/ResetPasswordPage.tsx`, `dashboard/DocumentsPage.tsx`, `dashboard/FavoritesPage.tsx`,
`dashboard/LoyaltyPage.tsx`, `dashboard/MyBookingsPage.tsx`, `dashboard/PaymentMethodsPage.tsx`,
`dashboard/ProfilePage.tsx`, `dashboard/ReferralPage.tsx`.

(`HomePage.tsx` had no hardcoded colours and was left untouched.)

## Mappings applied

| From                                                                       | To                                                                  |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `bg-orange-500/600/700`                                                    | `bg-primary`                                                        |
| `hover:bg-orange-500/600/700`                                              | `hover:bg-primary-dark`                                             |
| `bg-orange-50/100`                                                         | `bg-accent`                                                         |
| `text-orange-500/600/700/900`                                              | `text-primary-ink`                                                  |
| `border-orange-200/500/600`                                                | `border-primary`                                                    |
| `ring-orange-100/500`, `focus:ring-orange-*`, `focus-within:ring-orange-*` | `ring-primary` / `focus:ring-primary` / `focus-within:ring-primary` |
| `focus:border-orange-500`, `focus-within:border-orange-500`                | `focus:border-primary`, `focus-within:border-primary`               |
| `shadow-orange-100/200/300` (incl. `hover:`)                               | **removed** (coloured shadow dropped, `shadow-lg` kept)             |
| `from-orange-500 to-amber-500/600`                                         | `from-primary-light to-primary-dark`                                |
| `hover:from-orange-600 hover:to-amber-700`                                 | `hover:from-primary hover:to-primary-dark`                          |
| `from-primary to-orange-600`                                               | `from-primary-light to-primary-dark`                                |

## Contrast fixes

This was the bulk of the non-mechanical work. Gold `#D4AF37` measures **2.12:1**
against white — it fails AA for text _and_ the 3:1 minimum for graphics. `primary-ink`
`#8A6715` measures **5.15:1** and passes.

### 1. `text-white` on gold → `text-primary-foreground` (37 sites)

White on gold is ~1.9:1. Every gold-background button, badge and gradient card that
carried `text-white` now uses `text-primary-foreground` (deep navy, ~12:1 on gold).

- 27 same-line cases (`bg-primary … text-white`) across BookingConfirmationPage,
  BookingPage, ContactPage, NotFoundPage, VehicleDetailPage, VehiclesPage,
  DocumentsPage, FavoritesPage, LoyaltyPage, MyBookingsPage, PaymentMethodsPage,
  ProfilePage, ReferralPage.
- 8 multi-line `cn()` cases where `text-white` and `bg-primary` sat on different
  array elements and a same-line scan would have missed them:
  `auth/ForgotPasswordPage.tsx` (2), `auth/LoginPage.tsx`, `auth/RegisterPage.tsx`,
  `auth/ResetPasswordPage.tsx` (4, incl. the three gradient buttons).
- 2 icons sitting inside gold containers: the `<Car>` logo mark in the
  `ResetPasswordPage` gradient tile, and the `<Check>` in the `VehicleDetailPage`
  extras checkbox (`bg-primary border-primary`).

### 2. `text-primary` on light backgrounds → `text-primary-ink` (52 sites)

Pre-existing `text-primary` (raw gold) used as _text or icon colour on white_ was
already failing before this task — the rebrand made it visible. Converted across all
page files. Deliberately **kept** as `text-primary` in 5 places where the background
is dark and gold is correct and high-contrast: the navy hero panels in
`auth/LoginPage.tsx` (lines ~400, ~417) and `auth/RegisterPage.tsx` (lines ~472, ~491).

### 3. Hover states

Two hover mappings I initially generated failed contrast, so I revised them:

- `text-primary-ink hover:text-primary-dark` → `hover:text-primary-dark` is **3.68:1**
  (`primary-dark` at 38% lightness is _lighter_ than `primary-ink` at 33%, so the
  mechanical mapping actually brightened the link on hover). Changed 6 text links to
  `hover:underline` instead — which is also the convention already used by sibling
  links in those same files (`ContactPage:197/286`, `RegisterPage:393/397`,
  `VehicleDetailPage:555`, `DocumentsPage:335`), and removes a colour-only hover cue.
  Files: `VehiclesPage.tsx` (2), `auth/LoginPage.tsx` (2), `auth/RegisterPage.tsx`,
  `auth/ForgotPasswordPage.tsx`.
- `hover:bg-primary-light` under `text-primary-ink` is **3.4:1**. Changed to
  `hover:bg-accent` for the two transparent chips (`ProfilePage:169`,
  `MyBookingsPage:346`) and `hover:bg-primary/20` for the two that already sit on
  `bg-accent` and need a visible step-up (`DocumentsPage:260`, `PaymentMethodsPage:506`).

`text-primary-ink` on `bg-accent` measures ~4.58:1 — passes AA for normal text.

### 4. `VehiclesPage.tsx` error-state card (specifically flagged)

Lines ~415–430. Two real failures found and fixed:

- `<AlertTriangle className="text-primary …">` inside a `bg-primary/10` circle —
  gold icon on a ~pale-gold-over-white disc, roughly **2.1:1**, below the 3:1 graphics
  minimum. Now `text-primary-ink`.
- The "Try Again" button was `bg-primary … text-white` (**1.9:1**). Now
  `text-primary-foreground`, and its `shadow-orange-200` was dropped.

Headline and body copy in that card are `text-gray-900` / `text-gray-500` and were
already fine.

### 5. `ContactPage.tsx` / `NotFoundPage.tsx` (specifically flagged)

Both were consistent with each other but both leaned on raw `text-primary` for
icons and links on white, plus `bg-orange-50/100` chips and one `bg-primary` +
`text-white` CTA each. All now on tokens:

- Contact/404 icon tiles: `bg-orange-50` → `bg-accent`, icons `text-primary` → `text-primary-ink`.
- Eyebrow pills: `bg-orange-100 text-primary` → `bg-accent text-primary-ink`.
- The 404's big `404` numeral and `<Compass>` glyph → `text-primary-ink`.
- Primary CTAs on both pages → `bg-primary text-primary-foreground hover:bg-primary-dark`.
- `NotFoundPage` secondary button's `hover:text-primary` → `hover:text-primary-ink`
  (it sits on `bg-white`).

They remain visually consistent with each other after the change.

## Judgement calls

1. **Card-network brand colours are not our brand.** `dashboard/PaymentMethodsPage.tsx`
   had a `cardBrands` map: `visa: bg-blue-600`, `mastercard: bg-orange-500`,
   `amex: bg-blue-800`, `discover: bg-orange-600`, `default: bg-gray-600`. A blanket
   orange→gold sweep turned Mastercard _and_ Discover into identical gold swatches —
   wrong semantically and it destroyed the visual distinction between the two.
   I set them to the actual network hexes, `bg-[#EB001B]` (Mastercard) and
   `bg-[#FF6000]` (Discover), with a comment explaining they intentionally bypass the
   theme. These are the only arbitrary-value colour classes in `apps/web/src`.
   **Flag for review** if you'd rather they went to a neutral token instead.

2. **Loyalty tier colours left alone.** `dashboard/LoyaltyPage.tsx` has
   `BRONZE: text-amber-600 bg-amber-100` / `GOLD: text-yellow-600 bg-yellow-100`
   (alongside silver/platinum). These are medal-metal semantics on an ordered scale;
   recolouring just the gold tier to `primary` would break the progression. Left as-is.
   Worth a design decision later — "GOLD tier" rendering in yellow while the brand
   gold is `#D4AF37` is a mild oddity.

3. **Star ratings kept as raw gold.** `VehicleDetailPage.tsx:305`
   (`text-primary fill-primary` vs `text-gray-200 fill-gray-200`) is technically
   2.12:1 for a graphical element. Gold stars are the canonical pattern, the empty/filled
   distinction is carried by the paired grey, and the numeric rating sits adjacent as
   text. Left unchanged — noting it rather than silently "fixing" a deliberate look.

4. **Amber/yellow warnings untouched, per brief.** All 19 survivors are genuine
   warning/status/categorical usage: expired-document callouts and badges
   (`DocumentsPage`), pending-booking status pill (`MyBookingsPage`), the
   "What to bring at pick-up" caution box and the "Additional Driver" extras chip
   (`BookingConfirmationPage` — that one is categorical, sitting next to a pink
   "Child Seat" chip), and the loyalty tier scale.

5. **Coloured shadows dropped, not remapped.** Per the brief. Where a
   `shadow-lg shadow-orange-200` pair existed, `shadow-lg` was kept so the elevation
   survives; `VehicleDetailPage:532` had only coloured shadows and now has none.

6. **Checkbox accent colours unified.** `auth/LoginPage.tsx` and `auth/RegisterPage.tsx`
   used `text-primary` on checkbox inputs while `PaymentMethodsPage` used `text-orange-600`.
   All three are now `text-primary-ink` — consistent and the darker of the two.

7. **Gradient hover direction.** `from-primary-light to-primary-dark` with
   `hover:from-primary hover:to-primary-dark` — only the `from` stop shifts on hover,
   which is enough of a visible change without inverting the light→dark direction.

## Nothing left outstanding in scope

Zero orange references remain. All four verification commands run and pass. The only
open items are the two design questions flagged above (card-brand hexes, GOLD loyalty
tier) — both are deliberate, documented decisions rather than unfinished work.
