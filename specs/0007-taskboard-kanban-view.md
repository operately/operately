# TaskBoard Kanban View

## Overview

This spec defines a multi-step, mergeable plan to introduce a Kanban view for the TaskBoard, backed by Pragmatic Drag and Drop and persisted via `milestones.tasks_kanban_state`.

The Kanban view:
- Continues to list milestones with their tasks.
- Within each milestone, divides tasks into **columns by status** instead of a single linear list.
- Supports drag and drop for:
  - Reordering within a column (index changes).
  - Moving between columns within the same milestone (status + index changes).
  - Moving between milestones and columns (milestone + status + index changes).

The implementation is split into PR-sized steps that can land incrementally without breaking the app, provided they are merged in order.

## Current state

### Frontend: TaskBoard (TurboUI)

- File: `turboui/src/TaskBoard/components/index.tsx` (`TaskBoard`)
  - Lists all milestones and their tasks.
  - Uses a custom `DragAndDropProvider` (`turboui/src/utils/DragAndDrop`) for drag-and-drop.
  - Drag & drop currently allows:
    - Reordering tasks within a milestone.
    - Moving tasks between milestones.
  - The drag callback is handled via `handleTaskReorder`, which either delegates to `onTaskMilestoneChange` (when provided) or mutates internal state using `reorderTasks`.

- File: `turboui/src/TaskBoard/components/TaskItem.tsx`
  - Renders a single task row in the current list view.
  - Shows a `StatusSelector` inline (left of the task title) and allows changing the status through a callback `onTaskStatusChange`.
  - Uses the legacy `DragAndDrop` utilities via `useDraggable`.

### Frontend: Project milestone ordering hook

- File: `app/assets/js/models/projects/useProjectMilestoneOrdering.ts`
  - Handles ordering of *milestones themselves* via an `orderingState` (array of milestone ids).
  - Provides `reorderMilestones(sourceId, destinationIndex)` with optimistic UI and API update through `Api.project_milestones.updateOrdering`.
  - Uses a `normalizeMilestoneOrdering` utility to keep ordering consistent and to handle new/removed milestones.

### Backend: Milestone model

- File: `app/lib/operately/projects/milestone.ex`
  - Schema fields:
    - `field :tasks_kanban_state, :map, default: Operately.Tasks.KanbanState.initialize()`
    - `field :tasks_ordering_state, {:array, :string}, default: Operately.Tasks.OrderingState.initialize()`
  - `tasks_ordering_state` is used by the current manual ordering and `MilestoneSync` module.
  - `tasks_kanban_state` exists but is not yet wired end‑to‑end to the frontend for task boards.

### Backend: Kanban state helper

- File: `app/lib/operately/tasks/kanban_state.ex`
  - Default structure:

    ```elixir
    def initialize do
      %{
        "todo" => [],
        "in_progress" => [],
        "done" => []
      }
    end
    ```

  - Helpers:
    - `load/1` (ensures non-nil, non-empty map, otherwise returns default).
    - `add_todo/2` (adds a task to the `"todo"` column at index 0).
    - `add/4` (adds task id at a given index for a given status key).
    - `remove/3` (removes task id from a given status key list).

  - Tests: `app/test/operately/tasks/kanban_state_test.exs`.

### Backend: Task milestone/ordering mutation

- File: `app/lib/operately_web/api/project_tasks.ex` – module `UpdateMilestoneAndOrdering`.
  - Inputs:
    - `task_id`
    - `milestone_id` (nullable)
    - `milestones_ordering_state` (list of `%{ milestone_id, ordering_state }`).
  - Outputs:
    - `task`
    - `updated_milestones` (list of milestones with updated `tasks_ordering_state`).
  - Behavior:
    - Validates and optionally changes the task's milestone.
    - Uses `Operately.Tasks.MilestoneSync.sync_after_milestone_change/2` and `sync_manual_ordering/2` to keep `tasks_ordering_state` updated.

- Tests: `app/test/operately_web/api/project_tasks_test.exs` under `"update task milestone"`.

### Backend: MilestoneSync

- File: `app/lib/operately/tasks/milestone_sync.ex`
  - Manages synchronization between tasks and `milestone.tasks_ordering_state` for:
    - Task creation.
    - Status updates.
    - Deletion.
    - Moving tasks between milestones.
    - Manual ordering updates from the frontend.
  - Currently does **not** manage `tasks_kanban_state`.

### Backend: Milestone serializer

- File: `app/lib/operately_web/api/serializers/milestone.ex`
  - Serializes `tasks_kanban_state` into a GraphQL-ready map:

    ```elixir
    tasks_kanban_state: %{
      todo: encode_task_ids(milestone.tasks_kanban_state["todo"]),
      in_progress: encode_task_ids(milestone.tasks_kanban_state["in_progress"]),
      done: encode_task_ids(milestone.tasks_kanban_state["done"]),
    }
    ```

  - The current serializer does not yet include a `canceled` column.

### TurboUI: PragmaticDragAndDrop utilities

- Folder: `turboui/src/utils/PragmaticDragAndDrop/`
  - `index.tsx`: re-exports `useSortableList`, `useSortableItem`, `DropIndicator`, `DragHandle`, and types.
  - `useSortableList.tsx`:
    - Provides list-level logic using Atlassian `monitorForElements` and `extractClosestEdge` to compute a new index for a reordered item.
    - Callback type: `OnReorderFunction = (itemId: string, newIndex: number) => void | Promise<void>`.
  - `useSortableItem.tsx`:
    - Uses Atlassian `draggable` and `dropTargetForElements` with `closest-edge` hitbox.
    - Provides `ref`, `dragHandleRef`, `isDragging`, `closestEdge` for each sortable item.
  - `DragHandle.tsx` and `DropIndicator.tsx` provide consistent UI affordances.
  - This utility currently focuses on **single-list** reordering, not multi-column boards.


## Target state: Kanban board behavior

### Columns and statuses

- Tasks use string `status` values defined in `Operately.Tasks.Task`, currently:
  - `"todo"` (labelled **Pending** in the UI),
  - `"in_progress"` (In progress),
  - `"done"` (Completed),
  - `"canceled"` (Canceled).

- The Kanban board renders **one swimlane per milestone**, each containing **four columns**:
  - Pending – tasks with `status = "todo"`.
  - In progress – tasks with `status = "in_progress"`.
  - Completed – tasks with `status = "done"`.
  - Canceled – tasks with `status = "canceled"`.

- The inline status selector used in list rows is **not shown** in Kanban mode, because the column encodes the status.

### `tasks_kanban_state` structure

We need a clear, stable mapping between task statuses and `tasks_kanban_state` keys, without changing existing defaults.

- `Operately.Tasks.KanbanState.initialize/0` **remains unchanged** and continues to return:

  ```elixir
  %{
    "todo" => [],
    "in_progress" => [],
    "done" => []
  }
  ```

- We introduce `initialize/1` that accepts a list of status keys and builds a map with empty lists for each:

  ```elixir
  def initialize(statuses) when is_list(statuses) do
    Enum.into(statuses, %{}, fn status -> {status, []} end)
  end
  ```

  - New code that needs a full Kanban structure (including canceled) can use

    ```elixir
    KanbanState.initialize(["todo", "in_progress", "done", "canceled"])
    ```

  - Existing schema defaults (e.g. `Milestone` schema field `tasks_kanban_state`) continue to call `initialize/0` so we do **not** change database defaults.

- The **serialized GraphQL shape** exposed to the frontend is:

```elixir
%{
  pending: [...taskIds],
  in_progress: [...taskIds],
  done: [...taskIds],
  canceled: [...taskIds],
}
```

Each list contains **encoded task ids**, consistent with the rest of the API.

### Invariants

- For any milestone `M` and status key `S`:
  - Each task id appears **at most once** in `M.tasks_kanban_state[S]`.
  - If a task id is present in `M.tasks_kanban_state[S]`, then:
    - That task belongs to milestone `M`.
    - That task's `status` equals the status corresponding to `S`.

- Tasks can exist in the milestone **without** being present in `tasks_kanban_state` (e.g. legacy data or incomplete state). The frontend must:
  - Tolerate such cases.
  - Optionally surface them in a fallback order at the end of the appropriate column.

- Tasks without milestone ("No milestone" swimlane):
  - Are displayed in the Kanban UI but are **not represented** in any milestone's `tasks_kanban_state`.
  - Changing their **index only** (reordering within the same status column while `milestone_id` stays `nil` and `status` stays the same) is a **pure UI change** and is **not persisted**.
  - If their **status** or **milestone** changes (for example, dragging a no‑milestone task into a milestone, or moving it between status columns), those changes **must be persisted** by updating `task.status` (and `task.milestone_id` when applicable). When a real milestone is involved, that milestone's `tasks_kanban_state` must also be updated.


## DnD requirements

The Kanban board must support three classes of drop operations:

1. **Reorder within the same milestone + status column**
   - Only the index changes.
   - `task.status` and `task.milestone_id` remain the same.
   - `tasks_kanban_state` for that milestone is updated for a single column.

2. **Move between columns within the same milestone**
   - Source and destination **milestone** are the same.
   - Source and destination **status** differ.
   - `task.status` is updated to the destination status.
   - `tasks_kanban_state` moves the task id from the source column list to the destination column list, at the desired index.

3. **Move between milestones and columns**
   - Source and destination milestones differ.
   - Source and/or destination status may differ.
   - `task.milestone_id` is updated to the new milestone id (or `nil` for the `No milestone` lane).
   - `task.status` is updated to the destination status.
   - `tasks_kanban_state` is updated for **both** the source and destination milestones:
     - Removed from the source milestone's column list.
     - Inserted into the destination milestone's column list at the new index.

- Special case: tasks without milestone (`task.milestone_id == nil`):
  - Index-only reorders within the same status column are **not** persisted (no API call).
  - Any drag that results in a change of `status` or `milestone_id` (including moving between status columns in the no‑milestone swimlane, or into/out of a milestone) must:
    - Update `task.status` (and `task.milestone_id` when applicable) via the backend mutation.
    - Update `tasks_kanban_state` only for real milestones that are part of the move.

For all of the above, the app should use **Pragmatic Drag and Drop** (`@atlaskit/pragmatic-drag-and-drop`) as the underlying DnD library, via shared utilities in `turboui/src/utils/PragmaticDragAndDrop`.


## Step-by-step PR plan

Each step below is intended to be its own pull request.

### PR 1 – Spec only (this file)

- Introduce this spec file under `specs/` to describe:
  - The current architecture and data model.
  - Target Kanban behavior and invariants.
  - API surface (frontend callbacks and backend mutation) at a high level.
  - A multi-step rollout plan.

- No runtime changes to code or behavior.


### PR 2 – Extend PragmaticDragAndDrop utilities for board-style moves

**Goal:** Support multi-column (board-style) DnD scenarios in TurboUI using the Pragmatic Drag and Drop library, without touching TaskBoard yet.

**Changes (TurboUI only):**

1. **Types**
   - Extend `DraggableItem` type to include optional container metadata:

     ```ts
     export interface DraggableItem {
       id: string;
       index: number;
       containerId?: string; // e.g. `${milestoneId}:${status}`
     }
     ```

   - Add a new callback type for board moves:

     ```ts
     export interface BoardMove {
       itemId: string;
       source: { containerId: string; index: number };
       destination: { containerId: string; index: number };
     }

     export type OnBoardMove = (move: BoardMove) => void | Promise<void>;
     ```

2. **New hook: `useBoardDnD` (name can change slightly)**
   - Functionality:
     - Use `monitorForElements` to listen to drag events globally.
     - On drag start: record the dragged `itemId` and its `source.containerId`/`source.index` (from `source.data`).
     - On drop:
       - Inspect `location.current.dropTargets` to find a relevant drop target (column/card).
       - Derive `destination.containerId` from target data (e.g. column id or card container id).
       - Use `extractClosestEdge` for index calculation when dropping between cards.
       - Call `onBoardMove` with `{ itemId, source: ..., destination: ... }`.
   - Return value:

     ```ts
     {
       draggedItemId: string | null;
       // Optionally: overContainerId, etc. for styling.
     }
     ```

   - This hook will **not mutate any state itself** – it delegates state updates to the caller.

3. **Keep `useSortableList` unchanged**
   - Continue to support simple list-style ordering for existing components.

4. **Story/demo**
   - Add a simple Storybook example (e.g. `PragmaticDragAndDrop/BoardExample`):
     - Several columns (e.g. Backlog, In progress, Done).
     - Items can be moved across columns and re-ordered.
     - State is managed by the story, logging `OnBoardMove` events to the console/actions.

**Result:** A reusable, tested DnD foundation for the future Kanban component.


### PR 3 – New TaskBoard Kanban component + Storybook (TurboUI only)

**Goal:** Implement a Kanban view component in TurboUI that uses the new board-style DnD utilities, emits a rich callback describing moves, and is only used in Storybook for now.

**Location & structure:**

- Under `turboui/src/TaskBoard/`:
  - `KanbanView/index.tsx` – main Kanban component.
  - `KanbanView/types.ts` – Kanban-specific types and props.
  - Supporting components:
    - `KanbanView/MilestoneKanban.tsx` – renders one milestone’s header and columns.
    - `KanbanView/Column.tsx` – a single status column.
    - `KanbanView/Card.tsx` – wraps the existing `TaskItem` layout, without inline status selector.
  - Stories:
    - `turboui/src/TaskBoard/stories/TaskBoardKanban.stories.tsx`.

**Component API (proposal):**

```ts
export type KanbanStatus = "pending" | "in_progress" | "done" | "canceled";

export interface MilestoneKanbanState {
  pending: string[];
  in_progress: string[];
  done: string[];
  canceled: string[];
}

export interface KanbanBoardProps {
  milestone: TaskBoard.Milestone | null;
  tasks: TaskBoard.Task[];

  // Kanban state for the single milestone (matching serialized tasks_kanban_state)
  kanbanState: MilestoneKanbanState;

  // Called whenever a drag/drop completes
  onTaskKanbanChange?: (event: {
    milestoneId: string | null;
    taskId: string;
    from: { status: KanbanStatus; index: number };
    to: { status: KanbanStatus; index: number };
    updatedKanbanState: MilestoneKanbanState;
  }) => void | Promise<void>;

  // Existing TaskBoard callbacks reused
  onTaskCreate?: TaskBoard.TaskBoardProps["onTaskCreate"];
  onTaskAssigneeChange?: TaskBoard.TaskBoardProps["onTaskAssigneeChange"];
  onTaskDueDateChange?: TaskBoard.TaskBoardProps["onTaskDueDateChange"];
  onMilestoneUpdate?: TaskBoard.TaskBoardProps["onMilestoneUpdate"];
  assigneePersonSearch?: TaskBoard.TaskBoardProps["assigneePersonSearch"];
}
```

**Behavior:**

- Render exactly one milestone lane (or a "No milestone" lane when `milestone` is `null`):
  - Header consistent with `MilestoneCard`.
  - Columns for the provided statuses (default 4: Pending, In progress, Completed, Canceled).
  - Tasks are filtered to the provided milestone (or to tasks without a milestone when `milestone` is `null`).

- Each card:
  - Represents a `TaskBoard.Task`, displayed similarly to the existing list rows but **without** the `StatusSelector`.
  - Uses `useSortableItem` (or a board-specific hook) with:

    ```ts
    itemId = task.id;
    containerId = status;
    index = position within the column;
    ```

- DnD integration:
  - Use the new `useBoardDnD` hook at the board level.
  - On drop:
    - Compute the `from` and `to` descriptors.
    - Locally update the single `kanbanState` in an immutable/pure way:
      - Remove `taskId` from the source list.
      - Insert `taskId` into the destination list at `to.index`.
    - Invoke `onTaskKanbanChange` with both the `from`/`to` metadata and the updated state.
    - The Kanban component itself does **not** talk to the API.

**Stories:**

- Story 1: "Basic Kanban"
  - Single milestone with several tasks across all four statuses.
  - All callbacks wired to local state, `console.log` for `onTaskKanbanChange`.

- Story 2: "Six status board"
  - Single milestone with a custom six-status set.
  - Demonstrates flexible column counts.

- Story 3: "Wide statuses / auto-scroll"
  - Single milestone with many columns to exercise horizontal auto-scroll.

- Story 4: "Empty states"
  - No tasks at all, and a milestone with no tasks.

**Result:**

- A fully interactive Kanban board component in TurboUI, validated in Storybook, but not yet used in the main app.


### PR 4 – Backend mutation and Kanban state enhancements

**Goal:** Provide a backend mutation that updates task status and the milestone’s `tasks_kanban_state`.

> Note: the Kanban UI now shows a single milestone at a time, so tasks are not dragged between milestones. We no longer change `task.milestone_id` from the Kanban interaction; the mutation should reflect this simplified flow.

**Data model changes:**

1. `Operately.Tasks.KanbanState` (`app/lib/operately/tasks/kanban_state.ex`)
   - **Keep** `initialize/0` as it is today, returning the legacy default:

     ```elixir
     def initialize do
       %{
         "todo" => [],
         "in_progress" => [],
         "done" => []
       }
     end
     ```

   - **Add** `initialize/1` to support dynamic status lists:

     ```elixir
     def initialize(statuses) when is_list(statuses) do
       Enum.into(statuses, %{}, fn status -> {status, []} end)
     end
     ```

     New Kanban-specific code that needs the full set of statuses can use:

     ```elixir
     KanbanState.initialize(["todo", "in_progress", "done", "canceled"])
     ```

   - Optionally add a `move/6` helper:

     ```elixir
     def move(state, task_id, from_status, from_index, to_status, to_index) do
       # Remove from source list (guard against index mismatches).
       # Insert into destination list at new index.
     end
     ```

   - Update tests in `app/test/operately/tasks/kanban_state_test.exs` to reflect the new default and any additional helpers.

2. Milestone serializer (`app/lib/operately_web/api/serializers/milestone.ex`)
   - Ensure the serialized `tasks_kanban_state` always returns:

     ```elixir
     %{
       # "pending" column in the UI is backed by the legacy "todo" list (or a future "pending" key if added)
       pending: encode_task_ids(milestone.tasks_kanban_state["todo"] || milestone.tasks_kanban_state["pending"] || []),
       in_progress: encode_task_ids(milestone.tasks_kanban_state["in_progress"] || []),
       done: encode_task_ids(milestone.tasks_kanban_state["done"] || []),
       canceled: encode_task_ids(milestone.tasks_kanban_state["canceled"] || []),
     }
     ```

   - Adjust GraphQL types (wherever `tasks_kanban_state` is defined) to include `canceled` if not already present.

**New mutation under `OperatelyWeb.Api.ProjectTasks`**

- Add a module, e.g. `UpdateKanban`, in `app/lib/operately_web/api/project_tasks.ex`.

- **Inputs (proposal):**

  ```elixir
  inputs do
    field :task_id, :id, null: false
    field :milestone_id, :id, null: true
    field :status, :string, null: false
    field :milestones_kanban_state, list_of(:edit_milestone_kanban_state_input), null: false
  end
  ```

  Where `:edit_milestone_kanban_state_input` is a new input type, defined in the API types module:

  ```elixir
  input_object :edit_milestone_kanban_state_input do
    field :milestone_id, :id
    field :pending, list_of(:id)
    field :in_progress, list_of(:id)
    field :done, list_of(:id)
    field :canceled, list_of(:id)
  end
  ```

- **Outputs:**

  ```elixir
  outputs do
    field :task, :task
    field :updated_milestones, list_of(:milestone)
  end
  ```

- **Behavior (high-level):**

  1. Start an Ecto.Multi transaction and fetch `task` and `project`, similar to `UpdateMilestoneAndOrdering`.
  2. Check that the current user has `:can_edit_task` for the task.
  3. If `milestone_id` differs from `task.milestone_id`:
     - Validate that the new milestone belongs to the same project.
     - Update `task.milestone_id`.
  4. Update `task.status` to the requested `status`.
  5. Update `tasks_kanban_state` for each of the milestones listed in `milestones_kanban_state`:
     - Decode provided task ids.
     - Validate that each task belongs to the referenced milestone and has a compatible status.
     - Persist the updated map using `Milestone.changeset(milestone, %{ tasks_kanban_state: new_state })`.
  6. Return:
     - The updated task (serialized as usual).
     - The list of updated milestones (serialized, including the new `tasks_kanban_state`).

- Optionally, hook into `MilestoneSync` only for `tasks_ordering_state`-related operations if we need to keep that structure aligned with Kanban changes.
  - We **do not** attempt to keep `tasks_ordering_state` in sync with `tasks_kanban_state`; the two structures may display tasks in different orders. `MilestoneSync` continues to manage `tasks_ordering_state` as it does today.

**Tests:**

- Extend `app/test/operately_web/api/project_tasks_test.exs` with a `"update task kanban"` describe block.
- Cases to cover:
  - Requires authentication.
  - Requires `task_id`, `status`, and `milestones_kanban_state`.
  - Moves within same milestone/column (index change only).
  - Moves between columns within same milestone (status changes, `tasks_kanban_state` updated correctly).
  - Moves between milestones (status and milestone both change, both milestones' `tasks_kanban_state` updated).
  - Removing a milestone (`milestone_id: nil`) – ensures the original milestone's `tasks_kanban_state` no longer contains the task.
  - Rejects milestones from other projects.

**Result:**

- The backend exposes a dedicated Kanban-aware mutation that matches the frontend board's operations.


### PR 5 – Frontend hook to orchestrate Kanban updates

**Goal:** Introduce a hook in the main app that:
- Consumes project tasks and milestones + their `tasks_kanban_state`.
- Binds the TurboUI Kanban component's callback to the new backend mutation.
- Manages optimistic UI updates and rollback on failure.

**Location:**

- New file: `app/assets/js/models/projects/useProjectTasksKanban.ts` (or similar), alongside `useProjectMilestoneOrdering.ts`.

**Hook API (proposal):**

```ts
interface UseProjectTasksKanbanOptions {
  projectId: string;
  cacheKey: string;
  initialMilestones: TaskBoard.Milestone[];
  initialTasks: TaskBoard.Task[];
}

interface UseProjectTasksKanbanResult {
  milestones: TaskBoard.Milestone[]; // with up-to-date tasks_kanban_state
  tasks: TaskBoard.Task[];           // with up-to-date status and milestone

  kanbanStateByMilestone: Record<string, MilestoneKanbanState>;

  handleTaskKanbanChange: KanbanBoardProps["onTaskKanbanChange"];
}
```

**Behavior:**

- On initialization:
  - Normalize `initialMilestones` and `initialTasks` into local React state, ensuring every milestone has a non-nil `tasks_kanban_state` map with expected keys.

- `handleTaskKanbanChange(event)`:
  - Takes the event from the Kanban component (task id, from/to, updated state map).
  - Performs an **optimistic update**:
    - Updates the `tasks` state:
      - Set `status` to `event.to.status`.
      - Update `milestone`/`milestoneId` to `event.to.milestoneId`.
    - Updates the `milestones` state:
      - Overlay `event.updatedKanbanStateByMilestone` onto the corresponding milestones.
  - Calls the new API method, e.g. `Api.project_tasks.updateKanban({ ... })`, constructed from the event:

    ```ts
    Api.project_tasks.updateKanban({
      taskId: event.taskId,
      milestoneId: event.to.milestoneId,
      status: event.to.status,
      milestonesKanbanState: serializeForApi(event.updatedKanbanStateByMilestone),
    });
    ```

  - On success:
    - Reconcile local state with returned `task` and `updated_milestones`.
    - Invalidate `PageCache` with `cacheKey` and optionally call `refresh()` if needed.
  - On failure:
    - Show an error toast (via `showErrorToast`).
    - Roll back to a snapshot taken before the optimistic update.

**Result:**

- The main app gains a dedicated Kanban hook that encapsulates the backend coordination, while the TurboUI component stays purely presentational + local state.


## Future considerations / open questions

These are intentionally not implemented in the first iteration but should be recorded for future refinement.

1. **Exact `tasks_kanban_state` key names**
   - Whether to standardize entirely on `"pending"` vs keeping the legacy `"todo"` key.
   - The chosen approach must be reflected consistently in:
     - `KanbanState.initialize/0`.
     - Serializer.
     - GraphQL types.
     - Frontend assumptions about column keys.

2. **No-milestone persistence**
   - If "No milestone" Kanban ordering needs to be persisted, we may want a project-level `tasks_kanban_state` or a special synthetic milestone id.
   - That would involve a new backend representation and mutation semantics.

3. **Alignment with `tasks_ordering_state`**
   - `tasks_ordering_state` and `tasks_kanban_state` are intentionally **independent**.
   - Kanban column order may differ from list/timeline order, and we do not derive one from the other.

4. **Activity logging**
   - We may introduce a dedicated activity type (e.g. `task_kanban_updating`) for auditing Kanban moves.
   - For now, existing activities for status and milestone changes may be sufficient.

5. **Feature rollout strategy & ProjectPage integration**
   - Out of scope for the initial implementation: we will **not** make any changes to `ProjectPage` yet.
   - In a future iteration we can:
     - Decide whether Kanban replaces the current TaskBoard or is exposed via a view toggle.
     - Wire the `useProjectTasksKanban` hook and Kanban TurboUI component into `ProjectPage` behind a flag or feature-switch.
