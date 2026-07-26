---
title: Vehicles Page Error State + Admin Login Lint Fix
aliases: [vehicles-error-state, vehicles-timeout-fix]
tags: [fix-report, web, vehicles, error-handling, lint, react-hooks]
created: 2026-07-25
description: Adds a timeout/error state with a Try Again button to the vehicles listing, and fixes the react-hooks/exhaustive-deps warning in the admin LoginPage via useCallback.
related: ['[[BUGFIX_CHECKLIST]]', '[[WEBSITE_AUDIT]]']
---

# Vehicles Page Error State + Admin Login Lint Fix

## Result

- **Task 1 (vehicles error state):** Done and verified live in a browser, both API-down and API-up.
- **Task 2 (admin lint):** Done. `pnpm --filter admin lint` now passes with **0 errors, 0 warnings**.

---

## Task 1 — Vehicles listing error/timeout state

### How the fetch was implemented (before)

`apps/web/src/pages/VehiclesPage.tsx` did **not** use a hook. It called the shared api client
directly inside a `useEffect(..., [])`:

```tsx
const response = await api.vehicles.list({ limit: 100 });
...
} catch (error) {
  console.error('Error fetching vehicles:', error);
  setVehicles([]);   // <-- error collapsed into "empty results"
} finally {
  setIsLoading(false);
}
```

Notes from the investigation:

- A `useVehicles` hook **does** exist (`apps/web/src/hooks/useVehicles.ts`), but `VehiclesPage.tsx`
  does not import it — it is unused by this page, so nothing shared was touched.
- The real cause of "skeletons forever" is in the **shared** api client
  (`apps/web/src/lib/api.ts`, deliberately NOT edited — other pages depend on it):
  1. `request()` blocks on `wakeUpServer()`, which polls `/health` up to **15 times** with 2–5s
     backoff (~70s) before giving up.
  2. `request()` then retries network errors (`TypeError`) up to **10 more times** with 2–6s
     backoff (~50s).

  So with the backend down, a single `api.vehicles.list()` call can stay pending for roughly
  **two minutes** before it ever rejects. The old code did eventually catch it, but by then the
  user had been staring at gray skeletons — and even then it showed the "No vehicles found"
  empty state, not an error.

Because the timeout genuinely belongs in the shared client but that file is off-limits (and
changing its retry behaviour would affect every other page), the timeout was implemented
**locally in the page** as instructed.

### What changed

All changes are confined to `apps/web/src/pages/VehiclesPage.tsx`:

1. Replaced the boolean `isLoading` state with an explicit three-value state machine:

   ```tsx
   type LoadState = 'loading' | 'error' | 'ready';
   const [loadState, setLoadState] = useState<LoadState>('loading');
   const isLoading = loadState === 'loading';
   const hasError = loadState === 'error';
   ```

   `isLoading` is now derived, so every existing usage of `isLoading` elsewhere in the file kept
   working unchanged — no unrelated refactor.

2. Added a 15s local timeout via `Promise.race`, plus a `cancelled` guard and `clearTimeout` in the
   effect cleanup so a late-resolving request can't clobber state after unmount/retry:

   ```tsx
   const VEHICLES_REQUEST_TIMEOUT_MS = 15000;
   const response = await Promise.race([
     api.vehicles.list({ limit: 100 }),
     new Promise<never>((_, reject) => {
       timeoutId = setTimeout(
         () => reject(new Error('Vehicles request timed out')),
         VEHICLES_REQUEST_TIMEOUT_MS
       );
     }),
   ]);
   ```

   `api.vehicles.list` accepts no `AbortSignal`, so the underlying fetch can't be truly cancelled
   from the page — the race + `cancelled` flag is the best that's achievable without editing the
   shared client. The stale in-flight request is simply ignored.

3. Added `reloadKey` state; the effect depends on `[reloadKey]`, and `handleRetry` bumps it. That is
   what the **Try Again** button calls, so the fetch genuinely re-runs (state goes back to
   `'loading'` → skeletons → success or error again).

4. Added the error UI, styled to match the existing "No vehicles found" empty state exactly
   (same `text-center py-16 bg-white rounded-2xl border border-gray-100` card, same 16x16 rounded
   icon badge), but tinted with the brand orange instead of gray:
   - `AlertTriangle` icon in a `bg-primary/10` circle, icon `text-primary`
   - Heading: "We couldn't load our fleet"
   - Body: "Something went wrong while reaching our servers. Please check your connection and try again in a moment."
   - Button: `bg-primary text-white ... shadow-orange-200 hover:bg-orange-600` with a `RefreshCw`
     icon — this matches the page's existing active-pagination button treatment
     (`bg-primary text-white shadow-lg shadow-orange-200`).

5. Toolbar count line now reads "Vehicles unavailable" in the error state instead of "0 vehicles found".

6. Pagination is explicitly gated on `!hasError` (it was already effectively hidden since
   `filteredVehicles` is empty, but this makes the intent explicit).

### Loading vs. error vs. legitimately-empty

The render is a single ordered ternary chain, so the three states can never be confused:

```tsx
{isLoading   ? <VehicleGridSkeleton count={6} />   // 1. loading
 : hasError  ? <ErrorCard onRetry={handleRetry} /> // 2. fetch failed / timed out
 : paginatedVehicles.length > 0
             ? <grid/list of vehicles />           // 3a. results
             : <NoVehiclesFound />}                // 3b. legitimately empty
```

- A **successful** response with zero items sets `loadState = 'ready'` and falls through to the
  original, untouched "No vehicles found / Clear all filters" empty state.
- Filtering down to zero results (a client-side operation) also lands on 3b — it never touches
  `loadState`, so filters can never produce the error state.
- Only a rejection or a 15s timeout sets `'error'`.

---

## Task 2 — `react-hooks/exhaustive-deps` in `apps/admin/src/pages/LoginPage.tsx`

### The fix

Wrapped `handleSsoCode` in `useCallback(..., [navigate])`, **moved its definition above** the
`useEffect` that uses it, and added it to the effect's dependency array:
`[searchParams, handleSsoCode]`.

Moving the definition was mandatory, not cosmetic: a `const` declared with `useCallback` is not
hoisted, and the dependency array is evaluated **during render** (before the effect body runs). Had
the definition stayed below the effect, referencing `handleSsoCode` in the deps array would have
thrown a TDZ `ReferenceError` on every render.

### Why it cannot loop

`handleSsoCode`'s identity is stable across renders, so adding it to the deps array adds no new
re-trigger source:

- Its only captured non-static value is `navigate` from `useNavigate()`, which React Router keeps
  referentially stable for the life of the router context.
- Everything else it touches is either a `useState` setter (`setSsoLoading`, `setSsoError` — stable
  by React's guarantee), a module-level import (`api`, `tokenManager`, `useAuthStore.setState`,
  `ADMIN_ROLES`), or a browser global (`localStorage`).
- Therefore `useCallback([navigate])` returns the same function object on every render, and the
  effect's dep tuple only changes when `searchParams` changes — exactly the pre-existing behaviour.

Additionally, the effect body is a no-op unless `?code=` is present, and it strips the code from the
URL with `window.history.replaceState` (which does not notify React Router), so even a repeated
effect run could not re-fire the exchange. **No behaviour changed** — same effect body, same
`handleSsoCode` body, same login flow. The other agent's `useState('')` on line 12 (removed
hardcoded default email) was left intact.

An `eslint-disable` comment was not needed and was not added.

---

## Verification

All commands run from the repo root.

| Check                           | Result                                          |
| ------------------------------- | ----------------------------------------------- |
| `pnpm --filter web typecheck`   | **PASS** — clean, no output                     |
| `pnpm --filter admin typecheck` | **PASS** — clean, no output                     |
| `pnpm --filter admin lint`      | **PASS** — 0 errors, 0 warnings (was 1 warning) |
| `pnpm --filter web lint`        | 1 problem remaining, **not mine** (see below)   |
| `pnpm --filter web test`        | **PASS** — 3 files, 73/73 tests                 |

### `pnpm --filter web lint` — remaining problem (another agent's file)

```
apps/web/src/components/home/Statistics.tsx
  94:9  warning  Unexpected console statement  no-console
✖ 1 problem (0 errors, 1 warning)
```

`VehiclesPage.tsx` is **clean**. `Statistics.tsx` is explicitly out of my scope (another agent is
working in it) — reported, not fixed. The web lint script uses `--max-warnings 0`, so the package
script still exits 1 until that warning is cleared by whoever owns that file.

### Runtime proof — browser

**Environment caveat (important):** ports 3000 (backend) and 5173 (web) were **already occupied by
another agent's dev servers** when I started, and the backend on 3000 was healthy
(`/health` → `{"status":"ok","database":"connected"}`) serving 8 vehicles. I did **not** kill their
servers. Instead I ran my own isolated Vite instance on port **5231** and pointed it at a dead API
origin via an inline env var (no file changes, no `.env` touched):

```
VITE_API_URL=http://127.0.0.1:3999 pnpm exec vite --port 5231 --strictPort
```

`api.ts` uses `VITE_API_URL` as its base when set, so port 3999 being closed reproduces exactly the
"API unreachable" condition (connection refused → `TypeError` → the client's retry/wake-up loops).

**Case A — API down (`http://localhost:5231/vehicles`), observed:**

- t≈0–15s: gray vehicle skeletons + the pulsing placeholder next to the count. Unchanged behaviour.
- t≈15s: skeletons disappeared and the error card rendered. Page text captured from the live DOM:
  - toolbar: `Vehicles unavailable`
  - `We couldn't load our fleet`
  - `Something went wrong while reaching our servers. Please check your connection and try again in a moment.`
  - `Try Again` button present
- Browser console showed exactly the expected rejection, proving the timeout (not a natural
  rejection) fired: `Error fetching vehicles: Error: Vehicles request timed out at .../VehiclesPage.tsx:93:30`
- Screenshot confirmed the styling: orange `AlertTriangle` inside a soft orange circle, on the same
  white rounded card as the empty state, with a solid orange `Try Again` button + refresh icon.

Without the fix this page would have kept showing skeletons for ~2 minutes and then fallen through
to "No vehicles found", which is what was originally reported as "skeletons forever".

**Case B — API restored, then clicked "Try Again", observed:**

To bring the API up on 3999 without disturbing the other agent's servers, I ran a throwaway
Node reverse proxy (`127.0.0.1:3999` → `127.0.0.1:3000`, adding permissive CORS headers since the
page was now cross-origin). Confirmed via curl before clicking: `items: 8, total: 8`.

- Clicked the real **Try Again** button in the browser (element ref click at (796, 700)).
- The page immediately re-fetched and rendered the live fleet. Captured from the live DOM:
  `8 vehicles found`, listing 2024 Nissan Versa $45/day, Toyota Camry $65, Honda CR-V $85,
  BMW 3 Series $120, Tesla Model 3 $130, Chevrolet Suburban $140, Ford Mustang $150,
  Mercedes-Benz S-Class $250 — all 8 vehicles, price-ascending as expected.

**Case C — legitimately-empty (regression check on the distinction):**

- With the API up, typed `zzzznotavehicle` into the search box.
- Observed `0 vehicles found` + the original `No vehicles found` / `Try adjusting your filters or
search terms` / `Clear all filters` empty state — **not** the error state. Confirms the two are
  properly distinguished.

### Cleanup

- Killed my Vite instance on **5231** and the temporary proxy on **3999**. Verified with `lsof`:
  neither port is listening.
- I also started (and killed) short-lived Vite instances that grabbed **5174** during setup —
  5174 is confirmed free.
- **Still listening, and NOT mine — left running deliberately:** PID 44602 on **:3000** (server),
  PID 44618 on **:5173** (web), PID 40681 on **:5199**. These belong to another agent's session and
  predate my work. If the main session wants a fully clean machine, those three need to be killed
  by whoever owns them.
- The temporary proxy script lives in the session scratchpad only; nothing was added to the repo
  except this report.

---

## Unresolved / caveats

1. **`pnpm --filter web lint` still fails** solely because of `no-console` at
   `apps/web/src/components/home/Statistics.tsx:94` — another agent's in-flight file. Not fixed
   (out of scope).
2. **The 15s timeout is per-page, not global.** Every other page that calls `api.ts` still inherits
   the ~2-minute wake-up + retry stall. The proper fix is an `AbortSignal`/timeout option in
   `apps/web/src/lib/api.ts`, which was explicitly off-limits here. Worth a follow-up task.
3. **The aborted request keeps running in the background.** Since `api.vehicles.list` takes no
   signal, after a timeout the underlying fetch/retry chain continues until the shared client gives
   up; its result is discarded via the `cancelled` guard. Harmless, but it does mean a "Try Again"
   click issues a second concurrent request while the first is still winding down.
4. **The browser test used a cross-origin API base (`VITE_API_URL`) rather than the Vite `/api`
   proxy**, because port 3000 was occupied by a healthy backend I was told not to disturb. The
   failure path exercised (network error → client retries → 15s page timeout) is the same one a
   down backend produces through the proxy, but the exact proxy-504 variant was not separately
   exercised.
5. The `useVehicles` hook in `apps/web/src/hooks/useVehicles.ts` is dead code as far as
   `VehiclesPage` is concerned — it was left untouched, but someone should decide whether the page
   should migrate to it (which would then be the right place for a shared timeout).
