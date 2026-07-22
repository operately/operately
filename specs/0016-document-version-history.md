# Document Version History and Rich-Text Diffs

## Summary

Add immutable version history to native Docs & Files documents so authorized editors can:

- see when a document's title or content changed
- identify the person responsible for each saved version
- compare a version with its predecessor in a GitHub-style split diff
- distinguish additions, deletions, replacements, formatting changes, and structural changes
- restore an earlier title and body without deleting subsequent history

The backend stores complete title-and-content snapshots. The frontend parses two snapshots with Operately's real TipTap/ProseMirror schema, computes a semantic diff with `@tiptap/pm/changeset`, and renders the old and new documents in read-only TurboUI views.

Diffs are computed on demand in the browser. The backend does not compare raw JSON and does not persist pairwise diff results.

---

## Issue Closed

This work closes [#2587 — Docs versioning and history](https://github.com/operately/operately/issues/2587).

---

## Problem

Native resource-hub documents currently keep only their latest title and body on `resource_documents`:

- the title is stored in `resource_documents.name`
- the TipTap JSON body is stored in `resource_documents.content`
- editing updates that single canonical row
- there is no immutable document snapshot table

(The resource node still places the document in the folder tree; it no longer owns the display title. See [0017-migrate-resource-name-from-node.md](0017-migrate-resource-name-from-node.md).)

The `resource_hub_document_edited` activity stores the post-edit body, but it is not a complete or reliable version record:

- the document-created activity stores the title but not the body
- the document-edited activity stores the body but not the title
- activity retention and activity presentation have different responsibilities from document history
- draft creation does not create the same activity trail as a published document
- existing activity data cannot reconstruct a complete sequence of title-and-body snapshots

Users therefore cannot inspect an earlier document, understand exactly what changed, or recover from an accidental edit. This limits the usefulness of native documents for playbooks, operating procedures, policies, and other long-lived company knowledge.

---

## Goals

- Capture an immutable snapshot whenever a document title or body changes.
- Capture the first snapshot when a published document is created, including copies.
- Do not capture versions while a document remains a draft; draft edits update the canonical document only.
- Capture version 1 when a draft is first published.
- Compare each saved version with its immediate predecessor from the history timeline.
- Preserve rich-text semantics when comparing paragraphs, headings, lists, marks, links, mentions, and blobs.
- Make formatting-only and structure-only changes visible.
- Restore an earlier title and body as a new version.
- Keep version capture atomic with the canonical document write.
- Prevent concurrent saves from assigning duplicate or out-of-order version numbers.
- Apply existing document view access rules to history reads; require edit access only for restoration.
- Keep new UI in TurboUI and backend interaction in an app page bridge.
- Include document versions and their historical blob/mention references in company export and import.
- Preserve a path for reading snapshots after the TipTap schema evolves.

## Non-goals

- Live collaborative editing or operational transformation.
- Google Docs-style per-keystroke history.
- Persisting every ProseMirror transaction or editor undo step.
- Three-way merging of concurrent edits.
- Automatic move detection in the first release. Moved content appears as a deletion and an insertion.
- Restoring document comments, reactions, subscribers, parent folder, publication time, or document state.
- Copying the source document's complete history when copying a document.
- Comparing native documents with uploaded Word, PDF, Google Docs, or other external files.
- Searching historical versions in full-text search. Search continues to index only the current canonical document.
- A permanent-redaction workflow for removing selected content from retained historical versions. Document/company deletion still removes the complete document history.
- A unified old-and-new document tree in the first release. The initial diff is a split view.

---

## Important Decisions

### 1. Store complete immutable snapshots

Each version stores the complete document title and TipTap JSON body after a successful save.

Do not store only patches or ProseMirror transactions. Full snapshots are preferable because they:

- allow any two versions to be compared directly
- remain useful when intermediate versions are unavailable
- make restoration a simple validated copy
- avoid coupling durable history to one editor session
- are easier to export, import, inspect, and repair
- keep version writes straightforward and transactionally safe

Native document bodies are expected to be small enough that snapshot storage is acceptable. Measure actual table growth after rollout before introducing compression or retention policies.

Version rows are append-only. Application code must never update a version's title, content, author, origin, version number, or timestamp after insertion.

### 2. Activities are not the version store

Do not reconstruct history from `activities` and do not make version reads depend on activity retention.

Normal document edits continue to create the existing `resource_hub_document_edited` activity. Version restoration creates a new `resource_hub_document_version_restored` activity because restoration is a distinct audit event.

The activity references the restored version number but does not duplicate the historical body into activity content.

### 3. Backend owns history; frontend owns diffing

Responsibilities are split as follows:

| Layer | Responsibility |
| --- | --- |
| Elixir backend | Store snapshots, assign version numbers, authorize reads, serialize versions, restore snapshots, and enforce concurrency |
| App page bridge | Load versions, call restore APIs, construct routes, read app contexts, and pass props into TurboUI |
| TurboUI | Parse snapshots with the editor schema, calculate changed ranges, render the history and diff UI, and manage local version selection |

Do not implement a generic JSON diff in Elixir. Raw JSON comparison would expose serialization details rather than user-visible document changes, and the backend does not own the complete TipTap extension schema used to interpret the content.

### 4. Use ProseMirror's schema-aware change set

Use `ChangeSet` and `simplifyChanges` from `@tiptap/pm/changeset`. `@tiptap/pm` is already a direct TurboUI dependency and exposes the installed `prosemirror-changeset` package.

The library represents each replacement with coordinates in both documents:

- `fromA` and `toA` identify the removed/replaced range in the old document
- `fromB` and `toB` identify the added/replaced range in the new document

References:

- [TipTap JSON and document structure](https://tiptap.dev/docs/editor/core-concepts/introduction)
- [ProseMirror changeset API](https://github.com/ProseMirror/prosemirror-changeset#readme)
- [ProseMirror changeset diff implementation](https://github.com/ProseMirror/prosemirror-changeset/blob/master/src/diff.ts)
- [ProseMirror decorations](https://prosemirror.net/docs/guide/#view.decorations)

Saved snapshots do not contain the original transaction step maps. Create one synthetic `StepMap` that describes replacement of the complete old document with the complete new document. `ChangeSet` then minimizes that replacement into precise ranges with its token diff.

Do not call the library's internal `computeDiff` function directly.

### 5. Use a custom semantic token encoder

The default `ChangeSet` token encoder compares node types and text characters but ignores marks and attributes. Operately must provide a custom encoder so user-visible semantic changes are not lost.

The encoder includes:

- text characters
- normalized text marks and their semantic attributes
- node-opening and node-closing tokens
- node type
- heading level
- ordered-list start value
- link destination
- mention person ID and stored label
- blob ID, filename/alt text, title, file type, and other stable user-visible attributes

The encoder ignores transient or derived attributes, including:

- upload progress
- temporary upload status
- expiring or regenerated blob URLs when a stable blob ID exists
- runtime-only node-view state

Attribute keys and mark collections must be normalized into stable order before token comparison. The encoder must be a small, deterministic module with fixture-driven tests; it must not depend on DOM rendering or React node views.

### 6. Start with a split diff

The first release uses two read-only rich-content views:

- the old version on the left, with removed content highlighted
- the new version on the right, with added content highlighted
- a stacked old-then-new layout on narrow screens

This keeps each snapshot as a valid ProseMirror document. It also makes deleted blocks, lists, mentions, and blobs available in their original tree without constructing a third synthetic document.

A unified diff is deferred because deleted content no longer exists in the new tree. Producing a valid unified document requires inserting old slices into the new schema, handling open slice depths, and resolving node-boundary conflicts. The diff engine designed here can support that later without changing the stored version format.

### 7. History reads use document view access

Anyone who can view a document can list and read its version history. Do not add a separate history permission; authorize history endpoints with existing `can_view`.

Restoration additionally requires current `can_edit_document` permission and a company that is not read-only.

The history API must authorize before returning titles, authors, timestamps, or content.

### 8. Restoration appends history

Restoring version 4 while version 9 is current creates version 10. Versions 5 through 9 remain intact.

Restoration copies only:

- title
- TipTap JSON body

Restoration does not change:

- draft/published state
- original document author
- parent folder or resource hub
- publication timestamp
- subscriptions
- comments
- reactions

The restored snapshot records `origin: restored` and `restored_from_version_number: 4`.

If the selected snapshot is semantically identical to the current title and body, restoration succeeds as an idempotent no-op and does not create a duplicate version or activity.

Restoring content updates the document's mentioned-person subscription state, but it must not send fresh mention notifications merely because old content was restored.

### 9. Version numbering is transactional and concurrency-safe

Add `current_version` to `resource_documents`. It represents the current title/body revision, not the document's publication state.

All write operations that may change title/body on a **published** document must:

1. load and lock the canonical document row inside the transaction
2. compare the submitted title/body with the locked canonical values
3. leave `current_version` unchanged when only subscriptions or state changed
4. increment `current_version` exactly once when title or body changed
5. insert the matching snapshot using the new number
6. update the canonical document (`name` / `content`) and snapshot in the same transaction

Draft title/body writes update the canonical document only. They do not increment `current_version`, insert version rows, or emit a `resource_hub_document_edited` activity. Version history for a draft begins at first publish.
Add optional `expected_version` input to the document update API. First-party UI sends it on every published title/body save. When supplied and stale, return a version-conflict error instead of silently overwriting a newer save.

Keep `expected_version` optional for backward compatibility with existing CLI/MCP/API clients. Writes without it still lock the row and receive a unique next version, but retain last-write-wins behavior.

Do not add `expected_version` to publish. That endpoint only publishes drafts, which do not accumulate version history until the first publish creates version 1.

The restore API always requires `expected_current_version` because it is a new endpoint and has no compatibility constraint.

### 10. Historical rich content participates in export/import and blob retention

Add `resource_document_versions` to the company-transfer schema and dependency graph.

Export/import must:

- translate `document_id` and `editor_id`
- rewrite mentioned person IDs inside every historical `content` map
- discover blob IDs referenced only by historical versions
- export the corresponding blob payloads
- rewrite blob IDs on import
- preserve version numbers, origins, restoration source numbers, and timestamps
- set the imported canonical document's `current_version` consistently with the imported version rows

The generic file-discovery traversal already scans schema-backed map fields containing top-level TipTap documents. Registering the version schema must make historical version bodies visible to that traversal; add regression coverage rather than adding a one-off version-specific scanner.

Blob cleanup must consider historical version bodies as live references. A blob must not be removed while any retained document version references it.

Copying a document copies only its current title and content into version 1 of the new document. It does not copy version rows from the source document.

---

## Data Model

### `resource_documents`

Add:

| Column | Type | Constraints | Purpose |
| --- | --- | --- | --- |
| `current_version` | integer | not null, default `1`, check `> 0` | Current title/body revision number |

Expose this as `currentVersion` in essential and full document serialization.

### `resource_document_versions`

Create:

| Column | Type | Constraints | Purpose |
| --- | --- | --- | --- |
| `id` | binary UUID | primary key | Stable version record ID |
| `document_id` | binary UUID | not null, FK to `resource_documents`, delete cascade | Owning document |
| `version_number` | integer | not null, check `> 0` | Monotonic per-document version |
| `title` | text | not null | Document title (`resource_documents.name`) at this revision |
| `content` | map/JSONB | not null | Complete TipTap JSON snapshot |
| `editor_id` | binary UUID | nullable FK to `people`, `on_delete: :nilify_all` | Person who produced the version; null for migration baselines or removed editors |
| `origin` | enum/string | not null | `created`, `edited`, `restored`, or `migration` |
| `restored_from_version_number` | integer | nullable, check `> 0` | Source version for a restoration |
| `inserted_at` | UTC datetime | not null | Version creation time |

Do not add `updated_at`; version rows are immutable.

Indexes and constraints:

- unique `(document_id, version_number)`
- index `(document_id, inserted_at DESC)`
- index `editor_id`
- check that `restored_from_version_number` is present if and only if `origin = restored`

Create `Operately.ResourceHubs.DocumentVersion` with only persistence, validation, and version-query responsibilities. Keep restoration orchestration in an operation module.

### Existing-document baseline

Use an idempotent data migration under `app/lib/operately/data` to create version 1 for every existing document:

- `title`: current `resource_documents.name`
- `content`: current document content
- `editor_id`: null
- `origin`: `migration`
- `inserted_at`: document `updated_at`
- `resource_documents.current_version`: `1`

The baseline reads title and body from the document row only; it does not join `resource_nodes`.

The history UI labels this row `History Begins Here` and explains `This is the earliest saved version available.` It does not attribute the row to the original author or imply that it is the original document body.

Per the repository's data-migration rules, the migration must define minimal inline schemas or use direct SQL. It must not depend on the current application `Document`, `Node`, or `DocumentVersion` modules.

Existing activity data is intentionally not used to synthesize older versions because it cannot produce complete title-and-body snapshots.

---

## Version Capture Lifecycle

### Document creation

`ResourceHubDocumentCreating` inserts:

1. resource node (tree placement only; no title write)
2. canonical document with `name`, `content`, and `current_version: 1`
3. for published documents only: version 1 with `origin: created` (title copied from `document.name`)
4. existing subscriptions and activity behavior

Draft creation does **not** insert a version row. Draft title/body edits update the canonical document without incrementing `current_version`, inserting versions, or emitting a document-edit activity.

Copied published documents create their own version 1 from the copied current title/body.

### Document editing

Refactor `ResourceHubDocumentEditing` so title/body comparison happens against the locked `resource_documents` row inside its transaction.

- If the document is a draft and title/body changed, update `resource_documents.name` / `content` only. Do not increment `current_version`, insert a version, or emit a document-edit activity.
- If the document is published and title/body changed, update `resource_documents.name` / `content`, increment `current_version`, insert `origin: edited`, and keep the existing edit activity.
- If only subscription settings changed, update subscriptions without changing `current_version`, creating a version, or emitting a misleading document-edit activity.
- If neither changed, return the canonical document without writes.

This backend comparison is required even though the current form avoids most no-op saves. API and MCP callers cannot be assumed to perform the same client-side check.

### Draft publishing

`ResourceHubDocumentPublishing` continues to change state and publication time.

- Publishing a draft always inserts version 1 with `origin: created` from the final published title/body (including any title/body supplied on the publish call).
- Publishing must not produce two snapshots when both title and content changed.
### Restoration

Create `Operately.Operations.ResourceHubDocumentVersionRestoring`.

The operation:

1. loads and locks the canonical document with its node and resource-hub context (node/hub for access; title lives on the document)
2. verifies `expected_current_version`
3. loads the selected version and verifies it belongs to the document
4. returns success without writes when title/body already match
5. increments `current_version`
6. updates `resource_documents.name` and `content` from the snapshot
7. inserts a version with `origin: restored`
8. refreshes mentioned-person subscriptions without dispatching mention notifications
9. inserts `resource_hub_document_version_restored`
10. commits all changes atomically

The activity feed text is `restored {document} to version {number}`. Its notification handler returns no recipients in the first release.

Implement all five required activity components:

1. content handler
2. notification handler
3. API type
4. serializer
5. frontend feed handler and registration

---

## API Contract

Add the following operations to the `documents` namespace and regenerate TypeScript API bindings.

### `documents.list_versions`

Input:

```ts
{
  documentId: ID;
}
```

Output:

```ts
{
  versions: DocumentVersionSummary[];
}
```

`DocumentVersionSummary` contains:

```ts
{
  id: ID;
  versionNumber: number;
  title: string;
  editor: Person | null;
  origin: "created" | "edited" | "restored" | "migration";
  restoredFromVersionNumber: number | null;
  insertedAt: string;
  isCurrent: boolean;
  titleChanged: boolean;
  contentChanged: boolean;
}
```

`titleChanged` / `contentChanged` compare each version to its predecessor (`n-1`). Version 1 is always `false`/`false`.

Do not include TipTap content in the list response.

Return all versions for the document, sorted by `version_number DESC`. Pagination, if needed in the UI, is handled on the frontend.

### `documents.get_version`

Input:

```ts
{
  documentId: ID;
  versionNumber: number;
}
```

Output adds:

```ts
{
  content: JSONValue;
}
```

The endpoint verifies that the requested version belongs to the requested document.

For side-by-side comparison, the frontend loads two snapshots with parallel `documents.get_version` calls. It chooses before/after ordering and rejects comparing a version with itself. The backend does not expose a dedicated comparison endpoint and does not calculate changed ranges.

### `documents.restore_version`

Input:

```ts
{
  documentId: ID;
  versionNumber: number;
  expectedCurrentVersion: number;
}
```

Output:

```ts
{
  document: ResourceHubDocument;
  restoredVersion: DocumentVersionSummary | null;
}
```

`restoredVersion` is null for an idempotent no-op.

### Existing write APIs

Add optional `expected_version` to:

- `documents.update`

Do not add it to `documents.publish` (drafts only; first publish creates version 1).

Return a distinct conflict response when it does not match the locked document's `current_version`. The first-party edit form shows a persistent error explaining that a newer version exists and offers to reload; it must not silently retry with stale content.

Do not include snapshot bodies, titles, mention labels, or diff fragments in logs, telemetry, or error messages.

---

## Diff Algorithm

### Shared schema construction

Extract a pure `createRichEditorExtensions` function from `turboui/src/RichEditor/useEditor.tsx` so editable content, read-only content, and version diffs construct the same schema.

The factory accepts the existing rich-editor handlers and editable flag. It must not create React state or an editor instance.

The existing `useEditor` consumes this factory. `RichContentDiff` consumes it to build two read-only editors. This avoids duplicating the list of StarterKit, Blob, Link, Mention, Highlight, and other custom extensions.

### Snapshot parsing

For each selected snapshot:

1. validate that `content` is an object with a TipTap `doc` root
2. call `schema.nodeFromJSON`
3. report a controlled comparison error when parsing fails

The UI must not crash the entire page because one historical snapshot cannot be parsed. Record the document ID and version number in error reporting without including document content.

Snapshots do not store a TipTap content-schema version. Historical content is parsed with the current editor schema; if TipTap JSON shape later becomes incompatible, handle that as a separate migration effort rather than baking a schema-version field into every snapshot now.

### Change calculation

The core utility is pure and DOM-independent:

```ts
function diffRichContent(
  schema: Schema,
  before: JSONContent,
  after: JSONContent,
): RichContentChange[]
```

Conceptual implementation:

```ts
const beforeDoc = schema.nodeFromJSON(before);
const afterDoc = schema.nodeFromJSON(after);

const replacement = new StepMap([
  0,
  beforeDoc.content.size,
  afterDoc.content.size,
]);

const changeSet = ChangeSet.create(
  beforeDoc,
  combineChangeMetadata,
  operatelyTokenEncoder,
).addSteps(afterDoc, [replacement], null);

return simplifyChanges(changeSet.changes, afterDoc);
```

The returned domain type should not expose library internals beyond the old/new ranges and change kind needed by rendering.

### Change classification

Classify each result as:

- addition: old range empty, new range non-empty
- deletion: old range non-empty, new range empty
- replacement: both ranges non-empty

Formatting and attribute changes normally appear as replacements because the visible characters remain while their semantic tokens differ.

When a change affects only a node boundary or block attribute, expand its visual decoration to the nearest affected block so changing a paragraph to a heading, changing a list type, or changing a heading level is visible.

### Rendering

Create decorations independently for each valid document:

- old deletions/replacement-old ranges: `diff-removed`
- new additions/replacement-new ranges: `diff-added`
- whole changed blocks: node decoration plus a side indicator
- inline ranges: inline decoration
- changed leaf nodes such as mentions/blobs: node or inline-node decoration as appropriate

Use design-system colors and ensure additions/deletions remain distinguishable in light and dark themes. Do not rely on color alone; each pane header and change legend includes `Removed` or `Added`, and screen-reader descriptions identify the change type.

Do not mutate either snapshot by inserting diff marks into its JSON. Decorations are presentation state only.

### Performance behavior

- Calculate only the currently selected comparison.
- Memoize by document ID, before version number, and after version number.
- Fetch only the two selected bodies; keep history list responses metadata-only.
- Show a non-blocking comparison loading state.
- Do not calculate diffs in the history-list render loop.
- Let `prosemirror-changeset` fall back to a broader replacement range when its edit-distance safety limit is reached.
- Profile realistic large documents before moving work to a Web Worker.
- If main-thread calculation repeatedly exceeds the interaction budget, move the pure parser/token/diff utility to a worker without changing the API or persistence design.

Do not cache every pairwise diff in PostgreSQL. A document with `n` versions has `O(n^2)` possible comparisons, and presentation results may change when the semantic encoder improves.

---

## UI Specification

### Entry point and routes

Add `Version History` to the existing document options menu when `canView` is true. The title casing matches the nearby `Export as Markdown` action.

Add routes:

```text
/documents/:id/versions
/documents/:id/versions/:versionNumber
```

The first route opens the history timeline (current document preview + version events). The second opens the comparison page for that version versus its predecessor (`See what changed` from the timeline; version 1 has no comparison link).

Use the existing document breadcrumb and parent-resource navigation so users can return to the current document and its folder/resource hub.

### Page layout

Split history and comparison into two TurboUI pages:

1. `DocumentVersionHistoryPage` — current document preview + timeline of version events
2. `DocumentVersionComparisonPage` — adjacent-version split diff (`n` vs `n-1`)

History page props:

- current document title/body for the preview pane
- version summaries for the timeline
- formatted-time preferences
- `getComparisonPath(versionNumber)` for timeline action links

Comparison page props:

- version summaries (for empty/one-version states)
- selected before/after snapshots for the route version and its predecessor
- loading and error state
- callbacks for retry and (later) restoration

App bridges:

- `ResourceHubDocumentVersionsPage` → history route
- `ResourceHubDocumentVersionComparisonPage` → comparison route

TurboUI must not import `@/` modules, call APIs, use React Router, or read app contexts.

### History list

The history list shows newest first. Each row contains:

- formatted date and time
- a sentence describing the event (created, title-only change, updated, restored)
- `Current` on the canonical version
- an action link `See what changed` for versions after the first (version 1 has no comparison)

Action links navigate to the comparison route for that version (vs its predecessor by default).

### Comparison page

Opening `/versions/:n` always compares `n-1` with `n`. There are no Before/After selectors; users choose which change to inspect from the history timeline.

Version 1 with no predecessor displays the snapshot without a diff and explains that it is the first saved version. The older version is always displayed as `Before`.

### Title changes

Render titles above each pane.

- unchanged titles use normal document-title styling
- a changed old title uses the removed treatment
- a changed new title uses the added treatment

Do not force title strings into the ProseMirror document diff.

### Rich-content split view

Desktop:

```text
┌──────────────────────────────┬──────────────────────────────┐
│ Before · Version 4           │ After · Version 5            │
│ Removed                      │ Added                        │
├──────────────────────────────┼──────────────────────────────┤
│ Read-only old TipTap content │ Read-only new TipTap content │
└──────────────────────────────┴──────────────────────────────┘
```

Mobile stacks the old view above the new view. Do not place two unreadably narrow columns beside each other.

The panes initially scroll with the page. Synchronized independent pane scrolling is deferred until user testing demonstrates that it improves long-document comparison without harming keyboard or mobile navigation.

### Restore flow

Show `Restore This Version` only when:

- the selected version is not current
- the current user can edit the document
- the company is not read-only

Use explicit confirmation copy:

- title: `Restore Version {number}?`
- explanation: `This replaces the current title and content with Version {number}. Later versions will stay in the history.`
- primary action: `Restore Version {number}`
- escape action: `Keep Current Version`

On success, navigate to or select the newly created current version and show `Version {sourceNumber} restored as the current document.`

On a version conflict, keep the selected snapshots visible and show:

- title: `Document changed since you opened it`
- explanation: `A newer version was saved. Reload the latest version before trying again.`
- action: `Reload Latest Version`

Do not retry automatically.

### Empty and error states

- One version: show the current snapshot with the heading `No Earlier Versions` and the explanation `Changes to the title or content will appear here after the document is saved.`
- Equal selected snapshots after schema migration: show `No changes between these versions.`
- Version missing/deleted with document: return to history and explain that the version is unavailable.
- Snapshot parse failure: retain history navigation and show a scoped comparison error with retry.
- Permission loss: navigate back to the document or show the standard forbidden page without rendering version metadata.

### Storybook coverage

Add stories for:

- one-version history
- adjacent text edit
- title-only edit
- formatting-only edit
- heading/list structural change
- mention and blob replacement
- long split diff
- restored version
- migration baseline
- loading comparison
- comparison parse error
- restore confirmation
- restore conflict
- mobile stacked layout

---

## Permission and Security Requirements

- Resolve the canonical document through the existing resource-hub access path before querying versions.
- Never authorize a version solely by version UUID.
- Verify every requested version belongs to the authorized document.
- Do not return history metadata to ordinary document viewers.
- Apply company isolation in the version query even after document authorization.
- Require current edit permission again inside the restore mutation.
- Respect company read-only mode for restoration but not history reads.
- Treat historical content as sensitive in logs, analytics, exceptions, and telemetry.
- Cascade permanent document/company deletion to version rows.
- Preserve soft-deleted document history only as long as the soft-deleted canonical document is retained.
- Document operationally that removing text from the current document does not remove it from history.

---

## Testing

Work test-first within each phase.

### Data model and migration

- version validation accepts each valid origin
- version validation rejects non-positive version numbers
- unique document/version constraint holds
- restoration source constraint holds
- removing a later editor preserves the document/version and nulls the version's `editor_id`
- version rows cannot be changed through the public context
- existing documents receive exactly one idempotent migration baseline
- rerunning the data migration does not duplicate rows
- document hard deletion removes versions

### Version capture operations

- published creation captures version 1
- draft creation captures no version
- draft edits do not create versions or increment `current_version`
- first publish of a draft captures version 1 (`origin: created`) from the final title/body
- copied document receives only version 1
- content edit increments once and snapshots the new content
- title edit increments once and snapshots title plus unchanged content
- title-and-content edit creates one version, not two
- subscription-only edit creates no version/activity
- no-op edit creates no version/activity
- publish with edited body on a draft still captures a single first version
- transaction failure leaves canonical document and versions unchanged
- two concurrent saves receive unique sequential versions
- stale `expected_version` returns conflict without writes
- omitted `expected_version` preserves backward-compatible last-write-wins behavior while keeping sequential versions

### Restoration

- eligible editor restores title and body
- restoration creates a new current version
- intermediate/later versions remain unchanged
- draft remains draft and published document remains published
- subscriptions/comments/reactions/parent/author/publication time remain unchanged
- mentioned-person subscription state reflects restored content
- restored old mentions do not receive new notifications
- identical restoration is an idempotent no-op
- stale expected current version conflicts without writes
- unauthorized viewer cannot restore
- company read-only mode prevents restore
- restoration activity contains the source version number

### API

- history list is newest first
- history list excludes content
- get_version returns only versions belonging to the authorized document
- users without document view access cannot retrieve version metadata
- viewers can read history in company read-only mode
- restore returns new document/current-version metadata
- generated TypeScript types match nullability

### Semantic diff utility

Use small, readable TipTap JSON fixtures for:

- identical documents
- character insertion and deletion
- word replacement
- paragraph insertion/deletion
- multiple distant changes
- paragraph-to-heading change
- heading-level change
- ordered/unordered list change
- list-item insertion and nesting
- bold/italic/strike/highlight changes
- link destination change with unchanged text
- mention ID and label change
- blob replacement and caption change
- ignored blob progress/temporary URL change
- emoji and other surrogate-pair text
- reordered blocks represented as deletion plus insertion
- full-document replacement exceeding the detailed-diff safety threshold
- stable equality despite object-key ordering

Tests assert ranges and semantic classification, not internal Myers search state.

### TurboUI

- old and new ranges receive the correct accessible decoration treatment
- changed leaf and block nodes are visibly marked
- title-only changes render correctly
- one-version and no-change states render correctly
- restore action respects props/permissions
- keyboard focus remains visible through timeline and comparison interactions
- loading/error states do not discard history navigation
- mobile layout stacks panes
- Storybook covers adjacent comparison and restore confirmation

### Company export/import

- all version rows round-trip with canonical document
- version content mention IDs are translated
- version content blob IDs are translated
- blobs referenced only by history are exported and imported
- current version number remains consistent
- restored-from version number remains meaningful
- copied document does not inherit source history

### Feature tests

- editor creates several versions and compares a version with its predecessor
- editor restores an earlier version and sees the new current version
- users without document view access cannot open the history route
- stale restore shows conflict and preserves both users' versions

---

## Performance and Observability

Backend:

- return all version metadata in one list response; never include snapshot bodies in the list
- fetch only selected snapshot bodies for comparison/restore
- index list ordering by document and version/timestamp
- record version-list, comparison-fetch, and restore latency
- count version conflicts and restore failures by reason
- do not attach document content or titles to telemetry

Frontend:

- paginate the loaded version list in the UI if the list becomes long
- measure diff duration and token/document sizes without recording text
- report parse failures with document ID and version number
- use Sentry boundaries around the comparison area so invalid history does not crash the entire document page
- profile memory with two long read-only editors before enabling history generally

Define a practical large-document fixture before implementation finishes. If normal comparisons consistently block the main thread, move the pure diff calculation to a Web Worker before rollout.

---

## Rollout and Recovery

1. Ship the schema and idempotent baseline migration without exposing UI.
2. Add version capture to create/edit/publish paths and verify version counts in development/staging.
3. Add export/import handling before relying on versions as durable user data.
4. Ship read-only history and comparison UI.
5. Ship restoration and its activity after read/compare behavior is stable.
6. Expose the document options entry point only after baseline creation and version capture are deployed together.

Operational checks (ad-hoc SQL / inspection during rollout; no dedicated app module):

- count documents without a version row
- count documents whose `current_version` does not equal their highest version number
- detect duplicate/gapped versions for investigation; gaps are not user-visible corruption but should not occur during normal writes
- sample snapshot parse success against the current editor schema
- verify blobs referenced only by historical versions survive export/import

Recovery:

- the canonical document remains the read path for normal document pages
- hiding the history route/menu disables the feature without changing canonical content
- version capture failures roll back the corresponding canonical write
- baseline migration is idempotent and can be rerun
- do not drop version rows during rollback unless the feature has never accepted production writes

---

## Implementation Phases

### Phase 0 — Diff and rendering spike ✅

- [x] extract shared rich-editor extension construction
- [x] implement the pure semantic token encoder
- [x] implement snapshot-to-change calculation with fixed fixtures
- [x] create a minimal split `RichContentDiff` Storybook component
- [x] validate paragraphs, headings, lists, marks, mentions, and blobs
- [x] measure a representative large-document fixture

This phase proves comparison quality before persistence/API work commits the product to the UI.

### Phase 1 — Version storage and baseline ✅

- [x] create schema migration and `DocumentVersion`
- [x] add `current_version`
- [x] add idempotent existing-document baseline data migration
- [x] add company export/import and historical blob discovery coverage

### Phase 2 — Transactional version capture and APIs ✅

- [x] refactor document create/edit/publish operations to capture versions
- [x] lock canonical rows and implement optional expected-version conflicts
- [x] add permissions and serializers
- [x] add list/get version endpoints
- [x] regenerate API types
- [x] add backend/model tests

### Phase 3 — History and comparison UI ✅

- [x] create pure TurboUI history page (preview + timeline) and stories
- [x] create pure TurboUI comparison page (adjacent split diff) and stories
- [x] create app page bridges, loaders, routes, and paths for both pages
- [x] add `Version History` to document options
- [x] wire responsive split view, errors, and formatted times
- [x] add TurboUI, navigation, and feature coverage

### Phase 4 — Restoration

- implement restore operation and endpoint
- implement restoration activity across backend/frontend components
- add confirmation, conflict, success, and read-only behavior
- add end-to-end restoration tests

### Phase 5 — Rollout and follow-up

- run the operational checks above and inspect performance telemetry
- validate company export/import with historical-only blobs
- decide from user feedback whether to add collapsed unchanged sections, synchronized scrolling, move detection, or a unified diff

---

## Definition of Done

- Every new published native document, including copies, has version 1.
- Drafts have no version history until first publish; draft title/body saves do not create versions.
- Every title/body save on a published document creates exactly one immutable version in the same transaction.
- Subscription-only and publication-state-only changes do not create content versions.
- Existing documents have a clearly labeled migration baseline.
- Anyone who can view a document can list versions and compare each version with its predecessor.
- The diff detects text, formatting, link, mention, blob, and block-structure changes.
- Diff rendering is accessible and responsive, with no color-only meaning.
- Restoration creates a new version and preserves all subsequent history.
- Stale first-party edits/restores fail visibly instead of overwriting newer work.
- Historical mentions and blobs survive company export/import.
- Relevant backend, TurboUI, integration, export/import, and feature tests pass.
- `make api.gen`, `make test.tsc.lint`, `make turboui.build`, `make turboui.test`, and targeted Elixir/feature tests pass.
