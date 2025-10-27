## Overview

Enable people to update their profile picture with a custom upload that is stored in our existing blob infrastructure. The new flow lets the front end upload an avatar image, persist both the blob ID and the stable `/blobs/:id` URL, and ensure the account keeps using that custom picture across sessions and future logins.

## Goals

- Introduce a dedicated `update_profile_picture` mutation that persists `avatar_blob_id` alongside `avatar_url`, gated behind the `custom-avatar` feature flag on the client.
- Reuse `app/assets/js/models/blobs/uploadFile` for avatar uploads, so the client receives `{id, url}` without new storage plumbing.
- Prevent the Google OAuth sync from overwriting a custom avatar once it exists.
- Surface the blob identifier in API responses so downstream clients can derive new URLs when needed.

## Non-Goals

- No image cropping, resizing, or validation beyond the existing blob upload constraints.
- No support for uploading avatars outside the standard profile-editing flows (e.g., invite wizard, admin bulk actions) in this iteration.
- No migration to backfill `avatar_blob_id` for existing users; they continue using `avatar_url` alone until they upload a new picture.

## Implementation Plan

### 1. Backend API & Schema Wiring

1. **New mutation**  
   - Create `app/lib/operately_web/api/mutations/update_profile_picture.ex` that accepts `person_id`, `avatar_blob_id`, and `avatar_url`.  
   - Enforce that the requester is the profile owner (or otherwise check permissions consistent with profile editing), and return the serialized person.

2. **Persist avatar fields**  
   - Inside the mutation, when `avatar_blob_id` is present, call `Operately.Blobs.update_blob/2` to set `status: :uploaded` (ensures parity with other blob flows).  
   - If the request clears the avatar (both fields `nil`), set `avatar_blob_id` and `avatar_url` to `nil` so the UI falls back to initials.

3. **Respect custom avatars during OAuth sync**  
   - In `app/lib/operately/people/fetch_or_create_account_operation.ex`, guard `update_avatar/2` so it only overwrites `avatar_url` when *all* related people have `avatar_blob_id == nil`.  
   - If a person has a custom blob, skip the Google URL refresh but still return the account unchanged.

4. **Guard Rails & Validation**  
   - Update `app/lib/operately/people/person.ex` tests if necessary to ensure `avatar_blob_id` enforces the FK constraint and that `avatar_url` continues to accept the `/blobs/:id` URL.  
   - Confirm `Operately.People.update_person/2` already whitelists both fields (it does via `Person.changeset/2`).

### 2. Frontend Avatar Upload Experience

1. **API surface**  
   - Define the mutation in the TurboConnect schema and run `mage gen` to regenerate the TypeScript bindings (`UpdateProfilePictureInput`, hooks, etc.); no manual edits to `app/assets/js/api/index.tsx` are needed.

2. **Feature flag gating**  
   - Use `Companies.hasFeature(company, "custom-avatar")` (from `app/assets/js/models/companies/hasFeature.tsx`) to decide whether to show the avatar uploader controls.  
   - When the flag is off, render the existing static avatar preview only; do not surface upload/remove actions.

3. **Profile edit UI**  
   - In `app/assets/js/pages/ProfileEditPage/index.tsx`, replace `BigAvatar` with an interactive uploader:  
     - Use the existing `useRichEditorHandlers` pattern for uploads as a reference; call `Blobs.uploadFile(file, onProgress)` directly.  
     - Maintain local component state for `{id, url}`; display upload progress and allow retries/removal (set both fields to `null`).  
     - Preview uses `Avatar` with the temporary URL. When removing, revert to the previous `person.avatarUrl`.

4. **Mutation call**  
   - On save, call the new `updateProfilePicture` mutation with the pending `{avatarBlobId, avatarUrl}` and then submit the existing profile form (if other fields changed).  
   - Update the React query cache to reflect the returned avatar data before redirecting.

5. **Avatar component compatibility**  
   - Ensure `turboui/src/Avatar` needs no changes: it already renders any provided URL, so feeding the `/blobs/:id` link works as-is.

6. **Current company context**  
   - Verify `useMe` and other consumers (e.g., `CurrentCompanyContext`) merge the new `avatarBlobId` property so the freshly uploaded avatar propagates throughout the UI without a full reload.

### 3. Tests & QA

1. **Elixir tests**  
   - Add `app/test/operately_web/api/mutations/update_profile_picture_test.exs` covering:  
     - Uploading with both blob ID and URL updates the person, marks the blob as uploaded, and returns the data.  
     - Clearing the avatar resets both fields.  
     - Permission checks remain enforced.
   - Extend `app/test/operately/people_test.exs` to assert `FetchOrCreateAccountOperation` leaves custom avatars intact.

2. **JS tests / stories**  
   - Add unit coverage for the new uploader component if feasible (e.g., React Testing Library test to simulate selecting a file and submitting).  
   - Update Storybook stories for the profile page, showcasing the new upload flow (optional but helpful).

3. **Manual QA checklist**  
   - Upload a new avatar, ensure it appears immediately across the site and persists after refresh.  
   - Log out/in via Google; confirm the custom avatar remains unchanged.  
   - Remove the custom avatar; verify fallback initials display and Google sync can refill on next login.

### 4. Rollout

- Confirm `make test` (or targeted suites) pass.  
- Communicate the change so support knows how custom avatars now behave versus Google-provided defaults.

## Open Questions

- Do we require validation for max file size or allow the blob handler’s defaults to suffice? (Likely rely on existing blob constraints for now.)
- Should we expose a dedicated “Remove avatar” control, or is clearing the upload field enough? (Recommend an explicit action in the UI for clarity.)
