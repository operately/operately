import type { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";

import { defaultFormattedTimePreferences } from "../FormattedTime";
import { TimePicker, type TimePickerProps } from ".";

const meta: Meta<typeof TimePicker> = {
  title: "Components/Fields/TimePicker",
  component: TimePicker,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof TimePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

function InteractiveTimePicker(args: TimePickerProps) {
  const [value, setValue] = React.useState<Date | null>(args.value);

  return (
    <div className="w-48">
      <label id="storybook-time-label" className="mb-1.5 block text-sm font-medium text-content-dimmed">
        Publication time
      </label>
      <TimePicker {...args} value={value} onChange={setValue} ariaLabelledBy="storybook-time-label" />
    </div>
  );
}

export const Default: Story = {
  render: (args) => <InteractiveTimePicker {...args} />,
  args: {
    value: new Date(2026, 6, 14, 9, 0),
    ariaLabelledBy: "schedule-time-label",
    formattedTimePreferences: defaultFormattedTimePreferences,
  },
};

export const Empty: Story = {
  render: (args) => <InteractiveTimePicker {...args} />,
  args: {
    value: null,
    ariaLabelledBy: "schedule-time-label",
    placeholder: "Choose a publication time",
    formattedTimePreferences: defaultFormattedTimePreferences,
  },
};

export const Disabled: Story = {
  render: (args) => <InteractiveTimePicker {...args} />,
  args: {
    value: new Date(2026, 6, 14, 9, 0),
    ariaLabelledBy: "schedule-time-label",
    disabled: true,
    formattedTimePreferences: defaultFormattedTimePreferences,
  },
};
