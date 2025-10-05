import type { Meta, StoryObj } from "@storybook/react-vite";
import { TimeframeSelector } from "./index";
import React, { useState } from "react";
import { currentMonth, currentQuarter, currentYear, Timeframe } from "../utils/timeframes";

const meta = {
  title: "Components/TimeframeSelector",
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      description: "The size of the timeframe selector",
      options: ["xs", "base"],
      control: { type: "select" },
    },
    alignContent: {
      description: "Alignment of the popover content",
      options: ["start", "end"],
      control: { type: "select" },
    },
  },
} satisfies Meta;

export default meta;

/**
 * The TimeframeSelector is a component for selecting time periods like months, quarters, years, or custom date ranges.
 * It provides an intuitive interface for users to select different timeframes for data filtering, reporting, or scheduling.
 */
const TimeframeSelectorWrapper = (args: any) => {
  const [timeframe, setTimeframe] = useState<Timeframe>(currentMonth());

  return <TimeframeSelector {...args} timeframe={timeframe} setTimeframe={setTimeframe} />;
};

export const Default: StoryObj = {
  render: (args) => <TimeframeSelectorWrapper {...args} />,
  args: {
    size: "base",
    alignContent: "start",
  },
};

/**
 * The TimeframeSelector supports different sizes to fit various UI contexts.
 *
 * - **base**: Default size, suitable for most use cases
 * - **xs**: Extra small size, for compact interfaces
 */
export const Sizes: StoryObj = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <TimeframeSelectorWrapper size="base" />
        <TimeframeSelectorWrapper size="xs" />
      </div>
    </div>
  ),
};

/**
 * The TimeframeSelector supports different timeframe types:
 *
 * - **Month**: For selecting a specific month
 * - **Quarter**: For selecting a specific quarter
 * - **Year**: For selecting a specific year
 * - **Custom Range**: For selecting a custom date range
 */
export const TimeframeTypes: StoryObj = {
  render: () => {
    const [monthTimeframe, setMonthTimeframe] = useState(currentMonth());
    const [quarterTimeframe, setQuarterTimeframe] = useState(currentQuarter());
    const [yearTimeframe, setYearTimeframe] = useState(currentYear());
    const [customTimeframe, setCustomTimeframe] = useState<TimeframeSelector.Timeframe>({
      type: "days",
      startDate: new Date(new Date().setDate(new Date().getDate() - 7)),
      endDate: new Date(),
    });

    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <div className="text-sm font-medium">Month Timeframe</div>
          <div>
            <TimeframeSelector timeframe={monthTimeframe} setTimeframe={setMonthTimeframe} />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="text-sm font-medium">Quarter Timeframe</div>
          <div>
            <TimeframeSelector timeframe={quarterTimeframe} setTimeframe={setQuarterTimeframe} />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="text-sm font-medium">Year Timeframe</div>
          <div>
            <TimeframeSelector timeframe={yearTimeframe} setTimeframe={setYearTimeframe} />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="text-sm font-medium">Custom Range Timeframe</div>
          <div>
            <TimeframeSelector timeframe={customTimeframe} setTimeframe={setCustomTimeframe} />
          </div>
        </div>
      </div>
    );
  },
};

/**
 * The TimeframeSelector can be aligned differently based on UI requirements.
 *
 * - **start**: Aligns the popover to the start of the trigger element (default)
 * - **end**: Aligns the popover to the end of the trigger element
 */
export const Alignment: StoryObj = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="text-sm font-medium">Start Alignment (Default)</div>
        <div>
          <TimeframeSelectorWrapper alignContent="start" />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="text-sm font-medium">End Alignment</div>
        <div>
          <TimeframeSelectorWrapper alignContent="end" />
        </div>
      </div>
    </div>
  ),
};

/**
 * How to use the TimeframeSelector component in your code.
 */
export const Usage: StoryObj = {
  render: () => {
    return (
      <div className="p-6 border rounded-lg" style={{ width: "600px" }}>
        <h3 className="text-lg font-medium mb-4">How to use TimeframeSelector</h3>

        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <pre className="text-sm overflow-auto">
            {`// Import the component
import { TimeframeSelector } from 'turboui/src/TimeframeSelector';
import { Timeframe } from 'turboui/src/TimeframeSelector/types';
import { useState } from 'react';
import { currentMonth } from 'turboui/src/TimeframeSelector/utils';

// In your component
function MyComponent() {
  const [timeframe, setTimeframe] = useState<Timeframe>(currentMonth());
  
  return (
    <TimeframeSelector
      timeframe={timeframe}
      setTimeframe={setTimeframe}
      size="base"
      alignContent="start"
    />
  );
}`}
          </pre>
        </div>

        <div className="text-sm">
          <p className="mb-2">
            <strong>Available helper functions:</strong>
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <code>currentMonth()</code> - Returns a timeframe for the current month
            </li>
            <li>
              <code>currentQuarter()</code> - Returns a timeframe for the current quarter
            </li>
            <li>
              <code>currentYear()</code> - Returns a timeframe for the current year
            </li>
            <li>
              <code>formatTimeframe(timeframe)</code> - Formats a timeframe as a readable string
            </li>
          </ul>
        </div>
      </div>
    );
  },
};
