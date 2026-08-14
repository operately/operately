# Project Templates

## Summary

Add reusable project templates that let teams start recurring work with a proven structure instead of rebuilding the same project each time.

A template can be created from an existing project or from scratch. It captures the reusable parts of an Operately project—description, milestones, tasks, workflow, selected people, and optionally discussions, Docs & Files, and comments attached to included resources—while excluding other historical and project-specific activity.

Dates in a template are relative to the new project's start date. For example, a task configured as “Due 7 days after project starts” receives a concrete due date when a project is created from the template.

## Problem

Teams that run repeatable projects—events, customer onboarding, hiring, launches, audits, and recurring operational programs—currently recreate milestones, tasks, assignments, documents, and deadlines by hand.

This is slow and error-prone. It is especially painful when the sequence is stable but the calendar changes with every project. An event organizer, for example, may always need a venue task 7 days after kickoff and a promotion task 10 days after kickoff, but must calculate and enter those dates for every event.

## Goals

- Create a project template from an existing project or from a blank template.
- Create a ready-to-run project from a template in one flow.
- Preserve Operately's project structure: milestones, tasks, task workflow, descriptions, and reusable Docs & Files.
- Optionally preserve project discussions as reusable content.
- Support task and milestone deadlines relative to the project's start date.
- Optionally preserve people and assignments while following Operately's existing contributor and task-assignment behavior.
- Optionally preserve comments attached to included resources.
- Attach every template to exactly one Space and honor that Space's visibility.
- Make templates easy to find, edit, duplicate, archive, and delete.
- Keep projects independent from their template after creation.

## Non-goals

- Keeping generated projects synchronized with later template changes.
- Standalone task-list templates.
- Cross-company or public template sharing.
- Template version history or approval workflows.
- Business-day calendars, holiday rules, or dependency-based scheduling.
- Copying activity, check-in history, notifications, or retrospectives.

## Proposed Experience

### Template library

Every template belongs to exactly one Space. There is no company-wide template type.

Templates are available through two library surfaces:

- A company-level **Project Templates** page that aggregates templates from all Spaces the current user can access.
- A **Project Templates** page inside each Space that shows only templates belonging to that Space.

The company-level page is an index, not a separate ownership scope. It groups templates by Space and supports search and a Space filter. Templates from inaccessible Spaces never appear. The Space page avoids cross-department clutter by showing only its own templates.

Both pages show searchable template cards with name, description, Space, creator, last updated date, and a summary such as “5 milestones · 24 tasks.” Each card offers:

- Create project from template
- Edit
- Duplicate
- Archive
- Delete

Archived templates are hidden from project creation but can be restored. Archiving or deleting a template never changes projects already created from it.

### Creating a template

Users can:

1. Choose **New template** on the company or Space template page, or
2. Open a project's actions menu and choose **Save as template**.

Saving an existing project asks for a template name and description, plus:

- **Include people and assignments** — off by default
- **Include discussions** — on by default
- **Include comments** — off by default
- **Include Docs & Files** — on by default

Under **Include people and assignments**, show the helper text: **Copy the project team and task assignments. People keep their project roles and access.**

Creating a template from the company-level page requires choosing a Space first. Creating it from a Space page preselects that Space. Saving an existing project creates the template in the same Space as the project.

The resulting template opens in an editor that looks and behaves like the reusable parts of a standard project. It is not a project record. Its breadcrumb is **Space > Project Templates**, and a **Template** pill appears next to the title in place of the project status.

### Creating a project from a template

The existing New Project flow gains a **Template** selector. Space is selected before the template, so the selector shows only templates belonging to that Space. A user can also start from a template's card.

When creating a project from a template, the user must choose a start date. Operately uses it to calculate the project's relative milestone and task dates.

## What a Template Contains

| Included | Behavior |
| --- | --- |
| Project description | Copied into the new project |
| Project duration | Stored relative to the start date when a project end date exists |
| Milestones | Name, description, order, and relative due date |
| Tasks | Name, description, milestone, order, priority, size, relative due date, and due-relative reminders |
| Task workflow | Custom statuses and board ordering are copied; all tasks start in the first not-started or equivalent status |
| Discussions | Title, body, and author attribution are copied only when **Include discussions** is selected |
| People | Champion, reviewer, contributors, responsibilities, contributor access levels, and task assignees are retained only when **Include people and assignments** is selected |
| Comments | Comments attached to included discussions, milestones, tasks, documents, files, and links are copied only when **Include comments** is selected |
| Docs & Files | Published folders, native documents, links, and files are copied as independent content when selected |

The following are always reset or excluded:

- Project health, completion state, and retrospective
- Completed task and milestone state
- Check-ins and check-in history
- Comments attached to excluded resources
- Reactions, activity, notifications, and existing subscriptions
- Draft or deleted Docs & Files items and document version history
- The source project's parent goal and Company-members/Space-members baseline access settings
- Fixed-date task reminders

The template stores its Space. A project created from the template belongs to that same Space, but does not automatically inherit the source project's Company-members and Space-members baseline access settings. Its parent goal and baseline access levels are chosen through Operately's normal project creation flow. Direct contributor access is copied only when **Include people and assignments** is selected.

When comments are included, each comment stays attached to its copied parent resource and retains its content and author attribution. Copying comments does not copy reactions or subscriptions and does not send mention or comment notifications. Comments whose parent resource is not included are never copied; this means discussion comments require both **Include discussions** and **Include comments**.

## Persistence Boundary

Templates are not a kind of project and are never stored in the `projects` table. Store the reusable root fields in a dedicated `project_templates` table and store the reusable graph in template-owned tables. At minimum, the core model needs template-specific milestones and tasks; optional people, assignments, discussions, comments, and Docs & Files data must also use template-owned records rather than runtime project records.

The template tables copy only the fields required to describe reusable future work. They do not contain project runtime fields such as health, status, check-in scheduling, completion state, retrospective state, parent goal, access baselines, subscription lists, notification state, or contextual project dates.

The initial `project_templates` root contains only the reusable project-level data and template lifecycle metadata:

| `project_templates` field | Source or purpose |
| --- | --- |
| `id` | Template identity |
| `company_id` | Copied from the source project or selected Space |
| `space_id` | The owning Space; equivalent to a project's `group_id` |
| `creator_id` | Person who created the template |
| `source_project_id` | Optional provenance when saved from a project |
| `name`, `description` | Reusable project content |
| `duration_days` | Relative replacement for a project timeframe end date |
| `task_statuses` | Reusable workflow definitions |
| `milestones_ordering_state`, `tasks_kanban_state` | Reusable ordering and board layout |
| `archived_at`, `deleted_at` | Template lifecycle state |
| `inserted_at`, `updated_at` | Standard timestamps |

Do not copy `goal_id`, `private`, `subscription_list_id`, `last_check_in_id`, `last_check_in_status`, `next_check_in_scheduled_at`, `health`, `status`, `closed_at`, `success_status`, deprecated scheduling fields, or any virtual project fields into `project_templates`.

Template milestones and tasks contain their reusable content, ordering, workflow placement, and non-negative due-date offsets. They do not use `project_id`, and they cannot be loaded by ordinary milestone or task APIs. Template-specific people and assignment records reference people for later materialization but do not grant access to the template. Template visibility and management always come from the owning Space.

Generated projects remain ordinary rows in `projects` and may hold a nullable `source_template_id` for provenance. This is the only direct persistence link between a running project and a template. It does not create synchronization in either direction.

Reuse project code only below the persistence and runtime boundary: shared value objects, pure validation and ordering helpers, copy primitives, and TurboUI presentation components are appropriate to share. Project schemas, project getters, runtime mutations, access contexts, activities, subscriptions, notifications, search indexing, and scheduled work are not.

## Relative Scheduling

Template dates are non-negative calendar-day offsets from the project start date:

- `0` — due on the start date
- `7` — due 7 days after the start date

Requirements:

- Tasks, milestones, and the project end date can use relative dates.
- The template editor uses wording such as **7 days after project starts** and **On the project start date**.
- Dates earlier than the project start date are not supported. When saving an existing project, Operately asks the user to change or remove any such dates before creating the template.
- When saving an existing project, Operately derives offsets from its current start date.
- Creating a project materializes each rule into a normal Operately contextual date using the selected start date.
- Offsets use calendar days. Weekend and holiday adjustment is out of scope.
- Due-relative task reminders remain relative to the calculated task due date. Fixed-date reminders are not copied.
- Changing the new project's start date after creation does not automatically move generated deadlines. The template has no live link to the project.

Example: a template has tasks due 7 and 10 days after start. If the project starts on September 1, the generated due dates are September 8 and September 11.

## People, Assignments, and Access

A template is visible only to people with View Access to its Space. Every other template action, including using, creating, commenting on, editing, duplicating, archiving, restoring, and deleting a template, requires Edit Access. The standard Can Comment and Full Access permissions remain part of the template permission model for consistency, but template actions do not depend on them. The company-level template page does not expand access; it only aggregates templates the current user can already see through their Spaces.

**Include people and assignments** controls all person-specific project data:

- When off, the template does not retain the champion, reviewer, contributors, contributor responsibilities, contributor access levels, or task assignees.
- When on, the template retains all of the above.

When a project is created from the template:

- The template's champion and reviewer are authoritative. Template-based project creation does not ask for or accept separate champion and reviewer selections. A template without copied people creates a project with both roles unassigned.
- Active people who still belong to the company, including guests, are copied automatically. They are not merely suggested and the user does not have to confirm each person.
- The champion and reviewer keep their roles and receive Full Access, matching Operately's existing project behavior.
- Other contributors keep their responsibility and direct project access level.
- Task assignees keep their assignments. Operately's existing task-assignment behavior ensures an assignee is also a project contributor.
- The new project's Company-members and Space-members baseline access levels still come from the normal project creation flow. Operately combines those baselines with contributor access using the most permissive applicable level.
- Copied contributors and task assignees follow Operately's normal automatic subscription behavior.

If a referenced person has been removed or suspended since the template was saved, Operately skips that person and leaves their role or tasks unassigned. This does not block project creation or require a replacement step. Before creation, show one plain-language summary, for example: **1 person in this template is no longer active. Their project role and 3 tasks will be left unassigned.** A template editor can replace or remove the unavailable person, or assign the generated project's open roles and tasks later through the normal project controls.

The template editor initially shows copied roles, responsibilities, access levels, and task assignees as read-only context. PR 5.2 adds template-owned contributor and assignment editing without granting those people access to the template itself.

## Acceptance Criteria

- A user can save an existing project as a template without copying historical activity.
- Saving an existing project offers **Include discussions**, on by default.
- Saving an existing project offers **Include comments**, off by default.
- When selected, comments on included resources are copied without reactions, subscriptions, or notifications.
- When **Include people and assignments** is off, no person-specific roles, contributors, or task assignments are retained.
- When it is on, active people retain their roles, responsibilities, contributor access levels, and task assignments without per-person confirmation.
- Removed or suspended people are skipped with one plain-language summary and do not block project creation.
- Copied task assignees receive the same contributor access that normal Operately task assignment provides.
- A template editor can add, update, replace, and remove template contributors and can assign or unassign template tasks without granting those people access to the template itself.
- A user can create and edit a blank template.
- Every template belongs to exactly one Space.
- The company-level page aggregates templates only from Spaces the current user can access.
- A Space page shows only templates belonging to that Space.
- A template never appears to people without access to its Space.
- The New Project flow shows only templates for the selected Space.
- Creating or editing a template never inserts a row into `projects`, `project_milestones`, or `tasks`.
- Ordinary project, milestone, and task getters and mutations cannot resolve template records by construction; they do not depend on callers remembering a template guard.
- A user can create a project from a template from either the library or New Project flow.
- Creating a project from a template requires a start date.
- The generated project preserves milestone/task structure, ordering, workflow, descriptions, and selected reusable content, including discussions when selected.
- A task set to 7 days after project start receives the correct due date for any selected start date.
- Dates on and after the start date are supported; dates before it are rejected.
- The new project's baseline access levels are selected during creation rather than inherited from the source project; direct contributor access is copied only when people and assignments are included.
- Template edits, archival, and deletion do not affect existing projects.

## Implementation Phases

Implement templates as a separate persistence aggregate with its own domain boundary. A template resembles a project in the editor and can share pure domain helpers and TurboUI components, but it must not reuse project, milestone, task, discussion, comment, or resource-hub rows. This makes ordinary project behavior safe by default: existing and future project endpoints cannot accidentally operate on templates because template IDs do not exist in project runtime tables.

Store relative scheduling separately from normal contextual dates. The project template stores a duration in calendar days; template milestones and tasks store non-negative due-date offsets. Materializing a project converts those offsets into ordinary contextual dates and does not copy the offsets into the generated project.

All graph copies must run through one template copy/materialization service with explicit old-ID to new-ID maps. Do not compose the feature from user-facing create/copy mutations: those mutations create activities, subscriptions, notifications, and other history that this feature intentionally excludes.

Keep the complete feature behind a `project_templates` experimental feature until Phase 6. Earlier phases may be merged and exercised through focused tests and development-only entry points, but must not expose a partially supported copy matrix to companies.

### Phase 1 — Template persistence, isolation, and authorization

This phase establishes the invariant that template data is physically separate from normal project behavior.

#### PR 1.1 — `feat: Add the project template data model`

- [x] Add `project_templates`, `project_template_milestones`, and `project_template_tasks` tables with foreign keys that never point through `projects`.
- [x] Copy only reusable fields into the template schemas: root description, duration, task statuses and ordering; milestone content, ordering and due offset; and task content, workflow placement, ordering, priority, size, due offset, and due-relative reminders.
- [x] Add template archival and soft-deletion state, optional source-project provenance, and indexed lookup by company, Space, and archival/deletion state.
- [x] Add non-negative database and changeset constraints for project duration, milestone due offset, and task due offset.
- [x] Add nullable `projects.source_template_id` provenance for generated projects. Deleting a template must nullify or otherwise preserve generated projects without coupling their lifecycle.
- [x] Do not add a project kind, template query scopes to `Operately.Projects.Project`, or template branches to ordinary project getters and mutations.
- [x] Preserve template-owned rows and generated-project source-template provenance through company export/import.
- [x] Cover defaults, constraints, cascading template cleanup, provenance, and physical isolation from ordinary project, milestone, and task queries with focused schema tests.

`deleted_at` continues to represent deletion. Use a separate archival field for the reversible archive/restore lifecycle so archived and deleted templates remain distinguishable.

#### PR 1.2 — `feat: Add permission-aware project template APIs`

- [x] Add a `ProjectTemplates` domain boundary and read APIs for one template, templates in one Space, and the company-level aggregate.
- [x] Authorize visibility from the current Space access, not from copied contributors or source-project access.
- [x] Require Edit Access to the Space for creating, editing, duplicating, archiving, restoring, and deleting templates.
- [x] Require Edit Access to the Space when a user instantiates a template; being able to view a template is not enough.
- [x] Return the card metadata and milestone/task counts needed by both library surfaces without loading the complete project graph.
- [x] Support search, Space filtering, and archived filtering in the backend query while applying access filtering before selecting template metadata.
- [x] Add internal/external API contract tests, regenerate clients, and verify that an inaccessible Space never leaks a template name, description, count, or creator.

### Phase 2 — Blank templates and the template editor

At the end of this phase, a Space administrator can create and edit a blank core template, and accessible templates can be found in either library. The feature remains flagged because project materialization and optional content are not complete.

#### PR 2.1 — `feat: Create and edit blank project templates`

- [x] Add a blank-template creation operation that creates the template root and default task workflow without creating a project, project access context, runtime resource hub, activity, check-in schedule, subscription list, or search entry.
- [x] Add template-safe mutations for name, description, duration, custom task statuses, milestones, tasks, ordering, Kanban state, and relative task/milestone dates.
- [x] Reuse pure domain helpers from projects where they have no persistence or project-runtime side effects; template mutations must write only template-owned tables.
- [x] Reject negative offsets. Project-only actions such as check-ins, pause/resume, close, retrospective, goal connection, and project access-baseline editing must not exist in the template API.
- [x] Keep all template edits authorized by Edit Access to the owning Space.
- [x] Add operation tests proving template edits do not create activities, notifications, subscriptions, check-ins, or search entries.

#### PR 2.2 — `feat: Add a project template page to TurboUI`

- [x] Add a standalone `TemplateProjectPage` with template-specific presentation types and callbacks. Reuse `ProjectPageLayout` and lower-level TurboUI controls without converting template records into project API records or adding template branches to `ProjectPage`.
- [x] Give the page **Overview** and **Tasks** tabs. The overview edits the template name, description, duration, and milestone list and displays the workflow; the task view groups root and milestone tasks, provides template-specific create and edit forms, and exposes workflow settings when a status-change callback is available.
- [x] Extend the shared project-page layout with a template presentation mode for the **Space > Project Templates** breadcrumb and **Template** pill. Omit project status, task completion, privacy/access baselines, contextual dates, health actions, check-ins, discussions, Docs & Files, activity, retrospective, subscriptions, parent goals, and other runtime-only UI.
- [x] Add a reusable `RelativeDayField` for template duration and milestone/task due offsets. Support empty, zero, singular, plural, read-only, inline, and form-field states; reject negative, fractional, and malformed values with **Enter zero or a positive number of days.**
- [x] Treat View and Comment Access as read-only, and enable template editing for Edit and Full Access.
- [x] Keep the existing `ProjectPage` and its contextual-date behavior unchanged.
- [x] Add focused TurboUI tests for template navigation, omitted runtime UI, permissions, create/edit interactions, relative offsets, and invalid relative-day input, plus Storybook stories for populated, task-focused, empty, zero-offset, read-only, and mobile states.

#### PR 2.3 — `feat: Add project template library pages`

- [x] Add the company-level **Project Templates** route and a Space-level **Project Templates** route.
- [x] Build the app bridge for the template page, including the **Space > Project Templates** breadcrumb and template-mode handlers.
- [x] Render searchable cards with description, Space, creator, last update, milestone count, and task count.
- [x] Group the company view by Space and add a Space filter; omit inaccessible Spaces and templates rather than rendering disabled results.
- [x] Add **New template** entry points. Preselect the current Space on the Space page and require a Space choice on the company page.
- [x] Add a configurable **Templates** Space tool, enabled by default and hidden behind the `project_templates` feature gate. The card links to the Space library and shows either a reusable-project zero state or the Space's active, accessible templates.
- [x] Initially wire create, open, and edit only; Phase 6 adds the complete duplicate/archive/delete card lifecycle after the full graph copier exists.
- [x] Add page/component tests and company feature coverage for both library scopes, filtering, empty states, access changes, and navigation.

### Phase 3 — Core project materialization

This phase delivers the first end-to-end vertical slice: a blank core template can produce an independent, ready-to-edit project with the correct schedule.

#### PR 3.1 — `feat: Materialize core projects from templates`

- [x] Add one transactional materialization service for the project root, description, duration, custom task statuses, milestone/task structure, ordering, priority, size, and due-relative task reminders.
- [x] Read only from template-owned tables and create fresh runtime project, milestone, and task rows with explicit old-ID to new-ID maps.
- [x] Require a start date and materialize project end, milestone due, and task due dates with calendar-day `Date.add/2` semantics.
- [x] Create normal project access context and baseline bindings from the creation input; never copy a parent goal or Company-members/Space-members baseline from the template.
- [x] Reset health, completion, closed/reopened state, check-ins, and retrospective. Rebuild the generated Kanban state so every task starts in the first open template status while preserving the copied status definitions and relative board ordering.
- [x] Persist source-template provenance for measurement only. No later template edit, archive, or deletion may update the generated project.
- [x] Create only the normal new-project activity and runtime subscriptions required by ordinary project creation; do not replay template edit history.
- [x] Cover zero-day offsets, leap years, month/year boundaries, missing start dates, ordering, reset fields, access baselines, and rollback on any invalid child.

#### PR 3.2 — `feat: Create projects from project templates`

- [x] Extend New Project so Space is selected before Template and the Template selector lists only active templates from that Space.
- [x] Add a dedicated `project_templates/create_project` mutation that requires a project start date, while keeping `projects/create` and the existing non-template creation flow unchanged.
- [x] Keep name, parent goal, and baseline access selection in the normal creation flow and submit them with the selected template and start date.
- [x] Add **Create project from template** to template cards and carry the template and owning Space into New Project.
- [x] Clear an incompatible template selection if the user changes Space.
- [x] Navigate directly to the independent generated project after the transaction commits.
- [x] Add form, route, API, and feature coverage for Space scoping, archived templates, start-date validation, direct card entry, creation failure, and successful navigation.

### Phase 4 — Saving an existing project as a core template

This phase adds the reverse core transformation and centralizes schedule validation. The `project_templates/create_from_project` mutation is part of the shared internal and external API immediately, while the user-facing **Save as template** action remains flagged until the optional copy families in Phase 5 honor every switch in the final dialog.

#### PR 4.1 — `feat: Build core templates from existing projects`

- [x] Add a transactional internal project-to-template operation for description, project duration, workflow, milestones, tasks, ordering, priority, size, and due-relative reminders, backed by copy primitives shared with template materialization.
- [x] Write the copied graph only to template-owned tables; saving a project as a template must not create a second project row or reuse runtime milestone/task rows.
- [x] Require a concrete source-project start date and derive each supported offset from that date.
- [x] Validate the complete source graph before writing. Return one structured result for a missing start date and every project end or milestone due date earlier than the start date. Clear task due dates (and due-relative reminders) that fall before the start instead of treating them as schedule issues.
- [x] Exclude fixed-date reminders and reset health, completion, closed/reopened state, check-ins, retrospective, goal, access baselines, activities, notifications, and subscriptions.
- [x] Create the template in the source project's Space with source-project provenance; defer feature gating, read-only handling, and Space Edit authorization to the endpoint/action boundary.
- [x] Cover source dates at offset zero, mixed contextual-date precision, invalid pre-start project/milestone dates, cleared pre-start task due dates, nil dates, state resets, malformed graphs, and all-or-nothing rollback.

#### PR 4.2 — `feat: Add save project as template validation UI`

- [x] Build the name, description, and include-option dialog and connect it to the source validation response.
- [x] Keep the project actions entry point and submission disabled until Phase 5 supports every include option end to end; do not expose a dialog whose switches are only partially honored.
- [x] Show pre-start date validation in plain language and link or identify every offending project end and milestone due date so the user can fix or remove it.
- [x] Open the created template after a successful save and leave the source project unchanged.
- [x] Add component and feature coverage for permission gating, defaults, validation, cancellation, retry, and success navigation.
- [x] Register `project_templates/create_from_project` in the shared API namespace, publish it in the external API and CLI catalogs, and cover its token authorization contract with an external mutation smoke test.

### Phase 5 — Selected people, discussions, comments, and Docs & Files

Each PR in this phase extends the same copy service in both directions: project to template, template to project, and template to duplicated template. Every copied family must use explicit ID maps and must not fall back to copying historical activities or subscription state.

#### PR 5.1 — `feat: Copy project template people and assignments`

- [x] Add template-specific people and assignment records. When **Include people and assignments** is selected, copy champion, reviewer, contributors, responsibilities, contributor access levels, and task assignees into those records; otherwise copy none of them.
- [x] Do not grant copied people direct access to the template itself. Template visibility and management continue to come only from the owning Space.
- [x] When materializing, keep active company people and guests, skip removed or suspended people, and calculate one summary with affected project roles and task counts.
- [x] Recreate champion/reviewer Full Access, contributor direct access, task assignments, assignee Edit Access, and automatic subscriptions through shared access/assignment helpers. Treat stored template roles as authoritative and omit Champion and Reviewer from template-based project creation.
- [x] Preserve author attribution in descriptions and other copied content independently of this option; content authors are not project contributors unless they are also copied by this option. Display copied people and task assignees read-only in the template editor.
- [x] Add backend and UI coverage for on/off behavior, guests, inactive people, duplicate roles, assignment-implied contribution, most-permissive access, and the pre-creation warning.

#### PR 5.2 — `feat: Edit project template people and assignments`

- [x] Add template-person create, update, and delete mutations for champion, reviewer, and contributor roles, responsibilities, and generated-project access levels. Require the owning Space's Edit Access and reject archived templates and company read-only mode.
- [x] Add one full-list template-task assignee mutation, matching the runtime task API. Resolve and authorize the owning template first, scope every task lookup to it, and reject inaccessible, cross-template, inactive, or unavailable people without disclosing them.
- [x] Allow at most one champion and one reviewer. Changing a person to either role demotes the previous holder to contributor while preserving their responsibility, access, and assignments. Champion and reviewer access is always Full Access; contributor access remains configurable.
- [x] Match normal project assignment behavior: assigning a person who is not already represented adds them as a contributor with Edit Access, while removing their last assignment does not automatically remove their contributor record.
- [x] Delete a template person's task assignments atomically, allow unavailable copied people to be removed, and refresh the inactive-people summary after every mutation.
- [x] Allow unavailable contributors to be replaced from the template editor while preserving their responsibility, access, and task assignments.
- [x] Make the template People section editable for Edit and Full Access. Keep View and Comment Access read-only and create no template access bindings, subscriptions, activities, or notifications.
- [x] Add assignee selection to template task creation and task rows for Edit and Full Access, keep View and Comment Access read-only, and roll back optimistic row updates when persistence fails.
- [x] Create each task and its initial assignees in one mutation and transaction so assignment failure rolls back the task, contributor records, assignments, and ordering state together.
- [x] Ensure materialization uses the latest edited roles, responsibilities, access levels, and assignments, with template champion and reviewer remaining authoritative.
- [x] Register the task-assignee mutation in the shared and external API catalogs, regenerate clients, and add endpoint, permission-table, app-boundary filtering, and TurboUI coverage.
- [x] Register the template-person mutations in the shared and external API catalogs, regenerate clients, and add external mutation smoke coverage.
- [x] Complete contributor mutation coverage for authentication, feature gating, archived and read-only templates, company isolation, unavailable-person replacement, rollback, app-bridge payloads, and materialization from edited records.

#### PR 5.3 — `feat: Copy project template discussions`

- [x] Add template-specific discussion records. When **Include discussions** is selected, copy project discussion title, body, author attribution, and stable ordering; otherwise omit all project discussions.
- [x] Template discussions have no runtime subscription list and do not emit discussion-submitted activities or notifications. Materialized project discussions receive fresh runtime subscription lists.
- [x] Authorize template discussions from their owning template and Space, independently of project discussion authorization and historical creation activities.
- [x] Add discussion create/edit support to template mode with template permissions and no feed/notification side effects.
- [x] Add copy-service, API, template-page, and generated-project coverage for included/excluded discussions and author attribution.

#### PR 5.4 — `feat: Copy project template Docs and Files`

- [x] Add template-specific resource-tree records. When **Include Docs & Files** is selected, copy the published resource-hub content into those records with fresh node, folder, document, file, and link IDs while preserving hierarchy and ordering.
- [x] Copy published native documents as independent documents with a new version 1; do not copy draft/deleted documents or historical document versions.
- [x] Copy links and file metadata independently. Reuse immutable blob payloads safely rather than duplicating bytes, while ensuring later metadata/content edits affect only the copy.
- [x] Do not copy reactions or subscribers and do not emit resource-copy activities or notifications.
- [x] Add read-only Docs & Files browsing to template mode, including folders and template-specific document, file, and link pages without runtime document controls.
- [x] Keep draft content excluded from project-to-template copying and template-to-project materialization.
- [x] Enable top-level template folder creation through the shared Docs & Files menu and folder modal.
- [x] Enable top-level template file uploads through the shared file picker, drag-and-drop area, metadata form, and upload-progress flow.
- [x] Wire the remaining template resource mutations into the editor: nested-folder creation; create and update documents and links; update files; delete and move resources.
- [x] Replace the remaining dummy template Add actions with the corresponding document and link flows once those editor capabilities are ready.
- [x] Cover nested folders, mixed resource types, rich-text blobs, published/draft/deleted state, document baselines, and source independence.

#### PR 5.5 — `feat: Copy comments in project templates`

- [x] Add template-specific comment records. When **Include comments** is selected, copy comments only after all included template parent-resource maps are available.
- [x] Support comments on included discussions, milestones, tasks, documents, files, and links. Discussion comments require both **Include discussions** and **Include comments**; resource-hub comments require both **Include Docs & Files** and **Include comments**.
- [x] For milestone comments, copy only actual comments and rebuild the milestone-comment association; do not turn complete/reopen action records into comments.
- [x] Preserve comment content, author attribution, and ordering with fresh IDs. Do not copy reactions, notifications, mention deliveries, or subscriptions.
- [x] Silently skip comments whose parent is excluded and assert that no copied comment retains a source-resource ID.
- [ ] Wire all four include options to the save dialog with the defaults in this spec, then add **Save as template** to the project actions menu only for users with Edit Access to the project's Space.
- [ ] Cover the complete option matrix, permission gating, cancellation, validation, retry, success navigation, and source-project independence in backend and end-to-end tests.

#### PR 5.6 — `feat: Add project template feature tests through comments and Docs & Files`

Add Wallaby feature coverage for the product surface shipped through PR 5.5. Do not cover duplicate, archive, restore, or delete; those belong to PR 6.1.

- [ ] Cover the company-level and Space-level template libraries: search, Space filtering, empty states, access changes, New template, and navigation into the editor.
- [ ] Cover blank-template creation and editor flows for name, description, duration, milestones, tasks, workflow, people and assignments, discussions, and Docs & Files, including View/Comment read-only versus Edit/Full Access.
- [ ] Cover creating a project from a template from both the library card and New Project, including Space scoping, start-date validation, archived-template exclusion, and navigation to the generated project.
- [ ] Cover **Save as template** from a project: permission gating, include-option defaults, schedule validation, cancellation, retry, and success navigation into the created template.
- [ ] Cover the include-option matrix for people, discussions, comments, and Docs & Files, and assert that generated projects and saved templates stay independent of later source edits.
- [ ] Keep the feature behind `project_templates` and assert that gated companies never see library, editor, or save-as-template entry points.

### Phase 6 — Template lifecycle, rollout, and hardening

#### PR 6.1 — `feat: Add project template lifecycle actions`

- [ ] Implement template duplication through the complete copy service, preserving relative offsets and included reusable content while generating an independent template graph.
- [ ] When duplicating a template, reuse the same Docs & Files copy rules: copy only published folders/documents/files/links; skip drafts, deleted items, and document version history.
- [ ] Add archive, restore, and delete operations with Space Edit Access checks and clear confirmation UI.
- [ ] Hide archived templates from New Project and default library results; allow archived filtering and restoration in both libraries.
- [ ] Ensure archive or deletion never changes generated projects and that duplicate/archive/delete operations do not create project activities or notifications.
- [ ] Finish card actions and invalidate company, Space, template-page, and New Project caches consistently.
- [ ] Add lifecycle tests for permissions, deep-copy independence, archived visibility, restoration, deletion, stale open pages, and generated-project independence.
- [ ] Add feature tests for duplicate, archive, restore, and delete on both library surfaces, including confirmation UI, archived filtering, permission gating, and generated-project independence.

#### PR 6.2 — `feat: Roll out project templates`

- [ ] Run the full backend, API, TurboUI, TypeScript, and feature-test suites for blank templates, save-from-project, duplicate, and project materialization.
- [ ] Add telemetry for template creation source, successful/failed materialization, selected copy options, copied/skipped people, and generated-project provenance without recording template content.
- [ ] Verify company export/import preserves active and archived templates, relative offsets, optional content, blob references, and generated-project independence.
- [ ] Verify no template appears in Work Maps, goals, assignments, search, feeds, check-in jobs, project reports, or ordinary project APIs.
- [ ] Verify template creation and editing do not write project runtime tables and that ordinary project, milestone, task, discussion, comment, and resource APIs cannot resolve template-owned IDs.
- [ ] Exercise large templates with representative milestone, task, comment, and file counts; record transaction latency and establish practical limits or operator guidance if needed.
- [ ] Enable `project_templates` for controlled companies, monitor copy failures and unexpected-content reports, then remove the experimental gate after the acceptance criteria pass.
