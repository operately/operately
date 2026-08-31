import { parseTaskForTurboUi } from "./index";

describe("parseTaskForTurboUi", () => {
  it("uses the server description indicator when a minimal task omits its description", () => {
    const task = parseTaskForTurboUi(
      {
        taskPath: (taskId: string) => `/tasks/${taskId}`,
      } as any,
      {
        id: "task-1",
        name: "Write release notes",
        description: null,
        hasDescription: true,
        assignees: [],
        milestone: null,
        dueDate: null,
        reminders: [],
        closedAt: null,
        status: null,
        commentsCount: 0,
      } as any,
      { type: "project" },
    );

    expect(task.description).toBeNull();
    expect(task.hasDescription).toBe(true);
  });
});
