/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import axios from "axios";
import Api from "@/api";
import { queryClient } from "@/api/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@/__tests__/renderHook";
import { useVersionComparison } from "./useVersionComparison";

jest.mock("axios");
jest.mock("turboui", () => ({}));

const wrapper = ({ children }: React.PropsWithChildren) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

beforeEach(() => {
  queryClient.clear();
  jest.clearAllMocks();
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({});
  jest.mocked(axios.get).mockImplementation((_url, config) =>
    Promise.resolve({
      data: { version: { versionNumber: config?.params.version_number, title: "Snapshot", content: '{"type":"doc"}' } },
    }),
  );
});

afterEach(() => queryClient.clear());

it("loads both snapshots, parses content, and reuses immutable versions on re-entry", async () => {
  const { result, unmount } = renderHook(() => useVersionComparison("doc1", 1, 2), {
    initialProps: undefined,
    wrapper,
  });
  await waitFor(() => expect(result.current.comparisonStatus).toBe("ready"));

  expect(result.current.before?.versionNumber).toBe(1);
  expect(result.current.after?.versionNumber).toBe(2);
  expect(result.current.after?.content).toEqual({ type: "doc" });
  unmount();

  renderHook(() => useVersionComparison("doc1", 1, 2), { initialProps: undefined, wrapper });
  expect(axios.get).toHaveBeenCalledTimes(2);
});

it("does not request snapshots for an empty selection", () => {
  const { result } = renderHook(() => useVersionComparison("doc1", null, null), { initialProps: undefined, wrapper });

  expect(result.current.comparisonStatus).toBe("idle");
  expect(axios.get).not.toHaveBeenCalled();
});

it("shows an error for a missing snapshot and allows retry", async () => {
  jest.mocked(axios.get).mockResolvedValue({ data: { version: null } });
  const { result } = renderHook(() => useVersionComparison("doc1", null, 2), { initialProps: undefined, wrapper });
  await waitFor(() => expect(result.current.comparisonStatus).toBe("error"));

  jest
    .mocked(axios.get)
    .mockResolvedValue({ data: { version: { versionNumber: 2, title: "Recovered", content: "" } } });
  await act(() => result.current.onRetryComparison());
  await waitFor(() => expect(result.current.comparisonStatus).toBe("ready"));

  expect(result.current.after?.content).toBe("");
});

it("retains snapshots after a failed background refresh and isolates a different document", async () => {
  const { result, rerender } = renderHook((id: string) => useVersionComparison(id, 1, 2), {
    initialProps: "doc1",
    wrapper,
  });
  await waitFor(() => expect(result.current.comparisonStatus).toBe("ready"));

  jest.mocked(axios.get).mockRejectedValue(new Error("Offline"));
  await act(() => queryClient.invalidateQueries({ queryKey: Api.documents.getVersionQueryKeyPrefix() }));
  expect(result.current.comparisonStatus).toBe("ready");
  expect(result.current.after?.title).toBe("Snapshot");

  rerender("doc2");
  await waitFor(() => expect(result.current.comparisonStatus).toBe("error"));
  expect(result.current.after).toBeNull();
});
