import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { TaskItem } from "../components/TaskItem";
import * as Types from "../types";
import { DragAndDropProvider } from "../../utils/DragAndDrop";

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

// Event handler for status changes
const handleStatusChange = (taskId: string, newStatus: Types.Status) => {
  console.log(`Status changed for task ${taskId} to ${newStatus}`);
};

// Event handler for task updates
const handleTaskUpdate = (taskId: string, updates: Partial<Types.Task>) => {
  console.log(`Task ${taskId} updated:`, updates);
};

// Mock people data for assignee selection
const mockPeople: Types.Person[] = [
  { id: "user-1", fullName: "Alice Johnson", avatarUrl: "https://i.pravatar.cc/150?u=alice" },
  { id: "user-2", fullName: "Bob Smith", avatarUrl: "https://i.pravatar.cc/150?u=bob" },
  { id: "user-3", fullName: "Charlie Brown", avatarUrl: "https://i.pravatar.cc/150?u=charlie" },
  { id: "user-4", fullName: "Diana Prince", avatarUrl: null },
];

// Mock search function for people
const mockSearchPeople = async ({ query }: { query: string }): Promise<Types.Person[]> => {
  await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API delay
  return mockPeople.filter(person => 
    person.fullName.toLowerCase().includes(query.toLowerCase())
  );
};

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
    // Set up state to track task updates
    const [task, setTask] = React.useState(args.task);
    
    // Update task when args change
    React.useEffect(() => {
      setTask(args.task);
    }, [args.task]);
    
    // Set up status change listener
    React.useEffect(() => {
      const handleStatusChangeEvent = (event: CustomEvent) => {
        const { taskId, newStatus } = event.detail;
        if (taskId === task.id) {
          console.log(`TaskItem: Status changed for task ${taskId} to ${newStatus}`);
          
          // Update the task state
          setTask({...task, status: newStatus});
          
          // Also call the handler for debugging
          handleStatusChange(taskId, newStatus);
        }
      };
      document.addEventListener("statusChange" as any, handleStatusChangeEvent as any);
      return () => {
        document.removeEventListener("statusChange" as any, handleStatusChangeEvent as any);
      };
    }, [task]);

    // Make sure all required props are passed
    return <TaskItem 
      task={task} // Use the state-managed task instead of args.task
      milestoneId={args.milestoneId} 
      itemStyle={args.itemStyle}
      onTaskUpdate={(taskId, updates) => {
        console.log(`TaskItem: Task ${taskId} updated:`, updates);
        // Update local state with the updates
        setTask({...task, ...updates});
        handleTaskUpdate(taskId, updates);
      }}
      searchPeople={mockSearchPeople}
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
