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
  tags: ["autodocs"],
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
    await assertRowsNumber(canvasElement, step, 15);
  },
};

/**
 * WorkMap with a single item (no children)
 */
export const SingleItem: Story = {
  tags: ["autodocs"],
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
    await assertRowsNumber(canvasElement, step, 1);

    await assertItemName(canvasElement, step, "Single standalone goal with no children");
  },
};

/**
 * WorkMap with no items (empty state)
 */
export const Empty: Story = {
  tags: ["autodocs"],
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
    await assertRowsNumber(canvasElement, step, 0);
  },
};

/**
 * Goals tab selected
 */
export const GoalsTab: Story = {
  render: (args) => (
    <div className="py-4">
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
    await assertRowsNumber(canvasElement, step, 15);

    await selectTab(canvasElement, step, "goals");

    await assertRowsNumber(canvasElement, step, 9);

    await assertItemName(canvasElement, step, "Acquire the first users of Operately outside Semaphore");
    await assertItemName(canvasElement, step, "Launch in European market");
  },
};

/**
 * Projects tab selected
 */
export const ProjectsTab: Story = {
  render: (args) => (
    <div className="py-4">
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
    await assertRowsNumber(canvasElement, step, 15);

    await selectTab(canvasElement, step, "projects");

    await assertRowsNumber(canvasElement, step, 6);

    await assertItemName(canvasElement, step, "Release 0.4");
    await assertItemName(canvasElement, step, "Research phase: ML model selection");
  },
};

/**
 * Completed tab selected
 */
export const CompletedTab: Story = {
  render: (args) => (
    <div className="py-4">
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
    await assertRowsNumber(canvasElement, step, 15);

    await selectTab(canvasElement, step, "completed");

    await assertRowsNumber(canvasElement, step, 1);

    await assertItemName(canvasElement, step, "Document features in Help Center");
  },
};

/**
 * Year 2023 selected
 */
export const Year2023Selected: Story = {
  render: (args) => (
    <div className="py-4">
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
    await assertRowsNumber(canvasElement, step, 15);

    await openTimeframeSelector(canvasElement, step);

    await selectYear(canvasElement, step, "2023");

    await closeTimeframeSelector(canvasElement, step);

    await assertRowsNumber(canvasElement, step, 0);

    await selectTab(canvasElement, step, "completed");

    await assertRowsNumber(canvasElement, step, 1);

    await assertItemName(canvasElement, step, "Legacy system migration to cloud infrastructure");
  },
};

/**
 * Year 2028 selected
 */
export const Year2028Selected: Story = {
  render: (args) => (
    <div className="py-4">
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
    await assertRowsNumber(canvasElement, step, 15);

    await openTimeframeSelector(canvasElement, step);

    await selectYear(canvasElement, step, "2028");

    await closeTimeframeSelector(canvasElement, step);

    await assertRowsNumber(canvasElement, step, 1);

    await assertItemName(canvasElement, step, "Develop sustainable AI-powered analytics platform");
  },
};

/**
 * Q3 quarter selected
 */
export const Q3Selected: Story = {
  name: "Q3 selected",
  render: (args) => (
    <div className="py-4">
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
    await assertRowsNumber(canvasElement, step, 15);

    await openTimeframeSelector(canvasElement, step);

    await selectQuarter(canvasElement, step, "Q3");

    await closeTimeframeSelector(canvasElement, step);

    await assertRowsNumber(canvasElement, step, 7);

    await assertItemName(canvasElement, step, "Acquire the first users of Operately outside Semaphore");
    await assertItemName(canvasElement, step, "GDPR compliance implementation");
  },
};

/**
 * November month selected
 */
export const NovemberSelected: Story = {
  name: "November selected",
  render: (args) => (
    <div className="py-4">
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
    await assertRowsNumber(canvasElement, step, 15);

    await openTimeframeSelector(canvasElement, step);

    await selectMonth(canvasElement, step, "November");

    await closeTimeframeSelector(canvasElement, step);

    await assertRowsNumber(canvasElement, step, 6);

    await assertItemName(canvasElement, step, "Increase user engagement by 50%");
    await assertItemName(canvasElement, step, "Expand to international markets");
  },
};

//
// Steps
//

const selectTab = async (canvasElement, step, tab) => {
  const canvas = within(canvasElement);

  await step("Select the " + tab + " tab", async () => {
    const tabElement = canvas.getByTestId("work-map-tab-" + tab);
    await tabElement.click();
  });
};

const assertRowsNumber = async (canvasElement, step, count) => {
  const canvas = within(canvasElement);

  await step(`Verify there are ${count} rows`, async () => {
    const tableBody = canvas.getAllByRole("rowgroup")[1]; // Second rowgroup is tbody
    const tableRows = within(tableBody).queryAllByRole("row");

    expect(tableRows.length).toEqual(count);
  });
};

const assertItemName = async (canvasElement, step, name) => {
  const canvas = within(canvasElement);

  await step("Verify the item name", async () => {
    const itemName = canvas.getByText(name);
    expect(itemName).toBeInTheDocument();
  });
};

const openTimeframeSelector = async (canvasElement, step) => {
  const canvas = within(canvasElement);

  await step("Open the timeframe selector", async () => {
    const timeframeButton = canvas.getByRole("button", { name: /202[0-9]/ });
    await timeframeButton.click();
  });
};

const selectYear = async (canvasElement, step, year) => {
  const canvas = within(canvasElement);

  await step("Navigate to and select the year " + year, async () => {
    const popoverContent = within(document.body)
      .getByText("Select Timeframe")
      .closest("[role='dialog']") as HTMLElement;
    expect(popoverContent).toBeInTheDocument();

    const year2023 = within(popoverContent).getByText(year);
    await year2023.click();

    // Verify the timeframe selector now shows the selected year
    const updatedTimeframeButton = canvas.getByRole("button", { name: year });
    expect(updatedTimeframeButton).toBeInTheDocument();
  });
};

const selectQuarter = async (canvasElement, step, quarter) => {
  const canvas = within(canvasElement);

  await step("Select the Quarter tab and then " + quarter, async () => {
    const popoverContent = within(document.body)
      .getByText("Select Timeframe")
      .closest("[role='dialog']") as HTMLElement;
    expect(popoverContent).toBeInTheDocument();

    const quarterTab = within(popoverContent).getByText("Quarter");
    await quarterTab.click();

    const q3Option = within(popoverContent).getByText(quarter);
    await q3Option.click();

    const updatedTimeframeButton = canvas.getByRole("button", { name: `${quarter} 2025` });
    expect(updatedTimeframeButton).toBeInTheDocument();
  });
};

const selectMonth = async (canvasElement, step, month) => {
  const canvas = within(canvasElement);

  await step("Select the Month tab and then " + month, async () => {
    const popoverContent = within(document.body)
      .getByText("Select Timeframe")
      .closest("[role='dialog']") as HTMLElement;
    expect(popoverContent).toBeInTheDocument();

    const monthTab = within(popoverContent).getByText("Month");
    await monthTab.click();

    const juneOption = within(popoverContent).getByText(month);
    await juneOption.click();

    const updatedTimeframeButton = canvas.getByRole("button", { name: `${month} 2025` });
    expect(updatedTimeframeButton).toBeInTheDocument();
  });
};

const closeTimeframeSelector = async (canvasElement, step) => {
  const canvas = within(canvasElement);

  await step("Close the timeframe selector", async () => {
    await document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

    const popoverExists = within(document.body).queryByText("Select Timeframe");
    expect(popoverExists).not.toBeInTheDocument();
  });
};
