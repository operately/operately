import type { ActivityContentCompanyMemberJoined } from "@/api";
import type { Activity } from "@/models/activities";
import { firstName } from "@/models/people";
import { usePaths } from "@/routes/paths";
import * as React from "react";
import { Link } from "turboui";

import type { ActivityHandler } from "../interfaces";
import { feedTitle } from "../feedItemLinks";

const CompanyMemberJoined: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, _activity: Activity) {
    return paths.peoplePath();
  },

  PageTitle(_props: { activity: any }) {
    throw new Error("Not implemented");
  },

  PageContent(_props: { activity: Activity }) {
    throw new Error("Not implemented");
  },

  PageOptions(_props: { activity: Activity }) {
    return null;
  },

  FeedItemTitle({ activity }: { activity: Activity }) {
    const { company, person } = content(activity);

    if (!person) {
      return feedTitle(activity, "joined", company.name);
    }

    return (
      <>
        <PersonFirstNameLink person={person} /> joined {company.name}
      </>
    );
  },

  FeedItemContent(_props: { activity: Activity; page: any }) {
    return null;
  },

  feedItemAlignment(_activity: Activity): "items-start" | "items-center" {
    return "items-center";
  },

  commentCount(_activity: Activity): number {
    throw new Error("Not implemented");
  },

  hasComments(_activity: Activity): boolean {
    throw new Error("Not implemented");
  },

  NotificationTitle(_props: { activity: Activity }) {
    throw new Error("Not implemented");
  },

  NotificationLocation(_props: { activity: Activity }) {
    return null;
  },
};

export default CompanyMemberJoined;

function content(activity: Activity): ActivityContentCompanyMemberJoined {
  return activity.content as ActivityContentCompanyMemberJoined;
}

function PersonFirstNameLink({ person }: { person: NonNullable<ActivityContentCompanyMemberJoined["person"]> }) {
  const paths = usePaths();

  return <Link to={paths.profilePath(person.id)}>{firstName(person)}</Link>;
}
