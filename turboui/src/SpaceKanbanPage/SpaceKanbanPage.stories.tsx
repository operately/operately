import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { SpaceKanbanPage } from "./index";
import * as Types from "../TaskBoard/types";
import { TaskPage } from "../TaskPage";
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
import { useMockSubscriptions } from "../utils/storybook/subscriptions";
import type { TimelineItem as TimelineItemType } from "../Timeline/types";
import { Reactions } from "../Reactions";
import { createActiveTaskTimeline, createComment, currentUser as mockCurrentUser } from "../TaskPage/mockData";

import type { KanbanState, KanbanStatus, TaskSlideInContext } from "../TaskBoard/KanbanView/types";

const normalizeRichText = (value: unknown) => {
  if (typeof value !== "string") return value;

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

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

const toTaskPagePerson = (person: Types.Person): TaskPage.Person => ({
  id: person.id,
  fullName: person.fullName,
  avatarUrl: person.avatarUrl,
  profileLink: "#",
});

const toTaskPageMilestone = (milestone: Types.Milestone): TaskPage.Milestone => ({
  id: milestone.id,
  name: milestone.name,
  dueDate: milestone.dueDate ?? null,
  status: milestone.status,
  link: milestone.link,
});

const commentCountFromTimeline = (items: TimelineItemType[]) => items.filter((i) => i.type === "comment").length;

const extractCommentMessage = (content: any) => {
  if (!content) return "";
  if (typeof content === "string") return content;
  if (typeof content?.message !== "undefined") return content.message;

  return content;
};

const buildTaskPageProps = (
  taskId: string,
  ctx: TaskSlideInContext,
  subscriptions: TaskPage.Props["subscriptions"],
  opts: {
    timelineItems: TimelineItemType[];
    currentUser: NonNullable<TaskPage.ContentProps["currentUser"]>;
    onAddComment: (taskId: string, content: any) => void;
    onEditComment: (taskId: string, commentId: string, content: any) => void;
    onDeleteComment: (taskId: string, commentId: string) => void;
    onAddReaction: (taskId: string, commentId: string, emoji: string) => void;
    onRemoveReaction: (taskId: string, commentId: string, reactionId: string) => void;
  },
): TaskPage.ContentProps | null => {
  const task = ctx.tasks.find((t) => t.id === taskId);
  if (!task) return null;

  const assignee = task.assignees?.[0] ? toTaskPagePerson(task.assignees[0]) : null;
  const milestone = task.milestone ? toTaskPageMilestone(task.milestone) : null;

  return {
    milestone,
    onMilestoneChange: (next) => ctx.onTaskMilestoneChange?.(taskId, next),
    milestones: (ctx.milestones ?? []).map(toTaskPageMilestone),
    onMilestoneSearch: ctx.onMilestoneSearch ?? (async () => {}),
    hideMilestone: true,

    name: task.title,
    onNameChange: async (newName) => {
      ctx.onTaskNameChange?.(taskId, newName);
      return true;
    },
    description: task.description,
    onDescriptionChange: async (newDescription) => {
      if (!ctx.onTaskDescriptionChange) return false;
      return ctx.onTaskDescriptionChange(taskId, newDescription);
    },
    status: task.status,
    onStatusChange: (newStatus) => ctx.onTaskStatusChange?.(taskId, newStatus),
    statusOptions: ctx.statuses as Types.Status[],
    onDueDateChange: (newDueDate) => ctx.onTaskDueDateChange?.(taskId, newDueDate),
    assignee,
    onAssigneeChange: (newAssignee) => ctx.onTaskAssigneeChange?.(taskId, newAssignee),

    createdAt: new Date(),
    createdBy: toTaskPagePerson(Object.values(mockPeople)[0]!),
    subscriptions,
    onDelete: async () => {
      await ctx.onTaskDelete?.(taskId);
    },
    onArchive: undefined,
    assigneePersonSearch: ctx.assigneePersonSearch!,
    richTextHandlers: ctx.richTextHandlers!,
    canEdit: true,
    timelineItems: opts.timelineItems,
    currentUser: opts.currentUser,
    canComment: true,
    onAddComment: (content) => opts.onAddComment(taskId, content),
    onEditComment: (commentId, content) => opts.onEditComment(taskId, commentId, content),
    onDeleteComment: (commentId) => opts.onDeleteComment(taskId, commentId),
    onAddReaction: (commentId, emoji) => opts.onAddReaction(taskId, commentId, emoji),
    onRemoveReaction: (commentId, reactionId) => opts.onRemoveReaction(taskId, commentId, reactionId),
    timelineFilters: undefined,
  };
};

export const Default: Story = {
  render: () => {
    const milestone = mockMilestones.q2Release;
    if (!milestone) return <div>Missing mock milestone data</div>;

    const initialTasks = filterTasksByMilestone(mockTasks("space"), milestone).map((task) => ({
      ...task,
      description: normalizeRichText(task.description),
    }));
    const [tasks, setTasks] = useState<Types.Task[]>(initialTasks);
    const [timelineByTaskId, setTimelineByTaskId] = useState<Record<string, TimelineItemType[]>>(() => {
      return initialTasks.reduce<Record<string, TimelineItemType[]>>((acc, task) => {
        acc[task.id] = createActiveTaskTimeline();
        return acc;
      }, {});
    });
    const [kanbanState, setKanbanState] = useState<KanbanState>(
      buildKanbanStateFromTasks(initialTasks, STATUSES),
    );
    const assigneeSearch = usePersonFieldSearch(Object.values(mockPeople));
    const subscriptions = useMockSubscriptions({ entityType: "project_task" });
    const currentUser = mockCurrentUser;

    const updateTimeline = React.useCallback(
      (taskId: string, updater: (prev: TimelineItemType[]) => TimelineItemType[]) => {
        setTimelineByTaskId((prev) => {
          const nextItems = updater(prev[taskId] ?? []);
          setTasks((prevTasks) => {
            const count = commentCountFromTimeline(nextItems);
            return prevTasks.map((t) =>
              t.id === taskId ? { ...t, hasComments: count > 0, commentCount: count } : t,
            );
          });
          return { ...prev, [taskId]: nextItems };
        });
      },
      [setTasks],
    );

    const onAddComment = React.useCallback(
      (taskId: string, content: any) => {
        const message = extractCommentMessage(content);
        updateTimeline(taskId, (prev) => [...prev, createComment(currentUser, message, 0)]);
      },
      [currentUser, updateTimeline],
    );

    const onEditComment = React.useCallback(
      (taskId: string, commentId: string, content: any) => {
        const message = extractCommentMessage(content);
        updateTimeline(taskId, (prev) =>
          prev.map((item) => {
            if (item.type !== "comment") return item;
            if (item.value.id !== commentId) return item;
            return {
              ...item,
              value: {
                ...item.value,
                content: JSON.stringify({ message }),
              },
            };
          }),
        );
      },
      [updateTimeline],
    );

    const onDeleteComment = React.useCallback(
      (taskId: string, commentId: string) => {
        updateTimeline(taskId, (prev) => prev.filter((i) => i.type !== "comment" || i.value.id !== commentId));
      },
      [updateTimeline],
    );

    const onAddReaction = React.useCallback(
      (taskId: string, commentId: string, emoji: string) => {
        updateTimeline(taskId, (prev) =>
          prev.map((item) => {
            if (item.type !== "comment") return item;
            if (item.value.id !== commentId) return item;

            const reaction: Reactions.Reaction = {
              id: `reaction-${Date.now()}-${Math.random()}`,
              emoji,
              person: currentUser,
            };

            return {
              ...item,
              value: {
                ...item.value,
                reactions: [...(item.value.reactions ?? []), reaction],
              },
            };
          }),
        );
      },
      [currentUser, updateTimeline],
    );

    const onRemoveReaction = React.useCallback(
      (taskId: string, commentId: string, reactionId: string) => {
        updateTimeline(taskId, (prev) =>
          prev.map((item) => {
            if (item.type !== "comment") return item;
            if (item.value.id !== commentId) return item;

            return {
              ...item,
              value: {
                ...item.value,
                reactions: (item.value.reactions ?? []).filter((r) => r.id !== reactionId),
              },
            };
          }),
        );
      },
      [updateTimeline],
    );

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
          getTaskPageProps={(taskId, ctx) =>
            buildTaskPageProps(taskId, ctx, subscriptions, {
              timelineItems: timelineByTaskId[taskId] ?? [],
              currentUser,
              onAddComment,
              onEditComment,
              onDeleteComment,
              onAddReaction,
              onRemoveReaction,
            })
          }
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
                  ? {
                      ...task,
                      description: normalizeRichText(description),
                      hasDescription: Boolean(description),
                    }
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

    const initialTasks = filterTasksByMilestone(mockTasks("space"), milestone).map((task) => ({
      ...task,
      description: normalizeRichText(task.description),
    }));
    const [statuses, setStatuses] = useState<Types.Status[]>(STATUSES);
    const [tasks, setTasks] = useState<Types.Task[]>(initialTasks);
    const [timelineByTaskId, setTimelineByTaskId] = useState<Record<string, TimelineItemType[]>>(() => {
      return initialTasks.reduce<Record<string, TimelineItemType[]>>((acc, task) => {
        acc[task.id] = createActiveTaskTimeline();
        return acc;
      }, {});
    });
    const [kanbanState, setKanbanState] = useState<KanbanState>(
      buildKanbanStateFromTasks(initialTasks, statuses),
    );
    const assigneeSearch = usePersonFieldSearch(Object.values(mockPeople));
    const subscriptions = useMockSubscriptions({ entityType: "project_task" });
    const currentUser = mockCurrentUser;

    const updateTimeline = React.useCallback(
      (taskId: string, updater: (prev: TimelineItemType[]) => TimelineItemType[]) => {
        setTimelineByTaskId((prev) => {
          const nextItems = updater(prev[taskId] ?? []);
          setTasks((prevTasks) => {
            const count = commentCountFromTimeline(nextItems);
            return prevTasks.map((t) =>
              t.id === taskId ? { ...t, hasComments: count > 0, commentCount: count } : t,
            );
          });
          return { ...prev, [taskId]: nextItems };
        });
      },
      [setTasks],
    );

    const onAddComment = React.useCallback(
      (taskId: string, content: any) => {
        const message = extractCommentMessage(content);
        updateTimeline(taskId, (prev) => [...prev, createComment(currentUser, message, 0)]);
      },
      [currentUser, updateTimeline],
    );

    const onEditComment = React.useCallback(
      (taskId: string, commentId: string, content: any) => {
        const message = extractCommentMessage(content);
        updateTimeline(taskId, (prev) =>
          prev.map((item) => {
            if (item.type !== "comment") return item;
            if (item.value.id !== commentId) return item;
            return {
              ...item,
              value: {
                ...item.value,
                content: JSON.stringify({ message }),
              },
            };
          }),
        );
      },
      [updateTimeline],
    );

    const onDeleteComment = React.useCallback(
      (taskId: string, commentId: string) => {
        updateTimeline(taskId, (prev) => prev.filter((i) => i.type !== "comment" || i.value.id !== commentId));
      },
      [updateTimeline],
    );

    const onAddReaction = React.useCallback(
      (taskId: string, commentId: string, emoji: string) => {
        updateTimeline(taskId, (prev) =>
          prev.map((item) => {
            if (item.type !== "comment") return item;
            if (item.value.id !== commentId) return item;

            const reaction: Reactions.Reaction = {
              id: `reaction-${Date.now()}-${Math.random()}`,
              emoji,
              person: currentUser,
            };

            return {
              ...item,
              value: {
                ...item.value,
                reactions: [...(item.value.reactions ?? []), reaction],
              },
            };
          }),
        );
      },
      [currentUser, updateTimeline],
    );

    const onRemoveReaction = React.useCallback(
      (taskId: string, commentId: string, reactionId: string) => {
        updateTimeline(taskId, (prev) =>
          prev.map((item) => {
            if (item.type !== "comment") return item;
            if (item.value.id !== commentId) return item;

            return {
              ...item,
              value: {
                ...item.value,
                reactions: (item.value.reactions ?? []).filter((r) => r.id !== reactionId),
              },
            };
          }),
        );
      },
      [updateTimeline],
    );

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
          getTaskPageProps={(taskId, ctx) =>
            buildTaskPageProps(taskId, ctx, subscriptions, {
              timelineItems: timelineByTaskId[taskId] ?? [],
              currentUser,
              onAddComment,
              onEditComment,
              onDeleteComment,
              onAddReaction,
              onRemoveReaction,
            })
          }
          assigneePersonSearch={assigneeSearch}
          canManageStatuses
          richTextHandlers={createMockRichEditorHandlers()}
          onTaskNameChange={(taskId, name) =>
            setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, title: name } : task)))
          }
          onStatusesChange={(data) => {
            const nextStatuses = data.nextStatuses;
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
                  ? {
                      ...task,
                      description: normalizeRichText(description),
                      hasDescription: Boolean(description),
                    }
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
