import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect, userEvent, within } from "storybook/test";

import { ResourceHubPage } from "./index";
import {
  createMockDocumentNode,
  createMockDraftNode,
  createMockFileNode,
  createMockFolder,
  createMockFolderNode,
  createMockResourceHub,
  useMockSharedListPageProps,
} from "./mockData";

const meta = {
  title: "Pages/ResourceHubPage",
  component: ResourceHubPage,
  parameters: {
    layout: "fullscreen",
    reactRouter: {
      path: "/resource-hubs/hub-1",
      routePath: "/resource-hubs/:id",
    },
  },
} satisfies Meta<typeof ResourceHubPage>;

export default meta;
type Story = StoryObj<typeof meta>;

function StoryPage({
  empty = false,
  searchMode = "results",
}: {
  empty?: boolean;
  searchMode?: "results" | "empty" | "error";
}) {
  const [resourceHub] = React.useState(() => createMockResourceHub());
  const [nodes, setNodes] = React.useState(() =>
    empty
      ? []
      : [
          createMockDocumentNode(),
          createMockFileNode(),
          createMockFolderNode({
            folder: createMockFolder({
              id: "folder-node-1",
              resourceHubId: resourceHub.id,
              resourceHub,
              name: "Templates",
            }),
            name: "Templates",
          }),
        ],
  );
  const sharedProps = useMockSharedListPageProps({
    parent: resourceHub,
    parentType: "resource_hub",
    nodes,
    onCreateFolder: async ({ name }) => {
      setNodes((current) => [
        ...current,
        createMockFolderNode({
          id: `node-${name.toLowerCase().replace(/\s+/g, "-")}`,
          name,
          folder: createMockFolder({
            id: `folder-${name.toLowerCase().replace(/\s+/g, "-")}`,
            resourceHubId: resourceHub.id,
            resourceHub,
            name,
          }),
        }),
      ]);
    },
  });

  return (
    <ResourceHubPage
      {...sharedProps}
      title={resourceHub.name ?? "Resource Hub"}
      resourceHub={resourceHub}
      search={{
        search: async () => {
          if (searchMode === "error") throw new Error("Search failed");
          if (searchMode === "empty") return [];

          return [
            createMockDocumentNode({
              id: "search-document-1",
              name: "Engineering principles",
              document: {
                id: "search-document-1",
                name: "Engineering principles",
              },
            }),
          ];
        },
        placeholder: "Search this resource hub…",
        testId: "resource-hub-search",
      }}
      drafts={{
        nodes: empty ? [] : [createMockDraftNode()],
        draftsPath: `/resource-hubs/${resourceHub.id}/drafts`,
        getDraftEditPath: (node) => `/resource-hubs/documents/${node.document?.id}/edit`,
      }}
    />
  );
}

export const Default: Story = {
  args: {} as ResourceHubPage.Props,
  render: () => <StoryPage />,
};

export const Empty: Story = {
  args: {} as ResourceHubPage.Props,
  render: () => <StoryPage empty />,
};

export const NoSearchResults: Story = {
  args: {} as ResourceHubPage.Props,
  render: () => <StoryPage searchMode="empty" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByRole("searchbox"), "missing");
    await expect(canvas.findByText("No matching items. Try different keywords.")).resolves.toBeVisible();
  },
};

export const SearchError: Story = {
  args: {} as ResourceHubPage.Props,
  render: () => <StoryPage searchMode="error" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByRole("searchbox"), "missing");
    await expect(canvas.findByRole("alert")).resolves.toHaveTextContent("Search is unavailable. Try again.");
  },
};
