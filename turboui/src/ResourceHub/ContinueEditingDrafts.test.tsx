import * as React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router";

import { ContinueEditingDrafts } from "./ContinueEditingDrafts";
import type { ResourceHubNode } from "./types";

const draftNode: ResourceHubNode = {
  __typename: "resource_hub_node",
  id: "node-1",
  type: "document",
  name: "Draft",
  document: {
    __typename: "resource_hub_document",
    id: "doc-1",
    resourceHubId: "hub-1",
    parentFolderId: "folder-1",
    name: "Draft",
    content: '{"type":"doc","content":[]}',
    state: "draft",
    insertedAt: "2024-01-01T00:00:00Z",
    publishedAt: null,
    updatedAt: "2024-01-01T00:00:00Z",
  },
};

describe("ContinueEditingDrafts", () => {
  test.each([0, 1, 3])("links %i drafts to the same list", (count) => {
    const { container } = render(
      <MemoryRouter>
        <ContinueEditingDrafts drafts={Array.from({ length: count }, () => draftNode)} draftsPath="/drafts" />
      </MemoryRouter>,
    );
    if (count === 0) {
      expect(container).toBeEmptyDOMElement();
    } else {
      expect(screen.getByRole("link", { name: `Your drafts (${count})` })).toHaveAttribute("href", "/drafts");
    }
  });
});
