import type { ActivityContentCompanyOwnerRemoving } from "@/api";
import type { Activity } from "@/models/activities";

import type { ActivityHandler } from "../interfaces";

import { firstName } from "@/models/people";
import { feedTitle } from "../feedItemLinks";

const CompanyOwnerRemoving: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, _activity: Activity) {
    return paths.companyAdminPath();
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

  FeedItemTitle({ activity }: { activity: Activity; page: any }) {
    const name = firstName(content(activity).person!);

    return feedTitle(activity, `removed ${name} as an account owner`);
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
    return firstName(activity.author!) + " has revoked your account owner status";
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).company!.name!;
  },
};

function content(activity: Activity): ActivityContentCompanyOwnerRemoving {
  return activity.content as ActivityContentCompanyOwnerRemoving;
}

export default CompanyOwnerRemoving;
