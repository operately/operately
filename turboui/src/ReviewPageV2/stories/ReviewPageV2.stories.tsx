import React from "react";

import type { Meta, StoryObj } from "@storybook/react";

import { ReviewPageV2 } from "../index";
import * as data from "./mockData";

const meta = {
  title: "Pages/ReviewPageV2",
  component: ReviewPageV2,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <div className="sm:mt-10">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    assignments: { control: "object" },
    assignmentsCount: { control: "number" },
  },
} satisfies Meta<typeof ReviewPageV2>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => <ReviewPageV2 {...args} />,
  args: {
    assignments: [...data.dueSoonAssignments, ...data.reviewAssignments],
    showUpcomingSection: false,
  },
};

export const SmallPlate: Story = {
  render: (args) => <ReviewPageV2 {...args} />,
  args: {
    assignments: [...data.smallPlateDueSoon, ...data.smallPlateReview],
    showUpcomingSection: false,
  },
};

export const OnlyTasks: Story = {
  render: (args) => <ReviewPageV2 {...args} />,
  args: {
    assignments: data.taskOnlyDueSoon,
    showUpcomingSection: false,
  },
};

export const Empty: Story = {
  render: (args) => <ReviewPageV2 {...args} />,
  args: {
    assignments: data.emptyStateAssignments,
  },
};

export const MyUpcomingWorkWIP: Story = {
  render: (args) => <ReviewPageV2 {...args} />,
  args: {
    assignments: data.upcomingAssignments,
  },
};
