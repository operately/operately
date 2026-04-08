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

### 3. Import engine
- Stage uploaded JSON and ZIP under a temp workspace, then validate before any DB mutation:
  - package format version known
  - exact app/schema match via `schema_migrations`
  - every manifest file exists in the ZIP and hash/size checks pass
  - destination instance quota/limits check (company count, storage capacity)
  - no conflicts in `companies.short_id` (fail import if collision detected)
- Build ID translation table before row import:
  - generate new IDs for all company-scoped rows and build source→destination translation map
  - translation applies to primary keys and all foreign keys referencing remapped tables
  - always remap IDs regardless of destination state for consistency and simplicity
- Resolve accounts and build account mapping before row import:
  - for each source account email, check if destination account exists
  - if exists: reuse destination account ID, do not clone account fields, record source→destination account ID mapping
  - if not exists: generate new account ID, mark for creation with activation link
  - build account→people mapping: for each source person record, apply account ID remapping based on email resolution
- Import company data inside a single database transaction with raw SQL / `insert_all`-style writes in topological order:
  - apply ID translation table to all primary keys and foreign keys
  - apply account remapping to all account_id references and author_id/creator_id fields
  - preserve original timestamps for all company-scoped rows
  - bypass business operations so no new activities, notifications, or side effects are generated
  - on any constraint violation or error, rollback entire transaction and clean up staged files
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
1. **PR 1: Transfer run foundation.** Add export/import run tables, statuses, progress fields, validation error storage, temp artifact metadata, `CompanyTransfers` skeleton modules, and Oban worker shells. No real export/import logic yet.
2. **PR 2: Blob storage and archive utilities.** Add a storage adapter for local and S3 blob reads/writes with cross-storage streaming support, ZIP pack/unpack helpers, hashing utilities, and temp workspace management.
3. **PR 3: Schema graph and policy registry.** Add PostgreSQL table/FK introspection, automatic topological ordering, inclusion/exclusion policy hooks, polymorphic table registry, and regression tests for schema classification.
4. **PR 4: Polymorphic table audit and registry.** Audit codebase for all polymorphic associations (`*_type/*_id` patterns), add explicit entries to policy registry for `notifications`, `access_contexts`, and any others discovered, and add CI test that fails on unregistered polymorphic tables.
5. **PR 5: Rich-text column registry.** Audit schema for all JSON/map columns that may contain blob references, create explicit column registry with blob-node extractors, and add CI test that fails when new rich-text columns are added without extractor registration.
6. **PR 6: Core relational exporter.** Implement company-rooted FK traversal for normal relational tables, typed row serialization (including `bytea` handling), manifest generation, and JSON package writing for non-polymorphic data.
7. **PR 7: Polymorphic and dependency-parent export rules.** Add explicit collectors for `updates`, `comments`, `reactions`, `notifications`, `access_contexts`, `activities`, `comment_threads`, `subscription_lists`, `subscriptions`, `project_documents`, and reused `accounts`.
8. **PR 8: File discovery and export.** Add blob discovery from direct FK columns plus rich-text/map extractors using the column registry, generate the file manifest, collect blob payloads from storage abstraction, and pack into ZIP.
9. **PR 9: End-to-end export worker.** Wire the collector and file packer into the export worker, produce downloadable JSON and ZIP artifacts, and finish the Company Admin download flow with progress tracking.
10. **PR 10: Export notifications and emails.** Add notification creation on export completion, email template and delivery for "export ready" with download links, and notification click-through to export page.
11. **PR 11: Source-side export UI.** Add the Company Admin entrypoint, export management page with history list, "Start export" action, real-time progress polling, download buttons for completed exports, cancel action for running exports, delete action for completed/failed exports, and empty state.
12. **PR 12: Export cancellation and cleanup.** Implement graceful cancellation in Oban worker (check before each step), cancel endpoint in API, artifact cleanup on cancellation/failure/deletion, and storage deletion helpers.
13. **PR 13: Import preflight validator and dry-run.** Parse the package, unpack the ZIP, verify manifest/schema/version compatibility, validate file hashes, check destination quotas/limits, detect `short_id` conflicts, and report dry-run validation results without mutating data.
14. **PR 14: ID translation table builder.** Implement logic to generate new IDs for all company-scoped tables, build source→destination ID translation map, and add translation application helpers for primary keys and foreign keys.
15. **PR 15: Account resolution and mapping.** Implement account matching by email, build source→destination account ID mapping, detect duplicate source emails (fail validation), prepare new-account creation list, and build account→people remapping logic.
16. **PR 16: Transaction-wrapped row importer.** Implement ordered table import inside a single DB transaction with ID translation and account remapping applied, preserve timestamps, bypass business logic, add constraint violation handling with full rollback, and add detailed error reporting.
17. **PR 17: File import with cleanup.** Write blob payloads to storage before DB transaction (with ID remapping applied), track uploaded keys, implement cleanup on any failure (validation, file write, or DB rollback), and verify no partial artifacts remain.
18. **PR 18: Post-import side effects and finalization.** Send emails to reused accounts and new accounts after successful DB commit, grant owner access to importing user, redirect to imported company, and mark run as completed.
19. **PR 19: Destination-side import UI.** Add the Lobby entrypoint, import page, two-file upload form, run creation endpoint, polling API, validation result display, progress tracking, error display, and success redirect.
20. **PR 20: Export management tests.** Add tests for export cancellation (graceful worker stop, artifact cleanup), export deletion (storage cleanup, run record removal), multiple concurrent exports, and notification/email delivery on completion.
21. **PR 21: Permission fidelity tests.** Add tests verifying access groups, memberships, bindings, contexts, and effective permissions are preserved through account remapping and ID translation.
22. **PR 22: E2E coverage for empty destination.** Add end-to-end test for import into empty destination with full company data, verify ID remapping works correctly, account creation, file fidelity, and importer access.
23. **PR 23: E2E coverage for existing destination.** Add end-to-end test for import into destination with existing companies, verify translation table correctness, account reuse, no cross-company data leakage, and permission preservation.
24. **PR 24: Failure and rollback tests.** Add tests for version mismatch, manifest/hash errors, missing ZIP entries, `short_id` collision, duplicate source emails, quota exceeded, mid-import DB errors, and file write failures; verify full cleanup and no partial state.
25. **PR 25: Cross-storage migration tests.** Add tests for S3→local, local→S3, and S3→S3 blob migration with large files, verify streaming works, and validate blob integrity.
26. **PR 26: Schema-guard hardening and docs.** Harden CI schema-guard so new tables, polymorphic associations, and rich-text columns must be explicitly classified, add operational documentation for admins, and document the import/export workflow.
