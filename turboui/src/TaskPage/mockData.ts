import { TaskPage } from "./index";
import { TaskActivity } from "../Timeline";
import type { TimelineItem as TimelineItemType } from "../Timeline/types";
import { Person as TimelinePerson } from "../CommentSection/types";
import { createContextualDate } from "../DateField/mockData";

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

// Helper function to convert text to rich content JSON format
export function asRichText(content: string): any {
  return {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: content,
          },
        ],
      },
    ],
  };
}

// Helper function for complex rich content with lists
export function asRichTextWithList(paragraphs: string[], listItems: string[]): any {
  const content: any[] = [];

  // Add paragraphs
  paragraphs.forEach((text) => {
    content.push({
      type: "paragraph",
      content: [{ type: "text", text }],
    });
  });

  // Add bullet list
  if (listItems.length > 0) {
    content.push({
      type: "bulletList",
      content: listItems.map((item) => ({
        type: "listItem",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: item }],
          },
        ],
      })),
    });
  }

  return {
    type: "doc",
    content,
  };
}

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
      fromStatus: "not_started",
      toStatus: "in_progress",
    }), // 2 hours ago
    createTaskActivity("task_assignee_updating", alice, 3 * 60 * 60 * 1000, { assignee: bob, action: "assigned" }), // 3 hours ago
    createTaskActivity("task_milestone_updating", alice, 4 * 60 * 60 * 1000, {
      milestone: { id: "milestone-1", title: "Beta Release", status: "pending" },
      action: "attached",
    }),
    createComment(alice, "This is a critical feature for the beta release. Let's prioritize it.", 6.5 * 60 * 60 * 1000),
    createTaskActivity("task_adding", alice, 24 * 60 * 60 * 1000), // 1 day ago
  ];
}

export function createMinimalTaskTimeline(): TimelineItemType[] {
  return [
    createTaskActivity("task_adding", alice, 2 * 60 * 60 * 1000), // 2 hours ago
  ];
}

export function createCompletedTaskTimeline(): TimelineItemType[] {
  return [
    createComment(alice, "Great work everyone! This turned out really well.", 30 * 60 * 1000),
    createTaskActivity("task_status_updating", bob, 60 * 60 * 1000, { fromStatus: "in_progress", toStatus: "done" }),
    createComment(bob, "All tests are passing and the feature is ready for release!", 2 * 60 * 60 * 1000),
    createComment(charlie, "The design looks perfect. Nice work on the animations!", 4 * 60 * 60 * 1000),
    createTaskActivity("task_assignee_updating", alice, 2 * 24 * 60 * 60 * 1000, { assignee: bob, action: "assigned" }),
    createTaskActivity("task_adding", alice, 3 * 24 * 60 * 60 * 1000),
  ];
}

export function createOverdueTaskTimeline(): TimelineItemType[] {
  return [
    createComment(alice, "This is overdue. Can we get an update on the progress?", 60 * 60 * 1000),
    createTaskActivity("task_due_date_updating", alice, 3 * 24 * 60 * 60 * 1000, {
      fromDueDate: null,
      toDueDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    }),
    createTaskActivity("task_assignee_updating", alice, 5 * 24 * 60 * 60 * 1000, { assignee: charlie, action: "assigned" }),
    createTaskActivity("task_adding", alice, 7 * 24 * 60 * 60 * 1000),
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
    createTaskActivity("task_description_change", alice, 6 * 60 * 60 * 1000, { hasContent: true }),
    createTaskActivity("task_status_updating", bob, 8 * 60 * 60 * 1000, { fromStatus: "todo", toStatus: "in_progress" }),
    createTaskActivity("task_assignee_updating", alice, 12 * 60 * 60 * 1000, { assignee: bob, action: "assigned" }),
    createTaskActivity("task_adding", alice, 24 * 60 * 60 * 1000),
  ];
}