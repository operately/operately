import type { Meta, StoryObj } from "@storybook/react";
import * as React from "react";

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

function StoryPage({ empty = false }: { empty?: boolean }) {
  const [resourceHub] = React.useState(() => createMockResourceHub());
  const nodes = React.useMemo(
    () =>
      empty
        ? []
        : [
            createMockDraftNode(),
            createMockDraftNode({
              id: "node-draft-2",
              name: "Draft Quarterly Review",
              document: {
                id: "document-draft-2",
                name: "Draft Quarterly Review",
              },
            }),
          ],
    [empty],
  );

  return (
    <ResourceHubDraftsPage
      title={["Drafts", resourceHub.name ?? "Resource Hub"]}
      navigation={[
        { to: `/spaces/${resourceHub.space?.id}`, label: resourceHub.space?.name ?? "Operations" },
        { to: `/resource-hubs/${resourceHub.id}`, label: resourceHub.name ?? "Resource Hub" },
      ]}
      nodes={nodes}
      getNodePath={(node) => `/resource-hubs/documents/${node.document?.id ?? node.id}`}
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
