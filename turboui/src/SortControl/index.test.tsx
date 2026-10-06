import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { SortControl } from "./index";
import { i18n, setupTestCatalog } from "../../test/i18n";

setupTestCatalog();

it.each([
  ["en", "name", "Sort by Name"],
  ["pt-BR", "name", "Ordenar por nome"],
  ["pt-BR", "insertedAt", "Ordenar por data de criação"],
  ["pt-BR", "updatedAt", "Ordenar por data de modificação"],
] as const)("translates the complete %s / %s sort action", async (language, sortBy, label) => {
  await i18n.changeLanguage(language);
  render(<SortControl sortBy={sortBy} onSortChange={jest.fn()} disabled />);
  expect(screen.getByRole("button", { name: label })).toBeDisabled();
});

it("looks up complete sentences and falls back when Portuguese is missing", async () => {
  i18n.addResourceBundle("en", "translation", { "Sort by Name": "Translated full sort action" }, true, true);
  i18n.removeResourceBundle("pt-BR", "translation");
  await i18n.changeLanguage("pt-BR");
  render(<SortControl sortBy="name" onSortChange={jest.fn()} disabled />);
  expect(screen.getByRole("button")).toHaveTextContent("Translated full sort action");
});
