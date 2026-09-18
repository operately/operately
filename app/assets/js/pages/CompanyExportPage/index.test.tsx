/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import axios from "axios";
import Api from "@/api";
import { queryClient } from "@/api/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import * as Pages from "@/components/Pages";
import { act, renderHook, waitFor } from "@/__tests__/renderHook";
import PageModule from "./index";
import { CompanyExportPage, showErrorToast } from "turboui";

jest.mock("axios");
jest.mock("@/api/staleClient", () => ({ handleStaleClientError: jest.fn() }));
jest.mock("@/components/Pages", () => ({ useLoadedData: jest.fn() }));
jest.mock("@/api/socket", () => ({ setHeaders: jest.fn() }));
jest.mock("@/models/blobs", () => ({ uploadImportArtifactFile: jest.fn() }));
jest.mock("@/hooks/useFormattedTimePreferences", () => ({ useFormattedTimePreferences: () => ({}) }));
jest.mock("@/routes/paths", () => ({
  usePaths: () => ({ companyAdminPath: () => "/admin" }),
  Paths: { lobbyPath: () => "/", companyHomePath: (id: string) => `/${id}` },
}));
jest.mock("turboui", () => ({
  CompanyExportPage: jest.fn(() => null),
  CompanyImportPage: jest.fn(() => null),
  showErrorToast: jest.fn(),
  showSuccessToast: jest.fn(),
}));
const { Page } = PageModule;
const wrapper = ({ children }: React.PropsWithChildren) => (
  <QueryClientProvider client={queryClient}>
    <Page />
    {children}
  </QueryClientProvider>
);
beforeEach(() => {
  queryClient.clear();
  jest.clearAllMocks();
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({});
});
afterEach(() => queryClient.clear());

function props() {
  const calls = jest.mocked(CompanyExportPage).mock.calls;
  const latest = calls[calls.length - 1];
  if (!latest) throw new Error("Page has not rendered");
  return latest[0];
}

beforeEach(async () => {
  jest.mocked(axios.get).mockResolvedValue({ data: { exportRuns: [] } });
  jest.mocked(Pages.useLoadedData).mockReturnValue(await PageModule.loader({ params: {}, request: {} }));
});

it("starts an export and displays the pending run even when refreshing fails", async () => {
  renderHook(() => null, { initialProps: undefined, wrapper });
  const exportRun = { id: "export", insertedAt: "2026-01-01", status: "pending" };
  jest.mocked(axios.post).mockResolvedValue({ data: { exportRun } });
  jest.mocked(axios.get).mockRejectedValue(new Error("Refresh failed"));
  await act(async () => {
    await props().onStartExport();
  });
  await waitFor(() => expect(props().runs).toEqual([exportRun]));
  expect(showErrorToast).not.toHaveBeenCalled();
});

it("downloads a freshly fetched URL and restores the download state", async () => {
  renderHook(() => null, { initialProps: undefined, wrapper });
  const click = jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  const run = {
    id: "export",
    insertedAt: "2026-01-01",
    status: "completed",
    packageDownloadUrl: "https://example.com/fresh",
  };
  jest.mocked(axios.get).mockResolvedValue({ data: { exportRun: run } });
  try {
    await act(async () => {
      await props().onDownload("export");
    });
    expect(click).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(props().runs).toEqual([run]));
    expect(props().downloading).toBeNull();
  } finally {
    click.mockRestore();
  }
});
