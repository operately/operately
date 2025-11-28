import { genPeople } from "../utils/storybook/genPeople";
import { asRichTextWithList } from "../utils/storybook/richContent";
import type { Status } from "../TaskBoard/types";

// Generate mock people for stories
export const mockPeople = genPeople(4);

// Shared status options for timeline task activities
const PENDING_STATUS: Status = {
  id: "pending",
  value: "pending",
  label: "Not started",
  icon: "circleDashed",
  color: "gray",
  index: 0,
  closed: false,
};

const IN_PROGRESS_STATUS: Status = {
  id: "in_progress",
  value: "in_progress",
  label: "In progress",
  icon: "circleDot",
  color: "blue",
  index: 1,
  closed: false,
};

const DONE_STATUS: Status = {
  id: "done",
  value: "done",
  label: "Done",
  icon: "circleCheck",
  color: "green",
  index: 2,
  closed: true,
};

// Mock timeline items shared across stories
export const createMockTimelineItems = (): any[] => [
  {
    type: "milestone-activity" as const,
    value: {
      id: "activity-1",
      author: mockPeople[1],
      insertedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      content: "created the milestone",
      type: "project_milestone_creation",
    },
  },
  {
    type: "milestone-activity" as const,
    value: {
      id: "activity-2",
      author: mockPeople[1],
      insertedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days ago
      content: "added a description",
      type: "milestone_description_updating",
    },
  },
  {
    type: "task-activity" as const,
    value: {
      id: "activity-3",
      type: "task_status_updating" as const,
      author: mockPeople[0],
      insertedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
      fromStatus: PENDING_STATUS,
      toStatus: DONE_STATUS,
      task: {
        id: "task-1",
        title: "Implement user authentication",
        status: DONE_STATUS,
      },
    },
  },
  {
    type: "task-activity" as const,
    value: {
      id: "activity-4",
      type: "task_status_updating" as const,
      author: mockPeople[2],
      insertedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      fromStatus: PENDING_STATUS,
      toStatus: DONE_STATUS,
      task: {
        id: "task-4",
        title: "Add support for dark mode",
        status: DONE_STATUS,
      },
    },
  },
  {
    type: "comment" as const,
    value: {
      id: "comment-1",
      author: mockPeople[0],
      insertedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      content: JSON.stringify({ message: "Just wanted to update everyone on the progress. We're making good headway on the authentication system." }),
      reactions: [
        { id: "reaction-1", emoji: "👍", person: mockPeople[1] },
        { id: "reaction-2", emoji: "🎉", person: mockPeople[2] },
      ],
    },
  },
  {
    type: "milestone-activity" as const,
    value: {
      id: "activity-5",
      author: mockPeople[1],
      insertedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      content: "Milestone status changed to In Progress",
      type: "milestone_update",
    },
  },
  {
    type: "comment" as const,
    value: {
      id: "comment-3",
      author: mockPeople[2],
      insertedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
      content: JSON.stringify({ message: "The dark mode implementation is looking great! Should be ready for review tomorrow." }),
      reactions: [
        { id: "reaction-3", emoji: "🔥", person: mockPeople[3] },
      ],
    },
  },
  {
    type: "task-activity" as const,
    value: {
      id: "activity-6",
      type: "task_status_updating" as const,
      author: mockPeople[0],
      insertedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
      fromStatus: IN_PROGRESS_STATUS,
      toStatus: DONE_STATUS,
      task: {
        id: "task-6",
        title: "Create presentation for stakeholders",
        status: DONE_STATUS,
      },
    },
  },
];

// Mock description content shared across stories
export const mockDescription = asRichTextWithList(
  [
    "This milestone represents our Q2 feature release, focusing on core user experience improvements and new functionality. The main goals include:",
  ],
  [
    "Implement robust user authentication system",
    "Add dark mode support across the application",
    "Improve navigation and user profile functionality",
  ],
  [
    "We expect this release to significantly improve user engagement and provide a foundation for future feature development.",
  ],
);

// Mock search function for people
export const mockSearchPeople = async ({ query }: { query: string }) => {
  await new Promise((resolve) => setTimeout(resolve, 300)); // Simulate API delay
  return mockPeople.filter((person) => person.fullName.toLowerCase().includes(query.toLowerCase()));
};
