/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider, QueryObserver } from "@tanstack/react-query";
import axios from "axios";
import Api from "@/api";
import {
  invalidateSpaceLifecycleQueries,
  invalidateDeletedSpaceQueries,
  invalidateSpaceToolsQueries,
  useCreateSpace,
  useDeleteSpace,
  useEditSpace,
  useUpdateSpaceTools,
} from "./spaceLifecycle";

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
    Api.spaces.countByAccessLevelQueryKey({ accessLevel: "edit_access" }),
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
    Api.resource_hubs.getFolderQueryKey({ id: "folder-1", includeSpace: true }),
    Api.resource_hubs.getFolderQueryKey({
      id: "folder-1",
      includeSpace: true,
      includeNodes: true,
      includePathToFolder: true,
      includeResourceHub: true,
      includeGoal: true,
      includeProject: true,
    }),
  ];

  const unrelated = [
    Api.spaces.getQueryKey({ id: "space-2" }),
    Api.spaces.listToolsQueryKey({ spaceId: "space-2" }),
    Api.spaces.listTasksQueryKey({ spaceId: "space-1" }),
    Api.projects.getQueryKey({ id: "project-1" }),
    Api.goals.getQueryKey({ id: "goal-1" }),
    Api.resource_hubs.getQueryKey({ id: "hub-1" }),
    Api.resource_hubs.getFolderQueryKey({ id: "folder-1" }),
    Api.resource_hubs.getFolderQueryKey({ id: "folder-1", includeSpace: false }),
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

it("invalidates only the matching space detail and tools variants after tools change", async () => {
  const queryClient = createQueryClient();
  const affected = [
    Api.spaces.getQueryKey({ id: "space-1" }),
    Api.spaces.getQueryKey({ id: "renamed-space-1", includePermissions: true }),
    Api.spaces.getQueryKey({ id: "space-1", includeMembers: true }),
    Api.spaces.listToolsQueryKey({ spaceId: "space-1" }),
    Api.spaces.listToolsQueryKey({ spaceId: "old-space-1" }),
  ];

  const unrelated = [
    Api.spaces.getQueryKey({ id: "space-2" }),
    Api.spaces.listToolsQueryKey({ spaceId: "space-2" }),
    Api.spaces.listQueryKey({}),
    Api.spaces.searchQueryKey({ query: "marketing" }),
    Api.spaces.listTasksQueryKey({ spaceId: "space-1" }),
    Api.companies.getWorkMapQueryKey({ spaceId: "space-1" }),
    Api.projects.getQueryKey({ id: "project-1", includeSpace: true }),
  ];

  [...affected, ...unrelated].forEach((queryKey) => queryClient.setQueryData(queryKey, {}));

  await invalidateSpaceToolsQueries(queryClient, "space-1");

  affected.forEach((queryKey) => expect(queryClient.getQueryState(queryKey)?.isInvalidated).toBe(true));
  unrelated.forEach((queryKey) => expect(queryClient.getQueryState(queryKey)?.isInvalidated).toBe(false));
  queryClient.clear();
});

const mutations = [
  ["delete", useDeleteSpace, { spaceId: "space-1" }, { success: true }],
  [
    "create",
    useCreateSpace,
    { name: "Marketing", mission: "Tell the story", companyPermissions: 10, publicPermissions: 0 },
    { space: { id: "space-1" } },
  ],
  ["edit", useEditSpace, { id: "space-1", name: "Growth", mission: "Find customers" }, { space: { id: "space-1" } }],
  ["update tools", useUpdateSpaceTools, { spaceId: "space-1", tools: { tasksEnabled: true } }, { success: true }],
] as const;

it.each(mutations)("%s invalidates only after a successful mutation", async (name, useHook, input, result) => {
  const queryClient = createQueryClient();
  const spaceKey = Api.spaces.getQueryKey({ id: "space-1" });
  const otherKey = Api.spaces.getQueryKey({ id: "space-2" });
  const toolsKey = Api.spaces.listToolsQueryKey({ spaceId: "space-1" });
  const otherToolsKey = Api.spaces.listToolsQueryKey({ spaceId: "space-2" });
  [spaceKey, otherKey, toolsKey, otherToolsKey].forEach((queryKey) => queryClient.setQueryData(queryKey, {}));

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
    expect(queryClient.getQueryState(toolsKey)?.isInvalidated).toBe(false);

    jest.mocked(axios.post).mockResolvedValueOnce({ data: result });
    await act(async () => {
      await mutate(input);
    });

    expect(queryClient.getQueryState(spaceKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(otherKey)?.isInvalidated).toBe(false);
    expect(queryClient.getQueryState(toolsKey)?.isInvalidated).toBe(name !== "delete");
    expect(queryClient.getQueryState(otherToolsKey)?.isInvalidated).toBe(false);
  } finally {
    await act(async () => root.unmount());
    queryClient.clear();
  }
});

function createQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
}

it("deleting a space invalidates its details and surviving lists without refreshing deleted resources", async () => {
  const client = createQueryClient();
  const details = [
    Api.spaces.getQueryKey({ id: "space1" }),
    Api.spaces.getQueryKey({ id: "renamed-space1", includeMembers: true }),
  ];
  const lists = [
    Api.spaces.listQueryKey({}),
    Api.spaces.searchQueryKey({ query: "marketing" }),
    Api.spaces.countByAccessLevelQueryKey({ accessLevel: "edit_access" }),
  ];
  const companyMap = Api.companies.getWorkMapQueryKey({});
  const otherMap = Api.companies.getWorkMapQueryKey({ spaceId: "space2" });
  const untouched = [
    Api.spaces.getQueryKey({ id: "space2" }),
    Api.spaces.listToolsQueryKey({ spaceId: "space1" }),
    Api.spaces.listTasksQueryKey({ spaceId: "space1" }),
    Api.spaces.listDiscussionsQueryKey({ spaceId: "space1" }),
    Api.projects.listQueryKey({ spaceId: "space1" }),
    Api.goals.listQueryKey({ spaceId: "space1" }),
    Api.kpis.listKpisQueryKey({ spaceId: "space1" }),
    Api.project_templates.listQueryKey({ spaceId: "space1" }),
    Api.people.getBindedQueryKey({ resourseType: "space", resourseId: "space1" }),
    Api.companies.getWorkMapQueryKey({ spaceId: "old-space1" }),
    Api.companies.listActivitiesQueryKey({ scopeType: "space", scopeId: "space1", actions: [] }),
  ];

  const fetchDeleted = jest.fn().mockResolvedValue({});
  const fetchCompany = jest.fn().mockResolvedValue({});
  [...details, ...lists, companyMap, otherMap, ...untouched].forEach((key) => client.setQueryData(key, {}));

  const observers = [...details, ...untouched, companyMap].map(
    (key) =>
      new QueryObserver(client, {
        queryKey: key,
        queryFn: key === companyMap ? fetchCompany : fetchDeleted,
        staleTime: Infinity,
      }),
  );
  const unsubscribers = observers.map((observer) => observer.subscribe(() => {}));

  try {
    await invalidateDeletedSpaceQueries(client, "space1");

    expect(fetchDeleted).not.toHaveBeenCalled();
    expect(fetchCompany).toHaveBeenCalledTimes(1);
    [...details, ...lists, otherMap].forEach((key) => expect(client.getQueryState(key)?.isInvalidated).toBe(true));
    untouched.forEach((key) => expect(client.getQueryState(key)?.isInvalidated).toBe(false));
  } finally {
    unsubscribers.forEach((unsubscribe) => unsubscribe());
    client.clear();
  }
});
