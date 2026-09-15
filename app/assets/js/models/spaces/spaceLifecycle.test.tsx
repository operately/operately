/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import axios from "axios";
import Api from "@/api";
import { invalidateSpaceLifecycleQueries, useCreateSpace, useEditSpace } from "./spaceLifecycle";

jest.mock("turboui", () => ({}));
jest.mock("axios");
jest.mock("react-router", () => ({}));

beforeAll(() => {
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({ "x-company-id": "company-1" });
});

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  jest.clearAllMocks();
});

it("invalidates space detail, list, tools, and embedded name queries for include-flag variants", async () => {
  const queryClient = createQueryClient();
  const affected = [
    Api.spaces.getQueryKey({ id: "space-1" }),
    Api.spaces.getQueryKey({ id: "space-1", includePermissions: true }),
    Api.spaces.getQueryKey({ id: "renamed-space-1", includeMembers: true }),
    Api.spaces.listQueryKey({}),
    Api.spaces.listQueryKey({ includeAccessLevels: true }),
    Api.spaces.searchQueryKey({ query: "marketing" }),
    Api.spaces.listToolsQueryKey({ spaceId: "space-1" }),
    Api.spaces.listToolsQueryKey({ spaceId: "old-space-1" }),
    Api.companies.getWorkMapQueryKey({}),
    Api.companies.getWorkMapQueryKey({ spaceId: "space-1" }),
    Api.projects.getQueryKey({ id: "project-1", includeSpace: true }),
    Api.projects.listQueryKey({ includeSpace: true }),
    Api.goals.getQueryKey({ id: "goal-1", includeSpace: true }),
    Api.goals.listQueryKey({ includeSpace: true }),
    Api.resource_hubs.getQueryKey({ id: "hub-1", includeSpace: true }),
  ];
  const unrelated = [
    Api.spaces.getQueryKey({ id: "space-2" }),
    Api.spaces.listToolsQueryKey({ spaceId: "space-2" }),
    Api.spaces.listTasksQueryKey({ spaceId: "space-1" }),
    Api.projects.getQueryKey({ id: "project-1" }),
    Api.goals.getQueryKey({ id: "goal-1" }),
    Api.resource_hubs.getQueryKey({ id: "hub-1" }),
    Api.comments.listQueryKey({ entityId: "space-1", entityType: "project_task" }),
  ];

  [...affected, ...unrelated].forEach((queryKey) => queryClient.setQueryData(queryKey, {}));

  await invalidateSpaceLifecycleQueries(queryClient, "space-1");

  affected.forEach((queryKey) => expect(queryClient.getQueryState(queryKey)?.isInvalidated).toBe(true));
  unrelated.forEach((queryKey) => expect(queryClient.getQueryState(queryKey)?.isInvalidated).toBe(false));
});

it("does not invalidate other space details when creation has no returned space", async () => {
  const queryClient = createQueryClient();
  const otherSpaceKey = Api.spaces.getQueryKey({ id: "space-2" });
  const listKey = Api.spaces.listQueryKey({});

  queryClient.setQueryData(otherSpaceKey, {});
  queryClient.setQueryData(listKey, {});

  await invalidateSpaceLifecycleQueries(queryClient);

  expect(queryClient.getQueryState(otherSpaceKey)?.isInvalidated).toBe(false);
  expect(queryClient.getQueryState(listKey)?.isInvalidated).toBe(true);
});

const mutations = [
  [
    "create",
    useCreateSpace,
    { name: "Marketing", mission: "Tell the story", companyPermissions: 10, publicPermissions: 0 },
    { space: { id: "space-1" } },
  ],
  ["edit", useEditSpace, { id: "space-1", name: "Growth", mission: "Find customers" }, { space: { id: "space-1" } }],
] as const;

it.each(mutations)("%s invalidates only after a successful mutation", async (_name, useHook, input, result) => {
  const queryClient = createQueryClient();
  const spaceKey = Api.spaces.getQueryKey({ id: "space-1" });
  const otherKey = Api.spaces.getQueryKey({ id: "space-2" });
  [spaceKey, otherKey].forEach((queryKey) => queryClient.setQueryData(queryKey, {}));

  let mutate: (input: unknown) => Promise<unknown>;
  function Harness() {
    mutate = useHook().mutateAsync as typeof mutate;
    return null;
  }

  const root = createRoot(document.createElement("div"));
  try {
    await act(async () =>
      root.render(
        <QueryClientProvider client={queryClient}>
          <Harness />
        </QueryClientProvider>,
      ),
    );

    jest.mocked(axios.post).mockRejectedValueOnce(new Error("Save failed"));
    await act(async () => {
      await expect(mutate(input)).rejects.toThrow("Save failed");
    });
    expect(queryClient.getQueryState(spaceKey)?.isInvalidated).toBe(false);

    jest.mocked(axios.post).mockResolvedValueOnce({ data: result });
    await act(async () => {
      await mutate(input);
    });
    expect(queryClient.getQueryState(spaceKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(otherKey)?.isInvalidated).toBe(false);
  } finally {
    await act(async () => root.unmount());
    queryClient.clear();
  }
});

function createQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
}
