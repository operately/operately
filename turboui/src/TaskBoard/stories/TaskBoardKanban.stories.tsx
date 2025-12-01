import React, { useMemo, useState } from "react";
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

const milestoneMap: Record<string, Types.Milestone> = Object.values(mockMilestones).reduce(
  (acc, milestone) => ({ ...acc, [milestone.id]: milestone }),
  {},
);

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
  const state: Record<string, MilestoneKanbanState> = {};
  tasks.forEach((task) => {
    if (!task.milestone) return;
    const status = toKanbanStatus(task, statuses);
    const milestoneState = state[task.milestone.id] || emptyKanbanState(statuses);
    milestoneState[status]?.push(task.id);
    state[task.milestone.id] = milestoneState;
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
  to: { milestoneId: string | null; status: KanbanStatus },
  statuses: Types.Status[],
): Types.Task[] => {
  const milestone = to.milestoneId ? milestoneMap[to.milestoneId] || null : null;
  return tasks.map((task) => {
    if (task.id !== taskId) return task;
    const status = statuses.find((s) => s.value === to.status) || {
      id: to.status,
      value: to.status,
      label: to.status,
      color: "gray",
      icon: "circleDot",
      index: statuses.length,
    };

    return {
      ...task,
      milestone,
      status: {
        ...(task.status || {}),
        ...status,
      },
    };
  });
};

export const BasicKanban: Story = {
  render: () => {
    const q2Release = mockMilestones.q2Release;
    if (!q2Release) return <div>Missing mock milestone data</div>;

    const initialTasks = mockTasks.filter((task) => task.milestone?.id === q2Release.id);
    const [tasks, setTasks] = useState<Types.Task[]>(initialTasks);
    const [kanbanState, setKanbanState] = useState<Record<string, MilestoneKanbanState>>(
      buildKanbanStateFromTasks(initialTasks, BASE_STATUSES),
    );
    const assigneeSearch = usePersonFieldSearch(Object.values(mockPeople));

    return (
      <KanbanBoard
        milestones={[q2Release]}
        tasks={tasks}
        statuses={BASE_STATUSES}
        kanbanStateByMilestone={kanbanState}
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
          setKanbanState(event.updatedKanbanStateByMilestone);
          setTasks((prev) => updateTasksAfterMove(prev, event.taskId, event.to, BASE_STATUSES));
        }}
      />
    );
  },
};

export const MultipleMilestonesAndNoMilestone: Story = {
  render: () => {
    const [tasks, setTasks] = useState<Types.Task[]>(mockTasks);
    const [kanbanState, setKanbanState] = useState<Record<string, MilestoneKanbanState>>(
      buildKanbanStateFromTasks(mockTasks, BASE_STATUSES),
    );
    const assigneeSearch = usePersonFieldSearch(Object.values(mockPeople));

    const milestones = useMemo(
      () =>
        [mockMilestones.q2Release, mockMilestones.productLaunch, mockMilestones.marketExpansion].filter(
          Boolean,
        ) as Types.Milestone[],
      [],
    );

    return (
      <KanbanBoard
        milestones={milestones}
        tasks={tasks}
        statuses={BASE_STATUSES}
        kanbanStateByMilestone={kanbanState}
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
          setKanbanState(event.updatedKanbanStateByMilestone);
          setTasks((prev) => updateTasksAfterMove(prev, event.taskId, event.to, BASE_STATUSES));
        }}
      />
    );
  },
};

export const EmptyStates: Story = {
  render: () => {
    const emptyMilestone = mockMilestones.emptyMilestone;
    if (!emptyMilestone) return <div>Missing mock milestone data</div>;

    return <KanbanBoard milestones={[emptyMilestone]} tasks={[]} statuses={BASE_STATUSES} kanbanStateByMilestone={{}} />;
  },
};

export const SixStatusBoard: Story = {
  render: () => {
    const [tasks, setTasks] = useState<Types.Task[]>(mockTasks);
    const [kanbanState, setKanbanState] = useState<Record<string, MilestoneKanbanState>>(
      buildKanbanStateFromTasks(mockTasks, SIX_STATUSES),
    );
    const assigneeSearch = usePersonFieldSearch(Object.values(mockPeople));
    const milestones = useMemo(
      () =>
        [mockMilestones.q2Release, mockMilestones.productLaunch, mockMilestones.marketExpansion].filter(
          Boolean,
        ) as Types.Milestone[],
      [],
    );

    return (
      <KanbanBoard
        milestones={milestones}
        tasks={tasks}
        statuses={SIX_STATUSES}
        kanbanStateByMilestone={kanbanState}
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
          setKanbanState(event.updatedKanbanStateByMilestone);
          setTasks((prev) => updateTasksAfterMove(prev, event.taskId, event.to, SIX_STATUSES));
        }}
      />
    );
  },
};

export const AutoScrollEdgeColumns: Story = {
  render: () => {
    const wideTasks = spreadTasksAcrossStatuses(mockTasks, WIDE_STATUSES);
    const [tasks, setTasks] = useState<Types.Task[]>(wideTasks);
    const [kanbanState, setKanbanState] = useState<Record<string, MilestoneKanbanState>>(
      buildKanbanStateFromTasks(wideTasks, WIDE_STATUSES),
    );
    const assigneeSearch = usePersonFieldSearch(Object.values(mockPeople));
    const milestones = useMemo(
      () =>
        [mockMilestones.q2Release, mockMilestones.productLaunch, mockMilestones.marketExpansion].filter(
          Boolean,
        ) as Types.Milestone[],
      [],
    );

    return (
      <KanbanBoard
        milestones={milestones}
        tasks={tasks}
        statuses={WIDE_STATUSES}
        kanbanStateByMilestone={kanbanState}
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
          setKanbanState(event.updatedKanbanStateByMilestone);
          setTasks((prev) => updateTasksAfterMove(prev, event.taskId, event.to, WIDE_STATUSES));
        }}
      />
    );
  },
};
