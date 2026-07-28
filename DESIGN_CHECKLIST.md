---
title: Design & Rebrand Checklist
aliases: [Design Checklist, Rebrand, Color Scheme]
tags: [design, branding, colors, frontend, checklist]
created: 2026-07-28
description: Everything needed to move Gem Car Rentals from the current orange theme to the gold-and-navy brand, fix the missing logo, and close remaining design gaps.
related: ['[[INFRASTRUCTURE]]', '[[BUGFIX_CHECKLIST]]', '[[WEBSITE_AUDIT]]']
---

# Design & Rebrand Checklist

Nothing here is done yet. Ordered so the highest-impact, lowest-risk work comes first.

---

## The brand palette

Taken from the business card and logo.

| Token          | Hex       | HSL (for CSS vars) | Use                                     |
| -------------- | --------- | ------------------ | --------------------------------------- |
| **Gold**       | `#D4AF37` | `46 65% 52%`       | Primary — buttons, links, active states |
| **Gold light** | `#F5D98B` | `43 82% 75%`       | Hover, highlights, gradient tops        |
| **Gold dark**  | `#A67C1A` | `42 73% 38%`       | Pressed states, gradient bottoms        |
| **Navy deep**  | `#0A1628` | `215 61% 10%`      | Dark sections, header, footer           |
| **Navy card**  | `#0D1B2E` | `214 56% 12%`      | Cards on dark backgrounds               |
| **Royal blue** | `#1E3A6E` | `217 57% 27%`      | Secondary actions, the diamond blue     |
| **Blue light** | `#7B9CC4` | `213 38% 63%`      | Muted text on dark backgrounds          |

**Keep unchanged:** red for errors, green for success, amber for warnings. Those carry meaning — recoloring them to gold destroys the signal.

---

## Phase 1 — Retheme the token system (fast, big visual win)

- [ ] **1.1** Update `apps/web/src/index.css` — `--primary` from orange `28 100% 56%` to gold `46 65% 52%`
- [ ] **1.2** Update `--accent`, `--ring`, and the `.dark` block to match
- [ ] **1.3** Same for `apps/admin/src/index.css`
- [ ] **1.4** Add `secondary`/`navy` tokens so blue is available as a real theme color
- [ ] **1.5** Check gold-on-white contrast — **gold is light**, so gold text on white will likely fail accessibility. Buttons may need navy text on gold, or a darker gold for text.

> ⚠️ Gold has a real accessibility problem orange didn't. `#D4AF37` on white is roughly 2.2:1 — well below the 4.5:1 minimum. Expect to use **gold backgrounds with dark text**, and a darker gold for text on light backgrounds.

---

## Phase 2 — Kill the hardcoded colors (the actual work)

**~1,195 hardcoded color classes** bypass the theme entirely. This is why the admin looks inconsistent.

| App          | Count   | Worst offenders                                                                    |
| ------------ | ------- | ---------------------------------------------------------------------------------- |
| `apps/web`   | **550** | `text-orange-600` (57), `bg-orange-600` (48), `border-orange-500` (32)             |
| `apps/admin` | **645** | `bg-green-100` (35), `bg-orange-50` (30), `bg-blue-100` (26), `bg-yellow-100` (16) |

- [ ] **2.1** Replace all `orange-*` classes with theme tokens (`bg-primary`, `text-primary`, `border-primary`)
- [ ] **2.2** Audit `blue-*` in admin — decide per case whether it's brand blue or a status color
- [ ] **2.3** Leave `red-*` / `green-*` alone where they signal error/success
- [ ] **2.4** Replace decorative `yellow-*` / `amber-*` in admin with gold tokens
- [ ] **2.5** Re-run the count to confirm it dropped to near zero

**Approach:** this is mechanical and high-volume — good work to split across parallel agents by directory, so no two touch the same file.

---

## Phase 3 — Logo and brand assets

**There are currently zero logo files.** `apps/web/public/` contains only `placeholder-car.svg`. Headers render text.

- [ ] **3.1** Export logo as SVG (preferred) or high-res PNG with transparency
- [ ] **3.2** Add `logo-full.svg` (diamond + wordmark), `logo-mark.svg` (diamond only, for tight spaces), `logo-wordmark.svg`
- [ ] **3.3** Replace the text header in `apps/web/src/components/layout/Header.tsx`
- [ ] **3.4** Same in `apps/admin/src/components/layout/Header.tsx`
- [ ] **3.5** Favicon — generate `favicon.ico`, `apple-touch-icon.png` (180px), `icon-192.png`, `icon-512.png` from the diamond mark
- [ ] **3.6** Open Graph image (1200×630) for link previews on social/text messages
- [ ] **3.7** Logo in the footer
- [ ] **3.8** Add to email templates (`server/src/lib/email.ts`)
- [ ] **3.9** Light and dark variants — gold-on-navy won't read on a white background

---

## Phase 4 — Design improvements worth doing

Observations from reviewing the live site.

### Imagery

- [ ] **4.1** **Vehicle photos are hot-linked to Unsplash.** Two already died. Own your images — either photograph the real fleet or generate them, then host in R2.
- [ ] **4.2** Hero image is generic stock. A real Mulberry-lot photo or a branded gold/navy composition would look far more legitimate.
- [ ] **4.3** No `og:image`, so shared links look bare.

### Trust and credibility

- [ ] **4.4** Testimonials section has **one fake testimonial** ("Sarah Johnson, Business Traveler"). Either use real reviews or remove it — fake testimonials read as fake.
- [ ] **4.5** Homepage still shows hardcoded marketing claims ("10,000+ Customers", "4.9 Rating") separate from the honest stats section. Reconcile them.
- [ ] **4.6** `tel:1-800-GEM-AUTO` on the homepage CTA is a **fake vanity number**. Real numbers are 813-422-4539 / 863-277-7879.

### Navigation and structure

- [ ] **4.7** **8 dead footer links** — `/terms`, `/privacy`, `/pricing` and five more. They now hit the 404 page. Build them or remove them.
- [ ] **4.8** Terms and Privacy pages aren't optional for a business taking payments and holding customer data.
- [ ] **4.9** Non-functional Google/GitHub buttons on the login page — remove or build.

### Polish

- [ ] **4.10** Consistent card treatment — currently varies between sections
- [ ] **4.11** Loading skeletons should match final layout to reduce jump
- [ ] **4.12** Focus states for keyboard navigation, in brand gold
- [ ] **4.13** Empty states with brand personality rather than plain text

---

## Phase 5 — Gaps carried over

Still open from earlier work.

- [ ] **5.1** **Stripe not configured** — payments report "not configured". Add in test mode first.
- [ ] **5.2** **Admin image upload shows false success** — `AddVehiclePage.tsx` toasts "success" even when every upload fails
- [ ] **5.3** **Backups not offsite** — same droplet as the database; up to 7 days at risk
- [ ] **5.4** **Prisma migration history doesn't match the database** — patched by hand, needs baselining before the next schema change
- [ ] **5.5** **8 legacy Supabase tables** still present; `vehicles` holds 12 orphaned rows
- [ ] **5.6** **Wallet Pass unfinished** — code committed, no migration
- [ ] **5.7** **`render.yaml` obsolete** — delete once Render is retired
- [ ] **5.8** **`react-helmet-async` not applying meta tags** — hurts SEO and link previews
- [ ] **5.9** **~2 minute hang** on any failed API call, except the vehicles page
- [ ] **5.10** **Business hours contradict** between the About page and search-engine structured data
- [ ] **5.11** **Render + Supabase still running** — decommission once confident

---

## Suggested order

1. **Phase 1** — one afternoon, transforms the whole feel
2. **Phase 3 (logo)** — biggest credibility jump per hour spent
3. **Phase 4 trust items** (4.4, 4.6, 4.7) — fake testimonial, fake phone number, dead links. Small fixes, real damage if left.
4. **Phase 2** — the grind. Parallelizable.
5. **Phase 4 imagery** — owned photos instead of rented stock
6. **Phase 5** — as time allows

## What's needed from you

- **Logo files** — SVG if you have them, otherwise the highest-resolution PNG
- **Confirm the palette** above matches what you see in the card
- **Decide on the testimonial** — real reviews, or remove?
- **Terms/Privacy** — write them, use a generator, or have a lawyer draft them
