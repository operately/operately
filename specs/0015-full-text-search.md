# Full-Text Search

## Summary

Replace Operately's current name-based global search with permission-aware full-text search across current and past work, discussions, and documents.

The feature keeps the existing global search interaction and makes it more capable:

- `Cmd/Ctrl + K` continues to open the current TurboUI search overlay
- results are ranked together by relevance instead of being capped at five results in fixed resource-type groups
- each result explains whether the match came from its title, name, description, document content, comment, or person title
- content matches include a short highlighted excerpt
- closed, completed, and archived resources remain searchable and are labeled clearly
- the same component can search the whole company or be constrained to one resource hub

The backend uses PostgreSQL full-text search with a dedicated `search_entries` projection and GIN indexes. Redis, Elasticsearch, OpenSearch, and other external search services are not required for the first implementation.

Search development can begin on the repository's current PostgreSQL 14.5 environment because it already provides every full-text-search primitive used by this design. Before production rollout, the team must select and deploy either the latest patched PostgreSQL 14 release or the latest patched PostgreSQL 18 release.

---

## Issues Closed

This work closes:

- [#1421 — Search](https://github.com/operately/operately/issues/1421): company-wide, content type-aware full-text search through messages, documents, and past work
- [#4682 — Search within Documents & Files section](https://github.com/operately/operately/issues/4682): search resource-hub items by name and native document content without browsing the complete hierarchy manually

It builds on the first version of [#3504 — Global Search](https://github.com/operately/operately/issues/3504). That issue delivered the existing `Cmd/Ctrl + K` navigation search; this specification extends it rather than creating a second company-wide search experience.

---

## Problem

Operately's current search is a quick navigation tool, not full-text search.

The current backend:

- searches only names and titles with normalized `LIKE '%query%'` expressions
- runs a separate query for each resource type
- returns at most five results per type
- does not search rich-text descriptions, discussions, documents, check-ins, retrospectives, or comments
- excludes closed projects and goals, completed milestones, and closed tasks

As a company accumulates work, users cannot reliably retrieve an older decision, discussion, check-in, or document unless they already remember where it lives. This makes historical work feel lost and reduces trust in Operately as the durable record of the company's work.

The resource-hub problem is the same retrieval problem with an additional scope constraint. A user should not need to browse folders manually when they know words from a document title or body.

---

## Goals

- Search the title/name and textual body of supported Operately resources.
- Include closed, completed, paused, and archived work unless it has been deleted.
- Enforce company isolation and existing view permissions before returning titles, snippets, or metadata.
- Use one search implementation for company, resource-hub, space, project, and goal scopes.
- Preserve the current global search overlay, keyboard shortcut, and keyboard navigation.
- Explain why every result matched.
- Return enough results to find older work without creating a separate search page in the first release.
- Keep search indexing recoverable through an idempotent backfill and reconciliation process.
- Meet interactive-search latency without introducing another stateful service.

## Non-goals

- Semantic or embedding-based search.
- Searching historical revisions of a resource. The searchable result is the current canonical record, even when that record is closed or archived.
- Indexing activity records as duplicate copies of canonical resources.
- OCR or extraction from uploaded PDF, Office, image, audio, or video contents in the first release.
- Importing the body of external Google Docs, Notion pages, Dropbox files, or similar links. Their Operately name and description remain searchable.
- Replacing resource-specific filters and list sorting.
- Adding Redis, Elasticsearch, OpenSearch, Meilisearch, or Typesense.

---

## Important Decisions

### 1. Search development does not wait for the database decision

The repository currently pins PostgreSQL 14.5 in:

- `docker-compose.yml`
- `app/rel/single-host/templates/docker-compose.yml.eex`

PostgreSQL 14.5 already supports the complete search design: stored generated `tsvector` columns, GIN indexes, `websearch_to_tsquery`, `ts_rank_cd`, `pg_trgm`, `unaccent`, and custom text-search configurations. Phases 1 through 3 can therefore start before the team chooses the production database version.

Keep search migrations and queries compatible with PostgreSQL 14 and newer; the feature must not adopt a PostgreSQL 18-only capability while the decision remains open. Development and preliminary benchmarks may run on 14.5, but 14.5 is not an acceptable production baseline or the source of final performance evidence. Later PostgreSQL 14 patches contain fixes relevant to `websearch_to_tsquery` and concurrent GIN updates.

References:

- [PostgreSQL 14 full-text-search tables and indexes](https://www.postgresql.org/docs/14/textsearch-tables.html)
- [PostgreSQL 14.11 release notes](https://www.postgresql.org/docs/release/14.11/)
- [PostgreSQL 14.13 release notes](https://www.postgresql.org/docs/release/14.13/)
- [PostgreSQL versioning policy](https://www.postgresql.org/support/versioning/)

The selected patched database version is the final infrastructure prerequisite before production backfill and indexed reads, not a prerequisite for implementing the feature.

### 2. Choose the production database baseline before rollout

At the time of writing, the choices are PostgreSQL 14.23 and PostgreSQL 18.4. If newer patch releases exist when this phase begins, use and pin the latest tested patch in the selected major series.

| Option | Pros | Cons |
| --- | --- | --- |
| Update 14.5 -> latest 14.x | Minor update; same data format, volume, and `PGDATA`; no dump/restore; short downtime and lower operational risk; fully supports this search design | PostgreSQL 14 support ends November 12, 2026; a major upgrade is still required soon; search and application validation will be repeated on the future major version |
| Upgrade 14.5 -> latest 18.x | Supported through November 2030; establishes the long-term production baseline once; avoids migrating the larger search projection later | Major data migration; new Docker volume layout; longer downtime; more upgrade, rollback, and self-hosted tooling; higher release risk |

The minor update keeps the existing PostgreSQL 14 volume layout and does not require dump/restore, although it still requires a verified backup or snapshot, a clean database restart, review of intervening minor-release notes, and application smoke tests.

The major upgrade requires `pg_upgrade`, dump/restore, or logical replication. PostgreSQL 18 also changes the official Docker volume mount to `/var/lib/postgresql` and uses `/var/lib/postgresql/18/docker` as its version-specific `PGDATA`. Follow [0016 — Self-Hosted PostgreSQL 18 Upgrade](0016-self-hosted-postgresql-18-upgrade.md) for the bridge, fallback, backup, restore, and rollback requirements.

References:

- [PostgreSQL 14.23 release notes](https://www.postgresql.org/docs/release/14.23/)
- [PostgreSQL 18.4 release notes](https://www.postgresql.org/docs/release/18.4/)
- [PostgreSQL major-version upgrade documentation](https://www.postgresql.org/docs/18/upgrading.html)
- [Official PostgreSQL Docker image `PGDATA` documentation](https://github.com/docker-library/docs/blob/master/postgres/README.md#pgdata)

### 3. PostgreSQL is the search engine for the first implementation

Use PostgreSQL's built-in text-search types and operators:

- `tsvector` for indexed documents
- `websearch_to_tsquery` for user-entered queries
- a GIN index for full-text candidate retrieval
- `ts_rank_cd` plus explicit product signals for ranking
- `pg_trgm` for title/name substring and typo tolerance
- `unaccent` for accent-insensitive matching

PostgreSQL 14 and newer support stored `tsvector` columns and GIN indexes specifically for this use case. See [PostgreSQL 14 tables and indexes for full-text search](https://www.postgresql.org/docs/14/textsearch-tables.html).

A separate engine may be reconsidered only after production measurements show that PostgreSQL cannot meet the search latency or relevance requirements after normal tuning, or when advanced multilingual, semantic, or large-scale faceting requirements justify the operational and authorization complexity.

### 4. Use one search projection across resource types

Do not add separate full-text columns and search queries to every source table. Cross-resource ranking, permission filtering, snippets, and scopes would otherwise be duplicated across many queries.

Create one `search_entries` table containing normalized searchable text and the identifiers required for authorization, scoping, and result hydration.

This is an application-maintained projection, not the source of truth. Canonical resources remain in their existing tables.

### 5. Authorization is evaluated at query time

Every search entry carries the canonical resource's `company_id` and `access_context_id`.

Search queries must join the existing access bindings and require view access before selecting a result. Do not copy expanded person ACL lists into the search index.

This ensures that:

- permission changes take effect without reindexing every resource
- private titles and snippets never leak through search
- company isolation remains explicit
- resource-hub children inherit the access context of the owning space, project, or goal

Authorization must be applied inside the candidate query, before ranking, limiting, snippet generation, or serialization.

### 6. Closed work is searchable; deleted work is not

The current global search excludes past work. The new behavior intentionally changes this:

- closed projects and goals are searchable and display `Closed`
- completed milestones and tasks are searchable and display `Completed`
- archived discussions are searchable and display `Archived`
- paused work remains searchable and may display `Paused` when useful
- soft-deleted or hard-deleted resources are removed from the search projection
- drafts and scheduled-but-unpublished content are excluded from company and resource-hub search in the first release

Current/open resources do not need a status badge. Status labels are neutral context, not error states.

### 7. Preserve the current search UI and improve result presentation

Continue using `turboui/src/GlobalSearch` and the existing overlay. Do not introduce a separate company search page in the first release.

Preserve:

- the header search activator
- `Cmd/Ctrl + K`
- the 300 ms debounce
- arrow-key navigation
- Enter to navigate
- Escape and click-outside to close
- the existing modal width, responsive maximum width, and scrollable result area unless testing shows a concrete layout problem

Change the result model from fixed resource-type buckets to a single relevance-ranked list. Every row shows:

- resource icon and resource type
- result title/name
- parent context, such as space, project, goal, resource hub, or folder path
- an optional status badge: `Closed`, `Completed`, `Archived`, or `Paused`
- the match source: `Matched in title`, `Matched in name`, `Matched in description`, `Matched in content`, `Matched in comment`, or `Matched in job title`
- a short excerpt when the match is in body content

Title/name matches should rank above body-only matches when the remaining signals are comparable. A strong body match may still outrank a weak fuzzy title match.

### 8. Resource-hub search reuses the same TurboUI component

The company header uses company scope.

The resource-hub page adds a `Search this resource hub…` activator beside the existing resource-hub header actions. It opens the same `GlobalSearch` overlay with a search callback bound to `scope: resource_hub` and the current hub ID.

The resource-hub instance must not register `Cmd/Ctrl + K`, because the company header already owns the global shortcut. Extend `GlobalSearch` with an explicit shortcut/activator configuration instead of relying on page detection inside TurboUI.

Folder names and paths are included in result context, but a resource-hub search covers the entire hub, including descendants of nested folders.

### 9. TurboUI remains pure

`turboui/src/GlobalSearch` owns presentation and local interaction state. It receives API-shaped display data, links, and callbacks through props.

It must not:

- call `Api.*`
- import app routes or `@/` modules
- inspect the current URL
- read app contexts

The app bridge owns:

- company versus resource-hub scope
- API calls
- route construction for each result type
- navigation callbacks
- any feature-flag or rollout choice

The current `app/assets/js/layouts/CompanyLayout/useGlobalSearch.ts` bridge should evolve into a reusable scoped search hook rather than adding a second mapping implementation for resource hubs.

### 10. Index updates are transactionally connected to canonical writes

Normal create, update, publish, move, close, complete, archive, restore, and delete operations must update the search projection in the same `Ecto.Multi` transaction as the canonical resource change.

Use a central `Operately.Search.Indexer` API. Individual operations supply the canonical resource; they do not construct search rows independently.

Use Oban for:

- the initial idempotent backfill
- batched reindexing after extractor or ranking changes
- periodic reconciliation of missing, stale, or orphaned entries

Do not make normal search freshness depend only on an asynchronous job. A successfully committed edit should be searchable immediately.

---

## Search Corpus

### Company-wide scope

The first complete release indexes:

| Result type | Title/name | Body text | Status behavior |
| --- | --- | --- | --- |
| Space | name | description | active spaces |
| Project | name | description | active, paused, and closed |
| Goal | name | description | active and closed |
| Milestone | title | description | pending and completed |
| Task | name | description | open and completed/closed |
| Person | full name | job title | exclude suspended people |
| Discussion | title | body | published and archived |
| Project check-in | project name plus date/context | description | published only; parent may be closed |
| Goal check-in | goal name plus date/context | message | published only; parent may be closed |
| Project retrospective | project name plus retrospective label | content | include closed projects |
| Resource-hub document | node name | document content | published only |
| Resource-hub folder | node name | optional folder description | not deleted |
| Resource-hub file | node/file name | Operately description | not deleted |
| Resource-hub link | node/link name | Operately description | not deleted |
| Comment | parent title/context | comment content | only when the parent is searchable and visible |

Activity records are not indexed when they merely duplicate one of these canonical resources.

### Resource-hub scope

Resource-hub search includes:

- folders
- published native documents
- uploaded-file records by name and Operately description
- link records by name and Operately description
- comments on resource-hub documents, files, and links

Uploaded binary contents and external linked-page contents remain out of scope. The UI and documentation must not imply that text inside an uploaded PDF or remote Google Doc is searchable until extraction/import is implemented.

---

## Search Data Model

Add `Operately.Search.Entry` backed by `search_entries`.

Suggested columns:

| Column | Purpose |
| --- | --- |
| `id` | binary UUID primary key |
| `source_type` | stable type such as `project`, `discussion`, `resource_hub_document`, or `comment` |
| `source_id` | canonical resource UUID |
| `company_id` | mandatory tenant filter |
| `access_context_id` | mandatory live permission filter |
| `resource_hub_id` | nullable resource-hub scope |
| `space_id` | nullable space scope |
| `project_id` | nullable project scope |
| `goal_id` | nullable goal scope |
| `title` | original user-visible title/name, preserving casing and accents |
| `normalized_title` | search-only normalized title/name used for exact, prefix, substring, and trigram matching |
| `body` | plain text extracted from rich content |
| `body_kind` | `description`, `content`, `comment`, `message`, `person_title`, or similar UI-safe semantic label |
| `state` | nullable `closed`, `completed`, `archived`, or `paused` display state |
| `source_inserted_at` | source chronology and optional recency signal |
| `source_updated_at` | stale-entry reconciliation |
| `search_vector` | stored weighted `tsvector` generated from title and body |
| timestamps | projection maintenance |

Constraints:

- unique `(source_type, source_id)`
- non-null `company_id`, `access_context_id`, `source_type`, `source_id`, `title`, and `normalized_title`
- foreign keys for company and access context
- scope foreign keys where practical; avoid cascading behavior that can bypass explicit index cleanup tests

Indexes:

- GIN on `search_vector`
- GIN trigram index on `normalized_title`
- B-tree on `company_id`
- B-tree on `access_context_id`
- B-tree on `(company_id, resource_hub_id)`
- B-tree on `(company_id, space_id)`
- B-tree on `(company_id, project_id)`
- B-tree on `(company_id, goal_id)`

PostgreSQL can combine the text and scope/access indexes through bitmap scans. Validate the actual query plan with `EXPLAIN (ANALYZE, BUFFERS)` against representative data.

---

## Text Extraction and Search Configuration

Rich text is stored as TipTap/ProseMirror JSON. Use the shared `Operately.RichContent` traversal to extract user-visible text, extending it when necessary so that supported node types and mention labels produce meaningful text.

Do not index raw JSON string values. Raw JSON indexing would add editor node types, internal IDs, URLs, and other structural metadata as searchable terms.

Database migrations should:

1. install the trusted `unaccent` extension
2. install the trusted `pg_trgm` extension
3. create an `operately` text-search configuration copied from `simple`
4. add `unaccent` before the simple dictionary for word token mappings
5. create the weighted stored `search_vector`
6. create the GIN and scope indexes

Use a multilingual-safe `simple` base for the first release rather than applying English stemming to every company's content. Language-specific stemming may be introduced later through a configuration column when Operately has a reliable per-document language signal.

---

## Query and Ranking

### Query construction

- trim and normalize repeated whitespace and separator characters
- keep the existing minimum query length of two characters
- use `websearch_to_tsquery('operately', query)` so ordinary input, quoted phrases, `OR`, and exclusions do not produce syntax errors
- use the full-text GIN index as the primary candidate path
- use trigram title matching as an additional candidate/ranking signal for partial and misspelled title/name queries
- always apply company, scope, publication/deletion, and access-context predicates before limiting results

### Ranking signals

Rank results using a documented combination of:

1. exact normalized title/name match
2. normalized title/name prefix match
3. title/name full-text rank
4. title/name trigram similarity
5. body full-text rank
6. phrase/proximity rank through `ts_rank_cd`
7. a small recency tie-breaker

Recency must remain a weak signal. The feature exists specifically to retrieve older work, so a newer weak match must not consistently displace an older strong match.

Do not expose raw ranking scores as a stable public API contract.

### Match source

For each selected candidate, determine whether the query matched the title/name, body, or both. The API returns the strongest semantic match field, not an implementation-specific database column name.

Examples:

- project title match -> `name`
- project body match -> `description`
- document title match -> `title`
- document body match -> `content`
- comment body match -> `comment`
- person body match -> `person_title`

### Snippets

Generate a short excerpt for body matches, centered on the strongest matching terms.

Do not return or render `ts_headline` HTML directly. The backend must return plain text plus structured highlighted segments, or parse non-HTML markers into structured segments before serialization. TurboUI renders text through React nodes and never uses `dangerouslySetInnerHTML` for search snippets.

---

## API Contract

Extend the company search API inputs:

```text
query: string
scope: company | resource_hub | space | project | goal
scope_id: UUID | null
types: list of result types | null
limit: integer | null
cursor: string | null
```

Rules:

- `company` requires no `scope_id`
- every other scope requires a matching `scope_id`
- the scoped parent must belong to the authenticated company and be visible to the requester
- default limit is 20; maximum limit is 50
- pagination uses an opaque cursor based on stable rank/tie-break fields, not an offset

Add one ordered `results` list:

```text
results[]:
  id
  type
  title
  context
  state
  matched_field
  snippet_segments[]
  source_inserted_at
  navigation_target
next_cursor
```

`navigation_target` carries typed IDs needed by the app bridge to construct the canonical route. TurboUI receives a completed `link` prop and remains unaware of app routing.

For compatibility, keep the existing grouped `spaces`, `projects`, `goals`, `milestones`, `tasks`, and `people` fields during the first rollout. The upgraded web UI uses `results`; existing API consumers and the MCP tool continue to work while their contracts are updated additively. Removal of grouped fields requires a separate compatibility decision.

Update the MCP `search` tool to expose the ordered results, match source, state, and canonical Operately URL while retaining its existing grouped output during the compatibility period.

---

## UI Specification

### Company search

The Company Layout continues to render the existing `GlobalSearch` activator in the top navigation.

Suggested copy:

- activator: `Search`
- overlay input placeholder: `Search all work and documents…`
- loading: `Searching…`
- empty: `No results for “{query}”. Try different keywords.`
- error: `Search is unavailable. Try again.`
- pagination action: `Load more results`

The error state must be distinct from the empty state. A failed request must not tell the user that no matching work exists.

### Resource-hub search

Add a search activator beside the resource-hub header actions:

- activator and placeholder: `Search this resource hub…`
- use the current resource hub as the fixed backend scope
- reuse the same overlay, result rows, loading, empty, error, and pagination states
- do not register another global keyboard shortcut

### Result row

Example content match:

```text
[Project icon]  Website redesign                         [Closed]
                Project · Marketing
                Matched in description
                …customer interviews showed that navigation was…
```

Example document title match:

```text
[Document icon]  Enterprise research synthesis
                 Document · Research hub · EU expansion
                 Matched in title
```

Requirements:

- one relevance-ranked list; do not restore fixed type ordering in the frontend
- result type and parent context remain visible without relying only on an icon
- status is textual and not communicated by color alone
- snippets are limited to a small number of lines and never overwhelm the title/context hierarchy
- matched segments are visually emphasized and remain legible in dark mode
- selected, hovered, loading, empty, and error states use semantic design-system colors
- long titles, paths, and snippets truncate or wrap predictably on the current responsive overlay

### Interaction and accessibility

- preserve arrow-key wraparound, Enter, Escape, click, and click-outside behavior
- keep the selected item visible while keyboard navigation crosses the scroll boundary
- represent the result collection and options with appropriate listbox/option semantics or an equivalent accessible navigation pattern
- expose the selected option through ARIA state
- announce loading, result count changes, empty state, and errors to assistive technology without moving focus from the query input
- `Load more results` must be reachable by keyboard and must preserve the current selection sensibly

### TurboUI stories

Update `turboui/src/GlobalSearch/index.stories.tsx` with:

- mixed title and content matches
- closed/completed/archived results
- long title, path, and snippet content
- company scope
- resource-hub scope with shortcut disabled
- loading
- empty
- error
- enough results to exercise scrolling and `Load more results`
- keyboard navigation interaction coverage

---

## Indexing Lifecycle

### Initial backfill

Implement an idempotent Oban worker that:

- scans canonical sources in stable primary-key batches
- upserts entries through `Operately.Search.Indexer`
- records progress per source type
- can resume safely after interruption
- skips deleted, draft, scheduled, and suspended records according to corpus rules
- is safe to rerun
- reports inserted, updated, skipped, failed, and deleted-orphan counts

Do not run a large content backfill inside a blocking Ecto schema migration.

### Ongoing writes

Add index maintenance to every canonical operation that can change:

- searchable title/body text
- publication state
- closed/completed/archived state
- company, access context, or scope
- parent/path association needed for result context
- deletion/restoration state

### Reconciliation

Add a periodic Oban reconciliation worker or an admin-invoked task that detects:

- missing entries
- stale entries based on `source_updated_at`
- entries whose canonical source no longer exists
- entries with the wrong company, access context, or scope

Reconciliation must use the same Indexer as normal writes and backfills.

---

## Implementation Phases

### Phase 1 — Search schema and indexing foundation

- [x] Install/configure `unaccent` and `pg_trgm`.
- [x] Add `Operately.Search.Entry` and `search_entries`.
- [x] Add the weighted generated vector and indexes.
- [ ] Add plain-text extractor tests for supported rich-content nodes.
- [ ] Implement `Operately.Search.Indexer` upsert/delete behavior.
- [ ] Implement the idempotent Oban backfill and reconciliation paths.
- [ ] Add query-plan and representative-corpus benchmarks.

### Phase 2 — Resource-hub search end to end

- [ ] Index resource-hub folders, published documents, files, links, and their comments.
- [ ] Add `resource_hub` scope to the search query/API.
- [ ] Add resource-hub permission and nested-folder scope tests.
- [ ] Extend TurboUI `GlobalSearch` for unified results, snippets, status, error state, pagination, and optional shortcut behavior.
- [ ] Add the scoped search activator to `ResourceHubPage` through pure props and the app bridge.
- [ ] Add Storybook and feature-test coverage.

This phase closes #4682 as scoped here: native documents are searchable by title and body, while folders, uploaded-file records, and links are searchable by their Operately name and description. Uploaded binary and remote-link body extraction remain explicitly out of scope.

### Phase 3 — Company-wide full-text corpus

- [ ] Index existing navigation resources plus their descriptions.
- [ ] Index discussions, check-ins, retrospectives, native documents, and comments.
- [ ] Include closed/completed/archived resources with state metadata.
- [ ] Add the ordered `results` API while retaining compatibility fields.
- [ ] Switch the Company Layout bridge and current global overlay to ordered full-text results.
- [ ] Update the MCP search tool additively.
- [ ] Add complete authorization, relevance, state, and navigation tests.

This phase closes #1421.

Phases 1 through 3 may begin immediately on the current development database. Preliminary results on PostgreSQL 14.5 do not replace final verification on the selected patched production baseline.

### Phase 4 — Select and update the production database

- [ ] Choose the latest patched PostgreSQL 14 or PostgreSQL 18 release and record the decision and tested image version.
- [ ] Run the search schema, query, relevance, and representative-corpus benchmarks on the selected version.
- [ ] If PostgreSQL 14 is selected, update the image in place using the existing volume and `PGDATA`, with a verified backup or snapshot, intervening-release checks, a clean restart, and smoke tests.
- [ ] If PostgreSQL 18 is selected, complete the bridge, dump/restore, distinct-volume, verification, and rollback work specified in 0016.
- [ ] Verify Ecto, Postgrex, Oban, extensions, migrations, authentication, export/import, and the complete application test suite on the selected version.
- [ ] Verify clean installation and production-like existing-data upgrade paths for development and single-host distributions.
- [ ] Update installation, upgrade, rollback, and release documentation for the selected path.

This is the final infrastructure prerequisite. Search implementation is not blocked by this phase, but no production backfill or indexed reads begin until it is complete.

### Phase 5 — Backfill, rollout, and old-query retirement

- [ ] Deploy schema and ongoing index writes before enabling indexed reads.
- [ ] Backfill existing companies and publish progress/health metrics.
- [ ] Compare indexed results with canonical sources and investigate gaps.
- [ ] Enable indexed reads behind a controlled rollout switch.
- [ ] Monitor latency, errors, index lag, reconciliation differences, and database load.
- [ ] Enable for all companies when acceptance criteria pass.
- [ ] Remove the old multi-query `LIKE` implementation only after rollback is no longer required.

---

## Testing

### Database compatibility and selected update

- search schema, extension, generated-vector, GIN, trigram, query, and ranking tests on PostgreSQL 14 and PostgreSQL 18 before the final selection
- preliminary development compatibility on PostgreSQL 14.5, without treating its correctness or performance results as release evidence
- final correctness, query-plan, and performance acceptance on the selected latest patched release
- PostgreSQL 14 path: verified backup or snapshot, same-volume minor update, clean restart, version verification, and rollback rehearsal
- PostgreSQL 14 path: review and apply any relevant actions from intervening 14.x release notes
- PostgreSQL 18 path: PostgreSQL 14 fixture volume -> backup -> distinct PostgreSQL 18 volume restore -> application start
- PostgreSQL 18 path: rollback to the retained PostgreSQL 14 volume and failure on incompatible or unmigrated volume layouts
- migrations from an existing production-like schema on the selected version
- application and Oban read/write smoke tests
- company export/import round trip

### Indexer

- every supported type produces the expected title, body, body kind, state, company, access context, and scopes
- create/update/publish/close/complete/archive/move/delete/restore transitions
- idempotent upsert and delete
- rich text, mentions, punctuation, accents, empty content, and malformed optional content
- backfill interruption and resume
- reconciliation repairs missing/stale entries and removes orphans

### Search query

- exact, prefix, full-text, phrase, accent-insensitive, case-insensitive, and typo-tolerant matches
- title matches versus description/content/comment matches
- stable relevance and cursor pagination
- closed/completed/archived result inclusion
- deleted, draft, scheduled, and suspended result exclusion
- company, resource-hub, space, project, and goal scoping
- no cross-company results
- no result, title, context, or snippet leakage without view access
- immediate disappearance after permission revocation
- immediate searchability after a committed content edit

### UI

- current header activator and `Cmd/Ctrl + K`
- resource-hub activator without shortcut conflict
- keyboard navigation across loaded and newly loaded results
- title/body match labels
- snippets and highlighting
- status badges
- loading, empty, and error copy
- dark mode and responsive overlay
- canonical navigation for every result type

---

## Performance and Observability

Record:

- API duration and database query duration
- candidate count and returned count
- scope and result-type distribution without recording raw user query text in logs by default
- search errors and timeouts
- index write failures
- backfill progress
- reconciliation missing/stale/orphan counts
- time between canonical update and indexed state
- GIN index size and `search_entries` table size

Initial targets on the selected production database version and a production-like corpus of at least one million search entries:

- warm-cache database search p95 <= 200 ms for the first 20 results
- API p95 <= 300 ms excluding client debounce and network variability
- normal transactional index updates add no more than 100 ms p95 to canonical writes
- zero unauthorized result metadata or snippets
- zero missing entries after successful backfill and reconciliation

If these targets are not met, inspect query plans, scope indexes, GIN behavior, autovacuum, ranking computation, and snippet generation before considering another search service.

---

## Rollout and Recovery

Use a controlled indexed-search rollout:

1. Search implementation and compatibility work is completed while the production database decision remains open.
2. The team selects the latest patched PostgreSQL 14 or PostgreSQL 18 release.
3. The selected database update is deployed and verified independently.
4. Search schema and dual writes deploy with indexed reads disabled.
5. Existing content is backfilled.
6. Reconciliation reports no unexplained gaps.
7. Indexed reads are enabled for internal/test companies.
8. Search quality, permission behavior, and database load are reviewed on the selected database version.
9. Indexed reads expand to all companies.
10. The old query path is removed in a later cleanup after the rollback window.

If indexed reads fail during rollout, disable the indexed path and return to the existing name-based search while continuing or repairing index writes. Never bypass permission filtering as a fallback.

---

## Definition of Done

- The team has selected and deployed a fully patched PostgreSQL 14 or PostgreSQL 18 production baseline; PostgreSQL 14.5 is no longer used in production.
- The selected database update and rollback paths are documented and tested for clean and existing installations.
- Search migrations and queries remain compatible with PostgreSQL 14 and do not depend on PostgreSQL 18-only features.
- Both referenced issues are covered by automated acceptance tests.
- Users can find supported resources by title/name and rich-text body.
- Closed, completed, and archived work is returned with clear status labels.
- Every result communicates its resource type, context, and strongest matched field.
- Body matches include safe, readable excerpts with highlighted terms.
- Company and resource-hub searches use the same backend query and TurboUI component with different scopes.
- Existing access-context rules prevent unauthorized result and snippet disclosure.
- Search entries are updated transactionally, backfilled idempotently, and reconcilable.
- The existing global search keyboard and mouse interactions remain intact.
- TurboUI stories cover all result and request states.
- Backend, TurboUI, TypeScript, MCP, and feature tests pass.
- Production-like performance targets are measured and met without adding another search service.
