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

const longCompanyName = "Nexus Global Manufacturing Group";

/** Company names longer than 24 characters are truncated in the navbar. */
export const LongCompanyName: Story = {
  args: {
    ...defaultProps,
    companyName: longCompanyName,
  },
};

/**
 * Prototype of the "instance is outdated" badge. Shown when
 * `showCurrentVersion` is set.
 */
export const UpdateAvailable: Story = {
  args: {
    ...defaultProps,
    showCurrentVersion: true,
    availableUpdate: { version: "v1.8" },
  },
};

export const UpdateAvailableLongCompanyName: Story = {
  args: {
    ...defaultProps,
    companyName: longCompanyName,
    showCurrentVersion: true,
    availableUpdate: { version: "v1.10.2" },
  },
};
