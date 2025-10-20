import React from "react";

import * as People from "@/models/people";

import { Feed, useItemsQuery } from "@/features/Feed";
import { PageModule } from "@/routes/types";
import { assertPresent } from "@/utils/assertions";
import { ProfilePage } from "turboui";

import { loader, useLoadedData } from "./loader";

import { usePaths } from "@/routes/paths";
import { convertToWorkMapItems } from "../../models/workMap";
import { useMe } from "@/contexts/CurrentCompanyContext";

export default { name: "ProfilePage", loader, Page } as PageModule;

function Page() {
  const paths = usePaths();
  const me = useMe();
  const { person, workMap, reviewerWorkMap } = useLoadedData();

  assertPresent(person.peers);
  assertPresent(person.reports);
  assertPresent(person.permissions);

  const parsedPerson = People.parsePersonForTurboUi(paths, person);
  const viewer = People.parsePersonForTurboUi(paths, me) || null;
  const manager = People.parsePersonForTurboUi(paths, person.manager);

  assertPresent(parsedPerson, "parsedPerson is undefined");

  const props = {
    title: [person.fullName, "Profile"],

    viewer,
    person: parsedPerson,
    peers: People.parsePeopleForTurboUi(paths, People.sortByName(person.peers)),
    reports: People.parsePeopleForTurboUi(paths, People.sortByName(person.reports)),
    manager,

    workMap: convertToWorkMapItems(paths, workMap),
    reviewerWorkMap: convertToWorkMapItems(paths, reviewerWorkMap),

    canEditProfile: !!person.permissions.canEditProfile,
    editProfilePath: paths.profileEditPath(person.id),

    activityFeed: <ActivityFeed personId={person.id} />,
  };

  return <ProfilePage {...props} />;
}

function ActivityFeed({ personId }: { personId: string }) {
  const { data, loading, error } = useItemsQuery("person", personId);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error</div>;

  return <Feed items={data!.activities!} testId="profile-feed" page="profile" />;
}
