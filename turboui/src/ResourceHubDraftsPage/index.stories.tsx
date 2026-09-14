import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";

import { defaultFormattedTimePreferences } from "../FormattedTime";
import { ResourceHubDraftsPage } from "./index";
import { createMockDraftNode, createMockResourceHub } from "../ResourceHubPage/mockData";

const meta = {
  title: "Pages/ResourceHubDraftsPage",
  component: ResourceHubDraftsPage,
  parameters: {
    layout: "fullscreen",
    reactRouter: {
      path: "/resource-hubs/hub-1/drafts",
      routePath: "/resource-hubs/:id/drafts",
    },
  },
} satisfies Meta<typeof ResourceHubDraftsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

function StoryPage({
  empty = false,
  single = false,
  failDelete = false,
}: {
  empty?: boolean;
  single?: boolean;
  failDelete?: boolean;
}) {
  const [resourceHub] = React.useState(() => createMockResourceHub());
  const [nodes, setNodes] = React.useState(() => {
    const drafts = empty
      ? []
      : [
          createMockDraftNode({
            pathToNode: [{ __typename: "resource_hub_folder", id: "folder-1", name: "Research" }],
          }),
          createMockDraftNode({
            id: "node-draft-2",
            name: "Draft Interview Guide",
            pathToNode: [{ __typename: "resource_hub_folder", id: "folder-2", name: "Planning" }],
            document: {
              id: "document-draft-2",
              name: "Draft Interview Guide",
            },
          }),
        ];
    return single ? drafts.slice(0, 1) : drafts;
  });

  return (
    <ResourceHubDraftsPage
      title={["Drafts", resourceHub.name ?? "Resource Hub"]}
      navigation={[
        { to: `/spaces/${resourceHub.space?.id}`, label: resourceHub.space?.name ?? "Operations" },
        { to: `/resource-hubs/${resourceHub.id}`, label: resourceHub.name ?? "Resource Hub" },
      ]}
      resourceHubPath={`/resource-hubs/${resourceHub.id}`}
      formattedTimePreferences={defaultFormattedTimePreferences}
      onDelete={async (id) => {
        if (failDelete) throw new Error("Deletion failed");
        setNodes((current) => current.filter((node) => node.document?.id !== id));
      }}
      nodes={nodes}
      getNodePath={(node) => `/resource-hubs/documents/${node.document?.id ?? node.id}/edit`}
    />
  );
}

export const Default: Story = {
  args: {} as ResourceHubDraftsPage.Props,
  render: () => <StoryPage />,
};

export const Empty: Story = {
  args: {} as ResourceHubDraftsPage.Props,
  render: () => <StoryPage empty />,
};

export const Single: Story = {
  args: {} as ResourceHubDraftsPage.Props,
  render: () => <StoryPage single />,
};

export const DeleteFailure: Story = {
  args: {} as ResourceHubDraftsPage.Props,
  render: () => <StoryPage failDelete />,
};
