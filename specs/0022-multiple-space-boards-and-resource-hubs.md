# Multiple Space Boards and Resource Hubs

## Summary

Support multiple named task boards and resource hubs per space, managed through Space Tools. Preserve existing API, MCP, CLI, and URL behavior through explicit default instances.

Related issue: [#5587 — Support multiple kanban boards per space](https://github.com/operately/operately/issues/5587).

## Current State

- Resource hubs already have independent IDs, and Space Tools renders a collection of hubs. `Api.Wrappers.DocsAndFiles.HubScope` selects the oldest hub for a space; external document wrappers and MCP tools generally accept parent IDs rather than hub IDs.
- A space's task statuses and kanban ordering live on `Groups.Group`. Tasks reference the space directly; no board entity exists.
- Space Tools configuration exposes category toggles, not instance management.

## Scope and Experience

- Add, rename, reorder, archive, restore, and choose a default board or hub through Space Tools. Show each active instance as a separate named card.
- Retain category toggles and their current semantics. Disabling a category preserves its instances and content.
- Instances inherit space access. Managing instances requires the existing permission to configure space tools; content operations retain their existing permission requirements.
- Archived instances remain readable through direct links and an archived-tools list, but reject content mutations until restored. Archiving does not delete content or complete tasks.
- Exclude permanent deletion, independent instance permissions, multiple project/goal hubs, and changes to project/milestone board ownership.

## Data Model

- Add `TaskBoard`: `space_id`, `name`, `task_statuses`, `tasks_kanban_state`, `position`, and `archived_at`.
- Add `tasks.board_id` for space tasks. Retain `space_id` for access and existing integrations; enforce that the board belongs to that space. Project tasks have no space board.
- Extend space-owned resource hubs with `position` and `archived_at`; preserve existing hub and content IDs.
- Store `default_task_board_id` and `default_resource_hub_id` on the space. Defaults must reference active instances in that space. Creation, default replacement, and archive validation are transactional.
- Backfill one board per space, preserving existing tasks, status IDs, and ordering. Backfill the existing hub as default; if multiple already exist, preserve the current oldest-hub selection with an ID tie-breaker. New spaces receive one default of each type.
- Board records become authoritative. Preserve legacy space status/order fields in API responses as projections of the default board, rather than maintaining two writable copies.

## API and Agent Compatibility

Implement selection and authorization in shared API/domain code. MCP remains a thin adapter; CLI commands come from the API catalog.

| Input or operation | Required behavior |
| --- | --- |
| Explicit `board_id` or `resource_hub_id` | Select that instance; validate access and any supplied parent. Reject conflicting selectors. |
| Existing task, document, or folder ID | Derive its actual board/hub. Reject conflicting explicit destinations unless the operation is a move/copy. |
| Space-only create or destination | Use the persisted default. Never select by name, position, or creation time at runtime. |
| Legacy space-level status/order mutation | Apply to the default board; reject tasks belonging to another board. |
| Space task listing | Preserve all-space task results; add an optional board filter and board identity to each task. |
| Legacy hub content listing/search | Preserve default-hub behavior; do not silently expand to all hubs. |
| Missing/unavailable default | Return a stable machine-readable error with accessible choices and retry guidance; do not guess. |

- Expose lightweight instance discovery with ID, name, type, position, archive state, and default designation. Avoid requiring agents to load tool contents to discover destinations.
- Add explicit instance selectors to existing API/MCP operations and generated CLI flags, including create, list/search, and move/copy destinations where applicable. Preserve old inputs, routes, command names, and response fields; expose the resolved instance in results.
- Document default selection in schemas, help, and examples. Require an explicit replacement before archiving a default; adding, restoring, or reordering instances never changes the default.
- Preserve old space-board URLs: task-specific links resolve the task's actual board; links without a task resolve the default. Hub URLs retain their IDs.
- Moving a task updates both boards' ordering atomically. Preserve a valid destination status or require an explicit mapping when statuses differ; never leave a task with a status unavailable on its destination board.

## Implementation PRs

Merge in order. Each PR includes relevant tests; expose multiple instances only after all affected consumers support explicit selection.

### PR 1 — Explicit hub selection and defaults ✅

- Add/backfill default hub references and replace oldest-hub lookup with the shared resolver.
- Add hub discovery and explicit hub IDs across document API wrappers, MCP tools, and CLI, including folder-derived selection and conflict validation.
- Preserve legacy `resource_hubs/*` routes and default-hub list/search behavior.
- Verify single-hub and multiple-hub resolution, authorization, resolved IDs, and old CLI requests.

Implemented `documents/list_hubs`, MCP `list_resource_hubs`, persisted defaults, folder-derived selection, and structured retry errors. CLI file uploads also accept explicit hub IDs. Defaults survive export/import; older imports initialize missing defaults. Validation: 1,621 targeted backend checks, 23 CLI checks, catalog sync, and translation checks passed.

### PR 2 — Resource hub management in Space Tools

- Add hub ordering/archive state and API operations for creation, renaming, ordering, archiving/restoring, and default selection; expose management through MCP and CLI.
- Extend Space Tools configuration with instance controls and archived hubs. Reuse the existing hub cards and creation/rename operations.
- Apply archive rules to content access, writes, and discovery; retain content, search access checks, and direct links.
- Verify lifecycle permissions, default replacement, category toggles, and the complete two-hub UI flow.

### PR 3 — Board schema preparation

- Add the board table, nullable task/default references, and ownership constraints without changing runtime behavior.
- Prepare an idempotent data migration using migration-local schemas. Do not enable additional boards yet.
- Cover preservation of status IDs, ordering, task IDs, and spaces with disabled tools in migration tests.

### PR 4 — Move existing space task behavior onto boards

- Run the backfill and switch readers/writers together under a deployment write pause so concurrent legacy writes cannot be lost. Verify every space task has a board before enabling writes.
- Update creation, statuses, ordering synchronization, task moves, archives, serializers, and space creation to use boards. Retain legacy API projections and URL adapters.
- Add explicit board selection and discovery to API/MCP/CLI; preserve all-space task listings. Continue exposing one board per space in the UI.
- Update activity/navigation context, search, and company export/import so board ownership survives links and data transfers. Audit the corresponding hub metadata added in PRs 1–2.
- Verify existing single-board flows and old clients, plus board isolation, status mapping, and task-specific links using multiple-board fixtures.

### PR 5 — Board instance management APIs

- Add create, rename, reorder, archive/restore, and default-selection APIs with MCP/CLI exposure. Enforce ownership, default, and archive invariants.
- Extend Space Tools responses with board summaries while preserving existing fields.
- Verify concurrent default/archive changes, cross-space rejection, and independent statuses/order across two boards before enabling creation.

### PR 6 — Multiple boards in Space Tools

- Add board instance controls alongside hub controls, board-specific cards/routes, and destination selection when creating or moving tasks.
- Reuse TurboUI board and configuration primitives; use generated TanStack queries/mutations for affected app surfaces. Include translations and regenerated resources with each UI PR.
- Verify two-board/two-hub workflows, archive/restore, defaults, disabled categories, and old links in feature tests.

For every API contract PR, regenerate clients and the CLI catalog, update MCP schemas/examples/catalog tests, run `make test.cli.catalog.sync`, and extend backward-compatibility coverage. Preserve one-instance behavior throughout rollout.
