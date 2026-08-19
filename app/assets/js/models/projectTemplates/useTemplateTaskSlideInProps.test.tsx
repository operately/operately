import { defaultFormattedTimePreferences, type GetTemplateTaskPageProps } from "turboui";
import { buildTemplateTaskPageProps } from "./useTemplateTaskSlideInProps";

type SlideInContext = Parameters<GetTemplateTaskPageProps>[1];

const status = {
  id: "todo",
  value: "todo",
  label: "To do",
  color: "gray" as const,
  icon: "circleDashed" as const,
  index: 0,
};

function context(overrides: Partial<SlideInContext> = {}): SlideInContext {
  return {
    milestoneId: "milestone-1",
    tasks: [
      {
        id: "task-1",
        name: "Prepare agenda",
        description: { type: "doc", content: [] },
        milestoneId: "milestone-1",
        priority: null,
        size: null,
        dueOffsetDays: 3,
        status,
        reminders: [],
        assignees: [],
      },
    ],
    milestones: [
      {
        id: "milestone-1",
        title: "Kickoff",
        description: null,
        dueOffsetDays: 7,
        tasksOrderingState: [],
        tasksKanbanState: {},
        link: "/templates/template-1/milestones/milestone-1",
      },
    ],
    statuses: [status],
    onTaskUpdate: jest.fn(),
    onTaskDelete: jest.fn(),
    richTextHandlers: {} as never,
    ...overrides,
  };
}

const opts = { canEdit: false, formattedTimePreferences: defaultFormattedTimePreferences };

test("returns null when the task is missing", () => {
  expect(buildTemplateTaskPageProps("missing", context(), opts)).toBeNull();
});

test("builds template task page props from the slide-in context", async () => {
  const onTaskUpdate = jest.fn().mockResolvedValue(true);
  const props = buildTemplateTaskPageProps("task-1", context({ onTaskUpdate }), opts);

  expect(props).toEqual(
    expect.objectContaining({
      variant: "template",
      name: "Prepare agenda",
      dueOffsetDays: 3,
      canEdit: false,
      formattedTimePreferences: defaultFormattedTimePreferences,
      localDraftKeyBase: "template-task:task-1",
      milestone: expect.objectContaining({ id: "milestone-1", name: "Kickoff" }),
    }),
  );

  await expect(props?.onNameChange("Workshop agenda")).resolves.toBe(true);
  expect(onTaskUpdate).toHaveBeenCalledWith("task-1", { name: "Workshop agenda" });
});

test("returns false when a task name or description update fails", async () => {
  const onTaskUpdate = jest.fn().mockResolvedValue(false);
  const props = buildTemplateTaskPageProps("task-1", context({ onTaskUpdate }), opts);
  const description = { type: "doc", content: [] };

  await expect(props?.onNameChange("Workshop agenda")).resolves.toBe(false);
  await expect(props?.onDescriptionChange(description)).resolves.toBe(false);
});
