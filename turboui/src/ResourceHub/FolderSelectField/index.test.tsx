import * as React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

import * as Forms from "../../Forms";
import {
  createMockDocumentNode,
  createMockFolder,
  createMockFolderNode,
  createMockResourceHub,
} from "../../ResourceHubPage/mockData";
import { ResourceHubNodesListProvider, type ResourceHubNodesListContextValue } from "../contexts/NodesListContext";
import { ResourceHubFolderSelectField } from ".";

jest.mock("../NodeIcon", () => ({
  NodeIcon: ({ node }: { node: { name?: string | null } }) => <span>{node.name}</span>,
}));

jest.mock("../../icons", () => ({
  IconArrowLeft: (props: React.ComponentProps<"span">) => <span {...props} />,
}));

const resourceHub = createMockResourceHub({ id: "hub-1", name: "Hub" });

const folderNode = createMockFolderNode({
  id: "node-folder-1",
  name: "Plans",
  folder: {
    id: "folder-1",
    resourceHubId: resourceHub.id,
    name: "Plans",
    pathToFolder: [],
    resourceHub,
  },
});

const documentNode = createMockDocumentNode({
  id: "node-doc-1",
  name: "Spec Doc",
  document: {
    id: "doc-1",
    resourceHubId: resourceHub.id,
    parentFolderId: "folder-1",
    name: "Spec Doc",
    content: '{"type":"doc","content":[]}',
    state: "published",
  },
});

describe("ResourceHubFolderSelectField", () => {
  test("loads raw folder/resource hub results and navigates into folders", async () => {
    const loadResourceHub = jest.fn().mockResolvedValue({
      current: { type: "resourceHub", resourceHub },
      nodes: [folderNode, documentNode],
    });
    const loadFolder = jest.fn().mockResolvedValue({
      current: {
        type: "folder",
        folder: createMockFolder({
          id: "folder-1",
          resourceHubId: resourceHub.id,
          name: "Plans",
          pathToFolder: [],
          resourceHub,
        }),
      },
      nodes: [],
    });

    const listContext: ResourceHubNodesListContextValue = {
      parent: { id: "hub-1", name: "Hub", type: "resource_hub", resourceHubId: "hub-1" },
      folderSelect: {
        loadFolder,
        loadResourceHub,
        compareIds: (a, b) => a === b,
      },
      actions: {},
    };

    function Harness() {
      const form = Forms.useForm({
        fields: {
          location: { id: "hub-1", type: "resourceHub" as const },
        },
        submit: async () => undefined,
      });

      return (
        <Forms.Form form={form}>
          <ResourceHubNodesListProvider value={listContext}>
            <ResourceHubFolderSelectField label="Location" field="location" />
          </ResourceHubNodesListProvider>
        </Forms.Form>
      );
    }

    const { container } = render(<Harness />);

    await waitFor(() =>
      expect(container.querySelector('[data-test-id="folder-select-current-hub-1"]')).toBeInTheDocument(),
    );

    fireEvent.click(container.querySelector('[data-test-id="folder-select-node-folder-1"]') as Element);

    await waitFor(() => expect(loadFolder).toHaveBeenCalledWith("folder-1"));
    await waitFor(() =>
      expect(container.querySelector('[data-test-id="folder-select-current-folder-1"]')).toBeInTheDocument(),
    );
  });
});
