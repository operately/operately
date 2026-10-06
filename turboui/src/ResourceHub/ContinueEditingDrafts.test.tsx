import * as React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router";

import { ContinueEditingDrafts } from "./ContinueEditingDrafts";
import type { ResourceHubNode } from "./types";

import { i18n, setupTestCatalog } from "../../test/i18n";

setupTestCatalog();

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
  test.each([0, 1, 3])("shows the expected draft label and list destination for %i drafts", (count) => {
    const { container } = render(
      <MemoryRouter>
        <ContinueEditingDrafts drafts={Array.from({ length: count }, () => draftNode)} draftsPath="/drafts" />
      </MemoryRouter>,
    );
    if (count === 0) {
      expect(container).toBeEmptyDOMElement();
    } else {
      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "/drafts");
      expect(link).toHaveAccessibleName(`Your drafts (${count})`);
    }
  });
});

it.each([0, 1, 3])("uses Portuguese plural resources for %i drafts", async (count) => {
  await i18n.changeLanguage("pt-BR");
  const { container } = render(
    <MemoryRouter>
      <ContinueEditingDrafts drafts={Array.from({ length: count }, () => draftNode)} draftsPath="/drafts" />
    </MemoryRouter>,
  );
  if (count === 0) expect(container).toBeEmptyDOMElement();
  else expect(screen.getByRole("link")).toHaveAccessibleName(`Seus rascunhos (${count})`);
});

it.each([1, 3])("falls back using English plurals for %i drafts", async (count) => {
  i18n.removeResourceBundle("pt-BR", "translation");
  await i18n.changeLanguage("pt-BR");
  render(
    <MemoryRouter>
      <ContinueEditingDrafts drafts={Array.from({ length: count }, () => draftNode)} draftsPath="/drafts" />
    </MemoryRouter>,
  );
  expect(screen.getByRole("link")).toHaveAccessibleName(`Your drafts (${count})`);
});
