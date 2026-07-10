import * as React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router";

jest.mock("../icons", () => ({
  IconCheck: () => <span>check</span>,
  IconChevronDown: () => <span>chevron-down</span>,
  IconChevronRight: () => <span>chevron-right</span>,
  IconDots: () => <span>menu-dots</span>,
  IconEdit: () => <span>edit</span>,
  IconFile: () => <span>file</span>,
  IconFolderFilled: () => <span>folder</span>,
  IconLink: () => <span>link</span>,
  IconSlash: () => <span>slash</span>,
  IconUpload: () => <span>upload</span>,
  IconX: () => <span>close</span>,
}));

import { ResourceHubPage } from "./index";
import {
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
}: {
  initialNodes?: React.ComponentProps<typeof ResourceHubPage>["nodesListProps"]["nodes"];
  openAddFolderOnMount?: boolean;
}) {
  const hasOpenedAddFolderRef = React.useRef(false);
  const [resourceHub] = React.useState(() =>
    createMockResourceHub({
      permissions: createMockPermissions({
        canCreateDocument: false,
        canCreateFile: false,
        canCreateLink: false,
        canCreateFolder: true,
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
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ResourceHubPage
        {...sharedProps}
        title={resourceHub.name ?? "Resource Hub"}
        resourceHub={resourceHub}
        drafts={{
          nodes: [createMockDraftNode()],
          draftsPath: `/resource-hubs/${resourceHub.id}/drafts`,
          getDraftEditPath: (node) => `/resource-hubs/documents/${node.document?.id}/edit`,
        }}
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
});
