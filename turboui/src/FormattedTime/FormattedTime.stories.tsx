import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import FormattedTime, { FormattedTimeProps } from ".";
import { defaultFormattedTimePreferences } from "./types";

const prefs = defaultFormattedTimePreferences;

const meta = {
  title: "Components/FormattedTime",
  component: FormattedTime,
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
    locale: { control: "text" },
    timezone: { control: "text" },
    timeFormat: {
      options: ["automatic", "hour_12", "hour_24"],
      control: { type: "select" },
    },
  },
} satisfies Meta<typeof FormattedTime>;

export default meta;

const now = new Date();
const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
const lastYear = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

export const Default: StoryObj<FormattedTimeProps> = {
  render: (args) => <FormattedTime {...args} />,
  args: {
    ...prefs,
    time: now,
    format: "relative",
  },
};

export const RelativeFormat: StoryObj<{}> = {
  render: () => (
    <div className="flex flex-col gap-4">
      <FormattedTime {...prefs} time={now} format="relative" />
      <FormattedTime {...prefs} time={fiveMinutesAgo} format="relative" />
      <FormattedTime {...prefs} time={oneHourAgo} format="relative" />
      <FormattedTime {...prefs} time={yesterday} format="relative" />
      <FormattedTime {...prefs} time={lastWeek} format="relative" />
      <FormattedTime {...prefs} time={lastMonth} format="relative" />
      <FormattedTime {...prefs} time={lastYear} format="relative" />
    </div>
  ),
};

export const ShortDateFormat: StoryObj<{}> = {
  render: () => (
    <div className="flex flex-col gap-4">
      <FormattedTime {...prefs} time={now} format="short-date" />
      <FormattedTime {...prefs} time={yesterday} format="short-date" />
      <FormattedTime {...prefs} time={lastWeek} format="short-date" />
      <FormattedTime {...prefs} time={lastYear} format="short-date" />
    </div>
  ),
};

export const ShortDateWithWeekdayFormat: StoryObj<{}> = {
  render: () => (
    <div className="flex flex-col gap-4">
      <FormattedTime {...prefs} time={now} format="short-date-with-weekday" />
      <FormattedTime {...prefs} time={yesterday} format="short-date-with-weekday" />
      <FormattedTime {...prefs} time={lastWeek} format="short-date-with-weekday" />
      <FormattedTime {...prefs} time={lastYear} format="short-date-with-weekday" />
    </div>
  ),
};

export const TimeOnlyFormat: StoryObj<{}> = {
  render: () => (
    <div className="flex flex-col gap-4">
      <FormattedTime {...prefs} time={now} format="time-only" />
      <FormattedTime {...prefs} time={fiveMinutesAgo} format="time-only" />
      <FormattedTime {...prefs} time={oneHourAgo} format="time-only" />
    </div>
  ),
};

export const RelativeWeekdayOrDateFormat: StoryObj<{}> = {
  render: () => (
    <div className="flex flex-col gap-4">
      <FormattedTime {...prefs} time={now} format="relative-weekday-or-date" />
      <FormattedTime {...prefs} time={yesterday} format="relative-weekday-or-date" />
      <FormattedTime {...prefs} time={tomorrow} format="relative-weekday-or-date" />
      <FormattedTime {...prefs} time={nextWeek} format="relative-weekday-or-date" />
      <FormattedTime {...prefs} time={lastWeek} format="relative-weekday-or-date" />
      <FormattedTime {...prefs} time={lastMonth} format="relative-weekday-or-date" />
    </div>
  ),
};

export const LongDateFormat: StoryObj<{}> = {
  render: () => (
    <div className="flex flex-col gap-4">
      <FormattedTime {...prefs} time={now} format="long-date" />
      <FormattedTime {...prefs} time={yesterday} format="long-date" />
      <FormattedTime {...prefs} time={lastWeek} format="long-date" />
      <FormattedTime {...prefs} time={lastYear} format="long-date" />
    </div>
  ),
};

export const RelativeTimeOrDateFormat: StoryObj<{}> = {
  render: () => (
    <div className="flex flex-col gap-4">
      <FormattedTime {...prefs} time={now} format="relative-time-or-date" />
      <FormattedTime {...prefs} time={fiveMinutesAgo} format="relative-time-or-date" />
      <FormattedTime {...prefs} time={oneHourAgo} format="relative-time-or-date" />
      <FormattedTime {...prefs} time={yesterday} format="relative-time-or-date" />
      <FormattedTime {...prefs} time={lastWeek} format="relative-time-or-date" />
      <FormattedTime {...prefs} time={lastMonth} format="relative-time-or-date" />
    </div>
  ),
};

export const DifferentTimezones: StoryObj<{}> = {
  render: () => (
    <div className="flex flex-col gap-6">
      {[
        { label: "New York (America/New_York)", timezone: "America/New_York" },
        { label: "London (Europe/London)", timezone: "Europe/London" },
        { label: "Tokyo (Asia/Tokyo)", timezone: "Asia/Tokyo" },
      ].map(({ label, timezone }) => (
        <div key={timezone}>
          <h3 className="text-sm font-medium mb-2">{label}</h3>
          <div className="flex flex-col gap-2">
            <FormattedTime {...prefs} timezone={timezone} time={now} format="time-only" />
            <FormattedTime {...prefs} timezone={timezone} time={now} format="short-date" />
            <FormattedTime {...prefs} timezone={timezone} time={now} format="long-date" />
          </div>
        </div>
      ))}
    </div>
  ),
};

export const EdgeCases: StoryObj<{}> = {
  render: () => (
    <div className="flex flex-col gap-4">
      <FormattedTime {...prefs} time="2025-04-28T14:30:00Z" format="short-date" />
      <FormattedTime {...prefs} time="2025-04-28" format="short-date" />
    </div>
  ),
};
