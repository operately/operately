import type { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";

import { SpaceTemplatesTool } from "./index";

const meta = {
  title: "Pages/SpaceTemplatesTool",
  component: SpaceTemplatesTool,
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <div className="text-xs w-full h-[380px] max-w-[340px] overflow-hidden border border-stroke-base bg-surface-base rounded-lg shadow-sm group">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SpaceTemplatesTool>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: { templates: [] },
};

export const Populated: Story = {
  args: {
    templates: [
      { id: "product-launch", name: "Product launch", milestoneCount: 3, taskCount: 12 },
      { id: "onboarding", name: "Customer onboarding", milestoneCount: 2, taskCount: 8 },
      { id: "hiring", name: "Hiring plan", milestoneCount: 1, taskCount: 6 },
    ],
  },
};
