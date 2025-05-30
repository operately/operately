import { getWorkMap, convertToWorkMapItem } from "@/models/workMap";
import { Space, getSpace } from "@/models/spaces";
import { Paths } from "@/routes/paths";
import { redirectIfFeatureNotEnabled } from "@/routes/redirectIfFeatureEnabled";
import { PageCache } from "@/routes/PageCache";

interface LoaderResult {
  workMap: ReturnType<typeof convertToWorkMapItem>[];
  space: Space;
}

export async function loader({ params, refreshCache = false }): Promise<LoaderResult> {
  await redirectIfFeatureNotEnabled(params, {
    feature: "space_work_map",
    path: Paths.spaceGoalsPath(params.id),
  });

  const [workMap, space] = await PageCache.fetch({
    cacheKey: `v1-SpaceWorkMap.space-${params.id}`,
    refreshCache,
    fetchFn: () =>
      Promise.all([
        getWorkMap({ spaceId: params.id }).then((data) => (data.workMap ? data.workMap.map(convertToWorkMapItem) : [])),
        getSpace({ id: params.id }),
      ]),
  });

  return { workMap, space };
}

export function useLoadedData(): LoaderResult {
  return PageCache.useData(loader);
}
