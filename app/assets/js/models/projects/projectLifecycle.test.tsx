/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import * as Lifecycle from "./projectLifecycle";
import Api from "@/api";
import { QueryClient, QueryObserver } from "@tanstack/react-query";
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
    {
      name: "UpdateProjectPermissions",
      hook: () => Lifecycle.useUpdateProjectPermissions(),
      options: "updatePermissionsMutationOptions",
      input: { projectId: "project-1", accessLevels: {} },
      result: { success: true },
      extra: ["task", "taskList", "children", "milestone", "boundPeople"],
    },
    {
      name: "MoveProjectToSpace",
      hook: () => Lifecycle.useMoveProjectToSpace(),
      options: "moveToSpaceMutationOptions",
      input: { projectId: "project-1", spaceId: "space-2" },
      result: { success: true },
      extra: ["task", "taskList", "children", "milestone", "boundPeople"],
    },
    {
      name: "UpdateProjectChampion",
      hook: () => Lifecycle.useUpdateProjectChampion(),
      options: "updateChampionMutationOptions",
      input: { projectId: "project-1", championId: "person-1" },
      result: { success: true },
      extra: ["task", "taskList", "children", "milestone", "boundPeople"],
    },
    {
      name: "UpdateProjectReviewer",
      hook: () => Lifecycle.useUpdateProjectReviewer(),
      options: "updateReviewerMutationOptions",
      input: { projectId: "project-1", reviewerId: null },
      result: { success: true },
      extra: ["task", "taskList", "children", "milestone", "boundPeople"],
    },
    {
      name: "UpdateProjectTasksView",
      hook: () => Lifecycle.useUpdateProjectTasksView(),
      options: "updateTasksViewMutationOptions",
      input: { projectId: "project-1", tasksView: "board" },
      result: { success: true },
      extra: ["task", "taskList", "children", "milestone", "boundPeople"],
    },
    {
      name: "CreateProjectMilestone",
      hook: () => Lifecycle.useCreateProjectMilestone(),
      options: "createMilestoneMutationOptions",
      input: { projectId: "project-1", name: "Milestone", dueDate: null },
      result: { success: true },
      extra: ["task", "taskList", "children", "milestone", "boundPeople"],
    },
    {
      name: "UpdateProjectMilestone",
      hook: () => Lifecycle.useUpdateProjectMilestone(),
      options: "updateMilestoneMutationOptions",
      input: { projectId: "project-1", milestoneId: "milestone-1", name: "Updated" },
      result: { success: true },
      extra: ["task", "taskList", "children", "milestone", "boundPeople"],
    },
    {
      name: "UpdateProjectMilestoneOrdering",
      hook: () => Lifecycle.useUpdateProjectMilestoneOrdering(),
      options: "updateMilestoneOrderingMutationOptions",
      input: { projectId: "project-1", orderingState: [] },
      result: { success: true },
      extra: ["task", "taskList", "children", "milestone", "boundPeople"],
    },
    {
      name: "CreateProjectContributor",
      hook: () => Lifecycle.useCreateProjectContributor(),
      options: "createContributorMutationOptions",
      input: { projectId: "project-1", personId: "person-1" },
      result: { success: true },
      extra: ["task", "taskList", "children", "milestone", "boundPeople"],
    },
    {
      name: "UpdateProjectContributor",
      hook: () => Lifecycle.useUpdateProjectContributor(),
      options: "updateContributorMutationOptions",
      input: { contribId: "contributor-1", responsibility: "Owner" },
      result: { success: true },
      extra: ["task", "taskList", "children", "milestone", "boundPeople"],
    },
    {
      name: "DeleteProjectContributor",
      hook: () => Lifecycle.useDeleteProjectContributor(),
      options: "deleteContributorMutationOptions",
      input: { contribId: "contributor-1" },
      result: { success: true },
      extra: ["task", "taskList", "children", "milestone", "boundPeople"],
    },
    {
      name: "UpdateProjectTaskStatuses",
      hook: () => Lifecycle.useUpdateProjectTaskStatuses(),
      options: "updateTaskStatusesMutationOptions",
      input: { projectId: "project-1", taskStatuses: [] },
      result: { success: true },
      extra: ["task", "taskList", "children", "milestone", "unrelated", "milestoneTasks", "space", "spaceTasks"],
    },
    {
      name: "UpdateProjectKanban",
      hook: () => Lifecycle.useUpdateProjectKanban(),
      options: "updateKanbanMutationOptions",
      input: { projectId: "project-1", taskId: "task-1", status: {}, kanbanState: "{}" },
      result: { project: {}, task: {} },
      extra: ["task", "taskList", "children", "milestone", "unrelated", "milestoneTasks", "space", "spaceTasks"],
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
      taskList: Api.tasks.listQueryKey({ projectId: "project-1" }),
      children: Api.projects.countChildrenQueryKey({ id: "project-1" }),
      milestone: Api.projects.getMilestoneQueryKey({ id: "milestone-1" }),
      milestoneTasks: Api.projects.listMilestoneTasksQueryKey({ milestoneId: "milestone-1" }),
      space: Api.spaces.getQueryKey({ id: "space-1" }),
      spaceTasks: Api.spaces.listTasksQueryKey({ spaceId: "space-1" }),
      boundPeople: Api.people.getBindedQueryKey({ resourseType: "project", resourseId: "project-1" }),
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

  it.each(["active", "none"] as const)(
    "rename supports %s refetching without duplicate requests",
    async (refetchType) => {
      const testCase = { ...cases[0], hook: () => Lifecycle.useUpdateProjectName(refetchType) };
      const mutate = await mount(testCase, jest.fn().mockResolvedValue(testCase.result));
      const keys = seed();
      const request = jest.fn().mockResolvedValue({});
      const refreshedKeys = [keys.detail, keys.task, keys.feed];
      const unsubscribe = refreshedKeys.map((queryKey) => {
        const observer = new QueryObserver(client, { queryKey, queryFn: request, staleTime: Infinity });
        return observer.subscribe(() => {});
      });
      try {
        await act(async () => {
          await mutate();
        });
        expect(request).toHaveBeenCalledTimes(refetchType === "active" ? refreshedKeys.length : 0);
        if (refetchType === "none") {
          refreshedKeys.forEach((key) => expect(client.getQueryState(key)?.isInvalidated).toBe(true));
          // Task and Milestone pages explicitly refresh their own queries after saving.
          await act(async () => {
            await Promise.all(refreshedKeys.map((queryKey) => client.invalidateQueries({ queryKey })));
          });
          expect(request).toHaveBeenCalledTimes(refreshedKeys.length);
        }
        expect(client.getQueryState(keys.list)?.isInvalidated).toBe(true);
        expect(client.getQueryState(keys.unrelated)?.isInvalidated).toBe(false);
      } finally {
        unsubscribe.forEach((stop) => stop());
      }
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
