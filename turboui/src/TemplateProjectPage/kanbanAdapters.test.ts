import { toBoardTask } from "./kanbanAdapters";
import type { TemplateProjectPage } from ".";
import type { StatusSelector } from "../StatusSelector";

const status: StatusSelector.StatusOption = {
  id: "todo",
  value: "todo",
  label: "To do",
  color: "gray",
  icon: "circleDashed",
  index: 0,
};

const milestone: TemplateProjectPage.Milestone = {
  id: "milestone-1",
  title: "Release",
  description: null,
  dueOffsetDays: 14,
  tasksOrderingState: ["task-1"],
  tasksKanbanState: {},
  link: "/templates/template-1/milestones/milestone-1",
};

function makeTask(overrides: Partial<TemplateProjectPage.Task> = {}): TemplateProjectPage.Task {
  return {
    id: "task-1",
    name: "Publish announcement",
    description: null,
    milestoneId: "milestone-1",
    priority: null,
    size: null,
    dueOffsetDays: 12,
    status,
    reminders: [],
    ...overrides,
  };
}

describe("toBoardTask", () => {
  it("copies due offset days onto board tasks so kanban cards can edit them", () => {
    expect(toBoardTask(makeTask(), [milestone]).dueOffsetDays).toBe(12);
  });

  it("keeps an unset due offset as null instead of omitting it", () => {
    expect(toBoardTask(makeTask({ dueOffsetDays: null }), [milestone]).dueOffsetDays).toBeNull();
  });
});
