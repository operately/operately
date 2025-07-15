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
    initialType: {
      control: "select",
      options: ["exact", "month", "quarter", "year"],
      description: "The initial date type selected",
    },
    initialDate: {
      control: "text",
      description: "Initial selected date in YYYY-MM-DD format (for exact date type)",
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
    initialType: "exact",
    initialDate: new Date(),
  },
  parameters: {
    layout: 'padded',
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
    initialType: "month",
    initialDate: new Date("2025-03-31"),
  },
  parameters: {
    layout: 'padded',
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
    initialType: "quarter",
    initialDate: new Date("2026-09-30"),
  },
  parameters: {
    layout: 'padded',
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
    initialType: "year",
    initialDate: new Date("2024-12-31"),
  },
  parameters: {
    layout: 'padded',
  },
};
