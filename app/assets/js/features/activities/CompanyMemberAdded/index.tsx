import { feedTitle, personLink } from "../feedItemLinks";

import type { ActivityContentCompanyMemberAdded } from "@/api";
import type { Activity } from "@/models/activities";

import type { ActivityHandler } from "../interfaces";

const CompanyMemberAdded: ActivityHandler = {
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

  FeedItemTitle({ activity }: { activity: Activity; page: any }) {
    const { person, name } = content(activity);

    if (person) {
      return feedTitle(activity, "added", personLink(person), "as a company member");
    } else {
      return feedTitle(activity, "added", name, "as a company member");
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
    return "Added you as a company member";
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).company?.name ?? null;
  },
};

export default CompanyMemberAdded;

function content(activity: Activity): ActivityContentCompanyMemberAdded {
  return activity.content as ActivityContentCompanyMemberAdded;
}
