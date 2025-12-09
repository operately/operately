import { TaskPage } from "./index";
import { TaskActivity } from "../Timeline";
import type { Status } from "../TaskBoard/types";
import type { TimelineItem as TimelineItemType } from "../Timeline/types";
import { Person as TimelinePerson } from "../CommentSection/types";
import { createContextualDate } from "../DateField/mockData";
export { asRichText, asRichTextWithList } from "../utils/storybook/richContent";

// Timeline people (with profile links)
export const timelinePeople: TimelinePerson[] = [
  {
    id: "user-1",
    fullName: "Alice Johnson",
    avatarUrl: "https://i.pravatar.cc/150?u=alice",
    profileLink: "/people/alice",
  },
  { id: "user-2", fullName: "Bob Smith", avatarUrl: "https://i.pravatar.cc/150?u=bob", profileLink: "/people/bob" },
  {
    id: "user-3",
    fullName: "Charlie Brown",
    avatarUrl: "https://i.pravatar.cc/150?u=charlie",
    profileLink: "/people/charlie",
  },
  { id: "user-4", fullName: "Diana Prince", avatarUrl: null, profileLink: "/people/diana" },
];

// Named exports for easier access
export const alice = timelinePeople[0]!;
export const bob = timelinePeople[1]!;
export const charlie = timelinePeople[2]!;
export const diana = timelinePeople[3]!;
export const currentUser = alice;

// Convert timeline people to TaskPage.Person format
export const mockTaskPeople: TaskPage.Person[] = timelinePeople.map(p => ({
  id: p.id,
  fullName: p.fullName,
  avatarUrl: p.avatarUrl || null,
  profileLink: "#",
}));

// Mock milestone data for TaskPage - sorted by due date (earliest first), with some without due dates
export const mockMilestones: TaskPage.Milestone[] = [
  {
    id: "milestone-2",
    name: "MVP Launch",
    dueDate: createContextualDate("2024-01-30", "day"), // January 30, 2024 (earliest)
    status: "done",
    link: "/projects/mobile-app/milestones/mvp",
  },
  {
    id: "milestone-1",
    name: "Beta Release",
    dueDate: createContextualDate("2024-02-15", "day"), // February 15, 2024
    status: "pending",
    link: "/projects/mobile-app/milestones/beta",
  },
  {
    id: "milestone-3",
    name: "User Testing Phase",
    dueDate: createContextualDate("2024-03-10", "day"), // March 10, 2024
    status: "pending",
    link: "/projects/mobile-app/milestones/testing",
  },
  {
    id: "milestone-4",
    name: "Performance Optimization",
    dueDate: createContextualDate("2024-04-05", "day"), // April 5, 2024
    status: "pending",
    link: "/projects/mobile-app/milestones/performance",
  },
  {
    id: "milestone-5",
    name: "Code Review Process",
    dueDate: null,
    status: "pending",
    link: "/projects/mobile-app/milestones/code-review",
  },
  {
    id: "milestone-6",
    name: "Documentation Update",
    dueDate: null,
    status: "pending",
    link: "/projects/mobile-app/milestones/docs",
  },
];

// Status helpers for task activity mocks
const STATUS_NOT_STARTED: Status = {
  id: "not_started",
  value: "not_started",
  label: "Not started",
  color: "gray",
  icon: "circleDashed",
  index: 0,
};

const STATUS_IN_PROGRESS: Status = {
  id: "in_progress",
  value: "in_progress",
  label: "In progress",
  color: "blue",
  icon: "circleDot",
  index: 1,
};

const STATUS_DONE: Status = {
  id: "done",
  value: "done",
  label: "Done",
  color: "green",
  icon: "circleCheck",
  index: 2,
};

// Rich editor people need a title field and proper types
export const richEditorPeople = timelinePeople.map(p => ({
  ...p,
  title: "Team Member",
  avatarUrl: p.avatarUrl || null,
  profileLink: p.profileLink || ""
}));

// Mock search function for TaskPage assignees
export const searchTaskPeople = async ({ query }: { query: string }): Promise<TaskPage.Person[]> => {
  await new Promise((resolve) => setTimeout(resolve, 300)); // Simulate API delay
  return mockTaskPeople.filter((person) => person.fullName.toLowerCase().includes(query.toLowerCase()));
};

// Mock search function for TaskPage milestones - maintains earliest first sorting
export const searchMilestones = async ({ query }: { query: string }): Promise<TaskPage.Milestone[]> => {
  await new Promise((resolve) => setTimeout(resolve, 300)); // Simulate API delay

  const filtered = mockMilestones.filter((milestone) => milestone.name.toLowerCase().includes(query.toLowerCase()));

  // Sort by due date (earliest first), then by title for those without due dates
  return filtered.sort((a, b) => {
    if (a.dueDate?.date && b.dueDate?.date) {
      return a.dueDate.date.getTime() - b.dueDate.date.getTime();
    }
    if (a.dueDate?.date && !b.dueDate?.date) return -1; // Items with due dates come first
    if (!a.dueDate?.date && b.dueDate?.date) return 1;
    return a.name.localeCompare(b.name); // Alphabetical for no due dates
  });
};

// Mock search function for RichEditor mentions
export const searchRichEditorPeople = async ({ query }: { query: string }) => {
  await new Promise((resolve) => setTimeout(resolve, 300)); // Simulate API delay
  return richEditorPeople.filter((person) => person.fullName.toLowerCase().includes(query.toLowerCase()));
};

// Mock mentioned person lookup function
export const mockMentionedPersonLookup = async (id: string) => {
  await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate API delay
  return richEditorPeople.find((person) => person.id === id) || null;
};

// Helper functions for creating timeline data
export function createComment(author: TimelinePerson, content: string, timeAgo: number): TimelineItemType {
  return {
    type: "comment",
    value: {
      id: `comment-${Date.now()}-${Math.random()}`,
      content: JSON.stringify({ message: content }),
      author,
      insertedAt: new Date(Date.now() - timeAgo).toISOString(),
      reactions: [],
    },
  };
}

export function createTaskActivity(
  type: TaskActivity["type"],
  author: TimelinePerson,
  timeAgo: number,
  extraData: any = {},
): TimelineItemType {
  return {
    type: "task-activity",
    value: {
      id: `activity-${Date.now()}-${Math.random()}`,
      type,
      author,
      insertedAt: new Date(Date.now() - timeAgo).toISOString(),
      ...extraData,
    } as TaskActivity,
  };
}

// Timeline data generators for different scenarios
export function createActiveTaskTimeline(): TimelineItemType[] {
  return [
    createComment(
      bob,
      "I've started working on the login component. Should have a first version ready by tomorrow.",
      30 * 60 * 1000,
    ), // 30 min ago
    createTaskActivity("task_status_updating", alice, 2 * 60 * 60 * 1000, {
      fromStatus: STATUS_NOT_STARTED,
      toStatus: STATUS_IN_PROGRESS,
      taskName: "Implement user authentication flow",
      page: "task",
    }), // 2 hours ago
    createTaskActivity("task_assignee_updating", alice, 3 * 60 * 60 * 1000, {
      assignee: bob,
      action: "assigned",
      taskName: "Implement user authentication flow",
      page: "task",
    }), // 3 hours ago
    createTaskActivity("task_milestone_updating", alice, 4 * 60 * 60 * 1000, {
      milestone: { id: "milestone-1", name: "Beta Release", dueDate: createContextualDate("2024-02-15", "day"), status: "pending" },
      action: "attached",
      taskName: "Implement user authentication flow",
      page: "task",
    }),
    createComment(alice, "This is a critical feature for the beta release. Let's prioritize it.", 6.5 * 60 * 60 * 1000),
    createTaskActivity("task_adding", alice, 24 * 60 * 60 * 1000), // 1 day ago
  ];
}

export function createMinimalTaskTimeline(): TimelineItemType[] {
  return [
    createTaskActivity("task_adding", alice, 2 * 60 * 60 * 1000, {
      taskName: "Review API documentation",
      page: "task",
    }), // 2 hours ago
  ];
}

export function createCompletedTaskTimeline(): TimelineItemType[] {
  return [
    createComment(alice, "Great work everyone! This turned out really well.", 30 * 60 * 1000),
    createTaskActivity("task_status_updating", bob, 60 * 60 * 1000, {
      fromStatus: STATUS_IN_PROGRESS,
      toStatus: STATUS_DONE,
      taskName: "Set up CI/CD pipeline",
      page: "task",
    }),
    createComment(bob, "All tests are passing and the feature is ready for release!", 2 * 60 * 60 * 1000),
    createComment(charlie, "The design looks perfect. Nice work on the animations!", 4 * 60 * 60 * 1000),
    createTaskActivity("task_assignee_updating", alice, 2 * 24 * 60 * 60 * 1000, {
      assignee: bob,
      action: "assigned",
      taskName: "Set up CI/CD pipeline",
      page: "task",
    }),
    createTaskActivity("task_adding", alice, 3 * 24 * 60 * 60 * 1000, {
      taskName: "Set up CI/CD pipeline",
      page: "task",
    }),
  ];
}

export function createOverdueTaskTimeline(): TimelineItemType[] {
  return [
    createComment(alice, "This is overdue. Can we get an update on the progress?", 60 * 60 * 1000),
    createTaskActivity("task_due_date_updating", alice, 3 * 24 * 60 * 60 * 1000, {
      fromDueDate: null,
      toDueDate: createContextualDate(new Date(Date.now() - 24 * 60 * 60 * 1000), "day"),
      taskName: "Fix critical security vulnerability",
      page: "task",
    }),
    createTaskActivity("task_assignee_updating", alice, 5 * 24 * 60 * 60 * 1000, {
      assignee: charlie,
      action: "assigned",
      taskName: "Fix critical security vulnerability",
      page: "task",
    }),
    createTaskActivity("task_adding", alice, 7 * 24 * 60 * 60 * 1000, {
      taskName: "Fix critical security vulnerability",
      page: "task",
    }),
  ];
}

export function createLongContentTimeline(): TimelineItemType[] {
  return [
    createComment(
      diana,
      "I've tested this thoroughly and everything works as expected. The error handling is particularly robust.",
      30 * 60 * 1000,
    ),
    createComment(
      charlie,
      "The UI looks great! I made some small adjustments to the spacing and colors to match our design system.",
      2 * 60 * 60 * 1000,
    ),
    createComment(
      bob,
      "I've implemented all the requirements from the spec. The authentication flow now supports both email/password and social login.",
      4 * 60 * 60 * 1000,
    ),
    createTaskActivity("task_description_change", alice, 6 * 60 * 60 * 1000, {
      hasContent: true,
      taskName: "Long content task",
      page: "task",
    }),
    createTaskActivity("task_status_updating", bob, 8 * 60 * 60 * 1000, {
      fromStatus: STATUS_NOT_STARTED,
      toStatus: STATUS_IN_PROGRESS,
      taskName: "Long content task",
      page: "task",
    }),
    createTaskActivity("task_assignee_updating", alice, 12 * 60 * 60 * 1000, {
      assignee: bob,
      action: "assigned",
      taskName: "Long content task",
      page: "task",
    }),
    createTaskActivity("task_adding", alice, 24 * 60 * 60 * 1000, {
      taskName: "Long content task",
      page: "task",
    }),
  ];
}
