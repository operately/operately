import { feedTitle } from "../feedItemLinks";

import type { ActivityContentCompanyEditing } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler } from "../interfaces";

const CompanyEditing: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(_paths, _activity: Activity) {
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

  FeedItemTitle({ activity }: { activity: Activity }) {
    return feedTitle(activity, "renamed the company to", content(activity).newName!);
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

function content(activity: Activity): ActivityContentCompanyEditing {
  return activity.content as ActivityContentCompanyEditing;
}

export default CompanyEditing;
