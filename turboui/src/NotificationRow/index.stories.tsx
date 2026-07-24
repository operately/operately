import type { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";
import { defaultFormattedTimePreferences } from "../FormattedTime";
import { NotificationRow } from ".";

const meta = {
  title: "Components/NotificationRow",
  component: NotificationRow,
  parameters: {
    layout: "centered",
  },
  args: {
    author: {
      id: "person-1",
      fullName: "Ada Lovelace",
      avatarUrl: null,
    },
    title: "Updated the launch roadmap",
    location: "Launch project",
    insertedAt: "2026-07-23T12:00:00Z",
    formattedTimePreferences: defaultFormattedTimePreferences,
    read: false,
    testId: "notification-row",
    onOpen: () => console.log("open notification"),
    onMarkAsRead: () => console.log("mark notification as read"),
  },
  decorators: [
    (Story) => (
      <div className="w-[640px] p-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof NotificationRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unread: Story = {
  render: (args) => <InteractiveUnreadRow {...args} />,
};

export const Read: Story = {
  args: {
    read: true,
  },
};

function InteractiveUnreadRow(props: React.ComponentProps<typeof NotificationRow>) {
  const [read, setRead] = React.useState(false);

  return <NotificationRow {...props} read={read} onMarkAsRead={() => setRead(true)} />;
}
