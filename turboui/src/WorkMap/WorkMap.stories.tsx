import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "@storybook/test";
import WorkMap from ".";
import { TimeframeSelector } from "../TimeframeSelector";
import { currentYear, currentQuarter } from "../utils/timeframes";
import { Page } from "../Page";
import { PrivacyIndicator } from "../PrivacyIndicator";

// --- Mock Data ---
function genAvatar(id: string) {
  return `https://images.unsplash.com/${id}?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80`;
}

function getTimeframe(timeframe: TimeframeSelector.Timeframe) {
  return {
    ...timeframe,
    startDate: timeframe.startDate?.toISOString(),
    endDate: timeframe.endDate?.toISOString(),
  };
}

const people = {
  alex: {
    id: "user-alex",
    fullName: "Alex R.",
    avatarUrl: genAvatar("photo-1500648767791-00dcc994a43e"),
  },
  sophia: {
    id: "user-sophia",
    fullName: "Sophia T.",
    avatarUrl: genAvatar("photo-1438761681033-6461ffad8d80"),
  },
  jennifer: {
    id: "user-jennifer",
    fullName: "Jennifer L.",
    avatarUrl: genAvatar("photo-1494790108377-be9c29b29330"),
  },
  maximiliano: {
    id: "user-maximiliano",
    fullName: "Maximiliano Alessandro Hernández-Rodríguez",
    avatarUrl: genAvatar("photo-1507003211169-0a1dd7228f2d"),
  },
};

const mockSingleItem: WorkMap.Item = {
  id: "goal-standalone",
  parentId: null,
  type: "goal",
  name: "Single standalone goal with no children",
  status: "on_track",
  progress: 50,
  space: { id: "space-general", name: "General" },
  spacePath: "#",
  owner: people.alex,
  ownerPath: "#",
  itemPath: "#",
  isNew: false,
  completedOn: null,
  closedAt: null,
  nextStep: "Working on this standalone goal",
  privacy: "internal" as PrivacyIndicator.PrivacyLevels,
  timeframe: getTimeframe(currentQuarter()),
  children: [],
};

const mockItems: WorkMap.Item[] = [
  {
    id: "goal-1",
    parentId: null,
    type: "goal",
    name: "Acquire the first users of Operately outside Semaphore",
    status: "on_track",
    progress: 45,
    space: { id: "space-general", name: "General" },
    spacePath: "#",
    owner: people.maximiliano,
    ownerPath: "#",
    itemPath: "#",
    isNew: false,
    completedOn: null,
    closedAt: null,
    nextStep: "People are signing up for SaaS",
    privacy: "internal" as PrivacyIndicator.PrivacyLevels,
    timeframe: getTimeframe(currentYear()),
    children: [
      {
        id: "project-1",
        parentId: "goal-1",
        type: "project",
        name: "Document features in Help Center",
        status: "completed",
        progress: 100,
        space: { id: "space-product", name: "Product" },
        spacePath: "#",
        owner: people.sophia,
        ownerPath: "#",
        itemPath: "#",
        isNew: false,
        completedOn: "2025-03-10T00:00:00.000Z",
        closedAt: "2025-03-10T00:00:00.000Z",
        nextStep: "",
        privacy: "internal" as PrivacyIndicator.PrivacyLevels,
        timeframe: {
          startDate: "2024-01-15T00:00:00.000Z",
          endDate: "2025-03-31T00:00:00.000Z",
          type: "days",
        },
        children: [],
      },
      {
        id: "project-2",
        parentId: "goal-1",
        type: "project",
        name: "Release 0.4",
        status: "paused",
        progress: 30,
        space: { id: "space-product", name: "Product" },
        spacePath: "#",
        owner: people.alex,
        ownerPath: "#",
        itemPath: "#",
        isNew: false,
        completedOn: null,
        closedAt: null,
        nextStep: "All weekly updates are collected",
        privacy: "internal" as PrivacyIndicator.PrivacyLevels,
        timeframe: {
          startDate: "2024-01-01T00:00:00.000Z",
          endDate: "2025-02-07T00:00:00.000Z",
          type: "days",
        },
        children: [],
      },
      {
        id: "goal-1-1",
        parentId: "goal-1",
        type: "goal",
        name: "Increase user engagement by 50%",
        status: "on_track",
        progress: 60,
        space: { name: "Marketing", id: "space-marketing" },
        spacePath: "#",
        owner: people.sophia,
        ownerPath: "#",
        itemPath: "#",
        isNew: false,
        completedOn: null,
        closedAt: null,
        nextStep: "Launch email campaign",
        privacy: "internal" as PrivacyIndicator.PrivacyLevels,
        timeframe: getTimeframe(currentYear()),
        children: [
          {
            id: "project-3",
            parentId: "goal-1-1",
            type: "project",
            name: "Create onboarding email sequence",
            status: "on_track",
            progress: 75,
            space: { name: "Marketing", id: "space-marketing" },
            spacePath: "#",
            owner: people.jennifer,
            ownerPath: "#",
            itemPath: "#",
            isNew: false,
            completedOn: null,
            closedAt: null,
            nextStep: "Finalize email templates",
            privacy: "internal" as PrivacyIndicator.PrivacyLevels,
            timeframe: {
              startDate: "2024-06-15T00:00:00.000Z",
              endDate: "2024-10-01T00:00:00.000Z",
              type: "days",
            },
            children: [],
          },
        ],
      },
    ],
  },
  {
    id: "goal-2",
    parentId: null,
    type: "goal",
    name: "Improve customer onboarding experience",
    status: "caution",
    progress: 25,
    space: { id: "space-rd", name: "R&D" },
    spacePath: "#",
    owner: people.jennifer,
    ownerPath: "#",
    itemPath: "#",
    isNew: false,
    completedOn: null,
    closedAt: null,
    nextStep: "Conduct user interviews",
    privacy: "internal" as PrivacyIndicator.PrivacyLevels,
    timeframe: getTimeframe(currentQuarter()),
    children: [
      {
        id: "goal-2-1",
        parentId: "goal-2",
        type: "goal",
        name: "Reduce onboarding time by 30%",
        status: "issue",
        progress: 15,
        space: { id: "space-cs", name: "Customer Success" },
        spacePath: "#",
        owner: people.alex,
        ownerPath: "#",
        itemPath: "#",
        isNew: false,
        completedOn: null,
        closedAt: null,
        nextStep: "Identify bottlenecks in process",
        privacy: "internal" as PrivacyIndicator.PrivacyLevels,
        timeframe: getTimeframe(currentQuarter()),
        children: [
          {
            id: "goal-2-1-1",
            parentId: "goal-2-1",
            type: "goal",
            name: "Automate user account setup",
            status: "on_track",
            progress: 40,
            space: { id: "space-eng", name: "Engineering" },
            spacePath: "#",
            owner: people.sophia,
            ownerPath: "#",
            itemPath: "#",
            isNew: false,
            completedOn: null,
            closedAt: null,
            nextStep: "Complete backend integration",
            timeframe: getTimeframe(currentQuarter()),
            privacy: "secret" as PrivacyIndicator.PrivacyLevels,
            children: [
              {
                id: "project-8",
                parentId: "goal-2-1-1",
                type: "project",
                name: "Implement secure authentication service",
                status: "on_track",
                progress: 35,
                space: { id: "space-eng", name: "Engineering" },
                spacePath: "#",
                owner: people.alex,
                ownerPath: "#",
                itemPath: "#",
                isNew: false,
                completedOn: null,
                closedAt: null,
                nextStep: "Complete OAuth2 integration",
                privacy: "secret" as PrivacyIndicator.PrivacyLevels,
                timeframe: {
                  startDate: "2025-04-15T00:00:00.000Z",
                  endDate: "2025-07-30T00:00:00.000Z",
                  type: "days",
                },
                children: [],
              },
            ],
          },
          {
            id: "project-6",
            parentId: "goal-2-1",
            type: "project",
            name: "Implement self-guided tutorial",
            status: "on_track",
            progress: 25,
            space: { id: "space-cs", name: "Customer Success" },
            spacePath: "#",
            owner: people.jennifer,
            ownerPath: "#",
            itemPath: "#",
            isNew: false,
            completedOn: null,
            closedAt: null,
            nextStep: "Finalize content outline",
            timeframe: {
              startDate: "2024-03-01T00:00:00.000Z",
              endDate: "2025-04-30T00:00:00.000Z",
              type: "days",
            },
            privacy: "confidential" as PrivacyIndicator.PrivacyLevels,
            children: [],
          },
        ],
      },
      {
        id: "project-4",
        parentId: "goal-2",
        type: "project",
        name: "Redesign welcome screen",
        status: "on_track",
        progress: 40,
        space: { id: "space-product", name: "Product" },
        spacePath: "#",
        owner: people.alex,
        ownerPath: "#",
        itemPath: "#",
        isNew: false,
        completedOn: null,
        closedAt: null,
        nextStep: "Finalize mockups",
        privacy: "internal" as PrivacyIndicator.PrivacyLevels,
        timeframe: {
          startDate: "2025-02-01T00:00:00.000Z",
          endDate: "2025-04-20T00:00:00.000Z",
          type: "days",
        },
        children: [],
      },
    ],
  },
  {
    id: "goal-3",
    parentId: null,
    type: "goal",
    name: "Expand to international markets",
    status: "on_track",
    progress: 35,
    space: { id: "space-sales", name: "Sales" },
    spacePath: "#",
    owner: people.alex,
    ownerPath: "#",
    itemPath: "#",
    isNew: false,
    completedOn: null,
    closedAt: null,
    nextStep: "Complete market research",
    privacy: "internal" as PrivacyIndicator.PrivacyLevels,
    timeframe: getTimeframe(currentYear()),
    children: [
      {
        id: "goal-3-1",
        parentId: "goal-3",
        type: "goal",
        name: "Launch in European market",
        status: "on_track",
        progress: 50,
        space: { id: "space-intl", name: "International" },
        spacePath: "#",
        owner: people.jennifer,
        ownerPath: "#",
        itemPath: "#",
        isNew: false,
        completedOn: null,
        closedAt: null,
        nextStep: "Establish legal entity",
        privacy: "internal" as PrivacyIndicator.PrivacyLevels,
        timeframe: getTimeframe(currentYear()),
        children: [
          {
            id: "project-5",
            parentId: "goal-3-1",
            type: "project",
            name: "GDPR compliance implementation",
            status: "caution",
            progress: 30,
            space: { id: "space-legal", name: "Legal" },
            spacePath: "#",
            owner: people.sophia,
            ownerPath: "#",
            itemPath: "#",
            isNew: false,
            completedOn: null,
            closedAt: null,
            nextStep: "Complete data audit",
            privacy: "internal" as PrivacyIndicator.PrivacyLevels,
            timeframe: {
              startDate: "2025-04-01T00:00:00.000Z",
              endDate: "2025-08-01T00:00:00.000Z",
              type: "days",
            },
            children: [],
          },
        ],
      },
      {
        id: "goal-3-2",
        parentId: "goal-3",
        type: "goal",
        name: "Establish comprehensive strategic partnerships with key industry leaders across multiple sectors to drive sustainable long-term growth and market penetration",
        status: "on_track",
        progress: 25,
        space: { name: "Business Development", id: "space-bd" },
        owner: people.alex,
        isNew: false,
        completedOn: null,
        closedAt: null,
        nextStep: "Identify potential partners",
        privacy: "internal" as PrivacyIndicator.PrivacyLevels,
        timeframe: getTimeframe(currentYear()),
        ownerPath: "#",
        spacePath: "#",
        itemPath: "#",
        children: [],
      },
    ],
  },
  {
    id: "goal-4",
    parentId: null,
    type: "goal",
    name: "Legacy system migration to cloud infrastructure",
    status: "completed",
    progress: 100,
    space: { id: "space-eng", name: "Engineering" },
    spacePath: "#",
    owner: people.alex,
    ownerPath: "#",
    itemPath: "#",
    isNew: false,
    completedOn: "2023-12-15T00:00:00.000Z",
    closedAt: "2023-12-15T00:00:00.000Z",
    nextStep: "",
    privacy: "internal" as PrivacyIndicator.PrivacyLevels,
    timeframe: {
      startDate: "2023-02-01T00:00:00.000Z",
      endDate: "2023-12-31T00:00:00.000Z",
      type: "days",
    },
    children: [],
  },
  {
    id: "goal-5",
    parentId: null,
    type: "goal",
    name: "Develop sustainable AI-powered analytics platform",
    status: "on_track",
    progress: 15,
    space: { id: "space-rd", name: "R&D" },
    spacePath: "#",
    owner: people.sophia,
    ownerPath: "#",
    itemPath: "#",
    isNew: false,
    completedOn: null,
    closedAt: null,
    nextStep: "Complete initial research phase",
    privacy: "confidential" as PrivacyIndicator.PrivacyLevels,
    timeframe: {
      startDate: "2024-03-01T00:00:00.000Z",
      endDate: "2028-12-31T00:00:00.000Z",
      type: "days",
    },
    children: [
      {
        id: "project-7",
        parentId: "goal-5",
        type: "project",
        name: "Research phase: ML model selection",
        status: "on_track",
        progress: 40,
        space: { id: "space-rd", name: "R&D" },
        spacePath: "#",
        owner: people.jennifer,
        ownerPath: "#",
        itemPath: "#",
        isNew: false,
        completedOn: null,
        closedAt: null,
        nextStep: "Evaluate model performance metrics",
        privacy: "confidential" as PrivacyIndicator.PrivacyLevels,
        timeframe: {
          startDate: "2024-03-01T00:00:00.000Z",
          endDate: "2025-06-30T00:00:00.000Z",
          type: "days",
        },
        children: [],
      },
    ],
  },
];

/**
 * WorkMap is a comprehensive component for displaying and interacting with
 * hierarchical work items like goals and projects.
 */
const meta = {
  title: "Components/WorkMap",
  component: WorkMap,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  argTypes: {
    items: { control: "object" },
  },
} satisfies Meta<typeof WorkMap>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default view of the WorkMap with multiple items and children
 */
export const Default: Story = {
  render: (args) => (
    <div className="py-[4.5rem] px-2">
      <Page title={args.title} size="fullwidth">
        <WorkMap {...args} />
      </Page>
    </div>
  ),
  args: {
    title: "Company Work Map",
    items: mockItems,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Verify the total number of items", async () => {
      const tableBody = canvas.getAllByRole("rowgroup")[1]; // Second rowgroup is tbody
      const tableRows = within(tableBody).getAllByRole("row");

      expect(tableRows.length).toEqual(15);
    });

    await step("Verify indentation of items at different levels", async () => {
      // Level 0 item (no indentation)
      const topLevelItem = canvas.getByText("Acquire the first users of Operately outside Semaphore");
      const topLevelRow = topLevelItem.closest("tr") as HTMLElement;

      const topLevelIndentation = within(topLevelRow).queryByTestId("indentation");
      expect(topLevelIndentation?.style.width).toBe("0px");

      // Level 1 items (20px indentation)
      const level1Goal = canvas.getByText("Reduce onboarding time by 30%");
      const level1GoalRow = level1Goal.closest("tr") as HTMLElement;

      const level1GoalIndentation = within(level1GoalRow).getByTestId("indentation");
      expect(level1GoalIndentation.style.width).toBe("20px");

      const level1Project = canvas.getByText("Release 0.4");
      const level1ProjectRow = level1Project.closest("tr") as HTMLElement;

      const level1ProjectIndentation = within(level1ProjectRow).getByTestId("indentation");
      expect(level1ProjectIndentation.style.width).toBe("20px");

      // Level 2 items (40px indentation)
      const level2Goal = canvas.getByText("Automate user account setup");
      const level2GoalRow = level2Goal.closest("tr") as HTMLElement;

      const level2GoalIndentation = within(level2GoalRow).getByTestId("indentation");
      expect(level2GoalIndentation.style.width).toBe("40px");

      const level2Project = canvas.getByText("GDPR compliance implementation");
      const level2ProjectRow = level2Project.closest("tr") as HTMLElement;

      const level2ProjectIndentation = within(level2ProjectRow).getByTestId("indentation");
      expect(level2ProjectIndentation.style.width).toBe("40px");

      // Level 3 item (60px indentation)
      const level3Project = canvas.getByText("Implement secure authentication service");
      const level3ProjectRow = level3Project.closest("tr") as HTMLElement;

      const level3ProjectIndentation = within(level3ProjectRow).getByTestId("indentation");
      expect(level3ProjectIndentation.style.width).toBe("60px");
    });
  },
};

/**
 * WorkMap with a single item (no children)
 */
export const SingleItem: Story = {
  render: (args) => (
    <div className="py-4">
      <Page title={args.title} size="fullwidth">
        <WorkMap {...args} />
      </Page>
    </div>
  ),
  args: {
    title: "Company Work Map",
    items: [mockSingleItem],
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Verify only a single item is rendered", async () => {
      const tableRows = canvas.getAllByRole("row");

      // There should be exactly 2 rows: header row + 1 data row
      expect(tableRows.length).toBe(2);

      const itemName = canvas.getByText("Single standalone goal with no children");
      expect(itemName).toBeInTheDocument();
    });
  },
};

/**
 * WorkMap with no items (empty state)
 */
export const Empty: Story = {
  render: (args) => (
    <div className="py-4">
      <Page title={args.title} size="fullwidth">
        <WorkMap {...args} />
      </Page>
    </div>
  ),
  args: {
    title: "Company Work Map",
    items: [],
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Verify no items are displayed", async () => {
      const tableRows = canvas.getAllByRole("row");

      // There should be exactly 1 row (just the header)
      expect(tableRows.length).toBe(1);
    });
  },
};
