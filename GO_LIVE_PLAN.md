---
title: Go-Live Plan
aliases: [Go Live, Launch Plan, Real Data Migration]
tags: [launch, data, rebrand, checklist]
created: 2026-07-28
description: What stands between the current demo site and a real Gem Car Rentals business site — replacing mock data, completing the rebrand, and the decisions only the owner can make.
related: ['[[DESIGN_CHECKLIST]]', '[[BUGFIX_CHECKLIST]]', '[[INFRASTRUCTURE]]']
---

# Go-Live Plan

**Goal: a real, bookable Gem Car Rentals site.**

---

## What's actually in the database right now

Everything below is seed data. Verified 2026-07-28.

### Vehicles — all 8 are fake

| Vehicle               | Rate | Plate      |
| --------------------- | ---- | ---------- |
| Nissan Versa          | $45  | `ABC-1234` |
| Toyota Camry          | $65  | `DEF-5678` |
| Honda CR-V            | $85  | `GHI-9012` |
| BMW 3 Series          | $120 | `JKL-3456` |
| Tesla Model 3         | $130 | `MNO-7890` |
| Chevrolet Suburban    | $140 | `PQR-1234` |
| Ford Mustang          | $150 | `STU-5678` |
| Mercedes-Benz S-Class | $250 | `VWX-9012` |

**The plates are sequential** — `ABC-1234`, `DEF-5678`, `GHI-9012`… That's the tell. These are placeholders, and the photos are hot-linked stock images of cars you don't own.

### Users — 4 of 8 are test accounts

| Email                      | Verdict                    |
| -------------------------- | -------------------------- |
| `customer@example.com`     | ❌ delete                  |
| `testuser@example.com`     | ❌ delete                  |
| `doctest@test.com`         | ❌ delete                  |
| `testadmin@test.com`       | ❌ delete                  |
| `admin@gemautorentals.com` | ⚠️ old brand name — decide |
| `devonsmartjr@gmail.com`   | ❓ real person?            |
| `thedamdocta@gmail.com`    | ❓ real person?            |
| `biggkingg1998@gmail.com`  | ✅ your admin — keep       |

### Bookings — all 5 are fake

One literally has the ID `sample-booking`. Three are cancelled. All reference fake vehicles and test customers.

**Good news:** deleting this is safe. Deploys do **not** re-run the seed script, so cleaned data stays clean.

---

## 🔴 The one thing blocking "live today"

**I cannot invent your fleet.** To list a real car I need, per vehicle:

| Required                            | Why                                          |
| ----------------------------------- | -------------------------------------------- |
| Year, make, model                   | Obvious                                      |
| **Daily rate**                      | You set the price                            |
| **License plate**                   | Currently fake                               |
| **VIN**                             | Currently fake                               |
| Category, seats, transmission, fuel | Affects filtering                            |
| Mileage, colour                     | Shown on the listing                         |
| **Photos**                          | Currently stock images of cars you don't own |

Send me this as a list, a spreadsheet, a photo of a sheet of paper — anything. **The moment I have it, the site becomes real.** Until then it's a demo with your branding on it.

**Photos matter most.** Customers rent the car they see. Phone photos of your actual cars beat stock images of similar models — and stock images will keep breaking (two already did).

---

## Track A — I can do right now, no input needed

- [ ] **A1** Rename **90 occurrences** of "Gem Auto Rentals" → "Gem Car Rentals" across both apps, the API, SEO tags, structured data, and email templates
- [ ] **A2** Swap the admin logo to the new mark
- [ ] **A3** Delete the 4 test users, the 5 fake bookings, and any orphaned records
- [ ] **A4** Delete the 8 legacy Supabase tables (all empty except `vehicles`, which holds 12 orphaned rows)
- [ ] **A5** Add favicon + Open Graph image from the diamond mark, so links shared by text/social look right
- [ ] **A6** Fix the admin "false success" bug — image uploads report success even when they fail
- [ ] **A7** Baseline the Prisma migrations so schema drift stops recurring
- [ ] **A8** Delete the obsolete `render.yaml`

**Note on the domain:** the site lives at `gemrentalcars.com`. Renaming the _company_ to Gem Car Rentals is text-only and safe. Changing the _domain_ is a separate job we already scoped and shelved.

---

## Track B — needs your fleet data

- [ ] **B1** You send vehicle details + photos
- [ ] **B2** I upload photos to your R2 storage (so they're yours and can't break)
- [ ] **B3** I replace all 8 fake vehicles with your real fleet
- [ ] **B4** Verify each listing end-to-end on the live site

---

## Track C — decisions only you can make

- [ ] **C1** **Stripe.** Currently unconfigured — the site cannot take card payments. Options: (a) add keys and test properly, (b) launch taking reservations only and collect payment in person. Option (b) is legitimate and many small rental businesses work that way.
- [ ] **C2** **Terms of Service + Privacy Policy.** You're storing customer data and driver's licences. These aren't optional, and their footer links are currently dead. I can draft plain-language starting versions, but a lawyer should review before you rely on them.
- [ ] **C3** **The two unknown gmail accounts** — real customers or your testing?
- [ ] **C4** **The fake testimonial** — you said leave it for now. It stays until you say otherwise.
- [ ] **C5** **`admin@gemautorentals.com`** — keep, rename, or delete?

---

## Honest read on "live today"

**Achievable today:** rebrand complete, all test data gone, real fleet listed, customers can browse and submit a booking request.

**Not achievable today without decisions:** card payments (needs Stripe), and Terms/Privacy (needs real legal text).

**The bottleneck is your fleet data, not engineering.** Everything in Track A is a few hours of work I can start immediately. Track B is fast once the data arrives — under an hour for 8–10 vehicles.

---

## Suggested sequence

1. **Now:** I start Track A while you gather fleet details and photos
2. **On arrival:** Track B — real vehicles replace the fakes
3. **Before announcing:** decide C1 (payments) and C2 (legal pages)
4. **After launch:** remaining polish from [[DESIGN_CHECKLIST]]
