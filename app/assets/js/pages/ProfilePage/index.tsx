import React from "react";

import * as People from "@/models/people";
import { toPersonWithLink } from "@/models/people";

import { Feed, useItemsQuery } from "@/features/Feed";
import { PageModule } from "@/routes/types";
import { assertPresent } from "@/utils/assertions";
import { ProfilePage, IconPencil } from "turboui";

import { loader, useLoadedData } from "./loader";

import { usePaths } from "@/routes/paths";
export default { name: "ProfilePage", loader, Page } as PageModule;

function Page() {
  const paths = usePaths();
  const { person, workMap, reviewerWorkMap } = useLoadedData();

  assertPresent(person.peers);
  assertPresent(person.reports);
  assertPresent(person.permissions);

  const props = {
    title: [person.fullName!, "Profile"],

    person: toPersonWithLink(paths, person),
    peers: toPersonWithLink(paths, People.sortByName(person.peers)),
    reports: toPersonWithLink(paths, People.sortByName(person.reports)),
    manager: person.manager ? toPersonWithLink(paths, person.manager) : null,

    workMap: workMap,
    reviewerWorkMap: reviewerWorkMap,
    options: [
      {
        type: "link" as const,
        icon: IconPencil,
        label: "Edit",
        link: paths.profileEditPath(person.id!),
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
