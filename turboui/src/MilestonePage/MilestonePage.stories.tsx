import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import { MilestonePage } from "./index";
import * as Types from "../TaskBoard/types";
import { genPeople } from "../utils/storybook/genPeople";

/**
 * MilestonePage displays a standalone page for a single milestone and its tasks.
 * It includes a header with milestone info, task list with filtering, and optional
 * description and comments sections.
 */
const meta: Meta<typeof MilestonePage> = {
  title: "Pages/MilestonePage",
  component: MilestonePage,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof MilestonePage>;

export default meta;
type Story = StoryObj<typeof meta>;

// Generate a set of people for our mock data
const mockPeople = genPeople(4);

// Mock search function for people
const mockSearchPeople = async ({ query }: { query: string }): Promise<Types.Person[]> => {
  await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API delay
  return mockPeople.filter(person => 
    person.fullName.toLowerCase().includes(query.toLowerCase())
  );
};

// Create a sample milestone with various properties
const sampleMilestone: Types.Milestone = {
  id: "milestone-1",
  name: "Q2 Feature Release",
  dueDate: new Date(new Date().setDate(new Date().getDate() + 15)), // 15 days from now
  hasDescription: true,
  hasComments: true,
  commentCount: 3,
};

// Create a set of tasks for the milestone
const createSampleTasks = (): Types.Task[] => [
  {
    id: "task-1",
    title: "Implement user authentication",
    status: "done",
    milestone: sampleMilestone,
    assignees: [mockPeople[0]!],
    hasComments: true,
    commentCount: 2,
  },
  {
    id: "task-2",
    title: "Design user profile page",
    status: "in_progress",
    milestone: sampleMilestone,
    assignees: [mockPeople[1]!],
    hasDescription: true,
  },
  {
    id: "task-3",
    title: "Fix navigation bug in sidebar",
    status: "pending",
    milestone: sampleMilestone,
  },
  {
    id: "task-4",
    title: "Add support for dark mode",
    status: "pending",
    milestone: sampleMilestone,
    assignees: [mockPeople[2]!],
    dueDate: new Date(new Date().setDate(new Date().getDate() + 5)),
  },
  {
    id: "task-5",
    title: "Write documentation",
    status: "done",
    milestone: sampleMilestone,
    hasDescription: true,
  },
  {
    id: "task-6",
    title: "Create presentation for stakeholders",
    status: "in_progress",
    milestone: sampleMilestone,
    dueDate: new Date(new Date().setDate(new Date().getDate() + 2)),
    hasComments: true,
    commentCount: 1,
  },
];

/**
 * Basic example with interactive task creation and reordering
 */
export const Default: Story = {
  render: () => {
    // State for tasks and milestone
    const [tasks, setTasks] = useState<Types.Task[]>(createSampleTasks());
    const [milestone, setMilestone] = useState<Types.Milestone>(sampleMilestone);
    
    // Handler for creating a new task
    const handleTaskCreate = (newTaskData: Omit<Types.Task, "id">) => {
      // Generate a fake ID
      const taskId = `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      // Create the new task with the generated ID
      const newTask: Types.Task = {
        id: taskId,
        ...newTaskData,
      };
      
      // Add the new task to the list
      setTasks([...tasks, newTask]);
    };
    
    // Handler for reordering tasks
    const handleTaskReorder = (reorderedTasks: Types.Task[]) => {
      console.log("Tasks reordered:", reorderedTasks);
      setTasks(reorderedTasks);
    };
    
    // Handler for status changes
    const handleStatusChange = (taskId: string, newStatus: Types.Status) => {
      const updatedTasks = tasks.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      );
      setTasks(updatedTasks);
    };
    
    // Handler for due date changes
    const handleDueDateChange = (milestoneId: string, dueDate: Date | null) => {
      console.log("Due date changed:", { milestoneId, dueDate });
      // If dueDate is null, we're clearing the date
      if (dueDate === null) {
        const { dueDate, ...restOfMilestone } = milestone;
        setMilestone(restOfMilestone);
      } else {
        // Otherwise set the new date
        setMilestone({ ...milestone, dueDate });
      }
    };
    
    // Handler for task updates
    const handleTaskUpdate = (taskId: string, updates: Partial<Types.Task>) => {
      console.log(`Task ${taskId} updated:`, updates);
      
      // Update the task with the provided updates
      const updatedTasks = tasks.map((task) => 
        task.id === taskId ? { ...task, ...updates } : task
      );
      setTasks(updatedTasks);
    };
    
    return (
      <MilestonePage
        milestone={milestone}
        tasks={tasks}
        spaceName="Engineering"
        spaceUrl="#space"
        projectName="Product Redesign"
        projectUrl="#project"
        onTaskCreate={handleTaskCreate}
        onTaskReorder={handleTaskReorder}
        onStatusChange={handleStatusChange}
        onCommentCreate={(comment) => console.log("Comment created:", comment)}
        onDueDateChange={handleDueDateChange}
        onTaskUpdate={handleTaskUpdate}
        searchPeople={mockSearchPeople}
      />
    );
  },
};

/**
 * Empty milestone with no tasks yet
 */
export const EmptyMilestone: Story = {
  render: () => {
    // Use state to manage the milestone with its due date
    const [milestone, setMilestone] = useState<Types.Milestone>({
      id: "milestone-empty",
      name: "New Initiative Planning",
      hasDescription: true,
      hasComments: false,
    });
    
    // Handler for due date changes
    const handleDueDateChange = (milestoneId: string, dueDate: Date | null) => {
      console.log("Due date changed:", { milestoneId, dueDate });
      // If dueDate is null, we're clearing the date
      if (dueDate === null) {
        const { dueDate, ...restOfMilestone } = milestone;
        setMilestone(restOfMilestone);
      } else {
        // Otherwise set the new date
        setMilestone({ ...milestone, dueDate });
      }
    };
    
    return (
      <MilestonePage
        milestone={milestone}
        tasks={[]}
        spaceName="Product"
        spaceUrl="#space"
        projectName="Mobile App"
        projectUrl="#project"
        onTaskCreate={(taskData) => console.log("Task created:", taskData)}
        onDueDateChange={handleDueDateChange}
        onTaskUpdate={(taskId, updates) => console.log("Task updated:", taskId, updates)}
        searchPeople={mockSearchPeople}
      />
    );
  }
};

/**
 * Milestone with many completed tasks
 */
export const MostlyCompletedMilestone: Story = {
  render: () => {
    const completedMilestone: Types.Milestone = {
      id: "milestone-completed",
      name: "API Integration Phase",
      dueDate: new Date(new Date().setDate(new Date().getDate() - 2)), // 2 days ago
      hasDescription: true,
      hasComments: true,
      commentCount: 5,
    };
    
    // Create tasks with mostly completed status
    const completedTasks: Types.Task[] = [
      {
        id: "task-c1",
        title: "Define API endpoints",
        status: "done",
        milestone: completedMilestone,
      },
      {
        id: "task-c2",
        title: "Create authentication service",
        status: "done",
        milestone: completedMilestone,
      },
      {
        id: "task-c3",
        title: "Implement caching layer",
        status: "done",
        milestone: completedMilestone,
      },
      {
        id: "task-c4",
        title: "Document API usage",
        status: "done",
        milestone: completedMilestone,
      },
      {
        id: "task-c5",
        title: "Perform security audit",
        status: "in_progress",
        milestone: completedMilestone,
      },
      {
        id: "task-c6",
        title: "Deploy to production",
        status: "pending",
        milestone: completedMilestone,
      },
    ];
    
    return (
      <MilestonePage
        milestone={completedMilestone}
        tasks={completedTasks}
        spaceName="Development"
        spaceUrl="#space"
        projectName="Backend Services"
        projectUrl="#project"
        onTaskUpdate={(taskId, updates) => console.log("Task updated:", taskId, updates)}
        searchPeople={mockSearchPeople}
      />
    );
  }
};
