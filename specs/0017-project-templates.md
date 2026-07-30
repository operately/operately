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

Under **Include people and assignments**, show the helper text: **Copy the project team and task assignments. People keep their project roles and access; task assignees can edit the new project.**

Creating a template from the company-level page requires choosing a Space first. Creating it from a Space page preselects that Space. Saving an existing project creates the template in the same Space as the project.

The resulting template opens like a standard project. Its breadcrumb is **Space > Project Templates**, and a **Template** pill appears next to the title in place of the project status.

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
| Task workflow | Custom statuses and board ordering are copied; all tasks start in the first open status |
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

A template is visible only to people who can access its Space. Anyone who can create a project in the Space can use its templates. People with Full Access to a Space can create, edit, duplicate, archive, and delete its templates. The company-level template page does not expand access; it only aggregates templates the current user can already see through their Spaces.

**Include people and assignments** controls all person-specific project data:

- When off, the template does not retain the champion, reviewer, contributors, contributor responsibilities, contributor access levels, or task assignees.
- When on, the template retains all of the above.

When a project is created from the template:

- Active people who still belong to the company, including guests, are copied automatically. They are not merely suggested and the user does not have to confirm each person.
- The champion and reviewer keep their roles and receive Full Access, matching Operately's existing project behavior.
- Other contributors keep their responsibility and direct project access level.
- Task assignees keep their assignments. Operately's existing task-assignment behavior ensures an assignee is also a project contributor with Edit Access when needed.
- The new project's Company-members and Space-members baseline access levels still come from the normal project creation flow. Operately combines those baselines with contributor access using the most permissive applicable level.
- Copied contributors and task assignees follow Operately's normal automatic subscription behavior.

If a referenced person has been removed or suspended since the template was saved, Operately skips that person and leaves their role or tasks unassigned. This does not block project creation or require a replacement step. Before creation, show one plain-language summary, for example: **1 person in this template is no longer active. Their project role and 3 tasks will be left unassigned.** The user can make replacements later using the normal project team and task controls.

## Acceptance Criteria

- A user can save an existing project as a template without copying historical activity.
- Saving an existing project offers **Include discussions**, on by default.
- Saving an existing project offers **Include comments**, off by default.
- When selected, comments on included resources are copied without reactions, subscriptions, or notifications.
- When **Include people and assignments** is off, no person-specific roles, contributors, or task assignments are retained.
- When it is on, active people retain their roles, responsibilities, contributor access levels, and task assignments without per-person confirmation.
- Removed or suspended people are skipped with one plain-language summary and do not block project creation.
- Copied task assignees receive the same contributor access that normal Operately task assignment provides.
- A user can create and edit a blank template.
- Every template belongs to exactly one Space.
- The company-level page aggregates templates only from Spaces the current user can access.
- A Space page shows only templates belonging to that Space.
- A template never appears to people without access to its Space.
- The New Project flow shows only templates for the selected Space.
- A user can create a project from a template from either the library or New Project flow.
- Creating a project from a template requires a start date.
- The generated project preserves milestone/task structure, ordering, workflow, descriptions, and selected reusable content, including discussions when selected.
- A task set to 7 days after project start receives the correct due date for any selected start date.
- Dates on and after the start date are supported; dates before it are rejected.
- The new project's baseline access levels are selected during creation rather than inherited from the source project; direct contributor access is copied only when people and assignments are included.
- Template edits, archival, and deletion do not affect existing projects.

## Success Measures

- Share of new projects created from templates.
- Number of companies with at least one template used more than once.
- Support reports related to incorrect relative dates or unexpected copied content.
