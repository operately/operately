/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import type { Task } from "@/api";
import { showErrorToast, type TaskBoard } from "turboui";
import i18n from "@/i18n";
import { renderHook } from "@/__tests__/renderHook";
import { useProjectTasksForTurboUi, buildProjectTaskCreateInput } from "./useProjectTasksForTurboUi";

jest.mock("turboui", () => ({
  ...jest.requireActual("turboui"),
  showErrorToast: jest.fn(),
}));

jest.mock("@/api", () => ({
  __esModule: true,
  default: {
    tasks: {
      create: jest.fn(),
    },
  },
}));

const mockPaths = { taskPath: (id: string) => `/tasks/${id}` };
jest.mock("@/routes/paths", () => ({
  compareIds: (a: string | null | undefined, b: string | null | undefined) => a === b,
  usePaths: () => mockPaths,
  includesId: (ids: string[], id: string) => ids.includes(id),
}));

jest.mock("@/signals", () => ({}));

jest.mock("./index", () => ({
  parseTasksForTurboUi: (_paths: unknown, tasks: Task[]) => tasks.map((task) => ({ ...task, title: task.name })),
  parseTaskForTurboUi: (_paths: unknown, task: any) => ({
    id: task.id,
    title: task.name,
    description: task.description ?? null,
    link: `/tasks/${task.id}`,
    status: null,
    assignees: [],
    milestone: null,
    dueDate: null,
    type: "project",
  }),
  serializeTaskStatus: () => null,
  serializeTaskReminders: (reminders: unknown) => reminders,
}));

jest.mock("../milestones", () => ({
  parseMilestoneForTurboUi: (_paths: unknown, milestone: any) => milestone,
  parseMilestonesForTurboUi: () => ({ orderedMilestones: [] }),
}));

jest.mock("./taskLifecycle", () => {
  const createTaskMutateAsync = jest.fn();
  const updateTaskNameMutateAsync = jest.fn();
  const updateTaskMutateAsync = jest.fn();
  const update = () => ({ mutateAsync: updateTaskMutateAsync });

  return {
    createTaskMutateAsync,
    updateTaskNameMutateAsync,
    updateTaskMutateAsync,
    useCreateTask: () => ({ mutateAsync: createTaskMutateAsync }),
    useDeleteTask: update,
    useUpdateTaskAssignee: update,
    useUpdateTaskDescription: update,
    useUpdateTaskDueDate: update,
    useUpdateTaskMilestoneAndOrdering: update,
    useUpdateTaskName: () => ({ mutateAsync: updateTaskNameMutateAsync }),
    useUpdateTaskReminders: update,
    useUpdateTaskStatus: update,
  };
});

const { createTaskMutateAsync, updateTaskNameMutateAsync, updateTaskMutateAsync } = jest.requireMock("./taskLifecycle");
const englishTranslations = { ...i18n.getResourceBundle("en", "translation") };

const richTextWithMention = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Please sync with " },
        {
          type: "mention",
          attrs: {
            id: "person-1",
            label: "Jane Doe",
          },
        },
      ],
    },
  ],
};

function setupHook() {
  return renderHook(useProjectTasksForTurboUi, {
    initialProps: {
      backendTasks: [{ id: "task-1", name: "Existing task" } as Task],
      projectId: "project-1",
      milestones: [],
    },
  });
}

describe("useProjectTasksForTurboUi", () => {
  beforeEach(() => {
    jest.mocked(showErrorToast).mockReset();
    createTaskMutateAsync.mockReset();
    updateTaskNameMutateAsync.mockReset();
    updateTaskMutateAsync.mockReset();
  });

  afterEach(() => {
    i18n.addResourceBundle("en", "translation", englishTranslations, true, true);
  });

  it.each([
    [
      "due date",
      "Failed to update task due date",
      (hook: ReturnType<typeof useProjectTasksForTurboUi>) => hook.updateTaskDueDate("task-1", null),
    ],
    [
      "reminders",
      "Failed to update task reminders",
      (hook: ReturnType<typeof useProjectTasksForTurboUi>) => hook.updateTaskReminders("task-1", []),
    ],
    [
      "assignee",
      "Failed to update task assignee",
      (hook: ReturnType<typeof useProjectTasksForTurboUi>) => hook.updateTaskAssignee("task-1", []),
    ],
    [
      "description",
      "Failed to update task description.",
      (hook: ReturnType<typeof useProjectTasksForTurboUi>) => hook.updateTaskDescription("task-1", null),
    ],
    [
      "status",
      "Failed to update task status",
      (hook: ReturnType<typeof useProjectTasksForTurboUi>) => hook.updateTaskStatus("task-1", null),
    ],
    [
      "milestone",
      "Failed to update task milestone",
      (hook: ReturnType<typeof useProjectTasksForTurboUi>) => hook.updateTaskMilestone("task-1", null, 0),
    ],
    [
      "deletion",
      "Failed to delete task",
      (hook: ReturnType<typeof useProjectTasksForTurboUi>) => hook.deleteTask("task-1"),
    ],
  ] as const)(
    "looks up the %s failure at operation time and preserves the task",
    async (_operation, message, update) => {
      const { result } = setupHook();
      const originalTasks = result.current.tasks;
      i18n.addResourceBundle(
        "en",
        "translation",
        { Error: "Translated error", [message]: "Translated operation failure" },
        true,
        true,
      );
      updateTaskMutateAsync.mockRejectedValue(new Error("network"));
      const log = jest.spyOn(console, "error").mockImplementation(() => {});
      try {
        await act(async () => {
          await update(result.current);
        });
        expect(showErrorToast).toHaveBeenCalledWith("Translated error", "Translated operation failure");
        expect(result.current.tasks).toEqual(originalTasks);
      } finally {
        log.mockRestore();
      }
    },
  );

  it("passes rich-text task notes through the create task API input", () => {
    const input = buildProjectTaskCreateInput(
      {
        title: "Task with notes",
        milestone: null,
        dueDate: null,
        assignees: [],
        description: richTextWithMention,
      } as any,
      "project-1",
    );

    expect(input).toEqual(
      expect.objectContaining({
        description: JSON.stringify(richTextWithMention),
      }),
    );
  });

  it.each([
    ["Error", "Failed to create task"],
    ["Translated error", "Translated creation failure"],
  ])("shows catalog copy when task creation fails: %s / %s", async (title, message) => {
    i18n.addResourceBundle("en", "translation", { Error: title, "Failed to create task": message }, true, true);
    createTaskMutateAsync.mockRejectedValue(new Error("network"));
    const { result } = setupHook();
    const log = jest.spyOn(console, "error").mockImplementation(() => {});

    try {
      await act(async () => {
        expect(
          await result.current.createTask({
            title: "New task",
            milestone: null,
            dueDate: null,
            assignees: [],
          }),
        ).toEqual({ success: false });
      });
    } finally {
      log.mockRestore();
    }

    expect(showErrorToast).toHaveBeenCalledWith(title, message);
  });

  it.each([
    ["Error", "Failed to update task name."],
    ["Translated error", "Translated rename failure"],
  ])("shows catalog copy when renaming a task fails: %s / %s", async (title, message) => {
    i18n.addResourceBundle("en", "translation", { Error: title, "Failed to update task name.": message }, true, true);
    updateTaskNameMutateAsync.mockRejectedValue(new Error("network"));
    const { result } = setupHook();
    const log = jest.spyOn(console, "error").mockImplementation(() => {});

    try {
      await act(async () => {
        expect(await result.current.updateTaskName("task-1", "Renamed task")).toBe(false);
      });
    } finally {
      log.mockRestore();
    }

    expect(showErrorToast).toHaveBeenCalledWith(title, message);
  });

  it.each([
    ["Task name cannot be empty", "Failed to update task name."],
    ["Translated empty name", "Translated rename failure"],
  ])("shows catalog copy when the renamed task name is empty: %s / %s", async (title, message) => {
    i18n.addResourceBundle(
      "en",
      "translation",
      { "Task name cannot be empty": title, "Failed to update task name.": message },
      true,
      true,
    );
    const { result } = setupHook();

    await act(async () => {
      expect(await result.current.updateTaskName("task-1", "   ")).toBe(false);
    });

    expect(updateTaskNameMutateAsync).not.toHaveBeenCalled();
    expect(showErrorToast).toHaveBeenCalledWith(title, message);
  });
});

it("preserves saved milestone order until background tasks have been parsed", async () => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  const root = createRoot(document.createElement("div"));
  let currentMilestones: TaskBoard.Milestone[] = [];
  function Harness({ tasks, loaded }: { tasks: Task[]; loaded: boolean }) {
    const [milestones, setMilestones] = React.useState([
      { id: "milestone-1", tasksOrderingState: ["task-2", "task-1"] } as TaskBoard.Milestone,
    ]);
    currentMilestones = milestones;
    useProjectTasksForTurboUi({
      backendTasks: tasks,
      tasksLoaded: loaded,
      projectId: "project-1",
      milestones,
      setMilestones,
    });
    return null;
  }
  try {
    await act(async () => root.render(<Harness tasks={[]} loaded={false} />));
    expect(currentMilestones[0]?.tasksOrderingState).toEqual(["task-2", "task-1"]);
    const tasks = ["task-1", "task-2"].map((id) => ({ id, milestone: { id: "milestone-1" } }) as Task);
    await act(async () => root.render(<Harness tasks={tasks} loaded />));
    expect(currentMilestones[0]?.tasksOrderingState).toEqual(["task-2", "task-1"]);
    await act(async () => root.render(<Harness tasks={[]} loaded />));
    expect(currentMilestones[0]?.tasksOrderingState).toEqual([]);
  } finally {
    await act(async () => root.unmount());
  }
});
