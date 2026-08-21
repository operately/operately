import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router";

jest.mock("@atlaskit/pragmatic-drag-and-drop/element/adapter", () => ({
  dropTargetForElements: () => () => undefined,
}));

jest.mock("../../TaskBoard", () => ({
  TaskFilter: () => <div data-test-id="task-filter" />,
}));

jest.mock("../../TaskBoard/components/TaskFilter", () => ({
  FilterBadges: () => <div data-test-id="filter-badges" />,
}));

jest.mock("../../TaskBoard/components/TaskList", () => ({
  __esModule: true,
  default: ({ inlineCreateRow }: { inlineCreateRow?: React.ReactNode }) => (
    <div data-test-id="project-task-list">{inlineCreateRow}</div>
  ),
}));

jest.mock("../../TaskBoard/components/InlineTaskCreator", () => ({
  InlineTaskCreator: React.forwardRef(
    (
      {
        onCreate,
        onRequestAdvanced,
        testId,
      }: { onCreate: (name: string) => void; onRequestAdvanced?: () => void; testId: string },
      _ref,
    ) => (
      <div>
        <button type="button" data-test-id={testId} onClick={() => onCreate("New template task")}>
          Create task
        </button>
        {onRequestAdvanced && (
          <button type="button" data-test-id={`${testId}-advanced`} onClick={onRequestAdvanced}>
            Open advanced
          </button>
        )}
      </div>
    ),
  ),
}));

jest.mock("../../TaskBoard/KanbanView/TaskSlideIn", () => ({
  TaskSlideIn: ({ isOpen, taskPageProps }: { isOpen: boolean; taskPageProps: { variant?: string } | null }) =>
    isOpen ? <div data-test-id="task-slide-in">{taskPageProps?.variant}</div> : null,
}));

jest.mock("../../TaskBoard/hooks/useTaskKeyboardNavigation", () => ({
  useTaskKeyboardNavigation: () => ({
    containerRef: { current: null },
    selectedTaskId: null,
    clearSelection: jest.fn(),
    scopeBind: {},
  }),
}));

jest.mock("../../TemplateProjectPage/TaskRow", () => ({
  TaskRow: ({ task, onClick }: { task: { name: string }; onClick: () => void }) => (
    <button type="button" data-test-id={`template-task-${task.name}`} onClick={onClick}>
      {task.name}
    </button>
  ),
}));

jest.mock("../../utils/PragmaticDragAndDrop", () => ({
  projectItemsWithPlaceholder: ({ items }: { items: unknown[] }) => ({ items, placeholderIndex: null }),
  SubtleDropPlaceholder: () => null,
  useBoardDnD: () => ({
    draggedItemId: null,
    destination: null,
    draggedItemDimensions: null,
  }),
}));

import { TasksSection } from "./TasksSection";
import type { MilestonePage } from "../types";

const status = {
  id: "todo",
  value: "todo",
  label: "To do",
  color: "gray",
  icon: "circleDashed",
  index: 0,
  closed: false,
} as const;

function renderTasksSection(props: MilestonePage.State) {
  return render(
    <MemoryRouter>
      <TasksSection {...props} />
    </MemoryRouter>,
  );
}

function getByDataTestId(testId: string) {
  const element = document.querySelector<HTMLElement>(`[data-test-id="${testId}"]`);
  if (!element) throw new Error(`Could not find element with data-test-id="${testId}"`);
  return element;
}

function queryByDataTestId(testId: string) {
  return document.querySelector<HTMLElement>(`[data-test-id="${testId}"]`);
}

function templateTask(overrides: Partial<MilestonePage.TemplateState["tasks"][number]> = {}) {
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
    ...overrides,
  };
}

function templateState(overrides: Partial<MilestonePage.TemplateState> = {}): MilestonePage.TemplateState {
  const onTaskCreate = jest.fn();

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
    tasks: [templateTask()],
    statuses: [status],
    milestones: [],
    onTaskCreate,
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
    ...overrides,
  };
}

function projectState(overrides: Partial<MilestonePage.ProjectState> = {}): MilestonePage.ProjectState {
  return {
    variant: "project",
    milestone: {
      id: "milestone-1",
      name: "Launch",
      dueDate: null,
      status: "pending",
      kanbanLink: "/projects/project-1/board",
    },
    tasks: [],
    filters: [],
    onFiltersChange: jest.fn(),
    onTaskCreate: jest.fn(),
    onTaskReorder: jest.fn(),
    onTaskMilestoneChange: jest.fn(),
    onTaskAssigneeChange: jest.fn(),
    onTaskDueDateChange: jest.fn(),
    onTaskStatusChange: jest.fn(),
    assigneePersonSearch: { people: [], onSearch: async () => undefined },
    statusOptions: [status],
    setIsTaskModalOpen: () => undefined,
    isTaskModalOpen: false,
    isDeleteModalOpen: false,
    openDeleteModal: () => undefined,
    closeDeleteModal: () => undefined,
    ...overrides,
  } as MilestonePage.ProjectState;
}

describe("TasksSection", () => {
  it("uses the shared section shell while preserving template task behavior", () => {
    const props = templateState();

    renderTasksSection(props);

    expect(getByDataTestId("template-tasks-section")).toHaveClass("space-y-4", "pt-6");
    expect(screen.getByRole("heading", { name: "Tasks" })).toBeInTheDocument();
    expect(queryByDataTestId("task-filter")).not.toBeInTheDocument();
    expect(screen.queryByText("View on board")).not.toBeInTheDocument();

    fireEvent.click(getByDataTestId("template-task-Prepare launch"));
    expect(getByDataTestId("task-slide-in")).toHaveTextContent("template");
  });

  it("renders template tasks in the milestone ordering state", () => {
    renderTasksSection(
      templateState({
        tasks: [
          templateTask({ id: "task-1", name: "First" }),
          templateTask({ id: "task-2", name: "Second" }),
        ],
        milestones: [
          {
            id: "milestone-1",
            title: "Launch",
            description: null,
            dueOffsetDays: null,
            tasksOrderingState: ["task-2", "task-1"],
            tasksKanbanState: {},
            link: "/templates/template-1/milestones/milestone-1",
          },
        ],
      }),
    );

    const names = [...document.querySelectorAll("[data-test-id^='template-task-']")].map((node) => node.textContent);
    expect(names).toEqual(["Second", "First"]);
  });

  it("creates a template task through its native handler", () => {
    const onTaskCreate = jest.fn();
    renderTasksSection(templateState({ tasks: [], onTaskCreate }));

    fireEvent.click(getByDataTestId("template-tasks-section-add-task"));
    fireEvent.click(getByDataTestId("inline-template-task-creator-milestonepage"));

    expect(onTaskCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "New template task",
        milestoneId: "milestone-1",
        dueOffsetDays: null,
        status,
      }),
    );
  });

  it("opens the task creation modal from the inline creator", () => {
    const setIsTaskModalOpen = jest.fn();
    renderTasksSection(templateState({ tasks: [], setIsTaskModalOpen }));

    fireEvent.click(getByDataTestId("template-tasks-section-add-task"));
    fireEvent.click(getByDataTestId("inline-template-task-creator-milestonepage-advanced"));

    expect(setIsTaskModalOpen).toHaveBeenCalledWith(true);
  });

  it("keeps project-only controls in the project adapter", () => {
    renderTasksSection(projectState());

    expect(getByDataTestId("tasks-section")).toHaveClass("space-y-4", "pt-6");
    expect(getByDataTestId("task-filter")).toBeInTheDocument();
    expect(screen.getByText("View on board")).toBeInTheDocument();
  });
});
