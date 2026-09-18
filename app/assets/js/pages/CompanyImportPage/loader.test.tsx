/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import axios from "axios";
import Api from "@/api";
import { queryClient } from "@/api/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import * as Pages from "@/components/Pages";
import { act, renderHook, waitFor } from "@/__tests__/renderHook";
import { loader, useLoadedData } from "./loader";

jest.mock("axios");
jest.mock("@/api/staleClient", () => ({ handleStaleClientError: jest.fn() }));
jest.mock("react-router", () => ({}));
jest.mock("turboui", () => ({}));
jest.mock("@/api/socket", () => ({ setHeaders: jest.fn() }));
jest.mock("@/components/Pages", () => ({ useLoadedData: jest.fn() }));
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

const initial = [{ id: "import", insertedAt: "2026-01-01", status: "failed" }];
it("reuses prefetched data on mount and re-entry, and observes invalidation", async () => {
  jest.mocked(axios.get).mockResolvedValue({ data: { importRuns: initial } });
  const inputs = await loader();
  expect(inputs).toEqual({ queryInput: {} });
  jest.mocked(Pages.useLoadedData).mockReturnValue(inputs);
  const { result } = renderHook(useLoadedData, { initialProps: undefined, wrapper });
  await loader();
  expect(axios.get).toHaveBeenCalledTimes(1);
  expect(result.current.importRuns).toEqual(initial);
  const updated = [];
  jest.mocked(axios.get).mockResolvedValue({ data: { importRuns: updated } });
  await act(() => queryClient.invalidateQueries({ queryKey: Api.company_transfers.listImportRunsQueryKeyPrefix() }));
  await waitFor(() => expect(result.current.importRuns).toEqual(updated));
});

it("propagates authorization errors", async () => {
  const error = { status: 403 };
  jest.mocked(axios.get).mockRejectedValue(error);
  await expect(loader()).rejects.toBe(error);
});

it("clears the company scope before fetching account imports", async () => {
  Api.default.setHeaders({ "x-company-id": "previous" });
  jest.mocked(axios.get).mockResolvedValue({ data: { importRuns: [] } });
  await loader();
  expect(Api.default.getHeaders()).toEqual({});
  expect(axios.get).toHaveBeenCalledWith(
    "/api/v2/company_transfers/list_import_runs",
    expect.objectContaining({ headers: {} }),
  );
});
