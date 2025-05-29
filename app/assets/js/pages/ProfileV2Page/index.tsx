import React from "react";

import * as Pages from "@/components/Pages";
import * as People from "@/models/people";
import { toPersonWithLink } from "@/models/people";

import { PageModule } from "@/routes/types";
import { PageCache } from "@/routes/PageCache";
import { ProfilePage } from "turboui";
import { Feed, useItemsQuery } from "@/features/Feed";
import { assertPresent } from "@/utils/assertions";
import { Paths } from "@/routes/paths";
import { redirectIfFeatureNotEnabled } from "@/routes/redirectIfFeatureEnabled";

interface LoaderResult {
  person: People.PersonWithLink;
}

export default { name: "ProfileV2Page", loader, Page } as PageModule;

async function loader({ params, refreshCache = false }): Promise<LoaderResult> {
  await redirectIfFeatureNotEnabled(params, {
    feature: "new_profile_page",
    path: Paths.profilePath(params.id),
  });

  return await PageCache.fetch({
    cacheKey: `v1-PersonalWorkMap.person-${params.id}`,
    refreshCache,
    fetchFn: async () => {
      const [person] = await Promise.all([
        People.getPerson({
          id: params.id,
          includeManager: true,
          includeReports: true,
          includePeers: true,
        }).then((data) => data.person!),
      ]);

      return { person };
    },
  });
}

function Page() {
  const { person } = Pages.useLoadedData<LoaderResult>();

  assertPresent(person.peers);
  assertPresent(person.reports);
 
  const props = {
    title: [person.fullName!, "Profile"],

    person: toPersonWithLink(person, true),
    peers: toPersonWithLink(People.sortByName(person.peers), true),
    reports: toPersonWithLink(People.sortByName(person.reports), true),
    manager: person.manager ? toPersonWithLink(person.manager, true) : null,

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
