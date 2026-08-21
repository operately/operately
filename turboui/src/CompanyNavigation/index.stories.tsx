import type { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";
import { MemoryRouter } from "react-router";

import { CompanyNavigation } from "./index";
import { defaultProps } from "./mockData";

const meta = {
  title: "Components/CompanyNavigation",
  component: CompanyNavigation,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
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
