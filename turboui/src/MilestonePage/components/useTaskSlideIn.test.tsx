import { act, renderHook } from "@testing-library/react";
import { useTaskSlideIn } from "./useTaskSlideIn";
import type { MilestonePage } from "../types";

const search = {
  params: new URLSearchParams("taskId=template-task-1"),
};

jest.mock("react-router", () => {
  const actual = jest.requireActual("react-router");
  const setSearchParams = jest.fn((updater: (current: URLSearchParams) => URLSearchParams) => {
    updater(new URLSearchParams(search.params));
  });

  return {
    ...actual,
    useSearchParams: () => [search.params, setSearchParams],
  };
});

const status = {
  id: "todo",
  value: "todo",
  label: "To do",
  color: "gray",
  icon: "circleDashed",
  index: 0,
  closed: false,
} as const;

function templateTask() {
  return {
    id: "template-task-1",
    name: "Prepare launch",
    description: null,
    milestoneId: "milestone-1",
    priority: null,
    size: null,
    dueOffsetDays: 3,
    status,
    reminders: [],
    assignees: [],
  };
}

function templateState(tasks = [templateTask()]): MilestonePage.TemplateState {
  return {
    variant: "project-template",
    template: { id: "template-1", name: "Launch template", archived: false },
    space: { id: "space-1", name: "Product", link: "/spaces/product" },
    projectTemplatesLink: "/spaces/product/project-templates",
    templateLink: "/spaces/product/project-templates/template-1",
    updateTemplateName: async () => true,
    permissions: { canEdit: true },
    tasksCount: 1,
    discussionsCount: 0,
    docsAndFilesCount: 0,
    milestoneId: "milestone-1",
    title: "Launch",
    onMilestoneTitleChange: async () => true,
    description: null,
    onDescriptionChange: async () => true,
    dueOffsetDays: null,
    onDueOffsetDaysChange: () => undefined,
    tasks,
    statuses: [status],
    milestones: [],
    onTaskCreate: jest.fn(),
    onTaskUpdate: jest.fn(),
    onTaskDelete: jest.fn(),
    onTaskReorder: jest.fn(),
    personSearch: { people: [], onSearch: async () => undefined },
    richTextHandlers: {} as never,
    formattedTimePreferences: {} as never,
    isTaskModalOpen: false,
    setIsTaskModalOpen: () => undefined,
    isDeleteModalOpen: false,
    openDeleteModal: () => undefined,
    closeDeleteModal: () => undefined,
    getTemplateTaskPageProps: jest.fn(() => ({ variant: "template" }) as never),
  };
}

test("does not reopen the slide-in when tasks are remapped before the URL catches up", () => {
  const { result, rerender } = renderHook(({ tasks }) => useTaskSlideIn(templateState(tasks)), {
    initialProps: { tasks: [templateTask()] },
  });

  expect(result.current.selectedTaskId).toBe("template-task-1");

  act(() => {
    result.current.setSelectedTaskId(null);
  });
  expect(result.current.selectedTaskId).toBeNull();

  rerender({ tasks: [templateTask()] });
  expect(result.current.selectedTaskId).toBeNull();
});

test("closes the slide-in when the selected task is removed from the list", () => {
  const { result, rerender } = renderHook(({ tasks }) => useTaskSlideIn(templateState(tasks)), {
    initialProps: { tasks: [templateTask()] },
  });

  expect(result.current.selectedTaskId).toBe("template-task-1");

  rerender({ tasks: [] });
  expect(result.current.selectedTaskId).toBeNull();
});
