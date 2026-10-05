/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router";
import { applyLanguage, setupTestCatalog } from "@/__tests__/i18n";
import { resolveEffectiveLanguage } from "@/i18n/languages";
import { useLoadedData } from "./loader";
import BillingPickCompanyPageModule from ".";

jest.mock("./loader", () => ({ loader: jest.fn(), useLoadedData: jest.fn() }));
jest.mock("../../../../../turboui/node_modules/react", () => jest.requireActual("react"));
jest.mock("../../../../../turboui/node_modules/react-router", () => jest.requireActual("react-router"));
jest.mock("../../../../../turboui/node_modules/react-i18next", () => jest.requireActual("react-i18next"));
jest.mock("../../../../../turboui/node_modules/i18next", () => jest.requireActual("i18next"));
jest.mock("../../../../../turboui/src/icons", () => ({ IconBuildingEstate: () => null }));
jest.mock("turboui", () => ({
  ...jest.requireActual("../../../../../turboui/src/BillingPickCompanyPage"),
  i18nOptions: jest.requireActual("../../../../../turboui/src/i18nOptions").i18nOptions,
}));

setupTestCatalog();

let container: HTMLDivElement;
let root: ReturnType<typeof createRoot>;

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  root = createRoot(container);
  window.history.replaceState({}, "", "/billing/pick-company");
  jest.mocked(useLoadedData).mockReturnValue({ companies: [] });
});

afterEach(() => act(() => root.unmount()));

function renderPage() {
  act(() =>
    root.render(
      <MemoryRouter>
        <BillingPickCompanyPageModule.Page />
      </MemoryRouter>,
    ),
  );
}

test.each([true, false])("empty state respects the effective language: %s", async (enabled) => {
  await applyLanguage(resolveEffectiveLanguage("pt-BR", enabled));

  renderPage();

  expect(container.textContent).toContain(
    enabled
      ? "Você ainda não tem acesso para gerenciar o faturamento de nenhuma empresa."
      : "You don't have access to manage billing for any companies yet.",
  );
});

test.each(["", "?plan=team&billing_period=yearly", "?billing_period=monthly"])(
  "preserves billing destinations: %s",
  (search) => {
    window.history.replaceState({}, "", "/billing/pick-company" + search);
    jest.mocked(useLoadedData).mockReturnValue({
      companies: [
        {
          __typename: "company",
          id: "company",
          name: "Literal <company> & name",
          setupCompleted: true,
          memberCount: 2,
        },
      ],
    });

    renderPage();

    expect(container.textContent).toContain("Literal <company> & name");
    const href = container.querySelector("a")?.getAttribute("href");
    expect(href?.split("?")[0]).toBe(search ? "/company/admin/billing/plans" : "/company/admin/billing");
    if (search) {
      const expected = new URLSearchParams(search);
      const actual = new URLSearchParams(href?.split("?")[1]);
      expected.forEach((value, key) => expect(actual.get(key)).toBe(value));
    }
    expect(container.querySelector("company")).toBeNull();
  },
);
