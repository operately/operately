import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { i18n, setupTestCatalog } from "../../test/i18n";
import { createMockFolderNode } from "../ResourceHubPage/mockData";
import { NodeDescription } from "./NodeDescription";

setupTestCatalog();

it.each([0, 1, 3])("falls back to English folder metadata for %i items", async (count) => {
  i18n.removeResourceBundle("pt-BR", "translation");
  await i18n.changeLanguage("pt-BR");
  render(<NodeDescription node={createMockFolderNode({ folder: { childrenCount: count } })} />);
  expect(screen.getByText(count === 1 ? "1 item" : `${count} items`)).toBeInTheDocument();
});

it("looks up plural folder metadata", () => {
  i18n.addResourceBundle("en", "translation", { "1 item_other": "Translated {{count}} folder items" }, true, true);
  render(<NodeDescription node={createMockFolderNode({ folder: { childrenCount: 3 } })} />);
  expect(screen.getByText("Translated 3 folder items")).toBeInTheDocument();
});
