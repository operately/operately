import type { Meta, StoryObj } from "@storybook/react-vite";
import React, { useState } from "react";
import { createContextualDate } from "../DateField/mockData";
import * as TaskBoardTypes from "../TaskBoard/types";
import { MilestoneList } from "./index";
import type { TemplateMilestone } from "./types";

// Render-only stories: binding `component: MilestoneList` makes StoryObj require
// discriminated-union args that these interactive renders do not use.
const meta = {
  title: "Components/MilestoneList",
  parameters: {
    layout: "padded",
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const projectMilestones: TaskBoardTypes.Milestone[] = [
  {
    id: "m1",
    name: "Kickoff",
    status: "done",
    dueDate: createContextualDate(new Date("2024-01-10"), "day"),
    link: "/projects/1/milestones/m1",
    hasDescription: true,
  },
  {
    id: "m2",
    name: "Beta",
    status: "pending",
    dueDate: createContextualDate(new Date("2024-02-15"), "day"),
    link: "/projects/1/milestones/m2",
    hasComments: true,
    commentCount: 3,
  },
  {
    id: "m3",
    name: "Launch",
    status: "pending",
    dueDate: null,
    link: "/projects/1/milestones/m3",
  },
];

const templateMilestones: TemplateMilestone[] = [
  {
    id: "tm1",
    title: "Kickoff",
    dueOffsetDays: 0,
    link: "/templates/1/milestones/tm1",
  },
  {
    id: "tm2",
    title: "Beta",
    dueOffsetDays: 21,
    link: "/templates/1/milestones/tm2",
  },
  {
    id: "tm3",
    title: "Launch",
    dueOffsetDays: null,
    link: "/templates/1/milestones/tm3",
  },
];

export const Project: Story = {
  render: () => {
    const [milestones, setMilestones] = useState(projectMilestones);

    return (
      <div className="max-w-2xl">
        <MilestoneList
          variant="project"
          milestones={milestones}
          canEdit
          onMilestoneCreate={(payload) => {
            setMilestones((current) => [
              ...current,
              {
                id: `m-${Date.now()}`,
                name: payload.name,
                dueDate: payload.dueDate,
                status: payload.status,
                link: `/projects/1/milestones/m-${Date.now()}`,
              },
            ]);
          }}
          onMilestoneUpdate={(id, updates) => {
            setMilestones((current) =>
              current.map((milestone) => (milestone.id === id ? { ...milestone, ...updates } : milestone)),
            );
          }}
          onMilestoneReorder={async (id, destinationIndex) => {
            setMilestones((current) => {
              const fromIndex = current.findIndex((milestone) => milestone.id === id);
              if (fromIndex < 0) return current;
              const next = [...current];
              const [moved] = next.splice(fromIndex, 1);
              if (!moved) return current;
              next.splice(destinationIndex, 0, moved);
              return next;
            });
          }}
        />
      </div>
    );
  },
};

export const ProjectTemplate: Story = {
  render: () => {
    const [milestones, setMilestones] = useState(templateMilestones);

    return (
      <div className="max-w-2xl">
        <MilestoneList
          variant="project-template"
          milestones={milestones}
          canEdit
          onMilestoneCreate={(payload) => {
            setMilestones((current) => [
              ...current,
              {
                id: `tm-${Date.now()}`,
                title: payload.title,
                dueOffsetDays: payload.dueOffsetDays,
                link: `/templates/1/milestones/tm-${Date.now()}`,
              },
            ]);
          }}
          onMilestoneUpdate={(id, updates) => {
            setMilestones((current) =>
              current.map((milestone) => (milestone.id === id ? { ...milestone, ...updates } : milestone)),
            );
          }}
          onMilestoneReorder={async (id, destinationIndex) => {
            setMilestones((current) => {
              const fromIndex = current.findIndex((milestone) => milestone.id === id);
              if (fromIndex < 0) return current;
              const next = [...current];
              const [moved] = next.splice(fromIndex, 1);
              if (!moved) return current;
              next.splice(destinationIndex, 0, moved);
              return next;
            });
          }}
        />
      </div>
    );
  },
};

export const ProjectEmpty: Story = {
  render: () => (
    <div className="max-w-2xl">
      <MilestoneList variant="project" milestones={[]} canEdit onMilestoneCreate={() => undefined} />
    </div>
  ),
};

export const ProjectReadOnly: Story = {
  render: () => (
    <div className="max-w-2xl">
      <MilestoneList variant="project" milestones={projectMilestones} canEdit={false} />
    </div>
  ),
};
