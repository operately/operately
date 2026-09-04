import Api from "@/api";
import { QueryClient } from "@tanstack/react-query";
import { invalidateSpaceTaskQueries } from "./spaceTaskLifecycle";

describe("space task lifecycle queries", () => {
  beforeAll(() => {
    Api.default.setBasePath("/api/v2");
    Api.default.setHeaders({ "x-company-id": "company-1" });
  });

  it("invalidates space detail and task list queries", async () => {
    const queryClient = createQueryClient();
    const spaceKey = Api.spaces.getQueryKey({ id: "space-1", includePermissions: true });
    const spaceTasksKey = Api.spaces.listTasksQueryKey({ spaceId: "space-1" });
    const unrelatedKey = Api.spaces.listQueryKey({ includePermissions: true });

    [spaceKey, spaceTasksKey, unrelatedKey].forEach((queryKey) => queryClient.setQueryData(queryKey, {}));

    await invalidateSpaceTaskQueries(queryClient);

    expect(queryClient.getQueryState(spaceKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(spaceTasksKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(unrelatedKey)?.isInvalidated).toBe(false);
  });
});

function createQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}
