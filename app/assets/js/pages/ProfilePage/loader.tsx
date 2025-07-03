import * as People from "@/models/people";
import * as WorkMap from "@/models/workMap";
import { convertToWorkMapItem } from "@/models/workMap";

import { PageCache } from "@/routes/PageCache";
import { Paths } from "@/routes/paths";
import { fetchAll } from "@/utils/async";

interface LoaderResult {
  data: {
    person: People.PersonWithLink;
    workMap: ReturnType<typeof convertToWorkMapItem>[];
    reviewerWorkMap: ReturnType<typeof convertToWorkMapItem>[];
  };
  cacheVersion: number;
}

export async function loader({ params, refreshCache = false }): Promise<LoaderResult> {
  const personId = params.id;
  const paths = new Paths({ companyId: params.companyId! });

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
        }).then((d) => d.workMap?.map((i) => convertToWorkMapItem(paths, i)) ?? []),
        reviewerWorkMap: WorkMap.getFlatWorkMap({
          reviewerId: personId,
        }).then((d) => d.workMap?.map((i) => convertToWorkMapItem(paths, i)) ?? []),
      }),
  });
}

export function useLoadedData() {
  return PageCache.useData(loader).data;
}
