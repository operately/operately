/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import { act, renderHook, waitFor } from "@/__tests__/renderHook";
import axios from "axios";
import { QueryClientProvider, QueryObserver } from "@tanstack/react-query";
import Api from "./index";
import { loaderBackedQueryOptions, queryClient, useLoadedQuery } from "./queryClient";

jest.mock("axios");

describe("queryClient", () => {
  beforeEach(() => {
    queryClient.clear();
    Api.default.setBasePath("/api/v2");
    Api.default.setHeaders({ "x-company-id": "company-1" });
    jest.mocked(axios.get).mockReset();
  });

  it("uses stale-while-revalidate defaults without retrying failed requests", () => {
    expect(queryClient.getDefaultOptions().queries).toMatchObject({
      staleTime: 0,
      gcTime: 5 * 60 * 1000,
      refetchOnMount: true,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: false,
    });
  });

  it("deduplicates and caches opt-in generated queries by their complete input", async () => {
    jest.mocked(axios.get).mockResolvedValue({ data: { project: { id: "project-1" } } });
    const input = { id: "project-1", includeSpace: true };

    await Promise.all([Api.projects.getQuery(input), Api.projects.getQuery(input)]);
    await Api.projects.getQuery({ ...input });

    expect(axios.get).toHaveBeenCalledTimes(1);

    await Api.projects.getQuery({ ...input, includeSpace: false });

    expect(axios.get).toHaveBeenCalledTimes(2);
  });

  it("does not refetch loader-backed queries when the page mounts", async () => {
    jest.mocked(axios.get).mockResolvedValue({ data: { project: { id: "project-1" } } });
    const input = { id: "project-1" };

    await Api.projects.getQuery(input);

    const observer = new QueryObserver(queryClient, loaderBackedQueryOptions(Api.projects.getQueryOptions(input)));
    const unsubscribe = observer.subscribe(() => {});

    expect(axios.get).toHaveBeenCalledTimes(1);

    unsubscribe();
  });

  it("refetches active loader-backed queries after invalidation", async () => {
    jest.mocked(axios.get).mockResolvedValue({ data: { project: { id: "project-1" } } });
    const input = { id: "project-1" };

    await Api.projects.getQuery(input);

    const observer = new QueryObserver(queryClient, loaderBackedQueryOptions(Api.projects.getQueryOptions(input)));
    const unsubscribe = observer.subscribe(() => {});

    await queryClient.invalidateQueries({ queryKey: Api.projects.getQueryKey(input) });

    expect(axios.get).toHaveBeenCalledTimes(2);

    unsubscribe();
  });

  it("refetches a loader-backed query invalidated between loading and mounting", async () => {
    jest.mocked(axios.get).mockResolvedValue({ data: { project: { id: "project-1" } } });
    const input = { id: "project-1" };

    await Api.projects.getQuery(input);
    await queryClient.invalidateQueries({ queryKey: Api.projects.getQueryKey(input), refetchType: "none" });

    const observer = new QueryObserver(queryClient, loaderBackedQueryOptions(Api.projects.getQueryOptions(input)));
    await waitForRefetch(observer, 2);

    expect(axios.get).toHaveBeenCalledTimes(2);
  });

  it("refetches invalidated imperative queries on their next load", async () => {
    jest.mocked(axios.get).mockResolvedValue({ data: { project: { id: "project-1" } } });
    const input = { id: "project-1" };

    await Api.projects.getQuery(input);
    await queryClient.invalidateQueries({ queryKey: Api.projects.getQueryKey(input), refetchType: "none" });
    await Api.projects.getQuery(input);

    expect(axios.get).toHaveBeenCalledTimes(2);
  });

  it("keeps normal mount refetching for queries that are not loader-backed", async () => {
    jest.mocked(axios.get).mockResolvedValue({ data: { project: { id: "project-1" } } });
    const input = { id: "project-1" };

    await Api.projects.getQuery(input);

    const observer = new QueryObserver(queryClient, Api.projects.getQueryOptions(input));
    await waitForRefetch(observer, 2);

    expect(axios.get).toHaveBeenCalledTimes(2);
  });
});

function waitForRefetch(observer: QueryObserver, expectedRequestCount: number): Promise<void> {
  return new Promise((resolve) => {
    const unsubscribe = observer.subscribe((result) => {
      if (result.fetchStatus === "idle" && jest.mocked(axios.get).mock.calls.length === expectedRequestCount) {
        unsubscribe();
        resolve();
      }
    });
  });
}

describe("useLoadedQuery error handling", () => {
  const queryKey = ["loaded-query"];
  const wrapper = ({ children }: React.PropsWithChildren) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  beforeEach(() => queryClient.clear());
  afterEach(() => queryClient.clear());

  async function failedQuery() {
    const error = Object.assign(new Error("Service unavailable"), { response: { status: 503 } });
    const queryFn = jest.fn<Promise<string>, []>().mockRejectedValue(error);
    await expect(queryClient.fetchQuery({ queryKey, queryFn })).rejects.toBe(error);
    return { error, queryFn };
  }

  it("propagates the original failure without retrying it on mount", async () => {
    const { error, queryFn } = await failedQuery();
    const log = jest.spyOn(console, "error").mockImplementation(() => {});
    try {
      let caught: unknown;
      try {
        renderHook(() => useLoadedQuery({ queryKey, queryFn }), { initialProps: undefined, wrapper });
      } catch (failure) {
        caught = failure;
      }
      expect(caught).toBe(error);
      expect(queryFn).toHaveBeenCalledTimes(1);
    } finally {
      log.mockRestore();
    }
  });

  it.each([false, () => false])("keeps a disabled query's cached failure local (%#)", async (enabled) => {
    const { error, queryFn } = await failedQuery();
    const { result } = renderHook(() => useLoadedQuery({ queryKey, queryFn, enabled }), {
      initialProps: undefined,
      wrapper,
    });
    expect(result.current.error).toBe(error);
    expect(queryFn).toHaveBeenCalledTimes(1);
  });

  it("allows local error handling and an explicit retry", async () => {
    const { error, queryFn } = await failedQuery();
    const { result } = renderHook(() => useLoadedQuery({ queryKey, queryFn, throwOnError: false }), {
      initialProps: undefined,
      wrapper,
    });
    expect(result.current.error).toBe(error);
    queryFn.mockResolvedValue("Recovered");
    await act(() => result.current.refetch());
    await waitFor(() => expect(result.current.data).toBe("Recovered"));
  });

  it("retains cached data when a background refresh fails", async () => {
    const error = new Error("Offline");
    const queryFn = jest.fn().mockRejectedValue(error);
    queryClient.setQueryData(queryKey, "Cached content");
    const { result } = renderHook(() => useLoadedQuery<string>({ queryKey, queryFn }), {
      initialProps: undefined,
      wrapper,
    });
    await act(() => queryClient.invalidateQueries({ queryKey }));
    await waitFor(() => expect(result.current.error).toBe(error));
    expect(result.current.data).toBe("Cached content");
  });
});
