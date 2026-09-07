import Api from "@/api";
import { QueryClient } from "@tanstack/react-query";
import { invalidateKpiQueries } from "./kpiLifecycle";

describe("KPI lifecycle queries", () => {
  beforeAll(() => {
    Api.default.setBasePath("/api/v2");
    Api.default.setHeaders({ "x-company-id": "company-1" });
  });

  it("invalidates KPI detail and list queries", async () => {
    const queryClient = createQueryClient();
    const getKpiKey = Api.kpis.getKpiQueryKey({ kpiId: "kpi-1" });
    const listKpisKey = Api.kpis.listKpisQueryKey({ spaceId: "space-1" });
    const spacesKey = Api.spaces.getQueryKey({ id: "space-1" });

    [getKpiKey, listKpisKey, spacesKey].forEach((queryKey) => {
      queryClient.setQueryData(queryKey, {});
    });

    await invalidateKpiQueries(queryClient);

    expect(queryClient.getQueryState(getKpiKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(listKpisKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(spacesKey)?.isInvalidated).toBe(false);
  });
});

function createQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}
