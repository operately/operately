import { activePersonIds, taskInput } from "./operations";

jest.mock("@/models/tasks", () => ({
  serializeTaskStatus: (status: { id: string }) => ({ id: status.id }),
}));

jest.mock("turboui", () => ({ parseContent: jest.fn() }));

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

test("creates a task with an empty description document when none is provided", () => {
  expect(
    taskInput("template-1", {
      name: "Prepare agenda",
      description: null,
      milestoneId: "milestone-1",
      priority: null,
      size: null,
      dueOffsetDays: null,
      status: { id: "todo", value: "todo", label: "To do", color: "gray", icon: "circleDashed", index: 0 },
      reminders: [],
      assignees: [],
    }),
  ).toEqual({
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
