import { Space, getSpace } from "@/models/spaces";
import { convertToWorkMapItem, getWorkMap } from "@/models/workMap";
import { PageCache } from "@/routes/PageCache";
import { Paths } from "@/routes/paths";
import { redirectIfFeatureNotEnabled } from "@/routes/redirectIfFeatureEnabled";
import { fetchAll } from "../../utils/async";

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

  return PageCache.fetch({
    cacheKey: `v2-SpaceWorkMap.space-${params.id}`,
    refreshCache,
    fetchFn: () =>
      fetchAll({
        workMap: getWorkMap({ spaceId: params.id }).then((data) =>
          data.workMap ? data.workMap.map(convertToWorkMapItem) : [],
        ),
        space: getSpace({ id: params.id }),
      }),
  });
}

export function useLoadedData(): LoaderResult {
  return PageCache.useData(loader);
}
