import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Timeline } from "./Timeline";
import { TimelineProps, TimelineItem, TaskActivity } from "./types";
import { Person } from "../CommentSection/types";
import { Page } from "../Page";
import { createMockRichEditorHandlers } from "../utils/storybook/richEditor";

const meta: Meta<typeof Timeline> = {
  title: "Components/Timeline",
  component: Timeline,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <Page title="Task Timeline" size="medium">
        <div className="p-6">
          <h2 className="font-bold mb-4">Comments & Activity</h2>
          <Story />
        </div>
      </Page>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Timeline>;

// Mock data
const mockUser: Person = {
  id: "1",
  fullName: "John Doe",
  avatarUrl: "https://i.pravatar.cc/150?img=1",
  profileLink: "/people/john-doe",
};

const mockAuthor: Person = {
  id: "2",
  fullName: "Jane Smith",
  avatarUrl: "https://i.pravatar.cc/150?img=2",
  profileLink: "/people/jane-smith",
};

const mockAssignee: Person = {
  id: "3",
  fullName: "Bob Wilson",
  avatarUrl: "https://i.pravatar.cc/150?img=3",
  profileLink: "/people/bob-wilson",
};

const mockComment: TimelineItem = {
  type: "comment",
  value: {
    id: "comment-1",
    content: JSON.stringify({ message: "This looks great! I think we should also consider the mobile experience." }),
    author: mockAuthor,
    insertedAt: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
    reactions: [
      { id: "reaction-1", emoji: "👍", person: mockUser },
      { id: "reaction-2", emoji: "🎉", person: mockAuthor },
      { id: "reaction-3", emoji: "👍", person: mockAssignee },
    ],
  },
};

const mockTaskAssignment: TimelineItem = {
  type: "task-activity",
  value: {
    id: "activity-1",
    type: "task_assignee_updating",
    author: mockAuthor,
    insertedAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    assignee: mockAssignee,
    action: "assigned",
  } as TaskActivity,
};

const mockStatusChange: TimelineItem = {
  type: "task-activity",
  value: {
    id: "activity-2",
    type: "task_status_updating",
    author: mockUser,
    insertedAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    fromStatus: {
      id: "todo",
      value: "todo",
      label: "Todo",
      color: "gray",
      icon: "circleDashed",
      index: 0,
      closed: false,
    },
    toStatus: {
      id: "in_progress",
      value: "in_progress",
      label: "In progress",
      color: "blue",
      icon: "circleDot",
      index: 1,
      closed: false,
    },
    taskName: "Implement status selector",
    page: "task",
  } as TaskActivity,
};

const mockMilestoneAttachment: TimelineItem = {
  type: "task-activity",
  value: {
    id: "activity-3",
    type: "task_milestone_updating",
    author: mockAuthor,
    insertedAt: new Date(Date.now() - 10800000).toISOString(), // 3 hours ago
    milestone: {
      id: "milestone-1",
      name: "Beta Release",
      dueDate: {
        date: new Date("2024-02-15"),
        dateType: "day",
        value: "Feb 15, 2024",
      },
      status: "pending",
    },
    action: "attached",
  } as TaskActivity,
};

const mockPriorityChange: TimelineItem = {
  type: "task-activity",
  value: {
    id: "activity-4",
    type: "task-priority",
    author: mockUser,
    insertedAt: new Date(Date.now() - 14400000).toISOString(), // 4 hours ago
    fromPriority: "normal",
    toPriority: "high",
  } as TaskActivity,
};

const mockDueDateChange: TimelineItem = {
  type: "task-activity",
  value: {
    id: "activity-5",
    type: "task_due_date_updating",
    author: mockAuthor,
    insertedAt: new Date(Date.now() - 18000000).toISOString(), // 5 hours ago
    fromDueDate: null,
    toDueDate: {
      date: new Date("2024-01-30"),
      dateType: "day",
      value: "Jan 30, 2024"
    },
  } as TaskActivity,
};

const mockTaskCreation: TimelineItem = {
  type: "task-activity",
  value: {
    id: "activity-6",
    type: "task_adding",
    author: mockUser,
    insertedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
  } as TaskActivity,
};

const createMockProps = (items: TimelineItem[]): TimelineProps => ({
  items,
  currentUser: mockUser,
  canComment: true,
  commentParentType: "task",
  onAddComment: (content: any) => {
    console.log("Add comment:", content);
  },
  onEditComment: (id: string, content: any) => {
    console.log("Edit comment:", id, content);
  },
  onDeleteComment: (id: string) => {
    console.log("Delete comment:", id);
  },
  onAddReaction: (commentId: string, emoji: string) => {
    console.log("Add reaction:", commentId, emoji);
  },
  onRemoveReaction: (commentId: string, reactionId: string) => {
    console.log("Remove reaction:", commentId, reactionId);
  },
  richTextHandlers: createMockRichEditorHandlers(),
});

export const Default: Story = {
  args: createMockProps([mockComment, mockTaskAssignment, mockStatusChange]),
};

export const FullTimeline: Story = {
  args: createMockProps([
    mockComment,
    mockTaskAssignment,
    mockStatusChange,
    mockMilestoneAttachment,
    mockPriorityChange,
    mockDueDateChange,
    mockTaskCreation,
  ]),
};

export const CommentsOnly: Story = {
  args: {
    ...createMockProps([
      mockComment,
      {
        type: "comment",
        value: {
          ...mockComment.value,
          id: "comment-2",
          content: JSON.stringify({ message: "I agree! The mobile UX is crucial for this feature." }),
          author: mockUser,
          insertedAt: new Date(Date.now() - 900000).toISOString(), // 15 min ago
        },
      },
    ]),
    filters: {
      showComments: true,
      showActivities: false,
    },
  },
};

export const ActivitiesOnly: Story = {
  args: {
    ...createMockProps([mockTaskAssignment, mockStatusChange, mockMilestoneAttachment, mockPriorityChange]),
    filters: {
      showComments: false,
      showActivities: true,
    },
  },
};

export const EmptyTimeline: Story = {
  args: createMockProps([]),
};

export const ReadOnly: Story = {
  args: {
    ...createMockProps([mockComment, mockTaskAssignment, mockStatusChange]),
    canComment: false,
  },
};
