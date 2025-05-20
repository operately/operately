import * as Pages from "@/components/Pages";

import { convertToWorkMapItem, getWorkMap } from "@/models/workMap";
import { PageCache } from "@/routes/PageCache";
import { Paths } from "@/routes/paths";
import { redirectIfFeatureNotEnabled } from "@/routes/redirectIfFeatureEnabled";

interface LoaderResult {
  workMap: ReturnType<typeof convertToWorkMapItem>[];
}

export async function loader({ params, refreshCache = false }): Promise<LoaderResult> {
  await redirectIfFeatureNotEnabled(params, {
    feature: "work_map_page",
    path: Paths.homePath(),
  });

  return await PageCache.fetch({
    cacheKey: `v6-CompanyWorkMap.goal-${params.id}`,
    maxAgeMs: 1000 * 60 * 5,
    refreshCache,
    fetchFn: () =>
      getWorkMap({}).then((data) => ({
        workMap: data.workMap ? data.workMap.map(convertToWorkMapItem) : [],
      })),
  });
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
