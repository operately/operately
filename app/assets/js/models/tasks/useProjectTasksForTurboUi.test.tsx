/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import type { Task } from "@/api";
import { showErrorToast, type TaskBoard } from "turboui";
import "@/i18n";
import { renderHook } from "@/__tests__/renderHook";
import { useProjectTasksForTurboUi, buildProjectTaskCreateInput } from "./useProjectTasksForTurboUi";

jest.mock("turboui", () => ({ showErrorToast: jest.fn() }));

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
}));

jest.mock("../milestones", () => ({
  parseMilestoneForTurboUi: (_paths: unknown, milestone: any) => milestone,
  parseMilestonesForTurboUi: () => ({ orderedMilestones: [] }),
}));

jest.mock("./taskLifecycle", () => {
  const createTaskMutateAsync = jest.fn();
  const updateTaskNameMutateAsync = jest.fn();
  const unused = () => ({ mutateAsync: jest.fn() });

  return {
    createTaskMutateAsync,
    updateTaskNameMutateAsync,
    useCreateTask: () => ({ mutateAsync: createTaskMutateAsync }),
    useDeleteTask: unused,
    useUpdateTaskAssignee: unused,
    useUpdateTaskDescription: unused,
    useUpdateTaskDueDate: unused,
    useUpdateTaskMilestoneAndOrdering: unused,
    useUpdateTaskName: () => ({ mutateAsync: updateTaskNameMutateAsync }),
    useUpdateTaskReminders: unused,
    useUpdateTaskStatus: unused,
  };
});

const { createTaskMutateAsync, updateTaskNameMutateAsync } = jest.requireMock("./taskLifecycle");

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
  });

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

  it("shows a translated toast when task creation fails", async () => {
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
          } as any),
        ).toEqual({ success: false });
      });
    } finally {
      log.mockRestore();
    }

    expect(showErrorToast).toHaveBeenCalledWith("Error", "Failed to create task");
  });

  it("shows a translated toast when renaming a task fails", async () => {
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

    expect(showErrorToast).toHaveBeenCalledWith("Error", "Failed to update task name.");
  });

  it("shows a translated toast when the renamed task name is empty", async () => {
    const { result } = setupHook();

    await act(async () => {
      expect(await result.current.updateTaskName("task-1", "   ")).toBe(false);
    });

    expect(updateTaskNameMutateAsync).not.toHaveBeenCalled();
    expect(showErrorToast).toHaveBeenCalledWith("Task name cannot be empty", "Failed to update task name.");
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
