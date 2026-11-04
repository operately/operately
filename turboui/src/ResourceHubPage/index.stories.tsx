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
  createMockPermissions,
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
  renameFails = false,
}: {
  empty?: boolean;
  searchMode?: "results" | "empty" | "error";
  renameFails?: boolean;
}) {
  const [resourceHub, setResourceHub] = React.useState(() =>
    createMockResourceHub({ permissions: createMockPermissions({ canRenameHub: true }) }),
  );
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
      renameCollection={async (_id, name) => {
        if (renameFails) throw new Error("Rename failed");
        setResourceHub((current) => ({ ...current, name }));
      }}
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
        placeholder: "Search documents and files…",
        testId: "resource-hub-search",
      }}
      drafts={{
        nodes: empty ? [] : [createMockDraftNode()],
        draftsPath: `/resource-hubs/${resourceHub.id}/drafts`,
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

async function openRename(canvasElement: HTMLElement) {
  const options = canvasElement.querySelector<HTMLElement>('[data-test-id="options-button"]');
  if (!options) throw new Error("Missing page options");
  await userEvent.click(options);
  const rename = document.querySelector<HTMLElement>('[data-test-id="rename-collection"]');
  if (!rename) throw new Error("Missing rename action");
  await userEvent.click(rename);
  return within(document.body);
}

export const RenameCollection: Story = {
  args: {} as ResourceHubPage.Props,
  render: () => <StoryPage empty />,
  play: async ({ canvasElement }) => {
    const body = await openRename(canvasElement);
    const input = body.getByRole("textbox");
    await expect(input).toHaveValue("Engineering Handbook");
    await userEvent.clear(input);
    await userEvent.type(input, "  Team library  ");
    const save = document.querySelector<HTMLElement>('[data-test-id="save-collection-name"]');
    if (!save) throw new Error("Missing save action");
    await userEvent.click(save);
    await expect(within(canvasElement).findByText("Team library")).resolves.toBeVisible();
    await expect(body.queryByRole("dialog")).not.toBeInTheDocument();
  },
};

export const RenameError: Story = {
  args: {} as ResourceHubPage.Props,
  render: () => <StoryPage renameFails />,
  play: async ({ canvasElement }) => {
    const body = await openRename(canvasElement);
    const input = body.getByRole("textbox");
    await userEvent.clear(input);
    await userEvent.type(input, "Draft name");
    const save = document.querySelector<HTMLElement>('[data-test-id="save-collection-name"]');
    if (!save) throw new Error("Missing save action");
    await userEvent.click(save);
    await expect(body.findByRole("alert")).resolves.toBeVisible();
    await expect(input).toHaveValue("Draft name");
    await expect(input).toBeEnabled();
  },
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
