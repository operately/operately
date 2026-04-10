# Company Migration Package

## Summary
Build a two-artifact company migration feature that exports one company as:
- a JSON data package containing all company-owned rows plus required dependency rows and a manifest
- a ZIP containing every referenced file blob

Export starts from Company Admin on the source instance. Import starts from the Lobby page on the destination instance and runs as a background job.

The migration mode is an exact same-version clone with these explicit exceptions:
- existing destination accounts are reused by email instead of cloned
- brand-new destination accounts are created with activation-link onboarding, not source password reuse
- the destination-side importer is guaranteed owner access after import, even if they were not in the source package
- ID remapping is applied when destination has existing companies to prevent primary key collisions
- account-to-person mapping preserves relationships through a translation table during import

## Implementation Changes
### 1. Workflow and surfaces

**Export workflow:**
- Add Company Admin action and page for `Export company` with:
  - "Start export" button (only for company owners)
  - Export history list showing all past and current exports with status, progress, created date, file sizes, and actions
  - Each export row shows: status badge (pending/running/completed/failed/cancelled), progress percentage, requester name, timestamps, and action buttons
  - Action buttons per export: "Download JSON", "Download ZIP" (when completed), "Cancel" (when running), "Delete" (when completed/failed)
  - Real-time progress updates via polling while user stays on page
  - Empty state when no exports exist
- When user starts export:
  - Create export run record with status=pending
  - Enqueue Oban worker immediately
  - Show success toast: "Export started. You'll receive a notification when it's ready."
  - User can navigate away; export continues in background
- When export completes:
  - Create in-app notification: "Your company export is ready for download"
  - Send email: "Your [Company Name] export is ready" with link back to export page
  - Notification and email include export size and direct download links
- User can return to export page anytime to:
  - See all exports and their status
  - Download completed exports (JSON and ZIP as separate downloads)
  - Cancel running exports (marks as cancelled, stops worker gracefully)
  - Delete completed/failed exports (removes artifacts from storage and run record)
- Observation: this spec currently limits export to company owners. Verify that this remains intentional, since earlier discussion used "admin user" more broadly.

**Import workflow:**
- Add Lobby action and page for `Import organization`.
- Similar background processing with notifications for import completion

**Persistent run records:**
- Add `company_export_runs` and `company_import_runs` tables with:
  - status (pending/running/completed/failed/cancelled)
  - progress fields (current_step, total_steps, percentage, current_table)
  - validation errors, counts (tables, rows, files)
  - manifest summary (company name, export date, version)
  - requested_by (account_id), company_id
  - artifact staging paths (json_path, zip_path)
  - file sizes (json_size_bytes, zip_size_bytes)
  - timestamps (inserted_at, started_at, completed_at)
  - cancellation fields (cancelled_at, cancelled_by)
- Back both flows with Oban workers so large companies do not run inside request/response.
- Use browser/controller endpoints for binary download/upload and API endpoints for status polling, page state, cancellation, and deletion.

### 2. Export engine
**Worker lifecycle:**
- Oban worker checks for cancellation before each major step (table collection, file packing)
- Updates progress after each table is processed
- On cancellation: mark run as cancelled, clean up partial artifacts, exit gracefully
- On completion: mark run as completed, record file sizes, trigger notification and email
- On failure: mark run as failed with error details, clean up partial artifacts

**Export collection:**
- Introduce a `CompanyTransfers` subsystem with:
  - a PostgreSQL schema graph loader from `pg_catalog` / `information_schema`
  - a row collector that works from table metadata, not hand-maintained Ecto schema lists
  - a small policy registry for exclusions and special cases
- Use a hybrid collector:
  - automatic FK traversal for normal relational tables
  - dependency-parent inclusion for tables referenced by included rows but not reachable from `company_id` alone
  - explicit selectors for polymorphic tables
  - explicit extractors for blob references inside rich-text JSON
- Seed the traversal from the selected `companies` row, then include only rows tied to that company graph. Never traverse from reused global rows back into unrelated company data.
- Preserve original IDs, timestamps, soft-delete state, access-control rows, notifications, invite artifacts, API tokens, agent history, and other company-scoped operational data.
- Exclude only global/system data that is not company-scoped or should not be migrated:
  - `accounts_tokens` and other live auth/session/reset tokens
  - `schema_migrations`, `oban_*`, transfer-run tables, global system settings
- Export JSON as a typed package with:
  - `manifest`: package format version, Operately app version, exact `schema_migrations` list, export timestamp, source company IDs
  - `policies`: exact-clone mode and account-resolution rules
  - `tables`: ordered table sections with column metadata and rows
  - `files`: blob/file manifest with blob IDs, zip paths, hashes, sizes, content types
- Make the serializer type-aware so non-JSON DB values survive round-trip, especially `bytea` columns such as API token hashes.
- Add a blob storage abstraction for reading file bytes from local storage or S3 using the existing `company_id-blob_id` object key convention.
- Store completed export artifacts in a dedicated exports storage location (e.g., `exports/[export_run_id]/data.json` and `exports/[export_run_id]/files.zip`).
- Support artifact cleanup: when user deletes an export, remove both files from storage and the run record from database.
- Observation: if IDs are remapped on import, export must preserve enough structure in JSON/map fields for a later rewrite pass. Relational PK/FK extraction alone will not cover references embedded in activity payloads, rich-text maps, or derived ordering state.

### 3. Import engine
- Stage uploaded JSON and ZIP under a temp workspace, then validate before any DB mutation:
  - package format version known
  - exact app/schema match via `schema_migrations`
  - every manifest file exists in the ZIP and hash/size checks pass
  - destination instance quota/limits check (company count, storage capacity)
  - no conflicts in `companies.short_id` (fail import if collision detected)
- Observation: quota/limit validation depends on a real source of truth for those limits. If the app still has no server-side quota model when this is implemented, reduce this to artifact-size/storage checks or split quota enforcement into separate work.
- Build ID translation table before row import:
  - generate new IDs for all company-scoped rows and build source→destination translation map
  - translation applies to primary keys and all foreign keys referencing remapped tables
  - always remap IDs regardless of destination state for consistency and simplicity
- Observation: this translation step must also rewrite IDs stored inside JSON/map payloads and string-based ordering state, not just relational columns. In the current schema that likely includes activity content, rich text, kanban/order state, mentions, and any other serialized resource references.
- Resolve accounts and build account mapping before row import:
  - for each source account email, check if destination account exists
  - if exists: reuse destination account ID, do not clone account fields, record source→destination account ID mapping
  - if not exists: generate new account ID, mark for creation with activation link
  - build account→people mapping: for each source person record, apply account ID remapping based on email resolution
- Observation: keep account remapping and person remapping separate. In the current schema, fields such as `author_id`, `creator_id`, `reviewer_id`, `champion_id`, and similar references point to `people`, not `accounts`.
- Import company data inside a single database transaction with raw SQL / `insert_all`-style writes in topological order:
  - apply ID translation table to all primary keys and foreign keys
  - apply account remapping to all account_id references and author_id/creator_id fields
  - preserve original timestamps for all company-scoped rows
  - bypass business operations so no new activities, notifications, or side effects are generated
  - on any constraint violation or error, rollback entire transaction and clean up staged files
- Observation: the wording above should be read as "apply account remapping to `account_id` fields, and apply person ID remapping to person-owned references such as `author_id`/`creator_id`." Implementers should not treat those as account fields.
- Write file blobs before database transaction:
  - upload/copy ZIP blobs through the storage abstraction using final blob keys (with ID remapping applied)
  - track uploaded blob keys for cleanup on failure
  - if any file write fails, clean up partial uploads and abort before DB transaction
- Apply only two post-import side effects after successful DB commit:
  - email reused accounts that a new company was added to their account
  - email new accounts with activation/setup links
- Grant destination importer owner access after the import completes:
  - if their email matched an imported person, elevate that imported person to owner
  - otherwise create a new person in the imported company for the importer and grant owner access
- On any failure (validation, file write, DB transaction), clean up all artifacts:
  - delete uploaded blobs from storage
  - remove temp workspace files
  - mark import run as failed with detailed error message
  - ensure no partial company data remains in database
- Redirect the importing user to the imported company when the run completes successfully.

### 4. Special-case coverage
- Handle polymorphic tables explicitly:
  - `updates` by `updatable_type/updatable_id`
  - `comments` and `reactions` by `entity_type/entity_id`
  - `notifications` by `resource_type/resource_id`
  - `access_contexts` by `context_type/context_id`
  - any other polymorphic associations discovered via schema audit
- Observation: this list is a planning aid, not confirmed schema truth. In the current codebase, `notifications` appear to be keyed by `activity_id` and `person_id`, and `access_contexts` use dedicated nullable foreign keys rather than a generic type/id pair. Re-verify the real schema before implementing this registry.
- Handle dependency-parent tables explicitly when referenced from owned rows:
  - `accounts`
  - `subscription_lists` and their `subscriptions`
  - `project_documents`
  - other parent-only tables discovered by FK policy
- Handle file/blob discovery from:
  - direct blob FKs such as avatars and resource hub files/previews
  - rich-text/map columns through a registry of blob-node extractors for current content fields
  - maintain an explicit column registry for JSON/map fields that may contain blob references
- Add a schema-policy guard so new future tables are auto-included when they fit the FK graph, and CI fails when a new table introduces an unresolved polymorphic or file-reference path.
- Support cross-storage migration (S3 source to local destination and vice versa) by streaming blob bytes through the storage abstraction.

## Test Plan
- Export/import a fully populated company with people, spaces, projects, goals, tasks, discussions, resource hub content, legacy updates, activities, notifications, invites, API tokens, and permission tables.
- Verify cross-company isolation by exporting one of two companies in the same DB and asserting zero rows/files from the other company.
- Verify permission fidelity by comparing access groups, memberships, bindings, contexts, and effective access for sampled users before and after import.
- Verify account resolution:
  - existing destination account by email is reused and receives a “new company available” email
  - missing account gets created and receives an activation/setup email
- Verify importer access:
  - importer in package becomes owner
  - importer not in package gets an extra owner person record in the imported company
- Verify file fidelity for avatar blobs, rich-text attachments, resource hub files, and previews under both local storage and S3-backed storage.
- Verify failure behavior for version mismatch, manifest/hash mismatch, missing ZIP entries, PK/short_id collisions, malformed JSON, and forced mid-import DB errors; assert no partial company remains and uploaded files are cleaned up.
- Add a schema-graph regression test that fails when a new reachable table is neither automatically handled nor explicitly policy-classified.

## Assumptions and Defaults
- Same-version only: import requires exact schema compatibility via `schema_migrations`; no cross-version migration support.
- ID remapping strategy:
  - All company-scoped IDs are always remapped via translation table
  - New IDs are generated for all imported rows to prevent any collision risk
  - Simplifies logic by removing conditional ID preservation
- Timestamps are always preserved for all company-scoped rows.
- Account resolution:
  - Accounts matched by email are reused; source account fields (name, avatar, settings) are NOT overwritten
  - New accounts are created with new IDs and activation links; source passwords are NEVER cloned
  - Person records are imported with account_id remapped to resolved destination account IDs
  - If source has duplicate emails across people (edge case), import fails with validation error
- Global account/session artifacts are not cloned. Company-scoped API tokens are cloned with remapped IDs.
- Import suppresses all historical side effects except the explicit destination emails and importer-owner grant.
- `companies.short_id` must be free on the destination; conflicts fail the import rather than remapping it.
- Permission and access control rows are imported with ID remapping applied; effective permissions are preserved through account email matching.
- Import runs inside a single database transaction; any failure triggers full rollback and file cleanup.

## Implementation Steps
Implementation should be delivered in vertical slices. Each slice must leave the product usable and testable end-to-end, even if coverage is intentionally incomplete.

**Slice 1 outcome:** export and import work through real UI/API/worker flows for schema-driven relational data only. Missing polymorphic rows, serialized ID rewrites, and files are acceptable at this stage as long as tests make those limits explicit.

1. [x] **PR 1: Transfer run foundation.** Added `company_export_runs` and `company_import_runs`, statuses, progress fields, validation error storage, temp artifact metadata, `CompanyTransfers` skeleton modules, and Oban worker shells.
2. [x] **PR 2: Archive and staging utilities.** Added JSON/ZIP helpers, hashing utilities, temp workspace management, and artifact storage conventions for completed exports. Keep storage support minimal for the first slice; file payload migration can come later.
   - Observation: package/staging concerns now live under `Operately.CompanyTransfers.Package.*`. Keep later archive/workspace/artifact helpers in that namespace unless they become core transfer orchestration logic.
3. [x] **PR 3: Schema graph and relational policy registry.** Added PostgreSQL table/FK introspection, automatic topological ordering, inclusion/exclusion hooks, and tests for graph discovery of non-polymorphic relational tables.
   - Observation: the current `discover_exportable_tables/0` behavior is effectively "all non-excluded tables in dependency order", which includes dependency-parent and polymorphic tables. PR 4/5 should decide explicitly whether they consume that full list or filter further for the minimal relational slice.
   - Observation: `detect_cycles/1` currently returns only a representative node where a cycle was detected, not the full set of cycle members. That is fine for diagnostics, but later cycle-specific import logic should not assume it has complete cycle information.
4. [x] **PR 4: Minimal export engine.** Implemented company-rooted relational export using FK ownership paths to `companies`, typed row serialization for DB values, manifest generation, JSON package writing, and a placeholder ZIP artifact.
   - Observation: ownership for the minimal slice is derived from included-table FK paths that resolve to `companies`; dependency-parent export is still limited to rows directly referenced from that owned graph plus dependency-parent descendants such as `subscriptions`.
   - Observation: the ZIP is currently a placeholder artifact only. Real file payload discovery and storage transfer still start in PR 11-13.
5. [ ] **PR 5: Minimal import engine.** Implement package parsing, same-version/schema validation, ID translation table generation, account matching by email, and transaction-wrapped relational row import for the non-polymorphic graph.
   - Observation: even in this minimal slice, keep account remapping and person remapping separate. Person-owned references such as `author_id` and `creator_id` must not be treated as account fields.
6. [ ] **PR 6: Minimal product flow and tests.** Add the Company Admin export page and Lobby import page, start/poll/download/upload endpoints, end-to-end worker wiring, and a basic E2E test proving export then import works for a fixture limited to schema-driven relational data.

**Slice 2 outcome:** export and import continue to work end-to-end, now with explicit polymorphic coverage and serialized ID rewriting for non-file content.

7. [ ] **PR 7: Polymorphic audit and registry.** Audit the real schema and codebase for polymorphic associations, add explicit registry entries only for confirmed cases, and add CI coverage that fails on new unclassified polymorphic patterns.
   - Observation: validate the real schema first; the current plan names `notifications` and `access_contexts` here as likely audit targets, not confirmed polymorphic tables.
8. [ ] **PR 8: Serialized reference registry.** Audit JSON/map/string columns for embedded resource IDs, mentions, and ordering-state references; create a generalized serialized-reference rewrite registry rather than a blob-only registry.
   - Observation: because import always remaps IDs, this registry is required for correctness, not just completeness.
9. [ ] **PR 9: Polymorphic export/import coverage.** Add explicit collectors and import support for polymorphic tables and serialized payload rewrites, including activities, comments, reactions, updates, comment threads, and other audited cases.
10. [ ] **PR 10: Polymorphic slice tests.** Add E2E tests showing that export/import now preserves polymorphic data and serialized references correctly.

**Slice 3 outcome:** export and import continue to work end-to-end, now with real file coverage and cross-storage correctness.

11. [ ] **PR 11: Blob storage abstraction.** Add storage adapters for local and S3 blob reads/writes with streaming support and a stable interface used by both export and import.
12. [ ] **PR 12: File discovery registry.** Add blob discovery from direct FK columns plus file references inside serialized rich-text/map fields using the audited registry.
13. [ ] **PR 13: File export/import.** Pack real file payloads into the ZIP, write blobs to destination storage during import, apply ID remapping to blob keys, and add cleanup on failure.
14. [ ] **PR 14: File slice tests.** Add E2E tests for avatars, resource hub files, previews, and rich-text attachments under at least local storage. Add cross-storage tests after local coverage is stable.

**Slice 4 outcome:** the feature is operationally usable by admins, with notifications, cancellation, cleanup, and stronger failure handling.

15. [ ] **PR 15: Export completion notifications.** Add in-app notification and email delivery for completed exports, plus click-through back to the export page.
16. [ ] **PR 16: Export management UX.** Expand the Company Admin export page to show history, status, download actions, and delete actions for completed/failed runs.
17. [ ] **PR 17: Cancellation and artifact cleanup.** Implement graceful cancellation, cancel endpoints, deletion of artifacts on cancellation/failure/user delete, and tests for cleanup behavior.
18. [ ] **PR 18: Import UX and finalization.** Expand the Lobby import page with validation feedback, progress tracking, success/failure presentation, importer-owner grant, and redirect into the imported company.

**Slice 5 outcome:** the feature is hardened for broader use and future schema evolution.

19. [ ] **PR 19: Permission fidelity tests.** Add focused tests for access groups, memberships, bindings, contexts, and effective permissions after account matching and ID translation.
20. [ ] **PR 20: Existing-destination tests.** Add E2E coverage for importing into an instance that already has other companies and some existing accounts, verifying no cross-company leakage.
21. [ ] **PR 21: Failure and rollback tests.** Add tests for version mismatch, malformed packages, hash mismatches, missing ZIP entries, `short_id` collision, duplicate source emails, DB failures, and file write failures.
22. [ ] **PR 22: Cross-storage tests.** Add S3→local, local→S3, and S3→S3 migration tests once the local-path file slice is stable.
23. [ ] **PR 23: Schema-guard hardening and docs.** Harden CI so new tables, polymorphic associations, and serialized-reference columns must be classified, and document the workflow and known limitations for admins.
