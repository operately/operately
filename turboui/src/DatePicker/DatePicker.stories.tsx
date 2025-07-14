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
    <div className="max-w-md mx-auto bg-white p-4">
      <DatePicker {...args} />
    </div>
  ),
  args: {
    initialType: "exact",
    initialDate: new Date(),
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
    initialType: "month",
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
    initialType: "quarter",
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
    initialType: "year",
  },
};
