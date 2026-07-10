import * as React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router";

import { ResourceHubNodesListProvider, type ResourceHubNodesListContextValue } from "./contexts/NodesListContext";
import { NodeDescription } from "./NodeDescription";
import { NodeIcon } from "./NodeIcon";
import { NodeMenu } from "./NodeMenu";
import type { ResourceHubNode } from "./types";

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
  id: "node-1",
  type: "document",
  name: "Quarterly Plan",
  document: {
    id: "doc-1",
    resourceHubId: "hub-1",
    parentFolderId: "folder-1",
    name: "Quarterly Plan",
    content: JSON.stringify({
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "Plan summary" }] }],
    }),
    state: "published",
    author: { id: "person-1", fullName: "Alice Example" } as never,
  },
};

const imageFileNode: ResourceHubNode = {
  id: "node-2",
  type: "file",
  name: "Roadmap",
  file: {
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
  id: "node-3",
  type: "file",
  name: "Demo Clip",
  file: {
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
  permissions: { canEditDocument: true },
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
  test("renders description details from a raw document node", () => {
    render(<NodeDescription node={documentNode} />);

    expect(screen.getByText("Alice Example")).toBeInTheDocument();
    expect(screen.getByText(/Plan summary/)).toBeInTheDocument();
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
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ResourceHubNodesListProvider value={listContext}>
          <NodeMenu node={documentNode} />
        </ResourceHubNodesListProvider>
      </MemoryRouter>,
    );

    expect(container.querySelector('[data-test-id="menu-doc-1"]')).toBeInTheDocument();
  });
});
