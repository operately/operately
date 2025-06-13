import React from "react";

import * as People from "@/models/people";
import { toPersonWithLink } from "@/models/people";

import { Feed, useItemsQuery } from "@/features/Feed";
import { PageModule } from "@/routes/types";
import { assertPresent } from "@/utils/assertions";
import { ProfilePage } from "turboui";

import { DeprecatedPaths } from "@/routes/paths";
import { IconPencil } from "@tabler/icons-react";
import { loader, useLoadedData } from "./loader";

export default { name: "ProfileV2Page", loader, Page } as PageModule;

function Page() {
  const { person, workMap, reviewerWorkMap } = useLoadedData();

  assertPresent(person.peers);
  assertPresent(person.reports);
  assertPresent(person.permissions);

  const props = {
    title: [person.fullName!, "Profile"],

    person: toPersonWithLink(person),
    peers: toPersonWithLink(People.sortByName(person.peers)),
    reports: toPersonWithLink(People.sortByName(person.reports)),
    manager: person.manager ? toPersonWithLink(person.manager) : null,

    workMap: workMap,
    reviewerWorkMap: reviewerWorkMap,
    options: [
      {
        type: "link" as const,
        icon: IconPencil,
        label: "Edit",
        link: DeprecatedPaths.profileEditPath(person.id!),
        hidden: !person.permissions.canEditProfile,
      },
    ],

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
