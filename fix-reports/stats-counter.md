---
title: 'Fix Report — Homepage Statistics Counter Stuck at Zero'
aliases: ['Statistics Counter Fix', 'Trusted by Thousands Zeros']
tags: [fix-report, bug, web, homepage, framer-motion, honesty]
created: 2026-07-25
description: 'Root cause and fix for the homepage stats counter rendering 0+/0.0%/0+/0+, plus removal of fabricated fallback marketing numbers.'
related:
  - '[[fix-reports/vehicle-images]]'
  - '[[fix-reports/server-tests]]'
  - '[[BUGFIX_CHECKLIST]]'
---

# Fix Report — Homepage Statistics Counter

**File changed (only file touched):** `/Users/Manny/Gem Auto Rentals/gem-auto-rentals/apps/web/src/components/home/Statistics.tsx`

---

## 1. True root cause

There were **two distinct defects**. Only one of them produces the reported zeros, and it is
_not_ the one the symptom suggests.

### Defect A — the zeros: the counter has no fallback when the IntersectionObserver never fires

`AnimatedCounter` rendered `count`, a piece of state initialised to `0` that is **only ever
advanced from inside an effect gated on `isInView`**:

```tsx
const [count, setCount] = useState(0);
const isInView = useInView(ref, { once: true });
useEffect(() => {
  if (!isInView) return; /* setInterval → setCount */
}, [value, isInView]);
```

If the intersection callback never fires, `count` stays `0` **permanently** — the fetched
value is present in props but is never rendered. The `0` placeholder becomes the final UI.

**How I confirmed which side was failing (evidence, not hypothesis):**

I instrumented the live page in two different browser contexts.

_Context 1 — the agent Browser pane (this is the environment the original bug report came from):_

```
{ "hidden": true, "frames": 0, "innerH": 900, "sectionTop": 200,
  "texts": ["0+", "0.0%", "0+", "0+"] }
```

- `document.hidden === true` and a `requestAnimationFrame` counter ran **0 frames in 1000 ms** —
  the page is never granted a rendering lifecycle update.
- I attached **my own** `IntersectionObserver` (threshold 0) to the four counter spans and waited
  1.2 s. It received **zero entries** — not even the mandatory initial non-intersecting callback.
  So IntersectionObserver is completely inert in that context.
- Corroborating: the surrounding `motion.div`s were still at `opacity: 0` with
  `transform: matrix(1,0,0,1,0,20)` — framer-motion's `whileInView` had _also_ never fired.
  The entire section was invisible; the `0+` text was only readable via the DOM.

_Context 2 — a real, painting Chrome (I launched headless Chrome via CDP, viewport 1280x900,
scrolled the section into view):_

```
{ "frames": 360, "hidden": false, "sectionTop": 150,
  "tiles": [ {"opacity":"1","text":"6+Happy Customers"},
             {"opacity":"1","text":"99.9%Satisfaction Rate"},
             {"opacity":"1","text":"8+Years Experience"},
             {"opacity":"1","text":"50,000+Completed Rentals"} ] }
```

Here the observer fires, the count-up runs, and the real fetched values (6, 8) render.

**Conclusion:** the literal `0+ / 0.0% / 0+ / 0+` symptom is what the component does in any browser
context that does not deliver intersection callbacks (backgrounded/occluded tab, non-painting
headless snapshot tooling, prerender). It is not a fetch bug, not a StrictMode artifact, and not a
zero-size-element problem — **the spans measured 64x59 px and were fully inside the 900 px viewport**,
so hypothesis (2) from the brief is ruled out; the observer was inert for _every_ element on the page,
regardless of size.

That said, the component genuinely deserves the fix: rendering a hard-coded `0` as the final answer
when the correct value is sitting in props is a real defect, and it is _also_ an honesty problem
("0+ Happy Customers" when there are 6).

The ordering hypothesis (1) from the brief was traced and is **not** a cause: when `value` changes
after `isInView` is already true, the effect cleanly tears down the old interval and restarts the
count-up toward the new value. It converges on the correct number.

### Defect B — fabricated numbers (real, user-visible in a normal browser)

This one reproduced in a fully working browser (Context 2 above). The `||` fallbacks:

```tsx
{ value: satisfactionRate || 99.9,  ... 'Satisfaction Rate' }
{ value: data.totalRentals || 50000, ... 'Completed Rentals' }
```

`averageRating` is genuinely `null` and `totalRentals` is genuinely `0`, so both fell through to
invented marketing figures. The homepage was rendering **"99.9% Satisfaction Rate"** and
**"50,000+ Completed Rentals"** — verbatim from the headless-Chrome capture above. The
`defaultStats` array (1250 / 99.9 / 10 / 50000) was the same problem during the loading window
and on any API error.

---

## 2. What changed and why

### `AnimatedCounter`

- Render `const displayed = isInView ? count : value;` instead of always rendering `count`.
  The animation still starts from 0 and counts up exactly as before once the observer fires; the
  only behavioural change is that before/without an intersection callback the component shows the
  **real number** rather than a placeholder `0`. This structurally removes the permanent-zero
  failure mode.
- `useRef(null)` → `useRef<HTMLSpanElement>(null)` (correct ref typing; no behavioural change).

### `Statistics`

- Removed the `defaultStats` array entirely. State is now `StatItem[] | null`, starting at `null`,
  and the component returns `null` until real data arrives. No placeholder numbers ever paint.
- Replaced the four hard-coded slots + `||` fallbacks with a candidate list built purely from the
  API response, ordered by usefulness, then `.filter((item) => item.value > 0).slice(0, 4)`:
  1. `totalCustomers` → "Happy Customers"
  2. `averageRating` → "Average Rating" (suffix `/5`)
  3. `yearsInBusiness` → "Years Experience"
  4. `totalRentals` → "Completed Rentals"
  5. `vehicleCount` → "Vehicles in Fleet"
- Grid column count now adapts (`gridColumns`) so 1/2/3/4 tiles all lay out correctly instead of
  leaving a hole in a fixed 4-column grid.
- `catch { setStats([]); }` — on API failure the section renders nothing rather than falling back
  to invented figures. This also removes the `console.debug` that caused the **no-console** warning
  at old line 94.

### Heading copy (flagging this — judgement call, easy to revert)

- `"Trusted by Thousands"` → `"By the Numbers"`, and the sub-line
  `"Numbers that speak to our commitment to excellence and customer satisfaction."` →
  `"A straight look at where Gem Auto Rentals stands today."`

  Rationale: "Trusted by Thousands" is a fabricated claim rendered _by this component_ (the real
  customer count is 6), so it fell under the honesty requirement for this file. I did **not** touch
  the "10,000+ Customers" claim in the Features/WhyChooseUs section — out of scope as instructed.
  If the main session wants the original heading back, it is a two-line revert.

---

## 3. How the honesty requirement was handled

| API field         | Real value today | Old rendering                                | New rendering                                                   |
| ----------------- | ---------------- | -------------------------------------------- | --------------------------------------------------------------- |
| `totalCustomers`  | `6`              | `6+` (correct)                               | `6+` — shown                                                    |
| `averageRating`   | `null`           | **`99.9%` Satisfaction Rate (fabricated)**   | **omitted** — no rating recorded, so no tile                    |
| `yearsInBusiness` | `8`              | `8+` (correct)                               | `8+` — shown                                                    |
| `totalRentals`    | `0`              | **`50,000+` Completed Rentals (fabricated)** | **omitted** — a `0` tile brags about nothing                    |
| `vehicleCount`    | `8`              | not used                                     | `8` Vehicles in Fleet — real data, promoted into the freed slot |

Rules now enforced by the code, not by convention:

- No number is ever rendered that did not come from `GET /api/stats/public`.
- Any metric that is `0`, `null`, or missing is **dropped**, never substituted.
- Loading state and error state render **nothing** rather than placeholder marketing numbers.
- The `+` suffix is retained only on genuinely open-ended running totals (customers, years);
  `vehicleCount` uses no suffix and `averageRating` uses `/5`.

Note: because two metrics are currently empty, the section now shows **3 tiles instead of 4**. That
is intentional — it is the honest output for the current data, and the grid adapts. It will
automatically become 4 tiles the moment a rental completes or a rating is recorded.

---

## 4. Verification results

All commands run from the repo root.

**1. `pnpm --filter web typecheck` — PASS (clean)**

```
> web@0.1.0 typecheck
> tsc --noEmit
```

No output, exit 0.

**2. `pnpm --filter web lint` — PASS, 0 errors / 0 warnings**

```
> web@0.1.0 lint
> eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
```

No output, exit 0. `--max-warnings 0` is in the script, so this is a hard pass.
Baseline before the fix was `Statistics.tsx 94:9 warning Unexpected console statement no-console`
(1 problem). That warning is gone. Note the whole `apps/web` tree was clean at the moment I ran it,
so nothing was masked.

**3. `pnpm --filter web test` — PASS, no regressions**

```
 ✓ src/lib/__tests__/cache.test.ts  (18 tests)
 ✓ src/lib/validations/__tests__/auth.test.ts  (25 tests)
 ✓ src/lib/validations/__tests__/booking.test.ts  (30 tests)
 Test Files  3 passed (3)
      Tests  73 passed (73)
```

(There is no existing test suite for `Statistics.tsx`; nothing regressed.)

**4. RUNTIME PROOF**

Server (`cd server && pnpm dev`) and web (`cd apps/web && pnpm dev`) both running. API sanity check:

```
$ curl -s http://localhost:3000/api/stats/public
{"success":true,"data":{"totalCustomers":6,"totalRentals":0,"averageRating":null,
 "yearsInBusiness":8,"vehicleCount":8},"cached":false}
$ curl -s http://localhost:3000/health
{"status":"ok","database":"connected","storage":"configured", ...}
```

_Real painting Chrome (headless Chrome driven over CDP, 1280x900, scrolled the stats section to
150 px from the top of the viewport, waited 5 s):_

```json
{
  "frames": 355,
  "hidden": false,
  "sectionTop": 150,
  "gridClass": "grid gap-8 lg:gap-12 grid-cols-2 lg:grid-cols-3",
  "midFlightAfter400ms": ["1+Happy Customers1+Years Experience1Vehicles in Fleet"],
  "finalRenderedText": [
    { "opacity": "1", "text": "6+Happy Customers" },
    { "opacity": "1", "text": "8+Years Experience" },
    { "opacity": "1", "text": "8Vehicles in Fleet" }
  ],
  "fullSectionText": "By the Numbers\n\nA straight look at where Gem Auto Rentals stands today.\n\n6+\n\nHappy Customers\n\n8+\n\nYears Experience\n\n8\n\nVehicles in Fleet"
}
```

Two things to note in that capture:

- `midFlightAfter400ms` reads `1+ / 1+ / 1` — sampled 400 ms into the reveal, proving the
  **count-up animation is genuinely running**, not snapped straight to the final value.
- No `99.9%` and no `50,000+` anywhere.

A screenshot was also captured and visually inspected: three evenly spaced tiles reading
**6+ Happy Customers | 8+ Years Experience | 8 Vehicles in Fleet** under the "By the Numbers"
heading, correctly laid out in the dark section.

_Regression proof for the original failure mode_ — reloaded the same page in the frozen agent
Browser pane, the exact environment that produced the zeros:

```json
{ "hidden": true, "frames": 0, "gridText": "6+Happy Customers8+Years Experience8Vehicles in Fleet" }
```

Still `document.hidden: true` with `0` animation frames (the IntersectionObserver is still inert
there), but the section now renders the **real numbers** instead of `0+ / 0.0% / 0+ / 0+`.
That is the fix working precisely on the reported failure condition.

**Cleanup:** all dev servers I started were killed. Verified afterwards —
`lsof -iTCP -sTCP:LISTEN` shows nothing on **3000, 5173, 5174, or 4173**, and no stray headless
Chrome debug instances remain. (A vite instance on port **5199** is still running; it belongs to a
sibling agent, not me, so I left it alone.)

---

## 5. Unresolved / caveats

- **I did not run a production preview build.** `pnpm --filter web build` writes to
  `apps/web/dist`, and a sibling agent had a preview server on port 4173 serving that directory.
  Building would have stomped on their verification. Nothing in the change is dev-only (it is a
  pure render-path change with no `import.meta.env` branching), and the fix was proven in two
  independent browser contexts, so I judged the risk of a prod-only difference to be nil. Flagging
  it because the brief asked for it and I deliberately skipped it.
- **Stale Vite transform cache.** During verification the dev server kept serving the pre-edit
  module even after the file changed — no HMR event appeared in the log. I had to kill Vite,
  `rm -rf apps/web/node_modules/.vite`, and restart before the change took effect. Worth knowing:
  the file watcher appears unreliable in this workspace, so "my fix didn't work" may sometimes just
  be a stale cache. Not investigated further; out of scope.
- **`api.ts` types `averageRating` as `number` but the API returns `null`.** The existing
  `?? 0` coercion papers over it and I kept that pattern, but the type is a lie. `api.ts` is
  outside my edit scope, so I did not change it — worth a follow-up:
  `averageRating: number | null`.
- The section now renders **3 tiles**, and will render **0 tiles (section hidden entirely)** if the
  stats API is down. Both are deliberate consequences of the no-fabrication rule. If a product
  decision prefers a permanently 4-tile layout, it needs a fourth genuinely-real metric from the
  backend, not a fallback constant.
