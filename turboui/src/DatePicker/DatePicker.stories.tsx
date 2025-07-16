import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { DatePicker } from "./index";

/**
 * DatePicker is a component that allows users to select dates in various formats:
 * specific date, month, quarter, semester, or year.
 */
const meta = {
  title: "Components/DatePicker",
  component: DatePicker,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    initialDate: {
      control: "object",
      description: "ContextualDate object containing date, dateType, and value",
    },
    readonly: {
      control: "boolean",
      description: "Whether the DatePicker is in readonly mode",
    },
    triggerLabel: {
      control: "text",
      description: "Label to show when no date is selected",
    },
    showOverdueWarning: {
      control: "boolean",
      description: "Whether to show a warning color for overdue dates",
    },
    onDateSelect: { action: "date selected" },
    onCancel: { action: "canceled" },
  },
} satisfies Meta<typeof DatePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default view of the DatePicker with specific date selection.
 */
export const Default: Story = {
  tags: ["autodocs"],
  render: (args) => (
    <div className="max-w-md mx-auto bg-white p-4 mt-12">
      <div className="mt-6">
        <DatePicker {...args} />
      </div>
    </div>
  ),
  args: {
    initialDate: {
      date: new Date(),
      dateType: "day",
      value: new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(new Date()),
    },
    readonly: false,
  },
  parameters: {
    layout: "padded",
  },
};

/**
 * DatePicker showing month selection.
 */
export const MonthSelection: Story = {
  tags: ["autodocs"],
  render: (args) => (
    <div className="max-w-md mx-auto bg-white p-4 mt-12">
      <div className="mt-6">
        <DatePicker {...args} />
      </div>
    </div>
  ),
  args: {
    initialDate: {
      date: new Date("2025-03-31"),
      dateType: "month",
      value: new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short" }).format(new Date("2025-03-31")),
    },
    readonly: false,
  },
  parameters: {
    layout: "padded",
  },
};

/**
 * DatePicker showing quarter selection.
 */
export const QuarterSelection: Story = {
  tags: ["autodocs"],
  render: (args) => (
    <div className="max-w-md mx-auto bg-white p-4 mt-12">
      <div className="mt-6">
        <DatePicker {...args} />
      </div>
    </div>
  ),
  args: {
    initialDate: {
      date: new Date("2026-09-30"),
      dateType: "quarter",
      value: `Q${Math.floor(new Date("2026-09-30").getMonth() / 3) + 1} ${new Date("2026-09-30").getFullYear()}`,
    },
    readonly: false,
  },
  parameters: {
    layout: "padded",
  },
};

/**
 * DatePicker showing year selection.
 */
export const YearSelection: Story = {
  tags: ["autodocs"],
  render: (args) => (
    <div className="max-w-md mx-auto bg-white p-4 mt-12">
      <div className="mt-6">
        <DatePicker {...args} />
      </div>
    </div>
  ),
  args: {
    initialDate: {
      date: new Date("2024-12-31"),
      dateType: "year",
      value: new Date("2024-12-31").getFullYear().toString(),
    },
    readonly: false,
  },
  parameters: {
    layout: "padded",
  },
};

/**
 * DatePicker showing an overdue date with warning.
 */
export const OverdueDate: Story = {
  tags: ["autodocs"],
  render: (args) => (
    <div className="max-w-md mx-auto bg-white p-4 mt-12">
      <div className="mt-6">
        <DatePicker {...args} />
      </div>
    </div>
  ),
  args: {
    initialDate: {
      date: new Date("2025-01-15"), // Date in the past (since current date is 2025-07-16)
      dateType: "day",
      value: new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(
        new Date("2025-01-15"),
      ),
    },
    showOverdueWarning: true,
  },
  parameters: {
    layout: "padded",
  },
};

/**
 * DatePicker in readonly mode, showing a date without allowing interaction.
 */
export const ReadOnly: Story = {
  tags: ["autodocs"],
  render: (args) => (
    <div className="max-w-md mx-auto bg-white p-4 mt-12">
      <div className="mt-6">
        <DatePicker {...args} />
      </div>
    </div>
  ),
  args: {
    initialDate: {
      date: new Date("2025-07-16"),
      dateType: "day",
      value: new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(
        new Date("2025-07-16"),
      ),
    },
    readonly: true,
  },
  parameters: {
    layout: "padded",
  },
};
