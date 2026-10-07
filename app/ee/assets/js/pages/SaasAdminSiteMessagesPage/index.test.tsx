import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { applyLanguage, setupTestCatalog } from "@/__tests__/i18n";
import { Page } from "./index";

setupTestCatalog();

jest.mock("./loader", () => ({
  useLoadedData: () => ({ messages: [{ id: "message-1", title: "Original title", active: true, allCompanies: true }] }),
}));

jest.mock("./SiteMessageModal", () => ({ SiteMessageModal: () => null }));

jest.mock("@/ee/models/siteMessageLifecycle", () => ({
  useDeleteSiteMessage: () => ({ mutateAsync: jest.fn() }),
  useRefreshSiteMessages: () => jest.fn(),
}));

jest.mock("@/hooks/useFormattedTimePreferences", () => ({ useFormattedTimePreferences: () => ({}) }));

jest.mock("@/components/Pages", () => ({ Page: ({ children }: React.PropsWithChildren) => children }));

jest.mock("@/components/PaperContainer", () => ({
  Root: ({ children }: React.PropsWithChildren) => children,
  Body: ({ children }: React.PropsWithChildren) => children,
  Navigation: () => null,
  Header: () => null,
}));

jest.mock("turboui", () => ({
  i18nOptions: jest.requireActual("../../../../../../turboui/src/i18nOptions").i18nOptions,
  SecondaryButton: () => null,
  Menu: () => null,
  MenuActionItem: () => null,
  ConfirmDialog: () => null,
}));

it.each([
  ["en", "Title"],
  ["pt-BR", "Título"],
])("renders the message title column in %s without translating message content", async (language, label) => {
  await applyLanguage(language);

  const markup = renderToStaticMarkup(<Page />);

  expect(markup).toContain(`<div>${label}</div>`);
  expect(markup).toContain("Original title");
});
