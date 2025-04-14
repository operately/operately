import type { Meta, StoryObj } from "@storybook/react";
import { GoalPage } from "./index";
import { genPeople } from "../utils/storybook/genPeople";

const meta: Meta<typeof GoalPage> = {
  title: "Pages/GoalPage",
  component: GoalPage,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <div className="sm:mt-12">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof GoalPage>;

const [champion, reviewer] = genPeople(2);
const relatedWorkItems = [
  {
    id: "1",
    type: "goal" as const,
    status: "on_track",
    name: "Backend Infrastructure",
    link: "/goals/1",
    progress: 75,
    completed: false,
    subitems: [
      {
        id: "3",
        type: "project" as const,
        status: "caution",
        name: "API Development",
        link: "/projects/3",
        progress: 60,
        completed: false,
        subitems: [],
        people: genPeople(10, { random: true }),
      },
      {
        id: "4",
        type: "goal" as const,
        status: "on_track",
        name: "Database Optimization",
        link: "/goals/4",
        progress: 90,
        completed: false,
        subitems: [
          {
            id: "5",
            type: "project" as const,
            status: "on_track",
            name: "Query Performance",
            link: "/projects/5",
            progress: 100,
            completed: true,
            subitems: [],
            people: genPeople(2, { random: true }),
          },
        ],
        people: genPeople(2, { random: true }),
      },
    ],
    people: genPeople(3, { random: true }),
  },
  {
    id: "2",
    type: "goal" as const,
    status: "on_track",
    name: "UI/UX Design",
    link: "/goals/2",
    progress: 100,
    completed: true,
    people: genPeople(7, { random: true }),
    subitems: [
      {
        id: "6",
        type: "project",
        status: "on_track",
        name: "Design System",
        link: "/projects/6",
        progress: 100,
        completed: true,
        subitems: [],
        people: genPeople(3, { random: true }),
      },
    ],
  },
];

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    spaceLink: "/spaces/1",
    workmapLink: "/spaces/1/workmaps/1",
    goalName: "Launch AI Platform",
    spaceName: "Product",
    champion: champion,
    reviewer: reviewer,
    relatedWorkItems: relatedWorkItems,
  },
};

export const ZeroStateForChampions: Story = {
  args: {
    spaceLink: "/spaces/1",
    workmapLink: "/spaces/1/workmaps/1",
    goalName: "Launch AI Platform",
    spaceName: "Product",
    champion: null,
    reviewer: null,
    relatedWorkItems: [],
  },
};

export const ZeroStateReadOnly: Story = {
  args: {
    spaceLink: "/spaces/1",
    workmapLink: "/spaces/1/workmaps/1",
    goalName: "Launch AI Platform",
    spaceName: "Product",
    champion: null,
    reviewer: null,
    relatedWorkItems: [],
    isEditable: false,
  },
};

export const Mobile: Story = {
  args: {
    spaceLink: "/spaces/1",
    workmapLink: "/spaces/1/workmaps/1",
    goalName: "Launch AI Platform",
    spaceName: "Product",
    champion: champion,
    reviewer: reviewer,
    relatedWorkItems: relatedWorkItems,
  },
  parameters: {
    viewport: {
      defaultViewport: "mobile2",
    },
  },
};
