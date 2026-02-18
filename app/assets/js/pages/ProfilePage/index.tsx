import React from "react";

import * as People from "@/models/people";

import { Feed, useItemsQuery } from "@/features/Feed";
import { PageModule } from "@/routes/types";
import { assertPresentOr404 } from "@/utils/assertions";
import { ProfilePage } from "turboui";

import { loader, useLoadedData } from "./loader";

import { compareIds, usePaths } from "@/routes/paths";
import { convertToWorkMapItems } from "../../models/workMap";
import { useMe, useMentionedPersonLookupFn } from "@/contexts/CurrentCompanyContext";

export default { name: "ProfilePage", loader, Page } as PageModule;

function Page() {
  const paths = usePaths();
  const me = useMe();
  const mentionedPersonLookup = useMentionedPersonLookupFn();
  const { person, workMap, reviewerWorkMap } = useLoadedData();

  const parsedPerson = People.parsePersonForTurboUi(paths, person);
  const viewer = People.parsePersonForTurboUi(paths, me) || null;
  const manager = People.parsePersonForTurboUi(paths, person.manager);

  assertPresentOr404(parsedPerson);

  const props = {
    title: [person.fullName, "Profile"],

    viewer,
    person: parsedPerson,
    peers: People.parsePeopleForTurboUi(paths, People.sortByName(person.peers || [])),
    reports: People.parsePeopleForTurboUi(paths, People.sortByName(person.reports || [])),
    manager,

    workMap: convertToWorkMapItems(paths, workMap),
    reviewerWorkMap: convertToWorkMapItems(paths, reviewerWorkMap),

    canEditProfile: canEditProfile(person, me),
    editProfilePath: paths.profileEditPath(person.id),

    activityFeed: <ActivityFeed personId={person.id} />,
    aboutMe: person.description,
    mentionedPersonLookup,
  };

  return <ProfilePage {...props} />;
}

function ActivityFeed({ personId }: { personId: string }) {
  const { data, loading, error } = useItemsQuery("person", personId);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error</div>;

  return <Feed items={data?.activities || []} testId="profile-feed" page="profile" />;
}

function canEditProfile(person: People.Person, me?: People.Person | null) {
  return !!person.permissions?.canEditProfile || compareIds(me?.id, person.id);
}
