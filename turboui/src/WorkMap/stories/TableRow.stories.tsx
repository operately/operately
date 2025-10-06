import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { PrivacyIndicator } from "../../PrivacyIndicator";

import { TableRow, SetItemExpandedFn, IsItemExpandedFn } from "../components/TableRow";
import { TableHeader } from "../components/WorkMapTable";

import * as data from "../tests/mockData";
import * as Steps from "../tests/steps";

type TableRowProps = React.ComponentProps<typeof TableRow>;

function StoryTableRow({ isExpanded: _ignoredIsExpanded, setItemExpanded: _ignoredSetItemExpanded, ...rest }: TableRowProps) {
  const [expandedState, setExpandedState] = React.useState<Record<string, boolean>>({});

  const getItemExpanded = React.useCallback<IsItemExpandedFn>(
    (id) => expandedState[id] !== false,
    [expandedState],
  );

  const updateItemExpanded = React.useCallback<SetItemExpandedFn>((id, valueOrUpdater) => {
    setExpandedState((previousState) => {
      const currentValue = previousState[id] ?? true;
      const nextValue =
        typeof valueOrUpdater === "function"
          ? (valueOrUpdater as (prev: boolean) => boolean)(currentValue)
          : valueOrUpdater;

      if (nextValue === true) {
        if (currentValue === true && !(id in previousState)) {
          return previousState;
        }

        const { [id]: _removed, ...restState } = previousState;
        return restState;
      }

      if (currentValue === nextValue) {
        return previousState;
      }

      return { ...previousState, [id]: nextValue };
    });
  }, []);

  return <TableRow {...rest} isExpanded={getItemExpanded} setItemExpanded={updateItemExpanded} />;
}

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
    tab: {
      description: "Current tab applied to the WorkMap",
      options: [undefined, "all", "goals", "completed"],
      control: { type: "select" },
    },
    showIndentation: {
      description: "Whether to show indentation guides",
      control: "boolean",
    },
  },
  args: {
    showIndentation: true,
    isExpanded: () => true,
    setItemExpanded: () => undefined,
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
      <TableHeader tab={args.tab} />
      <tbody>
        <StoryTableRow {...args} />
      </tbody>
    </>
  ),
  args: {
    item: data.mockGoalOnTrack,
    level: 0,
    isLast: false,
    tab: "all",
  },
};

/**
 * A completed goal
 */
export const CompletedGoal: Story = {
  render: (args) => (
    <>
      <TableHeader tab={args.tab} />
      <tbody>
        <StoryTableRow {...args} />
      </tbody>
    </>
  ),
  args: {
    item: data.mockGoalCompleted,
    level: 0,
    isLast: false,
    tab: "completed",
  },
  play: async ({ canvasElement, step }) => {
    await Steps.assertItemHasLineThrough(canvasElement, step, "Launch new marketing campaign");

    await Steps.assertStatusBadge(canvasElement, step, "Achieved", "green");
  },
};

/**
 * An achieved goal (similar to completed but specifically for goals)
 */
export const AchievedGoal: Story = {
  render: (args) => (
    <>
      <TableHeader tab={args.tab} />
      <tbody>
        <StoryTableRow {...args} />
      </tbody>
    </>
  ),
  args: {
    item: data.mockGoalAchieved,
    level: 0,
    isLast: false,
    tab: "completed",
  },
  play: async ({ canvasElement, step }) => {
    await Steps.assertItemHasLineThrough(canvasElement, step, "Increase website traffic by 50%");

    await Steps.assertStatusBadge(canvasElement, step, "Achieved", "green");
  },
};

/**
 * A goal that missed its target
 */
export const MissedGoal: Story = {
  render: (args) => (
    <>
      <TableHeader tab={args.tab} />
      <tbody>
        <StoryTableRow {...args} />
      </tbody>
    </>
  ),
  args: {
    item: data.mockGoalMissed,
    level: 0,
    isLast: false,
    tab: "completed",
  },
  play: async ({ canvasElement, step }) => {
    await Steps.assertItemHasLineThrough(canvasElement, step, "Launch mobile app by Q1");

    await Steps.assertStatusBadge(canvasElement, step, "Missed", "red");
  },
};

/**
 * A paused goal
 */
export const PausedGoal: Story = {
  render: (args) => (
    <>
      <TableHeader tab={args.tab} />
      <tbody>
        <StoryTableRow {...args} />
      </tbody>
    </>
  ),
  args: {
    item: data.mockGoalPaused,
    level: 0,
    isLast: false,
    tab: "all",
  },
  play: async ({ canvasElement, step }) => {
    await Steps.refuteItemHasLineThrough(canvasElement, step, "Expand to international markets");

    await Steps.assertStatusBadge(canvasElement, step, "Paused", "gray");

    await Steps.assertProgressBar(canvasElement, step, 20, "gray");
  },
};

/**
 * A goal with caution status
 */
export const CautionGoal: Story = {
  render: (args) => (
    <>
      <TableHeader tab={args.tab} />
      <tbody>
        <StoryTableRow {...args} />
      </tbody>
    </>
  ),
  args: {
    item: data.mockGoalCaution,
    level: 0,
    isLast: false,
    tab: "all",
  },
  play: async ({ canvasElement, step }) => {
    await Steps.refuteItemHasLineThrough(canvasElement, step, "Implement new CRM system");

    await Steps.assertStatusBadge(canvasElement, step, "Caution", "amber");

    await Steps.assertProgressBar(canvasElement, step, 35, "amber");
  },
};

/**
 * A goal with an issue
 */
export const IssueGoal: Story = {
  render: (args) => (
    <>
      <TableHeader tab={args.tab} />
      <tbody>
        <StoryTableRow {...args} />
      </tbody>
    </>
  ),
  args: {
    item: data.mockGoalIssue,
    level: 0,
    isLast: false,
    tab: "all",
  },
  play: async ({ canvasElement, step }) => {
    await Steps.refuteItemHasLineThrough(canvasElement, step, "Migrate legacy systems");

    await Steps.assertStatusBadge(canvasElement, step, "Off track", "red");

    await Steps.assertProgressBar(canvasElement, step, 15, "red");
  },
};

/**
 * A goal with outdated status
 */
export const OutdatedGoal: Story = {
  render: (args) => (
    <>
      <TableHeader tab={args.tab} />
      <tbody>
        <StoryTableRow
          {...args}
          item={data.mockGoalOutdated}
          level={0}
          isLast={false}
          tab={args.tab}
          showIndentation={args.showIndentation}
        />
      </tbody>
    </>
  ),
  args: {
    item: data.mockGoalOutdated, // This is required by the Story type but overridden in render
    level: 0,
    isLast: false,
    tab: "all",
  },
  play: async ({ canvasElement, step }) => {
    await Steps.refuteItemHasLineThrough(canvasElement, step, "Update legacy documentation");

    await Steps.assertStatusBadge(canvasElement, step, "Outdated", "gray");

    await Steps.assertProgressBar(canvasElement, step, 30, "gray");
  },
};

/**
 * A project that is on track
 */
export const OnTrackProject: Story = {
  render: (args) => (
    <>
      <TableHeader tab={args.tab} />
      <tbody>
        <StoryTableRow {...args} />
      </tbody>
    </>
  ),
  args: {
    item: data.mockProjectOnTrack,
    level: 0,
    isLast: false,
    tab: "all",
  },
  play: async ({ canvasElement, step }) => {
    await Steps.refuteItemHasLineThrough(canvasElement, step, "Redesign product dashboard");

    await Steps.assertStatusBadge(canvasElement, step, "On track", "green");

    await Steps.assertProgressBar(canvasElement, step, 55, "green");
  },
};

/**
 * A completed project
 */
export const CompletedProject: Story = {
  render: (args) => (
    <>
      <TableHeader tab={args.tab} />
      <tbody>
        <TableRow {...args} />
      </tbody>
    </>
  ),
  args: {
    item: data.mockProjectCompleted,
    level: 0,
    isLast: false,
    tab: "completed",
  },
  play: async ({ canvasElement, step }) => {
    await Steps.assertItemHasLineThrough(canvasElement, step, "Update documentation");

    await Steps.assertStatusBadge(canvasElement, step, "Achieved", "green");
  },
};

/**
 * Multiple rows showing different statuses
 */
export const MultipleRows: Story = {
  render: (args) => (
    <>
      <TableHeader tab={args.tab} />
      <tbody>
        <StoryTableRow
          {...args}
          item={data.mockGoalOnTrack}
          level={0}
          isLast={false}
          tab={args.tab}
          showIndentation={args.showIndentation}
        />
        <StoryTableRow
          {...args}
          item={data.mockProjectOnTrack}
          level={1}
          isLast={false}
          tab={args.tab}
          showIndentation={args.showIndentation}
        />
        <StoryTableRow
          {...args}
          item={data.mockGoalCompleted}
          level={0}
          isLast={false}
          tab={args.tab}
          showIndentation={args.showIndentation}
        />
        <StoryTableRow
          {...args}
          item={data.mockProjectCompleted}
          level={0}
          isLast={true}
          tab={args.tab}
          showIndentation={args.showIndentation}
        />
      </tbody>
    </>
  ),
  args: {
    tab: "all",
    item: data.mockGoalOnTrack, // These args won't be used directly by the render function
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
      ...data.createMockItem("item-public", "Public item example", "goal", "on_track", 60),
      privacy: "public" as PrivacyIndicator.PrivacyLevels,
    };

    const internalItem = {
      ...data.createMockItem("item-internal", "Internal item example", "goal", "on_track", 40),
      privacy: "internal" as PrivacyIndicator.PrivacyLevels,
    };

    const confidentialItem = {
      ...data.createMockItem("item-confidential", "Confidential item example", "project", "on_track", 70),
      privacy: "confidential" as PrivacyIndicator.PrivacyLevels,
    };

    const secretItem = {
      ...data.createMockItem("item-secret", "Secret item example", "project", "caution", 25),
      privacy: "secret" as PrivacyIndicator.PrivacyLevels,
    };

    return (
      <div className="pb-4">
        <h3 className="text-lg font-medium mb-4">Privacy Indicator Variants</h3>
        <table className="w-full border-collapse">
          <TableHeader tab={args.tab} />
          <tbody>
            <StoryTableRow {...args} item={publicItem} isLast={false} />
            <StoryTableRow {...args} item={internalItem} isLast={false} />
            <StoryTableRow {...args} item={confidentialItem} isLast={false} />
            <StoryTableRow {...args} item={secretItem} isLast={true} />
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
    tab: "all",
    item: data.mockGoalOnTrack, // This is required by the Story type, but our render function overrides it
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
    await Steps.assertRowsNumber(canvasElement, step, 4);

    await Steps.assertPrivacyIndicator(canvasElement, step, "Public item example", "Anyone on the internet");

    await Steps.refutePrivacyIndicator(canvasElement, step, "Internal item example");

    await Steps.assertPrivacyIndicator(canvasElement, step, "Confidential item example", "Only Product members");

    await Steps.assertPrivacyIndicator(canvasElement, step, "Secret item example", "Invite-Only");
  },
};
