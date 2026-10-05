/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, useRouteLoaderData } from "react-router";
import { applyLanguage, setupTestCatalog } from "@/__tests__/i18n";
import { resolveEffectiveLanguage } from "@/i18n/languages";
import NotFoundPage from ".";

jest.mock("react-router", () => ({ ...jest.requireActual("react-router"), useRouteLoaderData: jest.fn() }));
jest.mock("@/components/Pages", () => ({ emptyLoader: jest.fn() }));
jest.mock("../../../../../turboui/node_modules/react", () => jest.requireActual("react"));
jest.mock("../../../../../turboui/node_modules/react-router", () => jest.requireActual("react-router"));
jest.mock("../../../../../turboui/node_modules/react-i18next", () => jest.requireActual("react-i18next"));
jest.mock("../../../../../turboui/node_modules/i18next", () => jest.requireActual("i18next"));
jest.mock("turboui", () => ({
  ...jest.requireActual("../../../../../turboui/src/ErrorPage"),
  i18nOptions: jest.requireActual("../../../../../turboui/src/i18nOptions").i18nOptions,
}));

setupTestCatalog();

test.each([true, false])("not-found rendering respects the language flag and loader context: %s", async (enabled) => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  await applyLanguage(resolveEffectiveLanguage("pt-BR", enabled));
  const container = document.createElement("div");
  const root = createRoot(container);

  try {
    for (const companyId of ["company", undefined]) {
      jest.mocked(useRouteLoaderData).mockReturnValue(companyId ? { companyId } : undefined);
      act(() =>
        root.render(
          <MemoryRouter>
            <NotFoundPage.Page />
          </MemoryRouter>,
        ),
      );

      expect(container.textContent).toContain(enabled ? "Página não encontrada" : "Page Not Found");
      expect(container.querySelector("a")?.getAttribute("href")).toBe(companyId ? "/company" : "/");
    }
  } finally {
    act(() => root.unmount());
  }
});
