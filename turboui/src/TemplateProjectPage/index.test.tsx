import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";

type MockBoardMove = {
  itemId: string;
  source: { containerId: string; index: number };
  destination: { containerId: string; index: number };
};

let mockBoardMoveHandler: ((move: MockBoardMove) => unknown) | null = null;
let mockBoardState: {
  draggedItemId: string | null;
  destination: { containerId: string; index: number } | null;
  draggedItemDimensions: { width: number; height: number } | null;
} = { draggedItemId: null, destination: null, draggedItemDimensions: null };
const mockUseSortableItem = jest.fn((_options?: unknown) => ({
  ref: { current: null },
  dragHandleRef: { current: null },
  isDragging: false,
  closestEdge: null,
}));

jest.mock("@atlaskit/pragmatic-drag-and-drop-react-drop-indicator/box", () => ({
  DropIndicator: () => null,
}));

jest.mock("@atlaskit/pragmatic-drag-and-drop/element/adapter", () => ({
  dropTargetForElements: () => () => undefined,
}));

jest.mock("../utils/PragmaticDragAndDrop", () => ({
  projectItemsWithPlaceholder: ({
    items,
    getId,
    draggedItemId,
    targetLocation,
    containerId,
  }: {
    items: unknown[];
    getId: (item: unknown) => string;
    draggedItemId: string | null;
    targetLocation: { containerId: string; index: number } | null;
    containerId: string;
  }) => {
    const projectedItems = draggedItemId ? items.filter((item) => getId(item) !== draggedItemId) : items;
    return {
      items: projectedItems,
      placeholderIndex: targetLocation?.containerId === containerId ? targetLocation.index : null,
    };
  },
  SubtleDropPlaceholder: ({ containerId, index }: { containerId: string; index: number }) => (
    <div data-testid={`drop-placeholder-${containerId}-${index}`} />
  ),
  DropIndicator: () => null,
  DragHandle: () => null,
  useBoardDnD: (handler: (move: MockBoardMove) => unknown) => {
    mockBoardMoveHandler = handler;
    return mockBoardState;
  },
  useSortableItem: (options: unknown) => mockUseSortableItem(options),
  useSortableList: () => undefined,
}));

import { createMockRichEditorHandlers } from "../utils/storybook/richEditor";
import { asRichText } from "../utils/storybook/richContent";
import { TemplateProjectPage } from ".";
import type { TemplateProjectPage as Types } from ".";
import { defaultFormattedTimePreferences } from "../FormattedTime";

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
    discussions: [],
    onFolderCreate: jest.fn().mockResolvedValue(true),
    onFilesUpload: jest.fn().mockResolvedValue(true),
    formatFileSize: (size) => `${size} bytes`,
    newDiscussionLink: "/templates/template-1/discussions/new",
    personSearch: { people: [], onSearch: async () => undefined },
    richTextHandlers: createMockRichEditorHandlers(),
    formattedTimePreferences: defaultFormattedTimePreferences,
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

beforeEach(() => {
  mockBoardMoveHandler = null;
  mockBoardState = { draggedItemId: null, destination: null, draggedItemDimensions: null };
  mockUseSortableItem.mockClear();
});

describe("TemplateProjectPage", () => {
  it("renders template navigation, scheduling, and only template tabs", () => {
    renderPage(createProps());

    expect(screen.getByText("Project Templates")).toBeInTheDocument();
    expect(screen.getByText("Template")).toBeInTheDocument();
    expect(screen.getByText("30 days after project starts")).toBeInTheDocument();
    expect(screen.getByText("14 days after project starts")).toBeInTheDocument();
    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.getByText("Tasks")).toBeInTheDocument();

    expect(screen.getByText("Discussions")).toBeInTheDocument();

    for (const runtimeLabel of ["Check-ins", "Activity", "Retrospective"]) {
      expect(screen.queryByText(runtimeLabel)).not.toBeInTheDocument();
    }
    expect(screen.queryByText("Start date")).not.toBeInTheDocument();
    expect(screen.queryByText(/tasks completed/i)).not.toBeInTheDocument();
  });

  it("shows template discussions without runtime discussion controls", () => {
    renderPage(
      createProps({
        discussions: [
          {
            id: "discussion-1",
            title: "Reusable context",
            author: null,
            date: new Date("2028-01-01T00:00:00Z"),
            link: "/templates/template-1/discussions/discussion-1",
            content: asRichText("Keep this guidance with every generated project."),
          },
        ],
      }),
    );

    fireEvent.click(screen.getByText("Discussions"));

    expect(screen.getByText("Reusable context")).toBeInTheDocument();
    expect(screen.getByText("Start discussion")).toBeInTheDocument();
    expect(screen.queryByText("Subscribe")).not.toBeInTheDocument();
  });

  it("creates a folder from the standard template resource menu", async () => {
    const user = userEvent.setup();
    const onFolderCreate = jest.fn().mockResolvedValue(true);

    renderPage(
      createProps({
        onFolderCreate,
        resourceNodes: [
          {
            id: "folder-node-1",
            parentFolderId: null,
            type: "folder",
            position: 0,
            name: "Launch assets",
            link: "/templates/template-1/docs-and-files/folder-node-1",
            insertedAt: "2026-08-11T12:00:00Z",
            updatedAt: "2026-08-11T12:00:00Z",
          },
        ],
      }),
      "/templates/template-1?tab=docs-and-files",
    );

    expect(screen.getByText("Launch assets")).toBeInTheDocument();
    await user.click(document.querySelector('[data-test-id="add-options"]')!);

    await waitFor(() => {
      expect(screen.getByText("New document")).toBeInTheDocument();
      expect(screen.getByText("New folder")).toBeInTheDocument();
      expect(screen.getByText("Upload files")).toBeInTheDocument();
      expect(screen.getByText("Add link")).toBeInTheDocument();
    });

    await user.click(screen.getByText("New folder"));

    expect(screen.getByRole("heading", { name: "New folder" })).toBeInTheDocument();
    await user.type(screen.getByLabelText("Name"), "Campaign assets");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(onFolderCreate).toHaveBeenCalledWith(null, "Campaign assets"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText("Versions")).not.toBeInTheDocument();
  });

  it("uploads files through the standard template resource flow", async () => {
    const user = userEvent.setup();
    const onFilesUpload = jest.fn().mockResolvedValue(true);
    const originalCreateElement = document.createElement.bind(document);
    const createElement = jest.spyOn(document, "createElement").mockImplementation((tagName, options) => {
      const element = originalCreateElement(tagName, options);

      if (tagName === "input") {
        jest.spyOn(element, "click").mockImplementation(() => {
          Object.defineProperty(element, "files", {
            configurable: true,
            value: [new File(["launch plan"], "Launch-plan.pdf", { type: "application/pdf" })],
          });
          element.onchange?.({ target: element } as unknown as Event);
        });
      }

      return element;
    });

    renderPage(createProps({ onFilesUpload }), "/templates/template-1?tab=docs-and-files");

    await user.click(document.querySelector('[data-test-id="add-options"]')!);
    await user.click(await screen.findByText("Upload files"));
    expect(await screen.findByDisplayValue("Launch-plan")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(onFilesUpload).toHaveBeenCalledWith(expect.any(Array), expect.any(Function)));
    expect(screen.queryByDisplayValue("Launch-plan")).not.toBeInTheDocument();
    createElement.mockRestore();
  });

  it("keeps template Docs & Files read-only for View Access", () => {
    renderPage(
      createProps({ permissions: { canView: true }, resourceNodes: [] }),
      "/templates/template-1?tab=docs-and-files",
    );

    expect(screen.queryByText("Add")).not.toBeInTheDocument();
  });

  it("shows template Docs & Files with template-specific resource links", () => {
    renderPage(
      createProps({
        resourceNodes: [
          {
            id: "node-1",
            parentFolderId: null,
            type: "document",
            position: 0,
            name: "Launch guide",
            link: "/templates/template-1/docs-and-files/node-1",
            insertedAt: "2026-08-11T12:00:00Z",
            updatedAt: "2026-08-11T12:00:00Z",
          },
        ],
      }),
    );

    fireEvent.click(screen.getByText("Docs & Files"));

    expect(screen.getByText("Launch guide")).toBeInTheDocument();
    expect(screen.getByText("Launch guide").closest("a")).toHaveAttribute(
      "href",
      "/templates/template-1/docs-and-files/node-1",
    );
  });

  it("shows image previews for template files", () => {
    renderPage(
      createProps({
        resourceNodes: [
          {
            id: "image-node-1",
            parentFolderId: null,
            type: "file",
            position: 0,
            name: "Launch.png",
            link: "/templates/template-1/docs-and-files/image-node-1",
            insertedAt: "2026-08-11T12:00:00Z",
            updatedAt: "2026-08-11T12:00:00Z",
            fileKind: "image",
            thumbnail: {
              url: "/blobs/preview-1",
              alt: "Launch.png",
              width: 100,
              height: 67,
            },
          },
        ],
      }),
      "/templates/template-1?tab=docs-and-files",
    );

    expect(screen.getByRole("img", { name: "Launch.png" })).toHaveAttribute("src", "/blobs/preview-1");
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

  it("reorders tasks optimistically and keeps the confirmed order", async () => {
    let confirmMove: (successful: boolean) => void = () => undefined;
    const onTaskReorder = jest.fn(() => new Promise<boolean>((resolve) => (confirmMove = resolve)));
    const first = createProps().tasks[0]!;
    const second = { ...first, id: "task-2", name: "Prepare screenshots" };
    renderPage(createProps({ tasks: [first, second], onTaskReorder }), "/templates/template-1?tab=tasks");

    let move: unknown;
    act(() => {
      move = mockBoardMoveHandler?.({
        itemId: first.id,
        source: { containerId: "milestone-1", index: 0 },
        destination: { containerId: "milestone-1", index: 2 },
      });
    });

    expect(taskIdsIn("milestone-1")).toEqual(["task-2", "task-1"]);
    expect(onTaskReorder).toHaveBeenCalledWith("task-1", "milestone-1", 2);

    await act(async () => {
      confirmMove(true);
      await move;
    });

    expect(taskIdsIn("milestone-1")).toEqual(["task-2", "task-1"]);
  });

  it("keeps the optimistic order while a stale refresh render is replaced by the confirmed order", async () => {
    let confirmMove: (successful: boolean) => void = () => undefined;
    const onTaskReorder = jest.fn(() => new Promise<boolean>((resolve) => (confirmMove = resolve)));
    const first = createProps().tasks[0]!;
    const second = { ...first, id: "task-2", name: "Prepare screenshots" };
    const tasks = [first, second];
    const view = renderPage(createProps({ tasks, onTaskReorder }), "/templates/template-1?tab=tasks");

    let move: unknown;
    act(() => {
      move = mockBoardMoveHandler?.({
        itemId: first.id,
        source: { containerId: "milestone-1", index: 0 },
        destination: { containerId: "milestone-1", index: 2 },
      });
    });

    expect(taskIdsIn("milestone-1")).toEqual(["task-2", "task-1"]);

    view.rerender(
      <MemoryRouter initialEntries={["/templates/template-1?tab=tasks"]}>
        <TemplateProjectPage {...createProps({ tasks: [...tasks], onTaskReorder })} />
      </MemoryRouter>,
    );

    await act(async () => {
      confirmMove(true);
      await move;
    });

    expect(taskIdsIn("milestone-1")).toEqual(["task-2", "task-1"]);

    const confirmedMilestone = {
      ...createProps().milestones[0]!,
      tasksOrderingState: ["task-2", "task-1"],
    };
    view.rerender(
      <MemoryRouter initialEntries={["/templates/template-1?tab=tasks"]}>
        <TemplateProjectPage {...createProps({ tasks: [...tasks], milestones: [confirmedMilestone], onTaskReorder })} />
      </MemoryRouter>,
    );

    expect(taskIdsIn("milestone-1")).toEqual(["task-2", "task-1"]);
  });

  it("moves a task into another milestone optimistically", async () => {
    const onTaskReorder = jest.fn().mockResolvedValue(true);
    const first = createProps().tasks[0]!;
    const secondMilestone: Types.Milestone = {
      ...createProps().milestones[0]!,
      id: "milestone-2",
      title: "Launch",
      tasksOrderingState: ["task-2"],
    };
    const second = { ...first, id: "task-2", name: "Publish release", milestoneId: "milestone-2" };
    renderPage(
      createProps({
        milestones: [...createProps().milestones, secondMilestone],
        tasks: [first, second],
        onTaskReorder,
      }),
      "/templates/template-1?tab=tasks",
    );

    await act(async () => {
      await mockBoardMoveHandler?.({
        itemId: first.id,
        source: { containerId: "milestone-1", index: 0 },
        destination: { containerId: "milestone-2", index: 1 },
      });
    });

    expect(taskIdsIn("milestone-1")).toEqual([]);
    expect(taskIdsIn("milestone-2")).toEqual(["task-2", "task-1"]);
    expect(onTaskReorder).toHaveBeenCalledWith("task-1", "milestone-2", 1);
  });

  it("allows dropping a task into an empty milestone", async () => {
    const onTaskReorder = jest.fn().mockResolvedValue(true);
    const emptyMilestone: Types.Milestone = {
      ...createProps().milestones[0]!,
      id: "milestone-2",
      title: "Empty milestone",
      tasksOrderingState: [],
    };
    renderPage(
      createProps({ milestones: [...createProps().milestones, emptyMilestone], onTaskReorder }),
      "/templates/template-1?tab=tasks",
    );

    await act(async () => {
      await mockBoardMoveHandler?.({
        itemId: "task-1",
        source: { containerId: "milestone-1", index: 0 },
        destination: { containerId: "milestone-2", index: 0 },
      });
    });

    expect(taskIdsIn("milestone-2")).toEqual(["task-1"]);
  });

  it("allows dropping a task into the empty root container", async () => {
    const onTaskReorder = jest.fn().mockResolvedValue(true);
    renderPage(createProps({ onTaskReorder }), "/templates/template-1?tab=tasks");

    await act(async () => {
      await mockBoardMoveHandler?.({
        itemId: "task-1",
        source: { containerId: "milestone-1", index: 0 },
        destination: { containerId: "no-milestone", index: 0 },
      });
    });

    expect(taskIdsIn("no-milestone")).toEqual(["task-1"]);
    expect(onTaskReorder).toHaveBeenCalledWith("task-1", null, 0);
  });

  it("rolls an optimistic task move back when persistence fails", async () => {
    const onTaskReorder = jest.fn().mockResolvedValue(false);
    const first = createProps().tasks[0]!;
    const second = { ...first, id: "task-2", name: "Prepare screenshots" };
    renderPage(createProps({ tasks: [first, second], onTaskReorder }), "/templates/template-1?tab=tasks");

    await act(async () => {
      await mockBoardMoveHandler?.({
        itemId: first.id,
        source: { containerId: "milestone-1", index: 0 },
        destination: { containerId: "milestone-1", index: 2 },
      });
    });

    expect(taskIdsIn("milestone-1")).toEqual(["task-1", "task-2"]);
  });

  it("projects a placeholder into the active drop container", () => {
    mockBoardState = {
      draggedItemId: "task-1",
      destination: { containerId: "milestone-2", index: 0 },
      draggedItemDimensions: { width: 300, height: 44 },
    };
    const emptyMilestone: Types.Milestone = {
      ...createProps().milestones[0]!,
      id: "milestone-2",
      title: "Empty milestone",
      tasksOrderingState: [],
    };

    renderPage(
      createProps({ milestones: [...createProps().milestones, emptyMilestone], onTaskReorder: jest.fn() }),
      "/templates/template-1?tab=tasks",
    );

    expect(screen.getByTestId("drop-placeholder-milestone-2-0")).toBeInTheDocument();
    expect(screen.queryByTestId("template-task-task-1")).not.toBeInTheDocument();
  });

  it("keeps task rows non-draggable without edit access and removes move buttons", () => {
    const onTaskReorder = jest.fn();
    renderPage(createProps({ permissions: { canView: true }, onTaskReorder }), "/templates/template-1?tab=tasks");

    expect(screen.queryByText("Move up")).not.toBeInTheDocument();
    expect(screen.queryByText("Move down")).not.toBeInTheDocument();
    expect(mockUseSortableItem).toHaveBeenCalledWith(expect.objectContaining({ disabled: true }));

    act(() => {
      mockBoardMoveHandler?.({
        itemId: "task-1",
        source: { containerId: "milestone-1", index: 0 },
        destination: { containerId: "milestone-1", index: 1 },
      });
    });
    expect(onTaskReorder).not.toHaveBeenCalled();
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
    expect(peopleSection).toHaveTextContent("Reviewer");
    expect(peopleSection).toHaveTextContent("Contributors");
    expect(peopleSection).toHaveTextContent("Unavailable person");
    expect(peopleSection).toHaveTextContent("Not active");

    fireEvent.click(screen.getByText("Tasks"));
    expect(screen.getAllByTitle("Ada Lovelace").length).toBeGreaterThan(0);
  });

  it("keeps people controls read-only for View and Comment Access", () => {
    renderPage(createProps({ permissions: { canView: true, canComment: true }, people: [] }));

    expect(screen.queryByText("Add contributor")).not.toBeInTheDocument();
  });

  it("allows Edit Access to add contributors", async () => {
    HTMLElement.prototype.scrollIntoView = jest.fn();

    const person = { id: "person-1", fullName: "Ada Lovelace", avatarUrl: null };
    const onPersonCreate = jest.fn();
    renderPage(
      createProps({
        people: [],
        personSearch: { people: [person], onSearch: async () => undefined },
        onPersonCreate,
      }),
    );

    fireEvent.click(screen.getByText("Add contributor"));
    expect(screen.getByRole("heading", { name: "Add contributor" })).toBeInTheDocument();
    expect(screen.getByText("Access level")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Select person"));
    expect(screen.getByPlaceholderText("Search...")).toBeInTheDocument();
    fireEvent.click(screen.getByText(person.fullName));
    fireEvent.keyDown(document.querySelector('[data-test-id="template-contributor-access"]')!, { key: "Enter" });
    fireEvent.click(document.querySelector('[data-test-id="template-contributor-access-10"]')!);
    expect(screen.getByText("View Access")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Save contributor" }));

    await waitFor(() => {
      expect(onPersonCreate).toHaveBeenCalledWith({
        person,
        role: "contributor",
        responsibility: null,
        accessLevel: 10,
      });
      expect(screen.queryByRole("heading", { name: "Add contributor" })).not.toBeInTheDocument();
    });
  });

  it("shows contributor actions in the person field", () => {
    HTMLElement.prototype.scrollIntoView = jest.fn();

    const contributor: Types.TemplatePerson = {
      id: "template-person-1",
      person: {
        id: "person-1",
        fullName: "Ada Lovelace",
        avatarUrl: null,
        title: "Mathematician",
        profileLink: "/people/person-1",
      },
      role: "contributor",
      responsibility: "Leads delivery",
      accessLevel: 70,
      active: true,
    };
    const onPersonDelete = jest.fn();

    renderPage(createProps({ people: [contributor], onPersonDelete }));

    fireEvent.click(screen.getByText("Ada Lovelace"));

    expect(screen.getByText("View profile")).toBeInTheDocument();
    expect(screen.getByText("Edit contributor")).toBeInTheDocument();
    expect(screen.getByText("Remove contributor")).toBeInTheDocument();
    expect(screen.queryByText("Choose someone else")).not.toBeInTheDocument();
    expect(screen.queryByText("Clear assignment")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("Edit contributor"));
    expect(screen.getByRole("heading", { name: "Edit contributor" })).toBeInTheDocument();
    expect(screen.queryByText("Select person")).not.toBeInTheDocument();
    expect(screen.queryByText("Select replacement")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    fireEvent.click(screen.getByText("Ada Lovelace"));
    fireEvent.click(screen.getByText("Remove contributor"));
    expect(onPersonDelete).toHaveBeenCalledWith(contributor.id);
  });

  it("replaces an unavailable contributor while preserving their role details", async () => {
    HTMLElement.prototype.scrollIntoView = jest.fn();

    const unavailableContributor: Types.TemplatePerson = {
      id: "template-person-1",
      person: { id: "person-1", fullName: "Bob Williams", avatarUrl: null },
      role: "contributor",
      responsibility: "Coordinates launch support",
      accessLevel: 70,
      active: false,
    };
    const replacement = { id: "person-2", fullName: "Emily Davis", avatarUrl: null };
    const onPersonUpdate = jest.fn().mockResolvedValue(true);

    renderPage(
      createProps({
        people: [unavailableContributor],
        personSearch: { people: [replacement], onSearch: async () => undefined },
        onPersonUpdate,
      }),
    );

    fireEvent.click(screen.getByText("Bob Williams"));
    fireEvent.click(screen.getByText("Replace unavailable contributor"));

    expect(screen.getByRole("heading", { name: "Replace unavailable contributor" })).toBeInTheDocument();
    expect(screen.getByText("Select replacement")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Coordinates launch support")).toBeInTheDocument();
    expect(screen.getByText("Edit Access")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Select replacement"));
    fireEvent.click(screen.getByText(replacement.fullName));
    fireEvent.click(screen.getByRole("button", { name: "Replace contributor" }));

    await waitFor(() => {
      expect(onPersonUpdate).toHaveBeenCalledWith(unavailableContributor.id, {
        person: replacement,
        role: "contributor",
        responsibility: "Coordinates launch support",
        accessLevel: 70,
      });
      expect(screen.queryByRole("heading", { name: "Replace unavailable contributor" })).not.toBeInTheDocument();
    });
  });

  it("keeps an unavailable contributor replacement open after a failed update", async () => {
    HTMLElement.prototype.scrollIntoView = jest.fn();

    let resolveUpdate: (successful: boolean) => void = () => undefined;
    const onPersonUpdate = jest.fn(
      () =>
        new Promise<boolean>((resolve) => {
          resolveUpdate = resolve;
        }),
    );
    const unavailableContributor: Types.TemplatePerson = {
      id: "template-person-1",
      person: null,
      role: "contributor",
      responsibility: "Coordinates launch support",
      accessLevel: 70,
      active: false,
    };
    const replacement = { id: "person-2", fullName: "Emily Davis", avatarUrl: null };

    renderPage(
      createProps({
        people: [unavailableContributor],
        personSearch: { people: [replacement], onSearch: async () => undefined },
        onPersonUpdate,
      }),
    );

    fireEvent.click(screen.getByText("Unavailable person"));
    fireEvent.click(screen.getByText("Replace unavailable contributor"));
    fireEvent.click(screen.getByText("Select replacement"));
    fireEvent.click(screen.getByText(replacement.fullName));
    fireEvent.click(screen.getByRole("button", { name: "Replace contributor" }));

    await act(async () => resolveUpdate(false));

    expect(screen.getByRole("heading", { name: "Replace unavailable contributor" })).toBeInTheDocument();
    expect(screen.getByText(replacement.fullName)).toBeInTheDocument();
    expect(screen.getByDisplayValue("Coordinates launch support")).toBeInTheDocument();
  });

  it("optimistically updates contributor access and rolls back failed updates", async () => {
    let finishUpdate: (successful: boolean) => void = () => undefined;
    const updateResult = new Promise<boolean>((resolve) => {
      finishUpdate = resolve;
    });
    const contributor: Types.TemplatePerson = {
      id: "template-person-1",
      person: { id: "person-1", fullName: "Ada Lovelace", avatarUrl: null },
      role: "contributor",
      responsibility: null,
      accessLevel: 70,
      active: true,
    };
    const onPersonUpdate = jest.fn(() => updateResult);

    renderPage(createProps({ people: [contributor], onPersonUpdate }));

    HTMLElement.prototype.scrollIntoView = jest.fn();
    fireEvent.click(screen.getByText("Ada Lovelace"));
    fireEvent.click(screen.getByText("Edit contributor"));
    fireEvent.keyDown(document.querySelector('[data-test-id="template-contributor-access"]')!, { key: "Enter" });
    expect(screen.queryByText("No Access")).not.toBeInTheDocument();
    fireEvent.click(document.querySelector('[data-test-id="template-contributor-access-10"]')!);

    expect(screen.getByText("View Access")).toBeInTheDocument();
    expect(onPersonUpdate).toHaveBeenCalledWith(contributor.id, { accessLevel: 10 });

    await act(async () => finishUpdate(false));
    expect(screen.getByText("Edit Access")).toBeInTheDocument();
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

function taskIdsIn(milestoneId: string) {
  const section = document.querySelector(`[data-test-id="template-task-section-${milestoneId}"]`);
  if (!section) throw new Error(`Missing task section for ${milestoneId}`);

  return Array.from(section.querySelectorAll("[data-task-row-id]")).map((row) => row.getAttribute("data-task-row-id"));
}
