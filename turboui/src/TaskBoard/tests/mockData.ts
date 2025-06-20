import * as Types from "../types";
import { genPeople } from "../../utils/storybook/genPeople";

// Labels removed in current iteration

// Generate a consistent set of people for our mock data
const generatedPeople = genPeople(4);

// Mock people - mapped into an object for easy reference with proper Types.Person typing
export const mockPeople: Record<string, Types.Person> = {
  john: generatedPeople[0]!,
  jane: generatedPeople[1]!,
  bob: generatedPeople[2]!,
  emily: generatedPeople[3]!,
};

// Mock milestones
export const mockMilestones = {
  q2Release: {
    id: "1",
    name: "Q2 Release",
    dueDate: new Date("2025-06-30"),
    hasDescription: true,
    hasComments: true,
    commentCount: 5,
  },
  productLaunch: {
    id: "2",
    name: "Product Launch",
    dueDate: new Date("2025-08-15"),
    hasDescription: true,
    hasComments: true,
    commentCount: 3,
  },
  marketExpansion: {
    id: "3",
    name: "Market Expansion",
    dueDate: new Date("2025-09-30"),
    hasDescription: false,
    hasComments: false,
  },
  emptyMilestone: {
    id: "4",
    name: "Empty Milestone",
    dueDate: undefined,
    hasDescription: false,
    hasComments: false,
  },
};

// Mock tasks
export const mockTasks: Types.Task[] = [
  {
    id: "task-1",
    title: "Implement user authentication",
    status: "pending",
    description: "Create login/signup flows with OAuth integration",
    assignees: [mockPeople.john!],
    milestone: mockMilestones.q2Release,
    dueDate: new Date("2025-05-10"), // Future date
    points: 8,
    hasDescription: true,
    hasComments: true,
    commentCount: 3,
  },
  {
    id: "task-2",
    title: "Fix navigation bug on mobile",
    status: "in_progress",
    assignees: [mockPeople.bob!],
    milestone: mockMilestones.q2Release,
    dueDate: new Date("2025-05-01"), // Past due
    points: 3,
    hasDescription: true,
    hasComments: false,
  },
  {
    id: "task-3",
    title: "Update documentation for API v2",
    status: "in_progress",
    assignees: [mockPeople.emily!],
    milestone: mockMilestones.q2Release,
    points: 5,
    hasDescription: true,
    hasComments: true,
  },
  {
    id: "task-4",
    title: "Design marketing landing page",
    status: "done",
    milestone: mockMilestones.productLaunch,
    points: 5,
    hasDescription: false,
    hasComments: false,
  },
  {
    id: "task-5",
    title: "Research competitor pricing strategies",
    status: "pending",
    milestone: mockMilestones.marketExpansion,
    dueDate: new Date("2025-06-15"), // Future date
    points: 3,
    hasDescription: false,
    hasComments: false,
  },
  {
    id: "task-6",
    title: "Implement dark mode toggle",
    status: "pending",
    assignees: [mockPeople.emily!],
    points: 3,
    hasDescription: true,
    hasComments: false,
  },
  {
    id: "task-7",
    title: "Optimize database queries",
    status: "in_progress",
    assignees: [mockPeople.john!],
    dueDate: new Date("2025-04-30"), // Past due
    points: 5,
    hasDescription: true,
    hasComments: true,
    commentCount: 5,
  },
  {
    id: "task-8",
    title: "Set up CI/CD pipeline",
    status: "done",
    assignees: [mockPeople.emily!],
    milestone: mockMilestones.q2Release,
    points: 8,
    hasDescription: true,
    hasComments: true,
  },
  {
    id: "task-9",
    title: "Add analytics dashboard",
    status: "pending",
    milestone: mockMilestones.productLaunch,
    points: 13,
    hasDescription: false,
    hasComments: false,
  },
  {
    id: "task-10",
    title: "Implement social login options",
    status: "in_progress",
    assignees: [mockPeople.jane!],
    milestone: mockMilestones.q2Release,
    dueDate: new Date("2025-05-20"),
    points: 5,
    hasDescription: true,
    hasComments: true,
    commentCount: 2,
  },
  {
    id: "task-11",
    title: "Redesign user profile page",
    status: "done",
    assignees: [mockPeople.bob!],
    milestone: mockMilestones.q2Release,
    dueDate: new Date("2025-04-15"), // Past due but completed
    points: 8,
    hasDescription: true,
    hasComments: true,
    commentCount: 7,
  },
  {
    id: "task-12",
    title: "Create A/B testing framework",
    status: "canceled",
    milestone: mockMilestones.productLaunch,
    points: 13,
    hasDescription: false,
    hasComments: false,
  },
  {
    id: "task-13",
    title: "Optimize image loading",
    status: "in_progress",
    assignees: [mockPeople.bob!],
    milestone: mockMilestones.q2Release,
    dueDate: new Date("2025-05-25"),
    points: 3,
    hasDescription: true,
    hasComments: false,
  },
  {
    id: "task-14",
    title: "Setup internationalization",
    status: "pending",
    assignees: [mockPeople.jane!],
    milestone: mockMilestones.marketExpansion,
    dueDate: new Date("2025-08-10"),
    points: 8,
    hasDescription: true,
    hasComments: true,
    commentCount: 1,
  },
  {
    id: "task-15",
    title: "Implement payment gateway integration",
    status: "done",
    assignees: [mockPeople.john!],
    milestone: mockMilestones.productLaunch,
    dueDate: new Date("2025-06-01"),
    points: 13,
    hasDescription: true,
    hasComments: true,
    commentCount: 9,
  },
  {
    id: "task-16",
    title: "Create automated email campaigns",
    status: "pending",
    assignees: [mockPeople.emily!],
    milestone: mockMilestones.marketExpansion,
    dueDate: new Date("2025-07-30"),
    points: 5,
    hasDescription: true,
    hasComments: false,
  },
  {
    id: "task-17",
    title: "Research new features for next quarter",
    status: "pending",
    assignees: [mockPeople.bob!],
    milestone: mockMilestones.marketExpansion,
    points: 3,
    hasDescription: true,
    hasComments: false,
  },
];

// Mock empty tasks array
export const mockEmptyTasks: Types.Task[] = [];
