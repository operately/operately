/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import { renderHook } from "@/__tests__/renderHook";
import { applyLanguage } from "@/i18n";
import { useMe } from "@/contexts/CurrentCompanyContext";
import { LanguageProvider } from "./LanguageContext";
import { useCompanyLoaderData } from "@/routes/useCompanyLoaderData";

jest.mock("@/i18n", () => ({ applyLanguage: jest.fn(() => Promise.resolve("en")) }));
jest.mock("@/contexts/CurrentCompanyContext", () => ({ useMe: jest.fn() }));
jest.mock("@/routes/useCompanyLoaderData", () => ({ useCompanyLoaderData: jest.fn() }));
jest.mock("@/models/companies", () => ({
  hasFeature: (company: { enabledExperimentalFeatures?: string[] | null }, feature: string) =>
    (company.enabledExperimentalFeatures ?? []).includes(feature),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

function renderProvider() {
  const wrapper = ({ children }: React.PropsWithChildren) => <LanguageProvider>{children}</LanguageProvider>;
  renderHook(() => null, { initialProps: undefined, wrapper });
}

it("applies English when the i18n flag is off even if pt-BR is saved", () => {
  jest.mocked(useMe).mockReturnValue({ language: "pt-BR" } as ReturnType<typeof useMe>);
  jest.mocked(useCompanyLoaderData).mockReturnValue({
    company: { enabledExperimentalFeatures: [] },
  } as ReturnType<typeof useCompanyLoaderData>);

  renderProvider();

  expect(applyLanguage).toHaveBeenCalledWith("en");
});

it("applies the saved language when the i18n flag is on", () => {
  jest.mocked(useMe).mockReturnValue({ language: "pt-BR" } as ReturnType<typeof useMe>);
  jest.mocked(useCompanyLoaderData).mockReturnValue({
    company: { enabledExperimentalFeatures: ["i18n"] },
  } as ReturnType<typeof useCompanyLoaderData>);

  renderProvider();

  expect(applyLanguage).toHaveBeenCalledWith("pt-BR");
});

it("applies English when no language preference is saved", () => {
  jest.mocked(useMe).mockReturnValue({ language: null } as ReturnType<typeof useMe>);
  jest.mocked(useCompanyLoaderData).mockReturnValue({
    company: { enabledExperimentalFeatures: ["i18n"] },
  } as ReturnType<typeof useCompanyLoaderData>);

  renderProvider();

  expect(applyLanguage).toHaveBeenCalledWith("en");
});
