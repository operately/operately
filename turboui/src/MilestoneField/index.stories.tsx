import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { MilestoneField } from "./index";

const meta: Meta<typeof MilestoneField> = {
  title: "MilestoneField",
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
const mockMilestones = [
  {
    id: "3",
    title: "MVP Release",
    dueDate: new Date("2023-12-20"),
    status: "overdue" as const,
    projectLink: "/projects/mvp",
  },
  {
    id: "1",
    title: "Project Alpha Launch",
    dueDate: new Date("2024-01-15"),
    status: "pending" as const,
    projectLink: "/projects/alpha",
  },
  {
    id: "5",
    title: "Database Migration",
    dueDate: new Date("2024-01-30"),
    status: "pending" as const,
    projectLink: "/projects/migration",
  },
  {
    id: "2", 
    title: "Beta Testing Complete",
    dueDate: new Date("2024-02-01"),
    status: "complete" as const,
    projectLink: "/projects/beta",
  },
  {
    id: "4",
    title: "User Research Phase",
    dueDate: new Date("2024-03-10"),
    status: "pending" as const,
    projectLink: "/projects/research",
  },
  {
    id: "6",
    title: "Documentation Review",
    // No due date
    status: "pending" as const,
    projectLink: "/projects/docs",
  },
  {
    id: "7",
    title: "Code Quality Audit",
    // No due date
    status: "pending" as const,
    projectLink: "/projects/audit",
  },
];

const Template = (args: any) => {
  const [milestone, setMilestone] = React.useState<any>(args.milestone || null);

  const searchMilestones = async ({ query }: { query: string }) => {
    // Simulate search delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const filtered = mockMilestones.filter(m =>
      m.title.toLowerCase().includes(query.toLowerCase())
    );
    
    // Sort by due date (earliest first), then by title for those without due dates
    return filtered.sort((a, b) => {
      if (a.dueDate && b.dueDate) {
        return a.dueDate.getTime() - b.dueDate.getTime();
      }
      if (a.dueDate && !b.dueDate) return -1; // Items with due dates come first
      if (!a.dueDate && b.dueDate) return 1;
      return a.title.localeCompare(b.title); // Alphabetical for no due dates
    });
  };

  const handleCreateNew = (title?: string) => {
    console.log("Creating new milestone with title:", title);
    // In a real app, this would open a modal or navigate to a creation page
    // For Storybook demo purposes, we'll create a simple milestone to show the interaction
    if (title) {
      const newMilestone = {
        id: Date.now().toString(),
        title: title,
        status: "pending" as const,
        projectLink: "/projects/demo",
      };
      setMilestone(newMilestone);
    }
  };

  return (
    <div className="w-64">
      <MilestoneField
        {...args}
        milestone={milestone}
        setMilestone={setMilestone}
        searchMilestones={searchMilestones}
        onCreateNew={handleCreateNew}
      />
      
      <div className="mt-4 p-2 bg-gray-100 rounded text-sm">
        <strong>Selected:</strong> {milestone ? milestone.title : "None"}
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

export const WithoutCreateNew: Story = {
  render: (args: any) => {
    const [milestone, setMilestone] = React.useState(args.milestone || null);

    const searchMilestones = async ({ query }: { query: string }) => {
      await new Promise(resolve => setTimeout(resolve, 200));
      
      if (!query) return mockMilestones;
      
      return mockMilestones.filter(m =>
        m.title.toLowerCase().includes(query.toLowerCase())
      );
    };

    return (
      <div className="w-64">
        <MilestoneField
          {...args}
          milestone={milestone}
          setMilestone={setMilestone}
          searchMilestones={searchMilestones}
          // No onCreateNew prop - should hide "Create new" option
        />
        
        <div className="mt-4 p-2 bg-gray-100 rounded text-sm">
          <strong>Selected:</strong> {milestone ? milestone.title : "None"}
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

    const searchMilestones = async ({ query }: { query: string }) => {
      await new Promise(resolve => setTimeout(resolve, 200));
      
      if (!query) return mockMilestones;
      
      return mockMilestones.filter(m =>
        m.title.toLowerCase().includes(query.toLowerCase())
      );
    };

    const handleCreateNew = (title?: string) => {
      console.log("Creating new milestone with title:", title);
      // In a real app, this would open a modal or navigate to milestone creation
      // For Storybook demo purposes, we'll create a simple milestone to show the interaction
      if (title) {
        const newMilestone = {
          id: Date.now().toString(),
          title: title,
          status: "pending" as const,
          projectLink: "/projects/demo",
        };
        setMilestone(newMilestone);
      }
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={readonly}
              onChange={(e) => setReadonly(e.target.checked)}
            />
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
            searchMilestones={searchMilestones}
            onCreateNew={handleCreateNew}
          />
        </div>

        <div className="p-3 bg-gray-100 rounded">
          <div className="text-sm space-y-1">
            <div><strong>Selected:</strong> {milestone ? milestone.title : "None"}</div>
            {milestone?.dueDate && (
              <div><strong>Due:</strong> {milestone.dueDate.toLocaleDateString()}</div>
            )}
            {milestone?.status && (
              <div><strong>Status:</strong> {milestone.status}</div>
            )}
            <div><strong>Read only:</strong> {readonly ? "Yes" : "No"}</div>
          </div>
        </div>
      </div>
    );
  },
};