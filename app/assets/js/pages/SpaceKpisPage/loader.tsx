import * as Pages from "@/components/Pages";
import * as Spaces from "@/models/spaces";
import { listKpis } from "@/models/kpis";
import { Kpi } from "@/api";

interface LoadedData {
  space: Spaces.Space;
  kpis: Kpi[];
}

export async function loader({ params }): Promise<LoadedData> {
  const [space, kpis] = await Promise.all([
    Spaces.getSpace({ id: params.id, includePermissions: true }),
    listKpis({ spaceId: params.id }).then((d) => d.kpis),
  ]);

  return { space, kpis };
}

export function useLoadedData(): LoadedData {
  return Pages.useLoadedData() as LoadedData;
}

export function useRefresh() {
  return Pages.useRefresh();
}
