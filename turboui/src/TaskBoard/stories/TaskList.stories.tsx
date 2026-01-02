import type { Meta, StoryObj } from "@storybook/react";
import React, { useState, useEffect } from "react";
import { TaskList } from "../components/TaskList";
import * as Types from "../types";
import { DateField } from "../../DateField";
import { useBoardDnD } from "../../utils/PragmaticDragAndDrop";
import type { BoardMove } from "../../utils/PragmaticDragAndDrop";
import { reorderTasksInList } from "../utils/taskReorderingUtils";
import { usePersonFieldSearch } from "../../utils/storybook/usePersonFieldSearch";

/**
 * TaskList displays a group of draggable tasks for a specific milestone
 * with drag and drop functionality for task reordering.
 */
const meta: Meta<typeof TaskList> = {
  title: "Components/TaskBoard/TaskList",
  component: TaskList,
  parameters: {
    layout: "padded",
  },
  decorators: [
    (_, context) => {
      // Create a wrapper component with state for the story
      const TaskListWithReordering = ({
        initialTasks,
        showHiddenTasksToggle,
        onTaskAssigneeChange,
        onTaskDueDateChange,
        onTaskStatusChange,
      }: {
        initialTasks: Types.Task[];
        showHiddenTasksToggle?: boolean;
        onTaskAssigneeChange?: (taskId: string, assignee: Types.Person | null) => void;
        onTaskDueDateChange?: (taskId: string, dueDate: DateField.ContextualDate | null) => void;
        onTaskStatusChange?: (taskId: string, status: Types.Status | null) => void;
      }) => {
        const [tasks, setTasks] = useState<Types.Task[]>([]);
        const assigneePersonSearch = usePersonFieldSearch(mockPeople);

        // Store the tasks from props when component mounts
        useEffect(() => {
          setTasks([...initialTasks]);
        }, [initialTasks]);

        const handleTaskMove = React.useCallback(
          (move: BoardMove) => {
            console.log(
              `Dragged item ${move.itemId} was dropped into zone ${move.destination.containerId} at index ${move.destination.index}`,
            );

            // Use the provided index directly for reordering
            const updatedTasks = reorderTasksInList(tasks, move.itemId, move.destination.index);
            setTasks(updatedTasks);
          },
          [tasks],
        );

        const { draggedItemId, destination, draggedItemDimensions } = useBoardDnD(handleTaskMove);

        return (
          <TaskList
            tasks={tasks}
            showHiddenTasksToggle={showHiddenTasksToggle}
            milestoneId="milestone-1"
            onTaskAssigneeChange={onTaskAssigneeChange || (() => {})}
            onTaskDueDateChange={onTaskDueDateChange || (() => {})}
            onTaskStatusChange={onTaskStatusChange || (() => {})}
            assigneePersonSearch={assigneePersonSearch}
            statusOptions={DEFAULT_STATUS_OPTIONS}
            draggedItemId={draggedItemId}
            targetLocation={destination}
            placeholderHeight={draggedItemDimensions?.height ?? null}
          />
        );
      };

      // Access args from context
      const { args } = context;

      return (
        <div className="m-4 w-[500px]">
          <TaskListWithReordering
            initialTasks={args.tasks || []}
            showHiddenTasksToggle={args.showHiddenTasksToggle}
            onTaskAssigneeChange={args.onTaskAssigneeChange || (() => {})}
            onTaskDueDateChange={args.onTaskDueDateChange || (() => {})}
            onTaskStatusChange={args.onTaskStatusChange || (() => {})}
          />
        </div>
      );
    },
  ],
} satisfies Meta<typeof TaskList>;

export default meta;
type Story = StoryObj<typeof meta>;

// Common milestone ID for all stories
const milestoneId = "milestone-1";

// Mock people data for assignee selection
const mockPeople: Types.Person[] = [
  { id: "user-1", fullName: "Alice Johnson", avatarUrl: "https://i.pravatar.cc/150?u=alice" },
  { id: "user-2", fullName: "Bob Smith", avatarUrl: "https://i.pravatar.cc/150?u=bob" },
  { id: "user-3", fullName: "Charlie Brown", avatarUrl: "https://i.pravatar.cc/150?u=charlie" },
  { id: "user-4", fullName: "Diana Prince", avatarUrl: null },
];

// Default status options used in stories. "Done" is marked as hidden so
// completed tasks participate in the hidden-tasks behavior.
const DEFAULT_STATUS_OPTIONS: Types.Status[] = [
  {
    id: "pending",
    value: "pending",
    label: "Pending",
    icon: "circleDashed",
    color: "gray",
    index: 0,
  },
  {
    id: "in_progress",
    value: "in_progress",
    label: "In progress",
    icon: "circleDot",
    color: "blue",
    index: 1,
  },
  {
    id: "done",
    value: "done",
    label: "Done",
    icon: "circleCheck",
    color: "green",
    closed: true,
    index: 2,
  },
  {
    id: "canceled",
    value: "canceled",
    label: "Canceled",
    icon: "circleX",
    color: "red",
    closed: true,
    index: 3,
  },
];

const [PENDING_STATUS, IN_PROGRESS_STATUS, DONE_STATUS, CANCELED_STATUS] = DEFAULT_STATUS_OPTIONS;


const longTitleOne =
  "Coordinate cross-functional launch strategy across marketing, sales, support, and product to keep messaging aligned through release";
const longTitleTwo =
  "Document post-launch follow-up plan covering customer outreach, success enablement, analytics tracking, and executive reporting milestones";

/**
 * Basic TaskList with multiple tasks
 */
export const MultipleTasksList: Story = {
  args: {
    tasks: [
      {
        id: "task-1",
        title: "Implement user authentication",
        status: PENDING_STATUS,
        hasDescription: true,
        hasComments: true,
        commentCount: 3,
      },
      {
        id: "task-2",
        title: "Design dashboard layout",
        status: IN_PROGRESS_STATUS,
        dueDate: new Date(new Date().setDate(new Date().getDate() + 5)), // Due in 5 days
        assignees: [{ id: "user-1", fullName: "Alice Johnson", avatarUrl: "https://i.pravatar.cc/150?u=alice" }],
      },
      {
        id: "task-3",
        title: "Write API documentation",
        status: IN_PROGRESS_STATUS,
        hasComments: true,
        commentCount: 1,
      },
      {
        id: "task-4",
        title: "Optimize database queries",
        status: DONE_STATUS,
        hasDescription: true,
      },
      {
        id: "task-5",
        title: longTitleOne,
        status: PENDING_STATUS,
        hasComments: true,
        commentCount: 5,
      },
      {
        id: "task-6",
        title: longTitleTwo,
        status: IN_PROGRESS_STATUS,
        hasDescription: true,
        hasComments: false,
      },
    ],
    milestoneId,
    onTaskAssigneeChange: () => {},
    onTaskDueDateChange: () => {},
    onTaskStatusChange: () => {},
  },
  render: (args) => {
    return (
      <TaskList
        tasks={args.tasks}
        milestoneId={args.milestoneId}
        onTaskAssigneeChange={() => {}}
        onTaskDueDateChange={() => {}}
        onTaskStatusChange={() => {}}
        assigneePersonSearch={{ people: [], onSearch: async () => {} }}
        statusOptions={DEFAULT_STATUS_OPTIONS}
      />
    );
  },
};

/**
 * Single task list
 */
export const SingleTaskList: Story = {
  args: {
    tasks: [
      {
        id: "task-5",
        title: "Submit quarterly report",
        status: PENDING_STATUS,
        dueDate: new Date(new Date().setDate(new Date().getDate() + 3)), // Due in 3 days
        hasDescription: true,
        hasComments: true,
        commentCount: 2,
      },
    ],
    milestoneId,
    onTaskAssigneeChange: () => {},
    onTaskDueDateChange: () => {},
    onTaskStatusChange: () => {},
  },
  render: MultipleTasksList.render,
};

/**
 * Empty task list
 */
export const EmptyTaskList: Story = {
  args: {
    tasks: [],
    milestoneId,
    onTaskAssigneeChange: () => {},
    onTaskDueDateChange: () => {},
    onTaskStatusChange: () => {},
  },
  render: MultipleTasksList.render,
};

/**
 * TaskList with tasks of various statuses
 */
export const MixedStatusTaskList: Story = {
  args: {
    tasks: [
      {
        id: "task-6",
        title: "Send client proposal",
        status: PENDING_STATUS,
        dueDate: new Date(new Date().setDate(new Date().getDate() - 2)), // 2 days ago (overdue)
      },
      {
        id: "task-7",
        title: "Setup development environment",
        status: DONE_STATUS,
      },
      {
        id: "task-8",
        title: "Complete user authentication system",
        status: IN_PROGRESS_STATUS,
        hasDescription: true,
        hasComments: true,
        commentCount: 5,
        assignees: [{ id: "user-2", fullName: "Bob Smith", avatarUrl: "https://i.pravatar.cc/150?u=bob" }],
      },
    ],
    milestoneId,
    onTaskAssigneeChange: () => {},
    onTaskDueDateChange: () => {},
    onTaskStatusChange: () => {},
  },
  render: MultipleTasksList.render,
};

/**
 * TaskList with hidden completed tasks - demonstrates the ghost row functionality
 * Shows only pending/in-progress tasks by default, with a ghost row to reveal hidden completed tasks
 */
export const TaskListWithHiddenCompletedTasks: Story = {
  args: {
    tasks: [
      {
        id: "task-visible-1",
        title: "Review user feedback",
        status: PENDING_STATUS,
        assignees: [{ id: "user-1", fullName: "Alice Johnson", avatarUrl: "https://i.pravatar.cc/150?u=alice" }],
        dueDate: new Date(new Date().setDate(new Date().getDate() + 1)), // Due tomorrow
        hasDescription: true,
      },
      {
        id: "task-visible-2",
        title: "Update documentation",
        status: IN_PROGRESS_STATUS,
        assignees: [{ id: "user-3", fullName: "Charlie Brown", avatarUrl: "https://i.pravatar.cc/150?u=charlie" }],
        hasComments: true,
        commentCount: 2,
      },
      {
        id: "task-hidden-1",
        title: "Set up project repository",
        status: DONE_STATUS,
        assignees: [{ id: "user-2", fullName: "Bob Smith", avatarUrl: "https://i.pravatar.cc/150?u=bob" }],
        dueDate: new Date(new Date().setDate(new Date().getDate() - 3)), // 3 days ago
        hasDescription: true,
        hasComments: true,
        commentCount: 1,
      },
      {
        id: "task-hidden-2",
        title: "Configure CI/CD pipeline",
        status: DONE_STATUS,
        assignees: [{ id: "user-4", fullName: "Diana Prince", avatarUrl: null }],
        dueDate: new Date(new Date().setDate(new Date().getDate() - 5)), // 5 days ago
      },
      {
        id: "task-hidden-3",
        title: "Old approach that was canceled",
        status: CANCELED_STATUS,
        hasComments: true,
        commentCount: 3,
      },
    ],
    showHiddenTasksToggle: true, // Enable hidden tasks toggle functionality
    milestoneId,
    onTaskAssigneeChange: () => {},
    onTaskDueDateChange: () => {},
    onTaskStatusChange: () => {},
  },
  render: (args) => {
    return (
      <TaskList
        tasks={args.tasks}
        showHiddenTasksToggle={args.showHiddenTasksToggle}
        milestoneId={args.milestoneId}
        onTaskAssigneeChange={() => {}}
        onTaskDueDateChange={() => {}}
        onTaskStatusChange={() => {}}
        assigneePersonSearch={{ people: [], onSearch: async () => {} }}
        statusOptions={DEFAULT_STATUS_OPTIONS}
      />
    );
  },
};
