import * as People from "@/models/people";
import * as WorkMap from "@/models/workMap";
import { convertToWorkMapItem } from "@/models/workMap";

import { PageCache } from "@/routes/PageCache";
import { redirectIfFeatureNotEnabled } from "@/routes/redirectIfFeatureEnabled";
import { fetchAll } from "@/utils/async";

import { usePaths } from "@/routes/paths";
interface LoaderResult {
  data: {
    person: People.PersonWithLink;
    workMap: ReturnType<typeof convertToWorkMapItem>[];
    reviewerWorkMap: ReturnType<typeof convertToWorkMapItem>[];
  };
  cacheVersion: number;
}

export async function loader({ params, refreshCache = false }): Promise<LoaderResult> {
  await redirectIfFeatureNotEnabled(params, {
    feature: "new_profile_page",
    path: paths.profilePath(params.id),
  });

  return fetchData(params.id, refreshCache);
}

export function useLoadedData() {
  return PageCache.useData(loader).data;
}

function fetchData(personId: string, refreshCache: boolean) {
  return PageCache.fetch({
    cacheKey: `v2-PersonalWorkMap-${personId}`,
    refreshCache,
    fetchFn: async () =>
      fetchAll({
        person: People.getPerson({
          id: personId,
          includeManager: true,
          includeReports: true,
          includePeers: true,
          includePermissions: true,
        }).then((data) => data.person!),
        workMap: WorkMap.getFlatWorkMap({
          championId: personId,
          contributorId: personId,
        }).then((d) => d.workMap?.map(convertToWorkMapItem) ?? []),
        reviewerWorkMap: WorkMap.getFlatWorkMap({
          reviewerId: personId,
        }).then((d) => d.workMap?.map(convertToWorkMapItem) ?? []),
      }),
  });
}
