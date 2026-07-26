---
title: Investigation — Admin Vehicle Image Upload
aliases: [admin-upload-investigation, vehicle-image-upload]
tags: [investigation, admin, server, storage, r2, images]
created: 2026-07-25
description: End-to-end trace of the admin vehicle image upload path. The code is fully wired; the feature is blocked entirely by missing R2 public-URL environment variables.
related: ['[[vehicle-images]]', '[[WEBSITE_AUDIT]]', '[[CLOUDFLARE_SETUP]]']
---

# Investigation — Admin Vehicle Image Upload

Date: 2026-07-25
Scope: read-only investigation. **No code changes were made.**

---

## Verdict

**Admin vehicle image upload is fully wired end-to-end in code, but it cannot succeed today — every upload fails at the very last step and, worse, leaves an orphaned object in R2.** This is _not_ half-wired UI: the frontend really does call a real, authenticated, multer-backed endpoint; the endpoint really does push the file bytes to Cloudflare R2; and the DB write is really there. The failure is a configuration gap, not missing wiring. `getPublicUrl()` returns `null` because no public-URL env var is set for the `gem-vehicles` bucket, so the route throws `400 Failed to generate image URL` **after** the file has already been written to R2 — the object is stranded and the vehicle's `images` column is never updated.

The consequence differs by flow:

- **Edit flow** — the admin sees a red toast (`Failed to generate image URL`) immediately on picking a file. Loud failure.
- **Add flow** — the per-file upload error is **caught and swallowed**; the admin sees `Vehicle added successfully` and is navigated away. **Silent data loss.** This is the more dangerous of the two.

The two variables the original audit flagged (`_images`, `pendingFiles`) are **not** evidence of dead wiring. Both are intentional and correct in their current form — see [Are `_images` and `pendingFiles` suspicious?](#are-_images-and-pendingfiles-suspicious) below.

Images are **never** converted to data URLs and stored in the DB. Data URLs exist only as transient local previews in React state (`VehicleForm.tsx:159-164`) and are never sent to the server. The 8 hot-linked Unsplash URLs currently in the DB were seeded/inserted by some other path, not by this upload flow — consistent with the fact that this flow has never been able to write a URL.

---

## Traced path

### 1. Frontend — the picker

`apps/admin/src/components/vehicles/VehicleForm.tsx`

- `VehicleForm.tsx:102` — plain hidden `<input type="file">` via `fileInputRef`. There is no dropzone library; the picker is the native file input rendered at `VehicleForm.tsx:335-343` (`accept="image/jpeg,image/png,image/webp"`, `multiple`), triggered by the tile button at `VehicleForm.tsx:320-333`.
- `VehicleForm.tsx:104-105` — `isEditing = !!initialData?.id`; `vehicleId = initialData?.id`. This single flag is what splits the two flows.
- `VehicleForm.tsx:134-171` — `handleImageUpload`, the branch point:
  - **Edit branch** (`VehicleForm.tsx:140-154`): loops the selected files and calls `api.vehicles.uploadImage(vehicleId, file)` **immediately**, appending `result.imageUrl` to local `images` state on success (`VehicleForm.tsx:145-147`). Errors surface as `toast.error(...)` (`VehicleForm.tsx:149-152`).
  - **Add branch** (`VehicleForm.tsx:155-165`): no network call. Files are stashed in `pendingFiles` state and a `FileReader` data URL is stashed in `pendingPreviews` purely for the thumbnail grid (`VehicleForm.tsx:157-164`, rendered at `VehicleForm.tsx:295-316`). The UI explicitly tells the user "Pending images will be uploaded when the vehicle is saved" (`VehicleForm.tsx:346-350`).
- `VehicleForm.tsx:226-230` — `onFormSubmit` hands the parent page `{ ...data, features, images, pendingFiles }`. Note it passes the **`File[]` objects themselves**, not the data-URL previews. `pendingPreviews` never leaves the component.
- `VehicleForm.tsx:173-191` — `removeImage` calls `api.vehicles.deleteImage` for server-side images in edit mode; local-only removal otherwise.

### 2. Frontend — Add flow

`apps/admin/src/pages/AddVehiclePage.tsx`

- `AddVehiclePage.tsx:15` — `const { pendingFiles, ...vehicleData } = data;` — files split off from the JSON payload.
- `AddVehiclePage.tsx:19` — `const { images: _images, ...createData } = vehicleData;` — `images` is deliberately dropped from the create body. Correct: in Add mode `images` is always `[]` (nothing ever populates it before creation), and the server attaches uploaded URLs itself.
- `AddVehiclePage.tsx:27` — `api.vehicles.create(sanitizedData)` → `POST /api/vehicles`.
- `AddVehiclePage.tsx:29-40` — **sequential post-create upload loop**: for each pending `File`, `api.vehicles.uploadImage(newVehicle.id, file)`.
- `AddVehiclePage.tsx:36-38` — **the swallow.** Each per-file failure is caught and only `console.error`'d. Execution continues.
- `AddVehiclePage.tsx:42-43` — unconditional `toast.success('Vehicle added successfully')` then `navigate('/fleet')`. The admin gets a success message even when 100% of the images failed.
- `AddVehiclePage.tsx:31, 35` — `uploadedImages` is declared and pushed to but **never read**. Genuinely dead. Pre-existing in `HEAD` (verified via `git show HEAD:...`), not introduced by the previous agent. Harmless — the server already appends the URL to `vehicle.images` (`server/src/routes/vehicles.ts:559-563`), so no client-side attach is needed.

### 3. Frontend — Edit flow

`apps/admin/src/pages/EditVehiclePage.tsx`

- `EditVehiclePage.tsx:43` — `const { pendingFiles, ...vehicleData } = data;` — `pendingFiles` is dropped. **Correct**: in edit mode `VehicleForm`'s add-branch never runs, so `pendingFiles` is always `[]`. There is nothing to lose here.
- `EditVehiclePage.tsx:51` — `api.vehicles.update(id, sanitizedData)` → `PUT /api/vehicles/:id`. Note this body **does** still carry `images` (only `pendingFiles` was stripped), which round-trips the current URL list back to the server.
- Uploads in this flow do **not** happen at submit time at all — they already happened inline at file-pick (`VehicleForm.tsx:145`).

### 4. Frontend — API client

`apps/admin/src/lib/api.ts`

- `api.ts:851-871` — `vehicles.uploadImage(id, file)`: builds a `FormData` with field name `image` (`api.ts:852-853`), bearer token from `tokenManager` (`api.ts:855-859`), raw `fetch` to `POST ${API_BASE_URL}/vehicles/${id}/images`. Deliberately bypasses the shared `request()` helper so no `Content-Type: application/json` header is forced onto the multipart body — this is correct.
- `api.ts:862-870` — unwraps `json.data`, throws `ApiError` with `json.error || json.message` on failure. The server's `Failed to generate image URL` message is what reaches the toast.
- `api.ts:873-877` — `vehicles.deleteImage(id, imageUrl)` → `DELETE /api/vehicles/:id/images` with a JSON `{ imageUrl }` body.
- Same pattern exists for avatars (`api.ts:927-946`) and the company logo (`api.ts:1081-1099`).

### 5. Server — the upload route

`server/src/routes/vehicles.ts`

- `vehicles.ts:3, 12-25` — multer in memory storage, 5MB cap, MIME allowlist `image/jpeg, image/png, image/webp`. Matches the frontend's `accept` attribute.
- `vehicles.ts:512` — `router.post('/:id/images', authenticate, staffOnly, upload.single('image'), ...)`. `staffOnly = authorize('SUPPORT','MANAGER','ADMIN')` (`server/src/middleware/auth.ts:139`). Field name `image` matches `api.ts:853`.
- Route is mounted at `server/src/index.ts:159` (`app.use('/api/vehicles', cacheControl(60), vehicleRoutes)`).
- `vehicles.ts:514-516` — bails with 400 if `isStorageConfigured()` is false.
- `vehicles.ts:534-537` — key is `${vehicleId}/${Date.now()}.${ext}`.
- `vehicles.ts:540-549` — **`uploadFile(BUCKETS.VEHICLES, ...)` — the bytes really do go to R2 here, and this call is expected to succeed.**
- `vehicles.ts:552` — `getPublicUrl(BUCKETS.VEHICLES, filePath)`. **This is where it dies. Returns `null`.**
- `vehicles.ts:554-556` — `throw BadRequestError('Failed to generate image URL')` → HTTP **400** (`server/src/middleware/errorHandler.ts:90-91`).
- `vehicles.ts:559-564` — the `prisma.vehicle.update` that appends the URL to `images` is **never reached**.
- Net effect per attempted upload: **one orphaned object in the `gem-vehicles` R2 bucket, zero DB rows changed, one 400 to the client.**

Related routes, same shape, same blocker:

- `vehicles.ts:579-626` — `DELETE /:id/images`.
- `vehicles.ts:813-861` — review photo upload (`upload.array('images', 5)`).
- `server/src/routes/customers.ts:437, 493-497` — avatar upload → `Failed to generate avatar URL`.
- `server/src/routes/preferences.ts:209, 254-258` — company logo → `Failed to generate logo URL`.
- `server/src/routes/documents.ts:31` and `server/src/routes/bookings.ts:492` — these target **private** buckets and use signed URLs, so they are **not** affected by the public-URL gap.

### 6. Server — the storage layer (uncommitted)

`server/src/lib/storage.ts` — currently modified in the working tree.

- `storage.ts:5-7, 18` — `isConfigured` needs only `R2_ACCOUNT_ID` + `R2_ACCESS_KEY_ID` + `R2_SECRET_ACCESS_KEY`. All three **are** set in `server/.env:34-36` with real-looking (non-placeholder) values, so `isStorageConfigured()` returns **true** and the guard at `vehicles.ts:514` passes cleanly. This is why the failure happens late instead of early.
- `storage.ts:10-15` — the new per-bucket map:
  ```ts
  const BUCKET_PUBLIC_URLS: Record<string, string | undefined> = {
    'gem-avatars': process.env.R2_AVATARS_PUBLIC_URL,
    'gem-vehicles': process.env.R2_VEHICLES_PUBLIC_URL,
    'gem-logos': process.env.R2_LOGOS_PUBLIC_URL,
  };
  ```
- `storage.ts:60-76` — `getPublicUrl` now returns `null` on either (a) a non-public bucket, or (b) a missing per-bucket URL, logging `Public URL not configured for bucket: gem-vehicles` (`storage.ts:68-71`).
- `storage.ts:131-155` — `uploadFile` is unchanged and functional.

**None of `R2_AVATARS_PUBLIC_URL` / `R2_VEHICLES_PUBLIC_URL` / `R2_LOGOS_PUBLIC_URL` exist anywhere in the repo** other than as reads in `storage.ts:11-13` — not in `server/.env`, not in `.env.example`, not in `render.yaml`. Verified by repo-wide grep.

---

## What is actually broken

### A. The blocker — missing per-bucket public URL env vars (severity: complete outage of the feature)

- `server/.env:37` sets `R2_PUBLIC_URL=""` — empty string, and in any case **that variable is no longer read by the current code**.
- `render.yaml:34-35` still declares only the old single `R2_PUBLIC_URL` (`sync: false`, dashboard-supplied).
- The current `storage.ts` reads three variables that are defined nowhere.

So the code path is broken **both before and after** the uncommitted change: previously because `R2_PUBLIC_URL` was empty, now because its three replacements don't exist. There is no configuration of the current repo state under which a vehicle image upload can complete.

### B. Silent failure in the Add flow (severity: high — masks A)

`AddVehiclePage.tsx:36-38` swallows every per-file upload error, and `AddVehiclePage.tsx:42` reports success unconditionally. An admin adding a vehicle with 4 photos today gets a green toast, lands on `/fleet`, and sees a vehicle with zero images and no explanation. The Edit flow does not have this problem (`VehicleForm.tsx:149-152` surfaces the error).

### C. Orphaned R2 objects on every failed upload (severity: medium)

`vehicles.ts:540` writes to R2 before `vehicles.ts:552` can fail. There is no compensating delete in the catch path. Every upload attempt since R2 was configured has likely left a stray object under `gem-vehicles/<vehicleId>/<timestamp>.<ext>`. Worth listing the bucket before wiring anything up. _(Not verified — no API calls were made per the read-only constraint.)_

### D. Pre-existing bug in image deletion (severity: low, latent)

`vehicles.ts:604-609` extracts the R2 key via `imageUrl.split('/vehicles/')`. This never matches either URL format:

- old format: `${R2_PUBLIC_URL}/gem-vehicles/<key>` — the character before `vehicles` is `-`, not `/`.
- new format: `${R2_VEHICLES_PUBLIC_URL}/<key>` — the bucket name is not in the path at all (`storage.ts:73-75`).

Result: `urlParts.length === 1`, `deleteFile` is skipped, the DB entry is removed but the R2 object stays. Harmless today (nothing is in R2), but it will silently leak storage the moment uploads start working. This bug exists in committed `HEAD` too — it is not from the previous agent.

### E. Dead local variable (severity: cosmetic)

`AddVehiclePage.tsx:31,35` — `uploadedImages` is written and never read. Pre-existing in `HEAD`. Left in place deliberately (see [Code changes](#code-changes)).

---

## Are `_images` and `pendingFiles` suspicious?

No. The original audit's read of these two was a false positive, and the previous agent's handling of them is correct:

- `AddVehiclePage.tsx:16-19` — `_images` is discarded because `images` must not be in the create payload; the server attaches URLs itself at `vehicles.ts:559-563`. In Add mode `images` is provably always `[]`. Dropping it is right.
- `EditVehiclePage.tsx:40-43` — `pendingFiles` is discarded because `File` objects can't be JSON-serialized _and_ because in Edit mode the array is always empty (uploads already fired at `VehicleForm.tsx:145`). Dropping it is right.

Both now carry accurate explanatory comments plus a narrowly-scoped `eslint-disable-next-line @typescript-eslint/no-unused-vars`. Since `pnpm --filter admin lint` runs with `--report-unused-disable-directives --max-warnings 0` and passes, those directives are confirmed load-bearing, not cargo-cult.

---

## Would the env vars block it even if the code were complete?

**Yes — completely, and they are the _only_ thing blocking it.** The code _is_ complete. Verified for `getPublicUrl`:

| Condition                                                     | Value today                             | Effect                                                                         |
| ------------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------ |
| `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | set, real-looking (`server/.env:34-36`) | `isStorageConfigured()` → **true**, guard at `vehicles.ts:514` passes          |
| `R2_PUBLIC_URL`                                               | `""` (`server/.env:37`)                 | **no longer read** by current `storage.ts` — irrelevant                        |
| `R2_VEHICLES_PUBLIC_URL`                                      | **undefined everywhere**                | `storage.ts:68` → `getPublicUrl` returns `null` → `vehicles.ts:555` throws 400 |

Setting `R2_VEHICLES_PUBLIC_URL` to the `gem-vehicles` bucket's public `https://pub-xxxx.r2.dev` URL (or a custom CDN domain) is, as far as the code is concerned, the entire fix for the happy path. _(Speculative, flagged as such: this assumes the `gem-vehicles` bucket exists, has public access enabled, and the API token's credentials are valid — none of which could be verified without calling the R2 API, which was out of scope.)_

Two follow-on env consequences of the uncommitted `storage.ts` change:

1. `render.yaml:34` must be updated from `R2_PUBLIC_URL` to the three new keys, and the values must be added in the Render dashboard (`sync: false` means they aren't in the file). Deploying the current `storage.ts` without doing this changes nothing for the worse — public URLs are already broken — but it _does_ silently retire a variable that ops may still believe is live.
2. `vehicles.ts:843` (review photo upload) passes `BUCKETS.DOCUMENTS` to `getPublicUrl`. Under the new code that bucket is not in `PUBLIC_BUCKETS` (`storage.ts:57`), so it returns `null` with a `Bucket gem-documents is private - use getSignedUrl instead` warning. That call site was already conceptually wrong (it puts review photos in the private documents bucket) and now fails more loudly — but it fails _silently to the user_, because `vehicles.ts:844-846` skips `null` URLs and the review is updated with an empty array. Pre-existing design mismatch, not caused by the previous agent, but it should be folded into whatever fixes the vehicle path.

---

## What it would take to make it work

**Not implemented — this is information for the owner to decide on.** There is no missing feature to build; the estimates below are configuration and hardening only.

**Tier 1 — unblock the happy path (~15 min, config only, no code)**

1. Confirm in the Cloudflare dashboard that the `gem-vehicles` bucket exists and has public access (r2.dev subdomain or custom domain) enabled.
2. Add `R2_VEHICLES_PUBLIC_URL=https://pub-xxxx.r2.dev` to `server/.env`, plus `R2_AVATARS_PUBLIC_URL` and `R2_LOGOS_PUBLIC_URL` for the avatar and logo routes.
3. Update `render.yaml:34-35` to declare the three new keys and set their values in the Render dashboard.
4. Add all three to `.env.example` so the next person doesn't hit this.
5. Manually verify one upload through the admin UI end-to-end.

**Tier 2 — stop the silent failure (~30 min, small code change)**

6. `AddVehiclePage.tsx:29-40` — collect failures and surface them. Minimum: change the success toast at `:42` to be conditional, e.g. `Vehicle added, but N of M images failed to upload`. Optionally use the already-collected `uploadedImages` array to report the real count, which would also retire the dead variable.

**Tier 3 — hardening (~1-2 h)**

7. `vehicles.ts:552-556` — on `getPublicUrl` returning `null`, delete the just-uploaded R2 object before throwing, so failures stop leaking storage.
8. `vehicles.ts:604-609` — replace the `split('/vehicles/')` key extraction with something derived from the actual configured bucket URL (e.g. strip the `BUCKET_PUBLIC_URLS[bucket]` prefix), so deletes actually remove the R2 object.
9. `vehicles.ts:841-843` — decide whether review photos belong in a public bucket; if so, move them off `BUCKETS.DOCUMENTS`.
10. Optionally: fail fast at boot if `isStorageConfigured()` is true but a public bucket has no URL — turns a per-request 400 into a startup warning someone will actually see.

**Explicitly out of scope / not needed:** there is nothing to build in the frontend. The picker, the multipart client, the endpoint, the multer config, the R2 write and the Prisma write all exist and are correctly connected.

---

## Code changes

**No code changes were made.** The investigation found no trivially-and-obviously-correct cleanup attributable to the previous agent. The one piece of genuinely dead code found (`uploadedImages`, `AddVehiclePage.tsx:31,35`) predates that agent — confirmed via `git show HEAD:apps/admin/src/pages/AddVehiclePage.tsx` — and is better retired as part of the Tier 2 error-reporting fix above than removed in isolation, since that fix has a natural use for it. Everything else identified is either a configuration gap or a behavioural change that constitutes a product decision.

## Verification

Run against the working tree as-is (no modifications by this investigation):

| Command                         | Result                                                                                       |
| ------------------------------- | -------------------------------------------------------------------------------------------- |
| `pnpm --filter admin typecheck` | **pass** — no errors                                                                         |
| `pnpm --filter admin lint`      | **pass** — 0 errors, 0 warnings (with `--report-unused-disable-directives --max-warnings 0`) |

Note: an initial `pnpm --filter admin lint` run reported a spurious `Parsing error: ')' expected` at `apps/admin/src/pages/LoginPage.tsx:78:3`. It did not reproduce on any subsequent run, and `tsc --noEmit` parses the file without complaint, so it was a transient read artifact rather than a real defect. `LoginPage.tsx:25-90` (the previous agent's `useCallback` refactor of `handleSsoCode`) is syntactically and structurally sound.

No commits, no pushes, no `.env` edits, no dev servers, no API or storage calls, no logins.
