import AdminApi from "@/ee/admin_api";
import { QueryClient } from "@tanstack/react-query";
import { invalidateCompanyQueries } from "./featureFlagsLifecycle";

describe("company feature flag lifecycle queries", () => {
  beforeAll(() => {
    AdminApi.default.setBasePath("/admin/api/v1");
  });

  it("invalidates company queries and leaves unrelated queries clean", async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const companyKey = AdminApi.getCompanyQueryKey({ id: "company-1" });
    const otherCompanyKey = AdminApi.getCompanyQueryKey({ id: "company-2" });
    const accountsKey = AdminApi.getAccountsQueryKey({});

    [companyKey, otherCompanyKey, accountsKey].forEach((queryKey) => {
      queryClient.setQueryData(queryKey, {});
    });

    await invalidateCompanyQueries(queryClient);

    expect(queryClient.getQueryState(companyKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(otherCompanyKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(accountsKey)?.isInvalidated).toBe(false);
  });
});
