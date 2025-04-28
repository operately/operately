import type { Meta, StoryObj } from "@storybook/react";
import WorkMap from ".";
import { TimeframeSelector } from "../TimeframeSelector";
import { currentYear, currentQuarter } from "../TimeframeSelector/utils";
import { Page } from "../Page";

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

// Sample work map items
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
            children: [],
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
        timeframe: getTimeframe(currentYear()),
        ownerPath: "#",
        spacePath: "#",
        itemPath: "#",
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
    items: [mockItems[1]], // Just the second goal with no children
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
};

/**
 * WorkMap with all items in different statuses to showcase status badges
 */
export const AllStatuses: Story = {
  render: (args) => (
    <div className="py-4">
      <Page title={args.title} size="fullwidth">
        <WorkMap {...args} />
      </Page>
    </div>
  ),
  args: {
    title: "Company Work Map",
    items: [
      // Create an item for each possible status
      ...(
        [
          "on_track",
          "completed",
          "achieved",
          "partial",
          "missed",
          "paused",
          "caution",
          "issue",
          "dropped",
          "pending",
        ] as WorkMap.Status[]
      ).map((status, index) => {
        const isGoal = index % 2 === 0;
        const baseItem = {
          id: `status-${index}`,
          name: `${status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ")} item`,
          parentId: null,
          status,
          progress: status === "completed" || status === "achieved" ? 100 : Math.floor(Math.random() * 100),
          space: {
            id: `space-${index % 5}`,
            name: ["Product", "Engineering", "Marketing", "Sales", "R&D"][index % 5],
          },
          owner: {
            id: `user-${index}`,
            fullName: `User ${index + 1}`,
            avatarUrl: index % 2 === 0 ? people.alex.avatarUrl : people.sophia.avatarUrl,
          },
          ownerPath: "#",
          spacePath: "#",
          itemPath: "#",
          isNew: false,
          completedOn: status === "completed" || status === "achieved" ? `2025-04-${index + 1}` : null,

          closedAt: status === "completed" || status === "achieved" ? `Apr ${index + 1} 2025` : undefined,
          nextStep: status === "completed" || status === "achieved" ? "" : "Next action to take",
          children: [],
        };

        if (isGoal) {
          return {
            ...baseItem,
            type: "goal" as const,
            timeframe: getTimeframe({
              startDate: new Date("2025-01-01"),
              endDate: new Date("2025-12-31"),
              type: "year",
            }),
          };
        } else {
          return {
            ...baseItem,
            type: "project" as const,
            timeframe: {
              startDate: `2025-01-${index + 1}`,
              endDate: "2025-12-31",
              type: "days" as TimeframeSelector.TimeframeType,
            },
          };
        }
      }),
    ],
  },
};
