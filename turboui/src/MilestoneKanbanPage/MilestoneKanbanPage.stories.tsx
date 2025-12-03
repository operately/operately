import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { MilestoneKanbanPage } from "./index";
import * as Types from "../TaskBoard/types";
import {
  mockMilestones,
  mockPeople,
  mockTasks,
  PENDING_STATUS,
  IN_PROGRESS_STATUS,
  DONE_STATUS,
  CANCELED_STATUS,
} from "../TaskBoard/tests/mockData";
import { usePersonFieldSearch } from "../utils/storybook/usePersonFieldSearch";

import type { MilestoneKanbanState, KanbanStatus } from "../TaskBoard/KanbanView/types";

const meta: Meta<typeof MilestoneKanbanPage> = {
  title: "Pages/MilestoneKanbanPage",
  component: MilestoneKanbanPage,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

const STATUSES: Types.Status[] = [PENDING_STATUS, IN_PROGRESS_STATUS, DONE_STATUS, CANCELED_STATUS];

const emptyKanbanState = (statuses: Types.Status[]): MilestoneKanbanState =>
  statuses.reduce<MilestoneKanbanState>((acc, status) => {
    acc[status.value] = [];
    return acc;
  }, {} as MilestoneKanbanState);

const toKanbanStatus = (task: Types.Task, statuses: Types.Status[]): KanbanStatus => {
  const value = task.status?.value || task.status?.id;
  const match = statuses.find((status) => status.value === value);
  return (match?.value ?? statuses[0]?.value ?? "unassigned") as KanbanStatus;
};

const buildKanbanStateFromTasks = (tasks: Types.Task[], statuses: Types.Status[]): MilestoneKanbanState => {
  const state = emptyKanbanState(statuses);
  tasks.forEach((task) => {
    const status = toKanbanStatus(task, statuses);
    state[status]?.push(task.id);
  });

  return state;
};

const updateTasksAfterMove = (
  tasks: Types.Task[],
  taskId: string,
  status: KanbanStatus,
  statuses: Types.Status[],
): Types.Task[] => {
  return tasks.map((task) => {
    if (task.id !== taskId) return task;
    const statusOption =
      statuses.find((s) => s.value === status) ||
      ({
        id: status,
        value: status,
        label: status,
        color: "gray",
        icon: "circleDot",
        index: statuses.length,
      } as Types.Status);

    return {
      ...task,
      status: {
        ...(task.status || {}),
        ...statusOption,
      },
    };
  });
};

const filterTasksByMilestone = (tasks: Types.Task[], milestone: Types.Milestone | null) =>
  tasks.filter((task) => !task._isHelperTask && (milestone ? task.milestone?.id === milestone.id : !task.milestone));

export const Default: Story = {
  render: () => {
    const milestone = mockMilestones.q2Release;
    if (!milestone) return <div>Missing mock milestone data</div>;

    const initialTasks = filterTasksByMilestone(mockTasks, milestone);
    const [tasks, setTasks] = useState<Types.Task[]>(initialTasks);
    const [kanbanState, setKanbanState] = useState<MilestoneKanbanState>(
      buildKanbanStateFromTasks(initialTasks, STATUSES),
    );
    const assigneeSearch = usePersonFieldSearch(Object.values(mockPeople));

    return (
      <div className="min-h-[800px] py-[4.5rem] px-2 bg-surface-base">
        <MilestoneKanbanPage
          projectName="Demo Project"
          milestone={milestone}
          tasks={tasks}
          statuses={STATUSES}
          kanbanState={kanbanState}
          assigneePersonSearch={assigneeSearch}
          onTaskCreate={(payload) => {
            const newTask: Types.Task = {
              id: `task-${Date.now()}`,
              title: payload.title,
              status: payload.status || null,
              description: null,
              link: "#",
              assignees: [],
              milestone: payload.milestone,
              dueDate: payload.dueDate,
              hasDescription: false,
              hasComments: false,
              commentCount: 0,
            };

            setTasks((prev) => [...prev, newTask]);
            setKanbanState((prev) => {
              const statusValue = payload.status?.value || STATUSES[0]?.value || "pending";
              return {
                ...prev,
                [statusValue]: [...(prev[statusValue] || []), newTask.id],
              };
            });
          }}
          onTaskAssigneeChange={(taskId, assignee) =>
            setTasks((prev) =>
              prev.map((task) => (task.id === taskId ? { ...task, assignees: assignee ? [assignee] : [] } : task)),
            )
          }
          onTaskDueDateChange={(taskId, dueDate) =>
            setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, dueDate } : task)))
          }
          onTaskKanbanChange={(event) => {
            setKanbanState(event.updatedKanbanState);
            setTasks((prev) => updateTasksAfterMove(prev, event.taskId, event.to.status, STATUSES));
          }}
        />
      </div>
    );
  },
};
