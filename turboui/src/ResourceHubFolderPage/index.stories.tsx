import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";

import { ResourceHubFolderPage } from "./index";
import {
  createMockDocumentNode,
  createMockFileNode,
  createMockFolder,
  createMockFolderNode,
  createMockPermissions,
  createMockResourceHub,
  useMockSharedListPageProps,
} from "../ResourceHubPage/mockData";

const meta = {
  title: "Pages/ResourceHubFolderPage",
  component: ResourceHubFolderPage,
  parameters: {
    layout: "fullscreen",
    reactRouter: {
      path: "/resource-hubs/folders/folder-1",
      routePath: "/resource-hubs/folders/:id",
    },
  },
} satisfies Meta<typeof ResourceHubFolderPage>;

export default meta;
type Story = StoryObj<typeof meta>;

function StoryPage({ empty = false }: { empty?: boolean }) {
  const [resourceHub] = React.useState(() => createMockResourceHub());
  const [folder, setFolder] = React.useState(() =>
    createMockFolder({
      resourceHubId: resourceHub.id,
      resourceHub,
      permissions: createMockPermissions({ canRenameFolder: true }),
      pathToFolder: [{ id: "parent-folder", name: "People Ops", resourceHubId: resourceHub.id, resourceHub }],
    }),
  );
  const [nodes, setNodes] = React.useState(() =>
    empty
      ? []
      : [
          createMockDocumentNode({
            document: { resourceHubId: resourceHub.id, parentFolderId: folder.id },
          }),
          createMockFileNode({
            file: { resourceHubId: resourceHub.id, parentFolderId: folder.id },
          }),
          createMockFolderNode({
            folder: createMockFolder({
              id: "nested-folder",
              resourceHubId: resourceHub.id,
              resourceHub,
              name: "Interview Kits",
              pathToFolder: [...(folder.pathToFolder ?? []), folder],
            }),
            name: "Interview Kits",
          }),
        ],
  );
  const sharedProps = useMockSharedListPageProps({
    parent: folder,
    parentType: "folder",
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
            pathToFolder: [...(folder.pathToFolder ?? []), folder],
          }),
        }),
      ]);
    },
  });

  return (
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
  );
}

export const Default: Story = {
  args: {} as ResourceHubFolderPage.Props,
  render: () => <StoryPage />,
};

export const Empty: Story = {
  args: {} as ResourceHubFolderPage.Props,
  render: () => <StoryPage empty />,
};
