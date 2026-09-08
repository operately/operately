/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Api, { Activity, Comment } from "@/api";
import { useTaskTimelineItems, invalidateTaskTimelineQueries } from "./useTaskTimelineItems";
import { useOptimisticComments } from "@/models/comments/useOptimisticComments";
import { TASK_ACTIVITY_TYPES } from "@/models/activities/feed";

jest.mock("@/models/activities/feed", () => ({ TASK_ACTIVITY_TYPES: ["task_name_updating"] }));
jest.mock("@/contexts/CurrentCompanyContext", () => ({ useMe: () => ({ id: "me" }) }));
jest.mock("turboui", () => ({ showErrorToast: jest.fn() }));
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
const activity = (id: string) => ({ __typename: "activity", id, action: "task_name_updating" }) as Activity;
const comment = (id: string): Comment => ({ __typename: "comment", id, content: id, reactions: [] });
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((yes) => {
    resolve = yes;
  });
  return { promise, resolve };
}

describe("task timelines", () => {
  let root: Root;
  let client: QueryClient;
  let taskId: string | null;
  let type: "project_task" | "space_task";
  let hook: ReturnType<typeof useTaskTimelineItems>;
  let optimistic: ReturnType<typeof useOptimisticComments>;
  let listActivities: jest.Mock;
  let listComments: jest.Mock;
  function Harness() {
    hook = useTaskTimelineItems(taskId, type);
    optimistic = useOptimisticComments({ taskId, parentType: type, initialComments: hook.comments });
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
    root = createRoot(document.createElement("div"));
    client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
    taskId = "one";
    type = "project_task";
    listActivities = jest.fn(async (input) => ({ activities: [activity(input.scopeId)] }));
    listComments = jest.fn(async (input) => ({ comments: [comment(input.entityId)] }));
    const activityOptions = Api.companies.listActivitiesQueryOptions;
    const commentOptions = Api.comments.listQueryOptions;
    jest
      .spyOn(Api.companies, "listActivitiesQueryOptions")
      .mockImplementation((input) => ({ ...activityOptions(input), queryFn: () => listActivities(input) }));
    jest
      .spyOn(Api.comments, "listQueryOptions")
      .mockImplementation((input) => ({ ...commentOptions(input), queryFn: () => listComments(input) }));
  });
  afterEach(async () => {
    await act(async () => root.unmount());
    client.clear();
    jest.restoreAllMocks();
  });

  it("does not fetch with no selected task and returns stable empty arrays", async () => {
    taskId = null;
    await render();
    const previous = hook;
    await render();
    expect(listActivities).not.toHaveBeenCalled();
    expect(listComments).not.toHaveBeenCalled();
    expect(hook.isLoading).toBe(false);
    expect(hook.comments).toBe(previous.comments);
    expect(hook.activities).toBe(previous.activities);
  });

  it.each(["project_task", "space_task"] as const)("loads %s using the expected inputs", async (entityType) => {
    type = entityType;
    await render();
    expect(listActivities).toHaveBeenCalledWith({ scopeId: "one", scopeType: "task", actions: TASK_ACTIVITY_TYPES });
    expect(listComments).toHaveBeenCalledWith({ entityId: "one", entityType });
    expect(hook.comments.map((c) => c.id)).toEqual(["one"]);
    expect(hook.isLoading).toBe(false);
  });

  it("clears the previous task's timeline while the next task is loading", async () => {
    await render();
    expect(hook.comments.map((c) => c.id)).toEqual(["one"]);
    const nextComments = deferred<{ comments: Comment[] }>();
    const nextActivities = deferred<{ activities: Activity[] }>();
    listComments.mockReturnValue(nextComments.promise);
    listActivities.mockReturnValue(nextActivities.promise);
    taskId = "two";
    await render();
    expect(hook.comments).toEqual([]);
    expect(hook.activities).toEqual([]);
    expect(optimistic.comments).toEqual([]);
    expect(hook.isLoading).toBe(true);
    await act(async () => {
      nextComments.resolve({ comments: [comment("two")] });
      nextActivities.resolve({ activities: [activity("two")] });
      await tick();
    });
    expect(hook.comments.map((c) => c.id)).toEqual(["two"]);
    expect(hook.activities.map((a) => a.id)).toEqual(["two"]);
  });

  it("never displays another task's late response", async () => {
    const old = deferred<{ comments: Comment[] }>();
    listComments.mockReturnValueOnce(old.promise);
    await render();
    taskId = "two";
    await render();
    expect(hook.comments.map((c) => c.id)).toEqual(["two"]);
    await act(async () => {
      old.resolve({ comments: [comment("one")] });
      await tick();
    });
    expect(hook.comments.map((c) => c.id)).toEqual(["two"]);
  });

  it("refreshes active data once invalidated without duplicating activity entries", async () => {
    await render();
    listActivities.mockResolvedValue({ activities: [activity("saved-event")] });
    await act(async () => {
      await invalidateTaskTimelineQueries(client, "one", type);
      await tick();
    });
    expect(hook.activities.map((a) => a.id)).toEqual(["saved-event"]);
    const other = Api.comments.listQueryKey({ entityId: "other", entityType: type });
    client.setQueryData(other, {});
    await invalidateTaskTimelineQueries(client, "inactive", type);
    expect(client.getQueryState(other)?.isInvalidated).toBe(false);
  });

  it("keeps cached data visible if a background refresh fails", async () => {
    await render();
    listActivities.mockRejectedValue(new Error("offline"));
    await act(async () => {
      await invalidateTaskTimelineQueries(client, "one", type);
      await tick();
    });
    expect(hook.activities.map((a) => a.id)).toEqual(["one"]);
    expect(hook.isLoading).toBe(false);
  });

  it("preserves optimistic comments while the subscribed query refreshes", async () => {
    const request = deferred<{ comment: Comment }>();
    jest.spyOn(Api.comments, "createMutationOptions").mockReturnValue({ mutationFn: () => request.promise });
    await render();
    let saved: Promise<boolean> = Promise.resolve(false);
    await act(async () => {
      saved = optimistic.addComment("new");
    });
    await act(async () => {
      await invalidateTaskTimelineQueries(client, "one", type);
      await tick();
    });
    expect(optimistic.comments.some((c) => c.id?.startsWith("temp-"))).toBe(true);
    listComments.mockResolvedValue({ comments: [comment("saved"), comment("one")] });
    await act(async () => {
      request.resolve({ comment: comment("saved") });
      await saved;
      await tick();
    });
    expect(optimistic.comments.map((c) => c.id)).toEqual(["saved", "one"]);
  });
});
