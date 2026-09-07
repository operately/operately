import Api, { Kpi, Space } from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";
import { useQueryClient } from "@tanstack/react-query";

const DISABLED_KPI_INPUT = { kpiId: "" };

export async function loader({ params }) {
  const spaceInput = { id: params.id, includePermissions: true };
  const listInput = { spaceId: params.id };
  const kpiInput = params.kpiId ? { kpiId: params.kpiId } : null;

  await Promise.all([
    Api.spaces.getQuery(spaceInput),
    Api.kpis.listKpisQuery(listInput),
    kpiInput ? Api.kpis.getKpiQuery(kpiInput) : Promise.resolve(),
  ]);

  return { spaceInput, listInput, kpiInput };
}

type LoaderResult = Awaited<ReturnType<typeof loader>>;

export function useLoadedData(): { space: Space; kpis: Kpi[]; kpi: Kpi | null } {
  const { spaceInput, listInput, kpiInput } = Pages.useLoadedData<LoaderResult>();
  const { data: spaceData } = useLoadedQuery(Api.spaces.getQueryOptions(spaceInput));
  const { data: kpisData } = useLoadedQuery(Api.kpis.listKpisQueryOptions(listInput));
  const { data: kpiData } = useLoadedQuery({
    ...Api.kpis.getKpiQueryOptions(kpiInput ?? DISABLED_KPI_INPUT),
    enabled: kpiInput != null,
  });

  if (!spaceData?.space || !kpisData) {
    throw new Error(`KPI data is unavailable for space "${spaceInput.id}"`);
  }

  return {
    space: spaceData.space,
    kpis: kpisData.kpis,
    kpi: kpiInput ? (kpiData?.kpi ?? null) : null,
  };
}

export function useRefresh(): () => Promise<void> {
  const queryClient = useQueryClient();
  const { spaceInput, listInput, kpiInput } = Pages.useLoadedData<LoaderResult>();

  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: Api.spaces.getQueryKey(spaceInput) }),
      queryClient.invalidateQueries({ queryKey: Api.kpis.listKpisQueryKey(listInput) }),
      kpiInput ? queryClient.invalidateQueries({ queryKey: Api.kpis.getKpiQueryKey(kpiInput) }) : Promise.resolve(),
    ]);
  };
}
