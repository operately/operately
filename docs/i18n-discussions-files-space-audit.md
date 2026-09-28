# Discussions, Docs & Files, and space boards: extraction audit

## Inventory before extraction

| Surface | Uncataloged copy found | Existing catalog coverage reused |
| --- | --- | --- |
| Discussions | New/edit page titles, composer placeholders and validation, publish/save/discard controls, draft empty state and actions, draft timestamps, document title metadata, ongoing draft sharing and shared scheduling controls/sentences | Discussion list headings/empty state, draft counts, subscription/comment primitives |
| Docs & Files | Upload/add menu, upload validation/progress, copy-name defaults, folder rename validation, document/file/link editor validation and submit controls, app page titles/navigation/actions/errors, version history/comparison/restore states and accessibility | Resource menus, delete/move/copy confirmations, search states, folder and hub empty states, metadata and draft lists |
| Space home and work maps | Completed-work summaries, tabs, row roles/progress summaries, timeline empty/undated states and tooltips, first-project empty state, company work-map and kanban document titles | Space administration, most home tools, work-map table headers and add-item controls, kanban task-board controls and task operation toasts |
| KPIs | Detail/sidebar headings, update history and comments, log/edit/delete-entry forms, clipboard feedback, annotation accessibility, cadence options | KPI list/new-KPI/annotation form labels and existing app operation errors |

The audit follows the app pages into their live TurboUI and bridge dependencies. `MiniWorkMap` itself only renders user-authored names and shared status/avatar components; its unknown-type exception is a developer invariant, not interface copy.

## Boundaries and remaining gaps

- People directory and org-chart copy remain separate, incomplete extraction work.
- Goal/project/task boards and activity-feed handler sentences belong to earlier extraction slices and are not recataloged here.
- Project-template workflows, remaining shared work-management presentation, and exhaustive narrow-screen visual/end-to-end review remain separate work.
- Backend pass-through errors (including `data.message`), emails, digests, and server-rendered pages remain outside this slice.
- User-authored titles, names, descriptions, KPI units, document contents, API fields, and machine identifiers are not translated.
- Existing date/time/number formatting helpers are retained; formatting changes and the language selector/default rollout are outside this slice.
- File extensions/type badges and external service brand names remain literal identifiers. Developer-only invariant exceptions and console diagnostics remain outside interface lookup.
- Existing count sentences that do not vary by count (for example, timeline “items are hidden”) keep their current English wording; existing singular/plural distinctions use `tn`.
- New catalog messages have English fallback only. Complete Portuguese coverage and native-speaker review remain outstanding.

## UI primitives

The extraction retains the existing Forms fields/submits, Modal and confirmation dialogs, PrimaryButton/SecondaryButton/GhostButton, Link/ActionLink, Menu/MenuActionItem, PageDescription, TextField, PersonField, Tabs/ViewToggle, ProgressBar, FormattedTime, and toast components. Existing raw custom menu triggers, KPI chart/table controls, and file-removal controls retain their interactions and styling; this copy-only slice introduces no new raw interactive controls.
