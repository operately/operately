import type { Meta, StoryObj } from '@storybook/react';
import { TableRow } from './TableRow';
import type { WorkMapItem, Status } from './types';

// Mock data for stories
const mockOwner = {
  id: "user-1",
  name: "John Doe",
  avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
};

// Create mock items with different statuses
const createMockItem = (
  id: string, 
  name: string, 
  type: "goal" | "project", 
  status: Status, 
  progress: number,
  hasChildren: boolean = false
): WorkMapItem => ({
  id,
  name,
  type,
  status,
  progress,
  space: "Product",
  owner: mockOwner,
  nextStep: status === "completed" || status === "achieved" ? "" : "Next action to take",
  deadline: status === "completed" || status === "achieved" 
    ? undefined 
    : { display: "Dec 31 2025", isPast: false },
  completedOn: status === "completed" || status === "achieved" 
    ? { display: "Mar 15 2025" } 
    : undefined,
  children: hasChildren ? [
    {
      id: `${id}-child-1`,
      name: "Child item 1",
      type: "project",
      status: "on_track",
      progress: 50,
      space: "Product",
      owner: mockOwner,
      nextStep: "Child next step",
      children: []
    }
  ] : []
});

// Create mock items for each status
const mockGoalOnTrack = createMockItem("goal-1", "Improve customer onboarding experience", "goal", "on_track", 45, true);
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
  title: 'Components/WorkMap/TableRow',
  component: TableRow,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse">
          <tbody>
            <Story />
          </tbody>
        </table>
      </div>
    ),
  ],
  argTypes: {
    item: { 
      description: 'The WorkMap item to display',
      control: 'object'
    },
    level: {
      description: 'Indentation level',
      control: { type: 'number', min: 0, max: 5 }
    },
    isLast: {
      description: 'Whether this is the last item in the list',
      control: 'boolean'
    },
    filter: {
      description: 'Current filter applied to the WorkMap',
      options: [undefined, 'all', 'goals', 'completed'],
      control: { type: 'select' }
    },
    isSelected: {
      description: 'Whether the item is selected',
      control: 'boolean'
    },
    selectedItemId: {
      description: 'ID of the currently selected item',
      control: 'text'
    },
    onRowClick: { action: 'clicked' }
  },
} satisfies Meta<typeof TableRow>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default TableRow showing a goal that is on track
 */
export const Default: Story = {
  args: {
    item: mockGoalOnTrack,
    level: 0,
    isLast: false,
    filter: undefined,
    isSelected: false
  },
};

/**
 * A completed goal with 100% progress
 */
export const CompletedGoal: Story = {
  args: {
    item: mockGoalCompleted,
    level: 0,
    isLast: false,
    filter: undefined,
    isSelected: false
  },
};

/**
 * An achieved goal (similar to completed but specifically for goals)
 */
export const AchievedGoal: Story = {
  args: {
    item: mockGoalAchieved,
    level: 0,
    isLast: false,
    filter: undefined,
    isSelected: false
  },
};

/**
 * A goal that was partially achieved
 */
export const PartiallyAchievedGoal: Story = {
  args: {
    item: mockGoalPartial,
    level: 0,
    isLast: false,
    filter: undefined,
    isSelected: false
  },
};

/**
 * A goal that missed its target
 */
export const MissedGoal: Story = {
  args: {
    item: mockGoalMissed,
    level: 0,
    isLast: false,
    filter: undefined,
    isSelected: false
  },
};

/**
 * A paused goal
 */
export const PausedGoal: Story = {
  args: {
    item: mockGoalPaused,
    level: 0,
    isLast: false,
    filter: undefined,
    isSelected: false
  },
};

/**
 * A goal with caution status
 */
export const CautionGoal: Story = {
  args: {
    item: mockGoalCaution,
    level: 0,
    isLast: false,
    filter: undefined,
    isSelected: false
  },
};

/**
 * A goal with an issue
 */
export const IssueGoal: Story = {
  args: {
    item: mockGoalIssue,
    level: 0,
    isLast: false,
    filter: undefined,
    isSelected: false
  },
};

/**
 * A project that is on track
 */
export const OnTrackProject: Story = {
  args: {
    item: mockProjectOnTrack,
    level: 0,
    isLast: false,
    filter: undefined,
    isSelected: false
  },
};

/**
 * A completed project
 */
export const CompletedProject: Story = {
  args: {
    item: mockProjectCompleted,
    level: 0,
    isLast: false,
    filter: undefined,
    isSelected: false
  },
};

/**
 * A selected row
 */
export const SelectedRow: Story = {
  args: {
    item: mockGoalOnTrack,
    level: 0,
    isLast: false,
    filter: undefined,
    isSelected: true
  },
};

/**
 * An indented row (level 1)
 */
export const IndentedRow: Story = {
  args: {
    item: mockProjectOnTrack,
    level: 1,
    isLast: false,
    filter: undefined,
    isSelected: false
  },
};

/**
 * A row with the completed filter applied
 */
export const CompletedFilter: Story = {
  args: {
    item: mockGoalCompleted,
    level: 0,
    isLast: false,
    filter: 'completed',
    isSelected: false
  },
};

/**
 * A row with the goals filter applied
 */
export const GoalsFilter: Story = {
  args: {
    item: mockGoalOnTrack,
    level: 0,
    isLast: false,
    filter: 'goals',
    isSelected: false
  },
};

/**
 * Multiple rows showing different statuses
 */
export const MultipleRows: Story = {
  render: () => (
    <>
      <TableRow item={mockGoalOnTrack} level={0} isLast={false} />
      <TableRow item={mockGoalCompleted} level={0} isLast={false} />
      <TableRow item={mockGoalCaution} level={0} isLast={false} />
      <TableRow item={mockGoalIssue} level={0} isLast={false} />
      <TableRow item={mockProjectOnTrack} level={1} isLast={false} />
      <TableRow item={mockProjectCompleted} level={1} isLast={true} />
    </>
  ),
  args: {
    item: mockGoalOnTrack, // These args won't be used directly by the render function
    level: 0,              // but are required by the StoryAnnotations type
    isLast: false
  }
};
