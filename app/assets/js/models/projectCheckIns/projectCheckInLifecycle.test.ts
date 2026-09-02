import Api from "@/api";
import { QueryClient } from "@tanstack/react-query";
import { invalidateProjectCheckInQueries } from "./projectCheckInLifecycle";

describe("project check-in lifecycle queries", () => {
  beforeAll(() => {
    Api.default.setBasePath("/api/v2");
    Api.default.setHeaders({ "x-company-id": "company-1" });
  });

  it("invalidates check-in detail, check-in list, and project detail queries", async () => {
    const queryClient = createQueryClient();
    const checkInKey = Api.projects.getCheckInQueryKey({ id: "check-in-1" });
    const listCheckInsKey = Api.projects.listCheckInsQueryKey({ projectId: "project-1" });
    const projectKey = Api.projects.getQueryKey({ id: "project-1" });
    const listProjectsKey = Api.projects.listQueryKey({});

    [checkInKey, listCheckInsKey, projectKey, listProjectsKey].forEach((queryKey) => {
      queryClient.setQueryData(queryKey, {});
    });

    await invalidateProjectCheckInQueries(queryClient);

    expect(queryClient.getQueryState(checkInKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(listCheckInsKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(projectKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(listProjectsKey)?.isInvalidated).toBe(false);
  });
});

function createQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}
