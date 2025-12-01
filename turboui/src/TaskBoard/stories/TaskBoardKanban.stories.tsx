import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { KanbanBoard } from "..";
import type { KanbanStatus, MilestoneKanbanState } from "../KanbanView/types";
import * as Types from "../types";
import {
  mockMilestones,
  mockPeople,
  mockTasks,
  PENDING_STATUS,
  IN_PROGRESS_STATUS,
  DONE_STATUS,
  CANCELED_STATUS,
} from "../tests/mockData";
import { Page } from "../../Page";
import { usePersonFieldSearch } from "../../utils/storybook/usePersonFieldSearch";

type Story = StoryObj<typeof meta>;

const meta: Meta<typeof KanbanBoard> = {
  title: "Components/TaskBoard/Kanban",
  component: KanbanBoard,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (StoryComponent) => (
      <div className="min-h-[800px] py-[4.5rem] px-2 bg-surface-base">
        <Page title="Tasks (Kanban)" size="fullwidth">
          <StoryComponent />
        </Page>
      </div>
    ),
  ],
};

export default meta;

const BASE_STATUSES: Types.Status[] = [PENDING_STATUS, IN_PROGRESS_STATUS, DONE_STATUS, CANCELED_STATUS];
const SIX_STATUSES: Types.Status[] = [
  { id: "pending", value: "pending", label: "Pending", color: "gray", icon: "circleDashed", index: 0 },
  { id: "in_progress", value: "in_progress", label: "In progress", color: "blue", icon: "circleDot", index: 1 },
  { id: "review", value: "review", label: "Review", color: "gray", icon: "circleDot", index: 2 },
  { id: "qa", value: "qa", label: "QA", color: "blue", icon: "circleDot", index: 3 },
  { id: "done", value: "done", label: "Done", color: "green", icon: "circleCheck", index: 4, closed: true },
  { id: "canceled", value: "canceled", label: "Canceled", color: "red", icon: "circleX", index: 5, closed: true },
];
const WIDE_STATUSES: Types.Status[] = [
  { id: "backlog", value: "backlog", label: "Backlog", color: "gray", icon: "circleDashed", index: 0 },
  { id: "ready", value: "ready", label: "Ready", color: "blue", icon: "circleDot", index: 1 },
  { id: "blocked", value: "blocked", label: "Blocked", color: "red", icon: "circleX", index: 2 },
  { id: "pending", value: "pending", label: "Pending", color: "gray", icon: "circleDashed", index: 3 },
  { id: "in_progress", value: "in_progress", label: "In progress", color: "blue", icon: "circleDot", index: 4 },
  { id: "review", value: "review", label: "Review", color: "gray", icon: "circleDot", index: 5 },
  { id: "qa", value: "qa", label: "QA", color: "blue", icon: "circleDot", index: 6 },
  { id: "done", value: "done", label: "Done", color: "green", icon: "circleCheck", index: 7, closed: true },
  { id: "canceled", value: "canceled", label: "Canceled", color: "red", icon: "circleX", index: 8, closed: true },
];

const emptyKanbanState = (statuses: Types.Status[]): MilestoneKanbanState =>
  statuses.reduce<MilestoneKanbanState>((acc, status) => {
    acc[status.value] = [];
    return acc;
  }, {});

const toKanbanStatus = (task: Types.Task, statuses: Types.Status[]): KanbanStatus => {
  const value = task.status?.value || task.status?.id;
  const match = statuses.find((status) => status.value === value);
  return match?.value ?? statuses[0]?.value ?? "unassigned";
};

const buildKanbanStateFromTasks = (tasks: Types.Task[], statuses: Types.Status[]) => {
  const state = emptyKanbanState(statuses);
  tasks.forEach((task) => {
    const status = toKanbanStatus(task, statuses);
    state[status]?.push(task.id);
  });

  return state;
};

const spreadTasksAcrossStatuses = (tasks: Types.Task[], statuses: Types.Status[]): Types.Task[] => {
  if (statuses.length === 0) return tasks;

  return tasks.map((task, index) => {
    const status = statuses[index % statuses.length] ?? task.status ?? null;

    return {
      ...task,
      status,
    };
  });
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

export const BasicKanban: Story = {
  render: () => {
    const milestone = mockMilestones.q2Release;
    if (!milestone) return <div>Missing mock milestone data</div>;

    const initialTasks = filterTasksByMilestone(mockTasks, milestone);
    const [tasks, setTasks] = useState<Types.Task[]>(initialTasks);
    const [kanbanState, setKanbanState] = useState<MilestoneKanbanState>(
      buildKanbanStateFromTasks(initialTasks, BASE_STATUSES),
    );
    const assigneeSearch = usePersonFieldSearch(Object.values(mockPeople));

    return (
      <KanbanBoard
        milestone={milestone}
        tasks={tasks}
        statuses={BASE_STATUSES}
        kanbanState={kanbanState}
        assigneePersonSearch={assigneeSearch}
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
          setTasks((prev) => updateTasksAfterMove(prev, event.taskId, event.to.status, BASE_STATUSES));
        }}
      />
    );
  },
};

export const SixStatusBoard: Story = {
  render: () => {
    const milestone = mockMilestones.productLaunch;
    if (!milestone) return <div>Missing mock milestone data</div>;

    const seededTasks = spreadTasksAcrossStatuses(filterTasksByMilestone(mockTasks, milestone), SIX_STATUSES);
    const [tasks, setTasks] = useState<Types.Task[]>(seededTasks);
    const [kanbanState, setKanbanState] = useState<MilestoneKanbanState>(
      buildKanbanStateFromTasks(seededTasks, SIX_STATUSES),
    );
    const assigneeSearch = usePersonFieldSearch(Object.values(mockPeople));

    return (
      <KanbanBoard
        milestone={milestone}
        tasks={tasks}
        statuses={SIX_STATUSES}
        kanbanState={kanbanState}
        assigneePersonSearch={assigneeSearch}
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
          setTasks((prev) => updateTasksAfterMove(prev, event.taskId, event.to.status, SIX_STATUSES));
        }}
      />
    );
  },
};

export const AutoScrollEdgeColumns: Story = {
  render: () => {
    const milestone = mockMilestones.q2Release;
    if (!milestone) return <div>Missing mock milestone data</div>;

    const wideTasks = spreadTasksAcrossStatuses(filterTasksByMilestone(mockTasks, milestone), WIDE_STATUSES);
    const [tasks, setTasks] = useState<Types.Task[]>(wideTasks);
    const [kanbanState, setKanbanState] = useState<MilestoneKanbanState>(
      buildKanbanStateFromTasks(wideTasks, WIDE_STATUSES),
    );
    const assigneeSearch = usePersonFieldSearch(Object.values(mockPeople));

    return (
      <KanbanBoard
        milestone={milestone}
        tasks={tasks}
        statuses={WIDE_STATUSES}
        kanbanState={kanbanState}
        assigneePersonSearch={assigneeSearch}
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
          setTasks((prev) => updateTasksAfterMove(prev, event.taskId, event.to.status, WIDE_STATUSES));
        }}
      />
    );
  },
};

export const EmptyStates: Story = {
  render: () => {
    const milestone = mockMilestones.emptyMilestone;
    if (!milestone) return <div>Missing mock milestone data</div>;

    return (
      <KanbanBoard
        milestone={milestone}
        tasks={[]}
        statuses={BASE_STATUSES}
        kanbanState={emptyKanbanState(BASE_STATUSES)}
      />
    );
  },
};
