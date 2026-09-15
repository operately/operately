/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { renderHook, waitFor } from "@/__tests__/renderHook";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import axios from "axios";
import { usePostDiscussion, useEditDiscussion, useArchiveMessage, usePublishDiscussion } from "./discussionLifecycle";
import Api from "@/api";
import { QueryClient, QueryObserver } from "@tanstack/react-query";
import { invalidateDiscussionQueries, invalidateDiscussionInteractionQueries } from "./discussionQueries";

jest.mock("turboui", () => ({}));
beforeAll(() => {
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({ "x-company-id": "company1" });
});

it("invalidates discussion and space variants while preserving unrelated caches", async () => {
  const client = new QueryClient();
  const affected = [
    Api.spaces.getDiscussionQueryKey({ id: "discussion1" }),
    Api.spaces.getDiscussionQueryKey({ id: "old-discussion1", includeReactions: true }),
    Api.spaces.listDiscussionsQueryKey({ spaceId: "space1" }),
    Api.spaces.listDiscussionsQueryKey({ spaceId: "old-space1", includeMyDrafts: true, includeCommentsCount: true }),
    Api.spaces.getQueryKey({ id: "old-space1", includeUnreadNotifications: true }),
    Api.spaces.listToolsQueryKey({ spaceId: "space1" }),
    Api.notifications.isSubscribedQueryKey({ resourceId: "old-discussion1", resourceType: "message" }),
    Api.companies.listActivitiesQueryKey({ scopeType: "space", scopeId: "space1", actions: [] }),
  ];
  const unrelated = [
    Api.spaces.getDiscussionQueryKey({ id: "discussion2" }),
    Api.spaces.listDiscussionsQueryKey({ spaceId: "space2" }),
    Api.spaces.getQueryKey({ id: "space2" }),
    Api.spaces.listToolsQueryKey({ spaceId: "space2" }),
    Api.notifications.isSubscribedQueryKey({ resourceId: "discussion2", resourceType: "message" }),
    Api.notifications.isSubscribedQueryKey({ resourceId: "discussion1", resourceType: "goal_update" }),
    Api.projects.getQueryKey({ id: "project1" }),
  ];
  [...affected, ...unrelated].forEach((key) => client.setQueryData(key, {}));
  await invalidateDiscussionQueries(client, { spaceId: "space1", discussionId: "discussion1" });
  affected.forEach((key) => expect(client.getQueryState(key)?.isInvalidated).toBe(true));
  unrelated.forEach((key) => expect(client.getQueryState(key)?.isInvalidated).toBe(false));
  client.clear();
});

jest.mock("axios");
jest.mock("react-router", () => ({}));
beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  jest.clearAllMocks();
});

const mutations = [
  ["create", usePostDiscussion, { spaceId: "space1", title: "Discussion", body: "{}" }],
  ["edit", () => useEditDiscussion("space1"), { id: "discussion1", title: "Changed" }],
  ["publish", () => usePublishDiscussion("space1"), { id: "discussion1" }],
  ["archive", () => useArchiveMessage("space1"), { id: "discussion1" }],
] as const;

it.each(mutations)("%s invalidates only after a successful mutation", async (_name, useHook, input) => {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const space = Api.spaces.getQueryKey({ id: "space1" });
  const other = Api.spaces.getQueryKey({ id: "space2" });
  [space, other].forEach((key) => client.setQueryData(key, {}));
  let mutate: (input: any) => Promise<unknown>;
  function Harness() {
    mutate = useHook().mutateAsync as typeof mutate;
    return null;
  }
  const root = createRoot(document.createElement("div"));
  try {
    await act(async () =>
      root.render(React.createElement(QueryClientProvider, { client }, React.createElement(Harness))),
    );
    jest.mocked(axios.post).mockRejectedValueOnce(new Error("Save failed"));
    await act(async () => {
      await expect(mutate(input)).rejects.toThrow("Save failed");
    });
    expect(client.getQueryState(space)?.isInvalidated).toBe(false);
    jest.mocked(axios.post).mockResolvedValueOnce({ data: { discussion: { id: "discussion1" } } });
    await act(async () => {
      await mutate(input);
    });
    expect(client.getQueryState(space)?.isInvalidated).toBe(true);
    expect(client.getQueryState(other)?.isInvalidated).toBe(false);
  } finally {
    await act(async () => root.unmount());
    client.clear();
  }
});

it.each(mutations)("%s waits for invalidation before resolving", async (_name, useHook, input) => {
  const client = new QueryClient();
  let finish = () => {};
  const pending = new Promise<void>((resolve) => {
    finish = resolve;
  });
  const invalidate = jest.spyOn(client, "invalidateQueries").mockReturnValue(pending);
  let mutate: (input: any) => Promise<unknown>;
  function Harness() {
    mutate = useHook().mutateAsync as typeof mutate;
    return null;
  }
  const root = createRoot(document.createElement("div"));
  try {
    await act(async () =>
      root.render(React.createElement(QueryClientProvider, { client }, React.createElement(Harness))),
    );
    jest.mocked(axios.post).mockResolvedValueOnce({ data: { discussion: { id: "discussion1" } } });
    let completed = false;
    let saving: Promise<unknown>;
    act(() => {
      saving = mutate(input).then(() => {
        completed = true;
      });
    });
    await waitFor(() => expect(invalidate).toHaveBeenCalled());
    expect(completed).toBe(false);
    await act(async () => {
      finish();
      await saving;
    });
    expect(completed).toBe(true);
  } finally {
    finish();
    await act(async () => root.unmount());
    client.clear();
  }
});

it("invalidates only this discussion's comments and defers optimistic refetches", async () => {
  const client = new QueryClient();
  const affected = Api.comments.listQueryKey({ entityId: "old-discussion1", entityType: "message" });
  const unrelated = Api.comments.listQueryKey({ entityId: "discussion2", entityType: "message" });
  const otherType = Api.comments.listQueryKey({ entityId: "discussion1", entityType: "goal_update" });
  [affected, unrelated, otherType].forEach((key) => client.setQueryData(key, {}));
  const invalidate = jest.spyOn(client, "invalidateQueries");
  await invalidateDiscussionInteractionQueries(client, { spaceId: "space1", discussionId: "discussion1" }, "none");
  expect(client.getQueryState(affected)?.isInvalidated).toBe(true);
  expect(client.getQueryState(unrelated)?.isInvalidated).toBe(false);
  expect(client.getQueryState(otherType)?.isInvalidated).toBe(false);
  expect(invalidate.mock.calls.every(([filters]) => filters?.refetchType === "none")).toBe(true);
  client.clear();
});

it("archives without refetching the removed detail while refreshing the active list", async () => {
  const client = new QueryClient();
  const detailKey = Api.spaces.getDiscussionQueryKey({ id: "discussion1" });
  const listKey = Api.spaces.listDiscussionsQueryKey({ spaceId: "space1" });
  const fetchDetail = jest.fn().mockResolvedValue({});
  const fetchList = jest.fn().mockResolvedValue({ discussions: [] });
  client.setQueryData(detailKey, {});
  client.setQueryData(listKey, {});
  const detail = new QueryObserver(client, { queryKey: detailKey, queryFn: fetchDetail, staleTime: Infinity });
  const list = new QueryObserver(client, { queryKey: listKey, queryFn: fetchList, staleTime: Infinity });
  const unsubscribeDetail = detail.subscribe(() => {});
  const unsubscribeList = list.subscribe(() => {});
  const { result, unmount } = renderHook(() => useArchiveMessage("space1"), {
    initialProps: undefined,
    wrapper: ({ children }) => React.createElement(QueryClientProvider, { client }, children),
  });
  try {
    jest.mocked(axios.post).mockResolvedValueOnce({ data: {} });
    await act(() => result.current.mutateAsync({ id: "discussion1" }));
    expect(fetchDetail).not.toHaveBeenCalled();
    expect(client.getQueryState(detailKey)?.isInvalidated).toBe(true);
    expect(fetchList).toHaveBeenCalledTimes(1);
  } finally {
    unmount();
    unsubscribeDetail();
    unsubscribeList();
    client.clear();
  }
});

it("keeps the original space with a mutation that finishes after navigation", async () => {
  const client = new QueryClient();
  const original = Api.spaces.listDiscussionsQueryKey({ spaceId: "space1" });
  const next = Api.spaces.listDiscussionsQueryKey({ spaceId: "space2" });
  [original, next].forEach((key) => client.setQueryData(key, {}));
  let finish = (_value: unknown) => {};
  jest.mocked(axios.post).mockReturnValueOnce(
    new Promise((resolve) => {
      finish = resolve;
    }),
  );
  const { result, rerender, unmount } = renderHook((spaceId: string) => useEditDiscussion(spaceId), {
    initialProps: "space1",
    wrapper: ({ children }) => React.createElement(QueryClientProvider, { client }, children),
  });
  try {
    let saving: Promise<unknown>;
    act(() => {
      saving = result.current.mutateAsync({ id: "discussion1", title: "Changed" });
    });
    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    rerender("space2");
    await act(async () => {
      finish({ data: { discussion: { id: "discussion1" } } });
      await saving;
    });
    expect(client.getQueryState(original)?.isInvalidated).toBe(true);
    expect(client.getQueryState(next)?.isInvalidated).toBe(false);
  } finally {
    unmount();
    client.clear();
  }
});
