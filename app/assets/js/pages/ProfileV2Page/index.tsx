import React from "react";

import * as Pages from "@/components/Pages";
import * as People from "@/models/people";
import * as WorkMap from "@/models/workMap";
import { convertToWorkMapItem } from "@/models/workMap";
import { toPersonWithLink } from "@/models/people";

import { Feed, useItemsQuery } from "@/features/Feed";
import { PageCache } from "@/routes/PageCache";
import { Paths } from "@/routes/paths";
import { redirectIfFeatureNotEnabled } from "@/routes/redirectIfFeatureEnabled";
import { PageModule } from "@/routes/types";
import { assertPresent } from "@/utils/assertions";
import { ProfilePage } from "turboui";

interface LoaderResult {
  person: People.PersonWithLink;
  workMap: ReturnType<typeof convertToWorkMapItem>[];
}

export default { name: "ProfileV2Page", loader, Page } as PageModule;

async function loader({ params, refreshCache = false }): Promise<LoaderResult> {
  await redirectIfFeatureNotEnabled(params, {
    feature: "new_profile_page",
    path: Paths.profilePath(params.id),
  });

  return await PageCache.fetch({
    cacheKey: `v2-PersonalWorkMap.person-${params.id}`,
    refreshCache,
    fetchFn: async () => {
      const [person, workMapData] = await Promise.all([
        People.getPerson({
          id: params.id,
          includeManager: true,
          includeReports: true,
          includePeers: true,
        }).then((data) => data.person!),
        WorkMap.getWorkMap({
          championId: params.id,
          contributorId: params.id,
        }),
      ]);

      return {
        person,
        workMap: workMapData.workMap ? workMapData.workMap.map(convertToWorkMapItem) : [],
      };
    },
  });
}

function Page() {
  const { person, workMap } = Pages.useLoadedData<LoaderResult>();

  assertPresent(person.peers);
  assertPresent(person.reports);

  const props = {
    title: [person.fullName!, "Profile"],

    person: toPersonWithLink(person, true),
    peers: toPersonWithLink(People.sortByName(person.peers), true),
    reports: toPersonWithLink(People.sortByName(person.reports), true),
    manager: person.manager ? toPersonWithLink(person.manager, true) : null,

    workMap: workMap,

    activityFeed: <ActivityFeed personId={person.id!} />,
  };

  return <ProfilePage {...props} />;
}

function ActivityFeed({ personId }: { personId: string }) {
  const { data, loading, error } = useItemsQuery("person", personId);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error</div>;

  return <Feed items={data!.activities!} testId="profile-feed" page="profile" />;
}
