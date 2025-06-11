import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import { StatusSelector } from "../components/StatusSelector";
import * as Types from "../types";

/**
 * StatusSelector is a component for displaying and changing task status.
 * It provides an interactive dropdown with status options and supports different sizes and readonly modes.
 */
const meta: Meta<typeof StatusSelector> = {
  title: "Components/TaskBoard/StatusSelector",
  component: StatusSelector,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    status: {
      control: "select",
      options: ["pending", "in_progress", "done", "canceled"],
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
    readonly: { control: "boolean" },
    showFullBadge: { control: "boolean" },
  },
} satisfies Meta<typeof StatusSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default interactive status selector with medium size
 */
export const Default: Story = {
  tags: ["autodocs"],
  render: () => {
    const [status, setStatus] = useState<Types.Status>("pending");

    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium mb-2">Interactive Status Selector</h3>
          <StatusSelector
            status={status}
            onChange={(newStatus) => {
              setStatus(newStatus);
              console.log("Status changed to:", newStatus);
            }}
            size="md"
          />
        </div>
        <div className="text-xs text-content-subtle">
          Current status: <span className="font-mono">{status}</span>
        </div>
      </div>
    );
  },
};

/**
 * Size variants showing small, medium, and large status selectors
 */
export const SizeVariants: Story = {
  render: () => {
    const [statuses, setStatuses] = useState<Record<string, Types.Status>>({
      small: "pending",
      medium: "in_progress",
      large: "done",
    });

    const updateStatus = (size: string, newStatus: Types.Status) => {
      setStatuses((prev) => ({ ...prev, [size]: newStatus }));
      console.log(`${size} status changed to:`, newStatus);
    };

    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Small (sm)</h3>
            <StatusSelector
              status={statuses.small!}
              onChange={(newStatus) => updateStatus("small", newStatus)}
              size="sm"
            />
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Medium (md)</h3>
            <StatusSelector
              status={statuses.medium!}
              onChange={(newStatus) => updateStatus("medium", newStatus)}
              size="md"
            />
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Large (lg)</h3>
            <StatusSelector
              status={statuses.large!}
              onChange={(newStatus) => updateStatus("large", newStatus)}
              size="lg"
            />
          </div>
        </div>
      </div>
    );
  },
};

/**
 * All status options displayed as readonly badges
 */
export const AllStatuses: Story = {
  render: () => {
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-medium">All Status Options (Readonly)</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-xs text-content-subtle">Not Started</div>
            <StatusSelector status="pending" onChange={() => {}} readonly={true} />
          </div>

          <div className="space-y-2">
            <div className="text-xs text-content-subtle">In Progress</div>
            <StatusSelector status="in_progress" onChange={() => {}} readonly={true} />
          </div>

          <div className="space-y-2">
            <div className="text-xs text-content-subtle">Done</div>
            <StatusSelector status="done" onChange={() => {}} readonly={true} />
          </div>

          <div className="space-y-2">
            <div className="text-xs text-content-subtle">Canceled</div>
            <StatusSelector status="canceled" onChange={() => {}} readonly={true} />
          </div>
        </div>
      </div>
    );
  },
};

/**
 * Status selector with full badge display
 */
export const WithFullBadge: Story = {
  render: () => {
    const [status, setStatus] = useState<Types.Status>("in_progress");

    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium mb-2">Full Badge Display</h3>
          <StatusSelector
            status={status}
            onChange={(newStatus) => {
              setStatus(newStatus);
              console.log("Status changed to:", newStatus);
            }}
            showFullBadge={true}
            size="md"
          />
        </div>
        <div className="text-xs text-content-subtle">
          Current status: <span className="font-mono">{status}</span>
        </div>
      </div>
    );
  },
};

/**
 * Readonly mode comparison
 */
export const ReadonlyComparison: Story = {
  render: () => {
    const [interactiveStatus, setInteractiveStatus] = useState<Types.Status>("pending");

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-medium mb-2">Interactive (readonly=false)</h3>
          <StatusSelector
            status={interactiveStatus}
            onChange={(newStatus) => {
              setInteractiveStatus(newStatus);
              console.log("Status changed to:", newStatus);
            }}
            readonly={false}
          />
        </div>

        <div>
          <h3 className="text-sm font-medium mb-2">Readonly (readonly=true)</h3>
          <StatusSelector status="in_progress" onChange={() => {}} readonly={true} />
        </div>

        <div className="text-xs text-content-subtle">
          Interactive current status: <span className="font-mono">{interactiveStatus}</span>
        </div>
      </div>
    );
  },
};

/**
 * Comprehensive example showing multiple status selectors in a list context
 */
export const InListContext: Story = {
  render: () => {
    const [tasks, setTasks] = useState([
      { id: "1", title: "Setup project structure", status: "done" as Types.Status },
      { id: "2", title: "Implement authentication", status: "in_progress" as Types.Status },
      { id: "3", title: "Write documentation", status: "pending" as Types.Status },
      { id: "4", title: "Deploy to staging", status: "canceled" as Types.Status },
    ]);

    const updateTaskStatus = (taskId: string, newStatus: Types.Status) => {
      setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, status: newStatus } : task)));
      console.log(`Task ${taskId} status changed to:`, newStatus);
    };

    return (
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Status Selectors in Task List</h3>
        <div className="space-y-2">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-center gap-3 p-2 border border-surface-outline rounded-lg">
              <StatusSelector
                status={task.status}
                onChange={(newStatus) => updateTaskStatus(task.id, newStatus)}
                size="sm"
              />
              <span className="text-sm">{task.title}</span>
            </div>
          ))}
        </div>
      </div>
    );
  },
};
