import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { Page } from "../Page";
import { DateField } from "./index";

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
  return (
    <DateField 
      {...args} 
      date={date} 
      onDateSelect={(newDate) => setDate(newDate)} 
    />
  );
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
                <Component 
                  date={{
                    date: today,
                    dateType: "day",
                    value: new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(today),
                  }}
                  showOverdueWarning 
                  variant="inline" 
                />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Overdue</h3>
                <Component 
                  date={{
                    date: twoWeeksAgo,
                    dateType: "day",
                    value: new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(twoWeeksAgo),
                  }}
                  showOverdueWarning 
                  variant="inline" 
                />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Last Year</h3>
                <Component 
                  date={{
                    date: lastYear,
                    dateType: "day",
                    value: new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(lastYear),
                  }}
                  showOverdueWarning 
                  variant="inline" 
                />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Next Year</h3>
                <Component 
                  date={{
                    date: nextYear,
                    dateType: "day",
                    value: new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(nextYear),
                  }}
                  showOverdueWarning 
                  variant="inline" 
                />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Read-Only</h3>
                <Component 
                  date={{
                    date: today,
                    dateType: "day",
                    value: new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(today),
                  }}
                  showOverdueWarning 
                  readonly 
                  variant="inline" 
                />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Read-Only + Overdue</h3>
                <Component 
                  date={{
                    date: twoWeeksAgo,
                    dateType: "day",
                    value: new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(twoWeeksAgo),
                  }}
                  showOverdueWarning 
                  readonly 
                  variant="inline" 
                />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Empty</h3>
                <Component 
                  date={null} 
                  showOverdueWarning 
                  variant="inline" 
                />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Empty + Read-Only</h3>
                <Component 
                  date={null} 
                  showOverdueWarning 
                  readonly 
                  variant="inline" 
                />
              </div>
            </div>
          </div>

          <div className="border-t border-stroke-base pt-12">
            <h2 className="text-lg font-bold mb-8">Month Selection</h2>
            <div className="grid grid-cols-3 gap-8">
              <div>
                <h3 className="text-sm font-bold mb-2">Normal</h3>
                <Component 
                  date={{
                    date: today,
                    dateType: "month",
                    value: new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short" }).format(today),
                  }}
                  showOverdueWarning 
                  variant="inline" 
                />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Overdue</h3>
                <Component 
                  date={{
                    date: twoWeeksAgo,
                    dateType: "month",
                    value: new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short" }).format(twoWeeksAgo),
                  }}
                  showOverdueWarning 
                  variant="inline" 
                />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Read-Only</h3>
                <Component 
                  date={{
                    date: today,
                    dateType: "month",
                    value: new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short" }).format(today),
                  }}
                  showOverdueWarning 
                  readonly 
                  variant="inline" 
                />
              </div>
            </div>
          </div>

          <div className="border-t border-stroke-base pt-12">
            <h2 className="text-lg font-bold mb-8">Quarter Selection</h2>
            <div className="grid grid-cols-3 gap-8">
              <div>
                <h3 className="text-sm font-bold mb-2">Normal</h3>
                <Component 
                  date={{
                    date: today,
                    dateType: "quarter",
                    value: `Q${Math.floor(today.getMonth() / 3) + 1} ${today.getFullYear()}`,
                  }}
                  showOverdueWarning 
                  variant="inline" 
                />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Overdue</h3>
                <Component 
                  date={{
                    date: twoWeeksAgo,
                    dateType: "quarter",
                    value: `Q${Math.floor(twoWeeksAgo.getMonth() / 3) + 1} ${twoWeeksAgo.getFullYear()}`,
                  }}
                  showOverdueWarning 
                  variant="inline" 
                />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Read-Only</h3>
                <Component 
                  date={{
                    date: today,
                    dateType: "quarter",
                    value: `Q${Math.floor(today.getMonth() / 3) + 1} ${today.getFullYear()}`,
                  }}
                  showOverdueWarning 
                  readonly 
                  variant="inline" 
                />
              </div>
            </div>
          </div>

          <div className="border-t border-stroke-base pt-12">
            <h2 className="text-lg font-bold mb-8">Year Selection</h2>
            <div className="grid grid-cols-3 gap-8">
              <div>
                <h3 className="text-sm font-bold mb-2">Normal</h3>
                <Component 
                  date={{
                    date: today,
                    dateType: "year",
                    value: today.getFullYear().toString(),
                  }}
                  showOverdueWarning 
                  variant="inline" 
                />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Overdue</h3>
                <Component 
                  date={{
                    date: twoWeeksAgo,
                    dateType: "year",
                    value: twoWeeksAgo.getFullYear().toString(),
                  }}
                  showOverdueWarning 
                  variant="inline" 
                />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Read-Only</h3>
                <Component 
                  date={{
                    date: today,
                    dateType: "year",
                    value: today.getFullYear().toString(),
                  }}
                  showOverdueWarning 
                  readonly 
                  variant="inline" 
                />
              </div>
            </div>
          </div>

          <div className="border-t border-stroke-base pt-12">
            <h2 className="text-lg font-bold mb-8">Without Calendar Icon</h2>
            <div className="grid grid-cols-3 gap-8">
              <div>
                <h3 className="text-sm font-bold mb-2">Day Selection</h3>
                <Component 
                  date={{
                    date: today,
                    dateType: "day",
                    value: new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(today),
                  }}
                  showOverdueWarning 
                  hideCalendarIcon={true}
                  variant="inline" 
                />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Overdue</h3>
                <Component 
                  date={{
                    date: twoWeeksAgo,
                    dateType: "day",
                    value: new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(twoWeeksAgo),
                  }}
                  showOverdueWarning 
                  hideCalendarIcon={true}
                  variant="inline" 
                />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Read-Only</h3>
                <Component 
                  date={{
                    date: today,
                    dateType: "day",
                    value: new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(today),
                  }}
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
                <Component 
                  date={{
                    date: today,
                    dateType: "day",
                    value: new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(today),
                  }}
                  showOverdueWarning 
                  variant="form-field" 
                />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Month Selection</h3>
                <Component 
                  date={{
                    date: today,
                    dateType: "month",
                    value: new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short" }).format(today),
                  }}
                  showOverdueWarning 
                  variant="form-field" 
                />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Quarter Selection</h3>
                <Component 
                  date={{
                    date: today,
                    dateType: "quarter",
                    value: `Q${Math.floor(today.getMonth() / 3) + 1} ${today.getFullYear()}`,
                  }}
                  showOverdueWarning 
                  variant="form-field" 
                />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Year Selection</h3>
                <Component 
                  date={{
                    date: today,
                    dateType: "year",
                    value: today.getFullYear().toString(),
                  }}
                  showOverdueWarning 
                  variant="form-field" 
                />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Overdue</h3>
                <Component 
                  date={{
                    date: twoWeeksAgo,
                    dateType: "day",
                    value: new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(twoWeeksAgo),
                  }}
                  showOverdueWarning 
                  variant="form-field" 
                />
              </div>

              <div>
                <h3 className="text-sm font-bold mb-2">Empty</h3>
                <Component 
                  date={null} 
                  showOverdueWarning 
                  variant="form-field" 
                />
              </div>
            </div>
          </div>
        </div>
      </Page>
    );
  },
};