import type { Meta, StoryObj } from "@storybook/react";
import WorkMap from ".";
import { TimeframeSelector } from "../TimeframeSelector";
import { currentYear, currentQuarter } from "../TimeframeSelector/utils";

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
};

// Sample work map items
const mockItems: WorkMap.Item[] = [
  {
    id: "goal-1",
    type: "goal",
    name: "Acquire the first users of Operately outside Semaphore",
    status: "on_track",
    progress: 45,
    space: "General",
    owner: people.alex,
    deadline: {
      display: "Dec 31 2024",
      isPast: false,
    },
    nextStep: "People are signing up for SaaS",
    timeframe: currentYear(),
    children: [
      {
        id: "project-1",
        type: "project",
        name: "Document features in Help Center",
        status: "completed",
        progress: 100,
        space: "Product",
        owner: people.sophia,
        deadline: {
          display: "Mar 31",
          isPast: false,
        },
        closedAt: "Mar 10 2025",
        nextStep: "",
        startedAt: "2024-01-15",
        children: [],
      },
      {
        id: "project-2",
        type: "project",
        name: "Release 0.4",
        status: "paused",
        progress: 30,
        space: "Product",
        owner: people.alex,
        deadline: {
          display: "Feb 7",
          isPast: true,
        },
        nextStep: "All weekly updates are collected",
        startedAt: "2024-01-01",
        children: [],
      },
      {
        id: "goal-1-1",
        type: "goal",
        name: "Increase user engagement by 50%",
        status: "on_track",
        progress: 60,
        space: "Marketing",
        owner: people.sophia,
        deadline: {
          display: "Nov 15 2024",
          isPast: false,
        },
        nextStep: "Launch email campaign",
        timeframe: currentYear(),
        children: [
          {
            id: "project-3",
            type: "project",
            name: "Create onboarding email sequence",
            status: "on_track",
            progress: 75,
            space: "Marketing",
            owner: people.jennifer,
            deadline: {
              display: "Oct 1 2024",
              isPast: false,
            },
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
    type: "goal",
    name: "Improve customer onboarding experience",
    status: "caution",
    progress: 25,
    space: "R&D",
    owner: people.jennifer,
    deadline: {
      display: "Jun 15 2025",
      isPast: false,
    },
    nextStep: "Conduct user interviews",
    timeframe: currentQuarter(),
    children: [
      {
        id: "goal-2-1",
        type: "goal",
        name: "Reduce onboarding time by 30%",
        status: "issue",
        progress: 15,
        space: "Customer Success",
        owner: people.alex,
        deadline: {
          display: "May 30 2025",
          isPast: false,
        },
        nextStep: "Identify bottlenecks in process",
        timeframe: currentQuarter(),
        children: [
          {
            id: "goal-2-1-1",
            type: "goal",
            name: "Automate user account setup",
            status: "on_track",
            progress: 40,
            space: "Engineering",
            owner: people.sophia,
            deadline: {
              display: "Apr 15 2025",
              isPast: false,
            },
            nextStep: "Complete backend integration",
            timeframe: currentQuarter(),
            children: [],
          },
          {
            id: "project-6",
            type: "project",
            name: "Implement self-guided tutorial",
            status: "on_track",
            progress: 25,
            space: "Customer Success",
            owner: people.jennifer,
            deadline: {
              display: "Apr 30 2025",
              isPast: false,
            },
            nextStep: "Finalize content outline",
            startedAt: "2024-03-01",
            children: [],
          }
        ],
      },
      {
        id: "project-4",
        type: "project",
        name: "Redesign welcome screen",
        status: "on_track",
        progress: 40,
        space: "Product",
        owner: people.sophia,
        deadline: {
          display: "Apr 20 2025",
          isPast: false,
        },
        nextStep: "Finalize mockups",
        startedAt: "2025-02-01",
        children: [],
      }
    ],
  },
  {
    id: "goal-3",
    type: "goal",
    name: "Expand to international markets",
    status: "on_track",
    progress: 35,
    space: "Sales",
    owner: people.alex,
    deadline: {
      display: "Dec 31 2025",
      isPast: false,
    },
    nextStep: "Complete market research",
    timeframe: currentYear(),
    children: [
      {
        id: "goal-3-1",
        type: "goal",
        name: "Launch in European market",
        status: "on_track",
        progress: 50,
        space: "International",
        owner: people.jennifer,
        deadline: {
          display: "Sep 15 2025",
          isPast: false,
        },
        nextStep: "Establish legal entity",
        timeframe: currentYear(),
        children: [
          {
            id: "project-5",
            type: "project",
            name: "GDPR compliance implementation",
            status: "caution",
            progress: 30,
            space: "Legal",
            owner: people.sophia,
            deadline: {
              display: "Aug 1 2025",
              isPast: false,
            },
            nextStep: "Complete data audit",
            startedAt: "2025-04-01",
            children: [],
          }
        ],
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
    <div className="px-8 py-8">
      <WorkMap {...args} />
    </div>
  ),
  args: {
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
    <div className="px-8 py-8">
      <WorkMap {...args} />
    </div>
  ),
  args: {
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
    <div className="px-8 py-8">
      <WorkMap {...args} />
    </div>
  ),
  args: {
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
    <div className="px-8 py-8">
      <WorkMap {...args} />
    </div>
  ),
  args: {
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
          status,
          progress: status === "completed" || status === "achieved" ? 100 : Math.floor(Math.random() * 100),
          space: ["Product", "Engineering", "Marketing", "Sales", "R&D"][index % 5],
          owner: {
            id: `user-${index}`,
            fullName: `User ${index + 1}`,
            avatarUrl: index % 2 === 0 ? people.alex.avatarUrl : people.sophia.avatarUrl,
          },
          deadline:
            status === "completed" || status === "achieved"
              ? undefined
              : {
                  display: `Jun ${15 + index} 2025`,
                  isPast: ["missed", "partial"].includes(status),
                },
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
