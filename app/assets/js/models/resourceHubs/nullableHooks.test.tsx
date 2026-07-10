import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { useAddFileWidgetProps } from "./useAddFileWidgetProps";
import { useNewFileModalsContextValue } from "./useNewFileModalsContextValue";
import { useResourceHubNodesListProps } from "./useResourceHubNodesListProps";

const mockNavigate = jest.fn();
const mockCreateFile = jest.fn();

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: () => mockNavigate,
}));

jest.mock("turboui", () => ({
  ...jest.requireActual("turboui"),
  useAddFile: () => ({
    files: undefined,
    setFiles: jest.fn(),
    selectFiles: jest.fn(),
    filesSelected: false,
  }),
  sortNodesWithFoldersFirst: (nodes: unknown[]) => nodes,
}));

jest.mock("@/contexts/CurrentCompanyContext", () => ({
  useMe: () => ({ id: "person-1" }),
}));

jest.mock("@/hooks/useRichEditorHandlers", () => ({
  useRichEditorHandlers: () => ({
    mentionedPersonLookup: jest.fn(),
    peopleSearch: jest.fn(),
    uploadFile: jest.fn(),
  }),
}));

jest.mock("@/routes/paths", () => ({
  compareIds: (a?: string | null, b?: string | null) => Boolean(a && b && a === b),
  usePaths: () => ({
    resourceHubNewDocumentPath: (id: string, folderId?: string) =>
      `/resource-hubs/${id}/documents/new${folderId ? `?folderId=${folderId}` : ""}`,
    resourceHubNewLinkPath: (id: string) => `/resource-hubs/${id}/links/new`,
    resourceHubEditDocumentPath: (id: string) => `/resource-hubs/documents/${id}/edit`,
    resourceHubEditFilePath: (id: string) => `/resource-hubs/files/${id}/edit`,
    resourceHubEditLinkPath: (id: string) => `/resource-hubs/links/${id}/edit`,
    resourceHubDocumentPath: (id: string) => `/resource-hubs/documents/${id}`,
    resourceHubFolderPath: (id: string) => `/resource-hubs/folders/${id}`,
  }),
}));

jest.mock("@/models/resourceHubs", () => ({
  documents: {
    useDelete: () => [jest.fn()],
    useCreate: () => [jest.fn()],
  },
  files: {
    useDelete: () => [jest.fn()],
    create: (...args: unknown[]) => mockCreateFile(...args),
  },
  folders: {
    get: jest.fn(),
    useDelete: () => [jest.fn()],
    useRename: () => [jest.fn()],
    useCopy: () => [jest.fn()],
  },
  links: {
    useDelete: () => [jest.fn()],
  },
  resource_hubs: {
    get: jest.fn(),
    useUpdateParentFolder: () => [jest.fn()],
  },
}));

function NullHooksHarness() {
  const newFileModals = useNewFileModalsContextValue({ resourceHub: null });
  const addFileWidgetProps = useAddFileWidgetProps({ resourceHub: null, onUploaded: () => undefined });
  const nodesListProps = useResourceHubNodesListProps(null);

  newFileModals.navigateToNewDocument();
  newFileModals.navigateToNewLink();
  void addFileWidgetProps.onUpload([], () => undefined);

  return (
    <>
      <div data-testid="subscribers">{addFileWidgetProps.subscriptions.subscribers.length}</div>
      <div data-testid="nodes">{nodesListProps.nodes.length}</div>
      <div data-testid="empty-variant">{nodesListProps.emptyVariant}</div>
      <div data-testid="permissions">{String(nodesListProps.listContext.permissions)}</div>
    </>
  );
}

describe("resource hub nullable hooks", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockCreateFile.mockReset();
  });

  test("return inert values when resource hub data is unavailable", () => {
    const html = renderToStaticMarkup(<NullHooksHarness />);

    expect(html).toContain('data-testid="subscribers">0<');
    expect(html).toContain('data-testid="nodes">0<');
    expect(html).toContain('data-testid="empty-variant">hub<');
    expect(html).toContain('data-testid="permissions">null<');
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(mockCreateFile).not.toHaveBeenCalled();
  });
});
