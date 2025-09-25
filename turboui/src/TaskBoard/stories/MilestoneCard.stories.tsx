import type { Meta, StoryObj } from "@storybook/react";
import { MilestoneCard } from "../components/MilestoneCard";
import * as Types from "../types";
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
} satisfies Meta<typeof MilestoneCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// Sample milestone data
const sampleMilestone: Types.Milestone = {
  id: "milestone-1",
  name: "Q2 Release",
  dueDate: createContextualDate(new Date(new Date().setDate(new Date().getDate() + 10)), "day"),
  link: "#",
  hasDescription: true,
  hasComments: true,
  commentCount: 3,
  status: "pending",
};

const longTitleOne =
  "Coordinate cross-functional launch strategy across marketing, sales, support, and product to keep messaging aligned through release";
const longTitleTwo =
  "Document post-launch follow-up plan covering customer outreach, success enablement, analytics tracking, and executive reporting milestones";

// Sample tasks for this milestone
const sampleTasks: Types.Task[] = [
  {
    id: "task-1",
    title: "Implement login functionality",
    status: "pending" as Types.Status,
    description: "Implement user authentication and login flow",
    milestone: sampleMilestone,
    link: "#",
    dueDate: createContextualDate(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), "day"),
    hasDescription: true,
  },
  {
    id: "task-2",
    title: "Design user profile page",
    status: "in_progress" as Types.Status,
    description: "Create wireframes and design mockups for user profile",
    assignees: [{ id: "user-1", fullName: "Alice Johnson", avatarUrl: "https://i.pravatar.cc/150?u=alice" }],
    milestone: sampleMilestone,
    link: "#",
    dueDate: createContextualDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), "day"), // 2 days ago (overdue)
    hasDescription: true,
  },
  {
    id: "task-3",
    title: "Fix navigation bug in sidebar",
    status: "done" as Types.Status,
    description: "Resolve sidebar navigation issues and improve UX",
    assignees: [{ id: "user-2", fullName: "Bob Smith", avatarUrl: "https://i.pravatar.cc/150?u=bob" }],
    link: "#",
    hasComments: true,
    commentCount: 2,
    milestone: sampleMilestone,
    dueDate: createContextualDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "day"), // 7 days from now
  },
  {
    id: "task-4",
    title: "Task without due date or assignee - hover to set",
    status: "pending" as Types.Status,
    description: null,
    link: "#",
    milestone: sampleMilestone,
    dueDate: null,
    hasComments: false,
  },
  {
    id: "task-5",
    title: longTitleOne,
    status: "in_progress" as Types.Status,
    description: null,
    milestone: sampleMilestone,
    link: "#",
    dueDate: createContextualDate(new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), "day"),
    hasComments: true,
    commentCount: 6,
  },
  {
    id: "task-6",
    title: longTitleTwo,
    status: "pending" as Types.Status,
    description: "Ensure every team knows their responsibilities after release",
    milestone: sampleMilestone,
    link: "#",
    dueDate: null,
    hasDescription: true,
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
        assignees: [{ id: "user-1", fullName: "Alice Johnson", avatarUrl: "https://i.pravatar.cc/150?u=alice" }],
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
        assignees: [{ id: "user-1", fullName: "Alice Johnson", avatarUrl: "https://i.pravatar.cc/150?u=alice" }],
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        hasDescription: true,
      },
      {
        id: "task-in-progress-1",
        title: "User acceptance testing",
        status: "in_progress" as Types.Status,
        milestone: sampleMilestone,
        assignees: [{ id: "user-2", fullName: "Bob Smith", avatarUrl: "https://i.pravatar.cc/150?u=bob" }],
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
        assignees: [{ id: "user-3", fullName: "Charlie Brown", avatarUrl: "https://i.pravatar.cc/150?u=charlie" }],
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
        assignees: [{ id: "user-4", fullName: "Diana Prince", avatarUrl: null }],
        dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      },
      {
        id: "task-done-3",
        title: "Create user documentation",
        status: "done" as Types.Status,
        milestone: sampleMilestone,
        assignees: [{ id: "user-1", fullName: "Alice Johnson", avatarUrl: "https://i.pravatar.cc/150?u=alice" }],
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
