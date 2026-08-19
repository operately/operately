import Api from "@/api";
import { activePersonIds, createTaskMove, createTaskOperations } from "./operations";

jest.mock("@/models/tasks", () => ({
  serializeTaskStatus: (status: { id: string }) => ({ id: status.id }),
}));

jest.mock("turboui", () => ({
  parseContent: jest.fn(),
}));

jest.mock("@/api", () => ({
  __esModule: true,
  default: {
    project_templates: {
      updateTask: jest.fn(),
      createTask: jest.fn(),
    },
  },
}));

const updateTask = Api.project_templates.updateTask as jest.Mock;
const createTask = Api.project_templates.createTask as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

test("sends only available people when replacing task assignees", () => {
  expect(
    activePersonIds([
      {
        id: "template-person-1",
        person: { id: "person-1", fullName: "Ada", avatarUrl: null },
        role: "contributor",
        responsibility: null,
        accessLevel: 70,
        active: true,
      },
      {
        id: "template-person-2",
        person: { id: "person-2", fullName: "Bob", avatarUrl: null },
        role: "contributor",
        responsibility: null,
        accessLevel: 70,
        active: false,
      },
    ]),
  ).toEqual(["person-1"]);
});

test("moves a task with its destination milestone and index in one request", async () => {
  updateTask.mockResolvedValue({ task: { id: "task-1" } });
  const mutate = jest.fn(async (_message: string, operation: () => Promise<unknown>) => {
    await operation();
    return true;
  });
  const moveTask = createTaskMove({ templateId: "template-1", mutate });

  await expect(moveTask("task-1", "milestone-2", 3)).resolves.toBe(true);

  expect(updateTask).toHaveBeenCalledWith({
    templateId: "template-1",
    taskId: "task-1",
    milestoneId: "milestone-2",
    index: 3,
  });
});

test("returns false when a task move fails", async () => {
  const mutate = jest.fn().mockResolvedValue(false);
  const moveTask = createTaskMove({ templateId: "template-1", mutate });

  await expect(moveTask("task-1", null, 0)).resolves.toBe(false);
});

test("creates a task with an empty description document when none is provided", async () => {
  createTask.mockResolvedValue({ task: { id: "task-1" } });
  const mutate = jest.fn(async (_message: string, operation: () => Promise<unknown>) => {
    await operation();
    return true;
  });
  const { onTaskCreate } = createTaskOperations({ templateId: "template-1", mutate });
  const status = {
    id: "todo",
    value: "todo",
    label: "To do",
    color: "gray" as const,
    icon: "circleDashed" as const,
    index: 0,
  };

  onTaskCreate({
    name: "Prepare agenda",
    description: null,
    milestoneId: "milestone-1",
    priority: null,
    size: null,
    dueOffsetDays: null,
    status,
    reminders: [],
    assignees: [],
  });

  await mutate.mock.results[0]!.value;

  expect(createTask).toHaveBeenCalledWith({
    templateId: "template-1",
    milestoneId: "milestone-1",
    name: "Prepare agenda",
    description: "{}",
    priority: null,
    size: null,
    dueOffsetDays: null,
    reminders: [],
    taskStatus: { id: "todo" },
    assigneeIds: [],
  });
});
