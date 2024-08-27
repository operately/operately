import { Activity, ActivityContentSpaceMembersAdded } from "@/api";
import { ActivityHandler } from "../interfaces";
import { feedTitle, spaceLink } from "../feedItemLinks";
import { Paths } from "@/routes/paths";
import { firstName, namesListToString } from "@/models/people";

const SpaceMembersAdded: ActivityHandler = {
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
    const names = namesListToString(content(activity).members!);
    const space = spaceLink(content(activity).space!);

    if (page === "space") {
      return feedTitle(activity, "added", names, "to the space");
    } else {
      return feedTitle(activity, "added", names, "to the", space, "space");
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

  NotificationTitle({ activity }: { activity: Activity }) {
    return firstName(activity.author!) + " added you to the " + content(activity).space?.name + " space";
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).space!.name!;
  },
};

export default SpaceMembersAdded;

function content(activity: Activity): ActivityContentSpaceMembersAdded {
  return activity.content as ActivityContentSpaceMembersAdded;
}
