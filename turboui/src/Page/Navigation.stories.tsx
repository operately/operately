import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Navigation } from "./Navigation";

const meta = {
  title: "Components/Page/Navigation",
  component: Navigation,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <div className="mx-auto" style={{ marginTop: "300px" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Navigation>;

export default meta;
type Story = StoryObj<typeof Navigation>;

export const SingleItem: Story = {
  args: {
    items: [{ to: "/projects", label: "Projects" }],
  },
  render: (args) => (
    <div className="max-w-4xl mx-auto">
      <Navigation {...args} />
    </div>
  ),
};

export const MultipleItems: Story = {
  args: {
    items: [
      { to: "/projects", label: "Projects" },
      { to: "/tasks", label: "Tasks" },
      { to: "/documents", label: "Documents" },
    ],
  },
  render: (args) => (
    <div className="max-w-4xl mx-auto">
      <Navigation {...args} />
    </div>
  ),
};

export const HiddenItems: Story = {
  args: {
    items: [
      { to: "/dashboard", label: "Dashboard" },
      { to: "/projects", label: "Projects" },
      { to: "/projects/123", label: "Onboard Peter to the Customer Portal" },
      { to: "/tasks", label: "Tasks" },
      { to: "/documents", label: "Documents" },
      { to: "/analytics", label: "Analytics" },
      { to: "/settings", label: "Settings" },
      { to: "/profile", label: "Profile" },
      { to: "/help", label: "Help" },
    ],
  },
  render: (args) => (
    <div className="flex flex-col items-center space-y-4">
      <div className="max-w-xl mx-auto">
        <Navigation {...args} />
      </div>
      <div className="max-w-2xl mx-auto">
        <Navigation {...args} />
      </div>
      <div className="max-w-3xl mx-auto">
        <Navigation {...args} />
      </div>
    </div>
  ),
};
