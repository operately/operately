import * as React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";

import { ContinueEditingDrafts } from "./ContinueEditingDrafts";
import type { ResourceHubNode } from "./types";

const draftNode: ResourceHubNode = {
  id: "node-1",
  type: "document",
  name: "Draft",
  document: {
    id: "doc-1",
    resourceHubId: "hub-1",
    parentFolderId: "folder-1",
    name: "Draft",
    content: "{\"type\":\"doc\",\"content\":[]}",
    state: "draft",
  },
};

describe("ContinueEditingDrafts", () => {
  test("links a single draft to its edit path", () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ContinueEditingDrafts
          drafts={[draftNode]}
          draftsPath="/drafts"
          getDraftEditPath={() => "/documents/doc-1/edit"}
          getNodePath={() => "/documents/doc-1"}
        />
      </MemoryRouter>,
    );

    const link = screen.getByText("Continue writing your draft document…").closest("a");

    expect(link).toHaveAttribute("href", "/documents/doc-1/edit");
  });

  test("links multiple drafts to the drafts page", () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ContinueEditingDrafts
          drafts={[draftNode, { ...draftNode, id: "node-2", document: { ...draftNode.document!, id: "doc-2" } }]}
          draftsPath="/drafts"
          getDraftEditPath={() => "/documents/doc-1/edit"}
          getNodePath={() => "/documents/doc-1"}
        />
      </MemoryRouter>,
    );

    const link = screen.getByText("Continue writing your 2 draft documents…").closest("a");

    expect(link).toHaveAttribute("href", "/drafts");
  });
});
