import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { Page } from "../Page";
import { DateField } from "./index";
import { createContextualDate } from "./mockData";

/**
 * DateField is a component that allows users to select dates in various formats:
 * - Supports selecting specific day, month, quarter, or year
 * - Shows date in a readable format with calendar icon
 * - Can be configured as read-only or editable
 * - Provides visual indicators for overdue dates
 * - Offers two display variants: inline (default) and form-field (with border)
 */
const meta: Meta<typeof DateField> = {
  title: "Components/Fields/DateField",
  component: DateField,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof DateField>;

export default meta;
type Story = StoryObj<typeof meta>;

const Component = (args: Partial<DateField.Props>) => {
  const [date, setDate] = React.useState<DateField.ContextualDate | null>(args.date || null);
  return <DateField {...args} date={date} onDateSelect={(newDate) => setDate(newDate)} />;
};

export const AllStates: Story = {
  render: () => {
    const today = new Date();
    const twoWeeksAgo = new Date(+new Date() - 14 * 24 * 60 * 60 * 1000);
    const lastYear = new Date(+new Date() - 365 * 24 * 60 * 60 * 1000);
    const nextYear = new Date(+new Date() + 365 * 24 * 60 * 60 * 1000);

    return (
      <Page title="DateField All States" size="medium">
        <div className="space-y-12 p-12">
          <div>
            <h2 className="text-lg font-bold mb-8">Day Selection (Default DateType)</h2>
            <div className="grid grid-cols-3 gap-8">
              <div>
                <h3 className="text-sm font-bold mb-2">Normal</h3>
                <Component date={createContextualDate(today, "day")} showOverdueWarning variant="inline" />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Overdue</h3>
                <Component date={createContextualDate(twoWeeksAgo, "day")} showOverdueWarning variant="inline" />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Last Year</h3>
                <Component date={createContextualDate(lastYear, "day")} showOverdueWarning variant="inline" />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Next Year</h3>
                <Component date={createContextualDate(nextYear, "day")} showOverdueWarning variant="inline" />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Read-Only</h3>
                <Component date={createContextualDate(today, "day")} showOverdueWarning readonly variant="inline" />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Read-Only + Overdue</h3>
                <Component
                  date={createContextualDate(twoWeeksAgo, "day")}
                  showOverdueWarning
                  readonly
                  variant="inline"
                />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Empty</h3>
                <Component date={null} showOverdueWarning variant="inline" />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Empty + Read-Only</h3>
                <Component date={null} showOverdueWarning readonly variant="inline" />
              </div>
            </div>
          </div>

          <div className="border-t border-stroke-base pt-12">
            <h2 className="text-lg font-bold mb-8">Month Selection</h2>
            <div className="grid grid-cols-3 gap-8">
              <div>
                <h3 className="text-sm font-bold mb-2">Normal</h3>
                <Component date={createContextualDate(today, "month")} showOverdueWarning variant="inline" />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Overdue</h3>
                <Component date={createContextualDate(twoWeeksAgo, "month")} showOverdueWarning variant="inline" />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Read-Only</h3>
                <Component date={createContextualDate(today, "month")} showOverdueWarning readonly variant="inline" />
              </div>
            </div>
          </div>

          <div className="border-t border-stroke-base pt-12">
            <h2 className="text-lg font-bold mb-8">Quarter Selection</h2>
            <div className="grid grid-cols-3 gap-8">
              <div>
                <h3 className="text-sm font-bold mb-2">Normal</h3>
                <Component date={createContextualDate(today, "quarter")} showOverdueWarning variant="inline" />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Overdue</h3>
                <Component date={createContextualDate(twoWeeksAgo, "quarter")} showOverdueWarning variant="inline" />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Read-Only</h3>
                <Component date={createContextualDate(today, "quarter")} showOverdueWarning readonly variant="inline" />
              </div>
            </div>
          </div>

          <div className="border-t border-stroke-base pt-12">
            <h2 className="text-lg font-bold mb-8">Year Selection</h2>
            <div className="grid grid-cols-3 gap-8">
              <div>
                <h3 className="text-sm font-bold mb-2">Normal</h3>
                <Component date={createContextualDate(today, "year")} showOverdueWarning variant="inline" />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Overdue</h3>
                <Component date={createContextualDate(twoWeeksAgo, "year")} showOverdueWarning variant="inline" />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Read-Only</h3>
                <Component date={createContextualDate(today, "year")} showOverdueWarning readonly variant="inline" />
              </div>
            </div>
          </div>

          <div className="border-t border-stroke-base pt-12">
            <h2 className="text-lg font-bold mb-8">Without Calendar Icon</h2>
            <div className="grid grid-cols-3 gap-8">
              <div>
                <h3 className="text-sm font-bold mb-2">Day Selection</h3>
                <Component
                  date={createContextualDate(today, "day")}
                  showOverdueWarning
                  hideCalendarIcon={true}
                  variant="inline"
                />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Overdue</h3>
                <Component
                  date={createContextualDate(twoWeeksAgo, "day")}
                  showOverdueWarning
                  hideCalendarIcon={true}
                  variant="inline"
                />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Read-Only</h3>
                <Component
                  date={createContextualDate(today, "day")}
                  showOverdueWarning
                  readonly
                  hideCalendarIcon={true}
                  variant="inline"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-stroke-base pt-12">
            <h2 className="text-lg font-bold mb-8">Form Field Variant</h2>
            <div className="grid grid-cols-3 gap-8">
              <div>
                <h3 className="text-sm font-bold mb-2">Day Selection</h3>
                <Component date={createContextualDate(today, "day")} showOverdueWarning variant="form-field" />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Month Selection</h3>
                <Component date={createContextualDate(today, "month")} showOverdueWarning variant="form-field" />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Quarter Selection</h3>
                <Component date={createContextualDate(today, "quarter")} showOverdueWarning variant="form-field" />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Year Selection</h3>
                <Component date={createContextualDate(today, "year")} showOverdueWarning variant="form-field" />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Overdue</h3>
                <Component date={createContextualDate(twoWeeksAgo, "day")} showOverdueWarning variant="form-field" />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Empty</h3>
                <Component date={null} showOverdueWarning variant="form-field" />
              </div>
            </div>
          </div>

          <div className="border-t border-stroke-base pt-12">
            <h2 className="text-lg font-bold mb-8">Size Variants</h2>
            <div className="grid grid-cols-3 gap-8">
              <div>
                <h3 className="text-sm font-bold mb-2">Small Size (Day)</h3>
                <Component date={createContextualDate(today, "day")} showOverdueWarning variant="inline" size="small" />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Standard Size (Day)</h3>
                <Component date={createContextualDate(today, "day")} showOverdueWarning variant="inline" size="std" />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Large Size (Day)</h3>
                <Component date={createContextualDate(today, "day")} showOverdueWarning variant="inline" size="lg" />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Small Size (Month)</h3>
                <Component
                  date={createContextualDate(today, "month")}
                  showOverdueWarning
                  variant="inline"
                  size="small"
                />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Standard Size (Month)</h3>
                <Component date={createContextualDate(today, "month")} showOverdueWarning variant="inline" size="std" />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Large Size (Month)</h3>
                <Component date={createContextualDate(today, "month")} showOverdueWarning variant="inline" size="lg" />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Small Size (Quarter)</h3>
                <Component
                  date={createContextualDate(today, "quarter")}
                  showOverdueWarning
                  variant="inline"
                  size="small"
                />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Standard Size (Quarter)</h3>
                <Component
                  date={createContextualDate(today, "quarter")}
                  showOverdueWarning
                  variant="inline"
                  size="std"
                />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Large Size (Quarter)</h3>
                <Component
                  date={createContextualDate(today, "quarter")}
                  showOverdueWarning
                  variant="inline"
                  size="lg"
                />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Small Size (Year)</h3>
                <Component
                  date={createContextualDate(today, "year")}
                  showOverdueWarning
                  variant="inline"
                  size="small"
                />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Standard Size (Year)</h3>
                <Component date={createContextualDate(today, "year")} showOverdueWarning variant="inline" size="std" />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Large Size (Year)</h3>
                <Component date={createContextualDate(today, "year")} showOverdueWarning variant="inline" size="lg" />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Small Size (Form Field)</h3>
                <Component
                  date={createContextualDate(today, "day")}
                  showOverdueWarning
                  variant="form-field"
                  size="small"
                />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Standard Size (Form Field)</h3>
                <Component
                  date={createContextualDate(today, "day")}
                  showOverdueWarning
                  variant="form-field"
                  size="std"
                />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Large Size (Form Field)</h3>
                <Component
                  date={createContextualDate(today, "day")}
                  showOverdueWarning
                  variant="form-field"
                  size="lg"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-stroke-base pt-12">
            <h2 className="text-lg font-bold mb-8">Date Limits</h2>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="text-sm font-bold mb-2">Min Date Limit</h3>
                <p className="text-xs text-gray-500 mb-2">Dates before July 10, 2025 are disabled</p>
                <DateField
                  minDateLimit={new Date(2025, 6, 10)} // July 10, 2025
                  placeholder="Select a date..."
                />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Max Date Limit</h3>
                <p className="text-xs text-gray-500 mb-2">Dates after August 20, 2025 are disabled</p>
                <DateField
                  maxDateLimit={new Date(2025, 7, 20)} // August 20, 2025
                  placeholder="Select a date..."
                />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Both Limits</h3>
                <p className="text-xs text-gray-500 mb-2">
                  Only dates between July 10 and August 20, 2025 are selectable
                </p>
                <DateField
                  minDateLimit={new Date(2025, 6, 10)} // July 10, 2025
                  maxDateLimit={new Date(2025, 7, 20)} // August 20, 2025
                  placeholder="Select a date within range..."
                />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Month View with Limits</h3>
                <p className="text-xs text-gray-500 mb-2">Shows how months outside range are disabled</p>
                <DateField
                  minDateLimit={new Date(2025, 3, 1)} // April 1, 2025
                  maxDateLimit={new Date(2025, 8, 30)} // September 30, 2025
                  placeholder="Select a month..."
                  date={{
                    dateType: "month",
                    date: new Date(2025, 5, 1),
                    value: "Jun 2025",
                  }}
                />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Quarter View with Limits</h3>
                <p className="text-xs text-gray-500 mb-2">Shows how quarters outside range are disabled</p>
                <DateField
                  minDateLimit={new Date(2025, 3, 1)} // April 1, 2025
                  maxDateLimit={new Date(2025, 8, 30)} // September 30, 2025
                  placeholder="Select a quarter..."
                  date={{
                    dateType: "quarter",
                    date: new Date(2025, 5, 1),
                    value: "Q2 2025",
                  }}
                />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Year View with Limits</h3>
                <p className="text-xs text-gray-500 mb-2">Shows how years outside range are disabled</p>
                <DateField
                  minDateLimit={new Date(2024, 0, 1)} // January 1, 2024
                  maxDateLimit={new Date(2026, 11, 31)} // December 31, 2026
                  placeholder="Select a year..."
                  date={{
                    dateType: "year",
                    date: new Date(2025, 0, 1),
                    value: "2025",
                  }}
                />
              </div>
            </div>
          </div>

          <div className="border-t border-stroke-base pt-12">
            <h2 className="text-lg font-bold mb-8">Calendar Only Mode</h2>
            <div className="grid grid-cols-3 gap-8">
              <div>
                <h3 className="text-sm font-bold mb-2">Calendar Only - Inline</h3>
                <p className="text-xs text-gray-500 mb-2">Shows only the calendar, no date type selector</p>
                <Component date={createContextualDate(today, "day")} variant="inline" calendarOnly={true} />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Calendar Only - Form Field</h3>
                <p className="text-xs text-gray-500 mb-2">Form field variant with calendar only</p>
                <Component date={createContextualDate(today, "day")} variant="form-field" calendarOnly={true} />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Calendar Only - Empty</h3>
                <p className="text-xs text-gray-500 mb-2">Calendar only mode with no initial date</p>
                <Component date={null} placeholder="Select date..." variant="inline" calendarOnly={true} />
              </div>
            </div>
          </div>

          <div className="border-t border-stroke-base pt-12">
            <h2 className="text-lg font-bold mb-8">Error States</h2>
            <div className="grid grid-cols-3 gap-8">
              <div>
                <h3 className="text-sm font-bold mb-2">Normal (No Error)</h3>
                <Component date={createContextualDate(today, "day")} variant="form-field" />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">With Error</h3>
                <Component date={createContextualDate(today, "day")} variant="form-field" error={true} />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Empty With Error</h3>
                <Component date={null} placeholder="Required date..." variant="form-field" error={true} />
              </div>
            </div>
          </div>
        </div>
      </Page>
    );
  },
};
