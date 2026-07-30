# Full-Text Search

## Summary

Add permission-aware full-text retrieval across current and past work, discussions, and documents while preserving the existing global search as a fast navigation tool.

The feature separates quick navigation from deeper content search:

- `Cmd/Ctrl + K` continues to open the current TurboUI search overlay
- the overlay searches titles and names only, preserves its existing grouped results, and adds discussions, folders, documents, files, and links
- a final `Search titles and content for “{query}”` option opens a dedicated Search page, even when the quick search has no matches
- the Search page immediately runs the carried query, supports further 300 ms debounced searches, and returns at most 30 relevance-ranked full-text results
- dedicated full-text results explain whether the match came from a title, name, description, or content and include a short plain-text excerpt for body matches
- closed, completed, and archived resources remain available through dedicated full-text search and are labeled clearly
- resource hubs continue to provide an inline full-text field that filters their normal item list

The backend uses PostgreSQL full-text search with a dedicated `search_entries` projection and GIN indexes. Redis, Elasticsearch, OpenSearch, and other external search services are not required for the first implementation.

Search development can begin on the repository's current PostgreSQL 14.5 environment because it already provides every full-text-search primitive used by this design. Production has been updated to PostgreSQL 14.23 as a minor in-place patch.

---

## Issues Closed

This work closes:

- [#1421 — Search](https://github.com/operately/operately/issues/1421): company-wide, content type-aware full-text search through messages, documents, and past work
- [#4682 — Search within Documents & Files section](https://github.com/operately/operately/issues/4682): search resource-hub items by name and native document content without browsing the complete hierarchy manually

It builds on the first version of [#3504 — Global Search](https://github.com/operately/operately/issues/3504). That issue delivered the existing `Cmd/Ctrl + K` navigation search; this specification preserves that quick-navigation experience and adds a dedicated company-wide content-search page behind it.

---

## Problem

Operately's current search is a quick navigation tool, not full-text search.

The current backend:

- searches only names and titles with normalized `LIKE '%query%'` expressions
- runs a separate query for each resource type
- returns at most five results per type
- does not search rich-text descriptions, discussions, documents, check-ins, or retrospectives
- excludes closed projects and goals, completed milestones, and closed tasks

As a company accumulates work, users cannot reliably retrieve an older decision, discussion, check-in, or document unless they already remember where it lives. This makes historical work feel lost and reduces trust in Operately as the durable record of the company's work.

The resource-hub problem is the same retrieval problem with an additional scope constraint. A user should not need to browse folders manually when they know words from a document title or body.

---

## Goals

- Search the title/name and textual body of supported Operately resources.
- Include closed, completed, paused, and archived work unless it has been deleted.
- Enforce company isolation and existing view permissions before returning titles, snippets, or metadata.
- Use one PostgreSQL search projection for company and resource-hub scopes while keeping their loading, API, and UI code independent.
- Preserve the current global search overlay, keyboard shortcut, keyboard navigation, per-type limits, and current-work exclusions as a title/name-only quick navigator.
- Expand quick navigation to discussions, folders, documents, files, and links.
- Provide a dedicated Search page for permission-aware title and body retrieval.
- Explain why every dedicated full-text result matched.
- Return up to 30 full-text results on the dedicated Search page.
- Keep search indexing recoverable through an idempotent backfill and reconciliation process.
- Meet interactive-search latency without introducing another stateful service.

## Non-goals

- Semantic or embedding-based search.
- Searching comments.
- Searching historical revisions of a resource. The searchable result is the current canonical record, even when that record is closed or archived.
- Indexing activity records as duplicate copies of canonical resources.
- OCR or extraction from uploaded PDF, Office, image, audio, or video contents in the first release.
- Importing the body of external Google Docs, Notion pages, Dropbox files, or similar links. Their Operately name and description remain searchable.
- Replacing resource-specific filters and list sorting.
- Adding Redis, Elasticsearch, OpenSearch, Meilisearch, or Typesense.

---

## Important Decisions

### 1. Search development does not wait for the database update

The repository currently pins PostgreSQL 14.5 in:

- `docker-compose.yml`
- `app/rel/single-host/templates/docker-compose.yml.eex`

PostgreSQL 14.5 already supports the complete search design: stored generated `tsvector` columns, GIN indexes, `websearch_to_tsquery`, `ts_rank_cd`, `pg_trgm`, `unaccent`, and custom text-search configurations. Phases 1 through 3 can therefore proceed on the development database.

Keep search migrations and queries compatible with PostgreSQL 14 and newer. Development and preliminary search testing may run on 14.5, but 14.5 is not an acceptable production baseline or the source of final performance evidence. Later PostgreSQL 14 patches contain fixes relevant to `websearch_to_tsquery` and concurrent GIN updates.

References:

- [PostgreSQL 14 full-text-search tables and indexes](https://www.postgresql.org/docs/14/textsearch-tables.html)
- [PostgreSQL 14.11 release notes](https://www.postgresql.org/docs/release/14.11/)
- [PostgreSQL 14.13 release notes](https://www.postgresql.org/docs/release/14.13/)
- [PostgreSQL versioning policy](https://www.postgresql.org/support/versioning/)

The patched production database (PostgreSQL 14.23) is the baseline for production backfill and indexed reads, not a prerequisite for implementing the feature.

### 2. Production database baseline is PostgreSQL 14.23

Production was updated from PostgreSQL 14.5 to PostgreSQL 14.23 as a minor in-place patch. The update keeps the existing PostgreSQL 14 volume layout and `PGDATA` and does not require dump/restore.

The update path used a verified backup or snapshot, review of intervening minor-release notes, a clean database restart, and application smoke tests.

References:

- [PostgreSQL 14.23 release notes](https://www.postgresql.org/docs/release/14.23/)
- [PostgreSQL versioning policy](https://www.postgresql.org/support/versioning/)

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

### 5. Authorization follows the API scope

Every search entry carries the canonical resource's `company_id` and `access_context_id`.

The API authorizes the requested search scope before invoking the search query. Resource-hub
children all inherit the owning space, project, or goal access context, so resource-hub search
authorizes the hub once and does not repeat the same access-binding join for every entry.

The query still restricts candidates to the authorized resource hub and joins current resources,
nodes, and folder ancestors before ranking. This prevents stale index rows for deleted, draft,
missing, or out-of-scope resources from being returned.

Company-wide search spans resources with different access contexts. Phase 3 must therefore apply
live access bindings to each candidate before selecting titles, snippets, or metadata.

Do not copy expanded person ACL lists into the search index. Permission changes must take effect
without reindexing resources.

### 6. Closed work is searchable; deleted work is not

The quick-navigation overlay continues to exclude past work. Dedicated company full-text search intentionally includes it:

- closed projects and goals are searchable and display `Closed`
- completed milestones and tasks are searchable and display `Completed`
- archived discussions are searchable and display `Archived`
- paused work remains searchable and may display `Paused` when useful
- soft-deleted or hard-deleted resources are removed from the search projection
- drafts and scheduled-but-unpublished content are excluded from company and resource-hub search in the first release

Current/open resources do not need a status badge. Status labels are neutral context, not error states.

### 7. Separate quick navigation from full-text retrieval

Continue using `turboui/src/GlobalSearch` and the existing overlay for fast navigation. The overlay remains title/name-only and does not render full-text results, match-source labels, body snippets, or historical-state badges.

Preserve:

- the header search activator
- `Cmd/Ctrl + K`
- the 300 ms debounce
- the existing `SPACES`, `GOALS`, `PROJECTS`, `MILESTONES`, `TASKS`, and `PEOPLE` groups
- the current limit of five results per type
- the current exclusion of closed projects and goals, completed milestones, and closed tasks
- arrow-key navigation
- Enter to navigate
- Escape and click-outside to close
- the existing modal width, responsive maximum width, and scrollable result area unless testing shows a concrete layout problem

Expand the overlay with title/name-only `DISCUSSIONS`, `FOLDERS`, `DOCUMENTS`, `FILES`, and `LINKS` groups. Append these after the existing groups so the established navigation order remains stable. Include only currently eligible, published, non-deleted records that the requester can view; archived discussions are excluded from quick navigation.

For every valid query of at least two characters, render a divider followed by one final selectable action:

```text
Search titles and content for “{query}”
```

Show this action whether quick matches exist, no quick matches exist, or the quick-search request fails. Clicking it or selecting it with the keyboard closes the overlay and opens the dedicated Search page with the query preserved.

This action is added only after the dedicated Search API and page exist. PR 3.6 expands the title/name-only quick-navigation results without the divider or final action; PR 3.9 connects that overlay to the completed Search page.

The dedicated Search page owns company-wide full-text retrieval. It renders the relevance-ranked results already defined by `Operately.Search.search_company/2`, including historical resources. Detailed rows show:

- resource icon and resource type
- result title/name
- parent context, such as space, project, goal, resource hub, or folder path
- an optional status badge: `Closed`, `Completed`, `Archived`, or `Paused`
- the match source: `Matched in title`, `Matched in name`, `Matched in description`, `Matched in content`, or `Matched in message`
- a short excerpt when the match is in body content

Title/name matches should rank above body-only matches when the remaining signals are comparable. A strong body match may still outrank a weak fuzzy title match.

### 8. Resource-hub search is inline

The company header continues to own the modal global-search experience.

The resource-hub page renders a `Search this resource hub…` input immediately before the existing sort/filter control. It does not open the global-search overlay.

Typing at least two characters starts a 300 ms debounced search scoped to the current hub. Search results replace the normal resource-hub node rows and use the same row presentation and canonical navigation. An empty response displays `No matching items. Try different keywords.` Clearing the field restores the normal nodes immediately.

Resource-hub search covers the entire hub, including descendants of nested folders. It preserves backend relevance ordering rather than applying the current folder's selected sort order.

### 9. TurboUI remains pure

`turboui/src/GlobalSearch` owns quick-navigation overlay presentation and interaction state. The dedicated Search page owns company full-text presentation and request state. Resource-hub and Docs & Files components own their separate inline fields and replacement-list state. All receive display data, nodes, links, and callbacks through props.

It must not:

- call `Api.*`
- import app routes or `@/` modules
- inspect the current URL
- read app contexts

The app bridge owns:

- quick-navigation, company full-text, and resource-hub scope
- API calls
- route construction for each result type
- navigation callbacks
- any feature-flag or rollout choice

Keep resource-hub search independent from company search. The resource-hub adapter returns list-row nodes and canonical paths. Quick navigation and the dedicated Search page use separate adapters because their corpora, result detail, limits, and interaction models differ.

### 10. Canonical writes enqueue reliable index refreshes

Search is a derived projection and must not make ordinary content writes fail after the canonical data is valid.

Create, update, publish, close, complete, archive, and restore operations insert an Oban refresh job in the same `Ecto.Multi` transaction as the canonical write. If the write commits, the refresh job exists; if it rolls back, the job does not exist. The worker reloads the latest source record through its trusted adapter and upserts or removes the search entry. Pending duplicate jobs may be coalesced because every execution reads current state.

This deliberately provides near-real-time rather than transactionally immediate indexing. The initial target is for successfully queued updates to become searchable within five seconds under normal load.

Simple resource deletions remove their entries in the canonical transaction. Folder deletion removes entries for the complete hidden subtree so deleted titles and content do not remain visible while a job is pending.

Use Oban for:

- reliable refreshes after normal canonical writes
- the initial idempotent backfill
- refreshing copied or structurally changed resource-hub trees
- batched reindexing after extractor or ranking changes
- periodic reconciliation of missing, stale, or orphaned entries

Backfill and reconciliation remain the repair mechanisms for interrupted jobs, historical data, and rare inconsistencies.

---

## Search Corpus

### Company-wide scope

The table below describes the candidate company-wide corpus. Phase 3 starts with
native documents, discussions, projects, goals, check-ins, and retrospectives.
Milestones, tasks, people, spaces, and other types are added only when product
usage shows that they materially improve retrieval.

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

Activity records are not indexed when they merely duplicate one of these canonical resources.

### Quick-navigation scope

The `Cmd/Ctrl + K` overlay is a separate title/name-only corpus. It includes:

- active spaces
- active or paused projects; closed projects remain excluded
- open goals; closed goals remain excluded
- pending milestones; completed milestones remain excluded
- open tasks; closed tasks remain excluded
- non-suspended people, matched by full name or job title as today
- published, non-archived discussions
- non-deleted resource-hub folders, published documents, files, and links whose owning space, project, or goal is also eligible for quick navigation

Quick navigation does not include project check-ins, goal check-ins, or project retrospectives because they do not have stable user-authored titles. It does not match descriptions, messages, document bodies, or other body content. Every group remains capped at five results and applies live company and view permissions.

### Resource-hub scope

Resource-hub search includes:

- folders
- published native documents
- uploaded-file records by name and Operately description
- link records by name and Operately description

Uploaded binary contents and external linked-page contents remain out of scope. The UI and documentation must not imply that text inside an uploaded PDF or remote Google Doc is searchable until extraction/import is implemented.

---

## Search Data Model

Add `Operately.Search.Entry` backed by `search_entries`.

Suggested columns:

| Column | Purpose |
| --- | --- |
| `id` | binary UUID primary key |
| `source_type` | stable type such as `project`, `discussion`, or `resource_hub_document` |
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
| `body_kind` | `description`, `content`, `message`, `person_title`, or similar UI-safe semantic label |
| `state` | nullable `closed`, `completed`, `archived`, or `paused` display state |
| `source_inserted_at` | source chronology and optional recency signal |
| `source_updated_at` | stale-entry reconciliation and guarded refreshes |
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

The resource-hub release starts with one focused query:
`search_resource_hub(authorized_resource_hub, query)`.

- trim and normalize repeated whitespace and separator characters
- keep the existing minimum query length of two characters
- use `websearch_to_tsquery('operately', query)` for quoted phrases, `OR`, and structured terms without producing syntax errors
- treat unary minus as punctuation rather than an exclusion operator, while preserving internal hyphens in terms such as `alpha-beta`
- use the full-text GIN index as the primary candidate path
- authorize the resource hub in the API before invoking the search query
- apply resource-hub, publication, deletion, and current-hierarchy predicates before ranking or limiting
- return at most 30 results in the first release
- batch-load current nodes and folder paths for the selected results instead of storing folder paths in `search_entries`

Company scope is added in Phase 3. The dedicated Search page uses this permission-aware query with the same two-character minimum, 300 ms client debounce, and 30-result cap. Space, project, goal, type-filter, and pagination inputs are deferred until a concrete product consumer requires them.

Quick navigation uses a separate canonical title/name query. It preserves the existing normalized substring behavior and five-results-per-type limit and must not execute the full-text body query.

### Ranking signals

Rank the first resource-hub release using:

1. exact normalized title/name match
2. normalized title/name prefix match
3. title/name full-text rank
4. body full-text rank
5. source ID as a stable tie-breaker

Use `ts_rank_cd` for the full-text signals. Trigram typo tolerance, recency scoring, and additional ranking signals are deferred until observed queries demonstrate a relevance problem.

Do not expose raw ranking scores as a stable public API contract.

### Match source

For each selected candidate, determine whether the query matched the title/name, body, or both. The API returns the strongest semantic match field, not an implementation-specific database column name.

Examples:

- project title match -> `name`
- project body match -> `description`
- document title match -> `title`
- document body match -> `content`
- person body match -> `person_title`

### Snippets

Generate a short plain-text excerpt for body matches, centered on the strongest matching terms.

Do not return or render `ts_headline` HTML. Configure or sanitize excerpt generation so the API returns plain text. Structured highlighted segments may be added later if user testing shows that highlighting materially improves retrieval.

---

## API Contract

The resource-hub API initially accepts:

```text
query: string
resource_hub_id: UUID
```

Rules:

- the resource hub must belong to the authenticated company and be visible to the requester
- return at most 30 relevance-ranked results
- no type filters or pagination are exposed in the first resource-hub release

Return one ordered `nodes` list using the existing `resource_hub_node` API type:

```text
nodes[]:
  id
  name
  type
  folder | document | file | link
```

The backend keeps ranking metadata internal, selects at most 30 matching node IDs, and hydrates them with the same nested resources, authors, content, file metadata, comment counts, and folder-child counts used by `resource_hubs/list_nodes`. The returned node order remains the full-text relevance order.

This lets inline search use the exact same resource-hub row, description, counts, actions, and canonical path construction as the ordinary list. `Operately.Search.Result` is used by the mixed company-wide full-text contract, where match source, context, snippets, and typed navigation metadata are needed.

Phase 3 adds company scope and state metadata for closed, completed, archived, and paused work. Pagination and additional scopes remain follow-up work unless the first 30 results prove insufficient.

PR 3.4 originally implemented a compatibility response combining grouped navigation with `full_text_results`. That combined endpoint was later retired: the external `companies/global_search` route now remains only as a backward-compatible wrapper around quick search. PR 3.7 does not restore the combined response; `companies/search` is the dedicated full-text contract.

PR 3.5 adds `companies/quick_search`, a shared internal and external title/name-only API:

```text
query: string

spaces[]
projects[]
goals[]
milestones[]
tasks[]
people[]
discussions[]
folders[]
documents[]
files[]
links[]
```

It returns at most five visible, currently eligible results per type and never queries body text.
External API clients receive the same permission-filtered grouped response.

PR 3.7 adds `companies/search`, a focused full-text API for the dedicated Search page:

```text
query: string

results[]: SearchResult
```

It delegates to the existing permission-aware `Operately.Search.search_company/2` query and returns at most 30 results. The external `companies/global_search` compatibility wrapper remains unchanged and continues forwarding to quick search.

---

## UI Specification

### Company search

The Company Layout continues to render the existing `GlobalSearch` activator in the top navigation.

Quick-search copy:

- activator: `Search`
- overlay input placeholder: preserve the current placeholder
- loading: `Searching…`
- empty: `No title or name matches for “{query}”.`
- error: `Quick search is unavailable.`
- final action: `Search titles and content for “{query}”`

For a query of at least two characters, the quick-search result area has one of these shapes:

```text
Result 1
Result 2
Result 3
────────────────
Search titles and content for “{query}”
```

```text
No title or name matches for “{query}”.
────────────────
Search titles and content for “{query}”
```

The error state must be distinct from the empty state. A failed quick-search request must not tell the user that no matching work exists, and it must not remove the option to continue to the dedicated Search page.

### Dedicated Search page

The final quick-search action navigates to the company Search page with the current query in the URL as `q`. The page:

- uses the page title `Search`
- uses `Search titles and content…` as the search-field placeholder and accessible label
- initializes the field from `q` and immediately searches when `q` has at least two characters
- updates results after a 300 ms debounce as the field changes
- updates `q` without adding one browser-history entry per keystroke
- ignores stale responses when a newer query is pending or complete
- returns and displays at most 30 results; pagination is not part of the first page release
- renders only the ranked full-text result list, not the quick-navigation groups
- navigates every result through its canonical typed navigation target

Page copy:

- loading: `Searching…`
- no query: `Search across projects, goals, discussions, documents, and more.`
- empty: `No content found for “{query}”. Try different keywords.`
- error: `Search is unavailable. Try again.`

The page must preserve the query across reloads and support direct links and browser back/forward navigation.

### Resource-hub search

Add an inline input before the resource-hub sort/filter control:

- placeholder and accessible label: `Search this resource hub…`
- use the current resource hub as the fixed backend scope
- debounce requests by 300 ms
- replace normal resource-hub rows with ranked results
- render results with the normal resource-hub item row
- show `Searching…`, `No matching items. Try different keywords.`, and `Search is unavailable. Try again.` as distinct states
- restore normal nodes immediately when the input is cleared

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

- preserve the existing compact resource-type sections in quick navigation and append the five new title/name-only groups
- preserve backend relevance order for inline resource-hub results
- keep body snippets, match-source labels, historical-state badges, and mixed full-text rows out of the quick-search overlay
- render mixed full-text rows only on the dedicated Search page
- omit repeated type labels in homogeneous quick-search sections; dedicated mixed results keep result type and parent context visible without relying only on an icon
- status is textual and not communicated by color alone
- snippets are limited to a small number of lines and never overwhelm the title/context hierarchy
- selected, hovered, loading, empty, and error states use semantic design-system colors
- long titles and names truncate predictably in the overlay; long titles, paths, and snippets truncate or wrap predictably on the Search page

### Interaction and accessibility

- preserve arrow-key wraparound, Enter, Escape, click, and click-outside behavior
- include `Search titles and content for “{query}”` in the overlay's arrow-key and Enter navigation
- keep the selected item visible while keyboard navigation crosses the overlay scroll boundary
- represent the result collection and options with appropriate listbox/option semantics or an equivalent accessible navigation pattern
- expose the selected option through ARIA state
- announce loading, result count changes, empty state, and errors to assistive technology without moving focus from the query input
- keep focus in the dedicated page's search field while debounced results update

### TurboUI stories

In PR 3.6, update `turboui/src/GlobalSearch/index.stories.tsx` with:

- grouped legacy company results
- the additional discussion and resource-hub groups
- long titles and names
- company scope
- loading
- empty
- error
- enough results to exercise scrolling
- keyboard navigation across quick-search results

In PR 3.8, add dedicated Search-page stories or component tests for:

- title and content matches
- closed/completed/archived results
- long title, path, and snippet content
- initial, loading, empty, error, and populated states
- stale-response handling
- the 30-result cap

In PR 3.9, extend the Global Search stories with:

- grouped results followed by `Search titles and content for “{query}”`
- empty and error states that retain the final action
- keyboard and pointer navigation through the final action

Cover resource-hub inline matching, loading, empty, error, and cleared states in the Resource Hub, Project, and Goal page stories instead of `GlobalSearch` stories.

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

Add a durable refresh job to canonical operations that can change:

- searchable title/body text
- publication state
- closed/completed/archived state
- company, access context, or scope
- deletion/restoration state

The job is inserted in the canonical `Ecto.Multi` and runs after commit. Folder paths are hydrated from current resource-hub nodes at query time, so moves and ancestor renames do not require reindexing. Direct deletions and folder-subtree deletions remove entries synchronously.

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
- [x] Add plain-text extractor tests for supported rich-content nodes.
- [x] Implement `Operately.Search.Indexer` upsert/delete behavior.
- [x] Implement the idempotent Oban backfill and reconciliation paths.

### Phase 2 — Resource-hub search end to end

Implement this phase as three ordered PRs so indexing, querying, and the complete user experience can be reviewed independently.

#### PR 2.1 — `chore: Index resource hub content for search`

- [x] Add and register source adapters for resource-hub folders, published documents, files, and links.
- [x] Transactionally enqueue near-real-time refresh jobs for creates, edits, publishing, and copying; remove direct and folder-subtree deletions synchronously, and restore eligible records through reconciliation until a restore API exists.
- [x] Hydrate folder paths from current nodes during search instead of storing parent-folder metadata in the search projection.
- [x] Cover queued refreshes, backfill, reconciliation, exclusions, and deletion cleanup with focused adapter and operation tests.

#### PR 2.2 — `chore: Add permission-aware resource hub search`

- [x] Add the ranked full-text query and `resource_hub` API scope.
- [x] Return at most 30 fully hydrated `resource_hub_node` values in relevance order.
- [x] Authorize the resource hub at the API boundary, then apply resource-hub, publication, deletion, and current-hierarchy predicates before ranking and limiting.
- [x] Cover permissions, nested-folder scope, ranking, node hydration, and exclusion rules with backend tests.

#### PR 2.3 — `chore: Add search to resource hubs`

- [x] Add the scoped inline search field before the sort/filter control in standalone resource hubs and the project and goal Docs & Files tabs.
- [x] Return API-shaped resource-hub nodes directly and reuse the ordinary row and canonical path handling.
- [x] Debounce searches, replace normal nodes with ranked hits, and restore normal nodes when cleared.
- [x] Preserve relevance order and disable the shared sort control while search results are active.
- [x] Keep `Cmd/Ctrl + K` owned exclusively by company global search.
- [x] Add focused Storybook and feature coverage for scoped results, navigation, loading, empty, error, and clearing.

Until the initial backfill and controlled rollout are complete, the resource-hub input is shown only to companies with the `full_text_search` experimental feature. The authenticated API remains available independently of this UI gate.

This phase closes #4682 as scoped here: native documents are searchable by title and body, while folders, uploaded-file records, and links are searchable by their Operately name and description. Uploaded binary and remote-link body extraction remain explicitly out of scope.

### Phase 3 — Company-wide full-text corpus and UI

Implement the critical path as nine ordered PRs. Keep lower-value full-text corpus expansion as an optional tenth PR after the dedicated Search page and search quality are stable.

#### PR 3.1 — `chore: Add permission-aware company search query`

- [x] Add a company-scoped query over the existing resource-hub entries in the shared `search_entries` projection without changing the API or UI.
- [x] Apply live access-context permissions before selecting titles, snippets, state, or navigation metadata.
- [x] Add shared ranking, current resource-hub record exclusions, context hydration, match-source detection, plain-text snippets, indexed-state passthrough, and stable ordering.
- [x] Cover relevance, company isolation, permission changes, stale resource-hub entries, indexed state, and navigation metadata with focused domain tests.
- [x] Keep source eligibility, context hydration, and result construction explicit so later corpus PRs can extend the company query one source family at a time.

PR 3.1 intentionally establishes the permission-aware company-query pipeline with
resource-hub entries only. It does not make every possible `search_entries` source
type queryable. Each later corpus PR must extend live eligibility checks, context and
state hydration, match-source mapping, and typed navigation alongside its source
adapters before that source type is considered searchable.

#### PR 3.2 — `chore: Index core work for company search`

- [x] Add and register source adapters for projects, goals, and discussions.
- [x] Extend the company query and result builder with live eligibility, context, state, match-source, and typed navigation handling for projects, goals, and discussions.
- [x] Index names/titles, descriptions/content, current scopes, access contexts, timestamps, and closed/archived state.
- [x] Enqueue reliable refreshes from the relevant create, edit, close/archive, restore, and delete operations.
- [x] Cover adapter output, query results, permissions, operation refreshes, exclusions, backfill, reconciliation, and restoration.

Native resource-hub content is already indexed by Phase 2 and is the first source
family accepted by company search through PR 3.1.

#### PR 3.3 — `chore: Index check-ins and project retrospectives`

- [x] Add and register source adapters for project check-ins, goal check-ins, and project retrospectives.
- [x] Extend the company query and result builder with live publication and parent eligibility, context, state, match-source, and typed navigation handling for these core-work sources.
- [x] Define stable result titles and parent context for records whose primary identity comes from a project or goal.
- [x] Index only published records while allowing their parent project or goal to be closed.
- [x] Cover publication rules, query results, rich-text extraction, parent permissions and state, refreshes, backfill, and reconciliation.

#### PR 3.4 — `chore: Add combined company search API`

- [x] Have one company API request run the existing grouped navigation query and the new full-text query.
- [x] Preserve the existing grouped `spaces`, `goals`, `projects`, `milestones`, `tasks`, and `people` fields during compatibility.
- [x] Deduplicate full-text matches against legacy results by `(source_type, source_id)` on the server.
- [x] Return the remaining ranked full-text results with match source, context, state, safe snippet, and typed navigation metadata.
- [x] Update serializers and generated clients, and cover the complete response contract without changing `GlobalSearch` yet.

PRs 3.1 through 3.4 are complete and remain unchanged as the indexing, permission, query, and compatibility-API foundation. PRs 3.5 through 3.9 implement the revised separation between quick navigation and dedicated full-text search.

#### PR 3.5 — `chore: Add expanded quick-search API`

- [x] Add `companies/quick_search`, searching canonical titles/names for spaces, projects, goals, milestones, tasks, people, discussions, folders, documents, files, and links.
- [x] Preserve normalized substring behavior, the two-character minimum, five results per type, current group ordering, and existing exclusions for closed/completed work.
- [x] Include only published, non-archived discussions and eligible non-deleted resource-hub items; exclude check-ins and retrospectives.
- [x] Apply company isolation and live view permissions before selecting any result metadata.
- [x] Return separate typed groups for the eleven supported quick-search types without querying descriptions, messages, document bodies, or `search_vector`.
- [x] Expose the endpoint through the common internal and external API contract.
- [x] Update generated clients and catalogs, and cover every group, external authorization, title/name-only matching, caps, exclusions, company isolation, and live permission changes.

#### PR 3.6 — `chore: Expand the global quick search`

- [x] Switch the company `GlobalSearch` adapter to `companies/quick_search` while preserving the activator, `Cmd/Ctrl + K`, 300 ms debounce, compact rows, and existing group order.
- [x] Append `DISCUSSIONS`, `FOLDERS`, `DOCUMENTS`, `FILES`, and `LINKS` after the existing groups and show their current space or owner as context.
- [x] Keep the overlay title/name-only and omit any full-text action, request, route, snippet, match-source label, or historical-state badge until the dedicated Search page exists.
- [x] Replace untyped result flattening with normalized typed options shared by rendering and keyboard navigation.
- [x] Preserve arrow-key wraparound, Enter, Escape, click-outside closing, selected-item scrolling, and accessible listbox/option state.
- [x] Add focused mapper, TurboUI, Storybook, and company feature coverage for every group, canonical navigation, title-only matching, loading/empty/error states, long names, scrolling, keyboard navigation, and accessibility.

#### PR 3.7 — `chore: Add dedicated company full-text search API`

- [x] Add `companies/search`, accepting `query` and returning one ordered `results` list.
- [x] Delegate to `Operately.Search.search_company/2`, preserving its live permission checks, eligibility validation, relevance order, typed navigation, match source, state, safe snippets, and 30-result cap.
- [x] Return an empty list for queries shorter than two characters and keep the external `companies/global_search` quick-search compatibility wrapper unchanged.
- [x] Update serializers, generated clients, external API coverage, and focused response-contract tests for every supported full-text type.

#### PR 3.8 — `chore: Add company Search page`

- [ ] Add the company Search route and page, using URL parameter `q` as the shareable and reload-safe query.
- [ ] Seed the search field from `q`, immediately search valid initial queries, debounce edits by 300 ms, update the URL without one history entry per keystroke, and handle browser back/forward.
- [ ] Ignore stale responses and render distinct initial, loading, populated, empty, and error states while keeping focus in the search field.
- [ ] Render at most 30 mixed full-text results with resource type, title/name, context, optional historical state, strongest matched field, safe body snippet, and canonical navigation.
- [ ] Keep quick-navigation groups off this page and do not add pagination in the first release.
- [ ] Add focused page/component stories and company feature coverage for carried queries, direct links, subsequent searches, stale responses, all request states, result navigation, accessibility, and the 30-result cap.

#### PR 3.9 — `chore: Connect quick search to full-text search`

- [ ] Add a divider and final `Search titles and content for “{query}”` option for every quick-search query of at least two characters.
- [ ] Keep the action available after populated, empty, and quick-search error states without changing or refilling the quick-search results.
- [ ] Include the action in pointer navigation, arrow-key wraparound, Enter handling, selected-item scrolling, listbox/option semantics, and selected-option ARIA state.
- [ ] Close the overlay and navigate to the completed company Search page with the current query encoded as `q`.
- [ ] Add focused TurboUI, Storybook, mapper, and company feature coverage for copy, divider placement, availability in every request state, keyboard behavior, query preservation, and navigation.

#### Optional PR 3.10 — `chore: Expand the company full-text corpus`

- [ ] Measure retrieval gaps before adding milestones, tasks, people, or other lower-value source types to the full-text index.
- [ ] Add only source types that materially improve retrieval beyond the existing name-based navigation groups.
- [ ] Apply the same adapter, refresh, authorization, backfill, and reconciliation requirements to every added type.

The combined API response is also exposed by the existing MCP search tool; no separate MCP tool is required.

- [ ] After the resource-hub and company search queries have stabilized, evaluate the duplicated resource eligibility and visible-folder CTE logic in `ResourceHubQuery` and `CompanyQuery.ResourceHubItems`. Extract shared query-building code only if it meaningfully reduces maintenance risk without coupling their different scopes, result shapes, authorization boundaries, or hydration behavior; otherwise document why keeping the small duplication is clearer.

Phase 3 closes #1421 after PRs 3.5 through 3.9 deliver the revised quick-navigation and dedicated Search-page experience.

Phases 1 through 3 may begin immediately on the current development database. Preliminary results on PostgreSQL 14.5 do not replace final verification on the PostgreSQL 14.23 production baseline.

### Phase 4 — Update the production database to PostgreSQL 14.23

- [x] Update production from PostgreSQL 14.5 to PostgreSQL 14.23 as a minor in-place patch on the existing volume and `PGDATA`.
- [x] Complete the update with a verified backup or snapshot, intervening-release checks, a clean restart, and smoke tests.
- [x] Verify Ecto, Postgrex, Oban, extensions, migrations, authentication, export/import, and the complete application test suite on PostgreSQL 14.23.
- [ ] Validate the final permission-aware query with `EXPLAIN (ANALYZE, BUFFERS)` and measure relevance and performance against a production-like corpus on PostgreSQL 14.23.
- [ ] Verify clean installation and production-like existing-data upgrade paths for development and single-host distributions.
- [ ] Update installation, upgrade, rollback, and release documentation for the PostgreSQL 14.23 baseline.

The production database update is complete. Search implementation is not blocked by the remaining verification items, but no production backfill or indexed reads begin until those items and Phase 5 readiness checks are complete.

### Phase 5 — Backfill, rollout, and old-query retirement

- [ ] Deploy schema and ongoing index writes before enabling indexed reads.
- [ ] Backfill existing companies and publish progress/health metrics.
- [ ] Compare indexed results with canonical sources and investigate gaps.
- [ ] Enable indexed reads behind a controlled rollout switch.
- [ ] Monitor latency, errors, index lag, reconciliation differences, and database load.
- [ ] Enable for all companies when acceptance criteria pass.
- [ ] Remove the old multi-query `LIKE` implementation only after rollback is no longer required.

> **Direction note:** PR 3.5 preserves title/name quick navigation as a product capability. The final cleanup item above applies only to the obsolete multi-query implementation after the replacement quick-search query is live; it does not remove title/name quick search.

---

## Testing

### Database compatibility and PostgreSQL 14.23 update

- search schema, extension, generated-vector, GIN, trigram, query, and ranking tests on PostgreSQL 14
- preliminary development compatibility on PostgreSQL 14.5, without treating its correctness or performance results as release evidence
- final correctness, query-plan, and performance acceptance on PostgreSQL 14.23
- verified backup or snapshot, same-volume minor update from 14.5 to 14.23, clean restart, version verification, and rollback rehearsal
- review and apply any relevant actions from intervening 14.x release notes
- migrations from an existing production-like schema on PostgreSQL 14.23
- application and Oban read/write smoke tests
- company export/import round trip

### Indexer

- every supported type produces the expected title, body, body kind, state, company, access context, and scopes
- canonical writes commit their refresh jobs atomically
- queued create/update/publish/close/complete/archive/restore refreshes
- synchronous direct and folder-subtree deletion cleanup
- idempotent upsert and delete
- rich text, mentions, punctuation, accents, empty content, and malformed optional content
- backfill interruption and resume
- reconciliation repairs missing/stale entries and removes orphans

### Full-text query

- exact, prefix, full-text, phrase, accent-insensitive, and case-insensitive matches
- title matches versus description/content matches
- stable relevance for the first 30 results
- closed/completed/archived result inclusion
- deleted, draft, scheduled, and suspended result exclusion
- company and resource-hub scoping
- no cross-company results
- no result, title, context, or snippet leakage without view access
- immediate disappearance after permission revocation
- normal queued refreshes become searchable within five seconds

### Quick-search query

- normalized title/name substring matching for all eleven supported groups
- no description, message, document-body, or other body-only matches
- five results per type with stable ordering
- existing closed/completed exclusions for legacy groups
- published and non-archived discussion eligibility
- published/non-deleted resource-hub eligibility
- no check-in or retrospective results
- company isolation, live view permissions, and immediate permission revocation
- no full-text query execution from the quick-search endpoint

### UI

- current header activator and `Cmd/Ctrl + K`
- existing quick-search groups followed by discussions, folders, documents, files, and links
- PR 3.6 quick navigation without a full-text action or Search-page dependency
- dedicated Search page initial query, URL synchronization, 300 ms debounce, stale-response protection, and 30-result cap
- PR 3.9 `Search titles and content for “{query}”` after populated, empty, and error states
- PR 3.9 keyboard and pointer navigation from the overlay to the Search page with the query preserved
- resource-hub inline field placement, debounce, result replacement, and clearing
- PR 3.6 keyboard navigation across quick-search results
- PR 3.9 keyboard navigation through the final action
- title/body match labels, plain-text snippets, and status badges on the dedicated Search page only
- loading, empty, and error copy
- dark mode and responsive company overlay, Search page, and resource-hub toolbar
- canonical navigation for every result type

---

## Performance and Observability

Record:

- API duration and database query duration
- candidate count and returned count
- quick-navigation, company full-text, and resource-hub scope plus result-type distribution without recording raw user query text in logs by default
- search errors and timeouts
- index write failures
- backfill progress
- reconciliation missing/stale/orphan counts
- time between canonical update and indexed state
- GIN index size and `search_entries` table size

Initial targets on PostgreSQL 14.23 and a production-like corpus of at least one million search entries:

- warm-cache database search p95 <= 200 ms for the first 20 results
- API p95 <= 300 ms excluding client debounce and network variability
- refresh-job insertion adds no more than 25 ms p95 to canonical writes
- queued refreshes complete within five seconds p95 under normal load
- zero unauthorized result metadata or snippets
- zero missing entries after successful backfill and reconciliation

If these targets are not met, inspect query plans, scope indexes, GIN behavior, autovacuum, ranking computation, and snippet generation before considering another search service.

---

## Rollout and Recovery

Use a controlled indexed-search rollout:

1. Production is updated to PostgreSQL 14.23 and verified independently.
2. Search implementation and compatibility work continue on the PostgreSQL 14 baseline.
3. Search schema and queued refresh writes deploy with indexed reads disabled.
4. Existing content is backfilled.
5. Reconciliation reports no unexplained gaps.
6. Indexed reads are enabled for internal/test companies.
7. Search quality, permission behavior, and database load are reviewed on PostgreSQL 14.23.
8. Indexed reads expand to all companies.
9. Obsolete combined and multi-query paths are removed in a later cleanup after the rollback window; the replacement title/name quick-search path remains.

If indexed reads fail during rollout, disable the indexed path and return to the existing name-based search while continuing or repairing index writes. Never bypass permission filtering as a fallback.

---

## Definition of Done

- Production runs on PostgreSQL 14.23; PostgreSQL 14.5 is no longer used in production.
- The PostgreSQL 14.23 update and rollback paths are documented and tested for clean and existing installations.
- Search migrations and queries remain compatible with PostgreSQL 14.
- Both referenced issues are covered by automated acceptance tests.
- The `Cmd/Ctrl + K` overlay remains a title/name-only quick navigator with its current groups and the added discussion and resource-hub groups.
- Every valid quick query offers `Search titles and content for “{query}”`, including when quick search is empty or unavailable.
- The dedicated Search page preserves the carried query, supports further debounced searches, and returns at most 30 permission-aware full-text results.
- Users can find supported resources by title/name and rich-text body on the dedicated Search page.
- Closed, completed, and archived work is returned there with clear status labels.
- Every dedicated full-text result communicates its resource type, context, and strongest matched field.
- Body matches include safe, readable plain-text excerpts on the dedicated Search page.
- Company and resource-hub searches reuse the same backend search foundation while using UI interactions appropriate to their scope.
- Existing access-context rules prevent unauthorized result and snippet disclosure.
- Canonical writes reliably enqueue refreshes, deletions fail closed, and search entries remain backfillable and reconcilable.
- The existing global-search keyboard and mouse interactions remain intact, including navigation through the final Search-page action.
- TurboUI stories cover all result and request states.
- Backend, TurboUI, TypeScript, and feature tests pass. MCP tests are required when the MCP result contract is updated.
- Production-like performance targets are measured and met without adding another search service.
