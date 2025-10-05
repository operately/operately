import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import FormattedTime, { FormattedTimeProps } from ".";

const meta = {
  title: "Components/FormattedTime",
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    format: {
      description: "The format to display the time in",
      options: [
        "relative",
        "short-date",
        "short-date-with-weekday",
        "time-only",
        "relative-weekday-or-date",
        "long-date",
        "relative-time-or-date",
      ],
      control: { type: "select" },
    },
    time: {
      description: "The time to format",
      control: "date",
    },
  },
} satisfies Meta;

export default meta;

// Create dates for examples
const now = new Date();
const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
const lastYear = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

/**
 * The FormattedTime component displays dates and times in various formats.
 * It supports different formatting options and automatically updates relative times.
 */
export const Default: StoryObj<FormattedTimeProps> = {
  render: (args) => <FormattedTime {...args} />,
  args: {
    time: now,
    format: "relative",
  },
};

/**
 * The 'relative' format displays times relative to now, like "just now" or "5 minutes ago".
 */
export const RelativeFormat: StoryObj<{}> = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col">
        <span className="text-sm font-medium mb-1">Just now:</span>
        <FormattedTime time={now} format="relative" />
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium mb-1">5 minutes ago:</span>
        <FormattedTime time={fiveMinutesAgo} format="relative" />
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium mb-1">1 hour ago:</span>
        <FormattedTime time={oneHourAgo} format="relative" />
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium mb-1">Yesterday:</span>
        <FormattedTime time={yesterday} format="relative" />
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium mb-1">Last week:</span>
        <FormattedTime time={lastWeek} format="relative" />
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium mb-1">Last month:</span>
        <FormattedTime time={lastMonth} format="relative" />
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium mb-1">Last year:</span>
        <FormattedTime time={lastYear} format="relative" />
      </div>
    </div>
  ),
};

/**
 * The 'short-date' format displays dates in a compact format like "Apr 28" or "Apr 28, 2025".
 * It omits the year if it's the current year.
 */
export const ShortDateFormat: StoryObj<{}> = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col">
        <span className="text-sm font-medium mb-1">Today:</span>
        <FormattedTime time={now} format="short-date" />
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium mb-1">Yesterday:</span>
        <FormattedTime time={yesterday} format="short-date" />
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium mb-1">Last week:</span>
        <FormattedTime time={lastWeek} format="short-date" />
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium mb-1">Last year:</span>
        <FormattedTime time={lastYear} format="short-date" />
      </div>
    </div>
  ),
};

/**
 * The 'short-date-with-weekday' format displays dates with the weekday like "Mon, Apr 28".
 */
export const ShortDateWithWeekdayFormat: StoryObj<{}> = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col">
        <span className="text-sm font-medium mb-1">Today:</span>
        <FormattedTime time={now} format="short-date-with-weekday" />
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium mb-1">Yesterday:</span>
        <FormattedTime time={yesterday} format="short-date-with-weekday" />
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium mb-1">Last week:</span>
        <FormattedTime time={lastWeek} format="short-date-with-weekday" />
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium mb-1">Last year:</span>
        <FormattedTime time={lastYear} format="short-date-with-weekday" />
      </div>
    </div>
  ),
};

/**
 * The 'time-only' format displays just the time, like "11:30am".
 */
export const TimeOnlyFormat: StoryObj<{}> = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col">
        <span className="text-sm font-medium mb-1">Now:</span>
        <FormattedTime time={now} format="time-only" />
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium mb-1">5 minutes ago:</span>
        <FormattedTime time={fiveMinutesAgo} format="time-only" />
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium mb-1">1 hour ago:</span>
        <FormattedTime time={oneHourAgo} format="time-only" />
      </div>
    </div>
  ),
};

/**
 * The 'relative-weekday-or-date' format displays "Today", "Yesterday", or the weekday for recent dates,
 * and falls back to a short date format for older dates.
 */
export const RelativeWeekdayOrDateFormat: StoryObj<{}> = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col">
        <span className="text-sm font-medium mb-1">Today:</span>
        <FormattedTime time={now} format="relative-weekday-or-date" />
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium mb-1">Yesterday:</span>
        <FormattedTime time={yesterday} format="relative-weekday-or-date" />
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium mb-1">Tomorrow:</span>
        <FormattedTime time={tomorrow} format="relative-weekday-or-date" />
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium mb-1">Next week:</span>
        <FormattedTime time={nextWeek} format="relative-weekday-or-date" />
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium mb-1">Last week:</span>
        <FormattedTime time={lastWeek} format="relative-weekday-or-date" />
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium mb-1">Last month:</span>
        <FormattedTime time={lastMonth} format="relative-weekday-or-date" />
      </div>
    </div>
  ),
};

/**
 * The 'long-date' format displays dates in a full format like "April 28th, 2025".
 */
export const LongDateFormat: StoryObj<{}> = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col">
        <span className="text-sm font-medium mb-1">Today:</span>
        <FormattedTime time={now} format="long-date" />
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium mb-1">Yesterday:</span>
        <FormattedTime time={yesterday} format="long-date" />
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium mb-1">Last week:</span>
        <FormattedTime time={lastWeek} format="long-date" />
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium mb-1">Last year:</span>
        <FormattedTime time={lastYear} format="long-date" />
      </div>
    </div>
  ),
};

/**
 * The 'relative-time-or-date' format displays times in a relative format for recent times,
 * and falls back to a date format for older times.
 */
export const RelativeTimeOrDateFormat: StoryObj<{}> = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col">
        <span className="text-sm font-medium mb-1">Just now:</span>
        <FormattedTime time={now} format="relative-time-or-date" />
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium mb-1">5 minutes ago:</span>
        <FormattedTime time={fiveMinutesAgo} format="relative-time-or-date" />
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium mb-1">1 hour ago:</span>
        <FormattedTime time={oneHourAgo} format="relative-time-or-date" />
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium mb-1">Yesterday:</span>
        <FormattedTime time={yesterday} format="relative-time-or-date" />
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium mb-1">Last week:</span>
        <FormattedTime time={lastWeek} format="relative-time-or-date" />
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium mb-1">Last month:</span>
        <FormattedTime time={lastMonth} format="relative-time-or-date" />
      </div>
    </div>
  ),
};

/**
 * The FormattedTime component can be used with different timezones by wrapping it with a TimezoneProvider.
 */
export const DifferentTimezones: StoryObj<{}> = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-sm font-medium mb-2">New York (America/New_York)</h3>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs w-24">Time only:</span>
            <FormattedTime time={now} format="time-only" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs w-24">Short date:</span>
            <FormattedTime time={now} format="short-date" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs w-24">Long date:</span>
            <FormattedTime time={now} format="long-date" />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-2">London (Europe/London)</h3>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs w-24">Time only:</span>
            <FormattedTime time={now} format="time-only" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs w-24">Short date:</span>
            <FormattedTime time={now} format="short-date" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs w-24">Long date:</span>
            <FormattedTime time={now} format="long-date" />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-2">Tokyo (Asia/Tokyo)</h3>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs w-24">Time only:</span>
            <FormattedTime time={now} format="time-only" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs w-24">Short date:</span>
            <FormattedTime time={now} format="short-date" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs w-24">Long date:</span>
            <FormattedTime time={now} format="long-date" />
          </div>
        </div>
      </div>
    </div>
  ),
};

/**
 * Edge cases for the FormattedTime component.
 */
export const EdgeCases: StoryObj<{}> = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-medium mb-2">String date input</h3>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs w-24">ISO string:</span>
            <FormattedTime time="2025-04-28T14:30:00Z" format="short-date" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs w-24">Date string:</span>
            <FormattedTime time="2025-04-28" format="short-date" />
          </div>
        </div>
      </div>
    </div>
  ),
};
