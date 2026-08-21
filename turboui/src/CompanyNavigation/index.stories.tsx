import type { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";

import { HomePage } from "../HomePage";
import { defaultProps as homePageProps } from "../HomePage/mockData";
import { CompanyNavigation } from "./index";
import { defaultProps } from "./mockData";

const meta = {
  title: "Components/CompanyNavigation",
  component: CompanyNavigation,
  parameters: { layout: "fullscreen" },
  render: (args) => (
    <div className="flex flex-col h-screen">
      <CompanyNavigation {...args} />
      <div className="relative flex-1 min-h-0 overflow-y-auto">
        <HomePage {...homePageProps} />
      </div>
    </div>
  ),
} satisfies Meta<typeof CompanyNavigation>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: defaultProps,
};

export const ZeroCounts: Story = {
  args: {
    ...defaultProps,
    unreadNotificationCount: 0,
    reviewCount: 0,
  },
};

export const RestrictedPermissions: Story = {
  args: {
    ...defaultProps,
    canViewCompanyDirectory: false,
    canAddGoal: false,
    canAddProject: false,
    canAddSpace: false,
    canInvitePeople: false,
  },
};

/**
 * Prototype of the "instance is outdated" badge, in the spirit of Chrome's update
 * chip. Deciding whether an instance is behind the latest release is not wired up
 * yet, so the badge only appears when `availableUpdate` is passed in.
 */
export const UpdateAvailable: Story = {
  args: {
    ...defaultProps,
    availableUpdate: { version: "v1.8" },
  },
};

export const UpdateAvailableLongCompanyName: Story = {
  args: {
    ...defaultProps,
    companyName: "Nexus Global Manufacturing Group",
    availableUpdate: { version: "v1.10.2" },
  },
};

/** Same badge, shorter phrasing: "v1.8 available". */
export const VersionAvailable: Story = {
  args: {
    ...defaultProps,
    availableUpdate: { version: "v1.8", phrasing: "available" },
  },
};
