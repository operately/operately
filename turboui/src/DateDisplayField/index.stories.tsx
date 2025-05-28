import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { Page } from "../Page";
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
    layout: "fullscreen",
  },
} satisfies Meta<typeof DateDisplayField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllStates: Story = {
  render: () => {
    const today = new Date();
    const twoWeeksAgo = new Date(+new Date() - 14 * 24 * 60 * 60 * 1000);

    return (
      <Page title="DateDisplayField All States" size="medium">
        <div className="grid grid-cols-3 gap-8 p-12">
          <div>
            <h3 className="text-sm font-bold mb-2">Normal</h3>
            <DateDisplayField date={today} showOverdueWarning />
          </div>

          <div>
            <h3 className="text-sm font-bold mb-2">Overdue</h3>
            <DateDisplayField date={twoWeeksAgo} showOverdueWarning />
          </div>

          <div>
            <h3 className="text-sm font-bold mb-2">Read-Only</h3>
            <DateDisplayField date={today} showOverdueWarning readonly />
          </div>

          <div>
            <h3 className="text-sm font-bold mb-2">Read-Only + Overdue</h3>
            <DateDisplayField date={twoWeeksAgo} showOverdueWarning readonly />
          </div>

          <div>
            <h3 className="text-sm font-bold mb-2">Empty</h3>
            <DateDisplayField date={null} showOverdueWarning />
          </div>

          <div>
            <h3 className="text-sm font-bold mb-2">Empty + Read-Only</h3>
            <DateDisplayField date={null} showOverdueWarning readonly />
          </div>

          <div>
            <h3 className="text-sm font-bold mb-2">Empty + As Button</h3>
            <DateDisplayField date={null} showOverdueWarning showEmptyStateAsButton />
          </div>

          <div>
            <h3 className="text-sm font-bold mb-2">Empty + As Button + Read-Only</h3>
            <DateDisplayField date={null} showOverdueWarning showEmptyStateAsButton readonly />
            <span className="text-xs text-content-dimmed">(It is invisible)</span>
          </div>
        </div>
      </Page>
    );
  },
};
