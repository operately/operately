import { firstName, namesListToString } from "@/models/people";
import { feedTitle } from "../feedItemLinks";

import type { Activity } from "@/models/activities";
import type { ActivityContentCompanyOwnersAdding } from "@/api";
import type { ActivityHandler } from "../interfaces";

const CompanyOwnersAdding: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(_activity: Activity) {
    throw new Error("Not implemented");
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
    const names = namesListToString(content(activity).owners!);

    return feedTitle(activity, "promoted", names, "to company owners");
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
    return firstName(activity.author!) + " promoted you to company owner";
  },

  NotificationLocation(_props: { activity: Activity }) {
    return null;
  },
};

function content(activity: Activity): ActivityContentCompanyOwnersAdding {
  return activity.content as ActivityContentCompanyOwnersAdding;
}

export default CompanyOwnersAdding;
