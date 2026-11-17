import * as React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router";
import userEvent from "@testing-library/user-event";

jest.mock("../icons", () => ({
  IconAlignJustified: () => <span>document</span>,
  IconChartColumn: () => <span>chart</span>,
  IconCheck: () => <span>check</span>,
  IconChevronDown: () => <span>chevron-down</span>,
  IconChevronRight: () => <span>chevron-right</span>,
  IconDots: () => <span>menu-dots</span>,
  IconEdit: () => <span>edit</span>,
  IconFile: () => <span>file</span>,
  IconFolderFilled: () => <span>folder</span>,
  IconLink: () => <span>link</span>,
  IconLogs: () => <span>file</span>,
  IconSearch: () => <span>search</span>,
  IconSlash: () => <span>slash</span>,
  IconUpload: () => <span>upload</span>,
  IconVideo: () => <span>video</span>,
  IconX: () => <span>close</span>,
}));

jest.mock("../RichEditor", () => ({
  Editor: () => <div data-testid="rich-editor" />,
  useEditor: () => ({
    editor: { commands: { setContent: jest.fn() }, getJSON: () => null },
    localDraftRestored: false,
    clearLocalDraft: jest.fn(),
  }),
}));

import { ResourceHubPage } from "./index";
import { i18n, setupTestCatalog } from "../../test/i18n";
import {
  createMockDocumentNode,
  createMockDraftNode,
  createMockFolder,
  createMockFolderNode,
  createMockPermissions,
  createMockResourceHub,
  useMockSharedListPageProps,
} from "./mockData";

setupTestCatalog();

function ResourceHubPageHarness({
  initialName = "Engineering Handbook",
  initialNodes = [],
  openAddFolderOnMount = false,
  selectedUploadFile,
  showSearch = false,
  search,
  canRename = false,
  parentType = "space",
  onRename,
}: {
  initialName?: string;
  initialNodes?: React.ComponentProps<typeof ResourceHubPage>["nodesListProps"]["nodes"];
  openAddFolderOnMount?: boolean;
  selectedUploadFile?: File;
  showSearch?: boolean;
  search?: ResourceHubPage.SearchFn;
  canRename?: boolean;
  parentType?: "space" | "project" | "goal" | "template";
  onRename?: (id: string, name: string) => Promise<void>;
}) {
  const hasOpenedAddFolderRef = React.useRef(false);
  const hasSelectedUploadFileRef = React.useRef(false);
  const [resourceHub, setResourceHub] = React.useState(() =>
    createMockResourceHub({
      name: initialName,
      project:
        parentType === "project" || parentType === "template"
          ? {
              __typename: "project",
              id: "project-1",
              name: "Project",
              status: "active",
              successStatus: "achieved",
              spaceId: "space-1",
              goalId: "goal-1",
            }
          : null,
      goal: parentType === "goal" ? { __typename: "goal", id: "goal-1", name: "Goal", status: "on_track" } : null,
      permissions: createMockPermissions({
        canRenameHub: canRename,
        canCreateDocument: false,
        canCreateFile: false,
        canCreateLink: false,
        canCreateFolder: true,
        canEditDocument: true,
      }),
    }),
  );
  const [nodes, setNodes] = React.useState(initialNodes);
  const sharedProps = useMockSharedListPageProps({
    parent: resourceHub,
    parentType: "resource_hub",
    nodes,
    onCreateFolder: async ({ name }) => {
      setNodes((current) => [
        ...current,
        createMockFolderNode({
          name,
          folder: createMockFolder({
            id: `folder-${current.length + 1}`,
            resourceHubId: resourceHub.id,
            resourceHub,
            name,
          }),
        }),
      ]);
    },
  });

  React.useEffect(() => {
    if (!openAddFolderOnMount || hasOpenedAddFolderRef.current) {
      return;
    }

    hasOpenedAddFolderRef.current = true;
    sharedProps.newFileModals.toggleShowAddFolder();
  }, [openAddFolderOnMount, sharedProps.newFileModals]);

  React.useEffect(() => {
    if (!selectedUploadFile || hasSelectedUploadFileRef.current) {
      return;
    }

    hasSelectedUploadFileRef.current = true;
    sharedProps.newFileModals.setFiles([selectedUploadFile]);
  }, [selectedUploadFile, sharedProps.newFileModals]);

  return (
    <MemoryRouter>
      <ResourceHubPage
        {...sharedProps}
        title={resourceHub.name ?? "Resource Hub"}
        resourceHub={resourceHub}
        renameCollection={async (id, name) => {
          await onRename?.(id, name);
          setResourceHub((current) => ({ ...current, name }));
        }}
        drafts={{
          nodes: [createMockDraftNode()],
          draftsPath: `/resource-hubs/${resourceHub.id}/drafts`,
        }}
        search={
          showSearch
            ? {
                search: search ?? (async () => []),
                placeholder: "Search documents and files…",
                testId: "resource-hub-search",
              }
            : undefined
        }
      />
    </MemoryRouter>
  );
}

describe("ResourceHubPage", () => {
  function control(id: string): HTMLElement {
    const element = document.querySelector<HTMLElement>(`[data-test-id="${id}"]`);
    if (!element) throw new Error(`Missing control: ${id}`);
    return element;
  }

  async function openRename() {
    const user = userEvent.setup();
    await user.click(control("options-button"));
    await user.click(control("rename-collection"));
  }

  test("translates the default heading and browser title when the language changes", async () => {
    render(<ResourceHubPageHarness initialName="Documents & Files" />);
    expect(screen.getByText("Documents & Files")).toBeInTheDocument();

    await act(async () => {
      await i18n.changeLanguage("pt-BR");
    });

    expect(screen.getByText("Docs & Arquivos")).toBeInTheDocument();
    expect(document.title).toContain("Docs & Arquivos");
    expect(screen.queryByText("Documents & Files")).not.toBeInTheDocument();
  });

  test("preserves custom collection names that match translation keys", async () => {
    await i18n.changeLanguage("pt-BR");
    render(<ResourceHubPageHarness initialName="Save" />);

    expect(screen.getByText("Save")).toBeInTheDocument();
    expect(document.title).toContain("Save");
  });

  test("renames an empty collection with a trimmed name and updates the heading and title", async () => {
    const onRename = jest.fn().mockResolvedValue(undefined);
    render(<ResourceHubPageHarness canRename onRename={onRename} />);
    await openRename();
    expect(control("new-collection-name")).toHaveValue("Engineering Handbook");
    fireEvent.change(control("new-collection-name"), { target: { value: "  Team library  " } });
    fireEvent.click(control("save-collection-name"));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(onRename).toHaveBeenCalledTimes(1);
    expect(onRename).toHaveBeenCalledWith("hub-1", "Team library");
    expect(screen.getByText("Team library")).toBeInTheDocument();
    expect(document.title).toContain("Team library");
    await openRename();
    expect(control("new-collection-name")).toHaveValue("Team library");
  });

  test("cancel and unchanged normalized submissions preserve the saved name", async () => {
    const onRename = jest.fn();
    render(<ResourceHubPageHarness canRename onRename={onRename} />);
    await openRename();
    fireEvent.change(control("new-collection-name"), { target: { value: "Draft" } });
    fireEvent.click(control("cancel"));
    await openRename();
    expect(control("new-collection-name")).toHaveValue("Engineering Handbook");
    fireEvent.change(control("new-collection-name"), { target: { value: "  Engineering Handbook  " } });
    fireEvent.click(control("save-collection-name"));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(onRename).not.toHaveBeenCalled();
  });

  test("rejects whitespace and preserves an editable draft after failure", async () => {
    const onRename = jest.fn().mockRejectedValueOnce(new Error("Offline")).mockResolvedValue(undefined);
    render(<ResourceHubPageHarness canRename onRename={onRename} />);
    await openRename();
    fireEvent.change(control("new-collection-name"), { target: { value: "  " } });
    fireEvent.click(control("save-collection-name"));
    await waitFor(() => expect(control("new-collection-name")).toHaveAttribute("aria-invalid", "true"));
    expect(onRename).not.toHaveBeenCalled();
    fireEvent.change(control("new-collection-name"), { target: { value: "Draft" } });
    fireEvent.click(control("save-collection-name"));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(control("new-collection-name")).toHaveValue("Draft");
    expect(control("new-collection-name")).toBeEnabled();
    expect(screen.getByText("Engineering Handbook")).toBeInTheDocument();
    fireEvent.click(control("save-collection-name"));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByText("Draft")).toBeInTheDocument();
  });

  test("cancel during a pending save preserves the draft after failure", async () => {
    let fail = (_error: Error) => {};
    const onRename = jest.fn(
      () =>
        new Promise<void>((_resolve, reject) => {
          fail = reject;
        }),
    );
    render(<ResourceHubPageHarness canRename onRename={onRename} />);
    await openRename();
    fireEvent.change(control("new-collection-name"), { target: { value: "Draft" } });
    fireEvent.click(control("save-collection-name"));
    fireEvent.click(control("cancel"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(control("new-collection-name")).toHaveValue("Draft");
    expect(control("save-collection-name")).toBeDisabled();
    await act(async () => fail(new Error("Offline")));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(control("new-collection-name")).toHaveValue("Draft");
    expect(control("new-collection-name")).toBeEnabled();
    expect(control("cancel")).toBeEnabled();
    fireEvent.click(control("cancel"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(onRename).toHaveBeenCalledTimes(1);
  });

  test("prevents duplicate submissions while saving", async () => {
    let finish = () => {};
    const onRename = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    render(<ResourceHubPageHarness canRename onRename={onRename} />);
    await openRename();
    fireEvent.change(control("new-collection-name"), { target: { value: "New name" } });
    fireEvent.click(control("save-collection-name"));
    fireEvent.click(control("save-collection-name"));
    expect(control("save-collection-name")).toBeDisabled();
    expect(onRename).toHaveBeenCalledTimes(1);
    await act(async () => finish());
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  test.each(["project", "goal", "template"] as const)(
    "hides renaming for a %s collection despite space context",
    (parentType) => {
      render(<ResourceHubPageHarness canRename parentType={parentType} />);
      expect(document.querySelector('[data-test-id="options-button"]')).not.toBeInTheDocument();
    },
  );

  test("hides renaming without the dedicated permission", () => {
    render(<ResourceHubPageHarness />);
    expect(document.querySelector('[data-test-id="options-button"]')).not.toBeInTheDocument();
  });

  test("renders navigation, header, drafts, and nodes", () => {
    render(<ResourceHubPageHarness />);

    expect(screen.getByText("Operations")).toBeInTheDocument();
    expect(screen.getByText("Engineering Handbook")).toBeInTheDocument();
    expect(screen.getByText("Your drafts (1)")).toBeInTheDocument();
    expect(screen.getByText("Ready for your first document")).toBeInTheDocument();
  });

  test("creates a folder through the add-folder modal", async () => {
    render(<ResourceHubPageHarness openAddFolderOnMount />);

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Monthly Reviews" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(screen.getByText("Monthly Reviews")).toBeInTheDocument();
    });
  });

  test("renders inline search before the sort control", () => {
    render(<ResourceHubPageHarness showSearch initialNodes={[createMockDocumentNode()]} />);

    const searchInput = screen.getByRole("searchbox", { name: "Search documents and files…" });
    const sortControl = screen.getByRole("button", { name: /Sort by/ });

    expect(searchInput).toHaveAttribute("type", "text");
    expect(searchInput.compareDocumentPosition(sortControl) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  test("keeps search and sort above the file upload form", async () => {
    render(
      <ResourceHubPageHarness
        showSearch
        initialNodes={[createMockDocumentNode()]}
        selectedUploadFile={new File(["notes"], "Roadmap.pdf", { type: "application/pdf" })}
      />,
    );

    const searchInput = screen.getByRole("searchbox", { name: "Search documents and files…" });
    const sortControl = screen.getByRole("button", { name: /Sort by/ });
    const uploadForm = await screen.findByDisplayValue("Roadmap");
    const saveButton = screen.getByRole("button", { name: "Save" });

    expect(searchInput.compareDocumentPosition(sortControl) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(sortControl.compareDocumentPosition(uploadForm) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(uploadForm.compareDocumentPosition(saveButton) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  test("disables sorting while search is active", () => {
    render(<ResourceHubPageHarness showSearch initialNodes={[createMockDocumentNode()]} />);

    const searchInput = screen.getByRole("searchbox", { name: "Search documents and files…" });

    expect(screen.getByRole("button", { name: /Sort by/ })).toBeEnabled();

    fireEvent.change(searchInput, { target: { value: "do" } });
    const disabledSortControl = screen.getByRole("button", { name: /Sort by/ });

    expect(disabledSortControl).toBeDisabled();
    expect(disabledSortControl).not.toHaveAttribute("aria-haspopup");

    fireEvent.pointerDown(disabledSortControl, { button: 0, ctrlKey: false });
    expect(screen.queryByText("Creation Date")).not.toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: "" } });
    expect(screen.getByRole("button", { name: /Sort by/ })).toBeEnabled();
  });

  test("debounces search, replaces the normal nodes, and restores them when cleared", async () => {
    const originalNode = createMockDocumentNode({
      id: "original-node",
      name: "Quarterly planning notes",
      document: { id: "original-document", name: "Quarterly planning notes" },
    });
    const matchingNode = createMockDocumentNode({
      id: "matching-node",
      name: "Approval workflow",
      document: {
        id: "matching-document",
        name: "Approval workflow",
        content: JSON.stringify({
          type: "doc",
          content: [{ type: "paragraph", content: [{ type: "text", text: "Matching workflow details" }] }],
        }),
      },
    });
    const search = jest.fn().mockResolvedValue([matchingNode]);

    render(<ResourceHubPageHarness showSearch initialNodes={[originalNode]} search={search} />);

    const searchInput = screen.getByRole("searchbox", { name: "Search documents and files…" });
    fireEvent.change(searchInput, { target: { value: "approval" } });

    expect(search).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(search).toHaveBeenCalledWith({ query: "approval" });
    });

    expect(await screen.findByText("Approval workflow")).toBeInTheDocument();
    expect(screen.getByText("Bob W.")).toBeInTheDocument();
    expect(screen.getByText(/Matching workflow details/)).toBeInTheDocument();
    expect(screen.getByText("menu-dots")).toBeInTheDocument();
    expect(screen.queryByText("Quarterly planning notes")).not.toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: "" } });

    expect(screen.getByText("Quarterly planning notes")).toBeInTheDocument();
    expect(screen.queryByText("Approval workflow")).not.toBeInTheDocument();
  });

  test("shows a dedicated message when search returns no matches", async () => {
    render(
      <ResourceHubPageHarness
        showSearch
        initialNodes={[createMockDocumentNode()]}
        search={jest.fn().mockResolvedValue([])}
      />,
    );

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "missing" } });

    expect(await screen.findByText("No matching items. Try different keywords.")).toBeInTheDocument();
  });

  test("ignores results from an older query that finishes later", async () => {
    const resolvers = new Map<
      string,
      (results: React.ComponentProps<typeof ResourceHubPage>["nodesListProps"]["nodes"]) => void
    >();
    const search = jest.fn(
      ({ query }: { query: string }) =>
        new Promise<React.ComponentProps<typeof ResourceHubPage>["nodesListProps"]["nodes"]>((resolve) => {
          resolvers.set(query, resolve);
        }),
    );

    render(<ResourceHubPageHarness showSearch initialNodes={[createMockDocumentNode()]} search={search} />);

    const searchInput = screen.getByRole("searchbox");
    fireEvent.change(searchInput, { target: { value: "first" } });
    await waitFor(() => expect(search).toHaveBeenCalledWith({ query: "first" }));

    fireEvent.change(searchInput, { target: { value: "second" } });
    await waitFor(() => expect(search).toHaveBeenCalledWith({ query: "second" }));

    const secondResult = createMockDocumentNode({
      id: "second-node",
      name: "Second result",
      document: { id: "second-document", name: "Second result" },
    });

    await act(async () => {
      resolvers.get("second")?.([secondResult]);
    });

    expect(await screen.findByText("Second result")).toBeInTheDocument();

    const firstResult = createMockDocumentNode({
      id: "first-node",
      name: "Stale first result",
      document: { id: "first-document", name: "Stale first result" },
    });

    await act(async () => {
      resolvers.get("first")?.([firstResult]);
    });

    expect(screen.getByText("Second result")).toBeInTheDocument();
    expect(screen.queryByText("Stale first result")).not.toBeInTheDocument();
  });
});
