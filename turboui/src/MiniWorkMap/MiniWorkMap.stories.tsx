import type { Meta, StoryObj } from "@storybook/react";
import { MiniWorkMap } from ".";
import { Page } from "../Page";
import { genPeople } from "./../utils/storybook/genPeople";

const meta = {
  title: "Components/MiniWorkMap",
  component: MiniWorkMap,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="sm:mt-12">
        <Page title="Mini Work Map" size="small">
          <div className="p-12">
            <Story />
          </div>
        </Page>
      </div>
    ),
  ],
} satisfies Meta<typeof MiniWorkMap>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    items: [
      {
        id: "goal-a",
        name: "Goal A",
        type: "goal",
        itemPath: "#",
        completed: false,
        progress: 0,
        assignees: genPeople(3, { random: true }),
        status: "on_track",
        children: [
          {
            id: "goal-b",
            name: "Goal B",
            type: "goal",
            itemPath: "#",
            completed: false,
            progress: 10,
            assignees: genPeople(3, { random: true }),
            children: [],
            status: "caution",
          },
          {
            id: "project-a",
            name: "Project A",
            type: "project",
            itemPath: "#",
            completed: false,
            progress: 50,
            assignees: genPeople(3, { random: true }),
            children: [],
            status: "on_track",
          },
          {
            id: "project-b",
            name: "Project B",
            type: "project",
            itemPath: "#",
            completed: true,
            progress: 100,
            assignees: genPeople(3, { random: true }),
            children: [],
            status: "issue",
          },
        ],
      },
    ],
  },
  decorators: [
    (Story) => (
      <div className="w-[500px]">
        <Story />
      </div>
    ),
  ],
};
