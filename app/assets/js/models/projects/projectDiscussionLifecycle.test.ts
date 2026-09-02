import Api from "@/api";
import { QueryClient } from "@tanstack/react-query";
import { invalidateProjectDiscussionQueries } from "./projectDiscussionLifecycle";

describe("project discussion lifecycle queries", () => {
  beforeAll(() => {
    Api.default.setBasePath("/api/v2");
    Api.default.setHeaders({ "x-company-id": "company-1" });
  });

  it("invalidates discussion detail, discussion list, and project detail queries", async () => {
    const queryClient = createQueryClient();
    const discussionKey = Api.projects.getDiscussionQueryKey({ id: "discussion-1" });
    const listDiscussionsKey = Api.projects.listDiscussionsQueryKey({ projectId: "project-1" });
    const projectKey = Api.projects.getQueryKey({ id: "project-1" });
    const listProjectsKey = Api.projects.listQueryKey({});

    [discussionKey, listDiscussionsKey, projectKey, listProjectsKey].forEach((queryKey) => {
      queryClient.setQueryData(queryKey, {});
    });

    await invalidateProjectDiscussionQueries(queryClient);

    expect(queryClient.getQueryState(discussionKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(listDiscussionsKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(projectKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(listProjectsKey)?.isInvalidated).toBe(false);
  });
});

function createQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}
