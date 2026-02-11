import { ActivityContentCompanyMemberConvertedToGuest } from "@/api";
import { feedTitle, personLink } from "../feedItemLinks";

import type { Activity } from "@/models/activities";
import type { ActivityHandler } from "../interfaces";

const CompanyMemberConvertedToGuest: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, _activity: Activity) {
    return paths.homePath();
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
    const { person } = content(activity);

    if (person) {
      return feedTitle(activity, "converted", personLink(person), "to an outside collaborator");
    } else {
      return feedTitle(activity, "converted a team member to an outside collaborator");
    }
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
    return "Converted your account to an outside collaborator";
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).company?.name ?? null;
  },
};

function content(activity: Activity): ActivityContentCompanyMemberConvertedToGuest {
  return activity.content as ActivityContentCompanyMemberConvertedToGuest;
}

export default CompanyMemberConvertedToGuest;
