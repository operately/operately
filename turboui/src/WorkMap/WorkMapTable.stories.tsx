import type { Meta, StoryObj } from "@storybook/react";
import { expect, within, userEvent } from "@storybook/test";
import { WorkMapTable } from "./WorkMapTable";
import { WorkMap } from ".";
import { currentYear, currentQuarter, currentMonth } from "../utils/timeframes";
import { TimeframeSelector } from "../TimeframeSelector";
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

// People used consistently throughout the stories
const people = {
  igor: {
    id: "user-igor",
    fullName: "Igor Š.",
    avatarUrl: genAvatar("photo-1500648767791-00dcc994a43e"),
  },
  jane: {
    id: "user-jane",
    fullName: "Jane D.",
    avatarUrl: genAvatar("photo-1438761681033-6461ffad8d80"),
  },
  jennifer: {
    id: "user-jennifer",
    fullName: "Jennifer L.",
    avatarUrl: genAvatar("photo-1494790108377-be9c29b29330"),
  },
};

const meta = {
  title: "Components/WorkMap/WorkMapTable",
  component: WorkMapTable,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  argTypes: {
    filter: {
      description: "Current filter applied to the WorkMapTable",
      options: [undefined, "all", "goals", "projects", "completed"],
      control: { type: "select" },
    },
    items: {
      description: "WorkMap items to display",
      control: "object",
    },
  },
} satisfies Meta<typeof WorkMapTable>;

export default meta;
type Story = StoryObj<typeof meta>;

const defaultGoalsAndProjects: WorkMap.Item[] = [
  {
    id: "goal-1",
    parentId: null,
    type: "goal",
    name: "Grow user base",
    status: "caution",
    progress: 40,
    space: { id: "space-growth", name: "Growth" },
    spacePath: "#",
    owner: people.igor,
    ownerPath: "#",
    itemPath: "#",
    isNew: false,
    completedOn: null,
    closedAt: null,
    nextStep: "Launch referral program",
    privacy: "internal" as PrivacyIndicator.PrivacyLevels,
    timeframe: getTimeframe(currentYear()),
    children: [
      {
        id: "project-1",
        parentId: "goal-1",
        type: "project",
        name: "Referral program",
        status: "on_track",
        progress: 60,
        space: { id: "space-growth", name: "Growth" },
        spacePath: "#",
        owner: people.jane,
        ownerPath: "#",
        itemPath: "#",
        isNew: false,
        completedOn: null,
        closedAt: undefined,
        nextStep: "Design rewards",
        privacy: "secret" as PrivacyIndicator.PrivacyLevels,
        timeframe: {
          startDate: "2025-01-15T00:00:00.000Z",
          endDate: "2025-11-30T00:00:00.000Z",
          type: "days",
        },
        children: [],
      },
      {
        id: "goal-1-1",
        parentId: "goal-1",
        type: "goal",
        name: "Increase signups by 20%",
        status: "completed",
        progress: 30,
        space: { id: "space-growth", name: "Growth" },
        spacePath: "#",
        owner: people.jane,
        ownerPath: "#",
        itemPath: "#",
        isNew: false,
        completedOn: "2025-10-15T00:00:00.000Z",
        closedAt: null,
        nextStep: "A/B test new landing page",
        privacy: "internal" as PrivacyIndicator.PrivacyLevels,
        timeframe: getTimeframe(currentYear()),
        children: [
          {
            id: "goal-100",
            parentId: "goal-1-1",
            type: "goal",
            name: "Finish Q2 OKRs",
            status: "missed",
            progress: 100,
            space: { id: "space-strategy", name: "Strategy" },
            spacePath: "#",
            owner: people.igor,
            ownerPath: "#",
            itemPath: "#",
            isNew: false,
            completedOn: "2025-07-01T00:00:00.000Z",
            closedAt: "2025-07-01T00:00:00.000Z",
            nextStep: "",
            privacy: "internal" as PrivacyIndicator.PrivacyLevels,
            timeframe: getTimeframe(currentQuarter()),
            children: [],
          },
          {
            id: "project-100",
            parentId: "goal-1-1",
            type: "project",
            name: "Migrate to Vite",
            status: "completed",
            progress: 100,
            space: { id: "space-eng", name: "Engineering" },
            spacePath: "#",
            owner: people.jennifer,
            ownerPath: "#",
            itemPath: "#",
            isNew: false,
            completedOn: "2025-04-01T00:00:00.000Z",
            closedAt: "2025-04-01T00:00:00.000Z",
            nextStep: "",
            privacy: "internal" as PrivacyIndicator.PrivacyLevels,
            timeframe: {
              startDate: "2025-01-01T00:00:00.000Z",
              endDate: null,
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
    name: "Improve onboarding",
    status: "paused",
    progress: 75,
    space: { id: "space-product", name: "Product" },
    spacePath: "#",
    owner: people.jennifer,
    ownerPath: "#",
    itemPath: "#",
    isNew: false,
    completedOn: null,
    closedAt: null,
    nextStep: "Ship onboarding checklist",
    privacy: "internal" as PrivacyIndicator.PrivacyLevels,
    timeframe: getTimeframe(currentYear()),
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
        owner: people.jennifer,
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
            owner: people.jane,
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
                owner: people.igor,
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
        owner: people.jennifer,
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
      {
        id: "project-2",
        parentId: "goal-2",
        type: "project",
        name: "Onboarding checklist",
        status: "issue",
        progress: 80,
        space: { id: "space-product", name: "Product" },
        spacePath: "#",
        owner: people.jennifer,
        ownerPath: "#",
        itemPath: "#",
        isNew: false,
        completedOn: null,
        closedAt: null,
        timeframe: {
          startDate: "2025-03-15T00:00:00.000Z",
          endDate: "2025-08-15T00:00:00.000Z",
          type: "days",
        },
        nextStep: "QA checklist",
        privacy: "confidential" as PrivacyIndicator.PrivacyLevels,
        children: [],
      },
    ],
  },
  {
    id: "project-3",
    parentId: null,
    type: "project",
    name: "Website redesign",
    status: "pending",
    progress: 50,
    space: { id: "space-design", name: "Design" },
    spacePath: "#",
    owner: people.igor,
    ownerPath: "#",
    itemPath: "#",
    isNew: false,
    completedOn: null,
    closedAt: null,
    timeframe: {
      startDate: "2025-02-01T00:00:00.000Z",
      endDate: "2025-07-31T00:00:00.000Z",
      type: "days",
    },
    nextStep: "Finalize homepage",
    privacy: "internal" as PrivacyIndicator.PrivacyLevels,
    children: [],
  },
];

const onlyGoals: WorkMap.Item[] = [
  {
    id: "goal-g1",
    parentId: null,
    type: "goal",
    name: "Increase NPS score",
    status: "caution",
    progress: 60,
    space: { id: "space-cs", name: "Customer Success" },
    spacePath: "#",
    owner: people.igor,
    ownerPath: "#",
    itemPath: "#",
    isNew: false,
    completedOn: null,
    closedAt: null,
    nextStep: "Send Q3 survey",
    privacy: "internal" as PrivacyIndicator.PrivacyLevels,
    timeframe: getTimeframe(currentQuarter()),
    children: [
      {
        id: "goal-g1-1",
        parentId: "goal-g1",
        type: "goal",
        name: "Launch new CSAT tool",
        status: "achieved",
        progress: 80,
        space: { id: "space-cs", name: "Customer Success" },
        spacePath: "#",
        owner: people.jane,
        ownerPath: "#",
        itemPath: "#",
        isNew: false,
        completedOn: "2025-08-15T00:00:00.000Z",
        closedAt: null,
        nextStep: "Enable feedback widget",
        privacy: "internal" as PrivacyIndicator.PrivacyLevels,
        timeframe: getTimeframe(currentMonth()),
        children: [],
      },
      {
        id: "goal-g1-2",
        parentId: "goal-g1",
        type: "goal",
        name: "Reduce churn by 10%",
        status: "missed",
        progress: 50,
        space: { id: "space-cs", name: "Customer Success" },
        spacePath: "#",
        owner: people.jennifer,
        ownerPath: "#",
        itemPath: "#",
        isNew: false,
        completedOn: null,
        closedAt: null,
        nextStep: "Analyze churn data",
        privacy: "internal" as PrivacyIndicator.PrivacyLevels,
        timeframe: getTimeframe(currentQuarter()),
        children: [],
      },
    ],
  },
  {
    id: "goal-g2",
    parentId: null,
    type: "goal",
    name: "Expand to APAC region",
    status: "partial",
    progress: 30,
    space: { id: "space-growth", name: "Growth" },
    spacePath: "#",
    owner: people.jane,
    ownerPath: "#",
    itemPath: "#",
    isNew: false,
    completedOn: null,
    closedAt: null,
    nextStep: "Research local partners",
    privacy: "secret" as PrivacyIndicator.PrivacyLevels,
    timeframe: getTimeframe(currentYear()),
    children: [
      {
        id: "goal-g2-1",
        parentId: "goal-g2",
        type: "goal",
        name: "Localize product",
        status: "pending",
        progress: 40,
        space: { id: "space-growth", name: "Growth" },
        spacePath: "#",
        owner: people.igor,
        ownerPath: "#",
        itemPath: "#",
        isNew: false,
        completedOn: null,
        closedAt: null,
        nextStep: "Hire translators",
        privacy: "internal" as PrivacyIndicator.PrivacyLevels,
        timeframe: getTimeframe(currentQuarter()),
        children: [],
      },
      {
        id: "goal-g2-2",
        parentId: "goal-g2",
        type: "goal",
        name: "APAC marketing campaign",
        status: "dropped",
        progress: 25,
        space: { id: "space-growth", name: "Growth" },
        spacePath: "#",
        owner: people.jennifer,
        ownerPath: "#",
        itemPath: "#",
        isNew: false,
        completedOn: null,
        closedAt: null,
        nextStep: "Draft campaign assets",
        privacy: "internal" as PrivacyIndicator.PrivacyLevels,
        timeframe: getTimeframe(currentQuarter()),
        children: [],
      },
    ],
  },
];

const onlyProjects: WorkMap.Item[] = [
  {
    id: "project-1",
    parentId: null,
    type: "project",
    name: "Mobile app v2",
    status: "dropped",
    progress: 70,
    space: { id: "space-mobile", name: "Mobile" },
    spacePath: "#",
    owner: people.jane,
    ownerPath: "#",
    itemPath: "#",
    isNew: false,
    completedOn: null,
    closedAt: null,
    nextStep: "Start beta testing",
    privacy: "internal" as PrivacyIndicator.PrivacyLevels,
    timeframe: {
      startDate: "2025-01-10T00:00:00.000Z",
      endDate: "2025-09-30T00:00:00.000Z",
      type: "days",
    },
    children: [],
  },
  {
    id: "project-2",
    parentId: null,
    type: "project",
    name: "API refactor",
    status: "paused",
    progress: 40,
    space: { id: "space-backend", name: "Backend" },
    spacePath: "#",
    owner: people.igor,
    ownerPath: "#",
    itemPath: "#",
    isNew: false,
    completedOn: null,
    closedAt: null,
    nextStep: "Migrate endpoints",
    privacy: "confidential" as PrivacyIndicator.PrivacyLevels,
    timeframe: {
      startDate: "2025-02-15T00:00:00.000Z",
      endDate: "2025-10-31T00:00:00.000Z",
      type: "days",
    },
    children: [],
  },
  {
    id: "project-3",
    parentId: null,
    type: "project",
    name: "Website redesign",
    status: "achieved",
    progress: 50,
    space: { id: "space-design", name: "Design" },
    spacePath: "#",
    owner: people.jennifer,
    ownerPath: "#",
    itemPath: "#",
    isNew: false,
    completedOn: "2025-07-31T00:00:00.000Z",
    closedAt: null,
    nextStep: "Finalize homepage",
    privacy: "internal" as PrivacyIndicator.PrivacyLevels,
    timeframe: {
      startDate: "2025-03-01T00:00:00.000Z",
      endDate: "2025-07-31T00:00:00.000Z",
      type: "days",
    },
    children: [],
  },
];

const onlyCompleted: WorkMap.Item[] = [
  {
    id: "goal-10",
    parentId: null,
    type: "goal",
    name: "Achieve Series B funding",
    status: "completed",
    progress: 100,
    space: { id: "space-finance", name: "Finance" },
    spacePath: "#",
    owner: people.igor,
    ownerPath: "#",
    itemPath: "#",
    isNew: false,
    completedOn: "2025-06-01T00:00:00.000Z",
    closedAt: "2025-06-01T00:00:00.000Z",
    nextStep: "",
    privacy: "internal" as PrivacyIndicator.PrivacyLevels,
    timeframe: getTimeframe(currentYear()),
    children: [],
  },
  {
    id: "goal-11",
    parentId: null,
    type: "goal",
    name: "Hit 100k MAU",
    status: "completed",
    progress: 100,
    space: { id: "space-growth", name: "Growth" },
    spacePath: "#",
    isNew: false,
    completedOn: "2025-05-15T00:00:00.000Z",
    closedAt: "2025-05-01T00:00:00.000Z",
    owner: people.jane,
    ownerPath: "#",
    itemPath: "#",
    nextStep: "",
    privacy: "internal" as PrivacyIndicator.PrivacyLevels,
    timeframe: getTimeframe(currentQuarter()),
    children: [],
  },
  {
    id: "project-10",
    parentId: null,
    type: "project",
    name: "Migrate to Vite",
    status: "completed",
    progress: 100,
    space: { id: "space-eng", name: "Engineering" },
    spacePath: "#",
    owner: people.jennifer,
    ownerPath: "#",
    itemPath: "#",
    isNew: false,
    completedOn: "2025-04-01T00:00:00.000Z",
    closedAt: "2025-04-01T00:00:00.000Z",
    nextStep: "",
    privacy: "secret" as PrivacyIndicator.PrivacyLevels,
    timeframe: {
      startDate: "2025-01-15T00:00:00.000Z",
      endDate: "2025-04-01T00:00:00.000Z",
      type: "days",
    },
    children: [],
  },
];

export const Default: Story = {
  args: {
    items: defaultGoalsAndProjects,
    filter: "all",
  },
};

export const GoalsOnly: Story = {
  args: {
    items: onlyGoals,
    filter: "goals",
  },
};

export const ProjectsOnly: Story = {
  args: {
    items: onlyProjects,
    filter: "projects",
  },
};

export const CompletedOnly: Story = {
  args: {
    items: onlyCompleted,
    filter: "completed",
  },
};

// Test story for collapsing the "Increase signups by 20%" goal
export const CollapseGoal: Story = {
  args: {
    items: defaultGoalsAndProjects,
    filter: "all",
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Check initial visibility of goal and children", async () => {
      const goalRow = canvas.getByText("Increase signups by 20%");
      expect(goalRow).toBeInTheDocument();

      const childProject1 = canvas.getByText("Finish Q2 OKRs");
      const childProject2 = canvas.getByText("Migrate to Vite");

      expect(childProject1).toBeInTheDocument();
      expect(childProject2).toBeInTheDocument();
    });

    await step("Click expand button to collapse children", async () => {
      const goalRowElement = canvas.getByText("Increase signups by 20%");
      const goalRow = goalRowElement.closest("tr");

      expect(goalRow).not.toBeNull();

      const expandButton = within(goalRow as HTMLElement).getByTestId("chevron-icon");
      await userEvent.click(expandButton);
    });

    await step("Verify children are now hidden", async () => {
      const goalRow = canvas.getByText("Increase signups by 20%");
      expect(goalRow).toBeInTheDocument();

      const childProject1 = canvas.queryByText("Finish Q2 OKRs");
      const childProject2 = canvas.queryByText("Migrate to Vite");

      expect(childProject1).not.toBeInTheDocument();
      expect(childProject2).not.toBeInTheDocument();
    });
  },
};

// Test story for toggling the "Improve onboarding" goal
export const ToggleGoal: Story = {
  args: {
    items: defaultGoalsAndProjects,
    filter: "all",
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Check initial visibility of goal and children", async () => {
      const goalRow = canvas.getByText("Improve onboarding");
      expect(goalRow).toBeInTheDocument();

      const childProject = canvas.getByText("Onboarding checklist");
      expect(childProject).toBeInTheDocument();
    });

    await step("Click expand button to collapse children", async () => {
      const goalRowElement = canvas.getByText("Improve onboarding");
      const goalRow = goalRowElement.closest("tr");

      expect(goalRow).not.toBeNull();

      const expandButton = within(goalRow as HTMLElement).getByTestId("chevron-icon");
      await userEvent.click(expandButton);
    });

    await step("Verify children are now hidden", async () => {
      const goalRow = canvas.getByText("Improve onboarding");
      expect(goalRow).toBeInTheDocument();

      const childProject = canvas.queryByText("Onboarding checklist");
      expect(childProject).not.toBeInTheDocument();
    });

    await step("Click expand button again to show children", async () => {
      const goalRowElement = canvas.getByText("Improve onboarding");
      const goalRow = goalRowElement.closest("tr");

      expect(goalRow).not.toBeNull();

      const expandButton = within(goalRow as HTMLElement).getByTestId("chevron-icon");
      await userEvent.click(expandButton);
    });

    await step("Verify children are visible again", async () => {
      const goalRow = canvas.getByText("Improve onboarding");
      expect(goalRow).toBeInTheDocument();

      const childProject = canvas.getByText("Onboarding checklist");
      expect(childProject).toBeInTheDocument();
    });
  },
};

export const Indentation: Story = {
  args: {
    items: defaultGoalsAndProjects,
    filter: "all",
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Verify indentation of level 0 items is 0px", async () => {
      const topLevelItem = canvas.getByText("Grow user base");
      const topLevelRow = topLevelItem.closest("tr") as HTMLElement;

      const topLevelIndentation = within(topLevelRow).queryByTestId("indentation");
      expect(topLevelIndentation?.style.width).toBe("0px");
    });

    await step("Verify indentation of level 1 items is 20px", async () => {
      const level1Goal = canvas.getByText("Increase signups by 20%");
      const level1GoalRow = level1Goal.closest("tr") as HTMLElement;

      const level1GoalIndentation = within(level1GoalRow).getByTestId("indentation");
      expect(level1GoalIndentation.style.width).toBe("20px");

      const level1Project = canvas.getByText("Redesign welcome screen");
      const level1ProjectRow = level1Project.closest("tr") as HTMLElement;

      const level1ProjectIndentation = within(level1ProjectRow).getByTestId("indentation");
      expect(level1ProjectIndentation.style.width).toBe("20px");
    });

    await step("Verify indentation of level 2 items is 40px", async () => {
      const level2Goal = canvas.getByText("Automate user account setup");
      const level2GoalRow = level2Goal.closest("tr") as HTMLElement;

      const level2GoalIndentation = within(level2GoalRow).getByTestId("indentation");
      expect(level2GoalIndentation.style.width).toBe("40px");

      const level2Project = canvas.getByText("Migrate to Vite");
      const level2ProjectRow = level2Project.closest("tr") as HTMLElement;

      const level2ProjectIndentation = within(level2ProjectRow).getByTestId("indentation");
      expect(level2ProjectIndentation.style.width).toBe("40px");
    });

    await step("Verify indentation of level 3 items is 60px", async () => {
      const level3Project = canvas.getByText("Implement secure authentication service");
      const level3ProjectRow = level3Project.closest("tr") as HTMLElement;

      const level3ProjectIndentation = within(level3ProjectRow).getByTestId("indentation");
      expect(level3ProjectIndentation.style.width).toBe("60px");
    });
  },
};
