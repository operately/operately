import type { Meta, StoryObj } from "@storybook/react-vite";
import React, { useState } from "react";

import { NotificationToggle } from "./index";

const meta: Meta<typeof NotificationToggle> = {
  title: "Components/NotificationToggle",
  component: NotificationToggle,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    entityType: {
      control: { type: "text" },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => {
    const [isSubscribed, setIsSubscribed] = useState(true);

    return (
      <div className="w-64">
        <NotificationToggle
          isSubscribed={isSubscribed}
          onToggle={setIsSubscribed}
          entityType={args.entityType || "task"}
        />
      </div>
    );
  },
  args: {
    entityType: "task",
  },
};
