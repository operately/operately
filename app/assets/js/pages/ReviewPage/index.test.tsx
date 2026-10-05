/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router";
import { applyLanguage } from "@/i18n";
import { resolveEffectiveLanguage } from "@/i18n/languages";
import ReviewPageModule from ".";

// Match the single React/i18n runtime used by the app bundle.
jest.mock("../../../../../turboui/node_modules/react", () => jest.requireActual("react"));
jest.mock("../../../../../turboui/node_modules/react-router", () => jest.requireActual("react-router"));
jest.mock("../../../../../turboui/node_modules/react-i18next", () => jest.requireActual("react-i18next"));
jest.mock("../../../../../turboui/node_modules/i18next", () => jest.requireActual("i18next"));

jest.mock("../../../../../turboui/src/icons", () => ({ IconCoffee: () => null, IconSparkles: () => null }));

jest.mock("./loader", () => ({
  loader: jest.fn(),
  useLoadedData: () => ({ dueSoon: [], needsReview: [], upcoming: [] }),
}));
jest.mock("@/hooks/useFormattedTimePreferences", () => ({
  useFormattedTimePreferences: () => ({ timezone: "UTC", dateFormat: "short" }),
}));
jest.mock("turboui", () => ({
  ...jest.requireActual("../../../../../turboui/src/ReviewPage"),
  i18nOptions: jest.requireActual("../../../../../turboui/src/i18nOptions").i18nOptions,
}));
afterEach(async () => {
  await applyLanguage("en");
});
test.each([
  [true, "Você está em dia", "Revisão"],
  [false, "You're all caught up", "Review"],
])("saved Portuguese preference respects flag %s", async (enabled, emptyLabel, title) => {
  await applyLanguage(resolveEffectiveLanguage("pt-BR", enabled));
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div");
  const root = createRoot(container);
  try {
    act(() =>
      root.render(
        <MemoryRouter>
          <ReviewPageModule.Page />
        </MemoryRouter>,
      ),
    );
    expect(container.textContent).toContain(emptyLabel);
    expect(document.title).toContain(title);
  } finally {
    act(() => root.unmount());
  }
});
