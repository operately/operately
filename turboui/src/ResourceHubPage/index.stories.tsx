import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";

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

function StoryPage({ empty = false }: { empty?: boolean }) {
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
