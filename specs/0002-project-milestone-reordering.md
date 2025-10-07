## Project Milestone Reordering Specification

### Feature Overview

- Enable drag-and-drop reordering of milestones on the Project page timeline (`turboui/src/ProjectPage/Overview.tsx`).
- Persist manual ordering per project so the timeline reflects the chosen order across sessions and clients.
- Mirror the existing drag-and-drop tasks experience (see `turboui/src/MilestonePage/components/TasksSection.tsx`), but simplified because milestones never move across projects.
- Preserve optimistic UI updates: the timeline should immediately reflect the new order, revert on failure, and stay consistent with server responses.
- Continue to respect milestone status groupings (Upcoming vs Completed) while respecting the saved manual order within each group.

### Backend Requirements

- **Persist ordering on projects**
  - Add a `milestones_ordering_state` column to `projects` (array of strings, default `[]`).
  - Extend `Operately.Projects.Project` to expose `field :milestones_ordering_state, {:array, :string}` with a sane default (introduce a `Operately.Projects.OrderingState` helper mirroring `Operately.Tasks.OrderingState` for initialization and list manipulation).
  - Ensure project creation & milestone creation flows append new milestones to the ordering state. Deleting a milestone should remove its short ID.
  - Update the existing milestone create/delete mutations (`OperatelyWeb.Api.Projects.CreateMilestone` and `OperatelyWeb.Api.ProjectMilestones.Delete`) to keep the ordering state in sync when records are added or removed.
  - Update any relevant context helpers (`Operately.Projects` functions) so reloading projects always surfaces the latest ordering state.

- **Serialize ordering**
  - Update `app/lib/operately_web/api/serializers/project.ex` to include `milestones_ordering_state` (short IDs via `OperatelyWeb.Paths.milestone_id/1`) in the `:full` payload only; the `:essential` payload remains unchanged.
  - Confirm milestone serializer still exposes `tasks_ordering_state` unchanged.

- **Expose ordering via schemas/types**
  - Extend `app/lib/operately_web/api/types.ex` to include `milestonesOrderingState` on the `:project` object (parallel to `milestone.tasksOrderingState`).
  - Define a new input type for milestone ordering updates (e.g., `:edit_project_milestone_ordering_input` with `project_id` + ordered list of `:string` IDs) that will back the new mutation.
  - Run `make gen` after changes to regenerate TypeScript types when implementing.

- **Mutation for reordering**
  - Add `update_ordering` (final name TBD) to `OperatelyWeb.Api.ProjectMilestones`:
    - Inputs: `project_id`, `ordering_state` (array of short milestone IDs representing the new order).
    - Behavior: validate the requester has `:can_edit_timeline`, ensure submitted IDs belong to the project, persist order into the project record, and return the updated project serialized at `:full` level (provides milestones and `milestones_ordering_state` together).
    - No cross-project movement: reject IDs from other projects; ignore/append missing IDs by supplementing with remaining milestones on save.
  - Register the endpoint in `app/lib/operately_web/api.ex` alongside other `project_milestones` routes.

- **Tests**
  - Extend `app/test/operately_web/api/project_milestones_test.exs`:
    - Happy path reorders milestones and returns the new ordering.
    - Authorization checks (not logged in, lacks edit timeline permission).
    - Validation failures (unknown milestone IDs, non-existent project).
    - Deleting a milestone removes it from ordering state automatically.
  - Use existing tests in `project_tasks_test.exs` (ordering-related cases) as references for structure and helpers.

### Frontend Requirements

- **API client & models**
  - Regenerate client types via `make gen` once the backend changes land; the generated output will surface the new mutation and `milestonesOrderingState`.
  - Update `app/assets/js/models/projects/index.tsx` to consume the generated mutation and re-export the high-level helpers/typed calls used elsewhere (other modules should continue importing only from the models layer).
  - Update `parseMilestonesForTurboUi` to store both the manual ordering state and milestone metadata.
  - Ensure the Project page loader keeps ordering data fresh (invalidate cache on successful reorder).

- **State & optimistic updates**
  - Introduce a `useProjectMilestoneOrdering` helper (lives in `app/assets/js/models/projects` and exported for use in the Project page) that:
    - Computes a display list using `project.milestonesOrderingState`, falling back to insertion order for IDs not yet in the list.
    - Exposes a `reorderMilestones({ sourceId, destinationIndex })` function that:
      - Optimistically reorders local state.
      - Calls the new API mutation with the updated ordering array.
      - Rolls back on failure and shows a toast (reuse `showErrorToast`).
  - When new milestones are created, append their ID to the ordering state; when deleted, remove it (just like tasks use `MilestoneSync` to keep milestone ordering in sync).
  - Surface the ordered milestones array so both the Project timeline and the TaskBoard tab consume the same sequence (TaskBoard still hides completed milestones and remains read-only for ordering).

- **UI interactions**
  - Enable drag-and-drop in the timeline:
    - Wrap the full milestone list in `DragAndDropProvider`.
    - Add draggable affordances to `MilestoneItem` (drag handle, proper `data-drop-zone-id` attributes to match the existing DnD utilities).
  - Show all milestones in a single ordered list (no Upcoming/Completed split). Completed milestones retain their filled flag styling but remain in the user-defined sequence.
  - Provide visual feedback (hover cursor, subtle handle icon) similar to task rows to imply drag capability, with the drag handle rendered to the left of the timeline flag so it sits “outside” the main milestone content without shifting layout.
  - Pass the ordering state down to the TaskBoard so milestone cards render in the manual order even though that view still collapses completed milestones by default.

- **Error handling & sync**
  - After a successful reorder, update both local state and `PageCache` (or trigger a refresh) so other interactions (like TaskBoard) stay consistent.
  - Ensure `useMilestones` and TaskBoard components always read from the same ordered state to avoid flicker when switching tabs.
  - Accessibility improvements (keyboard reordering, alternative controls) are out of scope for this effort; document any gaps encountered during QA for follow-up.

### Implementation Steps

1. **Data Layer: Project Ordering Field**
   - Migration for `projects.milestones_ordering_state`.
   - `Operately.Projects.Project` schema + helper module (`Operately.Projects.OrderingState`) for manipulating the list.
   - Update project context to maintain ordering on milestone create/delete.
   - Add unit coverage for new helper functions if applicable.

2. **API Surface & Serialization**
   - Extend serializers (`project.ex`), API types (`types.ex`), and mutation inputs.
   - Implement and register `project_milestones.update_ordering` mutation plus tests in `project_milestones_test.exs`.
   - Confirm `make test.mix FILE=path/to/test/file.exs` passes for affected suites.

3. **Frontend Data Plumbing**
   - Regenerate client types (`make gen`) so the generated client exposes the new mutation and ordering fields.
   - Update `app/assets/js/models/projects/index.tsx` to parse `milestonesOrderingState`, expose the new mutation wrapper, and export the `useProjectMilestoneOrdering` helper.
   - Ensure related consumers use the helper for optimistic updates and rollbacks.

4. **Timeline Drag-and-Drop UI**
   - Update `turboui/src/ProjectPage/Overview.tsx` + `MilestoneItem.tsx` to support drag handles and reorder callbacks.
   - Connect UI to ordering helper, handle optimistic updates, and reset on errors.
   - Feed the ordered milestone list into the TaskBoard tab so its cards match the manual order while keeping their existing hidden/completed behavior.
   - Add smoke tests / Storybook notes if available; verify keyboard focus states.

5. **QA & Cleanup**
   - Manually verify reordering across browsers; ensure ordering persists after page reload.
   - Check interactions with TaskBoard (milestones list), task creation modal, and feature flag scenarios.
   - Document follow-up work if deeper keyboard accessibility or Storybook updates are required.

Each step should land in its own PR with passing targeted tests (`make test.mix`, `make test.npm` for frontend changes) and updated specs when needed.
