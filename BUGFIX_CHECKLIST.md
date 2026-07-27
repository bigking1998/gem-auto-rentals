# Gem Auto Rentals — Bug Fix Checklist

Derived from [WEBSITE_AUDIT.md](WEBSITE_AUDIT.md) §15.

> **STATUS as of 2026-07-26 — 8 of 14 items fixed and verified.** Fix work was done by parallel agents; per-item reports are in `fix-reports/`. Verification of the whole tree afterwards (run in the main session): typecheck 6/6 packages clean · lint web **0 problems** · lint admin **0 problems** · server tests **76/76** · web tests **73/73** · full build succeeds · all three apps start · database connected · all 8 vehicle image URLs return HTTP 200 · `/contact`, `/404`, and the stats section confirmed rendering correctly in a browser.
>
> The 6 remaining items are the ones needing your decision or a credential — see "Still open" at the bottom. Several **new** issues were discovered during the work and are listed there too.

Each item has:

- **Ready?** — Yes (an agent can pick this up and finish it unattended) / Needs input first (a decision or a credential only you can provide) / Needs care (technically an agent could do it, but it touches something risky enough to want your eyes on the result before it's considered done).
- **Files** — so we can see which items would collide if worked on at the same time.
- **Depends on** — anything that should happen first.

---

## Critical

- [ ] **1. Stripe key mismatch** — `server/.env` has a live publishable key (`pk_live_...`) paired with a secret key that isn't in valid Stripe format.
      **Ready?** Needs input first — only you (or whoever owns the Stripe account) can say which keys are actually correct. Once you have the real test-mode keys, the file edit itself is trivial (same pattern as the `DATABASE_URL` swap).
      **Files:** `server/.env`
      **Depends on:** nothing — this can happen anytime, doesn't block other items.

## High

- [x] ~~2. Broken vehicle images~~ **✅ FIXED — placeholder SVG added; both dead photos replaced (new URLs visually confirmed as a real Mustang and CR-V); all 8 image URLs verified HTTP 200. Report: fix-reports/vehicle-images.md**
      ORIGINAL: **2. Broken vehicle images** — 2 of 8 cars (Ford Mustang, Honda CR-V) link to dead Unsplash photos, and the fallback placeholder image doesn't exist in the project.
      **Ready?** Yes — an agent can add a real placeholder image and swap in working photo URLs.
      **Files:** `apps/web/public/placeholder-car.jpg` (new file), vehicle image URLs (likely via a seed script or a direct update against the now-working Supabase database)
      **Depends on:** nothing.

- [x] ~~3. Homepage stats stuck at "0"~~ **✅ FIXED — but the real bug was different and worse than described: the site was rendering FABRICATED numbers ("99.9% Satisfaction", "50,000+ Completed Rentals") to real visitors. The "0" symptom was partly an artifact of the audit's own frozen browser pane. Now shows only real values (6 customers / 8 years / 8 vehicles), dropping empty metrics instead of substituting fake ones. NOTE: the agent also changed the section heading from "Trusted by Thousands" to "By the Numbers" — a content decision you may want to review. Report: fix-reports/stats-counter.md**
      ORIGINAL: **3. Homepage stats stuck at "0"** — real data comes back from the API, but the animated counter never displays it.
      **Ready?** Yes — self-contained frontend bug.
      **Files:** `apps/web/src/components/home/Statistics.tsx`
      **Depends on:** nothing.

- [x] ~~4. Admin login page has a hardcoded personal email~~ **✅ FIXED — now `useState('')`. Report: fix-reports/admin-email-husky.md**
      ORIGINAL: **4. Admin login page has a hardcoded personal email** as the default form value.
      **Ready?** Yes — one-line change.
      **Files:** `apps/admin/src/pages/LoginPage.tsx`
      **Depends on:** nothing.

- [x] ~~5. `/contact` link is completely dead~~ **✅ FIXED — real ContactPage + NotFoundPage created and routed. Uses only real contact details found in the codebase; no fake form (mailto: hand-off, honest wording). Report: fix-reports/contact-and-404.md**
      ORIGINAL: **5. `/contact` link is completely dead** — no page, no 404 fallback either.
      **Ready?** Yes — either build a real contact page or point the link elsewhere, plus add a catch-all 404 route (the admin app already has one to copy the pattern from).
      **Files:** `apps/web/src/App.tsx`, `apps/web/src/components/layout/Footer.tsx`, possibly a new `ContactPage.tsx`
      **Depends on:** nothing.

- [ ] **6. `render.yaml` is out of sync with the uncommitted storage code** — code expects 3 new R2 env vars, deploy config still only has the old one.
      **Ready?** Needs care — the file edit is easy, but this is tangled up with whether the in-progress storage change (#2's "move off hot-linked images" follow-up) is even being finished right now. Also, actually updating Render's live dashboard env vars is a deploy-adjacent action, not something to do unsupervised.
      **Files:** `render.yaml`, `server/src/lib/storage.ts` (already modified, uncommitted)
      **Depends on:** a decision on whether the R2 storage migration is happening now or later.

## Medium

- [x] ~~7. Vehicles listing has no error/timeout state~~ **✅ FIXED — proper loading/error/empty states with a working Try Again button, verified live with the API both down and up. Report: fix-reports/vehicles-error-state.md**
      ORIGINAL: **7. Vehicles listing has no error/timeout state** if the API ever fails again — it'll just spin forever.
      **Ready?** Yes — add a timeout + retry/error UI state to the fetch.
      **Files:** `apps/web/src/pages/VehiclesPage.tsx` (or wherever that fetch hook lives)
      **Depends on:** nothing.

- [ ] **8. Wallet Pass feature has no database migration** — the code (~780 lines) is basically done but can't run against the real database yet.
      **Ready?** Needs input first — this needs a yes/no decision from you (finish it now, or shelve it) before an agent generates a migration. Running a Prisma migration against the real database is exactly the kind of action that shouldn't happen without a clear go-ahead.
      **Files:** `server/prisma/schema.prisma`, `server/prisma/migrations/` (new migration)
      **Depends on:** your decision; should happen after #9 (`DIRECT_URL`) is fixed, since migrations use that variable.

- [ ] **9. `DIRECT_URL` still points at the old Render database**, not Supabase.
      **Ready?** Needs input first — same situation as the `DATABASE_URL` fix: needs the real Supabase **direct** connection string, which only you can get from the Supabase dashboard. Once you have it, it's a one-line swap.
      **Files:** `server/.env`
      **Depends on:** nothing, but should be done **before** #8 (Wallet Pass migration).

- [x] ~~10. Server test suite: 36 of 76 tests failing~~ **✅ FIXED — 76/76 passing. The mock bug was masking a SECOND bug (six booking tests used non-CUID ids); both fixed in test code only. Report: fix-reports/server-tests.md**
      ORIGINAL: **10. Server test suite: 36 of 76 tests failing** because two test helper functions reuse a mock that only works once.
      **Ready?** Yes — self-contained fix inside the test files.
      **Files:** `server/src/__tests__/routes/vehicles.test.ts`, `server/src/__tests__/routes/bookings.test.ts`
      **Depends on:** nothing.

- [ ] **11. Non-functional "Sign in with Google/GitHub" buttons** on the customer login page — no OAuth wired up at all.
      **Ready?** Needs a decision — quick fix is removing the buttons (an agent can do this unattended); the "real" fix (actually building Google/GitHub OAuth) is a much bigger feature, not a bug fix, and shouldn't be scoped as one without you deciding you want it.
      **Files:** `apps/web/src/pages/auth/LoginPage.tsx`
      **Depends on:** your call on remove-vs-build.

## Low

- [x] ~~12. Lint failures~~ **✅ FIXED — web and admin both now report 0 errors, 0 warnings.**
      ORIGINAL: **12. Lint failures** — 17 errors/4 warnings in `apps/web`, 9 errors/26 warnings in `apps/admin`. Mostly cosmetic unescaped quote characters in JSX text, plus two real `no-case-declarations` errors in the booking flow.
      **Ready?** Yes for the cosmetic ones. The two errors in `apps/web/src/pages/BookingPage.tsx:216,220` are in the core booking flow, so an agent fixing those should be told to be precise (wrap the case bodies in braces, don't touch surrounding logic) and this one's worth a quick look afterward.
      **Files:** many small files across both apps — see §13 of the audit for the full list. **Overlaps with #14** on two specific files (`AddVehiclePage.tsx`, `EditVehiclePage.tsx`) — see note below.
      **Depends on:** nothing, but see the overlap note.

- [x] ~~13. Husky pre-commit hook configured but never actually installed~~ **✅ FIXED — .husky/pre-commit created and wired; lint-staged will run on the next commit. Report: fix-reports/admin-email-husky.md**
      ORIGINAL: **13. Husky pre-commit hook configured but never actually installed** — lint-staged never runs on commit.
      **Ready?** Yes — standard `husky` setup step.
      **Files:** `.husky/`, `package.json`
      **Depends on:** nothing.

- [ ] **14. Two unused-variable lint errors hint at incomplete image-upload wiring** in the admin vehicle forms.
      **Ready?** Needs care — audit flagged this as "investigate first, don't blindly fix." An agent should check whether vehicle image upload actually works end-to-end in the admin app before deciding whether the fix is "wire it up properly" or "just remove the dead variable."
      **Files:** `apps/admin/src/pages/AddVehiclePage.tsx`, `apps/admin/src/pages/EditVehiclePage.tsx` — **same two files as #12's lint pass.** These two items should go to the same agent, or be sequenced, not split across two agents working in parallel.
      **Depends on:** nothing, but see the overlap note with #12.

---

## Suggested grouping for parallel agents

Fully independent, safe to run at the same time, no file overlap:

- #2 (vehicle images)
- #3 (stats bug)
- #4 (admin hardcoded email)
- #5 (/contact + 404)
- #7 (vehicles listing error state)
- #10 (test suite mock bug)
- #13 (Husky setup)

Needs a quick answer from you before an agent can start:

- #1 (which Stripe keys are real)
- #6 (is the R2 storage migration happening now?)
- #8 (finish or shelve Wallet Pass?)
- #9 (Supabase direct connection string)
- #11 (remove the social buttons, or actually build OAuth?)

Should go together (same files) rather than two agents in parallel:

- #12 + #14 — both touch `AddVehiclePage.tsx` and `EditVehiclePage.tsx`

Sequence matters:

- #9 before #8 (need the right `DIRECT_URL` before generating a migration)

---

# Still open (updated 2026-07-26)

## Waiting on your decision or a credential (from the original 14)

- **#1 Stripe keys** — need the correct key pair. Nothing payment-related should be tested until this is resolved.
- **#6 `render.yaml` / R2 env vars** — needs a decision on whether the storage migration is happening now. **This is now more urgent than it looked** — see NEW-1 below.
- **#8 Wallet Pass migration** — finish or shelve? Do #9 first.
- **#9 `DIRECT_URL`** — need the Supabase _direct_ (non-pooled) connection string.
- **#11 Social login buttons** — remove them, or build real OAuth?

## NEW issues discovered during the fix work

These were not in the original audit. None have been fixed.

- **NEW-1 (High) — Admin image upload is completely broken, and fails silently with a false success message.**
  Every upload reaches R2 storage, then dies at `server/src/routes/vehicles.ts:552` because `R2_VEHICLES_PUBLIC_URL` is undefined everywhere in the repo → 400 error. Two consequences: (a) **every failed upload strands an orphaned file in your R2 bucket** while the database is never updated; (b) `apps/admin/src/pages/AddVehiclePage.tsx:36-42` swallows the error and fires `toast.success('Vehicle added successfully')` regardless, then navigates away — so an admin uploading photos gets a green success message and a vehicle with zero images. The Edit flow surfaces the error correctly, so the two flows behave differently. Same blocker affects avatars (`customers.ts:493`) and logos (`preferences.ts:254`). This is the same root config gap as #6. Full analysis: `fix-reports/admin-upload-investigation.md`.
  _Correction to the original audit: the `_images`/`pendingFiles` unused variables flagged as "half-wired upload functionality" were a false positive — the upload code is fully wired; only the config is missing._

- **NEW-2 (Medium) — Vehicle deletion leaks files from R2 storage.**
  `server/src/routes/vehicles.ts:604-609` extracts the storage key using `split('/vehicles/')`, which matches neither the old nor the new URL format. Deletes remove the database row but leave the stored file behind. Harmless today (no R2-hosted images exist yet), will bite as soon as uploads work.

- **NEW-3 (Medium) — Every page except the vehicles listing can hang for ~2 minutes on a failed API call.**
  The shared client `apps/web/src/lib/api.ts` polls `wakeUpServer()` (15 retries, ~70s) then retries network errors 10 more times (~50s). The vehicles page now has its own 15s timeout, but the correct fix is a shared timeout/`AbortSignal` in `api.ts` — deliberately not done, since every page depends on that file.

- **NEW-4 (Medium) — Eight more dead links in the footer.** `/terms`, `/privacy`, `/pricing` and five others have no routes. Previously invisible (blank page); now they land on the new 404 page, which is better but still wrong.

- **NEW-5 (Low) — Fake phone number on the homepage.** `apps/web/src/components/home/CTASection.tsx` dials `tel:1-800-GEM-AUTO`, a vanity number that matches no real phone number in the codebase. The real numbers are 863-277-7879 / 863-279-2907.

- **NEW-6 (Low) — `react-helmet-async` is not applying meta tags site-wide.** Reproduces on `/about` too, so it predates this work. Affects SEO, and means the new 404 page's `noIndex` never reaches crawlers.

- **NEW-7 (Low) — Business hours contradict each other.** The hours on the About page disagree with the hours in the JSON-LD structured data being fed to search engines.

- **NEW-8 (Low) — Homepage "Features" section still contains hardcoded marketing claims** ("10,000+ Customers", "4.9 Rating") separate from the now-honest stats section. Worth deciding whether those should stay.

## Environment / housekeeping

- **Disk is nearly full** — 2.6 GB free of 228 GB (87% used). One agent's build failed with a disk-space error before succeeding on retry. Clear space to avoid random build failures.
- **Content review needed** — the stats section heading was changed from "Trusted by Thousands" to "By the Numbers" as part of #3, because the old heading was a fabricated claim rendered by that component. Easy to revert if you prefer the original wording.
- **Nothing has been committed.** All fixes are uncommitted working-tree changes, alongside the pre-existing uncommitted Wallet Pass work.
