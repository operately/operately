import type { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";
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
        <Page title="Mini Work Map" size="medium">
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
        name: "Increase revenue by 20% by focusing on new customers in the US",
        type: "goal",
        itemPath: "#",
        state: "active",
        progress: 0,
        assignees: genPeople(3, { random: true }),
        status: "on_track",
        children: [
          {
            id: "goal-b",
            name: "Deliver the new product to 100 customers",
            type: "goal",
            itemPath: "#",
            state: "closed",
            progress: 10,
            assignees: genPeople(3, { random: true }),
            children: [],
            status: "missed",
          },
          {
            id: "project-a",
            name: "Project A",
            type: "project",
            itemPath: "#",
            state: "active",
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
            state: "active",
            progress: 100,
            assignees: genPeople(3, { random: true }),
            children: [],
            status: "off_track",
          },
        ],
      },
      {
        id: "project-a",
        name: "Project Alp",
        type: "project",
        itemPath: "#",
        state: "active",
        progress: 50,
        assignees: genPeople(3, { random: true }),
        children: [],
        status: "on_track",
      },
      {
        id: "project-a",
        name: "Project Bug",
        type: "project",
        itemPath: "#",
        state: "closed",
        progress: 50,
        assignees: genPeople(3, { random: true }),
        children: [],
        status: "on_track",
      },
    ],
  },
  decorators: [
    (Story) => (
      <div className="">
        <Story />

        <div className="text-sm mt-8">
          Note: Items are sorted by their state (active, paused, closed) and then by their type (projects, goals).
        </div>
      </div>
    ),
  ],
};
