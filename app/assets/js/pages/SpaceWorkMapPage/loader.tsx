import { Space, getSpace } from "@/models/spaces";
import { convertToWorkMapItem, getWorkMap } from "@/models/workMap";
import { PageCache } from "@/routes/PageCache";
import { Paths } from "@/routes/paths";
import { redirectIfFeatureNotEnabled } from "@/routes/redirectIfFeatureEnabled";

interface LoaderResult {
  data: {
    workMap: ReturnType<typeof convertToWorkMapItem>[];
    space: Space;
  };
  cacheVersion: number;
}

export async function loader({ params, refreshCache = false }): Promise<LoaderResult> {
  await redirectIfFeatureNotEnabled(params, {
    feature: "space_work_map",
    path: Paths.spaceGoalsPath(params.id),
  });

  const { data, cacheVersion } = await PageCache.fetch({
    cacheKey: `v1-SpaceWorkMap.space-${params.id}`,
    refreshCache,
    fetchFn: () =>
      Promise.all([
        getWorkMap({ spaceId: params.id }).then((data) => (data.workMap ? data.workMap.map(convertToWorkMapItem) : [])),
        getSpace({ id: params.id }),
      ]),
  });

  return { data, cacheVersion };
}

export function useLoadedData(): LoaderResult {
  return PageCache.useData(loader);
}
