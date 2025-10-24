import React from "react";

import type { Meta, StoryObj } from "@storybook/react";

import { ReviewPage } from "../index";
import * as data from "./mockData";

const meta = {
  title: "Pages/ReviewPage",
  component: ReviewPage,
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
} satisfies Meta<typeof ReviewPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => <ReviewPage {...args} />,
  args: {
    assignments: [...data.dueSoonAssignments, ...data.reviewAssignments],
    showUpcomingSection: false,
  },
};

export const SmallPlate: Story = {
  render: (args) => <ReviewPage {...args} />,
  args: {
    assignments: [...data.smallPlateDueSoon, ...data.smallPlateReview],
    showUpcomingSection: false,
  },
};

export const OnlyTasks: Story = {
  render: (args) => <ReviewPage {...args} />,
  args: {
    assignments: data.taskOnlyDueSoon,
    showUpcomingSection: false,
  },
};

export const Empty: Story = {
  render: (args) => <ReviewPage {...args} />,
  args: {
    assignments: data.emptyStateAssignments,
  },
};

export const MyUpcomingWorkWIP: Story = {
  render: (args) => <ReviewPage {...args} />,
  args: {
    assignments: data.upcomingAssignments,
  },
};
