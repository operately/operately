import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ProgressBar } from ".";
import { ProgressBarStatus, ProgressBarSize } from "./types";

const meta = {
  title: "Components/ProgressBar",
  component: ProgressBar,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    progress: {
      description: "The progress value (0-100)",
      control: { type: "range", min: 0, max: 100, step: 1 },
    },
    status: {
      description: "The status of the progress bar",
      options: [
        "on_track",
        "caution",
        "issue",
        "paused",
        "pending",
        "achieved",
        "partial",
        "missed",
        "completed",
        "dropped",
      ],
      control: { type: "select" },
    },
    size: {
      description: "The size of the progress bar",
      options: ["sm", "md", "lg"],
      control: { type: "select" },
    },
    showLabel: {
      description: "Whether to show the percentage label",
      control: { type: "boolean" },
    },
  },
} satisfies Meta<typeof ProgressBar>;

export default meta;
type Story = StoryObj<typeof ProgressBar>;

/**
 * Progress bars are used to visually represent the completion percentage of items like goals, projects, tasks, etc.
 *
 * The color of the bar changes based on status, providing visual feedback about the state.
 */
export const Default: Story = {
  render: (attrs) => (
    <div style={{ width: "500px" }}>
      <ProgressBar {...attrs} />
    </div>
  ),
  parameters: {
    backgrounds: { default: "light" },
  },
  args: {
    progress: 60,
    status: "on_track",
    size: "md",
    showLabel: true,
  },
};

/**
 * Progress bars come in three sizes: small, medium (default), and large.
 */
export const Sizes: Story = {
  render: () => {
    const sizes: { name: string; value: ProgressBarSize }[] = [
      { name: "Small", value: "sm" },
      { name: "Medium", value: "md" },
      { name: "Large", value: "lg" },
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {sizes.map((size) => (
          <div key={size.value} className="p-4">
            <h3 className="text-lg font-medium mb-2">{size.name}</h3>
            <div style={{ width: "500px" }}>
              <ProgressBar progress={70} status="on_track" size={size.value} />
            </div>
          </div>
        ))}
      </div>
    );
  },
  parameters: {
    backgrounds: { default: "light" },
  },
};

/**
 * Progress bars can optionally display the percentage value.
 */
export const WithAndWithoutLabel: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="p-4">
        <h3 className="text-lg font-medium mb-2">Without Label (Default)</h3>
        <div style={{ width: "500px" }}>
          <ProgressBar progress={65} status="on_track" />
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-lg font-medium mb-2">With Label</h3>
        <div style={{ width: "500px" }}>
          <ProgressBar progress={65} status="on_track" showLabel={true} />
        </div>
      </div>
    </div>
  ),
  parameters: {
    backgrounds: { default: "light" },
  },
};

/**
 * The progress bar color changes based on status.
 *
 * Progress states:
 * - on_track: Green - Goal is currently in progress and on track
 * - caution: Amber - Goal is at risk or needs attention
 * - issue: Red - Goal has serious issues
 * - paused: Gray - Goal is temporarily paused
 * - pending: Blue - Goal is waiting to start or for approval
 *
 * Completion states:
 * - achieved/completed: Green - Goal was fully accomplished
 * - partial: Amber - Goal was partially accomplished
 * - missed/failed: Red - Goal was not accomplished
 * - dropped: Gray - Goal was intentionally abandoned
 */
export const StatusColors: Story = {
  render: () => {
    const statuses: { name: string; value: ProgressBarStatus }[] = [
      { name: "On Track", value: "on_track" },
      { name: "Completed", value: "completed" },
      { name: "Achieved", value: "achieved" },
      { name: "Paused", value: "paused" },
      { name: "Dropped", value: "dropped" },
      { name: "Caution", value: "caution" },
      { name: "Partial", value: "partial" },
      { name: "Issue", value: "issue" },
      { name: "Missed", value: "missed" },
      { name: "Pending", value: "pending" },
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statuses.map((status) => (
          <div key={status.value} className="p-4">
            <h3 className="text-lg font-medium mb-2">{status.name}</h3>
            <div style={{ width: "500px" }}>
              <ProgressBar progress={50} status={status.value} />
            </div>
          </div>
        ))}
      </div>
    );
  },
  parameters: {
    backgrounds: { default: "light" },
  },
};

/**
 * Examples of different progress percentages with the same status.
 */
export const ProgressLevels: Story = {
  render: () => {
    const progressValues = [0, 25, 50, 75, 100];

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4">
        {progressValues.map((value) => (
          <div key={value} className="p-4">
            <h3 className="text-lg font-medium mb-2">{value}% Progress</h3>
            <div style={{ width: "500px" }}>
              <ProgressBar progress={value} status="on_track" />
            </div>
          </div>
        ))}
      </div>
    );
  },
  parameters: {
    backgrounds: { default: "light" },
  },
};

/**
 * Examples combining different props for common use cases.
 */
export const ComprehensiveExamples: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
      <div className="p-4">
        <h3 className="text-lg font-medium mb-2">
          On Track - Large with Label
        </h3>
        <div style={{ width: "500px" }}>
          <ProgressBar
            progress={78}
            status="on_track"
            size="lg"
            showLabel={true}
          />
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-lg font-medium mb-2">
          Caution - Medium with Label
        </h3>
        <div style={{ width: "500px" }}>
          <ProgressBar progress={43} status="caution" showLabel={true} />
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-lg font-medium mb-2">Issue - Small</h3>
        <div style={{ width: "500px" }}>
          <ProgressBar progress={22} status="issue" size="sm" />
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-lg font-medium mb-2">Completed - 100%</h3>
        <div style={{ width: "500px" }}>
          <ProgressBar progress={100} status="completed" showLabel={true} />
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-lg font-medium mb-2">Paused - 50%</h3>
        <div style={{ width: "500px" }}>
          <ProgressBar progress={50} status="paused" showLabel={true} />
        </div>
      </div>
    </div>
  ),
  parameters: {
    backgrounds: { default: "light" },
  },
};
