import * as People from "@/models/people";
import { feedTitle } from "../feedItemLinks";

import type { Activity } from "@/models/activities";
import type { ActivityContentCompanyMemberRestoring } from "@/api";
import type { ActivityHandler } from "../interfaces";
import { Paths } from "@/routes/paths";

const CompanyMemberRestoring: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(_activity: Activity) {
    return Paths.homePath();
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
    const name = People.firstName(content(activity).person!) + "'s";

    return feedTitle(activity, "restored", name, "account");
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

  NotificationTitle({ activity }: { activity: Activity }) {
    return People.firstName(activity.author!) + " has restored your account";
  },

  NotificationLocation(_props: { activity: Activity }) {
    return null;
  },
};

function content(activity: Activity): ActivityContentCompanyMemberRestoring {
  return activity.content as ActivityContentCompanyMemberRestoring;
}

export default CompanyMemberRestoring;
