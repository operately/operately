import type { Meta, StoryObj } from "@storybook/react";
import { WorkMapTable } from "./WorkMapTable";
import { WorkMap } from ".";
import { currentYear, currentQuarter, currentMonth } from "../TimeframeSelector/utils";

// --- Mock Data ---
function genAvatar(id: string) {
  return `https://images.unsplash.com/${id}?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80`;
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
    type: "goal",
    name: "Grow user base",
    status: "caution",
    progress: 40,
    space: "Growth",
    owner: people.igor,
    deadline: { display: "Dec 31 2025", isPast: false },
    closedAt: undefined,
    nextStep: "Launch referral program",
    timeframe: currentYear(),
    children: [
      {
        id: "project-1",
        type: "project",
        name: "Referral program",
        status: "on_track",
        progress: 60,
        space: "Growth",
        owner: people.jane,
        deadline: { display: "Nov 30 2025", isPast: false },
        closedAt: undefined,
        nextStep: "Design rewards",
        startedAt: "2025-01-15",
        children: [],
      },
      {
        id: "goal-1-1",
        type: "goal",
        name: "Increase signups by 20%",
        status: "completed",
        progress: 30,
        space: "Growth",
        owner: people.jane,
        deadline: { display: "Oct 15 2025", isPast: false },
        closedAt: undefined,
        nextStep: "A/B test new landing page",
        timeframe: currentYear(),
        children: [
          {
            id: "goal-100",
            type: "goal",
            name: "Finish Q2 OKRs",
            status: "missed",
            progress: 100,
            space: "Strategy",
            owner: people.igor,
            deadline: { display: "Jun 30 2025", isPast: true },
            closedAt: "Jul 1 2025",
            nextStep: "",
            timeframe: currentQuarter(),
            children: [],
          },
          {
            id: "project-100",
            type: "project",
            name: "Migrate to Vite",
            status: "completed",
            progress: 100,
            space: "Engineering",
            owner: people.jennifer,
            deadline: { display: "Mar 31 2025", isPast: true },
            closedAt: "Apr 1 2025",
            nextStep: "",
            startedAt: "2025-01-01",
            children: [],
          },
        ],
      },
    ],
  },
  {
    id: "goal-2",
    type: "goal",
    name: "Improve onboarding",
    status: "paused",
    progress: 75,
    space: "Product",
    owner: people.jennifer,
    deadline: { display: "Aug 30 2025", isPast: false },
    closedAt: undefined,
    nextStep: "Ship onboarding checklist",
    timeframe: currentYear(),
    children: [
      {
        id: "project-2",
        type: "project",
        name: "Onboarding checklist",
        status: "issue",
        progress: 80,
        space: "Product",
        owner: people.jennifer,
        deadline: { display: "Aug 15 2025", isPast: false },
        closedAt: undefined,
        nextStep: "QA checklist",
        startedAt: "2025-03-15",
        children: [],
      },
    ],
  },
  {
    id: "project-3",
    type: "project",
    name: "Website redesign",
    status: "pending",
    progress: 50,
    space: "Design",
    owner: people.igor,
    deadline: { display: "Jul 31 2025", isPast: false },
    closedAt: undefined,
    nextStep: "Finalize homepage",
    startedAt: "2025-02-01",
    children: [],
  },
];

const onlyGoals: WorkMap.Item[] = [
  {
    id: "goal-g1",
    type: "goal",
    name: "Increase NPS score",
    status: "caution",
    progress: 60,
    space: "Customer Success",
    owner: people.igor,
    deadline: { display: "Sep 30 2025", isPast: false },
    closedAt: undefined,
    nextStep: "Send Q3 survey",
    timeframe: currentQuarter(),
    children: [
      {
        id: "goal-g1-1",
        type: "goal",
        name: "Launch new CSAT tool",
        status: "achieved",
        progress: 80,
        space: "Customer Success",
        owner: people.jane,
        deadline: { display: "Aug 15 2025", isPast: false },
        closedAt: undefined,
        nextStep: "Enable feedback widget",
        timeframe: currentMonth(),
        children: [],
      },
      {
        id: "goal-g1-2",
        type: "goal",
        name: "Reduce churn by 10%",
        status: "missed",
        progress: 50,
        space: "Customer Success",
        owner: people.jennifer,
        deadline: { display: "Sep 1 2025", isPast: false },
        closedAt: undefined,
        nextStep: "Analyze churn data",
        timeframe: currentQuarter(),
        children: [],
      },
    ],
  },
  {
    id: "goal-g2",
    type: "goal",
    name: "Expand to APAC region",
    status: "partial",
    progress: 30,
    space: "Growth",
    owner: people.jane,
    deadline: { display: "Dec 31 2025", isPast: false },
    closedAt: undefined,
    nextStep: "Research local partners",
    timeframe: currentYear(),
    children: [
      {
        id: "goal-g2-1",
        type: "goal",
        name: "Localize product",
        status: "pending",
        progress: 40,
        space: "Growth",
        timeframe: currentQuarter(),
        owner: people.igor,
        deadline: { display: "Nov 15 2025", isPast: false },
        closedAt: undefined,
        nextStep: "Hire translators",
        children: [],
      },
      {
        id: "goal-g2-2",
        type: "goal",
        name: "APAC marketing campaign",
        status: "dropped",
        progress: 25,
        space: "Growth",
        owner: people.jennifer,
        deadline: { display: "Dec 1 2025", isPast: false },
        closedAt: undefined,
        nextStep: "Draft campaign assets",
        timeframe: currentQuarter(),
        children: [],
      },
    ],
  },
];

const onlyProjects: WorkMap.Item[] = [
  {
    id: "project-1",
    type: "project",
    name: "Mobile app v2",
    status: "dropped",
    progress: 70,
    startedAt: "2025-01-10",
    space: "Mobile",
    owner: people.jane,
    deadline: { display: "Sep 30 2025", isPast: false },
    closedAt: undefined,
    nextStep: "Start beta testing",
    children: [],
  },
  {
    id: "project-2",
    type: "project",
    name: "API refactor",
    status: "paused",
    progress: 40,
    space: "Backend",
    owner: people.igor,
    deadline: { display: "Oct 31 2025", isPast: false },
    closedAt: undefined,
    nextStep: "Migrate endpoints",
    startedAt: "2025-02-15",
    children: [],
  },
  {
    id: "project-3",
    type: "project",
    name: "Website redesign",
    status: "achieved",
    progress: 50,
    space: "Design",
    owner: people.jennifer,
    deadline: { display: "Jul 31 2025", isPast: false },
    closedAt: undefined,
    nextStep: "Finalize homepage",
    startedAt: "2025-03-01",
    children: [],
  },
];

const onlyCompleted: WorkMap.Item[] = [
  {
    id: "goal-10",
    type: "goal",
    name: "Achieve Series B funding",
    status: "completed",
    progress: 100,
    space: "Finance",
    owner: people.igor,
    timeframe: currentYear(),
    deadline: { display: "May 31 2025", isPast: true },
    closedAt: "Jun 1 2025",
    nextStep: "",
    children: [],
  },
  {
    id: "goal-11",
    type: "goal",
    name: "Hit 100k MAU",
    status: "completed",
    progress: 100,
    space: "Growth",
    owner: people.jane,
    deadline: { display: "Apr 30 2025", isPast: true },
    closedAt: "May 1 2025",
    nextStep: "",
    timeframe: currentQuarter(),
    children: [],
  },
  {
    id: "project-10",
    type: "project",
    name: "Migrate to Vite",
    status: "completed",
    progress: 100,
    space: "Engineering",
    owner: people.jennifer,
    deadline: { display: "Mar 31 2025", isPast: true },
    closedAt: "Apr 1 2025",
    nextStep: "",
    startedAt: "2025-01-15",
    children: [],
  },
];

export const Default: Story = {
  args: {
    items: defaultGoalsAndProjects,
    filter: "all",
    deleteItem: (itemId: string) => console.log("Delete", itemId),
    addItem: (newItem) => console.log("Add", newItem),
  },
};

export const GoalsOnly: Story = {
  args: {
    items: onlyGoals,
    filter: "goals",
    deleteItem: (itemId: string) => console.log("Delete", itemId),
    addItem: (newItem) => console.log("Add", newItem),
  },
};

export const ProjectsOnly: Story = {
  args: {
    items: onlyProjects,
    filter: "projects",
    deleteItem: (itemId: string) => console.log("Delete", itemId),
    addItem: (newItem) => console.log("Add", newItem),
  },
};

export const CompletedOnly: Story = {
  args: {
    items: onlyCompleted,
    filter: "completed",
    deleteItem: (itemId: string) => console.log("Delete", itemId),
    addItem: (newItem) => console.log("Add", newItem),
  },
};
