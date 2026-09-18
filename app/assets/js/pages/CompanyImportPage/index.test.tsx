/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import axios from "axios";
import Api from "@/api";
import { queryClient } from "@/api/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import * as Pages from "@/components/Pages";
import { act, renderHook, waitFor } from "@/__tests__/renderHook";
import PageModule from "./index";
import * as Blobs from "@/models/blobs";
import { CompanyImportPage, showErrorToast } from "turboui";

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
  const calls = jest.mocked(CompanyImportPage).mock.calls;
  const latest = calls[calls.length - 1];
  if (!latest) throw new Error("Page has not rendered");
  return latest[0];
}

beforeEach(async () => {
  jest.mocked(axios.get).mockResolvedValue({ data: { importRuns: [] } });
  jest.mocked(Pages.useLoadedData).mockReturnValue(await PageModule.loader({ params: {}, request: {} }));
});

it("uploads a package, starts its import, and clears the uploaded file after success", async () => {
  renderHook(() => null, { initialProps: undefined, wrapper });
  jest.mocked(Blobs.uploadImportArtifactFile).mockResolvedValue({ id: "blob", url: "file" });
  await act(async () => {
    await props().onSelectPackageFile(new File(["package"], "company.zip"));
  });
  expect(props().packageFile.blobId).toBe("blob");
  expect(props().canStartImport).toBe(true);
  const importRun = { id: "import", insertedAt: "2026-01-01", status: "pending" };
  jest.mocked(axios.post).mockResolvedValue({ data: { importRun } });
  jest.mocked(axios.get).mockResolvedValue({ data: { importRuns: [importRun] } });
  await act(async () => {
    await props().onStartImport();
  });
  expect(axios.post).toHaveBeenCalledWith(
    "/api/v2/company_transfers/start_import",
    { package_blob_id: "blob" },
    expect.anything(),
  );
  await waitFor(() => expect(props().runs[0]?.id).toBe("import"));
  expect(props().packageFile.blobId).toBeNull();
});

it("keeps the uploaded package available for retry after a failed start", async () => {
  renderHook(() => null, { initialProps: undefined, wrapper });
  jest.mocked(Blobs.uploadImportArtifactFile).mockResolvedValue({ id: "blob", url: "file" });
  await act(async () => {
    await props().onSelectPackageFile(new File(["package"], "company.zip"));
  });
  jest.mocked(axios.post).mockRejectedValue(new Error("Failed"));
  await act(async () => {
    await props().onStartImport();
  });
  expect(props().packageFile.blobId).toBe("blob");
  expect(showErrorToast).toHaveBeenCalled();
});
