import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { MilestoneField, Milestone } from "./index";
import { createContextualDate } from "../DateField/mockData";

const meta: Meta<typeof MilestoneField> = {
  title: "Components/TaskBoard/MilestoneField",
  component: MilestoneField,
  parameters: {
    layout: "padded",
  },
  argTypes: {
    readonly: { control: "boolean" },
    emptyStateMessage: { control: "text" },
    emptyStateReadOnlyMessage: { control: "text" },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Mock milestone data - sorted by due date (earliest first), with some without due dates
const mockMilestones: Milestone[] = [
  {
    id: "3",
    name: "MVP Release",
    dueDate: createContextualDate(new Date("2023-12-20"), "day"),
    status: "overdue" as const,
    projectLink: "/projects/mvp",
  },
  {
    id: "1",
    name: "Project Alpha Launch",
    dueDate: createContextualDate(new Date("2024-01-15"), "day"),
    status: "pending" as const,
    projectLink: "/projects/alpha",
  },
  {
    id: "5",
    name: "Database Migration",
    dueDate: createContextualDate(new Date("2024-01-30"), "day"),
    status: "pending" as const,
    projectLink: "/projects/migration",
  },
  {
    id: "2",
    name: "Beta Testing Complete",
    dueDate: createContextualDate(new Date("2024-02-01"), "day"),
    status: "complete" as const,
    projectLink: "/projects/beta",
  },
  {
    id: "4",
    name: "User Research Phase",
    dueDate: createContextualDate(new Date("2024-03-10"), "day"),
    status: "pending" as const,
    projectLink: "/projects/research",
  },
  {
    id: "6",
    name: "Documentation Review",
    // No due date
    status: "pending" as const,
    projectLink: "/projects/docs",
  },
  {
    id: "7",
    name: "Code Quality Audit",
    // No due date
    status: "pending" as const,
    projectLink: "/projects/audit",
  },
];

const Template = (args: any) => {
  const [milestone, setMilestone] = React.useState<any>(args.milestone || null);
  const [milestones, setMilestones] = React.useState<Milestone[]>(mockMilestones);

  const handleSearch = async (query: string) => {
    // Simulate search delay
    await new Promise((resolve) => setTimeout(resolve, 200));

    const filtered = mockMilestones.filter((m) => (m.name || m.title || "").toLowerCase().includes(query.toLowerCase()));

    // Sort by due date (earliest first), then by title for those without due dates
    const sorted = filtered.sort((a, b) => {
      if (a.dueDate?.date && b.dueDate?.date) {
        return a.dueDate.date.getTime() - b.dueDate.date.getTime();
      }
      if (a.dueDate?.date && !b.dueDate?.date) return -1; // Items with due dates come first
      if (!a.dueDate?.date && b.dueDate?.date) return 1;
      return (a.name || a.title || "").localeCompare((b.name || b.title || "")); // Alphabetical for no due dates
    });

    setMilestones(sorted);
  };

  return (
    <div className="w-64">
      <MilestoneField
        {...args}
        milestone={milestone}
        setMilestone={setMilestone}
        milestones={milestones}
        onSearch={handleSearch}
      />

      <div className="mt-4 p-2 bg-gray-100 rounded text-sm">
        <strong>Selected:</strong> {milestone ? (milestone.name || milestone.title) : "None"}
      </div>
    </div>
  );
};

export const Default: Story = {
  render: Template,
  args: {
    milestone: null,
    readonly: false,
    emptyStateMessage: "Select milestone",
    emptyStateReadOnlyMessage: "No milestone",
  },
};

export const WithSelectedMilestone: Story = {
  render: Template,
  args: {
    milestone: mockMilestones[1], // Project Alpha Launch (has due date)
    readonly: false,
  },
};

export const WithOverdueMilestone: Story = {
  render: Template,
  args: {
    milestone: mockMilestones[0], // MVP Release (overdue)
    readonly: false,
  },
};

export const ReadOnly: Story = {
  render: Template,
  args: {
    milestone: mockMilestones[3], // Beta Testing Complete
    readonly: true,
  },
};

export const WithoutDueDate: Story = {
  render: Template,
  args: {
    milestone: mockMilestones[5], // Documentation Review (no due date)
    readonly: false,
  },
};

export const ReadOnlyEmpty: Story = {
  render: Template,
  args: {
    milestone: null,
    readonly: true,
    emptyStateReadOnlyMessage: "No milestone assigned",
  },
};

export const CustomMessages: Story = {
  render: Template,
  args: {
    milestone: null,
    readonly: false,
    emptyStateMessage: "Choose a milestone",
    emptyStateReadOnlyMessage: "Not assigned to milestone",
  },
};

export const EmptySearch: Story = {
  render: (args: any) => {
    const [milestone, setMilestone] = React.useState(args.milestone || null);
    const [milestones, setMilestones] = React.useState<Milestone[]>([]);

    const handleSearch = async (_query: string) => {
      await new Promise((resolve) => setTimeout(resolve, 200));
      // Simulate empty search results
      setMilestones([]);
    };

    return (
      <div className="w-64">
        <MilestoneField
          {...args}
          milestone={milestone}
          setMilestone={setMilestone}
          milestones={milestones}
          onSearch={handleSearch}
        />

        <div className="mt-4 p-2 bg-gray-100 rounded text-sm">
          <strong>Selected:</strong> {milestone ? (milestone.name || milestone.title) : "None"}
        </div>
      </div>
    );
  },
  args: {
    milestone: null,
    readonly: false,
  },
};

export const InteractiveDemo: Story = {
  render: () => {
    const [milestone, setMilestone] = React.useState<any>(mockMilestones[0]);
    const [readonly, setReadonly] = React.useState(false);
    const [milestones, setMilestones] = React.useState<Milestone[]>(mockMilestones);

    const handleSearch = async (query: string) => {
      await new Promise((resolve) => setTimeout(resolve, 200));

      if (!query) {
        setMilestones(mockMilestones);
        return;
      }

      const filtered = mockMilestones.filter((m) => (m.name || m.title || "").toLowerCase().includes(query.toLowerCase()));
      setMilestones(filtered);
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={readonly} onChange={(e) => setReadonly(e.target.checked)} />
            Read only
          </label>
          <button
            onClick={() => setMilestone(null)}
            className="px-3 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300"
          >
            Clear milestone
          </button>
        </div>

        <div className="w-64">
          <MilestoneField
            milestone={milestone}
            setMilestone={setMilestone}
            readonly={readonly}
            milestones={milestones}
            onSearch={handleSearch}
          />
        </div>

        <div className="p-3 bg-gray-100 rounded">
          <div className="text-sm space-y-1">
            <div>
              <strong>Selected:</strong> {milestone ? (milestone.name || milestone.title) : "None"}
            </div>
            {milestone?.dueDate && (
              <div>
                <strong>Due:</strong> {milestone.dueDate.toLocaleDateString()}
              </div>
            )}
            {milestone?.status && (
              <div>
                <strong>Status:</strong> {milestone.status}
              </div>
            )}
            <div>
              <strong>Read only:</strong> {readonly ? "Yes" : "No"}
            </div>
            <div>
              <strong>Available milestones:</strong> {milestones.length}
            </div>
          </div>
        </div>
      </div>
    );
  },
};
