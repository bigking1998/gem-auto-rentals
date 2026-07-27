---
title: Fix Report — Broken Vehicle Photos
aliases: [vehicle-images-fix]
tags: [fix-report, web, database, images]
created: 2026-07-25
description: Added missing image fallback placeholder and repaired two dead Unsplash vehicle image URLs in the Supabase DB.
related: []
---

# Fix Report — Broken Vehicle Photos

Date: 2026-07-25

## Part A — Fallback placeholder

The `fallback` prop of `LazyImage`/`EagerImage` defaulted to `/placeholder-car.jpg`, which did not exist in `apps/web/public/`, so failed images rendered a blank box.

### Files created

- `apps/web/public/placeholder-car.svg` — new SVG placeholder: neutral gray gradient background (gray-100/200), simple car silhouette in gray-400/500 with an orange headlight accent matching the brand primary (`hsl(28 100% 56%)` ≈ `#ff941f`), "Image coming soon" + "Gem Auto Rentals" text, 800x600 (4:3), `role="img"` with aria-label. SVG chosen deliberately — an SVG saved as `.jpg` would be served with the wrong MIME type.

### Files changed

- `apps/web/src/components/ui/LazyImage.tsx` — both fallback defaults (`LazyImage` line 24, `EagerImage` line 106) changed `'/placeholder-car.jpg'` → `'/placeholder-car.svg'`.
- `apps/web/src/pages/dashboard/FavoritesPage.tsx` — line 133 inline fallback `'/placeholder-car.jpg'` → `'/placeholder-car.svg'`.

These were the only source references to `placeholder-car` in `apps/web` and `apps/admin` (remaining hits are in built `apps/web/dist/` output only, regenerated on next build; `apps/admin` had none).

### Verification

- `pnpm --filter web typecheck` — passed with no errors.

## Part B — Dead vehicle image URLs in DB

Live Supabase Postgres via `DATABASE_URL` in `server/.env`, updated through the server package's Prisma client with a one-off tsx script. Only the `images` field of the two affected rows was touched; no other rows, fields, or schema changes.

### URL mapping (with HTTP statuses)

| Vehicle      | DB id                       | Old URL (images[0])                                                  | Old status | New URL (images[0])                                                  | New status |
| ------------ | --------------------------- | -------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------- | ---------- |
| Ford Mustang | `cmklsannx0006gag5put01pdm` | `https://images.unsplash.com/photo-1584345604476-8ec5f82bd3c2?w=800` | 404 (dead) | `https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800` | 200        |
| Honda CR-V   | `cmklsamw90003gag5hhhvwzc1` | `https://images.unsplash.com/photo-1568844293986-ca9c5c1f1f34?w=800` | 404 (dead) | `https://images.unsplash.com/photo-1708148246994-b7b3c818090d?w=800` | 200        |

Both replacements were verified via `curl -I` (HTTP 200) **and** downloaded and visually inspected before writing to the DB:

- Mustang replacement: front view of a gray Ford Mustang (pony badge visible).
- CR-V replacement: white 2023 Honda CR-V (Honda badge visible), tagged "Honda CRV 2023" on Unsplash.

Both vehicles had exactly one image in their `images` array, so the update replaced `images[0]` with no other elements affected.

### DB update confirmation

Script output (before/after):

```
BEFORE cmklsannx0006gag5put01pdm Ford Mustang: ["https://images.unsplash.com/photo-1584345604476-8ec5f82bd3c2?w=800"]
AFTER  cmklsannx0006gag5put01pdm Ford Mustang: ["https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800"]
BEFORE cmklsamw90003gag5hhhvwzc1 Honda CR-V: ["https://images.unsplash.com/photo-1568844293986-ca9c5c1f1f34?w=800"]
AFTER  cmklsamw90003gag5hhhvwzc1 Honda CR-V: ["https://images.unsplash.com/photo-1708148246994-b7b3c818090d?w=800"]
```

Post-update re-query of all 8 vehicles, each URL checked via `curl -I` — **all 8 return HTTP 200**:

| Vehicle               | URL                              | Status          |
| --------------------- | -------------------------------- | --------------- |
| BMW 3 Series          | photo-1555215695-3004980ad54e    | 200 (untouched) |
| Chevrolet Suburban    | photo-1533473359331-0135ef1b58bf | 200 (untouched) |
| Ford Mustang          | photo-1494976388531-d1058494cdd8 | 200 (updated)   |
| Honda CR-V            | photo-1708148246994-b7b3c818090d | 200 (updated)   |
| Mercedes-Benz S-Class | photo-1618843479313-40f8afb4b4d8 | 200 (untouched) |
| Nissan Versa          | photo-1549317661-bd32c8ce0db2    | 200 (untouched) |
| Tesla Model 3         | photo-1560958089-b8a1929cea89    | 200 (untouched) |
| Toyota Camry          | photo-1621007947382-bb3c3994e3fb | 200 (untouched) |

### Script disposition

The one-off script (`server/scripts/fix-dead-image-urls.ts`) was **deleted** after successful execution. It hardcoded the two dead URLs as a safety guard (it refused to touch a row unless `images[0]` exactly matched the known-dead URL), so it has no durable reuse value — re-running it now would just skip both rows.

## Unresolved / notes

- Nothing unresolved.
- `apps/web/dist/` still contains the old built bundle referencing `/placeholder-car.jpg`; it will pick up the new fallback on the next build (no build was run, per task constraints about servers/commits).
- Nothing was committed; no `.env` files touched; no dev servers started.
