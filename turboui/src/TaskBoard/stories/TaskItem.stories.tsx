import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { TaskItem } from "../components/TaskItem";
import * as Types from "../types";
import { DragAndDropProvider } from "../../utils/DragAndDrop";
import { usePersonFieldSearch } from "../../utils/storybook/usePersonFieldSearch";

/**
 * TaskItem is a draggable component that displays a task with various indicators for status, attachments, comments, and more.
 */
const meta: Meta<typeof TaskItem> = {
  title: "Components/TaskBoard/TaskItem",
  component: TaskItem,
  parameters: {
    layout: "padded",
  },
  decorators: [
    (Story) => {
      // Define a simple onDrop handler for the DragAndDropProvider
      const handleDrop = (draggedId: string, targetId: string) => {
        console.log(`Dragged item ${draggedId} was dropped onto ${targetId}`);
        return true; // Return true to indicate successful drop
      };
      
      return (
        <div className="m-4 w-[500px]">
          <DragAndDropProvider onDrop={handleDrop}>
            <ul className="list-none p-0 m-0">
              <Story />
            </ul>
          </DragAndDropProvider>
        </div>
      );
    },
  ],
} satisfies Meta<typeof TaskItem>;

export default meta;
type Story = StoryObj<typeof meta>;

// Fixed milestoneId and itemStyle for all stories
const sharedProps = {
  milestoneId: "milestone-1",
  itemStyle: () => ({ position: "relative" }),
};

// Mock people data for assignee selection
const mockPeople: Types.Person[] = [
  { id: "user-1", fullName: "Alice Johnson", avatarUrl: "https://i.pravatar.cc/150?u=alice" },
  { id: "user-2", fullName: "Bob Smith", avatarUrl: "https://i.pravatar.cc/150?u=bob" },
  { id: "user-3", fullName: "Charlie Brown", avatarUrl: "https://i.pravatar.cc/150?u=charlie" },
  { id: "user-4", fullName: "Diana Prince", avatarUrl: null },
];

// Default status options used in TaskItem stories.
const DEFAULT_STATUS_OPTIONS: Types.StatusOption[] = [
  {
    id: "pending",
    value: "pending",
    label: "Pending",
    icon: "circleDashed",
    color: "dimmed",
    index: 0,
  },
  {
    id: "in_progress",
    value: "in_progress",
    label: "In progress",
    icon: "circleDot",
    color: "brand",
    index: 1,
  },
  {
    id: "done",
    value: "done",
    label: "Done",
    icon: "circleCheck",
    color: "success",
    closed: true,
    index: 2,
  },
  {
    id: "canceled",
    value: "canceled",
    label: "Canceled",
    icon: "circleX",
    color: "dimmed",
    closed: true,
    index: 3,
  },
];

/**
 * Basic task with just a title and status (pending)
 */
export const BasicTask: Story = {
  args: {
    task: {
      id: "task-1",
      title: "Implement login functionality",
      status: "pending" as Types.Status,
      index: 0,
    },
    ...sharedProps,
  },
  render: (args) => {
    const assigneePersonSearch = usePersonFieldSearch(mockPeople);
    
    // Set up state to track task updates
    const [task, setTask] = React.useState(args.task);
    
    // Update task when args change
    React.useEffect(() => {
      setTask(args.task);
    }, [args.task]);
    
    // Make sure all required props are passed
    return <TaskItem 
      task={task} // Use the state-managed task instead of args.task
      milestoneId={args.milestoneId} 
      itemStyle={args.itemStyle}
      onTaskAssigneeChange={(taskId, assignee) => {
        console.log('Task assignee updated:', taskId, assignee);
      }}
      onTaskDueDateChange={(taskId, dueDate) => {
        console.log('Task due date updated:', taskId, dueDate);
      }}
      onTaskStatusChange={(taskId, status) => {
        console.log('Task status updated:', taskId, status);
      }}
      assigneePersonSearch={assigneePersonSearch}
      statusOptions={DEFAULT_STATUS_OPTIONS}
    />;
  },
};

/**
 * Task with an assignee
 */
export const TaskWithAssignee: Story = {
  args: {
    task: {
      id: "task-2",
      title: "Design user profile page",
      status: "in_progress" as Types.Status,
      assignees: [
        { id: "user-1", fullName: "Alice Johnson", avatarUrl: "https://i.pravatar.cc/150?u=alice" },
      ],
      index: 0,
    },
    ...sharedProps,
  },
  render: BasicTask.render,
};

/**
 * Task with comments indicator
 */
export const TaskWithComments: Story = {
  args: {
    task: {
      id: "task-3",
      title: "Fix navigation bug in sidebar",
      status: "in_progress" as Types.Status,
      hasComments: true,
      commentCount: 3,
      index: 0,
    },
    ...sharedProps,
  },
  render: BasicTask.render,
};

/**
 * Task with description indicator
 */
export const TaskWithDescription: Story = {
  args: {
    task: {
      id: "task-4",
      title: "Optimize database queries",
      status: "pending" as Types.Status,
      hasDescription: true,
      index: 0,
    },
    ...sharedProps,
  },
  render: BasicTask.render,
};

/**
 * Task with due date
 */
export const TaskWithDueDate: Story = {
  args: {
    task: {
      id: "task-5",
      title: "Submit quarterly report",
      status: "pending" as Types.Status,
      dueDate: new Date(new Date().setDate(new Date().getDate() + 3)), // Due in 3 days
      index: 0,
    },
    ...sharedProps,
  },
  render: BasicTask.render,
};

/**
 * Overdue task
 */
export const OverdueTask: Story = {
  args: {
    task: {
      id: "task-6",
      title: "Send client proposal",
      status: "pending" as Types.Status,
      dueDate: new Date(new Date().setDate(new Date().getDate() - 2)), // 2 days ago
      index: 0,
    },
    ...sharedProps,
  },
  render: BasicTask.render,
};

/**
 * Completed task
 */
export const CompletedTask: Story = {
  args: {
    task: {
      id: "task-7",
      title: "Setup development environment",
      status: "done" as Types.Status,
      index: 0,
    },
    ...sharedProps,
  },
  render: BasicTask.render,
};

/**
 * Task with all possible indicators
 */
export const FullFeaturedTask: Story = {
  args: {
    task: {
      id: "task-8",
      title: "Complete user authentication system",
      status: "in_progress" as Types.Status,
      hasDescription: true,
      hasComments: true,
      commentCount: 5,
      dueDate: new Date(new Date().setDate(new Date().getDate() + 1)), // Due tomorrow
      assignees: [
        { id: "user-2", fullName: "Bob Smith", avatarUrl: "https://i.pravatar.cc/150?u=bob" },
      ],
      index: 0,
    },
    ...sharedProps,
  },
  render: BasicTask.render,
};

/**
 * Task with interactive assignee selection - demonstrates the PersonAvatarField functionality
 */
export const InteractiveAssigneeSelection: Story = {
  args: {
    task: {
      id: "task-assignee",
      title: "Task with interactive assignee selection",
      status: "pending" as Types.Status,
      index: 0,
    },
    ...sharedProps,
  },
  render: BasicTask.render,
};
