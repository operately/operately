import type { Meta, StoryObj } from "@storybook/react";
import { TableRow } from "./TableRow";
import type { WorkMap } from ".";
import { TableHeader } from "./WorkMapTable/TableHeader";
import { currentYear } from "../utils/timeframes";
import { PrivacyIndicator } from "../PrivacyIndicator";
import { genPeople } from "../utils/storybook/genPeople";
import { expect, within, userEvent } from "@storybook/test";

// Mock data for stories
const mockOwner = genPeople(1)[0];

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
    privacy: "internal" as PrivacyIndicator.PrivacyLevels,
    timeframe: {
      startDate: "2025-01-15T00:00:00.000Z",
      endDate: "2025-06-30T00:00:00.000Z",
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
    closedAt: "2025-03-15T00:00:00.000Z",
    isNew: false,
    completedOn: status === "completed" || status === "achieved" ? "2025-03-15T00:00:00.000Z" : null,
    children: hasChildren ? [childItem] : [],
    itemPath: "#",
    privacy: "internal" as PrivacyIndicator.PrivacyLevels,
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
        startDate: "2025-01-01T00:00:00.000Z",
        endDate: "2025-12-31T00:00:00.000Z",
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
const mockGoalOutdated = createMockItem("goal-9", "Update legacy documentation", "goal", "outdated", 30);
const mockProjectOnTrack = createMockItem("project-1", "Redesign product dashboard", "project", "on_track", 55);
const mockProjectCompleted = createMockItem("project-2", "Update documentation", "project", "completed", 100);
const mockProjectOutdated = createMockItem("project-3", "Refactor authentication system", "project", "outdated", 25);

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
 * A completed goal
 */
export const CompletedGoal: Story = {
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
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Verify completed goal has line-through style", async () => {
      const goalName = canvas.getByText("Launch new marketing campaign");
      expect(goalName.className).toContain("line-through");
    });

    await step("Verify status badge has correct styles", async () => {
      // Verify the badge has the correct styles (StatusBadge/index.tsx):
      // bgColor = "bg-green-50 dark:bg-green-900/30";
      // textColor = "text-green-700 dark:text-green-300";
      // borderColor = "border-green-200 dark:border-green-800";

      const statusBadge = canvas.getByText("Completed");

      expect(statusBadge.className).toContain("bg-green-50");
      expect(statusBadge.className).toContain("text-green-700");
      expect(statusBadge?.className).toContain("border-green-200");
    });
  },
};

/**
 * An achieved goal (similar to completed but specifically for goals)
 */
export const AchievedGoal: Story = {
  render: (args) => (
    <>
      <TableHeader filter={args.filter} />
      <tbody>
        <TableRow {...args} />
      </tbody>
    </>
  ),
  args: {
    item: mockGoalAchieved,
    level: 0,
    isLast: false,
    filter: "completed",
    isSelected: false,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Verify achieved goal has line-through style", async () => {
      const goalName = canvas.getByText("Increase website traffic by 50%");
      expect(goalName.className).toContain("line-through");
    });

    await step("Verify status badge has correct styles", async () => {
      // Verify the badge has the correct styles (StatusBadge/index.tsx):
      // bgColor = "bg-green-50 dark:bg-green-900/30";
      // textColor = "text-green-700 dark:text-green-300";
      // borderColor = "border-green-200 dark:border-green-800";

      const statusBadge = canvas.getByText("Achieved");

      expect(statusBadge.className).toContain("bg-green-50");
      expect(statusBadge.className).toContain("text-green-700");
      expect(statusBadge?.className).toContain("border-green-200");
    });
  },
};

/**
 * A goal that was partially achieved
 */
export const PartiallyAchievedGoal: Story = {
  render: (args) => (
    <>
      <TableHeader filter={args.filter} />
      <tbody>
        <TableRow {...args} />
      </tbody>
    </>
  ),
  args: {
    item: mockGoalPartial,
    level: 0,
    isLast: false,
    filter: "completed",
    isSelected: false,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Verify achieved goal has line-through style", async () => {
      const goalName = canvas.getByText("Reduce customer support tickets by 30%");
      expect(goalName.className).toContain("line-through");
    });

    await step("Verify status badge has correct styles", async () => {
      // Verify the badge has the correct styles (StatusBadge/index.tsx):
      // bgColor = "bg-amber-50 dark:bg-amber-900/30";
      // textColor = "text-amber-800 dark:text-amber-300";
      // dotColor = "bg-amber-500 dark:bg-amber-400";
      // borderColor = "border-amber-200 dark:border-amber-800";

      const statusBadge = canvas.getByText("Partial");

      expect(statusBadge.className).toContain("bg-amber-50");
      expect(statusBadge.className).toContain("text-amber-800");
      expect(statusBadge?.className).toContain("border-amber-200");
    });
  },
};

/**
 * A goal that missed its target
 */
export const MissedGoal: Story = {
  render: (args) => (
    <>
      <TableHeader filter={args.filter} />
      <tbody>
        <TableRow {...args} />
      </tbody>
    </>
  ),
  args: {
    item: mockGoalMissed,
    level: 0,
    isLast: false,
    filter: "completed",
    isSelected: false,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Verify missed goal has line-through style", async () => {
      const goalName = canvas.getByText("Launch mobile app by Q1");
      expect(goalName.className).toContain("line-through");
    });

    await step("Verify status badge has correct styles", async () => {
      // Verify the badge has the correct styles (StatusBadge/index.tsx):
      // bgColor = "bg-red-50 dark:bg-red-900/30";
      // textColor = "text-red-700 dark:text-red-300";
      // dotColor = "bg-red-500 dark:bg-red-400";
      // borderColor = "border-red-200 dark:border-red-800";

      const statusBadge = canvas.getByText("Missed");

      expect(statusBadge.className).toContain("bg-red-50");
      expect(statusBadge.className).toContain("text-red-700");
      expect(statusBadge?.className).toContain("border-red-200");
    });
  },
};

/**
 * A paused goal
 */
export const PausedGoal: Story = {
  render: (args) => (
    <>
      <TableHeader filter={args.filter} />
      <tbody>
        <TableRow {...args} />
      </tbody>
    </>
  ),
  args: {
    item: mockGoalPaused,
    level: 0,
    isLast: false,
    filter: "all",
    isSelected: false,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Verify paused goal does not have line-through style", async () => {
      const goalName = canvas.getByText("Expand to international markets");
      expect(goalName.className).not.toContain("line-through");
    });

    await step("Verify status badge has correct styles", async () => {
      // Verify the badge has the correct styles (StatusBadge/index.tsx):
      // bgColor = "bg-gray-100 dark:bg-gray-700";
      // textColor = "text-gray-700 dark:text-gray-300";
      // dotColor = "bg-gray-400 dark:bg-gray-400";
      // borderColor = "border-gray-200 dark:border-gray-600";

      const statusBadge = canvas.getByText("Paused");

      expect(statusBadge.className).toContain("bg-gray-100");
      expect(statusBadge.className).toContain("text-gray-700");
      expect(statusBadge?.className).toContain("border-gray-200");
    });

    await step("Verify progress bar shows correct progress", async () => {
      const progressBar = canvas.getByRole("progress-bar");

      const innerBar = within(progressBar).getByTestId("progress-percentage-bar");

      const innerBarWidth = innerBar?.getBoundingClientRect().width || 0;
      const outerBarWidth = progressBar.getBoundingClientRect().width;

      const percentage = Math.round((innerBarWidth / outerBarWidth) * 100);

      expect(percentage).toEqual(20);
      expect(innerBar?.className).toContain("bg-gray-400");
    });
  },
};

/**
 * A goal with caution status
 */
export const CautionGoal: Story = {
  render: (args) => (
    <>
      <TableHeader filter={args.filter} />
      <tbody>
        <TableRow {...args} />
      </tbody>
    </>
  ),
  args: {
    item: mockGoalCaution,
    level: 0,
    isLast: false,
    filter: "all",
    isSelected: false,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Verify caution goal does not have line-through style", async () => {
      const goalName = canvas.getByText("Implement new CRM system");
      expect(goalName.className).not.toContain("line-through");
    });

    await step("Verify status badge has correct styles", async () => {
      // Verify the badge has the correct styles (StatusBadge/index.tsx):
      // bgColor = "bg-amber-50 dark:bg-amber-900/30";
      // textColor = "text-amber-800 dark:text-amber-300";
      // dotColor = "bg-amber-500 dark:bg-amber-400";
      // borderColor = "border-amber-200 dark:border-amber-800";
      // label = "Attention";

      const statusBadge = canvas.getByText("Attention");

      expect(statusBadge.className).toContain("bg-amber-50");
      expect(statusBadge.className).toContain("text-amber-800");
      expect(statusBadge?.className).toContain("border-amber-200");
    });

    await step("Verify progress bar shows correct progress", async () => {
      const progressBar = canvas.getByRole("progress-bar");

      const innerBar = within(progressBar).getByTestId("progress-percentage-bar");

      const innerBarWidth = innerBar?.getBoundingClientRect().width || 0;
      const outerBarWidth = progressBar.getBoundingClientRect().width;

      const percentage = Math.round((innerBarWidth / outerBarWidth) * 100);

      expect(percentage).toEqual(35);
      expect(innerBar?.className).toContain("bg-amber-400");
    });
  },
};

/**
 * A goal with an issue
 */
export const IssueGoal: Story = {
  render: (args) => (
    <>
      <TableHeader filter={args.filter} />
      <tbody>
        <TableRow {...args} />
      </tbody>
    </>
  ),
  args: {
    item: mockGoalIssue,
    level: 0,
    isLast: false,
    filter: "all",
    isSelected: false,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Verify issue goal does not have line-through style", async () => {
      const goalName = canvas.getByText("Migrate legacy systems");
      expect(goalName.className).not.toContain("line-through");
    });

    await step("Verify status badge has correct styles", async () => {
      // Verify the badge has the correct styles (StatusBadge/index.tsx):
      // bgColor = "bg-red-50 dark:bg-red-900/30";
      // textColor = "text-red-700 dark:text-red-300";
      // dotColor = "bg-red-500 dark:bg-red-400";
      // borderColor = "border-red-200 dark:border-red-800";
      // label = "At risk";

      const statusBadge = canvas.getByText("At risk");

      expect(statusBadge.className).toContain("bg-red-50");
      expect(statusBadge.className).toContain("text-red-700");
      expect(statusBadge?.className).toContain("border-red-200");
    });

    await step("Verify progress bar shows correct progress", async () => {
      const progressBar = canvas.getByRole("progress-bar");

      const innerBar = within(progressBar).getByTestId("progress-percentage-bar");

      const innerBarWidth = innerBar?.getBoundingClientRect().width || 0;
      const outerBarWidth = progressBar.getBoundingClientRect().width;

      const percentage = Math.round((innerBarWidth / outerBarWidth) * 100);

      expect(percentage).toEqual(15);
      expect(innerBar?.className).toContain("bg-red-400");
    });
  },
};

/**
 * Items with outdated status
 */
export const OutdatedItems: Story = {
  render: (args) => (
    <>
      <TableHeader filter={args.filter} />
      <tbody>
        <TableRow item={mockGoalOutdated} level={0} isLast={false} filter={args.filter} />
        <TableRow item={mockProjectOutdated} level={0} isLast={true} filter={args.filter} />
      </tbody>
    </>
  ),
  args: {
    item: mockGoalOutdated, // This is required by the Story type but overridden in render
    level: 0,
    isLast: false,
    filter: "all",
    isSelected: false,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Verify outdated items have correct badge styles", async () => {
      const outdatedBadges = canvas.getAllByText("Outdated");
      expect(outdatedBadges.length).toEqual(2); // Should be two outdated items

      // Verify the badge has the correct styles (StatusBadge/index.tsx):
      // bgColor = "bg-gray-100 dark:bg-gray-700";
      // textColor = "text-gray-700 dark:text-gray-300";
      // borderColor = "border-gray-200 dark:border-gray-600";

      outdatedBadges.forEach((badge) => {
        expect(badge.className).toContain("bg-gray-100");
        expect(badge.className).toContain("text-gray-700");
        expect(badge?.className).toContain("border-gray-200");
      });
    });

    await step("Verify outdated goal progress bar", async () => {
      const goalName = canvas.getByText("Update legacy documentation");
      const goalRow = goalName.closest("tr");

      const progressBar = within(goalRow as HTMLElement).getByRole("progress-bar");
      const innerBar = within(progressBar).getByTestId("progress-percentage-bar");

      const innerBarWidth = innerBar?.getBoundingClientRect().width || 0;
      const outerBarWidth = progressBar.getBoundingClientRect().width;

      const percentage = Math.round((innerBarWidth / outerBarWidth) * 100);

      expect(percentage).toEqual(30);
      expect(innerBar?.className).toContain("bg-gray-400");
    });

    await step("Verify outdated project progress bar", async () => {
      const projectName = canvas.getByText("Refactor authentication system");
      const projectRow = projectName.closest("tr");

      // Find the progress bar in this row
      const progressBar = within(projectRow as HTMLElement).getByRole("progress-bar");
      const innerBar = within(progressBar).getByTestId("progress-percentage-bar");

      const innerBarWidth = innerBar?.getBoundingClientRect().width || 0;
      const outerBarWidth = progressBar.getBoundingClientRect().width;

      const percentage = Math.round((innerBarWidth / outerBarWidth) * 100);

      expect(percentage).toEqual(25);
      expect(innerBar?.className).toContain("bg-gray-400");
    });
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
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Verify on-track project does not have line-through style", async () => {
      const projectName = canvas.getByText("Redesign product dashboard");
      expect(projectName.className).not.toContain("line-through");
    });

    await step("Verify status badge has correct styles", async () => {
      // Verify the badge has the correct styles (StatusBadge/index.tsx):
      // bgColor = "bg-green-50 dark:bg-green-900/30";
      // textColor = "text-green-700 dark:text-green-300";
      // dotColor = "bg-green-500 dark:bg-green-400";
      // borderColor = "border-green-200 dark:border-green-800";
      // label = "On track";

      const statusBadge = canvas.getByText("On track");

      expect(statusBadge.className).toContain("bg-green-50");
      expect(statusBadge.className).toContain("text-green-700");
      expect(statusBadge?.className).toContain("border-green-200");
    });

    await step("Verify progress bar shows correct progress", async () => {
      const progressBar = canvas.getByRole("progress-bar");

      const innerBar = within(progressBar).getByTestId("progress-percentage-bar");

      const innerBarWidth = innerBar?.getBoundingClientRect().width || 0;
      const outerBarWidth = progressBar.getBoundingClientRect().width;

      const percentage = Math.round((innerBarWidth / outerBarWidth) * 100);

      expect(percentage).toEqual(55);
      expect(innerBar?.className).toContain("bg-green-400");
    });
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
    filter: "completed",
    isSelected: false,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Verify completed project has line-through style", async () => {
      const projectName = canvas.getByText("Update documentation");
      expect(projectName.className).toContain("line-through");
    });

    await step("Verify status badge has correct styles", async () => {
      // Verify the badge has the correct styles (StatusBadge/index.tsx):
      // bgColor = "bg-green-50 dark:bg-green-900/30";
      // textColor = "text-green-700 dark:text-green-300";
      // borderColor = "border-green-200 dark:border-green-800";

      const statusBadge = canvas.getByText("Completed");

      expect(statusBadge.className).toContain("bg-green-50");
      expect(statusBadge.className).toContain("text-green-700");
      expect(statusBadge?.className).toContain("border-green-200");
    });
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

/**
 * Shows different privacy levels for WorkMap items
 */
export const PrivacyLevels: Story = {
  render: (args) => {
    // Create items with different privacy levels
    const publicItem = {
      ...createMockItem("item-public", "Public item example", "goal", "on_track", 60),
      privacy: "public" as PrivacyIndicator.PrivacyLevels,
    };

    const internalItem = {
      ...createMockItem("item-internal", "Internal item example", "goal", "on_track", 40),
      privacy: "internal" as PrivacyIndicator.PrivacyLevels,
    };

    const confidentialItem = {
      ...createMockItem("item-confidential", "Confidential item example", "project", "on_track", 70),
      privacy: "confidential" as PrivacyIndicator.PrivacyLevels,
    };

    const secretItem = {
      ...createMockItem("item-secret", "Secret item example", "project", "caution", 25),
      privacy: "secret" as PrivacyIndicator.PrivacyLevels,
    };

    return (
      <div className="pb-4">
        <h3 className="text-lg font-medium mb-4">Privacy Indicator Variants</h3>
        <table className="w-full border-collapse">
          <TableHeader filter={args.filter} />
          <tbody>
            <TableRow {...args} item={publicItem} isLast={false} />
            <TableRow {...args} item={internalItem} isLast={false} />
            <TableRow {...args} item={confidentialItem} isLast={false} />
            <TableRow {...args} item={secretItem} isLast={true} />
          </tbody>
        </table>
        <div className="mt-6 p-4 bg-surface-raised rounded-md">
          <p className="text-sm font-medium mb-2">Privacy Levels:</p>
          <ul className="text-sm">
            <li>
              <span className="font-semibold">Public</span> - Visible to anyone on the internet
            </li>
            <li>
              <span className="font-semibold">Internal</span> - Default mode, no special indicator shown
            </li>
            <li>
              <span className="font-semibold">Confidential</span> - Space members only, shown with a lock icon
            </li>
            <li>
              <span className="font-semibold">Secret</span> - Only visible to specific members, shown with a red lock
              icon
            </li>
          </ul>
        </div>
      </div>
    );
  },
  args: {
    level: 0,
    filter: "all",
    isSelected: false,
    item: mockGoalOnTrack, // This is required by the Story type, but our render function overrides it
    isLast: false, // Also required by the Story type
  },
  parameters: {
    docs: {
      description: {
        story: "Showcases the different privacy levels available for WorkMap items.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    // Get all table rows
    const rows = canvas.getAllByRole("row").filter((row) => row.querySelector("td"));

    await step("Verify there are 4 rows for different privacy levels", async () => {
      expect(rows.length).toBe(4);
    });

    await step("Verify Public item has privacy indicator with correct tooltip", async () => {
      const publicRow = canvas.getByText("Public item example").closest("tr");

      const privacyIndicator = within(publicRow as HTMLElement).getByTestId("privacy-indicator");
      expect(privacyIndicator).not.toBeNull();

      const message = "Anyone on the internet";
      expect(canvas.queryByText(message)).toBeNull();

      await userEvent.hover(privacyIndicator);

      const tooltipText = canvas.queryAllByText(message);
      expect(tooltipText).not.toBeNull();

      await userEvent.unhover(privacyIndicator);
      expect(canvas.queryByText(message)).toBeNull();
    });

    await step("Verify Internal item does not have privacy indicator", async () => {
      const internalRow = canvas.getByText("Internal item example").closest("tr");

      const privacyIndicator = within(internalRow as HTMLElement).queryByTestId("privacy-indicator");
      expect(privacyIndicator).toBeNull();
    });

    await step("Verify Confidential item has privacy indicator with correct tooltip", async () => {
      const confidentialRow = canvas.getByText("Confidential item example").closest("tr");

      const privacyIndicator = within(confidentialRow as HTMLElement).getByTestId("privacy-indicator");
      expect(privacyIndicator).not.toBeNull();

      const message = "Only Product members";
      expect(canvas.queryByText(message)).toBeNull();

      await userEvent.hover(privacyIndicator);

      const tooltipText = canvas.queryAllByText(message);
      expect(tooltipText).not.toBeNull();

      await userEvent.unhover(privacyIndicator);
      expect(canvas.queryByText(message)).toBeNull();
    });

    await step("Verify Secret item has privacy indicator with correct tooltip", async () => {
      const secretRow = canvas.getByText("Secret item example").closest("tr");

      const privacyIndicator = within(secretRow as HTMLElement).getByTestId("privacy-indicator");
      expect(privacyIndicator).not.toBeNull();

      const message = "Invite-Only";
      expect(canvas.queryByText(message)).toBeNull();

      await userEvent.hover(privacyIndicator);

      const tooltipText = canvas.queryAllByText(message);
      expect(tooltipText).not.toBeNull();

      await userEvent.unhover(privacyIndicator);
      expect(canvas.queryByText(message)).toBeNull();
    });
  },
};
