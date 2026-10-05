/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import i18n, { applyLanguage } from "@/i18n";
import { resolveEffectiveLanguage } from "@/i18n/languages";
import { Page } from "./page";

jest.mock("./loader", () => ({ useLoadedData: () => ({ company: { name: "Literal company" }, people: [] }) }));
jest.mock("@/components/Pages", () => ({ Page: ({ title, children }) => <main data-title={title}>{children}</main> }));
jest.mock("@/routes/paths", () => ({
  usePaths: () => ({
    base: "/people",
    profilePath(id: string) {
      return `${this.base}/${id}`;
    },
  }),
  compareIds: (a: string, b: string) => a === b,
}));
jest.mock("turboui", () => ({
  PeoplePage: ({ profileHref }) => (
    <a data-testid="page-content" href={profileHref("person")}>
      Person
    </a>
  ),
}));

afterEach(async () => {
  await applyLanguage("en");
});

test.each([
  [true, "Pessoas"],
  [false, "People"],
])("page title follows the company language gate: %s", async (enabled, title) => {
  await applyLanguage(resolveEffectiveLanguage("pt-BR", enabled));
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div");
  const root = createRoot(container);
  try {
    act(() => root.render(<Page />));
    expect(container.querySelector("main")?.getAttribute("data-title")).toBe(title);
    expect(container.querySelector('[data-testid="page-content"]')?.getAttribute("href")).toBe("/people/person");
  } finally {
    act(() => root.unmount());
  }
});

test("page title looks up substituted wording", async () => {
  const original = i18n.getResource("en", "translation", "People");
  i18n.addResource("en", "translation", "People", "Translated page title");
  const container = document.createElement("div");
  const root = createRoot(container);
  try {
    act(() => root.render(<Page />));
    expect(container.querySelector("main")?.getAttribute("data-title")).toBe("Translated page title");
  } finally {
    act(() => root.unmount());
    i18n.addResource("en", "translation", "People", original);
  }
});
