import * as React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

import * as Forms from "../../Forms";
import { ResourceHubNodesListProvider, type ResourceHubNodesListContextValue } from "../contexts/NodesListContext";
import { FolderSelectField } from ".";
import type { ResourceHubNode } from "../types";

jest.mock("../NodeIcon", () => ({
  NodeIcon: ({ node }: { node: { name?: string | null } }) => <span>{node.name}</span>,
}));

jest.mock("../../icons", () => ({
  IconArrowLeft: (props: React.ComponentProps<"span">) => <span {...props} />,
}));

const folderNode: ResourceHubNode = {
  id: "node-folder-1",
  type: "folder",
  name: "Plans",
  folder: {
    id: "folder-1",
    resourceHubId: "hub-1",
    name: "Plans",
    pathToFolder: [],
    resourceHub: { id: "hub-1", name: "Hub" } as never,
  },
};

const documentNode: ResourceHubNode = {
  id: "node-doc-1",
  type: "document",
  name: "Spec Doc",
  document: {
    id: "doc-1",
    resourceHubId: "hub-1",
    parentFolderId: "folder-1",
    name: "Spec Doc",
    content: "{\"type\":\"doc\",\"content\":[]}",
    state: "published",
  },
};

describe("FolderSelectField", () => {
  test("loads raw folder/resource hub results and navigates into folders", async () => {
    const loadResourceHub = jest.fn().mockResolvedValue({
      current: { type: "resourceHub", resourceHub: { id: "hub-1", name: "Hub" } },
      nodes: [folderNode, documentNode],
    });
    const loadFolder = jest.fn().mockResolvedValue({
      current: {
        type: "folder",
        folder: {
          id: "folder-1",
          resourceHubId: "hub-1",
          name: "Plans",
          pathToFolder: [],
          resourceHub: { id: "hub-1", name: "Hub" },
        },
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
            <FolderSelectField label="Location" field="location" />
          </ResourceHubNodesListProvider>
        </Forms.Form>
      );
    }

    const { container } = render(
      <Harness />,
    );

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
