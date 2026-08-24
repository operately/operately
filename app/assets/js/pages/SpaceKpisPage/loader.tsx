import * as Pages from "@/components/Pages";
import * as Spaces from "@/models/spaces";
import { getKpi, listKpis } from "@/models/kpis";
import { Kpi } from "@/api";

interface LoadedData {
  space: Spaces.Space;
  kpis: Kpi[];

  // The KPI addressed by the route (/spaces/:id/kpis/:kpiId), loaded with its
  // entries for the chart. Null on the list route.
  kpi: Kpi | null;
}

export async function loader({ params }): Promise<LoadedData> {
  const [space, kpis, kpi] = await Promise.all([
    Spaces.getSpace({ id: params.id, includePermissions: true }),
    listKpis({ spaceId: params.id }).then((d) => d.kpis),
    params.kpiId ? getKpi({ kpiId: params.kpiId }).then((d) => d.kpi) : null,
  ]);

  return { space, kpis, kpi };
}

export function useLoadedData(): LoadedData {
  return Pages.useLoadedData() as LoadedData;
}

export function useRefresh() {
  return Pages.useRefresh();
}
