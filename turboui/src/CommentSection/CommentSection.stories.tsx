import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { Page } from "../Page";
import { asRichText } from "../utils/storybook/richContent";
import { createMockRichEditorHandlers } from "../utils/storybook/richEditor";
import { defaultFormattedTimePreferences } from "../utils/storybook/formattedTime";
import { CommentSection } from "./CommentSection";
import type { CommentSectionItem, CommentSectionProps, Person } from "./types";

const meta: Meta<typeof CommentSection> = {
  title: "Components/CommentSection",
  component: CommentSection,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <Page title="Comment Section" size="medium">
        <div className="p-6">
          <h2 className="font-bold mb-4">Comments</h2>
          <Story />
        </div>
      </Page>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof CommentSection>;

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

const commentItem: CommentSectionItem = {
  type: "comment",
  value: {
    id: "comment-1",
    content: JSON.stringify(asRichText("This looks great! I think we should also consider the mobile experience.")),
    author: mockAuthor,
    insertedAt: new Date(Date.now() - 1800000).toISOString(),
    reactions: [
      { id: "reaction-1", emoji: "👍", person: mockUser },
      { id: "reaction-2", emoji: "🎉", person: mockAuthor },
    ],
  },
};

const acknowledgmentItem: CommentSectionItem = {
  type: "acknowledgment",
  value: mockUser,
  insertedAt: new Date(Date.now() - 900000).toISOString(),
};

const milestoneCompletedItem: CommentSectionItem = {
  type: "milestone-completed",
  value: {
    id: "milestone-activity-1",
    type: "milestone-completed",
    author: mockAuthor,
    insertedAt: new Date(Date.now() - 600000).toISOString(),
  },
};

const milestoneReopenedItem: CommentSectionItem = {
  type: "milestone-reopened",
  value: {
    id: "milestone-activity-2",
    type: "milestone-reopened",
    author: mockUser,
    insertedAt: new Date(Date.now() - 300000).toISOString(),
  },
};

function InteractiveCommentSection({ items: initialItems, ...props }: Partial<CommentSectionProps>) {
  const [items, setItems] = React.useState<CommentSectionItem[]>(initialItems ?? [commentItem]);

  return (
    <CommentSection
      currentUser={mockUser}
      canComment
      onAddComment={async (content) => {
        setItems((prev) => [
          ...prev,
          {
            type: "comment",
            value: {
              id: `comment-${Date.now()}`,
              content: JSON.stringify(content),
              author: mockUser,
              insertedAt: new Date().toISOString(),
              reactions: [],
            },
          },
        ]);
        return true;
      }}
      onEditComment={async (id, content) => {
        setItems((prev) =>
          prev.map((item) => {
            if (item.type !== "comment" || item.value.id !== id) return item;
            return { ...item, value: { ...item.value, content: JSON.stringify(content) } };
          }),
        );
        return true;
      }}
      onDeleteComment={async (id) => {
        setItems((prev) => prev.filter((item) => !(item.type === "comment" && item.value.id === id)));
      }}
      onAddReaction={fn()}
      onRemoveReaction={fn()}
      richTextHandlers={createMockRichEditorHandlers()}
      formattedTimePreferences={defaultFormattedTimePreferences}
      {...props}
      items={items}
    />
  );
}

export const Empty: Story = {
  render: () => <InteractiveCommentSection items={[]} />,
};

export const WithComments: Story = {
  render: () => <InteractiveCommentSection items={[commentItem]} />,
};

export const WithAckAndMilestoneRows: Story = {
  render: () => (
    <InteractiveCommentSection
      items={[commentItem, acknowledgmentItem, milestoneCompletedItem, milestoneReopenedItem]}
      ackLabel="Retrospective"
    />
  ),
};

export const CannotComment: Story = {
  render: () => <InteractiveCommentSection items={[commentItem]} canComment={false} />,
};
