import type { Meta, StoryObj } from "@storybook/react";
import React, { useState, useEffect } from "react";
import { TaskList } from "../components/TaskList";
import * as Types from "../types";
import { DragAndDropProvider } from "../../utils/DragAndDrop";
import { reorderTasksInList } from "../utils/taskReorderingUtils";

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
      const TaskListWithReordering = ({ initialTasks }: { initialTasks: Types.Task[] }) => {
        const [tasks, setTasks] = useState<Types.Task[]>([]);
        
        // Store the tasks from props when component mounts
        useEffect(() => {
          setTasks([...initialTasks]);
        }, [initialTasks]);
        
        // Listen for status change events
        useEffect(() => {
          const handleStatusChange = (event: CustomEvent) => {
            const { taskId, newStatus } = event.detail;
            console.log(`Status changed for task ${taskId} to ${newStatus}`);
            
            // Update task status in our state
            const updatedTasks = tasks.map(task => {
              if (task.id === taskId) {
                return { ...task, status: newStatus };
              }
              return task;
            });
            
            setTasks(updatedTasks);
          };
          
          // Add event listener
          document.addEventListener("statusChange", handleStatusChange as EventListener);
          
          // Clean up
          return () => {
            document.removeEventListener("statusChange", handleStatusChange as EventListener);
          };
        }, [tasks]);
        
        // Define a proper onDrop handler for the DragAndDropProvider
        const handleDrop = (dropZoneId: string, draggedId: string, indexInDropZone: number) => {
          console.log(`Dragged item ${draggedId} was dropped onto ${dropZoneId} at index ${indexInDropZone}`);
          
          // Use the utility function to reorder tasks within a list
          const updatedTasks = reorderTasksInList(
            tasks,
            draggedId,
            indexInDropZone
          );
          
          // Update state
          setTasks(updatedTasks);
          
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
const handleStatusChange = (taskId: string, newStatus: Types.Status) => {
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
        status: "pending" as Types.Status,
      },
      {
        id: "task-2",
        title: "Design user profile page",
        status: "in_progress" as Types.Status,
        assignees: [
          { id: "user-1", fullName: "Alice Johnson", avatarUrl: "https://i.pravatar.cc/150?u=alice" },
        ],
      },
      {
        id: "task-3",
        title: "Fix navigation bug in sidebar",
        status: "in_progress" as Types.Status,
        hasComments: true,
        commentCount: 3,
      },
      {
        id: "task-4",
        title: "Optimize database queries",
        status: "done" as Types.Status,
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
        status: "pending" as Types.Status,
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
        status: "pending" as Types.Status,
        dueDate: new Date(new Date().setDate(new Date().getDate() - 2)), // 2 days ago (overdue)
      },
      {
        id: "task-7",
        title: "Setup development environment",
        status: "done" as Types.Status,
      },
      {
        id: "task-8",
        title: "Complete user authentication system",
        status: "in_progress" as Types.Status,
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
