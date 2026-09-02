import Api from "@/api";
import { QueryClient } from "@tanstack/react-query";
import { invalidateMeQueries } from "./productReleaseLifecycle";

describe("product release lifecycle queries", () => {
  beforeAll(() => {
    Api.default.setBasePath("/api/v2");
    Api.default.setHeaders({ "x-company-id": "company-1" });
  });

  it("invalidates getMe queries and leaves unrelated people queries intact", async () => {
    const queryClient = createQueryClient();
    const getMeKey = Api.people.getMeQueryKey({ includeManager: true });
    const getPersonKey = Api.people.getQueryKey({ id: "person-1" });

    [getMeKey, getPersonKey].forEach((queryKey) => {
      queryClient.setQueryData(queryKey, {});
    });

    await invalidateMeQueries(queryClient);

    expect(queryClient.getQueryState(getMeKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(getPersonKey)?.isInvalidated).toBe(false);
  });
});

function createQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}
