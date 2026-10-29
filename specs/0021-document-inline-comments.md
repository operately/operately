# Document Inline Comments

## Summary and scope

Let people review published native documents by selecting text and opening a comment thread attached to that passage. Support replies, mentions, resolve/reopen, and links to individual threads.

Build reusable rich-text UI and resource-aware backend operations so discussions can adopt the feature later. This release covers documents only. Drafts, suggested edits, live collaborative editing, uploaded files, and commenting on historical versions are out of scope.

## Requirements

- Select text while viewing a document, choose **Add comment**, and submit without entering document edit mode.
- Highlight passages with open threads; clicking a highlight opens its thread and selecting a thread reveals its passage.
- Show threads in a desktop sidebar and an accessible panel on narrow screens. Support keyboard selection, focus management, overlapping ranges, and text inside lists and tables.
- Support replies, mentions, editing/deleting one's own messages, resolve/reopen, and an optional resolved-thread filter. Keep existing whole-document comments separate.
- Inherit document access: viewing requires document view permission; creating, replying, and resolving/reopening require comment permission. Commenting must not require document edit permission. Enforce company read-only restrictions and recheck access on every request.
- Preserve threads when their text changes or disappears. Show the original quote and an unattached state when the location cannot be established reliably; never silently attach to another occurrence of the same text.
- Notify eligible participants/subscribers and mentioned people through existing notification infrastructure. Deep links open the document and selected thread.
- Exclude threads, quotes, and participant information from public document sharing and public APIs.
- Translate all system copy and reuse existing TurboUI controls, comment inputs, message rendering, and rich-text components.

## Implementation

### Storage and APIs

Introduce a dedicated inline-thread model with resource type/ID, author, resolved timestamp/person, and anchor data. Initially allow only native documents. Reuse `Operately.Updates.Comment` for thread messages through a new entity type; do not force inline threads into the existing project/activity-specific `CommentThread` model.

Store anchors separately from document JSON: source version, source range, original quote and surrounding context, current version/range, and attached/unattached status. Replies and resolution do not create document versions or edit activities.

Provide authorized list/create/reply/update/delete-message/resolve/reopen operations. Validate anchor ranges and quotes against the stored source document; never trust client-supplied resource ownership or permissions. Use existing message-deletion semantics and retain a thread while replies remain.

### Anchoring and document saves

Extend the shared Tiptap editor with selection actions and ProseMirror decorations. Map ranges through editor transactions for immediate feedback, including undo/redo. Decorations must not become saved document content.

The backend owns durable anchor reconciliation for every content write, including web edits, task-list updates, API/MCP/CLI edits, and version restoration. Define one coordinate convention matching ProseMirror document positions, with fixtures covering Unicode, nested nodes, and inline atoms. Compare old/new snapshots to preserve ranges in confidently corresponding content; use quote/context checks to validate candidates. Ambiguous or deleted targets become unattached. Client transaction maps alone are insufficient because other writers replace complete snapshots.

Lock the document and reconcile all current threads in the same transaction as the content/version write. Thread creation also takes that lock and requires the selected source version to remain current; stale requests return a recoverable conflict and preserve the user's comment draft. This includes threads created after an editor loaded the document.

Restoration reconciles against the newly restored body without rolling back replies or resolution. Title-only edits advance anchor versions without moving ranges. Copies start without threads; document deletion and company export/import must handle thread data and remap references consistently with existing resource lifecycle rules.

### UI and integration

Put the extension, highlights, thread panel, and presentation in TurboUI, extending `RichEditor`, `RichContent`, and `DocumentPage`. The app page bridge owns TanStack Query loading/mutations, permissions, navigation, and cache invalidation. Keep existing document history behavior described in [0016-document-version-history.md](0016-document-version-history.md).

Audit web, external API, MCP wrappers, and generated CLI consumers whenever contracts change. Regenerate affected catalogs and run compatibility checks. If inline-thread actions are initially web-only, document that boundary; all existing document writers must still preserve or safely detach anchors.

## Delivery: five PRs

Keep the frontend feature disabled until all five PRs are complete. Each PR includes relevant tests; UI PRs include stories, translations, and regenerated resources.

| PR | Deliverable |
| --- | --- |
| **1. Backend foundation** | Migrations, inline threads/messages, API types and operations, permissions, resolution, and authorization tests. Establish the anchor payload and version-conflict contract. |
| **2. Text anchoring** | Shared selection/highlight extension, coordinate fixtures, transaction mapping, server snapshot reconciliation, and atomic integration with every save/restore path. Cover deletion, repeated text, overlaps, Unicode, undo, and concurrent saves/thread creation. |
| **3. Document UI** | Selection-to-comment flow, sidebar/panel, replies, message actions, resolved filter, unattached states, deep links, and TanStack integration. Reuse TurboUI primitives and preserve normal document comments. |
| **4. Notifications and activities** | Mentions, subscriptions, deduplicated reply notifications, and thread links. Add required activity content, notification handlers, API types, serializers, and feed handlers. Resolution changes remain auditable without notifying all document subscribers. |
| **5. Release hardening** | End-to-end review flows, mobile/accessibility checks, public-sharing isolation, copy/delete/export/import behavior, and cross-surface regression checks. Enable after acceptance criteria pass. |

Discussions and other rich-text resources are a separate follow-up, reusing the components and anchoring contract with resource-specific authorization and save integration.

## Acceptance criteria

- A person with comment access can select, comment, reply, resolve, reopen, and follow a thread link without editing the document.
- Inserting text before a passage preserves its highlight; deleting or ambiguously replacing it retains an unattached thread and original quote.
- Reloads, concurrent operations, API edits, and restores never lose replies or display stale ranges as valid highlights.
- Unauthorized and public readers cannot retrieve thread data; copies contain no source threads.
- Existing whole-document comments, document history, and normal editing continue to work.

## PR 1 implementation boundary

- Inline-thread actions are authenticated internal web APIs only (`inline_threads/list`, `create`, `reply`, `update_message`, `delete_message`, `resolve`, `reopen`). External API, MCP, and CLI actions are deferred.
- The company's `document_inline_comments` experimental feature will gate the frontend UI only, disabled by default and absent from the feature-selection list until release. Backend endpoints do not check this flag; authentication, document permissions, message ownership, and company read-only restrictions remain enforced.
- Endpoints use `Action` pipelines with explicit Getter loads and permission checks. Dedicated operations own transactional writes and document locking; messages retain the polymorphic `entity_id`/`entity_type` relationship. Message endpoints load the comment by ID and type, then load and authorize its owning thread through Getter.
- `RichContent.Selection.extract/2` validates ranges and extracts quote/context; `InlineAnchor` owns storage and version state. Backend selection tests use coordinate fixtures shared with the actual editor schema tests in PR 2.
- Selection offsets use ProseMirror positions, including UTF-16 text lengths, container boundaries, and one position per atom. Quotes separate text blocks with a newline and represent non-text atoms with U+FFFC (hard breaks use a newline); context is derived server-side.
- Creation validates the current source version under the document lock. All thread mutations take the same lock; stale creation returns the existing `version_conflict` error.
- Reads expose any remaining outdated anchors as unattached with no current range, preserving their source quote and coordinates. PR 2 reconciles them on the next save.
- Messages use existing comments with entity type `inline_thread` and follow the existing comment convention of sorting by `inserted_at`. Deleting the last message deletes its thread; deleting an initial message retains remaining replies. Resolve/reopen are idempotent, and replies do not reopen resolved threads.
- Existing generic comment and checkbox APIs reject inline messages; edits use the dedicated inline-thread endpoints.
- Space deletion removes inline messages and their reactions before documents and threads cascade away, including project/goal documents and soft-deleted documents. Other lifecycle integrations remain in PR 5.
- Company transfers include inline threads, messages, and reactions, with document, person, thread, and message references remapped on import. PR 5 retains broader lifecycle and transfer edge-case coverage.
- PR 1 changes no document history and sends no notifications or activities. PR 2 owns save/restore remapping, PR 4 owns activities/notifications, and PR 5 owns full lifecycle/export/import coverage and release enablement.

## PR 2 implemented behavior and boundary

- `Selection.index/1` shares ProseMirror coordinates and atom identities with selection validation. `AnchorMapping` computes forward/reverse Myers mappings once per document change using the locked document's content; it follows surviving text, includes interior insertions, excludes boundary insertions, and detaches ambiguous/deleted selections. Repeated text also requires unchanged adjacent context. No fuzzy quote search or anchor history is stored.
- Editing and version restoration reconcile all threads, including resolved threads, inside the document-locking transaction. Checkbox, web, external API, MCP, and CLI document updates converge on that editing operation. Title-only changes advance anchor versions; no-op saves do nothing. Database failures roll back document, version, and anchor writes together.
- Original quote, context, source coordinates, messages, and resolution state remain unchanged. Anchors whose current version differs from the locked document's version detach safely, as does unsupported content. Reconciliation does not load historical document versions.
- Detached threads stay unattached on the backend, even when the original document body is restored or saved again. Their original quote and messages remain available. Local editor undo/redo recovery is independent of this behavior.
- The optional TurboUI `InlineComments` extension uses decorations, separate from the persistent Highlight mark. `useEditor` and `RichContent` accept ranges, an active thread, selection callbacks, and overlapping-thread click callbacks. Local transactions map highlights; reversible range changes belong to ProseMirror’s undo/redo history, including partial and grouped deletions. Recovery runs only during undo/redo, and range history is pruned with the corresponding editor history events; no document snapshot cache is retained. External content/ranges reset this local baseline. Highlights never enter JSON, HTML, clipboard content, or drafts.
- Automated editor tests and shared editor/backend coordinate fixtures cover this foundation. Storybook examples are deferred to PR 3 alongside the comment controls and sidebar. No new tables, dependencies, endpoints, app API calls, or production comment controls are introduced. Frontend enablement and permission-aware app integration also remain in PR 3; notifications and lifecycle hardening remain in PRs 4 and 5.
