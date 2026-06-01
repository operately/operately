import { buildProjectTaskCreateInput } from "./useProjectTasksForTurboUi";

jest.mock("@/api", () => ({
  __esModule: true,
  default: {
    tasks: {
      create: jest.fn(),
    },
  },
}));

jest.mock("@/routes/paths", () => ({
  compareIds: (a: string | null | undefined, b: string | null | undefined) => a === b,
  usePaths: () => ({
    taskPath: (id: string) => `/tasks/${id}`,
  }),
}));

jest.mock("@/routes/PageCache", () => ({
  PageCache: {
    invalidate: jest.fn(),
  },
}));

jest.mock("@/signals", () => ({}));

jest.mock("./index", () => ({
  parseTasksForTurboUi: () => [],
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
