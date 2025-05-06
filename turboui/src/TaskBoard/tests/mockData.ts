import { TaskBoard } from "../components";

// Mock labels
export const mockLabels = {
  highPriority: { id: "1", name: "High Priority", color: "#EF4444" },
  mediumPriority: { id: "2", name: "Medium Priority", color: "#F59E0B" },
  lowPriority: { id: "3", name: "Low Priority", color: "#10B981" },
  bug: { id: "4", name: "Bug", color: "#8B5CF6" },
  feature: { id: "5", name: "Feature", color: "#3B82F6" },
  documentation: { id: "6", name: "Documentation", color: "#6366F1" },
};

// Mock people
export const mockPeople = {
  john: { 
    id: "1", 
    fullName: "John Doe", 
    avatarUrl: "https://i.pravatar.cc/100?u=johndoe@example.com" 
  },
  jane: { 
    id: "2", 
    fullName: "Jane Smith", 
    avatarUrl: "https://i.pravatar.cc/100?u=janesmith@example.com" 
  },
  bob: { 
    id: "3", 
    fullName: "Bob Johnson", 
    avatarUrl: "https://i.pravatar.cc/100?u=bobjohnson@example.com" 
  },
  alice: { 
    id: "4", 
    fullName: "Alice Williams", 
    avatarUrl: "https://i.pravatar.cc/100?u=alicewilliams@example.com" 
  },
};

// Mock milestones
export const mockMilestones = {
  q2Release: { id: "1", name: "Q2 Release", dueDate: new Date("2025-06-30") },
  productLaunch: { id: "2", name: "Product Launch", dueDate: new Date("2025-08-15") },
  marketExpansion: { id: "3", name: "Market Expansion", dueDate: new Date("2025-09-30") },
};

// Mock tasks
export const mockTasks: TaskBoard.Task[] = [
  {
    id: "task-1",
    title: "Implement user authentication",
    status: "pending",
    description: "Create login/signup flows with OAuth integration",
    assignees: [mockPeople.john, mockPeople.jane],
    labels: [mockLabels.feature, mockLabels.highPriority],
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
    assignees: [mockPeople.bob],
    labels: [mockLabels.bug, mockLabels.highPriority],
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
    assignees: [mockPeople.alice],
    labels: [mockLabels.documentation, mockLabels.mediumPriority],
    milestone: mockMilestones.q2Release,
    points: 5,
    hasDescription: true,
    hasComments: true,
  },
  {
    id: "task-4",
    title: "Design marketing landing page",
    status: "done",
    assignees: [mockPeople.jane],
    labels: [mockLabels.feature, mockLabels.mediumPriority],
    milestone: mockMilestones.productLaunch,
    points: 5,
    hasDescription: false,
    hasComments: true,
    commentCount: 2,
  },
  {
    id: "task-5",
    title: "Research competitor pricing strategies",
    status: "pending",
    labels: [mockLabels.lowPriority],
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
    assignees: [mockPeople.bob, mockPeople.alice],
    labels: [mockLabels.feature, mockLabels.lowPriority],
    points: 3,
    hasDescription: true,
    hasComments: false,
  },
  {
    id: "task-7",
    title: "Optimize database queries",
    status: "in_progress",
    assignees: [mockPeople.john],
    labels: [mockLabels.bug, mockLabels.highPriority],
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
    assignees: [mockPeople.bob],
    labels: [mockLabels.feature, mockLabels.highPriority],
    milestone: mockMilestones.q2Release,
    points: 8,
    hasDescription: true,
    hasComments: true,
  },
];

// Mock empty tasks array
export const mockEmptyTasks: TaskBoard.Task[] = [];
