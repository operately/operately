import type { Meta, StoryObj } from "@storybook/react";
import { TableRow } from "./TableRow";
import type { WorkMap } from ".";
import { TableHeader } from "./WorkMapTable/TableHeader";
import { currentYear } from "../TimeframeSelector/utils";

// Mock data for stories
const mockOwner = {
  id: "user-1",
  fullName: "John Doe",
  avatarUrl:
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
};

// Create mock items with different statuses
const createMockItem = (
  id: string,
  name: string,
  type: "goal" | "project",
  status: WorkMap.Status,
  progress: number,
  hasChildren: boolean = false,
): WorkMap.Item => {
  // Create a properly typed child item
  const childItem: WorkMap.Item = {
    id: `${id}-child-1`,
    name: "Child item 1",
    parentId: id,
    type: "project",
    status: "on_track",
    progress: 50,
    space: { name: "Product", id: "space-1" },
    spacePath: "#",
    owner: mockOwner,
    ownerPath: "#",
    nextStep: "Child next step",
    isNew: false,
    completedOn: null,
    closedAt: null,
    children: [],
    itemPath: "#",
    timeframe: {
      startDate: "2025-01-15",
      endDate: "2025-06-30",
      type: "days",
    },
  };

  const baseItem = {
    id,
    name,
    parentId: null,
    status,
    progress,
    space: { name: "Product", id: "space-1" },
    spacePath: "#",
    owner: mockOwner,
    ownerPath: "#",
    nextStep: status === "completed" || status === "achieved" ? "" : "Next action to take",
    closedAt: "Mar 15 2025",
    isNew: false,
    completedOn: status === "completed" || status === "achieved" ? "2025-03-15" : null,
    children: hasChildren ? [childItem] : [],
    itemPath: "#",
  };

  if (type === "goal") {
    const year = currentYear();
    return {
      ...baseItem,
      type: "goal" as const,
      timeframe: {
        ...year,
        startDate: year.startDate?.toISOString(),
        endDate: year.endDate?.toISOString(),
      },
    };
  } else {
    return {
      ...baseItem,
      type: "project" as const,
      timeframe: {
        startDate: "2025-01-01",
        endDate: "2025-12-31",
        type: "days",
      },
    };
  }
};

// Create mock items for each status
const mockGoalOnTrack = createMockItem(
  "goal-1",
  "Improve customer onboarding experience",
  "goal",
  "on_track",
  45,
  true,
);
const mockGoalCompleted = createMockItem("goal-2", "Launch new marketing campaign", "goal", "completed", 100);
const mockGoalAchieved = createMockItem("goal-3", "Increase website traffic by 50%", "goal", "achieved", 100);
const mockGoalPartial = createMockItem("goal-4", "Reduce customer support tickets by 30%", "goal", "partial", 75);
const mockGoalMissed = createMockItem("goal-5", "Launch mobile app by Q1", "goal", "missed", 60);
const mockGoalPaused = createMockItem("goal-6", "Expand to international markets", "goal", "paused", 20);
const mockGoalCaution = createMockItem("goal-7", "Implement new CRM system", "goal", "caution", 35);
const mockGoalIssue = createMockItem("goal-8", "Migrate legacy systems", "goal", "issue", 15);
const mockProjectOnTrack = createMockItem("project-1", "Redesign product dashboard", "project", "on_track", 55);
const mockProjectCompleted = createMockItem("project-2", "Update documentation", "project", "completed", 100);

const meta = {
  title: "Components/WorkMap/TableRow",
  component: TableRow,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse">
          <Story />
        </table>
      </div>
    ),
  ],
  argTypes: {
    item: {
      description: "The WorkMap item to display",
      control: "object",
    },
    level: {
      description: "Indentation level",
      control: { type: "number", min: 0, max: 5 },
    },
    isLast: {
      description: "Whether this is the last item in the list",
      control: "boolean",
    },
    filter: {
      description: "Current filter applied to the WorkMap",
      options: [undefined, "all", "goals", "completed"],
      control: { type: "select" },
    },
    isSelected: {
      description: "Whether the item is selected",
      control: "boolean",
    },
    selectedItemId: {
      description: "ID of the currently selected item",
      control: "text",
    },
    onRowClick: { action: "clicked" },
  },
} satisfies Meta<typeof TableRow>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default TableRow showing a goal that is on track
 */
export const Default: Story = {
  render: (args) => (
    <>
      <TableHeader filter={args.filter} />
      <tbody>
        <TableRow {...args} />
      </tbody>
    </>
  ),
  args: {
    item: mockGoalOnTrack,
    level: 0,
    isLast: false,
    filter: "all",
    isSelected: false,
  },
};

/**
 * A completed goal with 100% progress
 */
export const CompletedGoal: Story = {
  render: (args) => (
    <div className="pb-12">
      <TableHeader filter={args.filter} />
      <tbody>
        <TableRow {...args} />
      </tbody>
    </div>
  ),
  args: {
    item: mockGoalCompleted,
    level: 0,
    isLast: false,
    filter: "all",
    isSelected: false,
  },
};

/**
 * An achieved goal (similar to completed but specifically for goals)
 */
export const AchievedGoal: Story = {
  render: (args) => (
    <div className="pb-12">
      <TableHeader filter={args.filter} />
      <tbody>
        <TableRow {...args} />
      </tbody>
    </div>
  ),
  args: {
    item: mockGoalAchieved,
    level: 0,
    isLast: false,
    filter: "all",
    isSelected: false,
  },
};

/**
 * A goal that was partially achieved
 */
export const PartiallyAchievedGoal: Story = {
  render: (args) => (
    <div className="pb-12">
      <TableHeader filter={args.filter} />
      <tbody>
        <TableRow {...args} />
      </tbody>
    </div>
  ),
  args: {
    item: mockGoalPartial,
    level: 0,
    isLast: false,
    filter: "all",
    isSelected: false,
  },
};

/**
 * A goal that missed its target
 */
export const MissedGoal: Story = {
  render: (args) => (
    <div className="pb-12">
      <TableHeader filter={args.filter} />
      <tbody>
        <TableRow {...args} />
      </tbody>
    </div>
  ),
  args: {
    item: mockGoalMissed,
    level: 0,
    isLast: false,
    filter: "all",
    isSelected: false,
  },
};

/**
 * A paused goal
 */
export const PausedGoal: Story = {
  render: (args) => (
    <div className="pb-12">
      <TableHeader filter={args.filter} />
      <tbody>
        <TableRow {...args} />
      </tbody>
    </div>
  ),
  args: {
    item: mockGoalPaused,
    level: 0,
    isLast: false,
    filter: "all",
    isSelected: false,
  },
};

/**
 * A goal with caution status
 */
export const CautionGoal: Story = {
  render: (args) => (
    <div className="pb-12">
      <TableHeader filter={args.filter} />
      <tbody>
        <TableRow {...args} />
      </tbody>
    </div>
  ),
  args: {
    item: mockGoalCaution,
    level: 0,
    isLast: false,
    filter: "all",
    isSelected: false,
  },
};

/**
 * A goal with an issue
 */
export const IssueGoal: Story = {
  render: (args) => (
    <div className="pb-12">
      <TableHeader filter={args.filter} />
      <tbody>
        <TableRow {...args} />
      </tbody>
    </div>
  ),
  args: {
    item: mockGoalIssue,
    level: 0,
    isLast: false,
    filter: "all",
    isSelected: false,
  },
};

/**
 * A project that is on track
 */
export const OnTrackProject: Story = {
  render: (args) => (
    <>
      <TableHeader filter={args.filter} />
      <tbody>
        <TableRow {...args} />
      </tbody>
    </>
  ),
  args: {
    item: mockProjectOnTrack,
    level: 0,
    isLast: false,
    filter: "all",
    isSelected: false,
  },
};

/**
 * A completed project
 */
export const CompletedProject: Story = {
  render: (args) => (
    <>
      <TableHeader filter={args.filter} />
      <tbody>
        <TableRow {...args} />
      </tbody>
    </>
  ),
  args: {
    item: mockProjectCompleted,
    level: 0,
    isLast: false,
    filter: "all",
    isSelected: false,
  },
};

/**
 * A selected row
 */
export const SelectedRow: Story = {
  render: (args) => (
    <>
      <TableHeader filter={args.filter} />
      <tbody>
        <TableRow {...args} />
      </tbody>
    </>
  ),
  args: {
    item: mockGoalOnTrack,
    level: 0,
    isLast: false,
    filter: "all",
    isSelected: true,
  },
};

/**
 * An indented row (level 1)
 */
export const IndentedRow: Story = {
  render: (args) => (
    <>
      <TableHeader filter={args.filter} />
      <tbody>
        <TableRow {...args} />
      </tbody>
    </>
  ),
  args: {
    item: mockProjectOnTrack,
    level: 1,
    isLast: false,
    filter: "all",
    isSelected: false,
  },
};

/**
 * A row with the completed filter applied
 */
export const CompletedFilter: Story = {
  render: (args) => (
    <>
      <TableHeader filter={args.filter} />
      <tbody>
        <TableRow {...args} />
      </tbody>
    </>
  ),
  args: {
    item: mockGoalCompleted,
    level: 0,
    isLast: false,
    filter: "completed",
    isSelected: false,
  },
};

/**
 * A row with the goals filter applied
 */
export const GoalsFilter: Story = {
  render: (args) => (
    <>
      <TableHeader filter={args.filter} />
      <tbody>
        <TableRow {...args} />
      </tbody>
    </>
  ),
  args: {
    item: mockGoalOnTrack,
    level: 0,
    isLast: false,
    filter: "goals",
    isSelected: false,
  },
};

/**
 * Multiple rows showing different statuses
 */
export const MultipleRows: Story = {
  render: (args) => (
    <>
      <TableHeader filter={args.filter} />
      <tbody>
        <TableRow item={mockGoalOnTrack} level={0} isLast={false} filter={args.filter} />
        <TableRow item={mockProjectOnTrack} level={1} isLast={false} filter={args.filter} />
        <TableRow item={mockGoalCompleted} level={0} isLast={false} filter={args.filter} />
        <TableRow item={mockProjectCompleted} level={0} isLast={true} filter={args.filter} />
      </tbody>
    </>
  ),
  args: {
    filter: "all",
    item: mockGoalOnTrack, // These args won't be used directly by the render function
    level: 0, // but are required by the StoryAnnotations type
    isLast: false,
  },
};
