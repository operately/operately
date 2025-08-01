import * as People from "@/models/people";
import * as WorkMap from "@/models/workMap";

import { PageCache } from "@/routes/PageCache";
import { fetchAll } from "@/utils/async";

interface LoaderResult {
  data: {
    person: People.PersonWithLink;
    workMap: WorkMap.WorkMapItem[];
    reviewerWorkMap: WorkMap.WorkMapItem[];
  };
  cacheVersion: number;
}

export async function loader({ params, refreshCache = false }): Promise<LoaderResult> {
  const personId = params.id;

  return PageCache.fetch({
    cacheKey: `v3-PersonalWorkMap-${personId}`,
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
        }).then((d) => d.workMap),
        reviewerWorkMap: WorkMap.getFlatWorkMap({
          reviewerId: personId,
        }).then((d) => d.workMap),
      }),
  });
}

export function useLoadedData() {
  return PageCache.useData(loader).data;
}
