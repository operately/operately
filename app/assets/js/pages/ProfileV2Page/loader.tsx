import * as People from "@/models/people";
import * as WorkMap from "@/models/workMap";
import { convertToWorkMapItem } from "@/models/workMap";

import { ProfilePage } from "turboui";
import { PageCache } from "@/routes/PageCache";
import { Paths } from "@/routes/paths";
import { redirectIfFeatureNotEnabled } from "@/routes/redirectIfFeatureEnabled";
import { fetchAll } from "@/utils/async";

interface LoaderResult {
  data: {
    person: People.PersonWithLink;
    workMap: ReturnType<typeof convertToWorkMapItem>[];
  };
  cacheVersion: number;
}

export async function loader({ params, request, refreshCache = false }): Promise<LoaderResult> {
  await redirectIfFeatureNotEnabled(params, {
    feature: "new_profile_page",
    path: Paths.profilePath(params.id),
  });

  const url = new URL(request.url);
  const searchParams = url.searchParams;
  const tab = searchParams.get("tab") as ProfilePage.TabOptions;

  if (!tab) return fetchAssignedTab(params.id, refreshCache);

  switch (tab) {
    case "assigned":
      return fetchAssignedTab(params.id, refreshCache);

    case "reviewing":
      return fetchRaviewingTab(params.id, refreshCache);

    default:
      return fetchAboutTab(params.id, refreshCache);
  }
}

export function useLoadedData() {
  const wrappedLoader = (attrs: { params: any; request?: Request; refreshCache?: boolean }): Promise<LoaderResult> => {
    if (!attrs.request) {
      const mockRequest = { url: window.location.href } as Request;
      return loader({ ...attrs, request: mockRequest });
    }

    return loader({ ...attrs, request: attrs.request });
  };

  return PageCache.useData(wrappedLoader).data;
}

function fetchAboutTab(personId: string, refreshCache: boolean) {
  return PageCache.fetch({
    cacheKey: `v1-PersonalWorkMap.aboutTab-${personId}`,
    refreshCache,
    fetchFn: async () =>
      fetchAll({
        person: fetchPerson(personId),
        workMap: Promise.resolve([]),
      }),
  });
}

function fetchAssignedTab(championId: string, refreshCache: boolean) {
  return PageCache.fetch({
    cacheKey: `v1-PersonalWorkMap.assignedTab-${championId}`,
    refreshCache,
    fetchFn: async () =>
      fetchAll({
        person: fetchPerson(championId),
        workMap: WorkMap.getWorkMap({
          championId,
          contributorId: championId,
        }).then((d) => d.workMap?.map(convertToWorkMapItem) ?? []),
      }),
  });
}

function fetchRaviewingTab(reviewerId: string, refreshCache: boolean) {
  return PageCache.fetch({
    cacheKey: `v1-PersonalWorkMap.reviewingTab-${reviewerId}`,
    refreshCache,
    fetchFn: async () =>
      fetchAll({
        person: fetchPerson(reviewerId),
        workMap: WorkMap.getWorkMap({
          reviewerId,
        }).then((d) => d.workMap?.map(convertToWorkMapItem) ?? []),
      }),
  });
}

function fetchPerson(personId: string) {
  return People.getPerson({
    id: personId,
    includeManager: true,
    includeReports: true,
    includePeers: true,
  }).then((data) => data.person!);
}
