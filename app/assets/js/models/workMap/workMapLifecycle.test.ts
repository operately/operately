import Api from "@/api";
import { QueryClient } from "@tanstack/react-query";
import { invalidateWorkMapQueries } from ".";

describe("Work Map lifecycle queries", () => {
  beforeAll(() => {
    Api.default.setBasePath("/api/v2");
    Api.default.setHeaders({ "x-company-id": "company-1" });
  });

  it("invalidates every Work Map scope", async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const companyKey = Api.companies.getWorkMapQueryKey({});
    const spaceKey = Api.companies.getWorkMapQueryKey({ spaceId: "space-1" });
    const unrelatedKey = Api.companies.getQueryKey({ includeGeneralSpace: true });

    [companyKey, spaceKey, unrelatedKey].forEach((queryKey) => queryClient.setQueryData(queryKey, {}));

    await invalidateWorkMapQueries(queryClient);

    expect(queryClient.getQueryState(companyKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(spaceKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(unrelatedKey)?.isInvalidated).toBe(false);
  });
});
