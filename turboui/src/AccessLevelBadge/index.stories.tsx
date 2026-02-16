import React from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { AccessLevelBadge } from ".";

const meta = {
  title: "Components/AccessLevelBadge",
  component: AccessLevelBadge,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof AccessLevelBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllLevels: Story = {
  args: {
    accessLevel: 100,
  },
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <span className="w-32 text-sm font-medium">Full Access:</span>
        <AccessLevelBadge accessLevel={100} />
      </div>
      <div className="flex items-center gap-4">
        <span className="w-32 text-sm font-medium">Admin:</span>
        <AccessLevelBadge accessLevel={90} />
      </div>
      <div className="flex items-center gap-4">
        <span className="w-32 text-sm font-medium">Edit Access:</span>
        <AccessLevelBadge accessLevel={70} />
      </div>
      <div className="flex items-center gap-4">
        <span className="w-32 text-sm font-medium">Comment Access:</span>
        <AccessLevelBadge accessLevel={40} />
      </div>
      <div className="flex items-center gap-4">
        <span className="w-32 text-sm font-medium">View Access:</span>
        <AccessLevelBadge accessLevel={10} />
      </div>
    </div>
  ),
};

export const FullAccess: Story = {
  args: {
    accessLevel: 100,
  },
};

export const Admin: Story = {
  args: {
    accessLevel: 90,
  },
};

export const EditAccess: Story = {
  args: {
    accessLevel: 70,
  },
};

export const CommentAccess: Story = {
  args: {
    accessLevel: 40,
  },
};

export const ViewAccess: Story = {
  args: {
    accessLevel: 10,
  },
};

export const Sizes: Story = {
  args: {
    accessLevel: 100,
  },
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <span className="w-20 text-sm font-medium">XS:</span>
        <AccessLevelBadge accessLevel={100} size="xs" />
      </div>
      <div className="flex items-center gap-4">
        <span className="w-20 text-sm font-medium">SM:</span>
        <AccessLevelBadge accessLevel={100} size="sm" />
      </div>
      <div className="flex items-center gap-4">
        <span className="w-20 text-sm font-medium">Base:</span>
        <AccessLevelBadge accessLevel={100} size="base" />
      </div>
    </div>
  ),
};
