# TaskBoard Component Refactoring Plan

This document outlines the step-by-step plan to refactor the TaskBoard component into smaller, reusable components, with the ultimate goal of creating a standalone MilestonePage.

## Current Component Structure

```
TaskBoard/
├── components/
│   ├── index.tsx (main TaskBoard component)
│   ├── DueDateDisplay.tsx
│   ├── MilestoneCreationModal.tsx
│   ├── StatusSelector.tsx
│   ├── TaskCreationModal.tsx
│   └── TaskItem.tsx (already extracted)
└── stories/
    └── TaskItem.stories.tsx (already created)
```

## Target Component Structure

```
TaskBoard/
├── components/
│   ├── index.tsx (cleaner main TaskBoard component)
│   ├── DueDateDisplay.tsx
│   ├── MilestoneCard.tsx (to be extracted)
│   ├── MilestoneCreationModal.tsx
│   ├── StatusSelector.tsx
│   ├── TaskCreationModal.tsx
│   ├── TaskItem.tsx
│   ├── TaskList.tsx (to be extracted)
│   └── EmptyMilestoneDropZone.tsx (to be extracted)
├── pages/
│   └── MilestonePage.tsx (to be created)
└── stories/
    ├── MilestoneCard.stories.tsx (to be created)
    ├── MilestonePage.stories.tsx (to be created)
    ├── TaskItem.stories.tsx
    └── TaskList.stories.tsx (to be created)
```

## Step 1: Extract TaskList Component

The TaskList component is currently embedded in index.tsx. It needs to be extracted as a standalone component.

### Tasks:
- [x] Create `TaskList.tsx` in the components directory
- [x] Move TaskList component and its related functions from index.tsx
- [x] Make sure it accepts the appropriate props:
  - tasks: Task[]
  - milestoneId: string
  - onTaskReorder?: (taskId: string, newMilestoneId: string, newIndex: number) => void
- [x] Create TaskList.stories.tsx in the stories directory to test it
- [x] Update imports in index.tsx to use the extracted component

### Notes:
- Had to redefine `TaskWithIndex` interface in TaskList.tsx as it wasn't exported from StatusSelector
- This highlights the need for the centralized types file mentioned in Step 5
- Discovered that drag-and-drop functionality is primarily managed by the `DragAndDropProvider` at a higher level:
  - The TaskList component focuses on rendering items and setting up a drop zone
  - The actual reordering logic is handled by the parent component via the provider
  - Simplified our TaskList implementation to match this pattern
- Removed `onTaskReorder` callback from the interface since reordering is handled by the DragAndDropProvider
- Updated stories to properly demonstrate drag and drop using state management in the story wrapper

## Step 2: Extract EmptyMilestoneDropZone Component

The EmptyMilestoneDropZone component is also embedded in index.tsx.

### Tasks:
- [x] Create `EmptyMilestoneDropZone.tsx` in the components directory
- [x] Move EmptyMilestoneDropZone component from index.tsx
- [x] Make sure it accepts the appropriate props:
  - milestoneId: string
  - onTaskCreation?: () => void (optional, to trigger task creation UI)
- [x] Update imports in index.tsx to use the extracted component

### Notes:
- Added an optional `onTaskCreation` callback to allow triggering task creation from the empty state
- Created Storybook stories to demonstrate the empty drop zone functionality
- Made the component clickable to trigger the onTaskCreation callback
- This component is much simpler than TaskList but follows the same pattern of using the drop zone

## Step 3: Create MilestoneCard Component

This component will encapsulate a milestone's header and its tasks.

### Tasks:
- [x] Create `MilestoneCard.tsx` in the components directory
- [x] Implement the component to include:
  - Milestone header with title and completion stats
  - TaskList component
  - EmptyMilestoneDropZone when no tasks exist
  - Task creation button
- [x] Make sure it accepts the appropriate props:
  - milestone: TaskBoard.Milestone
  - tasks: TaskBoard.Task[]
  - onTaskCreate?: () => void
  - stats?: { pending, inProgress, done, canceled, total }
- [x] Create MilestoneCard.stories.tsx to validate the component

### Notes:
- Added a helper function `calculateMilestoneStats` to generate stats if not provided as props
- Fixed a mismatch between PieChart props (`segments` vs `slices`)
- Simplified the interface compared to original plan (removed onStatusChange and onTaskReorder)
- Made the MilestoneCard responsible for determining whether to show the TaskList or EmptyMilestoneDropZone
- Updated the main TaskBoard component to use MilestoneCard for a cleaner implementation

## Step 4: Extract Task Reordering Logic ✅

Task reordering logic is complex and needs to be properly shared.

### Tasks:
- [x] Moved the task reordering functions to `taskReorderingUtils.ts` utility file
- [x] Created versatile utility functions for both single-list and cross-milestone reordering
- [x] Updated references in TaskBoard, TaskList, and MilestoneCard components

## Step 5: Create Types File for Shared Interfaces ✅

To avoid circular dependencies, create a shared types file.

### Tasks:
- [x] Created `types.ts` in the TaskBoard directory
- [x] Moved all TaskBoard namespace interfaces from StatusSelector.tsx to this file
- [x] Updated imports across all components to use this types file
- [x] Removed duplicate interfaces and used shared types consistently

## Step 6: Create MilestonePage Component ✅

Create the standalone MilestonePage component that focuses on a single milestone.

### Tasks:
- [x] Created `MilestonePage.tsx` as a top-level component in its own directory
- [x] Implemented component with:
  - Large header with milestone title and progress pie chart
  - Full milestone description
  - TaskList with filtering capability for completed tasks
  - Comments section placeholder
- [x] Included the appropriate props:
  - milestone: Types.Milestone
  - tasks: Types.Task[]
  - spaceName/spaceUrl and projectName/projectUrl for breadcrumbs
  - onStatusChange, onTaskCreate, onTaskReorder, and onCommentCreate callbacks
- [x] Created MilestonePage.stories.tsx with various examples:
  - Default milestone with mixed task statuses
  - Empty milestone with no tasks
  - Milestone with many completed tasks

## Step 7: Clean up the main TaskBoard Component

Once all components are extracted, update the main TaskBoard component.

### Tasks:
- [ ] Replace embedded components with imports of the extracted components
- [ ] Update the render method to use MilestoneCard components
- [ ] Make sure the refactored component maintains all existing functionality
- [ ] Verify the drag and drop still works across milestones

## Step 8: Update Stories and Tests

### Tasks:
- [ ] Create or update stories for all components
- [ ] Test edge cases:
  - Empty task lists
  - Drag and drop between milestones
  - Task status changes
  - Task creation with different milestones

## Step 9: Documentation Update

### Tasks:
- [ ] Update component JSDoc comments
- [ ] Create README.md for the TaskBoard directory explaining component structure
- [ ] Document the drag and drop implementation details

## Implementation Notes

### Avoiding Circular Dependencies

To avoid circular dependencies:
- Import from parent modules rather than between siblings
- Use the central types.ts file for shared interfaces
- Consider using dependency injection for complex logic

### State Management

For the drag-and-drop functionality across components:
- Pass callbacks up to parent components
- Consider React Context if the component hierarchy gets deep
- Use custom events sparingly and document their use

### Performance Considerations

- Use React.memo() for components that don't need frequent re-rendering
- Use useMemo and useCallback for expensive calculations and event handlers
- Add key props to all list items for efficient React rendering

## Testing Strategy

- Create stories for each component showing various states
- Test the integration of components in the main TaskBoard story
- Test edge cases like empty lists, error states, and loading states
- Verify drag and drop functionality works for all scenarios
