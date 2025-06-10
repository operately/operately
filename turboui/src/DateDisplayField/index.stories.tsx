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
 * - Offers two display variants: inline (default) and form-field (with border)
 */
const meta: Meta<typeof DateDisplayField> = {
  title: "Components/Fields/DateDisplayField",
  component: DateDisplayField,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof DateDisplayField>;

export default meta;
type Story = StoryObj<typeof meta>;

const Commponent = (args: Partial<DateDisplayField.Props>) => {
  const [date, setDate] = React.useState<Date | null>(args.date || null);
  return <DateDisplayField {...args} date={date} setDate={setDate} />;
};

export const AllStates: Story = {
  render: () => {
    const today = new Date();
    const twoWeeksAgo = new Date(+new Date() - 14 * 24 * 60 * 60 * 1000);
    const lastYear = new Date(+new Date() - 365 * 24 * 60 * 60 * 1000);
    const nextYear = new Date(+new Date() + 365 * 24 * 60 * 60 * 1000);

    return (
      <Page title="DateDisplayField All States" size="medium">
        <div className="space-y-12 p-12">
          <div>
            <h2 className="text-lg font-bold mb-8">Inline Variant (Default)</h2>
            <div className="grid grid-cols-3 gap-8">
              <div>
                <h3 className="text-sm font-bold mb-2">Normal</h3>
                <Commponent date={today} showOverdueWarning variant="inline" />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Overdue</h3>
                <Commponent date={twoWeeksAgo} showOverdueWarning variant="inline" />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Last Year</h3>
                <Commponent date={lastYear} showOverdueWarning variant="inline" />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Next Year</h3>
                <Commponent date={nextYear} showOverdueWarning variant="inline" />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Read-Only</h3>
                <Commponent date={today} showOverdueWarning readonly variant="inline" />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Read-Only + Overdue</h3>
                <Commponent date={twoWeeksAgo} showOverdueWarning readonly variant="inline" />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Empty</h3>
                <Commponent date={null} showOverdueWarning variant="inline" />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Empty + Read-Only</h3>
                <Commponent date={null} showOverdueWarning readonly variant="inline" />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Empty + As Button</h3>
                <Commponent date={null} showOverdueWarning showEmptyStateAsButton variant="inline" />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Empty + As Button + Read-Only</h3>
                <Commponent date={null} showOverdueWarning showEmptyStateAsButton readonly variant="inline" />
                <span className="text-xs text-content-dimmed">(It is invisible)</span>
              </div>
            </div>
          </div>

          <div className="border-t border-stroke-base pt-12">
            <h2 className="text-lg font-bold mb-8">Without Icon (Task List Context)</h2>
            <div className="grid grid-cols-3 gap-8">
              <div>
                <h3 className="text-sm font-bold mb-2">Normal</h3>
                <Commponent date={today} showOverdueWarning showIcon={false} variant="inline" />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Overdue</h3>
                <Commponent date={twoWeeksAgo} showOverdueWarning showIcon={false} variant="inline" />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Last Year</h3>
                <Commponent date={lastYear} showOverdueWarning showIcon={false} variant="inline" />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Next Year</h3>
                <Commponent date={nextYear} showOverdueWarning showIcon={false} variant="inline" />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Empty</h3>
                <Commponent date={null} showOverdueWarning showIcon={false} variant="inline" />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Read-Only + Overdue</h3>
                <Commponent date={twoWeeksAgo} showOverdueWarning showIcon={false} readonly variant="inline" />
              </div>
            </div>
          </div>

          <div className="border-t border-stroke-base pt-12">
            <h2 className="text-lg font-bold mb-8">Form Field Variant</h2>
            <div className="grid grid-cols-3 gap-8">
              <div>
                <h3 className="text-sm font-bold mb-2">Normal</h3>
                <Commponent date={today} showOverdueWarning variant="form-field" />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Overdue</h3>
                <Commponent date={twoWeeksAgo} showOverdueWarning variant="form-field" />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Last Year</h3>
                <Commponent date={lastYear} showOverdueWarning variant="form-field" />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Next Year</h3>
                <Commponent date={nextYear} showOverdueWarning variant="form-field" />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Empty</h3>
                <Commponent date={null} showOverdueWarning variant="form-field" />
              </div>
            </div>
          </div>
        </div>
      </Page>
    );
  },
};
