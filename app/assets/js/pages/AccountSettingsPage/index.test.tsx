/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import axios from "axios";
import Api from "@/api";
import { queryClient } from "@/api/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import * as Pages from "@/components/Pages";
import { act, renderHook } from "@/__tests__/renderHook";
import { useMe } from "@/contexts/CurrentCompanyContext";
import { applyLanguage } from "@/i18n";
import { AccountSettingsPage, showSuccessToast } from "turboui";
import pageModule from ".";

jest.mock("axios");
jest.mock("@/i18n", () => ({
  __esModule: true,
  default: { t: (key: string) => key },
  applyLanguage: jest.fn(() => Promise.resolve("en")),
}));
jest.mock("@/api/staleClient", () => ({ handleStaleClientError: jest.fn() }));
jest.mock("@/components/Pages", () => ({ useLoadedData: jest.fn() }));
jest.mock("@/contexts/CurrentCompanyContext", () => ({ useMe: jest.fn() }));
const mockSetTheme = jest.fn();
jest.mock("@/contexts/ThemeContext", () => ({ useSetTheme: () => mockSetTheme }));
jest.mock("@/routes/paths", () => ({ usePaths: () => ({ homePath: () => "/home", accountPath: () => "/account" }) }));
jest.mock("turboui", () => ({ AccountSettingsPage: jest.fn(() => null), showSuccessToast: jest.fn() }));

const person = { id: "person1", language: "de", timezone: "Europe/Berlin", timeFormat: "hour_24" };
const preferences = { theme: "dark", language: "pt-BR", timezone: "America/Sao_Paulo", timeFormat: "hour_12" } as const;
const Page = pageModule.Page;
const wrapper = ({ children }: React.PropsWithChildren) => (
  <QueryClientProvider client={queryClient}>
    <Page />
    {children}
  </QueryClientProvider>
);

beforeEach(() => {
  jest.clearAllMocks();
  queryClient.clear();
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({ "x-company-id": "company1" });
  jest.mocked(useMe).mockReturnValue(person as ReturnType<typeof useMe>);
  jest.mocked(axios.get).mockResolvedValue({ data: { theme: "system" } });
  jest.mocked(axios.post).mockResolvedValue({ data: { person } });
});
afterEach(() => queryClient.clear());

async function mountPage() {
  const inputs = await pageModule.loader({ params: {}, request: { url: "http://localhost/account/settings" } });
  jest.mocked(Pages.useLoadedData).mockReturnValue(inputs);
  renderHook(() => null, { initialProps: undefined, wrapper });
}
function props(): AccountSettingsPage.Props {
  const value = jest.mocked(AccountSettingsPage).mock.calls.at(-1)?.[0];
  if (!value) throw new Error("Preferences page has not rendered");
  return value;
}

it("loads the saved preferences", async () => {
  await mountPage();
  expect(props().preferences).toEqual({
    theme: "system",
    language: "de",
    timezone: "Europe/Berlin",
    timeFormat: "hour_24",
  });
});

it("saves all preferences and applies the selected language and theme", async () => {
  await mountPage();
  await act(() => props().onSave(preferences));
  expect(axios.post).toHaveBeenCalledWith("/api/v2/people/update_theme", { theme: "dark" }, expect.anything());
  expect(axios.post).toHaveBeenCalledWith(
    "/api/v2/people/update",
    {
      id: person.id,
      language: "pt-BR",
      timezone: "America/Sao_Paulo",
      time_format: "hour_12",
    },
    expect.anything(),
  );
  expect(mockSetTheme).toHaveBeenCalledWith("dark");
  expect(applyLanguage).toHaveBeenCalledWith("pt-BR");
  expect(showSuccessToast).toHaveBeenCalled();
});

it("reports save failures without applying unsaved preferences or showing success", async () => {
  await mountPage();
  jest.mocked(axios.post).mockRejectedValue(new Error("Failed"));
  await act(async () => {
    await expect(props().onSave(preferences)).rejects.toThrow("Failed");
  });
  expect(mockSetTheme).not.toHaveBeenCalled();
  expect(applyLanguage).not.toHaveBeenCalled();
  expect(showSuccessToast).not.toHaveBeenCalled();
});

it("can retry after a partial save without losing the remaining preferences", async () => {
  await mountPage();
  jest.mocked(axios.post).mockResolvedValueOnce({ data: {} }).mockRejectedValueOnce(new Error("Failed"));
  await act(async () => {
    await expect(props().onSave(preferences)).rejects.toThrow("Failed");
  });
  expect(mockSetTheme).toHaveBeenCalledWith("dark");
  expect(applyLanguage).not.toHaveBeenCalled();
  expect(showSuccessToast).not.toHaveBeenCalled();
  await act(() => props().onSave(preferences));
  expect(applyLanguage).toHaveBeenCalledWith("pt-BR");
  expect(showSuccessToast).toHaveBeenCalledTimes(1);
});
