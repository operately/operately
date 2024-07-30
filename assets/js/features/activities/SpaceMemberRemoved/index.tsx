import { Activity, ActivityContentSpaceMemberRemoved } from "@/api";
import { ActivityHandler } from "../interfaces";
import { feedTitle, spaceLink } from "../feedItemLinks";
import { Paths } from "@/routes/paths";
import { shortName } from "@/models/people";


const SpaceMemberRemoved: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(activity: Activity): string {
    return Paths.spacePath(content(activity).space!.id!);
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
    const person = shortName(content(activity).member!);
    const space = spaceLink(content(activity).space!);
    
    if (page === "space") {
      return feedTitle(activity, "removed", person, "from the space");
    } else {
      return feedTitle(activity, "removed", person, "from the", space, "space");
    }
  },

  FeedItemContent(_props: { activity: Activity; page: any }) {
    return null;
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

export default SpaceMemberRemoved;

function content(activity: Activity): ActivityContentSpaceMemberRemoved {
  return activity.content as ActivityContentSpaceMemberRemoved;
}
