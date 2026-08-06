import * as React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router";

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

import { ResourceHubPage } from "./index";
import {
  createMockDocumentNode,
  createMockDraftNode,
  createMockFolder,
  createMockFolderNode,
  createMockPermissions,
  createMockResourceHub,
  useMockSharedListPageProps,
} from "./mockData";

function ResourceHubPageHarness({
  initialNodes = [],
  openAddFolderOnMount = false,
  showSearch = false,
  search,
}: {
  initialNodes?: React.ComponentProps<typeof ResourceHubPage>["nodesListProps"]["nodes"];
  openAddFolderOnMount?: boolean;
  showSearch?: boolean;
  search?: ResourceHubPage.SearchFn;
}) {
  const hasOpenedAddFolderRef = React.useRef(false);
  const [resourceHub] = React.useState(() =>
    createMockResourceHub({
      permissions: createMockPermissions({
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

  return (
    <MemoryRouter>
      <ResourceHubPage
        {...sharedProps}
        title={resourceHub.name ?? "Resource Hub"}
        resourceHub={resourceHub}
        drafts={{
          nodes: [createMockDraftNode()],
          draftsPath: `/resource-hubs/${resourceHub.id}/drafts`,
          getDraftEditPath: (node) => `/resource-hubs/documents/${node.document?.id}/edit`,
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
  test("renders navigation, header, drafts, and nodes", () => {
    render(<ResourceHubPageHarness />);

    expect(screen.getByText("Operations")).toBeInTheDocument();
    expect(screen.getByText("Engineering Handbook")).toBeInTheDocument();
    expect(screen.getByText("Continue writing your draft document…")).toBeInTheDocument();
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
    expect(screen.getByText("Bob Williams")).toBeInTheDocument();
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
