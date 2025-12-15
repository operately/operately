import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { SpaceKanbanPage } from "./index";
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
import { createMockRichEditorHandlers } from "../utils/storybook/richEditor";

import type { KanbanState, KanbanStatus } from "../TaskBoard/KanbanView/types";

const meta: Meta<typeof SpaceKanbanPage> = {
  title: "Pages/SpaceKanbanPage",
  component: SpaceKanbanPage,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

const STATUSES: Types.Status[] = [PENDING_STATUS, IN_PROGRESS_STATUS, DONE_STATUS, CANCELED_STATUS];

const space = {
  id: "12345",
  name: "Demo Space",
  link: "#",
}

const emptyKanbanState = (statuses: Types.Status[]): KanbanState =>
  statuses.reduce<KanbanState>((acc, status) => {
    acc[status.value] = [];
    return acc;
  }, {} as KanbanState);

const toKanbanStatus = (task: Types.Task, statuses: Types.Status[]): KanbanStatus => {
  const value = task.status?.value || task.status?.id;
  const match = statuses.find((status) => status.value === value);
  return (match?.value ?? statuses[0]?.value ?? "unassigned") as KanbanStatus;
};

const buildKanbanStateFromTasks = (tasks: Types.Task[], statuses: Types.Status[]): KanbanState => {
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

const removeTaskFromKanbanState = (state: KanbanState, taskId: string): KanbanState => {
  return (Object.keys(state) as KanbanStatus[]).reduce<KanbanState>((acc, status) => {
    acc[status] = state[status]?.filter((id) => id !== taskId) || [];
    return acc;
  }, {} as KanbanState);
};

const filterTasksByMilestone = (tasks: Types.Task[], milestone: Types.Milestone | null) =>
  tasks.filter((task) => !task._isHelperTask && (milestone ? task.milestone?.id === milestone.id : !task.milestone));

export const Default: Story = {
  render: () => {
    const milestone = mockMilestones.q2Release;
    if (!milestone) return <div>Missing mock milestone data</div>;

    const initialTasks = filterTasksByMilestone(mockTasks("space"), milestone);
    const [tasks, setTasks] = useState<Types.Task[]>(initialTasks);
    const [kanbanState, setKanbanState] = useState<KanbanState>(
      buildKanbanStateFromTasks(initialTasks, STATUSES),
    );
    const assigneeSearch = usePersonFieldSearch(Object.values(mockPeople));

    return (
      <div className="min-h-[800px] py-[4.5rem] px-2 bg-surface-base">
        <SpaceKanbanPage
          space={space}
          navigation={[
            { to: "/spaces/demo-space", label: "Demo Space" },
          ]}
          tasks={tasks}
          statuses={STATUSES}
          kanbanState={kanbanState}
          getTaskPageProps={(_taskId, _ctx) => null}
          assigneePersonSearch={assigneeSearch}
          richTextHandlers={createMockRichEditorHandlers()}
          onTaskNameChange={(taskId, name) =>
            setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, title: name } : task)))
          }
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
              type: "space"
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
          onTaskStatusChange={(taskId, status) => {
            setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, status } : task)));

            setKanbanState((prev) => {
              const next = { ...prev };

              const fromStatus = (Object.keys(next) as KanbanStatus[]).find((key) => next[key]?.includes(taskId));

              const toStatus = (status?.value ?? status?.id ?? STATUSES[0]?.value ?? "pending") as KanbanStatus;

              if (fromStatus && next[fromStatus]) {
                next[fromStatus] = next[fromStatus].filter((id) => id !== taskId);
              }

              if (!next[toStatus]) {
                next[toStatus] = [];
              }

              if (!next[toStatus].includes(taskId)) {
                next[toStatus] = [...next[toStatus], taskId];
              }

              return next;
            });
          }}
          onTaskDescriptionChange={async (taskId, description) => {
            setTasks((prev) =>
              prev.map((task) =>
                task.id === taskId
                  ? { ...task, description, hasDescription: Boolean(description) }
                  : task,
              ),
            );

            return true;
          }}
          onTaskDelete={(taskId) => {
            setTasks((prev) => prev.filter((task) => task.id !== taskId));
            setKanbanState((prev) => removeTaskFromKanbanState(prev, taskId));
          }}
          onTaskKanbanChange={(event) => {
            setKanbanState(event.updatedKanbanState);
            setTasks((prev) => updateTasksAfterMove(prev, event.taskId, event.to.status, STATUSES));
          }}
        />
      </div>
    );
  },
};

export const WithStatusManagement: Story = {
  render: () => {
    const milestone = mockMilestones.q2Release;
    if (!milestone) return <div>Missing mock milestone data</div>;

    const initialTasks = filterTasksByMilestone(mockTasks("space"), milestone);
    const [statuses, setStatuses] = useState<Types.Status[]>(STATUSES);
    const [tasks, setTasks] = useState<Types.Task[]>(initialTasks);
    const [kanbanState, setKanbanState] = useState<KanbanState>(
      buildKanbanStateFromTasks(initialTasks, statuses),
    );
    const assigneeSearch = usePersonFieldSearch(Object.values(mockPeople));

    return (
      <div className="min-h-[800px] py-[4.5rem] px-2 bg-surface-base">
        <SpaceKanbanPage
          space={space}
          navigation={[
            { to: "/spaces/demo-space", label: "Demo Space" },
          ]}
          tasks={tasks}
          statuses={statuses}
          kanbanState={kanbanState}
          getTaskPageProps={(_taskId, _ctx) => null}
          assigneePersonSearch={assigneeSearch}
          canManageStatuses
          richTextHandlers={createMockRichEditorHandlers()}
          onTaskNameChange={(taskId, name) =>
            setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, title: name } : task)))
          }
          onStatusesChange={(nextStatuses) => {
            setStatuses(nextStatuses);
            setKanbanState((prev) => {
              const base = emptyKanbanState(nextStatuses);
              (Object.keys(base) as KanbanStatus[]).forEach((status) => {
                if (prev[status]) {
                  base[status] = prev[status];
                }
              });
              return base;
            });
          }}
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
              type: "space"
            };

            setTasks((prev) => [...prev, newTask]);
            setKanbanState((prev) => {
              const statusValue = payload.status?.value || statuses[0]?.value || "pending";
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
          onTaskStatusChange={(taskId, status) => {
            setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, status } : task)));

            setKanbanState((prev) => {
              const next = { ...prev };

              const fromStatus = (Object.keys(next) as KanbanStatus[]).find((key) => next[key]?.includes(taskId));

              const toStatus = (status?.value ?? status?.id ?? statuses[0]?.value ?? "pending") as KanbanStatus;

              if (fromStatus && next[fromStatus]) {
                next[fromStatus] = next[fromStatus].filter((id) => id !== taskId);
              }

              if (!next[toStatus]) {
                next[toStatus] = [];
              }

              if (!next[toStatus].includes(taskId)) {
                next[toStatus] = [...next[toStatus], taskId];
              }

              return next;
            });
          }}
          onTaskDescriptionChange={async (taskId, description) => {
            setTasks((prev) =>
              prev.map((task) =>
                task.id === taskId
                  ? { ...task, description, hasDescription: Boolean(description) }
                  : task,
              ),
            );

            return true;
          }}
          onTaskDelete={(taskId) => {
            setTasks((prev) => prev.filter((task) => task.id !== taskId));
            setKanbanState((prev) => removeTaskFromKanbanState(prev, taskId));
          }}
          onTaskKanbanChange={(event) => {
            setKanbanState(event.updatedKanbanState);
            setTasks((prev) => updateTasksAfterMove(prev, event.taskId, event.to.status, statuses));
          }}
        />
      </div>
    );
  },
};
