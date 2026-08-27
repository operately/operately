import * as React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router";

import { ResourceHubNodesListProvider, type ResourceHubNodesListContextValue } from "./contexts/NodesListContext";
import { NodeDescription } from "./NodeDescription";
import { NodeIcon, ResourceHubTypeIcon } from "./NodeIcon";
import { NodeMenu } from "./NodeMenu";
import type { ResourceHubNode } from "./types";
import { defaultFormattedTimePreferences } from "../FormattedTime";

jest.mock("../icons", () => ({
  IconAlignJustified: () => <span>doc-icon</span>,
  IconChartColumn: () => <span>chart-icon</span>,
  IconChevronRight: () => <span>chevron-icon</span>,
  IconDots: () => <span>menu-icon</span>,
  IconFolderFilled: () => <span>folder-icon</span>,
  IconLink: () => <span>link-icon</span>,
  IconLogs: () => <span>logs-icon</span>,
  IconVideo: () => <span>video-icon</span>,
}));

const documentNode: ResourceHubNode = {
  __typename: "resource_hub_node",
  id: "node-1",
  type: "document",
  name: "Quarterly Plan",
  document: {
    __typename: "resource_hub_document",
    id: "doc-1",
    resourceHubId: "hub-1",
    parentFolderId: "folder-1",
    name: "Quarterly Plan",
    content: JSON.stringify({
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "Plan summary" }] }],
    }),
    state: "published",
    insertedAt: "2024-01-01T00:00:00Z",
    publishedAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    author: { id: "person-1", fullName: "Alice Example" } as never,
  },
};

const imageFileNode: ResourceHubNode = {
  __typename: "resource_hub_node",
  id: "node-2",
  type: "file",
  name: "Roadmap",
  file: {
    __typename: "resource_hub_file",
    id: "file-1",
    resourceHubId: "hub-1",
    parentFolderId: "folder-1",
    name: "Roadmap",
    type: "image",
    blob: {
      id: "blob-1",
      url: "/roadmap.png",
      contentType: "image/png",
      width: 800,
      height: 600,
    } as never,
  },
};

const quicktimeFileNode: ResourceHubNode = {
  __typename: "resource_hub_node",
  id: "node-3",
  type: "file",
  name: "Demo Clip",
  file: {
    __typename: "resource_hub_file",
    id: "file-2",
    resourceHubId: "hub-1",
    parentFolderId: "folder-1",
    name: "Demo Clip",
    type: "video",
    blob: {
      id: "blob-2",
      url: "/demo.mov",
      contentType: "video/quicktime",
    } as never,
  },
};

const listContext: ResourceHubNodesListContextValue = {
  parent: { id: "hub-1", name: "Hub", type: "resource_hub", resourceHubId: "hub-1" },
  folderSelect: {
    loadFolder: jest.fn().mockResolvedValue({
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
    }),
    loadResourceHub: jest.fn().mockResolvedValue({
      current: {
        type: "resourceHub",
        resourceHub: { id: "hub-1", name: "Hub" },
      },
      nodes: [],
    }),
    compareIds: (a, b) => a === b,
  },
  permissions: { __typename: "resource_hub_permissions", canEditDocument: true },
  paths: {
    editDocumentPath: (id) => `/documents/${id}/edit`,
    editFilePath: (id) => `/files/${id}/edit`,
    editLinkPath: (id) => `/links/${id}/edit`,
    documentPath: (id) => `/documents/${id}`,
    folderPath: (id) => `/folders/${id}`,
  },
  actions: {},
};

describe("resource hub node presentation", () => {
  test("renders the canonical icon for each basic resource type", () => {
    render(
      <>
        <ResourceHubTypeIcon type="folder" size={48} />
        <ResourceHubTypeIcon type="document" size={48} />
        <ResourceHubTypeIcon type="file" size={48} />
        <ResourceHubTypeIcon type="link" size={48} />
      </>,
    );

    expect(screen.getByText("folder-icon")).toBeInTheDocument();
    expect(screen.getAllByText("doc-icon")).toHaveLength(2);
    expect(screen.getByText("link-icon")).toBeInTheDocument();
  });

  test("renders compact author and update metadata from a raw document node", () => {
    render(<NodeDescription node={documentNode} formattedTimePreferences={defaultFormattedTimePreferences} />);

    expect(screen.getByText("Alice E.")).toBeInTheDocument();
    expect(screen.getByTitle("Alice Example")).toBeInTheDocument();
    expect(document.querySelector('[data-test-id="resource-hub-node-updated-at"]')).toHaveTextContent("Updated");
    expect(screen.getByText(/Plan summary/)).toBeInTheDocument();
  });

  test("keeps secondary details visible on small screens", () => {
    render(<NodeDescription node={documentNode} formattedTimePreferences={defaultFormattedTimePreferences} />);

    const details = screen.getByText(/Plan summary/);

    expect(details).not.toHaveClass("hidden");
    expect(details).toHaveClass("basis-full");
  });

  test("gives native documents a visible file type badge", () => {
    render(<NodeIcon node={documentNode} size={48} />);

    expect(screen.getByText("DOC")).toBeInTheDocument();
  });

  test("renders thumbnails from a raw file node", () => {
    render(<NodeIcon node={imageFileNode} size={48} />);

    expect(screen.getByAltText("Roadmap")).toBeInTheDocument();
  });

  test("renders a MOV badge for quicktime videos", () => {
    render(<NodeIcon node={quicktimeFileNode} size={48} />);

    expect(screen.getByText("mov")).toBeInTheDocument();
  });

  test("renders the menu trigger from a raw document node", () => {
    const { container } = render(
      <MemoryRouter>
        <ResourceHubNodesListProvider value={listContext}>
          <NodeMenu node={documentNode} />
        </ResourceHubNodesListProvider>
      </MemoryRouter>,
    );

    expect(container.querySelector('[data-test-id="menu-doc-1"]')).toBeInTheDocument();
  });
});
