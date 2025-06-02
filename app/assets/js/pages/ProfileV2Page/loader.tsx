import * as People from "@/models/people";
import * as WorkMap from "@/models/workMap";
import { convertToWorkMapItem } from "@/models/workMap";

import { ProfilePage } from "turboui";
import { PageCache } from "@/routes/PageCache";
import { Paths } from "@/routes/paths";
import { redirectIfFeatureNotEnabled } from "@/routes/redirectIfFeatureEnabled";

interface LoaderResult {
  person: People.PersonWithLink;
  workMap: ReturnType<typeof convertToWorkMapItem>[];
}

export async function loader({ params, request, refreshCache = false }): Promise<LoaderResult> {
  await redirectIfFeatureNotEnabled(params, {
    feature: "new_profile_page",
    path: Paths.profilePath(params.id),
  });

  const url = new URL(request.url);
  const searchParams = url.searchParams;
  const tab = searchParams.get("tab") as ProfilePage.TabOptions;

  switch (tab) {
    case "assigned":
      const [champion, championWorkMap] = await Promise.all([
        fetchPerson(params.id, refreshCache),
        fetchChampionWorkMap(params.id, refreshCache),
      ]);
      return { person: champion, workMap: championWorkMap };

    case "reviewing":
      const [reviewer, reviewerWorkMap] = await Promise.all([
        fetchPerson(params.id, refreshCache),
        fetchReviewerWorkMap(params.id, refreshCache),
      ]);
      return { person: reviewer, workMap: reviewerWorkMap };

    default:
      const person = await fetchPerson(params.id, refreshCache);
      return { person, workMap: [] };
  }
}

export function useLoadedData(): LoaderResult {
  const wrappedLoader = (attrs: { params: any; request?: Request; refreshCache?: boolean }): Promise<LoaderResult> => {
    if (!attrs.request) {
      const mockRequest = { url: window.location.href } as Request;
      return loader({ ...attrs, request: mockRequest });
    }

    return loader({ ...attrs, request: attrs.request });
  };

  return PageCache.useData(wrappedLoader);
}

async function fetchPerson(personId: string, refreshCache: boolean): Promise<People.PersonWithLink> {
  return await PageCache.fetch({
    cacheKey: `v1-PersonalWorkMap.person-${personId}`,
    refreshCache,
    fetchFn: async () => {
      return await People.getPerson({
        id: personId,
        includeManager: true,
        includeReports: true,
        includePeers: true,
      }).then((data) => data.person!);
    },
  });
}

async function fetchChampionWorkMap(
  championId: string,
  refreshCache: boolean,
): Promise<ReturnType<typeof convertToWorkMapItem>[]> {
  return await PageCache.fetch({
    cacheKey: `v1-PersonalWorkMap.championWorkMap-${championId}`,
    refreshCache,
    fetchFn: async () => {
      const workMapData = await WorkMap.getWorkMap({
        championId,
        contributorId: championId,
      });

      return workMapData.workMap ? workMapData.workMap.map(convertToWorkMapItem) : [];
    },
  });
}

async function fetchReviewerWorkMap(
  reviewerId: string,
  refreshCache: boolean,
): Promise<ReturnType<typeof convertToWorkMapItem>[]> {
  return await PageCache.fetch({
    cacheKey: `v1-PersonalWorkMap.reviewerWorkMap-${reviewerId}`,
    refreshCache,
    fetchFn: async () => {
      const workMapData = await WorkMap.getWorkMap({ reviewerId });

      return workMapData.workMap ? workMapData.workMap.map(convertToWorkMapItem) : [];
    },
  });
}
