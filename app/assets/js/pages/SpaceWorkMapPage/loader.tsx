import { getSpace, Space } from "@/models/spaces";
import { getWorkMap, WorkMapItem } from "@/models/workMap";
import { PageCache } from "@/routes/PageCache";
import { fetchAll } from "@/utils/async";
import { Company, getCompany } from "../../api";

interface LoaderResult {
  data: {
    workMap: WorkMapItem[];
    space: Space;
    company: Company;
  };
  cacheVersion: number;
}

export async function loader({ params, refreshCache = false }): Promise<LoaderResult> {
  return PageCache.fetch({
    cacheKey: `v6-SpaceWorkMap.space-${params.id}`,
    refreshCache,
    fetchFn: () =>
      fetchAll({
        workMap: getWorkMap({ spaceId: params.id }).then((d) => d.workMap),
        space: getSpace({ id: params.id, includeAccessLevels: true }),
        company: getCompany({ id: params.companyId }).then((d) => d.company!),
      }),
  });
}

export function useLoadedData(): LoaderResult {
  return PageCache.useData(loader);
}
