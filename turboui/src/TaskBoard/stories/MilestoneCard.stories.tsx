import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { MilestoneCard } from "../components/MilestoneCard";
import { TaskBoard } from "../components/StatusSelector";
import { DragAndDropProvider } from "../../utils/DragAndDrop";
import { reorderTasksInList } from "../utils/taskReorderingUtils";

/**
 * MilestoneCard displays a milestone with its tasks, combining a header with progress
 * indicators and either a task list or an empty state.
 */
const meta: Meta<typeof MilestoneCard> = {
  title: "Components/TaskBoard/MilestoneCard",
  component: MilestoneCard,
  parameters: {
    layout: "padded",
  },
  decorators: [
    (Story, context) => {
      // Create a wrapper with state management for proper drag-and-drop
      const MilestoneCardWithDragAndDrop = () => {
        const [tasks, setTasks] = React.useState<TaskBoard.Task[]>([]);
        const [milestone, setMilestone] = React.useState<TaskBoard.Milestone | null>(null);
        
        // Initialize state from story args
        React.useEffect(() => {
          const { args } = context;
          if (args.tasks) setTasks([...args.tasks]);
          if (args.milestone) setMilestone({...args.milestone});
        }, [context.args]);
        
        // Listen for status change events
        React.useEffect(() => {
          // Skip if milestone not loaded yet
          if (!milestone) return;
          const handleStatusChange = (event: CustomEvent) => {
            const { taskId, newStatus } = event.detail;
            // Only proceed if milestone exists
            if (!milestone) return;
            
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
        }, [tasks, setTasks]);
        
        // Handle drop events to update task order
        const handleDrop = (dropZoneId: string, draggedId: string, indexInDropZone: number) => {
          console.log(`Dragged item ${draggedId} was dropped onto ${dropZoneId} at index ${indexInDropZone}`);
          
          // Skip if not a milestone drop zone
          if (!dropZoneId.startsWith('milestone-')) return true;
          
          // Use the utility function to reorder tasks
          const updatedTasks = reorderTasksInList(
            tasks,
            draggedId,
            indexInDropZone
          );
          
          // Update state
          setTasks(updatedTasks);
          
          return true;
        };
        
        // Handle task creation
        const handleTaskCreate = (newTask: Omit<TaskBoard.Task, "id">) => {
          // Skip if milestone is not loaded
          if (!milestone) return;
          
          console.log(`Creating new task for ${milestone.name}:`, newTask);
          
          // Create a new task with an ID
          const taskWithId: TaskBoard.Task = {
            id: `task-${Date.now()}`, // Generate a unique ID
            ...newTask
          };
          
          // Add the task to the list
          setTasks([...tasks, taskWithId]);
        };
        
        // Return early with loading state if milestone is not yet loaded
        if (!milestone) {
          return <div>Loading milestone...</div>;
        }
        
        return (
          <DragAndDropProvider onDrop={handleDrop}>
            <MilestoneCard
              milestone={milestone} 
              tasks={tasks}
              onTaskCreate={handleTaskCreate}
              availableMilestones={[milestone]}
              availablePeople={[
                { id: "user-1", fullName: "Alice Johnson", avatarUrl: "https://i.pravatar.cc/150?u=alice" },
                { id: "user-2", fullName: "Bob Smith", avatarUrl: "https://i.pravatar.cc/150?u=bob" }
              ]}
            />
          </DragAndDropProvider>
        );
      };
      
      return (
        <div className="m-4 w-[600px]">
          <ul className="list-none p-0 m-0 border border-surface-outline rounded-md">
            <MilestoneCardWithDragAndDrop />
          </ul>
        </div>
      );
    },
  ],
} satisfies Meta<typeof MilestoneCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// Sample milestone data
const sampleMilestone: TaskBoard.Milestone = {
  id: "milestone-1",
  name: "Q2 Release",
  dueDate: new Date(new Date().setDate(new Date().getDate() + 10)),
  hasDescription: true,
  hasComments: true,
  commentCount: 3,
};

// Sample tasks for this milestone
const sampleTasks: TaskBoard.Task[] = [
  {
    id: "task-1",
    title: "Implement login functionality",
    status: "pending" as TaskBoard.Status,
    milestone: sampleMilestone,
  },
  {
    id: "task-2",
    title: "Design user profile page",
    status: "in_progress" as TaskBoard.Status,
    assignees: [
      { id: "user-1", fullName: "Alice Johnson", avatarUrl: "https://i.pravatar.cc/150?u=alice" },
    ],
    milestone: sampleMilestone,
    hasDescription: true,
  },
  {
    id: "task-3",
    title: "Fix navigation bug in sidebar",
    status: "done" as TaskBoard.Status,
    hasComments: true,
    commentCount: 2,
    milestone: sampleMilestone,
  },
];

/**
 * Default milestone card with multiple tasks
 */
export const DefaultMilestone: Story = {
  args: {
    milestone: sampleMilestone,
    tasks: sampleTasks,
    onTaskCreate: () => console.log("Create new task for this milestone"),
  },
};

/**
 * Milestone with a mix of task statuses showing progress
 */
export const MilestoneWithProgress: Story = {
  args: {
    milestone: {
      ...sampleMilestone,
      name: "Feature Implementation",
    },
    tasks: [
      ...sampleTasks,
      {
        id: "task-4",
        title: "Write documentation",
        status: "done" as TaskBoard.Status,
        milestone: sampleMilestone,
      },
      {
        id: "task-5",
        title: "Deploy to production",
        status: "done" as TaskBoard.Status,
        milestone: sampleMilestone,
      },
    ],
    onTaskCreate: () => console.log("Create new task for milestone with progress"),
  },
};

/**
 * Milestone with no tasks showing the empty state
 */
export const EmptyMilestone: Story = {
  args: {
    milestone: {
      id: "milestone-empty",
      name: "Backlog",
      // No additional properties like dueDate, comments or description
    },
    tasks: [],
    onTaskCreate: () => console.log("Create first task for empty milestone"),
  },
};

/**
 * Overdue milestone
 */
export const OverdueMilestone: Story = {
  args: {
    milestone: {
      ...sampleMilestone,
      name: "Phase 1",
      dueDate: new Date(new Date().setDate(new Date().getDate() - 5)), // 5 days ago
    },
    tasks: sampleTasks.slice(0, 2), // Just a couple tasks
    onTaskCreate: () => console.log("Create new task for overdue milestone"),
  },
};
