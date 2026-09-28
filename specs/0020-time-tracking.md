# Time Tracking

## Purpose

Help people understand where project effort goes, improve planning, and learn from completed work. Make recording time quick and optional, with a foundation for future billing workflows. Hours recorded are not a measure of individual productivity or project completion.

## Original Issue

[Issue #3836](https://github.com/operately/operately/issues/3836) requests:

- Timers on task, milestone, and project screens, plus a persistent global timer widget.
- Manual entries against tasks, projects, or goals, with a date defaulting to today, start/end times or duration, and optional notes.
- Logs on profiles and work-item pages, with entry viewing, editing, and deletion.
- Weekly/monthly personal reports grouped by project, project reports across tasks and people, and CSV export.
- Support for billing, resource management, and performance analysis, complementing [guest accounts (#3835)](https://github.com/operately/operately/issues/3835).

This proposal narrows initial entry targets and viewing surfaces to tasks and projects. Dedicated reports, profile time logs, CSV export, billing workflows, and direct milestone/goal logging are deferred. Milestones and goals provide aggregated views instead.

## Scope and Attribution

| Destination | Behavior |
| --- | --- |
| Project task | Record time against the task; include it in its project's total |
| Project | Record general work such as meetings, planning, and research without creating a task |
| Space task | Record time in the existing task slide-in on the Space kanban page (no standalone task page) |
| Milestone | Aggregate time attributed to its tasks; no direct entries initially |
| Goal | Later aggregate contributing project time; no direct entries initially |

Each entry counts once in any aggregate. For example, 12 hours on tasks plus 3 hours of general project work produces a 15-hour project total. The project Overview labels general project work separately.

Tracking is off by default and enabled by an authorized project manager. Spaces have an equivalent setting for their standalone tasks. Disabled scopes hide recording controls; existing records remain available, and running timers can still be stopped and corrected. Templates never contain recorded time or running timers.

## Recording Experience

- **Timer:** Start from a task or project. A compact persistent bar shows the current work, elapsed time, and Stop. Its menu contains Switch and Discard; the work title links back to it. Keep controls accessible on mobile.
- **Manual entry:** Require a destination, date, and positive duration. Accept inputs such as `45m` and `1h 30m`. Optionally enter start/end timestamps instead; notes are optional. Never require invented clock times for duration-only entries.
- **One active timer:** Enforce one running timer per person across devices. Switching atomically saves the previous session and starts the next. Repeated requests must not create duplicate sessions or entries.
- **Persistence:** Store timer state on the server. Navigation, refresh, browser closure, and temporary disconnection must not lose the session. Reconcile state after reconnecting.
- **Corrections:** Stop saves the elapsed time directly; users can edit/delete the saved entry afterward. There is no running-time review form. Show a brief hint for unusually long sessions without blocking Stop or silently truncating them. Completing a task with an active timer offers to stop it.
- **Dates:** Store clock timestamps in UTC and retain the entry's reporting timezone. Attribute timed sessions across local calendar days; duration-only entries stay on the chosen date. Handle midnight and daylight-saving changes consistently. Display dates and durations using user preferences.

## Surfaces

| Surface | Contents |
| --- | --- |
| Task Time section | Personal recorded time, permitted team total, entry list, timer, and manual entry action |
| Project Overview Time section | All-time authorized project total, Log time for general project work, and the latest three entries. Show task/general-work label, person, date, duration, and an actions menu; expand older entries on demand. No separate Time tab |

The project section has no period controls, date/person filters, grouping, CSV export, or large summary card. Task entries link to their tasks. Edit/delete remain permission-controlled; totals always include the complete authorized history. Enablement lives in a **Time tracking settings** dialog opened from project Actions, available only to authorized managers. The app must supply complete project history (or introduce explicit server totals and pagination before limiting results).

Running timers are excluded from saved totals. Empty histories indicate that no time was recorded, not that no work occurred.

## Permissions and History

- Separate permissions for recording/managing one's own time, viewing team entries, and managing team entries. Project membership alone must not expose detailed timesheets. Final mapping to existing access levels must be settled before implementation.
- Users record their own work; authorized managers review team time and may correct entries only with an explicit management permission. Record the actor and before/after values for edits, deletions, and reclassification.
- Contractors can receive permission to record their own time. Guests cannot inspect other people's entries by default. Client access to approved totals belongs to the later billing phase.
- Apply authorization to totals, entry lists, APIs, and notes. Aggregation must not leak restricted work. After access revocation, users can stop/discard an existing timer without reopening the resource; further entry access follows current permissions.
- Preserve project/Space and milestone attribution as recorded when tasks move. Reclassifying historical time is an explicit, audited action requiring access to both destinations. A running session is finalized at a move boundary; subsequent work uses the new destination.
- Closing or deleting a work item must not cascade-delete historical time. Preserve enough attribution to explain authorized reports without exposing inaccessible current task details. Allow permitted backdated corrections after completion; closed/deleted work cannot start new timers.
- Keep routine time-entry changes in an audit history without producing notifications or main-feed items for every timer operation.

## Implementation Outline

- Introduce a dedicated time-tracking context with time-entry records as the source of truth. Do not store editable cumulative totals on tasks or projects.
- Each entry stores company, person, reporting date/timezone, duration in integer seconds, optional notes, source (`manual` or `timer`), optional start/end timestamps, and creation/update/deletion metadata.
- Store a project or Space attribution, optional task, and optional milestone attribution. Validate that the task belongs to the chosen scope when recording or reclassifying. Direct entries require a project; standalone Space entries require a task.
- Persist active timer sessions separately, with start time and destination. Use a database uniqueness constraint for one active session per person and transactions for start/stop/switch. Split completed sessions into daily entries when needed.
- Validate company boundaries, permissions, positive durations, and timestamp ordering on the server. Warn about overlapping timestamped entries; duration-only logs cannot reliably be checked for overlap. Reject stale edits rather than silently overwriting newer changes.
- Calculate authorized aggregates from entries; index company/person/date and project/Space/date access paths. Preserve historical references or snapshots when source records are deleted.
- Provide shared API operations for entry CRUD, active timer retrieval/start/stop/switch, and authorized task/project history. Keep web, external API, MCP wrappers, and generated CLI contracts aligned; document any intentionally unsupported surface.
- Build presentation in TurboUI using existing controls and page patterns. App bridges use generated TanStack Query helpers, refresh affected histories and totals after mutations, and synchronize timer changes across sessions. Reuse shared locale/timezone formatting.

## Delivery

1. **Core release:** Enablement settings, task/project/Space-task recording, reliable timer, manual corrections, task logs, compact project Overview history, permissions, and audit history.
2. **Planning and learning:** Dedicated project reports with date/person filters, task/milestone grouping and CSV export; optional project hour budgets, goal rollups, allocation trends, check-in summaries, and retrospective comparisons. A check-in could show “18 hours recorded this week; 62 of 100 budgeted hours used.” Keep hour-budget consumption separate from project progress.
3. **Billing, if validated:** Billable classification, rates, approvals, locked periods, client-visible summaries, and billing integrations. Confirm billing demand before deciding whether any of these must move into the first release.

Direct milestone/goal logging, automatic productivity scores, employee rankings, attendance monitoring, and automatic completion estimates from hours are outside the initial scope. Before implementation, confirm the permission mapping, timer ownership across company memberships, and the long-session warning threshold.

## Acceptance Criteria

- Timer and manual workflows work for project tasks, general project work, and Space tasks on desktop and mobile.
- Refreshing, reconnecting, simultaneous devices, retries, and rapid switching cannot lose time or create multiple active sessions/duplicate entries.
- Task and project totals reconcile without double counting; running and deleted entries are handled consistently.
- Cross-midnight sessions, daylight-saving transitions, duration-only logs, corrections, and overlaps follow the stated rules.
- Moves, completion, deletion, disabled tracking, and access revocation preserve history and enforce current permissions.
- Owners, managers, guests, and unauthorized users see only permitted entries, totals, and notes. Audit records identify corrections without notification noise.
