import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { CommentSection } from "./CommentSection";
import { CommentFormState, CommentItem, Person } from "./types";
import { Page } from "../Page";

const meta: Meta<typeof CommentSection> = {
  title: "Components/CommentSection",
  component: CommentSection,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <Page title="Task Comments" size="medium">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Discussion</h2>
          <Story />
        </div>
      </Page>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof CommentSection>;

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

const mockComment: CommentItem = {
  type: "comment",
  value: {
    id: "comment-1",
    content: JSON.stringify({ message: "This is a sample comment with some content." }),
    author: mockAuthor,
    insertedAt: new Date().toISOString(),
    reactions: [
      { id: "1", emoji: "👍", count: 3, reacted: false },
      { id: "2", emoji: "❤️", count: 1, reacted: true },
    ],
  },
};

const mockMilestoneActivity: CommentItem = {
  type: "milestone-completed",
  value: {
    id: "activity-1",
    type: "milestone-completed",
    author: mockAuthor,
    insertedAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
  },
};

const mockAcknowledgment: CommentItem = {
  type: "acknowledgment",
  value: mockAuthor,
  insertedAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
};

const createMockForm = (items: CommentItem[]): CommentFormState => ({
  items,
  submitting: false,
  mentionSearchScope: null,
  postComment: (content: any) => {
    console.log("Post comment:", content);
  },
  editComment: (id: string, content: any) => {
    console.log("Edit comment:", id, content);
  },
});

export const Default: Story = {
  args: {
    form: createMockForm([mockComment]),
    commentParentType: "goal",
    canComment: true,
    currentUser: mockUser,
  },
};

export const WithMultipleComments: Story = {
  args: {
    form: createMockForm([
      mockComment,
      {
        type: "comment",
        value: {
          ...mockComment.value,
          id: "comment-2",
          content: JSON.stringify({ message: "This is another comment from a different user." }),
          author: mockUser,
          insertedAt: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
        },
      },
    ]),
    commentParentType: "goal",
    canComment: true,
    currentUser: mockUser,
  },
};

export const WithMixedContent: Story = {
  args: {
    form: createMockForm([
      mockMilestoneActivity,
      mockComment,
      mockAcknowledgment,
      {
        type: "milestone-reopened",
        value: {
          id: "activity-2",
          type: "milestone-reopened",
          author: mockUser,
          insertedAt: new Date(Date.now() - 900000).toISOString(), // 15 min ago
        },
      },
    ]),
    commentParentType: "goal",
    canComment: true,
    currentUser: mockUser,
  },
};

export const ReadOnly: Story = {
  args: {
    form: createMockForm([mockComment, mockMilestoneActivity]),
    commentParentType: "goal",
    canComment: false,
    currentUser: mockUser,
  },
};

export const EmptyState: Story = {
  args: {
    form: createMockForm([]),
    commentParentType: "goal",
    canComment: true,
    currentUser: mockUser,
  },
};

export const Loading: Story = {
  args: {
    form: {
      ...createMockForm([mockComment]),
      submitting: true,
    },
    commentParentType: "goal",
    canComment: true,
    currentUser: mockUser,
  },
};
