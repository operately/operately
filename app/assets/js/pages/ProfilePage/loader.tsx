import * as People from "@/models/people";
import * as WorkMap from "@/models/workMap";

import { PageCache } from "@/routes/PageCache";
import { fetchAll } from "@/utils/async";

interface LoaderResult {
  data: {
    person: People.Person;
    workMap: WorkMap.WorkMapItem[];
    reviewerWorkMap: WorkMap.WorkMapItem[];
  };
  cacheVersion: number;
}

const fetchPersonWithFallback = async (personId: string) => {
  try {
    const person = await People.getPerson({
      id: personId,
      includeManager: true,
      includeReports: true,
      includePeers: true,
      includePermissions: true,
    });
    return person.person;
  } catch (error) {
    if (error.status === 404) {
      const me = await People.getMe({ includeManager: true }).then((result) => result.me);

      if (me && me.id === personId) {
        return me;
      } else {
        throw error;
      }
    }

    throw error;
  }
};

export async function loader({ params, refreshCache = false }): Promise<LoaderResult> {
  const personId = params.id;

  return PageCache.fetch({
    cacheKey: `v4-PersonalWorkMap-${personId}`,
    refreshCache,
    fetchFn: async () =>
      fetchAll({
        person: fetchPersonWithFallback(personId),
        workMap: WorkMap.getFlatWorkMap({
          championId: personId,
          contributorId: personId,
          includeReviewer: true,
          includeTasks: true,
        }).then((d) => d.workMap),
        reviewerWorkMap: WorkMap.getFlatWorkMap({
          reviewerId: personId,
          includeReviewer: true,
        }).then((d) => d.workMap),
      }),
  });
}

export function useLoadedData() {
  return PageCache.useData(loader).data;
}
