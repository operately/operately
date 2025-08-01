import { Activity, ActivityContentSpaceJoining } from "@/api";

import { feedTitle, spaceLink } from "../feedItemLinks";
import { ActivityHandler } from "../interfaces";

const SpaceJoining: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, activity: Activity): string {
    return paths.spacePath(content(activity).space!.id!);
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

  FeedItemTitle({ activity, page }: { activity: Activity; page: any }) {
    if (page === "space") {
      return feedTitle(activity, "joined the space");
    } else {
      return feedTitle(activity, "joined the", spaceLink(content(activity).space!), "space");
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
    throw new Error("Not implemented");
  },

  NotificationLocation(_props: { activity: Activity }) {
    throw new Error("Not implemented");
  },
};

export default SpaceJoining;

function content(activity: Activity): ActivityContentSpaceJoining {
  return activity.content as ActivityContentSpaceJoining;
}
