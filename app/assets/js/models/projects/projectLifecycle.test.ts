import Api from "@/api";
import { QueryClient } from "@tanstack/react-query";
import {
  invalidateClosedProjectQueries,
  invalidateProjectLifecycleQueries,
  invalidateProjectRetrospectiveQueries,
} from "./projectLifecycle";

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
