import type { Meta, StoryObj } from "@storybook/react-vite";

import { defaultFormattedTimePreferences } from "../FormattedTime";
import { PostedTime } from "./PostedTime";

const meta = {
  title: "Components/CheckInHeader/PostedTime",
  component: PostedTime,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof PostedTime>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TwelveHour: Story = {
  args: {
    time: "2025-07-13T18:42:00Z",
    formattedTimePreferences: {
      ...defaultFormattedTimePreferences,
      timezone: "America/Sao_Paulo",
      timeFormat: "hour_12",
    },
  },
};

export const TwentyFourHour: Story = {
  args: {
    time: "2025-07-13T18:42:00Z",
    formattedTimePreferences: {
      ...defaultFormattedTimePreferences,
      timezone: "America/Sao_Paulo",
      timeFormat: "hour_24",
    },
  },
};
