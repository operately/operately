/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import type { Task } from "@/api";
import type { TaskBoard } from "turboui";
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

describe("useProjectTasksForTurboUi", () => {
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
});

jest.mock("./taskLifecycle", () => {
  const mutation = () => ({ mutateAsync: jest.fn() });
  return {
    useCreateTask: mutation,
    useDeleteTask: mutation,
    useUpdateTaskAssignee: mutation,
    useUpdateTaskDescription: mutation,
    useUpdateTaskDueDate: mutation,
    useUpdateTaskMilestoneAndOrdering: mutation,
    useUpdateTaskName: mutation,
    useUpdateTaskReminders: mutation,
    useUpdateTaskStatus: mutation,
  };
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
