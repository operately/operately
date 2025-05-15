import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import { DateDisplayField } from "./index";

/**
 * DateDisplayField combines date display and date selection.
 * - Shows date in a readable format with calendar icon
 * - Can be configured as read-only or editable
 * - Supports setting a new date or editing an existing date
 * - Provides visual indicators for overdue dates
 */
const meta: Meta<typeof DateDisplayField> = {
  title: "Components/DateDisplayField",
  component: DateDisplayField,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof DateDisplayField>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Basic editable date field without a set date
 */
export const Empty: Story = {
  render: () => {
    const [date, setDate] = useState<Date | null>(null);

    return (
      <div className="p-4">
        <DateDisplayField date={date} onChange={setDate} placeholder="Set date" />
        {date && <div className="mt-2 text-sm text-content-subtle">Selected date: {date.toLocaleDateString()}</div>}
      </div>
    );
  },
};

/**
 * Date field with a date already set
 */
export const WithDate: Story = {
  render: () => {
    const [date, setDate] = useState<Date>(new Date());

    return (
      <div className="p-4">
        <DateDisplayField date={date} onChange={(newDate) => newDate && setDate(newDate)} />
      </div>
    );
  },
};

/**
 * Date field that shows a visual warning for overdue dates
 */
export const OverdueDate: Story = {
  render: () => {
    // Date in the past (5 days ago)
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);

    const [date, setDate] = useState<Date>(pastDate);

    return (
      <div className="p-4">
        <DateDisplayField date={date} onChange={(newDate) => newDate && setDate(newDate)} showOverdueWarning={true} />
      </div>
    );
  },
};

/**
 * Read-only date display
 */
export const ReadOnly: Story = {
  render: () => {
    return (
      <div className="p-4 flex flex-col gap-4">
        <div>
          <h3 className="text-sm font-medium mb-1">Normal date:</h3>
          <DateDisplayField date={new Date()} isEditable={false} />
        </div>

        <div>
          <h3 className="text-sm font-medium mb-1">Overdue date:</h3>
          <DateDisplayField
            date={new Date(new Date().setDate(new Date().getDate() - 3))}
            isEditable={false}
            showOverdueWarning={true}
          />
        </div>
      </div>
    );
  },
};

/**
 * Different sizes
 */
export const Sizes: Story = {
  render: () => {
    return (
      <div className="p-4 flex flex-col gap-4">
        <div>
          <h3 className="text-sm font-medium mb-1">XXS:</h3>
          <DateDisplayField date={new Date()} size="xxs" />
        </div>

        <div>
          <h3 className="text-sm font-medium mb-1">XS:</h3>
          <DateDisplayField date={new Date()} size="xs" />
        </div>

        <div>
          <h3 className="text-sm font-medium mb-1">SM:</h3>
          <DateDisplayField date={new Date()} size="sm" />
        </div>

        <div>
          <h3 className="text-sm font-medium mb-1">Base:</h3>
          <DateDisplayField date={new Date()} size="base" />
        </div>
      </div>
    );
  },
};
