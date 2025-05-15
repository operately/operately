import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";

import { GoalDeletePage } from ".";
import { genPeople } from "../utils/storybook/genPeople";

const meta: Meta<typeof GoalDeletePage> = {
  title: "Pages/GoalDeletePage",
  component: GoalDeletePage,
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
} satisfies Meta<typeof GoalDeletePage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    goalId: "goal-1",
    goalName: "Launch AI Platform",
    spaceName: "Marketing",
    spaceLink: "/spaces/ai-research",
    workmapLink: "/spaces/ai-research/workmap",
    goalLink: "/spaces/ai-research/workmap/goals/launch-ai-platform",

    onSubmit: (_id: string) => fn(),
    onCancel: () => fn(),

    subitems: [],
  },
};

export const NonDeletable: Story = {
  args: {
    goalId: "goal-1",
    goalName: "Launch AI Platform",
    spaceName: "Marketing",
    spaceLink: "/spaces/ai-research",
    workmapLink: "/spaces/ai-research/workmap",
    goalLink: "/spaces/ai-research/workmap/goals/launch-ai-platform",

    onSubmit: (_id: string) => fn(),
    onCancel: () => fn(),

    subitems: [
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
    ],
  },
};
