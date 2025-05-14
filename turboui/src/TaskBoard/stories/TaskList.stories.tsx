import type { Meta, StoryObj } from "@storybook/react";
import React, { useState, useEffect } from "react";
import { TaskList } from "../components/TaskList";
import { TaskBoard } from "../components/StatusSelector";
import { DragAndDropProvider } from "../../utils/DragAndDrop";

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
    (Story, context) => {
      // Create a wrapper component with state for the story
      const TaskListWithReordering = ({ initialTasks }: { initialTasks: TaskBoard.Task[] }) => {
        const [tasks, setTasks] = useState<TaskBoard.Task[]>([]);
        
        // Store the tasks from props when component mounts
        useEffect(() => {
          setTasks([...initialTasks]);
        }, [initialTasks]);
        
        // Define a proper onDrop handler for the DragAndDropProvider
        const handleDrop = (dropZoneId: string, draggedId: string, indexInDropZone: number) => {
          console.log(`Dragged item ${draggedId} was dropped onto ${dropZoneId} at index ${indexInDropZone}`);
          
          // Create a copy of the current tasks
          const updatedTasks = [...tasks];
          
          // Find the task being dragged
          const draggedTaskIndex = updatedTasks.findIndex(task => task.id === draggedId);
          
          if (draggedTaskIndex !== -1) {
            // Remove task from its current position
            const [draggedTask] = updatedTasks.splice(draggedTaskIndex, 1);
            
            // Insert at the new position
            updatedTasks.splice(indexInDropZone, 0, draggedTask);
            
            // Update state
            setTasks(updatedTasks);
          }
          
          return true; // Indicate successful drop
        };
        
        return (
          <DragAndDropProvider onDrop={handleDrop}>
            <TaskList 
              tasks={tasks} 
              milestoneId="milestone-1" 
            />
          </DragAndDropProvider>
        );
      };
      
      // Access args from context
      const { args } = context;
      
      return (
        <div className="m-4 w-[500px]">
          <TaskListWithReordering initialTasks={args.tasks || []} />
        </div>
      );
    },
  ],
} satisfies Meta<typeof TaskList>;

export default meta;
type Story = StoryObj<typeof meta>;

// Common milestone ID for all stories
const milestoneId = "milestone-1";

// Event handler for status changes
const handleStatusChange = (taskId: string, newStatus: TaskBoard.Status) => {
  console.log(`Status changed for task ${taskId} to ${newStatus}`);
};

/**
 * Basic TaskList with multiple tasks
 */
export const MultipleTasksList: Story = {
  args: {
    tasks: [
      {
        id: "task-1",
        title: "Implement login functionality",
        status: "pending" as TaskBoard.Status,
      },
      {
        id: "task-2",
        title: "Design user profile page",
        status: "in_progress" as TaskBoard.Status,
        assignees: [
          { id: "user-1", fullName: "Alice Johnson", avatarUrl: "https://i.pravatar.cc/150?u=alice" },
        ],
      },
      {
        id: "task-3",
        title: "Fix navigation bug in sidebar",
        status: "in_progress" as TaskBoard.Status,
        hasComments: true,
        commentCount: 3,
      },
      {
        id: "task-4",
        title: "Optimize database queries",
        status: "done" as TaskBoard.Status,
        hasDescription: true,
      },
    ],
    milestoneId,
  },
  render: (args) => {
    // Set up status change listener
    React.useEffect(() => {
      const handleStatusChangeEvent = (event: CustomEvent) => {
        const { taskId, newStatus } = event.detail;
        handleStatusChange(taskId, newStatus);
      };
      document.addEventListener("statusChange" as any, handleStatusChangeEvent as any);
      return () => {
        document.removeEventListener("statusChange" as any, handleStatusChangeEvent as any);
      };
    }, []);

    return <TaskList 
      tasks={args.tasks} 
      milestoneId={args.milestoneId} 
    />;
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
        status: "pending" as TaskBoard.Status,
        dueDate: new Date(new Date().setDate(new Date().getDate() + 3)), // Due in 3 days
        hasDescription: true,
        hasComments: true,
        commentCount: 2,
      },
    ],
    milestoneId,
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
        status: "pending" as TaskBoard.Status,
        dueDate: new Date(new Date().setDate(new Date().getDate() - 2)), // 2 days ago (overdue)
      },
      {
        id: "task-7",
        title: "Setup development environment",
        status: "done" as TaskBoard.Status,
      },
      {
        id: "task-8",
        title: "Complete user authentication system",
        status: "in_progress" as TaskBoard.Status,
        hasDescription: true,
        hasComments: true,
        commentCount: 5,
        assignees: [
          { id: "user-2", fullName: "Bob Smith", avatarUrl: "https://i.pravatar.cc/150?u=bob" },
        ],
      },
    ],
    milestoneId,
  },
  render: MultipleTasksList.render,
};
