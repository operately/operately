import type { Meta, StoryObj } from "@storybook/react-vite";
import React, { useState } from "react";
import { TaskFilter } from "../components/TaskFilter";
import * as Types from "../types";
import { mockTasks } from "../tests/mockData";

const meta: Meta<typeof TaskFilter> = {
  title: "Components/TaskBoard/TaskFilter",
  component: TaskFilter,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [filters, setFilters] = useState<Types.FilterCondition[]>([]);

    return (
      <div className="p-4 bg-surface-base">
        <TaskFilter
          filters={filters}
          onFiltersChange={setFilters}
          tasks={mockTasks}
        />
      </div>
    );
  },
};

export const WithActiveFilters: Story = {
  render: () => {
    const [filters, setFilters] = useState<Types.FilterCondition[]>([
      {
        id: "1",
        type: "status",
        operator: "is",
        value: "in_progress",
        label: "Status is In Progress",
      },
      {
        id: "2", 
        type: "assignee",
        operator: "is",
        value: "john",
        label: "Assignee is John Doe",
      },
    ]);

    return (
      <div className="p-4 bg-surface-base">
        <TaskFilter
          filters={filters}
          onFiltersChange={setFilters}
          tasks={mockTasks}
        />
      </div>
    );
  },
};

export const EmptyState: Story = {
  render: () => {
    const [filters, setFilters] = useState<Types.FilterCondition[]>([]);

    return (
      <div className="p-4 bg-surface-base">
        <TaskFilter
          filters={filters}
          onFiltersChange={setFilters}
          tasks={[]}
        />
      </div>
    );
  },
};