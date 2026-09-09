/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { QueryClient, QueryClientProvider, InfiniteData } from "@tanstack/react-query";
import Api, { Activity, CompaniesListActivitiesResult } from "@/api";
import { useDeleteFeedActivity } from "./activityLifecycle";

jest.mock("turboui", () => ({ showErrorToast: jest.fn() }));

const activity = (id: string) => ({ __typename: "activity", id, action: "project_created" }) as Activity;

describe("feed activity deletion", () => {
  let client: QueryClient;
  let root: Root;
  let deletion: ReturnType<typeof useDeleteFeedActivity>;
  let remove: jest.Mock;
  const feedKeys = () =>
    (["company", "project", "goal", "space", "person"] as const).map((scopeType) =>
      Api.companies.listActivitiesQueryKey({ scopeType, scopeId: "resource", actions: ["project_created"] }),
    );
  const commentsKey = () => Api.comments.listQueryKey({ entityId: "task", entityType: "project_task" });

  beforeEach(async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    Api.default.setBasePath("/api/v2");
    Api.default.setHeaders({ "x-company-id": "company-1" });
    client = new QueryClient();
    root = createRoot(document.createElement("div"));
    remove = jest.fn().mockResolvedValue({ success: true });
    jest.spyOn(Api.companies, "deleteActivityMutationOptions").mockReturnValue({ mutationFn: remove });
    feedKeys().forEach((key) => client.setQueryData(key, { activities: [activity("deleted"), activity("kept")] }));
    client.setQueryData(commentsKey(), { comments: [] });
    function Harness() {
      deletion = useDeleteFeedActivity();
      return null;
    }
    await act(async () =>
      root.render(
        <QueryClientProvider client={client}>
          <Harness />
        </QueryClientProvider>,
      ),
    );
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    client.clear();
    jest.restoreAllMocks();
  });

  it("removes deleted entries from every cached feed scope and preserves unrelated queries", async () => {
    await act(async () => {
      await deletion.mutateAsync({ activityId: "deleted" });
    });
    feedKeys().forEach((key) => {
      expect(client.getQueryData<CompaniesListActivitiesResult>(key)?.activities.map((item) => item.id)).toEqual([
        "kept",
      ]);
      expect(client.getQueryState(key)?.isInvalidated).toBe(true);
    });
    expect(client.getQueryState(commentsKey())?.isInvalidated).toBe(false);
  });

  it("keeps cached entries when deletion fails", async () => {
    remove.mockRejectedValue(new Error("offline"));
    await act(async () => {
      await expect(deletion.mutateAsync({ activityId: "deleted" })).rejects.toThrow("offline");
    });
    feedKeys().forEach((key) => {
      expect(client.getQueryData<CompaniesListActivitiesResult>(key)?.activities).toHaveLength(2);
      expect(client.getQueryState(key)?.isInvalidated).toBe(false);
    });
  });

  it("removes activities from all infinite pages without changing their cursors", async () => {
    const firstKey = feedKeys()[0];
    if (!firstKey) throw new Error("Expected a feed query key");
    const key = [...firstKey, "infinite"];
    client.setQueryData(key, {
      pages: [
        { activities: [activity("deleted"), activity("first")], nextCursor: "older" },
        { activities: [activity("second"), activity("deleted")], nextCursor: null },
      ],
      pageParams: [null, "older"],
    });
    await act(async () => {
      await deletion.mutateAsync({ activityId: "deleted" });
    });
    const cached = client.getQueryData<InfiniteData<CompaniesListActivitiesResult>>(key);
    expect(cached?.pages.map((page) => page.activities.map((item) => item.id))).toEqual([["first"], ["second"]]);
    expect(cached?.pageParams).toEqual([null, "older"]);
    expect(cached?.pages.map((page) => page.nextCursor)).toEqual(["older", null]);
    expect(client.getQueryState(key)?.isInvalidated).toBe(true);
  });
});
