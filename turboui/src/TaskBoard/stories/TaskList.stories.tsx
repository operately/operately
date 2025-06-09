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
      const TaskListWithReordering = ({ initialTasks, onTaskUpdate, searchPeople }: { 
        initialTasks: Types.Task[];
        onTaskUpdate?: (taskId: string, updates: Partial<Types.Task>) => void;
        searchPeople?: (params: { query: string }) => Promise<Types.Person[]>;
      }) => {
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
        
        const handleDrop = (draggedId: string, targetId: string) => {
          console.log(`Dragged item ${draggedId} was dropped onto ${targetId}`);
          
          // Find the target task index
          const targetIndex = tasks.findIndex(task => task.id === targetId);
          if (targetIndex !== -1) {
            const updatedTasks = reorderTasksInList(tasks, draggedId, targetIndex);
            setTasks(updatedTasks);
          }
          
          return true;
        };
        
        return (
          <DragAndDropProvider onDrop={handleDrop}>
            <TaskList 
              tasks={tasks} 
              milestoneId="milestone-1" 
              onTaskUpdate={onTaskUpdate}
              searchPeople={searchPeople}
            />
          </DragAndDropProvider>
        );
      };
      
      // Access args from context
      const { args } = context;
      
      return (
        <div className="m-4 w-[500px]">
          <TaskListWithReordering 
            initialTasks={args.tasks || []} 
            onTaskUpdate={args.onTaskUpdate}
            searchPeople={args.searchPeople}
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

// Event handler for status changes
const handleStatusChange = (taskId: string, newStatus: Types.Status) => {
  const event = new CustomEvent("statusChange", {
    detail: { taskId, newStatus }
  });
  document.dispatchEvent(event);
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
 * Basic TaskList with multiple tasks
 */
export const MultipleTasksList: Story = {
  args: {
    tasks: [
      {
        id: "task-1",
        title: "Implement user authentication",
        status: "pending" as Types.Status,
        hasDescription: true,
        hasComments: true,
        commentCount: 3,
      },
      {
        id: "task-2",
        title: "Design dashboard layout",
        status: "in_progress" as Types.Status,
        dueDate: new Date(new Date().setDate(new Date().getDate() + 5)), // Due in 5 days
        assignees: [
          { id: "user-1", fullName: "Alice Johnson", avatarUrl: "https://i.pravatar.cc/150?u=alice" },
        ],
      },
      {
        id: "task-3",
        title: "Write API documentation",
        status: "in_progress" as Types.Status,
        hasComments: true,
        commentCount: 1,
      },
      {
        id: "task-4",
        title: "Optimize database queries",
        status: "done" as Types.Status,
        hasDescription: true,
      },
    ],
    milestoneId,
    onTaskUpdate: handleTaskUpdate,
    searchPeople: mockSearchPeople,
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
      onTaskUpdate={args.onTaskUpdate}
      searchPeople={args.searchPeople}
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
    onTaskUpdate: handleTaskUpdate,
    searchPeople: mockSearchPeople,
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
    onTaskUpdate: handleTaskUpdate,
    searchPeople: mockSearchPeople,
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
    onTaskUpdate: handleTaskUpdate,
    searchPeople: mockSearchPeople,
  },
  render: MultipleTasksList.render,
};
