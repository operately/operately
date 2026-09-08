/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import * as Lifecycle from "./projectLifecycle";
import Api from "@/api";
import { QueryClient } from "@tanstack/react-query";
import {
  invalidateClosedProjectQueries,
  invalidateProjectLifecycleQueries,
  invalidateProjectRetrospectiveQueries,
} from "./projectLifecycle";

jest.mock("turboui", () => ({}));

describe("project lifecycle queries", () => {
  beforeAll(() => {
    Api.default.setBasePath("/api/v2");
    Api.default.setHeaders({ "x-company-id": "company-1" });
  });

  it("invalidates project detail, list, and search queries after a lifecycle change", async () => {
    const queryClient = createQueryClient();
    const lifecycleKeys = seedProjectQueries(queryClient);

    await invalidateProjectLifecycleQueries(queryClient);

    lifecycleKeys.forEach((queryKey) => {
      expect(queryClient.getQueryState(queryKey)?.isInvalidated).toBe(true);
    });

    expect(queryClient.getQueryState(unrelatedProjectQueryKey())?.isInvalidated).toBe(false);
  });

  it("also invalidates retrospective queries after closing a project", async () => {
    const queryClient = createQueryClient();
    const lifecycleKeys = seedProjectQueries(queryClient);
    const retrospectiveKey = Api.projects.getRetrospectiveQueryKey({ projectId: "project-1" });
    queryClient.setQueryData(retrospectiveKey, { retrospective: { id: "retrospective-1" } });

    await invalidateClosedProjectQueries(queryClient);

    [...lifecycleKeys, retrospectiveKey].forEach((queryKey) => {
      expect(queryClient.getQueryState(queryKey)?.isInvalidated).toBe(true);
    });
  });

  it("invalidates project detail and retrospective queries after editing a retrospective", async () => {
    const queryClient = createQueryClient();
    const projectKey = Api.projects.getQueryKey({ id: "project-1" });
    const retrospectiveKey = Api.projects.getRetrospectiveQueryKey({ projectId: "project-1" });
    const listKey = Api.projects.listQueryKey({});

    [projectKey, retrospectiveKey, listKey].forEach((queryKey) => queryClient.setQueryData(queryKey, {}));

    await invalidateProjectRetrospectiveQueries(queryClient);

    expect(queryClient.getQueryState(projectKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(retrospectiveKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(listKey)?.isInvalidated).toBe(false);
  });
});

function createQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function seedProjectQueries(queryClient: QueryClient) {
  const queryKeys = [
    Api.projects.getQueryKey({ id: "project-1", includeSpace: true }),
    Api.projects.listQueryKey({ includeSpace: true }),
    Api.projects.searchQueryKey({ query: "project", activeOnly: true }),
  ];

  queryKeys.forEach((queryKey) => queryClient.setQueryData(queryKey, {}));
  queryClient.setQueryData(unrelatedProjectQueryKey(), {});

  return queryKeys;
}

function unrelatedProjectQueryKey() {
  return Api.projects.listMilestonesQueryKey({ projectId: "project-1" });
}

describe("project detail mutations", () => {
  let root: Root;
  let client: QueryClient;
  const cases = [
    {
      name: "name",
      hook: () => Lifecycle.useUpdateProjectName(),
      options: "updateNameMutationOptions",
      input: { projectId: "project-1", name: "New name" },
      result: { project: { id: "project-1" } },
      extra: ["task"],
    },
    {
      name: "description",
      hook: () => Lifecycle.useUpdateProjectDescription(),
      options: "updateDescriptionMutationOptions",
      input: { projectId: "project-1", description: "{}" },
      result: { project: { id: "project-1" } },
      extra: [],
    },
    {
      name: "start date",
      hook: () => Lifecycle.useUpdateProjectStartDate(),
      options: "updateStartDateMutationOptions",
      input: { projectId: "project-1", startDate: null },
      result: { success: true },
      extra: [],
    },
    {
      name: "due date",
      hook: () => Lifecycle.useUpdateProjectDueDate(),
      options: "updateDueDateMutationOptions",
      input: { projectId: "project-1", dueDate: null },
      result: { success: true },
      extra: [],
    },
    {
      name: "parent goal",
      hook: () => Lifecycle.useUpdateProjectParentGoal(),
      options: "updateParentGoalMutationOptions",
      input: { projectId: "project-1", goalId: null },
      result: { success: true },
      extra: ["goal"],
    },
    {
      name: "deletion",
      hook: () => Lifecycle.useDeleteProject(),
      options: "deleteMutationOptions",
      input: { projectId: "project-1" },
      result: { project: { id: "project-1" } },
      extra: ["goal"],
    },
  ] as const;

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    client = createQueryClient();
    root = createRoot(document.createElement("div"));
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    client.clear();
    jest.restoreAllMocks();
  });

  async function mount(testCase: (typeof cases)[number], request: jest.Mock) {
    jest.spyOn(Api.projects, testCase.options).mockReturnValue({ mutationFn: request });
    let mutate!: (input: any) => Promise<unknown>;
    function Harness() {
      mutate = testCase.hook().mutateAsync;
      return null;
    }
    await act(async () =>
      root.render(
        <QueryClientProvider client={client}>
          <Harness />
        </QueryClientProvider>,
      ),
    );
    return () => mutate(testCase.input);
  }

  function seed() {
    const keys = {
      detail: Api.projects.getQueryKey({ id: "project-1" }),
      detailWithSpace: Api.projects.getQueryKey({ id: "project-1", includeSpace: true }),
      list: Api.projects.listQueryKey({}),
      search: Api.projects.searchQueryKey({ query: "project" }),
      feed: Api.companies.listActivitiesQueryKey({ scopeType: "project", scopeId: "project-1", actions: [] }),
      task: Api.tasks.getQueryKey({ id: "task-1" }),
      goal: Api.goals.getQueryKey({ id: "goal-1" }),
      otherGoal: Api.goals.getQueryKey({ id: "goal-2" }),
      unrelated: Api.comments.listQueryKey({ entityId: "task-1", entityType: "project_task" }),
    };
    Object.values(keys).forEach((key) => client.setQueryData(key, {}));
    return keys;
  }

  it.each(cases)("$name invalidates affected caches", async (testCase) => {
    const request = jest.fn().mockResolvedValue(testCase.result);
    const mutate = await mount(testCase, request);
    const keys = seed();
    await act(async () => {
      await mutate();
    });
    expect(request).toHaveBeenCalledWith(testCase.input, expect.anything());
    const affected: string[] = ["detail", "detailWithSpace", "list", "search", "feed", ...testCase.extra];
    if (affected.includes("goal")) affected.push("otherGoal");
    Object.entries(keys).forEach(([name, key]) =>
      expect(client.getQueryState(key)?.isInvalidated).toBe(affected.includes(name)),
    );
  });

  it.each(cases)("$name leaves caches intact on request failure", async (testCase) => {
    const mutate = await mount(testCase, jest.fn().mockRejectedValue(new Error("Save failed")));
    const keys = seed();
    await act(async () => {
      await expect(mutate()).rejects.toThrow("Save failed");
    });
    Object.values(keys).forEach((key) => expect(client.getQueryState(key)?.isInvalidated).toBe(false));
  });

  it.each(cases.filter((testCase) => "success" in testCase.result))(
    "$name leaves caches intact on explicit failure",
    async (testCase) => {
      const mutate = await mount(testCase, jest.fn().mockResolvedValue({ success: false }));
      const keys = seed();
      await act(async () => {
        expect(await mutate()).toEqual({ success: false });
      });
      Object.values(keys).forEach((key) => expect(client.getQueryState(key)?.isInvalidated).toBe(false));
    },
  );

  it("does not reject a saved mutation when refreshing caches fails", async () => {
    const testCase = cases[0];
    const mutate = await mount(testCase, jest.fn().mockResolvedValue(testCase.result));
    jest.spyOn(client, "invalidateQueries").mockRejectedValue(new Error("Refresh failed"));
    const log = jest.spyOn(console, "error").mockImplementation(() => {});
    await act(async () => {
      expect(await mutate()).toEqual(testCase.result);
    });
    expect(log).toHaveBeenCalled();
  });
});
