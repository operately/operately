import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { MilestoneCard } from "../components/MilestoneCard";
import * as Types from "../types";
import { DragAndDropProvider } from "../../utils/DragAndDrop";
import { reorderTasksInList } from "../utils/taskReorderingUtils";
import { createContextualDate } from "../../DateField/mockData";

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
    (_, context) => {
      // Create a wrapper with state management for proper drag-and-drop
      const MilestoneCardWithDragAndDrop = () => {
        const [tasks, setTasks] = React.useState<Types.Task[]>([]);
        const [milestone, setMilestone] = React.useState<Types.Milestone>(context.args.milestone);
        
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
        const handleTaskCreate = (newTask: Omit<Types.Task, "id">) => {
          // Skip if milestone is not loaded
          if (!milestone) return;
          
          console.log(`Creating new task for ${milestone.name}:`, newTask);
          
          // Create a new task with an ID
          const taskWithId: Types.Task = {
            id: `task-${Date.now()}`, // Generate a unique ID
            ...newTask
          };
          
          // Add the task to the list
          setTasks([...tasks, taskWithId]);
        };

        // Handle task updates (for assignees, due dates, etc.)
        const handleTaskUpdate = (taskId: string, updates: Partial<Types.Task>) => {
          console.log(`Updating task ${taskId}:`, updates);
          
          const updatedTasks = tasks.map(task => 
            task.id === taskId ? { ...task, ...updates } : task
          );
          setTasks(updatedTasks);
        };

        // Handle milestone updates (including due date changes)
        const handleMilestoneUpdate = (milestoneId: string, updates: Partial<Types.Milestone>) => {
          console.log(`Updating milestone ${milestoneId}:`, updates);
          
          setMilestone(prev => ({ ...prev, ...updates }));
        };

        // Mock search people function
        const searchPeople = async ({ query }: { query: string }): Promise<Types.Person[]> => {
          const mockPeople: Types.Person[] = [
            { id: "user-1", fullName: "Alice Johnson", avatarUrl: "https://i.pravatar.cc/150?u=alice" },
            { id: "user-2", fullName: "Bob Smith", avatarUrl: "https://i.pravatar.cc/150?u=bob" },
            { id: "user-3", fullName: "Charlie Brown", avatarUrl: "https://i.pravatar.cc/150?u=charlie" },
            { id: "user-4", fullName: "Diana Prince", avatarUrl: null },
          ];
          
          // Simulate API delay
          await new Promise(resolve => setTimeout(resolve, 300));
          
          return mockPeople.filter(person => 
            person.fullName.toLowerCase().includes(query.toLowerCase())
          );
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
              hiddenTasks={context.args.hiddenTasks || []}
              showHiddenTasksToggle={context.args.showHiddenTasksToggle ?? true}
              onTaskCreate={handleTaskCreate}
              onTaskUpdate={handleTaskUpdate}
              onMilestoneUpdate={handleMilestoneUpdate}
              searchPeople={searchPeople}
              availableMilestones={[milestone]}
              availablePeople={[
                { id: "user-1", fullName: "Alice Johnson", avatarUrl: "https://i.pravatar.cc/150?u=alice" },
                { id: "user-2", fullName: "Bob Smith", avatarUrl: "https://i.pravatar.cc/150?u=bob" },
                { id: "user-3", fullName: "Charlie Brown", avatarUrl: "https://i.pravatar.cc/150?u=charlie" },
                { id: "user-4", fullName: "Diana Prince", avatarUrl: null },
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
const sampleMilestone: Types.Milestone = {
  id: "milestone-1",
  name: "Q2 Release",
  dueDate: createContextualDate(new Date(new Date().setDate(new Date().getDate() + 10)), "day"),
  hasDescription: true,
  hasComments: true,
  commentCount: 3,
};

// Sample tasks for this milestone
const sampleTasks: Types.Task[] = [
  {
    id: "task-1",
    title: "Implement login functionality",
    status: "pending" as Types.Status,
    milestone: sampleMilestone,
    dueDate: createContextualDate(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), "day"),
    hasDescription: true,
  },
  {
    id: "task-2",
    title: "Design user profile page",
    status: "in_progress" as Types.Status,
    assignees: [
      { id: "user-1", fullName: "Alice Johnson", avatarUrl: "https://i.pravatar.cc/150?u=alice" },
    ],
    milestone: sampleMilestone,
    dueDate: createContextualDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), "day"), // 2 days ago (overdue)
    hasDescription: true,
  },
  {
    id: "task-3",
    title: "Fix navigation bug in sidebar",
    status: "done" as Types.Status,
    assignees: [
      { id: "user-2", fullName: "Bob Smith", avatarUrl: "https://i.pravatar.cc/150?u=bob" },
    ],
    hasComments: true,
    commentCount: 2,
    milestone: sampleMilestone,
    dueDate: createContextualDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "day"), // 7 days from now
  },
  {
    id: "task-4",
    title: "Task without due date or assignee - hover to set",
    status: "pending" as Types.Status,
    milestone: sampleMilestone,
    hasComments: false,
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
        status: "done" as Types.Status,
        milestone: sampleMilestone,
      },
      {
        id: "task-5",
        title: "Deploy to production",
        status: "done" as Types.Status,
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
 * Milestone without due date - shows hover-to-set behavior
 */
export const MilestoneWithoutDueDate: Story = {
  args: {
    milestone: {
      id: "milestone-no-date",
      name: "Research Phase - Hover header to set due date",
      hasDescription: true,
      hasComments: false,
      // No dueDate property
    },
    tasks: [
      {
        id: "task-research-1",
        title: "Market research analysis",
        status: "in_progress" as Types.Status,
        assignees: [
          { id: "user-1", fullName: "Alice Johnson", avatarUrl: "https://i.pravatar.cc/150?u=alice" },
        ],
        hasDescription: true,
      },
      {
        id: "task-research-2", 
        title: "Competitor analysis",
        status: "pending" as Types.Status,
        hasComments: false,
      },
    ],
    onTaskCreate: () => console.log("Create new task for milestone without due date"),
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

/**
 * Milestone with hidden completed tasks - demonstrates the ghost row functionality
 * Shows only pending tasks by default, with a "Show X completed tasks" row to reveal hidden tasks
 */
export const MilestoneWithHiddenCompletedTasks: Story = {
  args: {
    milestone: {
      ...sampleMilestone,
      name: "Feature Complete - Click to reveal completed tasks",
    },
    // Only show pending and in-progress tasks
    tasks: [
      {
        id: "task-pending-1",
        title: "Final testing phase",
        status: "pending" as Types.Status,
        milestone: sampleMilestone,
        assignees: [
          { id: "user-1", fullName: "Alice Johnson", avatarUrl: "https://i.pravatar.cc/150?u=alice" },
        ],
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        hasDescription: true,
      },
      {
        id: "task-in-progress-1",
        title: "User acceptance testing",
        status: "in_progress" as Types.Status,
        milestone: sampleMilestone,
        assignees: [
          { id: "user-2", fullName: "Bob Smith", avatarUrl: "https://i.pravatar.cc/150?u=bob" },
        ],
        hasComments: true,
        commentCount: 1,
      },
    ],
    // Hidden completed tasks that can be revealed
    hiddenTasks: [
      {
        id: "task-done-1",
        title: "Implement core functionality",
        status: "done" as Types.Status,
        milestone: sampleMilestone,
        assignees: [
          { id: "user-3", fullName: "Charlie Brown", avatarUrl: "https://i.pravatar.cc/150?u=charlie" },
        ],
        dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        hasDescription: true,
        hasComments: true,
        commentCount: 3,
      },
      {
        id: "task-done-2",
        title: "Set up CI/CD pipeline",
        status: "done" as Types.Status,
        milestone: sampleMilestone,
        assignees: [
          { id: "user-4", fullName: "Diana Prince", avatarUrl: null },
        ],
        dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      },
      {
        id: "task-done-3",
        title: "Create user documentation",
        status: "done" as Types.Status,
        milestone: sampleMilestone,
        assignees: [
          { id: "user-1", fullName: "Alice Johnson", avatarUrl: "https://i.pravatar.cc/150?u=alice" },
        ],
        hasDescription: true,
      },
      {
        id: "task-canceled-1",
        title: "Old approach that was scrapped",
        status: "canceled" as Types.Status,
        milestone: sampleMilestone,
        hasComments: true,
        commentCount: 2,
      },
    ],
    showHiddenTasksToggle: true, // Enable hidden tasks toggle functionality
    onTaskCreate: () => console.log("Create new task for milestone with hidden completed tasks"),
  },
};
