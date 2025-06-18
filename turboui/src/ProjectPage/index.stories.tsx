import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { ProjectPage } from "./index";
import { genPeople } from "../utils/storybook/genPeople";
import { mockTasks, mockEmptyTasks } from "../TaskBoard/tests/mockData";

const people = genPeople(5);

const meta: Meta<typeof ProjectPage> = {
  title: "Pages/ProjectPage",
  component: ProjectPage,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const defaultProps: ProjectPage.Props = {
  closeLink: "#",
  reopenLink: "#",

  projectName: "Mobile App Redesign",
  description:
    "<p>Redesigning our mobile application to improve user experience and increase engagement. This project includes user research, wireframing, prototyping, and implementation.</p>",

  space: {
    id: "1",
    name: "Product",
    link: "#",
  },
  setSpace: () => {},
  spaceSearch: async () => [],

  champion: people[0],
  setChampion: () => {},

  status: "on_track",
  state: "active",
  closedAt: null,

  canEdit: true,
  accessLevels: {
    public: false,
    company: true,
    space: false,
    members: false,
  },
  setAccessLevels: () => {},

  updateProjectName: async () => true,
  updateDescription: async () => true,

  activityFeed: <div>Activity feed content</div>,

  // TaskBoard props
  tasks: mockTasks,
  onTaskStatusChange: (taskId, newStatus) => {
    console.log("Task status change:", taskId, newStatus);
  },
  onTaskCreate: (task) => {
    console.log("Task created:", task);
  },
  onMilestoneCreate: (milestone) => {
    console.log("Milestone created:", milestone);
  },
  onTaskUpdate: (taskId, updates) => {
    console.log("Task updated:", taskId, updates);
  },
  onMilestoneUpdate: (milestoneId, updates) => {
    console.log("Milestone updated:", milestoneId, updates);
  },
  searchPeople: async (params) => {
    console.log("Searching people:", params);
    return [];
  },
};

export const Default: Story = {
  args: defaultProps,
};

export const ReadOnly: Story = {
  args: {
    ...defaultProps,
    canEdit: false,
  },
};

export const Closed: Story = {
  args: {
    ...defaultProps,
    state: "closed",
    status: "completed",
    closedAt: new Date("2024-01-15"),
  },
};

export const AtRisk: Story = {
  args: {
    ...defaultProps,
    status: "at_risk",
  },
};

export const Issue: Story = {
  args: {
    ...defaultProps,
    status: "issue",
  },
};

export const EmptyTasks: Story = {
  args: {
    ...defaultProps,
    tasks: mockEmptyTasks,
  },
};
