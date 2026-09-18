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
import { useExportRuns, useImportRuns, useLoadExportDownload } from "./transferQueries";

it("polls active exports and stops after completion", async () => {
  jest.useFakeTimers();
  const run = { id: "run", status: "running", insertedAt: "2026-01-01" };
  const key = Api.company_transfers.listExportRunsQueryKey({});
  queryClient.setQueryData(key, { exportRuns: [run] });
  const companiesKey = Api.companies.listQueryKey({ includeMemberCount: true });
  queryClient.setQueryData(companiesKey, { companies: [] });
  const { result, unmount } = renderHook(() => useExportRuns({}), { initialProps: undefined, wrapper });
  try {
    expect(axios.get).not.toHaveBeenCalled();
    jest.mocked(axios.get).mockResolvedValue({ data: { exportRuns: [{ ...run, status: "completed" }] } });
    await act(async () => {
      await jest.advanceTimersByTimeAsync(2001);
    });
    expect(result.current.data?.[0]?.status).toBe("completed");
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(queryClient.getQueryState(companiesKey)?.isInvalidated).toBe(false);
    await act(async () => {
      await jest.advanceTimersByTimeAsync(10000);
    });
    expect(axios.get).toHaveBeenCalledTimes(1);
  } finally {
    unmount();
    jest.useRealTimers();
  }
});

it("polls active imports and stops after completion", async () => {
  jest.useFakeTimers();
  const run = { id: "run", status: "running", insertedAt: "2026-01-01" };
  const key = Api.company_transfers.listImportRunsQueryKey({});
  queryClient.setQueryData(key, { importRuns: [run] });
  const companiesKey = Api.companies.listQueryKey({ includeMemberCount: true });
  queryClient.setQueryData(companiesKey, { companies: [] });
  const { result, unmount } = renderHook(() => useImportRuns({}), { initialProps: undefined, wrapper });
  try {
    expect(axios.get).not.toHaveBeenCalled();
    jest.mocked(axios.get).mockResolvedValue({ data: { importRuns: [{ ...run, status: "completed" }] } });
    await act(async () => {
      await jest.advanceTimersByTimeAsync(2001);
    });
    expect(result.current.data?.[0]?.status).toBe("completed");
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(queryClient.getQueryState(companiesKey)?.isInvalidated).toBe(true);
    await act(async () => {
      await jest.advanceTimersByTimeAsync(10000);
    });
    expect(axios.get).toHaveBeenCalledTimes(1);
  } finally {
    unmount();
    jest.useRealTimers();
  }
});

it("fetches a fresh signed URL on every click and updates the list cache", async () => {
  const run = { id: "run", insertedAt: "2026-01-01", status: "completed", packageDownloadUrl: "old" };
  const listKey = Api.company_transfers.listExportRunsQueryKey({});
  queryClient.setQueryData(listKey, { exportRuns: [run] });
  queryClient.setQueryData(Api.company_transfers.getExportRunQueryKey({ id: "run" }), { exportRun: run });
  const { result } = renderHook(useLoadExportDownload, { initialProps: undefined, wrapper });
  jest
    .mocked(axios.get)
    .mockResolvedValueOnce({ data: { exportRun: { ...run, packageDownloadUrl: "first" } } })
    .mockResolvedValueOnce({ data: { exportRun: { ...run, packageDownloadUrl: "second" } } });
  await act(async () => {
    expect((await result.current("run")).packageDownloadUrl).toBe("first");
    expect((await result.current("run")).packageDownloadUrl).toBe("second");
  });
  expect(axios.get).toHaveBeenCalledTimes(2);
  expect(queryClient.getQueryData(listKey)).toEqual({ exportRuns: [{ ...run, packageDownloadUrl: "second" }] });
});
