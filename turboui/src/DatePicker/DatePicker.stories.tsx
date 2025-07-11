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
    initialDateType: {
      control: "select",
      options: ["exact", "month", "quarter", "semester", "year"],
      description: "The initial date type selected",
    },
    initialSelectedDate: {
      control: "text",
      description: "Initial selected date in YYYY-MM-DD format (for exact date type)",
    },
    initialSelectedYear: {
      control: "number",
      description: "Initial selected year",
    },
    initialSelectedPeriod: {
      control: "number",
      description: "Initial selected period (month, quarter, or semester)",
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
    <div className="max-w-md mx-auto bg-white p-4">
      <DatePicker {...args} />
    </div>
  ),
  args: {
    initialDateType: "exact",
    initialSelectedDate: new Date().toISOString().split("T")[0],
  },
};

/**
 * DatePicker showing month selection.
 */
export const MonthSelection: Story = {
  tags: ["autodocs"],
  render: (args) => (
    <div className="max-w-md mx-auto bg-white p-4">
      <DatePicker {...args} />
    </div>
  ),
  args: {
    initialDateType: "month",
    initialSelectedYear: new Date().getFullYear(),
    initialSelectedPeriod: new Date().getMonth() + 1,
  },
};

/**
 * DatePicker showing quarter selection.
 */
export const QuarterSelection: Story = {
  tags: ["autodocs"],
  render: (args) => (
    <div className="max-w-md mx-auto bg-white p-4">
      <DatePicker {...args} />
    </div>
  ),
  args: {
    initialDateType: "quarter",
    initialSelectedYear: new Date().getFullYear(),
    initialSelectedPeriod: Math.floor(new Date().getMonth() / 3) + 1,
  },
};

/**
 * DatePicker showing semester selection.
 */
export const SemesterSelection: Story = {
  tags: ["autodocs"],
  render: (args) => (
    <div className="max-w-md mx-auto bg-white p-4">
      <DatePicker {...args} />
    </div>
  ),
  args: {
    initialDateType: "semester",
    initialSelectedYear: new Date().getFullYear(),
    initialSelectedPeriod: Math.floor(new Date().getMonth() / 6) + 1,
  },
};

/**
 * DatePicker showing year selection.
 */
export const YearSelection: Story = {
  tags: ["autodocs"],
  render: (args) => (
    <div className="max-w-md mx-auto bg-white p-4">
      <DatePicker {...args} />
    </div>
  ),
  args: {
    initialDateType: "year",
    initialSelectedYear: new Date().getFullYear(),
  },
};
