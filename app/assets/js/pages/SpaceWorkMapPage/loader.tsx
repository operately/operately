import { getSpace, Space } from "@/models/spaces";
import { getWorkMap, WorkMapItem } from "@/models/workMap";
import { PageCache } from "@/routes/PageCache";
import { fetchAll } from "@/utils/async";

interface LoaderResult {
  data: {
    workMap: WorkMapItem[];
    space: Space;
  };
  cacheVersion: number;
}

export async function loader({ params, refreshCache = false }): Promise<LoaderResult> {
  return PageCache.fetch({
    cacheKey: `v3-SpaceWorkMap.space-${params.id}`,
    refreshCache,
    fetchFn: () =>
      fetchAll({
        workMap: getWorkMap({ spaceId: params.id }).then((d) => d.workMap),
        space: getSpace({ id: params.id }),
      }),
  });
}

export function useLoadedData(): LoaderResult {
  return PageCache.useData(loader);
}
