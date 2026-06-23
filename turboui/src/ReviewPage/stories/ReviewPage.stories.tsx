import React from "react";

import type { Meta, StoryObj } from "@storybook/react";

import { ReviewPage } from "../index";
import * as data from "./mockData";
import { defaultFormattedTimePreferences } from "../../utils/storybook/formattedTime";

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
    dueSoon: { control: "object" },
    needsReview: { control: "object" },
    upcoming: { control: "object" },
  },
  args: {
    formattedTimePreferences: defaultFormattedTimePreferences,
  },
} satisfies Meta<typeof ReviewPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => <ReviewPage {...args} />,
  args: {
    dueSoon: data.dueSoonGroups,
    needsReview: data.reviewGroups,
    upcoming: [],
  },
};

export const SmallPlate: Story = {
  render: (args) => <ReviewPage {...args} />,
  args: {
    dueSoon: data.smallPlateDueSoonGroups,
    needsReview: data.smallPlateReviewGroups,
    upcoming: [],
  },
};

export const OnlyTasks: Story = {
  render: (args) => <ReviewPage {...args} />,
  args: {
    dueSoon: data.taskOnlyDueSoonGroups,
    needsReview: [],
    upcoming: [],
  },
};

export const Empty: Story = {
  render: (args) => <ReviewPage {...args} />,
  args: {
    dueSoon: [],
    needsReview: [],
    upcoming: [],
  },
};

export const WithUpcoming: Story = {
  render: (args) => <ReviewPage {...args} />,
  args: {
    dueSoon: data.dueSoonGroups,
    needsReview: data.reviewGroups,
    upcoming: data.upcomingGroups,
  },
};
