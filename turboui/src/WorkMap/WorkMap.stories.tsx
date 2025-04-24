import type { Meta, StoryObj } from "@storybook/react";
import WorkMap from ".";
import { TimeframeSelector } from "../TimeframeSelector";
import { currentYear, currentQuarter } from "../TimeframeSelector/utils";
import { Page } from "../Page";

// --- Mock Data ---
function genAvatar(id: string) {
  return `https://images.unsplash.com/${id}?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80`;
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
    owner: people.maximiliano,
    isNew: false,
    completedOn: null,
    closedAt: null,
    deadline: "Dec 31 2024",
    nextStep: "People are signing up for SaaS",
    timeframe: currentYear(),
    children: [
      {
        id: "project-1",
        parentId: "goal-1",
        type: "project",
        name: "Document features in Help Center",
        status: "completed",
        progress: 100,
        space: { id: "space-product", name: "Product" },
        owner: people.sophia,
        isNew: false,
        completedOn: "2025-03-10",
        deadline: "Mar 31",
        closedAt: "Mar 10 2025",
        nextStep: "",
        startedAt: "2024-01-15",
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
        owner: people.alex,
        isNew: false,
        completedOn: null,
        closedAt: null,
        deadline: "Feb 7",
        nextStep: "All weekly updates are collected",
        startedAt: "2024-01-01",
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
        owner: people.sophia,
        isNew: false,
        completedOn: null,
        closedAt: null,
        deadline: "Nov 15 2024",
        nextStep: "Launch email campaign",
        timeframe: currentYear(),
        children: [
          {
            id: "project-3",
            parentId: "goal-1-1",
            type: "project",
            name: "Create onboarding email sequence",
            status: "on_track",
            progress: 75,
            space: { name: "Marketing", id: "space-marketing" },
            owner: people.jennifer,
            isNew: false,
            completedOn: null,
            closedAt: null,
            deadline: "Oct 1 2024",
            nextStep: "Finalize email templates",
            startedAt: "2024-06-15",
            children: [],
          }
        ],
      }
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
    owner: people.jennifer,
    isNew: false,
    completedOn: null,
    closedAt: null,
    deadline: "Jun 15 2025",
    nextStep: "Conduct user interviews",
    timeframe: currentQuarter(),
    children: [
      {
        id: "goal-2-1",
        parentId: "goal-2",
        type: "goal",
        name: "Reduce onboarding time by 30%",
        status: "issue",
        progress: 15,
        space: { id: "space-cs", name: "Customer Success" },
        owner: people.alex,
        isNew: false,
        completedOn: null,
        closedAt: null,
        deadline: "May 30 2025",
        nextStep: "Identify bottlenecks in process",
        timeframe: currentQuarter(),
        children: [
          {
            id: "goal-2-1-1",
            parentId: "goal-2-1",
            type: "goal",
            name: "Automate user account setup",
            status: "on_track",
            progress: 40,
            space: { id: "space-eng", name: "Engineering" },
            owner: people.sophia,
            isNew: false,
            completedOn: null,
            closedAt: null,
            deadline: "Apr 15 2025",
            nextStep: "Complete backend integration",
            timeframe: currentQuarter(),
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
            owner: people.jennifer,
            isNew: false,
            completedOn: null,
            closedAt: null,
            deadline: "Apr 30 2025",
            nextStep: "Finalize content outline",
            startedAt: "2024-03-01",
            children: [],
          }
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
        owner: people.alex,
        isNew: false,
        completedOn: null,
        closedAt: null,
        deadline: "Apr 20 2025",
        nextStep: "Finalize mockups",
        startedAt: "2025-02-01",
        children: [],
      }
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
    owner: people.alex,
    isNew: false,
    completedOn: null,
    closedAt: null,
    deadline: "Dec 31 2025",
    nextStep: "Complete market research",
    timeframe: currentYear(),
    children: [
      {
        id: "goal-3-1",
        parentId: "goal-3",
        type: "goal",
        name: "Launch in European market",
        status: "on_track",
        progress: 50,
        space: { id: "space-intl", name: "International" },
        owner: people.jennifer,
        isNew: false,
        completedOn: null,
        closedAt: null,
        deadline: "Sep 15 2025",
        nextStep: "Establish legal entity",
        timeframe: currentYear(),
        children: [
          {
            id: "project-5",
            parentId: "goal-3-1",
            type: "project",
            name: "GDPR compliance implementation",
            status: "caution",
            progress: 30,
            space: { id: "space-legal", name: "Legal" },
            owner: people.sophia,
            isNew: false,
            completedOn: null,
            closedAt: null,
            deadline: "Aug 1 2025",
            nextStep: "Complete data audit",
            startedAt: "2025-04-01",
            children: [],
          }
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
        deadline: "Nov 30 2025",
        nextStep: "Identify potential partners",
        timeframe: currentYear(),
        children: []
      }
    ],
  }
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
    addItem: { action: "addItem" },
    deleteItem: { action: "deleteItem" },
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
    addItem: (newItem) => console.log("Add item", newItem),
    deleteItem: (itemId) => console.log("Delete item", { itemId }),
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
    addItem: (newItem) => console.log("Add item", newItem),
    deleteItem: (itemId) => console.log("Delete item", { itemId }),
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
    addItem: (newItem) => console.log("Add item", newItem),
    deleteItem: (itemId) => console.log("Delete item", { itemId }),
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
            name: ["Product", "Engineering", "Marketing", "Sales", "R&D"][index % 5]
          },
          owner: {
            id: `user-${index}`,
            fullName: `User ${index + 1}`,
            avatarUrl: index % 2 === 0 ? people.alex.avatarUrl : people.sophia.avatarUrl,
          },
          isNew: false,
          completedOn: status === "completed" || status === "achieved" ? `2025-04-${index + 1}` : null,
          deadline:
            status === "completed" || status === "achieved"
              ? undefined
              : `Jun ${15 + index} 2025`,
          closedAt: status === "completed" || status === "achieved" ? `Apr ${index + 1} 2025` : undefined,
          nextStep: status === "completed" || status === "achieved" ? "" : "Next action to take",
          children: [],
        };

        if (isGoal) {
          return {
            ...baseItem,
            type: "goal" as const,
            timeframe: {
              startDate: new Date(2025, 0, 1),
              endDate: new Date(2025, 11, 31),
              type: "year" as TimeframeSelector.TimeframeType,
            },
          };
        } else {
          return {
            ...baseItem,
            type: "project" as const,
            startedAt: `2025-01-${index + 1}`,
          };
        }
      }),
    ],
    addItem: (newItem) => console.log("Add item", newItem),
    deleteItem: (itemId) => console.log("Delete item", { itemId }),
  },
};
