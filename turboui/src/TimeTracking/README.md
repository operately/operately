# Time tracking frontend

Open **Features → Time Tracking → Connected Demo** in Storybook. The preview shares entries and one timer across the ProjectPage Overview Time section, TaskPage, and space tasks in the SpaceKanbanPage slide-in. Changes reset on reload.

Stories cover empty/loading/error states, save failure and recovery, slow saves, manager/member/guest/read-only access, disabled tracking, forgotten timers, task completion, mobile, and locale-aware formatting. Interaction stories exercise entry CRUD, timer switching across pages, and retrying a failed save.

## Integration contract

- `ProjectTimeSection`: all-time authorized project total, three newest entries (older history expands), and manual entry defaulting to general project work. Supply complete project history; there are no project filters or CSV controls. Task entry names open their destination. Managers use the sidebar **Time tracking settings** action to enable/disable tracking; omit `onEnabledChange` to hide it.
- `TaskTimeSection`: task-specific controls, personal/team totals, entries, and a completion reminder for an active timer.
- `GlobalTimeTracker`: mount once in the application shell. The app supplies the current person's server timer. Its interval only updates the elapsed-time display. The compact bar shows Stop; Switch and Discard live in the action menu. Stop saves directly, including long sessions; corrections use the saved entry editor.
- `TimeEntryEditor`: manual duration or wall-clock entry, validation, overlap feedback, and recoverable save errors. `existingEntries` must belong to the entry owner. Duration-only corrections clear clock timestamps when date/duration changes; note-only edits preserve them. Historical destinations stay fixed during edits; reclassification needs a separate future workflow.
- `TimeTrackingControls`: reusable recording actions. `TimeDestination.closed` prevents starting timers while allowing backdated manual entries.
- Existing pages opt in through `ProjectPage.timeTracking` and `TaskPage.timeTracking`. Omitting these props preserves existing screens.

All mutations return `TimeActionResult`; a failed result keeps the current draft available. Callbacks that throw display a recoverable fallback error. The bridge must revalidate authorization and current state. Successful callbacks update data props and invalidate affected queries.

One atomic switch callback saves the previous session and starts the next. The backend will own locking, idempotency, timezone/day allocation, audit history, permissions, cross-device synchronization, and retention. The view-specific types are provisional until API types exist; do not modify generated API types for this frontend phase.

## Boundaries

Production components contain no API calls, app contexts, persistence, or mock records. Demo data, browser downloads, and simulated mutations live in `mockData.ts` and `stories/`. The demo is not an authorization or accounting implementation. Budgets, goal rollups, rates, approvals, and billing remain later phases of [the spec](../../../specs/0020-time-tracking.md).

Reused controls: `Forms.Form`, `FieldGroup`, `TextInput`, `DateInput`, `InputField`, `FormError`, `Submit`, `Dropdown`, `TimePicker`, `ViewToggle`, `SwitchToggle`, `Modal`, buttons, `ActionLink`, `Avatar`, callouts, and `FormattedTime`. No new raw interactive controls were needed. The mobile story uses an iframe to exercise actual viewport breakpoints; its wrapper does not ship in the product.

## Verification

Run TurboUI build/type checks, the `src/TimeTracking` Jest tests, and Storybook interactions. To target these stories on an already-running server:

```sh
TEST_MATCH='**/TimeTracking/index.stories.tsx' npm run test-storybook -- --url http://localhost:4103 --maxWorkers 2
```

Use the configured Storybook port for your environment. The repository test runner accepts `CHROMIUM_EXECUTABLE_PATH` when using an installed browser.

## Project overview design

The project has no separate Time tab. The section follows the Overview's existing headings and spacing, after Milestones and before Resources. Mobbin references: [Bonsai's embedded time section](https://mobbin.com/screens/06f6a1de-9b29-4d61-ad4c-f6c97292e078) and [Toggl's compact entry rows](https://mobbin.com/screens/7547baa8-2f86-4753-a94e-b14004392b2c).
