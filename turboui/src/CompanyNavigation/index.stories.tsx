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

export const WithHomePage: Story = {
  args: defaultProps,
  render: () => (
    <div className="flex flex-col h-screen">
      <CompanyNavigation {...defaultProps} />
      <div className="relative flex-1 min-h-0 overflow-y-auto">
        <HomePage {...homePageProps} />
      </div>
    </div>
  ),
};
