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

jest.mock("../TaskBoard/KanbanView/TaskSlideIn", () => ({
  TaskSlideIn: ({ isOpen, taskPageProps }: { isOpen: boolean; taskPageProps: { name?: string } | null }) =>
    isOpen ? <div data-test-id="task-slide-in">{taskPageProps?.name}</div> : null,
}));

jest.mock("../TaskBoard/KanbanView", () => ({
  KanbanBoard: () => <div data-test-id="template-kanban-board">Kanban board</div>,
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
  useBoardDnD: (handler: (move: MockBoardMove) => unknown, options?: { enabled?: boolean }) => {
    if (options?.enabled !== false) {
      mockBoardMoveHandler = handler;
    }
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

function resourceNode(
  overrides: Partial<Types.ResourceNode> & Pick<Types.ResourceNode, "id" | "name" | "type">,
): Types.ResourceNode {
  return {
    parentFolderId: null,
    position: 0,
    link: "#",
    insertedAt: "2026-08-11T12:00:00Z",
    updatedAt: "2026-08-11T12:00:00Z",
    ...overrides,
  };
}

function createProps(overrides: Partial<Types.Props> = {}): Types.Props {
  const defaultPersonSearch = { people: [], onSearch: async () => undefined };
  const personSearch = overrides.personSearch ?? defaultPersonSearch;

  return {
    template: {
      id: "template-1",
      name: "Product launch",
      description: asRichText("A reusable launch plan"),
      durationDays: 30,
      milestonesOrderingState: ["milestone-1"],
      tasksKanbanState: {},
      archived: false,
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
        link: "/templates/template-1/milestones/milestone-1",
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
    newDocumentLink: "/templates/template-1/documents/new",
    newLinkLink: "/templates/template-1/links/new",
    richTextHandlers: createMockRichEditorHandlers(),
    formattedTimePreferences: defaultFormattedTimePreferences,
    onTemplateUpdate: jest.fn(),
    onMilestoneCreate: jest.fn(),
    onMilestoneUpdate: jest.fn(),
    onMilestoneDelete: jest.fn(),
    onTaskCreate: jest.fn(),
    onTaskUpdate: jest.fn(),
    onTaskDelete: jest.fn(),
    onDuplicate: jest.fn().mockResolvedValue({ success: true }),
    onArchive: jest.fn().mockResolvedValue({ success: true }),
    onRestore: jest.fn().mockResolvedValue({ success: true }),
    onDelete: jest.fn().mockResolvedValue({ success: true }),
    ...overrides,
    personSearch,
    contributorPersonSearch: overrides.contributorPersonSearch ?? personSearch,
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
  window.localStorage.removeItem("templateTaskBoard:taskDisplayMode");
  HTMLElement.prototype.scrollIntoView = jest.fn();
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

  it("duplicates an active template from the sidebar actions", async () => {
    const user = userEvent.setup();
    const onDuplicate = jest.fn().mockResolvedValue({ success: true });
    renderPage(createProps({ onDuplicate }));

    expect(screen.getByText("Actions")).toBeInTheDocument();
    await user.click(screen.getByText("Duplicate"));

    const name = screen.getByLabelText(/Template name/);
    expect(name).toHaveValue("Copy of Product launch");
    await user.click(screen.getByRole("button", { name: "Duplicate template" }));
    await waitFor(() => expect(onDuplicate).toHaveBeenCalledWith("template-1", "Copy of Product launch"));
  });

  it("shows archived templates as read-only while retaining restore and delete", async () => {
    userEvent.setup();
    renderPage(
      createProps({
        template: { ...createProps().template, archived: true },
        permissions: { canView: true, canEdit: true },
      }),
    );

    expect(screen.getByText("Archived")).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: /project name/i })).not.toBeInTheDocument();

    expect(screen.getByText("Actions")).toBeInTheDocument();
    expect(screen.getByText("Restore")).toBeInTheDocument();
    expect(screen.getByText("Delete")).toBeInTheDocument();
    expect(screen.queryByText("Duplicate")).not.toBeInTheDocument();
    expect(screen.queryByText("Archive")).not.toBeInTheDocument();
  });

  it("hides editor lifecycle actions without edit permission", () => {
    renderPage(createProps({ permissions: { canView: true, canEdit: false } }));

    expect(screen.queryByText("Actions")).not.toBeInTheDocument();
    expect(screen.queryByText("Duplicate")).not.toBeInTheDocument();
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
            link: "#",
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
    const teardownFileMock = setupFileInputMock([
      new File(["launch plan"], "Launch-plan.pdf", { type: "application/pdf" }),
    ]);

    renderPage(createProps({ onFilesUpload }), "/templates/template-1?tab=docs-and-files");

    await user.click(document.querySelector('[data-test-id="add-options"]')!);
    await user.click(await screen.findByText("Upload files"));
    expect(await screen.findByDisplayValue("Launch-plan")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(onFilesUpload).toHaveBeenCalledWith(expect.any(Array), expect.any(Function), null));
    expect(screen.queryByDisplayValue("Launch-plan")).not.toBeInTheDocument();
    teardownFileMock();
  });

  it("accepts files dropped onto the template Docs & Files tab", async () => {
    const droppedFile = new File(["launch plan"], "Launch-plan.pdf", { type: "application/pdf" });

    renderPage(createProps(), "/templates/template-1?tab=docs-and-files");

    fireEvent.drop(document, {
      dataTransfer: {
        files: [droppedFile],
        types: ["Files"],
      },
    });

    expect(await screen.findByDisplayValue("Launch-plan")).toBeInTheDocument();
  });

  it("keeps selected files when template persistence fails", async () => {
    const user = userEvent.setup();
    const onFilesUpload = jest.fn().mockResolvedValue(false);
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => undefined);
    const teardownFileMock = setupFileInputMock([
      new File(["launch plan"], "Launch-plan.pdf", { type: "application/pdf" }),
    ]);

    renderPage(createProps({ onFilesUpload }), "/templates/template-1?tab=docs-and-files");

    await user.click(document.querySelector('[data-test-id="add-options"]')!);
    await user.click(await screen.findByText("Upload files"));
    await user.click(await screen.findByRole("button", { name: "Save" }));

    await waitFor(() => expect(onFilesUpload).toHaveBeenCalled());
    expect(screen.getByDisplayValue("Launch-plan")).toBeInTheDocument();
    teardownFileMock();
    consoleError.mockRestore();
  });

  it("keeps the folder modal and entered name when template persistence fails", async () => {
    const user = userEvent.setup();
    const onFolderCreate = jest.fn().mockResolvedValue(false);
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => undefined);

    renderPage(createProps({ onFolderCreate }), "/templates/template-1?tab=docs-and-files");

    await user.click(document.querySelector('[data-test-id="add-options"]')!);
    await user.click(await screen.findByText("New folder"));
    await user.type(screen.getByLabelText("Name"), "Campaign assets");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(onFolderCreate).toHaveBeenCalledWith(null, "Campaign assets"));
    expect(screen.getByRole("heading", { name: "New folder" })).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toHaveValue("Campaign assets");
    consoleError.mockRestore();
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
            link: "/templates/template-1/documents/node-1",
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
      "/templates/template-1/documents/node-1",
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
            link: "#",
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

  it("confirms resource deletion from the Docs & Files menu", async () => {
    const user = userEvent.setup();
    const onResourceDelete = jest.fn().mockResolvedValue(true);

    renderPage(
      createProps({
        onResourceDelete,
        resourceNodes: [
          {
            id: "node-1",
            parentFolderId: null,
            type: "document",
            position: 0,
            name: "Launch guide",
            link: "/templates/template-1/documents/node-1",
            insertedAt: "2026-08-11T12:00:00Z",
            updatedAt: "2026-08-11T12:00:00Z",
          },
        ],
      }),
      "/templates/template-1?tab=docs-and-files",
    );

    await user.click(document.querySelector('[data-test-id="menu-node-1"]')!);
    await user.click(
      await waitFor(() => {
        const item = document.querySelector<HTMLElement>('[data-test-id="delete-node-1"]');
        if (!item) throw new Error("delete menu item not found");
        return item;
      }),
    );
    expect(await screen.findByText(/Are you sure you want to delete the document/)).toBeInTheDocument();

    await user.click(document.querySelector('[data-test-id="submit"]')!);

    await waitFor(() => expect(onResourceDelete).toHaveBeenCalledWith("node-1"));
    await waitFor(() => {
      expect(screen.queryByText(/Are you sure you want to delete the document/)).not.toBeInTheDocument();
    });
  });

  it("keeps the resource when Docs & Files deletion fails", async () => {
    const user = userEvent.setup();
    const onResourceDelete = jest.fn().mockResolvedValue(false);

    renderPage(
      createProps({
        onResourceDelete,
        resourceNodes: [
          {
            id: "node-1",
            parentFolderId: null,
            type: "folder",
            position: 0,
            name: "Campaign assets",
            link: "#",
            insertedAt: "2026-08-11T12:00:00Z",
            updatedAt: "2026-08-11T12:00:00Z",
          },
        ],
      }),
      "/templates/template-1?tab=docs-and-files",
    );

    await user.click(document.querySelector('[data-test-id="menu-node-1"]')!);
    await user.click(
      await waitFor(() => {
        const item = document.querySelector<HTMLElement>('[data-test-id="delete-node-1"]');
        if (!item) throw new Error("delete menu item not found");
        return item;
      }),
    );
    expect(await screen.findByText(/Are you sure you want to delete the folder/)).toBeInTheDocument();
    await user.click(document.querySelector('[data-test-id="submit"]')!);

    await waitFor(() => expect(onResourceDelete).toHaveBeenCalledWith("node-1"));
    expect(screen.getByText(/Are you sure you want to delete the folder/)).toBeInTheDocument();
    expect(document.querySelector('[data-test-id="node-0"]')).toHaveTextContent("Campaign assets");
  });

  it("hides the Docs & Files delete menu for View Access", () => {
    renderPage(
      createProps({
        permissions: { canView: true },
        onResourceDelete: jest.fn().mockResolvedValue(true),
        resourceNodes: [
          {
            id: "node-1",
            parentFolderId: null,
            type: "link",
            position: 0,
            name: "Design Spec",
            link: "/templates/template-1/links/node-1",
            insertedAt: "2026-08-11T12:00:00Z",
            updatedAt: "2026-08-11T12:00:00Z",
          },
        ],
      }),
      "/templates/template-1?tab=docs-and-files",
    );

    expect(document.querySelector('[data-test-id="menu-node-1"]')).not.toBeInTheDocument();
  });

  it.each(["document", "file", "link", "folder"] as const)(
    "shows Move for a template %s in Docs & Files",
    async (type) => {
      const user = userEvent.setup();

      renderPage(
        createProps({
          onResourceMove: jest.fn().mockResolvedValue(true),
          resourceNodes: [
            resourceNode({
              id: "node-1",
              folderId: type === "folder" ? "folder-1" : null,
              type,
              name: "Launch item",
            }),
          ],
        }),
        "/templates/template-1?tab=docs-and-files",
      );

      await user.click(document.querySelector('[data-test-id="menu-node-1"]')!);
      expect(
        await waitFor(() => {
          const item = document.querySelector<HTMLElement>('[data-test-id="move-node-1"]');
          if (!item) throw new Error("move menu item not found");
          return item;
        }),
      ).toHaveTextContent("Move");
    },
  );

  it("shows Rename only for folders in Docs & Files", async () => {
    const user = userEvent.setup();

    renderPage(
      createProps({
        onFolderRename: jest.fn().mockResolvedValue(true),
        onResourceMove: jest.fn().mockResolvedValue(true),
        resourceNodes: [
          resourceNode({ id: "folder-node-1", folderId: "assets", type: "folder", name: "Assets" }),
          resourceNode({ id: "node-1", type: "document", name: "Launch guide", position: 1 }),
        ],
      }),
      "/templates/template-1?tab=docs-and-files",
    );

    await user.click(document.querySelector('[data-test-id="menu-folder-node-1"]')!);
    expect(
      await waitFor(() => {
        const item = document.querySelector<HTMLElement>('[data-test-id="rename-folder-assets"]');
        if (!item) throw new Error("rename menu item not found");
        return item;
      }),
    ).toHaveTextContent("Rename");

    await user.keyboard("{Escape}");
    await user.click(document.querySelector('[data-test-id="menu-node-1"]')!);
    expect(
      await waitFor(() => {
        const item = document.querySelector<HTMLElement>('[data-test-id="move-node-1"]');
        if (!item) throw new Error("move menu item not found");
        return item;
      }),
    ).toBeInTheDocument();
    expect(document.querySelector('[data-test-id="rename-folder-assets"]')).not.toBeInTheDocument();
  });

  it.each(["document", "file", "link"] as const)("does not show Rename for a template %s", async (type) => {
    const user = userEvent.setup();

    renderPage(
      createProps({
        onFolderRename: jest.fn().mockResolvedValue(true),
        onResourceMove: jest.fn().mockResolvedValue(true),
        resourceNodes: [resourceNode({ id: "node-1", type, name: "Launch item" })],
      }),
      "/templates/template-1?tab=docs-and-files",
    );

    await user.click(document.querySelector('[data-test-id="menu-node-1"]')!);
    expect(
      await waitFor(() => {
        const item = document.querySelector<HTMLElement>('[data-test-id="move-node-1"]');
        if (!item) throw new Error("move menu item not found");
        return item;
      }),
    ).toBeInTheDocument();
    expect(document.querySelector('[data-test-id^="rename-folder-"]')).not.toBeInTheDocument();
  });

  it("renames a folder from the Docs & Files menu", async () => {
    const user = userEvent.setup();
    const onFolderRename = jest.fn().mockResolvedValue(true);

    renderPage(
      createProps({
        onFolderRename,
        resourceNodes: [resourceNode({ id: "folder-node-1", folderId: "assets", type: "folder", name: "Assets" })],
      }),
      "/templates/template-1?tab=docs-and-files",
    );

    await user.click(document.querySelector('[data-test-id="menu-folder-node-1"]')!);
    await user.click(
      await waitFor(() => {
        const item = document.querySelector<HTMLElement>('[data-test-id="rename-folder-assets"]');
        if (!item) throw new Error("rename menu item not found");
        return item;
      }),
    );

    expect(await screen.findByText("Rename folder")).toBeInTheDocument();
    const nameInput = document.querySelector('[data-test-id="new-folder-name"]') as HTMLInputElement;
    await user.clear(nameInput);
    await user.type(nameInput, "Campaign assets");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(onFolderRename).toHaveBeenCalledWith("assets", "Campaign assets"));
    await waitFor(() => {
      expect(screen.queryByText("Rename folder")).not.toBeInTheDocument();
    });
  });

  it("keeps the rename modal open when renaming a folder fails", async () => {
    const user = userEvent.setup();
    const onFolderRename = jest.fn().mockResolvedValue(false);

    renderPage(
      createProps({
        onFolderRename,
        resourceNodes: [resourceNode({ id: "folder-node-1", folderId: "assets", type: "folder", name: "Assets" })],
      }),
      "/templates/template-1?tab=docs-and-files",
    );

    await user.click(document.querySelector('[data-test-id="menu-folder-node-1"]')!);
    await user.click(
      await waitFor(() => {
        const item = document.querySelector<HTMLElement>('[data-test-id="rename-folder-assets"]');
        if (!item) throw new Error("rename menu item not found");
        return item;
      }),
    );

    const nameInput = document.querySelector('[data-test-id="new-folder-name"]') as HTMLInputElement;
    await user.clear(nameInput);
    await user.type(nameInput, "Campaign assets");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(onFolderRename).toHaveBeenCalledWith("assets", "Campaign assets"));
    expect(screen.getByText("Rename folder")).toBeInTheDocument();
  });

  it("hides Rename when View Access", () => {
    renderPage(
      createProps({
        permissions: { canView: true },
        onFolderRename: jest.fn().mockResolvedValue(true),
        resourceNodes: [resourceNode({ id: "folder-node-1", folderId: "assets", type: "folder", name: "Assets" })],
      }),
      "/templates/template-1?tab=docs-and-files",
    );

    expect(document.querySelector('[data-test-id="menu-folder-node-1"]')).not.toBeInTheDocument();
  });

  it("moves a resource into a folder from the Docs & Files menu", async () => {
    const user = userEvent.setup();
    const onResourceMove = jest.fn().mockResolvedValue(true);

    renderPage(
      createProps({
        onResourceMove,
        resourceNodes: [
          resourceNode({ id: "folder-node-1", folderId: "assets", type: "folder", name: "Assets" }),
          resourceNode({
            id: "node-1",
            type: "document",
            name: "Launch guide",
            link: "/templates/template-1/documents/node-1",
            position: 1,
          }),
        ],
      }),
      "/templates/template-1?tab=docs-and-files",
    );

    await user.click(document.querySelector('[data-test-id="menu-node-1"]')!);
    await user.click(
      await waitFor(() => {
        const item = document.querySelector<HTMLElement>('[data-test-id="move-node-1"]');
        if (!item) throw new Error("move menu item not found");
        return item;
      }),
    );
    expect(await screen.findByText("Move Launch guide")).toBeInTheDocument();
    expect(document.querySelector('[data-test-id="folder-select-current-root"]')).toHaveTextContent(
      "Documents & Files",
    );

    await user.click(document.querySelector('[data-test-id="folder-select-node-assets"]')!);
    expect(document.querySelector('[data-test-id="folder-select-current-assets"]')).toHaveTextContent("Assets");
    await user.click(screen.getByRole("button", { name: "Move Here" }));

    await waitFor(() => expect(onResourceMove).toHaveBeenCalledWith("node-1", "assets"));
    await waitFor(() => {
      expect(screen.queryByText("Move Launch guide")).not.toBeInTheDocument();
    });
  });

  it("lists folders above other resources in the move destination picker", async () => {
    const user = userEvent.setup();

    renderPage(
      createProps({
        onResourceMove: jest.fn().mockResolvedValue(true),
        resourceNodes: [
          resourceNode({ id: "node-1", type: "document", name: "Launch guide" }),
          resourceNode({ id: "folder-node-2", folderId: "zeta", type: "folder", name: "Zeta" }),
          resourceNode({ id: "node-2", type: "link", name: "Design Spec" }),
          resourceNode({ id: "folder-node-1", folderId: "assets", type: "folder", name: "Assets" }),
        ],
      }),
      "/templates/template-1?tab=docs-and-files",
    );

    await user.click(document.querySelector('[data-test-id="menu-node-1"]')!);
    await user.click(
      await waitFor(() => {
        const item = document.querySelector<HTMLElement>('[data-test-id="move-node-1"]');
        if (!item) throw new Error("move menu item not found");
        return item;
      }),
    );

    expect(await screen.findByText("Move Launch guide")).toBeInTheDocument();
    const modal = document.querySelector('[data-test-id="move-resource-modal"]') as HTMLElement;
    const names = Array.from(modal.querySelectorAll(".h-\\[240px\\] > div")).map((row) => row.textContent?.trim());

    expect(names).toEqual(["Assets", "Zeta", "Launch guide", "Design Spec"]);
  });

  it("keeps the move modal open when moving a resource fails", async () => {
    const user = userEvent.setup();
    const onResourceMove = jest.fn().mockResolvedValue(false);

    renderPage(
      createProps({
        onResourceMove,
        resourceNodes: [
          resourceNode({ id: "folder-node-1", folderId: "assets", type: "folder", name: "Assets" }),
          resourceNode({ id: "node-1", type: "link", name: "Design Spec", position: 1 }),
        ],
      }),
      "/templates/template-1?tab=docs-and-files",
    );

    await user.click(document.querySelector('[data-test-id="menu-node-1"]')!);
    await user.click(
      await waitFor(() => {
        const item = document.querySelector<HTMLElement>('[data-test-id="move-node-1"]');
        if (!item) throw new Error("move menu item not found");
        return item;
      }),
    );
    await user.click(document.querySelector('[data-test-id="folder-select-node-assets"]')!);
    await user.click(screen.getByRole("button", { name: "Move Here" }));

    await waitFor(() => expect(onResourceMove).toHaveBeenCalledWith("node-1", "assets"));
    expect(screen.getByText("Move Design Spec")).toBeInTheDocument();
  });

  it("does not allow a folder to be moved into itself", async () => {
    const user = userEvent.setup();
    const onResourceMove = jest.fn().mockResolvedValue(true);

    renderPage(
      createProps({
        onResourceMove,
        resourceNodes: [
          resourceNode({ id: "folder-node-1", folderId: "assets", type: "folder", name: "Assets" }),
          resourceNode({ id: "folder-node-2", folderId: "other", type: "folder", name: "Other", position: 1 }),
        ],
      }),
      "/templates/template-1?tab=docs-and-files",
    );

    await user.click(document.querySelector('[data-test-id="menu-folder-node-1"]')!);
    await user.click(
      await waitFor(() => {
        const item = document.querySelector<HTMLElement>('[data-test-id="move-folder-node-1"]');
        if (!item) throw new Error("move menu item not found");
        return item;
      }),
    );

    expect(document.querySelector('[data-test-id="folder-select-node-assets"]')).not.toBeInTheDocument();
    expect(document.querySelector('[data-test-id="folder-select-node-other"]')).toBeInTheDocument();
  });

  it("opens a folder and shows only its children", async () => {
    const user = userEvent.setup();

    renderPage(
      createProps({
        resourceNodes: [
          resourceNode({ id: "folder-node-1", folderId: "assets", type: "folder", name: "Assets" }),
          resourceNode({
            id: "root-doc",
            type: "document",
            name: "Launch guide",
            link: "/templates/template-1/documents/root-doc",
            position: 1,
          }),
          resourceNode({
            id: "nested-doc",
            parentFolderId: "assets",
            type: "document",
            name: "Launch checklist",
            link: "/templates/template-1/documents/nested-doc",
          }),
        ],
      }),
      "/templates/template-1?tab=docs-and-files",
    );

    expect(screen.getByText("Assets")).toBeInTheDocument();
    expect(screen.getByText("Launch guide")).toBeInTheDocument();
    expect(screen.queryByText("Launch checklist")).not.toBeInTheDocument();

    await user.click(screen.getByText("Assets"));

    expect(screen.getByText("Launch checklist")).toBeInTheDocument();
    expect(screen.queryByText("Launch guide")).not.toBeInTheDocument();

    await user.click(document.querySelector('[data-test-id="nav-item-documents-files"]')!);
    expect(screen.getByText("Launch guide")).toBeInTheDocument();
    expect(screen.queryByText("Launch checklist")).not.toBeInTheDocument();
  });

  it("opens a nested folder from the folderId query param", () => {
    renderPage(
      createProps({
        resourceNodes: [
          resourceNode({ id: "folder-node-1", folderId: "assets", type: "folder", name: "Assets" }),
          resourceNode({
            id: "root-doc",
            type: "document",
            name: "Launch guide",
            link: "/templates/template-1/documents/root-doc",
            position: 1,
          }),
          resourceNode({
            id: "nested-doc",
            parentFolderId: "assets",
            type: "document",
            name: "Launch checklist",
            link: "/templates/template-1/documents/nested-doc",
          }),
        ],
      }),
      "/templates/template-1?tab=docs-and-files&folderId=assets",
    );

    expect(screen.getByText("Launch checklist")).toBeInTheDocument();
    expect(screen.queryByText("Launch guide")).not.toBeInTheDocument();
  });

  it("shows a moved resource inside its destination folder", () => {
    renderPage(
      createProps({
        resourceNodes: [
          resourceNode({ id: "folder-node-1", folderId: "assets", type: "folder", name: "Assets" }),
          resourceNode({
            id: "node-1",
            parentFolderId: "assets",
            type: "file",
            name: "Launch.png",
            link: "/templates/template-1/files/node-1",
          }),
        ],
      }),
      "/templates/template-1?tab=docs-and-files",
    );

    expect(screen.queryByText("Launch.png")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Assets"));
    expect(screen.getByText("Launch.png")).toBeInTheDocument();
  });

  it("creates a nested folder from inside a folder", async () => {
    const user = userEvent.setup();
    const onFolderCreate = jest.fn().mockResolvedValue(true);

    renderPage(
      createProps({
        onFolderCreate,
        resourceNodes: [resourceNode({ id: "folder-node-1", folderId: "assets", type: "folder", name: "Assets" })],
      }),
      "/templates/template-1?tab=docs-and-files",
    );

    await user.click(screen.getByText("Assets"));
    await user.click(document.querySelector('[data-test-id="add-options"]')!);
    await user.click(await screen.findByText("New folder"));
    await user.type(screen.getByLabelText("Name"), "Campaign assets");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(onFolderCreate).toHaveBeenCalledWith("assets", "Campaign assets"));
  });

  it("uploads files into the open folder", async () => {
    const user = userEvent.setup();
    const onFilesUpload = jest.fn().mockResolvedValue(true);
    const teardownFileMock = setupFileInputMock([
      new File(["launch plan"], "Launch-plan.pdf", { type: "application/pdf" }),
    ]);

    renderPage(
      createProps({
        onFilesUpload,
        resourceNodes: [resourceNode({ id: "folder-node-1", folderId: "assets", type: "folder", name: "Assets" })],
      }),
      "/templates/template-1?tab=docs-and-files",
    );

    await user.click(screen.getByText("Assets"));
    await user.click(document.querySelector('[data-test-id="add-options"]')!);
    await user.click(await screen.findByText("Upload files"));
    await user.click(await screen.findByRole("button", { name: "Save" }));

    await waitFor(() => expect(onFilesUpload).toHaveBeenCalledWith(expect.any(Array), expect.any(Function), "assets"));
    teardownFileMock();
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

    const form = document.querySelector('[data-test-id="template-task-form"]');
    expect(form).toHaveClass("overflow-x-hidden");
    expect(document.querySelector('[data-test-id="template-task-status"]')).toBeInTheDocument();
    expect(document.querySelector('[data-test-id="template-task-milestone"]')).toBeInTheDocument();
  });

  it("enables Create task as soon as the title is no longer empty", () => {
    renderPage(createProps(), "/templates/template-1?tab=tasks");

    fireEvent.click(screen.getByText("New task"));

    const createButton = screen.getByRole("button", { name: "Create task" });
    expect(createButton).toBeDisabled();

    fireEvent.change(document.querySelector('[data-test-id="template-task-title-input"]') as HTMLInputElement, {
      target: { value: "Kickoff notes" },
    });

    expect(createButton).toBeEnabled();
  });

  it("activates relative due date when the field is clicked", () => {
    renderPage(createProps(), "/templates/template-1?tab=tasks");

    fireEvent.click(screen.getByText("New task"));
    fireEvent.click(screen.getByText("Set relative date"));

    expect(document.querySelector('[data-test-id="relative-day-field-input"]')).toBeInTheDocument();
  });

  it("asks the parent to reorder tasks and renders the order from props", async () => {
    const onTaskReorder = jest.fn().mockResolvedValue(true);
    const first = createProps().tasks[0]!;
    const second = { ...first, id: "task-2", name: "Prepare screenshots" };
    const milestone = { ...createProps().milestones[0]!, tasksOrderingState: ["task-1", "task-2"] };
    const view = renderPage(
      createProps({ tasks: [first, second], milestones: [milestone], onTaskReorder }),
      "/templates/template-1?tab=tasks",
    );

    await act(async () => {
      await mockBoardMoveHandler?.({
        itemId: first.id,
        source: { containerId: "milestone-1", index: 0 },
        destination: { containerId: "milestone-1", index: 2 },
      });
    });

    expect(onTaskReorder).toHaveBeenCalledWith("task-1", "milestone-1", 2);
    expect(taskIdsIn("milestone-1")).toEqual(["task-1", "task-2"]);

    view.rerender(
      <MemoryRouter initialEntries={["/templates/template-1?tab=tasks"]}>
        <TemplateProjectPage
          {...createProps({
            tasks: [first, second],
            milestones: [{ ...milestone, tasksOrderingState: ["task-2", "task-1"] }],
            onTaskReorder,
          })}
        />
      </MemoryRouter>,
    );

    expect(taskIdsIn("milestone-1")).toEqual(["task-2", "task-1"]);
  });

  it("asks the parent to move a task into another milestone", async () => {
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

    expect(onTaskReorder).toHaveBeenCalledWith("task-1", "milestone-2", 1);
    expect(taskIdsIn("milestone-1")).toEqual(["task-1"]);
    expect(taskIdsIn("milestone-2")).toEqual(["task-2"]);
  });

  it("asks the parent to drop a task into an empty milestone", async () => {
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

    expect(onTaskReorder).toHaveBeenCalledWith("task-1", "milestone-2", 0);
    expect(taskIdsIn("milestone-2")).toEqual([]);
  });

  it("asks the parent to drop a task into the root container", async () => {
    const onTaskReorder = jest.fn().mockResolvedValue(true);
    renderPage(createProps({ onTaskReorder }), "/templates/template-1?tab=tasks");

    await act(async () => {
      await mockBoardMoveHandler?.({
        itemId: "task-1",
        source: { containerId: "milestone-1", index: 0 },
        destination: { containerId: "no-milestone", index: 0 },
      });
    });

    expect(onTaskReorder).toHaveBeenCalledWith("task-1", null, 0);
    expect(taskIdsIn("milestone-1")).toEqual(["task-1"]);
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

  it("highlights the No milestone section instead of showing between-task drop placeholders", () => {
    const rootTasks: Types.Task[] = [
      {
        id: "root-1",
        name: "Root one",
        description: null,
        milestoneId: null,
        priority: null,
        size: null,
        dueOffsetDays: null,
        status: statuses[0]!,
        reminders: [],
      },
      {
        id: "root-2",
        name: "Root two",
        description: null,
        milestoneId: null,
        priority: null,
        size: null,
        dueOffsetDays: null,
        status: statuses[0]!,
        reminders: [],
      },
    ];

    mockBoardState = {
      draggedItemId: "task-1",
      destination: { containerId: "no-milestone", index: 1 },
      draggedItemDimensions: { width: 300, height: 44 },
    };

    renderPage(
      createProps({
        tasks: [...createProps().tasks, ...rootTasks],
        onTaskReorder: jest.fn(),
      }),
      "/templates/template-1?tab=tasks",
    );

    const section = document.querySelector('[data-test-id="template-task-section-no-milestone"]');
    expect(section).toHaveAttribute("data-drop-target", "true");
    expect(screen.queryByTestId("drop-placeholder-no-milestone-0")).not.toBeInTheDocument();
    expect(screen.queryByTestId("drop-placeholder-no-milestone-1")).not.toBeInTheDocument();
    expect(document.querySelector('[data-test-id="template-task-root-1"]')).toBeInTheDocument();
    expect(document.querySelector('[data-test-id="template-task-root-2"]')).toBeInTheDocument();
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

  it("does not open a task update modal from the task board", () => {
    renderPage(createProps(), "/templates/template-1?tab=tasks");

    fireEvent.click(screen.getByText("Publish announcement"));

    expect(screen.queryByRole("heading", { name: "Update Task" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Update task" })).not.toBeInTheDocument();
  });

  it("creates a task from the milestone inline creator", () => {
    const onTaskCreate = jest.fn();
    renderPage(createProps({ onTaskCreate }), "/templates/template-1?tab=tasks");

    fireEvent.click(document.querySelector('[data-test-id="template-task-section-add-milestone-1"]') as HTMLElement);
    fireEvent.change(screen.getByRole("textbox", { name: "Add task" }), {
      target: { value: "Write launch notes" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    expect(onTaskCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Write launch notes",
        milestoneId: "milestone-1",
        dueOffsetDays: null,
        status: statuses[0],
      }),
    );
  });

  it("opens the task creation modal from the milestone inline creator", () => {
    renderPage(createProps(), "/templates/template-1?tab=tasks");

    fireEvent.click(document.querySelector('[data-test-id="template-task-section-add-milestone-1"]') as HTMLElement);
    fireEvent.keyDown(screen.getByRole("textbox", { name: "Add task" }), { key: "Enter", shiftKey: true });

    expect(screen.getByRole("heading", { name: "Create Task" })).toBeInTheDocument();
  });

  it("selects template tasks with j and k and clears the selection with Escape", () => {
    renderPage(createTwoTaskBoardProps(), "/templates/template-1?tab=tasks");

    fireTaskKey("j", 74);
    expect(document.querySelector('[data-test-id="template-task-task-1"]')).toHaveAttribute("data-selected", "true");

    fireTaskKey("j", 74);
    expect(document.querySelector('[data-test-id="template-task-task-2"]')).toHaveAttribute("data-selected", "true");
    expect(document.querySelector('[data-test-id="template-task-task-1"]')).toHaveAttribute("data-selected", "false");

    fireTaskKey("k", 75);
    expect(document.querySelector('[data-test-id="template-task-task-1"]')).toHaveAttribute("data-selected", "true");

    fireTaskKey("Escape", 27);
    expect(document.querySelector('[data-test-id="template-task-task-1"]')).toHaveAttribute("data-selected", "false");
    expect(document.querySelector('[data-test-id="template-task-task-2"]')).toHaveAttribute("data-selected", "false");
  });

  it("opens the selected template task with Enter", () => {
    const getTemplateTaskPageProps = jest.fn((taskId: string) => ({
      variant: "template",
      name: taskId === "task-1" ? "Publish announcement" : "Prepare screenshots",
    }));
    renderPage(
      createTwoTaskBoardProps({ getTemplateTaskPageProps: getTemplateTaskPageProps as never }),
      "/templates/template-1?tab=tasks",
    );

    fireTaskKey("j", 74);
    fireTaskKey("Enter", 13);

    expect(document.querySelector('[data-test-id="task-slide-in"]')).toHaveTextContent("Publish announcement");
    expect(getTemplateTaskPageProps).toHaveBeenCalledWith(
      "task-1",
      expect.objectContaining({ tasks: expect.any(Array) }),
    );
  });

  it("opens the selected template task assignee picker with a", () => {
    renderPage(createTwoTaskBoardProps(), "/templates/template-1?tab=tasks");

    fireTaskKey("j", 74);
    fireTaskKey("a", 65);

    expect(screen.getByPlaceholderText("Search...")).toBeInTheDocument();
  });

  it("opens the selected template task status picker with s", () => {
    renderPage(createTwoTaskBoardProps(), "/templates/template-1?tab=tasks");

    fireTaskKey("j", 74);
    fireTaskKey("s", 83);

    expect(screen.getByPlaceholderText("Change status...")).toBeInTheDocument();
  });

  it("opens the selected template task due date with d", () => {
    renderPage(createTwoTaskBoardProps(), "/templates/template-1?tab=tasks");

    fireTaskKey("j", 74);
    fireTaskKey("d", 68);

    expect(document.querySelector('[data-test-id="template-task-task-1-due-offset-input"]')).toBeInTheDocument();
  });

  it("opens the task slide-in when a task title is clicked", () => {
    const getTemplateTaskPageProps = jest.fn(() => ({ variant: "template", name: "Publish announcement" }));
    renderPage(
      createProps({ getTemplateTaskPageProps: getTemplateTaskPageProps as never }),
      "/templates/template-1?tab=tasks",
    );

    fireEvent.click(screen.getByText("Publish announcement"));

    expect(document.querySelector('[data-test-id="task-slide-in"]')).toHaveTextContent("Publish announcement");
    expect(getTemplateTaskPageProps).toHaveBeenCalledWith(
      "task-1",
      expect.objectContaining({ tasks: expect.any(Array) }),
    );
  });

  it("shows description indicators next to milestones and tasks", () => {
    renderPage(
      createProps({
        milestones: [
          {
            ...createProps().milestones[0]!,
            description: asRichText("Ship the launch checklist."),
          },
        ],
        tasks: [
          {
            ...createProps().tasks[0]!,
            description: asRichText("Draft the public announcement."),
          },
        ],
      }),
      "/templates/template-1?tab=tasks",
    );

    const header = document.querySelector('[data-test-id="template-task-section-header-milestone-1"]') as HTMLElement;
    const task = document.querySelector('[data-test-id="template-task-task-1"]') as HTMLElement;

    expect(header.querySelector('[data-test-id="description-indicator"]')).toBeInTheDocument();
    expect(header.querySelector('[data-test-id="comments-indicator"]')).not.toBeInTheDocument();
    expect(task.querySelector('[data-test-id="description-indicator"]')).toBeInTheDocument();
    expect(task.querySelector('[data-test-id="comments-indicator"]')).not.toBeInTheDocument();
  });

  it("opens the template milestone creation modal", () => {
    renderPage(createProps(), "/templates/template-1?tab=tasks");

    fireEvent.click(screen.getByText("New milestone"));

    expect(screen.getByRole("heading", { name: "Create Milestone" })).toBeInTheDocument();
    expect(screen.getByText("Relative due date")).toBeInTheDocument();
    expect(screen.getByText("Create more")).toBeInTheDocument();
  });

  it("enables Add milestone as soon as the name is no longer empty", () => {
    renderPage(createProps());

    fireEvent.click(document.querySelector('[data-test-id="add-template-milestone-overview"]')!);

    const form = document.querySelector('[data-test-id="add-milestone-form"]') as HTMLElement;
    const createButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(createButton).toBeDisabled();

    fireEvent.change(document.querySelector('[data-test-id="milestone-name-input"]') as HTMLInputElement, {
      target: { value: "Kickoff" },
    });

    expect(createButton).toBeEnabled();
  });

  it("opens the inline milestone creation form from the overview", () => {
    renderPage(createProps());

    fireEvent.click(document.querySelector('[data-test-id="add-template-milestone-overview"]')!);

    expect(document.querySelector('[data-test-id="add-milestone-form"]')).toBeInTheDocument();
    expect(screen.getByText("Create more")).toBeInTheDocument();
  });

  it("shows status management in the task header", () => {
    renderPage(createProps({ onStatusesChange: jest.fn() }), "/templates/template-1?tab=tasks");

    expect(screen.getByRole("button", { name: "Settings" })).toBeInTheDocument();
  });

  it("switches from list to board display mode", () => {
    renderPage(
      createProps({ onStatusesChange: jest.fn(), onTaskKanbanChange: jest.fn() }),
      "/templates/template-1?tab=tasks&taskDisplay=board",
    );

    expect(screen.getByText("Viewing tasks for")).toBeInTheDocument();
    expect(screen.getByText("All project tasks")).toBeInTheDocument();
    expect(document.querySelector('[data-test-id="template-kanban-board"]')).toBeInTheDocument();
    expect(document.querySelector('[data-test-id="template-task-section-milestone-1"]')).not.toBeInTheDocument();
    expect(document.querySelector('[data-test-id="display-menu-trigger"]')).toBeInTheDocument();
  });

  it("remembers board display mode in localStorage across remounts", async () => {
    const user = userEvent.setup();
    const props = createProps({ onStatusesChange: jest.fn(), onTaskKanbanChange: jest.fn() });
    const { unmount } = renderPage(props, "/templates/template-1?tab=tasks");

    await user.click(document.querySelector('[data-test-id="display-menu-trigger"]')!);
    await user.click(document.querySelector('[data-test-id="display-menu-option-board"]')!);

    expect(document.querySelector('[data-test-id="template-kanban-board"]')).toBeInTheDocument();
    expect(window.localStorage.getItem("templateTaskBoard:taskDisplayMode")).toBe(JSON.stringify("board"));

    unmount();
    renderPage(props, "/templates/template-1?tab=tasks");

    expect(document.querySelector('[data-test-id="template-kanban-board"]')).toBeInTheDocument();
    expect(document.querySelector('[data-test-id="template-task-section-milestone-1"]')).not.toBeInTheDocument();
  });

  it("links overview milestone titles to the milestone page", () => {
    renderPage(createProps());

    expect(screen.getByRole("link", { name: "Release" })).toHaveAttribute(
      "href",
      "/templates/template-1/milestones/milestone-1",
    );
  });

  it("opens an edit form from the overview edit button", async () => {
    const onMilestoneUpdate = jest.fn();
    renderPage(createProps({ onMilestoneUpdate }));

    fireEvent.click(document.querySelector('[data-test-id="edit-btn-release"]')!);
    fireEvent.change(document.querySelector('[data-test-id="edit-title-release-input"]')!, {
      target: { value: "Kickoff" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(onMilestoneUpdate).toHaveBeenCalledWith("milestone-1", {
      title: "Kickoff",
      dueOffsetDays: 14,
    });
  });

  it("does not show a list-level delete button for milestones", () => {
    renderPage(createProps({ onMilestoneDelete: jest.fn() }));

    expect(screen.queryByRole("button", { name: "Delete Release" })).not.toBeInTheDocument();
  });

  it("links task board milestone headers to the milestone page", () => {
    renderPage(createProps(), "/templates/template-1?tab=tasks");

    expect(screen.getByRole("link", { name: "Release" })).toHaveAttribute(
      "href",
      "/templates/template-1/milestones/milestone-1",
    );
  });

  it("preserves task IDs and relative offsets in update callbacks", () => {
    const onTaskUpdate = jest.fn();
    renderPage(createProps({ onTaskUpdate }), "/templates/template-1?tab=tasks");

    fireEvent.click(document.querySelector('[data-test-id="template-task-task-1-due-offset"] button')!);
    const input = document.querySelector('[data-test-id="template-task-task-1-due-offset-input"]') as HTMLInputElement;
    fireEvent.change(input, { target: { value: "18" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onTaskUpdate).toHaveBeenCalledWith("task-1", { dueOffsetDays: 18 });
  });

  it("hides an empty due date until hover and always shows the assignee, with due date first", () => {
    const emptyTask = {
      ...createProps().tasks[0]!,
      id: "task-empty",
      name: "Unscheduled task",
      dueOffsetDays: null,
      assignees: [],
    };

    renderPage(createProps({ tasks: [emptyTask] }), "/templates/template-1?tab=tasks");

    const row = document.querySelector('[data-test-id="template-task-task-empty"]');
    const dueOffset = document.querySelector('[data-test-id="template-task-task-empty-due-offset"]');
    const dueDateTrigger = dueOffset?.querySelector("button");
    const assignees = document.querySelector('[data-test-id="template-task-task-empty-assignees"]');

    expect(row).toHaveClass("group/task-row");
    expect(row?.querySelector(".hover\\:bg-surface-highlight")).toBeInTheDocument();
    expect(dueDateTrigger).toHaveClass("[&>span]:text-transparent");
    expect(dueDateTrigger).toHaveClass("sm:group-hover/task-row:[&>span]:text-content-dimmed");
    expect(assignees).toBeInTheDocument();
    expect(assignees?.parentElement).not.toHaveClass("opacity-0");
    expect(dueDateTrigger).toBeInTheDocument();
    expect(dueOffset!.compareDocumentPosition(assignees!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("keeps assigned people and due dates visible without hovering", () => {
    const champion: Types.TemplatePerson = {
      id: "template-person-1",
      person: { id: "person-1", fullName: "Ada Lovelace", avatarUrl: null },
      role: "contributor",
      responsibility: null,
      accessLevel: 70,
      active: true,
    };

    renderPage(
      createProps({ tasks: [{ ...createProps().tasks[0]!, assignees: [champion] }] }),
      "/templates/template-1?tab=tasks",
    );

    const dueOffset = document.querySelector('[data-test-id="template-task-task-1-due-offset"]');
    const dueDateTrigger = dueOffset?.querySelector("button");
    const assignees = document.querySelector('[data-test-id="template-task-task-1-assignees"]');

    expect(dueDateTrigger).toBeInTheDocument();
    expect(dueDateTrigger).not.toHaveClass("[&>span]:text-transparent");
    expect(assignees?.parentElement).not.toHaveClass("opacity-0");
  });

  it("shows assignees on the template task creation modal", () => {
    renderPage(createProps(), "/templates/template-1?tab=tasks");

    fireEvent.click(screen.getByText("New task"));

    expect(screen.getByText("Relative due date")).toBeInTheDocument();
    expect(screen.getByText("Milestone")).toBeInTheDocument();
    expect(screen.getByText("Assignees")).toBeInTheDocument();
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

    expect(screen.queryByRole("button", { name: "Add contributor" })).not.toBeInTheDocument();
  });

  it("excludes template people from Add contributor search", () => {
    HTMLElement.prototype.scrollIntoView = jest.fn();

    const champion: Types.TemplatePerson = {
      id: "template-person-champion",
      person: { id: "person-champion", fullName: "Ada Lovelace", avatarUrl: null },
      role: "champion",
      responsibility: null,
      accessLevel: 100,
      active: true,
    };
    const candidate = { id: "person-new", fullName: "Grace Hopper", avatarUrl: null };
    const personSearch = { people: [champion.person!, candidate], onSearch: async () => undefined };
    const contributorPersonSearch = { people: [candidate], onSearch: async () => undefined };

    renderPage(
      createProps({
        people: [champion],
        personSearch,
        contributorPersonSearch,
      }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Add contributor" }));
    fireEvent.click(screen.getByText("Select person"));

    expect(document.querySelector('[data-test-id="person-field-search-result-grace-hopper"]')).toBeInTheDocument();
    expect(document.querySelector('[data-test-id="person-field-search-result-ada-lovelace"]')).not.toBeInTheDocument();
  });

  it("filters contributors by the name typed in the person field", async () => {
    HTMLElement.prototype.scrollIntoView = jest.fn();

    const onSearch = jest.fn().mockResolvedValue(undefined);
    renderPage(
      createProps({
        people: [],
        contributorPersonSearch: {
          people: [{ id: "person-1", fullName: "Grace Hopper", avatarUrl: null }],
          onSearch,
        },
      }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Add contributor" }));
    fireEvent.click(screen.getByText("Select person"));
    fireEvent.change(screen.getByPlaceholderText("Search..."), { target: { value: "Grace" } });

    await waitFor(() => expect(onSearch).toHaveBeenLastCalledWith("Grace"));
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

    fireEvent.click(screen.getByRole("button", { name: "Add contributor" }));
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

  it("saves contributor access only when Save contributor is clicked", async () => {
    const contributor: Types.TemplatePerson = {
      id: "template-person-1",
      person: { id: "person-1", fullName: "Ada Lovelace", avatarUrl: null },
      role: "contributor",
      responsibility: null,
      accessLevel: 70,
      active: true,
    };
    const onPersonUpdate = jest.fn().mockResolvedValue(true);

    renderPage(createProps({ people: [contributor], onPersonUpdate }));

    HTMLElement.prototype.scrollIntoView = jest.fn();
    fireEvent.click(screen.getByText("Ada Lovelace"));
    fireEvent.click(screen.getByText("Edit contributor"));
    fireEvent.keyDown(document.querySelector('[data-test-id="template-contributor-access"]')!, { key: "Enter" });
    expect(screen.queryByText("No Access")).not.toBeInTheDocument();
    fireEvent.click(document.querySelector('[data-test-id="template-contributor-access-10"]')!);

    expect(screen.getByText("View Access")).toBeInTheDocument();
    expect(onPersonUpdate).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Save contributor" }));

    await waitFor(() => {
      expect(onPersonUpdate).toHaveBeenCalledWith(contributor.id, {
        person: contributor.person,
        responsibility: null,
        accessLevel: 10,
        role: "contributor",
      });
    });
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

function setupFileInputMock(files: File[]) {
  const originalCreateElement = document.createElement.bind(document);
  const createElementSpy = jest.spyOn(document, "createElement").mockImplementation((tagName, options) => {
    const element = originalCreateElement(tagName, options);

    if (tagName === "input") {
      jest.spyOn(element, "click").mockImplementation(() => {
        Object.defineProperty(element, "files", {
          configurable: true,
          value: files,
        });
        element.onchange?.({ target: element } as unknown as Event);
      });
    }

    return element;
  });

  return () => createElementSpy.mockRestore();
}

function createTwoTaskBoardProps(overrides: Partial<Types.Props> = {}): Types.Props {
  const first = createProps().tasks[0]!;
  const second = { ...first, id: "task-2", name: "Prepare screenshots", dueOffsetDays: 5 };

  return createProps({
    tasks: [first, second],
    milestones: [{ ...createProps().milestones[0]!, tasksOrderingState: ["task-1", "task-2"] }],
    ...overrides,
  });
}

function fireTaskKey(key: "j" | "k" | "a" | "s" | "d" | "Enter" | "Escape", keyCode: number) {
  fireEvent.keyDown(document, { key, keyCode, which: keyCode });
  fireEvent.keyUp(document, { key, keyCode, which: keyCode });
}

function taskIdsIn(milestoneId: string) {
  const section = document.querySelector(`[data-test-id="template-task-section-${milestoneId}"]`);
  if (!section) throw new Error(`Missing task section for ${milestoneId}`);

  return Array.from(section.querySelectorAll("[data-task-row-id]")).map((row) => row.getAttribute("data-task-row-id"));
}
