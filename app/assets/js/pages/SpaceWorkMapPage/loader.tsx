import { Space, getSpace } from "@/models/spaces";
import { convertToWorkMapItem, getWorkMap } from "@/models/workMap";
import { PageCache } from "@/routes/PageCache";
import { Paths } from "@/routes/paths";
import { fetchAll } from "@/utils/async";

interface LoaderResult {
  data: {
    workMap: ReturnType<typeof convertToWorkMapItem>[];
    space: Space;
  };
  cacheVersion: number;
}

export async function loader({ params, refreshCache = false }): Promise<LoaderResult> {
  const paths = new Paths({ companyId: params.companyId! });

  return PageCache.fetch({
    cacheKey: `v3-SpaceWorkMap.space-${params.id}`,
    refreshCache,
    fetchFn: () =>
      fetchAll({
        workMap: getWorkMap({ spaceId: params.id }).then(
          (d) => d.workMap?.map((i) => convertToWorkMapItem(paths, i)) ?? [],
        ),
        space: getSpace({ id: params.id }),
      }),
  });
}

export function useLoadedData(): LoaderResult {
  return PageCache.useData(loader);
}
