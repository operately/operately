/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Api, { Activity } from "@/api";
import { useFeedItemsQuery } from "./useFeedItemsQuery";
import { DISPLAYED_IN_FEED } from "@/features/activities";
import { useDeleteFeedActivity } from "@/models/activities/activityLifecycle";

jest.mock("turboui", () => ({ showErrorToast: jest.fn() }));
jest.mock("@/features/activities", () => ({ DISPLAYED_IN_FEED: ["project_created"] }));
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
const activity = (id: string) => ({ __typename: "activity", id, action: "project_created" }) as Activity;

describe("shared activity feed", () => {
  let root: Root;
  let client: QueryClient;
  let scope: Parameters<typeof useFeedItemsQuery>[0];
  let hook: ReturnType<typeof useFeedItemsQuery>;
  let deletion: ReturnType<typeof useDeleteFeedActivity>;
  let list: jest.Mock;
  function Harness() {
    hook = useFeedItemsQuery(scope, "resource-1");
    deletion = useDeleteFeedActivity();
    return null;
  }
  async function render() {
    await act(async () => {
      root.render(
        <QueryClientProvider client={client}>
          <Harness />
        </QueryClientProvider>,
      );
      await tick();
    });
    await act(async () => {
      await tick();
    });
  }
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    Api.default.setBasePath("/api/v2");
    Api.default.setHeaders({ "x-company-id": "company-1" });
    client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
    root = createRoot(document.createElement("div"));
    scope = "company";
    list = jest.fn(async () => ({ activities: [activity("one"), activity("two")] }));
    jest.spyOn(Api.companies, "listActivities").mockImplementation((input) => list(input));
  });
  afterEach(async () => {
    await act(async () => root.unmount());
    client.clear();
    jest.restoreAllMocks();
  });

  it.each(["company", "project", "goal", "space", "person"] as const)(
    "loads the %s feed with the shared filters",
    async (type) => {
      scope = type;
      await render();
      expect(list).toHaveBeenCalledWith({
        scopeType: type,
        scopeId: "resource-1",
        actions: DISPLAYED_IN_FEED,
        paginate: true,
      });
      expect(hook.loading).toBe(false);
      expect(hook.error).toBeNull();
      expect(hook.data?.activities).toHaveLength(2);
    },
  );

  it("keeps cached entries visible during background fetching", async () => {
    await render();
    let resolve!: (data: { activities: Activity[] }) => void;
    list.mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    let fetching = Promise.resolve();
    await act(async () => {
      fetching = client.invalidateQueries({ queryKey: Api.companies.listActivitiesQueryKeyPrefix() });
      await tick();
    });
    expect(hook.loading).toBe(false);
    expect(hook.data?.activities).toHaveLength(2);
    await act(async () => {
      resolve({ activities: [activity("two")] });
      await fetching;
      await tick();
    });
    expect(hook.data?.activities).toHaveLength(1);
  });

  it("appends older pages and identifies the first activity of the latest page", async () => {
    list.mockResolvedValueOnce({ activities: [activity("one")], nextCursor: "older" });
    await render();
    expect(hook.pagination.targetActivityId).toBe("one");
    expect(hook.pagination.hasNextPage).toBe(true);
    list.mockResolvedValueOnce({ activities: [activity("two")], nextCursor: null });
    await act(async () => {
      await hook.pagination.onLoadMore();
      await tick();
    });
    expect(list).toHaveBeenLastCalledWith({
      scopeType: "company",
      scopeId: "resource-1",
      actions: DISPLAYED_IN_FEED,
      cursor: "older",
      paginate: true,
    });
    expect(hook.data?.activities.map((item) => item.id)).toEqual(["one", "two"]);
    expect(hook.pagination.targetActivityId).toBe("two");
    expect(hook.pagination.hasNextPage).toBe(false);
  });

  it("keeps loaded activities visible when the next page fails and supports retry", async () => {
    list.mockResolvedValueOnce({ activities: [activity("one")], nextCursor: "older" });
    await render();
    list.mockRejectedValueOnce(new Error("offline"));
    await act(async () => {
      await hook.pagination.onLoadMore();
      await tick();
    });
    expect(hook.error).toBeNull();
    expect(hook.data?.activities).toHaveLength(1);
    expect(hook.pagination.hasError).toBe(true);
    list.mockResolvedValueOnce({ activities: [activity("two")], nextCursor: null });
    await act(async () => {
      await hook.pagination.onLoadMore();
      await tick();
    });
    expect(hook.pagination.hasError).toBe(false);
    expect(hook.data?.activities).toHaveLength(2);
  });

  it("does not reuse an ordinary query's cache entry", async () => {
    const key = Api.companies.listActivitiesQueryKey({
      scopeType: "company",
      scopeId: "resource-1",
      actions: DISPLAYED_IN_FEED,
      paginate: true,
    });
    client.setQueryData(key, { activities: [activity("ordinary")] });
    await render();
    expect(hook.data?.activities.map((item) => item.id)).toEqual(["one", "two"]);
    expect(client.getQueryData(key)).toEqual({ activities: [activity("ordinary")] });
  });

  it("retargets the previous nonempty page when deletion empties the latest page", async () => {
    jest
      .spyOn(Api.companies, "deleteActivityMutationOptions")
      .mockReturnValue({ mutationFn: async () => ({ success: true }) });
    list.mockResolvedValueOnce({ activities: [activity("one")], nextCursor: "older" });
    await render();
    list.mockResolvedValueOnce({ activities: [activity("two")], nextCursor: "oldest" });
    await act(async () => {
      await hook.pagination.onLoadMore();
      await tick();
    });
    expect(hook.pagination.targetActivityId).toBe("two");
    list.mockRejectedValue(new Error("refresh offline"));
    await act(async () => {
      await deletion.mutateAsync({ activityId: "two" });
      await tick();
    });
    expect(hook.data?.activities.map((item) => item.id)).toEqual(["one"]);
    expect(hook.pagination.targetActivityId).toBe("one");
    expect(hook.pagination.hasNextPage).toBe(true);
    expect(hook.error).toBeNull();
  });

  it("does not resurrect a deleted item from cached data after remounting", async () => {
    jest
      .spyOn(Api.companies, "deleteActivityMutationOptions")
      .mockReturnValue({ mutationFn: async () => ({ success: true }) });
    await render();
    list.mockRejectedValue(new Error("refresh offline"));
    await act(async () => {
      await deletion.mutateAsync({ activityId: "one" });
      await tick();
    });
    expect(hook.data?.activities.map((a) => a.id)).toEqual(["two"]);
    await act(async () => root.unmount());
    root = createRoot(document.createElement("div"));
    await render();
    expect(hook.data?.activities.map((a) => a.id)).toEqual(["two"]);
  });
});
