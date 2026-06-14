import * as React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

import { AddFolderModal } from "./AddFolderModal";
import { ResourceHubNodesListProvider, type ResourceHubNodesListContextValue } from "./contexts/NodesListContext";
import { NewFileModalsProvider, type NewFileModalsContextValue } from "./contexts/NewFileModalsContext";
import { CopyDocumentModalWrapper } from "./nodeMenus/CopyDocumentModal";
import { RenameFolderModal } from "./nodeMenus/FolderMenu";
import { MoveResourceModal } from "./nodeMenus/MoveResource";
import type { ResourceHubDocument, ResourceHubFolder } from "./types";

jest.mock("../icons", () => {
  const HiddenIcon = (props: React.ComponentProps<"span">) => <span {...props} />;

  return {
    IconArrowLeft: HiddenIcon,
    IconX: HiddenIcon,
  };
});

jest.mock("react-spinners", () => ({
  BeatLoader: () => <span aria-hidden="true" />,
  PuffLoader: () => <span aria-hidden="true" />,
}));

jest.mock("./NodeIcon", () => ({
  NodeIcon: ({ node }: { node: { name?: string | null } }) => <span>{node.name}</span>,
}));

const resourceHub = { id: "hub-1", name: "Hub" };

const parentFolder = {
  id: "folder-parent",
  resourceHubId: resourceHub.id,
  name: "Current Folder",
  pathToFolder: [],
  resourceHub,
} as ResourceHubFolder;

const folderToRename = {
  id: "folder-rename",
  resourceHubId: resourceHub.id,
  name: "Plans",
} as ResourceHubFolder;

const documentToCopy = {
  id: "document-1",
  resourceHubId: resourceHub.id,
  name: "Quarterly Plan",
  content: "{\"type\":\"doc\",\"content\":[]}",
  state: "published",
} as ResourceHubDocument;

const documentToMove = {
  id: "document-2",
  resourceHubId: resourceHub.id,
  parentFolderId: parentFolder.id,
  name: "Roadmap",
  content: "{\"type\":\"doc\",\"content\":[]}",
  state: "published",
} as ResourceHubDocument;

function buildNewFileModalsValue(
  overrides: Partial<NewFileModalsContextValue> = {},
): NewFileModalsContextValue {
  return {
    showAddFolder: true,
    toggleShowAddFolder: () => undefined,
    navigateToNewDocument: () => undefined,
    navigateToNewLink: () => undefined,
    files: undefined,
    setFiles: () => undefined,
    selectFiles: () => undefined,
    filesSelected: false,
    ...overrides,
  };
}

describe("resource hub modal forms", () => {
  test("AddFolderModal validates and creates a folder", async () => {
    const onCreateFolder = jest.fn().mockResolvedValue(undefined);
    const onCreated = jest.fn();
    const toggleShowAddFolder = jest.fn();

    render(
      <NewFileModalsProvider value={buildNewFileModalsValue({ toggleShowAddFolder })}>
        <AddFolderModal
          resourceHubId={resourceHub.id}
          folderId={parentFolder.id}
          onCreated={onCreated}
          onCreateFolder={onCreateFolder}
        />
      </NewFileModalsProvider>,
    );

    fireEvent.click(await screen.findByRole("button", { name: "Save" }));

    expect(await screen.findByText("Name is required")).toBeInTheDocument();
    expect(onCreateFolder).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Monthly Reports" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(onCreateFolder).toHaveBeenCalledWith({
        resourceHubId: resourceHub.id,
        folderId: parentFolder.id,
        name: "Monthly Reports",
      }),
    );
    expect(onCreated).toHaveBeenCalledTimes(1);
    expect(toggleShowAddFolder).toHaveBeenCalledTimes(1);
  });

  test("RenameFolderModal validates and renames the folder", async () => {
    const onRename = jest.fn().mockResolvedValue(undefined);
    const onSave = jest.fn();
    const toggleForm = jest.fn();

    render(
      <RenameFolderModal
        folder={folderToRename}
        showForm
        toggleForm={toggleForm}
        onSave={onSave}
        onRename={onRename}
      />,
    );

    const nameInput = await screen.findByLabelText("Name");

    fireEvent.change(nameInput, { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Name is required")).toBeInTheDocument();
    expect(onRename).not.toHaveBeenCalled();

    fireEvent.change(nameInput, { target: { value: "Archived Plans" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(onRename).toHaveBeenCalledWith(folderToRename.id, "Archived Plans"));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(toggleForm).toHaveBeenCalledTimes(1);
  });

  test("CopyDocumentModalWrapper validates the new name and submits with the selected location", async () => {
    const copyDocument = jest.fn().mockResolvedValue(undefined);
    const hideModal = jest.fn();
    const listContext: ResourceHubNodesListContextValue = {
      parent: { id: resourceHub.id, name: resourceHub.name, type: "resource_hub", resourceHubId: resourceHub.id },
      folderSelect: {
        loadFolder: jest.fn(),
        loadResourceHub: jest.fn().mockResolvedValue({
          current: { type: "resourceHub", resourceHub },
          nodes: [],
        }),
        compareIds: (a, b) => a === b,
      },
      actions: { copyDocument },
    };

    render(
      <CopyDocumentModalWrapper
        listContext={listContext}
        document={documentToCopy}
        isOpen
        hideModal={hideModal}
      />,
    );

    await waitFor(() =>
      expect(document.querySelector('[data-test-id="folder-select-current-hub-1"]')).toBeInTheDocument(),
    );

    const nameInput = screen.getByRole("textbox", { name: /New document name/i });

    fireEvent.change(nameInput, { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Create Copy" }));

    expect(await screen.findByText("Can't be empty")).toBeInTheDocument();
    expect(copyDocument).not.toHaveBeenCalled();

    fireEvent.change(nameInput, { target: { value: "Quarterly Plan Duplicate" } });
    fireEvent.click(screen.getByRole("button", { name: "Create Copy" }));

    await waitFor(() =>
      expect(copyDocument).toHaveBeenCalledWith({
        documentId: documentToCopy.id,
        name: "Quarterly Plan Duplicate",
        content: documentToCopy.content,
        resourceHubId: documentToCopy.resourceHubId,
        location: { id: resourceHub.id, type: "resourceHub" },
      }),
    );
    expect(hideModal).toHaveBeenCalledTimes(1);
  });

  test("MoveResourceModal submits the new destination with TurboUI folder selection", async () => {
    const moveResource = jest.fn().mockResolvedValue(undefined);
    const onRefetch = jest.fn();
    const hideModal = jest.fn();
    const loadFolder = jest.fn().mockResolvedValue({
      current: { type: "folder", folder: parentFolder },
      nodes: [],
    });
    const loadResourceHub = jest.fn().mockResolvedValue({
      current: { type: "resourceHub", resourceHub },
      nodes: [],
    });
    const listContext: ResourceHubNodesListContextValue = {
      parent: {
        id: parentFolder.id,
        name: parentFolder.name ?? "",
        type: "folder",
        resourceHubId: resourceHub.id,
      },
      folderSelect: {
        loadFolder,
        loadResourceHub,
        compareIds: (a, b) => a === b,
      },
      onRefetch,
      actions: { moveResource },
    };

    render(
      <ResourceHubNodesListProvider value={listContext}>
        <MoveResourceModal resource={documentToMove} resourceType="document" isOpen hideModal={hideModal} />
      </ResourceHubNodesListProvider>,
    );

    await waitFor(() =>
      expect(document.querySelector('[data-test-id="folder-select-current-folder-parent"]')).toBeInTheDocument(),
    );

    fireEvent.click(document.querySelector('[data-test-id="folder-select-go-back"]') as Element);

    await waitFor(() =>
      expect(document.querySelector('[data-test-id="folder-select-current-hub-1"]')).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByRole("button", { name: "Move Here" }));

    await waitFor(() =>
      expect(moveResource).toHaveBeenCalledWith({
        resourceId: documentToMove.id,
        resourceType: "document",
        newFolderId: null,
      }),
    );
    expect(onRefetch).toHaveBeenCalledTimes(1);
    expect(hideModal).toHaveBeenCalledTimes(1);
  });
});
