/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import axios from "axios";
import Api from "@/api";
import { queryClient } from "@/api/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@/__tests__/renderHook";

jest.mock("axios");
jest.mock("@/api/staleClient", () => ({ handleStaleClientError: jest.fn() }));
jest.mock("react-router", () => ({}));
jest.mock("turboui", () => ({}));
const wrapper = ({ children }: React.PropsWithChildren) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);
beforeEach(() => {
  queryClient.clear();
  jest.clearAllMocks();
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({});
});
afterEach(() => queryClient.clear());
import { useStartExport, useStartImport } from "./transferLifecycle";

it("starting an export updates and invalidates its list only after success", async () => {
  const key = Api.company_transfers.listExportRunsQueryKey({});
  queryClient.setQueryData(key, { exportRuns: [] });
  const unrelated = Api.spaces.listQueryKey({});
  queryClient.setQueryData(unrelated, {});
  const { result } = renderHook(useStartExport, { initialProps: undefined, wrapper });
  jest.mocked(axios.post).mockRejectedValueOnce(new Error("Failed"));
  await act(async () => {
    await expect(result.current.mutateAsync({})).rejects.toThrow("Failed");
  });
  expect(queryClient.getQueryState(key)?.isInvalidated).toBe(false);
  const run = { id: "run", status: "pending", insertedAt: "2026-01-01" };
  jest.mocked(axios.post).mockResolvedValue({ data: { exportRun: run } });
  await act(async () => {
    await result.current.mutateAsync({});
  });
  expect(queryClient.getQueryData(key)).toEqual({ exportRuns: [run] });
  expect(queryClient.getQueryState(key)?.isInvalidated).toBe(true);
  expect(queryClient.getQueryState(unrelated)?.isInvalidated).toBe(false);
});

it("starting an import updates and invalidates its list only after success", async () => {
  const key = Api.company_transfers.listImportRunsQueryKey({});
  queryClient.setQueryData(key, { importRuns: [] });
  const unrelated = Api.spaces.listQueryKey({});
  queryClient.setQueryData(unrelated, {});
  const { result } = renderHook(useStartImport, { initialProps: undefined, wrapper });
  jest.mocked(axios.post).mockRejectedValueOnce(new Error("Failed"));
  await act(async () => {
    await expect(result.current.mutateAsync({ packageBlobId: "blob" })).rejects.toThrow("Failed");
  });
  expect(queryClient.getQueryState(key)?.isInvalidated).toBe(false);
  const run = { id: "run", status: "pending", insertedAt: "2026-01-01" };
  jest.mocked(axios.post).mockResolvedValue({ data: { importRun: run } });
  await act(async () => {
    await result.current.mutateAsync({ packageBlobId: "blob" });
  });
  expect(queryClient.getQueryData(key)).toEqual({ importRuns: [run] });
  expect(queryClient.getQueryState(key)?.isInvalidated).toBe(true);
  expect(queryClient.getQueryState(unrelated)?.isInvalidated).toBe(false);
});
