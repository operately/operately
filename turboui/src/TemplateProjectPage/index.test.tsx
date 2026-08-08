import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router";

jest.mock("@atlaskit/pragmatic-drag-and-drop-react-drop-indicator/box", () => ({
  DropIndicator: () => null,
}));

jest.mock("@atlaskit/pragmatic-drag-and-drop/element/adapter", () => ({
  dropTargetForElements: () => () => undefined,
}));

jest.mock("../utils/PragmaticDragAndDrop", () => ({
  projectItemsWithPlaceholder: ({ items }: { items: unknown[] }) => ({ items, placeholderIndex: null }),
  SubtleDropPlaceholder: () => null,
  DropIndicator: () => null,
  DragHandle: () => null,
  useBoardDnD: () => ({ draggedItemId: null, destination: null, draggedItemDimensions: null }),
  useSortableItem: () => ({
    ref: () => undefined,
    dragHandleRef: () => undefined,
    isDragging: false,
    closestEdge: null,
  }),
  useSortableList: () => undefined,
}));

import { createMockRichEditorHandlers } from "../utils/storybook/richEditor";
import { asRichText } from "../utils/storybook/richContent";
import { TemplateProjectPage } from ".";
import type { TemplateProjectPage as Types } from ".";

const statuses: Types.Props["statuses"] = [
  { id: "todo", value: "todo", label: "To do", color: "gray", icon: "circleDashed", index: 0 },
  { id: "done", value: "done", label: "Done", color: "green", icon: "circleCheck", index: 1, closed: true },
];

function createProps(overrides: Partial<Types.Props> = {}): Types.Props {
  return {
    template: {
      id: "template-1",
      name: "Product launch",
      description: asRichText("A reusable launch plan"),
      durationDays: 30,
      milestonesOrderingState: ["milestone-1"],
      tasksKanbanState: {},
    },
    space: { id: "space-1", name: "Product", link: "/spaces/space-1" },
    projectTemplatesLink: "/spaces/space-1/project-templates",
    permissions: { canView: true, canEdit: true },
    statuses,
    milestones: [
      {
        id: "milestone-1",
        title: "Release",
        description: null,
        dueOffsetDays: 14,
        tasksOrderingState: ["task-1"],
        tasksKanbanState: {},
      },
    ],
    tasks: [
      {
        id: "task-1",
        name: "Publish announcement",
        description: null,
        milestoneId: "milestone-1",
        priority: null,
        size: null,
        dueOffsetDays: 12,
        status: statuses[0]!,
        reminders: [{ type: "before_due", days: 2 }],
      },
    ],
    richTextHandlers: createMockRichEditorHandlers(),
    onTemplateUpdate: jest.fn(),
    onMilestoneCreate: jest.fn(),
    onMilestoneUpdate: jest.fn(),
    onMilestoneDelete: jest.fn(),
    onTaskCreate: jest.fn(),
    onTaskUpdate: jest.fn(),
    onTaskDelete: jest.fn(),
    ...overrides,
  };
}

function renderPage(props: Types.Props, initialEntry = "/templates/template-1") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <TemplateProjectPage {...props} />
    </MemoryRouter>,
  );
}

describe("TemplateProjectPage", () => {
  it("renders template navigation, scheduling, and only template tabs", () => {
    renderPage(createProps());

    expect(screen.getByText("Project Templates")).toBeInTheDocument();
    expect(screen.getByText("Template")).toBeInTheDocument();
    expect(screen.getByText("30 days after project starts")).toBeInTheDocument();
    expect(screen.getByText("14 days after project starts")).toBeInTheDocument();
    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.getByText("Tasks")).toBeInTheDocument();

    for (const runtimeLabel of ["Check-ins", "Discussions", "Docs & Files", "Activity", "Retrospective"]) {
      expect(screen.queryByText(runtimeLabel)).not.toBeInTheDocument();
    }
    expect(screen.queryByText("Start date")).not.toBeInTheDocument();
    expect(screen.queryByText(/tasks completed/i)).not.toBeInTheDocument();
  });

  it.each([
    ["View", { canView: true }],
    ["Comment", { canView: true, canComment: true }],
  ])("keeps %s access read-only", (_label, permissions) => {
    renderPage(createProps({ permissions }));

    fireEvent.click(screen.getByText("30 days after project starts"));
    expect(screen.queryByRole("textbox", { name: "Set project duration" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Tasks"));
    expect(screen.queryByText("New milestone")).not.toBeInTheDocument();
  });

  it.each([
    ["Edit", { canView: true, canEdit: true }],
    ["Full Access", { canView: true, hasFullAccess: true }],
  ])("enables template actions for %s", (_label, permissions) => {
    renderPage(createProps({ permissions }));

    fireEvent.click(screen.getByText("Tasks"));
    expect(screen.getByText("New milestone")).toBeInTheDocument();
    expect(screen.getByText("New task")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Overview"));
    fireEvent.click(screen.getByText("30 days after project starts"));
    expect(screen.getByRole("textbox", { name: "Set project duration" })).toBeInTheDocument();
  });

  it("opens the template task creation modal", () => {
    renderPage(createProps(), "/templates/template-1?tab=tasks");

    fireEvent.click(screen.getByText("New task"));

    expect(screen.getByRole("heading", { name: "Create Task" })).toBeInTheDocument();
    expect(screen.getByText("Relative due date")).toBeInTheDocument();
    expect(screen.getByText("Create more")).toBeInTheDocument();
  });

  it("edits a task in the task form modal", () => {
    const onTaskUpdate = jest.fn();
    renderPage(createProps({ onTaskUpdate }), "/templates/template-1?tab=tasks");

    fireEvent.click(screen.getByText("Publish announcement"));

    expect(screen.getByRole("heading", { name: "Update Task" })).toBeInTheDocument();
    expect(screen.getByDisplayValue("Publish announcement")).toBeInTheDocument();
    expect(screen.queryByText("Create more")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Update task" }));

    expect(onTaskUpdate).toHaveBeenCalledWith(
      "task-1",
      expect.objectContaining({ name: "Publish announcement", dueOffsetDays: 12 }),
    );
  });

  it("opens the template milestone creation modal", () => {
    renderPage(createProps(), "/templates/template-1?tab=tasks");

    fireEvent.click(screen.getByText("New milestone"));

    expect(screen.getByRole("heading", { name: "Create Milestone" })).toBeInTheDocument();
    expect(screen.getByText("Relative due date")).toBeInTheDocument();
    expect(screen.getByText("Create more")).toBeInTheDocument();
  });

  it("opens the milestone creation modal from the overview", () => {
    renderPage(createProps());

    fireEvent.click(screen.getByText("Add milestone"));

    expect(screen.getByRole("heading", { name: "Create Milestone" })).toBeInTheDocument();
  });

  it("shows status management in the task header", () => {
    renderPage(createProps({ onStatusesChange: jest.fn() }), "/templates/template-1?tab=tasks");

    expect(screen.getByRole("button", { name: "Settings" })).toBeInTheDocument();
  });

  it("confirms milestone deletion before calling the delete handler", async () => {
    const onMilestoneDelete = jest.fn();
    renderPage(createProps({ onMilestoneDelete }));

    fireEvent.click(screen.getByRole("button", { name: "Delete Release" }));

    expect(screen.getByRole("heading", { name: "Delete Release" })).toBeInTheDocument();
    expect(onMilestoneDelete).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Delete Forever" }));

    await waitFor(() => {
      expect(onMilestoneDelete).toHaveBeenCalledWith("milestone-1");
      expect(screen.queryByRole("heading", { name: "Delete Release" })).not.toBeInTheDocument();
    });
  });

  it("preserves task IDs and relative offsets in update callbacks", () => {
    const onTaskUpdate = jest.fn();
    renderPage(createProps({ onTaskUpdate }), "/templates/template-1?tab=tasks");

    fireEvent.click(screen.getByText("12 days after project starts"));
    const input = screen.getByRole("textbox", { name: "Set relative date" });
    fireEvent.change(input, { target: { value: "18" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onTaskUpdate).toHaveBeenCalledWith("task-1", { dueOffsetDays: 18 });
  });

  it("shows template-specific task fields without assignees", () => {
    renderPage(createProps(), "/templates/template-1?tab=tasks");

    fireEvent.click(screen.getByText("Publish announcement"));

    expect(screen.getByText("Relative due date")).toBeInTheDocument();
    expect(screen.getByText("Milestone")).toBeInTheDocument();
    expect(screen.queryByText("Assignees")).not.toBeInTheDocument();
  });

  it("shows copied people and task assignees read-only", () => {
    const champion: Types.TemplatePerson = {
      id: "template-person-1",
      person: { id: "person-1", fullName: "Ada Lovelace", avatarUrl: null },
      role: "champion",
      responsibility: "Leads delivery",
      accessLevel: 100,
      active: true,
    };
    const unavailable: Types.TemplatePerson = {
      id: "template-person-2",
      person: null,
      role: "contributor",
      responsibility: null,
      accessLevel: 70,
      active: false,
    };
    const props = createProps({
      people: [champion, unavailable],
      tasks: [{ ...createProps().tasks[0]!, assignees: [champion, unavailable] }],
    });

    renderPage(props);
    const peopleSection = document.querySelector('[data-test-id="template-people"]');
    expect(peopleSection).toHaveTextContent("Ada Lovelace");
    expect(peopleSection).toHaveTextContent("Champion");
    expect(peopleSection).toHaveTextContent("Full Access");
    expect(peopleSection).toHaveTextContent("Unavailable person");

    fireEvent.click(screen.getByText("Tasks"));
    expect(screen.getAllByTitle("Ada Lovelace").length).toBeGreaterThan(0);
  });

  it("keeps unavailable assignees visible while submitting active assignees only", () => {
    const onTaskUpdate = jest.fn();
    const activeAssignee: Types.TemplatePerson = {
      id: "template-person-1",
      person: { id: "person-1", fullName: "Ada Lovelace", avatarUrl: null },
      role: "contributor",
      responsibility: null,
      accessLevel: 70,
      active: true,
    };
    const unavailableAssignee: Types.TemplatePerson = {
      id: "template-person-2",
      person: { id: "person-2", fullName: "Bob Williams", avatarUrl: null },
      role: "contributor",
      responsibility: null,
      accessLevel: 70,
      active: false,
    };
    const replacement = { id: "person-3", fullName: "Emily Davis", avatarUrl: null };

    renderPage(
      createProps({
        tasks: [{ ...createProps().tasks[0]!, assignees: [activeAssignee, unavailableAssignee] }],
        personSearch: { people: [replacement], onSearch: async () => undefined },
        onTaskUpdate,
      }),
      "/templates/template-1?tab=tasks",
    );

    expect(screen.getByTitle("Bob Williams")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove unavailable assignees" })).toBeInTheDocument();

    fireEvent.click(document.querySelector('[data-test-id="template-task-task-1-assignees"]')!);
    fireEvent.click(screen.getByText("Emily Davis"));
    expect(onTaskUpdate).toHaveBeenCalledWith("task-1", {
      assignees: [
        activeAssignee,
        {
          id: replacement.id,
          person: replacement,
          role: "contributor",
          responsibility: null,
          accessLevel: 70,
          active: true,
        },
      ],
    });

    fireEvent.click(screen.getByRole("button", { name: "Remove unavailable assignees" }));
    expect(onTaskUpdate).toHaveBeenLastCalledWith("task-1", {
      assignees: [activeAssignee, expect.objectContaining({ person: replacement, active: true })],
    });

    fireEvent.click(screen.getByText("Publish announcement"));
    expect(screen.queryByText("Assignees")).not.toBeInTheDocument();
  });

  it("keeps an optimistic assignee visible while stale props rerender", async () => {
    let finishUpdate: (successful: boolean) => void = () => undefined;
    const updateResult = new Promise<boolean>((resolve) => {
      finishUpdate = resolve;
    });
    const replacement = { id: "person-3", fullName: "Emily Davis", avatarUrl: null };
    const staleProps = createProps({
      personSearch: { people: [replacement], onSearch: async () => undefined },
      onTaskUpdate: jest.fn(() => updateResult),
    });
    const view = renderPage(staleProps, "/templates/template-1?tab=tasks");

    fireEvent.click(document.querySelector('[data-test-id="template-task-task-1-assignees"]')!);
    fireEvent.click(screen.getByText("Emily Davis"));
    expect(screen.getByTitle("Emily Davis")).toBeInTheDocument();

    view.rerender(
      <MemoryRouter initialEntries={["/templates/template-1?tab=tasks"]}>
        <TemplateProjectPage
          {...createProps({
            ...staleProps,
            tasks: staleProps.tasks.map((task) => ({ ...task, assignees: [] })),
          })}
        />
      </MemoryRouter>,
    );
    expect(screen.getByTitle("Emily Davis")).toBeInTheDocument();

    await act(async () => finishUpdate(true));
    expect(screen.getByTitle("Emily Davis")).toBeInTheDocument();
  });

  it("rolls an optimistic assignee back when the update fails", async () => {
    let finishUpdate: (successful: boolean) => void = () => undefined;
    const updateResult = new Promise<boolean>((resolve) => {
      finishUpdate = resolve;
    });
    const replacement = { id: "person-3", fullName: "Emily Davis", avatarUrl: null };

    renderPage(
      createProps({
        personSearch: { people: [replacement], onSearch: async () => undefined },
        onTaskUpdate: jest.fn(() => updateResult),
      }),
      "/templates/template-1?tab=tasks",
    );

    fireEvent.click(document.querySelector('[data-test-id="template-task-task-1-assignees"]')!);
    fireEvent.click(screen.getByText("Emily Davis"));
    expect(screen.getByTitle("Emily Davis")).toBeInTheDocument();

    await act(async () => finishUpdate(false));
    expect(screen.queryByTitle("Emily Davis")).not.toBeInTheDocument();
  });
});
