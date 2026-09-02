import axios from "axios";
import { QueryObserver } from "@tanstack/react-query";
import Api from "./index";
import { loaderBackedQueryOptions, queryClient } from "./queryClient";

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

  it("keeps existing endpoint functions uncached", async () => {
    jest.mocked(axios.get).mockResolvedValue({ data: { project: { id: "project-1" } } });
    const input = { id: "project-1" };

    await Api.projects.get(input);
    await Api.projects.get(input);

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
