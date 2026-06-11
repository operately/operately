import * as React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";

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

import { ResourceHubFolderPage } from "./index";
import {
  createMockFolder,
  createMockPermissions,
  createMockResourceHub,
  useMockSharedListPageProps,
} from "../ResourceHubPage/mockData";

function ResourceHubFolderPageHarness({
  canRenameFolder,
}: {
  canRenameFolder: boolean;
}) {
  const [resourceHub] = React.useState(() => createMockResourceHub());
  const [folder, setFolder] = React.useState(() =>
    createMockFolder({
      resourceHubId: resourceHub.id,
      resourceHub,
      permissions: createMockPermissions({
        canRenameFolder,
      }),
      pathToFolder: [{ id: "parent-folder", name: "People Ops", resourceHubId: resourceHub.id, resourceHub }],
    }),
  );
  const [nodes] = React.useState<React.ComponentProps<typeof ResourceHubFolderPage>["nodesListProps"]["nodes"]>([]);
  const sharedProps = useMockSharedListPageProps({
    parent: folder,
    parentType: "folder",
    nodes,
  });

  return (
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ResourceHubFolderPage
        {...sharedProps}
        title={folder.name ?? "Folder"}
        folder={folder}
        renameFolder={{
          onRename: async (_id, name) => {
            setFolder((current) => ({ ...current, name }));
          },
          onSave: () => undefined,
        }}
      />
    </MemoryRouter>
  );
}

describe("ResourceHubFolderPage", () => {
  test("does not render drafts and exposes rename when permitted", () => {
    const { container } = render(<ResourceHubFolderPageHarness canRenameFolder />);

    expect(screen.queryByText(/Continue writing your draft/i)).not.toBeInTheDocument();
    expect(container.querySelector('[data-test-id="page-options-trigger"]')).toBeInTheDocument();
  });

  test("hides rename when the folder cannot be renamed", () => {
    const { container } = render(<ResourceHubFolderPageHarness canRenameFolder={false} />);

    expect(container.querySelector('[data-test-id="page-options-trigger"]')).not.toBeInTheDocument();
    expect(screen.queryByText(/Continue writing your draft/i)).not.toBeInTheDocument();
  });
});
