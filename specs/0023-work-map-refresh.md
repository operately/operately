# Work Map V2

Replace the five company and space Work Map tabs with one configurable Table / Timeline view. Surface pinned KPIs on each map and let people connect KPIs to goals. Roll out by company, then promote V2 to the existing URLs. [Project](https://app.operately.com/operately-0bcm/projects/work-map-refresh-single-HOZdfA0hD1pPfaHTFt49SG?tab=overview) · [Design brief](0020-work-map-simplification.md)

**The final Work Map must match the [Paper mockups](https://app.paper.design/file/01M7PXQG4GWZ6RZNWZ4CH7F8NF/p-1-0) exactly.** Use all 16 artboards as acceptance references. For visual review, render the same example data and interaction state at the artboards’ 1440 × 805 size. Check narrower layouts and keyboard use separately.

## Page behavior

| Area | Implementation contract |
| --- | --- |
| Table and filters | Start with active goals and projects in a nested table. Support work type, lifecycle, name, goal/project status, space, champion, and due/created/completed dates. Combine goal and project status selections across types, then intersect with other filters. Show applied filters. Retain accessible ancestors of matching rows as labeled context and count only matches. Use the [filter operators in #2517](https://github.com/operately/operately/issues/2517). |
| Timeline | Table and Timeline consume the same filtered rows, order and expansion state. Keep names fixed while dates scroll. Show goal spans, project bars, continuations, due-only markers and undated rows. Support Today and week/month/quarter scales. |
| Display and Organize | Personal URL adjustments override the map default. Display controls sibling sort, visible columns and KPI visibility. An authorized organizer can save a shared default. Organize opens the full authorized hierarchy in map order. Stage drag-and-drop moves until Save. Cancel discards the draft. Sibling order belongs to each map. Moving to another goal updates the underlying parent across maps and carries the subtree. |
| Add work and edit | Preserve links, quick-add permissions, privacy and first-project onboarding. Offer goal, project, project from template and the scoped template library. Support the inline reviewer picker using existing reviewer mutations and item permissions. |
| KPIs | Show up to three ordered pins above either view, with space, latest measurement date, value and unit. Manage pins supports search, add, remove, reorder and View all KPIs. Company selection spans accessible spaces. Space selection stays within that space. Distinguish no KPIs, no pins, no measurement, no work, and no filter matches. Keep the map usable during KPI loading or error. |

## Backend and frontend contracts

- Extend the existing permission-filtered Work Map read additively. Include the creation timestamp for date filtering and request reviewer data where displayed. Space V2 requests cross-space parent context for paused and completed work. Preserve hierarchical and flat API behavior for V1, Home, Goal, Profile, MCP and CLI callers. Audit consumers and regenerate and verify API clients and the CLI catalog with each contract change.
- Load and cache the accessible goal/project hierarchy for the current company or space, including active, paused and completed work. Apply all table filters, sibling sorting and expansion in the browser. Table and Timeline share the result. Keep display filters out of the map query key so changing a filter or view issues no new map request. Fetch on scope change or cache invalidation. Load KPI pins separately and query the KPI picker on demand.
- Persist shared defaults, sibling order and ordered KPI pins per company map or space map. Empty settings yield a working default for existing companies. Enforce scope and write permissions on the server. Save moves atomically, reject cycles, and preserve siblings the organizer cannot see. Reuse existing parent-change operations and activity behavior. Resolve KPI visibility on every read and batch company-wide KPI lookup and recent measurements.
- A KPI can link to one goal, and a goal can have many KPIs across spaces in the same company. Both detail pages show visible links and support linking and unlinking. Changes require edit access to the KPI’s space and view access to the goal. Record link and unlink changes in the KPI space’s activity feed without sending notifications. Unlink before assigning another goal. Links are independent of map pins and goal progress.
- Build the company and space page in `turboui/src/WorkMapV2/`. Put the new page layout, toolbar and Table/Timeline composition there. Reuse compatible cells and controls from V1, the person field, template selection and KPI formatting. Extract a shared component when both pages need the same behavior. My Work keeps its existing `WorkMapTable`, personal tabs and flat queries throughout the rollout.
- Thin app pages own routing, generated TanStack queries, mutations and invalidation. Translate product copy and pass locale, time and timezone preferences through the existing helpers.

## Shared settings API

The internal `work_maps` endpoints use company scope when `space_id` is omitted. Company edit access can manage the company map. Space edit access can manage that space’s map. Read-only billing disables shared writes. Changing an item’s parent also requires edit access to the item. Assigning or removing its reviewer requires full item access.

- `get_settings` returns map edit permission, IDs of items the requester can reparent or change reviewers on, the default view, visible item order and visible pinned KPI summaries. A null default selects the built-in active table. Apply the saved ranking within each sibling group. Space-only ordering and moves apply to items in that space. Space and champion filters return visible IDs without name slugs.
- `save_layout_and_hierarchy` accepts only the fields being changed. Send ordered IDs for the visible rows or pins, and use a null default to reset the view. Send parent changes in the order staged, each with the item and its new parent. The order and moves commit together. The last successful save wins for each supplied field and moved item. Omitted fields retain their current values.
- V2 omits pins from `get_settings` and loads `get_kpi_pins` independently for history, available slots and first-use state.
- `search_kpis` searches names in the scoped, accessible KPI list in pages of 50 and returns summaries with their latest value and period. These page settings and picker APIs serve the V2 web UI. Existing external API, MCP and CLI commands continue using the V1 reads.

## PR sequence

| PR | Scope and acceptance |
| --- | --- |
| 1. Compatible backend reads **(implemented / ready)** | Add the fields needed for the basic table. Exercise existing hierarchical and flat responses, visibility and their consumers before introducing V2 routes. |
| 2. Shared map settings and pins **(implemented / ready)** | Add storage, scoped read/write APIs and permission tests for defaults, ordering and pins. Cover fresh maps, independent company/space ordering, partial visibility and concurrent saves. |
| 3. Basic TurboUI page **(implemented / ready)** | Build the toolbar, expandable rows, lifecycle/work-type filters and context-only ancestors in Storybook. The Paper completed-projects example shows two matching projects under two parent goals and reports two matches. |
| 4. Flagged company and space routes **(implemented / ready)** | Register one default-off company flag, `work_map_v2`. Add `work-map/v2` and `spaces/:id/work-map/v2`. Run the [existing redirect helpers](../app/assets/js/routes/redirectUtils.tsx) before page data loads. Flag on sends usual URLs to V2. Flag off sends V2 URLs to the usual pages. Translate legacy `?tab=all/goals/projects/paused/completed` and preserve applicable `view=timeline` intent. Use the cached company flag until company data refreshes. Verify both scopes, direct entry, Back, rollback and Home/Space preloading. |
| 5. Complete Table and Timeline **(implemented / ready)** | Add remaining filters, display options, saved defaults and timeline scales. Match the nested, filtered and undated Paper examples. Switching views preserves the visible work. |
| 6. Complete map actions **(implemented / ready)** | Wire Organize, inline reviewer editing, Add work and template selection. Verify Save/Cancel, permissions, company onboarding and space empty states end to end. |
| 7. KPI strip and pin manager **(implemented / ready)** | Connect scoped KPI reads and pin writes. Match the populated, unpinned and first-use designs. Cover revoked space access and failure/retry independently of the table. |
| 8. KPI–goal relationships **(implemented / ready)** | Add linked KPIs to the goal overview and a single goal field to the KPI sidebar behind the pilot flag. Verify cross-space links, duplicate requests, and restricted visibility. |
| 9. Verify and promote | Compare screenshots for all 16 artboards. Run company/space, legacy-link, permissions, onboarding and rollback regressions in the pilot. Once accepted, serve V2 at `work-map` and `spaces/:id/work-map`, remove flag checks and keep both `/v2` URLs as redirects for shared links. |
| 10. Clean up | Remove the flag registration, stored flag values, retired V1 pages and unused table branches, helpers and API code. Trace remaining callers before deletion. Retain the table, cells and helpers used by My Work or V2. Verify My Work’s Tasks, Assigned, Reviewing, Paused and Completed tabs, task status changes and personal task ordering. Check Home, Goal, MCP, CLI and both canonical and pilot URLs. |
| 11. Keyboard move controls (optional) | Add a per-row menu to move up, down, to a goal, or to the top level. |
