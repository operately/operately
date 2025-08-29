import { genPeople } from "../utils/storybook/genPeople";

// Generate mock people for stories
export const mockPeople = genPeople(4);

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
      fromStatus: "pending" as const,
      toStatus: "done" as const,
      task: {
        id: "task-1",
        title: "Implement user authentication",
        status: "done" as const,
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
      fromStatus: "pending" as const,
      toStatus: "done" as const,
      task: {
        id: "task-4",
        title: "Add support for dark mode",
        status: "done" as const,
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
        { id: "reaction-1", emoji: "👍", count: 2, reacted: false },
        { id: "reaction-2", emoji: "🎉", count: 1, reacted: true },
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
        { id: "reaction-3", emoji: "🔥", count: 3, reacted: false },
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
      fromStatus: "in_progress" as const,
      toStatus: "done" as const,
      task: {
        id: "task-6",
        title: "Create presentation for stakeholders",
        status: "done" as const,
      },
    },
  },
];

// Mock description content shared across stories
export const mockDescription = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "This milestone represents our Q2 feature release, focusing on core user experience improvements and new functionality. The main goals include:",
        },
      ],
    },
    {
      type: "bulletList",
      content: [
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Implement robust user authentication system",
                },
              ],
            },
          ],
        },
        {
          type: "listItem", 
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Add dark mode support across the application",
                },
              ],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph", 
              content: [
                {
                  type: "text",
                  text: "Improve navigation and user profile functionality",
                },
              ],
            },
          ],
        },
      ],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "We expect this release to significantly improve user engagement and provide a foundation for future feature development.",
        },
      ],
    },
  ],
};

// Mock search function for people
export const mockSearchPeople = async ({ query }: { query: string }) => {
  await new Promise((resolve) => setTimeout(resolve, 300)); // Simulate API delay
  return mockPeople.filter((person) => person.fullName.toLowerCase().includes(query.toLowerCase()));
};